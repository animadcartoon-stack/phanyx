import Image from "next/image";
import Link from "next/link";
import type { LocalePhanyx } from "@/i18n/config";
import { marketingCopy, marketingPath } from "@/lib/public-marketing";
import {
  phanyxPrintCopy,
  phanyxPrintLocales,
  phanyxPrintPath,
} from "@/lib/phanyx-print-i18n";

const DOWNLOAD_PATH = "/downloads/PHANYX-Print-v0.1.5.zip";

export default function PhanyxPrintPage({
  locale,
}: {
  locale: LocalePhanyx;
}) {
  const t = phanyxPrintCopy[locale];
  const home = marketingPath(locale, "home");
  const academic = marketingPath(locale, "academic");

  return (
    <div lang={locale} className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050914]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-10 lg:px-12">
          <Link href={home} className="flex items-center gap-3">
            <span className="relative h-11 w-11 overflow-hidden rounded-xl border border-white/15 bg-white">
              <Image
                src="/images/phanyx-print-icon.png"
                alt="PHANYX Print"
                fill
                sizes="44px"
                className="object-cover"
              />
            </span>
            <span>
              <strong className="block text-sm tracking-[0.08em]">
                PHANYX Print
              </strong>
              <small className="text-blue-200">{t.free}</small>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <details className="relative">
              <summary className="cursor-pointer rounded-xl border border-white/20 bg-white/5 px-3 py-2">
                {locale} ▾
              </summary>
              <nav
                aria-label="Languages"
                className="absolute right-0 top-full mt-2 min-w-48 rounded-xl border border-slate-200 bg-white p-2 text-slate-900 shadow-xl"
              >
                {phanyxPrintLocales.map((item) => (
                  <Link
                    key={item}
                    href={phanyxPrintPath(item)}
                    hrefLang={item}
                    className="block rounded-lg px-3 py-2 hover:bg-blue-50"
                  >
                    {marketingCopy[item].name}
                  </Link>
                ))}
              </nav>
            </details>

            <a
              href={DOWNLOAD_PATH}
              download
              className="rounded-xl bg-blue-600 px-4 py-2 font-bold !text-white hover:bg-blue-500"
            >
              {t.primaryCta}
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#06133a] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(45,212,191,.18),transparent_25%),radial-gradient(circle_at_30%_10%,rgba(37,99,235,.35),transparent_35%),linear-gradient(135deg,#030817_0%,#071747_55%,#102b68_100%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-[1fr_.92fr] lg:items-center lg:px-12">
            <div>
              <p className="inline-flex rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
                {t.badge}
              </p>

              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.03] tracking-[-0.045em] sm:text-5xl xl:text-6xl">
                {t.title}
                <span className="mt-3 block bg-gradient-to-r from-cyan-300 via-blue-300 to-fuchsia-300 bg-clip-text text-transparent">
                  {t.accent}
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                {t.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={DOWNLOAD_PATH}
                  download
                  className="rounded-2xl bg-blue-600 px-6 py-4 font-bold !text-white shadow-xl hover:bg-blue-500"
                >
                  ↓ {t.primaryCta}
                </a>
                <a
                  href="#instalar"
                  className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 font-bold text-white hover:bg-white/15"
                >
                  {t.installCta}
                </a>
              </div>

              <p className="mt-5 text-sm font-semibold text-blue-100">
                {t.compatibleLine}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {t.heroNote}
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-8 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[30px] border border-white/15 bg-slate-950/80 p-4 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative h-12 w-12 overflow-hidden rounded-xl bg-white">
                      <Image
                        src="/images/phanyx-print-icon.png"
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </span>
                    <div>
                      <strong className="block">PHANYX Print</strong>
                      <small className="text-slate-400">{t.free}</small>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">
                    v0.1.5
                  </span>
                </div>

                <div className="space-y-3">
                  {t.modes.map((mode, index) => (
                    <div
                      key={mode.title}
                      className={`flex items-center gap-4 rounded-2xl border p-4 ${
                        index === 1
                          ? "border-blue-400/50 bg-blue-500/15"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-xl">
                        {mode.icon}
                      </span>
                      <div>
                        <strong className="block">{mode.title}</strong>
                        <small className="mt-1 block text-slate-400">
                          {mode.description}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">
                  ✓ Ctrl+V
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                {t.modesTitle}
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                {t.modesDescription}
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {t.modes.map((mode) => (
                <article
                  key={mode.title}
                  className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-xl text-blue-700">
                    {mode.icon}
                  </span>
                  <h3 className="mt-5 text-xl font-bold">{mode.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">
                    {mode.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">
              {t.benefitsTitle}
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {t.benefits.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="font-bold text-blue-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:px-10 lg:grid-cols-[.65fr_1fr] lg:items-center lg:px-12">
            <div>
              <p className="text-xs font-black tracking-[0.2em] text-blue-700">
                {t.demoKicker}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                {t.demoTitle}
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                {t.demoDescription}
              </p>
            </div>

            <div className="mx-auto max-h-[680px] w-full max-w-[460px] overflow-auto rounded-[28px] border border-slate-200 bg-slate-100 p-3 shadow-2xl">
              <Image
                src="/images/phanyx-print-demo.png"
                alt={t.demoTitle}
                width={373}
                height={2047}
                className="h-auto w-full rounded-2xl"
              />
            </div>
          </div>
        </section>

        <section id="instalar" className="bg-[#07122f] text-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:px-10 lg:grid-cols-2 lg:px-12">
            <div>
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                {t.installTitle}
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-blue-100">
                {t.installDescription}
              </p>

              <a
                href={DOWNLOAD_PATH}
                download
                className="mt-7 inline-flex rounded-2xl bg-blue-600 px-6 py-4 font-bold !text-white hover:bg-blue-500"
              >
                ↓ {t.download}
              </a>
            </div>

            <ol className="grid gap-3">
              {t.installSteps.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 font-black">
                    {index + 1}
                  </span>
                  <span className="pt-2 text-blue-50">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-[30px] border border-slate-200 p-8">
                <h2 className="text-2xl font-black">
                  {t.compatibilityTitle}
                </h2>
                <p className="mt-4 leading-7 text-slate-600">
                  {t.compatibilityDescription}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {t.browsers.map((browser) => (
                    <span
                      key={browser}
                      className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold"
                    >
                      {browser}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-sm font-semibold text-amber-700">
                  {t.firefoxNote}
                </p>
              </div>

              <div className="rounded-[30px] border border-blue-100 bg-blue-50 p-8">
                <h2 className="text-2xl font-black text-blue-950">
                  {t.privacyTitle}
                </h2>
                <p className="mt-4 leading-7 text-slate-700">
                  {t.privacyDescription}
                </p>
              </div>
            </div>

            <p className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-6 text-base leading-7 text-slate-700">
              {t.promoBefore}
              <Link
                href={academic}
                className="font-bold text-blue-700 underline underline-offset-4"
              >
                {t.promoLink}
              </Link>
              {t.promoAfter}
            </p>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-5xl px-6 py-20 md:px-10">
            <h2 className="text-center text-3xl font-black tracking-tight md:text-4xl">
              {t.faqTitle}
            </h2>
            <div className="mt-10 grid gap-4">
              {t.faqs.map((faq) => (
                <article
                  key={faq.question}
                  className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="font-bold">{faq.question}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
            <div className="rounded-[30px] border border-white/10 bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 p-8 md:p-12">
              <h2 className="text-3xl font-black md:text-4xl">
                {t.finalTitle}
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-blue-100">
                {t.finalDescription}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={DOWNLOAD_PATH}
                  download
                  className="rounded-xl bg-blue-600 px-6 py-3 font-bold !text-white"
                >
                  {t.download}
                </a>
                <Link
                  href={home}
                  className="rounded-xl border border-white/20 px-6 py-3 font-bold text-white"
                >
                  {t.backHome}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
