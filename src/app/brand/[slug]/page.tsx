import type { Metadata } from "next";
import { getBrandProducts } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";
import { SIZE_ORDER } from "@/lib/utils";
import type { DiaperProduct } from "@/lib/db";
import { BRAND_SLUGS } from "@/lib/catalog";
import { brandInfo, brandLabel } from "@/lib/brands";

export const revalidate = 3600;

// Prerender all known brands at build time so the route is ISR
// (without this, dynamic-param pages degrade to per-request rendering
// and serve Cache-Control: private, no-store).
export function generateStaticParams() {
  return BRAND_SLUGS.map(slug => ({ slug }));
}

const BN_MONTHS = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = brandInfo(slug);
  const month = BN_MONTHS[new Date().getMonth()];
  const products = await getBrandProducts(slug).catch(() => [] as DiaperProduct[]);
  const maxDiscount = Math.max(...products.map(p => Number(p.discount_pct) || 0), 0);
  return {
    // Lead with the Bengali name (matches হাগিস ডায়াপার দাম queries) and keep
    // the Latin form via brandLabel's "(Huggies)" for transliterated searchers.
    title: `${brandLabel(slug)} ডায়াপার দাম বাংলাদেশ — ${month} ২০২৬`,
    description: `${month} ২০২৬: ${meta.nameBn} ডায়াপার ${products.length} টি পণ্য। ${maxDiscount > 0 ? `ছাড় ${Math.round(maxDiscount)}% পর্যন্ত!` : ""} ${meta.description}`,
    alternates: { canonical: `https://diaperdam.com/brand/${slug}` },
  };
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = await getBrandProducts(slug).catch(() => [] as DiaperProduct[]);
  const meta = brandInfo(slug);
  const label = brandLabel(slug);

  // Size summary: cheapest per-piece per size
  const sizeSummary = SIZE_ORDER
    .map(size => {
      const prods = products.filter(p => p.size_label === size);
      if (!prods.length) return null;
      const cheapest = prods.reduce((a, b) => Number(a.price_per_piece) < Number(b.price_per_piece) ? a : b);
      return { size, cheapest };
    })
    .filter(Boolean) as { size: string; cheapest: DiaperProduct }[];

  // Offers without an expiry get flagged by Google + ignored by AI shopping
  // surfaces; prices refresh daily so a 48h validity window is honest.
  const priceValidUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // JSON-LD structured data
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${meta.nameBn} ডায়াপার দাম বাংলাদেশ`,
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
          "priceValidUntil": priceValidUntil,
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
      { "@type": "ListItem", "position": 3, "name": meta.nameBn, "item": `https://diaperdam.com/brand/${slug}` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `বাংলাদেশে সবচেয়ে সস্তা ${meta.nameBn} ডায়াপার কোনটা?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": products.length > 0
            ? `এই মুহূর্তে সবচেয়ে সস্তা ${meta.nameBn} ডায়াপার প্রতি পিস ৳${Number(products[0].price_per_piece).toFixed(2)} (${products[0].size_label ?? ""} ${products[0].pack_qty} পিস) ${products[0].store_name}-এ।`
            : `${meta.nameBn}-এর সর্বশেষ দাম জানতে প্রতিদিন DiaperDam দেখুন।`,
        },
      },
      {
        "@type": "Question",
        "name": `বাংলাদেশে ${meta.nameBn} ডায়াপার সবচেয়ে সস্তায় কোথায় কিনবেন?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `DiaperDam চালডাল, দারাজ, স্বপ্ন, মীনা বাজার সহ সব দোকান থেকে ${meta.nameBn}-এর দাম তুলনা করে। সবচেয়ে সস্তা দোকান প্রতিদিন বদলায় — মূল্য সূচকে লাইভ তুলনা দেখুন।`,
        },
      },
      {
        "@type": "Question",
        "name": `বাংলাদেশে ${meta.nameBn} ডায়াপার প্রতি পিস কত টাকা?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": sizeSummary.length > 0
            ? `${meta.nameBn} ডায়াপারের প্রতি পিস দাম সাইজ অনুযায়ী: ${sizeSummary.map(s => `${s.size} ৳${Number(s.cheapest.price_per_piece).toFixed(2)} থেকে`).join(", ")}।`
            : `${meta.nameBn} ডায়াপারের সব দাম DiaperDam-এ প্রতি পিস অনুযায়ী দেখানো হয়।`,
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
            <a href="/diapers" className="hover:text-emerald-600">সব ডায়াপার</a> / {meta.nameBn}
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            {label} ডায়াপার দাম বাংলাদেশ
          </h1>
          <p className="text-slate-500 text-sm mt-1">{meta.description}</p>

          {/* Size quick-nav — links to brand+size pages */}
          {sizeSummary.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {sizeSummary.map(({ size, cheapest }) => (
                <a key={size} href={`/brand/${slug}/size/${size.toLowerCase()}`} className="bg-emerald-50 border border-emerald-200 hover:border-emerald-400 rounded-xl px-3 py-2 text-xs transition-colors">
                  <span className="font-bold text-slate-700">{size}</span>
                  <span className="text-emerald-700 font-semibold ml-2">৳{Number(cheapest.price_per_piece).toFixed(2)}/পিস</span>
                  <span className="text-slate-400 ml-1">{cheapest.store_name}</span>
                </a>
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
          <p>এখনও {meta.nameBn} পণ্য পাওয়া যায়নি। পরবর্তী ডেটা আপডেটের পর দেখুন।</p>
        </div>
      )}

      {/* SEO content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
          <h2 className="font-bold text-slate-900 mb-2">{label} ডায়াপার দাম বাংলাদেশ (২০২৬)</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{meta.description}</p>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            DiaperDam প্রতিদিন চালডাল, দারাজ, স্বপ্ন, মীনা বাজার সহ সব দোকান থেকে {meta.nameBn}-এর দাম তুলনা করে।
            দাম প্রতি পিস অনুযায়ী দেখানো হয় যাতে বিভিন্ন প্যাক সাইজ ন্যায়ভাবে তুলনা করতে পারেন।
            বড় প্যাকে সাধারণত প্রতি পিস দাম কম হয় - সর্ট ব্যবহার করে সেরা দাম খুঁজুন।
          </p>
        </div>

        {/* FAQ section */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
          <h2 className="font-bold text-slate-900 mb-4">{meta.nameBn} ডায়াপার বাংলাদেশ — প্রশ্নোত্তর</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-800">
                বাংলাদেশে সবচেয়ে সস্তা {meta.nameBn} ডায়াপার কোনটা?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {products.length > 0
                  ? `এই মুহূর্তে সবচেয়ে সস্তা ${meta.nameBn} প্রতি পিস ৳${Number(products[0].price_per_piece).toFixed(2)} (${products[0].size_label ?? ""} ${products[0].pack_qty} পিস, ${products[0].store_name})।`
                  : `DiaperDam প্রতিদিন ${meta.nameBn}-এর দাম ট্র্যাক করে। পরবর্তী ডেটা রিফ্রেশের পর দেখুন।`}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">
                বাংলাদেশে {meta.nameBn} ডায়াপার সবচেয়ে সস্তায় কোথায় কিনবেন?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                DiaperDam চালডাল, দারাজ, স্বপ্ন ও মীনা বাজারে {meta.nameBn}-এর দাম তুলনা করে।{" "}
                <a href="/price-index" className="text-emerald-600 hover:underline">মূল্য সূচক</a> দেখলে দোকান-ভিত্তিক তুলনা পাবেন।
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">
                বাংলাদেশে {meta.nameBn} প্রতি পিস কত টাকা?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {sizeSummary.length > 0
                  ? `${meta.nameBn} প্রতি পিস দাম সাইজ অনুযায়ী: ${sizeSummary.map(s => `${s.size}: ৳${Number(s.cheapest.price_per_piece).toFixed(2)}`).join(" · ")}।`
                  : `${meta.nameBn}-এর সব দাম এই পেজে প্রতি পিস অনুযায়ী দেখানো হয়।`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
