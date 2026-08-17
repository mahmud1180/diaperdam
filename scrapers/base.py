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


# Every store's catalog carries diapers whose name never says "diaper" —
# "Pampers Baby Dry 8 Jumbo Plus Belt 17+ kg 52 pcs" is the same miss that hid
# Shwapno's pants-type stock until 2026-07-24. Word lists alone can't see those,
# so a known diaper brand plus a diaper-shaped name is accepted as a second
# route. The brand gate is what keeps the looser rules from letting groceries in.
_ACCESSORY_WORDS = (
    "wipe", "tissue", "towel", "napkin", "paper", "rim", "cream", "lotion",
    "soap", "shampoo", "powder", "paste", "freshener", "detergent", "flour",
    "atta", "changing mat", "potty", "bin bag", "feeder", "bottle",
)
_DIAPER_WORDS = ("diaper", "diapers", "diapant", "nappy", "nappies")
_FORM_WORDS = ("belt", "pant", "pants")
_WEIGHT_SPAN = re.compile(
    r"\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?\s*kg"
    r"|\d+(?:\.\d+)?\s*\+\s*kg"
    r"|(?:over|above|up\s+to)\s+\d+(?:\.\d+)?\s*kg"
)
_PIECE_COUNT = re.compile(r"\d+\s*(?:pcs|pieces?|pc\b)")

# Diapers are routinely sold with a freebie named in the title —
# "NeoCare Baby Diaper Belt XL (Free Parachute Lotion) 50 pcs". The gift is an
# accessory; the product is not. Drop the clause before any accessory check, or
# the veto throws away real in-stock diapers.
_GIFT_CLAUSE = re.compile(r"\(\s*(?:with\s+)?free\b[^)]*\)|\bfree\s+\d*\s*(?:pcs\s+)?[a-z ]+$")


def strip_gift_clause(name: str) -> str:
    """Name with any 'free <gift>' bundle clause removed."""
    return _GIFT_CLAUSE.sub(" ", name.lower()).strip()


def is_diaper_name(name: str, extra_words: tuple[str, ...] = ()) -> bool:
    """True when a product name describes a baby disposable diaper.

    extra_words lets a store widen the accepted vocabulary when its endpoint is
    already scoped to diapers (Shwapno's category feeds say "Pants", not
    "Diaper"). Passing them here keeps that store's existing behaviour intact.
    """
    from brands import extract_brand

    if not is_baby_diaper(name):
        return False
    n = strip_gift_clause(name)
    if any(w in n for w in _ACCESSORY_WORDS):
        return False
    if any(w in n for w in _DIAPER_WORDS + extra_words):
        return True
    if not extract_brand(n):
        return False
    if any(w in n for w in _FORM_WORDS):
        return True
    return bool(_WEIGHT_SPAN.search(n) and _PIECE_COUNT.search(n))


# ---------------------------------------------------------------------------
# Size labelling
#
# Every store shipped its own near-identical `_extract_size`, all of which only
# understood BD letter sizes. That left 90 of 682 available SKUs (13%) with no
# size — invisible to /size/[size] and to every brand×size page, which is the
# core of the site. The misses are not random: they are the two catalogues that
# don't use letters at all.
#
#   1. European numbering (Pampers "Baby Dry 8", Molfix "4 Maxi", "3 Midi").
#      A manufacturer-fixed convention, so it maps more reliably than weight.
#   2. XXXL, which BD brands sell but the site taxonomy stops at XXL.
#
# The site's own chart has deliberately overlapping bands (S 3-7, M 5-13,
# L 10-16) because cut differs by brand, so weight is the last resort, keyed on
# the lower bound — that is what the stores' own declared labels agree on most.
_SIZE_ALIASES = {
    "3XL": "XXL", "XXXL": "XXL", "2XL": "XXL", "XXL": "XXL", "XL": "XL",
    "L": "L", "M": "M", "S": "S",
    "LARGE": "L", "MEDIUM": "M", "SMALL": "S",
}
# Pampers sells its newborn line as "New Baby", which no store's own filter saw.
_NEWBORN = re.compile(r"\bnew\s*born\b|\bnew\s+baby\b|\bnb\d?\b")
_NEWBORN_AS_BOUND = re.compile(r"\b(?:new\s*born|nb)\s*[-–]\s*\d+(?:\.\d+)?\s*kg")
_SPELLED_XXL = re.compile(r"\b(?:double|triple)\s+extra\s+large\b")
_SPELLED_XL = re.compile(r"\bextra\s+large\b")
# "2XL"/"3XL" have no word boundary before the "xl", so they need their own
# alternative or they fall through to the weight route and only look correct.
# Split from the bare letters because precedence differs — see size_label_for.
_EXPLICIT_SIZE = re.compile(r"\b(3xl|2xl|xxxl|xxl|xl)\b")
_BARE_SIZE = re.compile(r"\b(large|medium|small|[sml])\b")

# European size number → BD letter. Pampers and Molfix number identically for
# the ranges they share, and the table agrees with the majority of the labels
# the stores themselves declare (Molfix "4 Maxi" 9-14kg is L in 66 live rows;
# "5" at 12-17kg is XL in 37 rows against 5 that say L).
_EU_SIZE = {1: "Newborn", 2: "S", 3: "M", 4: "L", 5: "XL", 6: "XXL", 7: "XXL", 8: "XXL"}
_EU_LINE_WORDS = {"mini": 2, "midi": 3, "maxi": 4, "junior": 5}
# A bare digit is a pack count far more often than a size, so the number is only
# read when something anchors it: the word "size", the brand name, or the line
# word it belongs to. "Aiwibi ... 22 pcs" must not become size 2.
_EU_ANCHORED = re.compile(
    r"\bsize\s*[-:# ]?\s*(\d)\b"
    r"|\b(?:pampers|molfix|huggies)\s+(?:[a-z]+\s+){0,2}?(\d)\b"
    r"|\b(\d)\s*(?:mini|midi|maxi|junior)\b"
    r"|\b(?:mini|midi|maxi|junior)\s*(\d)\b"
)
_EU_LINE = re.compile(r"\b(mini|midi|maxi|junior)\b")


# "6 to 11kg" is as common as "6-11kg" on Daraz and Othoba. Without the word
# form the range misses, the open-ended route below then reads the *upper*
# number as the minimum, and a 6-11kg pack is stored as starting at 11.
_WEIGHT_RANGE = re.compile(
    r"(\d+(?:\.\d+)?)\s*(?:[-–]|to)\s*(\d+(?:\.\d+)?)\s*kg"
)
_WEIGHT_UP_TO = re.compile(r"up\s*to\s*(\d+(?:\.\d+)?)\s*kg")
_WEIGHT_FROM = re.compile(r"(\d+(?:\.\d+)?)\s*\+?\s*kg")


def extract_weights(name: str) -> tuple[float | None, float | None]:
    """(min, max) kg stated in a listing name. Either side may be None.

    Five stores carried a copy of this; Daraz's was missing the open-ended
    "17+ kg" route and so returned nothing for the whole Pampers Baby Dry line.
    """
    n = name.lower()
    m = _WEIGHT_RANGE.search(n)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = _WEIGHT_UP_TO.search(n)
    if m:
        return None, float(m.group(1))
    m = _WEIGHT_FROM.search(n)
    if m:
        return float(m.group(1)), None
    return None, None


def _size_from_abbrev(n: str) -> str | None:
    """XL and up, in whichever form the store printed it.

    An abbreviation beats the spelled-out phrase, because a listing carrying
    both means the abbreviation — Avonee's "Pants Extra Large XXL 14-25kg" is
    a XXL pack whose line is called Extra Large. Both beat the bare letters
    below, or the "large" inside "Extra Large" reads as L; that alone had 12
    XL and XXL packs filed under L, MamyPoko's whole 12-17kg range among them.
    """
    m = _EXPLICIT_SIZE.search(n)
    if m:
        return _SIZE_ALIASES[m.group(1).upper()]
    if _SPELLED_XXL.search(n):
        return "XXL"
    return "XL" if _SPELLED_XL.search(n) else None


def _size_from_bare_letter(n: str) -> str | None:
    m = _BARE_SIZE.search(n)
    return _SIZE_ALIASES.get(m.group(1).upper()) if m else None


def _size_from_eu_number(n: str) -> str | None:
    m = _EU_ANCHORED.search(n)
    if m:
        num = int(next(g for g in m.groups() if g))
        if num in _EU_SIZE:
            return _EU_SIZE[num]
    m = _EU_LINE.search(n)
    return _EU_SIZE[_EU_LINE_WORDS[m.group(1)]] if m else None


def _size_from_weight(w_min: float | None, w_max: float | None) -> str | None:
    """BD letter for a weight range, keyed on the lower bound.

    Upper-bound-only names ("up to 5 kg") are newborn packs; a lower bound of
    zero means the same. Everything else steps through the bands the stores'
    declared labels cluster on.
    """
    if w_min is None:
        return "Newborn" if w_max is not None and w_max <= 6 else None
    if w_min < 3:
        return "Newborn"
    if w_min < 4:
        return "S"
    if w_min < 6:
        return "S" if (w_max or 0) <= 8 else "M"
    if w_min < 9:
        return "M"
    if w_min < 12:
        return "L"
    if w_min < 14:
        return "XL"
    return "XXL"


def size_label_for(
    name: str, weight_min: float | None = None, weight_max: float | None = None
) -> str | None:
    """BD size letter for a listing, or None when nothing in the name says.

    Tried in order of how much the source actually commits to: an explicit
    letter, then the European size number, then the weight range.
    """
    n = name.lower()
    abbrev = _size_from_abbrev(n)
    if abbrev:
        return abbrev
    # "NB-8 kg" says where the pack's weight range starts, so the letter beside
    # it is the actual size — Supermom's "S Size NB-8 kg" is its S pack. A
    # newborn word standing on its own is the size, even when the store glosses
    # it: Huggies sells its newborn tape as "Airsoft SJP Newborn (Small)".
    if _NEWBORN.search(n) and not _NEWBORN_AS_BOUND.search(n):
        return "Newborn"
    return (
        _size_from_bare_letter(n)
        or _size_from_eu_number(n)
        or _size_from_weight(weight_min, weight_max)
    )


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
