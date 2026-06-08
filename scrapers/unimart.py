"""Unimart scraper for DiaperDam.

Unimart (unimart.com.bd) is a Bangladeshi online supermarket. The platform
may be built on a custom stack, WooCommerce, or a React SPA. We probe in
order:

  1. __NEXT_DATA__ on diaper search / category pages (Next.js path).
  2. WooCommerce REST API: /wp-json/wc/v3/products?category=...&search=diaper
     (public catalog endpoint, no auth required for public products).
  3. Custom REST API endpoints used by SPAs.
  4. HTML with inline JSON state variables.

Category/search URLs to probe:
  /search?q=diaper
  /product-category/baby-care
  /product-category/baby-diaper
  /?s=diaper&post_type=product   (WooCommerce shop search)
"""
import asyncio
import json
import logging
import re
import sys

import httpx

from base import BaseScraper, ScrapedDiaper

logger = logging.getLogger(__name__)

UNIMART_BASE = "https://unimart.com.bd"

SEARCH_PATHS = [
    "/search?q=diaper",
    "/search?q=baby+diaper",
    "/search?q=huggies",
    "/search?q=mamypoko",
    "/search?q=molfix",
]

CATEGORY_PATHS = [
    "/product-category/baby-care",
    "/product-category/baby-diaper",
    "/product-category/baby",
    "/category/baby-care",
    "/category/diapers",
]

# WooCommerce-style API endpoints
WC_API_ENDPOINTS = [
    "/wp-json/wc/v3/products?search=diaper&per_page=50&status=publish",
    "/wp-json/wc/v3/products?category=baby-care&per_page=50",
    "/wp-json/wc/v3/products?search=huggies&per_page=50",
    "/wp-json/wc/v3/products?search=mamypoko&per_page=50",
]

# Generic API endpoints
GENERIC_API_ENDPOINTS = [
    "/api/v1/products?q=diaper&limit=50",
    "/api/products/search?q=diaper&size=50",
    "/api/search?q=diaper&limit=50",
    "/api/v2/catalog/search?q=diaper",
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
    "Referer": "https://unimart.com.bd/",
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
    # Handle WooCommerce price strings like "580.00" or "৳580"
    s = re.sub(r"[^\d.]", "", str(raw))
    if not s:
        return None
    try:
        v = float(s)
        return v if v > 0 else None
    except ValueError:
        return None


def _is_diaper(name: str) -> bool:
    name_lower = name.lower()
    if any(kw in name_lower for kw in ["diaper", "nappy", "nappies"]):
        return True
    return any(kw in name_lower for kw in BRAND_SLUG_MAP.keys())


def _extract_products_from_html(html: str, source_label: str) -> list[dict]:
    """Try multiple JSON extraction strategies from raw HTML."""
    # Strategy 1: __NEXT_DATA__ (Next.js SSR)
    m = re.search(
        r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL
    )
    if m:
        try:
            data = json.loads(m.group(1))
            props = data.get("props", {}).get("pageProps", {})
            for key in ("products", "items", "data", "results", "productList"):
                val = props.get(key)
                if isinstance(val, list) and val:
                    logger.info(f"[unimart] Found products via __NEXT_DATA__.pageProps.{key} on {source_label}")
                    return val
                if isinstance(val, dict):
                    for sub in ("products", "items", "data", "list"):
                        sub_val = val.get(sub)
                        if isinstance(sub_val, list) and sub_val:
                            logger.info(f"[unimart] Found products via __NEXT_DATA__.pageProps.{key}.{sub}")
                            return sub_val
        except (json.JSONDecodeError, AttributeError):
            pass

    # Strategy 2: window state blobs (Redux / Vuex / custom)
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
                        logger.info(f"[unimart] Found via {var}.{'.'.join(path)} on {source_label}")
                        return node
            except (json.JSONDecodeError, AttributeError):
                pass

    # Strategy 3: inline JSON arrays
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
                    logger.info(f"[unimart] Found {len(items)} products via inline JSON on {source_label}")
                    return items
            except json.JSONDecodeError:
                pass

    return []


def _parse_api_response(payload: dict | list) -> list[dict]:
    """Normalize API JSON payload to a flat list of product dicts."""
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


def _parse_wc_product(prod: dict) -> "ScrapedDiaper | None":
    """Parse a WooCommerce product object into ScrapedDiaper."""
    try:
        name = (prod.get("name") or prod.get("title") or {}).get("rendered", "") if isinstance(prod.get("name"), dict) else prod.get("name", "")
        if not name:
            return None
        if not _is_diaper(name):
            return None

        ext_id = str(prod.get("id") or "")
        if not ext_id:
            return None

        # WooCommerce uses 'price', 'regular_price', 'sale_price' as strings
        price = _clean_price(prod.get("price") or prod.get("sale_price"))
        if price is None:
            return None

        original_price = _clean_price(prod.get("regular_price"))
        if original_price and original_price <= price:
            original_price = None

        pack_qty = _extract_pack_qty(name)
        if not pack_qty or pack_qty <= 0:
            return None

        brand, brand_slug = _extract_brand(name)
        diaper_type = _extract_type(name)
        size_label = _extract_size(name)
        w_min, w_max = _extract_weights(name)

        # WooCommerce image
        image_url = None
        images = prod.get("images")
        if isinstance(images, list) and images:
            first = images[0]
            if isinstance(first, dict):
                image_url = first.get("src") or first.get("url")
            elif isinstance(first, str):
                image_url = first

        product_url = prod.get("permalink") or prod.get("link") or f"{UNIMART_BASE}/?p={ext_id}"

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
        logger.warning(f"[unimart] WC parse error: {e} — {prod}")
        return None


class UnimartScraper(BaseScraper):
    store_slug = "unimart"
    store_name = "Unimart"

    async def _fetch_html(self, client: httpx.AsyncClient, path: str) -> list[dict]:
        url = f"{UNIMART_BASE}{path}"
        try:
            r = await client.get(url, headers=HEADERS, timeout=25)
            r.raise_for_status()
        except Exception as e:
            logger.warning(f"[unimart] Failed to fetch {path}: {e}")
            return []
        products = _extract_products_from_html(r.text, path)
        if not products:
            logger.warning(f"[unimart] No products parsed from HTML at {path}")
        return products

    async def _try_wc_api(self, client: httpx.AsyncClient) -> list[ScrapedDiaper]:
        """Attempt WooCommerce REST API endpoints directly."""
        results: list[ScrapedDiaper] = []
        seen: set[str] = set()
        for endpoint in WC_API_ENDPOINTS:
            url = f"{UNIMART_BASE}{endpoint}"
            try:
                r = await client.get(url, headers=JSON_HEADERS, timeout=25)
                r.raise_for_status()
                ct = r.headers.get("content-type", "")
                if "json" not in ct:
                    continue
                payload = r.json()
                # WC returns a bare array at the top level
                items = payload if isinstance(payload, list) else _parse_api_response(payload)
                if not items:
                    continue
                logger.info(f"[unimart] WC API {endpoint} returned {len(items)} items")
                for item in items:
                    parsed = _parse_wc_product(item)
                    if parsed and parsed.external_id not in seen:
                        results.append(parsed)
                        seen.add(parsed.external_id)
            except Exception as e:
                logger.warning(f"[unimart] WC API {endpoint} failed: {e}")
            await self.rate_limit(1.5)
        return results

    async def _try_generic_api(self, client: httpx.AsyncClient) -> list[dict]:
        """Attempt generic JSON API endpoints."""
        for endpoint in GENERIC_API_ENDPOINTS:
            url = f"{UNIMART_BASE}{endpoint}"
            try:
                r = await client.get(url, headers=JSON_HEADERS, timeout=25)
                r.raise_for_status()
                ct = r.headers.get("content-type", "")
                if "json" not in ct:
                    continue
                payload = r.json()
                items = _parse_api_response(payload)
                if items:
                    logger.info(f"[unimart] Generic API {endpoint} returned {len(items)} items")
                    return items
            except Exception as e:
                logger.warning(f"[unimart] Generic API {endpoint} failed: {e}")
            await self.rate_limit(1.0)
        return []

    def _parse_product(self, prod: dict) -> ScrapedDiaper | None:
        try:
            name = (
                prod.get("name")
                or prod.get("title")
                or prod.get("product_name")
                or prod.get("productName")
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
            )
            if price is None:
                return None

            original_price = _clean_price(
                prod.get("regular_price")
                or prod.get("mrp")
                or prod.get("original_price")
                or prod.get("list_price")
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
                    image_url = first.get("url") or first.get("src")
                elif isinstance(first, str):
                    image_url = first
            if not image_url:
                image_url = (
                    prod.get("thumbnail")
                    or prod.get("image")
                    or prod.get("imageUrl")
                    or prod.get("image_url")
                )

            # URL
            slug = prod.get("slug") or prod.get("url_key") or prod.get("permalink")
            if slug:
                product_url = slug if slug.startswith("http") else f"{UNIMART_BASE}/{slug.lstrip('/')}"
            else:
                product_url = f"{UNIMART_BASE}/product/{ext_id}"

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
            logger.warning(f"[unimart] parse error: {e} — {prod}")
            return None

    async def scrape(self) -> list[ScrapedDiaper]:
        results: list[ScrapedDiaper] = []
        seen_ids: set[str] = set()

        async with httpx.AsyncClient(follow_redirects=True) as client:
            # 1. Try WooCommerce REST API first — fastest path if the site uses WC
            wc_results = await self._try_wc_api(client)
            for parsed in wc_results:
                if parsed.external_id not in seen_ids:
                    results.append(parsed)
                    seen_ids.add(parsed.external_id)

            # 2. Search pages (HTML + embedded JSON)
            for path in SEARCH_PATHS:
                logger.info(f"[unimart] Searching {path}")
                raw = await self._fetch_html(client, path)
                for prod in raw:
                    parsed = self._parse_product(prod)
                    if parsed and parsed.external_id not in seen_ids:
                        results.append(parsed)
                        seen_ids.add(parsed.external_id)
                await self.rate_limit(2.0)

            # 3. Category pages
            if not results:
                for path in CATEGORY_PATHS:
                    logger.info(f"[unimart] Trying category {path}")
                    raw = await self._fetch_html(client, path)
                    if raw:
                        for prod in raw:
                            parsed = self._parse_product(prod)
                            if parsed and parsed.external_id not in seen_ids:
                                results.append(parsed)
                                seen_ids.add(parsed.external_id)
                        break
                    await self.rate_limit(1.5)

            # 4. Generic API fallback
            if not results:
                logger.warning("[unimart] All HTML/WC attempts yielded nothing — trying generic APIs")
                raw = await self._try_generic_api(client)
                for prod in raw:
                    parsed = self._parse_product(prod)
                    if parsed and parsed.external_id not in seen_ids:
                        results.append(parsed)
                        seen_ids.add(parsed.external_id)

        logger.info(f"[unimart] Scraped {len(results)} products total")
        return results


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    scraper = UnimartScraper()
    products = await scraper.scrape()
    if not products:
        logger.warning(
            "[unimart] 0 products scraped — site may not expose diapers in a "
            "machine-readable format. Returning [] gracefully."
        )
        return
    scraper.upsert_to_db(products)
    print(f"Done: {len(products)} products from Unimart")


if __name__ == "__main__":
    asyncio.run(main())
