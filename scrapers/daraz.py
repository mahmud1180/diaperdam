"""Daraz diaper scraper — Playwright-based since Daraz is a heavy SPA.

Daraz (Lazada family) renders product data client-side. We use Playwright
to load the search page and extract product cards from the DOM.
Fallback to HTTP if Playwright is unavailable (dev environments).
"""
import asyncio
import json
import logging
import re
import sys

import httpx

from base import BaseScraper, ScrapedDiaper

logger = logging.getLogger(__name__)

DARAZ_BASE = "https://www.daraz.com.bd"
SEARCH_QUERIES = ["diaper", "baby diaper", "huggies diaper", "mamypoko diaper"]

BRAND_SLUG_MAP = {
    "huggies": "huggies", "mamypoko": "mamypoko", "mamy poko": "mamypoko",
    "molfix": "molfix", "pampers": "pampers", "neocare": "neocare",
    "bashundhara": "bashundhara", "avonee": "avonee", "supermom": "supermom",
    "savlon": "savlon", "twinkle": "savlon", "smc smile": "smc-smile",
    "chu chu": "chuchu", "chu-chu": "chuchu", "chuchu": "chuchu",
}


def _extract_brand(name: str) -> tuple[str, str]:
    n = name.lower()
    for keyword, slug in BRAND_SLUG_MAP.items():
        if keyword in n:
            display = {"mamypoko": "MamyPoko", "huggies": "Huggies", "molfix": "Molfix",
                       "pampers": "Pampers", "neocare": "Neocare", "bashundhara": "Bashundhara",
                       "savlon": "Savlon", "avonee": "Avonee", "supermom": "Supermom",
                       "chuchu": "Chu Chu", "smc-smile": "SMC Smile"}.get(slug, keyword.title())
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
    m = re.search(r"(\d+)\s*(?:pcs|pieces|pc|p)\b", name.lower())
    if m:
        return int(m.group(1))
    m = re.search(r"pack\s*(?:of\s*)?(\d+)", name.lower())
    return int(m.group(1)) if m else None


def _extract_weights(name: str) -> tuple[float | None, float | None]:
    m = re.search(r"(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*kg", name.lower())
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r"up\s+to\s+(\d+(?:\.\d+)?)\s*kg", name.lower())
    if m:
        return None, float(m.group(1))
    return None, None


def _is_diaper(name: str) -> bool:
    n = name.lower()
    return any(w in n for w in ["diaper", "diapers", "diapant", "nappy", "nappies"])


class DarazScraper(BaseScraper):
    store_slug = "daraz"
    store_name = "Daraz"

    async def scrape(self) -> list[ScrapedDiaper]:
        """Try Playwright first, fall back to HTTP."""
        try:
            from playwright.async_api import async_playwright
            return await self._scrape_playwright()
        except ImportError:
            logger.warning("[daraz] Playwright not available, trying HTTP fallback")
            return await self._scrape_http()

    async def _scrape_playwright(self) -> list[ScrapedDiaper]:
        from playwright.async_api import async_playwright

        results: list[ScrapedDiaper] = []
        seen_ids: set[str] = set()

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36",
            )

            for query in SEARCH_QUERIES:
                for pg_num in range(1, 3):  # 2 pages per query
                    url = f"{DARAZ_BASE}/catalog/?q={query.replace(' ', '+')}&page={pg_num}"
                    logger.info(f"[daraz] Loading: {url}")
                    try:
                        await page.goto(url, wait_until="networkidle", timeout=30000)
                        await page.wait_for_timeout(2000)

                        # Extract pageData from the page context
                        items = await page.evaluate("""() => {
                            if (window.pageData && window.pageData.mods && window.pageData.mods.listItems) {
                                return window.pageData.mods.listItems;
                            }
                            return [];
                        }""")

                        if not items:
                            logger.info(f"[daraz] No items from pageData on page {pg_num}")
                            break

                        for item in items:
                            p = self._parse_item(item)
                            if p and p.external_id not in seen_ids:
                                results.append(p)
                                seen_ids.add(p.external_id)

                    except Exception as e:
                        logger.warning(f"[daraz] Playwright error: {e}")
                        break

                    await asyncio.sleep(2.0)

            await browser.close()

        logger.info(f"[daraz] Scraped {len(results)} diaper products (Playwright)")
        return results

    async def _scrape_http(self) -> list[ScrapedDiaper]:
        """HTTP fallback — try to get pageData from server-rendered HTML."""
        results: list[ScrapedDiaper] = []
        seen_ids: set[str] = set()
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
        }

        async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
            for query in SEARCH_QUERIES:
                url = f"{DARAZ_BASE}/catalog/?q={query.replace(' ', '+')}"
                try:
                    r = await client.get(url, headers=headers)
                    if r.status_code != 200:
                        continue
                    m = re.search(r'window\.pageData\s*=\s*(\{.*?\});\s*</script>', r.text, re.DOTALL)
                    if not m:
                        continue
                    data = json.loads(m.group(1))
                    items = data.get("mods", {}).get("listItems", [])
                    for item in items:
                        p = self._parse_item(item)
                        if p and p.external_id not in seen_ids:
                            results.append(p)
                            seen_ids.add(p.external_id)
                except Exception as e:
                    logger.warning(f"[daraz] HTTP error: {e}")
                await asyncio.sleep(1.5)

        logger.info(f"[daraz] Scraped {len(results)} diaper products (HTTP)")
        return results

    def _parse_item(self, item: dict) -> ScrapedDiaper | None:
        try:
            name = item.get("name") or item.get("title") or ""
            name = name.strip()
            if not name or not _is_diaper(name):
                return None

            price_str = item.get("price") or item.get("priceShow") or ""
            if isinstance(price_str, str):
                price_str = re.sub(r"[^\d.]", "", price_str)
            try:
                price_bdt = float(price_str)
            except (ValueError, TypeError):
                return None
            if price_bdt <= 0:
                return None

            item_id = str(item.get("itemId") or item.get("nid") or item.get("productId") or "")
            if not item_id:
                return None

            pack_qty = _extract_pack_qty(name)
            if not pack_qty or pack_qty <= 0:
                return None

            brand, brand_slug = _extract_brand(name)
            w_min, w_max = _extract_weights(name)

            image = item.get("image") or item.get("thumbUrl") or ""
            product_url = item.get("productUrl") or item.get("itemUrl") or ""
            if product_url and not product_url.startswith("http"):
                product_url = f"{DARAZ_BASE}{product_url}"

            orig_str = item.get("originalPrice") or item.get("originalPriceShow") or ""
            if isinstance(orig_str, str):
                orig_str = re.sub(r"[^\d.]", "", orig_str)
            try:
                original = float(orig_str) if orig_str else None
            except ValueError:
                original = None
            if original and original <= price_bdt:
                original = None

            discount_str = item.get("discount") or ""
            disc_pct = None
            if discount_str:
                dm = re.search(r"(\d+)%", str(discount_str))
                if dm:
                    disc_pct = float(dm.group(1))

            return ScrapedDiaper(
                external_id=f"dz-{item_id}",
                brand=brand, brand_slug=brand_slug,
                type=_extract_type(name),
                size_label=_extract_size(name),
                weight_min_kg=w_min, weight_max_kg=w_max,
                pack_qty=pack_qty,
                image_url=image or None,
                product_url=product_url or None,
                price_bdt=price_bdt,
                original_price_bdt=original,
                discount_pct=disc_pct,
                is_promotion=bool(original or disc_pct),
            )
        except Exception as e:
            logger.warning(f"[daraz] parse: {e}")
            return None


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    s = DarazScraper()
    products = await s.scrape()
    if products:
        s.upsert_to_db(products)
    print(f"Done: {len(products)} from Daraz")


if __name__ == "__main__":
    asyncio.run(main())
