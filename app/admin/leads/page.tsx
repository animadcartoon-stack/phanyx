"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

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
  instituicaoGestoraId?: number | null;
  responsavelFuncionarioId?: number | null;
  matriculaConvertida?: {
    id: number;
    alunoId: number;
    numeroMatricula?: string | null;
    status?: string | null;
  } | null;
  cursoInteresse?: {
    id: number;
    nome: string;
  } | null;

  poloInteresse?: {
    id: number;
    nome: string;
  } | null;

  captacaoMaisRecente?: {
    id: number;
    recebidoEm: string;

    consentimentoLgpd: boolean;
    consentimentoEm?: string | null;

    canal?: {
      id: number;
      nome: string;
      tipo: string;
    } | null;

    campanha?: {
      id: number;
      nome: string;
      codigo: string;
    } | null;

    formulario?: {
      id: number;
      nome: string;
      titulo: string;
    } | null;
  } | null;
};

type Interacao = {
  id: number;
  leadId: number;
  tipo: string;
  descricao: string;
  usuario?: string | null;
  createdAt: string;
};

type ResponsavelLead = {
  id: number;
  nome: string;
  cargo?: string | null;
  setor?: string | null;
  departamento?: {
    id: number;
    nome: string;
  } | null;
  possuiAcessoAoSistema: boolean;
};

type UsuarioContexto = {
  id?: number;
  nome?: string | null;
  email?: string;
  role?: string;
  instituicaoId?: number | null;
  isMasterAdmin?: boolean;
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
  responsavelFuncionarioId: string;
};

const STATUS_OPTIONS = ["NOVO", "CONTATO", "PROPOSTA", "FECHADO", "PERDIDO"];
const PRIORIDADE_OPTIONS = ["BAIXA", "MEDIA", "ALTA"];

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
  responsavelFuncionarioId: "",
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
  if (prioridade === "ALTA") {
    return "border-red-700 bg-red-600 text-white shadow-sm dark:border-red-400 dark:bg-red-500 dark:text-white";
  }

  if (prioridade === "MEDIA") {
    return "border-amber-600 bg-amber-400 text-slate-950 shadow-sm dark:border-amber-400 dark:bg-amber-500 dark:text-slate-950";
  }

  return "border-slate-700 bg-slate-800 text-white shadow-sm dark:border-slate-500 dark:bg-slate-700 dark:text-white";
}

function classeTipo(tipo: string) {
  if (tipo === "INSTITUICAO") {
    return "border-blue-700 bg-blue-600 text-white shadow-sm dark:border-blue-400 dark:bg-blue-500 dark:text-white";
  }

  return "border-emerald-700 bg-emerald-600 text-white shadow-sm dark:border-emerald-400 dark:bg-emerald-500 dark:text-white";
}

function classeStatus(status: string) {
  if (status === "FECHADO") {
    return "border-emerald-600 bg-emerald-100 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-300";
  }

  if (status === "PERDIDO") {
    return "border-red-600 bg-red-100 text-red-800 dark:border-red-500 dark:bg-red-950/50 dark:text-red-300";
  }

  if (status === "PROPOSTA") {
    return "border-violet-600 bg-violet-100 text-violet-800 dark:border-violet-500 dark:bg-violet-950/50 dark:text-violet-300";
  }

  if (status === "CONTATO") {
    return "border-amber-600 bg-amber-100 text-amber-800 dark:border-amber-500 dark:bg-amber-950/50 dark:text-amber-300";
  }

  return "border-slate-500 bg-slate-100 text-slate-800 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100";
}

function rotuloTipoLead(tipo: string) {
  const valor = String(tipo || "").trim().toUpperCase();

  if (valor === "INSTITUICAO") return "INSTITUIÇÃO";

  // FORMAX é legado/teste antigo. Visualmente mostramos como PHANYX.
  return "PHANYX";
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

  if (situacao === "atrasado") return "Acompanhamento atrasado";
  if (situacao === "hoje") return "Acompanhamento hoje";
  if (situacao === "sem_followup_critico") {
    return "Sem acompanhamento há muitos dias";
  }
  if (situacao === "sem_followup_alerta") {
    return "Definir próximo contato";
  }
  return "Em dia";
}

function classeFollowUp(lead: Lead) {
  const situacao = classificarFollowUp(lead);

  if (situacao === "atrasado" || situacao === "sem_followup_critico") {
    return "border-red-700 bg-red-600 text-white shadow-sm dark:border-red-400 dark:bg-red-500 dark:text-white";
  }

  if (situacao === "hoje" || situacao === "sem_followup_alerta") {
    return "border-amber-600 bg-amber-400 text-slate-950 shadow-sm dark:border-amber-400 dark:bg-amber-500 dark:text-slate-950";
  }

  return "border-emerald-700 bg-emerald-600 text-white shadow-sm dark:border-emerald-400 dark:bg-emerald-500 dark:text-white";
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
  if (score >= 75) {
    return "border-red-700 bg-red-600 text-white shadow-sm dark:border-red-400 dark:bg-red-500 dark:text-white";
  }

  if (score >= 45) {
    return "border-amber-600 bg-amber-400 text-slate-950 shadow-sm dark:border-amber-400 dark:bg-amber-500 dark:text-slate-950";
  }

  return "border-slate-700 bg-slate-800 text-white shadow-sm dark:border-slate-500 dark:bg-slate-700 dark:text-white";
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

type OpcaoFiltro = {
  value: string;
  label: string;
};

type FiltroSelectProps = {
  value: string;
  ariaLabel: string;
  options: OpcaoFiltro[];
  onChange: (value: string) => void;
};

function FiltroSelect({
  value,
  ariaLabel,
  options,
  onChange,
}: FiltroSelectProps) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const opcaoSelecionada =
    options.find((option) => option.value === value) ||
    options[0];

  useEffect(() => {
    function fecharAoClicarFora(event: MouseEvent) {
      const alvo = event.target as Node;

      if (
        containerRef.current &&
        !containerRef.current.contains(alvo)
      ) {
        setAberto(false);
      }
    }

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAberto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      fecharAoClicarFora
    );

    document.addEventListener(
      "keydown",
      fecharComEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharAoClicarFora
      );

      document.removeEventListener(
        "keydown",
        fecharComEscape
      );
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
        className="phanyx-leads-filter-trigger flex min-h-[54px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left font-semibold outline-none transition"
      >
        <span className="phanyx-leads-filter-label truncate font-semibold">
          {opcaoSelecionada?.label}
        </span>

        <span
          aria-hidden="true"
          className={[
            "phanyx-leads-filter-arrow text-xs transition-transform",
            aberto ? "rotate-180" : "",
          ].join(" ")}
        >
          ▼
        </span>
      </button>

      {aberto && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="phanyx-leads-filter-menu absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl border p-1.5 shadow-2xl"
        >
          {options.map((option) => {
            const selecionada =
              option.value === value;

            return (
              <button
                key={`${ariaLabel}-${option.value}`}
                type="button"
                role="option"
                aria-selected={selecionada}
                onClick={() => {
                  onChange(option.value);
                  setAberto(false);
                }}
                className={[
                  "phanyx-leads-filter-option flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                  selecionada ? "is-selected font-bold" : "",
                ].join(" ")}
              >
                <span>{option.label}</span>

                {selecionada ? (
                  <span
                    aria-hidden="true"
                    className="phanyx-leads-filter-check font-black"
                  >
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminLeadsPage() {
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [usuarioContexto, setUsuarioContexto] =
    useState<UsuarioContexto | null>(null);

  const [carregandoContexto, setCarregandoContexto] =
    useState(true);

  const ehCrmGlobalPhanyx =
    usuarioContexto?.isMasterAdmin === true &&
    !usuarioContexto?.instituicaoId;

  const [popupErro, setPopupErro] = useState<string | null>(
    null
  );

  const [busca, setBusca] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");
  const [filtroResponsavel, setFiltroResponsavel] = useState("");
  const [filtroFollowUp, setFiltroFollowUp] = useState("");
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [leadParaExcluir, setLeadParaExcluir] = useState<Lead | null>(null);

  const [responsaveisLeads, setResponsaveisLeads] = useState<
    ResponsavelLead[]
  >([]);

  const [carregandoResponsaveis, setCarregandoResponsaveis] =
    useState(false);

  const [erroResponsaveis, setErroResponsaveis] =
    useState("");

  const [form, setForm] = useState<LeadForm>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [criandoNovo, setCriandoNovo] = useState(false);

  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [novaInteracao, setNovaInteracao] = useState("");
  const [tipoInteracao, setTipoInteracao] = useState("WHATSAPP");
  const [salvandoInteracao, setSalvandoInteracao] = useState(false);

  async function carregarContextoUsuario() {
    try {
      setCarregandoContexto(true);

      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });

      const contentType =
        res.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "Não foi possível identificar o contexto do usuário."
        );
      }

      const json = await res.json();

      if (!res.ok || !json?.user) {
        throw new Error(
          json?.error ||
          "Não foi possível identificar o usuário autenticado."
        );
      }

      setUsuarioContexto(json.user);
    } catch (err: any) {
      setUsuarioContexto(null);

      setErro(
        err?.message ||
        "Não foi possível identificar o contexto do CRM."
      );
    } finally {
      setCarregandoContexto(false);
    }
  }

  async function carregarResponsaveisLeads() {
    try {
      setCarregandoResponsaveis(true);
      setErroResponsaveis("");

      const res = await fetch(
        "/api/admin/comercial/responsaveis-leads",
        {
          cache: "no-store",
        }
      );

      const contentType =
        res.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const texto = await res.text();

        console.error(
          "Resposta não-JSON em responsáveis por leads:",
          texto
        );

        throw new Error(
          "A API de responsáveis não retornou JSON."
        );
      }

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.error ||
          "Não foi possível carregar os responsáveis."
        );
      }

      setResponsaveisLeads(
        Array.isArray(json) ? json : []
      );
    } catch (err: any) {
      setErroResponsaveis(
        err?.message ||
        "Não foi possível carregar os responsáveis."
      );

      setResponsaveisLeads([]);
    } finally {
      setCarregandoResponsaveis(false);
    }
  }

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
    carregarContextoUsuario();
    carregarResponsaveisLeads();
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
    setForm({
      ...FORM_INICIAL,
      origem: ehCrmGlobalPhanyx
        ? "SITE_PHANYX"
        : "ADMIN_MANUAL",
      tipo: ehCrmGlobalPhanyx
        ? "PHANYX"
        : "INSTITUICAO",
      instituicaoId: "",
      responsavelFuncionarioId: "",
    });
  }

  async function abrirEdicao(
    lead: Lead
  ) {
    try {
      setErro("");

      const res = await fetch(
        `/api/admin/leads/${lead.id}`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const contentType =
        res.headers.get(
          "content-type"
        ) || "";

      if (
        !contentType.includes(
          "application/json"
        )
      ) {
        throw new Error(
          "A API não retornou os detalhes do lead corretamente."
        );
      }

      const json =
        await res.json();

      if (!res.ok) {
        throw new Error(
          json?.error ||
          "Não foi possível carregar os detalhes do lead."
        );
      }

      const leadDetalhado =
        json as Lead;

      setCriandoNovo(false);

      setLeadSelecionado(
        leadDetalhado
      );

      setForm({
        nome:
          leadDetalhado.nome ||
          "",

        email:
          leadDetalhado.email ||
          "",

        telefone:
          leadDetalhado.telefone ||
          "",

        instituicaoNome:
          leadDetalhado.instituicaoNome ||
          "",

        instituicaoId:
          leadDetalhado.instituicaoId !==
            null &&
            leadDetalhado.instituicaoId !==
            undefined
            ? String(
              leadDetalhado.instituicaoId
            )
            : "",

        cargo:
          leadDetalhado.cargo ||
          "",

        origem:
          leadDetalhado.origem ||
          "SITE_PHANYX",

        tipo:
          leadDetalhado.tipo ||
          "PHANYX",

        interesse:
          leadDetalhado.interesse ||
          "",

        observacoes:
          leadDetalhado.observacoes ||
          "",

        status:
          leadDetalhado.status ||
          "NOVO",

        prioridade:
          leadDetalhado.prioridade ||
          "MEDIA",

        valorEstimado:
          leadDetalhado.valorEstimado !==
            null &&
            leadDetalhado.valorEstimado !==
            undefined
            ? String(
              leadDetalhado.valorEstimado
            )
            : "",

        proximoContatoEm:
          paraDatetimeLocal(
            leadDetalhado.proximoContatoEm
          ),

        ultimoContatoEm:
          paraDatetimeLocal(
            leadDetalhado.ultimoContatoEm
          ),

        responsavelFuncionarioId:
          leadDetalhado
            .responsavelFuncionarioId !==
            null &&
            leadDetalhado
              .responsavelFuncionarioId !==
            undefined
            ? String(
              leadDetalhado
                .responsavelFuncionarioId
            )
            : "",
      });

      await carregarInteracoes(
        leadDetalhado.id
      );
    } catch (err: any) {
      setPopupErro(
        err?.message ||
        "Não foi possível abrir o lead."
      );
    }
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
    if (!form.nome.trim() || !form.email.trim()) {
      setPopupErro(
        "Preencha o nome e o e-mail do interessado antes de salvar."
      );
      return;
    }
    try {
      setSalvando(true);
      setErro("");

      const {
        responsavelFuncionarioId,
        instituicaoId,
        ultimoContatoEm: _ultimoContatoControladoPeloSistema,
        ...demaisCampos
      } = form;

      const payload = {
        ...demaisCampos,

        tipo: ehCrmGlobalPhanyx
          ? "PHANYX"
          : "INSTITUICAO",

        valorEstimado:
          form.valorEstimado === ""
            ? null
            : Number(form.valorEstimado),

        proximoContatoEm:
          form.proximoContatoEm || null,

        ...(ehCrmGlobalPhanyx
          ? {
            instituicaoId:
              instituicaoId === ""
                ? null
                : Number(instituicaoId),
          }
          : {}),

        ...(!ehCrmGlobalPhanyx
          ? {
            responsavelFuncionarioId:
              responsavelFuncionarioId === ""
                ? null
                : Number(responsavelFuncionarioId),
          }
          : {}),
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
      setPopupErro(
        err?.message || "Não foi possível salvar o lead."
      );
    } finally {
      setSalvando(false);
    }
  }

  function iniciarConversaoEmMatricula() {
    if (!leadSelecionado) return;

    if (leadSelecionado.tipo !== "INSTITUICAO") {
      setPopupErro(
        "Somente leads institucionais podem ser convertidos em aluno e matrícula."
      );

      return;
    }

    router.push(
      `/admin/alunos?leadId=${leadSelecionado.id}`
    );
  }

  function abrirMatriculaConvertida() {
    const matricula =
      leadSelecionado
        ?.matriculaConvertida;

    if (!matricula?.id) {
      setPopupErro(
        "Não foi possível identificar a matrícula vinculada a este lead."
      );

      return;
    }

    router.push(
      `/admin/matriculas?matriculaId=${matricula.id}`
    );
  }

  function excluirLead() {
    if (!leadSelecionado) return;
    setLeadParaExcluir(leadSelecionado);
  }

  async function confirmarExclusaoLead() {
    if (!leadParaExcluir) return;

    try {
      setSalvando(true);
      setErro("");

      const res = await fetch(`/api/admin/leads/${leadParaExcluir.id}`, {
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
      setLeadParaExcluir(null);
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

  const leadsFiltrados = useMemo(() => {
    let base = [...leads];

    if (filtroTipo) {
      base = base.filter(
        (lead) => lead.tipo === filtroTipo
      );
    }

    if (filtroStatus) {
      base = base.filter(
        (lead) => lead.status === filtroStatus
      );
    }

    if (filtroPrioridade) {
      base = base.filter(
        (lead) => lead.prioridade === filtroPrioridade
      );
    }

    if (filtroResponsavel) {
      if (filtroResponsavel === "SEM_RESPONSAVEL") {
        base = base.filter(
          (lead) => !lead.responsavelFuncionarioId
        );
      } else {
        base = base.filter(
          (lead) =>
            String(
              lead.responsavelFuncionarioId || ""
            ) === filtroResponsavel
        );
      }
    }

    if (filtroFollowUp) {
      base = base.filter(
        (lead) =>
          classificarFollowUp(lead) === filtroFollowUp
      );
    }

    return ordenarLeads(base);
  }, [
    leads,
    filtroTipo,
    filtroStatus,
    filtroPrioridade,
    filtroResponsavel,
    filtroFollowUp,
  ]);

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
    <div className="phanyx-leads-page min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-[1700px]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
              {ehCrmGlobalPhanyx
                ? "CRM Comercial PHANYX"
                : "Comercial da instituição"}
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
              {ehCrmGlobalPhanyx
                ? "Painel de Leads PHANYX"
                : "Leads e oportunidades"}
            </h1>

            <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
              {ehCrmGlobalPhanyx
                ? "Gerencie os interessados na plataforma PHANYX, acompanhe contatos, propostas e oportunidades comerciais."
                : "Cadastre interessados, distribua leads entre os responsáveis comerciais e acompanhe cada oportunidade até a conversão em matrícula."}
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNovoLead}
            disabled={
              carregandoContexto ||
              !usuarioContexto
            }
            className="phanyx-btn-primary min-h-[56px] w-full whitespace-nowrap px-8 text-base disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {carregandoContexto
              ? "Carregando..."
              : !usuarioContexto
                ? "Contexto indisponível"
                : "Novo lead manual"}
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9">
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
            <p className="text-sm text-slate-500">Acompanhamento hoje</p>
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

        <div className="phanyx-leads-info-card mt-6 rounded-3xl border px-5 py-4 shadow-sm">
          <p className="phanyx-leads-info-title font-bold">
            Leitura do CRM
          </p>
          <p className="phanyx-leads-info-text mt-1 text-sm leading-6">
            Este painel acompanha oportunidades comerciais e o acompanhamento dos leads.
            Pagamentos reais via Asaas, matrículas do Bacharel Livre em Teologia e
            compras de recursos como IA aparecem no Painel Master, não no CRM de leads.
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Busca inteligente: nome, e-mail, telefone, instituição, interesse, responsável ou observação"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition focus:border-blue-500 md:col-span-2 xl:col-span-3 2xl:col-span-2"
            />

            <FiltroSelect
              ariaLabel="Filtrar leads por origem"
              value={filtroOrigem}
              onChange={setFiltroOrigem}
              options={[
                {
                  value: "",
                  label: "Todas as origens",
                },
                ...origensDisponiveis.map((origem) => ({
                  value: origem,
                  label: origem,
                })),
              ]}
            />

            <FiltroSelect
              ariaLabel="Filtrar leads por status"
              value={filtroStatus}
              onChange={setFiltroStatus}
              options={[
                {
                  value: "",
                  label: "Todos os status",
                },
                {
                  value: "NOVO",
                  label: "Novo",
                },
                {
                  value: "CONTATO",
                  label: "Em contato",
                },
                {
                  value: "PROPOSTA",
                  label: "Proposta",
                },
                {
                  value: "FECHADO",
                  label: "Fechado",
                },
                {
                  value: "PERDIDO",
                  label: "Perdido",
                },
              ]}
            />

            <FiltroSelect
              ariaLabel="Filtrar leads por responsável"
              value={filtroResponsavel}
              onChange={setFiltroResponsavel}
              options={[
                {
                  value: "",
                  label: "Todos os responsáveis",
                },
                {
                  value: "SEM_RESPONSAVEL",
                  label: "Sem responsável",
                },
                ...responsaveisLeads.map((responsavel) => ({
                  value: String(responsavel.id),
                  label: responsavel.nome,
                })),
              ]}
            />

            <FiltroSelect
              ariaLabel="Filtrar leads por prioridade"
              value={filtroPrioridade}
              onChange={setFiltroPrioridade}
              options={[
                {
                  value: "",
                  label: "Todas as prioridades",
                },
                {
                  value: "ALTA",
                  label: "Alta",
                },
                {
                  value: "MEDIA",
                  label: "Média",
                },
                {
                  value: "BAIXA",
                  label: "Baixa",
                },
              ]}
            />

            <FiltroSelect
              ariaLabel="Filtrar leads por situação do acompanhamento"
              value={filtroFollowUp}
              onChange={setFiltroFollowUp}
              options={[
                {
                  value: "",
                  label: "Todo acompanhamento",
                },
                {
                  value: "hoje",
                  label: "Acompanhamento hoje",
                },
                {
                  value: "atrasado",
                  label: "Acompanhamento atrasado",
                },
                {
                  value: "sem_followup_alerta",
                  label: "Definir próximo contato",
                },
                {
                  value: "sem_followup_critico",
                  label: "Sem acompanhamento há dias",
                },
                {
                  value: "ok",
                  label: "Em dia",
                },
              ]}
            />

            {ehCrmGlobalPhanyx && (
              <FiltroSelect
                ariaLabel="Filtrar leads por tipo"
                value={filtroTipo}
                onChange={setFiltroTipo}
                options={[
                  {
                    value: "",
                    label: "Todos os tipos",
                  },
                  {
                    value: "PHANYX",
                    label: "Leads PHANYX",
                  },
                  {
                    value: "INSTITUICAO",
                    label: "Leads das instituições",
                  },
                ]}
              />
            )}

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
          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Listagem de leads
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {leadsFiltrados.length}{" "}
                  {leadsFiltrados.length === 1
                    ? "lead encontrado"
                    : "leads encontrados"}
                </p>
              </div>

              <div className="text-xs font-semibold text-slate-500">
                Clique em Detalhes para editar, registrar interações ou alterar a etapa.
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-left">
                <thead className="bg-slate-100">
                  <tr className="border-b border-slate-200">
                    <th className="w-[20%] px-4 py-4 text-xs font-black uppercase tracking-wide text-slate-600">
                      Lead e contato
                    </th>

                    <th className="w-[19%] px-4 py-4 text-xs font-black uppercase tracking-wide text-slate-600">
                      Instituição e interesse
                    </th>

                    <th className="w-[14%] px-4 py-4 text-xs font-black uppercase tracking-wide text-slate-600">
                      Responsável
                    </th>

                    <th className="w-[11%] px-4 py-4 text-xs font-black uppercase tracking-wide text-slate-600">
                      Etapa
                    </th>

                    <th className="w-[15%] px-4 py-4 text-xs font-black uppercase tracking-wide text-slate-600">
                      Acompanhamento
                    </th>

                    <th className="w-[10%] px-4 py-4 text-xs font-black uppercase tracking-wide text-slate-600">
                      Valor
                    </th>

                    <th className="sticky right-0 z-20 w-[11%] bg-slate-100 px-3 py-4 text-center text-xs font-black uppercase tracking-wide text-slate-600">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {leadsFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-16 text-center"
                      >
                        <p className="text-base font-bold text-slate-700">
                          Nenhum lead encontrado
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          Ajuste a busca ou os filtros para visualizar outros resultados.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    leadsFiltrados.map((lead) => {
                      const score = calcularScore(lead);

                      return (
                        <tr
                          key={lead.id}
                          className="group transition hover:bg-slate-50"
                        >
                          <td className="px-4 py-4 align-top">
                            <button
                              type="button"
                              onClick={() => abrirEdicao(lead)}
                              className="max-w-[220px] text-left text-base font-black text-slate-900 transition hover:text-blue-700"
                            >
                              {lead.nome}
                            </button>

                            <p
                              title={lead.email}
                              className="mt-2 max-w-[220px] truncate text-sm text-slate-600"
                            >
                              {lead.email}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {lead.telefone || "Telefone não informado"}
                            </p>

                            <p
                              title={lead.origem}
                              className="mt-2 max-w-[220px] truncate text-xs font-semibold text-slate-500"
                            >
                              Origem: {lead.origem}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${classeScore(
                                  score
                                )}`}
                              >
                                Score {score} · {rotuloScore(score)}
                              </span>

                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${classeTipo(
                                  lead.tipo
                                )}`}
                              >
                                {rotuloTipoLead(lead.tipo)}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p
                              title={lead.instituicaoNome || ""}
                              className="max-w-[210px] font-semibold text-slate-800"
                            >
                              {lead.instituicaoNome ||
                                "Instituição não informada"}
                            </p>

                            <p className="mt-2 max-w-[210px] text-sm leading-5 text-slate-500">
                              {lead.interesse ||
                                "Interesse não informado"}
                            </p>

                            <p className="mt-2 max-w-[210px] text-xs text-slate-500">
                              Cargo:{" "}
                              {lead.cargo ||
                                "não informado"}
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="max-w-[145px] font-semibold text-slate-800">
                              {lead.responsavelNome ||
                                "Sem responsável"}
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-col items-start gap-2">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${classeStatus(
                                  lead.status
                                )}`}
                              >
                                {lead.status}
                              </span>

                              <span
                                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${classePrioridade(
                                  lead.prioridade
                                )}`}
                              >
                                {lead.prioridade}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${classeFollowUp(
                                lead
                              )}`}
                            >
                              {textoFollowUp(lead)}
                            </span>

                            <p className="mt-2 whitespace-nowrap text-xs text-slate-500">
                              Próximo:{" "}
                              {formatarData(lead.proximoContatoEm)}
                            </p>

                            <p className="mt-1 whitespace-nowrap text-xs text-slate-500">
                              Último:{" "}
                              {formatarData(lead.ultimoContatoEm)}
                            </p>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <p className="whitespace-nowrap font-black text-slate-900">
                              {formatarMoeda(lead.valorEstimado)}
                            </p>

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              Criado em{" "}
                              {formatarData(lead.createdAt)}
                            </p>
                          </td>

                          <td className="sticky right-0 z-10 bg-white px-3 py-4 text-center align-top group-hover:bg-slate-50">
                            <div className="flex min-w-[108px] flex-col gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/admin/comercial/leads/${lead.id}`
                                  )
                                }
                                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700 dark:border-slate-200 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                              >
                                Ficha 360°
                              </button>

                              <button
                                type="button"
                                onClick={() => abrirEdicao(lead)}
                                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 transition hover:border-blue-500 hover:text-blue-700"
                              >
                                Detalhes
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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
                      {ehCrmGlobalPhanyx
                        ? "Este lead será registrado no CRM comercial global da PHANYX."
                        : "Este lead será registrado automaticamente no CRM desta instituição."}
                    </p>
                  ) : null}

                  {!criandoNovo && leadSelecionado ? (
                    <p className="mt-2 text-sm text-slate-500">
                      Criado em {formatarDataHora(leadSelecionado.createdAt)}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  {!criandoNovo && leadSelecionado ? (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/admin/comercial/leads/${leadSelecionado.id}`
                        )
                      }
                      className="rounded-2xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700 dark:border-slate-200 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                    >
                      Abrir Ficha 360°
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={fecharPainel}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Nome
                  </label>

                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        nome: e.target.value,
                      })
                    }
                    placeholder="Nome completo do interessado"
                    autoComplete="name"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
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

                {ehCrmGlobalPhanyx && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      ID da instituição interessada
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Opcional"
                      value={form.instituicaoId}
                      onChange={(e) =>
                        setForm({ ...form, instituicaoId: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>
                )}

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
                    Contexto do lead
                  </label>

                  <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    {ehCrmGlobalPhanyx
                      ? "PHANYX — CRM comercial global"
                      : "INSTITUIÇÃO — CRM comercial interno"}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Este contexto é definido automaticamente pelo usuário autenticado e
                    não pode ser alterado manualmente.
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
                    Responsável pelo lead
                  </label>

                  <select
                    value={form.responsavelFuncionarioId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        responsavelFuncionarioId: e.target.value,
                      })
                    }
                    disabled={
                      carregandoResponsaveis ||
                      responsaveisLeads.length === 0
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-900"
                  >
                    <option value="">Sem responsável definido</option>

                    {responsaveisLeads.map((responsavel) => (
                      <option
                        key={responsavel.id}
                        value={responsavel.id}
                      >
                        {responsavel.nome}
                        {responsavel.cargo
                          ? ` — ${responsavel.cargo}`
                          : ""}
                        {responsavel.departamento?.nome
                          ? ` — ${responsavel.departamento.nome}`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {carregandoResponsaveis ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Carregando funcionários ativos...
                    </p>
                  ) : null}

                  {erroResponsaveis ? (
                    <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                      {erroResponsaveis}
                    </p>
                  ) : null}

                  {!carregandoResponsaveis &&
                    !erroResponsaveis &&
                    responsaveisLeads.length === 0 ? (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Nenhum funcionário institucional está disponível para
                      atribuição. No CRM global da PHANYX, responsáveis antigos
                      permanecem preservados como histórico.
                    </p>
                  ) : null}

                  {!criandoNovo &&
                    leadSelecionado?.responsavelNome &&
                    !leadSelecionado.responsavelFuncionarioId ? (
                    <p className="mt-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
                      Responsável registrado anteriormente:{" "}
                      <strong>{leadSelecionado.responsavelNome}</strong>
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    value={form.status}
                    disabled={Boolean(
                      leadSelecionado
                        ?.matriculaConvertida
                    )}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:font-bold disabled:text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-200"
                  >
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  {leadSelecionado
                    ?.matriculaConvertida && (
                      <div
                        className="mt-2 rounded-xl border !border-emerald-700 !bg-emerald-50 px-3 py-2 text-sm font-bold leading-5 [--lead-convertido-text:#064e3b] dark:!border-emerald-700 dark:!bg-emerald-950/40 dark:[--lead-convertido-text:#d1fae5]"
                        style={{
                          color: "var(--lead-convertido-text)",
                          WebkitTextFillColor:
                            "var(--lead-convertido-text)",
                          opacity: 1,
                        }}
                      >
                        Este lead originou uma matrícula e deve
                        permanecer com status FECHADO.
                      </div>
                    )}
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
                    Último contato registrado
                  </label>

                  <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    {form.ultimoContatoEm
                      ? formatarDataHora(form.ultimoContatoEm)
                      : "Nenhum contato registrado"}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Atualizado automaticamente quando uma interação comercial é registrada.
                  </p>
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

              {leadSelecionado &&
                (
                  leadSelecionado.cursoInteresse ||
                  leadSelecionado.poloInteresse ||
                  leadSelecionado.captacaoMaisRecente
                ) && (
                  <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        🎯 Origem da captação
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Veja de onde este interessado veio e o que ele selecionou no momento da captação.
                      </p>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Curso de interesse
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {leadSelecionado.cursoInteresse?.nome ||
                            "Não informado"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Unidade
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {leadSelecionado.poloInteresse?.nome ||
                            "Não informada"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Canal
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {leadSelecionado.captacaoMaisRecente?.canal?.nome ||
                            "Não informado"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Campanha
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {leadSelecionado.captacaoMaisRecente?.campanha?.nome ||
                            "Não informada"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Formulário
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {leadSelecionado.captacaoMaisRecente?.formulario?.titulo ||
                            leadSelecionado.captacaoMaisRecente?.formulario?.nome ||
                            "Não informado"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Recebido em
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {leadSelecionado.captacaoMaisRecente?.recebidoEm
                            ? formatarDataHora(
                              leadSelecionado.captacaoMaisRecente.recebidoEm
                            )
                            : "Não informado"}
                        </p>
                      </div>
                    </div>

                    {leadSelecionado.captacaoMaisRecente?.consentimentoLgpd && (
                      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        <span aria-hidden="true">
                          ✓
                        </span>

                        <span>
                          Consentimento para tratamento de dados registrado
                          {leadSelecionado.captacaoMaisRecente.consentimentoEm
                            ? ` em ${formatarDataHora(
                              leadSelecionado.captacaoMaisRecente.consentimentoEm
                            )}`
                            : ""}
                          .
                        </span>
                      </div>
                    )}
                  </div>
                )}

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

                {!criandoNovo &&
                  leadSelecionado &&
                  leadSelecionado.tipo ===
                  "INSTITUICAO" &&
                  !leadSelecionado
                    .matriculaConvertida && (
                    <button
                      type="button"
                      onClick={
                        iniciarConversaoEmMatricula
                      }
                      disabled={salvando}
                      className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Converter em aluno e matrícula
                    </button>
                  )}

                {!criandoNovo &&
                  leadSelecionado
                    ?.matriculaConvertida && (
                    <button
                      type="button"
                      onClick={
                        abrirMatriculaConvertida
                      }
                      className="rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
                    >
                      Ver matrícula
                      {leadSelecionado
                        .matriculaConvertida
                        .numeroMatricula
                        ? ` — ${leadSelecionado.matriculaConvertida.numeroMatricula}`
                        : ` #${leadSelecionado.matriculaConvertida.id}`}
                    </button>
                  )}

                {!criandoNovo &&
                  leadSelecionado &&
                  !leadSelecionado
                    .matriculaConvertida && (
                    <button
                      type="button"
                      onClick={excluirLead}
                      disabled={salvando}
                      className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-70"
                    >
                      Excluir
                    </button>
                  )}

                {!criandoNovo &&
                  leadSelecionado &&
                  !leadSelecionado
                    .matriculaConvertida && (
                    <div className="ml-auto flex flex-wrap gap-2">
                      {STATUS_OPTIONS.filter(
                        (status) =>
                          status !==
                          form.status
                      ).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            moverStatus(
                              leadSelecionado.id,
                              status
                            )
                          }
                          className="rounded-2xl border border-slate-300 px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Mover para {status}
                        </button>
                      ))}
                    </div>
                  )}

              </div>
            </div>
          </div>
        )}
      </div>

      {popupErro && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-popup-erro-lead"
            className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900/70 dark:bg-slate-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl dark:bg-red-950/60">
              ⚠️
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-400">
              Atenção
            </p>

            <h2
              id="titulo-popup-erro-lead"
              className="mt-2 text-2xl font-black text-slate-950 dark:text-white"
            >
              Não foi possível salvar o lead
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {popupErro}
            </p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                autoFocus
                onClick={() => setPopupErro(null)}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {leadParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-red-300">
              Confirmar exclusão
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Excluir lead?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Você está prestes a excluir o lead{" "}
              <strong className="text-white">{leadParaExcluir.nome}</strong>.
              Essa ação remove o registro do CRM comercial.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setLeadParaExcluir(null)}
                disabled={salvando}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarExclusaoLead}
                disabled={salvando}
                className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando ? "Excluindo..." : "Sim, excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}