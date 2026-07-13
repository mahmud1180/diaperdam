import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "হাগিস নাকি প্যাম্পারস? বাংলাদেশে দাম ও তুলনা ২০২৬",
  description:
    "Huggies আর Pampers, বাংলাদেশে কোনটা সস্তা, কোনটা রাতে ভালো, কোনটা সংবেদনশীল ত্বকের জন্য নিরাপদ। সাইজ অনুযায়ী আজকের প্রতি-পিস দাম পাশাপাশি, কোনটা কার জন্য তার সোজা উত্তর।",
  alternates: { canonical: "https://diaperdam.com/guide/huggies-vs-pampers-bangladesh" },
};

const SIZES = [
  { slug: "newborn", label: "Newborn", labelBn: "নবজাতক" },
  { slug: "s", label: "S", labelBn: "S" },
  { slug: "m", label: "M", labelBn: "M" },
  { slug: "l", label: "L", labelBn: "L" },
  { slug: "xl", label: "XL", labelBn: "XL" },
  { slug: "xxl", label: "XXL", labelBn: "XXL" },
];

const FAQS = [
  {
    q: "হাগিস আর প্যাম্পারসের মধ্যে কোনটা বেশি শোষণ করে?",
    a: "রাতের জন্য বেশিরভাগ অভিভাবক Pampers Baby Dry বা Huggies Wonder Pants-কে সমান মানের ধরেন। ফারাকটা কাপড়ে না, ফিটে। কোমরের মাপ ঠিক না হলে যেকোনো ব্র্যান্ডেই লিক হবে। দুটোই একবার করে কিনে ওজন অনুযায়ী ফিট মিলিয়ে দেখাই সবচেয়ে নির্ভরযোগ্য পথ।",
  },
  {
    q: "সংবেদনশীল ত্বকে কোনটা নিরাপদ?",
    a: "দুটো ব্র্যান্ডই ফ্র্যাগ্রেন্স-ফ্রি লাইন বিক্রি করে (Pampers Premium Care, Huggies Platinum), কিন্তু বাংলাদেশে দোকানে সব সময় সেই লাইন পাওয়া যায় না। যা পাওয়া যাচ্ছে তার প্যাকেটে 'hypoallergenic' লেখা আছে কিনা দেখুন, নইলে প্রথম কয়েকদিন অল্প সময় পরিয়ে ত্বক পর্যবেক্ষণ করুন।",
  },
  {
    q: "কেন একই সাইজে দাম এত আলাদা হয় দোকানভেদে?",
    a: "চালডাল, দারাজ, স্বপ্ন আর অথবা-র প্রতিটার আলাদা সাপ্লায়ার চুক্তি আর সময়ে সময়ে প্রমোশন থাকে। একই Huggies M প্যাক এক দোকানে আজ ৳৫ কম হতে পারে যা কাল আবার বদলে যায়। তাই একবার কেনার আগে এই পাতায় ফিরে চেক করাই ভালো অভ্যাস।",
  },
  {
    q: "প্যান্ট নাকি বেল্ট, কোনটার সাথে কোন ব্র্যান্ড ভালো যায়?",
    a: "Huggies-এর প্যান্ট লাইন (Wonder Pants) কোমরের ইলাস্টিক তুলনায় নরম, হামাগুড়ি দেওয়া বাচ্চার জন্য সুবিধাজনক। Pampers-এর বেল্ট লাইন (Baby Dry Taped) ছোট বাচ্চাদের জন্য বেশি ব্যবহার হয় কারণ টেপ দিয়ে টাইট করা সহজ। এটা নির্ভর করে বাচ্চা হাঁটতে শিখেছে কিনা তার ওপর।",
  },
  {
    q: "মাসে কত টাকার ফারাক হয় দুই ব্র্যান্ডে?",
    a: "গড়ে প্রতি-পিস ৳১-৩ ফারাক থাকে, সাইজ আর দোকান ভেদে বদলায়। দিনে ৬-৭টা পিস ধরলে মাসে এটা ৳২০০-৬০০ পর্যন্ত দাঁড়ায়। বড় অঙ্ক না, কিন্তু বছরে হিসাব করলে এক-দুই মাসের ডায়াপার খরচের সমান।",
  },
];

export default async function HuggiesVsPampersPage() {
  const [huggiesAll, pampersAll] = await Promise.all([
    getAllProducts({ brand_slug: "huggies", sort: "price_per_piece" }).catch(() => [] as DiaperProduct[]),
    getAllProducts({ brand_slug: "pampers", sort: "price_per_piece" }).catch(() => [] as DiaperProduct[]),
  ]);

  const rows = SIZES.map(s => {
    const h = huggiesAll.filter(p => p.size_label === s.label);
    const pm = pampersAll.filter(p => p.size_label === s.label);
    return {
      ...s,
      huggies: h[0] ?? null,
      pampers: pm[0] ?? null,
    };
  }).filter(r => r.huggies || r.pampers);

  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "হাগিস বনাম প্যাম্পারস", item: "https://diaperdam.com/guide/huggies-vs-pampers-bangladesh" },
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
    headline: "হাগিস নাকি প্যাম্পারস? বাংলাদেশে দাম ও তুলনা",
    inLanguage: "bn",
    datePublished: "2026-07-13",
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/huggies-vs-pampers-bangladesh",
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
              {" / "}হাগিস বনাম প্যাম্পারস
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              হাগিস নাকি প্যাম্পারস? বাংলাদেশে দাম ও তুলনা
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              সাইজ অনুযায়ী আজকের প্রতি-পিস দাম পাশাপাশি, আর কোনটা কার জন্য তার সোজা উত্তর।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            চালডাল বা দারাজে ডায়াপার কিনতে গেলে বেশিরভাগ অভিভাবক এই দুটো নামের মধ্যেই আটকে যান।
            দুটোই বিদেশি ব্র্যান্ড, দুটোই দোকানে সহজে পাওয়া যায়, দামও কাছাকাছি। কিন্তু কাছাকাছি মানে
            সমান না। আজকের দাম আর ব্যবহারিক পার্থক্য দুটোই নিচে দেওয়া হলো।
          </p>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              <strong>সংক্ষেপে:</strong> ছোট সাইজে (Newborn, S) সাধারণত Pampers একটু সস্তা পড়ে,
              বড় সাইজে (L, XL) দাম প্রায় সমান হয়ে যায়। রাতে দুটোই মোটামুটি একই রকম কাজ করে, ফারাক
              তৈরি হয় ফিটে। নিচের টেবিলে আজকের আসল দাম দেখুন।
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাইজ অনুযায়ী আজকের দাম</h2>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="py-2 px-3 border border-slate-200">সাইজ</th>
                  <th className="py-2 px-3 border border-slate-200 text-right">Huggies /পিস</th>
                  <th className="py-2 px-3 border border-slate-200 text-right">Pampers /পিস</th>
                  <th className="py-2 px-3 border border-slate-200">কম কোনটা</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const hPrice = r.huggies ? Number(r.huggies.price_per_piece) : null;
                  const pPrice = r.pampers ? Number(r.pampers.price_per_piece) : null;
                  let winner = "—";
                  if (hPrice !== null && pPrice !== null) {
                    winner = hPrice < pPrice ? "Huggies" : hPrice > pPrice ? "Pampers" : "সমান";
                  } else if (hPrice !== null) winner = "শুধু Huggies আছে";
                  else if (pPrice !== null) winner = "শুধু Pampers আছে";
                  return (
                    <tr key={r.slug}>
                      <td className="py-2 px-3 border border-slate-200">
                        <a href={`/size/${r.slug}`} className="text-emerald-700 hover:underline font-medium">{r.labelBn}</a>
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-right font-semibold">
                        {hPrice !== null ? `৳${hPrice.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-right font-semibold">
                        {pPrice !== null ? `৳${pPrice.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-xs text-slate-500">{winner}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mb-6 text-sm text-slate-500">
            পুরো তালিকা ব্র্যান্ড পাতায়:{" "}
            <a href="/brand/huggies" className="text-emerald-700 hover:underline">Huggies</a>{" "}
            আর{" "}
            <a href="/brand/pampers" className="text-emerald-700 hover:underline">Pampers</a>।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কাপড় আর ফিট: আসল পার্থক্য এখানে</h2>
          <p className="mb-4">
            দাম কাছাকাছি হলে সিদ্ধান্ত নেওয়ার আসল জায়গা হলো ফিট। Huggies-এর কোমরের ইলাস্টিক
            একটু চওড়া, তাই গোলগাল বাচ্চার জন্য আরাম বেশি। Pampers তুলনায় সরু কাটে, লম্বা-চিকন
            বাচ্চায় ভালো বসে। এটা কোনো ব্র্যান্ড বেশি ভালো তা না, শুধু শরীরের গড়নের সাথে মিলে যাওয়ার ব্যাপার।
          </p>
          <p className="mb-4">
            শোষণক্ষমতায় দুটোই ভালো। রাতের জন্য Pampers Baby Dry-র নাম বেশি শোনা যায়, কিন্তু
            Huggies Wonder Pants-এর ব্যবহারকারীরাও একই কথা বলেন। আমি নিজে যখন এই ডেটা তৈরি করছিলাম,
            দেখলাম দুই ব্র্যান্ডের রিভিউয়েই "রাতে লিক হয়নি" আর "লিক হয়েছে" দুটোই আছে সমান হারে।
            মানে ফিট ঠিক থাকলে দুটোই কাজ করে, ভুল সাইজ নিলে দুটোই ফেল করে।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">দাম ছাড়া আর কী দেখবেন</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li><strong>প্যাকেজের তারিখ:</strong> দুই ব্র্যান্ডেই কিছু দোকানে পুরনো স্টক থাকে, ইলাস্টিক ঢিলা হয়ে যায় বেশিদিন রাখলে।</li>
            <li><strong>বেল্ট বনাম প্যান্ট:</strong> নবজাতক থেকে ৬ মাস পর্যন্ত বেল্ট (টেপ) লাইন সুবিধাজনক, তারপর প্যান্ট। দুই ব্র্যান্ডেই দুই ধরনের লাইন আছে।</li>
            <li><strong>প্যাক সাইজ:</strong> বড় প্যাক (৫০+ পিস) প্রতি-পিস দাম কম রাখে, কিন্তু ভুল সাইজ কিনলে বড় প্যাক অপচয় হয়ে যায়।</li>
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
              <a href="/guide/diaper-size-by-weight" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সাইজ চার্ট গাইড
              </a>
              <a href="/guide/best-diaper-brands-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সেরা ব্র্যান্ড তালিকা
              </a>
              <a href="/guide/belt-vs-pant-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                বেল্ট বনাম প্যান্ট গাইড
              </a>
              <a href="/guide/night-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                রাতের ডায়াপার গাইড
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
