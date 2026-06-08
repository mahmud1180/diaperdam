"""Shared brand extraction for all DiaperDam scrapers.

Single source of truth for BD diaper brand names, slugs, and display names.
If a product name doesn't match any known brand, extract_brand() returns None
so the scraper can skip it (prevents junk like "10Pcs/5Pcs/3Pcs" as a brand).
"""

# keyword (lowercase) -> slug
BRAND_SLUG_MAP: dict[str, str] = {
    # International
    "huggies":      "huggies",
    "mamypoko":     "mamypoko",
    "mamy poko":    "mamypoko",
    "molfix":       "molfix",
    "pampers":      "pampers",
    # Bangladeshi
    "neocare":      "neocare",
    "neo care":     "neocare",
    "bashundhara":  "bashundhara",
    "diapant":      "bashundhara",
    "avonee":       "avonee",
    "supermom":     "supermom",
    "super mom":    "supermom",
    "smc smile":    "smc-smile",
    "savlon":       "savlon",
    "twinkle":      "savlon",
    "happy nappy":  "happy-nappy",
    "happynappy":   "happy-nappy",
    # Less common but real
    "aiwibi":       "aiwibi",
    "mumlove":      "mumlove",
    "mum love":     "mumlove",
    "chu chu":      "chuchu",
    "chu-chu":      "chuchu",
    "chuchu":       "chuchu",
    "kidstar":      "kidstar",
    "kidz":         "kidz",
    "momotaro":     "momotaro",
    "nannys":       "nannys",
    "nanny":        "nannys",
    "komfort":      "komfort",
    "kinder":       "kinder",
    "predo":        "predo",
    "petpet":       "petpet",
    "pet pet":      "petpet",
    "merries":      "merries",
    "goon":         "goon",
    "goo.n":        "goon",
    "kayra":        "kayra",
    "bumtum":       "bumtum",
}

# slug -> display name
BRAND_DISPLAY: dict[str, str] = {
    "huggies":      "Huggies",
    "mamypoko":     "MamyPoko",
    "molfix":       "Molfix",
    "pampers":      "Pampers",
    "neocare":      "Neocare",
    "bashundhara":  "Bashundhara",
    "avonee":       "Avonee",
    "supermom":     "Supermom",
    "smc-smile":    "SMC Smile",
    "savlon":       "Savlon",
    "happy-nappy":  "Happy Nappy",
    "aiwibi":       "Aiwibi",
    "mumlove":      "MumLove",
    "chuchu":       "Chu Chu",
    "kidstar":      "Kidstar",
    "kidz":         "Kidz",
    "momotaro":     "Momotaro",
    "nannys":       "Nannys",
    "komfort":      "Komfort",
    "kinder":       "Kinder",
    "predo":        "Predo",
    "petpet":       "PetPet",
    "merries":      "Merries",
    "goon":         "Goo.N",
    "kayra":        "Kayra",
    "bumtum":       "BumTum",
}


def extract_brand(name: str) -> tuple[str, str] | None:
    """Extract brand from product name.

    Returns (display_name, slug) or None if no known brand matches.
    Returning None lets the scraper skip junk products.
    """
    n = name.lower()
    for keyword, slug in BRAND_SLUG_MAP.items():
        if keyword in n:
            display = BRAND_DISPLAY.get(slug, keyword.title())
            return display, slug
    return None
