"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
      setErro("Selecione um funcionário.");
      return;
    }

    if (!titulo.trim()) {
      setErro("Informe o título do documento.");
      return;
    }

    if (!conteudo.trim()) {
      setErro("Digite o conteúdo do documento.");
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

      const data = await res.json();

      if (!res.ok) {
        setErro(data?.error || "Não foi possível gerar o documento RH.");
        return;
      }

      setMensagem("Documento RH gerado com sucesso.");
      setFuncionarioId("");
      setTipo("DECLARACAO");
      setTitulo("");
      setConteudo("");
      setArquivoUrl("");
      setArquivo(null);
    } catch {
      setErro("Erro ao gerar documento RH.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="phanyx-rh-documentos-gerar-page mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-400">
          RH Empresarial
        </p>

        <h1 className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
  Gerar Documento RH
</h1>

        <p className="mt-2 text-slate-700 dark:text-slate-300">
  Crie documentos funcionais preservados com auditoria.
</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
  href="/admin/rh/documentos"
  className="phanyx-rh-back-action"
>
  ← Voltar para documentos
</Link>
      </div>

      <div className="phanyx-rh-documentos-gerar-card rounded-3xl border p-6 shadow-xl">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              Funcionário
            </label>

            <select
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              <option value="">Selecione</option>

              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                  {f.cargo ? ` — ${f.cargo}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-200">
              Tipo do documento
            </label>

            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              {tiposDocumento.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-bold text-slate-200">
            Título
          </label>

          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Declaração de vínculo empregatício"
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
          />
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-bold text-slate-200">
            Conteúdo
          </label>

          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={12}
            placeholder="Digite o conteúdo do documento RH..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
          />
        </div>

<div className="mt-5">
  <label className="mb-2 block text-sm font-bold text-slate-200">
    Arquivo URL
  </label>

<div className="mt-5">
  <label className="mb-2 block text-sm font-bold text-slate-200">
    Anexar arquivo
  </label>

  <input
    type="file"
    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
    onChange={(e) => setArquivo(e.target.files?.[0] || null)}
    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-500"
  />

  {arquivo && (
    <p className="mt-2 text-xs text-emerald-300">
      Arquivo selecionado: {arquivo.name}
    </p>
  )}

  <p className="mt-2 text-xs text-slate-400">
    Formatos aceitos: PDF, DOCX, PNG, JPG e JPEG. Limite atual: 50MB.
  </p>
</div>

  <input
    value={arquivoUrl}
    onChange={(e) => setArquivoUrl(e.target.value)}
    placeholder="Cole aqui o link do PDF, imagem ou documento anexado"
    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
  />

  <p className="mt-2 text-xs text-slate-400">
    Use este campo para anexar RG, CPF, CNH, comprovante, certificado, portfólio ou outro documento já hospedado.
  </p>
</div>

        {erro && (
          <div className="mt-5 rounded-2xl border border-red-500/40 bg-red-950/50 p-4 text-sm font-bold text-red-200">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-950/50 p-4 text-sm font-bold text-emerald-200">
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
  {salvando ? "Gerando..." : "Gerar documento RH"}
</button>
        </div>
      </div>
    </div>
  );
}