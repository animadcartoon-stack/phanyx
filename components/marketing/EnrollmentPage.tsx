import Link from "next/link";
import Image from "next/image";
import LocalizedHeader from "@/components/marketing/LocalizedHeader";
import { enrollmentCopy } from "@/lib/enrollment-marketing";
import { marketingPath } from "@/lib/public-marketing";
import type { LocalePhanyx } from "@/i18n/config";

export default function EnrollmentPage({ locale }: { locale: LocalePhanyx }) {
  const copy = enrollmentCopy[locale];
  const contactUrl = `https://wa.me/5548988101240?text=${encodeURIComponent(`PHANYX — ${copy.eyebrow} (${locale})`)}`;

  return (
    <div lang={locale} className="min-h-screen bg-white text-slate-900">
      <LocalizedHeader locale={locale} section="enrollment" />
      <main>
        <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:px-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-6 lg:px-12 lg:py-20">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">{copy.eyebrow}</p>
              <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">{copy.heading}</h1>
              <p className="mt-6 text-lg leading-8 text-slate-200">{copy.intro}</p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link href={marketingPath(locale, "plans")} className="rounded-xl bg-blue-600 px-6 py-3 font-semibold !text-white hover:bg-blue-500">{copy.plans}</Link>
                <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10">{copy.contact}</a>
              </div>
            </div>
            <Image
              src="/images/enrollment-dashboard-hero.png"
              alt={copy.heroAlt}
              width={1536}
              height={1024}
              priority
              sizes="(max-width: 1023px) 100vw, 45vw"
              className="mx-auto h-auto w-full max-w-2xl"
            />
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <h2 className="max-w-3xl text-3xl font-bold">{copy.problemHeading}</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">{copy.problem}</p>
        </section>
        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
            <h2 className="text-3xl font-bold">{copy.stepsHeading}</h2>
            <ol className="mt-8 grid gap-5 md:grid-cols-3">
              {copy.steps.map((step, index) => <li key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="text-2xl font-bold text-blue-700">{index + 1}</span>
                <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-700">{step.description}</p>
              </li>)}
            </ol>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <h2 className="text-3xl font-bold">{copy.scopeHeading}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">{copy.scope.map((item) => <article key={item.title} className="rounded-2xl border border-slate-200 p-6">
            <h3 className="text-xl font-semibold text-blue-900">{item.title}</h3><p className="mt-3 leading-7 text-slate-700">{item.description}</p>
          </article>)}</div>
          <h2 className="mt-16 text-2xl font-bold">{copy.fitHeading}</h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-700">{copy.fit}</p>
          <h2 className="mt-10 text-2xl font-bold">{copy.question}</h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-700">{copy.answer}</p>
        </section>
        <section className="bg-slate-950 text-white"><div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <h2 className="text-3xl font-bold">{copy.relatedHeading}</h2>
          <nav aria-label={copy.relatedHeading} className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link href={marketingPath(locale, "school")} className="rounded-xl border border-white/20 bg-white/5 p-5 font-semibold text-blue-100 hover:bg-white/10">{copy.relatedSchool} →</Link>
            <Link href={marketingPath(locale, "academic")} className="rounded-xl border border-white/20 bg-white/5 p-5 font-semibold text-blue-100 hover:bg-white/10">{copy.relatedAcademic} →</Link>
          </nav>
          <h2 className="mt-14 text-3xl font-bold">{copy.closingHeading}</h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-200">{copy.closing}</p>
          <div className="mt-7 flex flex-wrap gap-4">
            <Link href={marketingPath(locale, "plans")} className="rounded-xl bg-blue-600 px-6 py-3 font-semibold !text-white hover:bg-blue-500">{copy.plans}</Link>
            <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10">{copy.contact}</a>
          </div>
        </div></section>
      </main>
    </div>
  );
}
