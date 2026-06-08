import Link from "next/link";
import { getCheapestByBrand, getLastScrapedAt, getActiveDeals } from "@/lib/db";
// utils imported via layout

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BRANDS = [
  { slug: "huggies",     name: "Huggies",     flag: "🇲🇾", origin: "Malaysia" },
  { slug: "mamypoko",    name: "MamyPoko",    flag: "🇮🇳", origin: "India" },
  { slug: "molfix",      name: "Molfix",      flag: "🇹🇷", origin: "Turkey" },
  { slug: "pampers",     name: "Pampers",     flag: "🇺🇸", origin: "USA" },
  { slug: "neocare",     name: "Neocare",     flag: "🇧🇩", origin: "Bangladesh" },
  { slug: "bashundhara", name: "Bashundhara", flag: "🇧🇩", origin: "Bangladesh" },
  { slug: "supermom",    name: "Supermom",    flag: "🇧🇩", origin: "Bangladesh" },
  { slug: "avonee",      name: "Avonee",      flag: "🇧🇩", origin: "Bangladesh" },
];

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "DiaperDam",
  "url": "https://diaperdam.com",
  "description": "Bangladesh's diaper price comparison — cheapest Huggies, MamyPoko, Molfix, Pampers and more across Chaldal, Daraz, Othoba, Shwapno and Arogga.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://diaperdam.com/diapers?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "DiaperDam",
  "url": "https://diaperdam.com",
  "description": "Bangladesh's first dedicated diaper price comparison platform.",
  "areaServed": "BD",
  "serviceType": "Price comparison",
};

export default async function HomePage() {
  let cheapest: Awaited<ReturnType<typeof getCheapestByBrand>> = [];
  let lastScraped: string | null = null;
  let deals: Awaited<ReturnType<typeof getActiveDeals>> = [];

  try {
    [cheapest, lastScraped, deals] = await Promise.all([
      getCheapestByBrand().catch(() => [] as Awaited<ReturnType<typeof getCheapestByBrand>>),
      getLastScrapedAt().catch(() => null),
      getActiveDeals().catch(() => [] as Awaited<ReturnType<typeof getActiveDeals>>),
    ]);
  } catch {
    // render with empty data
  }

  const totalProducts = cheapest.length > 0 ? cheapest.reduce((sum) => sum + 1, 0) : 0;
  const storeCount = new Set(cheapest.map(r => r.store_name)).size || 3;

  return (
    <div>
      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />

      {/* ─── HERO ─── */}
      <section className="bg-gradient-to-br from-teal-600 via-emerald-600 to-emerald-700 text-white py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-3">
            All diaper deals in Bangladesh right now
          </h1>
          <p className="text-emerald-100 text-lg sm:text-xl mb-8">
            Today <strong className="text-white">{totalProducts || 200}</strong> deals at <strong className="text-white">{storeCount}</strong> stores
          </p>
          <Link
            href="/diapers"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors shadow-lg"
          >
            Compare all diapers
          </Link>
          {lastScraped && (
            <p className="text-xs text-emerald-200 mt-6">
              Prices last updated: {new Date(lastScraped).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })}
            </p>
          )}
        </div>
      </section>

      {/* ─── BRAND LOGOS ROW ─── */}
      <section className="bg-white border-b border-slate-100 py-8 px-4">
        <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">
          Deals from these brands
        </p>
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-4 sm:gap-8">
          {BRANDS.map(b => (
            <Link
              key={b.slug}
              href={`/brand/${b.slug}`}
              className="flex flex-col items-center gap-1 group"
            >
              <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform">{b.flag}</span>
              <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">{b.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── VALUE PROP: WHY PRICE PER PIECE ─── */}
      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Always find the lowest price here!
            </h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              It is hard to figure out which diapers are the cheapest. Almost every pack has a different
              quantity and a different price. We always calculate the <strong>price per diaper piece</strong>.
            </p>
            <p className="text-slate-600 leading-relaxed mb-3">
              On this website you get an overview of the lowest price per diaper. Depending on the deal,
              you can order exactly how many diapers you need!{" "}
              <Link href="/diapers" className="text-emerald-600 font-semibold hover:underline">
                See all diapers here
              </Link>, including{" "}
              <Link href="/deals" className="text-emerald-600 font-semibold hover:underline">
                today&apos;s deals
              </Link>.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Whether you prefer Huggies, MamyPoko, Molfix or a local brand like Bashundhara
              or Supermom — we compare them all across every major online store in Bangladesh.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Save with bulk packs
            </h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              You can save the most on diapers by looking for bulk packs that are on sale.
              Bulk packs are generally already cheaper, but on sale you can save up to 30% on your diapers.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Is a bulk pack always cheaper? Not necessarily! That is why we always show the
              lowest price per diaper so you can pick the best deal yourself. Use the{" "}
              <Link href="/price-index" className="text-emerald-600 font-semibold hover:underline">
                Price Index
              </Link>{" "}
              to compare stores side by side.
            </p>
          </div>
        </div>
      </section>

      {/* ─── WHY COMPARE ONLINE ─── */}
      <section className="bg-emerald-50 border-y border-emerald-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Why compare diaper prices online?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: "🏷️", text: "Find the best diaper deals instantly" },
              { icon: "📦", text: "No carrying heavy packs from the store" },
              { icon: "🚚", text: "Many stores offer free home delivery" },
              { icon: "💰", text: "Price per piece makes comparison fair" },
              { icon: "🔄", text: "Prices updated daily from all stores" },
              { icon: "📊", text: "Compare 8+ brands across 5+ stores" },
            ].map(item => (
              <div key={item.text} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-emerald-100">
                <span className="text-2xl shrink-0">{item.icon}</span>
                <span className="text-slate-700 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/diapers"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Compare diapers now
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SIZE GUIDE ─── */}
      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">All diapers in different sizes</h2>
        <p className="text-slate-600 mb-6">
          Diaper size depends on how much your baby weighs. Click a size to see all diapers and their prices for that weight range.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { size: "Newborn", weight: "0-5 kg", age: "0-2 months" },
            { size: "S",       weight: "4-8 kg", age: "2-6 months" },
            { size: "M",       weight: "6-11 kg", age: "5-12 months" },
            { size: "L",       weight: "9-14 kg", age: "9-18 months" },
            { size: "XL",      weight: "12-17 kg", age: "12-24 months" },
          ].map(s => (
            <Link
              key={s.size}
              href={`/size/${s.size.toLowerCase()}`}
              className="bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl p-4 text-center transition-colors group"
            >
              <div className="text-2xl font-bold text-emerald-700 group-hover:text-emerald-600">
                {s.size === "Newborn" ? "NB" : s.size}
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1">{s.size === "Newborn" ? "Newborn" : `Size ${s.size}`}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.weight}</div>
              <div className="text-[10px] text-slate-300">{s.age}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── HOW MANY DIAPERS PER MONTH ─── */}
      <section className="bg-slate-50 border-y border-slate-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">How many diapers do I need per month?</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            The number of diapers you go through monthly varies by baby. Age is the most important factor.
            Newborns need 8-12 diapers per day (about 240-360/month). By the time your baby is 6 months old,
            this drops to about 6-8 per day (180-240/month). Toddlers at 12+ months typically need 4-6 per day.
          </p>
          <p className="text-slate-600 leading-relaxed">
            This means diapers are one of the biggest expenses for new parents. At an average of ৳8-15 per diaper,
            that is ৳2,000-5,000 per month. By comparing prices on DiaperDam, you can easily save ৳500-1,000
            every month by finding the cheapest option per piece.
          </p>
        </div>
      </section>

      {/* ─── TOP DEALS PREVIEW ─── */}
      {deals.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Diaper Deals Today</h2>
              <p className="text-sm text-slate-500 mt-0.5">Current discounts across all stores</p>
            </div>
            <Link href="/deals" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
              See all deals &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {deals.slice(0, 6).map((deal) => (
              <div
                key={deal.id}
                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-bold text-slate-800 text-sm capitalize">{deal.brand}</span>
                    {deal.line && <span className="text-slate-500 text-xs ml-1">{deal.line}</span>}
                  </div>
                  {deal.discount_pct != null && Number(deal.discount_pct) > 0 && (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                      -{Math.round(Number(deal.discount_pct))}%
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-emerald-700 font-bold">৳{Number(deal.price_per_piece).toFixed(2)}</span>
                  <span className="text-slate-400 text-xs">/pc</span>
                  {deal.size_label && (
                    <span className="ml-auto bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded">
                      {deal.size_label}
                    </span>
                  )}
                </div>
                {deal.original_price_bdt && (
                  <p className="text-xs text-slate-400 line-through">৳{Number(deal.original_price_bdt).toFixed(2)}</p>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                  <span className="text-xs text-slate-500">{deal.store_name} &middot; {deal.pack_qty}pcs</span>
                  {deal.product_url && (
                    <a
                      href={deal.product_url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="text-xs text-emerald-600 font-semibold hover:underline"
                    >
                      View deal &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── STORE BADGES ─── */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Prices compared from</p>
        <div className="flex flex-wrap gap-3">
          {[
            { slug: "chaldal",    name: "Chaldal",     color: "bg-green-50 text-green-700 border-green-200" },
            { slug: "meenabazar", name: "Meena Bazar",  color: "bg-pink-50 text-pink-700 border-pink-200" },
            { slug: "gobaby",     name: "GoBaby",       color: "bg-sky-50 text-sky-700 border-sky-200" },
            { slug: "shwapno",    name: "Shwapno",      color: "bg-red-50 text-red-700 border-red-200" },
            { slug: "daraz",      name: "Daraz",        color: "bg-orange-50 text-orange-700 border-orange-200" },
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

      {/* ─── SEO CONTENT: LOOKING FOR DIAPER DEALS? ─── */}
      <section className="bg-white border-t border-slate-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Looking for diaper deals in Bangladesh?</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            Welcome to DiaperDam! This is the best website for finding all diaper deals in Bangladesh.
            We compare prices from Chaldal, Meena Bazar, GoBaby, Shwapno, Daraz and more every day.
            All prices are sorted by the lowest price per diaper piece, so you can instantly see which
            diapers are the cheapest!
          </p>
          <p className="text-slate-600 leading-relaxed mb-3">
            On this site you will find all brands of baby diapers, from international brands
            like <Link href="/brand/huggies" className="text-emerald-600 font-semibold hover:underline">Huggies</Link>,{" "}
            <Link href="/brand/mamypoko" className="text-emerald-600 font-semibold hover:underline">MamyPoko</Link>,{" "}
            <Link href="/brand/pampers" className="text-emerald-600 font-semibold hover:underline">Pampers</Link> and{" "}
            <Link href="/brand/molfix" className="text-emerald-600 font-semibold hover:underline">Molfix</Link> to
            local favorites like{" "}
            <Link href="/brand/bashundhara" className="text-emerald-600 font-semibold hover:underline">Bashundhara</Link>,{" "}
            <Link href="/brand/neocare" className="text-emerald-600 font-semibold hover:underline">Neocare</Link> and{" "}
            <Link href="/brand/supermom" className="text-emerald-600 font-semibold hover:underline">Supermom</Link>.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Never pay too much for your diapers again! You know that diapers are a major expense for
            new parents. By comparing prices here, you always find the cheapest option. Whether you prefer
            belt-type diapers or pull-up pants, we compare them all. Check the{" "}
            <Link href="/price-index" className="text-emerald-600 font-semibold hover:underline">Price Index</Link>{" "}
            to see which store is cheapest overall right now.
          </p>
        </div>
      </section>

      {/* ─── PROS AND CONS ─── */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Comparing the top diaper brands</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-3">
              <Link href="/brand/huggies" className="hover:text-emerald-600">Huggies</Link>
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex gap-2"><span className="text-green-500">+</span> Excellent leak protection</li>
              <li className="flex gap-2"><span className="text-green-500">+</span> Soft and comfortable fit</li>
              <li className="flex gap-2"><span className="text-green-500">+</span> Available in all stores</li>
              <li className="flex gap-2"><span className="text-red-400">-</span> Higher price per piece</li>
            </ul>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-3">
              <Link href="/brand/mamypoko" className="hover:text-emerald-600">MamyPoko Pants</Link>
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex gap-2"><span className="text-green-500">+</span> Easy pull-up pants style</li>
              <li className="flex gap-2"><span className="text-green-500">+</span> Great overnight absorption</li>
              <li className="flex gap-2"><span className="text-green-500">+</span> Popular with Bangladeshi parents</li>
              <li className="flex gap-2"><span className="text-red-400">-</span> Limited size range</li>
            </ul>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-3">
              <Link href="/brand/bashundhara" className="hover:text-emerald-600">Bashundhara</Link>
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex gap-2"><span className="text-green-500">+</span> Most affordable local brand</li>
              <li className="flex gap-2"><span className="text-green-500">+</span> Widely available</li>
              <li className="flex gap-2"><span className="text-green-500">+</span> Good value bulk packs</li>
              <li className="flex gap-2"><span className="text-red-400">-</span> Less absorbent than premium</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
