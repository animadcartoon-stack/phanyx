"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

type Publicacao = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  notaMaxima: number;
  status: string;
  enviadoParaApoioDocenteEm?: string | null;
  createdAt?: string | null;
  turma?: { id: number; nome: string } | null;
  disciplina?: { id: number; nome: string } | null;
  professorResponsavel?: { id: number; nome: string } | null;
  criadoPor?: { id: number; nome: string; email: string } | null;
  anexos?: {
    id: number;
    titulo: string;
    url: string;
    arquivoNome?: string | null;
  }[];
};

export default function PublicacoesAcademicasPage() {
  const t = useTranslations("AdminAcademicPublications");
  const locale = useLocale();

  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicandoId, setPublicandoId] = useState<number | null>(null);
  const [devolvendoId, setDevolvendoId] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/admin/academico/publicacoes", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("errors.load"));
      }

      setPublicacoes(Array.isArray(data?.atividades) ? data.atividades : []);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : t("errors.load"));
      setPublicacoes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
    // A carga deve ocorrer apenas ao abrir a página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatarData(data?: string | null) {
    if (!data) return "-";

    const valor = new Date(data);
    if (Number.isNaN(valor.getTime())) return data;

    return valor.toLocaleString(locale);
  }

  function traduzirStatus(status: string) {
    switch (status) {
      case "PUBLICADA":
        return t("status.published");
      case "DEVOLVIDA":
        return t("status.returned");
      case "RASCUNHO":
        return t("status.draft");
      case "AGUARDANDO_PUBLICACAO":
      default:
        return t("status.awaitingPublication");
    }
  }

  function classeDoStatus(status: string) {
    switch (status) {
      case "PUBLICADA":
        return "publication-status publication-status-published";
      case "DEVOLVIDA":
        return "publication-status publication-status-returned";
      case "RASCUNHO":
        return "publication-status publication-status-draft";
      case "AGUARDANDO_PUBLICACAO":
      default:
        return "publication-status publication-status-awaiting";
    }
  }

  async function publicarAtividade(atividadeId: number) {
    try {
      setPublicandoId(atividadeId);
      setErro("");

      const res = await fetch(
        `/api/admin/academico/publicacoes/${atividadeId}/publicar`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("errors.publish"));
      }

      await carregar();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : t("errors.publish"));
    } finally {
      setPublicandoId(null);
    }
  }

  async function devolverAtividade(atividadeId: number) {
    try {
      setDevolvendoId(atividadeId);
      setErro("");

      const res = await fetch(
        `/api/admin/academico/publicacoes/${atividadeId}/devolver`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("errors.return"));
      }

      await carregar();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : t("errors.return"));
    } finally {
      setDevolvendoId(null);
    }
  }

  return (
    <main className="phanyx-academic-publications-page min-h-screen p-6">
      <style jsx global>{`
        .phanyx-academic-publications-page {
          --publications-page-bg: #f8fafc;
          --publications-card-bg: #ffffff;
          --publications-soft-bg: #f8fafc;
          --publications-text: #0f172a;
          --publications-muted: #475569;
          --publications-subtle: #64748b;
          --publications-border: #cbd5e1;
          --publications-soft-border: #e2e8f0;
          --publications-blue: #1d4ed8;
          --publications-error-bg: #fef2f2;
          --publications-error-border: #fecaca;
          --publications-error-text: #b91c1c;
          --publications-awaiting-bg: #fffbeb;
          --publications-awaiting-border: #fde68a;
          --publications-awaiting-text: #b45309;
          --publications-published-bg: #f0fdf4;
          --publications-published-border: #bbf7d0;
          --publications-published-text: #15803d;
          --publications-returned-bg: #fef2f2;
          --publications-returned-border: #fecaca;
          --publications-returned-text: #b91c1c;
          --publications-draft-bg: #f1f5f9;
          --publications-draft-border: #cbd5e1;
          --publications-draft-text: #475569;
          min-height: 100vh;
          background: var(--publications-page-bg);
          color: var(--publications-text);
        }

        html[data-theme="dark"] .phanyx-academic-publications-page {
          --publications-page-bg: #020617;
          --publications-card-bg: #0f172a;
          --publications-soft-bg: #111c31;
          --publications-text: #f8fafc;
          --publications-muted: #cbd5e1;
          --publications-subtle: #94a3b8;
          --publications-border: #475569;
          --publications-soft-border: #334155;
          --publications-blue: #93c5fd;
          --publications-error-bg: #450a0a;
          --publications-error-border: #991b1b;
          --publications-error-text: #fecaca;
          --publications-awaiting-bg: #422006;
          --publications-awaiting-border: #92400e;
          --publications-awaiting-text: #fde68a;
          --publications-published-bg: #052e16;
          --publications-published-border: #166534;
          --publications-published-text: #bbf7d0;
          --publications-returned-bg: #450a0a;
          --publications-returned-border: #991b1b;
          --publications-returned-text: #fecaca;
          --publications-draft-bg: #1e293b;
          --publications-draft-border: #475569;
          --publications-draft-text: #e2e8f0;
          color-scheme: dark;
        }

        html[data-theme="system"] .phanyx-academic-publications-page {
          --publications-page-bg: #242424;
          --publications-card-bg: #2d2d2d;
          --publications-soft-bg: #333333;
          --publications-text: #ffffff;
          --publications-muted: #e5e7eb;
          --publications-subtle: #d1d5db;
          --publications-border: #666666;
          --publications-soft-border: #555555;
          --publications-blue: #a9ccff;
          --publications-error-bg: #4a2222;
          --publications-error-border: #9f4a4a;
          --publications-error-text: #fee2e2;
          --publications-awaiting-bg: #4a3b1d;
          --publications-awaiting-border: #8f732f;
          --publications-awaiting-text: #fff1b8;
          --publications-published-bg: #173c28;
          --publications-published-border: #2f855a;
          --publications-published-text: #d1fae5;
          --publications-returned-bg: #4a2222;
          --publications-returned-border: #9f4a4a;
          --publications-returned-text: #fee2e2;
          --publications-draft-bg: #3a3a3a;
          --publications-draft-border: #666666;
          --publications-draft-text: #f3f4f6;
          color-scheme: dark;
        }

        .phanyx-academic-publications-page .publications-card {
          border: 1px solid var(--publications-soft-border);
          background: var(--publications-card-bg);
          box-shadow: 0 1px 3px rgb(15 23 42 / 0.1);
        }

        .phanyx-academic-publications-page .publications-title,
        .phanyx-academic-publications-page .publications-strong {
          color: var(--publications-text);
          -webkit-text-fill-color: var(--publications-text);
        }

        .phanyx-academic-publications-page .publications-description,
        .phanyx-academic-publications-page .publications-details {
          color: var(--publications-muted);
          -webkit-text-fill-color: var(--publications-muted);
        }

        .phanyx-academic-publications-page .publications-subtle {
          color: var(--publications-subtle);
          -webkit-text-fill-color: var(--publications-subtle);
        }

        .phanyx-academic-publications-page .publications-accent,
        .phanyx-academic-publications-page .publication-attachment {
          color: var(--publications-blue);
          -webkit-text-fill-color: var(--publications-blue);
        }

        .phanyx-academic-publications-page .publications-error {
          border-color: var(--publications-error-border);
          background: var(--publications-error-bg);
          color: var(--publications-error-text);
          -webkit-text-fill-color: var(--publications-error-text);
        }

        .phanyx-academic-publications-page .publications-empty {
          border-color: var(--publications-border);
          background: var(--publications-card-bg);
          color: var(--publications-subtle);
          -webkit-text-fill-color: var(--publications-subtle);
        }

        .phanyx-academic-publications-page .publication-status {
          display: inline-flex;
          border: 1px solid;
          border-radius: 9999px;
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .phanyx-academic-publications-page .publication-status-awaiting {
          border-color: var(--publications-awaiting-border);
          background: var(--publications-awaiting-bg);
          color: var(--publications-awaiting-text);
          -webkit-text-fill-color: var(--publications-awaiting-text);
        }

        .phanyx-academic-publications-page .publication-status-published {
          border-color: var(--publications-published-border);
          background: var(--publications-published-bg);
          color: var(--publications-published-text);
          -webkit-text-fill-color: var(--publications-published-text);
        }

        .phanyx-academic-publications-page .publication-status-returned {
          border-color: var(--publications-returned-border);
          background: var(--publications-returned-bg);
          color: var(--publications-returned-text);
          -webkit-text-fill-color: var(--publications-returned-text);
        }

        .phanyx-academic-publications-page .publication-status-draft {
          border-color: var(--publications-draft-border);
          background: var(--publications-draft-bg);
          color: var(--publications-draft-text);
          -webkit-text-fill-color: var(--publications-draft-text);
        }

        .phanyx-academic-publications-page .publication-attachments {
          border: 1px solid var(--publications-soft-border);
          background: var(--publications-soft-bg);
        }

        .phanyx-academic-publications-page .publication-attachment {
          display: block;
          border: 1px solid var(--publications-soft-border);
          background: var(--publications-card-bg);
        }

        .phanyx-academic-publications-page .publication-attachment:hover {
          background: var(--publications-soft-bg);
        }

        .phanyx-academic-publications-page .publication-return-button {
          border: 1px solid var(--publications-border);
          color: var(--publications-text);
          -webkit-text-fill-color: var(--publications-text);
        }

        .phanyx-academic-publications-page .publication-return-button:hover {
          background: var(--publications-soft-bg);
        }
      `}</style>

      <div className="mx-auto max-w-6xl space-y-6">
        <section className="publications-card rounded-3xl p-6">
          <p className="publications-accent text-xs font-bold uppercase tracking-[0.2em]">
            {t("eyebrow")}
          </p>

          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="publications-title text-2xl font-black">
                {t("title")}
              </h1>

              <p className="publications-description mt-2 text-sm leading-6">
                {t("description")}
              </p>
            </div>

            <Link
              href="/admin/academico/publicacoes/nova"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              {t("newPublication")}
            </Link>
          </div>
        </section>

        {erro && (
          <div
            role="alert"
            className="publications-error rounded-2xl border p-4 text-sm font-medium"
          >
            {erro}
          </div>
        )}

        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="publications-card publications-subtle rounded-2xl p-6 text-sm"
          >
            {t("loading")}
          </div>
        )}

        {!loading && publicacoes.length === 0 && (
          <div className="publications-empty rounded-2xl border border-dashed p-8 text-sm shadow-sm">
            {t("empty")}
          </div>
        )}

        {!loading && publicacoes.length > 0 && (
          <div className="grid gap-4">
            {publicacoes.map((item) => {
              const processando =
                publicandoId === item.id || devolvendoId === item.id;

              return (
                <article
                  key={item.id}
                  className="publications-card rounded-3xl p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <span className={classeDoStatus(item.status)}>
                          {traduzirStatus(item.status)}
                        </span>

                        <h2 className="publications-title mt-3 break-words text-xl font-black">
                          {item.titulo}
                        </h2>
                      </div>

                      {item.descricao && (
                        <p className="publications-description max-w-3xl whitespace-pre-wrap break-words text-sm leading-6">
                          {item.descricao}
                        </p>
                      )}

                      <div className="publications-details grid gap-2 text-sm md:grid-cols-2">
                        <p>
                          <strong className="publications-strong">
                            {t("fields.teacher")}:
                          </strong>{" "}
                          {item.professorResponsavel?.nome || "-"}
                        </p>

                        <p>
                          <strong className="publications-strong">
                            {t("fields.class")}:
                          </strong>{" "}
                          {item.turma?.nome || "-"}
                        </p>

                        <p>
                          <strong className="publications-strong">
                            {t("fields.subject")}:
                          </strong>{" "}
                          {item.disciplina?.nome || "-"}
                        </p>

                        <p>
                          <strong className="publications-strong">
                            {t("fields.deadline")}:
                          </strong>{" "}
                          {formatarData(item.prazo)}
                        </p>

                        <p>
                          <strong className="publications-strong">
                            {t("fields.maximumGrade")}:
                          </strong>{" "}
                          {item.notaMaxima}
                        </p>

                        <p>
                          <strong className="publications-strong">
                            {t("fields.sentAt")}:
                          </strong>{" "}
                          {formatarData(item.enviadoParaApoioDocenteEm)}
                        </p>
                      </div>

                      {item.anexos && item.anexos.length > 0 && (
                        <div className="publication-attachments rounded-2xl p-4">
                          <p className="publications-title text-sm font-bold">
                            {t("attachments")}
                          </p>

                          <div className="mt-3 space-y-2">
                            {item.anexos.map((anexo) => (
                              <a
                                key={anexo.id}
                                href={anexo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="publication-attachment break-words rounded-xl px-4 py-3 text-sm font-medium"
                              >
                                {anexo.titulo ||
                                  anexo.arquivoNome ||
                                  t("attachmentFallback")}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-[220px] flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => void publicarAtividade(item.id)}
                        disabled={processando}
                        className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {publicandoId === item.id
                          ? t("actions.publishing")
                          : t("actions.publish")}
                      </button>

                      <button
                        type="button"
                        onClick={() => void devolverAtividade(item.id)}
                        disabled={processando}
                        className="publication-return-button rounded-2xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {devolvendoId === item.id
                          ? t("actions.returning")
                          : t("actions.return")}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}