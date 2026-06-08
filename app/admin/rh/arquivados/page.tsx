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

type HoleriteArquivado = {
  id: number;
  competenciaMes: number;
  competenciaAno: number;
  valorLiquido: string | number;
  status: string;
  arquivadoEm?: string | null;
  motivoArquivo?: string | null;
  funcionario?: {
    nome?: string | null;
    cargo?: string | null;
  } | null;
};

type FeriasArquivada = {
  id: number;
  dataInicio: string;
  dataFim: string;
  dias: number;
  status: string;
  arquivadaEm?: string | null;
  motivoArquivo?: string | null;
  funcionario?: {
    nome?: string | null;
    cargo?: string | null;
  } | null;
};

type ExameArquivado = {
  id: number;
  tipo: string;
  dataExame: string;
  resultado?: string | null;
  arquivadoEm?: string | null;
  motivoArquivo?: string | null;
  funcionario?: {
    nome?: string | null;
    cargo?: string | null;
  } | null;
};

type RescisaoArquivada = {
  id: number;
  tipo: string;
  dataDesligamento: string;
  motivo?: string | null;
  arquivadaEm?: string | null;
  motivoArquivo?: string | null;
  funcionario?: {
    nome?: string | null;
    cargo?: string | null;
  } | null;
};

type DocumentoArquivado = {
  id: number;
  tipo: string;
  titulo: string;
  dataDocumento: string;
  arquivadoEm?: string | null;
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

export default function ArquivadosRHPage() {

    const [ocorrencias, setOcorrencias] = useState<OcorrenciaArquivada[]>([]);
    const [holerites, setHolerites] = useState<HoleriteArquivado[]>([]);
    const [ferias, setFerias] = useState<FeriasArquivada[]>([]);
    const [exames, setExames] = useState<ExameArquivado[]>([]);
    const [rescisoes, setRescisoes] = useState<RescisaoArquivada[]>([]);
    const [documentos, setDocumentos] = useState<DocumentoArquivado[]>([]);
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
      const resHolerites = await fetch("/api/admin/rh/arquivados/holerites");

if (!resHolerites.ok) {
  throw new Error("Não foi possível carregar os holerites arquivados.");
}

const dadosHolerites = await resHolerites.json();

setHolerites(Array.isArray(dadosHolerites) ? dadosHolerites : []);
const [resFerias, resExames, resRescisoes, resDocumentos] =
  await Promise.all([
    fetch("/api/admin/rh/arquivados/ferias"),
    fetch("/api/admin/rh/arquivados/exames"),
    fetch("/api/admin/rh/arquivados/rescisoes"),
    fetch("/api/admin/rh/arquivados/documentos"),
  ]);

if (!resFerias.ok) {
  throw new Error("Não foi possível carregar as férias arquivadas.");
}

if (!resExames.ok) {
  throw new Error("Não foi possível carregar os exames arquivados.");
}

if (!resRescisoes.ok) {
  throw new Error("Não foi possível carregar as rescisões arquivadas.");
}

if (!resDocumentos.ok) {
  throw new Error("Não foi possível carregar os documentos arquivados.");
}

const dadosFerias = await resFerias.json();
const dadosExames = await resExames.json();
const dadosRescisoes = await resRescisoes.json();
const dadosDocumentos = await resDocumentos.json();

setFerias(Array.isArray(dadosFerias) ? dadosFerias : []);
setExames(Array.isArray(dadosExames) ? dadosExames : []);
setRescisoes(Array.isArray(dadosRescisoes) ? dadosRescisoes : []);
setDocumentos(Array.isArray(dadosDocumentos) ? dadosDocumentos : []);

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

    <button
  type="button"
  onClick={() => setAbaAtiva("FERIAS")}
  className={`rounded-2xl px-4 py-2 text-sm font-bold ${
    abaAtiva === "FERIAS"
      ? "bg-emerald-600 text-white"
      : "border border-slate-700 text-slate-300"
  }`}
>
  Férias
</button>

    <button
  type="button"
  onClick={() => setAbaAtiva("EXAMES")}
  className={`rounded-2xl px-4 py-2 text-sm font-bold ${
    abaAtiva === "EXAMES"
      ? "bg-purple-600 text-white"
      : "border border-slate-700 text-slate-300"
  }`}
>
  Exames
</button>

    <button
  type="button"
  onClick={() => setAbaAtiva("RESCISOES")}
  className={`rounded-2xl px-4 py-2 text-sm font-bold ${
    abaAtiva === "RESCISOES"
      ? "bg-red-600 text-white"
      : "border border-slate-700 text-slate-300"
  }`}
>
  Rescisões
</button>

    <button
  type="button"
  onClick={() => setAbaAtiva("DOCUMENTOS")}
  className={`rounded-2xl px-4 py-2 text-sm font-bold ${
    abaAtiva === "DOCUMENTOS"
      ? "bg-blue-600 text-white"
      : "border border-slate-700 text-slate-300"
  }`}
>
  Documentos RH
</button>
  </div>

{!["OCORRENCIAS", "HOLERITES", "FERIAS", "EXAMES", "RESCISOES", "DOCUMENTOS"].includes(
  abaAtiva
) && (
  <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-8 text-center">
    <p className="text-lg font-bold text-white">
      {abaAtiva} em preparação
    </p>

    <p className="mt-2 text-sm text-slate-400">
      Esta aba será conectada aos registros arquivados do banco na próxima etapa.
    </p>
  </div>
)}

{abaAtiva === "HOLERITES" && (
  <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-800">
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
          <th className="p-3">Funcionário</th>
          <th className="p-3">Competência</th>
          <th className="p-3">Valor Líquido</th>
          <th className="p-3">Arquivado em</th>
          <th className="p-3">Motivo</th>
        </tr>
      </thead>

      <tbody>
        {holerites.length === 0 ? (
          <tr>
            <td
              colSpan={5}
              className="p-6 text-center text-slate-400"
            >
              Nenhum holerite arquivado encontrado.
            </td>
          </tr>
        ) : (
          holerites.map((holerite) => (
            <tr
              key={holerite.id}
              className="border-b border-slate-800"
            >
              <td className="p-3 text-white">
                {holerite.funcionario?.nome || "-"}
              </td>

              <td className="p-3 text-slate-300">
                {String(holerite.competenciaMes).padStart(2, "0")}/
                {holerite.competenciaAno}
              </td>

              <td className="p-3 text-slate-300">
                R$ {Number(holerite.valorLiquido || 0).toFixed(2)}
              </td>

              <td className="p-3 text-slate-300">
                {formatarData(holerite.arquivadoEm)}
              </td>

              <td className="p-3 text-slate-300">
                {holerite.motivoArquivo || "-"}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}

{abaAtiva === "FERIAS" && (
  <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-800">
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
          <th className="p-3">Funcionário</th>
          <th className="p-3">Período</th>
          <th className="p-3">Dias</th>
          <th className="p-3">Arquivado em</th>
          <th className="p-3">Motivo</th>
        </tr>
      </thead>

      <tbody>
        {ferias.length === 0 ? (
          <tr>
            <td colSpan={5} className="p-6 text-center text-slate-400">
              Nenhuma férias arquivada encontrada.
            </td>
          </tr>
        ) : (
          ferias.map((item) => (
            <tr key={item.id} className="border-b border-slate-800">
              <td className="p-3 text-white">
                {item.funcionario?.nome || "-"}
              </td>

              <td className="p-3 text-slate-300">
                {formatarData(item.dataInicio)} até {formatarData(item.dataFim)}
              </td>

              <td className="p-3 text-slate-300">
                {item.dias}
              </td>

              <td className="p-3 text-slate-300">
                {formatarData(item.arquivadaEm)}
              </td>

              <td className="p-3 text-slate-300">
                {item.motivoArquivo || "-"}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}

{abaAtiva === "EXAMES" && (
  <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-800">
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
          <th className="p-3">Funcionário</th>
          <th className="p-3">Tipo</th>
          <th className="p-3">Data</th>
          <th className="p-3">Resultado</th>
          <th className="p-3">Arquivado em</th>
        </tr>
      </thead>

      <tbody>
        {exames.length === 0 ? (
          <tr>
            <td colSpan={5} className="p-6 text-center text-slate-400">
              Nenhum exame arquivado encontrado.
            </td>
          </tr>
        ) : (
          exames.map((item) => (
            <tr key={item.id} className="border-b border-slate-800">
              <td className="p-3 text-white">
                {item.funcionario?.nome || "-"}
              </td>

              <td className="p-3 text-slate-300">
                {item.tipo}
              </td>

              <td className="p-3 text-slate-300">
                {formatarData(item.dataExame)}
              </td>

              <td className="p-3 text-slate-300">
                {item.resultado || "-"}
              </td>

              <td className="p-3 text-slate-300">
                {formatarData(item.arquivadoEm)}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}

{abaAtiva === "RESCISOES" && (
  <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-800">
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
          <th className="p-3">Funcionário</th>
          <th className="p-3">Tipo</th>
          <th className="p-3">Desligamento</th>
          <th className="p-3">Arquivado em</th>
          <th className="p-3">Motivo</th>
        </tr>
      </thead>

      <tbody>
        {rescisoes.length === 0 ? (
          <tr>
            <td colSpan={5} className="p-6 text-center text-slate-400">
              Nenhuma rescisão arquivada encontrada.
            </td>
          </tr>
        ) : (
          rescisoes.map((item) => (
            <tr key={item.id} className="border-b border-slate-800">
              <td className="p-3 text-white">
                {item.funcionario?.nome || "-"}
              </td>

              <td className="p-3 text-slate-300">
                {item.tipo}
              </td>

              <td className="p-3 text-slate-300">
                {formatarData(item.dataDesligamento)}
              </td>

              <td className="p-3 text-slate-300">
                {formatarData(item.arquivadaEm)}
              </td>

              <td className="p-3 text-slate-300">
                {item.motivoArquivo || "-"}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}

{abaAtiva === "DOCUMENTOS" && (
  <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-800">
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-slate-800 text-left text-sm text-slate-400">
          <th className="p-3">Funcionário</th>
          <th className="p-3">Título</th>
          <th className="p-3">Tipo</th>
          <th className="p-3">Data</th>
          <th className="p-3">Arquivado em</th>
        </tr>
      </thead>

      <tbody>
        {documentos.length === 0 ? (
          <tr>
            <td colSpan={5} className="p-6 text-center text-slate-400">
              Nenhum documento arquivado encontrado.
            </td>
          </tr>
        ) : (
          documentos.map((item) => (
            <tr key={item.id} className="border-b border-slate-800">
              <td className="p-3 text-white">
                {item.funcionario?.nome || "-"}
              </td>

              <td className="p-3 text-slate-300">
                {item.titulo}
              </td>

              <td className="p-3 text-slate-300">
                {item.tipo}
              </td>

              <td className="p-3 text-slate-300">
                {formatarData(item.dataDocumento)}
              </td>

              <td className="p-3 text-slate-300">
                {formatarData(item.arquivadoEm)}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
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