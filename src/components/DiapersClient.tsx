"use client";
import { useState, useMemo } from "react";
import type { DiaperProduct } from "@/lib/db";
import { STORE_COLORS, SIZE_ORDER } from "@/lib/utils";

type Props = { products: DiaperProduct[] };

const TYPE_TABS = [
  { value: null,    label: "All Diapers" },
  { value: "belt",  label: "Belt / Tape" },
  { value: "pants", label: "Pants / Pull-up" },
] as const;

const SORT_OPTIONS = [
  { value: "price_per_piece" as const, label: "Cheapest per piece" },
  { value: "price_bdt" as const,       label: "Cheapest total" },
  { value: "discount_pct" as const,    label: "Biggest discount" },
];

export default function DiapersClient({ products }: Props) {
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [sizeFilter,  setSizeFilter]  = useState<string | null>(null);
  const [typeFilter,  setTypeFilter]  = useState<string | null>(null);
  const [sort, setSort] = useState<"price_per_piece" | "price_bdt" | "discount_pct">("price_per_piece");

  const filtered = useMemo(() => {
    let list = products;
    if (brandFilter) list = list.filter(p => p.brand_slug === brandFilter);
    if (sizeFilter)  list = list.filter(p => p.size_label === sizeFilter);
    if (typeFilter)  list = list.filter(p => p.type === typeFilter);

    return [...list].sort((a, b) => {
      if (sort === "discount_pct") return (Number(b.discount_pct) || 0) - (Number(a.discount_pct) || 0);
      if (sort === "price_bdt")    return Number(a.price_bdt) - Number(b.price_bdt);
      return Number(a.price_per_piece) - Number(b.price_per_piece);
    });
  }, [products, brandFilter, sizeFilter, typeFilter, sort]);

  // Collect available brands/sizes from data
  const availBrands = [...new Set(products.map(p => p.brand_slug))].filter(Boolean).sort();
  const brandNames  = Object.fromEntries(products.map(p => [p.brand_slug, p.brand]));
  const availSizes  = SIZE_ORDER.filter(s => products.some(p => p.size_label === s));
  const availTypes  = TYPE_TABS.filter(t => t.value === null || products.some(p => p.type === t.value));

  const activeCount = (brandFilter ? 1 : 0) + (sizeFilter ? 1 : 0);

  return (
    <div>
      {/* Sticky filter bar */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-40">
        <div className="max-w-6xl mx-auto px-4">
          {/* Type tabs + filters row */}
          <div className="flex items-center justify-between py-2 gap-4">
            {/* Type tabs */}
            <div className="flex gap-0 border border-slate-200 rounded-lg overflow-hidden shrink-0">
              {availTypes.map(tab => (
                <button
                  key={tab.label}
                  onClick={() => setTypeFilter(tab.value as string | null)}
                  className={`text-sm font-medium px-4 py-2 transition-colors cursor-pointer ${
                    typeFilter === tab.value
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={brandFilter ?? ""}
                onChange={e => setBrandFilter(e.target.value || null)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="">All brands</option>
                {availBrands.map(b => (
                  <option key={b} value={b}>{brandNames[b] || b}</option>
                ))}
              </select>

              <select
                value={sizeFilter ?? ""}
                onChange={e => setSizeFilter(e.target.value || null)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="">All sizes</option>
                {availSizes.map(s => (
                  <option key={s} value={s}>{s === "Newborn" ? "Newborn (NB)" : `Size ${s}`}</option>
                ))}
              </select>

              <select
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {activeCount > 0 && (
                <button
                  onClick={() => { setBrandFilter(null); setSizeFilter(null); setTypeFilter(null); }}
                  className="text-xs text-slate-500 hover:text-emerald-600 underline cursor-pointer ml-1"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <p className="text-sm text-slate-500 mb-3">
          <span className="font-semibold text-slate-900">{filtered.length}</span> products
          {brandFilter && <> &middot; <span className="capitalize">{brandNames[brandFilter] || brandFilter}</span></>}
          {sizeFilter && <> &middot; {sizeFilter}</>}
          {typeFilter && <> &middot; <span className="capitalize">{typeFilter}</span></>}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>No diapers found with these filters.</p>
            <button
              onClick={() => { setBrandFilter(null); setSizeFilter(null); setTypeFilter(null); }}
              className="mt-3 text-emerald-600 underline text-sm cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="pl-4 pr-2 py-3 w-12"></th>
                      <th className="px-3 py-3">Product</th>
                      <th className="px-3 py-3 text-center w-20">Size</th>
                      <th className="px-3 py-3 text-center w-20">Qty</th>
                      <th className="px-3 py-3 text-center w-24">Discount</th>
                      <th className="px-3 py-3 text-right w-28">Pack price</th>
                      <th className="px-3 py-3 text-center w-28">Store</th>
                      <th className="px-3 py-3 text-right w-28 bg-emerald-50 text-emerald-700">Per piece</th>
                      <th className="px-3 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => {
                      const sc = STORE_COLORS[p.store_slug] ?? { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
                      return (
                        <tr
                          key={p.id}
                          className={`border-b border-slate-100 hover:bg-emerald-50/30 transition-colors ${i === 0 ? "" : ""}`}
                        >
                          {/* Image */}
                          <td className="pl-4 pr-2 py-2.5">
                            {p.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.image_url} alt={p.brand} className="w-10 h-10 object-contain rounded-lg bg-slate-50" />
                            ) : (
                              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-lg">🍼</div>
                            )}
                          </td>
                          {/* Product info */}
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-slate-900">{p.brand}</div>
                            <div className="text-xs text-slate-500 truncate max-w-[200px]">
                              {[p.line, p.type && p.type.charAt(0).toUpperCase() + p.type.slice(1)].filter(Boolean).join(" · ")}
                              {p.weight_min_kg && p.weight_max_kg && (
                                <span className="text-slate-400"> · {p.weight_min_kg}–{p.weight_max_kg}kg</span>
                              )}
                            </div>
                          </td>
                          {/* Size */}
                          <td className="px-3 py-2.5 text-center">
                            {p.size_label ? (
                              <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">
                                {p.size_label}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          {/* Qty */}
                          <td className="px-3 py-2.5 text-center text-slate-600">
                            {p.pack_qty}pcs
                          </td>
                          {/* Discount */}
                          <td className="px-3 py-2.5 text-center">
                            {p.discount_pct && Number(p.discount_pct) >= 5 ? (
                              <span className="inline-block bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                -{Math.round(Number(p.discount_pct))}%
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          {/* Pack price */}
                          <td className="px-3 py-2.5 text-right">
                            <span className="text-slate-700 font-medium">৳{Number(p.price_bdt).toLocaleString()}</span>
                            {p.original_price_bdt && Number(p.original_price_bdt) > Number(p.price_bdt) && (
                              <span className="text-xs text-slate-400 line-through ml-1">৳{Number(p.original_price_bdt).toLocaleString()}</span>
                            )}
                          </td>
                          {/* Store */}
                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
                              {p.store_name}
                            </span>
                          </td>
                          {/* Per piece — hero column */}
                          <td className="px-3 py-2.5 text-right bg-emerald-50/50">
                            <span className="text-base font-bold text-emerald-700">
                              ৳{Number(p.price_per_piece).toFixed(2)}
                            </span>
                          </td>
                          {/* CTA */}
                          <td className="px-3 py-2.5 text-center">
                            {p.product_url ? (
                              <a
                                href={p.product_url}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {filtered.map((p) => {
                const sc = STORE_COLORS[p.store_slug] ?? { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
                return (
                  <a
                    key={p.id}
                    href={p.product_url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-3 hover:border-emerald-200 transition-colors"
                  >
                    {/* Image */}
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.brand} className="w-12 h-12 object-contain rounded-lg bg-slate-50 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-xl shrink-0">🍼</div>
                    )}
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{p.brand}</span>
                        {p.size_label && (
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">{p.size_label}</span>
                        )}
                        {p.type && (
                          <span className="text-[10px] text-slate-400 capitalize">{p.type}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {p.pack_qty}pcs
                        {p.line && <> &middot; {p.line}</>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
                          {p.store_name}
                        </span>
                        {p.discount_pct && Number(p.discount_pct) >= 5 && (
                          <span className="text-[10px] font-bold text-red-600">-{Math.round(Number(p.discount_pct))}%</span>
                        )}
                      </div>
                    </div>
                    {/* Price */}
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-emerald-700">৳{Number(p.price_per_piece).toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">/piece</div>
                    </div>
                  </a>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
