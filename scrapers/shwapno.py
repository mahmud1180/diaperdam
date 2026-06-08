"""Shwapno scraper for DiaperDam.

Shwapno (shwapno.com) is a Next.js e-commerce site for a major Bangladeshi
supermarket chain. Like Chaldal, it embeds product data in __NEXT_DATA__.

Primary path:
  /category/mother-baby/diapers   → paginated product listing
  /search?q=diaper                → search fallback

__NEXT_DATA__ shape (observed; may change):
  props.pageProps.products        → list[dict] — category pages
  props.pageProps.searchResults   → list[dict] — search pages
  props.pageProps.initialState.productList.products  → alternative path

Product fields typically seen:
  id / productId  → external_id
  name / title    → product name
  price / regularPrice / specialPrice → BDT prices
  images[0].url / image → image URL
  slug / url      → product URL suffix
"""
import asyncio
import json
import logging
import re
import sys

import httpx

from base import BaseScraper, ScrapedDiaper

logger = logging.getLogger(__name__)

SHWAPNO_BASE = "https://www.shwapno.com"

CATEGORY_PATHS = [
    "/category/mother-baby/diapers",
    "/category/baby-care/diapers",
    "/category/baby/diapers",
]

SEARCH_PATHS = [
    "/search?q=diaper",
    "/search?q=huggies+diaper",
    "/search?q=mamypoko",
    "/search?q=molfix",
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
    "Referer": "https://www.shwapno.com/",
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


def _extract_products_from_next_data(data: dict) -> list[dict]:
    """Walk common __NEXT_DATA__ shapes to find the product list."""
    props = data.get("props", {}).get("pageProps", {})

    # Direct product list
    for key in ("products", "items", "productList", "results", "searchResults"):
        val = props.get(key)
        if isinstance(val, list) and val:
            return val

    # Nested under initialState or data
    for root_key in ("initialState", "data", "store", "initialData"):
        subtree = props.get(root_key, {})
        if not isinstance(subtree, dict):
            continue
        for sub_key in ("products", "items", "productList", "results"):
            val = subtree.get(sub_key)
            if isinstance(val, list) and val:
                return val
        # One more level deep
        for sub_sub_key, sub_sub_val in subtree.items():
            if isinstance(sub_sub_val, dict):
                for leaf in ("products", "items"):
                    val = sub_sub_val.get(leaf)
                    if isinstance(val, list) and val:
                        return val

    return []


class ShwapnoScraper(BaseScraper):
    store_slug = "shwapno"
    store_name = "Shwapno"

    async def _fetch_page(
        self, client: httpx.AsyncClient, path: str
    ) -> list[dict]:
        url = f"{SHWAPNO_BASE}{path}"
        try:
            r = await client.get(url, headers=HEADERS, timeout=25)
            r.raise_for_status()
        except Exception as e:
            logger.warning(f"[shwapno] Failed to fetch {path}: {e}")
            return []

        html = r.text
        m = re.search(
            r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL
        )
        if not m:
            logger.warning(f"[shwapno] No __NEXT_DATA__ on {path}")
            return []

        try:
            data = json.loads(m.group(1))
        except json.JSONDecodeError:
            logger.warning(f"[shwapno] JSON parse error on {path}")
            return []

        products = _extract_products_from_next_data(data)
        if not products:
            logger.warning(
                f"[shwapno] __NEXT_DATA__ present but no products found on {path} "
                f"— keys: {list(data.get('props', {}).get('pageProps', {}).keys())}"
            )
        return products

    def _parse_product(self, prod: dict) -> ScrapedDiaper | None:
        try:
            name = (
                prod.get("name")
                or prod.get("title")
                or prod.get("productName")
                or prod.get("product_name")
                or ""
            ).strip()
            if not name:
                return None

            # Filter to diaper-relevant items
            name_lower = name.lower()
            if not any(
                kw in name_lower
                for kw in ["diaper", "nappy", "nappies"] + list(BRAND_SLUG_MAP.keys())
            ):
                return None

            ext_id = str(
                prod.get("id")
                or prod.get("productId")
                or prod.get("product_id")
                or prod.get("sku")
                or ""
            )
            if not ext_id:
                return None

            # Price: specialPrice wins over price, mrp is original
            price = _clean_price(
                prod.get("specialPrice")
                or prod.get("price")
                or prod.get("salePrice")
                or prod.get("selling_price")
            )
            if price is None:
                return None

            original_price = _clean_price(
                prod.get("regularPrice")
                or prod.get("mrp")
                or prod.get("original_price")
                or prod.get("listPrice")
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
                first_img = images[0]
                if isinstance(first_img, dict):
                    image_url = first_img.get("url") or first_img.get("src")
                elif isinstance(first_img, str):
                    image_url = first_img
            if not image_url:
                image_url = prod.get("image") or prod.get("thumbnail") or prod.get("imageUrl")

            # URL
            slug = prod.get("slug") or prod.get("url_key") or prod.get("urlKey")
            if slug:
                product_url = f"{SHWAPNO_BASE}/{slug.lstrip('/')}"
            else:
                product_url = f"{SHWAPNO_BASE}/product/{ext_id}"

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
            logger.warning(f"[shwapno] parse error: {e} — {prod}")
            return None

    async def scrape(self) -> list[ScrapedDiaper]:
        results: list[ScrapedDiaper] = []
        seen_ids: set[str] = set()

        async with httpx.AsyncClient(follow_redirects=True) as client:
            # Try category pages first
            category_found = False
            for path in CATEGORY_PATHS:
                logger.info(f"[shwapno] Trying category {path}")
                raw = await self._fetch_page(client, path)
                if raw:
                    category_found = True
                    for prod in raw:
                        parsed = self._parse_product(prod)
                        if parsed and parsed.external_id not in seen_ids:
                            results.append(parsed)
                            seen_ids.add(parsed.external_id)
                    await self.rate_limit(1.5)
                    break  # One category hit is enough; search will fill gaps
                await self.rate_limit(1.0)

            if not category_found:
                logger.warning("[shwapno] No category page worked — relying solely on search")

            # Always run search queries to catch anything the category misses
            for path in SEARCH_PATHS:
                logger.info(f"[shwapno] Searching {path}")
                raw = await self._fetch_page(client, path)
                for prod in raw:
                    parsed = self._parse_product(prod)
                    if parsed and parsed.external_id not in seen_ids:
                        results.append(parsed)
                        seen_ids.add(parsed.external_id)
                await self.rate_limit(1.5)

        logger.info(f"[shwapno] Scraped {len(results)} products total")
        return results


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    scraper = ShwapnoScraper()
    products = await scraper.scrape()
    if not products:
        logger.error(
            "[shwapno] No products scraped — check __NEXT_DATA__ shape or category paths"
        )
        sys.exit(1)
    scraper.upsert_to_db(products)
    print(f"Done: {len(products)} products from Shwapno")


if __name__ == "__main__":
    asyncio.run(main())
