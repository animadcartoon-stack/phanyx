"use client";

import { useEffect, useMemo, useState } from "react";

type Lead = {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  instituicaoNome?: string | null;
  instituicaoId?: number | null;
  cargo?: string | null;
  origem: string;
  tipo: string;
  interesse?: string | null;
  observacoes?: string | null;
  status: string;
  prioridade: string;
  valorEstimado?: number | null;
  proximoContatoEm?: string | null;
  ultimoContatoEm?: string | null;
  responsavelNome?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Interacao = {
  id: number;
  leadId: number;
  tipo: string;
  descricao: string;
  usuario?: string | null;
  createdAt: string;
};

type LeadForm = {
  nome: string;
  email: string;
  telefone: string;
  instituicaoNome: string;
  instituicaoId: string;
  cargo: string;
  origem: string;
  tipo: string;
  interesse: string;
  observacoes: string;
  status: string;
  prioridade: string;
  valorEstimado: string;
  proximoContatoEm: string;
  ultimoContatoEm: string;
  responsavelNome: string;
};

const STATUS_COLUNAS = [
  { key: "NOVO", titulo: "Novos" },
  { key: "CONTATO", titulo: "Em contato" },
  { key: "PROPOSTA", titulo: "Proposta" },
  { key: "FECHADO", titulo: "Fechados" },
  { key: "PERDIDO", titulo: "Perdidos" },
] as const;

const STATUS_OPTIONS = ["NOVO", "CONTATO", "PROPOSTA", "FECHADO", "PERDIDO"];
const PRIORIDADE_OPTIONS = ["BAIXA", "MEDIA", "ALTA"];
const TIPO_OPTIONS = ["PHANYX", "INSTITUICAO"];
const TIPO_INTERACAO_OPTIONS = [
  "WHATSAPP",
  "LIGACAO",
  "EMAIL",
  "REUNIAO",
  "OBSERVACAO",
];

const FORM_INICIAL: LeadForm = {
  nome: "",
  email: "",
  telefone: "",
  instituicaoNome: "",
  instituicaoId: "",
  cargo: "",
  origem: "SITE_PHANYX",
  tipo: "PHANYX",
  interesse: "",
  observacoes: "",
  status: "NOVO",
  prioridade: "MEDIA",
  valorEstimado: "",
  proximoContatoEm: "",
  ultimoContatoEm: "",
  responsavelNome: "",
};

function formatarData(data?: string | null) {
  if (!data) return "—";
  const d = new Date(data);
  return d.toLocaleDateString("pt-BR");
}

function formatarDataHora(data?: string | null) {
  if (!data) return "—";
  const d = new Date(data);
  return d.toLocaleString("pt-BR");
}

function formatarMoeda(valor?: number | null) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function paraDatetimeLocal(valor?: string | null) {
  if (!valor) return "";
  const d = new Date(valor);
  const pad = (n: number) => String(n).padStart(2, "0");

  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function classePrioridade(prioridade: string) {
  if (prioridade === "ALTA") return "border-red-200 bg-red-50 text-red-700";
  if (prioridade === "MEDIA") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function classeTipo(tipo: string) {
  if (tipo === "INSTITUICAO") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function diasSemContato(lead: Lead) {
  const base = lead.ultimoContatoEm || lead.createdAt;
  const inicio = new Date(base).getTime();
  const agora = Date.now();
  return Math.floor((agora - inicio) / (1000 * 60 * 60 * 24));
}

function classificarFollowUp(lead: Lead) {
  if (!lead.proximoContatoEm) {
    const dias = diasSemContato(lead);
    if (dias >= 7) return "sem_followup_critico";
    if (dias >= 3) return "sem_followup_alerta";
    return "ok";
  }

  const agora = new Date();
  const proximo = new Date(lead.proximoContatoEm);

  const hoje = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate()
  ).getTime();

  const alvo = new Date(
    proximo.getFullYear(),
    proximo.getMonth(),
    proximo.getDate()
  ).getTime();

  if (alvo < hoje) return "atrasado";
  if (alvo === hoje) return "hoje";
  return "ok";
}

function textoFollowUp(lead: Lead) {
  const situacao = classificarFollowUp(lead);

  if (situacao === "atrasado") return "Follow-up atrasado";
  if (situacao === "hoje") return "Follow-up hoje";
  if (situacao === "sem_followup_critico") return "Sem follow-up há muitos dias";
  if (situacao === "sem_followup_alerta") return "Precisa definir próximo contato";
  return "Em dia";
}

function classeFollowUp(lead: Lead) {
  const situacao = classificarFollowUp(lead);

  if (situacao === "atrasado" || situacao === "sem_followup_critico") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (situacao === "hoje" || situacao === "sem_followup_alerta") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function calcularScore(lead: Lead) {
  let score = 0;

  if (lead.email) score += 10;
  if (lead.telefone) score += 10;
  if (lead.cargo) score += 10;
  if (lead.instituicaoNome) score += 10;
  if (lead.valorEstimado && lead.valorEstimado > 0) score += 15;
  if (lead.interesse) score += 10;
  if (lead.responsavelNome) score += 5;
  if (lead.prioridade === "ALTA") score += 15;
  if (lead.status === "CONTATO") score += 10;
  if (lead.status === "PROPOSTA") score += 15;

  const follow = classificarFollowUp(lead);
  if (follow === "atrasado") score -= 10;
  if (follow === "sem_followup_critico") score -= 8;

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return score;
}

function rotuloScore(score: number) {
  if (score >= 75) return "Quente";
  if (score >= 45) return "Morno";
  return "Frio";
}

function classeScore(score: number) {
  if (score >= 75) return "border-red-200 bg-red-50 text-red-700";
  if (score >= 45) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function ordenarLeads(leads: Lead[]) {
  return [...leads].sort((a, b) => {
    const scoreA = calcularScore(a);
    const scoreB = calcularScore(b);

    if (scoreA !== scoreB) return scoreB - scoreA;

    const valorA = a.valorEstimado || 0;
    const valorB = b.valorEstimado || 0;
    if (valorA !== valorB) return valorB - valorA;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("PHANYX");
  const [filtroFollowUp, setFiltroFollowUp] = useState("");
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);

  const [form, setForm] = useState<LeadForm>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [criandoNovo, setCriandoNovo] = useState(false);
  const [draggingLeadId, setDraggingLeadId] = useState<number | null>(null);

  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [novaInteracao, setNovaInteracao] = useState("");
  const [tipoInteracao, setTipoInteracao] = useState("WHATSAPP");
  const [salvandoInteracao, setSalvandoInteracao] = useState(false);

  async function carregarLeads() {
    try {
      setCarregando(true);
      setErro("");

      const params = new URLSearchParams();
      if (busca.trim()) params.set("q", busca.trim());
      if (filtroOrigem.trim()) params.set("origem", filtroOrigem.trim());

      const res = await fetch(`/api/admin/leads?${params.toString()}`, {
        cache: "no-store",
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const texto = await res.text();
        console.error("Resposta não-JSON em /api/admin/leads:", texto);
        throw new Error("A API de leads não retornou JSON.");
      }

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao carregar leads.");
      }

      setLeads(Array.isArray(json) ? json : []);
    } catch (err: any) {
      setErro(err?.message || "Erro ao carregar leads.");
      setLeads([]);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarInteracoes(leadId: number) {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/interacoes`, {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Erro ao carregar interações.");
      }

      setInteracoes(Array.isArray(json) ? json : []);
    } catch (err: any) {
      setErro(err?.message || "Erro ao carregar interações.");
      setInteracoes([]);
    }
  }

  useEffect(() => {
    carregarLeads();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarLeads();
    }, 300);

    return () => clearTimeout(timer);
  }, [busca, filtroOrigem]);

  function abrirNovoLead() {
    setCriandoNovo(true);
    setLeadSelecionado(null);
    setInteracoes([]);
    setNovaInteracao("");
    setTipoInteracao("WHATSAPP");
    setForm(FORM_INICIAL);
  }

  async function abrirEdicao(lead: Lead) {
    setCriandoNovo(false);
    setLeadSelecionado(lead);
    setForm({
      nome: lead.nome || "",
      email: lead.email || "",
      telefone: lead.telefone || "",
      instituicaoNome: lead.instituicaoNome || "",
      instituicaoId:
        lead.instituicaoId !== null && lead.instituicaoId !== undefined
          ? String(lead.instituicaoId)
          : "",
      cargo: lead.cargo || "",
      origem: lead.origem || "SITE_PHANYX",
      tipo: lead.tipo || "PHANYX",
      interesse: lead.interesse || "",
      observacoes: lead.observacoes || "",
      status: lead.status || "NOVO",
      prioridade: lead.prioridade || "MEDIA",
      valorEstimado:
        lead.valorEstimado !== null && lead.valorEstimado !== undefined
          ? String(lead.valorEstimado)
          : "",
      proximoContatoEm: paraDatetimeLocal(lead.proximoContatoEm),
      ultimoContatoEm: paraDatetimeLocal(lead.ultimoContatoEm),
      responsavelNome: lead.responsavelNome || "",
    });

    await carregarInteracoes(lead.id);
  }

  function fecharPainel() {
    setCriandoNovo(false);
    setLeadSelecionado(null);
    setInteracoes([]);
    setNovaInteracao("");
    setTipoInteracao("WHATSAPP");
    setForm(FORM_INICIAL);
  }

  async function salvarLead() {
    try {
      setSalvando(true);
      setErro("");

      const payload = {
        ...form,
        instituicaoId:
          form.instituicaoId === "" ? null : Number(form.instituicaoId),
        valorEstimado:
          form.valorEstimado === "" ? null : Number(form.valorEstimado),
        proximoContatoEm: form.proximoContatoEm || null,
        ultimoContatoEm: form.ultimoContatoEm || null,
      };

      const res = await fetch(
        criandoNovo
          ? "/api/admin/leads"
          : `/api/admin/leads/${leadSelecionado?.id}`,
        {
          method: criandoNovo ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const texto = await res.text();
        console.error("Resposta não-JSON ao salvar lead:", texto);
        throw new Error("A API não retornou JSON ao salvar o lead.");
      }

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Não foi possível salvar o lead.");
      }

      await carregarLeads();
      fecharPainel();
    } catch (err: any) {
      setErro(err?.message || "Não foi possível salvar o lead.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirLead() {
    if (!leadSelecionado) return;

    const confirmar = window.confirm(
      `Deseja excluir o lead "${leadSelecionado.nome}"?`
    );
    if (!confirmar) return;

    try {
      setSalvando(true);
      setErro("");

      const res = await fetch(`/api/admin/leads/${leadSelecionado.id}`, {
        method: "DELETE",
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const texto = await res.text();
        console.error("Resposta não-JSON ao excluir lead:", texto);
        throw new Error("A API não retornou JSON ao excluir o lead.");
      }

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Não foi possível excluir o lead.");
      }

      await carregarLeads();
      fecharPainel();
    } catch (err: any) {
      setErro(err?.message || "Não foi possível excluir o lead.");
    } finally {
      setSalvando(false);
    }
  }

  async function moverStatus(id: number, status: string) {
    try {
      setErro("");

      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const texto = await res.text();
        console.error("Resposta não-JSON ao mover lead:", texto);
        throw new Error("A API não retornou JSON ao mover o lead.");
      }

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Não foi possível mover o lead.");
      }

      await carregarLeads();

      if (leadSelecionado?.id === id) {
        setLeadSelecionado({ ...leadSelecionado, status });
        setForm((prev) => ({ ...prev, status }));
      }
    } catch (err: any) {
      setErro(err?.message || "Não foi possível mover o lead.");
    }
  }

  async function registrarInteracao() {
    if (!leadSelecionado || !novaInteracao.trim()) return;

    try {
      setSalvandoInteracao(true);
      setErro("");

      const res = await fetch(
        `/api/admin/leads/${leadSelecionado.id}/interacoes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipo: tipoInteracao,
            descricao: novaInteracao.trim(),
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Não foi possível registrar a interação.");
      }

      setNovaInteracao("");
      await carregarInteracoes(leadSelecionado.id);
      await carregarLeads();
    } catch (err: any) {
      setErro(err?.message || "Não foi possível registrar a interação.");
    } finally {
      setSalvandoInteracao(false);
    }
  }

  function handleDragStart(id: number) {
    setDraggingLeadId(id);
  }

  async function handleDrop(statusDestino: string) {
    if (!draggingLeadId) return;
    await moverStatus(draggingLeadId, statusDestino);
    setDraggingLeadId(null);
  }

  const leadsFiltrados = useMemo(() => {
    let base = [...leads];

    if (filtroTipo) {
      base = base.filter((lead) => lead.tipo === filtroTipo);
    }

    if (filtroFollowUp) {
      base = base.filter((lead) => classificarFollowUp(lead) === filtroFollowUp);
    }

    return ordenarLeads(base);
  }, [leads, filtroTipo, filtroFollowUp]);

  const metricas = useMemo(() => {
    return {
      total: leadsFiltrados.length,
      novos: leadsFiltrados.filter((lead) => lead.status === "NOVO").length,
      contato: leadsFiltrados.filter((lead) => lead.status === "CONTATO").length,
      proposta: leadsFiltrados.filter((lead) => lead.status === "PROPOSTA").length,
      fechados: leadsFiltrados.filter((lead) => lead.status === "FECHADO").length,
      perdidos: leadsFiltrados.filter((lead) => lead.status === "PERDIDO").length,
      pipeline: leadsFiltrados
        .filter((lead) => lead.status === "PROPOSTA" || lead.status === "FECHADO")
        .reduce((acc, lead) => acc + (lead.valorEstimado || 0), 0),
      followupAtrasado: leadsFiltrados.filter(
        (lead) => classificarFollowUp(lead) === "atrasado"
      ).length,
      followupHoje: leadsFiltrados.filter(
        (lead) => classificarFollowUp(lead) === "hoje"
      ).length,
    };
  }, [leadsFiltrados]);

  const origensDisponiveis = useMemo(() => {
    return Array.from(
      new Set(leads.map((lead) => lead.origem).filter(Boolean))
    ).sort();
  }, [leads]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-[1700px]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
              CRM Comercial
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Painel de Leads PHANYX
            </h1>
            <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
              Gerencie os leads comerciais da PHANYX e, futuramente, os leads internos
              das instituições que aderirem à plataforma. Organize o funil, mova etapas
              e acompanhe oportunidades com visão estratégica.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNovoLead}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-[0_15px_35px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-500"
          >
            Novo lead manual
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-9">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{metricas.total}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Novos</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{metricas.novos}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Em contato</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{metricas.contato}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Proposta</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{metricas.proposta}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Fechados</p>
            <p className="mt-3 text-4xl font-bold text-emerald-600">{metricas.fechados}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Perdidos</p>
            <p className="mt-3 text-4xl font-bold text-rose-600">{metricas.perdidos}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Follow-up hoje</p>
            <p className="mt-3 text-4xl font-bold text-amber-600">{metricas.followupHoje}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Atrasados</p>
            <p className="mt-3 text-4xl font-bold text-red-600">{metricas.followupAtrasado}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Pipeline comercial</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {formatarMoeda(metricas.pipeline)}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold text-blue-800">
            Recurso SaaS em evolução
          </p>
          <p className="mt-1 text-sm leading-6 text-blue-700">
            Leads do tipo <strong>PHANYX</strong> representam oportunidades comerciais da
            plataforma. Leads do tipo <strong>INSTITUICAO</strong> preparam o CRM interno
            das instituições e podem ser liberados futuramente como funcionalidade de plano premium.
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_250px_220px]">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, email, telefone, instituição ou observação"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition focus:border-blue-500"
            />

            <select
              value={filtroOrigem}
              onChange={(e) => setFiltroOrigem(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition focus:border-blue-500"
            >
              <option value="">Todas as origens</option>
              {origensDisponiveis.map((origem) => (
                <option key={origem} value={origem}>
                  {origem}
                </option>
              ))}
            </select>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition focus:border-blue-500"
            >
              <option value="PHANYX">Leads PHANYX (CRM comercial)</option>
              <option value="INSTITUICAO">Leads das instituições (premium)</option>
              <option value="">Todos os tipos</option>
            </select>

            <select
              value={filtroFollowUp}
              onChange={(e) => setFiltroFollowUp(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition focus:border-blue-500"
            >
              <option value="">Todo follow-up</option>
              <option value="hoje">Follow-up hoje</option>
              <option value="atrasado">Atrasado</option>
              <option value="sem_followup_alerta">Precisa definir</option>
              <option value="sem_followup_critico">Sem follow-up há dias</option>
              <option value="ok">Em dia</option>
            </select>
          </div>
        </div>

        {erro ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        ) : null}

        {carregando ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-10 text-slate-600 shadow-sm">
            Carregando leads...
          </div>
        ) : (
          <div className="mt-8 grid gap-5 xl:grid-cols-5">
            {STATUS_COLUNAS.map((coluna) => {
              const leadsDaColuna = ordenarLeads(
                leadsFiltrados.filter((lead) => lead.status === coluna.key)
              );

              return (
                <div
                  key={coluna.key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(coluna.key)}
                  className={`rounded-[28px] border p-4 shadow-sm transition ${
                    draggingLeadId
                      ? "border-blue-300 bg-blue-50/30"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {coluna.titulo}
                    </h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {leadsDaColuna.length}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {leadsDaColuna.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 px-4 py-12 text-center text-sm text-slate-400">
                        Nenhum lead nesta etapa
                      </div>
                    ) : null}

                    {leadsDaColuna.map((lead) => {
                      const score = calcularScore(lead);

                      return (
                        <button
                          key={lead.id}
                          type="button"
                          draggable
                          onDragStart={() => handleDragStart(lead.id)}
                          onDragEnd={() => setDraggingLeadId(null)}
                          onClick={() => abrirEdicao(lead)}
                          className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">
                                {lead.nome}
                              </h3>

                              <span
                                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${classeScore(
                                  score
                                )}`}
                              >
                                {rotuloScore(score)}
                              </span>

                              <p className="mt-1 text-sm text-slate-500">
                                {lead.instituicaoNome ||
                                  (lead.tipo === "PHANYX"
                                    ? "Lead comercial PHANYX"
                                    : "Instituição não informada")}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${classePrioridade(
                                  lead.prioridade
                                )}`}
                              >
                                {lead.prioridade}
                              </span>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${classeTipo(
                                  lead.tipo
                                )}`}
                              >
                                {lead.tipo}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${classeScore(
                                score
                              )}`}
                            >
                              Score {score} • {rotuloScore(score)}
                            </span>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${classeFollowUp(
                                lead
                              )}`}
                            >
                              {textoFollowUp(lead)}
                            </span>
                          </div>

                          <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                            <p>📧 {lead.email}</p>
                            <p>📞 {lead.telefone || "Não informado"}</p>
                            <p>💼 {lead.cargo || "Cargo não informado"}</p>
                            <p>
                              🏢{" "}
                              {lead.tipo === "PHANYX"
                                ? "Lead comercial da PHANYX"
                                : lead.instituicaoNome || "Instituição não informada"}
                            </p>
                            <p>🏷 Origem: {lead.origem}</p>
                            <p>💰 Valor: {formatarMoeda(lead.valorEstimado)}</p>
                            <p>📅 Próximo contato: {formatarData(lead.proximoContatoEm)}</p>
                          </div>

                          {lead.interesse ? (
                            <div className="mt-4 rounded-2xl bg-white px-3 py-2 text-sm text-slate-600">
                              <strong className="text-slate-800">Interesse:</strong>{" "}
                              {lead.interesse}
                            </div>
                          ) : null}

                          <div className="mt-4 rounded-2xl bg-white px-3 py-2 text-xs text-slate-500">
                            Criado em {formatarData(lead.createdAt)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(criandoNovo || leadSelecionado) && (
          <div className="fixed inset-0 z-50 bg-slate-950/45 p-4">
            <div className="ml-auto h-full w-full max-w-4xl overflow-y-auto rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                    {criandoNovo ? "Novo lead" : "Editar lead"}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">
                    {criandoNovo ? "Cadastrar lead manualmente" : form.nome || "Lead"}
                  </h2>

                  {criandoNovo ? (
                    <p className="mt-2 text-sm text-slate-500">
                      O cadastro manual inicia por padrão como lead <strong>PHANYX</strong>, mas
                      você pode alterar para <strong>INSTITUICAO</strong> no formulário.
                    </p>
                  ) : null}

                  {!criandoNovo && leadSelecionado ? (
                    <p className="mt-2 text-sm text-slate-500">
                      Criado em {formatarDataHora(leadSelecionado.createdAt)}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={fecharPainel}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Nome
                  </label>
                  <input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Telefone
                  </label>
                  <input
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Instituição
                  </label>
                  <input
                    value={form.instituicaoNome}
                    onChange={(e) =>
                      setForm({ ...form, instituicaoNome: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    ID da instituição
                  </label>
                  <input
                    value={form.instituicaoId}
                    onChange={(e) =>
                      setForm({ ...form, instituicaoId: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Cargo
                  </label>
                  <input
                    value={form.cargo}
                    onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Origem
                  </label>
                  <input
                    value={form.origem}
                    onChange={(e) => setForm({ ...form, origem: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Tipo
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  >
                    {TIPO_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Use <strong>PHANYX</strong> para oportunidades comerciais da plataforma e{" "}
                    <strong>INSTITUICAO</strong> para leads internos da instituição.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Interesse
                  </label>
                  <input
                    value={form.interesse}
                    onChange={(e) =>
                      setForm({ ...form, interesse: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Responsável
                  </label>
                  <input
                    value={form.responsavelNome}
                    onChange={(e) =>
                      setForm({ ...form, responsavelNome: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  >
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Prioridade
                  </label>
                  <select
                    value={form.prioridade}
                    onChange={(e) =>
                      setForm({ ...form, prioridade: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  >
                    {PRIORIDADE_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Valor estimado
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valorEstimado}
                    onChange={(e) =>
                      setForm({ ...form, valorEstimado: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Próximo contato
                  </label>
                  <input
                    type="datetime-local"
                    value={form.proximoContatoEm}
                    onChange={(e) =>
                      setForm({ ...form, proximoContatoEm: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Último contato
                  </label>
                  <input
                    type="datetime-local"
                    value={form.ultimoContatoEm}
                    onChange={(e) =>
                      setForm({ ...form, ultimoContatoEm: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Observações
                  </label>
                  <textarea
                    rows={5}
                    value={form.observacoes}
                    onChange={(e) =>
                      setForm({ ...form, observacoes: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Histórico de interações
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Registre contatos, reuniões, emails e observações comerciais.
                    </p>
                  </div>

                  {leadSelecionado ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                      Último contato: {formatarDataHora(leadSelecionado.ultimoContatoEm)}
                    </div>
                  ) : null}
                </div>

                {leadSelecionado ? (
                  <>
                    <div className="mt-5 grid gap-3 md:grid-cols-[180px_1fr_auto]">
                      <select
                        value={tipoInteracao}
                        onChange={(e) => setTipoInteracao(e.target.value)}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                      >
                        {TIPO_INTERACAO_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>

                      <textarea
                        rows={2}
                        value={novaInteracao}
                        onChange={(e) => setNovaInteracao(e.target.value)}
                        placeholder="Descreva o contato realizado com o lead..."
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                      />

                      <button
                        type="button"
                        onClick={registrarInteracao}
                        disabled={salvandoInteracao}
                        className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70"
                      >
                        {salvandoInteracao ? "Registrando..." : "Registrar"}
                      </button>
                    </div>

                    <div className="mt-5 space-y-3">
                      {interacoes.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
                          Nenhuma interação registrada ainda.
                        </div>
                      ) : null}

                      {interacoes.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              {item.tipo}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatarDataHora(item.createdAt)}
                            </span>
                            {item.usuario ? (
                              <span className="text-xs text-slate-500">
                                • {item.usuario}
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {item.descricao}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    Salve o lead primeiro para liberar o histórico de interações.
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={salvarLead}
                  disabled={salvando}
                  className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70"
                >
                  {salvando ? "Salvando..." : "Salvar lead"}
                </button>

                {!criandoNovo && leadSelecionado && (
                  <button
                    type="button"
                    onClick={excluirLead}
                    disabled={salvando}
                    className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-70"
                  >
                    Excluir
                  </button>
                )}

                {!criandoNovo && leadSelecionado && (
                  <div className="ml-auto flex flex-wrap gap-2">
                    {STATUS_OPTIONS.filter((status) => status !== form.status).map(
                      (status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => moverStatus(leadSelecionado.id, status)}
                          className="rounded-2xl border border-slate-300 px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Mover para {status}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

