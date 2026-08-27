// Shared Product JSON-LD helpers for the four ItemList routes
// (/brand/[slug], /brand/[slug]/size/[size], /size/[size], /store/[slug]).
//
// Why this file exists: GSC URL Inspection reported `Merchant listings` FAIL
// with ERROR `Missing field "image"` on all 20 items of every one of those
// routes, and diaperdam logged PRODUCT_SNIPPETS = 3 impressions over 14 days
// against 1,781 site impressions. The image data was in the DB the whole time,
// it just never reached the JSON-LD.

import type { DiaperProduct } from "./db";

type ImageRow = { image_url: string | null };

/**
 * A retailer image that can actually back a merchant listing.
 * Scraper rows carry a generic `default-product.webp` for 24 SKUs; that is
 * worse than no image, because Google would render the placeholder.
 */
export function productImage(p: ImageRow): string | null {
  const url = p.image_url?.trim();
  if (!url || !url.startsWith("https://")) return null;
  if (/default[-_]?product|placeholder|no[-_]?image/i.test(url)) return null;
  return url;
}

/**
 * Google validates merchant listings per item, not per page, so one imageless
 * Product costs itself and nothing else — but a list where the first 20 rows
 * happen to be imageless loses the whole appearance. Order image-bearing rows
 * first and keep the rest as tail, so the list stays a real subset of what the
 * page shows while every leading item is eligible.
 */
export function schemaProducts<T extends ImageRow>(products: T[], limit = 20): T[] {
  const withImage: T[] = [];
  const without: T[] = [];
  for (const p of products) (productImage(p) ? withImage : without).push(p);
  return [...withImage, ...without].slice(0, limit);
}

const TYPE_BN: Record<string, string> = { belt: "বেল্ট", pants: "প্যান্ট", swim: "সুইম" };

/**
 * Factual one-liner assembled from the row itself. Nothing here is a claim the
 * database doesn't already hold — no invented copy, no ratings.
 */
export function productDescription(p: DiaperProduct): string {
  const parts: string[] = [];
  const head = [p.brand, p.line, p.size_label].filter(Boolean).join(" ");
  const type = p.type ? TYPE_BN[p.type] ?? p.type : null;
  parts.push(type ? `${head} ${type} ডায়াপার` : `${head} ডায়াপার`);
  if (p.weight_min_kg != null && p.weight_max_kg != null) {
    parts.push(`${p.weight_min_kg}-${p.weight_max_kg} কেজি`);
  }
  parts.push(`${p.pack_qty} পিস`);
  parts.push(`${p.store_name}-এ ৳${Number(p.price_bdt).toFixed(0)}`);
  return parts.join(", ");
}
