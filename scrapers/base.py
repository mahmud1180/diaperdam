"""Base scraper for DiaperDam — shared logic for all store scrapers."""
import asyncio
import logging
import os
import random
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone

import psycopg2
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

DATABASE_URL = os.environ["DATABASE_URL"]

# Cheapest real BDT/piece seen across stores is ~11; priciest imported ~90.
# Anything outside this band is a pack-qty parse failure, not a real price.
MIN_PRICE_PER_PIECE = 5.0
MAX_PRICE_PER_PIECE = 150.0

# Combined / bonus / tolerance pack notations, tried before a scraper's own
# "<N> Pcs" regex — otherwise that regex grabs the *bonus* number:
#   "30(+)10Pcs"      -> 40  (30 plus 10 free)
#   "48+2=50"         -> 50  (store states the total)
#   "-48+2(9-14kg)"   -> 50
#   "32+4s (15-25kg)" -> 36
#   "32(±)2Pcs"       -> 32  (tolerance, not a bonus — base qty only)
_PACK_TOLERANCE = re.compile(r"(\d+)\s*\(\s*(?:±|\+/-|\+-)\s*\)\s*\d+")
_PACK_TOTAL = re.compile(r"(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)")
_PACK_BONUS = re.compile(r"(\d+)\s*(?:\(\s*\+\s*\)|\+)\s*(\d+)\s*(?:s\b|pcs|pieces?|pc\b|\()")


def extract_combined_pack_qty(name: str) -> int | None:
    """Pack size for names that state a bonus/tolerance count. None if absent."""
    n = name.lower()
    m = _PACK_TOLERANCE.search(n)
    if m:
        return int(m.group(1))
    m = _PACK_TOTAL.search(n)
    if m:
        return int(m.group(3))
    m = _PACK_BONUS.search(n)
    if m:
        return int(m.group(1)) + int(m.group(2))
    return None


def is_baby_diaper(name: str) -> bool:
    """False for adult diapers and sanitary products that match diaper keywords."""
    n = name.lower()
    return not any(w in n for w in ["adult", "sanitary napkin", "panty liner", "maternity pad"])


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
        skipped = 0
        kept_ids: list[str] = []

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
                ppp = p.price_bdt / p.pack_qty if p.pack_qty else 0
                if not (MIN_PRICE_PER_PIECE <= ppp <= MAX_PRICE_PER_PIECE):
                    skipped += 1
                    logger.warning(
                        f"[{self.store_slug}] implausible ৳{ppp:.2f}/pc "
                        f"(৳{p.price_bdt} / {p.pack_qty}) — skipping {p.external_id}"
                    )
                    continue
                scraped += 1
                kept_ids.append(p.external_id)
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

            # Mark products NOT seen this run as missed. Rows skipped by the
            # plausibility guard count as unseen, so a listing that starts
            # parsing badly ages out of the comparison instead of poisoning it.
            seen_ids = kept_ids
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
            logger.info(
                f"[{self.store_slug}] Done: {scraped} scraped, {updated} new/updated"
                + (f", {skipped} skipped (implausible ৳/pc)" if skipped else "")
            )

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
