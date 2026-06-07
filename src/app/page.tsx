import Link from "next/link";
import { getCheapestByBrand, getLastScrapedAt } from "@/lib/db";
import { formatBDT, formatPerPiece, SIZE_ORDER } from "@/lib/utils";

export const revalidate = 3600; // ISR: revalidate hourly

const BRANDS = [
  { slug: "huggies",     name: "Huggies",     flag: "🇲🇾", origin: "Malaysia", tier: "Premium" },
  { slug: "mamypoko",    name: "MamyPoko",    flag: "🇮🇳", origin: "India",    tier: "Premium" },
  { slug: "molfix",      name: "Molfix",      flag: "🇹🇷", origin: "Turkey",   tier: "Mid" },
  { slug: "pampers",     name: "Pampers",     flag: "🇺🇸", origin: "USA",      tier: "Premium" },
  { slug: "neocare",     name: "Neocare",     flag: "🇧🇩", origin: "BD Local", tier: "Budget" },
  { slug: "bashundhara", name: "Bashundhara", flag: "🇧🇩", origin: "BD Local", tier: "Budget" },
];

const SIZES = ["Newborn", "S", "M", "L", "XL"];

export default async function HomePage() {
  const [cheapest, lastScraped] = await Promise.all([
    getCheapestByBrand().catch(() => []),
    getLastScrapedAt().catch(() => null),
  ]);

  // Group cheapest by brand+size
  const cheapestMap = new Map(
    cheapest.map(r => [`${r.brand_slug}:${r.size_label}`, r])
  );

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 via-white to-slate-50 border-b border-slate-100 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            🇧🇩 Bangladesh&apos;s first diaper price comparison
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-4">
            Find the <span className="text-emerald-600">cheapest diaper</span><br />
            in Bangladesh — per piece
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto mb-8">
            We compare Huggies, MamyPoko, Molfix and more across Chaldal, Daraz, Othoba and Shwapno.
            See exactly which store gives you the best value, calculated per piece.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/diapers" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
              Compare all diapers →
            </Link>
            <Link href="/price-index" className="bg-white hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3 rounded-xl border border-slate-200 transition-colors text-sm">
              BD Diaper Price Index
            </Link>
          </div>
          {lastScraped && (
            <p className="text-xs text-slate-400 mt-4">
              Prices last updated: {new Date(lastScraped).toLocaleDateString("en-BD", { dateStyle: "medium" })}
            </p>
          )}
        </div>
      </section>

      {/* Size quick links */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Browse by baby size</p>
        <div className="flex flex-wrap gap-2">
          {SIZES.map(size => (
            <Link
              key={size}
              href={`/size/${size.toLowerCase()}`}
              className="bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 text-sm font-semibold px-4 py-2 rounded-full transition-colors"
            >
              {size === "Newborn" ? "👶 Newborn" : `Size ${size}`}
            </Link>
          ))}
        </div>
      </section>

      {/* Price grid by brand */}
      {cheapest.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Cheapest price per piece today</h2>
          <p className="text-sm text-slate-500 mb-6">Best deal across all stores, by brand and size</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-3">Brand</th>
                  {SIZES.map(s => (
                    <th key={s} className="px-4 py-3 text-center">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BRANDS.map(brand => (
                  <tr key={brand.slug} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/brand/${brand.slug}`} className="flex items-center gap-2 group">
                        <span className="text-lg">{brand.flag}</span>
                        <div>
                          <span className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                            {brand.name}
                          </span>
                          <span className={`ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            brand.tier === "Premium" ? "bg-amber-50 text-amber-700" :
                            brand.tier === "Mid" ? "bg-blue-50 text-blue-700" :
                            "bg-green-50 text-green-700"
                          }`}>{brand.tier}</span>
                        </div>
                      </Link>
                    </td>
                    {SIZES.map(size => {
                      const entry = cheapestMap.get(`${brand.slug}:${size}`);
                      return (
                        <td key={size} className="px-4 py-3 text-center">
                          {entry ? (
                            <Link href={`/brand/${brand.slug}`} className="group">
                              <span className="font-bold text-emerald-700 group-hover:text-emerald-600">
                                {formatBDT(entry.min_price_per_piece)}/pc
                              </span>
                              <br />
                              <span className="text-[10px] text-slate-400">{entry.store_name}</span>
                            </Link>
                          ) : (
                            <span className="text-slate-200">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-right">
            <Link href="/diapers" className="hover:text-emerald-600 underline">See all products with full filter →</Link>
          </p>
        </section>
      )}

      {/* No data yet state */}
      {cheapest.length === 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <p className="text-amber-800 font-semibold mb-1">🔄 Scraper running...</p>
            <p className="text-amber-700 text-sm">
              Price data is being collected. Check back shortly or{" "}
              <Link href="/diapers" className="underline">browse diapers</Link>.
            </p>
          </div>
        </section>
      )}

      {/* Store badges */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Prices compared from</p>
        <div className="flex flex-wrap gap-3">
          {[
            { slug: "chaldal", name: "Chaldal", color: "bg-green-50 text-green-700 border-green-200" },
            { slug: "daraz",   name: "Daraz",   color: "bg-orange-50 text-orange-700 border-orange-200" },
            { slug: "othoba",  name: "Othoba",  color: "bg-blue-50 text-blue-700 border-blue-200" },
            { slug: "shwapno", name: "Shwapno", color: "bg-red-50 text-red-700 border-red-200" },
          ].map(s => (
            <Link
              key={s.slug}
              href={`/store/${s.slug}`}
              className={`border font-semibold text-sm px-4 py-2 rounded-full transition-opacity hover:opacity-80 ${s.color}`}
            >
              {s.name}
            </Link>
          ))}
        </div>
      </section>

      {/* SEO content block — hidden visually but indexable */}
      <div className="sr-only">
        <h2>Diaper Price Comparison Bangladesh 2026</h2>
        <p>
          DiaperDam compares baby diaper prices across Bangladesh&apos;s top online stores.
          Find the cheapest Huggies, MamyPoko, Molfix, Pampers, Neocare and Bashundhara diapers
          on Chaldal, Daraz, Othoba and Shwapno. Prices are calculated per diaper piece so you
          can compare packs of different sizes fairly.
        </p>
        <h3>Popular searches</h3>
        <ul>
          <li><a href="/brand/huggies">Huggies diaper price in Bangladesh</a></li>
          <li><a href="/brand/mamypoko">MamyPoko pants price in Bangladesh</a></li>
          <li><a href="/brand/molfix">Molfix diaper price Bangladesh</a></li>
          <li><a href="/size/newborn">Newborn diaper price Bangladesh</a></li>
          <li><a href="/price-index">Bangladesh diaper price index</a></li>
        </ul>
      </div>
    </div>
  );
}
