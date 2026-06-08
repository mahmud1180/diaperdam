"""GoBaby scraper for DiaperDam.

GoBaby (gobaby.com.bd) is a dedicated BD baby products store running WooCommerce.
Category URL: https://gobaby.com.bd/product-category/baby-diaper/

WooCommerce sites expose a public REST API at /wp-json/wc/store/v1/products
(no auth required for public products). Fall back to HTML parsing.
"""
import asyncio
import json
import logging
import re
import sys

import httpx

from base import BaseScraper, ScrapedDiaper

logger = logging.getLogger(__name__)

GOBABY_BASE = "https://gobaby.com.bd"

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
    if "new born" in n or "newborn" in n or " nb " in n or "(nb)" in n:
        return "Newborn"
    m = re.search(r"\b(xxl|xl|large|medium|small)\b", n)
    if m:
        return {"large": "L", "medium": "M", "small": "S", "xl": "XL", "xxl": "XXL"}.get(m.group(1), m.group(1).upper())
    m = re.search(r"\b([sml])\b", n)
    if m:
        return m.group(1).upper()
    return None


def _extract_pack_qty(name: str) -> int | None:
    for pattern in [r"(\d+)\s*pcs", r"(\d+)\s*pieces?", r"pack\s+of\s+(\d+)", r"-\s*(\d+)\s*$"]:
        m = re.search(pattern, name.lower())
        if m:
            qty = int(m.group(1))
            if 1 < qty <= 200:
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


def _clean_price(val) -> float | None:
    if val is None:
        return None
    try:
        s = str(val).replace(",", "").replace("৳", "").replace("BDT", "").strip()
        v = float(s)
        return v if v > 0 else None
    except Exception:
        return None


class GoBabyScraper(BaseScraper):
    store_slug = "gobaby"
    store_name = "GoBaby"

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        "Accept": "application/json, text/html, */*",
        "Accept-Language": "en-US,en;q=0.9",
    }

    async def _try_woo_store_api(self, client: httpx.AsyncClient) -> list[dict]:
        """WooCommerce Block Store API — no auth needed, used by Gutenberg blocks."""
        products = []
        # Category slug for baby diapers
        for cat_slug in ["baby-diaper", "disposable-baby-diapers"]:
            page = 1
            while page <= 6:
                url = f"{GOBABY_BASE}/wp-json/wc/store/v1/products?category={cat_slug}&per_page=50&page={page}"
                try:
                    r = await client.get(url, headers=self.HEADERS, timeout=15)
                    if r.status_code == 404:
                        break
                    if r.status_code != 200:
                        break
                    batch = r.json()
                    if not isinstance(batch, list) or not batch:
                        break
                    products.extend(batch)
                    if len(batch) < 50:
                        break
                    page += 1
                    await self.rate_limit(1.2)
                except Exception as e:
                    logger.debug(f"[gobaby] WooStore API page {page}: {e}")
                    break
        return products

    async def _try_woo_rest_api(self, client: httpx.AsyncClient) -> list[dict]:
        """WooCommerce REST API v3 — sometimes public for listing."""
        products = []
        for cat_id in [None]:  # Try without category first
            page = 1
            while page <= 6:
                params = {"per_page": 50, "page": page, "category": "baby-diaper"}
                url = f"{GOBABY_BASE}/wp-json/wc/v3/products?{'&'.join(f'{k}={v}' for k,v in params.items())}"
                try:
                    r = await client.get(url, headers=self.HEADERS, timeout=15)
                    if r.status_code in (401, 403, 404):
                        break
                    if r.status_code != 200:
                        break
                    batch = r.json()
                    if not isinstance(batch, list) or not batch:
                        break
                    products.extend(batch)
                    if len(batch) < 50:
                        break
                    page += 1
                    await self.rate_limit(1.2)
                except Exception as e:
                    logger.debug(f"[gobaby] WooREST API page {page}: {e}")
                    break
        return products

    async def _try_html_category(self, client: httpx.AsyncClient) -> list[dict]:
        """Scrape category pages looking for product JSON in page source."""
        products = []
        cat_urls = [
            f"{GOBABY_BASE}/product-category/baby-diaper/",
            f"{GOBABY_BASE}/product-category/baby-diaper/disposable-baby-diapers/",
        ]
        for url in cat_urls:
            try:
                r = await client.get(url, headers=self.HEADERS, timeout=20)
                r.raise_for_status()

                # __NEXT_DATA__ (if Next.js somehow)
                m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', r.text, re.DOTALL)
                if m:
                    data = json.loads(m.group(1))
                    props = data.get("props", {}).get("pageProps", {})
                    for key in ["products", "items"]:
                        if isinstance(props.get(key), list):
                            products.extend(props[key])

                # wc-blocks inline JSON
                m = re.search(r'data-wc-initial-state="([^"]+)"', r.text)
                if m:
                    try:
                        raw = m.group(1).replace("&quot;", '"').replace("&amp;", "&")
                        data = json.loads(raw)
                        # dig for products
                        products_list = (
                            data.get("products", {}).get("items", [])
                            or data.get("store", {}).get("products", [])
                            or []
                        )
                        products.extend(products_list)
                    except Exception:
                        pass

                # ld+json
                ld_blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', r.text, re.DOTALL)
                for block in ld_blocks:
                    try:
                        ld = json.loads(block)
                        if isinstance(ld, list):
                            for item in ld:
                                if item.get("@type") == "Product":
                                    products.append(item)
                        elif ld.get("@type") == "Product":
                            products.append(ld)
                        elif ld.get("@type") == "ItemList":
                            for elem in ld.get("itemListElement", []):
                                products.append(elem.get("item", {}))
                    except Exception:
                        pass

                await self.rate_limit(1.5)
            except Exception as e:
                logger.debug(f"[gobaby] HTML parse error {url}: {e}")
        return products

    def _parse_product(self, prod: dict) -> ScrapedDiaper | None:
        try:
            name = (
                prod.get("name") or prod.get("title") or prod.get("productName")
                or prod.get("short_description", "")
            )
            if isinstance(name, dict):
                name = name.get("rendered", "")
            name = str(name).strip()
            if not name:
                return None
            if not any(k in name.lower() for k in ["diaper", "pamper", "pant", "nappy", "diapers"]):
                return None

            # Price
            price = (
                prod.get("price") or prod.get("prices", {}).get("price")
                or prod.get("sale_price") or prod.get("regular_price")
            )
            if price is None:
                return None
            price_bdt = _clean_price(price)
            if not price_bdt:
                return None

            original = prod.get("regular_price") or prod.get("prices", {}).get("regular_price")
            original_bdt = _clean_price(original) if original else None
            if original_bdt and original_bdt <= price_bdt:
                original_bdt = None

            ext_id = str(prod.get("id") or prod.get("@id") or prod.get("slug") or name[:40])

            pack_qty = _extract_pack_qty(name)
            if not pack_qty:
                return None

            brand, brand_slug = _extract_brand(name)
            diaper_type = _extract_type(name)
            size_label = _extract_size(name)
            w_min, w_max = _extract_weights(name)

            # Image URL
            image_url = None
            if isinstance(prod.get("images"), list) and prod["images"]:
                img = prod["images"][0]
                image_url = img.get("src") or img.get("url") or str(img) if isinstance(img, str) else None
            elif isinstance(prod.get("image"), dict):
                image_url = prod["image"].get("src") or prod["image"].get("url")
            elif isinstance(prod.get("image"), str):
                image_url = prod["image"]

            product_url = prod.get("permalink") or prod.get("link") or prod.get("url")
            if product_url and not product_url.startswith("http"):
                product_url = GOBABY_BASE + product_url

            is_promo = bool(original_bdt)
            discount_pct = round((1 - price_bdt / original_bdt) * 100, 1) if is_promo and original_bdt else None

            return ScrapedDiaper(
                external_id=f"gb-{ext_id}",
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
            logger.debug(f"[gobaby] parse_product error: {e}")
            return None

    async def scrape(self) -> list[ScrapedDiaper]:
        results: list[ScrapedDiaper] = []
        seen_ids: set[str] = set()

        async with httpx.AsyncClient(follow_redirects=True) as client:
            # Try WooCommerce Store API first (public, used by blocks)
            raw = await self._try_woo_store_api(client)
            logger.info(f"[gobaby] Store API: {len(raw)} items")

            if not raw:
                await self.rate_limit(1.0)
                raw = await self._try_woo_rest_api(client)
                logger.info(f"[gobaby] REST API: {len(raw)} items")

            if not raw:
                await self.rate_limit(1.0)
                raw = await self._try_html_category(client)
                logger.info(f"[gobaby] HTML parse: {len(raw)} items")

            for prod in raw:
                result = self._parse_product(prod)
                if result and result.external_id not in seen_ids:
                    results.append(result)
                    seen_ids.add(result.external_id)

        logger.info(f"[gobaby] Scraped {len(results)} valid diaper products")
        return results


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    scraper = GoBabyScraper()
    products = await scraper.scrape()
    if not products:
        logger.warning("No products — GoBaby may need manual API inspection")
        return
    scraper.upsert_to_db(products)
    print(f"Done: {len(products)} products from GoBaby")


if __name__ == "__main__":
    asyncio.run(main())
