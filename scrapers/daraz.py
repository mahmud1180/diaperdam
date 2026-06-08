"""Daraz diaper scraper — Playwright DOM extraction.

Daraz (Lazada family) no longer exposes window.pageData (removed ~mid-2026).
Products render as DOM cards with [data-qa-locator="product-item"].
We extract name, price, discount from innerText + product ID from the link href.
Images come from the JSON-LD ItemList script tag (first 10) or are left null.
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

DARAZ_BASE = "https://www.daraz.com.bd"
SEARCH_QUERIES = [
    "huggies diaper", "mamypoko diaper", "molfix diaper",
    "pampers diaper", "bashundhara diaper", "neocare diaper",
    "supermom diaper", "avonee diaper", "baby diaper",
]


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
    # "42 Piece", "36 count", "28+6=34", "50pcs"
    m = re.search(r"(\d+)\s*(?:pcs|pieces?|pc|p|count)\b", name.lower())
    if m:
        return int(m.group(1))
    # "28+6=34" pattern
    m = re.search(r"(\d+)\+(\d+)\s*=\s*(\d+)", name)
    if m:
        return int(m.group(3))
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

                        # Build image map from JSON-LD ItemList
                        image_map = await page.evaluate("""() => {
                            const map = {};
                            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                            for (const s of scripts) {
                                try {
                                    const d = JSON.parse(s.textContent);
                                    if (d['@type'] === 'ItemList' && d.itemListElement) {
                                        for (const item of d.itemListElement) {
                                            const p = item.item;
                                            if (p && p.url && p.image) {
                                                const m = p.url.match(/i(\\d+)/);
                                                if (m) map[m[1]] = p.image;
                                            }
                                        }
                                    }
                                } catch {}
                            }
                            return map;
                        }""")

                        # Extract products from DOM cards
                        items = await page.evaluate("""() => {
                            const cards = document.querySelectorAll('[data-qa-locator="product-item"]');
                            const products = [];
                            for (const card of cards) {
                                const link = card.querySelector('a');
                                if (!link) continue;
                                const href = link.href;
                                const idMatch = href.match(/i(\\d+)/);
                                if (!idMatch) continue;

                                const lines = card.innerText.split('\\n').map(l => l.trim()).filter(Boolean);
                                if (lines.length < 2) continue;

                                const name = lines[0];
                                let price = null;
                                let discountPct = null;

                                for (const line of lines) {
                                    const priceMatch = line.match(/৳\\s*([\\d,]+)/);
                                    if (priceMatch && !price) {
                                        price = parseFloat(priceMatch[1].replace(/,/g, ''));
                                    }
                                    const discMatch = line.match(/(\\d+)%\\s*Off/i);
                                    if (discMatch && !discountPct) {
                                        discountPct = parseInt(discMatch[1]);
                                    }
                                }

                                if (name && price && price > 0) {
                                    products.push({
                                        itemId: idMatch[1],
                                        name: name,
                                        price: price,
                                        discountPct: discountPct,
                                        productUrl: href
                                    });
                                }
                            }
                            return products;
                        }""")

                        if not items:
                            logger.info(f"[daraz] No DOM cards on page {pg_num}")
                            break

                        for item in items:
                            item_id = item["itemId"]
                            # Attach image from JSON-LD if available
                            item["image"] = image_map.get(item_id)
                            p = self._parse_dom_item(item)
                            if p and p.external_id not in seen_ids:
                                results.append(p)
                                seen_ids.add(p.external_id)

                        logger.info(f"[daraz] Page {pg_num} for '{query}': {len(items)} cards, {len(results)} total unique")

                    except Exception as e:
                        logger.warning(f"[daraz] Playwright error on '{query}' page {pg_num}: {e}")
                        break

                    await asyncio.sleep(2.0)

            await browser.close()

        logger.info(f"[daraz] Scraped {len(results)} diaper products (Playwright DOM)")
        return results

    async def _scrape_http(self) -> list[ScrapedDiaper]:
        """HTTP fallback — extract JSON-LD ItemList from HTML (limited to ~10 per query)."""
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

                    # Try to find ItemList JSON-LD (has names, images, urls but no prices)
                    # Also look for any inline JSON with price data
                    ld_matches = re.findall(
                        r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
                        r.text, re.DOTALL
                    )
                    for ld_text in ld_matches:
                        try:
                            data = json.loads(ld_text)
                            if data.get("@type") == "ItemList":
                                for el in data.get("itemListElement", []):
                                    item = el.get("item", {})
                                    item_url = item.get("url", "")
                                    m = re.search(r"i(\d+)", item_url)
                                    if not m:
                                        continue
                                    name = item.get("name", "")
                                    if not _is_diaper(name):
                                        continue
                                    # JSON-LD has no price, skip for HTTP
                                    # (we'd need to fetch individual product pages)
                        except json.JSONDecodeError:
                            pass

                except Exception as e:
                    logger.warning(f"[daraz] HTTP error: {e}")
                await asyncio.sleep(1.5)

        logger.info(f"[daraz] Scraped {len(results)} diaper products (HTTP fallback)")
        return results

    def _parse_dom_item(self, item: dict) -> ScrapedDiaper | None:
        """Parse a product extracted from DOM card."""
        try:
            name = item.get("name", "").strip()
            if not name or not _is_diaper(name):
                return None

            price_bdt = item.get("price")
            if not price_bdt or price_bdt <= 0:
                return None

            item_id = item.get("itemId", "")
            if not item_id:
                return None

            pack_qty = _extract_pack_qty(name)
            if not pack_qty or pack_qty <= 0:
                return None

            result = extract_brand(name)
            if not result:
                return None
            brand, brand_slug = result
            w_min, w_max = _extract_weights(name)

            product_url = item.get("productUrl", "")
            if product_url and not product_url.startswith("http"):
                product_url = f"{DARAZ_BASE}{product_url}"

            image_url = item.get("image")

            disc_pct = item.get("discountPct")
            original_price = None
            if disc_pct and disc_pct > 0:
                original_price = round(price_bdt / (1 - disc_pct / 100), 2)

            return ScrapedDiaper(
                external_id=f"dz-{item_id}",
                brand=brand, brand_slug=brand_slug,
                type=_extract_type(name),
                size_label=_extract_size(name),
                weight_min_kg=w_min, weight_max_kg=w_max,
                pack_qty=pack_qty,
                image_url=image_url,
                product_url=product_url or None,
                price_bdt=price_bdt,
                original_price_bdt=original_price,
                discount_pct=float(disc_pct) if disc_pct else None,
                is_promotion=bool(disc_pct),
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
