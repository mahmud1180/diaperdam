"""Chaldal diaper scraper — proven API from Kombeshi.

Uses catalog.chaldal.com/searchOld with paginated search for 'diaper'.
"""
import asyncio
import logging
import re
import sys

import httpx

from base import BaseScraper, ScrapedDiaper

logger = logging.getLogger(__name__)

API_URL = "https://catalog.chaldal.com/searchOld"
API_KEY = "e964fc2d51064efa97e94db7c64bf3d044279d4ed0ad4bdd9dce89fecc9156f0"
HEADERS = {
    "Origin": "https://chaldal.com",
    "Referer": "https://chaldal.com/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36",
    "Accept": "application/json",
}

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

DIAPER_KEYWORDS = [
    "diaper",
    "huggies",
    "mamypoko",
    "molfix diaper",
    "pampers",
    "neocare diaper",
    "bashundhara diaper",
    "avonee",
    "supermom diaper",
]


def _extract_brand(name: str) -> tuple[str, str]:
    name_lower = name.lower()
    for keyword, slug in BRAND_SLUG_MAP.items():
        if keyword in name_lower:
            display = {
                "mamypoko": "MamyPoko", "huggies": "Huggies", "molfix": "Molfix",
                "pampers": "Pampers", "neocare": "Neocare", "bashundhara": "Bashundhara",
                "savlon": "Savlon", "avonee": "Avonee", "supermom": "Supermom",
                "smc-smile": "SMC Smile", "aiwibi": "Aiwibi",
            }.get(slug, keyword.title())
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
    """Filter to only actual diaper products."""
    n = name.lower()
    diaper_words = ["diaper", "diapers", "diapant", "pant", "nappy", "nappies"]
    return any(w in n for w in diaper_words)


def _fetch_page(client: httpx.Client, query: str, page: int, page_size: int = 50) -> dict:
    body = {
        "apiKey": API_KEY,
        "storeId": 1,
        "warehouseId": 8,
        "pageSize": page_size,
        "currentPageIndex": page,
        "metropolitanAreaId": 1,
        "query": query,
        "productVariantId": -1,
        "canSeeOutOfStock": "false",
        "filters": [],
        "maxOutOfStockCount": {"case": "Some", "fields": [5]},
        "shouldShowAlternateProductsForOutOfStockItems": {"case": "Some", "fields": [True]},
    }
    r = client.post(API_URL, json=body, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.json()


class ChaldalScraper(BaseScraper):
    store_slug = "chaldal"
    store_name = "Chaldal"

    async def scrape(self) -> list[ScrapedDiaper]:
        results: list[ScrapedDiaper] = []
        seen_ids: set[str] = set()

        with httpx.Client(follow_redirects=True) as client:
            for query in DIAPER_KEYWORDS:
                logger.info(f"[chaldal] Searching: {query}")
                try:
                    data = _fetch_page(client, query, 0)
                except Exception as e:
                    logger.warning(f"[chaldal] search '{query}' failed: {e}")
                    continue

                hits = data.get("hits", [])
                total_pages = data.get("nbPages", 1)
                logger.info(f"[chaldal] '{query}': {data.get('nbHits', 0)} hits, {total_pages} pages")

                for hit in hits:
                    p = self._parse_hit(hit)
                    if p and p.external_id not in seen_ids:
                        results.append(p)
                        seen_ids.add(p.external_id)

                # Fetch additional pages (up to 5)
                for page in range(1, min(total_pages, 5)):
                    try:
                        data = _fetch_page(client, query, page)
                        for hit in data.get("hits", []):
                            p = self._parse_hit(hit)
                            if p and p.external_id not in seen_ids:
                                results.append(p)
                                seen_ids.add(p.external_id)
                    except Exception as e:
                        logger.warning(f"[chaldal] page {page} of '{query}' error: {e}")
                    await asyncio.sleep(0.3)

                await asyncio.sleep(0.5)

        logger.info(f"[chaldal] Scraped {len(results)} diaper products total")
        return results

    def _parse_hit(self, hit: dict) -> ScrapedDiaper | None:
        try:
            name = (hit.get("name") or "").strip()
            if not name or not _is_diaper(name):
                return None

            price = hit.get("price")
            if not price or float(price) <= 0:
                return None
            price_bdt = float(price)

            slug = hit.get("slug") or str(hit.get("id", ""))
            if not slug:
                return None

            pack_qty = _extract_pack_qty(name)
            # Try subText for pack count
            if not pack_qty:
                sub = hit.get("subText") or ""
                m = re.search(r"(\d+)\s*pcs", sub.lower())
                if m:
                    pack_qty = int(m.group(1))
            if not pack_qty or pack_qty <= 0:
                return None

            brand, brand_slug = _extract_brand(name)
            diaper_type = _extract_type(name)
            size_label = _extract_size(name)
            w_min, w_max = _extract_weights(name)

            # Image
            pics = hit.get("picturesUrls") or []
            image_url = None
            if pics:
                p = pics[0]
                image_url = p if p.startswith("http") else f"https://chaldal.com{p}"

            product_url = f"https://chaldal.com/{slug}"

            # Promo
            mrp = hit.get("mrp")
            original_price = float(mrp) if mrp and float(mrp) > price_bdt else None
            is_promo = bool(original_price)
            discount_pct = None
            if is_promo and original_price:
                discount_pct = round((1 - price_bdt / original_price) * 100, 1)

            return ScrapedDiaper(
                external_id=slug,
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
                price_bdt=price_bdt,
                original_price_bdt=original_price,
                discount_pct=discount_pct,
                is_promotion=is_promo,
            )
        except Exception as e:
            logger.warning(f"[chaldal] parse error: {e}")
            return None


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    scraper = ChaldalScraper()
    products = await scraper.scrape()
    if not products:
        logger.error("No products scraped")
        sys.exit(1)
    scraper.upsert_to_db(products)
    print(f"Done: {len(products)} diaper products from Chaldal")


if __name__ == "__main__":
    asyncio.run(main())
