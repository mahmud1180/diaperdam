import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BN_MONTHS = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

export async function generateMetadata(): Promise<Metadata> {
  const products = await getAllProducts({ sort: "price_per_piece" }).catch(() => []);
  const month = BN_MONTHS[new Date().getMonth()];
  const brandCount = new Set(products.map(p => p.brand_slug)).size;
  const storeCount = new Set(products.map(p => p.store_slug)).size;
  const maxDiscount = Math.max(...products.map(p => Number(p.discount_pct) || 0), 0);

  return {
    title: `বাংলাদেশে সব ডায়াপারের দাম তুলনা — ${month} ২০২৬ | ${products.length}+ পণ্য`,
    description: `${month} ২০২৬: ${storeCount} টি দোকানে ${products.length} টি ডায়াপারের দাম তুলনা করুন। ${brandCount}+ ব্র্যান্ড, ছাড় ${maxDiscount > 0 ? Math.round(maxDiscount) : 30}% পর্যন্ত! প্রতি পিস দাম অনুযায়ী সাজানো।`,
    alternates: { canonical: "https://diaperdam.com/diapers" },
  };
}

export default async function DiapersPage() {
  const products = await getAllProducts({ sort: "price_per_piece" }).catch(() => []);

  return (
    <DiapersClient
      products={products}
      showHeroFilters
      title="এখনকার সব ডায়াপার অফার"
    />
  );
}
