"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TemaEscolhido = "light" | "dark" | "system";
type ModoTema = "light" | "dark" | "system-dark";

type Responsavel = {
  id: number;
  nome: string;
  cargo: string | null;
};

type Referencia = {
  id: number;
  nome: string;
};

type ProximaTarefa = {
  id: number;
  tipo: string;
  status: string;
  prioridade: string;
  titulo: string;
  agendadaPara: string;
  prazoEm: string | null;
  lembreteEm: string | null;
  responsavelFuncionarioId: number | null;
  responsavelNomeSnapshot: string | null;
};

type MatriculaConvertida = {
  id: number;
  leadOrigemId: number | null;
  numeroMatricula: string | null;
  status: string;
};

type LeadKanban = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  origem: string;
  tipo: string;
  interesse: string | null;
  status: string;
  prioridade: string;
  valorEstimado: number | null;
  proximoContatoEm: string | null;
  ultimoContatoEm: string | null;
  responsavelFuncionarioId: number | null;
  equipeResponsavelId: number | null;
  funilId: number | null;
  etapaFunilId: number | null;
  cursoInteresseId: number | null;
  poloInteresseId: number | null;
  primeiroContatoEm: string | null;
  qualificadoEm: string | null;
  entrouEtapaEm: string | null;
  perdidoEm: string | null;
  encerradoEm: string | null;
  createdAt: string;
  updatedAt: string;

  responsavel: Responsavel | null;
  equipe: Referencia | null;
  curso: Referencia | null;
  polo: Referencia | null;

  proximaTarefa: ProximaTarefa | null;
  acompanhamentoAtrasado: boolean;
  etapaAtrasada: boolean;
  semProximaAcao: boolean;

  matriculaConvertida: MatriculaConvertida | null;
};

type EtapaKanban = {
  id: number;
  nome: string;
  descricao: string | null;
  categoria: string;
  resultado: string;
  ordem: number;
  cor: string;
  probabilidadeConversao: number;
  prazoMaximoHoras: number | null;
  exigeProximaAcao: boolean;
  exigeMotivoPerda: boolean;
  permiteMovimentoManual: boolean;
  totalLeads: number;
  valorEstimado: number;
  temMais: boolean;
  leads: LeadKanban[];
};

type RespostaKanban = {
  success: boolean;
  error?: string;
  codigo?: string;

  permissoes: {
    podeVer: boolean;
    podeVerTodos: boolean;
    somenteMeus: boolean;
  };

  funil: {
    id: number;
    nome: string;
    descricao: string | null;
  };

  resumo: {
    totalLeads: number;
    valorEstimado: number;
    limitePorEtapa: number;
  };

  etapas: EtapaKanban[];
};

type MotivoPerdaConfiguracao = {
  id: number;
  nome: string;
  descricao: string | null;
  categoria: string;
  exigeObservacao: boolean;
  ordem: number;
  ativo: boolean;
  arquivadoEm: string | null;
};

type RespostaConfiguracaoFunis = {
  success: boolean;
  error?: string;
  permissoes: {
    podeVer: boolean;
    podeGerenciar: boolean;
    podeMovimentar: boolean;
    podeRegistrarPerda: boolean;
  };
  motivosPerda: MotivoPerdaConfiguracao[];
};

type TipoToast = "sucesso" | "erro";

type ToastPipeline = {
  tipo: TipoToast;
  mensagem: string;
};

type OpcaoSelectTema = {
  value: string;
  label: string;
  disabled?: boolean;
};

function formatarMoeda(
  valor: number | null | undefined,
  locale: string
) {
  return Number(valor ?? 0).toLocaleString(locale, {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataHora(
  valor: string | null | undefined,
  locale: string,
  naoDefinida: string,
  dataInvalida: string
) {
  if (!valor) {
    return naoDefinida;
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return dataInvalida;
  }

  return data.toLocaleString(locale, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatarDataParaInput(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");

  return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
}

function dataPadraoProximaAcao() {
  const data = new Date();

  data.setHours(data.getHours() + 2, 0, 0, 0);

  return formatarDataParaInput(data);
}

function etapaRepresentaPerda(etapa: EtapaKanban | null) {
  if (!etapa) {
    return false;
  }

  return (
    etapa.exigeMotivoPerda ||
    etapa.resultado === "PERDIDA" ||
    etapa.resultado === "DESCARTADA"
  );
}

function telefoneParaWhatsApp(telefone: string | null | undefined) {
  const original = String(telefone || "").trim();

  if (!original) {
    return "";
  }

  const apenasNumeros = original.replace(/\D/g, "");

  if (!apenasNumeros) {
    return "";
  }

  if (original.startsWith("00")) {
    return apenasNumeros.replace(/^00/, "");
  }

  return apenasNumeros;
}

function SelectTema({
  value,
  options,
  onChange,
  modoTema,
  disabled = false,
  ariaLabel,
  required = false,
}: {
  value: string;
  options: OpcaoSelectTema[];
  onChange: (value: string) => void;
  modoTema: ModoTema;
  disabled?: boolean;
  ariaLabel?: string;
  required?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fecharAoClicarFora(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    window.addEventListener("keydown", fecharComEscape);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      window.removeEventListener("keydown", fecharComEscape);
    };
  }, []);

  const selecionada =
    options.find((option) => option.value === value) ?? options[0];

  const botao =
    modoTema === "dark"
      ? "border-blue-800 bg-blue-950 text-blue-50"
      : modoTema === "system-dark"
        ? "border-neutral-600 bg-neutral-800 text-white"
        : "border-slate-300 bg-white text-slate-950";

  const menu =
    modoTema === "dark"
      ? "border-blue-800 bg-blue-950"
      : modoTema === "system-dark"
        ? "border-neutral-600 bg-neutral-800"
        : "border-slate-300 bg-white";

  function classeOpcao(ativa: boolean, opcaoDesabilitada: boolean) {
    if (opcaoDesabilitada) {
      return modoTema === "light"
        ? "cursor-not-allowed text-slate-400"
        : "cursor-not-allowed text-slate-500";
    }

    if (modoTema === "dark") {
      return ativa
        ? "bg-blue-800 text-white"
        : "text-blue-50 hover:bg-blue-900";
    }

    if (modoTema === "system-dark") {
      return ativa
        ? "bg-neutral-600 text-white"
        : "text-neutral-100 hover:bg-neutral-700";
    }

    return ativa
      ? "bg-slate-200 text-slate-950"
      : "text-slate-900 hover:bg-slate-100";
  }

  return (
    <div ref={ref} className="relative">
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          value={value}
          onChange={() => undefined}
          required
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      )}

      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={aberto}
        onClick={() => {
          if (!disabled) {
            setAberto((atual) => !atual);
          }
        }}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-4 text-left text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${botao}`}
      >
        <span className="truncate">{selecionada?.label ?? ""}</span>
        <span aria-hidden="true" className="shrink-0 text-xs">
          {aberto ? "▲" : "▼"}
        </span>
      </button>

      {aberto && !disabled && (
        <div
          className={`absolute left-0 right-0 top-full z-[180] mt-1 max-h-72 overflow-y-auto rounded-xl border p-1 shadow-2xl ${menu}`}
        >
          {options.map((option) => {
            const ativa = option.value === value;
            const opcaoDesabilitada = Boolean(option.disabled);

            return (
              <button
                key={option.value}
                type="button"
                disabled={opcaoDesabilitada}
                onClick={() => {
                  if (opcaoDesabilitada) {
                    return;
                  }

                  onChange(option.value);
                  setAberto(false);
                }}
                className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${classeOpcao(
                  ativa,
                  opcaoDesabilitada
                )}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PipelineComercialPage() {
  const t = useTranslations("AdminCommercialPipeline");
  const locale = useLocale();

  const [temaAtual, setTemaAtual] =
    useState<TemaEscolhido>("light");
  const [sistemaEscuro, setSistemaEscuro] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function sincronizarTema() {
      const html = document.documentElement;
      const armazenado = window.localStorage.getItem("phanyx_tema");
      const candidato =
        html.dataset.themeChoice ||
        armazenado ||
        "system";

      const tema: TemaEscolhido =
        candidato === "light" ||
        candidato === "dark" ||
        candidato === "system"
          ? candidato
          : "system";

      setTemaAtual(tema);
      setSistemaEscuro(media.matches);
    }

    sincronizarTema();

    const observer = new MutationObserver(sincronizarTema);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "class",
        "data-theme",
        "data-theme-choice",
      ],
    });

    window.addEventListener("storage", sincronizarTema);
    window.addEventListener("phanyx-theme-change", sincronizarTema);

    const listenerMedia = () => sincronizarTema();
    media.addEventListener("change", listenerMedia);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", sincronizarTema);
      window.removeEventListener(
        "phanyx-theme-change",
        sincronizarTema
      );
      media.removeEventListener("change", listenerMedia);
    };
  }, []);

  const modoTema: ModoTema =
    temaAtual === "dark"
      ? "dark"
      : temaAtual === "system" && sistemaEscuro
        ? "system-dark"
        : "light";

  const c = useMemo(() => {
    if (modoTema === "dark") {
      return {
        page: "bg-[#020617] text-white",
        panel: "border-blue-900/80 bg-blue-950/70",
        panelStrong: "border-blue-800 bg-blue-950",
        panelSoft: "border-blue-900/70 bg-blue-950/45",
        columnBody: "bg-blue-950/35",
        input:
          "border-blue-800 bg-blue-950 text-blue-50 placeholder:text-blue-200/50",
        primary: "text-white",
        secondary: "text-blue-100/80",
        muted: "text-blue-200/60",
        divider: "border-blue-900/80",
        ghostButton:
          "border-blue-800 bg-blue-950 text-blue-50 hover:bg-blue-900",
        kicker: "text-emerald-300",
      };
    }

    if (modoTema === "system-dark") {
      return {
        page: "bg-neutral-900 text-white",
        panel: "border-neutral-700 bg-neutral-900",
        panelStrong: "border-neutral-600 bg-neutral-800",
        panelSoft: "border-neutral-700 bg-neutral-800/70",
        columnBody: "bg-neutral-800/50",
        input:
          "border-neutral-600 bg-neutral-800 text-white placeholder:text-neutral-400",
        primary: "text-white",
        secondary: "text-neutral-200",
        muted: "text-neutral-400",
        divider: "border-neutral-700",
        ghostButton:
          "border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700",
        kicker: "text-emerald-300",
      };
    }

    return {
      page: "bg-slate-50 text-slate-950",
      panel: "border-slate-200 bg-white",
      panelStrong: "border-slate-300 bg-white",
      panelSoft: "border-slate-200 bg-slate-50",
      columnBody: "bg-slate-50",
      input:
        "border-slate-300 bg-white text-slate-950 placeholder:text-slate-400",
      primary: "text-slate-950",
      secondary: "text-slate-600",
      muted: "text-slate-500",
      divider: "border-slate-200",
      ghostButton:
        "border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
      kicker: "text-emerald-700",
    };
  }, [modoTema]);

  const tiposTarefa = useMemo(
    () => [
      { valor: "LIGACAO", nome: t("taskTypes.call") },
      { valor: "WHATSAPP", nome: "WhatsApp" },
      { valor: "EMAIL", nome: t("taskTypes.email") },
      { valor: "REUNIAO", nome: t("taskTypes.meeting") },
      { valor: "RETORNO", nome: t("taskTypes.followUp") },
      { valor: "ENVIAR_PROPOSTA", nome: t("taskTypes.sendProposal") },
      {
        valor: "SOLICITAR_DOCUMENTOS",
        nome: t("taskTypes.requestDocuments"),
      },
      {
        valor: "CONFIRMAR_PAGAMENTO",
        nome: t("taskTypes.confirmPayment"),
      },
      { valor: "OUTRA", nome: t("taskTypes.other") },
    ],
    [t]
  );

  const prioridadesTarefa = useMemo(
    () => [
      { valor: "BAIXA", nome: t("priority.low") },
      { valor: "MEDIA", nome: t("priority.medium") },
      { valor: "ALTA", nome: t("priority.high") },
      { valor: "URGENTE", nome: t("priority.urgent") },
    ],
    [t]
  );

  const categorias = useMemo<Record<string, string>>(
    () => ({
      ENTRADA: t("categories.entry"),
      PRIMEIRO_CONTATO: t("categories.firstContact"),
      EM_ATENDIMENTO: t("categories.inService"),
      QUALIFICACAO: t("categories.qualification"),
      APRESENTACAO: t("categories.presentation"),
      PROPOSTA: t("categories.proposal"),
      NEGOCIACAO: t("categories.negotiation"),
      DOCUMENTACAO: t("categories.documentation"),
      PAGAMENTO: t("categories.payment"),
      CONVERSAO: t("categories.conversion"),
      PERDA: t("categories.loss"),
      PAUSA: t("categories.pause"),
      DESCARTE: t("categories.discard"),
    }),
    [t]
  );

  function rotuloPrioridade(prioridade: string) {
    const chave = String(prioridade || "").toUpperCase();

    if (chave === "URGENTE") return t("priority.urgent");
    if (chave === "ALTA") return t("priority.high");
    if (chave === "MEDIA") return t("priority.medium");
    if (chave === "BAIXA") return t("priority.low");

    return prioridade;
  }

  function classePrioridade(prioridade: string) {
    switch (String(prioridade).toUpperCase()) {
      case "URGENTE":
        return "border-red-500 bg-red-950/15 text-red-700 dark:text-red-100";

      case "ALTA":
        return "border-orange-500 bg-orange-950/15 text-orange-700 dark:text-orange-100";

      case "MEDIA":
        return "border-amber-500 bg-amber-950/15 text-amber-700 dark:text-amber-100";

      default:
        return `${c.panelStrong} ${c.secondary}`;
    }
  }

  const [dados, setDados] = useState<RespostaKanban | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [buscaDigitada, setBuscaDigitada] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [somenteMeus, setSomenteMeus] = useState(false);
  const [atualizacao, setAtualizacao] = useState(0);

  const [configuracaoFunis, setConfiguracaoFunis] =
    useState<RespostaConfiguracaoFunis | null>(null);

  const [leadEmMovimentacao, setLeadEmMovimentacao] =
    useState<LeadKanban | null>(null);

  const [etapaNovaId, setEtapaNovaId] = useState("");
  const [motivoMovimentacao, setMotivoMovimentacao] = useState("");
  const [motivoPerdaId, setMotivoPerdaId] = useState("");
  const [motivoPerdaObservacao, setMotivoPerdaObservacao] = useState("");
  const [incluirProximaAcao, setIncluirProximaAcao] = useState(false);
  const [tipoTarefa, setTipoTarefa] = useState("RETORNO");
  const [prioridadeTarefa, setPrioridadeTarefa] = useState("MEDIA");
  const [tituloTarefa, setTituloTarefa] = useState("");
  const [descricaoTarefa, setDescricaoTarefa] = useState("");
  const [agendadaPara, setAgendadaPara] = useState(dataPadraoProximaAcao);
  const [prazoEm, setPrazoEm] = useState("");
  const [lembreteEm, setLembreteEm] = useState("");
  const [erroMovimentacao, setErroMovimentacao] = useState("");
  const [salvandoMovimentacao, setSalvandoMovimentacao] = useState(false);
  const [toast, setToast] = useState<ToastPipeline | null>(null);

  const etapaDestino = useMemo(() => {
    const id = Number(etapaNovaId);

    if (!id || !dados) {
      return null;
    }

    return dados.etapas.find((etapa) => etapa.id === id) ?? null;
  }, [dados, etapaNovaId]);

  const destinoRepresentaPerda = etapaRepresentaPerda(etapaDestino);

  const motivoPerdaSelecionado = useMemo(() => {
    const id = Number(motivoPerdaId);

    if (!id || !configuracaoFunis) {
      return null;
    }

    return (
      configuracaoFunis.motivosPerda.find(
        (motivo) => motivo.id === id
      ) ?? null
    );
  }, [configuracaoFunis, motivoPerdaId]);

  const proximaAcaoObrigatoria = Boolean(
    etapaDestino?.exigeProximaAcao &&
      !leadEmMovimentacao?.proximaTarefa
  );

  const deveEnviarProximaAcao =
    proximaAcaoObrigatoria || incluirProximaAcao;

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setBuscaAplicada(buscaDigitada.trim());
    }, 350);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [buscaDigitada]);

  useEffect(() => {
    const controlador = new AbortController();

    async function carregarConfiguracao() {
      try {
        const resposta = await fetch("/api/admin/comercial/funis", {
          cache: "no-store",
          credentials: "include",
          signal: controlador.signal,
        });

        const payload = (await resposta
          .json()
          .catch(() => null)) as RespostaConfiguracaoFunis | null;

        if (resposta.ok && payload?.success) {
          setConfiguracaoFunis(payload);
          return;
        }

        setConfiguracaoFunis(null);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setConfiguracaoFunis(null);
      }
    }

    void carregarConfiguracao();

    return () => {
      controlador.abort();
    };
  }, [atualizacao]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const temporizador = window.setTimeout(() => {
      setToast(null);
    }, 4500);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [toast]);

  useEffect(() => {
    if (!leadEmMovimentacao) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !salvandoMovimentacao) {
        setLeadEmMovimentacao(null);
      }
    }

    window.addEventListener("keydown", fecharComEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", fecharComEscape);
    };
  }, [leadEmMovimentacao, salvandoMovimentacao]);

  const carregarKanban = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setCarregando(true);
        setErro("");

        const params = new URLSearchParams();

        if (buscaAplicada) {
          params.set("q", buscaAplicada);
        }

        if (prioridade) {
          params.set("prioridade", prioridade);
        }

        if (somenteMeus) {
          params.set("meus", "true");
        }

        params.set("limitePorEtapa", "25");

        const resposta = await fetch(
          `/api/admin/comercial/leads/kanban?${params.toString()}`,
          {
            cache: "no-store",
            credentials: "include",
            signal,
          }
        );

        const payload = (await resposta
          .json()
          .catch(() => null)) as RespostaKanban | null;

        if (!resposta.ok || !payload?.success) {
          throw new Error(payload?.error ?? t("errors.load"));
        }

        setDados(payload);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setErro(
          error instanceof Error ? error.message : t("errors.load")
        );
      } finally {
        if (!signal?.aborted) {
          setCarregando(false);
        }
      }
    },
    [buscaAplicada, prioridade, somenteMeus, atualizacao, t]
  );

  useEffect(() => {
    const controlador = new AbortController();

    void carregarKanban(controlador.signal);

    return () => {
      controlador.abort();
    };
  }, [carregarKanban]);

  function atualizar() {
    setAtualizacao((valor) => valor + 1);
  }

  function abrirMovimentacao(lead: LeadKanban) {
    if (!configuracaoFunis?.permissoes.podeMovimentar) {
      setToast({
        tipo: "erro",
        mensagem: t("errors.noMovePermission"),
      });
      return;
    }

    setLeadEmMovimentacao(lead);
    setEtapaNovaId("");
    setMotivoMovimentacao("");
    setMotivoPerdaId("");
    setMotivoPerdaObservacao("");
    setIncluirProximaAcao(false);
    setTipoTarefa("RETORNO");
    setPrioridadeTarefa("MEDIA");
    setTituloTarefa("");
    setDescricaoTarefa("");
    setAgendadaPara(dataPadraoProximaAcao());
    setPrazoEm("");
    setLembreteEm("");
    setErroMovimentacao("");
  }

  function fecharMovimentacao() {
    if (salvandoMovimentacao) {
      return;
    }

    setLeadEmMovimentacao(null);
    setErroMovimentacao("");
  }

  function alterarEtapaDestino(idTexto: string) {
    setEtapaNovaId(idTexto);
    setMotivoPerdaId("");
    setMotivoPerdaObservacao("");
    setErroMovimentacao("");

    const etapa =
      dados?.etapas.find(
        (item) => item.id === Number(idTexto)
      ) ?? null;

    setIncluirProximaAcao(
      Boolean(
        etapa?.exigeProximaAcao &&
          !leadEmMovimentacao?.proximaTarefa
      )
    );
  }

  async function salvarMovimentacao(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!leadEmMovimentacao || !etapaDestino) {
      setErroMovimentacao(t("movement.errors.selectStage"));
      return;
    }

    if (!etapaDestino.permiteMovimentoManual) {
      setErroMovimentacao(t("movement.errors.automaticStage"));
      return;
    }

    if (
      etapaDestino.resultado === "GANHA" &&
      !leadEmMovimentacao.matriculaConvertida
    ) {
      setErroMovimentacao(
        t("movement.errors.requiresEnrollment")
      );
      return;
    }

    if (
      leadEmMovimentacao.matriculaConvertida &&
      etapaDestino.resultado !== "GANHA"
    ) {
      setErroMovimentacao(
        t("movement.errors.enrollmentKeepsConverted")
      );
      return;
    }

    if (destinoRepresentaPerda) {
      if (!configuracaoFunis?.permissoes.podeRegistrarPerda) {
        setErroMovimentacao(
          t("movement.errors.noLossPermission")
        );
        return;
      }

      if (!motivoPerdaId) {
        setErroMovimentacao(t("movement.errors.lossReason"));
        return;
      }

      if (
        motivoPerdaSelecionado?.exigeObservacao &&
        !motivoPerdaObservacao.trim()
      ) {
        setErroMovimentacao(
          t("movement.errors.lossObservation")
        );
        return;
      }
    }

    let proximaAcao: Record<string, unknown> | null = null;

    if (deveEnviarProximaAcao) {
      if (!leadEmMovimentacao.responsavelFuncionarioId) {
        setErroMovimentacao(
          t("movement.errors.responsibleBeforeTask")
        );
        return;
      }

      if (!agendadaPara) {
        setErroMovimentacao(t("movement.errors.schedule"));
        return;
      }

      const dataAgendamento = new Date(agendadaPara);

      if (Number.isNaN(dataAgendamento.getTime())) {
        setErroMovimentacao(
          t("movement.errors.invalidSchedule")
        );
        return;
      }

      if (dataAgendamento.getTime() < Date.now() - 60_000) {
        setErroMovimentacao(
          t("movement.errors.scheduleInPast")
        );
        return;
      }

      const dataPrazo = prazoEm ? new Date(prazoEm) : null;
      const dataLembrete = lembreteEm ? new Date(lembreteEm) : null;

      if (dataPrazo && Number.isNaN(dataPrazo.getTime())) {
        setErroMovimentacao(
          t("movement.errors.invalidDeadline")
        );
        return;
      }

      if (
        dataLembrete &&
        Number.isNaN(dataLembrete.getTime())
      ) {
        setErroMovimentacao(
          t("movement.errors.invalidReminder")
        );
        return;
      }

      if (
        dataPrazo &&
        dataPrazo.getTime() < dataAgendamento.getTime()
      ) {
        setErroMovimentacao(
          t("movement.errors.deadlineBeforeSchedule")
        );
        return;
      }

      if (
        dataLembrete &&
        dataLembrete.getTime() > dataAgendamento.getTime()
      ) {
        setErroMovimentacao(
          t("movement.errors.reminderAfterSchedule")
        );
        return;
      }

      proximaAcao = {
        tipo: tipoTarefa,
        prioridade: prioridadeTarefa,
        titulo: tituloTarefa.trim() || null,
        descricao: descricaoTarefa.trim() || null,
        agendadaPara: dataAgendamento.toISOString(),
        prazoEm: dataPrazo?.toISOString() ?? null,
        lembreteEm: dataLembrete?.toISOString() ?? null,
        responsavelFuncionarioId:
          leadEmMovimentacao.responsavelFuncionarioId,
      };
    }

    try {
      setSalvandoMovimentacao(true);
      setErroMovimentacao("");

      const resposta = await fetch(
        `/api/admin/comercial/leads/${leadEmMovimentacao.id}/movimentar`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            etapaNovaId: etapaDestino.id,
            motivo: motivoMovimentacao.trim() || null,
            motivoPerdaId: destinoRepresentaPerda
              ? Number(motivoPerdaId)
              : null,
            motivoPerdaObservacao: destinoRepresentaPerda
              ? motivoPerdaObservacao.trim() || null
              : null,
            proximaAcao,
          }),
        }
      );

      const payload = (await resposta
        .json()
        .catch(() => null)) as {
        success?: boolean;
        error?: string;
        mensagem?: string;
      } | null;

      if (!resposta.ok || !payload?.success) {
        throw new Error(
          payload?.error ?? t("movement.errors.save")
        );
      }

      setLeadEmMovimentacao(null);
      setToast({
        tipo: "sucesso",
        mensagem:
          payload.mensagem ?? t("movement.success"),
      });
      atualizar();
    } catch (error) {
      setErroMovimentacao(
        error instanceof Error
          ? error.message
          : t("movement.errors.save")
      );
    } finally {
      setSalvandoMovimentacao(false);
    }
  }

  const opcoesFiltroPrioridade: OpcaoSelectTema[] = [
    { value: "", label: t("filters.allPriorities") },
    { value: "ALTA", label: t("priority.high") },
    { value: "MEDIA", label: t("priority.medium") },
    { value: "BAIXA", label: t("priority.low") },
  ];

  const opcoesEtapasDestino: OpcaoSelectTema[] = [
    { value: "", label: t("movement.selectStage") },
    ...(dados?.etapas
      .filter(
        (etapa) =>
          etapa.id !== leadEmMovimentacao?.etapaFunilId
      )
      .map((etapa) => {
        const perda = etapaRepresentaPerda(etapa);

        const semPermissaoPerda =
          perda &&
          !configuracaoFunis?.permissoes.podeRegistrarPerda;

        const conversaoSemMatricula =
          etapa.resultado === "GANHA" &&
          !leadEmMovimentacao?.matriculaConvertida;

        const bloqueada =
          !etapa.permiteMovimentoManual ||
          semPermissaoPerda ||
          conversaoSemMatricula;

        const complemento = !etapa.permiteMovimentoManual
          ? t("movement.stageSuffix.automatic")
          : semPermissaoPerda
            ? t("movement.stageSuffix.noPermission")
            : conversaoSemMatricula
              ? t("movement.stageSuffix.requiresEnrollment")
              : "";

        return {
          value: String(etapa.id),
          label: `${etapa.ordem}. ${etapa.nome}${complemento}`,
          disabled: bloqueada,
        };
      }) ?? []),
  ];

  const opcoesMotivoPerda: OpcaoSelectTema[] = [
    { value: "", label: t("movement.selectLossReason") },
    ...(configuracaoFunis?.motivosPerda
      .filter((motivo) => motivo.ativo && !motivo.arquivadoEm)
      .map((motivo) => ({
        value: String(motivo.id),
        label: motivo.nome,
      })) ?? []),
  ];

  return (
    <main className={`min-h-screen w-full ${c.page}`}>
      <div className="phanyx-pipeline-page mx-auto max-w-[1800px] space-y-5 p-4 sm:p-6">
        <header
          className={`rounded-3xl border p-5 shadow-sm sm:p-7 ${c.panel}`}
        >
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div
                className={`flex flex-wrap items-center gap-2 text-sm font-semibold ${c.secondary}`}
              >
                <Link
                  href="/admin/comercial"
                  className={`transition hover:underline ${c.secondary}`}
                >
                  {t("header.sales")}
                </Link>

                <span>/</span>

                <span className={c.primary}>
                  {t("header.pipeline")}
                </span>
              </div>

              <h1
                className={`mt-3 text-2xl font-black sm:text-3xl ${c.primary}`}
              >
                {t("header.title")}
              </h1>

              <p
                className={`mt-2 max-w-3xl text-sm leading-6 ${c.secondary}`}
              >
                {t("header.description")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/leads"
                className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${c.ghostButton}`}
              >
                {t("header.viewLeadList")}
              </Link>

              <Link
                href="/admin/comercial/funis"
                className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${c.ghostButton}`}
              >
                {t("header.configureFunnel")}
              </Link>

              <button
                type="button"
                onClick={atualizar}
                disabled={carregando}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                {carregando
                  ? t("header.updating")
                  : t("header.update")}
              </button>
            </div>
          </div>
        </header>

        <section
          className={`rounded-3xl border p-4 shadow-sm sm:p-5 ${c.panel}`}
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_auto]">
            <div>
              <label
                htmlFor="busca-pipeline"
                className={`mb-2 block text-xs font-bold uppercase tracking-wide ${c.secondary}`}
              >
                {t("filters.searchLabel")}
              </label>

              <input
                id="busca-pipeline"
                value={buscaDigitada}
                onChange={(event) =>
                  setBuscaDigitada(event.target.value)
                }
                placeholder={t("filters.searchPlaceholder")}
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-emerald-500 ${c.input}`}
              />
            </div>

            <div>
              <label
                className={`mb-2 block text-xs font-bold uppercase tracking-wide ${c.secondary}`}
              >
                {t("filters.priority")}
              </label>

              <SelectTema
                value={prioridade}
                onChange={setPrioridade}
                modoTema={modoTema}
                options={opcoesFiltroPrioridade}
                ariaLabel={t("filters.priority")}
              />
            </div>

            <div className="flex items-end">
              <label
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold ${c.panelSoft} ${c.primary}`}
              >
                <input
                  type="checkbox"
                  checked={somenteMeus}
                  disabled={!dados?.permissoes.podeVerTodos}
                  onChange={(event) =>
                    setSomenteMeus(event.target.checked)
                  }
                  className="h-4 w-4 accent-emerald-600"
                />
                {t("filters.onlyMine")}
              </label>
            </div>
          </div>
        </section>

        {erro ? (
          <section className="rounded-2xl border border-red-700 bg-red-950/15 p-5 text-red-700 dark:text-red-100">
            <h2 className="font-black">
              {t("errors.loadTitle")}
            </h2>

            <p className="mt-1 text-sm">{erro}</p>

            <button
              type="button"
              onClick={atualizar}
              className="mt-4 rounded-xl border border-red-700 bg-red-700 px-4 py-2 text-sm font-bold text-white"
            >
              {t("errors.tryAgain")}
            </button>
          </section>
        ) : null}

        {dados ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article
                className={`rounded-2xl border p-5 shadow-sm ${c.panel}`}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
                >
                  {t("summary.activeFunnel")}
                </p>

                <p
                  className={`mt-2 text-lg font-black ${c.primary}`}
                >
                  {dados.funil.nome}
                </p>
              </article>

              <article
                className={`rounded-2xl border p-5 shadow-sm ${c.panel}`}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
                >
                  {t("summary.opportunities")}
                </p>

                <p
                  className={`mt-2 text-2xl font-black ${c.primary}`}
                >
                  {dados.resumo.totalLeads}
                </p>
              </article>

              <article
                className={`rounded-2xl border p-5 shadow-sm ${c.panel}`}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
                >
                  {t("summary.estimatedValue")}
                </p>

                <p
                  className={`mt-2 text-2xl font-black ${c.primary}`}
                >
                  {formatarMoeda(
                    dados.resumo.valorEstimado,
                    locale
                  )}
                </p>
              </article>

              <article
                className={`rounded-2xl border p-5 shadow-sm ${c.panel}`}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
                >
                  {t("summary.view")}
                </p>

                <p
                  className={`mt-2 text-lg font-black ${c.primary}`}
                >
                  {dados.permissoes.somenteMeus
                    ? t("summary.myLeads")
                    : t("summary.wholeTeam")}
                </p>
              </article>
            </section>

            <section>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2
                    className={`text-xl font-black ${c.primary}`}
                  >
                    {t("stages.title")}
                  </h2>

                  <p className={`mt-1 text-sm ${c.muted}`}>
                    {t("stages.scrollHelp")}
                  </p>
                </div>

                {carregando ? (
                  <span
                    className={`text-sm font-bold ${c.secondary}`}
                  >
                    {t("stages.updatingData")}
                  </span>
                ) : null}
              </div>

              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5">
                {dados.etapas.map((etapa) => (
                  <article
                    key={etapa.id}
                    className={`w-[320px] shrink-0 snap-start overflow-hidden rounded-3xl border shadow-sm ${c.panel}`}
                  >
                    <div
                      className="h-1.5"
                      style={{
                        backgroundColor: etapa.cor,
                      }}
                    />

                    <header
                      className={`border-b p-4 ${c.divider}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className={`text-[10px] font-bold uppercase tracking-wide ${c.muted}`}
                          >
                            {t("stages.stage", {
                              number: etapa.ordem,
                            })}
                          </p>

                          <h3
                            className={`mt-1 font-black leading-5 ${c.primary}`}
                          >
                            {etapa.nome}
                          </h3>

                          <p
                            className={`mt-1 text-xs ${c.muted}`}
                          >
                            {categorias[etapa.categoria] ??
                              etapa.categoria}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-black ${c.panelStrong} ${c.primary}`}
                        >
                          {etapa.totalLeads}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div
                          className={`rounded-xl border p-2.5 ${c.panelSoft}`}
                        >
                          <p
                            className={`text-[9px] font-bold uppercase ${c.muted}`}
                          >
                            {t("stages.value")}
                          </p>

                          <p
                            className={`mt-1 text-xs font-black ${c.primary}`}
                          >
                            {formatarMoeda(
                              etapa.valorEstimado,
                              locale
                            )}
                          </p>
                        </div>

                        <div
                          className={`rounded-xl border p-2.5 ${c.panelSoft}`}
                        >
                          <p
                            className={`text-[9px] font-bold uppercase ${c.muted}`}
                          >
                            {t("stages.probability")}
                          </p>

                          <p
                            className={`mt-1 text-xs font-black ${c.primary}`}
                          >
                            {etapa.probabilidadeConversao}%
                          </p>
                        </div>
                      </div>
                    </header>

                    <div
                      className={`max-h-[620px] space-y-3 overflow-y-auto p-3 ${c.columnBody}`}
                    >
                      {etapa.leads.map((lead) => {
                        const telefoneWhatsApp =
                          telefoneParaWhatsApp(lead.telefone);

                        return (
                          <div
                            key={lead.id}
                            className={`rounded-2xl border p-4 shadow-sm ${c.panelStrong}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4
                                  className={`truncate font-black ${c.primary}`}
                                >
                                  {lead.nome}
                                </h4>

                                <p
                                  className={`mt-1 truncate text-xs ${c.muted}`}
                                >
                                  {lead.interesse ||
                                    t("lead.noInterest")}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${classePrioridade(
                                  lead.prioridade
                                )}`}
                              >
                                {rotuloPrioridade(
                                  lead.prioridade
                                )}
                              </span>
                            </div>

                            <div
                              className={`mt-3 space-y-1.5 text-xs ${c.secondary}`}
                            >
                              <p>
                                <strong>
                                  {t("lead.responsible")}:
                                </strong>{" "}
                                {lead.responsavel?.nome ??
                                  t("common.notDefined")}
                              </p>

                              {lead.curso ? (
                                <p>
                                  <strong>
                                    {t("lead.course")}:
                                  </strong>{" "}
                                  {lead.curso.nome}
                                </p>
                              ) : null}

                              {lead.polo ? (
                                <p>
                                  <strong>
                                    {t("lead.campus")}:
                                  </strong>{" "}
                                  {lead.polo.nome}
                                </p>
                              ) : null}

                              <p>
                                <strong>
                                  {t("lead.value")}:
                                </strong>{" "}
                                {formatarMoeda(
                                  lead.valorEstimado,
                                  locale
                                )}
                              </p>
                            </div>

                            {lead.etapaAtrasada ? (
                              <div className="mt-3 rounded-xl border border-red-600 bg-red-950/15 px-3 py-2 text-xs font-bold text-red-700 dark:text-red-100">
                                {t("lead.stageOverdue")}
                              </div>
                            ) : null}

                            {lead.acompanhamentoAtrasado ? (
                              <div className="mt-2 rounded-xl border border-orange-600 bg-orange-950/15 px-3 py-2 text-xs font-bold text-orange-700 dark:text-orange-100">
                                {t("lead.followUpOverdue")}
                              </div>
                            ) : null}

                            {lead.semProximaAcao ? (
                              <div className="mt-2 rounded-xl border border-amber-600 bg-amber-950/15 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-100">
                                {t("lead.noNextAction")}
                              </div>
                            ) : null}

                            {lead.proximaTarefa ? (
                              <div
                                className={`mt-3 rounded-xl border p-3 ${c.panelSoft}`}
                              >
                                <p
                                  className={`text-[9px] font-bold uppercase ${c.muted}`}
                                >
                                  {t("lead.nextAction")}
                                </p>

                                <p
                                  className={`mt-1 text-xs font-black ${c.primary}`}
                                >
                                  {lead.proximaTarefa.titulo}
                                </p>

                                <p
                                  className={`mt-1 text-[11px] ${c.muted}`}
                                >
                                  {formatarDataHora(
                                    lead.proximaTarefa
                                      .agendadaPara,
                                    locale,
                                    t("common.notDefined"),
                                    t("common.invalidDate")
                                  )}
                                </p>
                              </div>
                            ) : null}

                            {lead.matriculaConvertida ? (
                              <div className="mt-3 rounded-xl border border-emerald-600 bg-emerald-950/15 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-100">
                                {t("lead.enrollment")}{" "}
                                {lead.matriculaConvertida
                                  .numeroMatricula ??
                                  `#${lead.matriculaConvertida.id}`}
                              </div>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-2">
                              {configuracaoFunis?.permissoes
                                .podeMovimentar &&
                              !lead.matriculaConvertida ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirMovimentacao(lead)
                                  }
                                  className="rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-700"
                                >
                                  {t("lead.moveStage")}
                                </button>
                              ) : null}

                              {telefoneWhatsApp ? (
                                <a
                                  href={`https://wa.me/${telefoneWhatsApp}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-lg border border-emerald-600 bg-emerald-950/10 px-2.5 py-2 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-950/20 dark:text-emerald-100"
                                >
                                  WhatsApp
                                </a>
                              ) : null}

                              <a
                                href={`mailto:${lead.email}`}
                                className={`rounded-lg border px-2.5 py-2 text-[11px] font-bold transition ${c.ghostButton}`}
                              >
                                {t("taskTypes.email")}
                              </a>

                              <span
                                className={`ml-auto self-center text-[10px] font-semibold ${c.muted}`}
                              >
                                #{lead.id}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {etapa.leads.length === 0 ? (
                        <div
                          className={`rounded-2xl border border-dashed p-6 text-center text-xs ${c.panelStrong} ${c.secondary}`}
                        >
                          {t("stages.empty")}
                        </div>
                      ) : null}

                      {etapa.temMais ? (
                        <div
                          className={`rounded-xl border px-3 py-2 text-center text-xs font-bold ${c.panelStrong} ${c.secondary}`}
                        >
                          {t("stages.moreLeads")}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {carregando && !dados ? (
          <section
            className={`rounded-3xl border p-10 text-center ${c.panel}`}
          >
            <div className="text-3xl">⏳</div>

            <p className={`mt-3 font-bold ${c.primary}`}>
              {t("loading")}
            </p>
          </section>
        ) : null}

        {toast ? (
          <div
            role="status"
            aria-live="polite"
            className={`fixed right-5 top-5 z-[120] max-w-sm rounded-2xl border px-5 py-4 text-sm font-bold shadow-xl ${
              toast.tipo === "sucesso"
                ? "border-emerald-600 bg-emerald-950/20 text-emerald-700 dark:text-emerald-100"
                : "border-red-600 bg-red-950/20 text-red-700 dark:text-red-100"
            }`}
          >
            {toast.mensagem}
          </div>
        ) : null}

        {leadEmMovimentacao ? (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                fecharMovimentacao();
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-movimentar-lead"
              className={`max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border shadow-2xl ${c.panel}`}
            >
              <header
                className={`sticky top-0 z-10 flex items-start justify-between gap-4 border-b p-5 sm:p-6 ${c.divider} ${c.panel}`}
              >
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-wide ${c.kicker}`}
                  >
                    {t("movement.kicker")}
                  </p>

                  <h2
                    id="titulo-movimentar-lead"
                    className={`mt-1 text-xl font-black ${c.primary}`}
                  >
                    {t("movement.title", {
                      name: leadEmMovimentacao.nome,
                    })}
                  </h2>

                  <p
                    className={`mt-1 text-sm ${c.secondary}`}
                  >
                    {t("movement.description")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fecharMovimentacao}
                  disabled={salvandoMovimentacao}
                  aria-label={t("movement.closeAria")}
                  className={`shrink-0 rounded-xl border px-3 py-2 font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${c.ghostButton}`}
                >
                  ✕
                </button>
              </header>

              <form
                onSubmit={salvarMovimentacao}
                className="space-y-5 p-5 sm:p-6"
              >
                <div
                  className={`grid gap-3 rounded-2xl border p-4 sm:grid-cols-2 ${c.panelSoft}`}
                >
                  <div>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wide ${c.muted}`}
                    >
                      {t("movement.currentStage")}
                    </p>

                    <p
                      className={`mt-1 font-black ${c.primary}`}
                    >
                      {dados?.etapas.find(
                        (etapa) =>
                          etapa.id ===
                          leadEmMovimentacao.etapaFunilId
                      )?.nome ?? t("common.notDefined")}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wide ${c.muted}`}
                    >
                      {t("movement.responsible")}
                    </p>

                    <p
                      className={`mt-1 font-black ${c.primary}`}
                    >
                      {leadEmMovimentacao.responsavel?.nome ??
                        t("common.notDefined")}
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    className={`mb-2 block text-sm font-black ${c.primary}`}
                  >
                    {t("movement.destinationStage")} *
                  </label>

                  <SelectTema
                    value={etapaNovaId}
                    onChange={alterarEtapaDestino}
                    modoTema={modoTema}
                    options={opcoesEtapasDestino}
                    required
                  />

                  {etapaDestino ? (
                    <p className={`mt-2 text-xs ${c.muted}`}>
                      {etapaDestino.descricao ??
                        categorias[etapaDestino.categoria] ??
                        etapaDestino.categoria}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="motivo-movimentacao"
                    className={`mb-2 block text-sm font-black ${c.primary}`}
                  >
                    {t("movement.movementNote")}
                  </label>

                  <textarea
                    id="motivo-movimentacao"
                    value={motivoMovimentacao}
                    onChange={(event) =>
                      setMotivoMovimentacao(event.target.value)
                    }
                    rows={3}
                    placeholder={t(
                      "movement.movementNotePlaceholder"
                    )}
                    className={`w-full resize-y rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-emerald-500 ${c.input}`}
                  />
                </div>

                {destinoRepresentaPerda ? (
                  <section className="space-y-4 rounded-2xl border border-red-700 bg-red-950/10 p-4">
                    <div>
                      <h3 className="font-black text-red-700 dark:text-red-100">
                        {t("movement.loss.title")}
                      </h3>

                      <p className="mt-1 text-xs text-red-700 dark:text-red-200">
                        {t("movement.loss.description")}
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-red-700 dark:text-red-100">
                        {t("movement.loss.reason")} *
                      </label>

                      <SelectTema
                        value={motivoPerdaId}
                        onChange={(valor) => {
                          setMotivoPerdaId(valor);
                          setMotivoPerdaObservacao("");
                        }}
                        modoTema={modoTema}
                        options={opcoesMotivoPerda}
                        required
                      />
                    </div>

                    {motivoPerdaSelecionado ? (
                      <div>
                        <label
                          htmlFor="observacao-perda"
                          className="mb-2 block text-sm font-black text-red-700 dark:text-red-100"
                        >
                          {t("movement.loss.observation")}
                          {motivoPerdaSelecionado.exigeObservacao
                            ? " *"
                            : ""}
                        </label>

                        <textarea
                          id="observacao-perda"
                          value={motivoPerdaObservacao}
                          onChange={(event) =>
                            setMotivoPerdaObservacao(
                              event.target.value
                            )
                          }
                          required={
                            motivoPerdaSelecionado.exigeObservacao
                          }
                          rows={3}
                          placeholder={t(
                            "movement.loss.observationPlaceholder"
                          )}
                          className={`w-full resize-y rounded-xl border border-red-700 px-4 py-3 text-sm outline-none focus:border-red-500 ${c.input}`}
                        />

                        {motivoPerdaSelecionado.exigeObservacao ? (
                          <p className="mt-2 text-xs font-bold text-red-700 dark:text-red-200">
                            {t("movement.loss.observationRequired")}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {etapaDestino?.resultado === "ABERTA" ? (
                  <section
                    className={`space-y-4 rounded-2xl border p-4 ${c.panelSoft}`}
                  >
                    <div>
                      <h3 className={`font-black ${c.primary}`}>
                        {t("movement.nextAction.title")}
                      </h3>

                      <p className={`mt-1 text-xs ${c.muted}`}>
                        {t("movement.nextAction.description")}
                      </p>
                    </div>

                    {etapaDestino.exigeProximaAcao &&
                    leadEmMovimentacao.proximaTarefa ? (
                      <div className="rounded-xl border border-emerald-600 bg-emerald-950/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100">
                        <strong>
                          {t("movement.nextAction.alreadyDefined")}:
                        </strong>{" "}
                        {leadEmMovimentacao.proximaTarefa.titulo},{" "}
                        {formatarDataHora(
                          leadEmMovimentacao.proximaTarefa
                            .agendadaPara,
                          locale,
                          t("common.notDefined"),
                          t("common.invalidDate")
                        )}
                        .
                      </div>
                    ) : (
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${c.panelStrong} ${c.primary}`}
                      >
                        <input
                          type="checkbox"
                          checked={deveEnviarProximaAcao}
                          disabled={proximaAcaoObrigatoria}
                          onChange={(event) =>
                            setIncluirProximaAcao(
                              event.target.checked
                            )
                          }
                          className="mt-0.5 h-4 w-4 accent-emerald-600"
                        />

                        <span>
                          <strong>
                            {proximaAcaoObrigatoria
                              ? t(
                                  "movement.nextAction.required"
                                )
                              : t(
                                  "movement.nextAction.schedule"
                                )}
                          </strong>

                          {proximaAcaoObrigatoria ? (
                            <span
                              className={`mt-1 block text-xs ${c.muted}`}
                            >
                              {t(
                                "movement.nextAction.requiredDescription"
                              )}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    )}

                    {deveEnviarProximaAcao ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {!leadEmMovimentacao.responsavelFuncionarioId ? (
                          <div className="rounded-xl border border-amber-600 bg-amber-950/10 px-4 py-3 text-sm font-bold text-amber-700 dark:text-amber-100 sm:col-span-2">
                            {t(
                              "movement.nextAction.noResponsible"
                            )}
                          </div>
                        ) : null}

                        <div>
                          <label
                            className={`mb-2 block text-xs font-bold uppercase tracking-wide ${c.secondary}`}
                          >
                            {t(
                              "movement.nextAction.actionType"
                            )}{" "}
                            *
                          </label>

                          <SelectTema
                            value={tipoTarefa}
                            onChange={setTipoTarefa}
                            modoTema={modoTema}
                            options={tiposTarefa.map((tipo) => ({
                              value: tipo.valor,
                              label: tipo.nome,
                            }))}
                          />
                        </div>

                        <div>
                          <label
                            className={`mb-2 block text-xs font-bold uppercase tracking-wide ${c.secondary}`}
                          >
                            {t("movement.nextAction.priority")} *
                          </label>

                          <SelectTema
                            value={prioridadeTarefa}
                            onChange={setPrioridadeTarefa}
                            modoTema={modoTema}
                            options={prioridadesTarefa.map(
                              (item) => ({
                                value: item.valor,
                                label: item.nome,
                              })
                            )}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor="titulo-tarefa"
                            className={`mb-2 block text-xs font-bold uppercase tracking-wide ${c.secondary}`}
                          >
                            {t("movement.nextAction.taskTitle")}
                          </label>

                          <input
                            id="titulo-tarefa"
                            value={tituloTarefa}
                            onChange={(event) =>
                              setTituloTarefa(event.target.value)
                            }
                            placeholder={t(
                              "movement.nextAction.taskTitlePlaceholder",
                              {
                                stage: etapaDestino.nome,
                              }
                            )}
                            className={`w-full rounded-xl border px-4 py-3 text-sm ${c.input}`}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="agendada-para"
                            className={`mb-2 block text-xs font-bold uppercase tracking-wide ${c.secondary}`}
                          >
                            {t(
                              "movement.nextAction.scheduledFor"
                            )}{" "}
                            *
                          </label>

                          <input
                            id="agendada-para"
                            type="datetime-local"
                            value={agendadaPara}
                            min={formatarDataParaInput(new Date())}
                            onChange={(event) =>
                              setAgendadaPara(event.target.value)
                            }
                            required
                            className={`w-full rounded-xl border px-4 py-3 text-sm ${c.input}`}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="prazo-em"
                            className={`mb-2 block text-xs font-bold uppercase tracking-wide ${c.secondary}`}
                          >
                            {t(
                              "movement.nextAction.deadline"
                            )}
                          </label>

                          <input
                            id="prazo-em"
                            type="datetime-local"
                            value={prazoEm}
                            min={
                              agendadaPara ||
                              formatarDataParaInput(new Date())
                            }
                            onChange={(event) =>
                              setPrazoEm(event.target.value)
                            }
                            className={`w-full rounded-xl border px-4 py-3 text-sm ${c.input}`}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="lembrete-em"
                            className={`mb-2 block text-xs font-bold uppercase tracking-wide ${c.secondary}`}
                          >
                            {t(
                              "movement.nextAction.reminder"
                            )}
                          </label>

                          <input
                            id="lembrete-em"
                            type="datetime-local"
                            value={lembreteEm}
                            max={agendadaPara}
                            onChange={(event) =>
                              setLembreteEm(event.target.value)
                            }
                            className={`w-full rounded-xl border px-4 py-3 text-sm ${c.input}`}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="responsavel-proxima-acao"
                            className={`mb-2 block text-xs font-bold uppercase tracking-wide ${c.secondary}`}
                          >
                            {t(
                              "movement.nextAction.responsible"
                            )}
                          </label>

                          <input
                            id="responsavel-proxima-acao"
                            value={
                              leadEmMovimentacao.responsavel?.nome ??
                              t("common.notDefined")
                            }
                            readOnly
                            className={`w-full cursor-not-allowed rounded-xl border px-4 py-3 text-sm ${c.panelSoft} ${c.secondary}`}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor="descricao-tarefa"
                            className={`mb-2 block text-xs font-bold uppercase tracking-wide ${c.secondary}`}
                          >
                            {t(
                              "movement.nextAction.instructions"
                            )}
                          </label>

                          <textarea
                            id="descricao-tarefa"
                            value={descricaoTarefa}
                            onChange={(event) =>
                              setDescricaoTarefa(
                                event.target.value
                              )
                            }
                            rows={3}
                            placeholder={t(
                              "movement.nextAction.instructionsPlaceholder"
                            )}
                            className={`w-full resize-y rounded-xl border px-4 py-3 text-sm ${c.input}`}
                          />
                        </div>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {erroMovimentacao ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-600 bg-red-950/15 px-4 py-3 text-sm font-bold text-red-700 dark:text-red-100"
                  >
                    {erroMovimentacao}
                  </div>
                ) : null}

                <footer
                  className={`flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end ${c.divider}`}
                >
                  <button
                    type="button"
                    onClick={fecharMovimentacao}
                    disabled={salvandoMovimentacao}
                    className={`rounded-xl border px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${c.ghostButton}`}
                  >
                    {t("movement.cancel")}
                  </button>

                  <button
                    type="submit"
                    disabled={
                      salvandoMovimentacao || !etapaDestino
                    }
                    className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-500"
                  >
                    {salvandoMovimentacao
                      ? t("movement.moving")
                      : t("movement.confirm")}
                  </button>
                </footer>
              </form>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
