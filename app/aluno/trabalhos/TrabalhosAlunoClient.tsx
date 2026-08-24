"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";

type AtividadeAluno = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  status?: string | null;
  notaMaxima?: number | null;
  disciplinaNome?: string | null;
  turmaNome?: string | null;
  anexos?: {
    id: number;
    titulo: string;
    url: string;
    arquivoNome?: string | null;
    mimeType?: string | null;
  }[];
  entrega?: {
    id?: number;
    texto?: string | null;
    link?: string | null;
    arquivoUrl?: string | null;
    entregueEm?: string | null;
    nota?: number | null;
    feedback?: string | null;
    corrigidaEm?: string | null;
  } | null;
};

type RespostaAtividadesApi = {
  ok: boolean;
  total: number;
  items: AtividadeAluno[];
};

type RespostaUploadUrlApi = {
  ok?: boolean;
  uploadUrl?: string;
  arquivoUrl?: string;
};

const LIMITE_ARQUIVO_BYTES = 500 * 1024 * 1024;

export default function TrabalhosAlunoClient() {
  const t = useTranslations("StudentAssignments");
  const locale = useLocale();
  const inputArquivoId = useId();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [atividades, setAtividades] = useState<AtividadeAluno[]>([]);
  const [atividadeId, setAtividadeId] = useState("");
  const [texto, setTexto] = useState("");
  const [link, setLink] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  const carregarAtividades = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");

      const response = await fetch("/api/aluno/atividades", {
        credentials: "include",
        cache: "no-store",
      });

      const data = (await response.json().catch(() => null)) as
        | RespostaAtividadesApi
        | null;

      if (!response.ok || !Array.isArray(data?.items)) {
        throw new Error(t("errors.load"));
      }

      setAtividades(data.items);
    } catch (error) {
      console.error("Failed to load student assignments:", error);
      setErro(t("errors.load"));
      setAtividades([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void carregarAtividades();
  }, [carregarAtividades]);

  const atividadeSelecionada = useMemo(
    () =>
      atividades.find(
        (atividade) => String(atividade.id) === String(atividadeId)
      ) ?? null,
    [atividades, atividadeId]
  );

  useEffect(() => {
    if (!atividadeSelecionada) {
      setTexto("");
      setLink("");
      setArquivo(null);
      return;
    }

    setTexto(atividadeSelecionada.entrega?.texto ?? "");
    setLink(atividadeSelecionada.entrega?.link ?? "");
    setArquivo(null);
  }, [atividadeSelecionada]);

  const prazoEncerrado = Boolean(
    atividadeSelecionada?.prazo &&
      Date.now() > new Date(atividadeSelecionada.prazo).getTime()
  );

  function formatarData(data?: string | null) {
    if (!data) return t("noDeadline");

    const valor = new Date(data);
    if (Number.isNaN(valor.getTime())) return data;

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(valor);
  }

  function obterSituacaoPrazo(prazoOriginal?: string | null) {
    if (!prazoOriginal) return null;

    const prazo = new Date(prazoOriginal);
    if (Number.isNaN(prazo.getTime())) return null;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    prazo.setHours(0, 0, 0, 0);

    const dias = Math.ceil((prazo.getTime() - hoje.getTime()) / 86400000);

    if (dias < 0) {
      return {
        texto: `❌ ${t("deadlineClosed")}`,
        classe: "text-red-700 dark:text-red-300",
      };
    }

    if (dias === 0) {
      return {
        texto: `⚠️ ${t("dueToday")}`,
        classe: "text-amber-700 dark:text-amber-300",
      };
    }

    return {
      texto: `⏳ ${t("daysRemaining", { count: dias })}`,
      classe: "text-emerald-700 dark:text-emerald-300",
    };
  }

  async function handleEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      if (!atividadeId) {
        throw new Error(t("errors.selectAssignment"));
      }

      if (!texto.trim() && !link.trim() && !arquivo) {
        throw new Error(t("errors.answerRequired"));
      }

      let arquivoUrl = atividadeSelecionada?.entrega?.arquivoUrl ?? "";

      if (arquivo) {
        if (arquivo.size > LIMITE_ARQUIVO_BYTES) {
          throw new Error(t("errors.fileTooLarge"));
        }

        const responseUploadUrl = await fetch(
          `/api/aluno/atividades/${atividadeId}/upload-url`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nomeOriginal: arquivo.name,
              mimeType: arquivo.type || "application/octet-stream",
              tamanho: arquivo.size,
            }),
          }
        );

        const uploadData = (await responseUploadUrl.json().catch(() => null)) as
          | RespostaUploadUrlApi
          | null;

        if (
          !responseUploadUrl.ok ||
          !uploadData?.uploadUrl ||
          !uploadData?.arquivoUrl
        ) {
          throw new Error(t("errors.prepareUpload"));
        }

        const responseUpload = await fetch(uploadData.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": arquivo.type || "application/octet-stream",
          },
          body: arquivo,
        });

        if (!responseUpload.ok) {
          throw new Error(
            t("errors.upload", { status: responseUpload.status })
          );
        }

        arquivoUrl = uploadData.arquivoUrl;
      }

      const response = await fetch(
        `/api/aluno/atividades/${atividadeId}/entregar`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto, link, arquivoUrl }),
        }
      );

      if (!response.ok) {
        throw new Error(t("errors.submit"));
      }

      setMensagem(t("success"));
      setTexto("");
      setLink("");
      setArquivo(null);
      await carregarAtividades();
    } catch (error) {
      setErro(error instanceof Error ? error.message : t("errors.submit"));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t("description")}
        </p>
      </section>

      {loading && (
        <div
          aria-live="polite"
          className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          {t("loading")}
        </div>
      )}

      {!loading && erro && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-950 shadow-sm dark:border-red-800 dark:bg-red-950/40 dark:text-red-100"
        >
          <p>{erro}</p>
          {atividades.length === 0 && (
            <button
              type="button"
              onClick={() => void carregarAtividades()}
              className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {t("retry")}
            </button>
          )}
        </div>
      )}

      {!loading && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                {t("publishedAssignments")}
              </h2>
              <span className="aluno-pill-legivel inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900 dark:bg-blue-950/60 dark:text-blue-200">
                {t("assignmentCount", { count: atividades.length })}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {atividades.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300">
                  {t("empty")}
                </div>
              ) : (
                atividades.map((atividade) => {
                  const selecionada =
                    String(atividade.id) === String(atividadeId);
                  const situacaoPrazo = obterSituacaoPrazo(atividade.prazo);
                  const encerrada = Boolean(
                    atividade.prazo &&
                      Date.now() > new Date(atividade.prazo).getTime()
                  );

                  return (
                    <article
                      key={atividade.id}
                      className={`rounded-2xl border p-5 transition ${
                        selecionada
                          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
                          : "border-slate-200 bg-white hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-600"
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <button
                          type="button"
                          onClick={() => setAtividadeId(String(atividade.id))}
                          aria-pressed={selecionada}
                          className="min-w-0 flex-1 text-left"
                        >
                          <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                            {atividade.titulo}
                          </h3>

                          <div className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                            <p>
                              <strong className="font-semibold text-slate-950 dark:text-white">
                                {t("subject")}:
                              </strong>{" "}
                              {atividade.disciplinaNome || t("notInformed")}
                            </p>
                            <p>
                              <strong className="font-semibold text-slate-950 dark:text-white">
                                {t("classLabel")}:
                              </strong>{" "}
                              {atividade.turmaNome || t("notInformed")}
                            </p>
                            <p>
                              <strong className="font-semibold text-slate-950 dark:text-white">
                                {t("deadline")}:
                              </strong>{" "}
                              {formatarData(atividade.prazo)}
                            </p>
                            {situacaoPrazo && (
                              <p className={`font-semibold ${situacaoPrazo.classe}`}>
                                {situacaoPrazo.texto}
                              </p>
                            )}
                            <p>
                              <strong className="font-semibold text-slate-950 dark:text-white">
                                {t("maximumGrade")}:
                              </strong>{" "}
                              {atividade.notaMaxima ?? 10}
                            </p>
                          </div>

                          {atividade.descricao && (
                            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                              {atividade.descricao}
                            </p>
                          )}

                          {atividade.entrega ? (
                            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                              ✔ {t("delivered")}
                            </div>
                          ) : encerrada ? (
                            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-950 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                              ❌ {t("deadlineClosed")}
                            </div>
                          ) : (
                            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-950 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                              📤 {t("awaitingSubmission")}
                            </div>
                          )}
                        </button>

                        <Link
                          href={`/aluno/trabalhos/${atividade.id}/entrega`}
                          className="inline-flex shrink-0 justify-center rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          {atividade.entrega
                            ? t("viewSubmission")
                            : encerrada
                              ? t("viewAssignment")
                              : t("answerAssignment")}
                        </Link>
                      </div>

                      {atividade.anexos && atividade.anexos.length > 0 && (
                        <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                          <p className="text-sm font-semibold text-slate-950 dark:text-white">
                            📎 {t("attachmentCount", { count: atividade.anexos.length })}
                          </p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {t("assignmentFiles")}
                          </p>
                          {atividade.anexos.map((anexo) => (
                            <a
                              key={anexo.id}
                              href={anexo.url}
                              target="_blank"
                              rel="noreferrer"
                              className="aluno-link-anexo-contraste block rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-950/70"
                            >
                              📎 {anexo.arquivoNome || anexo.titulo}
                            </a>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>

          <form
            onSubmit={handleEnviar}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                {t("sendSubmission")}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t("sendDescription")}
              </p>
            </div>

            {mensagem && (
              <div
                role="status"
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
              >
                {mensagem}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="atividade-aluno"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                {t("assignment")}
              </label>
              <select
                id="atividade-aluno"
                value={atividadeId}
                onChange={(event) => setAtividadeId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
              >
                <option value="">{t("selectAssignment")}</option>
                {atividades.map((atividade) => (
                  <option key={atividade.id} value={atividade.id}>
                    {atividade.titulo} — {atividade.disciplinaNome}
                  </option>
                ))}
              </select>
            </div>

            {atividadeSelecionada && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                <p>
                  <strong className="font-semibold text-slate-950 dark:text-white">
                    {t("subject")}:
                  </strong>{" "}
                  {atividadeSelecionada.disciplinaNome || t("notInformed")}
                </p>
                <p className="mt-1">
                  <strong className="font-semibold text-slate-950 dark:text-white">
                    {t("deadline")}:
                  </strong>{" "}
                  {formatarData(atividadeSelecionada.prazo)}
                </p>

                {atividadeSelecionada.anexos &&
                  atividadeSelecionada.anexos.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {t("assignmentFiles")}
                      </p>
                      {atividadeSelecionada.anexos.map((anexo) => (
                        <a
                          key={anexo.id}
                          href={anexo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="aluno-link-anexo-contraste block rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-semibold text-blue-900 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                        >
                          📎 {anexo.arquivoNome || anexo.titulo}
                        </a>
                      ))}
                    </div>
                  )}

                {atividadeSelecionada.entrega && (
                  <div className="mt-4 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
                    <p className="font-semibold">{t("alreadySubmitted")}</p>

                    {atividadeSelecionada.entrega.texto && (
                      <p>
                        <strong>{t("textLabel")}:</strong>{" "}
                        {atividadeSelecionada.entrega.texto}
                      </p>
                    )}
                    {atividadeSelecionada.entrega.link && (
                      <p>
                        <strong>{t("linkLabel")}:</strong>{" "}
                        <a
                          href={atividadeSelecionada.entrega.link}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-blue-700 underline dark:text-blue-300"
                        >
                          {atividadeSelecionada.entrega.link}
                        </a>
                      </p>
                    )}
                    {atividadeSelecionada.entrega.arquivoUrl && (
                      <p>
                        <strong>{t("fileLabel")}:</strong>{" "}
                        <a
                          href={atividadeSelecionada.entrega.arquivoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-blue-700 underline dark:text-blue-300"
                        >
                          {t("viewSubmittedFile")}
                        </a>
                      </p>
                    )}

                    <div className="mt-4 border-t border-emerald-200 pt-4 dark:border-emerald-800">
                      <p className="mb-2">
                        <strong>{t("statusLabel")}:</strong>{" "}
                        {atividadeSelecionada.entrega.nota != null ? (
                          <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                            {t("corrected")}
                          </span>
                        ) : (
                          <span className="font-semibold text-amber-800 dark:text-amber-200">
                            {t("submitted")}
                          </span>
                        )}
                      </p>

                      {atividadeSelecionada.entrega.nota != null && (
                        <p className="mb-2">
                          <strong>{t("gradeLabel")}:</strong>{" "}
                          <span className="font-bold text-blue-700 dark:text-blue-300">
                            {atividadeSelecionada.entrega.nota}
                          </span>
                          {atividadeSelecionada.notaMaxima != null && (
                            <span className="text-slate-700 dark:text-slate-300">
                              {" "}/ {atividadeSelecionada.notaMaxima}
                            </span>
                          )}
                        </p>
                      )}

                      {atividadeSelecionada.entrega.feedback && (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                          <p className="mb-1 font-semibold text-slate-950 dark:text-white">
                            {t("teacherFeedback")}
                          </p>
                          <p className="whitespace-pre-line text-slate-700 dark:text-slate-300">
                            {atividadeSelecionada.entrega.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {prazoEncerrado && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-950 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100">
                    {t("closedEditMessage")}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="texto-entrega"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                {t("textLabel")}
              </label>
              <textarea
                id="texto-entrega"
                value={texto}
                onChange={(event) => setTexto(event.target.value)}
                rows={5}
                disabled={prazoEncerrado}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                placeholder={t("textPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="link-entrega"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                {t("linkLabel")}
              </label>
              <input
                id="link-entrega"
                type="url"
                value={link}
                onChange={(event) => setLink(event.target.value)}
                disabled={prazoEncerrado}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                placeholder="https://"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                {t("fileLabel")}
              </span>
              <label
                htmlFor={inputArquivoId}
                className={`phanyx-botao-arquivo-aluno inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 ${
                  prazoEncerrado ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                }`}
              >
                {t("selectFile")}
              </label>
              <input
                id={inputArquivoId}
                type="file"
                className="sr-only"
                disabled={prazoEncerrado}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;

                  if (file && file.size > LIMITE_ARQUIVO_BYTES) {
                    setErro(t("errors.fileTooLarge"));
                    setArquivo(null);
                    event.currentTarget.value = "";
                    return;
                  }

                  setErro("");
                  setArquivo(file);
                }}
              />

              {arquivo && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t("selectedFile", { name: arquivo.name })}
                </p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("fileLimit")}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={salvando || prazoEncerrado}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {salvando
                  ? t("sending")
                  : atividadeSelecionada?.entrega
                    ? t("updateSubmission")
                    : t("sendAssignment")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}