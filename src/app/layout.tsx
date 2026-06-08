import type { Metadata } from "next";
import { Geist, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geist = Geist({ subsets: ["latin"] });
const notoBengali = Noto_Sans_Bengali({ subsets: ["bengali"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: {
    default: "DiaperDam — বাংলাদেশে সবচেয়ে কম দামে ডায়াপার",
    template: "%s | DiaperDam",
  },
  description:
    "চালডাল, দারাজ, মীনা বাজার, স্বপ্ন ও GoBaby থেকে ডায়াপারের দাম তুলনা করুন। Huggies, MamyPoko, Molfix, Bashundhara সহ সব ব্র্যান্ডের প্রতি পিস দাম দেখুন।",
  metadataBase: new URL("https://diaperdam.com"),
  alternates: { canonical: "https://diaperdam.com" },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: "DiaperDam",
    url: "https://diaperdam.com",
  },
  robots: { index: true, follow: true },
  keywords: [
    "ডায়াপার দাম বাংলাদেশ",
    "সস্তা ডায়াপার বাংলাদেশ",
    "হাগিস দাম বাংলাদেশ",
    "ম্যামিপোকো দাম",
    "মলফিক্স দাম",
    "ডায়াপার তুলনা বাংলাদেশ",
    "চালডাল ডায়াপার দাম",
    "দারাজ ডায়াপার দাম",
    "diaper price bangladesh",
    "cheapest diaper bangladesh",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className={`${geist.className} ${notoBengali.className} bg-slate-50 text-slate-900 antialiased`}>
        <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🍼</span>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                diaper<span className="text-emerald-600">dam</span>
              </span>
            </Link>
            <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link href="/diapers" className="hover:text-emerald-600 transition-colors">সব ডায়াপার</Link>
              <Link href="/deals" className="hover:text-emerald-600 transition-colors text-emerald-700 font-semibold">🏷️ অফার</Link>
              <Link href="/brand/huggies" className="hover:text-emerald-600 transition-colors">Huggies</Link>
              <Link href="/brand/mamypoko" className="hover:text-emerald-600 transition-colors">MamyPoko</Link>
              <Link href="/brand/molfix" className="hover:text-emerald-600 transition-colors">Molfix</Link>
              <Link href="/price-index" className="hover:text-emerald-600 transition-colors">মূল্য সূচক</Link>
            </nav>
            <Link href="/diapers" className="sm:hidden text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              তুলনা করুন →
            </Link>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-20 border-t border-slate-200 bg-slate-900 text-slate-400 py-12">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
            <div className="col-span-2 md:col-span-1">
              <p className="font-bold text-white text-lg mb-2">🍼 diaper<span className="text-emerald-400">dam</span></p>
              <p className="text-xs leading-relaxed">
                বাংলাদেশের ডায়াপার দাম তুলনা সাইট। প্রতিদিন সব বড় অনলাইন দোকান থেকে দাম আপডেট করা হয়, যাতে আপনি সবসময় সবচেয়ে কম দামের ডায়াপার খুঁজে পান।
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-300 mb-3 text-xs uppercase tracking-wider">ব্র্যান্ড</p>
              <ul className="space-y-1.5">
                {[
                  { slug: "huggies", name: "Huggies" },
                  { slug: "mamypoko", name: "MamyPoko" },
                  { slug: "molfix", name: "Molfix" },
                  { slug: "pampers", name: "Pampers" },
                  { slug: "neocare", name: "Neocare" },
                  { slug: "bashundhara", name: "Bashundhara" },
                  { slug: "avonee", name: "Avonee" },
                  { slug: "supermom", name: "Supermom" },
                ].map(b => (
                  <li key={b.slug}><Link href={`/brand/${b.slug}`} className="hover:text-emerald-400 transition-colors">{b.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-300 mb-3 text-xs uppercase tracking-wider">সাইজ</p>
              <ul className="space-y-1.5">
                <li><Link href="/size/newborn" className="hover:text-emerald-400 transition-colors">নবজাতক (০-৫ কেজি)</Link></li>
                <li><Link href="/size/s" className="hover:text-emerald-400 transition-colors">সাইজ S (৪-৮ কেজি)</Link></li>
                <li><Link href="/size/m" className="hover:text-emerald-400 transition-colors">সাইজ M (৬-১১ কেজি)</Link></li>
                <li><Link href="/size/l" className="hover:text-emerald-400 transition-colors">সাইজ L (৯-১৪ কেজি)</Link></li>
                <li><Link href="/size/xl" className="hover:text-emerald-400 transition-colors">সাইজ XL (১২-১৭ কেজি)</Link></li>
                <li><Link href="/size/xxl" className="hover:text-emerald-400 transition-colors">সাইজ XXL (১৫+ কেজি)</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-300 mb-3 text-xs uppercase tracking-wider">দোকান</p>
              <ul className="space-y-1.5">
                <li><Link href="/store/chaldal" className="hover:text-emerald-400 transition-colors">চালডাল</Link></li>
                <li><Link href="/store/meenabazar" className="hover:text-emerald-400 transition-colors">মীনা বাজার</Link></li>
                <li><Link href="/store/gobaby" className="hover:text-emerald-400 transition-colors">GoBaby</Link></li>
                <li><Link href="/store/shwapno" className="hover:text-emerald-400 transition-colors">স্বপ্ন</Link></li>
                <li><Link href="/store/daraz" className="hover:text-emerald-400 transition-colors">দারাজ</Link></li>
                <li><Link href="/store/othoba" className="hover:text-emerald-400 transition-colors">অথবা</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-300 mb-3 text-xs uppercase tracking-wider">টুলস</p>
              <ul className="space-y-1.5">
                <li><Link href="/diapers" className="hover:text-emerald-400 transition-colors">সব ডায়াপার তুলনা</Link></li>
                <li><Link href="/deals" className="hover:text-emerald-400 transition-colors">আজকের অফার</Link></li>
                <li><Link href="/price-index" className="hover:text-emerald-400 transition-colors">মূল্য সূচক</Link></li>
              </ul>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-4 mt-10 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
            <p>&copy; ২০২৬ DiaperDam। চালডাল, মীনা বাজার, GoBaby, স্বপ্ন সহ আরও দোকান থেকে প্রতিদিন দাম আপডেট।</p>
            <p>অ্যাফিলিয়েট লিংকে কমিশন পাওয়া যেতে পারে, আপনার কোনো বাড়তি খরচ নেই।</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
