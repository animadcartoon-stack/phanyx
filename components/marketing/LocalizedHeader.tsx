import Image from "next/image";
import Link from "next/link";
import type { LocalePhanyx } from "@/i18n/config";
import { marketingCopy, marketingLocales, marketingPath, type MarketingSection } from "@/lib/public-marketing";

export default function LocalizedHeader({ locale, section }: { locale: LocalePhanyx; section: MarketingSection }) {
  const copy = marketingCopy[locale];
  const dark = section === "home" || section === "academic";
  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${dark ? "border-white/10 bg-slate-950/90 text-white" : "border-slate-200 bg-white/95 text-slate-950"}`}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-2.5 md:px-10 lg:px-12">
        <Link href={marketingPath(locale, "home")} className="flex items-center gap-3">
          <span className="relative h-10 w-10 overflow-hidden rounded-xl border border-slate-200 bg-white"><Image src="/icon.png" alt="PHANYX" fill className="object-contain p-1.5" /></span>
          <span><strong className="block text-sm tracking-[0.16em]">PHANYX</strong><small className={dark ? "text-blue-100" : "text-slate-500"}>{copy.navAcademic}</small></span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-5 text-sm">
          <Link href={marketingPath(locale, "academic")} className="hover:text-blue-500">{copy.navAcademic}</Link>
          {locale !== "pt-BR" && <Link href={marketingPath(locale, "school")} className="hidden hover:text-blue-500 lg:inline">{locale === "en-US" ? "Schools" : locale === "pt-PT" ? "Escolas" : locale === "es-ES" ? "Centros" : "Établissements"}</Link>}
          <Link href={marketingPath(locale, "plans")} className="hover:text-blue-500">{copy.navPlans}</Link>
        </nav>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <details className="relative">
            <summary className={`cursor-pointer rounded-lg border px-3 py-2 ${dark ? "border-white/30" : "border-slate-300"}`}>{locale} ▾</summary>
            <nav aria-label="Languages" className="absolute right-0 top-full z-50 mt-2 min-w-44 rounded-xl border border-slate-200 bg-white p-2 text-slate-900 shadow-xl">
              {marketingLocales.filter((item) => section !== "success" || item !== "pt-BR").map((item) => <Link key={item} href={marketingPath(item, section)} hrefLang={item} className="block rounded-lg px-3 py-2 hover:bg-blue-50">{marketingCopy[item].name}</Link>)}
            </nav>
          </details>
          <a href={`https://wa.me/5548988101240?text=${encodeURIComponent(`${copy.contact} — PHANYX`)}`} target="_blank" rel="noopener noreferrer" className={`hidden rounded-xl border px-4 py-2 md:inline-flex ${dark ? "border-white/20 bg-white/10" : "border-slate-300"}`}>{copy.contact}</a>
          <Link href={`/login?lang=${locale}`} className={`rounded-xl px-4 py-2 font-semibold ${dark ? "bg-white text-slate-950" : "bg-slate-950 !text-white"}`}>{copy.login}</Link>
        </div>
      </div>
    </header>
  );
}
