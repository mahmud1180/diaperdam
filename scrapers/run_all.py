"""Run all active scrapers. Called by GitHub Actions daily cron."""
import asyncio
import logging
import sys

from chaldal import ChaldalScraper
from daraz import DarazScraper
from shwapno import ShwapnoScraper
from othoba import OthobaScraper
from ajkerdeal import AjkerDealScraper
from gobaby import GoBabyScraper
from meenabazar import MeenaBazarScraper
from unimart import UnimartScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# Active scrapers (order: most reliable first)
# Disabled: Arogga (all API endpoints 404), Paikaree (403 on WooCommerce API)
SCRAPERS = [
    ChaldalScraper(),     # Proven Kombeshi API — 96 products
    ShwapnoScraper(),     # Kombeshi API + hardcoded category IDs
    MeenaBazarScraper(),  # mbonlineapi.com SubCategoryId=145
    GoBabyScraper(),      # WooCommerce Store API — 59 products
    DarazScraper(),       # Playwright-based SPA scraping
    OthobaScraper(),      # HTML search + ld+json
    AjkerDealScraper(),   # HTML search + __NEXT_DATA__
    UnimartScraper(),     # HTML search + ld+json
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
