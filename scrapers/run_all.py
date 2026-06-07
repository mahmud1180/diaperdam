"""Run all active scrapers. Called by GitHub Actions daily cron."""
import asyncio
import logging
import sys

from chaldal import ChaldalScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

SCRAPERS = [
    ChaldalScraper(),
    # DarazScraper(),   # add when implemented
    # OthobaScraper(),  # add when implemented
]


async def run_all():
    for scraper in SCRAPERS:
        logger.info(f"=== Starting {scraper.store_name} ===")
        try:
            products = await scraper.scrape()
            if products:
                scraper.upsert_to_db(products)
                logger.info(f"=== {scraper.store_name}: {len(products)} products saved ===")
            else:
                logger.warning(f"=== {scraper.store_name}: 0 products — check scraper ===")
        except Exception as e:
            logger.error(f"=== {scraper.store_name} FAILED: {e} ===")


if __name__ == "__main__":
    asyncio.run(run_all())
