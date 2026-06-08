import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBDT(amount: number | string): string {
  return `৳${Number(amount).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatPerPiece(amount: number | string): string {
  return `৳${Number(amount).toFixed(2)}/piece`;
}

export const SIZE_ORDER = ["Newborn", "S", "M", "L", "XL", "XXL"];

export function sortBySizeLabel(a: string | null, b: string | null): number {
  const ai = SIZE_ORDER.indexOf(a ?? "");
  const bi = SIZE_ORDER.indexOf(b ?? "");
  if (ai === -1 && bi === -1) return 0;
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
}

export const STORE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  chaldal:    { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200"   },
  daraz:      { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200"  },
  othoba:     { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"    },
  shwapno:    { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"     },
  arogga:     { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200"  },
  ajkerdeal:  { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200"    },
  gobaby:     { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200"    },
  paikaree:   { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200"  },
  meenabazar: { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200"    },
  unimart:    { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200"  },
};
