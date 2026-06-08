"""Othoba diaper scraper.

Othoba is a BD e-commerce site. Strategy: search HTML + ld+json extraction.
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

BASE = "https://www.othoba.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
}

SEARCH_QUERIES = ["diaper", "baby diaper", "huggies diaper", "mamypoko"]


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
    return any(w in n for w in ["diaper", "diapers", "nappy"])


class OthobaScraper(BaseScraper):
    store_slug = "othoba"
    store_name = "Othoba"

    async def scrape(self) -> list[ScrapedDiaper]:
        results: list[ScrapedDiaper] = []
        seen: set[str] = set()

        async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
            for q in SEARCH_QUERIES:
                logger.info(f"[othoba] Search: {q}")
                try:
                    r = await client.get(f"{BASE}/search?q={q.replace(' ', '+')}", headers=HEADERS)
                    if r.status_code != 200:
                        continue
                except Exception as e:
                    logger.warning(f"[othoba] fetch: {e}")
                    continue

                # Extract products from ld+json
                for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', r.text, re.DOTALL):
                    try:
                        ld = json.loads(m.group(1))
                        products = []
                        if ld.get("@type") == "ItemList":
                            products = [i for i in ld.get("itemListElement", []) if i.get("@type") == "Product"]
                        elif ld.get("@type") == "Product":
                            products = [ld]

                        for prod in products:
                            p = self._parse_ld(prod)
                            if p and p.external_id not in seen:
                                results.append(p)
                                seen.add(p.external_id)
                    except json.JSONDecodeError:
                        continue

                # Also try parsing product cards from HTML
                for card_match in re.finditer(
                    r'class="product-card[^"]*".*?href="([^"]+)".*?'
                    r'(?:alt="([^"]*)")?.*?'
                    r'(?:class="[^"]*price[^"]*"[^>]*>.*?(?:৳|BDT|Tk)\s*([\d,]+))',
                    r.text, re.DOTALL
                ):
                    url, name, price_str = card_match.groups()
                    if not name or not _is_diaper(name):
                        continue
                    try:
                        price = float(price_str.replace(",", ""))
                    except ValueError:
                        continue
                    pack_qty = _extract_pack_qty(name)
                    if not pack_qty:
                        continue
                    eid = f"ot-{url.split('/')[-1]}"
                    if eid in seen:
                        continue
                    seen.add(eid)
                    brand_result = extract_brand(name)
                    if not brand_result: continue
                    brand, brand_slug = brand_result
                    results.append(ScrapedDiaper(
                        external_id=eid, brand=brand, brand_slug=brand_slug,
                        type="pants" if "pant" in name.lower() else "belt",
                        size_label=_extract_size(name),
                        pack_qty=pack_qty,
                        product_url=f"{BASE}{url}" if not url.startswith("http") else url,
                        price_bdt=price,
                    ))

                await asyncio.sleep(1.0)

        logger.info(f"[othoba] Scraped {len(results)} diaper products")
        return results

    def _parse_ld(self, prod: dict) -> ScrapedDiaper | None:
        try:
            name = (prod.get("name") or "").strip()
            if not name or not _is_diaper(name):
                return None
            offers = prod.get("offers") or {}
            if isinstance(offers, list):
                offers = offers[0] if offers else {}
            price_str = offers.get("price") or prod.get("price") or ""
            price = float(str(price_str).replace(",", ""))
            if price <= 0:
                return None
            pack_qty = _extract_pack_qty(name)
            if not pack_qty:
                return None
            url = prod.get("url") or offers.get("url") or ""
            eid = f"ot-{url.split('/')[-1]}" if url else f"ot-{name[:30]}"
            brand_result = extract_brand(name)
            if not brand_result: return None
            brand, brand_slug = brand_result
            return ScrapedDiaper(
                external_id=eid, brand=brand, brand_slug=brand_slug,
                type="pants" if "pant" in name.lower() else "belt",
                size_label=_extract_size(name),
                pack_qty=pack_qty,
                image_url=prod.get("image"),
                product_url=url if url.startswith("http") else f"{BASE}{url}",
                price_bdt=price,
            )
        except Exception:
            return None


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    s = OthobaScraper()
    products = await s.scrape()
    if products:
        s.upsert_to_db(products)
    print(f"Done: {len(products)} from Othoba")


if __name__ == "__main__":
    asyncio.run(main())
