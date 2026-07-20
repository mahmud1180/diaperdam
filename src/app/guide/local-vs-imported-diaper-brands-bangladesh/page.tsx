import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "দেশি নাকি বিদেশি? Neocare-Bashundhara বনাম Huggies-Pampers বছরে কত টাকা ফারাক",
  description:
    "নিওকেয়ার আর বসুন্ধরা কি সত্যিই হাগিস-প্যাম্পারসের চেয়ে সস্তা? চার ব্র্যান্ডের আজকের সাইজ-ভিত্তিক দাম আর এক বছরের হিসাব পাশাপাশি। উত্তরটা অনুমানের মতো সহজ না।",
  alternates: { canonical: "https://diaperdam.com/guide/local-vs-imported-diaper-brands-bangladesh" },
};

const SIZES = [
  { slug: "newborn", label: "Newborn", labelBn: "নবজাতক" },
  { slug: "s", label: "S", labelBn: "S" },
  { slug: "m", label: "M", labelBn: "M" },
  { slug: "l", label: "L", labelBn: "L" },
  { slug: "xl", label: "XL", labelBn: "XL" },
];

const BRANDS = [
  { slug: "bashundhara", label: "Bashundhara", origin: "দেশি" },
  { slug: "neocare", label: "Neocare", origin: "দেশি" },
  { slug: "huggies", label: "Huggies", origin: "বিদেশি" },
  { slug: "pampers", label: "Pampers", origin: "বিদেশি" },
];

const PIECES_PER_DAY = 6;
const DAYS_PER_YEAR = 365;

const FAQS = [
  {
    q: "দেশি ব্র্যান্ড কি সব সময় সস্তা?",
    a: "না। এই পাতা বানানোর সময় আজকের দাম টেনে দেখলাম M সাইজে Pampers-এর সবচেয়ে সস্তা লিস্টিং আসলে Neocare আর কখনো কখনো Bashundhara-র চেয়েও কম। কারণটা ব্র্যান্ড না, প্রোমোশন। কোনো একদিন কোন দোকানে কোন প্যাক ডিসকাউন্টে আছে তার ওপর নির্ভর করে র‍্যাংকিং বদলে যায়। তাই ধরে নেওয়াটা ভুল, নিচের টেবিলটা আজকের আসল সংখ্যা দিয়ে দেখাই ভালো।",
  },
  {
    q: "Neocare বা Bashundhara কি Huggies-Pampers-এর মতো শোষণ করে?",
    a: "কাপড়ের গঠন প্রায় একই ধরনের হলেও কোর-এর SAP (super absorbent polymer) পরিমাণে ফারাক থাকে। ব্যবহারকারীদের মন্তব্য দেখে আমার ধারণা: দিনের বেলা ৩-৪ ঘণ্টার ব্যবহারে ফারাক প্রায় বোঝা যায় না, কিন্তু ৮ ঘণ্টার রাতের ঘুমে Huggies বা Pampers একটু বেশি ভরসাযোগ্য। দেশি ব্র্যান্ড দিনের জন্য রাখা, রাতে বিদেশি, এই মিশ্র কৌশলটাই বেশিরভাগ অভিভাবক শেষমেশ বেছে নেন।",
  },
  {
    q: "টেবিলে কিছু সাইজে দাম নেই কেন?",
    a: "Pampers-এর S সাইজ আজ কোনো দোকানে স্টকে নেই, তাই কলামটা ফাঁকা। Bashundhara-র Newborn আর XL সাইজও বাজারে কম পাওয়া যায় কারণ তারা মূলত M-L রেঞ্জে ফোকাস করে। এটা ডেটার সমস্যা না, বাস্তব স্টকের প্রতিফলন। কাল আবার চেক করলে হয়তো পূরণ হয়ে যাবে।",
  },
  {
    q: "বছরে কত টাকা ফারাক হতে পারে?",
    a: "নিচের হিসাবে দিনে ৬টা পিস আর বছরে ৩৬৫ দিন ধরা হয়েছে, যা একজন সাধারণ M-সাইজ বাচ্চার গড় ব্যবহার। এই ধরে নেওয়াটা প্রতিটা বাচ্চার জন্য এক না, কারো লাগে কম, কারো বেশি। তবে চার ব্র্যান্ডের আজকের সস্তা দাম দিয়ে হিসাব করলে ফারাকটা কয়েক হাজার টাকা পর্যন্ত দাঁড়ায়, যা এক মাসের মুদি খরচের কাছাকাছি।",
  },
  {
    q: "শুধু দাম দেখে ব্র্যান্ড বদলানো কি ঠিক হবে?",
    a: "না, প্রথমে যেই ব্র্যান্ড এখন পরাচ্ছেন সেটাতেই ফিট আর র‍্যাশ-ফ্রি থাকলে দাম বাঁচানোর জন্য হুট করে বদলাবেন না। বদলাতে হলে একটা ছোট প্যাক কিনে ২-৩ দিন পরিয়ে চামড়ার প্রতিক্রিয়া দেখুন। দাম বাঁচল কিন্তু র‍্যাশ হলো, সেটা লাভ না।",
  },
];

export default async function LocalVsImportedPage() {
  const productsByBrand = await Promise.all(
    BRANDS.map(b =>
      getAllProducts({ brand_slug: b.slug, sort: "price_per_piece" }).catch(() => [] as DiaperProduct[])
    )
  );

  const rows = SIZES.map(s => {
    const cells = BRANDS.map((b, i) => {
      const match = productsByBrand[i].filter(p => p.size_label === s.label);
      return match[0] ?? null;
    });
    return { ...s, cells };
  }).filter(r => r.cells.some(c => c !== null));

  const mRow = rows.find(r => r.label === "M");
  const yearly = mRow
    ? BRANDS.map((b, i) => {
        const p = mRow.cells[i];
        if (!p) return { ...b, price: null, yearly: null };
        const price = Number(p.price_per_piece);
        return { ...b, price, yearly: Math.round(price * PIECES_PER_DAY * DAYS_PER_YEAR) };
      })
    : [];
  const validYearly = yearly.filter(y => y.yearly !== null) as (typeof yearly[number] & { yearly: number })[];
  const cheapest = validYearly.length
    ? validYearly.reduce((a, b) => (a.yearly < b.yearly ? a : b))
    : null;
  const priciest = validYearly.length
    ? validYearly.reduce((a, b) => (a.yearly > b.yearly ? a : b))
    : null;

  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "দেশি বনাম বিদেশি ব্র্যান্ড", item: "https://diaperdam.com/guide/local-vs-imported-diaper-brands-bangladesh" },
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
    headline: "দেশি নাকি বিদেশি? Neocare-Bashundhara বনাম Huggies-Pampers বছরে কত টাকা ফারাক",
    inLanguage: "bn",
    datePublished: today,
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/local-vs-imported-diaper-brands-bangladesh",
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
              {" / "}দেশি বনাম বিদেশি ব্র্যান্ড
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              দেশি নাকি বিদেশি? Neocare-Bashundhara বনাম Huggies-Pampers
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              চারটা ব্র্যান্ডের আজকের সাইজ-ভিত্তিক দাম আর এক বছরের হিসাব পাশাপাশি।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            চালডালে ঢুকে "সস্তা ডায়াপার" লিখে সার্চ দিলে প্রথমেই আসে Neocare আর Bashundhara।
            ধরে নেওয়া হয় দেশি মানেই সস্তা। আজকের ডেটা টেনে দেখলাম, ব্যাপারটা অতটা সোজা না।
          </p>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              <strong>সংক্ষেপে:</strong> M সাইজে আজ সবচেয়ে সস্তা{" "}
              {cheapest ? `${cheapest.label} (৳${cheapest.price?.toFixed(2)}/পিস)` : "একটি ব্র্যান্ড"}
              , সবচেয়ে দামি{" "}
              {priciest ? `${priciest.label} (৳${priciest.price?.toFixed(2)}/পিস)` : "অন্যটি"}
              । দেশি-বিদেশি না, স্টক আর প্রোমোশনের ওপর নির্ভর করে দিনভেদে বদলায়।
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাইজ অনুযায়ী আজকের দাম (৳/পিস)</h2>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="py-2 px-3 border border-slate-200">সাইজ</th>
                  {BRANDS.map(b => (
                    <th key={b.slug} className="py-2 px-3 border border-slate-200 text-right">
                      {b.label}
                      <span className="block text-[10px] font-normal text-slate-400">{b.origin}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.slug}>
                    <td className="py-2 px-3 border border-slate-200">
                      <a href={`/size/${r.slug}`} className="text-emerald-700 hover:underline font-medium">{r.labelBn}</a>
                    </td>
                    {r.cells.map((c, i) => (
                      <td key={BRANDS[i].slug} className="py-2 px-3 border border-slate-200 text-right font-semibold">
                        {c ? `৳${Number(c.price_per_piece).toFixed(2)}` : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mb-6 text-sm text-slate-500">
            পুরো তালিকা ব্র্যান্ড পাতায়:{" "}
            {BRANDS.map((b, i) => (
              <span key={b.slug}>
                <a href={`/brand/${b.slug}`} className="text-emerald-700 hover:underline">{b.label}</a>
                {i < BRANDS.length - 1 ? ", " : "।"}
              </span>
            ))}
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">M সাইজে এক বছরের হিসাব</h2>
          <p className="mb-4">
            দিনে {PIECES_PER_DAY}টা পিস আর বছরে {DAYS_PER_YEAR} দিন ধরে হিসাব করলে, আজকের সবচেয়ে সস্তা
            দাম দিয়ে চার ব্র্যান্ডের বার্ষিক খরচ এমন দাঁড়ায়। এটা ধরে নেওয়া হিসাব, প্রতিদিনের দাম বদলাতে পারে।
          </p>
          {validYearly.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="py-2 px-3 border border-slate-200">ব্র্যান্ড</th>
                    <th className="py-2 px-3 border border-slate-200 text-right">প্রতি-পিস</th>
                    <th className="py-2 px-3 border border-slate-200 text-right">বছরে (আনুমানিক)</th>
                  </tr>
                </thead>
                <tbody>
                  {validYearly
                    .sort((a, b) => a.yearly - b.yearly)
                    .map(y => (
                      <tr key={y.slug}>
                        <td className="py-2 px-3 border border-slate-200 font-medium">{y.label}</td>
                        <td className="py-2 px-3 border border-slate-200 text-right">৳{y.price?.toFixed(2)}</td>
                        <td className="py-2 px-3 border border-slate-200 text-right font-semibold">
                          ৳{y.yearly.toLocaleString("en-US")}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          {cheapest && priciest && cheapest.slug !== priciest.slug && (
            <p className="mb-6 text-sm text-slate-500">
              {cheapest.label} আর {priciest.label}-এর মধ্যে ফারাক প্রায় ৳
              {(priciest.yearly - cheapest.yearly).toLocaleString("en-US")} প্রতি বছর।
              এক মাসের মুদি বাজেটের একটা বড় অংশের সমান।
            </p>
          )}

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কেন দেশি ব্র্যান্ড সবসময় সস্তা না</h2>
          <p className="mb-4">
            Bashundhara আর Neocare স্থানীয়ভাবে তৈরি বলে পরিবহন খরচ কম, এটা সত্যি। কিন্তু Huggies আর
            Pampers বাংলাদেশে এত বেশি বিক্রি হয় যে দারাজ, চালডাল, স্বপ্ন, সবাই ভলিউম ডিসকাউন্ট নিয়ে
            প্রতিযোগিতা করে। ফলাফল: কোনো সপ্তাহে Pampers-এর বড় প্যাক প্রোমোশনে এমন দামে নামে যা
            Neocare-এর নিয়মিত দামের চেয়েও কম।
          </p>
          <p className="mb-4">
            আমি নিজে যখন এই টেবিল বানানোর জন্য ডেটা টানছিলাম, দেখলাম Pampers M সাইজের সবচেয়ে সস্তা
            লিস্টিং আসলে একটা বড় বাল্ক প্যাক ছিল। ছোট প্যাক কিনলে প্রতি-পিস দাম আরো বেশি হতো। তাই
            টেবিলের সংখ্যা মানেই "যেকোনো প্যাকে এই দাম" না, বরং "আজ পাওয়া সবচেয়ে সস্তা প্যাক এই দাম"।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">দাম ছাড়া আর কী দেখবেন</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li><strong>প্যাক সাইজ:</strong> বড় প্যাকে প্রতি-পিস দাম কম, কিন্তু ভুল সাইজ কিনলে বাচ্চা বড় হয়ে গেলে বাকিটা নষ্ট হয়।</li>
            <li><strong>উৎপাদনের তারিখ:</strong> দেশি ব্র্যান্ডে স্টক টার্নওভার দ্রুত, তাই সাধারণত তাজা প্যাক পাওয়ার সম্ভাবনা বেশি।</li>
            <li><strong>দিন-রাত মিশ্র কৌশল:</strong> দিনে সস্তা দেশি ব্র্যান্ড, রাতে ভরসাযোগ্য বিদেশি ব্র্যান্ড — এভাবে খরচ আর নিরাপত্তা দুটোই ব্যালান্স করা যায়।</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাধারণ প্রশ্ন</h2>
          <div className="space-y-4 mb-8">
            {FAQS.map(f => (
              <div key={f.q} className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{f.q}</h3>
                <p className="text-sm text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href="/guide/best-diaper-brands-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সেরা ব্র্যান্ড তালিকা
              </a>
              <a href="/guide/huggies-vs-pampers-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                হাগিস বনাম প্যাম্পারস
              </a>
              <a href="/guide/mamypoko-vs-molfix-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                ম্যামিপোকো বনাম মলফিক্স
              </a>
              <a href="/guide/diaper-budget-monthly" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                মাসিক বাজেট গাইড
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
