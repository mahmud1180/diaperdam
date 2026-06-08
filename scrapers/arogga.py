"""Arogga scraper for DiaperDam.

Arogga (arogga.com) is a Bangladeshi pharmacy/grocery delivery app.
It's a React SPA backed by a REST API.

API discovery strategy (in order):
  1. GET /api/v1/products?q=diaper&category=baby-care        (most likely)
  2. GET /api/search?q=diaper&limit=50                        (search API)
  3. GET /api/v1/search?q=diaper&per_page=50
  4. GET /api/v2/products?q=diaper&category=baby
  5. Fetch /search?q=diaper HTML and look for preloaded state

Product JSON shape Arogga typically uses:
  id / product_id  → external_id
  name / product_name → product name
  tp / special_price / price → BDT selling price ("tp" = trade price)
  mrp / regular_price       → original price
  thumbnail / image / product_image → image URL
  slug / url_slug           → product URL suffix
  pack_size / quantity      → pack count fallback

Note: Arogga uses "tp" (trade price) as the selling price in their API
responses — this is the price the customer pays.
"""
import asyncio
import json
import logging
import re
import sys

import httpx

from base import BaseScraper, ScrapedDiaper

logger = logging.getLogger(__name__)

AROGGA_BASE = "https://arogga.com"

# Ordered list of API endpoints to try
API_ENDPOINTS = [
    "/api/v1/products?q=diaper&category=baby-care&per_page=50",
    "/api/v1/products?q=diaper&per_page=50",
    "/api/search?q=diaper&limit=50",
    "/api/v1/search?q=diaper&per_page=50",
    "/api/v2/products?q=diaper&category=baby&per_page=50",
    "/api/v1/products?search=diaper&category=baby-care&limit=50",
]

SEARCH_QUERIES_API = [
    "diaper",
    "huggies diaper",
    "mamypoko diaper",
    "molfix diaper",
]

# HTML search pages as last resort
HTML_PATHS = [
    "/search?q=diaper",
    "/products?q=diaper&category=baby",
]

BRAND_SLUG_MAP = {
    "huggies":     "huggies",
    "mamypoko":    "mamypoko",
    "mamy poko":   "mamypoko",
    "molfix":      "molfix",
    "pampers":     "pampers",
    "neocare":     "neocare",
    "neo care":    "neocare",
    "bashundhara": "bashundhara",
    "diapant":     "bashundhara",
    "avonee":      "avonee",
    "supermom":    "supermom",
    "smc smile":   "smc-smile",
    "smile":       "smc-smile",
    "aiwibi":      "aiwibi",
    "savlon":      "savlon",
    "twinkle":     "savlon",
    "happy nappy": "happy-nappy",
    "mumlove":     "mumlove",
    "kidz":        "kidz",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://arogga.com/",
    "Origin": "https://arogga.com",
}

HTML_HEADERS = {
    **HEADERS,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def _extract_brand(name: str) -> tuple[str, str]:
    name_lower = name.lower()
    for keyword, slug in BRAND_SLUG_MAP.items():
        if keyword in name_lower:
            display_map = {
                "mamypoko": "MamyPoko",
                "huggies": "Huggies",
                "molfix": "Molfix",
                "pampers": "Pampers",
                "neocare": "Neocare",
                "bashundhara": "Bashundhara",
                "savlon": "Savlon",
                "smc-smile": "SMC Smile",
                "happy-nappy": "Happy Nappy",
            }
            display = display_map.get(slug, keyword.title())
            return display, slug
    first = name.split()[0]
    return first, first.lower().replace(" ", "-")


def _extract_type(name: str) -> str:
    n = name.lower()
    if "pant" in n:
        return "pants"
    if "swim" in n:
        return "swim"
    return "belt"


def _extract_size(name: str) -> str | None:
    n = name.lower()
    if "new born" in n or "newborn" in n or "nb" in n:
        return "Newborn"
    m = re.search(r"\b(xxl|xl|large|medium|small)\b", n)
    if m:
        s = m.group(1).upper()
        return {"LARGE": "L", "MEDIUM": "M", "SMALL": "S"}.get(s, s)
    return None


def _extract_pack_qty(name: str) -> int | None:
    for pattern in [
        r"(\d+)\s*pcs",
        r"(\d+)\s*count",
        r"(\d+)\s*ct\b",
        r"(\d+)\s*pieces",
        r"pack\s+of\s+(\d+)",
        r"(\d+)\s*diapers?\b",
    ]:
        m = re.search(pattern, name.lower())
        if m:
            return int(m.group(1))
    return None


def _extract_weights(name: str) -> tuple[float | None, float | None]:
    m = re.search(r"(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*kg", name.lower())
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r"up\s+to\s+(\d+(?:\.\d+)?)\s*kg", name.lower())
    if m:
        return None, float(m.group(1))
    m = re.search(r"(\d+(?:\.\d+)?)\+\s*kg", name.lower())
    if m:
        return float(m.group(1)), None
    return None, None


def _clean_price(raw) -> float | None:
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        v = float(raw)
        return v if v > 0 else None
    s = re.sub(r"[^\d.]", "", str(raw))
    if not s:
        return None
    try:
        v = float(s)
        return v if v > 0 else None
    except ValueError:
        return None


def _unwrap_api_response(payload: dict | list) -> list[dict]:
    """Navigate common API response envelopes to find the product list."""
    if isinstance(payload, list):
        return payload
    if not isinstance(payload, dict):
        return []

    # Arogga often wraps in {"success": true, "data": {"products": [...]}}
    # or {"data": [...]} or {"products": [...]}
    for key in ("data", "results", "products", "items", "hits", "records"):
        val = payload.get(key)
        if isinstance(val, list) and val:
            return val
        if isinstance(val, dict):
            for sub in ("products", "items", "data", "records"):
                sub_val = val.get(sub)
                if isinstance(sub_val, list) and sub_val:
                    return sub_val

    return []


def _extract_products_from_html(html: str) -> list[dict]:
    """Try to extract product data from React SPA HTML."""
    # __NEXT_DATA__ (if they ever switch to Next.js)
    m = re.search(
        r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL
    )
    if m:
        try:
            data = json.loads(m.group(1))
            props = data.get("props", {}).get("pageProps", {})
            for key in ("products", "items", "data", "results"):
                val = props.get(key)
                if isinstance(val, list) and val:
                    return val
        except (json.JSONDecodeError, AttributeError):
            pass

    # window.__INITIAL_STATE__ / window.__REDUX_STATE__
    for var in ("__INITIAL_STATE__", "__REDUX_STATE__", "__APP_INITIAL_STATE__"):
        m = re.search(rf"window\.{var}\s*=\s*(\{{.*?\}})\s*;", html, re.DOTALL)
        if m:
            try:
                state = json.loads(m.group(1))
                for path in [
                    ["products", "list"],
                    ["product", "products"],
                    ["search", "products"],
                    ["search", "results"],
                    ["catalog", "products"],
                ]:
                    node = state
                    for key in path:
                        node = node.get(key, {}) if isinstance(node, dict) else {}
                    if isinstance(node, list) and node:
                        return node
            except (json.JSONDecodeError, AttributeError):
                pass

    return []


class AroggaScraper(BaseScraper):
    store_slug = "arogga"
    store_name = "Arogga"

    async def _discover_api_endpoint(
        self, client: httpx.AsyncClient
    ) -> tuple[str | None, list[dict]]:
        """Try each API endpoint until one returns a product list.
        Returns (working_base_endpoint, initial_products)."""
        for endpoint in API_ENDPOINTS:
            url = f"{AROGGA_BASE}{endpoint}"
            try:
                r = await client.get(url, headers=HEADERS, timeout=20)
                # Accept 200 and 422 (Arogga sometimes returns 422 with data)
                if r.status_code not in (200, 201):
                    continue
                ct = r.headers.get("content-type", "")
                if "json" not in ct:
                    continue
                payload = r.json()
                products = _unwrap_api_response(payload)
                if products:
                    logger.info(
                        f"[arogga] API endpoint works: {endpoint} ({len(products)} products)"
                    )
                    return endpoint, products
            except Exception as e:
                logger.warning(f"[arogga] Endpoint {endpoint} failed: {e}")
            await self.rate_limit(1.0)
        return None, []

    async def _fetch_api(
        self,
        client: httpx.AsyncClient,
        base_endpoint: str,
        query: str,
    ) -> list[dict]:
        """Fetch a specific query against a known working endpoint."""
        # Replace the q= param in base_endpoint
        endpoint = re.sub(r"q=[^&]*", f"q={query.replace(' ', '+')}", base_endpoint)
        url = f"{AROGGA_BASE}{endpoint}"
        try:
            r = await client.get(url, headers=HEADERS, timeout=20)
            if r.status_code not in (200, 201):
                return []
            ct = r.headers.get("content-type", "")
            if "json" not in ct:
                return []
            return _unwrap_api_response(r.json())
        except Exception as e:
            logger.warning(f"[arogga] Query '{query}' failed: {e}")
            return []

    async def _fetch_html_fallback(self, client: httpx.AsyncClient) -> list[dict]:
        """Last resort: fetch HTML pages and look for embedded state."""
        products: list[dict] = []
        for path in HTML_PATHS:
            url = f"{AROGGA_BASE}{path}"
            try:
                r = await client.get(url, headers=HTML_HEADERS, timeout=25)
                r.raise_for_status()
                found = _extract_products_from_html(r.text)
                products.extend(found)
                if found:
                    logger.info(f"[arogga] HTML fallback found {len(found)} products at {path}")
            except Exception as e:
                logger.warning(f"[arogga] HTML fallback failed for {path}: {e}")
            await self.rate_limit(1.5)
        return products

    def _parse_product(self, prod: dict) -> ScrapedDiaper | None:
        try:
            name = (
                prod.get("name")
                or prod.get("product_name")
                or prod.get("productName")
                or prod.get("title")
                or ""
            ).strip()
            if not name:
                return None

            name_lower = name.lower()
            if not any(
                kw in name_lower
                for kw in ["diaper", "nappy", "nappies"] + list(BRAND_SLUG_MAP.keys())
            ):
                return None

            ext_id = str(
                prod.get("id")
                or prod.get("product_id")
                or prod.get("productId")
                or prod.get("sku")
                or ""
            )
            if not ext_id:
                return None

            # Arogga uses "tp" (trade price) as selling price
            price = _clean_price(
                prod.get("tp")
                or prod.get("special_price")
                or prod.get("sale_price")
                or prod.get("price")
                or prod.get("selling_price")
            )
            if price is None:
                return None

            original_price = _clean_price(
                prod.get("mrp")
                or prod.get("regular_price")
                or prod.get("original_price")
                or prod.get("list_price")
            )
            if original_price and original_price <= price:
                original_price = None

            pack_qty = _extract_pack_qty(name)
            if not pack_qty:
                # Arogga sometimes has pack_size or quantity field
                pack_qty_raw = prod.get("pack_size") or prod.get("quantity") or prod.get("packSize")
                if pack_qty_raw:
                    try:
                        pack_qty = int(pack_qty_raw)
                    except (ValueError, TypeError):
                        pass
            if not pack_qty or pack_qty <= 0:
                return None

            brand, brand_slug = _extract_brand(name)
            diaper_type = _extract_type(name)
            size_label = _extract_size(name)
            w_min, w_max = _extract_weights(name)

            # Image
            image_url = (
                prod.get("thumbnail")
                or prod.get("product_image")
                or prod.get("image")
                or prod.get("imageUrl")
                or prod.get("image_url")
                or prod.get("photo")
            )
            if isinstance(image_url, list) and image_url:
                image_url = image_url[0]

            # URL
            slug = prod.get("slug") or prod.get("url_slug") or prod.get("urlSlug")
            if slug:
                product_url = f"{AROGGA_BASE}/product/{slug.lstrip('/')}"
            else:
                product_url = f"{AROGGA_BASE}/product/{ext_id}"

            is_promo = bool(original_price and original_price > price)
            discount_pct = None
            if is_promo and original_price:
                discount_pct = round((1 - price / original_price) * 100, 1)

            return ScrapedDiaper(
                external_id=ext_id,
                brand=brand,
                brand_slug=brand_slug,
                line=None,
                type=diaper_type,
                size_label=size_label,
                weight_min_kg=w_min,
                weight_max_kg=w_max,
                pack_qty=pack_qty,
                image_url=image_url,
                product_url=product_url,
                price_bdt=price,
                original_price_bdt=original_price,
                discount_pct=discount_pct,
                is_promotion=is_promo,
            )
        except Exception as e:
            logger.warning(f"[arogga] parse error: {e} — {prod}")
            return None

    async def scrape(self) -> list[ScrapedDiaper]:
        results: list[ScrapedDiaper] = []
        seen_ids: set[str] = set()

        async with httpx.AsyncClient(follow_redirects=True) as client:
            # Phase 1: discover a working API endpoint
            logger.info("[arogga] Discovering API endpoint...")
            working_endpoint, initial_products = await self._discover_api_endpoint(client)

            if working_endpoint:
                # Process initial batch
                for prod in initial_products:
                    parsed = self._parse_product(prod)
                    if parsed and parsed.external_id not in seen_ids:
                        results.append(parsed)
                        seen_ids.add(parsed.external_id)

                # Additional keyword queries against the same endpoint
                for query in SEARCH_QUERIES_API[1:]:  # skip "diaper" — already done
                    logger.info(f"[arogga] API query: '{query}'")
                    raw = await self._fetch_api(client, working_endpoint, query)
                    for prod in raw:
                        parsed = self._parse_product(prod)
                        if parsed and parsed.external_id not in seen_ids:
                            results.append(parsed)
                            seen_ids.add(parsed.external_id)
                    await self.rate_limit(1.5)
            else:
                logger.warning("[arogga] No API endpoint worked — trying HTML fallback")
                raw = await self._fetch_html_fallback(client)
                for prod in raw:
                    parsed = self._parse_product(prod)
                    if parsed and parsed.external_id not in seen_ids:
                        results.append(parsed)
                        seen_ids.add(parsed.external_id)

        logger.info(f"[arogga] Scraped {len(results)} products total")
        return results


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    scraper = AroggaScraper()
    products = await scraper.scrape()
    if not products:
        logger.error(
            "[arogga] No products scraped — Arogga API endpoints may have changed. "
            "Check network tab on arogga.com/search?q=diaper to find the current API path."
        )
        sys.exit(1)
    scraper.upsert_to_db(products)
    print(f"Done: {len(products)} products from Arogga")


if __name__ == "__main__":
    asyncio.run(main())
