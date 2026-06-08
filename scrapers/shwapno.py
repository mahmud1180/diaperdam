"""Shwapno diaper scraper — proven API from Kombeshi.

Strategy (from Kombeshi catalog_shwapno.py):
1. Fetch slug page HTML to extract the Mongo ObjectId.
2. Call /api/category/products?id=<id>&pageNumber=N to paginate.
3. Filter for diaper products only.
"""
import asyncio
import logging
import re
import sys

import httpx

from base import BaseScraper, ScrapedDiaper

logger = logging.getLogger(__name__)

BASE = "https://www.shwapno.com"
HEADERS_HTML = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/147 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}
HEADERS_JSON = {
    "User-Agent": HEADERS_HTML["User-Agent"],
    "Accept": "application/json",
}

# Try these slugs to find the diaper category
SLUGS = ["baby-diapers", "diapers", "baby-care", "diaper", "baby-diaper"]

_ID_RE = re.compile(r"[?&]id=([a-f0-9]{24})")
_HEX_ID = re.compile(r"[a-f0-9]{24}")

BRAND_SLUG_MAP = {
    "huggies": "huggies", "mamypoko": "mamypoko", "mamy poko": "mamypoko",
    "molfix": "molfix", "pampers": "pampers", "neocare": "neocare",
    "bashundhara": "bashundhara", "diapant": "bashundhara", "avonee": "avonee",
    "supermom": "supermom", "savlon": "savlon", "twinkle": "savlon",
    "smc smile": "smc-smile", "smile": "smc-smile",
}


def _extract_brand(name: str) -> tuple[str, str]:
    n = name.lower()
    for keyword, slug in BRAND_SLUG_MAP.items():
        if keyword in n:
            display = {"mamypoko": "MamyPoko", "huggies": "Huggies", "molfix": "Molfix",
                       "pampers": "Pampers", "neocare": "Neocare", "bashundhara": "Bashundhara",
                       "savlon": "Savlon", "avonee": "Avonee", "supermom": "Supermom"}.get(slug, keyword.title())
            return display, slug
    first = name.split()[0]
    return first, first.lower().replace(" ", "-")


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
    m = re.search(r"(\d+)\s*pcs", name.lower())
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
    n = name.lower()
    return any(w in n for w in ["diaper", "diapers", "diapant", "nappy", "nappies"])


def _extract_category_id(client: httpx.Client, slug: str) -> str | None:
    try:
        r = client.get(f"{BASE}/{slug}", headers=HEADERS_HTML, timeout=20)
        if r.status_code != 200:
            return None
        m = _ID_RE.search(r.text)
        if m:
            return m.group(1)
        slug_idx = r.text.find(slug)
        if slug_idx > 0:
            window = r.text[max(0, slug_idx - 3000):slug_idx + 5000]
            for cand in _HEX_ID.findall(window):
                if cand.startswith(("65", "66", "67", "68")):
                    return cand
    except Exception as e:
        logger.warning(f"[shwapno] category id for {slug}: {e}")
    return None


class ShwapnoScraper(BaseScraper):
    store_slug = "shwapno"
    store_name = "Shwapno"

    async def scrape(self) -> list[ScrapedDiaper]:
        results: list[ScrapedDiaper] = []
        seen_ids: set[str] = set()

        with httpx.Client(follow_redirects=True) as client:
            for slug in SLUGS:
                cat_id = _extract_category_id(client, slug)
                if not cat_id:
                    logger.info(f"[shwapno] No category ID for /{slug}")
                    continue

                logger.info(f"[shwapno] Found category {cat_id} for /{slug}")
                page = 1
                while page <= 20:
                    url = f"{BASE}/api/category/products?id={cat_id}&pageNumber={page}"
                    try:
                        r = client.get(url, headers=HEADERS_JSON, timeout=20)
                        if r.status_code != 200:
                            break
                        data = r.json()
                    except Exception as e:
                        logger.warning(f"[shwapno] page {page}: {e}")
                        break

                    batch = data.get("products") or []
                    if not batch:
                        break

                    for raw in batch:
                        p = self._parse_product(raw)
                        if p and p.external_id not in seen_ids:
                            results.append(p)
                            seen_ids.add(p.external_id)

                    if not data.get("hasNextPage"):
                        break
                    page += 1
                    await asyncio.sleep(0.3)

                if results:
                    break

        logger.info(f"[shwapno] Scraped {len(results)} diaper products")
        return results

    def _parse_product(self, raw: dict) -> ScrapedDiaper | None:
        try:
            name = (raw.get("name") or "").strip()
            if not name or not _is_diaper(name):
                return None

            price_obj = raw.get("price") or {}
            price_val = price_obj.get("priceValue")
            if price_val is None:
                return None
            price_bdt = float(price_val)
            if price_bdt <= 0:
                return None

            sename = raw.get("seName") or str(raw.get("id", ""))
            if not sename:
                return None

            pack_qty = _extract_pack_qty(name)
            if not pack_qty or pack_qty <= 0:
                return None

            brand, brand_slug = _extract_brand(name)
            w_min, w_max = _extract_weights(name)

            img = None
            pic = raw.get("picture") or {}
            large = pic.get("largeDeviceUrl") or {}
            img = large.get("fullSizeImageUrl") or large.get("imageUrl")

            old_price = (raw.get("productPrice") or {}).get("oldPrice")
            original = float(old_price) if old_price and float(old_price) > price_bdt else None

            return ScrapedDiaper(
                external_id=f"sw-{sename}",
                brand=brand, brand_slug=brand_slug,
                type=_extract_type(name),
                size_label=_extract_size(name),
                weight_min_kg=w_min, weight_max_kg=w_max,
                pack_qty=pack_qty, image_url=img,
                product_url=f"{BASE}/{sename}",
                price_bdt=price_bdt,
                original_price_bdt=original,
                is_promotion=bool(original),
            )
        except Exception as e:
            logger.warning(f"[shwapno] parse: {e}")
            return None


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    s = ShwapnoScraper()
    products = await s.scrape()
    if products:
        s.upsert_to_db(products)
    print(f"Done: {len(products)} from Shwapno")


if __name__ == "__main__":
    asyncio.run(main())
