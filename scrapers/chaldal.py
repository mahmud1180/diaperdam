"""Chaldal scraper for DiaperDam.

Chaldal uses clean URL slugs:
  /brand-name-size-label-Xkg-Ypcs
  e.g. /huggies-dry-baby-diaper-belt-new-born-up-to-5-kg-64-pcs

Category pages:
  /diapers           → all diapers (size chips)
  /newborn-2         → NB
  /small-2           → S
  /medium-2          → M
  /large-2           → L  (there may be /large-3, /large-4 etc. per category)
  /extra-large-...   → XL

Strategy: hit each size category page, parse product grid JSON from
the embedded __NEXT_DATA__ script tag (Chaldal is Next.js), extract
price + qty + image from structured data.
"""
import asyncio
import json
import logging
import re
import sys

import httpx

from base import BaseScraper, ScrapedDiaper

logger = logging.getLogger(__name__)

CHALDAL_BASE = "https://chaldal.com"

# Size category slugs → normalized size labels + weight ranges
SIZE_CATEGORIES = [
    ("/newborn-2",    "Newborn", 2.0,  5.0),
    ("/small-2",      "S",       3.0,  7.0),
    ("/medium-2",     "M",       5.0, 13.0),
    ("/large-2",      "L",      10.0, 16.0),
    ("/extra-large-15-kg-diapers", "XL", 15.0, None),
]

# Also scrape the flat /diapers page for anything the size pages miss
DIAPER_CATEGORY = "/diapers"

BRAND_SLUG_MAP = {
    "huggies":       "huggies",
    "mamypoko":      "mamypoko",
    "mamy poko":     "mamypoko",
    "molfix":        "molfix",
    "pampers":       "pampers",
    "neocare":       "neocare",
    "neo care":      "neocare",
    "bashundhara":   "bashundhara",
    "diapant":       "bashundhara",
    "avonee":        "avonee",
    "supermom":      "supermom",
    "smc smile":     "smc-smile",
    "smile":         "smc-smile",
    "molfix":        "molfix",
    "aiwibi":        "aiwibi",
    "savlon":        "savlon",
    "twinkle":       "savlon",
    "happy nappy":   "happy-nappy",
    "mumlove":       "mumlove",
    "kidz":          "kidz",
    "thai":          "thai",
}

def _extract_brand(name: str) -> tuple[str, str]:
    """Return (brand_display, brand_slug) from a product name."""
    name_lower = name.lower()
    for keyword, slug in BRAND_SLUG_MAP.items():
        if keyword in name_lower:
            display = keyword.title().replace("-", " ")
            # Special cases
            if slug == "mamypoko":
                display = "MamyPoko"
            elif slug == "huggies":
                display = "Huggies"
            elif slug == "molfix":
                display = "Molfix"
            elif slug == "pampers":
                display = "Pampers"
            elif slug == "neocare":
                display = "Neocare"
            elif slug == "bashundhara":
                display = "Bashundhara"
            elif slug == "savlon":
                display = "Savlon"
            return display, slug
    # Fallback: first word
    first = name.split()[0]
    return first, first.lower().replace(" ", "-")


def _extract_type(name: str) -> str:
    """Extract 'belt', 'pants', or 'swim' from product name."""
    n = name.lower()
    if "pant" in n:
        return "pants"
    if "swim" in n:
        return "swim"
    return "belt"


def _extract_size(name: str) -> str | None:
    """Extract size label from name if not already known."""
    n = name.lower()
    if "new born" in n or "newborn" in n or "nb" in n:
        return "Newborn"
    m = re.search(r"\b(xxl|xl|large|medium|small|[smlx]+)\b", n)
    if m:
        s = m.group(1).upper()
        return {"LARGE": "L", "MEDIUM": "M", "SMALL": "S"}.get(s, s)
    return None


def _extract_pack_qty(name: str) -> int | None:
    """Extract pack count from name like '64 pcs', '52 pcs'."""
    m = re.search(r"(\d+)\s*pcs", name.lower())
    return int(m.group(1)) if m else None


def _extract_weights(name: str) -> tuple[float | None, float | None]:
    """Extract (min_kg, max_kg) from '4-8 kg' or 'up to 5 kg'."""
    # Range: '4-8 kg' or '4-8kg'
    m = re.search(r"(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*kg", name.lower())
    if m:
        return float(m.group(1)), float(m.group(2))
    # Upper only: 'up to 5 kg'
    m = re.search(r"up\s+to\s+(\d+(?:\.\d+)?)\s*kg", name.lower())
    if m:
        return None, float(m.group(1))
    # Single: '15+ kg'
    m = re.search(r"(\d+)\+\s*kg", name.lower())
    if m:
        return float(m.group(1)), None
    return None, None


class ChaldalScraper(BaseScraper):
    store_slug = "chaldal"
    store_name = "Chaldal"

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        "Accept": "application/json, text/html, */*",
        "Accept-Language": "en-US,en;q=0.9",
    }

    async def _fetch_category(self, client: httpx.AsyncClient, path: str) -> list[dict]:
        """Fetch a Chaldal category page, extract products from __NEXT_DATA__."""
        url = f"{CHALDAL_BASE}{path}"
        try:
            r = await client.get(url, headers=self.HEADERS, timeout=20)
            r.raise_for_status()
        except Exception as e:
            logger.warning(f"[chaldal] Failed to fetch {path}: {e}")
            return []

        # Extract __NEXT_DATA__ JSON
        m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', r.text, re.DOTALL)
        if not m:
            logger.warning(f"[chaldal] No __NEXT_DATA__ on {path}")
            return []

        try:
            data = json.loads(m.group(1))
        except json.JSONDecodeError:
            logger.warning(f"[chaldal] JSON parse error on {path}")
            return []

        # Navigate to product list — path varies by page type
        products = []
        try:
            # Category pages: pageProps.products or pageProps.initialData.products
            props = data.get("props", {}).get("pageProps", {})
            candidates = (
                props.get("products")
                or props.get("initialData", {}).get("products")
                or props.get("data", {}).get("products")
                or []
            )
            if isinstance(candidates, list):
                products = candidates
        except Exception as e:
            logger.warning(f"[chaldal] Could not navigate __NEXT_DATA__ on {path}: {e}")

        return products

    async def scrape(self) -> list[ScrapedDiaper]:
        results: list[ScrapedDiaper] = []
        seen_ids: set[str] = set()

        async with httpx.AsyncClient(follow_redirects=True) as client:
            # Hit all size category pages
            for path, size_label, w_min, w_max in SIZE_CATEGORIES:
                logger.info(f"[chaldal] Scraping {path}")
                raw_products = await self._fetch_category(client, path)

                for prod in raw_products:
                    result = self._parse_product(prod, size_label, w_min, w_max)
                    if result and result.external_id not in seen_ids:
                        results.append(result)
                        seen_ids.add(result.external_id)

                await self.rate_limit(1.5)

            # Also hit main /diapers page to catch anything missed
            raw_products = await self._fetch_category(client, DIAPER_CATEGORY)
            for prod in raw_products:
                result = self._parse_product(prod, None, None, None)
                if result and result.external_id not in seen_ids:
                    results.append(result)
                    seen_ids.add(result.external_id)

        logger.info(f"[chaldal] Scraped {len(results)} products total")
        return results

    def _parse_product(
        self,
        prod: dict,
        size_label_hint: str | None,
        w_min_hint: float | None,
        w_max_hint: float | None,
    ) -> ScrapedDiaper | None:
        try:
            name = prod.get("name") or prod.get("productName") or ""
            if not name:
                return None

            # Price — Chaldal uses integer paise or float BDT
            price = prod.get("price") or prod.get("currentPrice")
            if price is None:
                return None
            price_bdt = float(price)
            if price_bdt <= 0:
                return None

            original_price = prod.get("originalPrice") or prod.get("mrp")
            if original_price:
                original_price = float(original_price)
                if original_price <= price_bdt:
                    original_price = None

            # External ID — prefer slug, fall back to id field
            slug = prod.get("slug") or prod.get("productSlug") or str(prod.get("id", ""))
            if not slug:
                return None

            # Pack quantity from name
            pack_qty = _extract_pack_qty(name)
            if not pack_qty:
                # Try from product data
                pack_qty = prod.get("quantity") or prod.get("packSize")
                if pack_qty:
                    pack_qty = int(pack_qty)
            if not pack_qty or pack_qty <= 0:
                return None  # Can't compute ৳/piece without qty

            brand, brand_slug = _extract_brand(name)
            diaper_type = _extract_type(name)
            size_label = size_label_hint or _extract_size(name)
            w_min, w_max = _extract_weights(name)
            if w_min_hint is not None:
                w_min = w_min_hint
            if w_max_hint is not None:
                w_max = w_max_hint

            image_url = (
                prod.get("imageUrl")
                or prod.get("imageUrls", [None])[0]
                or prod.get("image")
            )
            product_url = f"{CHALDAL_BASE}/{slug}"

            # Promotion
            is_promo = bool(original_price and original_price > price_bdt)
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
            logger.warning(f"[chaldal] parse error: {e} — {prod}")
            return None


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    scraper = ChaldalScraper()
    products = await scraper.scrape()
    if not products:
        logger.error("No products scraped — check __NEXT_DATA__ structure or category paths")
        sys.exit(1)
    scraper.upsert_to_db(products)
    print(f"Done: {len(products)} products from Chaldal")


if __name__ == "__main__":
    asyncio.run(main())
