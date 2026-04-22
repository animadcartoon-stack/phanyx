"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Planos", href: "/planos" },
  { label: "Suporte", href: "/suporte" },
];

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";


  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isHome
          ? "border-b border-white/5 bg-gradient-to-b from-black/60 via-black/35 to-transparent backdrop-blur-2xl"
          : "border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2.5 md:px-10 lg:px-12">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div
            className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border shadow-sm ${
              isHome
                ? "border-white/15 bg-white/10"
                : "border-slate-200 bg-white"
            }`}
          >
            <Image
              src="/icon.png"
              alt="PHANYX"
              fill
              className="object-contain p-1.5"
            />
          </div>

          <div className="min-w-0">
            <div
  className={`truncate text-[14px] font-bold tracking-[0.16em] sm:text-[15px] ${
    isHome ? "text-white" : "text-slate-900"
  }`}
>
              PHANYX
            </div>
            <div
  className={`truncate text-[10px] sm:text-[11px] ${
    isHome ? "text-blue-100/80" : "text-slate-500"
  }`}
>
              Plataforma acadêmica SaaS
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
  {navItems.map((item) => {
    const active = pathname === item.href;
    const abrirNovaAba =
      item.href === "/planos" || item.href === "/suporte";

    return (
      <Link
        key={item.href}
        href={item.href}
        target={abrirNovaAba ? "_blank" : undefined}
        rel={abrirNovaAba ? "noopener noreferrer" : undefined}
        className={`relative text-sm font-medium transition ${
          isHome
            ? active
              ? "text-white"
              : "text-white/80 hover:text-white"
            : active
            ? "text-slate-900"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        {item.label}
        {active && (
          <span
            className={`absolute -bottom-2 left-0 h-[2px] w-full rounded-full ${
              isHome ? "bg-blue-300" : "bg-blue-600"
            }`}
          />
        )}
      </Link>
    );
  })}
</nav>

        <div className="flex items-center gap-2 md:gap-3">
          <a
            href="https://wa.me/5548988101240?text=Olá!%20Quero%20saber%20mais%20sobre%20o%20PHANYX."
            target="_blank"
            rel="noreferrer"
            className={`hidden rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition md:inline-flex ${
              isHome
                ? "border border-white/15 bg-white/10 text-white hover:bg-white/15"
                : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            Falar com comercial
          </a>

          <Link
            href="/suporte"
            className={`hidden rounded-xl px-4 py-2 text-sm font-medium transition md:inline-flex ${
              isHome
                ? "border border-blue-300/20 bg-blue-400/10 text-blue-100 hover:bg-blue-400/20"
                : "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            Suporte
          </Link>

          <Link
            href="/login"
            className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
              isHome
                ? "bg-white text-slate-950 hover:bg-blue-50"
                : "bg-slate-950 text-white hover:bg-slate-800"
            }`}
          >
            Área administrativa
          </Link>
        </div>
      </div>
    </header>
  );
}