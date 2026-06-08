import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";

export const revalidate = 3600;

const SIZE_META: Record<string, { label: string; labelBn: string; weight: string; weightBn: string }> = {
  newborn: { label: "Newborn",  labelBn: "নবজাতক", weight: "up to 5 kg",  weightBn: "৫ কেজি পর্যন্ত" },
  s:       { label: "S",        labelBn: "S",       weight: "3-7 kg",      weightBn: "৩-৭ কেজি" },
  m:       { label: "M",        labelBn: "M",       weight: "5-13 kg",     weightBn: "৫-১৩ কেজি" },
  l:       { label: "L",        labelBn: "L",       weight: "10-16 kg",    weightBn: "১০-১৬ কেজি" },
  xl:      { label: "XL",       labelBn: "XL",      weight: "15 kg+",      weightBn: "১৫ কেজি+" },
  xxl:     { label: "XXL",      labelBn: "XXL",     weight: "16 kg+",      weightBn: "১৬ কেজি+" },
};

export async function generateMetadata({ params }: { params: Promise<{ size: string }> }): Promise<Metadata> {
  const { size } = await params;
  const s = SIZE_META[size.toLowerCase()] ?? { label: size.toUpperCase(), labelBn: size.toUpperCase(), weight: "", weightBn: "" };
  return {
    title: `সাইজ ${s.label} ডায়াপার দাম বাংলাদেশ ${s.weightBn} — আজকের সবচেয়ে সস্তা`,
    description: `বাংলাদেশে সাইজ ${s.label} (${s.weightBn}) ডায়াপারের সবচেয়ে কম দাম খুঁজুন। Huggies, MamyPoko, Molfix সহ সব ব্র্যান্ড চালডাল, দারাজ, স্বপ্ন থেকে প্রতি পিস দাম তুলনা।`,
    alternates: { canonical: `https://diaperdam.com/size/${size}` },
  };
}

export default async function SizePage({ params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const s = SIZE_META[size.toLowerCase()] ?? { label: size.toUpperCase(), labelBn: size.toUpperCase(), weight: "", weightBn: "" };
  const products = await getAllProducts({ size_label: s.label, sort: "price_per_piece" }).catch(() => []);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `বাংলাদেশে সবচেয়ে সস্তা সাইজ ${s.label} ডায়াপার`,
    "description": `বাংলাদেশের সব দোকানে সাইজ ${s.label} (${s.weightBn}) ডায়াপারের দাম তুলনা।`,
    "url": `https://diaperdam.com/size/${size}`,
    "numberOfItems": products.length,
    "itemListElement": products.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Product",
        "name": `${p.brand} ${p.line ?? ""} Size ${s.label} ${p.pack_qty}pcs`.trim(),
        "brand": { "@type": "Brand", "name": p.brand },
        "offers": {
          "@type": "Offer",
          "price": Number(p.price_bdt).toFixed(2),
          "priceCurrency": "BDT",
          "availability": "https://schema.org/InStock",
          "url": p.product_url ?? `https://diaperdam.com/size/${size}`,
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
      { "@type": "ListItem", "position": 3, "name": `সাইজ ${s.label}`, "item": `https://diaperdam.com/size/${size}` },
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
      <div>
        <div className="bg-white border-b border-slate-100 py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-sm text-slate-400 mb-1">
              <a href="/diapers" className="hover:text-emerald-600">সব ডায়াপার</a> / সাইজ {s.label}
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              বাংলাদেশে সবচেয়ে সস্তা সাইজ {s.label} ডায়াপার
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {s.weightBn} ওজনের বাচ্চাদের জন্য। সব দোকান থেকে প্রতি পিস দাম অনুযায়ী সাজানো।
            </p>
          </div>
        </div>
        <DiapersClient products={products} />
        {products.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 pb-12">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
              <h2 className="font-bold text-slate-900 mb-2">সাইজ {s.label} ডায়াপার দাম বাংলাদেশ</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                সাইজ {s.label} ডায়াপার {s.weightBn} ওজনের বাচ্চাদের জন্য তৈরি।
                DiaperDam চালডাল, দারাজ, স্বপ্ন ও মীনা বাজারে সাইজ {s.label}-এর দাম তুলনা করে।
                সব দাম প্রতি পিস অনুযায়ী দেখানো হয় যাতে ৪০ পিস আর ৮০ পিস প্যাক ন্যায়ভাবে তুলনা করা যায়।
                এই মুহূর্তে সবচেয়ে সস্তা সাইজ {s.label} হলো{" "}
                <strong>৳{Number(products[0].price_per_piece).toFixed(2)}/পিস</strong> ({products[0].brand}, {products[0].store_name})।
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
