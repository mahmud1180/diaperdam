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

from base import BaseScraper, ScrapedDiaper, extract_combined_pack_qty, is_diaper_name
from brands import extract_brand

logger = logging.getLogger(__name__)

BASE = "https://www.shwapno.com"
HEADERS_HTML = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/147 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7",
}
HEADERS_JSON = {
    "User-Agent": HEADERS_HTML["User-Agent"],
    "Accept": "application/json",
    "Accept-Language": "bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7",
}

# Category slugs and their known Mongo ObjectIds (hardcoded fallback for CI)
SLUG_IDS = {
    "baby-diapers": "65ed45e1e429af37f903adfc",
    "diaper": "66d591dd1a7714ddf895a637",
}
SLUGS = list(SLUG_IDS.keys())

# Search covers what the shrunken category endpoints no longer list. Brand
# terms are included because a plain "diaper" search caps out at ~82 hits.
SEARCH_QUERIES = [
    "diaper", "pants diaper", "huggies", "mamypoko", "pampers",
    "molfix", "neocare", "supermom", "savlon", "avonee",
]

_ID_RE = re.compile(r"[?&]id=([a-f0-9]{24})")
_HEX_ID = re.compile(r"[a-f0-9]{24}")


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
    # Bonus/tolerance notations first ("30(+)10Pcs", "32(±)2Pcs") — the plain
    # regex below would otherwise return the bonus number as the pack size.
    combined = extract_combined_pack_qty(name)
    if combined:
        return combined
    # Match "40Pcs", "40pcs", "40p", and Shwapno's "4Pants" count style —
    # "pants"/"pant" must be tried before the bare "p" alt or that alt
    # would need a word boundary right after the "p" and never match.
    m = re.search(r"(\d+)\s*(?:pcs|pants|pant|p)\b", name.lower())
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
    # Shwapno's own diaper-category catalog (verified live 2026-07-24) lists
    # pants-style diapers (Supermom, MamyPoko) without the literal word
    # "diaper" in the name — e.g. "Supermom Super Pants M (6-12kg) 40Pcs".
    # Both category endpoints (/baby-diapers, /diaper) are already scoped to
    # diapers, so "pant(s)" is safe to accept here without a false-positive risk.
    # The search endpoint is NOT scoped, so adult diapers and sanitary products
    # have to be filtered out explicitly.
    return is_diaper_name(name, extra_words=("pant",))


def _extract_category_id(client: httpx.Client, slug: str) -> str | None:
    """Extract category ObjectId from HTML, falling back to hardcoded IDs."""
    try:
        r = client.get(f"{BASE}/{slug}", headers=HEADERS_HTML, timeout=20)
        if r.status_code == 200:
            m = _ID_RE.search(r.text)
            if m:
                return m.group(1)
            slug_idx = r.text.find(slug)
            if slug_idx > 0:
                window = r.text[max(0, slug_idx - 3000):slug_idx + 5000]
                for cand in _HEX_ID.findall(window):
                    if cand.startswith(("65", "66", "67", "68", "69")):
                        return cand
    except Exception as e:
        logger.warning(f"[shwapno] category id for {slug}: {e}")
    # Fallback to hardcoded IDs (CI runners may get different HTML)
    fallback = SLUG_IDS.get(slug)
    if fallback:
        logger.info(f"[shwapno] Using hardcoded category ID for /{slug}")
    return fallback


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

            # Category endpoints only expose a handful of SKUs (4 as of
            # 2026-08-07, down from 28 in July) while site search still returns
            # the full diaper catalogue, so search is the primary source now and
            # the category call is the fallback.
            for query in SEARCH_QUERIES:
                page = 1
                while page <= 5:
                    url = f"{BASE}/api/search?q={query}&pageNumber={page}"
                    try:
                        r = client.get(url, headers=HEADERS_JSON, timeout=20)
                        if r.status_code != 200:
                            break
                        data = r.json()
                    except Exception as e:
                        logger.warning(f"[shwapno] search '{query}' page {page}: {e}")
                        break

                    batch = data.get("products") or []
                    if not batch:
                        break

                    for wrapper in batch:
                        # Search wraps each hit as {"product": {...}}; the
                        # category endpoint returns the product dict directly.
                        raw = wrapper.get("product") or wrapper
                        p = self._parse_product(raw)
                        if p and p.external_id not in seen_ids:
                            results.append(p)
                            seen_ids.add(p.external_id)

                    if page >= (data.get("totalPages") or 1):
                        break
                    page += 1
                    await asyncio.sleep(0.3)

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

            brand_result = extract_brand(name)
            if not brand_result:
                return None
            brand, brand_slug = brand_result
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
