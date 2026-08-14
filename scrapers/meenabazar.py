"""Meena Bazar diaper scraper — proven API from Kombeshi.

Uses mbonlineapi.com/api/front/product/category/<slug> POST pagination.
No login, no cookies, no CAPTCHA.
"""
import asyncio
import logging
import re
import sys

import httpx

from base import BaseScraper, ScrapedDiaper, is_diaper_name
from brands import extract_brand

logger = logging.getLogger(__name__)

API = "https://mbonlineapi.com/api/front/product/category"
HEADERS = {
    "Origin": "https://meenabazaronline.com",
    "Referer": "https://meenabazaronline.com/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/147 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json",
}

S3_PREFIX = "https://s3-ap-southeast-1.amazonaws.com/com.meenabazaronline.v1.01/"
PAGE_SIZE = 100

# Baby Products = SubCategoryId 145 under "household" slug
# Also Adult Diaper = SubCategoryId 143
BABY_SUBCATEGORY_IDS = [145, 143]


def _extract_type(name: str) -> str:
    return "pants" if "pant" in name.lower() else "belt"


def _extract_size(name: str) -> str | None:
    n = name.lower()
    if "new born" in n or "newborn" in n:
        return "Newborn"
    m = re.search(r"\b(xxl|xl|large|medium|small|[sml])\b", n)
    if m:
        s = m.group(1).upper()
        return {"LARGE": "L", "MEDIUM": "M", "SMALL": "S"}.get(s, s)
    return None


def _extract_pack_qty(name: str) -> int | None:
    # Match "40pcs", "40p", "40Pcs", "40 pcs", etc.
    m = re.search(r"(\d+)\s*(?:pcs|p)\b", name.lower())
    return int(m.group(1)) if m else None


def _extract_weights(name: str) -> tuple[float | None, float | None]:
    m = re.search(r"(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*kg", name.lower())
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r"up\s+to\s+(\d+(?:\.\d+)?)\s*kg", name.lower())
    if m:
        return None, float(m.group(1))
    m = re.search(r"(\d+)\+?\s*kg", name.lower())
    if m:
        return float(m.group(1)), None
    return None, None


def _is_diaper(name: str) -> bool:
    return is_diaper_name(name)


def _post_page(client: httpx.Client, subcat_id: int, start: int) -> list[dict]:
    """Fetch products from a subcategory under 'household'."""
    body = {
        "StartSl": start,
        "NoOfItem": PAGE_SIZE,
        "SearchSlug": "household",
        "CategoryId": [],
        "ThumbSize": "lg",
        "SubUnitId": 2,
        "AreaId": None,
        "BrandId": [],
        "SearchType": "C",
        "SubCategoryId": [subcat_id],
    }
    try:
        r = client.post(f"{API}/household", json=body, headers=HEADERS, timeout=30)
        if r.status_code not in (200, 201):
            return []
        j = r.json()
        data = j.get("data") or {}
        if isinstance(data, list):
            return data
        return data.get("Category") or []
    except Exception as e:
        logger.warning(f"[meenabazar] POST subcat={subcat_id} start={start}: {e}")
        return []


class MeenaBazarScraper(BaseScraper):
    store_slug = "meenabazar"
    store_name = "Meena Bazar"

    async def scrape(self) -> list[ScrapedDiaper]:
        results: list[ScrapedDiaper] = []
        seen_ids: set[str] = set()

        with httpx.Client(follow_redirects=True) as client:
            # Browse Baby Products (145) and Adult Diaper (143) subcategories
            for subcat_id in BABY_SUBCATEGORY_IDS:
                start = 1
                pages = 0
                while pages < 10:
                    batch = _post_page(client, subcat_id, start)
                    if not batch:
                        break

                    for raw in batch:
                        p = self._parse_product(raw)
                        if p and p.external_id not in seen_ids:
                            results.append(p)
                            seen_ids.add(p.external_id)

                    if len(batch) < PAGE_SIZE:
                        break
                    start += PAGE_SIZE
                    pages += 1
                    await asyncio.sleep(0.3)

                logger.info(f"[meenabazar] subcat={subcat_id}: found {len(results)} diapers so far")

        logger.info(f"[meenabazar] Scraped {len(results)} diaper products")
        return results

    def _parse_product(self, raw: dict) -> ScrapedDiaper | None:
        try:
            name = (raw.get("ItemDisplayName") or "").strip()
            if not name or not _is_diaper(name):
                return None

            sale = raw.get("DiscountSalesPrice")
            regular = raw.get("UnitSalesPrice")
            price_val = sale if (sale is not None and sale > 0) else regular
            if price_val is None:
                return None
            price_bdt = float(price_val)
            if price_bdt <= 0:
                return None

            item_id = str(raw.get("ItemId") or raw.get("ItemSlug") or "")
            if not item_id:
                return None

            pack_qty = _extract_pack_qty(name)
            if not pack_qty or pack_qty <= 0:
                return None

            brand_result = extract_brand(name)
            if not brand_result:
                return None
            brand, brand_slug = brand_result
            w_min, w_max = _extract_weights(name)

            image = raw.get("ImageUrl") or ""
            if image and not image.startswith("http"):
                image = S3_PREFIX + image.lstrip("/")

            original = float(regular) if regular and float(regular) > price_bdt else None
            discount = raw.get("DisPercent")

            return ScrapedDiaper(
                external_id=f"mb-{item_id}",
                brand=brand, brand_slug=brand_slug,
                type=_extract_type(name),
                size_label=_extract_size(name),
                weight_min_kg=w_min, weight_max_kg=w_max,
                pack_qty=pack_qty,
                image_url=image or None,
                product_url=f"https://meenabazaronline.com/product/{raw.get('ItemSlug', '')}",
                price_bdt=price_bdt,
                original_price_bdt=original,
                discount_pct=float(discount) if discount else None,
                is_promotion=bool(original or discount),
            )
        except Exception as e:
            logger.warning(f"[meenabazar] parse: {e}")
            return None


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    s = MeenaBazarScraper()
    products = await s.scrape()
    if products:
        s.upsert_to_db(products)
    print(f"Done: {len(products)} from Meena Bazar")


if __name__ == "__main__":
    asyncio.run(main())
