import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "মাসে ডায়াপারে কত খরচ হবে? সাইজ অনুযায়ী বাজেট হিসাব ২০২৬",
  description:
    "নবজাতক থেকে XXL — প্রতিটা সাইজে মাসের ডায়াপার খরচ কত পড়বে, আজকের সবচেয়ে কম দাম দিয়ে হিসাব করা। দেশি বনাম বিদেশি ব্র্যান্ডে কত টাকা বাঁচবে আর বাজেট কমানোর ৪টা ব্যবহারিক উপায়।",
  alternates: { canonical: "https://diaperdam.com/guide/diaper-budget-monthly" },
};

const SIZE_META: { slug: string; label: string; labelBn: string; dailyCount: number }[] = [
  { slug: "newborn", label: "Newborn", labelBn: "নবজাতক", dailyCount: 9 },
  { slug: "s",       label: "S",       labelBn: "S",       dailyCount: 8 },
  { slug: "m",       label: "M",       labelBn: "M",       dailyCount: 7 },
  { slug: "l",       label: "L",       labelBn: "L",       dailyCount: 6 },
  { slug: "xl",      label: "XL",      labelBn: "XL",      dailyCount: 6 },
  { slug: "xxl",     label: "XXL",     labelBn: "XXL",     dailyCount: 5 },
];

const FAQS = [
  {
    q: "গড়ে একটা পরিবার মাসে ডায়াপারে কত খরচ করে?",
    a: "সাইজ আর ব্র্যান্ড অনুযায়ী পার্থক্য বড়। দেশি ব্র্যান্ড (Bashundhara, Savlon) দিয়ে মাসে সাধারণত ৳১,৫০০-২,৫০০ পড়ে। বিদেশি ব্র্যান্ড (Huggies, Pampers, MamyPoko) দিয়ে মাসে ৳৪,০০০-৬,০০০ পর্যন্ত উঠতে পারে। বেশিরভাগ পরিবার দুটো মিলিয়ে ৳৩,০০০-৩,৫০০-এর মধ্যে রাখেন।",
  },
  {
    q: "দেশি আর বিদেশি ব্র্যান্ড মিলিয়ে পরালে বাজেট কমে কতটা?",
    a: "দিনে ব্যস্ত সময়ে (দিনের বেলা) দেশি ব্র্যান্ড আর রাতে শোষণক্ষমতা বেশি এমন বিদেশি ব্র্যান্ড ব্যবহার করলে গড় প্রতি-পিস খরচ প্রায় ৩৫-৪০% কমে আসে, কারণ দিনের ৪-৫টা পিসই সবচেয়ে সস্তা দামে কেনা হয়। মাসে এতে ৳১,০০০-১,৫০০ পর্যন্ত বাঁচানো সম্ভব।",
  },
  {
    q: "এক প্যাকেট বড় সাইজে কিনলে কি সাশ্রয় হয়?",
    a: "সাধারণত হ্যাঁ — পিস-সংখ্যা বেশি এমন প্যাক (৫০+ পিস) ছোট প্যাকের চেয়ে প্রতি-পিস দাম ১০-১৫% কম পড়ে, কারণ প্যাকেজিং খরচ ভাগ হয়ে যায়। তবে সবসময় প্রতি-পিস দাম দেখে তুলনা করুন — বড় প্যাকের গায়ের দাম বেশি দেখে বিভ্রান্ত হবেন না।",
  },
  {
    q: "অনলাইনে কেনা কি দোকানের চেয়ে সস্তা?",
    a: "নির্দিষ্ট কোনো একপাশ সবসময় সস্তা না — এটা প্রতিদিন বদলায়। চালডাল, দারাজ, স্বপ্ন, অথবা-এর মধ্যে কখনো অনলাইন ডেলিভারি চার্জ যোগ করলে দোকানের দামের কাছাকাছি চলে আসে। তাই একবারের বেশি পিস কিনলে (২-৩ প্যাক) অনলাইনের ফ্রি-ডেলিভারি থ্রেশহোল্ড পার হয়ে যায়, তখন অনলাইনই সস্তা পড়ে।",
  },
  {
    q: "বাজেট ঠিক রাখতে সাইজ বদলানোর সঠিক সময় কখন?",
    a: "সাইজ বড় করলে সাধারণত প্রতি-পিস দাম কিছুটা বাড়ে কিন্তু লিক কম হওয়ায় দিনে ব্যবহারের সংখ্যা কমে — নিট খরচ প্রায় সমান থাকে। ওজন সীমার ওপরের প্রান্তে পৌঁছানোর ১-২ সপ্তাহ আগে থেকেই পরবর্তী সাইজ পরীক্ষা করা ভালো, বিস্তারিত ওজন-ভিত্তিক গাইড থেকে দেখে নিন।",
  },
];

export default async function DiaperBudgetMonthlyPage() {
  const rows = await Promise.all(
    SIZE_META.map(async s => {
      const products = await getAllProducts({ size_label: s.label, sort: "price_per_piece" }).catch(() => [] as DiaperProduct[]);
      const cheapest = products[0] ?? null;
      const priciest = products.length > 0 ? products[products.length - 1] : null;
      const monthlyLow = cheapest ? Number(cheapest.price_per_piece) * s.dailyCount * 30 : null;
      const monthlyHigh = priciest ? Number(priciest.price_per_piece) * s.dailyCount * 30 : null;
      return { ...s, cheapest, monthlyLow, monthlyHigh };
    })
  );

  const overallCheapest = rows
    .map(r => r.cheapest)
    .filter((p): p is DiaperProduct => p !== null)
    .sort((a, b) => Number(a.price_per_piece) - Number(b.price_per_piece))[0];

  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "মাসিক বাজেট গাইড", item: "https://diaperdam.com/guide/diaper-budget-monthly" },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "মাসে ডায়াপারে কত খরচ হবে? সাইজ অনুযায়ী বাজেট হিসাব",
    inLanguage: "bn",
    datePublished: "2026-07-10",
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/diaper-budget-monthly",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <div>
        <div className="bg-white border-b border-slate-100 py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-slate-400 mb-1">
              <a href="/diapers" className="hover:text-emerald-600">সব ডায়াপার</a>
              {" / "}মাসিক বাজেট গাইড
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              মাসে ডায়াপারে কত খরচ হবে? সাইজ অনুযায়ী বাজেট হিসাব
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              প্রতিটা সাইজে আজকের কম-বেশি দাম দিয়ে মাসিক খরচের রেঞ্জ — বাজেট প্ল্যান করতে সাহায্য করবে।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            ডায়াপার একটা পরিবারের মাসিক খরচের বড় একটা অংশ, কিন্তু বেশিরভাগ অভিভাবক আগে থেকে হিসাব করেন
            না — শুধু যখন কেনার সময় হয় তখন দামটা টের পান। সাইজ বাড়ার সাথে সাথে প্রতিদিন কতটা লাগবে সেটা
            কমে, কিন্তু প্রতি-পিস দাম বাড়ে — তাই নিট মাসিক খরচ কীভাবে বদলায় সেটা আগে থেকে জানা থাকলে
            বাজেট প্ল্যান করা সহজ হয়।
          </p>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              <strong>সংক্ষেপে:</strong> সাইজ অনুযায়ী দৈনিক ব্যবহার আর আজকের সর্বনিম্ন দাম দিয়ে হিসাব করলে
              মাসিক খরচ সাধারণত ৳১,৫০০ (দেশি ব্র্যান্ড, ছোট সাইজ) থেকে ৳৭,০০০+ (বিদেশি প্রিমিয়াম ব্র্যান্ড,
              বড় সাইজ) পর্যন্ত হতে পারে।
              {overallCheapest && (
                <>
                  {" "}আজকের সবচেয়ে কম প্রতি-পিস দাম{" "}
                  <strong>৳{Number(overallCheapest.price_per_piece).toFixed(2)}/পিস</strong>{" "}
                  ({overallCheapest.brand}{overallCheapest.line ? ` ${overallCheapest.line}` : ""}, {overallCheapest.size_label} সাইজ, {overallCheapest.store_name})।
                </>
              )}
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাইজ অনুযায়ী মাসিক খরচের হিসাব</h2>
          <p className="mb-3 text-sm text-slate-500">
            দৈনিক গড় ব্যবহার × ৩০ দিন × আজকের প্রতি-পিস দাম দিয়ে হিসাব করা। কম = সবচেয়ে সস্তা ব্র্যান্ড,
            বেশি = সবচেয়ে দামি ব্র্যান্ড দিয়ে।
          </p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="py-2 px-3 border border-slate-200">সাইজ</th>
                  <th className="py-2 px-3 border border-slate-200 text-center">দৈনিক গড়</th>
                  <th className="py-2 px-3 border border-slate-200 text-right">মাসিক খরচ (সর্বনিম্ন)</th>
                  <th className="py-2 px-3 border border-slate-200 text-right">মাসিক খরচ (সর্বোচ্চ)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.slug}>
                    <td className="py-2 px-3 border border-slate-200">
                      <a href={`/size/${r.slug}`} className="text-emerald-700 hover:underline font-medium">{r.labelBn}</a>
                    </td>
                    <td className="py-2 px-3 border border-slate-200 text-center">{r.dailyCount}টা</td>
                    <td className="py-2 px-3 border border-slate-200 text-right font-semibold">
                      {r.monthlyLow ? `৳${r.monthlyLow.toFixed(0)}` : "—"}
                    </td>
                    <td className="py-2 px-3 border border-slate-200 text-right text-slate-500">
                      {r.monthlyHigh ? `৳${r.monthlyHigh.toFixed(0)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mb-4 text-sm text-slate-500">
            দৈনিক ব্যবহারের সংখ্যা বয়স অনুযায়ী কমবেশি হতে পারে — বিস্তারিত বয়স-ভিত্তিক টেবিল দেখুন{" "}
            <a href="/guide/diaper-count-per-day" className="text-emerald-700 hover:underline">প্রতিদিন কতটা ডায়াপার লাগে গাইডে</a>।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">বাজেট কমানোর ৪টা ব্যবহারিক উপায়</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li><strong>দিন-রাত মিলিয়ে ব্র্যান্ড বাছুন</strong> — দিনের বেলা দেশি ব্র্যান্ড, রাতে বেশি শোষণক্ষমতার লাইন। মাসে ৳১,০০০+ বাঁচে।</li>
            <li><strong>বড় প্যাক কিনুন, প্রতি-পিস দাম দেখে</strong> — প্যাকের গায়ের মোট দাম না দেখে সবসময় প্রতি-পিস দাম তুলনা করুন।</li>
            <li><strong>অফার আসার আগেই স্টক করবেন না</strong> — প্রতিদিন দাম বদলায়, তাই একসাথে ২-৩ মাসের স্টক না কিনে সাপ্তাহিক অফার চেক করুন।</li>
            <li><strong>একাধিক দোকানের দাম তুলনা করুন</strong> — একই ব্র্যান্ড-সাইজ বিভিন্ন দোকানে ভিন্ন দামে থাকে, কেনার আগে একবার তুলনা করে নিন।</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">আজকের সবচেয়ে কম দামের ডায়াপার (সব সাইজ)</h2>
          <p className="mb-3 text-sm text-slate-500">
            বাজেট কমাতে চাইলে এখান থেকে শুরু করুন — প্রতিদিন আপডেট হয়। পুরো তালিকা{" "}
            <a href="/deals" className="text-emerald-700 hover:underline">আজকের অফার পাতায়</a>।
          </p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="py-2 px-3 border border-slate-200">ডায়াপার</th>
                  <th className="py-2 px-3 border border-slate-200 text-right">প্রতি পিস</th>
                  <th className="py-2 px-3 border border-slate-200 text-right">প্যাক দাম</th>
                  <th className="py-2 px-3 border border-slate-200">দোকান</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .map(r => r.cheapest)
                  .filter((p): p is DiaperProduct => p !== null)
                  .map(p => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 border border-slate-200">
                        <a href={`/brand/${p.brand_slug}`} className="text-emerald-700 hover:underline">
                          {p.brand} {p.line ?? ""} {p.size_label ? `সাইজ ${p.size_label}` : ""} {p.pack_qty} পিস
                        </a>
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-right font-semibold">
                        ৳{Number(p.price_per_piece).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-right">
                        ৳{Number(p.price_bdt).toFixed(0)}
                      </td>
                      <td className="py-2 px-3 border border-slate-200">{p.store_name}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাধারণ প্রশ্ন</h2>
          <div className="space-y-4 mb-8">
            {FAQS.map(f => (
              <div key={f.q} className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{f.q}</h3>
                <p className="text-sm text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>

          {/* Cross-links */}
          <div className="pt-4 border-t border-slate-100 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href="/guide/diaper-count-per-day" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                প্রতিদিন কতটা লাগে
              </a>
              <a href="/guide/diaper-size-by-weight" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সাইজ চার্ট গাইড
              </a>
              <a href="/guide/diaper-size-transition-timing" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সাইজ ট্রানজিশন টাইমিং গাইড
              </a>
              <a href="/guide/cloth-vs-disposable-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                কাপড় বনাম ডায়াপার খরচ
              </a>
              <a href="/guide/budget-local-diaper-brands-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                বাজেট দেশি ব্র্যান্ড তুলনা
              </a>
              <a href="/price-index" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                প্রাইস ইনডেক্স
              </a>
              <a href="/diapers" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                ব্র্যান্ড × সাইজ গ্রিড
              </a>
              <a href="/deals" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                আজকের অফার
              </a>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
