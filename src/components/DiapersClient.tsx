"use client";
import { useState, useMemo } from "react";
import type { DiaperProduct } from "@/lib/db";
import { STORE_COLORS, SIZE_ORDER } from "@/lib/utils";

type Props = {
  products: DiaperProduct[];
  showHeroFilters?: boolean;
  title?: string;
};

const SORT_OPTIONS = [
  { value: "price_per_piece" as const, label: "প্রতি পিস সস্তা" },
  { value: "price_bdt" as const,       label: "প্যাক দাম কম" },
  { value: "discount_pct" as const,    label: "বেশি ছাড়" },
];

const PAGE_SIZE = 50;

export default function DiapersClient({ products, showHeroFilters, title }: Props) {
  const [typeFilter,  setTypeFilter]  = useState<string | null>(null);
  const [sort, setSort] = useState<"price_per_piece" | "price_bdt" | "discount_pct">("price_per_piece");
  const [page, setPage] = useState(1);

  // Client-side filters for type and sort only — brand/size dropdowns navigate to dedicated pages
  const filtered = useMemo(() => {
    let list = products;
    if (typeFilter) list = list.filter(p => p.type === typeFilter);

    return [...list].sort((a, b) => {
      if (sort === "discount_pct") return (Number(b.discount_pct) || 0) - (Number(a.discount_pct) || 0);
      if (sort === "price_bdt")    return Number(a.price_bdt) - Number(b.price_bdt);
      return Number(a.price_per_piece) - Number(b.price_per_piece);
    });
  }, [products, typeFilter, sort]);

  // Reset page when filters change
  useMemo(() => setPage(1), [typeFilter, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Collect available brands/sizes from data for hero navigation dropdowns
  const brandMap = new Map<string, string>();
  products.forEach(p => { if (p.brand_slug) brandMap.set(p.brand_slug, p.brand); });
  const availBrands = [...brandMap.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const availSizes = SIZE_ORDER.filter(s => products.some(p => p.size_label === s));
  const storeCount = new Set(products.map(p => p.store_slug)).size;

  // Navigate to brand/size pages on dropdown change
  function handleNav(url: string) {
    if (url && url !== "#") window.location.href = url;
  }

  return (
    <div>
      {/* Hero with navigation dropdowns */}
      {showHeroFilters && (
        <div className="bg-gradient-to-br from-teal-600 via-emerald-600 to-emerald-700 text-white py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              {title || "এখনকার সব ডায়াপার অফার"}
            </h1>
            <p className="text-emerald-100 text-lg mb-8">
              আজ <strong className="text-white">{products.length}</strong> টি পণ্য <strong className="text-white">{storeCount}</strong> টি দোকানে
            </p>

            {/* Hero dropdowns navigate to dedicated pages */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
              <select
                defaultValue="#"
                onChange={e => handleNav(e.target.value)}
                className="text-base border-0 rounded-xl px-5 py-3 bg-white text-slate-700 cursor-pointer shadow-lg focus:ring-2 focus:ring-white outline-none w-full sm:w-auto"
              >
                <option value="#">ব্র্যান্ড বাছুন...</option>
                {availBrands.map(([slug, name]) => (
                  <option key={slug} value={`/brand/${slug}`}>{name}</option>
                ))}
              </select>

              <select
                defaultValue="#"
                onChange={e => handleNav(e.target.value)}
                className="text-base border-0 rounded-xl px-5 py-3 bg-white text-slate-700 cursor-pointer shadow-lg focus:ring-2 focus:ring-white outline-none w-full sm:w-auto"
              >
                <option value="#">সাইজ বাছুন...</option>
                {availSizes.map(s => (
                  <option key={s} value={`/size/${s.toLowerCase()}`}>
                    {s === "Newborn" ? "নবজাতক (০-৫ কেজি)" : `সাইজ ${s}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Description text */}
      <div className="bg-slate-50 border-b border-slate-200 py-4 px-4">
        <div className="max-w-6xl mx-auto text-sm text-slate-600">
          বাংলাদেশের সব বড় অনলাইন দোকান থেকে বেবি ডায়াপারের দাম তুলনা করুন। ছাড় ৩০% পর্যন্ত হতে পারে! কোথায় সবচেয়ে সস্তা সেটা সরাসরি দেখুন, কারণ আমরা প্রতি পিস দাম অনুযায়ী সাজাই। উপরের ফিল্টার থেকে ব্র্যান্ড বা সাইজ বাছুন।
        </div>
      </div>

      {/* Type tabs + sort */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-40">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between py-2">
          <div className="flex">
            {[
              { value: null, label: "সব ডায়াপার" },
              { value: "belt", label: "বেল্ট / টেপ" },
              { value: "pants", label: "প্যান্ট" },
            ].map(tab => (
              <button
                key={tab.label}
                onClick={() => setTypeFilter(tab.value)}
                className={`text-sm font-medium px-4 py-2 border-b-2 transition-colors cursor-pointer ${
                  typeFilter === tab.value
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={e => setSort(e.target.value as typeof sort)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 cursor-pointer outline-none"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>এই ফিল্টারে কোনো ডায়াপার পাওয়া যায়নি।</p>
            <button
              onClick={() => setTypeFilter(null)}
              className="mt-3 text-emerald-600 underline text-sm cursor-pointer"
            >
              সব ডায়াপার দেখুন
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-200">
                    <th className="pb-3 pl-2" colSpan={2}>পণ্য</th>
                    <th className="pb-3 text-center">ছাড়</th>
                    <th className="pb-3 text-right">প্যাক দাম</th>
                    <th className="pb-3 text-center">দোকান</th>
                    <th className="pb-3 text-right pr-2">প্রতি পিস</th>
                    <th className="pb-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p) => (
                    <TableRow key={p.id} p={p} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden space-y-0">
              {paged.map((p) => (
                <MobileRow key={p.id} p={p} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 mb-4">
                {page > 1 && (
                  <button
                    onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="text-sm font-medium text-emerald-700 hover:underline cursor-pointer"
                  >
                    &lsaquo; আগের পাতা
                  </button>
                )}
                <span className="text-sm text-slate-600">
                  পাতা <strong>{page}</strong>
                </span>
                {page < totalPages && (
                  <button
                    onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="text-sm font-medium text-emerald-700 hover:underline cursor-pointer"
                  >
                    পরের পাতা &rsaquo;
                  </button>
                )}
              </div>
            )}

            {/* Bottom size cross-links */}
            <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
              <p className="mb-2">আপনি সব ডায়াপার দেখছেন। এই সাইজগুলোতেও দেখতে পারেন:</p>
              <div className="flex flex-wrap gap-2">
                {SIZE_ORDER.map(s => (
                  <a
                    key={s}
                    href={`/size/${s.toLowerCase()}`}
                    className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {s === "Newborn" ? "নবজাতক" : `সাইজ ${s}`}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Desktop table row ─── */
function TableRow({ p }: { p: DiaperProduct }) {
  const sc = STORE_COLORS[p.store_slug] ?? { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
  const hasDiscount = p.discount_pct && Number(p.discount_pct) >= 5;

  const fullName = [p.brand, p.line, p.size_label ? `সাইজ ${p.size_label}` : null, `${p.pack_qty} পিস`]
    .filter(Boolean).join(" | ");

  const discountDisplay = p.promotion_label
    ? p.promotion_label
    : hasDiscount
      ? `-${Math.round(Number(p.discount_pct))}%`
      : null;

  return (
    <tr className="border-b border-slate-100 hover:bg-emerald-50/40 transition-colors">
      {/* Image */}
      <td className="py-3 pl-2 w-14">
        {p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image_url} alt={fullName} className="w-12 h-12 object-contain rounded-lg bg-slate-50" />
        ) : (
          <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-lg">🍼</div>
        )}
      </td>

      {/* Product info */}
      <td className="py-3 pr-4">
        <h3 className="font-semibold text-slate-900 text-sm leading-tight">{fullName}</h3>
        <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2">
          {p.size_label && p.weight_min_kg && p.weight_max_kg && (
            <span>{p.size_label} ({p.weight_min_kg}-{p.weight_max_kg} কেজি)</span>
          )}
          {p.type && <span className="capitalize">{p.type === "belt" ? "বেল্ট" : p.type === "pants" ? "প্যান্ট" : p.type}</span>}
        </div>
      </td>

      {/* Discount */}
      <td className="py-3 text-center max-w-[140px]">
        {discountDisplay ? (
          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
            p.promotion_label ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"
          }`}>
            {discountDisplay}
          </span>
        ) : (
          <span className="text-slate-200">&mdash;</span>
        )}
      </td>

      {/* Pack price */}
      <td className="py-3 text-right whitespace-nowrap">
        <span className="text-slate-700 font-medium">৳{Number(p.price_bdt).toLocaleString()}</span>
        {p.original_price_bdt && Number(p.original_price_bdt) > Number(p.price_bdt) && (
          <>
            <br />
            <span className="text-xs text-slate-400 line-through">৳{Number(p.original_price_bdt).toLocaleString()}</span>
          </>
        )}
      </td>

      {/* Store badge */}
      <td className="py-3 text-center">
        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1.5 rounded-lg border ${sc.bg} ${sc.text} ${sc.border}`}>
          {p.store_name}
        </span>
      </td>

      {/* Per piece */}
      <td className="py-3 text-right pr-2">
        <span className="text-lg font-bold text-emerald-700">
          ৳{Number(p.price_per_piece).toFixed(2)}
        </span>
      </td>

      {/* CTA */}
      <td className="py-3 text-center">
        {p.product_url ? (
          <a
            href={p.product_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-5 py-2 rounded-lg transition-colors shadow-sm"
          >
            দেখুন
          </a>
        ) : (
          <span className="text-slate-200 text-xs">&mdash;</span>
        )}
      </td>
    </tr>
  );
}

/* ─── Mobile row ─── */
function MobileRow({ p }: { p: DiaperProduct }) {
  const sc = STORE_COLORS[p.store_slug] ?? { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
  const hasDiscount = p.discount_pct && Number(p.discount_pct) >= 5;
  const discountText = p.promotion_label || (hasDiscount ? `-${Math.round(Number(p.discount_pct))}%` : null);

  return (
    <a
      href={p.product_url ?? "#"}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="flex items-center gap-3 bg-white border-b border-slate-100 py-3 px-1 hover:bg-emerald-50/40 transition-colors"
    >
      {p.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image_url} alt={p.brand} className="w-11 h-11 object-contain rounded-lg bg-slate-50 shrink-0" />
      ) : (
        <div className="w-11 h-11 bg-slate-50 rounded-lg flex items-center justify-center text-lg shrink-0">🍼</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-900 text-sm truncate">
          {p.brand} {p.line && `${p.line} `}{p.size_label && `| ${p.size_label} `}| {p.pack_qty} পিস
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${sc.bg} ${sc.text}`}>
            {p.store_name}
          </span>
          {discountText && (
            <span className="text-[10px] font-bold text-red-600">{discountText}</span>
          )}
          <span className="text-[10px] text-slate-400">৳{Number(p.price_bdt).toLocaleString()}</span>
          {p.original_price_bdt && Number(p.original_price_bdt) > Number(p.price_bdt) && (
            <span className="text-[10px] text-slate-300 line-through">৳{Number(p.original_price_bdt).toLocaleString()}</span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 pr-1">
        <div className="text-lg font-bold text-emerald-700">৳{Number(p.price_per_piece).toFixed(2)}</div>
        <div className="text-[10px] text-slate-400">প্রতি পিস</div>
      </div>
    </a>
  );
}
