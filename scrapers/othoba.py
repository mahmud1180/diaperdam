"""Othoba diaper scraper.

Othoba runs nopCommerce. Product listings are server-rendered but prices are
NOT: each card ships an empty `<ins id="price_<id>">` that the theme fills from
POST /Catalog/LoadProductInfoByProductId (JSON array of product ids, no
anti-forgery token required). The old scraper looked for prices in the listing
HTML and in a per-page ld+json block that only ever describes the store, which
is why it returned 0 products every day since launch.

Strategy:
1. Paginate the Diapering & Potty category (server-rendered cards -> id, name, url).
2. Fall back to the site-search pages if the category returns nothing.
3. Batch-resolve prices via LoadProductInfoByProductId.
4. Per-product ld+json as the price fallback for ids the batch call misses.
"""
import asyncio
import html
import json
import logging
import re

import httpx

from base import (
    BaseScraper,
    ScrapedDiaper,
    extract_combined_pack_qty,
    is_diaper_name,
    strip_gift_clause,
)
from brands import extract_brand

logger = logging.getLogger(__name__)

BASE = "https://othoba.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
}

CATEGORY_PATH = "/diapering-potty"
PAGE_SIZE = 80
MAX_PAGES = 10
PRICE_ENDPOINT = "/Catalog/LoadProductInfoByProductId"
PRICE_BATCH = 40
# Bounded so a broken batch endpoint can't turn one run into 300 page fetches.
MAX_LD_FALLBACK = 40

# Only used when the category listing comes back empty.
SEARCH_QUERIES = [
    "diaper", "baby diaper", "huggies diaper", "mamypoko",
    "pampers diaper", "molfix", "neocare", "savlon twinkle",
]

# Each card starts at `data-productid=NNN` (quoted on the full page, unquoted in
# the AJAX partial), so split on the attribute and parse the chunks.
_CARD_SPLIT = re.compile(r'data-productid=["\']?(?=\d)')
_CARD_ID = re.compile(r"(\d+)")
_CARD_NAME = re.compile(r'class=["\']?product-name["\']?[^>]*>\s*<a[^>]*>(.*?)</a>', re.I | re.DOTALL)
_CARD_HREF = re.compile(r'href=["\']?(/[^"\'\s>]+)')
_LD_BLOCK = re.compile(r'application/ld\+json[^>]*>(.*?)</script>', re.DOTALL)
_TAGS = re.compile(r"<[^>]+>")

# Cloth/reusable inserts and wipes live in the same category but aren't
# comparable to disposable packs, so they never reach the price step.
_NOT_A_DISPOSABLE = ("cloth", "reusable", "washable", "insert", "wipe", "changing mat", "potty")


def _is_diaper(name: str) -> bool:
    # Checked on the gift-stripped name so a "(Free Wipes)" bundle isn't read
    # as a wipes product.
    if any(w in strip_gift_clause(name) for w in _NOT_A_DISPOSABLE):
        return False
    return is_diaper_name(name)


def _extract_pack_qty(name: str) -> int | None:
    combined = extract_combined_pack_qty(name)
    if combined:
        return combined
    # An explicit unit is required. Othoba's marketplace vendors put loose
    # numbers in titles ("Chu Chu Belt Diaper M 45") that are sometimes the
    # pack count and sometimes not, and a wrong pack size poisons ৳/piece.
    m = re.search(r"(\d+)\s*(?:pcs|pieces|piece|pc)\b", name.lower())
    return int(m.group(1)) if m else None


def _extract_size(name: str) -> str | None:
    n = name.lower()
    if "newborn" in n or "new born" in n:
        return "Newborn"
    # Othoba spells the bigger sizes out ("Extra Large", "Double Extra Large"),
    # and a bare `large` alternative would match those as L.
    if re.search(r"\bdouble\s+extra\s+large\b", n):
        return "XXL"
    if re.search(r"\bextra\s+large\b", n):
        return "XL"
    m = re.search(r"\b(xxxl|xxl|xl|large|medium|small|[sml])\b", n)
    if m:
        s = m.group(1).upper()
        return {"LARGE": "L", "MEDIUM": "M", "SMALL": "S", "XXXL": "XXL"}.get(s, s)
    return None


def _extract_weights(name: str) -> tuple[float | None, float | None]:
    n = name.lower()
    m = re.search(r"(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*kg", n)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r"up\s*to\s*(\d+(?:\.\d+)?)\s*kg", n)
    if m:
        return None, float(m.group(1))
    m = re.search(r"(\d+(?:\.\d+)?)\s*\+\s*kg", n)
    if m:
        return float(m.group(1)), None
    return None, None


def _parse_cards(html_text: str) -> list[tuple[str, str, str | None]]:
    """(product_id, name, url) for every product card in a listing page."""
    cards: list[tuple[str, str, str | None]] = []
    for chunk in _CARD_SPLIT.split(html_text)[1:]:
        m = _CARD_ID.match(chunk)
        nm = _CARD_NAME.search(chunk)
        if not m or not nm:
            continue
        name = html.unescape(_TAGS.sub("", nm.group(1))).strip()
        if not name:
            continue
        href = _CARD_HREF.search(chunk)
        cards.append((m.group(1), name, href.group(1) if href else None))
    return cards


class OthobaScraper(BaseScraper):
    store_slug = "othoba"
    store_name = "Othoba"

    async def scrape(self) -> list[ScrapedDiaper]:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30, headers=HEADERS) as client:
            cards = await self._collect_cards(client)
            candidates = {}
            for pid, name, url in cards:
                if pid in candidates or not _is_diaper(name):
                    continue
                pack_qty = _extract_pack_qty(name)
                brand_result = extract_brand(name)
                if not pack_qty or not brand_result:
                    continue
                candidates[pid] = (name, url, pack_qty, brand_result)

            logger.info(f"[othoba] {len(cards)} cards -> {len(candidates)} diaper candidates")
            if not candidates:
                logger.warning("[othoba] no diaper candidates — listing markup may have changed")
                return []

            prices = await self._resolve_prices(client, list(candidates))
            missing = [pid for pid in candidates if pid not in prices]
            if missing:
                logger.info(f"[othoba] {len(missing)} ids missing a price — trying ld+json")
                prices.update(await self._resolve_prices_ld(client, missing, candidates))

        results: list[ScrapedDiaper] = []
        for pid, (name, url, pack_qty, (brand, brand_slug)) in candidates.items():
            price = prices.get(pid)
            if not price:
                continue
            price_bdt, old_price, image_url = price
            original = old_price if old_price and old_price > price_bdt else None
            w_min, w_max = _extract_weights(name)
            results.append(ScrapedDiaper(
                external_id=f"ot-{pid}",
                brand=brand, brand_slug=brand_slug,
                type="pants" if "pant" in name.lower() else "belt",
                size_label=_extract_size(name),
                weight_min_kg=w_min, weight_max_kg=w_max,
                pack_qty=pack_qty,
                image_url=image_url,
                product_url=f"{BASE}{url}" if url and not url.startswith("http") else url,
                price_bdt=price_bdt,
                original_price_bdt=original,
                is_promotion=bool(original),
            ))

        logger.info(f"[othoba] Scraped {len(results)} diaper products")
        return results

    async def _collect_cards(self, client: httpx.AsyncClient) -> list[tuple[str, str, str | None]]:
        cards: list[tuple[str, str, str | None]] = []
        seen: set[str] = set()

        for page in range(1, MAX_PAGES + 1):
            try:
                r = await client.get(
                    f"{BASE}{CATEGORY_PATH}",
                    params={"pagenumber": page, "pagesize": PAGE_SIZE},
                )
                if r.status_code != 200:
                    logger.warning(f"[othoba] category page {page}: HTTP {r.status_code}")
                    break
            except Exception as e:
                logger.warning(f"[othoba] category page {page}: {e}")
                break

            batch = [c for c in _parse_cards(r.text) if c[0] not in seen]
            if not batch:
                break
            seen.update(c[0] for c in batch)
            cards.extend(batch)
            await asyncio.sleep(0.4)

        if cards:
            logger.info(f"[othoba] category listing: {len(cards)} cards")
            return cards

        logger.warning("[othoba] category listing empty — falling back to search")
        for q in SEARCH_QUERIES:
            slug = q.replace(" ", "+")
            try:
                r = await client.get(f"{BASE}/ts/search/{slug}", params={"t": "t", "q": q})
                if r.status_code != 200:
                    continue
            except Exception as e:
                logger.warning(f"[othoba] search '{q}': {e}")
                continue
            for c in _parse_cards(r.text):
                if c[0] not in seen:
                    seen.add(c[0])
                    cards.append(c)
            await asyncio.sleep(0.6)

        logger.info(f"[othoba] search fallback: {len(cards)} cards")
        return cards

    async def _resolve_prices(
        self, client: httpx.AsyncClient, ids: list[str]
    ) -> dict[str, tuple[float, float | None, str | None]]:
        """Batch-resolve (price, old_price, image) via the theme's own endpoint."""
        out: dict[str, tuple[float, float | None, str | None]] = {}
        for i in range(0, len(ids), PRICE_BATCH):
            batch = [int(x) for x in ids[i:i + PRICE_BATCH]]
            try:
                r = await client.post(
                    f"{BASE}{PRICE_ENDPOINT}",
                    json=batch,
                    headers={"Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest"},
                )
                if r.status_code != 200 or not r.text.strip():
                    logger.warning(f"[othoba] price batch {i}: HTTP {r.status_code}, empty={not r.text.strip()}")
                    continue
                data = r.json()
            except Exception as e:
                logger.warning(f"[othoba] price batch {i}: {e}")
                continue

            images = {
                str(p.get("ProductId")): p.get("FullSizeImageUrl") or p.get("ImageUrl")
                for p in (data.get("PictureModels") or [])
            }
            for pm in data.get("PriceModels") or []:
                pid = str(pm.get("ProductId"))
                # Othoba keeps sold-out listings in the category at their last
                # price and only greys out the buy button; without this check the
                # comparison fills up with things nobody can actually buy
                # (verified against the product page's ld+json OutOfStock).
                if pm.get("DisableBuyButton") and not pm.get("AvailableForPreOrder"):
                    continue
                value = pm.get("PriceValue")
                if value is None:
                    continue
                try:
                    price = float(value)
                except (TypeError, ValueError):
                    continue
                if price <= 0:
                    continue
                old_raw = pm.get("OldPriceValue")
                old = float(old_raw) if old_raw else None
                out[pid] = (price, old, images.get(pid))
            await asyncio.sleep(0.3)
        return out

    async def _resolve_prices_ld(
        self, client: httpx.AsyncClient, ids: list[str], candidates: dict
    ) -> dict[str, tuple[float, float | None, str | None]]:
        """Fallback: read price from the product page's Product ld+json."""
        out: dict[str, tuple[float, float | None, str | None]] = {}
        for pid in ids[:MAX_LD_FALLBACK]:
            url = candidates[pid][1]
            if not url:
                continue
            try:
                r = await client.get(f"{BASE}{url}")
                if r.status_code != 200:
                    continue
            except Exception as e:
                logger.warning(f"[othoba] ld+json {pid}: {e}")
                continue

            for m in _LD_BLOCK.finditer(r.text):
                try:
                    ld = json.loads(m.group(1))
                except json.JSONDecodeError:
                    continue
                if ld.get("@type") != "Product":
                    continue
                offers = ld.get("offers") or {}
                if isinstance(offers, list):
                    offers = offers[0] if offers else {}
                if "outofstock" in str(offers.get("availability", "")).lower():
                    break
                try:
                    price = float(str(offers.get("price") or "").replace(",", ""))
                except ValueError:
                    break
                if price > 0:
                    out[pid] = (price, None, ld.get("image"))
                break
            await asyncio.sleep(0.4)
        return out


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    s = OthobaScraper()
    products = await s.scrape()
    if products:
        s.upsert_to_db(products)
    print(f"Done: {len(products)} from Othoba")


if __name__ == "__main__":
    asyncio.run(main())
