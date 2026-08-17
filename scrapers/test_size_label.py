"""Assertions for the shared size mapper, on real listing names.

Same contract as test_diaper_name.py: when a size miss shows up, extend this
file rather than patching one store, because every store now shares the mapper.

Run: python test_size_label.py
"""
from base import extract_weights, size_label_for


def size(name: str) -> str | None:
    return size_label_for(name, *extract_weights(name))


# Explicit BD letters — what the five near-identical per-store regexes handled.
LETTERS = [
    ("Huggies Wonder Pants M 7-12 kg 56 pcs", "M"),
    ("Supermom Baby Diaper Belt S 3-6 kg 20 pcs", "S"),
    ("Neocare Baby Diaper Belt XL (Free Parachute Lotion) 50 pcs", "XL"),
    ("MamyPoko Pants Extra Absorb L 9-14 kg 46 pcs", "L"),
    ("Savlon Twinkle Baby Pant Diaper XXL 14-25kg 16p", "XXL"),
    ("Huggies Ultra Soft Pants Large 8-13kg 42 pcs", "L"),
    ("Molfix Baby Diaper Pants Small 3-6 kg 76 pcs", "S"),
    # Othoba spells the big sizes out; a bare "large" alternative reads these as L.
    ("Huggies Dry Diaper Extra Large 11-16 kg 50 pcs", "XL"),
    ("Neocare Diaper Belt Double Extra Large 16-24 kg 30 pcs", "XXL"),
    # No word boundary before the "xl", so these need their own alternative.
    ("Huggies Dry Pant Style Diaper 2XL 15-25kg 36 Pieces", "XXL"),
    ("Kidz Diaper Pant 3XL 22-36kg 42pcs", "XXL"),
]

# Cases where a listing states the size two ways at once, and precedence
# decides. Every one of these was mislabelled in the live DB.
CONFLICTING = [
    # "Extra Large" contains "large"; the bare-letter route filed all of these
    # under L, which is a two-size error on a 12-17kg pack.
    ("MamyPoko Extra Large XL Pant Diaper 12-17 kg 48 pcs", "XL"),
    ("Molfix Baby Diaper Pants Super Pack Extra Large 15+ kg 58 pcs", "XL"),
    ("Supermom Baby Diaper Extra Large 12-17 kg 4 pcs", "XL"),
    ("Huggies Complete Comfort Wonder Pants XXXL Triple Extra Large Size 17 kgs 24 Count", "XXL"),
    # Abbreviation wins over the spelled-out line name: this is a XXL pack
    # whose line is called Extra Large.
    ("Avonee Pants Extra Large XXL 14-25kg 24 pcs", "XXL"),
    # "NB-8 kg" is where the weight range starts, so the letter is the size.
    ("Supermom Baby Belt Diaper S Size NB-8 kg 60pcs", "S"),
    ("Supermom Baby Diaper Small Newborn-8 kg 5 pcs", "S"),
    # But a newborn word standing alone is the size, gloss and all.
    ("Huggies Diapers Airsoft SJP Newborn (Small) 68pcs pack", "Newborn"),
    ("Huggies AirSoft Pants XXL - 24 pcs | Bubble-Bed Comfort", "XXL"),
    # Pampers' newborn line is called New Baby, not Newborn.
    ("Pampers New Baby Diapers 80 pcs", "Newborn"),
]

# The site taxonomy stops at XXL, so XXXL folds into it. Othoba already did
# this locally; Daraz and GoBaby left the same stock unlabelled.
XXXL = [
    ("MamyPoko XXXL Pant Diaper (18-35 kg) 22 pcs", "XXL"),
    ("MamyPoko Pants XXXL 24 pcs Boys", "XXL"),
    ("Kidz Diaper Pant XXXL 22-36kg 42pcs", "XXL"),
    ("Mamy Poko Pants Xxxl 18-35kg 7p", "XXL"),
]

NEWBORN = [
    ("Aiwibi Premium Baby Diapers NB 60 Pcs", "Newborn"),
    ("MamyPoko Newborn Diapers 58 pcs", "Newborn"),
    ("Mamy Poko Pants Nb1 Up To 5kg 66pcs", "Newborn"),
    ("Kidz NB Diapers 25 pcs", "Newborn"),
    ("Pampers New Born Taped Diaper 2-5 kg 80 pcs", "Newborn"),
]

# European numbering — the catalogue that never says a letter at all, and the
# reason Pampers and Molfix made up most of the unlabelled stock.
EUROPEAN = [
    ("Pampers Baby Dry 8 Jumbo Plus Belt 17+ kg 52 pcs", "XXL"),
    ("Pampers Premium Protection Diapers Size 4 62 pcs", "L"),
    ("Pampers Baby Dry Size 8 52 pcs", "XXL"),
    ("Pampers Baby Diaper Belt System Size 6 13-18kg 62 Pcs Pack Made in UK", "XXL"),
    ("Pampers Baby Size 5 Pant 12-17kg 60 pcs Made in UK", "XL"),
    ("Molfix Baby Diaper Belt Size 5 Junior 11-18kg 44 Pieces Turkey", "XL"),
    ("Molfix Baby Diaper Belt 3 Midi 60 Pcs Made in Turkey 4-9 KG", "M"),
    ("Molfix Baby Diaper Belt 2 Mini 3-6 kg 68pcs Made in Turkey", "S"),
    ("Molfix Baby Diaper Belt 4 Maxi 52pcs Pack Turkey", "L"),
    # Line word with no number at all — GoBaby names the size only this way.
    ("Molfix Maxi Tape Diaper 58 pcs", "L"),
    ("Molfix Mini Tape Diaper 68 pcs", "S"),
    ("Molfix Midi Tape Diaper 58 pcs", "M"),
    ("Molfix Junior Tape Diaper 44 pcs", "XL"),
    ("Molfix Pants Junior 5 68 pcs", "XL"),
]

# Weight only. The site's own chart overlaps on purpose (S 3-7, M 5-13,
# L 10-16), so the mapper keys on the lower bound.
WEIGHT_ONLY = [
    ("Molfix 3 Pants 6-11 kg Baby Diaper 58 Pcs Pack", "M"),
    ("Molfix 4 Pants 9-14 kg Baby Diaper 58 Pcs Pack", "L"),
    ("Molfix Baby Diaper Pants Super Pack Juni 12-17 kg 68 pcs", "XL"),
    ("Nannys Baby Love Diaper Belt 4 Maxi 8-18 kg 72 pcs", "L"),
    ("Aiwibi Baby Diaper Belt 0-5 kg 22 pcs", "Newborn"),
    ("Avonee Baby Diaper 17kg 32 Pcs All Day Comfort", "XXL"),
    ("Molfix 7 Pants Baby Diaper 19kg 36 Pcs Made in Turkey", "XXL"),
]

# "6 to 11kg" must parse as a range. When it didn't, the open-ended route read
# the upper number as the minimum and stored a 6-11kg pack as starting at 11.
WEIGHT_PARSING = [
    ("Molfix Baby Diaper Pants Size 3 Midi 6 to 11kg 60 Pieces", (6.0, 11.0)),
    ("Molfix Baby Diaper Belt 2 Mini 3 to 6 kg 68 Pcs Pack", (3.0, 6.0)),
    ("Huggies Wonder Pants M 7-12 kg 56 pcs", (7.0, 12.0)),
    ("Mamy Poko Pants Nb1 Up To 5kg 66pcs", (None, 5.0)),
    ("Pampers Baby Dry 8 Jumbo Plus Belt 17+ kg 52 pcs", (17.0, None)),
    ("Pampers Premium Protection Diapers 72 pcs", (None, None)),
]

# A bare digit is a pack count far more often than a size. Nothing here should
# be read as a European size number.
NOT_A_SIZE_NUMBER = [
    ("Aiwibi Premium Baby Diapers 22 pcs", None),
    ("Neocare Baby Diaper Belt 50 pcs", None),
    ("Bashundhara Baby Diaper Pant 32 Pcs", None),
]


def main() -> None:
    cases = (LETTERS + XXXL + CONFLICTING + NEWBORN + EUROPEAN
             + WEIGHT_ONLY + NOT_A_SIZE_NUMBER)
    failures = []
    for name, expected in cases:
        got = size(name)
        if got != expected:
            failures.append(f"  {name!r}\n    expected {expected!r}, got {got!r}")
    for name, expected in WEIGHT_PARSING:
        got = extract_weights(name)
        if got != expected:
            failures.append(f"  {name!r}\n    expected weights {expected}, got {got}")
    if failures:
        total = len(cases) + len(WEIGHT_PARSING)
        raise SystemExit(f"{len(failures)}/{total} failed:\n" + "\n".join(failures))
    print(f"all {len(cases) + len(WEIGHT_PARSING)} size assertions pass")


if __name__ == "__main__":
    main()
