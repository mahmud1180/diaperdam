"""Unimart diaper scraper. HTML search + ld+json."""
import asyncio
import json
import logging
import re
import sys
import httpx
from base import BaseScraper, ScrapedDiaper

logger = logging.getLogger(__name__)
BASE = "https://unimart.com.bd"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36",
    "Accept": "text/html,application/json,*/*",
}

BRAND_SLUG_MAP = {
    "huggies": "huggies", "mamypoko": "mamypoko", "molfix": "molfix",
    "pampers": "pampers", "neocare": "neocare", "bashundhara": "bashundhara",
    "avonee": "avonee", "supermom": "supermom", "savlon": "savlon",
}

def _brand(name):
    n = name.lower()
    for k, s in BRAND_SLUG_MAP.items():
        if k in n: return k.title(), s
    return name.split()[0], name.split()[0].lower()

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

class UnimartScraper(BaseScraper):
    store_slug = "unimart"
    store_name = "Unimart"

    async def scrape(self) -> list[ScrapedDiaper]:
        results, seen = [], set()
        async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
            for q in ["diaper", "baby diaper", "huggies", "mamypoko"]:
                for path in [f"/search?q={q}", f"/catalogsearch/result/?q={q}", f"/search?keyword={q}"]:
                    try:
                        r = await client.get(f"{BASE}{path}", headers=HEADERS)
                        if r.status_code != 200: continue

                        # ld+json
                        for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', r.text, re.DOTALL):
                            try:
                                ld = json.loads(m.group(1))
                                prods = []
                                if ld.get("@type") == "ItemList":
                                    prods = [i for i in ld.get("itemListElement",[]) if i.get("@type")=="Product"]
                                elif ld.get("@type") == "Product":
                                    prods = [ld]
                                for prod in prods:
                                    p = self._parse_ld(prod)
                                    if p and p.external_id not in seen:
                                        results.append(p); seen.add(p.external_id)
                            except: continue

                        # __NEXT_DATA__
                        nd = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', r.text, re.DOTALL)
                        if nd:
                            try:
                                data = json.loads(nd.group(1))
                                items = data.get("props",{}).get("pageProps",{}).get("products") or []
                                for item in items:
                                    name = (item.get("name") or "").strip()
                                    if not name or not _is_diaper(name): continue
                                    price = float(item.get("price") or 0)
                                    if price <= 0: continue
                                    qty = _qty(name)
                                    if not qty: continue
                                    b, bs = _brand(name)
                                    eid = f"um-{item.get('id', name[:20])}"
                                    if eid in seen: continue
                                    seen.add(eid)
                                    results.append(ScrapedDiaper(
                                        external_id=eid, brand=b, brand_slug=bs,
                                        type="pants" if "pant" in name.lower() else "belt",
                                        size_label=_size(name), pack_qty=qty,
                                        image_url=item.get("image"), product_url=item.get("url"),
                                        price_bdt=price))
                            except: pass

                        if results: break  # Found results with this path pattern
                    except Exception as e:
                        logger.warning(f"[unimart] {path}: {e}")
                await asyncio.sleep(1.0)

        logger.info(f"[unimart] Scraped {len(results)} products")
        return results

    def _parse_ld(self, ld):
        try:
            name = (ld.get("name") or "").strip()
            if not name or not _is_diaper(name): return None
            offers = ld.get("offers") or {}
            if isinstance(offers, list): offers = offers[0]
            price = float(offers.get("price") or "0")
            if price <= 0: return None
            qty = _qty(name)
            if not qty: return None
            b, bs = _brand(name)
            return ScrapedDiaper(
                external_id=f"um-{name[:20]}", brand=b, brand_slug=bs,
                type="pants" if "pant" in name.lower() else "belt",
                size_label=_size(name), pack_qty=qty,
                image_url=ld.get("image"), product_url=ld.get("url"),
                price_bdt=price)
        except: return None

async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    s = UnimartScraper(); p = await s.scrape()
    if p: s.upsert_to_db(p)
    print(f"Done: {len(p)} from Unimart")

if __name__ == "__main__": asyncio.run(main())
