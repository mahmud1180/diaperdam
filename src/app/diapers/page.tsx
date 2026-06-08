import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "বাংলাদেশে সব ডায়াপারের দাম তুলনা — ব্র্যান্ড ও দোকান অনুযায়ী",
  description:
    "চালডাল, দারাজ, স্বপ্ন ও মীনা বাজার থেকে সব ডায়াপারের দাম তুলনা করুন। ব্র্যান্ড, সাইজ ও টাইপ অনুযায়ী ফিল্টার করুন। প্রতি পিস দাম অনুযায়ী সাজানো।",
  alternates: { canonical: "https://diaperdam.com/diapers" },
};

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
