"""Daraz scraper for DiaperDam.

Daraz (daraz.com.bd) is a Lazada-family marketplace. Their search/catalog
pages embed product data in a window.__STORE__ or __NEXT_DATA__ JSON blob,
and they also expose a JSON API endpoint that product listing pages hit
internally. We try two approaches in order:

  1. Fetch the catalog search HTML and parse __STORE__ / __NEXT_DATA__.
  2. Fall back to the internal API endpoint the SPA uses:
       GET /catalog/?q=diaper&_keyori=ss&from=input&spm=...
     with Accept: application/json header — Daraz returns a JSON payload
     containing a `mods.listItems` array of product cards.

We run three keyword searches (diaper, huggies+diaper, mamypoko+diaper)
and deduplicate by itemId.
"""
import asyncio
import json
import logging
import re
import sys

import httpx

from base import BaseScraper, ScrapedDiaper

logger = logging.getLogger(__name__)

DARAZ_BASE = "https://www.daraz.com.bd"

SEARCH_QUERIES = [
    "diaper",
    "huggies diaper",
    "mamypoko diaper",
    "molfix diaper",
    "pampers diaper",
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
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.daraz.com.bd/",
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
        return {"LARGE": "L", "MEDIUM": "M", "SMALL": "S", "XL": "XL", "XXL": "XXL"}.get(s, s)
    # Single-letter size with word boundary
    m = re.search(r"\bsize\s*([smlx]+)\b", n)
    if m:
        return m.group(1).upper()
    return None


def _extract_pack_qty(name: str) -> int | None:
    # Try "64 pcs", "64pcs", "64 count", "64ct"
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
    """Parse price from various formats Daraz uses."""
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        v = float(raw)
        return v if v > 0 else None
    # String: "৳580", "580.00", "BDT 580"
    s = re.sub(r"[^\d.]", "", str(raw))
    if not s:
        return None
    try:
        v = float(s)
        return v if v > 0 else None
    except ValueError:
        return None


class DarazScraper(BaseScraper):
    store_slug = "daraz"
    store_name = "Daraz"

    async def _fetch_search_html(
        self, client: httpx.AsyncClient, query: str
    ) -> list[dict]:
        """Fetch catalog search page and extract products from embedded JSON."""
        url = f"{DARAZ_BASE}/catalog/"
        params = {"q": query, "sort": "popularity"}
        products: list[dict] = []

        try:
            r = await client.get(url, params=params, headers=HEADERS, timeout=25)
            r.raise_for_status()
        except Exception as e:
            logger.warning(f"[daraz] HTML fetch failed for '{query}': {e}")
            return []

        html = r.text

        # Strategy 1: window.__STORE__ JSON blob
        m = re.search(r"window\.__STORE__\s*=\s*(\{.*?\});", html, re.DOTALL)
        if m:
            try:
                store = json.loads(m.group(1))
                # Navigate: store.items or store.listItems
                items = (
                    store.get("items")
                    or store.get("listItems")
                    or store.get("data", {}).get("items")
                    or []
                )
                if isinstance(items, list) and items:
                    logger.info(f"[daraz] Found {len(items)} items via __STORE__ for '{query}'")
                    return items
            except (json.JSONDecodeError, AttributeError):
                pass

        # Strategy 2: __NEXT_DATA__
        m = re.search(
            r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL
        )
        if m:
            try:
                data = json.loads(m.group(1))
                props = data.get("props", {}).get("pageProps", {})
                items = (
                    props.get("items")
                    or props.get("listItems")
                    or props.get("initialData", {}).get("hits", {}).get("prods")
                    or props.get("data", {}).get("items")
                    or []
                )
                if isinstance(items, list) and items:
                    logger.info(
                        f"[daraz] Found {len(items)} items via __NEXT_DATA__ for '{query}'"
                    )
                    return items
            except (json.JSONDecodeError, AttributeError):
                pass

        # Strategy 3: look for a JSON array of product cards inline
        # Daraz sometimes inlines: var nWishListItemIds = [...]; var mods = {...}
        m = re.search(r'"listItems"\s*:\s*(\[.*?\])\s*[,}]', html, re.DOTALL)
        if m:
            try:
                items = json.loads(m.group(1))
                if isinstance(items, list) and items:
                    logger.info(
                        f"[daraz] Found {len(items)} items via listItems inline for '{query}'"
                    )
                    return items
            except json.JSONDecodeError:
                pass

        # Strategy 4: JSON API with Accept: application/json
        try:
            r2 = await client.get(url, params=params, headers=JSON_HEADERS, timeout=25)
            r2.raise_for_status()
            ct = r2.headers.get("content-type", "")
            if "json" in ct:
                payload = r2.json()
                items = (
                    payload.get("mods", {}).get("listItems")
                    or payload.get("items")
                    or payload.get("data", {}).get("items")
                    or []
                )
                if isinstance(items, list) and items:
                    logger.info(
                        f"[daraz] Found {len(items)} items via JSON API for '{query}'"
                    )
                    return items
        except Exception as e:
            logger.warning(f"[daraz] JSON API fallback failed for '{query}': {e}")

        logger.warning(f"[daraz] No products parsed for '{query}' — page structure may have changed")
        return []

    def _parse_item(self, item: dict) -> ScrapedDiaper | None:
        try:
            # Name — Daraz uses 'name', 'title', 'itemTitle'
            name = (
                item.get("name")
                or item.get("title")
                or item.get("itemTitle")
                or item.get("brandName", "") + " " + item.get("productTitle", "")
            ).strip()
            if not name:
                return None

            # Only process diaper-relevant items
            name_lower = name.lower()
            if not any(kw in name_lower for kw in ["diaper", "nappy", "nappies", "pampers"]):
                # Accept if brand is known diaper brand
                if not any(kw in name_lower for kw in BRAND_SLUG_MAP.keys()):
                    return None

            # External ID — prefer itemId, fall back to nid / skuId
            ext_id = str(
                item.get("itemId")
                or item.get("nid")
                or item.get("skuId")
                or item.get("productId")
                or ""
            )
            if not ext_id or ext_id == "0":
                return None

            # Price
            price = _clean_price(
                item.get("price")
                or item.get("currentPrice")
                or item.get("priceShow")
                or item.get("salePrice")
            )
            if price is None:
                return None

            original_price = _clean_price(
                item.get("originalPrice")
                or item.get("originalPriceShow")
                or item.get("mrp")
            )
            if original_price and original_price <= price:
                original_price = None

            # Pack qty
            pack_qty = _extract_pack_qty(name)
            if not pack_qty or pack_qty <= 0:
                return None

            brand, brand_slug = _extract_brand(name)
            diaper_type = _extract_type(name)
            size_label = _extract_size(name)
            w_min, w_max = _extract_weights(name)

            # Image — Daraz uses 'image', 'imgUrl', 'itemImg'
            image_url = (
                item.get("image")
                or item.get("imgUrl")
                or item.get("itemImg")
                or item.get("mainImage")
            )

            # Product URL — itemUrl or build from ext_id
            product_url = item.get("itemUrl") or item.get("productUrl")
            if product_url and not product_url.startswith("http"):
                product_url = f"https:{product_url}"
            if not product_url:
                product_url = f"{DARAZ_BASE}/-i{ext_id}.html"

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
            logger.warning(f"[daraz] parse error: {e} — {item}")
            return None

    async def scrape(self) -> list[ScrapedDiaper]:
        results: list[ScrapedDiaper] = []
        seen_ids: set[str] = set()

        async with httpx.AsyncClient(follow_redirects=True) as client:
            for query in SEARCH_QUERIES:
                logger.info(f"[daraz] Searching: '{query}'")
                items = await self._fetch_search_html(client, query)
                for item in items:
                    parsed = self._parse_item(item)
                    if parsed and parsed.external_id not in seen_ids:
                        results.append(parsed)
                        seen_ids.add(parsed.external_id)
                await self.rate_limit(2.0)

        logger.info(f"[daraz] Scraped {len(results)} products total")
        return results


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    scraper = DarazScraper()
    products = await scraper.scrape()
    if not products:
        logger.error(
            "[daraz] No products scraped — Daraz may have changed its embedded JSON structure"
        )
        sys.exit(1)
    scraper.upsert_to_db(products)
    print(f"Done: {len(products)} products from Daraz")


if __name__ == "__main__":
    asyncio.run(main())
