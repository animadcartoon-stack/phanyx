"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

type DocumentoRH = {
  id: number;
  tipo: string;
  titulo: string;
  status: string;
  dataDocumento: string;

  criadoEm?: string;
  motivoArquivo?: string | null;
  arquivoUrl?: string | null;

  criadoPor?: {
    id?: number;
    nome?: string | null;
    email?: string | null;
  } | null;

  funcionario?: {
    nome?: string | null;
    cargo?: string | null;
  } | null;
};

function formatarData(data: string | null | undefined, locale: string) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(locale);
}

function normalizarTexto(texto?: string | null) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function distanciaLevenshtein(a: string, b: string) {
  const s = normalizarTexto(a);
  const t = normalizarTexto(b);

  if (!s) return t.length;
  if (!t) return s.length;

  const dp = Array.from({ length: s.length + 1 }, () =>
    Array(t.length + 1).fill(0)
  );

  for (let i = 0; i <= s.length; i++) dp[i][0] = i;
  for (let j = 0; j <= t.length; j++) dp[0][j] = j;

  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= t.length; j++) {
      const custo = s[i - 1] === t[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + custo
      );
    }
  }

  return dp[s.length][t.length];
}

function pontuarDocumento(documento: DocumentoRH, termoBusca: string, rotulos: string[] = []) {
  const termo = normalizarTexto(termoBusca);

  if (!termo) return 0;

  const campos = [
    documento.funcionario?.nome,
    documento.funcionario?.cargo,
    documento.titulo,
    documento.tipo,
    documento.status,
    documento.dataDocumento,
    ...rotulos,
  ]
    .filter(Boolean)
    .map((item) => normalizarTexto(item));

  const textoCompleto = campos.join(" ");

  if (textoCompleto.includes(termo)) return 1000;

  const palavras = textoCompleto.split(/\s+/).filter(Boolean);

  const menorDistancia = palavras.reduce((menor, palavra) => {
    return Math.min(menor, distanciaLevenshtein(termo, palavra));
  }, 999);

  return Math.max(0, 100 - menorDistancia * 12);
}

export default function DocumentosRHPage() {
  const t = useTranslations("AdminHRDocuments");
  const locale = useLocale();

  const tipoLabel = useCallback((value: string) => {
    switch (value) {
      case "DECLARACAO": return t("typeDeclaration");
      case "ADVERTENCIA": return t("typeWarning");
      case "SUSPENSAO": return t("typeSuspension");
      case "TERMO_RESPONSABILIDADE": return t("typeResponsibility");
      case "TERMO_RECEBIMENTO": return t("typeReceipt");
      case "AVALIACAO_DESEMPENHO": return t("typePerformance");
      case "DOCUMENTO_LIVRE": return t("typeFree");
      default: return value;
    }
  }, [t]);

  const statusLabel = useCallback((value: string) => {
    switch (value) {
      case "GERADO": return t("statusGenerated");
      case "ASSINADO": return t("statusSigned");
      case "PENDENTE": return t("statusPending");
      case "ARQUIVADO": return t("statusArchived");
      default: return value;
    }
  }, [t]);
  const [documentos, setDocumentos] = useState<DocumentoRH[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [documentoParaArquivar, setDocumentoParaArquivar] =
    useState<DocumentoRH | null>(null);
  const [motivoArquivo, setMotivoArquivo] = useState("");
  const [arquivando, setArquivando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [erroArquivo, setErroArquivo] = useState("");

  async function carregarDocumentos() {
    try {
      setCarregando(true);
      const res = await fetch("/api/admin/rh/documentos");
      const dados = await res.json();
      setDocumentos(Array.isArray(dados) ? dados : []);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDocumentos();
  }, []);

  const sugestoesBusca = useMemo(() => {
    const termo = busca.trim();

    if (!termo) return [];

    return documentos
      .map((documento) => ({
        documento,
        pontuacao: pontuarDocumento(documento, termo, [tipoLabel(documento.tipo), statusLabel(documento.status)]),
      }))
      .filter((item) => item.pontuacao > 35)
      .sort((a, b) => {
        if (b.pontuacao !== a.pontuacao) {
          return b.pontuacao - a.pontuacao;
        }

        return normalizarTexto(a.documento.funcionario?.nome).localeCompare(
          normalizarTexto(b.documento.funcionario?.nome)
        );
      })
      .slice(0, 8);
  }, [documentos, busca, tipoLabel, statusLabel]);

  const documentosFiltrados = useMemo(() => {
    const termo = busca.trim();

    return documentos
      .filter((documento) => documento.status !== "ARQUIVADO")
      .filter((documento) => {
        const bateStatus = !filtroStatus || documento.status === filtroStatus;
        const bateTipo = !filtroTipo || documento.tipo === filtroTipo;

        if (!termo) return bateStatus && bateTipo;

        return (
          bateStatus &&
          bateTipo &&
          pontuarDocumento(documento, termo, [tipoLabel(documento.tipo), statusLabel(documento.status)]) > 35
        );
      })
      .sort((a, b) => {
        if (!termo) {
          return normalizarTexto(a.funcionario?.nome).localeCompare(
            normalizarTexto(b.funcionario?.nome)
          );
        }

        return pontuarDocumento(b, termo, [tipoLabel(b.tipo), statusLabel(b.status)]) - pontuarDocumento(a, termo, [tipoLabel(a.tipo), statusLabel(a.status)]);
      });
  }, [documentos, busca, filtroStatus, filtroTipo, tipoLabel, statusLabel]);

  async function arquivarDocumento() {
    if (!documentoParaArquivar) return;

    try {
      setArquivando(true);
      setErroArquivo("");

      const res = await fetch("/api/admin/rh/documentos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentoId: documentoParaArquivar.id,
          motivoArquivo,
        }),
      });

      if (!res.ok) {
        throw new Error(t("archiveError"));
      }

      setDocumentoParaArquivar(null);
      setMotivoArquivo("");
      await carregarDocumentos();
    } catch {
      setErroArquivo(t("archiveError"));
    } finally {
      setArquivando(false);
    }
  }

  return (
    <div className="phanyx-rh-documentos-page space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700 dark:text-cyan-400">
              {t("brand")}
            </p>

            <h1 className="mt-2 text-4xl font-black text-[#020617] dark:text-white">
              {t("title")}
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {t("description")}
            </p>
          </div>

          <Link
            href="/admin/rh/documentos/gerar"
            className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-blue-500"
          >
            {t("newDocument")}
          </Link>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-400">
              {t("search")}
            </label>

            <input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setMostrarSugestoes(true);
              }}
              onFocus={() => setMostrarSugestoes(true)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
            />

            {mostrarSugestoes && busca.trim() && sugestoesBusca.length > 0 && (
              <div className="absolute left-0 right-0 top-[76px] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
                {sugestoesBusca.map(({ documento }) => (
                  <button
                    key={documento.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setBusca(documento.funcionario?.nome || documento.titulo || "");
                      setMostrarSugestoes(false);
                    }}
                    className="block w-full border-b border-slate-200 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {documento.funcionario?.nome || "-"}
                    </div>

                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {documento.titulo} • {tipoLabel(documento.tipo)} • {statusLabel(documento.status)}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {mostrarSugestoes && busca.trim() && sugestoesBusca.length === 0 && (
              <div className="absolute left-0 right-0 top-[76px] z-50 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                {t("noResults")}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-400">
              {t("status")}            </label>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">{t("all")}</option>
              <option value="GERADO">{t("statusGenerated")}</option>
              <option value="ASSINADO">{t("statusSigned")}</option>
              <option value="PENDENTE">{t("statusPending")}</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-400">
              {t("type")}            </label>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">{t("all")}</option>
              <option value="DECLARACAO">{t("typeDeclaration")}</option>
              <option value="ADVERTENCIA">{t("typeWarning")}</option>
              <option value="SUSPENSAO">{t("typeSuspension")}</option>
              <option value="TERMO_RESPONSABILIDADE">{t("typeResponsibility")}</option>
              <option value="TERMO_RECEBIMENTO">{t("typeReceipt")}</option>
              <option value="AVALIACAO_DESEMPENHO">{t("typePerformance")}</option>
              <option value="DOCUMENTO_LIVRE">{t("typeFree")}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t("generatedDocuments")}
        </h2>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-left text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                <th className="p-3">{t("employee")}</th>
                <th className="p-3">{t("documentTitle")}</th>
                <th className="p-3">{t("type")}</th>
                <th className="p-3">{t("createdAt")}</th>
                <th className="p-3">{t("createdBy")}</th>
                <th className="p-3">{t("status")}</th>
                <th className="p-3">{t("file")}</th>
                <th className="p-3">{t("actions")}</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-700 dark:text-slate-400">
                    {t("loading")}
                  </td>
                </tr>
              ) : documentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-700 dark:text-slate-400">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                documentosFiltrados.map((documento) => (
                  <tr key={documento.id} className="border-b border-slate-200 dark:border-slate-800">
                    <td className="p-3 text-slate-900 dark:text-white">
                      {documento.funcionario?.nome || "-"}
                    </td>

                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {documento.titulo}
                    </td>

                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {tipoLabel(documento.tipo)}
                    </td>

                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {formatarData(documento.criadoEm, locale)}
                    </td>

                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {documento.criadoPor?.nome || documento.criadoPor?.email || "-"}
                    </td>

                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {statusLabel(documento.status)}
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {documento.arquivoUrl ? (
                          <a
                            href={documento.arquivoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-blue-500 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 dark:text-white dark:hover:bg-blue-950/40"
                          >
                            {t("open")}
                          </a>
                        ) : (
                          <a
                            href={`/api/admin/rh/documentos/${documento.id}/imprimir`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-blue-500 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 dark:text-white dark:hover:bg-blue-950/40"
                          >
                            {t("open")}
                          </a>
                        )}

                        <a
                          href={`/api/admin/rh/documentos/${documento.id}/imprimir`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-emerald-500 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                        >
                          {t("print")}
                        </a>
                      </div>
                    </td>

                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDocumentoParaArquivar(documento);
                          setMotivoArquivo("");
                          setErroArquivo("");
                        }}
                        className="rounded-xl border border-amber-600 px-3 py-2 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500 hover:text-slate-900 dark:text-white"
                      >
                        {t("archive")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {documentoParaArquivar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className=" phanyx-rh-arquivar-modal
        w-full max-w-lg rounded-3xl
        border border-slate-200
        bg-white
        p-6
        shadow-2xl

        dark:border-slate-700
        dark:bg-slate-950
      "
          >
            <h2
              className="
          text-xl font-bold
          text-slate-950
          dark:text-white
        "
            >
              {t("archiveTitle")}
            </h2>

            <p
              className="
          mt-3 text-sm leading-6
          text-slate-600
          dark:text-slate-300
        "
            >
              {t("archiveDescription")}
            </p>

           <div
  className="
    phanyx-rh-arquivar-info
    mt-5 rounded-2xl border p-4 text-sm
  "
>
  <p>
    <strong className="text-slate-950 dark:text-white">
      {t("document")}:
    </strong>{" "}
    {documentoParaArquivar.titulo}
  </p>

  <p className="mt-2">
    <strong className="text-slate-950 dark:text-white">
      {t("employee")}:
    </strong>{" "}
    {documentoParaArquivar.funcionario?.nome || "-"}
  </p>
</div>

            <label
              className="
          mt-5 block
          text-xs font-bold uppercase
          tracking-wide
          text-slate-700
          dark:text-slate-300
        "
            >
              {t("archiveReason")}
            </label>

            <textarea
              value={motivoArquivo}
              onChange={(e) =>
                setMotivoArquivo(e.target.value)
              }
              className="
  phanyx-rh-arquivar-textarea
  mt-2 min-h-28 w-full
  rounded-2xl border p-4
  text-sm outline-none
"
              placeholder={t("archivePlaceholder")}
            />

            {erroArquivo && (
              <p role="alert" className="mt-3 text-sm font-medium text-red-700 dark:text-red-300">{erroArquivo}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDocumentoParaArquivar(null);
                  setErroArquivo("");
                }}
                disabled={arquivando}
                className="
  phanyx-rh-arquivar-cancelar
  rounded-2xl px-5 py-2
  text-sm font-bold
"
              >
                {t("cancel")}
              </button>

              <button
                type="button"
                onClick={arquivarDocumento}
                disabled={
                  arquivando ||
                  !motivoArquivo.trim()
                }
               className="
  phanyx-rh-arquivar-confirmar
  rounded-2xl px-5 py-2
  text-sm font-bold
"
              >
                {arquivando
                  ? t("archiving")
                  : t("archiveDocument")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
