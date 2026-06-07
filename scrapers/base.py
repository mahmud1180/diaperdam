"""Base scraper for DiaperDam — shared logic for all store scrapers."""
import asyncio
import logging
import os
import random
from dataclasses import dataclass, field
from datetime import datetime, timezone

import psycopg2
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

DATABASE_URL = os.environ["DATABASE_URL"]


@dataclass
class ScrapedDiaper:
    external_id: str
    brand: str
    brand_slug: str
    pack_qty: int
    price_bdt: float

    line: str | None = None
    type: str | None = None          # 'belt' | 'pants' | 'swim'
    size_label: str | None = None    # 'Newborn', 'S', 'M', 'L', 'XL', 'XXL'
    weight_min_kg: float | None = None
    weight_max_kg: float | None = None
    image_url: str | None = None
    product_url: str | None = None
    original_price_bdt: float | None = None
    discount_pct: float | None = None
    is_promotion: bool = False
    promotion_label: str | None = None


class BaseScraper:
    store_slug: str = ""
    store_name: str = ""

    async def scrape(self) -> list[ScrapedDiaper]:
        raise NotImplementedError

    async def rate_limit(self, base: float = 1.5):
        jitter = base * 0.4
        delay = base + random.uniform(-jitter, jitter)
        await asyncio.sleep(max(0.8, delay))

    def upsert_to_db(self, products: list[ScrapedDiaper]):
        """Write scraped products to Neon, update price history for changes."""
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        now = datetime.now(timezone.utc)
        scraped = 0
        updated = 0

        # Log run start
        cur.execute(
            "INSERT INTO scrape_log (store_slug, started_at) VALUES (%s, %s) RETURNING id",
            (self.store_slug, now)
        )
        log_id = cur.fetchone()[0]
        conn.commit()

        try:
            # Get store_id
            cur.execute("SELECT id FROM stores WHERE slug = %s", (self.store_slug,))
            row = cur.fetchone()
            if not row:
                raise ValueError(f"Store '{self.store_slug}' not in DB — run schema.sql first")
            store_id = row[0]

            for p in products:
                scraped += 1
                discount_pct = p.discount_pct
                if discount_pct is None and p.original_price_bdt and p.original_price_bdt > p.price_bdt:
                    discount_pct = round((1 - p.price_bdt / p.original_price_bdt) * 100, 1)

                cur.execute("""
                    SELECT id, price_bdt FROM diaper_products
                    WHERE store_id = %s AND external_id = %s
                """, (store_id, p.external_id))
                existing = cur.fetchone()

                if existing:
                    prod_id, old_price = existing
                    price_changed = abs(float(old_price) - p.price_bdt) > 0.01

                    cur.execute("""
                        UPDATE diaper_products SET
                            brand=%s, brand_slug=%s, line=%s, type=%s,
                            size_label=%s, weight_min_kg=%s, weight_max_kg=%s,
                            pack_qty=%s, image_url=%s, product_url=%s,
                            price_bdt=%s, original_price_bdt=%s, discount_pct=%s,
                            is_promotion=%s, promotion_label=%s,
                            is_available=TRUE, consecutive_misses=0,
                            last_scraped_at=%s, updated_at=%s
                        WHERE id=%s
                    """, (
                        p.brand, p.brand_slug, p.line, p.type,
                        p.size_label, p.weight_min_kg, p.weight_max_kg,
                        p.pack_qty, p.image_url, p.product_url,
                        p.price_bdt, p.original_price_bdt, discount_pct,
                        p.is_promotion, p.promotion_label,
                        now, now, prod_id
                    ))
                    if price_changed:
                        updated += 1
                        cur.execute("""
                            INSERT INTO price_history (product_id, price_bdt, price_per_piece, scraped_at)
                            VALUES (%s, %s, %s, %s)
                        """, (prod_id, p.price_bdt, round(p.price_bdt / p.pack_qty, 2), now))
                else:
                    cur.execute("""
                        INSERT INTO diaper_products (
                            store_id, external_id, brand, brand_slug, line, type,
                            size_label, weight_min_kg, weight_max_kg, pack_qty,
                            image_url, product_url, price_bdt, original_price_bdt,
                            discount_pct, is_promotion, promotion_label,
                            last_scraped_at, created_at, updated_at
                        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        RETURNING id
                    """, (
                        store_id, p.external_id, p.brand, p.brand_slug, p.line, p.type,
                        p.size_label, p.weight_min_kg, p.weight_max_kg, p.pack_qty,
                        p.image_url, p.product_url, p.price_bdt, p.original_price_bdt,
                        discount_pct, p.is_promotion, p.promotion_label,
                        now, now, now
                    ))
                    prod_id = cur.fetchone()[0]
                    updated += 1
                    # Insert initial price history
                    cur.execute("""
                        INSERT INTO price_history (product_id, price_bdt, price_per_piece, scraped_at)
                        VALUES (%s, %s, %s, %s)
                    """, (prod_id, p.price_bdt, round(p.price_bdt / p.pack_qty, 2), now))

            # Mark products NOT seen this run as missed
            seen_ids = [p.external_id for p in products]
            if seen_ids:
                cur.execute("""
                    UPDATE diaper_products SET consecutive_misses = consecutive_misses + 1
                    WHERE store_id = %s AND external_id != ALL(%s)
                """, (store_id, seen_ids))
                cur.execute("""
                    UPDATE diaper_products SET is_available = FALSE
                    WHERE store_id = %s AND consecutive_misses >= 3
                """, (store_id,))

            # Update scrape log
            cur.execute("""
                UPDATE scrape_log SET finished_at=%s, products_scraped=%s,
                    products_updated=%s, status='success'
                WHERE id=%s
            """, (datetime.now(timezone.utc), scraped, updated, log_id))
            conn.commit()
            logger.info(f"[{self.store_slug}] Done: {scraped} scraped, {updated} new/updated")

        except Exception as e:
            conn.rollback()
            cur.execute("""
                UPDATE scrape_log SET finished_at=%s, error=%s, status='error' WHERE id=%s
            """, (datetime.now(timezone.utc), str(e), log_id))
            conn.commit()
            logger.error(f"[{self.store_slug}] Error: {e}")
            raise
        finally:
            cur.close()
            conn.close()
