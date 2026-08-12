import type { Metadata } from "next";
import { getCheapestByBrand } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ডায়াপার সাইজ চার্ট: বয়স ও ওজন অনুযায়ী সঠিক সাইজ (NB থেকে XXL)",
  description:
    "নবজাতক থেকে XXL পর্যন্ত প্রতিটা ডায়াপার সাইজের ওজন (কেজি) আর আনুমানিক বয়স। MamyPoko, Huggies, Molfix, Pampers, Bashundhara, Savlon, Neocare এর কোন ব্র্যান্ড লেবেলের চেয়ে ছোট বা বড় চলে, আর কখন পরের সাইজে যাবেন। সব এক চার্টে।",
  alternates: { canonical: "https://diaperdam.com/guide/diaper-size-chart" },
};

type SizeRow = {
  slug: string;
  label: string;        // Latin size label shown to readers
  dbLabel: string;      // exact size_label value stored in the DB
  labelBn: string;      // how parents say it
  weightBn: string;     // canonical band shown across the site
  ageBn: string;        // typical age window in months
};

// Canonical bands mirror SIZE_META in /size/[size] so the chart and the
// live size pages never contradict each other. dbLabel matches the
// size_label column used by getCheapestByBrand().
const SIZES: SizeRow[] = [
  { slug: "newborn", label: "Newborn / NB", dbLabel: "Newborn", labelBn: "নবজাতক", weightBn: "৫ কেজি পর্যন্ত", ageBn: "জন্ম – ১.৫ মাস" },
  { slug: "s",       label: "S",            dbLabel: "S",       labelBn: "এস",     weightBn: "৩–৭ কেজি",      ageBn: "১ – ৪ মাস" },
  { slug: "m",       label: "M",            dbLabel: "M",       labelBn: "এম",     weightBn: "৫–১৩ কেজি",     ageBn: "৩ – ৯ মাস" },
  { slug: "l",       label: "L",            dbLabel: "L",       labelBn: "এল",     weightBn: "১০–১৬ কেজি",    ageBn: "৯ – ১৮ মাস" },
  { slug: "xl",      label: "XL",           dbLabel: "XL",      labelBn: "এক্সএল", weightBn: "১৫ কেজি+",      ageBn: "১৮ মাস – ৩ বছর" },
  { slug: "xxl",     label: "XXL",          dbLabel: "XXL",     labelBn: "ডাবল এক্সএল", weightBn: "১৬ কেজি+",  ageBn: "৩ বছর+" },
];

const FAQS = [
  {
    q: "ওজন আর বয়স, কোনটা দেখে সাইজ বাছব?",
    a: "ওজন। বয়স শুধু আন্দাজ। এক বছরের একটা বাচ্চার ওজন ৮ কেজি হতে পারে, আরেকটার ১২। প্যাকেটে লেখা থাকে কত কেজি পর্যন্ত, ওটাই আসল মাপ। বয়স দিয়ে শুধু আন্দাজ করুন কোন সাইজ দিয়ে শুরু করবেন।",
  },
  {
    q: "একই সাইজ সব ব্র্যান্ডে এক মাপ?",
    a: "না, আর এখানেই বেশিরভাগ ভুল হয়। MamyPoko-র L মানে ৯–১৪ কেজি, কিন্তু Neocare-র L লেখা থাকে ৭–১৮ কেজি, প্রায় ডবল রেঞ্জ। দেশি বেল্ট ব্র্যান্ড (বসুন্ধরা, স্যাভলন, নিওকেয়ার) ইচ্ছে করে চওড়া ব্যান্ড দেয় যাতে এক প্যাকেই অনেকদিন চলে। বিদেশি প্যান্ট ব্র্যান্ড (Pampers, Huggies, MamyPoko) সরু আর নিখুঁত ফিট দেয়। লেবেলের অক্ষর নয়, কেজির সংখ্যাটা মেলান।",
  },
  {
    q: "বাচ্চা দুই সাইজের মাঝামাঝি, ছোটটা নেব না বড়টা?",
    a: "বড়টা। ছোট ডায়াপারে রানের পাশে চাপ পড়ে আর ওখান থেকেই লিক হয়। বড়টা একটু ঢিলা হলেও টেপ বা কোমরের ইলাস্টিক দিয়ে সামলে নেওয়া যায়। বিশেষ করে রাতের ডায়াপার সবসময় এক ধাপ বড় নিলে ভালো ঘুম হয়।",
  },
  {
    q: "কখন বুঝব সাইজ বড় করতে হবে?",
    a: "চারটা লক্ষণ। রান বা কোমরে লাল দাগ বসছে, টেপ টেনে মাঝখানে আনতে কষ্ট হচ্ছে, ঘন ঘন লিক বিশেষ করে রাতে, বা ওজন প্যাকের রেঞ্জের ওপরের দিকে। দুটো মিললেই পরের সাইজে যান।",
  },
  {
    q: "বেল্ট নাকি প্যান্ট ডায়াপার কোনটা ভালো?",
    a: "বয়সের ওপর নির্ভর করে। নবজাতক আর ছোট বাচ্চা (NB, S) বেশি শোয়, তাই বেল্ট সহজ। বাচ্চা গড়াগড়ি বা হাঁটা শুরু করলে (M থেকে) প্যান্ট স্টাইল ভালো, মোজার মতো গলিয়ে পরানো যায়, লাথি মারলেও খোলে না।",
  },
];

export default async function DiaperSizeChartPage() {
  const cheapest = await getCheapestByBrand().catch(() => [] as Awaited<ReturnType<typeof getCheapestByBrand>>);
  const today = new Date().toISOString().slice(0, 10);

  // Pull a couple of real "cheapest per piece" anchors to keep the page tied
  // to the live price layer without dumping a full table.
  const cheapestSize = (label: string) =>
    cheapest
      .filter(c => c.size_label === label)
      .sort((a, b) => Number(a.min_price_per_piece) - Number(b.min_price_per_piece))[0];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "হোম", "item": "https://diaperdam.com" },
      { "@type": "ListItem", "position": 2, "name": "ডায়াপার", "item": "https://diaperdam.com/diapers" },
      { "@type": "ListItem", "position": 3, "name": "ডায়াপার সাইজ চার্ট", "item": "https://diaperdam.com/guide/diaper-size-chart" },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "ডায়াপার সাইজ চার্ট: বয়স ও ওজন অনুযায়ী সঠিক সাইজ",
    "inLanguage": "bn",
    "datePublished": "2026-06-15",
    "dateModified": today,
    "author": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "publisher": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "mainEntityOfPage": "https://diaperdam.com/guide/diaper-size-chart",
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
              {" / "}ডায়াপার সাইজ চার্ট
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              ডায়াপার সাইজ চার্ট: বয়স ও ওজন অনুযায়ী সঠিক সাইজ
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              নবজাতক থেকে XXL, কোন সাইজ কত কেজি, কোন ব্র্যান্ড লেবেলের চেয়ে ছোট-বড় চলে, কখন সাইজ বদলাবেন।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            আমার বোন ওর মেয়ের জন্য একগাদা সাইজ M কিনে রেখেছিল, কারণ বাচ্চার বয়স তখন ছয় মাস। অথচ ওজন ছিল মোটে ৬.৫ কেজি।
            M সাইজ (৫–১৩ কেজি) এত ঢিলা হলো যে দু-রাত টানা লিক। পুরো প্যাকটা পড়ে রইল, আর ও ফিরে গেল S-এ।
            ভুলটা সাধারণ: বয়স দেখে সাইজ কেনা।
          </p>

          {/* AI summary nugget */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              এক লাইনে: ডায়াপার সাইজ বয়স নয়, ওজন দেখে বাছতে হয়। নবজাতক (NB) ৫ কেজি পর্যন্ত, S ৩–৭ কেজি,
              M ৫–১৩ কেজি, L ১০–১৬ কেজি, XL ১৫ কেজির ওপরে। বাচ্চা দুই সাইজের মাঝে পড়লে বড়টা নিন।
              আর মনে রাখবেন একই &quot;L&quot; MamyPoko-তে ৯–১৪ কেজি কিন্তু Neocare-তে ৭–১৮ কেজি। তাই অক্ষর নয়, প্যাকের কেজি মিলিয়ে কিনুন।
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">পুরো সাইজ চার্ট (ওজন ও বয়স)</h2>
          <p className="mb-3">
            নিচের চার্ট DiaperDam-এর প্রতিটা সাইজ পাতার সঙ্গে মেলানো। ওজনের ঘরে যেটা লেখা, সেটাই বেশিরভাগ ব্র্যান্ডের গড় রেঞ্জ।
            বয়সটা শুধু আন্দাজ। বাচ্চার ওজন আগে দেখুন।
          </p>
          <div className="overflow-x-auto mb-2">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="py-2 px-3 border border-slate-200">সাইজ</th>
                  <th className="py-2 px-3 border border-slate-200">ওজন</th>
                  <th className="py-2 px-3 border border-slate-200">আনুমানিক বয়স</th>
                  <th className="py-2 px-3 border border-slate-200">আজকের সবচেয়ে কম দাম</th>
                </tr>
              </thead>
              <tbody>
                {SIZES.map(s => {
                  const c = cheapestSize(s.dbLabel);
                  return (
                    <tr key={s.slug}>
                      <td className="py-2 px-3 border border-slate-200 font-semibold">
                        <a href={`/size/${s.slug}`} className="text-emerald-700 hover:underline">
                          {s.label}
                        </a>
                      </td>
                      <td className="py-2 px-3 border border-slate-200 whitespace-nowrap">{s.weightBn}</td>
                      <td className="py-2 px-3 border border-slate-200 whitespace-nowrap">{s.ageBn}</td>
                      <td className="py-2 px-3 border border-slate-200 whitespace-nowrap">
                        {c ? <>৳{Number(c.min_price_per_piece).toFixed(2)}/পিস</> : <span className="text-slate-400">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            দাম প্রতিদিন বাংলাদেশের ৬টা দোকান থেকে টেনে আনা হয়, প্রতি পিস হিসেবে দেখানো। সাইজে ক্লিক করলে ওই সাইজের পুরো দাম-তুলনা।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কেন ওজন দেখবেন, বয়স নয়</h2>
          <p className="mb-4">
            ছয় মাসের দুটো বাচ্চার ওজনে ৩-৪ কেজি তফাত থাকা স্বাভাবিক। একজন ৬ কেজি, আরেকজন ১০। একই বয়সের জন্য একই সাইজ ধরলে
            একটার লিক হবে, আরেকটার রানে দাগ বসবে। প্যাকেটের গায়ে &quot;up to 7 kg&quot; বা &quot;9-14 kg&quot;, ওই সংখ্যাটাই বাছাইয়ের আসল নিয়ম।
            চার্টের বয়সের ঘরটা শুধু এই কাজে লাগবে: কোন সাইজ কিনে শুরু করবেন তার একটা আন্দাজ পেতে।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">দেশি বনাম বিদেশি ব্র্যান্ড: লেবেল মেলে না</h2>
          <p className="mb-4">
            এটা না জানলে টাকা নষ্ট হয়। বাংলাদেশে দুই ঘরানার ব্র্যান্ড। বিদেশি প্যান্ট ব্র্যান্ড সরু, নিখুঁত রেঞ্জ দেয়;
            দেশি বেল্ট ব্র্যান্ড চওড়া রেঞ্জ দেয় যাতে এক প্যাকেই বেশিদিন চলে। একই অক্ষরের সাইজ মানেই এক ওজন না।
          </p>
          <p className="mb-2">কয়েকটা আসল উদাহরণ, প্যাকের গায়ে যেমন লেখা থাকে:</p>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li><strong>MamyPoko Pants</strong>: S ৪–৮, M ৭–১২, L ৯–১৪, XL ১২–১৭ কেজি। প্যান্ট ফিট আঁটসাঁট, রেঞ্জ ছোট।</li>
            <li><strong>Huggies Dry Pants</strong>: S ৪–৮, M ৬–১২, L ৯–১৪, XL ১২–১৭ কেজি। MamyPoko-র প্রায় কাছাকাছি।</li>
            <li><strong>Pampers</strong>: M ৫–১৩, XL ১২–১৭ কেজি। নবজাতকে নরম, তবে দাম দেশি ব্র্যান্ডের চেয়ে বেশি।</li>
            <li><strong>Molfix</strong> (তুরস্ক): সংখ্যা দিয়ে লেখা। Newborn(1) ২–৫, Mini(2) ৩–৬, Midi(3) ৬–১১, Maxi(4) ৯–১৪, Junior(5) ১১–১৮ কেজি। অক্ষর নয়, নম্বর দেখে কিনুন।</li>
            <li><strong>বসুন্ধরা</strong> বেল্ট: S ৩–৬, M ৪–৯, L ৯–১৪, XL ১১–২৫ কেজি। ওই XL রেঞ্জটা দেখুন, ১১ থেকে ২৫, প্রায় চার বছর এক সাইজে।</li>
            <li><strong>Savlon Twinkle</strong> বেল্ট: S ৮ পর্যন্ত, M ৬–১২, L ৮–১৫, XL/XXL ১১–২৫ কেজি।</li>
            <li><strong>Neocare</strong>: NB ০–৪, S ৩–৬, M ৪–৯, L ৭–১৮, XL ১১–২৫ কেজি। L-এর রেঞ্জ ৭ থেকে ১৮, MamyPoko-র L-এর প্রায় দ্বিগুণ।</li>
          </ul>
          <p className="mb-4">
            মানে দাঁড়াল, MamyPoko থেকে বসুন্ধরায় গেলে অক্ষর মিলিয়ে কিনলে ভুল হবে। আপনার বাচ্চা ১০ কেজি হলে MamyPoko-তে L,
            কিন্তু বসুন্ধরায় ওই একই বাচ্চা M-এও এঁটে যায়। প্যাকের কেজি দেখুন, তারপর কিনুন। এই কারণেই আমরা প্রতিটা{" "}
            <a href="/diapers" className="text-emerald-700 hover:underline">ব্র্যান্ড × সাইজ পাতায়</a> আসল ওজন রেঞ্জ ধরে দাম সাজাই।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাইজ ধরে দাম দেখুন</h2>
          <p className="mb-3">
            বাচ্চার ওজন জানলে সরাসরি ওই সাইজে যান। প্রতিটা পাতায় সব ব্র্যান্ড আর ৬ দোকানের দাম প্রতি পিস হিসেবে সাজানো।
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
            {SIZES.map(s => {
              const c = cheapestSize(s.dbLabel);
              return (
                <a key={s.slug} href={`/size/${s.slug}`}
                   className="block bg-white border border-slate-100 rounded-xl px-3 py-2 hover:border-emerald-200">
                  <span className="font-semibold text-slate-900 text-sm">সাইজ {s.label.split(" / ")[0]}</span>
                  <span className="block text-xs text-slate-400">{s.weightBn}</span>
                  {c && <span className="block text-xs text-emerald-700 mt-0.5">৳{Number(c.min_price_per_piece).toFixed(2)}/পিস থেকে</span>}
                </a>
              );
            })}
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কখন পরের সাইজে যাবেন</h2>
          <p className="mb-4">
            একদিনে হঠাৎ হয় না, ধীরে ধীরে লক্ষণ আসে। নিচের কোনো একটা দেখলে মাথায় রাখুন, দুটো একসঙ্গে মিললে দেরি করবেন না।
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>রান বা কোমরে লাল দাগ বসছে</li>
            <li>টেপ বা কোমরের ইলাস্টিক টেনে মাঝখানে আনতে কষ্ট হচ্ছে</li>
            <li>ঘন ঘন লিক, বিশেষ করে রাতে</li>
            <li>ওজন প্যাকের রেঞ্জের ওপরের সংখ্যাটা ছুঁয়েছে</li>
          </ul>
          <p className="mb-4">
            ছোট টিপস: পুরনো সাইজ একদম শেষ করে নতুন সাইজে যেতে যাবেন না। শেষ প্যাকটা যখন অর্ধেক, তখন পরের সাইজের একটা ছোট প্যাক
            কিনে রাখুন। মাঝপথে আটকে গিয়ে রাতবিরেতে দোকান খোঁজার চেয়ে এটা সস্তা।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">নবজাতক নিয়ে আলাদা কথা</h2>
          <p className="mb-4">
            নবজাতক সাইজ নিয়ে সবচেয়ে বেশি টাকা নষ্ট হয়, কারণ বাচ্চা এই সাইজে সবচেয়ে কম থাকে, গড়ে তিন থেকে ছয় সপ্তাহ।
            ৪ কেজির বেশি ওজন নিয়ে জন্মালে তো নবজাতক সাইজ প্রায় লাগেই না। তাই হাসপাতাল থেকে ফেরার আগে এক প্যাকের বেশি কিনবেন না।
            কোন সাইজ, দিনে কয়টা, কয় প্যাক, পুরোটা লিখেছি{" "}
            <a href="/guide/newborn-diaper-size" className="text-emerald-700 hover:underline font-medium">নবজাতকের ডায়াপার সাইজ গাইডে</a>।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাধারণ প্রশ্ন</h2>
          <div className="space-y-4 mb-8">
            {FAQS.map(f => (
              <div key={f.q} className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{f.q}</h3>
                <p className="text-sm text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>

          <p className="mb-6 text-slate-700">
            একটা শেষ কথা। প্যাকেটের বড় বড় অক্ষর (S, M, L) দেখে নয়, ছোট করে লেখা কেজির সংখ্যাটা দেখে কিনুন — ওটাই বাচ্চার গায়ে ঠিক বসবে কি না বলে দেয়।
            বাচ্চার আজকের ওজন জানা থাকলে নিচের যেকোনো সাইজে ঢুকে আজকের সবচেয়ে সস্তা প্যাকটা বের করে ফেলুন।
          </p>

          {/* Cross-links */}
          <div className="pt-4 border-t border-slate-100 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href="/size/newborn" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">নবজাতক ডায়াপার</a>
              <a href="/size/s" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">সাইজ S</a>
              <a href="/size/m" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">সাইজ M</a>
              <a href="/size/l" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">সাইজ L</a>
              <a href="/size/xl" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">সাইজ XL</a>
              <a href="/size/xxl" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">সাইজ XXL</a>
              <a href="/guide/newborn-diaper-size" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">নবজাতক গাইড</a>
              <a href="/diapers" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">ব্র্যান্ড × সাইজ গ্রিড</a>
              <a href="/price-index" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">দাম সূচক</a>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
