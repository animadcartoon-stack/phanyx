"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

type AtividadeDetalhe = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  status: string;
  notaMaxima: number;
  disciplinaNome?: string;
  turmaNome?: string | null;
};

export default function AlunoAtividadeDetalhePage() {
  const params = useParams<{ atividadeId: string }>();
  const locale = useLocale();
  const t = useTranslations("StudentActivityDetail");

  const atividadeId = params.atividadeId;

  const [atividade, setAtividade] = useState<AtividadeDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [texto, setTexto] = useState("");
  const [link, setLink] = useState("");
  const [arquivoUrl, setArquivoUrl] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    async function carregarAtividade() {
      try {
        setLoading(true);
        setErro("");

        const res = await fetch("/api/aluno/atividades", {
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          console.error("Erro da API ao carregar atividade:", json?.error);
          throw new Error(t("errors.load"));
        }

        const encontrada = (json.items || []).find(
          (item: AtividadeDetalhe) =>
            String(item.id) === String(atividadeId)
        );

        if (!encontrada) {
          throw new Error(t("errors.notFound"));
        }

        setAtividade(encontrada);
      } catch (error) {
        console.error("Erro ao carregar atividade:", error);
        setErro(
          error instanceof Error ? error.message : t("errors.load")
        );
      } finally {
        setLoading(false);
      }
    }

    if (atividadeId) {
      carregarAtividade();
    }
  }, [atividadeId, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSalvando(true);
      setMensagem("");
      setErro("");

      const res = await fetch(
        `/api/aluno/atividades/${atividadeId}/entregar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            texto,
            link,
            arquivoUrl,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        console.error("Erro da API ao enviar atividade:", json?.error);
        throw new Error(t("errors.submit"));
      }

      setMensagem(t("submission.success"));
    } catch (error) {
      console.error("Erro ao enviar atividade:", error);
      setErro(
        error instanceof Error ? error.message : t("errors.submit")
      );
    } finally {
      setSalvando(false);
    }
  }

  function formatarData(data?: string | null) {
    if (!data) return t("noDeadline");

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
      return data;
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(dataConvertida);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Link
            href="/aluno/atividades"
            className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            ← {t("back")}
          </Link>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {t("loading")}
          </div>
        )}

        {!loading && erro && !atividade && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          >
            {erro}
          </div>
        )}

        {!loading && atividade && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="space-y-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {atividade.titulo}
                </h1>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {atividade.disciplinaNome && (
                    <span>
                      <strong className="font-medium text-slate-800 dark:text-slate-100">
                        {t("labels.subject")}:
                      </strong>{" "}
                      {atividade.disciplinaNome}
                    </span>
                  )}

                  <span>
                    <strong className="font-medium text-slate-800 dark:text-slate-100">
                      {t("labels.deadline")}:
                    </strong>{" "}
                    {formatarData(atividade.prazo)}
                  </span>

                  <span>
                    <strong className="font-medium text-slate-800 dark:text-slate-100">
                      {t("labels.maximumScore")}:
                    </strong>{" "}
                    {atividade.notaMaxima}
                  </span>

                  {atividade.turmaNome && (
                    <span>
                      <strong className="font-medium text-slate-800 dark:text-slate-100">
                        {t("labels.class")}:
                      </strong>{" "}
                      {atividade.turmaNome}
                    </span>
                  )}
                </div>

                {atividade.descricao && (
                  <p className="whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {atividade.descricao}
                  </p>
                )}
              </div>
            </section>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t("submission.title")}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {t("submission.description")}
                </p>
              </div>

              {mensagem && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                >
                  {mensagem}
                </div>
              )}

              {erro && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
                >
                  {erro}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="texto-entrega"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {t("submission.textLabel")}
                </label>
                <textarea
                  id="texto-entrega"
                  value={texto}
                  onChange={(event) => setTexto(event.target.value)}
                  rows={6}
                  placeholder={t("submission.textPlaceholder")}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="link-entrega"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {t("submission.linkLabel")}
                </label>
                <input
                  id="link-entrega"
                  type="url"
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="arquivo-entrega"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {t("submission.fileUrlLabel")}
                </label>
                <input
                  id="arquivo-entrega"
                  type="url"
                  value={arquivoUrl}
                  onChange={(event) => setArquivoUrl(event.target.value)}
                  placeholder={t("submission.fileUrlPlaceholder")}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {salvando
                    ? t("submission.submitting")
                    : t("submission.submit")}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
