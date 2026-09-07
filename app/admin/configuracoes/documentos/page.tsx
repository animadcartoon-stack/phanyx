import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ConfiguracoesDocumentosPage() {
  const t =
    useTranslations(
      "AdminSettingsDocuments"
    );

  const cards = [
    {
      href:
        "/admin/configuracoes/instituicao",
      icon:
        "\u{1F3DB}\uFE0F",
      title:
        t(
          "institution.title"
        ),
      description:
        t(
          "institution.description"
        ),
    },
    {
      href:
        "/admin/documentos/templates",
      icon:
        "\u{1F4DD}",
      title:
        t(
          "templates.title"
        ),
      description:
        t(
          "templates.description"
        ),
    },
    {
      href:
        "/admin/contratos",
      icon:
        "\u{1F4D1}",
      title:
        t(
          "contracts.title"
        ),
      description:
        t(
          "contracts.description"
        ),
    },
    {
      href:
        "/admin/configuracoes/certificado",
      icon:
        "\u{1F3C5}",
      title:
        t(
          "certificates.title"
        ),
      description:
        t(
          "certificates.description"
        ),
    },
    {
      href:
        "/admin/integracoes",
      icon:
        "\u{1F517}",
      title:
        t(
          "googleIntegrations.title"
        ),
      description:
        t(
          "googleIntegrations.description"
        ),
    },
  ];

  return (
    <div className="space-y-6 text-slate-950 dark:text-slate-100">
      <div>
        <p className="text-sm font-bold tracking-[0.25em] text-blue-700 dark:text-blue-300">
          {t(
            "eyebrow"
          )}
        </p>

        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-950 dark:text-white">
          <span
            aria-hidden="true"
          >
            {"\u{1F4C4}"}
          </span>

          <span>
            {t(
              "title"
            )}
          </span>
        </h1>

        <p className="mt-1 max-w-4xl text-slate-600 dark:text-slate-300">
          {t(
            "description"
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map(
          (
            card
          ) => (
            <Link
              key={
                card.href
              }
              href={
                card.href
              }
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-400"
            >
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
                <span
                  aria-hidden="true"
                >
                  {
                    card.icon
                  }
                </span>

                <span>
                  {
                    card.title
                  }
                </span>
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {
                  card.description
                }
              </p>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
