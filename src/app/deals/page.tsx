import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Diaper Deals & Offers in Bangladesh Today — All Stores",
  description: "Best baby diaper deals and offers in Bangladesh today. Compare discounts on Huggies, MamyPoko, Molfix and Pampers across Chaldal, Daraz, Othoba and Shwapno. Updated daily.",
  alternates: { canonical: "https://diaperdam.com/deals" },
  keywords: ["diaper deals bangladesh", "baby diaper offer bangladesh", "diaper discount bd", "huggies offer", "mamypoko offer bangladesh", "cheap diaper bangladesh"],
};

async function getActiveDeals(): Promise<DiaperProduct[]> {
  // Get all available products sorted by discount
  const all = await getAllProducts({ sort: "discount_pct" }).catch(() => [] as DiaperProduct[]);
  // Filter for products with any promotion or discount
  const deals = all.filter(p => p.is_promotion || (p.discount_pct !== null && p.discount_pct > 0));
  return deals.slice(0, 60);
}

async function getCheapestPerPiece(): Promise<DiaperProduct[]> {
  const all = await getAllProducts({ sort: "price_per_piece" }).catch(() => [] as DiaperProduct[]);
  return all.slice(0, 40);
}

// JSON-LD schemas
const dealsPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Diaper Deals & Offers in Bangladesh Today",
  "description": "Best baby diaper deals and offers in Bangladesh across all major online stores. Updated daily.",
  "url": "https://diaperdam.com/deals",
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://diaperdam.com" },
      { "@type": "ListItem", "position": 2, "name": "Diaper Deals", "item": "https://diaperdam.com/deals" },
    ],
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Where can I find the cheapest baby diapers in Bangladesh?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "DiaperDam compares diaper prices across Chaldal, Daraz, Othoba, Shwapno, Arogga, AjkerDeal, GoBaby and Paikaree daily. The cheapest price per piece changes frequently — check the deals page for today's best offers.",
      },
    },
    {
      "@type": "Question",
      "name": "Do Chaldal and Daraz have diaper discounts?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, Chaldal and Daraz regularly offer discounts on Huggies, MamyPoko, Molfix and Pampers diapers. DiaperDam tracks promotions daily and shows the original vs. discounted price per piece.",
      },
    },
    {
      "@type": "Question",
      "name": "Which diaper is cheapest per piece in Bangladesh?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Local brands like Neocare, Avonee, and Bashundhara are typically cheapest per piece in Bangladesh. Among international brands, Molfix often has the lowest price per piece. DiaperDam's price index shows a real-time comparison.",
      },
    },
    {
      "@type": "Question",
      "name": "When do diaper prices drop in Bangladesh?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Diaper prices in Bangladesh often drop during Eid, national holidays, and special store sales. Larger pack sizes (50+ pcs) also offer a lower per-piece cost. DiaperDam tracks price changes daily.",
      },
    },
  ],
};

export default async function DealsPage() {
  const [deals, cheapest] = await Promise.all([
    getActiveDeals(),
    getCheapestPerPiece(),
  ]);

  const hasDeals = deals.length > 0;
  const displayProducts = hasDeals ? deals : cheapest;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dealsPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-400 mb-2">
            <a href="/" className="hover:text-emerald-600">Home</a>
            {" / "}
            <span>Diaper Deals</span>
          </nav>
          <div className="flex items-start gap-3">
            <span className="text-3xl" aria-hidden>🏷️</span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Diaper Deals &amp; Offers in Bangladesh Today
              </h1>
              <p className="text-slate-500 text-sm mt-1 max-w-2xl">
                {hasDeals
                  ? `${deals.length} active diaper deals across Chaldal, Daraz, Othoba, Shwapno and more — sorted by biggest discount. Updated daily.`
                  : `Today's cheapest diapers per piece across all BD stores. Prices updated daily.`}
              </p>
            </div>
          </div>

          {/* Store filter links */}
          <div className="flex flex-wrap gap-2 mt-4 text-xs">
            {["chaldal","daraz","othoba","shwapno","arogga"].map(store => (
              <a
                key={store}
                href={`/store/${store}`}
                className="bg-white border border-slate-200 rounded-full px-3 py-1 text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors capitalize"
              >
                {store === "ajkerdeal" ? "AjkerDeal" : store.charAt(0).toUpperCase() + store.slice(1)}
              </a>
            ))}
            <a href="/price-index" className="bg-emerald-600 text-white rounded-full px-3 py-1 hover:bg-emerald-700 transition-colors">
              Price Index →
            </a>
          </div>
        </div>
      </div>

      {/* Products */}
      {displayProducts.length > 0 ? (
        <DiapersClient products={displayProducts} />
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
          <p className="text-4xl mb-3">🔄</p>
          <p>Deals data loading — scrapers run daily at 08:00 BDT. Check back soon.</p>
        </div>
      )}

      {/* SEO + FAQ */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* Quick brand links */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
          <h2 className="font-bold text-slate-900 mb-3">Diaper Deals by Brand</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { slug: "huggies", name: "Huggies Deals" },
              { slug: "mamypoko", name: "MamyPoko Deals" },
              { slug: "molfix", name: "Molfix Deals" },
              { slug: "pampers", name: "Pampers Deals" },
              { slug: "neocare", name: "Neocare Deals" },
              { slug: "avonee", name: "Avonee Deals" },
              { slug: "bashundhara", name: "Bashundhara Deals" },
              { slug: "supermom", name: "Supermom Deals" },
            ].map(b => (
              <a
                key={b.slug}
                href={`/brand/${b.slug}`}
                className="text-sm text-emerald-700 hover:underline bg-emerald-50 rounded-lg px-3 py-2 text-center"
              >
                {b.name}
              </a>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
          <h2 className="font-bold text-slate-900 mb-4">Diaper Deals Bangladesh — FAQ</h2>
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-sm text-slate-800">Where can I find the cheapest baby diapers in Bangladesh?</h3>
              <p className="text-sm text-slate-600 mt-1">
                DiaperDam compares diaper prices across Chaldal, Daraz, Othoba, Shwapno, Arogga, AjkerDeal, GoBaby and Paikaree daily.
                The cheapest price per piece changes frequently — use the <a href="/price-index" className="text-emerald-600 hover:underline">Price Index</a> for a brand-by-brand view.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">Do Chaldal and Daraz offer diaper discounts?</h3>
              <p className="text-sm text-slate-600 mt-1">
                Yes. Chaldal and Daraz regularly run promotions on Huggies, MamyPoko, Molfix and Pampers.
                DiaperDam tracks these daily and shows the original vs. discounted price per piece.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">Which diaper is cheapest per piece in Bangladesh?</h3>
              <p className="text-sm text-slate-600 mt-1">
                Local brands like Neocare, Avonee, and Bashundhara are typically cheapest per piece.
                Among imported brands, Molfix often has the lowest price. Buying a larger pack (50+ pcs) also reduces the per-piece cost significantly.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">When do diaper prices drop in Bangladesh?</h3>
              <p className="text-sm text-slate-600 mt-1">
                Diaper prices often drop during Eid, national holidays, and special store sales.
                Larger pack sizes and combo deals offer the best value. DiaperDam tracks price changes daily so you never miss a drop.
              </p>
            </div>
          </div>
        </div>

        {/* Cross-links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <a href="/price-index" className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-emerald-200 transition-colors">
            <div className="font-semibold text-slate-800 text-sm">📊 Price Index</div>
            <div className="text-xs text-slate-500 mt-1">Compare prices across all stores side by side</div>
          </a>
          <a href="/size/m" className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-emerald-200 transition-colors">
            <div className="font-semibold text-slate-800 text-sm">📦 Medium (M) Diapers</div>
            <div className="text-xs text-slate-500 mt-1">Best selling size — compare all M-size prices</div>
          </a>
          <a href="/diapers" className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-emerald-200 transition-colors">
            <div className="font-semibold text-slate-800 text-sm">🔍 All Diapers</div>
            <div className="text-xs text-slate-500 mt-1">Browse every tracked diaper in Bangladesh</div>
          </a>
        </div>
      </div>
    </>
  );
}
