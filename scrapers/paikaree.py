"""Paikaree diaper scraper. WooCommerce Store API (no auth)."""
import asyncio
import json
import logging
import re
import sys
import httpx
from base import BaseScraper, ScrapedDiaper
from brands import extract_brand

logger = logging.getLogger(__name__)
BASE = "https://paikaree.com.bd"
WC_API = f"{BASE}/wp-json/wc/store/v1/products"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36"}

def _qty(name):
    m = re.search(r"(\d+)\s*(?:pcs|pieces|pc)", name.lower())
    return int(m.group(1)) if m else None

def _size(name):
    n = name.lower()
    if "newborn" in n or "new born" in n: return "Newborn"
    m = re.search(r"\b(xxl|xl|large|medium|small|[sml])\b", n)
    if m:
        s = m.group(1).upper()
        return {"LARGE":"L","MEDIUM":"M","SMALL":"S"}.get(s, s)
    return None

def _is_diaper(n): return any(w in n.lower() for w in ["diaper","diapers","nappy"])

class PaikareeScraper(BaseScraper):
    store_slug = "paikaree"
    store_name = "Paikaree"

    async def scrape(self) -> list[ScrapedDiaper]:
        results, seen = [], set()
        async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
            for q in ["diaper", "huggies", "mamypoko", "molfix", "baby diaper"]:
                page = 1
                while page <= 5:
                    try:
                        r = await client.get(WC_API, params={"search": q, "per_page": 50, "page": page}, headers=HEADERS)
                        if r.status_code != 200: break
                        items = r.json()
                        if not items: break
                        for item in items:
                            p = self._parse(item)
                            if p and p.external_id not in seen:
                                results.append(p); seen.add(p.external_id)
                        if len(items) < 50: break
                        page += 1
                    except Exception as e:
                        logger.warning(f"[paikaree] {e}"); break
                    await asyncio.sleep(0.5)
        logger.info(f"[paikaree] Scraped {len(results)} products")
        return results

    def _parse(self, item):
        try:
            name = (item.get("name") or "").strip()
            if not name or not _is_diaper(name): return None
            prices = item.get("prices") or {}
            price_str = prices.get("price") or "0"
            price = float(price_str) / 100 if len(price_str) > 4 else float(price_str)
            if price <= 0: return None
            qty = _qty(name)
            if not qty: return None
            brand_result = extract_brand(name)
            if not brand_result: return None
            b, bs = brand_result
            eid = str(item.get("id") or name[:20])
            return ScrapedDiaper(
                external_id=f"pk-{eid}", brand=b, brand_slug=bs,
                type="pants" if "pant" in name.lower() else "belt",
                size_label=_size(name), pack_qty=qty,
                image_url=(item.get("images") or [{}])[0].get("src"),
                product_url=item.get("permalink"),
                price_bdt=price)
        except: return None

async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    s = PaikareeScraper(); p = await s.scrape()
    if p: s.upsert_to_db(p)
    print(f"Done: {len(p)} from Paikaree")

if __name__ == "__main__": asyncio.run(main())
