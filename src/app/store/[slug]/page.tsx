import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";
import { SIZE_ORDER, STORE_COLORS } from "@/lib/utils";

export const revalidate = 3600;

const STORE_META: Record<string, { name: string; nameBn: string; color: string; description: string }> = {
  chaldal:    { name: "Chaldal",     nameBn: "চালডাল",    color: "green",  description: "চালডালে ডায়াপারের দাম। Huggies, MamyPoko ও Molfix-এর দাম অন্য দোকানের সাথে তুলনা করুন।" },
  daraz:      { name: "Daraz",       nameBn: "দারাজ",     color: "orange", description: "দারাজে ডায়াপারের দাম। চালডাল ও অন্যান্য দোকানের তুলনায় দারাজে সবচেয়ে সস্তা বেবি ডায়াপার খুঁজুন।" },
  othoba:     { name: "Othoba",      nameBn: "অথবা",      color: "blue",   description: "অথবায় ডায়াপারের দাম। Huggies, MamyPoko ও Molfix অন্যান্য দোকানের সাথে তুলনা করুন।" },
  shwapno:    { name: "Shwapno",     nameBn: "স্বপ্ন",    color: "red",    description: "স্বপ্নে ডায়াপারের দাম। বাংলাদেশের সব বড় গ্রোসারি দোকান থেকে দাম তুলনা।" },
  arogga:     { name: "Arogga",      nameBn: "আরোগ্য",    color: "purple", description: "আরোগ্যতে ডায়াপারের দাম। ফার্মেসি ও গ্রোসারি ডায়াপারের প্রতি পিস দাম তুলনা।" },
  meenabazar: { name: "Meena Bazar", nameBn: "মীনা বাজার", color: "teal",   description: "মীনা বাজারে ডায়াপারের দাম। Huggies ও MamyPoko-র দাম মীনা বাজারে তুলনা করুন।" },
  gobaby:     { name: "GoBaby",      nameBn: "GoBaby",    color: "sky",    description: "GoBaby-তে ডায়াপারের দাম। বেবি প্রোডাক্ট স্পেশালিস্ট দোকানে সব ব্র্যান্ডের দাম দেখুন।" },
  unimart:    { name: "Unimart",     nameBn: "ইউনিমার্ট", color: "indigo", description: "ইউনিমার্টে ডায়াপারের দাম। অন্যান্য দোকানের তুলনায় ইউনিমার্টে সস্তা ডায়াপার খুঁজুন।" },
};

const KNOWN_BRANDS = [
  { slug: "huggies",     name: "Huggies" },
  { slug: "mamypoko",    name: "MamyPoko" },
  { slug: "molfix",      name: "Molfix" },
  { slug: "pampers",     name: "Pampers" },
  { slug: "neocare",     name: "Neocare" },
  { slug: "bashundhara", name: "Bashundhara" },
  { slug: "avonee",      name: "Avonee" },
  { slug: "supermom",    name: "Supermom" },
];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = STORE_META[slug] ?? { name: slug, nameBn: slug, description: `${slug}-এ ডায়াপারের দাম বাংলাদেশ` };
  return {
    title: `${meta.name} ডায়াপার দাম — সব ব্র্যান্ড তুলনা | DiaperDam`,
    description: meta.description,
    alternates: { canonical: `https://diaperdam.com/store/${slug}` },
  };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = await getAllProducts({ store_slug: slug }).catch(() => []);
  const meta = STORE_META[slug] ?? {
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    nameBn: slug,
    color: "slate",
    description: `${slug}-এ ডায়াপারের দাম।`,
  };

  // Brands available in this store
  const brandsInStore = Array.from(new Set(products.map(p => p.brand_slug)));
  const brandTabs = KNOWN_BRANDS.filter(b => brandsInStore.includes(b.slug));

  // Size summary
  const sizeSummary = SIZE_ORDER
    .map(size => {
      const prods = products.filter(p => p.size_label === size);
      if (!prods.length) return null;
      const cheapest = prods.reduce((a, b) => Number(a.price_per_piece) < Number(b.price_per_piece) ? a : b);
      return { size, cheapest };
    })
    .filter(Boolean) as { size: string; cheapest: (typeof products)[0] }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${meta.name} ডায়াপার দাম — সব ব্র্যান্ড তুলনা`,
    "description": meta.description,
    "url": `https://diaperdam.com/store/${slug}`,
    "numberOfItems": products.length,
    "itemListElement": products.slice(0, 50).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Product",
        "name": [p.brand, p.line, p.size_label, `${p.pack_qty}pcs`].filter(Boolean).join(" "),
        "brand": { "@type": "Brand", "name": p.brand },
        "offers": {
          "@type": "Offer",
          "price": Number(p.price_bdt).toFixed(2),
          "priceCurrency": "BDT",
          "availability": "https://schema.org/InStock",
          "seller": { "@type": "Organization", "name": meta.name },
          ...(p.product_url ? { "url": p.product_url } : {}),
        },
      },
    })),
  };

  const storeColors = STORE_COLORS[slug] ?? { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-white border-b border-slate-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-slate-400 mb-1">
            <a href="/" className="hover:text-emerald-600">হোম</a>
            {" / "}
            <span className="text-slate-600">{meta.nameBn}</span>
          </p>

          <h1 className="text-2xl font-bold text-slate-900">
            {meta.nameBn}-তে ডায়াপার দাম — সব ব্র্যান্ড তুলনা
          </h1>
          <p className="text-slate-500 text-sm mt-1">{meta.description}</p>

          {/* Size quick-nav */}
          {sizeSummary.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {sizeSummary.map(({ size, cheapest }) => (
                <div
                  key={size}
                  className={`${storeColors.bg} ${storeColors.border} border rounded-xl px-3 py-2 text-xs`}
                >
                  <span className="font-bold text-slate-700">{size}</span>
                  <span className={`${storeColors.text} font-semibold ml-2`}>
                    ৳{Number(cheapest.price_per_piece).toFixed(2)}/পিস
                  </span>
                  <span className="text-slate-400 ml-1">{cheapest.brand}</span>
                </div>
              ))}
            </div>
          )}

          {/* Brand filter tabs */}
          {brandTabs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-xs text-slate-400 self-center mr-1">ব্র্যান্ড ফিল্টার:</span>
              {brandTabs.map(b => (
                <a
                  key={b.slug}
                  href={`/store/${slug}?brand=${b.slug}`}
                  className="text-xs bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-700 text-slate-600 rounded-lg px-3 py-1.5 transition-colors"
                >
                  {b.name}
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
          <p>{meta.nameBn}-তে এখনও পণ্য পাওয়া যায়নি। পরবর্তী ডেটা আপডেটের পর দেখুন।</p>
        </div>
      )}

      {/* SEO content block */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
          <h2 className="font-bold text-slate-900 mb-2">
            DiaperDam-এ কেন ডায়াপার দাম তুলনা করবেন?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {meta.nameBn}-তে Huggies, MamyPoko, Molfix সহ একাধিক ব্র্যান্ডের ডায়াপার বিভিন্ন সাইজ ও প্যাকে পাওয়া যায়।
            বড় প্যাকে প্রতি পিস দাম সাধারণত কম হয়, কিন্তু হাতে হাতে তুলনা করা কষ্টকর।
          </p>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            DiaperDam প্রতিটা লিস্টিংকে প্রতি পিস দামে রূপান্তর করে যাতে ন্যায়ভাবে তুলনা করতে পারেন।
            আমরা প্রতিদিন {meta.nameBn} সহ চালডাল, দারাজ, স্বপ্ন ও মীনা বাজারের দাম ট্র্যাক করি,
            তাই আপনি সবসময় জানবেন {meta.nameBn}-তে সেরা দাম আছে কিনা, নাকি অন্য দোকানে সস্তা।
          </p>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            প্রতি স্ক্র্যাপের পর দাম আপডেট হয়। প্রতি পিস দাম দিয়ে সর্ট করুন, ব্র্যান্ড বা সাইজ দিয়ে ফিল্টার করুন,
            আর যেকোনো রো-তে ক্লিক করে সরাসরি {meta.nameBn}-র পণ্য পেজে যান।
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {KNOWN_BRANDS.map(b => (
              <a
                key={b.slug}
                href={`/brand/${b.slug}`}
                className="text-xs text-emerald-700 hover:underline"
              >
                {b.name} দাম →
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
