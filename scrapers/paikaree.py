"""Paikaree scraper for DiaperDam.

Paikaree (paikaree.com.bd) is a BD baby/mom products store.
Strong on programmatic size pages:
  /baby-diapers-shop-in-bd
  /newborn-diaper-in-bd
  /medium-5-12kg-diaper-in-bd
  /large-size-diaper-9-16kg--in-bd

Strategy:
1. Try WooCommerce Store API (/wp-json/wc/store/v1/products)
2. Try each size category URL with __NEXT_DATA__
3. HTML parsing with ld+json fallback
"""
import asyncio
import json
import logging
import re
import sys

import httpx

from base import BaseScraper, ScrapedDiaper

logger = logging.getLogger(__name__)

PAIKAREE_BASE = "https://paikaree.com.bd"

# Size pages → (size_label, w_min, w_max)
SIZE_PAGES = [
    ("/newborn-diaper-in-bd",               "Newborn", 0.0,  5.0),
    ("/baby-diapers-shop-in-bd",             None,      None, None),
    ("/medium-5-12kg-diaper-in-bd",          "M",       5.0,  12.0),
    ("/large-size-diaper-9-16kg--in-bd",     "L",       9.0,  16.0),
]

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
    "lifree": "lifree",
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
                "mumlove": "Mumlove", "momotaro": "Momotaro", "lifree": "Lifree",
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
    if "new born" in n or "newborn" in n or "(nb)" in n or " nb " in n:
        return "Newborn"
    m = re.search(r"\b(xxl|xl|large|medium|small)\b", n)
    if m:
        return {"large": "L", "medium": "M", "small": "S", "xl": "XL", "xxl": "XXL"}.get(m.group(1), m.group(1).upper())
    m = re.search(r"\b([sml])\b", n)
    if m:
        return m.group(1).upper()
    return None


def _extract_pack_qty(name: str) -> int | None:
    for pattern in [r"(\d+)\s*pcs", r"(\d+)\s*pieces?", r"pack\s+of\s+(\d+)", r"-\s*(\d+)\s*$", r"\((\d+)\)"]:
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
        # Remove any HTML
        s = re.sub(r"<[^>]+>", "", s)
        v = float(s)
        return v if v > 0 else None
    except Exception:
        return None


class PaikareeScraper(BaseScraper):
    store_slug = "paikaree"
    store_name = "Paikaree"

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        "Accept": "application/json, text/html, */*",
        "Accept-Language": "en-US,en;q=0.9",
    }

    async def _try_woo_store_api(self, client: httpx.AsyncClient) -> list[dict]:
        """WooCommerce Block Store API — no auth needed."""
        products = []
        cat_slugs = ["baby-diaper", "baby-diapers", "diaper"]
        for cat_slug in cat_slugs:
            page = 1
            while page <= 6:
                url = f"{PAIKAREE_BASE}/wp-json/wc/store/v1/products?category={cat_slug}&per_page=50&page={page}"
                try:
                    r = await client.get(url, headers=self.HEADERS, timeout=15)
                    if r.status_code in (404, 400):
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
                    await self.rate_limit(1.0)
                except Exception as e:
                    logger.debug(f"[paikaree] WooStore API failed for {cat_slug} p{page}: {e}")
                    break
            if products:
                break
        return products

    async def _try_page_scrape(self, client: httpx.AsyncClient) -> list[tuple[dict, str | None]]:
        """Scrape each size page, return (product_dict, size_label_hint) tuples."""
        results = []
        for path, size_hint, _, __ in SIZE_PAGES:
            url = f"{PAIKAREE_BASE}{path}"
            try:
                r = await client.get(url, headers=self.HEADERS, timeout=20)
                r.raise_for_status()

                # Try ld+json products
                ld_blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', r.text, re.DOTALL)
                for block in ld_blocks:
                    try:
                        ld = json.loads(block)
                        items = []
                        if isinstance(ld, list):
                            items = [x for x in ld if x.get("@type") == "Product"]
                        elif ld.get("@type") == "Product":
                            items = [ld]
                        elif ld.get("@type") == "ItemList":
                            items = [e.get("item", {}) for e in ld.get("itemListElement", [])]
                        for item in items:
                            results.append((item, size_hint))
                    except Exception:
                        pass

                # WooCommerce inline JSON blocks
                for pattern in [
                    r'"products"\s*:\s*(\[.*?\])',
                    r'"blockProducts"\s*:\s*(\[.*?\])',
                ]:
                    m = re.search(pattern, r.text, re.DOTALL)
                    if m:
                        try:
                            items = json.loads(m.group(1))
                            for item in items:
                                results.append((item, size_hint))
                        except Exception:
                            pass

                await self.rate_limit(1.5)
            except Exception as e:
                logger.debug(f"[paikaree] Page scrape error {path}: {e}")
        return results

    def _parse_product(self, prod: dict, size_hint: str | None = None) -> ScrapedDiaper | None:
        try:
            name = (
                prod.get("name") or prod.get("title") or prod.get("productName") or ""
            )
            if isinstance(name, dict):
                name = name.get("rendered", "")
            name = str(name).strip()
            if not name:
                return None
            if not any(k in name.lower() for k in ["diaper", "pamper", "pant", "nappy"]):
                return None

            price = (
                prod.get("price") or prod.get("sale_price") or prod.get("regular_price")
                or (prod.get("offers", {}).get("price") if isinstance(prod.get("offers"), dict) else None)
                or (prod.get("offers", [{}])[0].get("price") if isinstance(prod.get("offers"), list) else None)
            )
            price_bdt = _clean_price(price)
            if not price_bdt:
                return None

            original = prod.get("regular_price") or (
                prod.get("offers", [{}])[0].get("price") if isinstance(prod.get("offers"), list) and len(prod.get("offers", [])) > 1 else None
            )
            original_bdt = _clean_price(original) if original else None
            if original_bdt and original_bdt <= price_bdt:
                original_bdt = None

            ext_id = str(prod.get("id") or prod.get("@id") or prod.get("slug") or name[:40])

            pack_qty = _extract_pack_qty(name)
            if not pack_qty:
                return None

            brand, brand_slug = _extract_brand(name)
            # Skip adult/non-baby diapers
            if "adult" in name.lower() and brand_slug == "lifree":
                return None

            diaper_type = _extract_type(name)
            size_label = size_hint or _extract_size(name)
            w_min, w_max = _extract_weights(name)

            image_url = None
            if isinstance(prod.get("images"), list) and prod["images"]:
                img = prod["images"][0]
                image_url = img.get("src") or img.get("url") if isinstance(img, dict) else str(img)
            elif isinstance(prod.get("image"), dict):
                image_url = prod["image"].get("src") or prod["image"].get("url")
            elif isinstance(prod.get("image"), str):
                image_url = prod["image"]

            product_url = prod.get("permalink") or prod.get("url") or prod.get("link")
            if product_url and not product_url.startswith("http"):
                product_url = PAIKAREE_BASE + product_url

            is_promo = bool(original_bdt)
            discount_pct = round((1 - price_bdt / original_bdt) * 100, 1) if is_promo and original_bdt else None

            return ScrapedDiaper(
                external_id=f"pk-{ext_id}",
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
            logger.debug(f"[paikaree] parse_product error: {e}")
            return None

    async def scrape(self) -> list[ScrapedDiaper]:
        results: list[ScrapedDiaper] = []
        seen_ids: set[str] = set()

        async with httpx.AsyncClient(follow_redirects=True) as client:
            # Try WooCommerce Store API first
            raw_woo = await self._try_woo_store_api(client)
            logger.info(f"[paikaree] WooStore API: {len(raw_woo)} items")

            if raw_woo:
                for prod in raw_woo:
                    result = self._parse_product(prod)
                    if result and result.external_id not in seen_ids:
                        results.append(result)
                        seen_ids.add(result.external_id)
            else:
                # Fall back to page scraping
                await self.rate_limit(1.0)
                raw_pages = await self._try_page_scrape(client)
                logger.info(f"[paikaree] Page scrape: {len(raw_pages)} items")
                for prod, size_hint in raw_pages:
                    result = self._parse_product(prod, size_hint)
                    if result and result.external_id not in seen_ids:
                        results.append(result)
                        seen_ids.add(result.external_id)

        logger.info(f"[paikaree] Scraped {len(results)} valid diaper products")
        return results


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    scraper = PaikareeScraper()
    products = await scraper.scrape()
    if not products:
        logger.warning("No products — Paikaree may need manual API inspection")
        return
    scraper.upsert_to_db(products)
    print(f"Done: {len(products)} products from Paikaree")


if __name__ == "__main__":
    asyncio.run(main())
