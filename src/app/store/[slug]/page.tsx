import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";
import { SIZE_ORDER, STORE_COLORS } from "@/lib/utils";

export const revalidate = 3600;

const STORE_META: Record<string, { name: string; color: string; description: string }> = {
  chaldal:    { name: "Chaldal",     color: "green",  description: "Chaldal diaper prices in Bangladesh. Compare Huggies, MamyPoko and Molfix prices on Chaldal with other stores." },
  daraz:      { name: "Daraz",       color: "orange", description: "Daraz diaper prices in Bangladesh. Find cheapest baby diapers on Daraz compared to Chaldal and Othoba." },
  othoba:     { name: "Othoba",      color: "blue",   description: "Othoba diaper prices in Bangladesh. Compare Huggies, MamyPoko and Molfix on Othoba vs other stores." },
  shwapno:    { name: "Shwapno",     color: "red",    description: "Shwapno diaper prices in Bangladesh. Compare prices across all major BD grocery stores." },
  arogga:     { name: "Arogga",      color: "purple", description: "Arogga diaper prices in Bangladesh. Pharmacy and grocery diaper prices compared per piece." },
  meenabazar: { name: "Meena Bazar", color: "teal",   description: "Meena Bazar diaper prices in Bangladesh. Compare Huggies and MamyPoko prices at Meena Bazar." },
  unimart:    { name: "Unimart",     color: "indigo", description: "Unimart diaper prices in Bangladesh. Find cheapest diapers at Unimart compared to other BD stores." },
};

const KNOWN_BRANDS = [
  { slug: "huggies",     name: "Huggies" },
  { slug: "mamypoko",    name: "MamyPoko" },
  { slug: "molfix",      name: "Molfix" },
  { slug: "pampers",     name: "Pampers" },
  { slug: "neocare",     name: "Neocare" },
  { slug: "bashundhara", name: "Bashundhara" },
  { slug: "avonee",      name: "Avonee" },
  { slug: "supermom",    name: "Supermom" },
];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = STORE_META[slug] ?? { name: slug, description: `${slug} diaper prices in Bangladesh` };
  return {
    title: `${meta.name} Diaper Prices — Compare All Brands | DiaperDam`,
    description: meta.description,
    alternates: { canonical: `https://diaperdam.com/store/${slug}` },
  };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = await getAllProducts({ store_slug: slug }).catch(() => []);
  const meta = STORE_META[slug] ?? {
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    color: "slate",
    description: `${slug} diaper prices in Bangladesh.`,
  };

  // Brands available in this store
  const brandsInStore = Array.from(new Set(products.map(p => p.brand_slug)));
  const brandTabs = KNOWN_BRANDS.filter(b => brandsInStore.includes(b.slug));

  // Size summary: cheapest per-piece per size across all brands in this store
  const sizeSummary = SIZE_ORDER
    .map(size => {
      const prods = products.filter(p => p.size_label === size);
      if (!prods.length) return null;
      const cheapest = prods.reduce((a, b) => a.price_per_piece < b.price_per_piece ? a : b);
      return { size, cheapest };
    })
    .filter(Boolean) as { size: string; cheapest: (typeof products)[0] }[];

  // JSON-LD ItemList schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${meta.name} Diaper Prices — Compare All Brands`,
    "description": meta.description,
    "url": `https://diaperdam.com/store/${slug}`,
    "numberOfItems": products.length,
    "itemListElement": products.slice(0, 50).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Product",
        "name": [p.brand, p.line, p.size_label, `${p.pack_qty}pcs`].filter(Boolean).join(" "),
        "brand": { "@type": "Brand", "name": p.brand },
        "offers": {
          "@type": "Offer",
          "price": p.price_bdt.toFixed(2),
          "priceCurrency": "BDT",
          "availability": "https://schema.org/InStock",
          "seller": { "@type": "Organization", "name": meta.name },
          ...(p.product_url ? { "url": p.product_url } : {}),
        },
      },
    })),
  };

  const storeColors = STORE_COLORS[slug] ?? { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-white border-b border-slate-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <p className="text-sm text-slate-400 mb-1">
            <a href="/" className="hover:text-emerald-600">Home</a>
            {" / "}
            <span className="text-slate-600">{meta.name}</span>
          </p>

          <h1 className="text-2xl font-bold text-slate-900">
            {meta.name} Diaper Prices &mdash; Compare All Brands
          </h1>
          <p className="text-slate-500 text-sm mt-1">{meta.description}</p>

          {/* Size quick-nav */}
          {sizeSummary.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {sizeSummary.map(({ size, cheapest }) => (
                <div
                  key={size}
                  className={`${storeColors.bg} ${storeColors.border} border rounded-xl px-3 py-2 text-xs`}
                >
                  <span className="font-bold text-slate-700">{size}</span>
                  <span className={`${storeColors.text} font-semibold ml-2`}>
                    &#2547;{cheapest.price_per_piece.toFixed(2)}/pc
                  </span>
                  <span className="text-slate-400 ml-1">{cheapest.brand}</span>
                </div>
              ))}
            </div>
          )}

          {/* Brand filter tabs */}
          {brandTabs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-xs text-slate-400 self-center mr-1">Filter by brand:</span>
              {brandTabs.map(b => (
                <a
                  key={b.slug}
                  href={`/store/${slug}?brand=${b.slug}`}
                  className="text-xs bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-700 text-slate-600 rounded-lg px-3 py-1.5 transition-colors"
                >
                  {b.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {products.length > 0 ? (
        <DiapersClient products={products} />
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
          <p className="text-4xl mb-3">&#128269;</p>
          <p>No products found for {meta.name} yet. Check back after the next scrape.</p>
        </div>
      )}

      {/* SEO content block */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
          <h2 className="font-bold text-slate-900 mb-2">
            Why Compare Diaper Prices on DiaperDam?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {meta.name} carries multiple diaper brands including Huggies, MamyPoko, and Molfix across
            different sizes and pack quantities. A larger pack almost always means a lower cost per
            piece &mdash; but comparing pack sizes manually is tedious.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            DiaperDam converts every listing to a price-per-piece so you can compare fairly.
            We track {meta.name} alongside Chaldal, Daraz, Othoba, Shwapno, and Arogga daily,
            so you always know whether {meta.name} has the best deal or if another store is cheaper
            right now.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            Prices update automatically after each scrape. Sort the table by price-per-piece,
            filter by brand or size, and click any row to go directly to the {meta.name} product page.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {KNOWN_BRANDS.map(b => (
              <a
                key={b.slug}
                href={`/brand/${b.slug}`}
                className="text-xs text-emerald-700 hover:underline"
              >
                {b.name} prices &#8594;
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}