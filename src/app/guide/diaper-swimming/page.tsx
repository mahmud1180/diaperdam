import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "সুইমিং পুলে বা সমুদ্রে বাচ্চার ডায়াপার: কী পরাবেন? ২০২৬",
  description:
    "বাংলাদেশে আলাদা সুইম ডায়াপার পাওয়া কঠিন — পুল বা কক্সবাজার সৈকতে বাচ্চাকে কী পরাবেন, রিইউজেবল সুইম প্যান্ট নাকি সাধারণ ডায়াপার, আর পানির পর কী করবেন তার হিসাব।",
  alternates: { canonical: "https://diaperdam.com/guide/diaper-swimming" },
};

const FAQS = [
  {
    q: "বাংলাদেশে কি আলাদা সুইম ডায়াপার পাওয়া যায়?",
    a: "চাল, দারাজ বা শপনো-তে নির্দিষ্ট 'swim diaper' ব্র্যান্ড হিসেবে খুব কম পাওয়া যায় — বেশিরভাগ দোকানে এটা আলাদা ক্যাটাগরি হিসেবেই নেই। বিদেশি অনলাইন শপ থেকে আনানো ছাড়া উপায় কম, তাই বেশিরভাগ অভিভাবক রিইউজেবল সুইম প্যান্ট বা সাধারণ প্যান্ট-টাইপ ডায়াপার দিয়েই কাজ চালান।",
  },
  {
    q: "সাধারণ ডায়াপার পরে কি পুলে নামা যায়?",
    a: "না, উচিত না। সাধারণ ডায়াপারের ভেতরের জেল পানি শুষে ফুলে যায়, ভারী হয়ে যায় আর ভেঙে গিয়ে পুলের পানিতে জেল ছড়িয়ে পড়তে পারে। বেশিরভাগ পাবলিক পুল এই কারণে নিয়মিত ডায়াপার নিষিদ্ধ করে।",
  },
  {
    q: "রিইউজেবল সুইম প্যান্ট কোথায় পাব?",
    a: "দারাজে 'বেবি সুইম প্যান্টি' বা 'reusable swim diaper' লিখে খুঁজলে কিছু বিক্রেতা পাওয়া যায়, দাম সাধারণত ৩০০-৬০০ টাকার মধ্যে। এটা একবার কিনলে বার বার ধুয়ে ব্যবহার করা যায়, তাই দীর্ঘমেয়াদে সস্তা।",
  },
  {
    q: "কক্সবাজার সৈকতে বাচ্চাকে কী পরাব?",
    a: "খোলা সমুদ্রে পুলের মতো কড়াকড়ি নেই, তাই অনেকে টাইট-ফিটিং প্যান্ট-টাইপ ডায়াপার পরিয়েই নামান। তবে ভেজার পর দ্রুত ভারী হয়ে যায়, তাই পানিতে ২০-৩০ মিনিটের বেশি না রেখে বদলে ফেলাই ভালো।",
  },
  {
    q: "পানি থেকে ওঠার পর কতক্ষণের মধ্যে বদলাতে হবে?",
    a: "উঠেই যত দ্রুত সম্ভব। ভেজা কাপড় বা ডায়াপার গায়ে বেশিক্ষণ রাখলে র‍্যাশ আর ফাঙ্গাস ইনফেকশনের ঝুঁকি বাড়ে। শুকনো তোয়ালে দিয়ে ভালো করে মুছে, শুকিয়ে তারপর নতুন ডায়াপার পরান।",
  },
];

export default async function DiaperSwimmingPage() {
  const products = await getAllProducts({ sort: "price_per_piece" })
    .catch(() => [] as DiaperProduct[]);

  const pantsType = products.filter(p => p.type === "pants");
  const top = (pantsType.length > 0 ? pantsType : products).slice(0, 6);
  const cheapest = top[0];
  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "সুইমিং গাইড", item: "https://diaperdam.com/guide/diaper-swimming" },
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
    headline: "সুইমিং পুলে বা সমুদ্রে বাচ্চার ডায়াপার — কী পরাবেন",
    inLanguage: "bn",
    datePublished: "2026-07-03",
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/diaper-swimming",
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
              {" / "}সুইমিং গাইড
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              পুলে বা সমুদ্রে বাচ্চার ডায়াপার: কী পরাবেন?
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              বাংলাদেশে আলাদা সুইম ডায়াপার প্রায় নেই — রিইউজেবল প্যান্ট নাকি সাধারণ ডায়াপার, কোনটা কখন কাজ করবে।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">

          <p className="mb-4">
            গরমের ছুটিতে হোটেলের পুলে বা কক্সবাজার সৈকতে বাচ্চাকে নামানোর আগে বেশিরভাগ অভিভাবক
            একটা জিনিসেই আটকে যান — বিদেশে যেমন নির্দিষ্ট &quot;swim diaper&quot; পাওয়া যায়, বাংলাদেশের
            দোকানে সেটা প্রায় নেই। Chaldal বা Daraz-এ খুঁজলে এই ক্যাটাগরিতে হাতে গোনা কয়েকটা প্রোডাক্ট
            মেলে, তাও সবসময় স্টকে থাকে না।
          </p>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              <strong>সংক্ষেপে:</strong> পাবলিক পুলে সাধারণ ডায়াপার পরানো ঠিক না — জেল ফুলে পানি
              নোংরা করে। রিইউজেবল সুইম প্যান্ট সবচেয়ে ভালো বিকল্প, না পেলে টাইট প্যান্ট-টাইপ ডায়াপার
              পরিয়ে ২০-৩০ মিনিটের মধ্যে বদলে ফেলুন।
              {cheapest && (
                <>
                  {" "}আজ প্যান্ট-টাইপে সবচেয়ে কম প্রতি পিস{" "}
                  <strong>৳{Number(cheapest.price_per_piece).toFixed(2)}/পিস</strong>{" "}
                  ({cheapest.brand}{cheapest.size_label ? `, ${cheapest.size_label}` : ""}, {cheapest.store_name})।
                </>
              )}
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাধারণ ডায়াপার কেন পুলের জন্য না</h2>
          <p className="mb-4">
            ডায়াপারের ভেতরে যে সুপার-অ্যাবজর্বেন্ট জেল থাকে, সেটা তৈরিই হয়েছে প্রস্রাব শুষে নেওয়ার
            জন্য। পুলের পানিতে নামলে এই জেল দ্রুত পানি টেনে ফুলে ওঠে, ডায়াপার কয়েক মিনিটেই ভারী হয়ে
            যায় আর অনেক সময় ভেঙে জেল-দানা পানিতে ছড়িয়ে পড়ে। এই কারণেই ঢাকার বেশিরভাগ ভালো হোটেলের
            পুলে নিয়মিত ডায়াপার পরে নামা নিষেধ থাকে — লাইফগার্ড দেখলে আটকে দেবেন।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">রিইউজেবল সুইম প্যান্ট — সবচেয়ে ভালো বিকল্প</h2>
          <p className="mb-4">
            ডেডিকেটেড সুইম ডায়াপারের বদলে রিইউজেবল কাপড়ের সুইম প্যান্ট এখন দারাজে বিভিন্ন
            বিক্রেতার কাছে পাওয়া যায়, দাম মোটামুটি ৩০০-৬০০ টাকা। এতে সুপার-অ্যাবজর্বেন্ট জেল থাকে
            না, শুধু কঠিন বর্জ্য আটকায় আর পানি টেনে নেয় না — তাই পুলের পানি নোংরা হওয়ার ঝুঁকি কম।
            একবার কিনে বার বার ধুয়ে ব্যবহার করা যায় বলে দুই-তিনবার পুলে গেলেই দাম উঠে আসে।
          </p>
          <p className="mb-4">
            কেনার সময় কোমর ও উরুর ইলাস্টিক টাইট কিনা যাচাই করুন — ঢিলা হলে পানিতে খুলে যাওয়ার
            সম্ভাবনা থাকে।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সৈকতে ভিন্ন হিসাব</h2>
          <p className="mb-4">
            কক্সবাজার বা পতেঙ্গার খোলা সমুদ্রে পুলের মতো কড়া নিয়ম নেই, তাই অনেক অভিভাবক টাইট-ফিটিং
            প্যান্ট-টাইপ সাধারণ ডায়াপার পরিয়েই ঢেউয়ের কাছে নামান। সমস্যা নেই, তবে ঢেউয়ের পানি লাগার
            সাথে সাথে ডায়াপার ভারী হতে শুরু করে — ২০-৩০ মিনিটের মধ্যে বদলে ফেলুন, নাহলে ঝুলে পড়ে
            চলাফেরায় অসুবিধা হবে।
          </p>
          <p className="mb-4">
            বালিতে খেলার সময়ও ডায়াপারের ভেতরে বালি ঢুকে যায় বলে ঘোরাঘুরির পর একবার চেক করে নেওয়া
            ভালো — বালি লেগে থাকলে ঘষা লেগে র‍্যাশ হতে পারে।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">পানি থেকে ওঠার পর করণীয়</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li><strong>দ্রুত বদলান</strong> — ভেজা ডায়াপার বা সুইম প্যান্ট ৩০ মিনিটের বেশি না রাখাই ভালো।</li>
            <li><strong>শুকনো মুছুন</strong> — বিশেষ করে ভাঁজে ভাঁজে, তারপর কিছুক্ষণ খোলা রেখে বাতাস লাগান।</li>
            <li><strong>জিঙ্ক ক্রিম লাগান</strong> — লবণ পানি বা ক্লোরিনযুক্ত পুলের পানি ত্বকে জ্বালা ধরাতে পারে।</li>
            <li><strong>ভেজা প্যান্ট আলাদা ব্যাগে রাখুন</strong> — অন্য জিনিসে পানি লাগা থেকে বাঁচতে জিপলক ব্যাগ সাথে রাখুন।</li>
          </ul>

          {/* Live price table */}
          {top.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">
                প্যান্ট-টাইপে আজকের সবচেয়ে কম দাম
              </h2>
              <p className="mb-3 text-sm text-slate-500">
                সুইম প্যান্ট না পেলে টাইট-ফিটিং প্যান্ট-টাইপ ডায়াপারই সবচেয়ে কাছের বিকল্প। প্রতিদিন আপডেট হয়।
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
                    {top.map(p => (
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

          <p className="mb-4 text-sm text-slate-500">
            একবার রিইউজেবল সুইম প্যান্ট কিনে রাখলে প্রতিটা পুল ট্রিপে নতুন করে ভাবতে হয় না — ব্যাগে
            রেখে দিলেই হলো।
          </p>

          {/* Cross-links */}
          <div className="pt-4 border-t border-slate-100 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href="/guide/belt-vs-pant-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                বেল্ট নাকি প্যান্ট
              </a>
              <a href="/guide/diaper-rash-prevention" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                র‍্যাশ প্রতিরোধ গাইড
              </a>
              <a href="/guide/diaper-travel-tips" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                ভ্রমণ গাইড
              </a>
              <a href="/guide/diaper-allergy-sensitive-skin" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                অ্যালার্জি ও সেনসিটিভ ত্বক
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
