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
      const res = await fetch("/api/admin/rh/documentos", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          funcionarioId: Number(funcionarioId),
          tipo,
          titulo,
          conteudo,
        }),
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
    } catch {
      setErro("Erro ao gerar documento RH.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-400">
          RH Empresarial
        </p>

        <h1 className="mt-2 text-4xl font-black text-white">
          Gerar Documento RH
        </h1>

        <p className="mt-2 text-slate-300">
          Crie documentos funcionais preservados com auditoria.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/admin/rh/documentos"
          className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-slate-800"
        >
          ← Voltar para documentos
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-xl">
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
            className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando ? "Gerando..." : "Gerar documento RH"}
          </button>
        </div>
      </div>
    </div>
  );
}