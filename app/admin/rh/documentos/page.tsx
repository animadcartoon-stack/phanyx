"use client";

import { useEffect, useState } from "react";

type DocumentoRH = {
  id: number;
  tipo: string;
  titulo: string;
  status: string;
  dataDocumento: string;
  motivoArquivo?: string | null;
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

export default function DocumentosRHPage() {
  const [documentos, setDocumentos] = useState<DocumentoRH[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [documentoParaArquivar, setDocumentoParaArquivar] =
    useState<DocumentoRH | null>(null);
  const [motivoArquivo, setMotivoArquivo] = useState("");
  const [arquivando, setArquivando] = useState(false);

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
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
          RH EMPRESARIAL
        </p>

        <h1 className="mt-2 text-4xl font-black text-white">
          Documentos RH
        </h1>

        <p className="mt-2 text-slate-400">
          Documentos funcionais gerados e preservados com auditoria.
        </p>
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
                <th className="p-3">Data</th>
                <th className="p-3">Status</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    Carregando...
                  </td>
                </tr>
              ) : documentos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    Nenhum documento RH gerado ainda.
                  </td>
                </tr>
              ) : (
                documentos.map((documento) => (
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
                      {formatarData(documento.dataDocumento)}
                    </td>

                    <td className="p-3 text-slate-300">
                      {documento.status}
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