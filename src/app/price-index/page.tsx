import type { Metadata } from "next";
import { getPriceIndex, getLastScrapedAt } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "বাংলাদেশ ডায়াপার মূল্য সূচক — দোকান-ভিত্তিক দৈনিক তুলনা",
  description:
    "বাংলাদেশ ডায়াপার মূল্য সূচক - চালডাল, মীনা বাজার, GoBaby ও স্বপ্নে Huggies, MamyPoko, Molfix সহ সব ব্র্যান্ডের আজকের সবচেয়ে সস্তা প্রতি পিস দাম দেখুন।",
  alternates: { canonical: "https://diaperdam.com/price-index" },
};

export default async function PriceIndexPage() {
  const [index, lastScraped] = await Promise.all([
    getPriceIndex().catch(() => []),
    getLastScrapedAt().catch(() => null),
  ]);

  // Citeable headline stats from today's index. A raw table is not quotable;
  // journalists and LLMs cite a single number, so surface one in plain prose +
  // stat cards. (True month-over-month % change needs a price-history table —
  // future work; today this is the live snapshot headline.)
  const priced = index.filter(r => Number(r.cheapest_price) > 0);
  const avgCheapest = priced.length
    ? priced.reduce((sum, r) => sum + Number(r.cheapest_price), 0) / priced.length
    : 0;
  const cheapestRow = priced.length
    ? priced.reduce((a, b) => (Number(a.cheapest_price) < Number(b.cheapest_price) ? a : b))
    : null;
  const brandsTracked = new Set(index.map(r => r.brand)).size;
  const storesTracked = ["chaldal", "meenabazar", "gobaby", "shwapno", "daraz"].filter(s =>
    index.some(r => Number((r as Record<string, unknown>)[`${s}_price`]) > 0)
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          📊 প্রতিদিন আপডেট
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          বাংলাদেশ ডায়াপার মূল্য সূচক
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          DiaperDam মূল্য সূচকে প্রতিটি ব্র্যান্ড ও সাইজের সবচেয়ে কম প্রতি পিস দাম দেখানো হয়
          সব ট্র্যাক করা দোকান জুড়ে - চালডাল, মীনা বাজার, GoBaby, স্বপ্ন ও দারাজ। প্রতিদিন আপডেট হয়।
          আপনি কত দিচ্ছেন সেটার সাথে তুলনা করুন।
        </p>
        {lastScraped && (
          <p className="text-xs text-slate-400 mt-2">
            সর্বশেষ আপডেট: {new Date(lastScraped).toLocaleDateString("bn-BD", { dateStyle: "long" })}
          </p>
        )}
      </div>

      {/* Citeable headline — the quotable hook for PR pitches + LLM answers */}
      {priced.length > 0 && cheapestRow && (
        <>
          <p className="text-base text-slate-700 leading-relaxed mb-5 max-w-3xl">
            আজকের হিসেবে বাংলাদেশে ট্র্যাক করা ডায়াপারের <strong>গড় সর্বনিম্ন দাম প্রতি পিস ৳{avgCheapest.toFixed(2)}</strong>।
            এই মুহূর্তে সবচেয়ে সস্তা <strong className="capitalize">{cheapestRow.brand} {cheapestRow.size_label}</strong> —
            মাত্র <strong>৳{Number(cheapestRow.cheapest_price).toFixed(2)}/পিস</strong> ({cheapestRow.cheapest_store})।
            সূচকে {brandsTracked}টি ব্র্যান্ড {storesTracked}টি দোকান জুড়ে তুলনা করা হয়।
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <div className="text-2xl font-bold text-emerald-700">৳{avgCheapest.toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-0.5">গড় সর্বনিম্ন দাম / পিস</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <div className="text-2xl font-bold text-emerald-700">৳{Number(cheapestRow.cheapest_price).toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-0.5 capitalize">সবচেয়ে সস্তা — {cheapestRow.brand} {cheapestRow.size_label}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
              <div className="text-2xl font-bold text-slate-800">{brandsTracked}</div>
              <div className="text-xs text-slate-500 mt-0.5">ব্র্যান্ড ট্র্যাক করা</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
              <div className="text-2xl font-bold text-slate-800">{storesTracked}</div>
              <div className="text-xs text-slate-500 mt-0.5">দোকান তুলনা</div>
            </div>
          </div>
        </>
      )}

      {index.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3">ব্র্যান্ড</th>
                <th className="px-5 py-3">সাইজ</th>
                <th className="px-5 py-3 text-right">চালডাল</th>
                <th className="px-5 py-3 text-right">মীনা বাজার</th>
                <th className="px-5 py-3 text-right">GoBaby</th>
                <th className="px-5 py-3 text-right">স্বপ্ন</th>
                <th className="px-5 py-3 text-right">দারাজ</th>
                <th className="px-5 py-3 text-right bg-emerald-50 text-emerald-700">সস্তা</th>
                <th className="px-5 py-3 bg-emerald-50 text-emerald-700">দোকান</th>
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
                    {row.meenabazar_price ? `৳${Number(row.meenabazar_price).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">
                    {row.gobaby_price ? `৳${Number(row.gobaby_price).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">
                    {row.shwapno_price ? `৳${Number(row.shwapno_price).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">
                    {row.daraz_price ? `৳${Number(row.daraz_price).toFixed(2)}` : "—"}
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
          <p className="text-amber-800 font-semibold mb-1">ডেটা শীঘ্রই আসছে</p>
          <p className="text-amber-700 text-sm">প্রথম স্ক্র্যাপ সম্পন্ন হলে মূল্য সূচক দেখা যাবে।</p>
        </div>
      )}

      {/* Methodology */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-bold text-slate-900 mb-2">এই সূচক সম্পর্কে</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          সব দাম <strong>প্রতি পিস (৳/পিস)</strong> হিসেবে দেখানো হয় - প্যাক দাম ভাগ প্যাকের ডায়াপার সংখ্যা।
          এটাই একমাত্র ন্যায্য তুলনা কারণ প্যাক বিভিন্ন সাইজে আসে (৪০ পিস বনাম ৬৪ পিস)।
          বড় প্যাকে সাধারণত প্রতি পিস দাম কম পড়ে।
          প্রতিদিন প্রতিটা দোকানের লাইভ পণ্য পেজ থেকে দাম সংগ্রহ করা হয়।
        </p>
      </div>
    </div>
  );
}
