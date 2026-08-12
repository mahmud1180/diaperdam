"""Run all active scrapers. Called by GitHub Actions daily cron."""
import asyncio
import logging
import sys

from chaldal import ChaldalScraper
from daraz import DarazScraper
from shwapno import ShwapnoScraper
from othoba import OthobaScraper
from gobaby import GoBabyScraper
from meenabazar import MeenaBazarScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# Active scrapers (order: most reliable first)
#
# Disabled — the site is dead at the source, not a parser bug. Re-probed
# 2026-08-12; each had returned 0 rows on every run since launch:
#   Arogga    — all API endpoints 404
#   Paikaree  — 403 on the WooCommerce Store API
#   Unimart   — bare Apache 403 on http and https with browser headers; the
#               TLS cert is issued for autoconfig.unimart.com.bd, not the apex
#   AjkerDeal — DNS resolves (35.247.151.101) but ports 80 and 443 are filtered
# Their scraper modules are kept so a store can be revived by re-adding it here
# and to STORE_SLUGS in src/lib/catalog.ts once a live probe returns products.
SCRAPERS = [
    ChaldalScraper(),     # Proven Kombeshi API — 96 products
    ShwapnoScraper(),     # Site-search API + category fallback
    MeenaBazarScraper(),  # mbonlineapi.com SubCategoryId=145
    GoBabyScraper(),      # WooCommerce Store API — 59 products
    DarazScraper(),       # Playwright-based SPA scraping
    OthobaScraper(),      # nopCommerce card pagination + batch price endpoint
]


async def run_all():
    total = 0
    for scraper in SCRAPERS:
        logger.info(f"=== Starting {scraper.store_name} ===")
        try:
            products = await scraper.scrape()
            if products:
                scraper.upsert_to_db(products)
                total += len(products)
                logger.info(f"=== {scraper.store_name}: {len(products)} products saved ===")
            else:
                logger.warning(f"=== {scraper.store_name}: 0 products — check scraper ===")
        except Exception as e:
            logger.error(f"=== {scraper.store_name} FAILED: {e} ===")

    logger.info(f"=== ALL DONE: {total} total products across {len(SCRAPERS)} stores ===")


if __name__ == "__main__":
    asyncio.run(run_all())
