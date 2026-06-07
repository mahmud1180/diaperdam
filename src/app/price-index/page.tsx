import type { Metadata } from "next";
import { getPriceIndex, getLastScrapedAt } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Bangladesh Diaper Price Index — Daily Cross-Store Comparison",
  description:
    "The Bangladesh Diaper Price Index shows today's cheapest diaper price per piece across Chaldal, Daraz, Othoba and Shwapno for Huggies, MamyPoko, Molfix and more.",
  alternates: { canonical: "https://diaperdam.com/price-index" },
};

export default async function PriceIndexPage() {
  const [index, lastScraped] = await Promise.all([
    getPriceIndex().catch(() => []),
    getLastScrapedAt().catch(() => null),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          📊 Updated daily
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Bangladesh Diaper Price Index
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          The DiaperDam Price Index shows the cheapest price-per-piece for each brand and size
          across all tracked stores. Updated every day. Use it to benchmark what you&apos;re paying.
        </p>
        {lastScraped && (
          <p className="text-xs text-slate-400 mt-2">
            Last updated: {new Date(lastScraped).toLocaleDateString("en-BD", { dateStyle: "long" })}
          </p>
        )}
      </div>

      {index.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3">Brand</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3 text-right">Chaldal</th>
                <th className="px-5 py-3 text-right">Daraz</th>
                <th className="px-5 py-3 text-right">Othoba</th>
                <th className="px-5 py-3 text-right bg-emerald-50 text-emerald-700">Cheapest</th>
                <th className="px-5 py-3 bg-emerald-50 text-emerald-700">Store</th>
              </tr>
            </thead>
            <tbody>
              {index.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-slate-800 capitalize">{row.brand}</td>
                  <td className="px-5 py-3">
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">{row.size_label}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">
                    {row.chaldal_price ? `৳${Number(row.chaldal_price).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">
                    {row.daraz_price ? `৳${Number(row.daraz_price).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">
                    {row.othoba_price ? `৳${Number(row.othoba_price).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right bg-emerald-50 font-bold text-emerald-700">
                    ৳{Number(row.cheapest_price).toFixed(2)}
                  </td>
                  <td className="px-5 py-3 bg-emerald-50 text-sm text-emerald-800 font-semibold">
                    {row.cheapest_store}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <p className="text-amber-800 font-semibold mb-1">Data coming soon</p>
          <p className="text-amber-700 text-sm">Price index will appear after the first scrape completes.</p>
        </div>
      )}

      {/* Methodology */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-bold text-slate-900 mb-2">About this index</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          All prices are expressed as <strong>price per piece (৳/piece)</strong> — dividing the pack price
          by the number of diapers in the pack. This is the only fair comparison because packs come in
          different sizes (40pcs vs 64pcs). A larger pack often has a lower per-piece cost.
          Prices are scraped daily from each store&apos;s live product pages.
        </p>
      </div>
    </div>
  );
}