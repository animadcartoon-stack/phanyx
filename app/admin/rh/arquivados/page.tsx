"use client";

import { useEffect, useState } from "react";

type OcorrenciaArquivada = {
  id: number;
  tipo: string;
  motivo?: string | null;
  motivoArquivo?: string | null;
  arquivadaEm?: string | null;
  dataEvento?: string | null;
  status: string;
  funcionario?: {
    nome?: string | null;
    cargo?: string | null;
    codigoFuncionario?: string | null;
  } | null;
};

function formatarData(data?: string | null) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

export default function ArquivadosRHPage() {

    const [ocorrencias, setOcorrencias] = useState<OcorrenciaArquivada[]>([]);
const [carregando, setCarregando] = useState(true);
const [abaAtiva, setAbaAtiva] = useState("OCORRENCIAS");

useEffect(() => {
  async function carregarOcorrenciasArquivadas() {
    try {
      setCarregando(true);

      const res = await fetch(
        "/api/admin/rh/arquivados/ocorrencias"
      );

      if (!res.ok) {
        throw new Error(
          "Não foi possível carregar as ocorrências arquivadas."
        );
      }

      const dados = await res.json();

      setOcorrencias(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  }

  carregarOcorrenciasArquivadas();
}, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
          RH EMPRESARIAL
        </p>

        <h1 className="mt-2 text-4xl font-black text-white">
          Arquivados RH
        </h1>

        <p className="mt-2 text-slate-400">
          Registros preservados para auditoria, direção e compliance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
  <div className="rounded-3xl border border-cyan-800 bg-cyan-950/30 p-5">
    <p className="text-xs uppercase text-cyan-400">
      Ocorrências
    </p>

    <p className="mt-2 text-3xl font-black text-white">
      0
    </p>

    <p className="mt-1 text-xs text-slate-400">
      Arquivadas
    </p>
  </div>

  <div className="rounded-3xl border border-amber-800 bg-amber-950/30 p-5">
    <p className="text-xs uppercase text-amber-400">
      Holerites
    </p>

    <p className="mt-2 text-3xl font-black text-white">
      0
    </p>

    <p className="mt-1 text-xs text-slate-400">
      Arquivados
    </p>
  </div>

  <div className="rounded-3xl border border-emerald-800 bg-emerald-950/30 p-5">
    <p className="text-xs uppercase text-emerald-400">
      Férias
    </p>

    <p className="mt-2 text-3xl font-black text-white">
      0
    </p>

    <p className="mt-1 text-xs text-slate-400">
      Arquivadas
    </p>
  </div>

  <div className="rounded-3xl border border-purple-800 bg-purple-950/30 p-5">
    <p className="text-xs uppercase text-purple-400">
      Exames
    </p>

    <p className="mt-2 text-3xl font-black text-white">
      0
    </p>

    <p className="mt-1 text-xs text-slate-400">
      Arquivados
    </p>
  </div>
</div>

<div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
  <div className="flex flex-wrap gap-2">
    <button
  type="button"
  onClick={() => setAbaAtiva("OCORRENCIAS")}
  className={`rounded-2xl px-4 py-2 text-sm font-bold ${
    abaAtiva === "OCORRENCIAS"
      ? "bg-cyan-600 text-white"
      : "border border-slate-700 text-slate-300"
  }`}
>
  Ocorrências
</button>

    <button
  type="button"
  onClick={() => setAbaAtiva("HOLERITES")}
  className={`rounded-2xl px-4 py-2 text-sm font-bold ${
    abaAtiva === "HOLERITES"
      ? "bg-amber-600 text-white"
      : "border border-slate-700 text-slate-300"
  }`}
>
  Holerites
</button>

    <button className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300">
      Férias
    </button>

    <button className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300">
      Exames
    </button>

    <button className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300">
      Rescisões
    </button>

    <button className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300">
      Documentos RH
    </button>
  </div>

{abaAtiva !== "OCORRENCIAS" && (
  <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-8 text-center">
    <p className="text-lg font-bold text-white">
      {abaAtiva} em preparação
    </p>

    <p className="mt-2 text-sm text-slate-400">
      Esta aba será conectada aos registros arquivados do banco na próxima etapa.
    </p>
  </div>
)}

{abaAtiva === "OCORRENCIAS" && (
  <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-800">
  <table className="min-w-full">
    <thead>
      <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
        <th className="p-3">Funcionário</th>
        <th className="p-3">Tipo</th>
        <th className="p-3">Data</th>
        <th className="p-3">Arquivado em</th>
        <th className="p-3">Motivo</th>
      </tr>
    </thead>

    <tbody>
      {carregando ? (
        <tr>
          <td
            colSpan={5}
            className="p-6 text-center text-slate-400"
          >
            Carregando...
          </td>
        </tr>
      ) : ocorrencias.length === 0 ? (
        <tr>
          <td
            colSpan={5}
            className="p-6 text-center text-slate-400"
          >
            Nenhuma ocorrência arquivada encontrada.
          </td>
        </tr>
      ) : (
        ocorrencias.map((ocorrencia) => (
          <tr
            key={ocorrencia.id}
            className="border-b border-slate-800"
          >
            <td className="p-3 text-white">
              {ocorrencia.funcionario?.nome || "-"}
            </td>

            <td className="p-3 text-slate-300">
              {ocorrencia.tipo}
            </td>

            <td className="p-3 text-slate-300">
              {formatarData(ocorrencia.dataEvento)}
            </td>

            <td className="p-3 text-slate-300">
              {formatarData(ocorrencia.arquivadaEm)}
            </td>

            <td className="p-3 text-slate-300">
              {ocorrencia.motivoArquivo || "-"}
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
)}
</div>
    </div>
  );
}