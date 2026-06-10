import type { Metadata } from "next";
import Link from "next/link";
import { getCheapestByBrand, getAllProducts, getBrands } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";

export const revalidate = 3600;

const BASE = "https://diaperdam.com";

const BN_MONTHS = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

const BRAND_META: Record<string, { name: string; nameBn: string }> = {
  huggies:       { name: "Huggies",       nameBn: "হাগিস" },
  mamypoko:      { name: "MamyPoko",      nameBn: "ম্যামিপোকো" },
  molfix:        { name: "Molfix",        nameBn: "মলফিক্স" },
  pampers:       { name: "Pampers",       nameBn: "প্যাম্পারস" },
  neocare:       { name: "Neocare",       nameBn: "নিওকেয়ার" },
  bashundhara:   { name: "Bashundhara",   nameBn: "বসুন্ধরা" },
  avonee:        { name: "Avonee",        nameBn: "অ্যাভোনি" },
  supermom:      { name: "Supermom",      nameBn: "সুপারমম" },
  savlon:        { name: "Savlon",        nameBn: "স্যাভলন" },
  aiwibi:        { name: "Aiwibi",        nameBn: "আইউইবি" },
  "happy-nappy": { name: "Happy Nappy",   nameBn: "হ্যাপি ন্যাপি" },
};

const SIZE_META: Record<string, { label: string; labelBn: string; weightBn: string }> = {
  Newborn: { label: "Newborn", labelBn: "নবজাতক", weightBn: "০-৫ কেজি" },
  S:       { label: "S",       labelBn: "S",       weightBn: "৪-৮ কেজি" },
  M:       { label: "M",       labelBn: "M",       weightBn: "৬-১১ কেজি" },
  L:       { label: "L",       labelBn: "L",       weightBn: "৯-১৪ কেজি" },
  XL:      { label: "XL",      labelBn: "XL",      weightBn: "১২-১৭ কেজি" },
  XXL:     { label: "XXL",     labelBn: "XXL",     weightBn: "১৫+ কেজি" },
};

const SIZE_ORDER = ["Newborn", "S", "M", "L", "XL", "XXL"];

export async function generateMetadata(): Promise<Metadata> {
  const month = BN_MONTHS[new Date().getMonth()];
  const brands = await getBrands().catch(() => []);
  const totalProducts = brands.reduce((sum, b) => sum + b.count, 0);

  return {
    title: `বাংলাদেশে সব ডায়াপারের দাম তুলনা — ${month} ২০২৬ | ব্র্যান্ড × সাইজ`,
    description: `${month} ২০২৬: বাংলাদেশে ${brands.length}+ ব্র্যান্ডের ডায়াপার দাম তুলনা। Huggies, MamyPoko, Molfix, Bashundhara — সব সাইজে প্রতি পিস দাম। ${totalProducts}+ পণ্য সব দোকান থেকে।`,
    alternates: { canonical: `${BASE}/diapers` },
  };
}

export default async function DiapersHubPage() {
  let cheapestGrid: Awaited<ReturnType<typeof getCheapestByBrand>> = [];
  let products: Awaited<ReturnType<typeof getAllProducts>> = [];
  let brands: Awaited<ReturnType<typeof getBrands>> = [];

  try {
    [cheapestGrid, products, brands] = await Promise.all([
      getCheapestByBrand().catch(() => []),
      getAllProducts({ sort: "price_per_piece" }).catch(() => []),
      getBrands().catch(() => []),
    ]);
  } catch {
    // render with empty data
  }

  // Build a lookup: brand_slug -> size_label -> { price, store, pack_qty }
  const gridMap = new Map<string, Map<string, { price: number; store: string; pack_qty: number }>>();
  for (const row of cheapestGrid) {
    if (!gridMap.has(row.brand_slug)) gridMap.set(row.brand_slug, new Map());
    gridMap.get(row.brand_slug)!.set(row.size_label, {
      price: Number(row.min_price_per_piece),
      store: row.store_name,
      pack_qty: row.pack_qty,
    });
  }

  // Order brands by product count (descending), use DB brands list
  const orderedBrands = brands
    .sort((a, b) => b.count - a.count)
    .filter(b => gridMap.has(b.brand_slug));

  // Sizes that actually have data
  const activeSizes = SIZE_ORDER.filter(s =>
    cheapestGrid.some(r => r.size_label === s)
  );

  const month = BN_MONTHS[new Date().getMonth()];
  const totalProducts = brands.reduce((sum, b) => sum + b.count, 0);

  // JSON-LD: BreadcrumbList
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "হোম", "item": BASE },
      { "@type": "ListItem", "position": 2, "name": "সব ডায়াপার", "item": `${BASE}/diapers` },
    ],
  };

  // JSON-LD: ItemList for the hub
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "বাংলাদেশে সব ডায়াপার ব্র্যান্ড ও সাইজ",
    "description": `${month} ২০২৬: বাংলাদেশে ${orderedBrands.length} ব্র্যান্ডের ডায়াপার দাম তুলনা।`,
    "url": `${BASE}/diapers`,
    "numberOfItems": orderedBrands.length,
    "itemListElement": orderedBrands.map((b, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": BRAND_META[b.brand_slug]?.name ?? b.brand,
      "url": `${BASE}/brand/${b.brand_slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div>
        {/* ─── Hero ─── */}
        <section className="bg-gradient-to-br from-teal-600 via-emerald-600 to-emerald-700 text-white py-10 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-emerald-200 mb-1">
              <Link href="/" className="hover:text-white transition-colors">হোম</Link> / সব ডায়াপার
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              বাংলাদেশে সব ডায়াপারের দাম তুলনা
            </h1>
            <p className="text-emerald-100">
              <strong className="text-white">{orderedBrands.length}</strong> টি ব্র্যান্ড &middot;{" "}
              <strong className="text-white">{activeSizes.length}</strong> টি সাইজ &middot;{" "}
              <strong className="text-white">{totalProducts || "200+"}</strong> টি পণ্য
            </p>
            <p className="text-emerald-200 text-sm mt-2">
              {month} ২০২৬ আপডেট — প্রতি পিস সবচেয়ে কম দাম
            </p>
          </div>
        </section>

        {/* ─── Brand × Size Grid ─── */}
        {orderedBrands.length > 0 && activeSizes.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-8">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              ব্র্যান্ড × সাইজ — সবচেয়ে সস্তা প্রতি পিস দাম
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              যেকোনো ঘরে ক্লিক করলে সেই ব্র্যান্ড ও সাইজের সব অফার দেখবেন
            </p>

            {/* Desktop grid (table) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-3 bg-slate-50 border border-slate-200 font-semibold text-slate-600 rounded-tl-xl">
                      ব্র্যান্ড
                    </th>
                    {activeSizes.map(size => {
                      const sm = SIZE_META[size];
                      return (
                        <th key={size} className="py-3 px-2 bg-slate-50 border border-slate-200 text-center">
                          <Link
                            href={`/size/${size.toLowerCase()}`}
                            className="hover:text-emerald-600 transition-colors"
                          >
                            <div className="font-bold text-slate-700">
                              {size === "Newborn" ? "NB" : size}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">{sm?.weightBn}</div>
                          </Link>
                        </th>
                      );
                    })}
                    <th className="py-3 px-3 bg-slate-50 border border-slate-200 text-center font-semibold text-slate-600 rounded-tr-xl">
                      সব সাইজ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderedBrands.map((b) => {
                    const brandName = BRAND_META[b.brand_slug]?.name ?? b.brand;
                    const brandSizes = gridMap.get(b.brand_slug);
                    return (
                      <tr key={b.brand_slug} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-2.5 px-3 border border-slate-200 font-semibold text-slate-800">
                          <Link
                            href={`/brand/${b.brand_slug}`}
                            className="hover:text-emerald-600 transition-colors"
                          >
                            {brandName}
                          </Link>
                          <span className="text-xs text-slate-400 ml-1.5">({b.count})</span>
                        </td>
                        {activeSizes.map(size => {
                          const cell = brandSizes?.get(size);
                          if (!cell) {
                            return (
                              <td key={size} className="py-2.5 px-2 border border-slate-200 text-center text-slate-200">
                                &mdash;
                              </td>
                            );
                          }
                          return (
                            <td key={size} className="py-2.5 px-2 border border-slate-200 text-center">
                              <Link
                                href={`/brand/${b.brand_slug}/size/${size.toLowerCase()}`}
                                className="block hover:bg-emerald-100 rounded-lg px-1 py-1 transition-colors"
                              >
                                <span className="font-bold text-emerald-700">
                                  ৳{cell.price.toFixed(2)}
                                </span>
                                <span className="block text-[10px] text-slate-400 mt-0.5">
                                  {cell.store}
                                </span>
                              </Link>
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 border border-slate-200 text-center">
                          <Link
                            href={`/brand/${b.brand_slug}`}
                            className="text-xs font-semibold text-emerald-600 hover:underline"
                          >
                            দেখুন →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Footer row: links to size pages */}
                <tfoot>
                  <tr>
                    <td className="py-2.5 px-3 bg-slate-50 border border-slate-200 font-semibold text-slate-600">
                      সব ব্র্যান্ড
                    </td>
                    {activeSizes.map(size => (
                      <td key={size} className="py-2.5 px-2 bg-slate-50 border border-slate-200 text-center">
                        <Link
                          href={`/size/${size.toLowerCase()}`}
                          className="text-xs font-semibold text-emerald-600 hover:underline"
                        >
                          দেখুন →
                        </Link>
                      </td>
                    ))}
                    <td className="bg-slate-50 border border-slate-200" />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile grid (cards) */}
            <div className="md:hidden space-y-4">
              {orderedBrands.map((b) => {
                const brandName = BRAND_META[b.brand_slug]?.name ?? b.brand;
                const brandSizes = gridMap.get(b.brand_slug);
                return (
                  <div key={b.brand_slug} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Link
                        href={`/brand/${b.brand_slug}`}
                        className="font-bold text-slate-900 hover:text-emerald-600 transition-colors"
                      >
                        {brandName}
                      </Link>
                      <span className="text-xs text-slate-400">{b.count} পণ্য</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {activeSizes.map(size => {
                        const cell = brandSizes?.get(size);
                        const sm = SIZE_META[size];
                        if (!cell) {
                          return (
                            <div key={size} className="text-center py-2 rounded-lg bg-slate-50 text-slate-300 text-xs">
                              {size === "Newborn" ? "NB" : size}
                              <br />—
                            </div>
                          );
                        }
                        return (
                          <Link
                            key={size}
                            href={`/brand/${b.brand_slug}/size/${size.toLowerCase()}`}
                            className="text-center py-2 rounded-lg bg-emerald-50 border border-emerald-100 hover:border-emerald-300 transition-colors"
                          >
                            <div className="text-[10px] text-slate-500 font-medium">
                              {size === "Newborn" ? "NB" : size}
                              {sm && <span className="text-slate-400 ml-0.5">({sm.weightBn})</span>}
                            </div>
                            <div className="font-bold text-emerald-700 text-sm">
                              ৳{cell.price.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-400">{cell.store}</div>
                          </Link>
                        );
                      })}
                    </div>
                    <Link
                      href={`/brand/${b.brand_slug}`}
                      className="block text-center text-xs font-semibold text-emerald-600 mt-3 hover:underline"
                    >
                      সব {brandName} ডায়াপার দেখুন →
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Quick links: by size ─── */}
        <section className="bg-slate-50 border-y border-slate-100 py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4">সাইজ অনুযায়ী ডায়াপার</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {SIZE_ORDER.map(size => {
                const sm = SIZE_META[size];
                return (
                  <Link
                    key={size}
                    href={`/size/${size.toLowerCase()}`}
                    className="bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl p-4 text-center transition-colors group"
                  >
                    <div className="text-2xl font-bold text-emerald-700 group-hover:text-emerald-600">
                      {size === "Newborn" ? "NB" : size}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 mt-1">
                      {size === "Newborn" ? sm?.labelBn : `সাইজ ${sm?.labelBn}`}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{sm?.weightBn}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Quick links: by brand ─── */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">ব্র্যান্ড অনুযায়ী ডায়াপার</h2>
          <div className="flex flex-wrap gap-2">
            {orderedBrands.map(b => {
              const brandName = BRAND_META[b.brand_slug]?.name ?? b.brand;
              return (
                <Link
                  key={b.brand_slug}
                  href={`/brand/${b.brand_slug}`}
                  className="bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 hover:text-emerald-700 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                >
                  {brandName} <span className="text-slate-400 text-xs">({b.count})</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ─── Full product listing ─── */}
        {products.length > 0 && (
          <section>
            <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
              <h2 className="text-lg font-bold text-slate-900">সব ডায়াপার — প্রতি পিস দাম অনুযায়ী</h2>
              <p className="text-sm text-slate-500">ফিল্টার ও সর্ট করে আপনার পছন্দের ডায়াপার খুঁজুন</p>
            </div>
            <DiapersClient products={products} />
          </section>
        )}

        {/* ─── SEO content block ─── */}
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
            <h2 className="font-bold text-slate-900 mb-2">
              বাংলাদেশে ডায়াপারের দাম তুলনা — {month} ২০২৬
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              DiaperDam বাংলাদেশের সব বড় অনলাইন দোকান থেকে ডায়াপারের দাম প্রতিদিন তুলনা করে।
              চালডাল, দারাজ, স্বপ্ন, মীনা বাজার সহ আরও দোকানে Huggies, MamyPoko, Molfix, Pampers,
              Bashundhara, Neocare, Supermom ও Avonee-র দাম — সব প্রতি পিস অনুযায়ী সাজানো।
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mt-2">
              উপরের ব্র্যান্ড × সাইজ টেবিলে প্রতিটা ঘরে ক্লিক করলে সেই ব্র্যান্ড ও সাইজের
              সব অফার দেখতে পাবেন। বড় প্যাকে প্রতি পিস দাম সাধারণত কম হয়, তবে সবসময় না —
              তাই তুলনা করে কেনাই বুদ্ধিমানের কাজ।
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
