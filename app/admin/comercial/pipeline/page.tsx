"use client";

import Link from "next/link";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

const TIPOS_TAREFA = [
  { valor: "LIGACAO", nome: "Ligação" },
  { valor: "WHATSAPP", nome: "WhatsApp" },
  { valor: "EMAIL", nome: "E-mail" },
  { valor: "REUNIAO", nome: "Reunião" },
  { valor: "RETORNO", nome: "Retorno" },
  { valor: "ENVIAR_PROPOSTA", nome: "Enviar proposta" },
  { valor: "SOLICITAR_DOCUMENTOS", nome: "Solicitar documentos" },
  { valor: "CONFIRMAR_PAGAMENTO", nome: "Confirmar pagamento" },
  { valor: "OUTRA", nome: "Outra" },
] as const;

const PRIORIDADES_TAREFA = [
  { valor: "BAIXA", nome: "Baixa" },
  { valor: "MEDIA", nome: "Média" },
  { valor: "ALTA", nome: "Alta" },
  { valor: "URGENTE", nome: "Urgente" },
] as const;

const CATEGORIAS: Record<string, string> = {
  ENTRADA: "Entrada",
  PRIMEIRO_CONTATO: "Primeiro contato",
  EM_ATENDIMENTO: "Em atendimento",
  QUALIFICACAO: "Qualificação",
  APRESENTACAO: "Apresentação",
  PROPOSTA: "Proposta",
  NEGOCIACAO: "Negociação",
  DOCUMENTACAO: "Documentação",
  PAGAMENTO: "Pagamento",
  CONVERSAO: "Conversão",
  PERDA: "Perda",
  PAUSA: "Pausa",
  DESCARTE: "Descarte",
};

function formatarMoeda(valor: number | null | undefined) {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataHora(valor: string | null | undefined) {
  if (!valor) {
    return "Não definida";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Data inválida";
  }

  return data.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function classePrioridade(prioridade: string) {
  switch (String(prioridade).toUpperCase()) {
    case "URGENTE":
      return "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100";

    case "ALTA":
      return "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-100";

    case "MEDIA":
      return "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100";

    default:
      return "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200";
  }
}

function telefoneSomenteNumeros(telefone: string) {
  return telefone.replace(/\D/g, "");
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

export default function PipelineComercialPage() {
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
      configuracaoFunis.motivosPerda.find((motivo) => motivo.id === id) ?? null
    );
  }, [configuracaoFunis, motivoPerdaId]);

  const proximaAcaoObrigatoria = Boolean(
    etapaDestino?.exigeProximaAcao && !leadEmMovimentacao?.proximaTarefa,
  );

  const deveEnviarProximaAcao = proximaAcaoObrigatoria || incluirProximaAcao;

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
        if (error instanceof DOMException && error.name === "AbortError") {
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
          },
        );

        const payload = (await resposta
          .json()
          .catch(() => null)) as RespostaKanban | null;

        if (!resposta.ok || !payload?.success) {
          throw new Error(
            payload?.error ?? "Não foi possível carregar o pipeline.",
          );
        }

        setDados(payload);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o pipeline.",
        );
      } finally {
        if (!signal?.aborted) {
          setCarregando(false);
        }
      }
    },
    [buscaAplicada, prioridade, somenteMeus, atualizacao],
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
        mensagem: "Você não possui permissão para movimentar leads.",
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
      dados?.etapas.find((item) => item.id === Number(idTexto)) ?? null;

    setIncluirProximaAcao(
      Boolean(etapa?.exigeProximaAcao && !leadEmMovimentacao?.proximaTarefa),
    );
  }

  async function salvarMovimentacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!leadEmMovimentacao || !etapaDestino) {
      setErroMovimentacao("Selecione a etapa de destino.");
      return;
    }

    if (!etapaDestino.permiteMovimentoManual) {
      setErroMovimentacao(
        "Esta etapa é controlada automaticamente pelo sistema.",
      );
      return;
    }

    if (
      etapaDestino.resultado === "GANHA" &&
      !leadEmMovimentacao.matriculaConvertida
    ) {
      setErroMovimentacao(
        "O lead somente pode ser convertido depois da criação de uma matrícula válida.",
      );
      return;
    }

    if (
      leadEmMovimentacao.matriculaConvertida &&
      etapaDestino.resultado !== "GANHA"
    ) {
      setErroMovimentacao(
        "Este lead possui matrícula válida e deve permanecer convertido.",
      );
      return;
    }

    if (destinoRepresentaPerda) {
      if (!configuracaoFunis?.permissoes.podeRegistrarPerda) {
        setErroMovimentacao(
          "Você não possui permissão para registrar perdas comerciais.",
        );
        return;
      }

      if (!motivoPerdaId) {
        setErroMovimentacao("Selecione o motivo da perda.");
        return;
      }

      if (
        motivoPerdaSelecionado?.exigeObservacao &&
        !motivoPerdaObservacao.trim()
      ) {
        setErroMovimentacao(
          "Este motivo de perda exige uma observação complementar.",
        );
        return;
      }
    }

    let proximaAcao: Record<string, unknown> | null = null;

    if (deveEnviarProximaAcao) {
      if (!leadEmMovimentacao.responsavelFuncionarioId) {
        setErroMovimentacao(
          "Defina um responsável para o lead antes de agendar a próxima ação.",
        );
        return;
      }

      if (!agendadaPara) {
        setErroMovimentacao(
          "Informe quando a próxima ação deverá ser realizada.",
        );
        return;
      }

      const dataAgendamento = new Date(agendadaPara);

      if (Number.isNaN(dataAgendamento.getTime())) {
        setErroMovimentacao("A data da próxima ação é inválida.");
        return;
      }

      if (dataAgendamento.getTime() < Date.now() - 60_000) {
        setErroMovimentacao("A próxima ação não pode ser agendada no passado.");
        return;
      }

      const dataPrazo = prazoEm ? new Date(prazoEm) : null;

      const dataLembrete = lembreteEm ? new Date(lembreteEm) : null;

      if (dataPrazo && Number.isNaN(dataPrazo.getTime())) {
        setErroMovimentacao("A data limite é inválida.");
        return;
      }

      if (dataLembrete && Number.isNaN(dataLembrete.getTime())) {
        setErroMovimentacao("A data do lembrete é inválida.");
        return;
      }

      if (dataPrazo && dataPrazo.getTime() < dataAgendamento.getTime()) {
        setErroMovimentacao(
          "A data limite não pode ser anterior ao agendamento.",
        );
        return;
      }

      if (dataLembrete && dataLembrete.getTime() > dataAgendamento.getTime()) {
        setErroMovimentacao(
          "O lembrete não pode ocorrer depois do agendamento.",
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
        responsavelFuncionarioId: leadEmMovimentacao.responsavelFuncionarioId,
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
        },
      );

      const payload = (await resposta.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        mensagem?: string;
      } | null;

      if (!resposta.ok || !payload?.success) {
        throw new Error(
          payload?.error ?? "Não foi possível movimentar o lead.",
        );
      }

      setLeadEmMovimentacao(null);
      setToast({
        tipo: "sucesso",
        mensagem: payload.mensagem ?? "Lead movimentado com sucesso.",
      });
      atualizar();
    } catch (error) {
      setErroMovimentacao(
        error instanceof Error
          ? error.message
          : "Não foi possível movimentar o lead.",
      );
    } finally {
      setSalvandoMovimentacao(false);
    }
  }

  return (
    <div className="phanyx-pipeline-page mx-auto max-w-[1800px] space-y-5 p-4 sm:p-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <Link
                href="/admin/comercial"
                className="transition hover:text-slate-950 dark:hover:text-white"
              >
                Comercial
              </Link>

              <span>/</span>

              <span className="text-slate-950 dark:text-white">Pipeline</span>
            </div>

            <h1 className="mt-3 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
              Pipeline comercial
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Acompanhe cada oportunidade, identifique atrasos e organize as
              próximas ações do setor comercial.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/leads"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              Ver lista de leads
            </Link>

            <Link
              href="/admin/comercial/funis"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              Configurar funil
            </Link>

            <button
              type="button"
              onClick={atualizar}
              disabled={carregando}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {carregando ? "Atualizando..." : "Atualizar"}
            </button>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_auto]">
          <div>
            <label
              htmlFor="busca-pipeline"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
            >
              Buscar oportunidades
            </label>

            <input
              id="busca-pipeline"
              value={buscaDigitada}
              onChange={(event) => setBuscaDigitada(event.target.value)}
              placeholder="Nome, e-mail, telefone, interesse..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="prioridade-pipeline"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
            >
              Prioridade
            </label>

            <select
              id="prioridade-pipeline"
              value={prioridade}
              onChange={(event) => setPrioridade(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Todas</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Média</option>
              <option value="BAIXA">Baixa</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              <input
                type="checkbox"
                checked={somenteMeus}
                disabled={!dados?.permissoes.podeVerTodos}
                onChange={(event) => setSomenteMeus(event.target.checked)}
                className="h-4 w-4 accent-emerald-600"
              />
              Somente meus leads
            </label>
          </div>
        </div>
      </section>

      {erro ? (
        <section className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          <h2 className="font-black">Não foi possível carregar o pipeline</h2>

          <p className="mt-1 text-sm">{erro}</p>

          <button
            type="button"
            onClick={atualizar}
            className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
          >
            Tentar novamente
          </button>
        </section>
      ) : null}

      {dados ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Funil ativo
              </p>

              <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                {dados.funil.nome}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Oportunidades
              </p>

              <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {dados.resumo.totalLeads}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Valor estimado
              </p>

              <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {formatarMoeda(dados.resumo.valorEstimado)}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Visualização
              </p>

              <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                {dados.permissoes.somenteMeus ? "Meus leads" : "Toda a equipe"}
              </p>
            </article>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">
                  Etapas do funil
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Role horizontalmente para visualizar todas as etapas.
                </p>
              </div>

              {carregando ? (
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  Atualizando dados...
                </span>
              ) : null}
            </div>

            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5">
              {dados.etapas.map((etapa) => (
                <article
                  key={etapa.id}
                  className="w-[320px] shrink-0 snap-start overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  <div
                    className="h-1.5"
                    style={{
                      backgroundColor: etapa.cor,
                    }}
                  />

                  <header className="border-b border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Etapa {etapa.ordem}
                        </p>

                        <h3 className="mt-1 font-black leading-5 text-slate-950 dark:text-white">
                          {etapa.nome}
                        </h3>

                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          {CATEGORIAS[etapa.categoria] ?? etapa.categoria}
                        </p>
                      </div>

                      <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                        {etapa.totalLeads}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-[9px] font-bold uppercase text-slate-500">
                          Valor
                        </p>

                        <p className="mt-1 text-xs font-black text-slate-950 dark:text-white">
                          {formatarMoeda(etapa.valorEstimado)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-[9px] font-bold uppercase text-slate-500">
                          Probabilidade
                        </p>

                        <p className="mt-1 text-xs font-black text-slate-950 dark:text-white">
                          {etapa.probabilidadeConversao}%
                        </p>
                      </div>
                    </div>
                  </header>

                  <div className="max-h-[620px] space-y-3 overflow-y-auto bg-slate-50 p-3 dark:bg-slate-900/40">
                    {etapa.leads.map((lead) => {
                      const telefone = lead.telefone
                        ? telefoneSomenteNumeros(lead.telefone)
                        : "";

                      return (
                        <div
                          key={lead.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="truncate font-black text-slate-950 dark:text-white">
                                {lead.nome}
                              </h4>

                              <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-400">
                                {lead.interesse || "Interesse não informado"}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${classePrioridade(
                                lead.prioridade,
                              )}`}
                            >
                              {lead.prioridade}
                            </span>
                          </div>

                          <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                            <p>
                              <strong>Responsável:</strong>{" "}
                              {lead.responsavel?.nome ?? "Não definido"}
                            </p>

                            {lead.curso ? (
                              <p>
                                <strong>Curso:</strong> {lead.curso.nome}
                              </p>
                            ) : null}

                            {lead.polo ? (
                              <p>
                                <strong>Polo:</strong> {lead.polo.nome}
                              </p>
                            ) : null}

                            <p>
                              <strong>Valor:</strong>{" "}
                              {formatarMoeda(lead.valorEstimado)}
                            </p>
                          </div>

                          {lead.etapaAtrasada ? (
                            <div className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
                              Etapa com prazo vencido
                            </div>
                          ) : null}

                          {lead.acompanhamentoAtrasado ? (
                            <div className="mt-2 rounded-xl border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-100">
                              Acompanhamento atrasado
                            </div>
                          ) : null}

                          {lead.semProximaAcao ? (
                            <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                              Próxima ação não definida
                            </div>
                          ) : null}

                          {lead.proximaTarefa ? (
                            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                              <p className="text-[9px] font-bold uppercase text-slate-500">
                                Próxima ação
                              </p>

                              <p className="mt-1 text-xs font-black text-slate-950 dark:text-white">
                                {lead.proximaTarefa.titulo}
                              </p>

                              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                                {formatarDataHora(
                                  lead.proximaTarefa.agendadaPara,
                                )}
                              </p>
                            </div>
                          ) : null}

                          {lead.matriculaConvertida ? (
                            <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                              Matrícula{" "}
                              {lead.matriculaConvertida.numeroMatricula ??
                                `#${lead.matriculaConvertida.id}`}
                            </div>
                          ) : null}

                          <div className="mt-4 flex flex-wrap gap-2">
                            {configuracaoFunis?.permissoes.podeMovimentar &&
                            !lead.matriculaConvertida ? (
                              <button
                                type="button"
                                onClick={() => abrirMovimentacao(lead)}
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-700"
                              >
                                Mover etapa
                              </button>
                            ) : null}

                            {telefone ? (
                              <a
                                href={`https://wa.me/55${telefone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-2 text-[11px] font-bold text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                              >
                                WhatsApp
                              </a>
                            ) : null}

                            <a
                              href={`mailto:${lead.email}`}
                              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            >
                              E-mail
                            </a>

                            <span className="ml-auto self-center text-[10px] font-semibold text-slate-500">
                              #{lead.id}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {etapa.leads.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                        Nenhuma oportunidade nesta etapa.
                      </div>
                    ) : null}

                    {etapa.temMais ? (
                      <div className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                        Existem mais leads nesta etapa
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
        <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-950">
          <div className="text-3xl">⏳</div>

          <p className="mt-3 font-bold text-slate-900 dark:text-white">
            Carregando pipeline comercial...
          </p>
        </section>
      ) : null}

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-5 top-5 z-[120] max-w-sm rounded-2xl border px-5 py-4 text-sm font-bold shadow-xl ${
            toast.tipo === "sucesso"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
              : "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
          }`}
        >
          {toast.mensagem}
        </div>
      ) : null}

      {leadEmMovimentacao ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.7)",
          }}
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
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Movimentação do pipeline
                </p>

                <h2
                  id="titulo-movimentar-lead"
                  className="mt-1 text-xl font-black text-slate-950 dark:text-white"
                >
                  Mover {leadEmMovimentacao.nome}
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  A alteração ficará registrada no histórico comercial do lead.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharMovimentacao}
                disabled={salvandoMovimentacao}
                aria-label="Fechar movimentação"
                className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-2 font-black text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                ✕
              </button>
            </header>

            <form
              onSubmit={salvarMovimentacao}
              className="space-y-5 p-5 sm:p-6"
            >
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Etapa atual
                  </p>

                  <p className="mt-1 font-black text-slate-950 dark:text-white">
                    {dados?.etapas.find(
                      (etapa) => etapa.id === leadEmMovimentacao.etapaFunilId,
                    )?.nome ?? "Não definida"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Responsável
                  </p>

                  <p className="mt-1 font-black text-slate-950 dark:text-white">
                    {leadEmMovimentacao.responsavel?.nome ?? "Não definido"}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="etapa-destino"
                  className="mb-2 block text-sm font-black text-slate-900 dark:text-white"
                >
                  Etapa de destino *
                </label>

                <select
                  id="etapa-destino"
                  value={etapaNovaId}
                  onChange={(event) => alterarEtapaDestino(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">Selecione a nova etapa</option>

                  {dados?.etapas
                    .filter(
                      (etapa) => etapa.id !== leadEmMovimentacao.etapaFunilId,
                    )
                    .map((etapa) => {
                      const perda = etapaRepresentaPerda(etapa);

                      const semPermissaoPerda =
                        perda &&
                        !configuracaoFunis?.permissoes.podeRegistrarPerda;

                      const conversaoSemMatricula =
                        etapa.resultado === "GANHA" &&
                        !leadEmMovimentacao.matriculaConvertida;

                      const bloqueada =
                        !etapa.permiteMovimentoManual ||
                        semPermissaoPerda ||
                        conversaoSemMatricula;

                      const complemento = !etapa.permiteMovimentoManual
                        ? " — automática"
                        : semPermissaoPerda
                          ? " — sem permissão"
                          : conversaoSemMatricula
                            ? " — exige matrícula"
                            : "";

                      return (
                        <option
                          key={etapa.id}
                          value={etapa.id}
                          disabled={bloqueada}
                        >
                          {etapa.ordem}. {etapa.nome}
                          {complemento}
                        </option>
                      );
                    })}
                </select>

                {etapaDestino ? (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    {etapaDestino.descricao ??
                      CATEGORIAS[etapaDestino.categoria] ??
                      etapaDestino.categoria}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="motivo-movimentacao"
                  className="mb-2 block text-sm font-black text-slate-900 dark:text-white"
                >
                  Observação da movimentação
                </label>

                <textarea
                  id="motivo-movimentacao"
                  value={motivoMovimentacao}
                  onChange={(event) =>
                    setMotivoMovimentacao(event.target.value)
                  }
                  rows={3}
                  placeholder="Ex.: lead respondeu, proposta aceita, documentos recebidos..."
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              {destinoRepresentaPerda ? (
                <section className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                  <div>
                    <h3 className="font-black text-red-900 dark:text-red-100">
                      Registro da perda
                    </h3>

                    <p className="mt-1 text-xs text-red-800 dark:text-red-200">
                      O motivo será usado nos relatórios de conversão e melhoria
                      comercial.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="motivo-perda"
                      className="mb-2 block text-sm font-black text-red-900 dark:text-red-100"
                    >
                      Motivo da perda *
                    </label>

                    <select
                      id="motivo-perda"
                      value={motivoPerdaId}
                      onChange={(event) => {
                        setMotivoPerdaId(event.target.value);
                        setMotivoPerdaObservacao("");
                      }}
                      required
                      className="w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-red-500 dark:border-red-800 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="">Selecione o motivo</option>

                      {configuracaoFunis?.motivosPerda
                        .filter((motivo) => motivo.ativo && !motivo.arquivadoEm)
                        .map((motivo) => (
                          <option key={motivo.id} value={motivo.id}>
                            {motivo.nome}
                          </option>
                        ))}
                    </select>
                  </div>

                  {motivoPerdaSelecionado ? (
                    <div>
                      <label
                        htmlFor="observacao-perda"
                        className="mb-2 block text-sm font-black text-red-900 dark:text-red-100"
                      >
                        Observação complementar
                        {motivoPerdaSelecionado.exigeObservacao ? " *" : ""}
                      </label>

                      <textarea
                        id="observacao-perda"
                        value={motivoPerdaObservacao}
                        onChange={(event) =>
                          setMotivoPerdaObservacao(event.target.value)
                        }
                        required={motivoPerdaSelecionado.exigeObservacao}
                        rows={3}
                        placeholder="Registre os detalhes que ajudarão a compreender a perda."
                        className="w-full resize-y rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-red-500 dark:border-red-800 dark:bg-slate-950 dark:text-white"
                      />

                      {motivoPerdaSelecionado.exigeObservacao ? (
                        <p className="mt-2 text-xs font-bold text-red-800 dark:text-red-200">
                          Este motivo exige observação.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </section>
              ) : null}

              {etapaDestino?.resultado === "ABERTA" ? (
                <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <h3 className="font-black text-slate-950 dark:text-white">
                      Próxima ação
                    </h3>

                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Mantenha o acompanhamento do lead com data, canal e
                      prioridade definidos.
                    </p>
                  </div>

                  {etapaDestino.exigeProximaAcao &&
                  leadEmMovimentacao.proximaTarefa ? (
                    <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                      <strong>Próxima ação já definida:</strong>{" "}
                      {leadEmMovimentacao.proximaTarefa.titulo}, em{" "}
                      {formatarDataHora(
                        leadEmMovimentacao.proximaTarefa.agendadaPara,
                      )}
                      .
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                      <input
                        type="checkbox"
                        checked={deveEnviarProximaAcao}
                        disabled={proximaAcaoObrigatoria}
                        onChange={(event) =>
                          setIncluirProximaAcao(event.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 accent-emerald-600"
                      />

                      <span>
                        <strong>
                          {proximaAcaoObrigatoria
                            ? "Próxima ação obrigatória"
                            : "Agendar uma próxima ação"}
                        </strong>

                        {proximaAcaoObrigatoria ? (
                          <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                            A etapa selecionada exige uma tarefa pendente.
                          </span>
                        ) : null}
                      </span>
                    </label>
                  )}

                  {deveEnviarProximaAcao ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {!leadEmMovimentacao.responsavelFuncionarioId ? (
                        <div className="sm:col-span-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                          O lead ainda não possui responsável. Defina o
                          responsável antes de movimentá-lo para esta etapa.
                        </div>
                      ) : null}

                      <div>
                        <label
                          htmlFor="tipo-tarefa"
                          className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                        >
                          Tipo de ação *
                        </label>

                        <select
                          id="tipo-tarefa"
                          value={tipoTarefa}
                          onChange={(event) =>
                            setTipoTarefa(event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                          {TIPOS_TAREFA.map((tipo) => (
                            <option key={tipo.valor} value={tipo.valor}>
                              {tipo.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="prioridade-tarefa"
                          className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                        >
                          Prioridade *
                        </label>

                        <select
                          id="prioridade-tarefa"
                          value={prioridadeTarefa}
                          onChange={(event) =>
                            setPrioridadeTarefa(event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                          {PRIORIDADES_TAREFA.map((item) => (
                            <option key={item.valor} value={item.valor}>
                              {item.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor="titulo-tarefa"
                          className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                        >
                          Título
                        </label>

                        <input
                          id="titulo-tarefa"
                          value={tituloTarefa}
                          onChange={(event) =>
                            setTituloTarefa(event.target.value)
                          }
                          placeholder={`Próxima ação — ${etapaDestino.nome}`}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="agendada-para"
                          className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                        >
                          Agendada para *
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
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="prazo-em"
                          className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                        >
                          Data limite
                        </label>

                        <input
                          id="prazo-em"
                          type="datetime-local"
                          value={prazoEm}
                          min={
                            agendadaPara || formatarDataParaInput(new Date())
                          }
                          onChange={(event) => setPrazoEm(event.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="lembrete-em"
                          className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                        >
                          Lembrete
                        </label>

                        <input
                          id="lembrete-em"
                          type="datetime-local"
                          value={lembreteEm}
                          max={agendadaPara}
                          onChange={(event) =>
                            setLembreteEm(event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="responsavel-proxima-acao"
                          className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                        >
                          Responsável
                        </label>

                        <input
                          id="responsavel-proxima-acao"
                          value={
                            leadEmMovimentacao.responsavel?.nome ??
                            "Não definido"
                          }
                          readOnly
                          className="w-full cursor-not-allowed rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor="descricao-tarefa"
                          className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                        >
                          Orientações da tarefa
                        </label>

                        <textarea
                          id="descricao-tarefa"
                          value={descricaoTarefa}
                          onChange={(event) =>
                            setDescricaoTarefa(event.target.value)
                          }
                          rows={3}
                          placeholder="Descreva o que deverá ser feito no próximo contato."
                          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {erroMovimentacao ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
                >
                  {erroMovimentacao}
                </div>
              ) : null}

              <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fecharMovimentacao}
                  disabled={salvandoMovimentacao}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvandoMovimentacao || !etapaDestino}
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {salvandoMovimentacao
                    ? "Movimentando..."
                    : "Confirmar movimentação"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}