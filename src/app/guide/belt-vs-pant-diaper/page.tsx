import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "বেল্ট ডায়াপার বনাম প্যান্ট ডায়াপার: পার্থক্য, কখন বদলাবেন, আজকের দাম",
  description:
    "বেল্ট ডায়াপার নবজাতক থেকে হামাগুড়ির আগ পর্যন্ত, প্যান্ট তার পর। কখন সুইচ করবেন, কোনটা সস্তা, আর আজ বাংলাদেশে কোন দোকানে কম দামে পাওয়া যাচ্ছে, সব এক পাতায়।",
  alternates: { canonical: "https://diaperdam.com/guide/belt-vs-pant-diaper" },
};

const FAQS = [
  {
    q: "বেল্ট ডায়াপার আর প্যান্ট ডায়াপারের মূল পার্থক্য কী?",
    a: "বেল্ট ডায়াপারে দুই পাশে আঠালো ট্যাব থাকে, শুইয়ে পরাতে হয়। প্যান্ট ডায়াপার প্যান্টের মতো টেনে পরানো যায়, দাঁড় করিয়েও। নবজাতকের জন্য বেল্ট ভালো কারণ ফিট একদম নিখুঁত করা যায়। হামাগুড়ি বা দাঁড়ানো বাচ্চার জন্য প্যান্ট, কারণ শুইয়ে পরানো তখন রীতিমতো কুস্তি।",
  },
  {
    q: "কখন বেল্ট থেকে প্যান্ট ডায়াপারে যাওয়া উচিত?",
    a: "বয়স বা ওজনের চেয়ে তিনটা সংকেত বেশি কাজের: শুইয়ে পরাতে গেলে বাচ্চা ছটফট করে, ট্যাব বারবার আলগা হয়, বা দাঁড়িয়ে পরানো দরকার হচ্ছে। এগুলো দেখলে এক প্যাক প্যান্ট কিনে চালিয়ে দেখুন, এক-দুই দিনেই বুঝবেন।",
  },
  {
    q: "প্যান্ট ডায়াপার কি বেল্টের চেয়ে দামি?",
    a: "একই ব্র্যান্ডে প্যান্ট সাধারণত প্রতি পিস দুই থেকে পাঁচ টাকা বেশি। তবে কোনো ব্র্যান্ড বড় প্যাকে প্যান্ট দেয় আর ছোট প্যাকে বেল্ট, তখন প্রতি পিস দাম উল্টো হয়ে যায়। প্যাকের গায়ের দামে তুলনা না করে প্রতি পিস দামেই দেখুন।",
  },
  {
    q: "বেল্ট থেকে প্যান্টে গেলে কি লিকেজ বাড়ে?",
    a: "প্রথম কয়েক দিন হয় কারণ ফিটটা নতুন। প্যান্টের কোমর ঢিলা লাগলে এক সাইজ ছোট চেষ্টা করুন। বেশিরভাগ ক্ষেত্রে তিন-চার দিনেই অভ্যাস হয়ে যায়।",
  },
  {
    q: "রাতে কোনটা ভালো, বেল্ট নাকি প্যান্ট?",
    a: "রাতে দুটোই চলে। তবে বাচ্চা যদি ঘুমের মধ্যে উপুড় হয় বা পাশ ফেরে, প্যান্টের কোমরের ইলাস্টিক ফিট ধরে রাখে ভালো। বেল্টের ট্যাব ঘুমের মধ্যে আলগা হলে লিক হওয়ার সম্ভাবনা থাকে।",
  },
];

export default async function BeltVsPantGuidePage() {
  const [beltProducts, pantProducts] = await Promise.all([
    getAllProducts({ type: "belt", sort: "price_per_piece" }).catch(() => [] as DiaperProduct[]),
    getAllProducts({ type: "pants", sort: "price_per_piece" }).catch(() => [] as DiaperProduct[]),
  ]);

  const topBelt = beltProducts.slice(0, 5);
  const topPants = pantProducts.slice(0, 5);
  const cheapestBelt = beltProducts[0];
  const cheapestPant = pantProducts[0];
  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "হোম", "item": "https://diaperdam.com" },
      { "@type": "ListItem", "position": 2, "name": "ডায়াপার", "item": "https://diaperdam.com/diapers" },
      { "@type": "ListItem", "position": 3, "name": "বেল্ট বনাম প্যান্ট ডায়াপার", "item": "https://diaperdam.com/guide/belt-vs-pant-diaper" },
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
    "headline": "বেল্ট ডায়াপার বনাম প্যান্ট ডায়াপার: পার্থক্য, কখন বদলাবেন, আজকের দাম",
    "inLanguage": "bn",
    "datePublished": "2026-06-17",
    "dateModified": today,
    "author": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "publisher": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "mainEntityOfPage": "https://diaperdam.com/guide/belt-vs-pant-diaper",
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
              {" / "}বেল্ট বনাম প্যান্ট ডায়াপার
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              বেল্ট ডায়াপার বনাম প্যান্ট ডায়াপার
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              কোনটা কার জন্য, কখন বদলাবেন, কোনটা সস্তা, আর আজকের দাম।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            হামাগুড়ি শুরুর পর অনেক বাবা-মা একটা সমস্যায় পড়েন: শুইয়ে ডায়াপার পরাতে গেলে বাচ্চা উল্টে
            যায়, ট্যাব মিস হয়, বারবার করতে করতে দুজনেরই ধৈর্য ফুরায়। এটাই সংকেত যে বেল্ট থেকে প্যান্টে
            যাওয়ার সময় হয়েছে।
          </p>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              এক লাইনে: বেল্ট ডায়াপার নবজাতক থেকে হামাগুড়ির আগ পর্যন্ত, প্যান্ট তার পর থেকে।
              একই ব্র্যান্ডে প্যান্ট সাধারণত প্রতি পিসে দুই থেকে পাঁচ টাকা বেশি, তবে প্যাকের সাইজ
              আলাদা হলে হিসাব বদলায়।
              {cheapestBelt && cheapestPant && (
                <>
                  {" "}আজ সবচেয়ে সস্তা বেল্ট{" "}
                  <strong>৳{Number(cheapestBelt.price_per_piece).toFixed(2)}/পিস</strong>{" "}
                  ({cheapestBelt.brand}, {cheapestBelt.store_name}), সবচেয়ে সস্তা প্যান্ট{" "}
                  <strong>৳{Number(cheapestPant.price_per_piece).toFixed(2)}/পিস</strong>{" "}
                  ({cheapestPant.brand}, {cheapestPant.store_name})।
                </>
              )}
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">বেল্ট ডায়াপার: নবজাতক থেকে হামাগুড়ির আগ পর্যন্ত</h2>
          <p className="mb-4">
            বেল্ট ডায়াপারের দুই পাশে আঠালো ট্যাব থাকে। বাচ্চাকে শুইয়ে পেটের নিচ দিয়ে ডায়াপার ঢুকিয়ে
            দুই পাশ আটকানো হয়। নবজাতকের জন্য এটা ভালো কারণ ফিট নিখুঁত করা যায়, কোমর বা উরুতে গলা-আঁটা
            লাগলে ট্যাব একটু সরিয়ে দেওয়া যায়।
          </p>
          <p className="mb-4">
            ট্যাব সাধারণত কয়েকবার লাগানো-খোলা চলে, তাই পরানোর পর ফিট ঠিক না লাগলে আবার সামলে নেওয়া
            সহজ। নবজাতক বা তিন-চার মাস পর্যন্ত যে সময়টায় বাচ্চা প্রায় শুয়েই থাকে, সেই সময়ে বেল্টের
            কোনো বিকল্প নেই।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">প্যান্ট ডায়াপার: হামাগুড়ি থেকে টয়লেট ট্রেনিং পর্যন্ত</h2>
          <p className="mb-4">
            প্যান্ট ডায়াপার টেনে পরানো যায়, দাঁড় করিয়ে দশ সেকেন্ডেই কাজ শেষ। হামাগুড়ি দেওয়া বা
            দৌড়ানো বাচ্চাকে শুইয়ে পরানোটা যে ঝামেলা, প্যান্ট সেটা কাটায়।
          </p>
          <p className="mb-4">
            বদলানোর সময় দুই পাশ ছিঁড়ে ফেলে সরানো যায়, পায়খানা হলে নিচে না নামিয়েও বদলানো সম্ভব।
            এই কারণে টয়লেট ট্রেনিং শেষ হওয়া পর্যন্ত বেশিরভাগ পরিবার প্যান্টই রাখেন।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কখন সুইচ করবেন</h2>
          <p className="mb-3">বয়স বা ওজনের চেয়ে তিনটা ব্যবহারিক সংকেত বেশি নির্ভরযোগ্য:</p>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>শুইয়ে পরাতে গেলে বাচ্চা ছটফট করে, ট্যাব বারবার মিস হয়</li>
            <li>বাচ্চা হামাগুড়ি দেওয়া শুরু করেছে বা দাঁড়ানোর চেষ্টা করছে</li>
            <li>ট্যাবের আঠা দুর্বল হয়ে যাচ্ছে বা কাপড়ে লেগে যাচ্ছে</li>
          </ul>
          <p className="mb-4">
            এর যেকোনো একটা দেখলে এক প্যাক প্যান্ট কিনে চালিয়ে দেখুন। এক-দুই দিনেই বুঝবেন পরানো
            সহজ হয়েছে কি না।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">দামের তুলনা</h2>
          <p className="mb-4">
            একই ব্র্যান্ডের একই সাইজে প্যান্ট প্রায়ই প্রতি পিস দুই-পাঁচ টাকা বেশি, কারণ ইলাস্টিক
            বেশি লাগে আর প্যাকেও পিস কম থাকে। তবে কোনো কোনো ব্র্যান্ড বড় প্যাকে প্যান্ট দেয়
            আর ছোট প্যাকে বেল্ট, তখন প্রতি পিস দামটা উল্টো হয়ে যায়।
          </p>
          <p className="mb-4">
            প্যাকের গায়ের দামে তুলনা করলে ভুল হবে। নিচের গ্রিডে প্রতি পিস দামে সাজানো আছে।
          </p>

          {topBelt.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">আজকের সবচেয়ে সস্তা বেল্ট ডায়াপার</h2>
              <p className="mb-3 text-sm text-slate-500">প্রতি পিস দামে সাজানো, প্রতিদিন আপডেট।</p>
              <div className="overflow-x-auto mb-6">
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
                    {topBelt.map(p => (
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
            </>
          )}

          {topPants.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">আজকের সবচেয়ে সস্তা প্যান্ট ডায়াপার</h2>
              <p className="mb-3 text-sm text-slate-500">প্রতি পিস দামে সাজানো, প্রতিদিন আপডেট।</p>
              <div className="overflow-x-auto mb-6">
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
                    {topPants.map(p => (
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
            </>
          )}

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
              <a href="/guide/newborn-diaper-size" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                নবজাতকের সাইজ গাইড
              </a>
              <a href="/guide/diaper-size-chart" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                পুরো সাইজ চার্ট
              </a>
              <a href="/guide/diaper-rash-prevention" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                র‍্যাশ প্রতিরোধ গাইড
              </a>
              <a href="/diapers" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                ব্র্যান্ড × সাইজ গ্রিড
              </a>
              <a href="/price-index" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                দামের সূচক
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
