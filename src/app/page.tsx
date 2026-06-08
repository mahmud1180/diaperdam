import Link from "next/link";
import { getCheapestByBrand, getLastScrapedAt, getActiveDeals } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BRANDS = [
  { slug: "huggies",     name: "Huggies",     flag: "🇲🇾", origin: "মালয়েশিয়া" },
  { slug: "mamypoko",    name: "MamyPoko",    flag: "🇮🇳", origin: "ভারত" },
  { slug: "molfix",      name: "Molfix",      flag: "🇹🇷", origin: "তুরস্ক" },
  { slug: "pampers",     name: "Pampers",     flag: "🇺🇸", origin: "আমেরিকা" },
  { slug: "neocare",     name: "Neocare",     flag: "🇧🇩", origin: "বাংলাদেশ" },
  { slug: "bashundhara", name: "Bashundhara", flag: "🇧🇩", origin: "বাংলাদেশ" },
  { slug: "supermom",    name: "Supermom",    flag: "🇧🇩", origin: "বাংলাদেশ" },
  { slug: "avonee",      name: "Avonee",      flag: "🇧🇩", origin: "বাংলাদেশ" },
];

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "DiaperDam",
  "url": "https://diaperdam.com",
  "description": "বাংলাদেশের ডায়াপার দাম তুলনা সাইট। Huggies, MamyPoko, Molfix, Bashundhara সহ সব ব্র্যান্ডের দাম চালডাল, দারাজ, স্বপ্ন থেকে তুলনা করুন।",
  "inLanguage": "bn",
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
  "description": "বাংলাদেশের প্রথম ডায়াপার দাম তুলনা প্ল্যাটফর্ম।",
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
            বাংলাদেশে এখন সব ডায়াপার অফার
          </h1>
          <p className="text-emerald-100 text-lg sm:text-xl mb-8">
            আজ <strong className="text-white">{totalProducts || 200}</strong> টি অফার <strong className="text-white">{storeCount}</strong> টি দোকানে
          </p>
          <Link
            href="/diapers"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors shadow-lg"
          >
            সব ডায়াপার তুলনা করুন
          </Link>
          {lastScraped && (
            <p className="text-xs text-emerald-200 mt-6">
              দাম আপডেট: {new Date(lastScraped).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </div>
      </section>

      {/* ─── BRAND LOGOS ROW ─── */}
      <section className="bg-white border-b border-slate-100 py-8 px-4">
        <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">
          এই ব্র্যান্ডগুলোর অফার দেখুন
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
              সবসময় সবচেয়ে কম দাম এখানে পাবেন!
            </h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              কোন ডায়াপার আসলে সবচেয়ে সস্তা সেটা বের করা কঠিন। প্রায় প্রতিটা প্যাকে আলাদা সংখ্যা, আলাদা দাম। আমরা সবসময় <strong>প্রতি পিস দাম</strong> হিসাব করি।
            </p>
            <p className="text-slate-600 leading-relaxed mb-3">
              এই ওয়েবসাইটে সবচেয়ে কম প্রতি পিস দামের ডায়াপার দেখতে পাবেন। অফার অনুযায়ী আপনার দরকার মতো অর্ডার করুন!{" "}
              <Link href="/diapers" className="text-emerald-600 font-semibold hover:underline">
                সব ডায়াপার দেখুন
              </Link>, সাথে{" "}
              <Link href="/deals" className="text-emerald-600 font-semibold hover:underline">
                আজকের অফার
              </Link>।
            </p>
            <p className="text-slate-600 leading-relaxed">
              Huggies পছন্দ হোক, MamyPoko বা Molfix, অথবা দেশি ব্র্যান্ড Bashundhara বা Supermom - আমরা বাংলাদেশের সব বড় অনলাইন দোকান থেকে সবার দাম তুলনা করি।
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              বড় প্যাকে সাশ্রয় করুন
            </h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              ডায়াপারে সবচেয়ে বেশি সাশ্রয় করা যায় অফারে থাকা বড় প্যাক কিনে। বড় প্যাক এমনিতেই সস্তা, অফারে গেলে ৩০% পর্যন্ত কম দামে পাওয়া যায়।
            </p>
            <p className="text-slate-600 leading-relaxed">
              বড় প্যাক কি সবসময় সস্তা? সবসময় না! তাই আমরা সবসময় প্রতি পিস দাম দেখাই, যাতে আপনি নিজে সেরা ডিল বাছতে পারেন।{" "}
              <Link href="/price-index" className="text-emerald-600 font-semibold hover:underline">
                মূল্য সূচক
              </Link>{" "}
              দেখে দোকান-ভিত্তিক তুলনা করুন।
            </p>
          </div>
        </div>
      </section>

      {/* ─── WHY COMPARE ONLINE ─── */}
      <section className="bg-emerald-50 border-y border-emerald-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            অনলাইনে ডায়াপারের দাম তুলনা কেন করবেন?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: "🏷️", text: "সেরা ডায়াপার অফার সাথে সাথে খুঁজে পান" },
              { icon: "📦", text: "ভারী প্যাক দোকান থেকে বহন করা লাগবে না" },
              { icon: "🚚", text: "অনেক দোকানে ফ্রি হোম ডেলিভারি আছে" },
              { icon: "💰", text: "প্রতি পিস দাম দিয়ে তুলনা করা যায় সবচেয়ে ন্যায়" },
              { icon: "🔄", text: "প্রতিদিন সব দোকান থেকে দাম আপডেট হয়" },
              { icon: "📊", text: "৮+ ব্র্যান্ড ৫+ দোকানে তুলনা করুন" },
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
              এখনই ডায়াপার তুলনা করুন
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SIZE GUIDE ─── */}
      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">বিভিন্ন সাইজে ডায়াপার</h2>
        <p className="text-slate-600 mb-6">
          ডায়াপারের সাইজ নির্ভর করে আপনার বাচ্চার ওজনের ওপর। একটা সাইজে ক্লিক করলে সেই ওজনের সব ডায়াপার ও তাদের দাম দেখতে পাবেন।
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { size: "Newborn", label: "নবজাতক", weight: "০-৫ কেজি", age: "০-২ মাস" },
            { size: "S",       label: "S",       weight: "৪-৮ কেজি", age: "২-৬ মাস" },
            { size: "M",       label: "M",       weight: "৬-১১ কেজি", age: "৫-১২ মাস" },
            { size: "L",       label: "L",       weight: "৯-১৪ কেজি", age: "৯-১৮ মাস" },
            { size: "XL",      label: "XL",      weight: "১২-১৭ কেজি", age: "১২-২৪ মাস" },
          ].map(s => (
            <Link
              key={s.size}
              href={`/size/${s.size.toLowerCase()}`}
              className="bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl p-4 text-center transition-colors group"
            >
              <div className="text-2xl font-bold text-emerald-700 group-hover:text-emerald-600">
                {s.size === "Newborn" ? "NB" : s.size}
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1">{s.size === "Newborn" ? s.label : `সাইজ ${s.label}`}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.weight}</div>
              <div className="text-[10px] text-slate-300">{s.age}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── HOW MANY DIAPERS PER MONTH ─── */}
      <section className="bg-slate-50 border-y border-slate-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">মাসে কতগুলো ডায়াপার লাগে?</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            মাসে কতগুলো ডায়াপার লাগবে সেটা বাচ্চার বয়সের ওপর নির্ভর করে। নবজাতকের দিনে ৮-১২টা লাগে (মাসে প্রায় ২৪০-৩৬০টা)। ৬ মাস বয়সে দিনে ৬-৮টা (মাসে ১৮০-২৪০টা)। ১২+ মাসে সাধারণত দিনে ৪-৬টা যথেষ্ট।
          </p>
          <p className="text-slate-600 leading-relaxed">
            তার মানে নতুন বাবা-মায়ের জন্য ডায়াপার অন্যতম বড় খরচ। গড়ে ৳৮-১৫ টাকা প্রতি পিসে, মাসে ৳২,০০০-৫,০০০ খরচ হয়। DiaperDam-এ দাম তুলনা করে সবচেয়ে সস্তা অপশন বাছলে প্রতি মাসে ৳৫০০-১,০০০ সাশ্রয় করা সম্ভব।
          </p>
        </div>
      </section>

      {/* ─── TOP DEALS PREVIEW ─── */}
      {deals.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">আজকের ডায়াপার অফার</h2>
              <p className="text-sm text-slate-500 mt-0.5">সব দোকানের বর্তমান ছাড়</p>
            </div>
            <Link href="/deals" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
              সব অফার দেখুন &rarr;
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
                  <span className="text-slate-400 text-xs">/পিস</span>
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
                  <span className="text-xs text-slate-500">{deal.store_name} &middot; {deal.pack_qty} পিস</span>
                  {deal.product_url && (
                    <a
                      href={deal.product_url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="text-xs text-emerald-600 font-semibold hover:underline"
                    >
                      অফার দেখুন &rarr;
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
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">যেসব দোকান থেকে দাম তুলনা করা হয়</p>
        <div className="flex flex-wrap gap-3">
          {[
            { slug: "chaldal",    name: "চালডাল",     color: "bg-green-50 text-green-700 border-green-200" },
            { slug: "meenabazar", name: "মীনা বাজার",  color: "bg-pink-50 text-pink-700 border-pink-200" },
            { slug: "gobaby",     name: "GoBaby",       color: "bg-sky-50 text-sky-700 border-sky-200" },
            { slug: "shwapno",    name: "স্বপ্ন",      color: "bg-red-50 text-red-700 border-red-200" },
            { slug: "daraz",      name: "দারাজ",        color: "bg-orange-50 text-orange-700 border-orange-200" },
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

      {/* ─── SEO CONTENT ─── */}
      <section className="bg-white border-t border-slate-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">বাংলাদেশে ডায়াপারের দাম খুঁজছেন?</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            DiaperDam-এ স্বাগতম! বাংলাদেশে ডায়াপারের সব অফার খুঁজে পাওয়ার সেরা জায়গা এটা। আমরা প্রতিদিন চালডাল, মীনা বাজার, GoBaby, স্বপ্ন, দারাজ সহ আরও দোকান থেকে দাম তুলনা করি। সব দাম প্রতি পিস অনুযায়ী সাজানো, তাই এক নজরেই বুঝবেন কোনটা সবচেয়ে সস্তা!
          </p>
          <p className="text-slate-600 leading-relaxed mb-3">
            এখানে সব ব্র্যান্ডের বেবি ডায়াপার পাবেন - আন্তর্জাতিক{" "}
            <Link href="/brand/huggies" className="text-emerald-600 font-semibold hover:underline">Huggies</Link>,{" "}
            <Link href="/brand/mamypoko" className="text-emerald-600 font-semibold hover:underline">MamyPoko</Link>,{" "}
            <Link href="/brand/pampers" className="text-emerald-600 font-semibold hover:underline">Pampers</Link> আর{" "}
            <Link href="/brand/molfix" className="text-emerald-600 font-semibold hover:underline">Molfix</Link> থেকে শুরু করে
            দেশি পছন্দের{" "}
            <Link href="/brand/bashundhara" className="text-emerald-600 font-semibold hover:underline">Bashundhara</Link>,{" "}
            <Link href="/brand/neocare" className="text-emerald-600 font-semibold hover:underline">Neocare</Link> আর{" "}
            <Link href="/brand/supermom" className="text-emerald-600 font-semibold hover:underline">Supermom</Link> পর্যন্ত।
          </p>
          <p className="text-slate-600 leading-relaxed">
            ডায়াপারে বেশি টাকা দেওয়া আর দরকার নেই! নতুন বাবা-মায়ের জন্য এটা বড় খরচ। এখানে দাম তুলনা করলে সবসময় সবচেয়ে সস্তা অপশন পাবেন। বেল্ট টাইপ হোক বা প্যান্ট - সব তুলনা করা হয়।{" "}
            <Link href="/price-index" className="text-emerald-600 font-semibold hover:underline">মূল্য সূচক</Link>{" "}
            দেখলে বুঝবেন এই মুহূর্তে কোন দোকানে সবচেয়ে কম দাম।
          </p>
        </div>
      </section>

      {/* ─── PROS AND CONS ─── */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">সেরা ডায়াপার ব্র্যান্ড তুলনা</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-3">
              <Link href="/brand/huggies" className="hover:text-emerald-600">Huggies</Link>
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex gap-2"><span className="text-green-500">+</span> চমৎকার লিক প্রটেকশন</li>
              <li className="flex gap-2"><span className="text-green-500">+</span> নরম ও আরামদায়ক ফিটিং</li>
              <li className="flex gap-2"><span className="text-green-500">+</span> সব দোকানে পাওয়া যায়</li>
              <li className="flex gap-2"><span className="text-red-400">-</span> প্রতি পিস দাম বেশি</li>
            </ul>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-3">
              <Link href="/brand/mamypoko" className="hover:text-emerald-600">MamyPoko Pants</Link>
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex gap-2"><span className="text-green-500">+</span> সহজে পরানো যায় প্যান্ট স্টাইল</li>
              <li className="flex gap-2"><span className="text-green-500">+</span> রাতে দারুণ শোষণ ক্ষমতা</li>
              <li className="flex gap-2"><span className="text-green-500">+</span> বাংলাদেশি বাবা-মায়ের কাছে জনপ্রিয়</li>
              <li className="flex gap-2"><span className="text-red-400">-</span> সাইজ রেঞ্জ কম</li>
            </ul>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-3">
              <Link href="/brand/bashundhara" className="hover:text-emerald-600">Bashundhara</Link>
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex gap-2"><span className="text-green-500">+</span> সবচেয়ে সাশ্রয়ী দেশি ব্র্যান্ড</li>
              <li className="flex gap-2"><span className="text-green-500">+</span> সব জায়গায় কিনতে পাওয়া যায়</li>
              <li className="flex gap-2"><span className="text-green-500">+</span> বাল্ক প্যাকে দারুণ দাম</li>
              <li className="flex gap-2"><span className="text-red-400">-</span> প্রিমিয়ামের তুলনায় শোষণ কম</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
