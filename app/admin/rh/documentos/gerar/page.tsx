"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Funcionario = {
  id: number;
  nome: string;
  cargo?: string | null;
  setor?: string | null;
};

const tiposDocumento = [
  "ADVERTENCIA",
  "SUSPENSAO",
  "DECLARACAO",
  "TERMO_RESPONSABILIDADE",
  "TERMO_RECEBIMENTO",
  "AVALIACAO_DESEMPENHO",
  "DOCUMENTO_LIVRE",
];

export default function GerarDocumentoRHPage() {
  const t = useTranslations("AdminHRDocuments");

  function tipoLabel(value: string) {
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
  }
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcionarioId, setFuncionarioId] = useState("");
  const [tipo, setTipo] = useState("DECLARACAO");
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [arquivoUrl, setArquivoUrl] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarFuncionarios() {
      try {
        const res = await fetch("/api/admin/funcionarios", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await res.json();

        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data.funcionarios)
          ? data.funcionarios
          : [];

        setFuncionarios(lista);
      } catch {
        setFuncionarios([]);
      }
    }

    carregarFuncionarios();
  }, []);

  async function salvarDocumento() {
    setMensagem("");
    setErro("");

    if (!funcionarioId) {
      setErro(t("selectEmployeeError"));
      return;
    }

    if (!titulo.trim()) {
      setErro(t("titleRequired"));
      return;
    }

    if (!conteudo.trim()) {
      setErro(t("contentRequired"));
      return;
    }

    setSalvando(true);

    try {
      const formData = new FormData();

formData.append("funcionarioId", funcionarioId);
formData.append("tipo", tipo);
formData.append("titulo", titulo);
formData.append("conteudo", conteudo);
formData.append("arquivoUrl", arquivoUrl);

if (arquivo) {
  formData.append("arquivo", arquivo);
}

const res = await fetch("/api/admin/rh/documentos", {
  method: "POST",
  credentials: "include",
  body: formData,
});

      if (!res.ok) {
        setErro(t("generateError"));
        return;
      }

      setMensagem(t("generateSuccess"));
      setFuncionarioId("");
      setTipo("DECLARACAO");
      setTitulo("");
      setConteudo("");
      setArquivoUrl("");
      setArquivo(null);
    } catch {
      setErro(t("generateError"));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="phanyx-rh-documentos-gerar-page mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-700 dark:text-cyan-400">
          {t("brand")}
        </p>

        <h1 className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
  {t("generateTitle")}
</h1>

        <p className="mt-2 text-slate-700 dark:text-slate-300">
  {t("generateDescription")}
</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
  href="/admin/rh/documentos"
  className="phanyx-rh-back-action"
>
  ← {t("backToDocuments")}
</Link>
      </div>

      <div className="phanyx-rh-documentos-gerar-card rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-white">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              {t("employee")}
            </label>

            <select
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none focus:border-blue-500"
            >
              <option value="">{t("select")}</option>

              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                  {f.cargo ? ` — ${f.cargo}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              {t("documentType")}
            </label>

            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none focus:border-blue-500"
            >
              {tiposDocumento.map((item) => (
                <option key={item} value={item}>
                  {tipoLabel(item)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
            {t("documentTitle")}
          </label>

          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder={t("titlePlaceholder")}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500"
          />
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
            {t("content")}
          </label>

          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={12}
            placeholder={t("contentPlaceholder")}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500"
          />
        </div>

<div className="mt-5">
  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
    {t("fileUrl")}
  </label>

<div className="mt-5">
  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
    {t("attachFile")}
  </label>

  <input
    type="file"
    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
    onChange={(e) => setArquivo(e.target.files?.[0] || null)}
    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-500"
  />

  {arquivo && (
    <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
      {t("selectedFile", { name: arquivo.name })}
    </p>
  )}

  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
    {t("formatsHelp")}
  </p>
</div>

  <input
    value={arquivoUrl}
    onChange={(e) => setArquivoUrl(e.target.value)}
    placeholder={t("fileUrlPlaceholder")}
    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500"
  />

  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
    {t("fileUrlHelp")}
  </p>
</div>

        {erro && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800 dark:border-red-500/40 dark:bg-red-950/50 dark:text-red-200">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/50 dark:text-emerald-200">
            {mensagem}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
  type="button"
  onClick={salvarDocumento}
  disabled={salvando}
  className="phanyx-rh-primary-action"
>
  {salvando ? t("generating") : t("generate")}
</button>
        </div>
      </div>
    </div>
  );
}
