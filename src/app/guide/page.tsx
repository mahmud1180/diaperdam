import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES, GUIDE_GROUPS } from "@/lib/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ডায়াপার গাইড — সাইজ, দাম, ব্র্যান্ড ও যত্নের ২৮টি গাইড",
  description:
    "বাংলাদেশে ডায়াপার কেনার সব গাইড এক জায়গায়। সাইজ চার্ট, মাসিক বাজেট, ব্র্যান্ড তুলনা, র‍্যাশের যত্ন — প্রতিটা গাইডে আজকের লাইভ দাম ধরা আছে।",
  alternates: { canonical: "https://diaperdam.com/guide" },
};

export default function GuideHubPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "হোম", "item": "https://diaperdam.com" },
      { "@type": "ListItem", "position": 2, "name": "ডায়াপার গাইড", "item": "https://diaperdam.com/guide" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div>
        <div className="bg-white border-b border-slate-100 py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-slate-400 mb-1">
              <Link href="/diapers" className="hover:text-emerald-600">সব ডায়াপার</Link>
              {" / "}গাইড
            </p>
            <h1 className="text-2xl font-bold text-slate-900">ডায়াপার গাইড</h1>
            <p className="text-slate-500 text-sm mt-1">
              সাইজ থেকে বাজেট, ব্র্যান্ড তুলনা থেকে র‍্যাশ — {GUIDES.length}টা গাইড, প্রতিটায় আজকের দাম ধরা।
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-8">
            ডায়াপার কেনার সিদ্ধান্তগুলো আলাদা আলাদা নয়। সাইজ ঠিক না হলে রাতে লিক হয়, লিক ঠেকাতে বড় প্যাক
            কিনলে প্রতি-পিস দাম বাড়ে, আর দোকান না বদলালে সেই বাড়তি টাকাটা প্রতি মাসেই যায়। নিচের গাইডগুলো
            সেই শৃঙ্খলটাই ধরে ধরে খোলা।
          </p>

          {GUIDE_GROUPS.map(group => {
            const items = GUIDES.filter(g => g.group === group.key);
            if (items.length === 0) return null;
            return (
              <section key={group.key} className="mb-10">
                <h2 className="text-lg font-bold text-slate-900 mb-1">{group.label}</h2>
                <p className="text-sm text-slate-500 mb-4">{group.intro}</p>
                <ul className="space-y-3">
                  {items.map(g => (
                    <li key={g.slug} className="border border-slate-100 rounded-2xl p-4 hover:border-emerald-200">
                      <Link
                        href={`/guide/${g.slug}`}
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        {g.label}
                      </Link>
                      <p className="text-sm text-slate-500 mt-1">{g.blurb}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-sm">
            <p>
              দাম দেখতে চাইলে সরাসরি{" "}
              <Link href="/diapers" className="text-emerald-700 font-semibold hover:underline">সব ডায়াপারের তালিকা</Link>,{" "}
              <Link href="/deals" className="text-emerald-700 font-semibold hover:underline">আজকের ডিল</Link> আর{" "}
              <Link href="/price-index" className="text-emerald-700 font-semibold hover:underline">মূল্য সূচক</Link>{" "}
              দেখুন। প্রতিটা গাইডের ভেতরেও সেই দিনের দাম বসানো থাকে।
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
