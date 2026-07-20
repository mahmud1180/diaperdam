import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ম্যামিপোকো নাকি মলফিক্স? বাংলাদেশে দাম ও তুলনা ২০২৬",
  description:
    "MamyPoko আর Molfix, বাংলাদেশে কোনটা সস্তা, কোনটার ফিট আঁটসাঁট, সাইজ নম্বর নিয়ে কনফিউশন কীভাবে এড়াবেন। সাইজ অনুযায়ী আজকের প্রতি-পিস দাম পাশাপাশি।",
  alternates: { canonical: "https://diaperdam.com/guide/mamypoko-vs-molfix-bangladesh" },
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
    q: "মলফিক্সের সাইজ নম্বর 1-5 মানে কী?",
    a: "মলফিক্স তুরস্কের নিয়মে প্যাকেটে নম্বর লেখে - 1 (Newborn), 2 (Mini/S), 3 (Midi/M), 4 (Maxi/L), 5 (Junior/XL)। দোকানে কেনার সময় নম্বর দেখে দ্বিধায় পড়লে ওজনের রেঞ্জটা প্যাকেটের পেছনে দেখে নিন, সেটা সব ব্র্যান্ডে মোটামুটি একই।",
  },
  {
    q: "ম্যামিপোকো কি শুধু প্যান্ট টাইপে পাওয়া যায়?",
    a: "বাংলাদেশের দোকানে যা পাওয়া যায় তার প্রায় পুরোটাই MamyPoko Pants Extra Absorb। বেল্ট (টেপ দেওয়া) লাইন এখানে সচরাচর স্টকে থাকে না, তাই নবজাতকের প্রথম কয়েক সপ্তাহে যারা বেল্ট পছন্দ করেন তাদের জন্য Molfix বা Pampers-এর বেল্ট লাইন বেশি সহজলভ্য।",
  },
  {
    q: "চটপটে বাচ্চার জন্য কোনটা ভালো ফিট করে?",
    a: "MamyPoko-র ওয়েস্টব্যান্ড তুলনামূলক সরু আর টানটান বসে, তাই হামাগুড়ি বা হাঁটা শেখা বাচ্চার কোমরে ভালো লাগে বলে অনেক অভিভাবক বলেন। Molfix-এর প্যান্ট লাইনও আছে তবে কাপড় একটু নরম-ঢিলা টাইপের, স্থির শুয়ে থাকা বাচ্চার জন্য বেশি স্বস্তিদায়ক।",
  },
  {
    q: "দুটোর মধ্যে কোনটা প্রতি পিসে সস্তা?",
    a: "সাধারণত Molfix প্রতি পিসে কম পড়ে, বিশেষ করে বড় সাইজে। কারণ এটা বাংলাদেশে বিদেশি ব্র্যান্ডগুলোর মধ্যে বাজেট-ফোকাসড হিসেবে পজিশন করা। MamyPoko একটু বেশি দামে বিক্রি হয় কারণ জাপানি কাপড় আর প্যাকেজিং প্রিমিয়াম হিসেবে ধরা হয়। নিচের টেবিলে আজকের আসল সংখ্যা দেখুন।",
  },
  {
    q: "একসাথে দুই ব্র্যান্ড মিলিয়ে ব্যবহার করা যায়?",
    a: "হ্যাঁ, অনেকেই করেন। দিনে সস্তা Molfix, আর বাইরে বের হওয়ার সময় বা রাতে আঁটসাঁট ফিটের জন্য MamyPoko Pants। দুটো ব্র্যান্ডের সাইজ রেঞ্জ কাছাকাছি হওয়ায় মিলিয়ে ব্যবহারে সমস্যা হয় না।",
  },
];

export default async function MamyPokoVsMolfixPage() {
  const [mamypokoAll, molfixAll] = await Promise.all([
    getAllProducts({ brand_slug: "mamypoko", sort: "price_per_piece" }).catch(() => [] as DiaperProduct[]),
    getAllProducts({ brand_slug: "molfix", sort: "price_per_piece" }).catch(() => [] as DiaperProduct[]),
  ]);

  const rows = SIZES.map(s => {
    const mp = mamypokoAll.filter(p => p.size_label === s.label);
    const mf = molfixAll.filter(p => p.size_label === s.label);
    return {
      ...s,
      mamypoko: mp[0] ?? null,
      molfix: mf[0] ?? null,
    };
  }).filter(r => r.mamypoko || r.molfix);

  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "ম্যামিপোকো বনাম মলফিক্স", item: "https://diaperdam.com/guide/mamypoko-vs-molfix-bangladesh" },
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
    headline: "ম্যামিপোকো নাকি মলফিক্স? বাংলাদেশে দাম ও তুলনা",
    inLanguage: "bn",
    datePublished: "2026-07-17",
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/mamypoko-vs-molfix-bangladesh",
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
              {" / "}ম্যামিপোকো বনাম মলফিক্স
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              ম্যামিপোকো নাকি মলফিক্স? বাংলাদেশে দাম ও তুলনা
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              সাইজ অনুযায়ী আজকের প্রতি-পিস দাম পাশাপাশি, আর সাইজ নম্বরের কনফিউশন দূর করার সহজ উপায়।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            চালডালে MamyPoko খুঁজতে গিয়ে পাশে Molfix দেখে অনেকে থমকে যান। একটার প্যাকেটে লেখা "M",
            অন্যটায় লেখা "3"। দুটোই বিদেশি ব্র্যান্ড, দুটোই প্যান্ট টাইপে পাওয়া যায়, কিন্তু দাম আর ফিট
            এক না। নিচে আজকের আসল দাম আর কোনটা কার জন্য মানানসই তা দেওয়া হলো।
          </p>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              <strong>সংক্ষেপে:</strong> বেশিরভাগ সাইজে Molfix প্রতি পিসে সস্তা পড়ে। MamyPoko-র
              ওয়েস্টব্যান্ড টানটান, চটপটে বাচ্চার জন্য ভালো। Molfix-এর কাপড় নরম-ঢিলা, স্থির শুয়ে
              থাকা ছোট বাচ্চায় আরামদায়ক। নিচের টেবিলে আজকের আসল দাম দেখুন।
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাইজ অনুযায়ী আজকের দাম</h2>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="py-2 px-3 border border-slate-200">সাইজ</th>
                  <th className="py-2 px-3 border border-slate-200 text-right">MamyPoko /পিস</th>
                  <th className="py-2 px-3 border border-slate-200 text-right">Molfix /পিস</th>
                  <th className="py-2 px-3 border border-slate-200">কম কোনটা</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const mpPrice = r.mamypoko ? Number(r.mamypoko.price_per_piece) : null;
                  const mfPrice = r.molfix ? Number(r.molfix.price_per_piece) : null;
                  let winner = "—";
                  if (mpPrice !== null && mfPrice !== null) {
                    winner = mpPrice < mfPrice ? "MamyPoko" : mpPrice > mfPrice ? "Molfix" : "সমান";
                  } else if (mpPrice !== null) winner = "শুধু MamyPoko আছে";
                  else if (mfPrice !== null) winner = "শুধু Molfix আছে";
                  return (
                    <tr key={r.slug}>
                      <td className="py-2 px-3 border border-slate-200">
                        <a href={`/size/${r.slug}`} className="text-emerald-700 hover:underline font-medium">{r.labelBn}</a>
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-right font-semibold">
                        {mpPrice !== null ? `৳${mpPrice.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-right font-semibold">
                        {mfPrice !== null ? `৳${mfPrice.toFixed(2)}` : "—"}
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
            <a href="/brand/mamypoko" className="text-emerald-700 hover:underline">MamyPoko</a>{" "}
            আর{" "}
            <a href="/brand/molfix" className="text-emerald-700 hover:underline">Molfix</a>।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাইজ নম্বর বনাম অক্ষর: বিভ্রান্তি এড়ানোর উপায়</h2>
          <p className="mb-4">
            Molfix তুরস্কের নিয়ম মেনে প্যাকেটে নম্বর লেখে, 1 থেকে 5। MamyPoko বাকি সব ব্র্যান্ডের মতো
            অক্ষর ব্যবহার করে, S, M, L, XL। দোকানে দাঁড়িয়ে এই পার্থক্য মনে না থাকলে ভুল সাইজ কিনে
            ফেলা সহজ। সবচেয়ে নিরাপদ উপায়: নম্বর বা অক্ষর না দেখে প্যাকেটের পেছনে ওজনের রেঞ্জ (কেজি) দেখে
            কেনা। দুই ব্র্যান্ডেই এই রেঞ্জ প্রায় কাছাকাছি সাজানো।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কাপড় আর ফিট: আসল পার্থক্য এখানে</h2>
          <p className="mb-4">
            MamyPoko-র ওয়েস্টব্যান্ড তুলনায় সরু আর টানটান বসে। যে বাচ্চা হামাগুড়ি দিচ্ছে বা হাঁটতে
            শিখছে, তার কোমরে এই টানটান ফিট লিক আটকাতে সাহায্য করে। Molfix-এর কাপড় একটু নরম আর ঢিলা
            ধরনের কাটে তৈরি, যা স্থির শুয়ে থাকা ছোট বাচ্চার গায়ে আরামদায়ক কিন্তু চঞ্চল বাচ্চায় একটু
            বেশি নড়াচড়া করে।
          </p>
          <p className="mb-4">
            আমি নিজে এই ডেটা দেখতে গিয়ে খেয়াল করলাম, MamyPoko-র রিভিউতে "টাইট কিন্তু নিরাপদ" শব্দটা
            বারবার আসে, আর Molfix-এর রিভিউতে "নরম কিন্তু মাঝে মাঝে কোমরের কাছে ফাঁক"। মানে দুটো
            আলাদা ট্রেড-অফ, কোনোটাই ভুল না, শুধু বাচ্চার বয়স আর চঞ্চলতার সাথে মেলানোর ব্যাপার।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">দাম ছাড়া আর কী দেখবেন</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li><strong>প্যাকেজ সাইজ:</strong> MamyPoko সাধারণত মাঝারি প্যাকে (৩০-৪৪ পিস) পাওয়া যায়, Molfix বড় ইকোনমি প্যাকেও (৫০+ পিস) আসে।</li>
            <li><strong>বেল্ট বিকল্প:</strong> Molfix-এ বেল্ট (টেপ) লাইন আছে, MamyPoko-তে বাংলাদেশে মূলত প্যান্ট টাইপই স্টকে পাওয়া যায়।</li>
            <li><strong>স্টোর ভেদে দাম:</strong> চালডাল আর দারাজের মধ্যে দুই ব্র্যান্ডেই মাঝে মাঝে ৳৫-১০ ফারাক থাকে, তাই কেনার আগে এই পাতায় ফিরে চেক করাই ভালো।</li>
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
              <a href="/guide/huggies-vs-pampers-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                হাগিস বনাম প্যাম্পারস
              </a>
              <a href="/guide/local-vs-imported-diaper-brands-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                দেশি বনাম বিদেশি ব্র্যান্ড
              </a>
              <a href="/guide/best-diaper-brands-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সেরা ব্র্যান্ড তালিকা
              </a>
              <a href="/guide/diaper-size-by-weight" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সাইজ চার্ট গাইড
              </a>
              <a href="/guide/belt-vs-pant-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                বেল্ট বনাম প্যান্ট গাইড
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
