"""AjkerDeal diaper scraper. HTML + ld+json from search/category pages."""
import asyncio
import json
import logging
import re
import sys
import httpx
from base import BaseScraper, ScrapedDiaper

logger = logging.getLogger(__name__)
BASE = "https://ajkerdeal.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36",
    "Accept": "text/html,application/json,*/*",
}

URLS = [
    "/en/category/Baby-Kids-Diaper",
    "/en/search?q=diaper",
    "/en/search?q=huggies+diaper",
    "/en/search?q=mamypoko+diaper",
]

BRAND_SLUG_MAP = {
    "huggies": "huggies", "mamypoko": "mamypoko", "molfix": "molfix",
    "pampers": "pampers", "neocare": "neocare", "bashundhara": "bashundhara",
    "avonee": "avonee", "supermom": "supermom", "savlon": "savlon",
}

def _brand(name):
    n = name.lower()
    for k, s in BRAND_SLUG_MAP.items():
        if k in n:
            return k.title(), s
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

class AjkerDealScraper(BaseScraper):
    store_slug = "ajkerdeal"
    store_name = "AjkerDeal"

    async def scrape(self) -> list[ScrapedDiaper]:
        results, seen = [], set()
        async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
            for path in URLS:
                try:
                    r = await client.get(f"{BASE}{path}", headers=HEADERS)
                    if r.status_code != 200: continue
                except Exception as e:
                    logger.warning(f"[ajkerdeal] {path}: {e}"); continue

                # Try __NEXT_DATA__
                nd = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', r.text, re.DOTALL)
                if nd:
                    try:
                        data = json.loads(nd.group(1))
                        props = data.get("props",{}).get("pageProps",{})
                        items = props.get("products") or props.get("data",{}).get("products") or []
                        for item in items:
                            p = self._parse(item)
                            if p and p.external_id not in seen:
                                results.append(p); seen.add(p.external_id)
                    except: pass

                # Try ld+json
                for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', r.text, re.DOTALL):
                    try:
                        ld = json.loads(m.group(1))
                        prods = [ld] if ld.get("@type")=="Product" else [i for i in ld.get("itemListElement",[]) if i.get("@type")=="Product"]
                        for prod in prods:
                            p = self._parse_ld(prod)
                            if p and p.external_id not in seen:
                                results.append(p); seen.add(p.external_id)
                    except: continue

                await asyncio.sleep(1.0)
        logger.info(f"[ajkerdeal] Scraped {len(results)} products")
        return results

    def _parse(self, item):
        try:
            name = (item.get("name") or item.get("productName") or "").strip()
            if not name or not _is_diaper(name): return None
            price = float(item.get("price") or item.get("salePrice") or 0)
            if price <= 0: return None
            qty = _qty(name)
            if not qty: return None
            eid = str(item.get("id") or item.get("productId") or name[:20])
            b, bs = _brand(name)
            return ScrapedDiaper(external_id=f"ajd-{eid}", brand=b, brand_slug=bs,
                type="pants" if "pant" in name.lower() else "belt",
                size_label=_size(name), pack_qty=qty,
                image_url=item.get("image") or item.get("thumbnailImage"),
                product_url=item.get("url") or item.get("productUrl"),
                price_bdt=price)
        except: return None

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
            return ScrapedDiaper(external_id=f"ajd-{name[:20]}", brand=b, brand_slug=bs,
                type="pants" if "pant" in name.lower() else "belt",
                size_label=_size(name), pack_qty=qty,
                image_url=ld.get("image"), product_url=ld.get("url"),
                price_bdt=price)
        except: return None

async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    s = AjkerDealScraper(); p = await s.scrape()
    if p: s.upsert_to_db(p)
    print(f"Done: {len(p)} from AjkerDeal")

if __name__ == "__main__": asyncio.run(main())
