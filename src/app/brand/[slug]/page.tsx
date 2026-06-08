import type { Metadata } from "next";
import { getBrandProducts } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";
import { SIZE_ORDER } from "@/lib/utils";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

const BRAND_META: Record<string, { name: string; nameBn: string; description: string }> = {
  huggies:     { name: "Huggies",     nameBn: "হাগিস",      description: "বাংলাদেশে Huggies ডায়াপারের দাম — Dry, Ultra Soft ও Wonder Pants চালডাল, দারাজ ও অন্যান্য দোকান থেকে তুলনা করুন। সবচেয়ে কম প্রতি পিস দাম দেখুন।" },
  mamypoko:    { name: "MamyPoko",    nameBn: "ম্যামিপোকো", description: "বাংলাদেশে MamyPoko Pants Extra Absorb দাম। S থেকে XL সাইজ সব দোকান থেকে তুলনা। আজকের সবচেয়ে সস্তা MamyPoko প্রতি পিস।" },
  molfix:      { name: "Molfix",      nameBn: "মলফিক্স",    description: "বাংলাদেশে Molfix বেবি ডায়াপারের দাম। তুর্কি-তৈরি Molfix Pants ও Belt চালডাল ও দারাজে তুলনা করুন।" },
  pampers:     { name: "Pampers",     nameBn: "প্যাম্পারস", description: "বাংলাদেশে Pampers Baby Dry ও Premium Care দাম। আজ সবচেয়ে কম দামে Pampers ডায়াপার প্রতি পিস খুঁজুন।" },
  neocare:     { name: "Neocare",     nameBn: "নিওকেয়ার",   description: "বাংলাদেশে Neocare প্রিমিয়াম বেবি ডায়াপারের দাম। দেশি ব্র্যান্ড, বাজেট-ফ্রেন্ডলি। সব দোকানে তুলনা করুন।" },
  bashundhara: { name: "Bashundhara", nameBn: "বসুন্ধরা",   description: "বাংলাদেশে Bashundhara Diapant দাম। সাশ্রয়ী দেশি ব্র্যান্ড চালডাল ও অন্যান্য দোকানে তুলনা।" },
  avonee:      { name: "Avonee",      nameBn: "অ্যাভোনি",   description: "বাংলাদেশে Avonee ডায়াপারের দাম। বাজেট বেল্ট ও প্যান্ট ডায়াপার সব দোকানে তুলনা করুন।" },
  supermom:    { name: "Supermom",    nameBn: "সুপারমম",    description: "বাংলাদেশে Supermom বেবি ডায়াপারের দাম (Square Toiletries)। চালডাল ও দারাজে তুলনা করুন।" },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = BRAND_META[slug] ?? { name: slug, nameBn: slug, description: `বাংলাদেশে ${slug} ডায়াপারের দাম` };
  return {
    title: `${meta.name} ডায়াপার দাম বাংলাদেশ — প্রতি পিস সবচেয়ে সস্তা`,
    description: meta.description,
    alternates: { canonical: `https://diaperdam.com/brand/${slug}` },
  };
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = await getBrandProducts(slug).catch(() => [] as DiaperProduct[]);
  const meta = BRAND_META[slug] ?? { name: slug.charAt(0).toUpperCase() + slug.slice(1), nameBn: slug, description: "" };

  // Size summary: cheapest per-piece per size
  const sizeSummary = SIZE_ORDER
    .map(size => {
      const prods = products.filter(p => p.size_label === size);
      if (!prods.length) return null;
      const cheapest = prods.reduce((a, b) => Number(a.price_per_piece) < Number(b.price_per_piece) ? a : b);
      return { size, cheapest };
    })
    .filter(Boolean) as { size: string; cheapest: DiaperProduct }[];

  // JSON-LD structured data
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${meta.name} ডায়াপার দাম বাংলাদেশ`,
    "description": meta.description,
    "numberOfItems": products.length,
    "itemListElement": products.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Product",
        "name": `${p.brand} ${p.line ?? ""} ${p.size_label ?? ""} ${p.pack_qty}pcs`.trim(),
        "brand": { "@type": "Brand", "name": p.brand },
        "offers": {
          "@type": "Offer",
          "price": Number(p.price_bdt).toFixed(2),
          "priceCurrency": "BDT",
          "availability": "https://schema.org/InStock",
          "url": p.product_url ?? `https://diaperdam.com/brand/${slug}`,
          "seller": { "@type": "Organization", "name": p.store_name },
        },
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "হোম", "item": "https://diaperdam.com" },
      { "@type": "ListItem", "position": 2, "name": "ডায়াপার", "item": "https://diaperdam.com/diapers" },
      { "@type": "ListItem", "position": 3, "name": meta.name, "item": `https://diaperdam.com/brand/${slug}` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `বাংলাদেশে সবচেয়ে সস্তা ${meta.name} ডায়াপার কোনটা?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": products.length > 0
            ? `এই মুহূর্তে সবচেয়ে সস্তা ${meta.name} ডায়াপার প্রতি পিস ৳${Number(products[0].price_per_piece).toFixed(2)} (${products[0].size_label ?? ""} ${products[0].pack_qty} পিস) ${products[0].store_name}-এ।`
            : `${meta.name}-এর সর্বশেষ দাম জানতে প্রতিদিন DiaperDam দেখুন।`,
        },
      },
      {
        "@type": "Question",
        "name": `বাংলাদেশে ${meta.name} ডায়াপার সবচেয়ে সস্তায় কোথায় কিনবেন?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `DiaperDam চালডাল, দারাজ, স্বপ্ন, মীনা বাজার সহ সব দোকান থেকে ${meta.name}-এর দাম তুলনা করে। সবচেয়ে সস্তা দোকান প্রতিদিন বদলায় — মূল্য সূচকে লাইভ তুলনা দেখুন।`,
        },
      },
      {
        "@type": "Question",
        "name": `বাংলাদেশে ${meta.name} ডায়াপার প্রতি পিস কত টাকা?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": sizeSummary.length > 0
            ? `${meta.name} ডায়াপারের প্রতি পিস দাম সাইজ অনুযায়ী: ${sizeSummary.map(s => `${s.size} ৳${Number(s.cheapest.price_per_piece).toFixed(2)} থেকে`).join(", ")}।`
            : `${meta.name} ডায়াপারের সব দাম DiaperDam-এ প্রতি পিস অনুযায়ী দেখানো হয়।`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    <div>
      <div className="bg-white border-b border-slate-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-slate-400 mb-1">
            <a href="/diapers" className="hover:text-emerald-600">সব ডায়াপার</a> / {meta.name}
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            {meta.name} ডায়াপার দাম বাংলাদেশ
          </h1>
          <p className="text-slate-500 text-sm mt-1">{meta.description}</p>

          {/* Size quick-nav */}
          {sizeSummary.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {sizeSummary.map(({ size, cheapest }) => (
                <div key={size} className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs">
                  <span className="font-bold text-slate-700">{size}</span>
                  <span className="text-emerald-700 font-semibold ml-2">৳{Number(cheapest.price_per_piece).toFixed(2)}/পিস</span>
                  <span className="text-slate-400 ml-1">{cheapest.store_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {products.length > 0 ? (
        <DiapersClient products={products} />
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>এখনও {meta.name} পণ্য পাওয়া যায়নি। পরবর্তী ডেটা আপডেটের পর দেখুন।</p>
        </div>
      )}

      {/* SEO content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
          <h2 className="font-bold text-slate-900 mb-2">{meta.name} ডায়াপার দাম বাংলাদেশ (২০২৬)</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{meta.description}</p>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            DiaperDam প্রতিদিন চালডাল, দারাজ, স্বপ্ন, মীনা বাজার সহ সব দোকান থেকে {meta.name}-এর দাম তুলনা করে।
            দাম প্রতি পিস অনুযায়ী দেখানো হয় যাতে বিভিন্ন প্যাক সাইজ ন্যায়ভাবে তুলনা করতে পারেন।
            বড় প্যাকে সাধারণত প্রতি পিস দাম কম হয় - সর্ট ব্যবহার করে সেরা দাম খুঁজুন।
          </p>
        </div>

        {/* FAQ section */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
          <h2 className="font-bold text-slate-900 mb-4">{meta.name} ডায়াপার বাংলাদেশ — প্রশ্নোত্তর</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-800">
                বাংলাদেশে সবচেয়ে সস্তা {meta.name} ডায়াপার কোনটা?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {products.length > 0
                  ? `এই মুহূর্তে সবচেয়ে সস্তা ${meta.name} প্রতি পিস ৳${Number(products[0].price_per_piece).toFixed(2)} (${products[0].size_label ?? ""} ${products[0].pack_qty} পিস, ${products[0].store_name})।`
                  : `DiaperDam প্রতিদিন ${meta.name}-এর দাম ট্র্যাক করে। পরবর্তী ডেটা রিফ্রেশের পর দেখুন।`}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">
                বাংলাদেশে {meta.name} ডায়াপার সবচেয়ে সস্তায় কোথায় কিনবেন?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                DiaperDam চালডাল, দারাজ, স্বপ্ন ও মীনা বাজারে {meta.name}-এর দাম তুলনা করে।{" "}
                <a href="/price-index" className="text-emerald-600 hover:underline">মূল্য সূচক</a> দেখলে দোকান-ভিত্তিক তুলনা পাবেন।
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">
                বাংলাদেশে {meta.name} প্রতি পিস কত টাকা?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {sizeSummary.length > 0
                  ? `${meta.name} প্রতি পিস দাম সাইজ অনুযায়ী: ${sizeSummary.map(s => `${s.size}: ৳${Number(s.cheapest.price_per_piece).toFixed(2)}`).join(" · ")}।`
                  : `${meta.name}-এর সব দাম এই পেজে প্রতি পিস অনুযায়ী দেখানো হয়।`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
