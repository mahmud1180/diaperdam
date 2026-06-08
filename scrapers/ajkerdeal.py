"""AjkerDeal scraper for DiaperDam.

AjkerDeal (ajkerdeal.com) is a major BD e-commerce platform.
Category URL: https://ajkerdeal.com/en/category/Baby-Kids-Diaper

Strategy:
1. Try REST API: /api/category/products or similar JSON endpoint
2. Try __NEXT_DATA__ (if Next.js)
3. Parse HTML product cards
"""
import asyncio
import json
import logging
import re
import sys
from urllib.parse import urlencode

import httpx

from base import BaseScraper, ScrapedDiaper

logger = logging.getLogger(__name__)

AJKER_BASE = "https://ajkerdeal.com"

BRAND_SLUG_MAP = {
    "huggies": "huggies",
    "mamypoko": "mamypoko",
    "mamy poko": "mamypoko",
    "molfix": "molfix",
    "pampers": "pampers",
    "neocare": "neocare",
    "neo care": "neocare",
    "bashundhara": "bashundhara",
    "diapant": "bashundhara",
    "avonee": "avonee",
    "supermom": "supermom",
    "aiwibi": "aiwibi",
    "savlon": "savlon",
    "twinkle": "savlon",
    "happy nappy": "happy-nappy",
    "fresh happy nappy": "happy-nappy",
    "kidz": "kidz",
    "mumlove": "mumlove",
    "momotaro": "momotaro",
}


def _extract_brand(name: str) -> tuple[str, str]:
    name_lower = name.lower()
    for keyword, slug in BRAND_SLUG_MAP.items():
        if keyword in name_lower:
            display_map = {
                "mamypoko": "MamyPoko", "huggies": "Huggies", "molfix": "Molfix",
                "pampers": "Pampers", "neocare": "Neocare", "bashundhara": "Bashundhara",
                "savlon": "Savlon", "happy-nappy": "Happy Nappy", "avonee": "Avonee",
                "supermom": "Supermom", "aiwibi": "Aiwibi", "kidz": "Kidz",
                "mumlove": "Mumlove", "momotaro": "Momotaro",
            }
            return display_map.get(slug, keyword.title()), slug
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
    if "new born" in n or "newborn" in n or " nb " in n:
        return "Newborn"
    # weight-based size extraction
    m = re.search(r"\b(xxl|xl|large|medium|small)\b", n)
    if m:
        return {"large": "L", "medium": "M", "small": "S", "xl": "XL", "xxl": "XXL"}.get(m.group(1), m.group(1).upper())
    m = re.search(r"\b([smlx]+)\b", n)
    if m and m.group(1) in ("s", "m", "l", "xl", "xxl"):
        return m.group(1).upper()
    return None


def _extract_pack_qty(name: str) -> int | None:
    # Try "42 pcs", "42pcs", "42 pieces", "pack of 42"
    for pattern in [r"(\d+)\s*pcs", r"(\d+)\s*pieces?", r"pack\s+of\s+(\d+)", r"-\s*(\d+)\s*$"]:
        m = re.search(pattern, name.lower())
        if m:
            qty = int(m.group(1))
            if 1 < qty <= 200:  # sanity
                return qty
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


class AjkerDealScraper(BaseScraper):
    store_slug = "ajkerdeal"
    store_name = "AjkerDeal"

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        "Accept": "application/json, text/html, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://ajkerdeal.com",
    }

    CATEGORY_URLS = [
        "https://ajkerdeal.com/en/category/Baby-Kids-Diaper",
    ]

    # AjkerDeal API candidates
    API_CANDIDATES = [
        "https://ajkerdeal.com/api/product/search-products?categoryId=1217&pageNumber={page}&pageSize=50",
        "https://ajkerdeal.com/api/search?q=diaper&category=baby&page={page}&size=50",
        "https://ajkerdeal.com/ProductCategory/GetCategoryProductsAsync?categoryId=1217&pageNumber={page}&pageSize=50",
    ]

    async def _try_api(self, client: httpx.AsyncClient) -> list[dict]:
        """Try various API endpoints to find products."""
        for api_template in self.API_CANDIDATES:
            products = []
            for page in range(1, 5):  # max 4 pages
                url = api_template.format(page=page)
                try:
                    r = await client.get(url, headers={**self.HEADERS, "Accept": "application/json"}, timeout=15)
                    if r.status_code != 200:
                        break
                    data = r.json()
                    # Try to find product list in various data shapes
                    items = (
                        data.get("data", []) if isinstance(data, dict) else []
                        or data.get("products", [])
                        or data.get("items", [])
                        or (data if isinstance(data, list) else [])
                    )
                    if not items:
                        break
                    products.extend(items)
                    await self.rate_limit(1.0)
                except Exception as e:
                    logger.debug(f"[ajkerdeal] API candidate {url} failed: {e}")
                    break
            if products:
                logger.info(f"[ajkerdeal] API succeeded: {len(products)} raw items")
                return products
        return []

    async def _try_next_data(self, client: httpx.AsyncClient) -> list[dict]:
        """Try __NEXT_DATA__ extraction from category page."""
        for cat_url in self.CATEGORY_URLS:
            try:
                r = await client.get(cat_url, headers=self.HEADERS, timeout=20)
                r.raise_for_status()
                m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', r.text, re.DOTALL)
                if not m:
                    continue
                data = json.loads(m.group(1))
                props = data.get("props", {}).get("pageProps", {})
                for key in ["products", "items", "productList", "data"]:
                    val = props.get(key)
                    if isinstance(val, list) and val:
                        return val
                    if isinstance(val, dict):
                        for subkey in ["products", "items", "list"]:
                            sub = val.get(subkey)
                            if isinstance(sub, list) and sub:
                                return sub
            except Exception as e:
                logger.debug(f"[ajkerdeal] __NEXT_DATA__ failed for {cat_url}: {e}")
        return []

    async def _try_html_parse(self, client: httpx.AsyncClient) -> list[dict]:
        """Parse HTML for embedded product JSON or meta tags."""
        products = []
        for cat_url in self.CATEGORY_URLS:
            try:
                r = await client.get(cat_url, headers=self.HEADERS, timeout=20)
                r.raise_for_status()

                # Look for JSON blobs in script tags
                scripts = re.findall(r'<script[^>]*>(.*?)</script>', r.text, re.DOTALL)
                for script in scripts:
                    if "price" in script.lower() and ("diaper" in script.lower() or "product" in script.lower()):
                        # Try to find product arrays
                        for pattern in [r'"products"\s*:\s*(\[.*?\])', r'"items"\s*:\s*(\[.*?\])', r'"data"\s*:\s*(\[.*?\])']:
                            m = re.search(pattern, script, re.DOTALL)
                            if m:
                                try:
                                    items = json.loads(m.group(1))
                                    if items:
                                        products.extend(items)
                                        break
                                except Exception:
                                    pass

                # Look for product cards in HTML with price data
                if not products:
                    # Extract prices from structured data (ld+json)
                    ld_blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', r.text, re.DOTALL)
                    for block in ld_blocks:
                        try:
                            ld = json.loads(block)
                            if isinstance(ld, list):
                                for item in ld:
                                    if item.get("@type") == "Product":
                                        products.append(item)
                            elif ld.get("@type") == "ItemList":
                                for elem in ld.get("itemListElement", []):
                                    products.append(elem.get("item", {}))
                        except Exception:
                            pass

            except Exception as e:
                logger.debug(f"[ajkerdeal] HTML parse failed for {cat_url}: {e}")
        return products

    def _parse_api_product(self, prod: dict) -> ScrapedDiaper | None:
        """Parse a product dict from any source."""
        try:
            name = (
                prod.get("name") or prod.get("productName") or prod.get("title")
                or prod.get("shortTitle") or prod.get("productTitle") or ""
            )
            if not name or not any(k in name.lower() for k in ["diaper", "pamper", "pant", "nappy"]):
                return None

            # Price extraction
            price = (
                prod.get("price") or prod.get("currentPrice") or prod.get("sellPrice")
                or prod.get("offers", {}).get("price") if isinstance(prod.get("offers"), dict) else None
                or prod.get("salePrice")
            )
            if price is None:
                return None
            price_bdt = float(str(price).replace(",", "").replace("৳", "").strip())
            if price_bdt <= 0:
                return None

            original = prod.get("originalPrice") or prod.get("mrp") or prod.get("regularPrice")
            original_bdt = None
            if original:
                original_bdt = float(str(original).replace(",", "").replace("৳", "").strip())
                if original_bdt <= price_bdt:
                    original_bdt = None

            # External ID
            ext_id = str(
                prod.get("id") or prod.get("productId") or prod.get("@id") or prod.get("slug") or name[:50]
            )

            pack_qty = _extract_pack_qty(name)
            if not pack_qty:
                pack_qty = prod.get("quantity") or prod.get("packSize") or prod.get("count")
                if pack_qty:
                    pack_qty = int(pack_qty)
            if not pack_qty or pack_qty <= 0:
                return None

            brand, brand_slug = _extract_brand(name)
            diaper_type = _extract_type(name)
            size_label = _extract_size(name)
            w_min, w_max = _extract_weights(name)

            image_url = (
                prod.get("imageUrl") or prod.get("image") or prod.get("thumbnail")
                or (prod.get("images", [None])[0] if isinstance(prod.get("images"), list) else None)
            )
            product_url = prod.get("url") or prod.get("productUrl") or prod.get("link")
            if product_url and not product_url.startswith("http"):
                product_url = AJKER_BASE + product_url

            is_promo = bool(original_bdt)
            discount_pct = None
            if is_promo and original_bdt:
                discount_pct = round((1 - price_bdt / original_bdt) * 100, 1)

            return ScrapedDiaper(
                external_id=f"ajd-{ext_id}",
                brand=brand,
                brand_slug=brand_slug,
                type=diaper_type,
                size_label=size_label,
                weight_min_kg=w_min,
                weight_max_kg=w_max,
                pack_qty=pack_qty,
                image_url=str(image_url) if image_url else None,
                product_url=str(product_url) if product_url else None,
                price_bdt=price_bdt,
                original_price_bdt=original_bdt,
                discount_pct=discount_pct,
                is_promotion=is_promo,
            )
        except Exception as e:
            logger.debug(f"[ajkerdeal] parse_product error: {e}")
            return None

    async def scrape(self) -> list[ScrapedDiaper]:
        results: list[ScrapedDiaper] = []
        seen_ids: set[str] = set()

        async with httpx.AsyncClient(follow_redirects=True) as client:
            # Strategy 1: API
            raw = await self._try_api(client)
            if not raw:
                await self.rate_limit(1.0)
                # Strategy 2: __NEXT_DATA__
                raw = await self._try_next_data(client)
            if not raw:
                await self.rate_limit(1.0)
                # Strategy 3: HTML
                raw = await self._try_html_parse(client)

            logger.info(f"[ajkerdeal] Got {len(raw)} raw items")
            for prod in raw:
                result = self._parse_api_product(prod)
                if result and result.external_id not in seen_ids:
                    results.append(result)
                    seen_ids.add(result.external_id)

        logger.info(f"[ajkerdeal] Scraped {len(results)} valid diaper products")
        return results


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    scraper = AjkerDealScraper()
    products = await scraper.scrape()
    if not products:
        logger.warning("No products — AjkerDeal may need manual API inspection")
        return
    scraper.upsert_to_db(products)
    print(f"Done: {len(products)} products from AjkerDeal")


if __name__ == "__main__":
    asyncio.run(main())
