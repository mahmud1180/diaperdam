"""Per-store data-health gate. Runs after the scrapers, fails the Action on breach.

Four stores have silently under-collected while the daily Action reported
SUCCESS — Shwapno (Jul-13, 11 days stale), Othoba (0 since launch), Meena Bazar
(missing 52 of 91 SKUs since launch), Chaldal (a real decay that still had to be
probed by hand). run_all.py catches an exception or a literal 0, and nothing
else: a store that returns half its catalogue looks identical to a good day.

So three independent checks, because no single one catches all four shapes:

  STALE  — the store's rows stopped being touched at all.
  FLOOR  — an absolute per-store expectation. This is the one that would have
           caught Meena Bazar: its count never *dropped*, it was simply never
           right, so anything derived from history would have ratified the bug.
           Floors are set well under the real count; they mean "broken", not
           "stock dipped".
  DROP   — a collapse against the trailing median, for regressions that start
           above the floor and would otherwise take days to walk down to it.

Snapshots are written on every run so DROP has history to read.
"""
import logging
import os
import re
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(message)s", stream=sys.stdout)
logger = logging.getLogger(__name__)

DATABASE_URL = os.environ["DATABASE_URL"]

# Absolute floors. Deliberately ~60% of the counts each store really carries, so
# ordinary out-of-stock churn never trips them and a halving always does.
# Reference counts when these were set (2026-08-19, all six verified correct):
#   daraz 234 · othoba 179 · meenabazar 91 · gobaby 63 · shwapno 57 · chaldal 32
# Raise a floor when a store's real catalogue grows; never lower one to silence
# an alert without first proving at the source that the loss is genuine.
FLOORS = {
    "daraz": 150,
    "othoba": 110,
    "meenabazar": 60,
    "gobaby": 40,
    "shwapno": 35,
    "chaldal": 20,
}

STALE_HOURS = 48
# DROP has to be *tighter* than the floors or it can never fire first: a floor
# set at 60% of the real count already catches everything a 60% ratio would.
# A quarter of a store's catalogue vanishing in a day is a regression, not
# stock. Small stores are exempt — at Chaldal's 32 SKUs the ratio is noise.
DROP_RATIO = 0.75
DROP_MIN_HISTORY = 3    # snapshots needed before DROP may fire
DROP_MIN_MEDIAN = 50    # below this a store is too small for a ratio to mean anything

CATALOG_TS = Path(__file__).resolve().parent.parent / "src" / "lib" / "catalog.ts"


def live_slugs_from_catalog() -> list[str]:
    """The site's own store list. Parsed, not duplicated — the hardcoded copy of
    this list has already drifted twice (IndexNow, sitemap)."""
    src = CATALOG_TS.read_text(encoding="utf-8")
    m = re.search(r"export const STORE_SLUGS = \[(.*?)\]", src, re.S)
    if not m:
        raise RuntimeError(f"could not parse STORE_SLUGS out of {CATALOG_TS}")
    return re.findall(r'"([a-z]+)"', m.group(1))


def snapshot(cur) -> dict[str, tuple[int, int, object]]:
    cur.execute(
        """
        SELECT s.slug,
               COUNT(*) FILTER (WHERE p.is_available) AS available,
               COUNT(p.id) AS total,
               MAX(p.last_scraped_at) AS last_scraped_at
        FROM stores s
        LEFT JOIN diaper_products p ON p.store_id = s.id
        GROUP BY s.slug
        """
    )
    return {r[0]: (r[1], r[2], r[3]) for r in cur.fetchall()}


def trailing_medians(cur, slugs: list[str]) -> dict[str, tuple[float, int]]:
    """Median available-count per store over its last 7 snapshots, this run
    excluded (it has not been written yet when this is called)."""
    out = {}
    for slug in slugs:
        cur.execute(
            """
            SELECT available_count FROM store_health_snapshots
            WHERE store_slug = %s ORDER BY recorded_at DESC LIMIT 7
            """,
            (slug,),
        )
        counts = sorted(r[0] for r in cur.fetchall())
        if not counts:
            out[slug] = (0.0, 0)
            continue
        mid = len(counts) // 2
        median = counts[mid] if len(counts) % 2 else (counts[mid - 1] + counts[mid]) / 2
        out[slug] = (float(median), len(counts))
    return out


def evaluate(live, counts, medians, now) -> list[str]:
    """Every failure the current data warrants, worst-shape first per store.

    Pure so it can be tested without a database — see test_health_check.py.
    `counts` maps slug -> (available, total, last_scraped_at);
    `medians` maps slug -> (trailing median, how many snapshots it came from).
    """
    failures: list[str] = []

    # Drift guard: a store the site serves but this gate does not know about is
    # an unmonitored store, which is exactly how the last four misses survived.
    unfloored = [s for s in live if s not in FLOORS]
    if unfloored:
        failures.append(f"NO FLOOR SET — {', '.join(unfloored)} is in STORE_SLUGS but not in FLOORS")
    orphans = [s for s in FLOORS if s not in live]
    if orphans:
        failures.append(f"STALE FLOOR — {', '.join(orphans)} has a floor but is no longer in STORE_SLUGS")

    for slug in live:
        available, _total, last = counts.get(slug, (0, 0, None))
        floor = FLOORS.get(slug)
        median, history = medians.get(slug, (0.0, 0))

        if last is None:
            failures.append(f"STALE — {slug} has never been scraped")
            continue
        age_h = (now - last).total_seconds() / 3600
        if age_h > STALE_HOURS:
            # A store nobody touched will also trip FLOOR; one line is enough.
            failures.append(f"STALE — {slug} last scraped {age_h:.1f}h ago (limit {STALE_HOURS}h)")
            continue

        if floor is not None and available < floor:
            failures.append(f"FLOOR — {slug} has {available} available, floor is {floor}")
        elif (
            history >= DROP_MIN_HISTORY
            and median >= DROP_MIN_MEDIAN
            and available < median * DROP_RATIO
        ):
            failures.append(
                f"DROP — {slug} has {available} available vs trailing median {median:.0f} "
                f"({available / median:.0%}, limit {DROP_RATIO:.0%})"
            )

    return failures


def main() -> int:
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS store_health_snapshots (
          id SERIAL PRIMARY KEY,
          store_slug TEXT NOT NULL,
          available_count INTEGER NOT NULL,
          total_count INTEGER NOT NULL,
          last_scraped_at TIMESTAMPTZ,
          recorded_at TIMESTAMPTZ DEFAULT NOW()
        )
        """
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_health_store_time "
        "ON store_health_snapshots(store_slug, recorded_at DESC)"
    )

    live = live_slugs_from_catalog()
    counts = snapshot(cur)
    medians = trailing_medians(cur, live)
    cur.execute("SELECT NOW()")
    now = cur.fetchone()[0]

    logger.info("store         available  total   floor   median(7)  age")
    for slug in live:
        available, total, last = counts.get(slug, (0, 0, None))
        median, _history = medians.get(slug, (0.0, 0))
        age = "never" if last is None else f"{(now - last).total_seconds() / 3600:.1f}h"
        logger.info(
            f"{slug:<13} {available:>9}  {total:>5}   {str(FLOORS.get(slug)):>5}   "
            f"{median:>9.0f}  {age:>7}"
        )

    failures = evaluate(live, counts, medians, now)

    for slug in live:
        available, total, last = counts.get(slug, (0, 0, None))
        cur.execute(
            "INSERT INTO store_health_snapshots (store_slug, available_count, total_count, last_scraped_at) "
            "VALUES (%s, %s, %s, %s)",
            (slug, available, total, last),
        )

    cur.close()
    conn.close()

    if failures:
        logger.error("")
        logger.error("DATA HEALTH: FAIL")
        for f in failures:
            logger.error(f"  {f}")
        logger.error("")
        logger.error(
            "A store under-collecting is a scraper bug until proven otherwise — "
            "probe the source before touching FLOORS."
        )
        return 1

    logger.info("")
    logger.info(f"DATA HEALTH: OK — {len(live)} stores fresh and above floor")
    return 0


if __name__ == "__main__":
    sys.exit(main())
