"""Assertions for the per-store data-health gate.

Each case is a real historical miss, not an invented one. A gate nobody has
watched fail is not a gate — extend this file rather than trusting the shape of
the code.
"""
import os
from datetime import datetime, timedelta, timezone

os.environ.setdefault("DATABASE_URL", "postgresql://unused/for-import-only")

import health_check as hc

NOW = datetime(2026, 8, 19, 6, 0, tzinfo=timezone.utc)
FRESH = NOW - timedelta(hours=4)
LIVE = ["chaldal", "daraz", "othoba", "shwapno", "meenabazar", "gobaby"]

# The counts every live store really carried on 2026-08-19, all six verified.
HEALTHY = {
    "chaldal": (32, 97, FRESH),
    "daraz": (234, 566, FRESH),
    "othoba": (179, 179, FRESH),
    "shwapno": (57, 76, FRESH),
    "meenabazar": (91, 100, FRESH),
    "gobaby": (63, 74, FRESH),
}
NO_HISTORY = {s: (0.0, 0) for s in LIVE}
STEADY = {s: (float(HEALTHY[s][0]), 7) for s in LIVE}


def check(name, failures, expect_substr=None):
    if expect_substr is None:
        assert not failures, f"{name}: expected clean, got {failures}"
    else:
        assert any(expect_substr in f for f in failures), \
            f"{name}: expected a failure containing {expect_substr!r}, got {failures}"
    print(f"  ok  {name}")


def main():
    print("health-check gate")

    check("a good day is silent", hc.evaluate(LIVE, HEALTHY, STEADY, NOW))

    # Ordinary out-of-stock churn must not cry wolf, or the gate gets ignored.
    churn = dict(HEALTHY, chaldal=(24, 97, FRESH), daraz=(190, 566, FRESH))
    check("routine stock churn is silent", hc.evaluate(LIVE, churn, NO_HISTORY, NOW))

    # Othoba, from launch to 2026-08-10: green Action, zero rows.
    zero = dict(HEALTHY, othoba=(0, 179, FRESH))
    check("a store at zero trips FLOOR", hc.evaluate(LIVE, zero, NO_HISTORY, NOW), "FLOOR — othoba")

    # Meena Bazar, launch to 2026-08-14: 44 of its real 91, and the count never
    # dropped — so only an absolute floor can see it. This is the case that
    # rules out any history-derived threshold on its own.
    never_right = dict(HEALTHY, meenabazar=(44, 100, FRESH))
    check("a count that was never right trips FLOOR",
          hc.evaluate(LIVE, never_right, STEADY, NOW), "FLOOR — meenabazar")

    # Shwapno, 2026-07-13 to 07-24: rows simply stopped being touched.
    stale = dict(HEALTHY, shwapno=(57, 76, NOW - timedelta(hours=72)))
    fails = hc.evaluate(LIVE, stale, STEADY, NOW)
    check("11-day-stale rows trip STALE", fails, "STALE — shwapno")
    assert len(fails) == 1, f"stale store should report once, not twice: {fails}"

    check("a store never scraped trips STALE",
          hc.evaluate(LIVE, dict(HEALTHY, gobaby=(0, 0, None)), STEADY, NOW), "STALE — gobaby")

    # A regression that starts above the floor: Daraz halving to 160 clears its
    # floor of 150 and would take days to walk down to it.
    halved = dict(HEALTHY, daraz=(160, 566, FRESH))
    check("a collapse still above the floor trips DROP",
          hc.evaluate(LIVE, halved, STEADY, NOW), "DROP — daraz")

    # DROP must stay quiet until there is enough history to mean anything.
    thin = dict(STEADY, daraz=(234.0, 2))
    check("DROP holds fire on thin history", hc.evaluate(LIVE, halved, thin, NOW))

    # At Chaldal's size a percentage swing is noise, so DROP is not allowed to
    # speak there — the floor is the only thing guarding a small store.
    small = dict(HEALTHY, chaldal=(21, 97, FRESH))
    check("DROP holds fire on a small store", hc.evaluate(LIVE, small, STEADY, NOW))

    # DROP has to be tighter than every floor or it is dead code: a floor at 60%
    # of the real count already fires before any looser ratio can.
    for slug, floor in hc.FLOORS.items():
        real = HEALTHY[slug][0]
        if real >= hc.DROP_MIN_MEDIAN:
            assert hc.DROP_RATIO > floor / real, \
                f"DROP ratio {hc.DROP_RATIO} can never fire before {slug}'s floor ({floor / real:.0%})"
    print("  ok  DROP fires before the floor on every store it applies to")

    # The drift that already bit IndexNow and the sitemap twice.
    check("a store with no floor is reported",
          hc.evaluate(LIVE + ["newstore"], dict(HEALTHY, newstore=(5, 5, FRESH)), STEADY, NOW),
          "NO FLOOR SET")
    check("a floor for a dropped store is reported",
          hc.evaluate([s for s in LIVE if s != "chaldal"], HEALTHY, STEADY, NOW),
          "STALE FLOOR")

    # Floors have to sit under the real counts with room for churn, or the gate
    # fires on good days and gets muted.
    for slug, floor in hc.FLOORS.items():
        real = HEALTHY[slug][0]
        assert floor < real, f"{slug} floor {floor} is not below its real count {real}"
        assert floor >= real * 0.4, f"{slug} floor {floor} is so far under {real} it cannot fire"
    print("  ok  every floor sits below its real count with churn headroom")

    print("all health-check assertions pass")


if __name__ == "__main__":
    main()
