import type { Metadata } from "next";
import { getBrandProducts } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";
import { SIZE_ORDER } from "@/lib/utils";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

const BRAND_META: Record<string, { name: string; description: string }> = {
  huggies:     { name: "Huggies",     description: "Huggies diaper prices in Bangladesh — compare Dry, Ultra Soft and Wonder Pants across Chaldal, Daraz and Othoba. Find the cheapest Huggies per piece." },
  mamypoko:    { name: "MamyPoko",    description: "MamyPoko Pants Extra Absorb prices in Bangladesh. Compare sizes S to XL across stores. Find today's cheapest MamyPoko per piece." },
  molfix:      { name: "Molfix",      description: "Molfix baby diaper prices in Bangladesh. Turkish-made Molfix Pants and Belt diapers compared across Chaldal and Daraz." },
  pampers:     { name: "Pampers",     description: "Pampers Baby Dry and Premium Care prices in Bangladesh. Find the cheapest Pampers diaper per piece today." },
  neocare:     { name: "Neocare",     description: "Neocare premium baby diaper prices in Bangladesh. Local brand, budget-friendly. Compare across stores." },
  bashundhara: { name: "Bashundhara", description: "Bashundhara Diapant prices in Bangladesh. Affordable local brand compared across Chaldal and Othoba." },
  avonee:      { name: "Avonee",      description: "Avonee diaper prices in Bangladesh. Budget belt and pants diapers compared across stores." },
  supermom:    { name: "Supermom",    description: "Supermom baby diaper prices in Bangladesh by Square Toiletries. Compare across Chaldal and Daraz." },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = BRAND_META[slug] ?? { name: slug, description: `${slug} diaper prices in Bangladesh` };
  return {
    title: `${meta.name} Diaper Price in Bangladesh — Cheapest Per Piece`,
    description: meta.description,
    alternates: { canonical: `https://diaperdam.com/brand/${slug}` },
  };
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = await getBrandProducts(slug).catch(() => [] as DiaperProduct[]);
  const meta = BRAND_META[slug] ?? { name: slug.charAt(0).toUpperCase() + slug.slice(1), description: "" };

  // Size summary: cheapest per-piece per size
  const sizeSummary = SIZE_ORDER
    .map(size => {
      const prods = products.filter(p => p.size_label === size);
      if (!prods.length) return null;
      const cheapest = prods.reduce((a, b) => a.price_per_piece < b.price_per_piece ? a : b);
      return { size, cheapest };
    })
    .filter(Boolean) as { size: string; cheapest: DiaperProduct }[];

  // JSON-LD structured data
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${meta.name} Diaper Prices in Bangladesh`,
    "description": meta.description,
    "numberOfItems": products.length,
    "itemListElement": products.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Product",
        "name": `${p.brand} ${p.line ?? ""} ${p.size_label ?? ""} ${p.pack_qty}pcs`.trim(),
        "brand": { "@type": "Brand", "name": p.brand },
        "offers": {
          "@type": "Offer",
          "price": p.price_bdt.toFixed(2),
          "priceCurrency": "BDT",
          "availability": "https://schema.org/InStock",
          "url": p.product_url ?? `https://diaperdam.com/brand/${slug}`,
          "seller": { "@type": "Organization", "name": p.store_name },
        },
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://diaperdam.com" },
      { "@type": "ListItem", "position": 2, "name": "Diapers", "item": "https://diaperdam.com/diapers" },
      { "@type": "ListItem", "position": 3, "name": meta.name, "item": `https://diaperdam.com/brand/${slug}` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What is the cheapest ${meta.name} diaper in Bangladesh?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": products.length > 0
            ? `The cheapest ${meta.name} diaper is currently ৳${products[0].price_per_piece.toFixed(2)} per piece (${products[0].size_label ?? ""} ${products[0].pack_qty}pcs) at ${products[0].store_name}.`
            : `Check DiaperDam daily for the latest ${meta.name} prices in Bangladesh.`,
        },
      },
      {
        "@type": "Question",
        "name": `Where to buy ${meta.name} diapers cheapest in Bangladesh?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `DiaperDam compares ${meta.name} prices across Chaldal, Daraz, Othoba, Shwapno, Arogga and more. The cheapest store changes daily — use the price index for a live comparison.`,
        },
      },
      {
        "@type": "Question",
        "name": `How much does ${meta.name} diaper cost per piece in Bangladesh?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": sizeSummary.length > 0
            ? `${meta.name} diaper costs vary by size: ${sizeSummary.map(s => `${s.size} from ৳${s.cheapest.price_per_piece.toFixed(2)}/pc`).join(", ")}.`
            : `${meta.name} diaper prices in Bangladesh are shown per piece on DiaperDam for easy comparison.`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    <div>
      <div className="bg-white border-b border-slate-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-slate-400 mb-1">
            <a href="/diapers" className="hover:text-emerald-600">All Diapers</a> / {meta.name}
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            {meta.name} Diaper Price in Bangladesh
          </h1>
          <p className="text-slate-500 text-sm mt-1">{meta.description}</p>

          {/* Size quick-nav */}
          {sizeSummary.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {sizeSummary.map(({ size, cheapest }) => (
                <div key={size} className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs">
                  <span className="font-bold text-slate-700">{size}</span>
                  <span className="text-emerald-700 font-semibold ml-2">৳{cheapest.price_per_piece.toFixed(2)}/pc</span>
                  <span className="text-slate-400 ml-1">{cheapest.store_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {products.length > 0 ? (
        <DiapersClient products={products} />
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>No {meta.name} products found yet. Check back after the next scrape.</p>
        </div>
      )}

      {/* SEO content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
          <h2 className="font-bold text-slate-900 mb-2">{meta.name} Diaper Price in Bangladesh (2026)</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{meta.description}</p>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            DiaperDam compares {meta.name} prices across Chaldal, Daraz, Othoba, Shwapno, Arogga and more daily.
            Prices are shown per diaper piece so you can compare different pack sizes fairly.
            A larger pack often means a lower cost per piece — use the sort to find the best value.
          </p>
        </div>

        {/* FAQ section */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
          <h2 className="font-bold text-slate-900 mb-4">{meta.name} Diapers Bangladesh — FAQ</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-800">
                What is the cheapest {meta.name} diaper in Bangladesh?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {products.length > 0
                  ? `Currently the cheapest ${meta.name} is ৳${products[0].price_per_piece.toFixed(2)} per piece (${products[0].size_label ?? ""} ${products[0].pack_qty}pcs at ${products[0].store_name}).`
                  : `DiaperDam tracks ${meta.name} prices daily. Check back after the next data refresh.`}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">
                Where to buy {meta.name} diapers cheapest in Bangladesh?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                DiaperDam compares {meta.name} across Chaldal, Daraz, Othoba, Shwapno and Arogga.
                Use the <a href="/price-index" className="text-emerald-600 hover:underline">Price Index</a> for a side-by-side store comparison.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">
                How much does {meta.name} cost per piece in Bangladesh?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {sizeSummary.length > 0
                  ? `${meta.name} per-piece price by size: ${sizeSummary.map(s => `${s.size}: ৳${s.cheapest.price_per_piece.toFixed(2)}`).join(" · ")}.`
                  : `All ${meta.name} prices are shown per diaper piece on this page for fair comparison across pack sizes.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}