"""Meena Bazar scraper for DiaperDam.

Meena Bazar (meenabazar.com.bd) is one of Bangladesh's largest supermarket
chains with an online store. The site is built on a custom stack — it may
expose __NEXT_DATA__ (Next.js) or a JSON API. We try in order:

  1. __NEXT_DATA__ on the baby-care / diaper category page.
  2. Internal REST API endpoints commonly used by BD e-commerce platforms.
  3. HTML search results page with product cards embedded as JSON.
  4. Plain HTML parsing as last resort (bs4-free: regex over raw HTML).

Category URLs to probe:
  /category/baby-care
  /category/baby-products
  /search?q=diaper
  /search?q=baby+diaper

Known diaper brands stocked by Meena Bazar:
  Huggies, MamyPoko, Molfix, Neocare, Bashundhara/Diapant, Pampers
"""
import asyncio
import json
import logging
import re
import sys

import httpx

from base import BaseScraper, ScrapedDiaper

logger = logging.getLogger(__name__)

MEENA_BASE = "https://meenabazar.com.bd"

CATEGORY_PATHS = [
    "/category/baby-care",
    "/category/baby-products",
    "/category/baby-care-toys",
    "/category/diapers",
    "/category/baby",
]

SEARCH_PATHS = [
    "/search?q=diaper",
    "/search?q=baby+diaper",
    "/search?q=huggies",
    "/search?q=mamypoko",
    "/search?q=molfix",
]

API_ENDPOINTS = [
    "/api/v1/products?category=baby-care&per_page=50",
    "/api/v1/products/search?q=diaper&limit=50",
    "/api/products?q=diaper&limit=50",
    "/api/search?q=diaper&size=50",
    "/api/v2/products?q=diaper",
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
    "rainbow":     "rainbow",
    "kidstar":     "kidstar",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://meenabazar.com.bd/",
}

JSON_HEADERS = {
    **HEADERS,
    "Accept": "application/json, text/plain, */*",
    "X-Requested-With": "XMLHttpRequest",
}


def _extract_brand(name: str) -> tuple[str, str]:
    name_lower = name.lower()
    for keyword, slug in BRAND_SLUG_MAP.items():
        if keyword in name_lower:
            display_map = {
                "mamypoko":    "MamyPoko",
                "huggies":     "Huggies",
                "molfix":      "Molfix",
                "pampers":     "Pampers",
                "neocare":     "Neocare",
                "bashundhara": "Bashundhara",
                "savlon":      "Savlon",
                "smc-smile":   "SMC Smile",
                "happy-nappy": "Happy Nappy",
                "rainbow":     "Rainbow",
                "kidstar":     "Kidstar",
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
    m = re.search(r"\bsize[:\s]*([smlx]+)\b", n)
    if m:
        return m.group(1).upper()
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


def _is_diaper(name: str) -> bool:
    """Return True if this product is likely a diaper."""
    name_lower = name.lower()
    if any(kw in name_lower for kw in ["diaper", "nappy", "nappies"]):
        return True
    return any(kw in name_lower for kw in BRAND_SLUG_MAP.keys())


def _extract_products_from_html(html: str, source_label: str) -> list[dict]:
    """Try multiple JSON extraction strategies from raw HTML."""
    # Strategy 1: __NEXT_DATA__
    m = re.search(
        r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL
    )
    if m:
        try:
            data = json.loads(m.group(1))
            props = data.get("props", {}).get("pageProps", {})
            for key in ("products", "items", "data", "results", "productList", "productListData"):
                val = props.get(key)
                if isinstance(val, list) and val:
                    logger.info(f"[meenabazar] Found products via __NEXT_DATA__.pageProps.{key} on {source_label}")
                    return val
                if isinstance(val, dict):
                    for sub in ("products", "items", "data", "list"):
                        sub_val = val.get(sub)
                        if isinstance(sub_val, list) and sub_val:
                            logger.info(f"[meenabazar] Found products via __NEXT_DATA__.pageProps.{key}.{sub} on {source_label}")
                            return sub_val
        except (json.JSONDecodeError, AttributeError):
            pass

    # Strategy 2: window state variables
    for var in ("__INITIAL_STATE__", "__REDUX_STATE__", "__APP_STATE__", "__STORE__"):
        m = re.search(rf"(?:window\.)?{var}\s*=\s*(\{{.*?\}})\s*;", html, re.DOTALL)
        if m:
            try:
                state = json.loads(m.group(1))
                for path in [
                    ["products", "list"],
                    ["product", "products"],
                    ["catalog", "products"],
                    ["search", "results"],
                    ["search", "products"],
                    ["data", "products"],
                ]:
                    node = state
                    for key in path:
                        node = node.get(key, {}) if isinstance(node, dict) else {}
                    if isinstance(node, list) and node:
                        logger.info(f"[meenabazar] Found products via {var}.{'.'.join(path)} on {source_label}")
                        return node
            except (json.JSONDecodeError, AttributeError):
                pass

    # Strategy 3: inline JSON array
    for pattern in [
        r'"products"\s*:\s*(\[.*?\])\s*[,}]',
        r'"items"\s*:\s*(\[.*?\])\s*[,}]',
        r'"productList"\s*:\s*(\[.*?\])\s*[,}]',
    ]:
        m = re.search(pattern, html, re.DOTALL)
        if m:
            try:
                items = json.loads(m.group(1))
                if isinstance(items, list) and items:
                    logger.info(f"[meenabazar] Found {len(items)} products via inline JSON on {source_label}")
                    return items
            except json.JSONDecodeError:
                pass

    return []


def _parse_api_response(payload: dict | list) -> list[dict]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("data", "products", "items", "results", "hits", "list"):
            val = payload.get(key)
            if isinstance(val, list) and val:
                return val
            if isinstance(val, dict):
                for sub in ("products", "items", "data", "list"):
                    sub_val = val.get(sub)
                    if isinstance(sub_val, list) and sub_val:
                        return sub_val
    return []


class MeenaBazarScraper(BaseScraper):
    store_slug = "meenabazar"
    store_name = "Meena Bazar"

    async def _fetch_html(self, client: httpx.AsyncClient, path: str) -> list[dict]:
        url = f"{MEENA_BASE}{path}"
        try:
            r = await client.get(url, headers=HEADERS, timeout=25)
            r.raise_for_status()
        except Exception as e:
            logger.warning(f"[meenabazar] Failed to fetch {path}: {e}")
            return []
        products = _extract_products_from_html(r.text, path)
        if not products:
            logger.warning(f"[meenabazar] No products parsed from HTML at {path}")
        return products

    async def _fetch_api(self, client: httpx.AsyncClient) -> list[dict]:
        for endpoint in API_ENDPOINTS:
            url = f"{MEENA_BASE}{endpoint}"
            try:
                r = await client.get(url, headers=JSON_HEADERS, timeout=25)
                r.raise_for_status()
                ct = r.headers.get("content-type", "")
                if "json" not in ct:
                    continue
                payload = r.json()
                products = _parse_api_response(payload)
                if products:
                    logger.info(f"[meenabazar] API endpoint {endpoint} returned {len(products)} products")
                    return products
            except Exception as e:
                logger.warning(f"[meenabazar] API endpoint {endpoint} failed: {e}")
            await self.rate_limit(1.0)
        return []

    def _parse_product(self, prod: dict) -> ScrapedDiaper | None:
        try:
            name = (
                prod.get("name")
                or prod.get("title")
                or prod.get("product_name")
                or prod.get("productName")
                or prod.get("item_name")
                or ""
            ).strip()
            if not name:
                return None
            if not _is_diaper(name):
                return None

            ext_id = str(
                prod.get("id")
                or prod.get("product_id")
                or prod.get("productId")
                or prod.get("item_id")
                or prod.get("sku")
                or ""
            )
            if not ext_id:
                return None

            price = _clean_price(
                prod.get("special_price")
                or prod.get("sale_price")
                or prod.get("price")
                or prod.get("selling_price")
                or prod.get("current_price")
                or prod.get("discounted_price")
            )
            if price is None:
                return None

            original_price = _clean_price(
                prod.get("regular_price")
                or prod.get("mrp")
                or prod.get("original_price")
                or prod.get("list_price")
                or prod.get("base_price")
            )
            if original_price and original_price <= price:
                original_price = None

            pack_qty = _extract_pack_qty(name)
            if not pack_qty or pack_qty <= 0:
                return None

            brand, brand_slug = _extract_brand(name)
            diaper_type = _extract_type(name)
            size_label = _extract_size(name)
            w_min, w_max = _extract_weights(name)

            # Image
            image_url = None
            images = prod.get("images")
            if isinstance(images, list) and images:
                first = images[0]
                if isinstance(first, dict):
                    image_url = first.get("url") or first.get("src") or first.get("path")
                elif isinstance(first, str):
                    image_url = first
            if not image_url:
                image_url = (
                    prod.get("thumbnail")
                    or prod.get("image")
                    or prod.get("imageUrl")
                    or prod.get("image_url")
                    or prod.get("featured_image")
                )

            # URL
            slug = prod.get("slug") or prod.get("url_key") or prod.get("urlKey")
            if slug:
                product_url = f"{MEENA_BASE}/{slug.lstrip('/')}"
            else:
                product_url = f"{MEENA_BASE}/product/{ext_id}"

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
            logger.warning(f"[meenabazar] parse error: {e} — {prod}")
            return None

    async def scrape(self) -> list[ScrapedDiaper]:
        results: list[ScrapedDiaper] = []
        seen_ids: set[str] = set()

        async with httpx.AsyncClient(follow_redirects=True) as client:
            # Category pages — stop at first that yields products
            for path in CATEGORY_PATHS:
                logger.info(f"[meenabazar] Trying category {path}")
                raw = await self._fetch_html(client, path)
                if raw:
                    for prod in raw:
                        parsed = self._parse_product(prod)
                        if parsed and parsed.external_id not in seen_ids:
                            results.append(parsed)
                            seen_ids.add(parsed.external_id)
                    break
                await self.rate_limit(1.5)

            # Search pages
            for path in SEARCH_PATHS:
                logger.info(f"[meenabazar] Searching {path}")
                raw = await self._fetch_html(client, path)
                for prod in raw:
                    parsed = self._parse_product(prod)
                    if parsed and parsed.external_id not in seen_ids:
                        results.append(parsed)
                        seen_ids.add(parsed.external_id)
                await self.rate_limit(2.0)

            # API fallback if HTML parsing found nothing
            if not results:
                logger.warning("[meenabazar] HTML parsing yielded nothing — trying API endpoints")
                raw = await self._fetch_api(client)
                for prod in raw:
                    parsed = self._parse_product(prod)
                    if parsed and parsed.external_id not in seen_ids:
                        results.append(parsed)
                        seen_ids.add(parsed.external_id)

        logger.info(f"[meenabazar] Scraped {len(results)} products total")
        return results


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    scraper = MeenaBazarScraper()
    products = await scraper.scrape()
    if not products:
        logger.warning(
            "[meenabazar] 0 products scraped — site may not expose diapers in a "
            "machine-readable format yet. Returning [] gracefully."
        )
        return
    scraper.upsert_to_db(products)
    print(f"Done: {len(products)} products from Meena Bazar")


if __name__ == "__main__":
    asyncio.run(main())
