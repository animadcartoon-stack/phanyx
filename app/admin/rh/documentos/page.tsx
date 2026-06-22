"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

function formatarData(data?: string | null) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
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

function pontuarDocumento(documento: DocumentoRH, termoBusca: string) {
  const termo = normalizarTexto(termoBusca);

  if (!termo) return 0;

  const campos = [
    documento.funcionario?.nome,
    documento.funcionario?.cargo,
    documento.titulo,
    documento.tipo,
    documento.status,
    documento.dataDocumento,
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
      pontuacao: pontuarDocumento(documento, termo),
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
}, [documentos, busca]);

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
        pontuarDocumento(documento, termo) > 35
      );
    })
    .sort((a, b) => {
      if (!termo) {
        return normalizarTexto(a.funcionario?.nome).localeCompare(
          normalizarTexto(b.funcionario?.nome)
        );
      }

      return pontuarDocumento(b, termo) - pontuarDocumento(a, termo);
    });
}, [documentos, busca, filtroStatus, filtroTipo]);

  async function arquivarDocumento() {
    if (!documentoParaArquivar) return;

    try {
      setArquivando(true);

      const res = await fetch("/api/admin/rh/documentos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentoId: documentoParaArquivar.id,
          motivoArquivo,
        }),
      });

      const dados = await res.json();

      if (!res.ok) {
        throw new Error(dados?.error || "Erro ao arquivar documento.");
      }

      setDocumentoParaArquivar(null);
      setMotivoArquivo("");
      await carregarDocumentos();
    } finally {
      setArquivando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
        RH EMPRESARIAL
      </p>

      <h1 className="mt-2 text-4xl font-black text-white">
        Documentos RH
      </h1>

      <p className="mt-2 text-slate-400">
        Dossiê documental dos funcionários, preservado para auditoria,
        compliance e histórico permanente.
      </p>
    </div>

    <Link
      href="/admin/rh/documentos/gerar"
      className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-blue-500"
    >
      + Novo Documento RH
    </Link>
  </div>

  <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
    <div className="relative">
  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
    Busca inteligente
  </label>

  <input
    value={busca}
    onChange={(e) => {
      setBusca(e.target.value);
      setMostrarSugestoes(true);
    }}
    onFocus={() => setMostrarSugestoes(true)}
    placeholder="Busque por funcionário, título, tipo, status ou cargo. Ex.: Jose, declaraçao, secretaria..."
    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
  />

  {mostrarSugestoes && busca.trim() && sugestoesBusca.length > 0 && (
    <div className="absolute left-0 right-0 top-[76px] z-50 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
      {sugestoesBusca.map(({ documento }) => (
        <button
          key={documento.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setBusca(documento.funcionario?.nome || documento.titulo || "");
            setMostrarSugestoes(false);
          }}
          className="block w-full border-b border-slate-800 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-800"
        >
          <div className="text-sm font-bold text-white">
            {documento.funcionario?.nome || "-"}
          </div>

          <div className="mt-1 text-xs text-slate-400">
            {documento.titulo} • {documento.tipo} • {documento.status}
          </div>
        </button>
      ))}
    </div>
  )}

  {mostrarSugestoes && busca.trim() && sugestoesBusca.length === 0 && (
    <div className="absolute left-0 right-0 top-[76px] z-50 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-400 shadow-2xl">
      Nenhum documento encontrado.
    </div>
  )}
</div>

    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        Status
      </label>

      <select
        value={filtroStatus}
        onChange={(e) => setFiltroStatus(e.target.value)}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
      >
        <option value="">Todos</option>
        <option value="GERADO">Gerado</option>
        <option value="ASSINADO">Assinado</option>
        <option value="PENDENTE">Pendente</option>
      </select>
    </div>

    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        Tipo
      </label>

      <select
        value={filtroTipo}
        onChange={(e) => setFiltroTipo(e.target.value)}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
      >
        <option value="">Todos</option>
        <option value="DECLARACAO">Declaração</option>
        <option value="ADVERTENCIA">Advertência</option>
        <option value="SUSPENSAO">Suspensão</option>
        <option value="TERMO_RESPONSABILIDADE">Termo responsabilidade</option>
        <option value="TERMO_RECEBIMENTO">Termo recebimento</option>
        <option value="AVALIACAO_DESEMPENHO">Avaliação desempenho</option>
        <option value="DOCUMENTO_LIVRE">Documento livre</option>
      </select>
    </div>
  </div>
</div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-bold text-white">
          Documentos gerados
        </h2>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-800">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
                <th className="p-3">Funcionário</th>
                <th className="p-3">Título</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Criado em</th>
                <th className="p-3">Criado por</th>
                <th className="p-3">Status</th>
                <th className="p-3">Arquivo</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    Carregando...
                  </td>
                </tr>
              ) : documentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    Nenhum documento RH gerado ainda.
                  </td>
                </tr>
              ) : (
                documentosFiltrados.map((documento) => (
                  <tr key={documento.id} className="border-b border-slate-800">
                    <td className="p-3 text-white">
                      {documento.funcionario?.nome || "-"}
                    </td>

                    <td className="p-3 text-slate-300">
                      {documento.titulo}
                    </td>

                    <td className="p-3 text-slate-300">
                      {documento.tipo}
                    </td>

                    <td className="p-3 text-slate-300">
  {formatarData(documento.criadoEm)}
</td>

<td className="p-3 text-slate-300">
  {documento.criadoPor?.nome || documento.criadoPor?.email || "-"}
</td>

<td className="p-3 text-slate-300">
  {documento.status}
</td>

<td className="p-3">
  {documento.arquivoUrl ? (
    <a
      href={documento.arquivoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl border border-blue-500 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500 hover:text-white"
    >
      Abrir
    </a>
  ) : (
    <span className="text-slate-500">-</span>
  )}
</td>

<td className="p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDocumentoParaArquivar(documento);
                          setMotivoArquivo("");
                        }}
                        className="rounded-xl border border-amber-500 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500 hover:text-white"
                      >
                        Arquivar
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">
              Arquivar documento RH
            </h2>

            <p className="mt-3 text-sm text-slate-300">
              Este documento não será excluído. Ele ficará preservado para
              auditoria e poderá ser restaurado depois.
            </p>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">
              <p>
                <strong>Documento:</strong>{" "}
                {documentoParaArquivar.titulo}
              </p>

              <p className="mt-2">
                <strong>Funcionário:</strong>{" "}
                {documentoParaArquivar.funcionario?.nome || "-"}
              </p>
            </div>

            <label className="mt-5 block text-xs font-bold uppercase text-slate-300">
              Motivo do arquivamento
            </label>

            <textarea
              value={motivoArquivo}
              onChange={(e) => setMotivoArquivo(e.target.value)}
              className="mt-2 min-h-28 w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm text-white outline-none focus:border-amber-500"
              placeholder="Explique por que este documento está sendo arquivado."
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDocumentoParaArquivar(null)}
                disabled={arquivando}
                className="rounded-2xl border border-slate-600 px-5 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={arquivarDocumento}
                disabled={arquivando || !motivoArquivo.trim()}
                className="rounded-2xl bg-amber-600 px-5 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {arquivando ? "Arquivando..." : "Arquivar documento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}