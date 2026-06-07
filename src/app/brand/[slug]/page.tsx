import type { Metadata } from "next";
import { getBrandProducts } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";
import { SIZE_ORDER } from "@/lib/utils";

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
  const products = await getBrandProducts(slug).catch(() => []);
  const meta = BRAND_META[slug] ?? { name: slug.charAt(0).toUpperCase() + slug.slice(1), description: "" };

  // Size summary: cheapest per-piece per size
  const sizeSummary = SIZE_ORDER
    .map(size => {
      const prods = products.filter(p => p.size_label === size);
      if (!prods.length) return null;
      const cheapest = prods.reduce((a, b) => a.price_per_piece < b.price_per_piece ? a : b);
      return { size, cheapest };
    })
    .filter(Boolean) as { size: string; cheapest: typeof products[0] }[];

  return (
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
            DiaperDam compares {meta.name} prices across Chaldal, Daraz, Othoba and Shwapno daily.
            Prices are shown per diaper piece so you can compare different pack sizes fairly.
            A larger pack often means a lower cost per piece — use the sort to find the best value.
          </p>
        </div>
      </div>
    </div>
  );
}