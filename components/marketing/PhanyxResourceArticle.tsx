import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LocalizedHeader from "@/components/marketing/LocalizedHeader";
import type { LocalePhanyx } from "@/i18n/config";
import { marketingPath } from "@/lib/public-marketing";
import { phanyxBlogPath } from "@/lib/phanyx-blog-hub";
import {
  phanyxResourceLanguagePaths,
  type PhanyxResourcePage,
} from "@/lib/phanyx-resource-pages";

const ui: Record<LocalePhanyx, {
  breadcrumb: string;
  finds: string;
  trialEyebrow: string;
  trialTitle: string;
  trialText: string;
  trialButton: string;
  back: string;
  languages: string;
  rights: string;
}> = {
  "pt-BR": {
    breadcrumb: "Blog PHANYX",
    finds: "O que você encontra neste recurso",
    trialEyebrow: "Teste do PHANYX",
    trialTitle: "Teste por 3 meses sem custo",
    trialText: "A adesão utiliza cartão, mas a cobrança só ocorre ao final do período se a assinatura não tiver sido cancelada. Se você cancelar antes, o acesso continua até completar os três meses, sem custo adicional.",
    trialButton: "Conhecer planos e testar",
    back: "Voltar ao blog",
    languages: "Leia em outro idioma",
    rights: "Todos os direitos reservados.",
  },
  "pt-PT": {
    breadcrumb: "Blog PHANYX",
    finds: "O que encontra neste recurso",
    trialEyebrow: "Teste do PHANYX",
    trialTitle: "Teste durante 3 meses sem custo",
    trialText: "A adesão utiliza cartão, mas a cobrança só ocorre no final do período se a subscrição não tiver sido cancelada. Se cancelar antes, o acesso mantém-se até completar os três meses, sem custo adicional.",
    trialButton: "Conhecer planos e testar",
    back: "Voltar ao blog",
    languages: "Ler noutro idioma",
    rights: "Todos os direitos reservados.",
  },
  "en-US": {
    breadcrumb: "PHANYX Blog",
    finds: "What you can do with this feature",
    trialEyebrow: "Try PHANYX",
    trialTitle: "Try PHANYX for 3 months at no cost",
    trialText: "A card is required to start, but you are only charged at the end of the period if the subscription has not been canceled. If you cancel earlier, access continues until the three months are complete at no additional cost.",
    trialButton: "View plans and try PHANYX",
    back: "Back to the blog",
    languages: "Read in another language",
    rights: "All rights reserved.",
  },
  "es-ES": {
    breadcrumb: "Blog PHANYX",
    finds: "Qué encontrarás en este recurso",
    trialEyebrow: "Prueba PHANYX",
    trialTitle: "Prueba PHANYX durante 3 meses sin coste",
    trialText: "Se requiere tarjeta para iniciar, pero solo se cobra al final del periodo si la suscripción no se ha cancelado. Si cancelas antes, el acceso continúa hasta completar los tres meses sin coste adicional.",
    trialButton: "Ver planes y probar PHANYX",
    back: "Volver al blog",
    languages: "Leer en otro idioma",
    rights: "Todos los derechos reservados.",
  },
  "fr-FR": {
    breadcrumb: "Blog PHANYX",
    finds: "Ce que vous trouverez dans cette fonctionnalité",
    trialEyebrow: "Essayer PHANYX",
    trialTitle: "Essayez PHANYX pendant 3 mois sans frais",
    trialText: "Une carte est requise au démarrage, mais aucun montant n'est facturé avant la fin de la période si l'abonnement est annulé. En cas d'annulation anticipée, l'accès reste actif jusqu'à la fin des trois mois sans coût supplémentaire.",
    trialButton: "Voir les offres et essayer PHANYX",
    back: "Retour au blog",
    languages: "Lire dans une autre langue",
    rights: "Tous droits réservés.",
  },
};

function IntlFooter({ locale }: { locale: LocalePhanyx }) {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="font-bold tracking-[0.18em]">PHANYX</p>
        <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-400">
          <Link href={phanyxBlogPath(locale)}>{ui[locale].back}</Link>
          <Link href={marketingPath(locale, "plans")}>{ui[locale].trialButton}</Link>
        </div>
      </div>
      <div className="mx-auto max-w-5xl border-t border-white/10 px-6 py-5 text-xs text-slate-500">© 2026 PHANYX. {ui[locale].rights}</div>
    </footer>
  );
}

export default function PhanyxResourceArticle({ locale, article }: { locale: LocalePhanyx; article: PhanyxResourcePage }) {
  const copy = ui[locale];
  const languagePaths = phanyxResourceLanguagePaths(article.key);

  return (
    <div lang={locale}>
      {locale === "pt-BR" ? (
        <Header />
      ) : (
        <LocalizedHeader locale={locale} section="academic" languagePaths={languagePaths} />
      )}

      <main className="bg-white text-slate-900">
        <article>
          <header className="mx-auto max-w-5xl px-6 pb-10 pt-16">
            <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
              <Link href={phanyxBlogPath(locale)} className="hover:text-blue-600">{copy.breadcrumb}</Link>
              <span className="px-2">/</span>
              <span>{article.shortTitle}</span>
            </nav>

            <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{article.eyebrow}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">{article.title}</h1>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600">{article.description}</p>

            <figure className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
              <Image src={article.image} alt={article.imageAlt} width={1536} height={1024} priority className="h-auto w-full" sizes="(max-width: 768px) 100vw, 1024px" />
            </figure>
          </header>

          <section className="mx-auto max-w-4xl px-6 py-10">
            <p className="text-lg leading-8 text-slate-700">{article.intro}</p>

            <h2 className="mt-12 text-3xl font-bold">{copy.finds}</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {article.highlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 leading-7 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>

            <h2 className="mt-12 text-3xl font-bold">{article.integrationTitle}</h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">{article.integrationText}</p>

            <h2 className="mt-12 text-3xl font-bold">{article.practicalTitle}</h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">{article.practicalText}</p>

            <nav className="mt-12 border-t border-slate-200 pt-8" aria-label={copy.languages}>
              <h2 className="text-xl font-bold">{copy.languages}</h2>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {(Object.entries(languagePaths) as Array<[LocalePhanyx, string]>).map(([language, href]) => (
                  <Link key={language} href={href} hrefLang={language} className="text-sm font-semibold text-blue-700 underline">{language}</Link>
                ))}
              </div>
            </nav>
          </section>

          <section className="border-y border-orange-200 bg-orange-50">
            <div className="mx-auto max-w-4xl px-6 py-10">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-700">{copy.trialEyebrow}</p>
              <h2 className="mt-2 text-3xl font-bold">{copy.trialTitle}</h2>
              <p className="mt-4 max-w-3xl leading-7 text-slate-700">{copy.trialText}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={marketingPath(locale, "plans")} className="rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600">{copy.trialButton}</Link>
                <Link href={phanyxBlogPath(locale)} className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 hover:border-slate-400">{copy.back}</Link>
              </div>
            </div>
          </section>
        </article>
      </main>

      {locale === "pt-BR" ? <Footer /> : <IntlFooter locale={locale} />}
    </div>
  );
}
