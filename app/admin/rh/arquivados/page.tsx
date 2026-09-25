"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type OcorrenciaArquivada = {
  id: number;
  tipo: string;
  motivo?: string | null;
  motivoArquivo?: string | null;
  arquivadaEm?: string | null;
  dataEvento?: string | null;
  status: string;

  criadoEm?: string | null;
  criadoPorId?: number | null;

  arquivadaPorId?: number | null;

  restauradoEm?: string | null;
  restauradoPorId?: number | null;
  motivoRestauracao?: string | null;

  criadoPor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;

  arquivadaPor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;

  funcionario?: {
    nome?: string | null;
    cargo?: string | null;
    codigoFuncionario?: string | null;
  } | null;
};

type HoleriteArquivado = {
  id: number;
  funcionarioId?: number;
  competenciaMes: number;
  competenciaAno: number;
  valorLiquido: string | number;
  status: string;

  criadoEm?: string | null;
  criadoPorId?: number | null;

  arquivadoEm?: string | null;
  arquivadoPorId?: number | null;
  motivoArquivo?: string | null;

  restauradoEm?: string | null;
  restauradoPorId?: number | null;
  motivoRestauracao?: string | null;

  criadoPor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;

  arquivadoPor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;

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

  criadoEm?: string | null;
  criadoPorId?: number | null;

  arquivadaEm?: string | null;
  arquivadaPorId?: number | null;
  motivoArquivo?: string | null;

  restauradoEm?: string | null;
  restauradoPorId?: number | null;
  motivoRestauracao?: string | null;

  criadoPor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;

  arquivadaPor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;

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

  criadoEm?: string | null;
  criadoPorId?: number | null;

  arquivadoEm?: string | null;
  arquivadoPorId?: number | null;
  motivoArquivo?: string | null;

  restauradoEm?: string | null;
  restauradoPorId?: number | null;
  motivoRestauracao?: string | null;

  criadoPor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;

  arquivadoPor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;

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

  criadoEm?: string | null;
  criadoPorId?: number | null;

  arquivadaEm?: string | null;
  arquivadaPorId?: number | null;
  motivoArquivo?: string | null;

  restauradoEm?: string | null;
  restauradoPorId?: number | null;
  motivoRestauracao?: string | null;

  criadoPor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;

  arquivadaPor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;

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

  criadoEm?: string | null;
  criadoPorId?: number | null;

  arquivadoEm?: string | null;
  arquivadoPorId?: number | null;

  restauradoEm?: string | null;
  restauradoPorId?: number | null;

  motivoArquivo?: string | null;
  motivoRestauracao?: string | null;

  criadoPor?: {
  id: number;
  nome?: string | null;
  email?: string | null;
} | null;

arquivadoPor?: {
  id: number;
  nome?: string | null;
  email?: string | null;
} | null;

restauradoPor?: {
  id: number;
  nome?: string | null;
  email?: string | null;
} | null;

  funcionario?: {
    nome?: string | null;
    cargo?: string | null;
  } | null;
};

function formatarDataLocal(data: string | null | undefined, locale: string) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(locale);
}

function formatarDataHoraLocal(data: string | null | undefined, locale: string) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ArquivadosRHPage() {
  const t = useTranslations("AdminHRArchived");
  const occurrenceT = useTranslations("AdminHROccurrences");
  const examT = useTranslations("AdminHRExams");
  const documentT = useTranslations("AdminHRDocuments");
  const locale = useLocale();
  const formatarData = (data?: string | null) => formatarDataLocal(data, locale);
  const formatarDataHora = (data?: string | null) => formatarDataHoraLocal(data, locale);
  const formatarValor = (value: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(value);
  function occurrenceType(value: string) {
    switch (value) {
      case "ADVERTENCIA": return occurrenceT("warningType");
      case "SUSPENSAO": return occurrenceT("suspensionType");
      case "ELOGIO": return occurrenceT("commendationType");
      case "PROMOCAO": return occurrenceT("promotionType");
      case "MUDANCA_CARGO": return occurrenceT("roleChangeType");
      case "MUDANCA_SALARIAL": return occurrenceT("salaryChangeType");
      case "AFASTAMENTO_MEDICO": return occurrenceT("medicalLeaveType");
      case "AFASTAMENTO_MATERNIDADE": return occurrenceT("maternityLeaveType");
      case "AFASTAMENTO_PERICIA": return occurrenceT("assessmentLeaveType");
      case "RETORNO_TRABALHO": return occurrenceT("returnToWorkType");
      default: return value;
    }
  }
  function examType(value: string) {
    switch (value) {
      case "ASO Admissional": return examT("admissionExam");
      case "ASO Periódico": return examT("periodicExam");
      case "ASO Retorno ao Trabalho": return examT("returnExam");
      case "ASO Mudança de Função": return examT("roleChangeExam");
      case "ASO Demissional": return examT("dismissalExam");
      case "Outro": return examT("otherExam");
      default: return value;
    }
  }
  function examResult(value: string) {
    switch (value) {
      case "APTO": return examT("fit");
      case "INAPTO": return examT("unfit");
      case "APTO COM RESTRIÇÕES": return examT("fitWithRestrictions");
      case "PENDENTE": return examT("pending");
      case "CANCELADO": return examT("cancelled");
      default: return value;
    }
  }
  function documentType(value: string) {
    switch (value) {
      case "DECLARACAO": return documentT("typeDeclaration");
      case "ADVERTENCIA": return documentT("typeWarning");
      case "SUSPENSAO": return documentT("typeSuspension");
      case "TERMO_RESPONSABILIDADE": return documentT("typeResponsibility");
      case "TERMO_RECEBIMENTO": return documentT("typeReceipt");
      case "AVALIACAO_DESEMPENHO": return documentT("typePerformance");
      case "DOCUMENTO_LIVRE": return documentT("typeFree");
      default: return value;
    }
  }


    const [busca, setBusca] = useState("");
    const [mostrarSugestoesBusca, setMostrarSugestoesBusca] = useState(false);
    const [ocorrencias, setOcorrencias] = useState<OcorrenciaArquivada[]>([]);
    const [holerites, setHolerites] = useState<HoleriteArquivado[]>([]);
    const [ferias, setFerias] = useState<FeriasArquivada[]>([]);
    const [exames, setExames] = useState<ExameArquivado[]>([]);
    const [rescisoes, setRescisoes] = useState<RescisaoArquivada[]>([]);
    const [documentos, setDocumentos] = useState<DocumentoArquivado[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [abaAtiva, setAbaAtiva] = useState("OCORRENCIAS");
    const [restaurandoId, setRestaurandoId] = useState<number | null>(null);

    const [itemParaRestaurar, setItemParaRestaurar] = useState<{
      tipo: "HOLERITE" | "DOCUMENTO" | "FERIAS" | "EXAME" | "RESCISAO" | "OCORRENCIA";
      id: number;
      titulo: string;
      funcionario?: string | null;
    } | null>(null);

const [motivoRestauracao, setMotivoRestauracao] = useState("");

const sugestoesBusca = Array.from(
  new Set([
    ...ocorrencias.map((o) => o.funcionario?.nome).filter(Boolean),
    ...holerites.map((h) => h.funcionario?.nome).filter(Boolean),
    ...ferias.map((f) => f.funcionario?.nome).filter(Boolean),
    ...exames.map((e) => e.funcionario?.nome).filter(Boolean),
    ...rescisoes.map((r) => r.funcionario?.nome).filter(Boolean),
    ...documentos.map((d) => d.funcionario?.nome).filter(Boolean),
  ])
)
.filter((nome) =>
  busca.length > 0 &&
  nome!.toLowerCase().includes(busca.toLowerCase())
)
.slice(0, 8);
    
useEffect(() => {
  async function carregarOcorrenciasArquivadas() {
    try {
      setCarregando(true);
      setErro("");

      const res = await fetch(
        "/api/admin/rh/arquivados/ocorrencias"
      );

      if (!res.ok) {
        throw new Error(
          t("loadError")
        );
      }

      const dados = await res.json();

      setOcorrencias(Array.isArray(dados) ? dados : []);
      const resHolerites = await fetch("/api/admin/rh/arquivados/holerites");

if (!resHolerites.ok) {
  throw new Error(t("loadError"));
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
  throw new Error(t("loadError"));
}

if (!resExames.ok) {
  throw new Error(t("loadError"));
}

if (!resRescisoes.ok) {
  throw new Error(t("loadError"));
}

if (!resDocumentos.ok) {
  throw new Error(t("loadError"));
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
      setErro(t("loadError"));
    } finally {
      setCarregando(false);
    }
  }

  carregarOcorrenciasArquivadas();
}, [t]);

async function restaurarOcorrencia(id: number) {
  try {
    setErro("");
    setRestaurandoId(id);

    const res = await fetch(
      "/api/admin/rh/arquivados/ocorrencias",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
  ocorrenciaId: id,
  motivoRestauracao: motivoRestauracao.trim(),
}),
      }
    );

    const dados = await res.json();

    if (!res.ok) {
      throw new Error(
        dados?.error || t("restoreError")
      );
    }

    setOcorrencias((atual) =>
      atual.filter((o) => o.id !== id)
    );
    setItemParaRestaurar(null);
setMotivoRestauracao("");
  } catch (error) {
    console.error(error);
    setErro(t("restoreError"));
  } finally {
    setRestaurandoId(null);
  }
}

async function restaurarHolerite(id: number) {
  try {
    setErro("");
    setRestaurandoId(id);

    const res = await fetch("/api/admin/rh/arquivados/holerites", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        holeriteId: id,
        motivoRestauracao,
      }),
    });

    const dados = await res.json();

    if (!res.ok) {
      throw new Error(dados?.error || t("restoreError"));
    }

    setHolerites((atual) => atual.filter((h) => h.id !== id));
    setItemParaRestaurar(null);
    setMotivoRestauracao("");
  } catch (error) {
    console.error(error);
    setErro(t("restoreError"));
  } finally {
    setRestaurandoId(null);
  }
}

async function restaurarDocumento(id: number) {
  try {
    if (!motivoRestauracao.trim()) {
      return;
    }

    setErro("");
    setRestaurandoId(id);

    const res = await fetch("/api/admin/rh/arquivados/documentos", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentoId: id,
        motivoRestauracao: motivoRestauracao.trim(),
      }),
    });

    const dados = await res.json();

    if (!res.ok) {
      throw new Error(dados?.error || t("restoreError"));
    }

    setDocumentos((atual) => atual.filter((d) => d.id !== id));
    setItemParaRestaurar(null);
    setMotivoRestauracao("");
  } catch (error) {
    console.error(error);
    setErro(t("restoreError"));
  } finally {
    setRestaurandoId(null);
  }
}

async function restaurarFerias(id: number) {
  try {
    if (!motivoRestauracao.trim()) return;

    setErro("");
    setRestaurandoId(id);

    const res = await fetch(`/api/admin/rh/ferias/${id}/restaurar`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  motivo: motivoRestauracao.trim(),
}),
    });

    const dados = await res.json();

    if (!res.ok) {
      throw new Error(dados?.error || t("restoreError"));
    }

    setFerias((atual) => atual.filter((f) => f.id !== id));
    setItemParaRestaurar(null);
    setMotivoRestauracao("");
  } catch (error) {
    console.error(error);
    setErro(t("restoreError"));
  } finally {
    setRestaurandoId(null);
  }
}

async function restaurarExame(id: number) {
  try {
    setErro("");
    setRestaurandoId(id);

    if (!motivoRestauracao.trim()) return;
    const motivo = motivoRestauracao.trim();

    const res = await fetch(`/api/admin/rh/exames/${id}/restaurar`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ motivo }),
    });

    const dados = await res.json();

    if (!res.ok) {
      throw new Error(dados?.error || t("restoreError"));
    }

    setExames((atual) => atual.filter((e) => e.id !== id));
    setItemParaRestaurar(null);
    setMotivoRestauracao("");
  } catch (error) {
    console.error(error);
    setErro(t("restoreError"));
  } finally {
    setRestaurandoId(null);
  }
}

async function restaurarRescisao(id: number) {
  try {
    if (!motivoRestauracao.trim()) return;

    setErro("");
    setRestaurandoId(id);

    const res = await fetch(`/api/admin/rh/rescisoes/${id}/restaurar`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        motivo: motivoRestauracao.trim(),
      }),
    });

    const dados = await res.json();

    if (!res.ok) {
      throw new Error(dados?.error || t("restoreError"));
    }

    setRescisoes((atual) => atual.filter((r) => r.id !== id));
    setItemParaRestaurar(null);
    setMotivoRestauracao("");
  } catch (error) {
    console.error(error);
    setErro(t("restoreError"));
  } finally {
    setRestaurandoId(null);
  }
}

  return (
    <div className="phanyx-rh-page space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-400">{t("eyebrow")}</p>

        <h1 className="mt-2 text-4xl font-black text-slate-950 dark:text-white">{t("heading")}</h1>

        <p className="mt-2 text-slate-700 dark:text-slate-400">{t("description")}</p>
      </div>

      {erro && <p role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">{erro}</p>}
      <div className="grid gap-4 md:grid-cols-4">
  {[
    { titulo: t("occurrences"), total: ocorrencias.length, subtitulo: t("archivedFemale") },
    { titulo: t("payslips"), total: holerites.length, subtitulo: t("archivedMale") },
    { titulo: t("vacations"), total: ferias.length, subtitulo: t("archivedFemale") },
    { titulo: t("exams"), total: exames.length, subtitulo: t("archivedMale") },
  ].map((card) => (
    <div
      key={card.titulo}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
    >
      <p className="text-xs font-bold uppercase text-cyan-700 dark:text-cyan-300">
        {card.titulo}
      </p>

      <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
        {card.total}
      </p>

      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
        {card.subtitulo}
      </p>
    </div>
  ))}
</div>

<div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
  <div className="flex flex-wrap gap-2">
    <button
  type="button"
  onClick={() => setAbaAtiva("OCORRENCIAS")}
  className={`rounded-2xl px-4 py-2 text-sm font-bold ${
    abaAtiva === "OCORRENCIAS"
      ? "bg-cyan-600 text-white"
      : "border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
  }`}
>{t("occurrences")}</button>

    <button
  type="button"
  onClick={() => setAbaAtiva("HOLERITES")}
  className={`rounded-2xl px-4 py-2 text-sm font-bold ${
    abaAtiva === "HOLERITES"
      ? "bg-amber-600 text-white"
      : "border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
  }`}
>{t("payslips")}</button>

    <button
  type="button"
  onClick={() => setAbaAtiva("FERIAS")}
  className={`rounded-2xl px-4 py-2 text-sm font-bold ${
    abaAtiva === "FERIAS"
      ? "bg-emerald-600 text-white"
      : "border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
  }`}
>{t("vacations")}</button>

    <button
  type="button"
  onClick={() => setAbaAtiva("EXAMES")}
  className={`rounded-2xl px-4 py-2 text-sm font-bold ${
    abaAtiva === "EXAMES"
      ? "bg-purple-600 text-white"
      : "border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
  }`}
>{t("exams")}</button>

    <button
  type="button"
  onClick={() => setAbaAtiva("RESCISOES")}
  className={`rounded-2xl px-4 py-2 text-sm font-bold ${
    abaAtiva === "RESCISOES"
      ? "bg-red-600 text-white"
      : "border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
  }`}
>{t("terminations")}</button>

    <button
  type="button"
  onClick={() => setAbaAtiva("DOCUMENTOS")}
  className={`rounded-2xl px-4 py-2 text-sm font-bold ${
    abaAtiva === "DOCUMENTOS"
      ? "bg-blue-600 text-white"
      : "border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
  }`}
>{t("documents")}</button>
  </div>

  <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/40">
  <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-700 dark:text-cyan-300">{t("search")}</p>

  <input
    type="text"
    value={busca}
    onChange={(e) => {
  setBusca(e.target.value);
  setMostrarSugestoesBusca(true);
}}
    placeholder={t("searchPlaceholder")}
    className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
  />

{mostrarSugestoesBusca && busca.length > 0 && sugestoesBusca.length > 0 && (
  <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
    {sugestoesBusca.map((sugestao) => (
      <button
        key={sugestao}
        type="button"
        onClick={() => {
  setBusca(sugestao!);
  setMostrarSugestoesBusca(false);
}}
        className="block w-full border-b border-slate-200 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
      >
        {sugestao}
      </button>
    ))}
  </div>
)}

  <p className="mt-2 text-xs text-slate-700 dark:text-slate-400">{t("searchHint")}</p>
</div>

{abaAtiva === "HOLERITES" && (
  <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-slate-200 text-left text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
          <th className="p-3">{t("employee")}</th>
          <th className="p-3">{t("competence")}</th>
          <th className="p-3">{t("netValue")}</th>
          <th className="p-3">{t("createdAt")}</th>
          <th className="p-3">{t("createdBy")}</th>
          <th className="p-3">{t("archivedAt")}</th>
          <th className="p-3">{t("archivedBy")}</th>
          <th className="p-3">{t("reason")}</th>
          <th className="p-3">{t("actions")}</th>
        </tr>
      </thead>

      <tbody>
        {holerites.length === 0 ? (
          <tr>
            <td colSpan={9} className="p-6 text-center text-slate-600 dark:text-slate-400">{t("emptyPayslips")}</td>
          </tr>
        ) : (
          holerites
            .filter((holerite) => {
              const termo = busca.toLowerCase();

              return (
                holerite.funcionario?.nome?.toLowerCase().includes(termo) ||
                holerite.motivoArquivo?.toLowerCase().includes(termo) ||
                `${holerite.competenciaMes}/${holerite.competenciaAno}`
                  .toLowerCase()
                  .includes(termo)
              );
            })
            .map((holerite) => (
              <tr key={holerite.id} className="border-b border-slate-200 dark:border-slate-800">
                <td className="p-3 text-slate-900 dark:text-white">
                  {holerite.funcionario?.nome || "-"}
                </td>

                <td className="p-3 text-slate-700 dark:text-slate-300">
                  {String(holerite.competenciaMes).padStart(2, "0")}/
                  {holerite.competenciaAno}
                </td>

                <td className="p-3 text-slate-700 dark:text-slate-300">
                  {formatarValor(Number(holerite.valorLiquido || 0))}
                </td>

                <td className="p-3 text-slate-700 dark:text-slate-300">
                  {formatarDataHora(holerite.criadoEm)}
                </td>

                <td className="p-3 text-slate-700 dark:text-slate-300">
                  {holerite.criadoPor?.nome ||
                    holerite.criadoPor?.email ||
                    holerite.criadoPorId ||
                    "-"}
                </td>

                <td className="p-3 text-slate-700 dark:text-slate-300">
                  {formatarDataHora(holerite.arquivadoEm)}
                </td>

                <td className="p-3 text-slate-700 dark:text-slate-300">
                  {holerite.arquivadoPor?.nome ||
                    holerite.arquivadoPor?.email ||
                    holerite.arquivadoPorId ||
                    "-"}
                </td>

                <td className="p-3 text-slate-700 dark:text-slate-300">
                  {holerite.motivoArquivo || "-"}
                </td>

                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => {
                      setItemParaRestaurar({
                        tipo: "HOLERITE",
                        id: holerite.id,
                        titulo: t("payslipRecord", {
                          competence: `${String(holerite.competenciaMes).padStart(2, "0")}/${holerite.competenciaAno}`,
                        }),
                        funcionario: holerite.funcionario?.nome || "-",
                      });
                      setMotivoRestauracao("");
                    }}
                    disabled={restaurandoId === holerite.id}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {restaurandoId === holerite.id
                      ? t("restoring")
                      : t("restore")}
                  </button>
                </td>
              </tr>
            ))
        )}
      </tbody>
    </table>
  </div>
)}

{abaAtiva === "FERIAS" && (
  <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-slate-200 text-left text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
          <th className="p-3">{t("employee")}</th>
          <th className="p-3">{t("period")}</th>
          <th className="p-3">{t("days")}</th>
          <th className="p-3">{t("createdAt")}</th>
          <th className="p-3">{t("createdBy")}</th>
          <th className="p-3">{t("archivedAt")}</th>
          <th className="p-3">{t("archivedBy")}</th>
          <th className="p-3">{t("reason")}</th>
          <th className="p-3">{t("actions")}</th>
        </tr>
      </thead>

      <tbody>
        {ferias.length === 0 ? (
          <tr>
            <td colSpan={9} className="p-6 text-center text-slate-600 dark:text-slate-400">{t("emptyVacations")}</td>
          </tr>
        ) : (
          ferias.map((item) => (
            <tr key={item.id} className="border-b border-slate-200 dark:border-slate-800">
              <td className="p-3 text-slate-900 dark:text-white">{item.funcionario?.nome || "-"}</td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {formatarData(item.dataInicio)} {t("until")} {formatarData(item.dataFim)}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">{item.dias}</td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {formatarDataHora(item.criadoEm)}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {item.criadoPor?.nome || item.criadoPor?.email || item.criadoPorId || "-"}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {formatarDataHora(item.arquivadaEm)}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {item.arquivadaPor?.nome || item.arquivadaPor?.email || item.arquivadaPorId || "-"}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {item.motivoArquivo || "-"}
              </td>
              <td className="p-3">
  <button
    type="button"
    onClick={() => {
      setItemParaRestaurar({
        tipo: "FERIAS",
        id: item.id,
        titulo: t("vacationRecord", { start: formatarData(item.dataInicio), end: formatarData(item.dataFim) }),
        funcionario: item.funcionario?.nome || "-",
      });
      setMotivoRestauracao("");
    }}
    disabled={restaurandoId === item.id}
    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
  >
    {restaurandoId === item.id ? t("restoring") : t("restore")}
  </button>
</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}

{abaAtiva === "EXAMES" && (
  <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-slate-200 text-left text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
          <th className="p-3">{t("employee")}</th>
          <th className="p-3">{t("type")}</th>
          <th className="p-3">{t("date")}</th>
          <th className="p-3">{t("result")}</th>
          <th className="p-3">{t("createdAt")}</th>
          <th className="p-3">{t("createdBy")}</th>
          <th className="p-3">{t("archivedAt")}</th>
          <th className="p-3">{t("archivedBy")}</th>
          <th className="p-3">{t("reason")}</th>
          <th className="p-3">{t("actions")}</th>
        </tr>
      </thead>

      <tbody>
        {exames.length === 0 ? (
          <tr>
            <td colSpan={10} className="p-6 text-center text-slate-600 dark:text-slate-400">{t("emptyExams")}</td>
          </tr>
        ) : (
          exames.map((item) => (
            <tr key={item.id} className="border-b border-slate-200 dark:border-slate-800">
              <td className="p-3 text-slate-900 dark:text-white">
                {item.funcionario?.nome || "-"}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">{examType(item.tipo)}</td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {formatarData(item.dataExame)}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {item.resultado ? examResult(item.resultado) : "-"}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {formatarDataHora(item.criadoEm)}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {item.criadoPor?.nome ||
                  item.criadoPor?.email ||
                  item.criadoPorId ||
                  "-"}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {formatarDataHora(item.arquivadoEm)}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {item.arquivadoPor?.nome ||
                  item.arquivadoPor?.email ||
                  item.arquivadoPorId ||
                  "-"}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {item.motivoArquivo || "-"}
              </td>
              <td className="p-3">
  <button
    type="button"
    onClick={() => {
      setItemParaRestaurar({ tipo: "EXAME", id: item.id,
        titulo: examType(item.tipo), funcionario: item.funcionario?.nome || "-" });
      setMotivoRestauracao("");
    }}
    className="rounded-lg border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
  >{t("restore")}</button>
</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}

{abaAtiva === "RESCISOES" && (
  <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-slate-200 text-left text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
          <th className="p-3">{t("employee")}</th>
          <th className="p-3">{t("type")}</th>
          <th className="p-3">{t("terminationDate")}</th>
          <th className="p-3">{t("createdAt")}</th>
          <th className="p-3">{t("createdBy")}</th>
          <th className="p-3">{t("archivedAt")}</th>
          <th className="p-3">{t("archivedBy")}</th>
          <th className="p-3">{t("reason")}</th>
        </tr>
      </thead>

      <tbody>
        {rescisoes.length === 0 ? (
          <tr>
            <td colSpan={8} className="p-6 text-center text-slate-600 dark:text-slate-400">{t("emptyTerminations")}</td>
          </tr>
        ) : (
          rescisoes.map((item) => (
            <tr key={item.id} className="border-b border-slate-200 dark:border-slate-800">
              <td className="p-3 text-slate-900 dark:text-white">
                {item.funcionario?.nome || "-"}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {item.tipo}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {formatarData(item.dataDesligamento)}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {formatarDataHora(item.criadoEm)}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {item.criadoPor?.nome ||
                  item.criadoPor?.email ||
                  item.criadoPorId ||
                  "-"}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {formatarDataHora(item.arquivadaEm)}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {item.arquivadaPor?.nome ||
                  item.arquivadaPor?.email ||
                  item.arquivadaPorId ||
                  "-"}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
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
  <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <table className="min-w-full">
      <thead>
  <tr className="border-b border-slate-200 text-left text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
    <th className="p-3">{t("employee")}</th>
    <th className="p-3">{t("documentTitle")}</th>
    <th className="p-3">{t("type")}</th>
    <th className="p-3">{t("createdAt")}</th>
    <th className="p-3">{t("createdBy")}</th>
    <th className="p-3">{t("archivedAt")}</th>
    <th className="p-3">{t("archivedBy")}</th>
    <th className="p-3">{t("reason")}</th>
    <th className="p-3">{t("actions")}</th>
  </tr>
</thead>

      <tbody>
        {documentos.length === 0 ? (
          <tr>
            <td colSpan={9} className="p-6 text-center text-slate-600 dark:text-slate-400">{t("emptyDocuments")}</td>
          </tr>
        ) : (
          documentos.map((item) => (
            <tr key={item.id} className="border-b border-slate-200 dark:border-slate-800">
              <td className="p-3 text-slate-900 dark:text-white">
                {item.funcionario?.nome || "-"}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {item.titulo}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {documentType(item.tipo)}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
  {formatarDataHora(item.criadoEm || item.dataDocumento)}
</td>

<td className="p-3 text-slate-700 dark:text-slate-300">
  {item.criadoPor?.nome || item.criadoPor?.email || item.criadoPorId || "-"}
</td>

<td className="p-3 text-slate-700 dark:text-slate-300">
  {formatarDataHora(item.arquivadoEm)}
</td>

<td className="p-3 text-slate-700 dark:text-slate-300">
  {item.arquivadoPor?.nome || item.arquivadoPor?.email || item.arquivadoPorId || "-"}
</td>

<td className="p-3 text-slate-700 dark:text-slate-300">
  {item.motivoArquivo || "-"}
</td>

<td className="p-3">
  <button
    type="button"
    onClick={() => {
  setItemParaRestaurar({
    tipo: "DOCUMENTO",
    id: item.id,
    titulo: item.titulo || t("documentRecord"),
    funcionario: item.funcionario?.nome || "-",
  });
  setMotivoRestauracao("");
}}
    disabled={restaurandoId === item.id}
    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
  >
    {restaurandoId === item.id
      ? t("restoring")
      : t("restore")}
  </button>
</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}

{abaAtiva === "OCORRENCIAS" && (
  <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-slate-200 text-left text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
          <th className="p-3">{t("employee")}</th>
          <th className="p-3">{t("type")}</th>
          <th className="p-3">{t("date")}</th>
          <th className="p-3">{t("createdAt")}</th>
          <th className="p-3">{t("createdBy")}</th>
          <th className="p-3">{t("archivedAt")}</th>
          <th className="p-3">{t("archivedBy")}</th>
          <th className="p-3">{t("reason")}</th>
          <th className="p-3">{t("actions")}</th>
        </tr>
      </thead>

      <tbody>
        {carregando ? (
          <tr>
            <td colSpan={9} className="p-6 text-center text-slate-600 dark:text-slate-400">{t("loading")}</td>
          </tr>
        ) : ocorrencias.length === 0 ? (
          <tr>
            <td colSpan={9} className="p-6 text-center text-slate-600 dark:text-slate-400">{t("emptyOccurrences")}</td>
          </tr>
        ) : (
          ocorrencias.map((ocorrencia) => (
            <tr key={ocorrencia.id} className="border-b border-slate-200 dark:border-slate-800">
              <td className="p-3 text-slate-900 dark:text-white">
                {ocorrencia.funcionario?.nome || "-"}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {occurrenceType(ocorrencia.tipo)}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {formatarData(ocorrencia.dataEvento)}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {formatarDataHora(ocorrencia.criadoEm)}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {ocorrencia.criadoPor?.nome ||
                  ocorrencia.criadoPor?.email ||
                  ocorrencia.criadoPorId ||
                  "-"}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {formatarDataHora(ocorrencia.arquivadaEm)}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {ocorrencia.arquivadaPor?.nome ||
                  ocorrencia.arquivadaPor?.email ||
                  ocorrencia.arquivadaPorId ||
                  "-"}
              </td>

              <td className="p-3 text-slate-700 dark:text-slate-300">
                {ocorrencia.motivoArquivo || "-"}
              </td>

              <td className="p-3">
                <button
                  type="button"
                  onClick={() => {
                    setItemParaRestaurar({ tipo: "OCORRENCIA", id: ocorrencia.id,
                      titulo: occurrenceType(ocorrencia.tipo),
                      funcionario: ocorrencia.funcionario?.nome || "-" });
                    setMotivoRestauracao("");
                  }}
                  disabled={restaurandoId === ocorrencia.id}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {restaurandoId === ocorrencia.id ? t("restoring") : t("restore")}
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}
</div>

{itemParaRestaurar && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("restoreHeading")}</h2>

      <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{t("restoreDescription")}</p>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
        <p>
          <strong>{t("recordColon")}</strong> {itemParaRestaurar.titulo}
        </p>

        <p className="mt-2">
          <strong>{t("employeeColon")}</strong> {itemParaRestaurar.funcionario || "-"}
        </p>
      </div>

      <label className="mt-5 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">{t("restoreReason")}</label>

      <textarea
        value={motivoRestauracao}
        onChange={(e) => setMotivoRestauracao(e.target.value)}
        className="mt-2 min-h-28 w-full rounded-2xl border border-slate-300 bg-white p-4 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none focus:border-emerald-500"
        placeholder={t("restorePlaceholder")}
      />

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setItemParaRestaurar(null);
            setMotivoRestauracao("");
          }}
          disabled={restaurandoId !== null}
          className="rounded-2xl border border-slate-300 px-5 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-60"
        >{t("cancel")}</button>

        <button
  type="button"
  onClick={() => {
    if (!itemParaRestaurar) return;

    if (itemParaRestaurar.tipo === "HOLERITE") {
      restaurarHolerite(itemParaRestaurar.id);
    }

    if (itemParaRestaurar.tipo === "DOCUMENTO") {
      restaurarDocumento(itemParaRestaurar.id);
    }

    if (itemParaRestaurar.tipo === "FERIAS") {
      restaurarFerias(itemParaRestaurar.id);
    }

    if (itemParaRestaurar.tipo === "EXAME") {
      restaurarExame(itemParaRestaurar.id);
    }

    if (itemParaRestaurar.tipo === "RESCISAO") {
      restaurarRescisao(itemParaRestaurar.id);
    }

    if (itemParaRestaurar.tipo === "OCORRENCIA") {
      restaurarOcorrencia(itemParaRestaurar.id);
    }
  }}
  disabled={restaurandoId !== null || !motivoRestauracao.trim()}
  className="rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
>
  {restaurandoId !== null ? t("restoring") : t("restoreRecord")}
</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
