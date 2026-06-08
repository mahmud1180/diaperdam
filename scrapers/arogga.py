"""Arogga diaper scraper.

Arogga is a pharmacy/grocery delivery app in BD. They use a React SPA.
Strategy: probe multiple API patterns + HTML search page.
"""
import asyncio
import json
import logging
import re
import sys

import httpx

from base import BaseScraper, ScrapedDiaper
from brands import extract_brand

logger = logging.getLogger(__name__)

BASE = "https://arogga.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36",
    "Accept": "text/html,application/json,*/*",
}


def _extract_pack_qty(name: str) -> int | None:
    m = re.search(r"(\d+)\s*(?:pcs|pieces|pc)", name.lower())
    return int(m.group(1)) if m else None


def _extract_size(name: str) -> str | None:
    n = name.lower()
    if "newborn" in n or "new born" in n:
        return "Newborn"
    m = re.search(r"\b(xxl|xl|large|medium|small|[sml])\b", n)
    if m:
        s = m.group(1).upper()
        return {"LARGE": "L", "MEDIUM": "M", "SMALL": "S"}.get(s, s)
    return None


def _is_diaper(name: str) -> bool:
    n = name.lower()
    return any(w in n for w in ["diaper", "diapers", "diapant", "nappy"])


class AroggaScraper(BaseScraper):
    store_slug = "arogga"
    store_name = "Arogga"

    async def scrape(self) -> list[ScrapedDiaper]:
        results: list[ScrapedDiaper] = []
        seen: set[str] = set()

        async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
            # Strategy 1: Try known API endpoints
            api_patterns = [
                "/api/v1/products?q={q}&per_page=50",
                "/api/search?q={q}&limit=50",
                "/api/v1/search?q={q}&per_page=50",
                "/api/v2/products?q={q}&per_page=50",
            ]
            queries = ["diaper", "baby diaper", "huggies", "mamypoko"]

            for q in queries:
                for pattern in api_patterns:
                    url = f"{BASE}{pattern.format(q=q)}"
                    try:
                        r = await client.get(url, headers=HEADERS)
                        if r.status_code not in (200, 201):
                            continue
                        data = r.json()
                        items = (data.get("data") if isinstance(data.get("data"), list) else
                                 data.get("products") or data.get("items") or
                                 data.get("data", {}).get("products") if isinstance(data.get("data"), dict) else
                                 [])
                        if not items:
                            continue
                        logger.info(f"[arogga] API hit: {pattern.format(q=q)} → {len(items)} items")
                        for item in items:
                            p = self._parse_api(item)
                            if p and p.external_id not in seen:
                                results.append(p)
                                seen.add(p.external_id)
                        break  # Found working API pattern
                    except Exception:
                        continue
                await asyncio.sleep(0.5)

            # Strategy 2: HTML search page
            if not results:
                logger.info("[arogga] Trying HTML search...")
                for q in ["diaper", "huggies diaper"]:
                    try:
                        r = await client.get(f"{BASE}/search?q={q}", headers=HEADERS)
                        if r.status_code != 200:
                            continue
                        # Look for ld+json
                        for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', r.text, re.DOTALL):
                            try:
                                ld = json.loads(m.group(1))
                                if ld.get("@type") == "Product":
                                    p = self._parse_ld(ld)
                                    if p and p.external_id not in seen:
                                        results.append(p)
                                        seen.add(p.external_id)
                            except json.JSONDecodeError:
                                continue
                        # Look for __NEXT_DATA__
                        nd = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', r.text, re.DOTALL)
                        if nd:
                            data = json.loads(nd.group(1))
                            products = data.get("props", {}).get("pageProps", {}).get("products") or []
                            for item in products:
                                p = self._parse_api(item)
                                if p and p.external_id not in seen:
                                    results.append(p)
                                    seen.add(p.external_id)
                    except Exception as e:
                        logger.warning(f"[arogga] HTML search: {e}")
                    await asyncio.sleep(0.5)

        logger.info(f"[arogga] Scraped {len(results)} diaper products")
        return results

    def _parse_api(self, item: dict) -> ScrapedDiaper | None:
        try:
            name = (item.get("name") or item.get("product_name") or "").strip()
            if not name or not _is_diaper(name):
                return None
            price = item.get("tp") or item.get("special_price") or item.get("price")
            if not price:
                return None
            price_bdt = float(price)
            if price_bdt <= 0:
                return None
            pack_qty = _extract_pack_qty(name)
            if not pack_qty:
                return None
            eid = str(item.get("id") or item.get("product_id") or name[:30])
            brand_result = extract_brand(name)
            if not brand_result: return None
            brand, brand_slug = brand_result
            mrp = item.get("mrp") or item.get("regular_price")
            original = float(mrp) if mrp and float(mrp) > price_bdt else None
            slug = item.get("slug") or item.get("url_slug") or ""
            return ScrapedDiaper(
                external_id=f"ar-{eid}", brand=brand, brand_slug=brand_slug,
                type="pants" if "pant" in name.lower() else "belt",
                size_label=_extract_size(name), pack_qty=pack_qty,
                image_url=item.get("thumbnail") or item.get("image"),
                product_url=f"{BASE}/product/{slug}" if slug else None,
                price_bdt=price_bdt, original_price_bdt=original,
                is_promotion=bool(original),
            )
        except Exception:
            return None

    def _parse_ld(self, ld: dict) -> ScrapedDiaper | None:
        try:
            name = (ld.get("name") or "").strip()
            if not name or not _is_diaper(name):
                return None
            offers = ld.get("offers") or {}
            if isinstance(offers, list):
                offers = offers[0]
            price = float(offers.get("price") or "0")
            if price <= 0:
                return None
            pack_qty = _extract_pack_qty(name)
            if not pack_qty:
                return None
            brand_result = extract_brand(name)
            if not brand_result: return None
            brand, brand_slug = brand_result
            return ScrapedDiaper(
                external_id=f"ar-{name[:30]}", brand=brand, brand_slug=brand_slug,
                type="pants" if "pant" in name.lower() else "belt",
                size_label=_extract_size(name), pack_qty=pack_qty,
                image_url=ld.get("image"), product_url=ld.get("url"),
                price_bdt=price,
            )
        except Exception:
            return None


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    s = AroggaScraper()
    products = await s.scrape()
    if products:
        s.upsert_to_db(products)
    print(f"Done: {len(products)} from Arogga")


if __name__ == "__main__":
    asyncio.run(main())
