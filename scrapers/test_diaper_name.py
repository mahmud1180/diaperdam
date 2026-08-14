"""Assertions for the shared diaper-name filter.

Every string below is a real product name pulled from a live store response —
no invented cases. Run with `python test_diaper_name.py` from scrapers/.
"""
import sys

from base import is_diaper_name

# Names that must be ACCEPTED. The tricky ones say nothing about "diapers":
# Chaldal's Pampers listings describe the pack, not the product.
ACCEPT = [
    "Pampers Baby Dry 8 Jumbo Plus Belt 17+ kg 52 pcs",
    "Pampers Baby Dry 5 Jumbo Plus Belt 11-16 kg 72 pcs",
    "Pampers New Baby 2 Jumbo+ Pack 4-8 Kg Box 76 pcs",
    "Savlon Twinkle Baby Pant Diaper L 8-15 kg 34 pcs",
    "NeoCare Premium Baby Diaper Belt L (7-18 kg) 50 pcs",
    "Fresh Happy Nappy Pant Diaper XL (12 -17 kg) 32 pcs",
    "Bashundhara Diapant M 7-12 kg (Free Feeder 100 ml) 40 pcs",
    "NeoCare Baby Diaper Belt XL (Free Parachute Lotion) 50 pcs",
    "Supermom Baby Diaper Belt S New Born-8 kg (Free 80 Pcs Wipes) 28 pcs",
    "Nannys Baby Love Diaper Belt 4 Maxi 8-18 kg (Free Wipes 72 pcs) 25 pcs",
    "Huggies Ultra Baby Diaper Belt XXL (Over 14 kg) 26 pcs",
    "Supermom Super Pants M (6-12kg) 40Pcs",
]

# Names that must be REJECTED: adult products, and the groceries that Chaldal's
# unscoped search returns for a query like "bashundhara diaper".
REJECT = [
    "Thai Adult Pant Diaper M Waist Size 27-45 Inch 10 pcs",
    "SmartCare Adult Diaper M 60-110 cm 10 pcs",
    "Dr Rhazes High Absorbation Adult Diapers Large 10 pcs",
    "NeoCare Baby Wipes 180 pcs",
    "NeoCare Disinfectant Wipes 25 pcs",
    "Bashundhara Baby Wipes (Sky Blue) 120 pcs",
    "Bashundhara Toilet Tissue White Extra Savings Pack 4 pcs",
    "Bashundhara Kitchen Towel Rolls 2 pcs",
    "Bashundhara Paper Napkins 13\" Unscented 100 pcs",
    "Bashundhara Flour (Atta) 2 kg",
    "Bashundhara Air Freshener Orchid 300 ml",
    "Bashundhara Paper A4 Size (70 GSM) 1 Rim 1 pack",
    "Sonali A4 Size Paper (65 GSM) 1 Rim",
    "Vitalia Breakfast Muesli 1 kg",
    "Aquafresh Baby Paste (6-8 years) 50 ml",
    "Supermom Premium Mild Baby Wipes 120 pcs",
]


def main() -> int:
    failures = []
    for name in ACCEPT:
        if not is_diaper_name(name, extra_words=("pant",)):
            failures.append(f"should ACCEPT: {name}")
    for name in REJECT:
        if is_diaper_name(name, extra_words=("pant",)):
            failures.append(f"should REJECT: {name}")

    total = len(ACCEPT) + len(REJECT)
    for f in failures:
        print(f"FAIL {f}")
    print(f"{total - len(failures)}/{total} passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
