"use client";

import Link from "next/link";
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type StatusTarefa =
  | "PENDENTE"
  | "EM_ANDAMENTO"
  | "CONCLUIDA"
  | "CANCELADA";

type TipoTarefa =
  | "LIGACAO"
  | "WHATSAPP"
  | "EMAIL"
  | "REUNIAO"
  | "RETORNO"
  | "ENVIAR_PROPOSTA"
  | "SOLICITAR_DOCUMENTOS"
  | "CONFIRMAR_PAGAMENTO"
  | "OUTRA";

type PrioridadeTarefa = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

type ReferenciaResponsavel = {
  id: number;
  nome: string;
  cargo: string | null;
};

type ReferenciaLead = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  responsavelFuncionarioId?: number | null;
};

type Tarefa = {
  id: number;
  leadId: number;
  responsavelFuncionarioId: number | null;
  tipo: TipoTarefa;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa;
  titulo: string;
  descricao: string | null;
  resultado: string | null;
  motivoCancelamento: string | null;
  proximaAcao: boolean;
  agendadaPara: string;
  prazoEm: string | null;
  lembreteEm: string | null;
  iniciadaEm: string | null;
  concluidaEm: string | null;
  canceladaEm: string | null;
  responsavelNomeSnapshot: string | null;
  criadoEm: string;
  atualizadoEm: string;
  atrasada: boolean;
  lead: ReferenciaLead | null;
  responsavel: ReferenciaResponsavel | null;
};

type PermissoesAgenda = {
  podeVer: boolean;
  podeVerTodas: boolean;
  podeCriar: boolean;
  podeEditar: boolean;
  podeAtribuir: boolean;
  podeConcluir: boolean;
  podeCancelar: boolean;
  somenteMinhas: boolean;
  funcionarioId: number | null;
};

type RespostaAgenda = {
  success: boolean;
  error?: string;
  codigo?: string;
  permissoes: PermissoesAgenda;
  resumo: {
    total: number;
    atrasadas: number;
    hoje: number;
    proximas: number;
    emAndamento: number;
    concluidasHoje: number;
  };
  tarefas: Tarefa[];
  referencias: {
    responsaveis: ReferenciaResponsavel[];
    leads: ReferenciaLead[];
  };
  paginacao: {
    pagina: number;
    limite: number;
    totalItens: number;
    totalPaginas: number;
    temAnterior: boolean;
    temProxima: boolean;
  };
};

type FormularioTarefa = {
  leadId: string;
  responsavelFuncionarioId: string;
  tipo: TipoTarefa;
  prioridade: PrioridadeTarefa;
  titulo: string;
  descricao: string;
  agendadaPara: string;
  prazoEm: string;
  lembreteEm: string;
  proximaAcao: boolean;
};

type AcaoEspecial = {
  tipo: "CONCLUIR" | "CANCELAR";
  tarefa: Tarefa;
};

type OpcaoSelectAgenda = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectAgendaProps = {
  value: string;
  options: OpcaoSelectAgenda[];
  onChange: (value: string) => void;
  ariaLabel: string;
  disabled?: boolean;
};

const TIPOS: Array<{
  valor: TipoTarefa;
  nome: string;
  icone: string;
  titulo: string;
}> = [
  { valor: "LIGACAO", nome: "Ligação", icone: "📞", titulo: "Realizar ligação" },
  { valor: "WHATSAPP", nome: "WhatsApp", icone: "💬", titulo: "Enviar mensagem pelo WhatsApp" },
  { valor: "EMAIL", nome: "E-mail", icone: "✉️", titulo: "Enviar e-mail" },
  { valor: "REUNIAO", nome: "Reunião", icone: "👥", titulo: "Realizar reunião" },
  { valor: "RETORNO", nome: "Retorno", icone: "↩️", titulo: "Retornar contato" },
  { valor: "ENVIAR_PROPOSTA", nome: "Enviar proposta", icone: "📄", titulo: "Enviar proposta comercial" },
  { valor: "SOLICITAR_DOCUMENTOS", nome: "Solicitar documentos", icone: "📎", titulo: "Solicitar documentos" },
  { valor: "CONFIRMAR_PAGAMENTO", nome: "Confirmar pagamento", icone: "💳", titulo: "Confirmar pagamento" },
  { valor: "OUTRA", nome: "Outra ação", icone: "📌", titulo: "Realizar próxima ação" },
];

const TIPO_VISUAL_PADRAO = {
  valor: "OUTRA" as const,
  nome: "Outra ação",
  icone: "📌",
  titulo: "Realizar próxima ação",
};

const PRIORIDADES: Array<{ valor: PrioridadeTarefa; nome: string }> = [
  { valor: "BAIXA", nome: "Baixa" },
  { valor: "MEDIA", nome: "Média" },
  { valor: "ALTA", nome: "Alta" },
  { valor: "URGENTE", nome: "Urgente" },
];

const PERIODOS = [
  { valor: "TODAS", nome: "Todas" },
  { valor: "ATRASADAS", nome: "Atrasadas" },
  { valor: "HOJE", nome: "Hoje" },
  { valor: "AMANHA", nome: "Amanhã" },
  { valor: "SEMANA", nome: "7 dias" },
  { valor: "PROXIMAS", nome: "Próximas" },
] as const;

const STATUS = [
  { valor: "TODOS", nome: "Todos os status" },
  { valor: "PENDENTE", nome: "Pendente" },
  { valor: "EM_ANDAMENTO", nome: "Em andamento" },
  { valor: "CONCLUIDA", nome: "Concluída" },
  { valor: "CANCELADA", nome: "Cancelada" },
] as const;

function doisDigitos(valor: number) {
  return String(valor).padStart(2, "0");
}

function paraInputDataHora(valor: Date | string | null, acrescimoMinutos = 0) {
  if (!valor && acrescimoMinutos === 0) return "";

  const data = valor ? new Date(valor) : new Date();
  data.setMinutes(data.getMinutes() + acrescimoMinutos);

  if (Number.isNaN(data.getTime())) return "";

  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(
    data.getDate()
  )}T${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

function paraIsoBrasilia(valor: string) {
  if (!valor) return null;
  const completo = valor.length === 16 ? `${valor}:00` : valor;
  const data = new Date(`${completo}-03:00`);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

function formatarDataHora(valor?: string | null) {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";

  return data.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatarDia(valor: string) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Data não informada";

  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);

  const chave = (item: Date) =>
    `${item.getFullYear()}-${item.getMonth()}-${item.getDate()}`;

  if (chave(data) === chave(hoje)) return "Hoje";
  if (chave(data) === chave(amanha)) return "Amanhã";

  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function chaveDiaBrasilia(valor: string) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;

  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);

  const ano = partes.find((item) => item.type === "year")?.value;
  const mes = partes.find((item) => item.type === "month")?.value;
  const dia = partes.find((item) => item.type === "day")?.value;

  return ano && mes && dia ? `${ano}-${mes}-${dia}` : valor;
}

function formatarHora(valor: string) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function rotulo(valor?: string | null) {
  if (!valor) return "Não informado";
  return valor
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

function tipoVisual(tipo: TipoTarefa) {
  return TIPOS.find((item) => item.valor === tipo) ?? TIPO_VISUAL_PADRAO;
}

function formularioVazio(
  leadId = "",
  responsavelId = ""
): FormularioTarefa {
  return {
    leadId,
    responsavelFuncionarioId: responsavelId,
    tipo: "RETORNO",
    prioridade: "MEDIA",
    titulo: "Retornar contato",
    descricao: "",
    agendadaPara: paraInputDataHora(null, 60),
    prazoEm: "",
    lembreteEm: "",
    proximaAcao: true,
  };
}

function formularioDaTarefa(tarefa: Tarefa): FormularioTarefa {
  return {
    leadId: String(tarefa.leadId),
    responsavelFuncionarioId: tarefa.responsavelFuncionarioId
      ? String(tarefa.responsavelFuncionarioId)
      : "",
    tipo: tarefa.tipo,
    prioridade: tarefa.prioridade,
    titulo: tarefa.titulo,
    descricao: tarefa.descricao ?? "",
    agendadaPara: paraInputDataHora(tarefa.agendadaPara),
    prazoEm: paraInputDataHora(tarefa.prazoEm),
    lembreteEm: paraInputDataHora(tarefa.lembreteEm),
    proximaAcao: tarefa.proximaAcao,
  };
}

function SelectAgenda({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
}: SelectAgendaProps) {
  const [aberto, setAberto] = useState(false);
  const [indiceAtivo, setIndiceAtivo] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const gatilhoRef = useRef<HTMLButtonElement>(null);

  const indiceSelecionado = options.findIndex(
    (opcao) => opcao.value === value && !opcao.disabled
  );
  const opcaoSelecionada = options.find((opcao) => opcao.value === value);

  useEffect(() => {
    if (!aberto) return;

    function fecharAoClicarFora(evento: PointerEvent) {
      if (
        evento.target instanceof Node &&
        !containerRef.current?.contains(evento.target)
      ) {
        setAberto(false);
      }
    }

    document.addEventListener("pointerdown", fecharAoClicarFora);
    return () => document.removeEventListener("pointerdown", fecharAoClicarFora);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    setIndiceAtivo(indiceSelecionado >= 0 ? indiceSelecionado : 0);
  }, [aberto, indiceSelecionado]);

  function procurarIndiceDisponivel(
    inicio: number,
    direcao: 1 | -1
  ) {
    if (!options.length) return -1;

    let indice = inicio;
    for (let tentativa = 0; tentativa < options.length; tentativa += 1) {
      indice = (indice + direcao + options.length) % options.length;
      if (!options[indice]?.disabled) return indice;
    }

    return -1;
  }

  function abrirLista() {
    if (disabled) return;
    setIndiceAtivo(
      indiceSelecionado >= 0
        ? indiceSelecionado
        : procurarIndiceDisponivel(-1, 1)
    );
    setAberto(true);
  }

  function escolherOpcao(opcao: OpcaoSelectAgenda) {
    if (opcao.disabled) return;
    onChange(opcao.value);
    setAberto(false);
    window.requestAnimationFrame(() => gatilhoRef.current?.focus());
  }

  function manipularTeclado(evento: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      if (!aberto) {
        abrirLista();
        return;
      }

      const direcao = evento.key === "ArrowDown" ? 1 : -1;
      setIndiceAtivo((atual) =>
        procurarIndiceDisponivel(atual < 0 ? 0 : atual, direcao)
      );
      return;
    }

    if (evento.key === "Home" || evento.key === "End") {
      if (!aberto) return;
      evento.preventDefault();
      setIndiceAtivo(
        evento.key === "Home"
          ? procurarIndiceDisponivel(-1, 1)
          : procurarIndiceDisponivel(0, -1)
      );
      return;
    }

    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      if (!aberto) {
        abrirLista();
      } else if (indiceAtivo >= 0 && options[indiceAtivo]) {
        escolherOpcao(options[indiceAtivo]);
      }
      return;
    }

    if (evento.key === "Escape") {
      evento.preventDefault();
      setAberto(false);
      return;
    }

    if (evento.key === "Tab") setAberto(false);
  }

  return (
    <div
      ref={containerRef}
      className={`agenda-custom-select ${aberto ? "is-open" : ""}`}
    >
      <button
        ref={gatilhoRef}
        type="button"
        className="agenda-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        disabled={disabled}
        onClick={() => (aberto ? setAberto(false) : abrirLista())}
        onKeyDown={manipularTeclado}
      >
        <span>{opcaoSelecionada?.label ?? "Selecione"}</span>
        <span className="agenda-select-arrow" aria-hidden="true">
          ▾
        </span>
      </button>

      {aberto ? (
        <div className="agenda-select-list" role="listbox" aria-label={ariaLabel}>
          {options.map((opcao, indice) => (
            <button
              type="button"
              role="option"
              tabIndex={-1}
              key={`${opcao.value}-${indice}`}
              className="agenda-select-option"
              aria-selected={opcao.value === value}
              data-active={indice === indiceAtivo ? "true" : "false"}
              data-selected={opcao.value === value ? "true" : "false"}
              disabled={opcao.disabled}
              onMouseEnter={() => setIndiceAtivo(indice)}
              onClick={() => escolherOpcao(opcao)}
            >
              {opcao.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AgendaComercialPage() {
  const [dados, setDados] = useState<RespostaAgenda | null>(null);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [atualizacao, setAtualizacao] = useState(0);

  const [buscaDigitada, setBuscaDigitada] = useState("");
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState("TODAS");
  const [status, setStatus] = useState("TODOS");
  const [prioridade, setPrioridade] = useState("TODAS");
  const [tipo, setTipo] = useState("TODOS");
  const [responsavelId, setResponsavelId] = useState("");
  const [somenteMinhas, setSomenteMinhas] = useState(false);

  const [modalTarefaAberto, setModalTarefaAberto] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState<Tarefa | null>(null);
  const [formulario, setFormulario] = useState<FormularioTarefa>(() =>
    formularioVazio()
  );
  const [salvando, setSalvando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState("");

  const [acaoEspecial, setAcaoEspecial] = useState<AcaoEspecial | null>(null);
  const [textoAcao, setTextoAcao] = useState("");
  const [processandoAcao, setProcessandoAcao] = useState<number | null>(null);
  const [toast, setToast] = useState<
    { tipo: "sucesso" | "erro"; mensagem: string } | null
  >(null);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setBusca(buscaDigitada.trim());
      setPagina(1);
    }, 350);

    return () => window.clearTimeout(temporizador);
  }, [buscaDigitada]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const consulta = new URLSearchParams(window.location.search);
    const leadId = consulta.get("leadId");
    const deveAbrir = consulta.get("nova") === "1";

    if (leadId && /^\d+$/.test(leadId)) {
      setFormulario((atual) => ({ ...atual, leadId }));
    }
    if (deveAbrir) setModalTarefaAberto(true);
  }, []);

  useEffect(() => {
    const funcionarioId = dados?.permissoes.funcionarioId;

    if (!funcionarioId || formulario.responsavelFuncionarioId) return;

    setFormulario((atual) => ({
      ...atual,
      responsavelFuncionarioId: String(funcionarioId),
    }));
  }, [dados?.permissoes.funcionarioId, formulario.responsavelFuncionarioId]);

  useEffect(() => {
    if (
      !modalTarefaAberto ||
      tarefaEditando ||
      !dados?.permissoes.podeAtribuir ||
      !formulario.leadId
    ) {
      return;
    }

    const lead = dados.referencias.leads.find(
      (item) => String(item.id) === formulario.leadId
    );
    const responsavelDoLead = lead?.responsavelFuncionarioId;

    if (
      !responsavelDoLead ||
      formulario.responsavelFuncionarioId === String(responsavelDoLead)
    ) {
      return;
    }

    setFormulario((atual) => ({
      ...atual,
      responsavelFuncionarioId: String(responsavelDoLead),
    }));
  }, [
    dados,
    formulario.leadId,
    formulario.responsavelFuncionarioId,
    modalTarefaAberto,
    tarefaEditando,
  ]);

  useEffect(() => {
    const controlador = new AbortController();

    async function carregar() {
      setAtualizando(true);
      setErro("");

      const consulta = new URLSearchParams({
        pagina: String(pagina),
        limite: "30",
        busca,
        periodo,
        status,
        prioridade,
        tipo,
        responsavelId,
        somenteMinhas: somenteMinhas ? "1" : "0",
      });

      try {
        const resposta = await fetch(
          `/api/admin/comercial/tarefas?${consulta.toString()}`,
          {
            cache: "no-store",
            credentials: "include",
            signal: controlador.signal,
          }
        );

        const payload = (await resposta.json().catch(() => null)) as
          | RespostaAgenda
          | null;

        if (!resposta.ok || !payload?.success) {
          throw new Error(
            payload?.error ?? "Não foi possível carregar a Agenda Comercial."
          );
        }

        setDados(payload);
        if (payload.paginacao.pagina !== pagina) {
          setPagina(payload.paginacao.pagina);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a Agenda Comercial."
        );
      } finally {
        setCarregandoInicial(false);
        setAtualizando(false);
      }
    }

    carregar();
    return () => controlador.abort();
  }, [
    pagina,
    busca,
    periodo,
    status,
    prioridade,
    tipo,
    responsavelId,
    somenteMinhas,
    atualizacao,
  ]);

  useEffect(() => {
    if (!toast) return;
    const temporizador = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(temporizador);
  }, [toast]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, { titulo: string; tarefas: Tarefa[] }>();

    dados?.tarefas.forEach((tarefa) => {
      const chave = tarefa.atrasada
        ? "000-atrasadas"
        : chaveDiaBrasilia(tarefa.agendadaPara);
      const tituloGrupo = tarefa.atrasada
        ? "Atrasadas"
        : formatarDia(tarefa.agendadaPara);

      const grupo = mapa.get(chave) ?? { titulo: tituloGrupo, tarefas: [] };
      grupo.tarefas.push(tarefa);
      mapa.set(chave, grupo);
    });

    return [...mapa.entries()]
      .sort(([chaveA], [chaveB]) => chaveA.localeCompare(chaveB))
      .map(([, grupo]) => grupo);
  }, [dados?.tarefas]);

  function selecionarPeriodo(novoPeriodo: string) {
    setPeriodo(novoPeriodo);
    setPagina(1);
  }

  function abrirNovaTarefa() {
    const funcionarioId = dados?.permissoes.funcionarioId;
    setTarefaEditando(null);
    setFormulario(
      formularioVazio(
        "",
        funcionarioId ? String(funcionarioId) : ""
      )
    );
    setErroFormulario("");
    setModalTarefaAberto(true);
  }

  function abrirEdicao(tarefa: Tarefa) {
    setTarefaEditando(tarefa);
    setFormulario(formularioDaTarefa(tarefa));
    setErroFormulario("");
    setModalTarefaAberto(true);
  }

  function alterarTipo(novoTipo: TipoTarefa) {
    const visual = tipoVisual(novoTipo);
    setFormulario((atual) => ({
      ...atual,
      tipo: novoTipo,
      titulo:
        !atual.titulo.trim() ||
        TIPOS.some((item) => item.titulo === atual.titulo)
          ? visual.titulo
          : atual.titulo,
    }));
  }

  function alterarLead(leadId: string) {
    const lead = dados?.referencias.leads.find(
      (item) => String(item.id) === leadId
    );

    setFormulario((atual) => ({
      ...atual,
      leadId,
      responsavelFuncionarioId:
        dados?.permissoes.podeAtribuir && lead?.responsavelFuncionarioId
          ? String(lead.responsavelFuncionarioId)
          : atual.responsavelFuncionarioId,
    }));
  }

  async function salvarTarefa(evento: FormEvent) {
    evento.preventDefault();
    setErroFormulario("");

    if (!formulario.leadId) {
      setErroFormulario("Selecione o lead relacionado à tarefa.");
      return;
    }
    if (!formulario.responsavelFuncionarioId) {
      setErroFormulario("Selecione o responsável pela tarefa.");
      return;
    }
    if (!formulario.titulo.trim()) {
      setErroFormulario("Informe o título da tarefa.");
      return;
    }

    const agendadaPara = paraIsoBrasilia(formulario.agendadaPara);
    const prazoEm = paraIsoBrasilia(formulario.prazoEm);
    const lembreteEm = paraIsoBrasilia(formulario.lembreteEm);

    if (!agendadaPara) {
      setErroFormulario("Informe uma data e um horário válidos.");
      return;
    }

    setSalvando(true);

    try {
      const resposta = await fetch(
        tarefaEditando
          ? `/api/admin/comercial/tarefas/${tarefaEditando.id}`
          : "/api/admin/comercial/tarefas",
        {
          method: tarefaEditando ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: Number(formulario.leadId),
            responsavelFuncionarioId: Number(
              formulario.responsavelFuncionarioId
            ),
            tipo: formulario.tipo,
            prioridade: formulario.prioridade,
            titulo: formulario.titulo.trim(),
            descricao: formulario.descricao.trim() || null,
            agendadaPara,
            prazoEm,
            lembreteEm,
            proximaAcao: formulario.proximaAcao,
          }),
        }
      );

      const payload = (await resposta.json().catch(() => null)) as
        | { success?: boolean; error?: string; message?: string }
        | null;

      if (!resposta.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Não foi possível salvar a tarefa.");
      }

      setModalTarefaAberto(false);
      setTarefaEditando(null);
      setPagina(1);
      setAtualizacao((valor) => valor + 1);
      setToast({
        tipo: "sucesso",
        mensagem:
          payload.message ??
          (tarefaEditando
            ? "Tarefa atualizada com sucesso."
            : "Tarefa criada com sucesso."),
      });
    } catch (error) {
      setErroFormulario(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a tarefa."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function atualizarStatus(
    tarefa: Tarefa,
    novoStatus: StatusTarefa,
    complemento?: Record<string, unknown>
  ) {
    setProcessandoAcao(tarefa.id);

    try {
      const resposta = await fetch(
        `/api/admin/comercial/tarefas/${tarefa.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: novoStatus, ...complemento }),
        }
      );

      const payload = (await resposta.json().catch(() => null)) as
        | { success?: boolean; error?: string; message?: string }
        | null;

      if (!resposta.ok || !payload?.success) {
        throw new Error(
          payload?.error ?? "Não foi possível atualizar a tarefa."
        );
      }

      setAcaoEspecial(null);
      setTextoAcao("");
      setAtualizacao((valor) => valor + 1);
      setToast({
        tipo: "sucesso",
        mensagem: payload.message ?? "Tarefa atualizada.",
      });
    } catch (error) {
      setToast({
        tipo: "erro",
        mensagem:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a tarefa.",
      });
    } finally {
      setProcessandoAcao(null);
    }
  }

  async function confirmarAcaoEspecial(evento: FormEvent) {
    evento.preventDefault();
    if (!acaoEspecial || !textoAcao.trim()) return;

    if (acaoEspecial.tipo === "CONCLUIR") {
      await atualizarStatus(acaoEspecial.tarefa, "CONCLUIDA", {
        resultado: textoAcao.trim(),
      });
    } else {
      await atualizarStatus(acaoEspecial.tarefa, "CANCELADA", {
        motivoCancelamento: textoAcao.trim(),
      });
    }
  }

  if (carregandoInicial) {
    return (
      <main className="agenda-page">
        <div className="agenda-container agenda-loading">
          <div className="agenda-spinner" />
          <strong>Organizando a Agenda Comercial...</strong>
          <span>Carregando tarefas, responsáveis e próximos contatos.</span>
        </div>
        <EstilosAgenda />
      </main>
    );
  }

  if (!dados) {
    return (
      <main className="agenda-page">
        <div className="agenda-container">
          <section className="agenda-surface agenda-empty-page">
            <div className="agenda-empty-icon">!</div>
            <h1>Não foi possível abrir a Agenda Comercial</h1>
            <p>{erro || "Verifique suas permissões e tente novamente."}</p>
            <button
              type="button"
              className="agenda-button agenda-button-primary"
              onClick={() => setAtualizacao((valor) => valor + 1)}
            >
              Tentar novamente
            </button>
          </section>
        </div>
        <EstilosAgenda />
      </main>
    );
  }

  return (
    <main className="agenda-page">
      <div className="agenda-container">
        <header className="agenda-surface agenda-header">
          <div>
            <div className="agenda-breadcrumb">
              Comercial <span>/</span> Agenda comercial
            </div>
            <h1>Agenda Comercial</h1>
            <p>
              Organize ligações, retornos, reuniões, propostas, documentos e
              todas as próximas ações da equipe de vendas.
            </p>
          </div>

          <div className="agenda-header-actions">
            <Link
              href="/admin/comercial/pipeline"
              className="agenda-button agenda-button-secondary"
            >
              Pipeline
            </Link>
            <button
              type="button"
              className="agenda-button agenda-button-secondary"
              disabled={atualizando}
              onClick={() => setAtualizacao((valor) => valor + 1)}
            >
              {atualizando ? "Atualizando..." : "Atualizar"}
            </button>
            {dados.permissoes.podeCriar ? (
              <button
                type="button"
                className="agenda-button agenda-button-primary"
                onClick={abrirNovaTarefa}
              >
                + Nova tarefa
              </button>
            ) : null}
          </div>
        </header>

        {erro ? <div className="agenda-inline-error">{erro}</div> : null}

        <section className="agenda-kpi-grid">
          <button
            type="button"
            className="agenda-surface agenda-kpi agenda-kpi-danger"
            onClick={() => selecionarPeriodo("ATRASADAS")}
          >
            <span>⚠️ Atrasadas</span>
            <strong>{dados.resumo.atrasadas}</strong>
            <small>Exigem atenção imediata</small>
          </button>
          <button
            type="button"
            className="agenda-surface agenda-kpi"
            onClick={() => selecionarPeriodo("HOJE")}
          >
            <span>📅 Para hoje</span>
            <strong>{dados.resumo.hoje}</strong>
            <small>Ações programadas</small>
          </button>
          <button
            type="button"
            className="agenda-surface agenda-kpi"
            onClick={() => selecionarPeriodo("PROXIMAS")}
          >
            <span>🗓️ Próximas</span>
            <strong>{dados.resumo.proximas}</strong>
            <small>Depois de hoje</small>
          </button>
          <button
            type="button"
            className="agenda-surface agenda-kpi agenda-kpi-progress"
            onClick={() => {
              setStatus("EM_ANDAMENTO");
              setPagina(1);
            }}
          >
            <span>⏱️ Em andamento</span>
            <strong>{dados.resumo.emAndamento}</strong>
            <small>Atendimento iniciado</small>
          </button>
          <button
            type="button"
            className="agenda-surface agenda-kpi agenda-kpi-success"
            onClick={() => {
              setStatus("CONCLUIDA");
              setPagina(1);
            }}
          >
            <span>✅ Concluídas hoje</span>
            <strong>{dados.resumo.concluidasHoje}</strong>
            <small>Resultados registrados</small>
          </button>
        </section>

        <section className="agenda-surface agenda-filters">
          <div className="agenda-filter-top">
            <label className="agenda-search">
              <span>Buscar na agenda</span>
              <input
                value={buscaDigitada}
                onChange={(evento) => setBuscaDigitada(evento.target.value)}
                placeholder="Tarefa, lead, e-mail ou responsável..."
              />
            </label>

            <div className="agenda-filter-field">
              <span>Status</span>
              <SelectAgenda
                value={status}
                ariaLabel="Filtrar por status"
                options={STATUS.map((item) => ({
                  value: item.valor,
                  label: item.nome,
                }))}
                onChange={(novoStatus) => {
                  setStatus(novoStatus);
                  setPagina(1);
                }}
              />
            </div>

            <div className="agenda-filter-field">
              <span>Prioridade</span>
              <SelectAgenda
                value={prioridade}
                ariaLabel="Filtrar por prioridade"
                options={[
                  { value: "TODAS", label: "Todas" },
                  ...PRIORIDADES.map((item) => ({
                    value: item.valor,
                    label: item.nome,
                  })),
                ]}
                onChange={(novaPrioridade) => {
                  setPrioridade(novaPrioridade);
                  setPagina(1);
                }}
              />
            </div>

            <div className="agenda-filter-field">
              <span>Tipo</span>
              <SelectAgenda
                value={tipo}
                ariaLabel="Filtrar por tipo de ação"
                options={[
                  { value: "TODOS", label: "Todos" },
                  ...TIPOS.map((item) => ({
                    value: item.valor,
                    label: item.nome,
                  })),
                ]}
                onChange={(novoTipo) => {
                  setTipo(novoTipo);
                  setPagina(1);
                }}
              />
            </div>

            {dados.permissoes.podeVerTodas ? (
              <div className="agenda-filter-field">
                <span>Responsável</span>
                <SelectAgenda
                  value={responsavelId}
                  ariaLabel="Filtrar por responsável"
                  options={[
                    { value: "", label: "Toda a equipe" },
                    ...dados.referencias.responsaveis.map((item) => ({
                      value: String(item.id),
                      label: item.nome,
                    })),
                  ]}
                  onChange={(novoResponsavelId) => {
                    setResponsavelId(novoResponsavelId);
                    setPagina(1);
                  }}
                  disabled={somenteMinhas}
                />
              </div>
            ) : null}
          </div>

          <div className="agenda-filter-bottom">
            <div className="agenda-periods" aria-label="Período da agenda">
              {PERIODOS.map((item) => (
                <button
                  type="button"
                  key={item.valor}
                  className={periodo === item.valor ? "active" : ""}
                  onClick={() => selecionarPeriodo(item.valor)}
                >
                  {item.nome}
                </button>
              ))}
            </div>

            {dados.permissoes.podeVerTodas &&
            dados.permissoes.funcionarioId ? (
              <label className="agenda-check">
                <input
                  type="checkbox"
                  checked={somenteMinhas}
                  onChange={(evento) => {
                    setSomenteMinhas(evento.target.checked);
                    setResponsavelId("");
                    setPagina(1);
                  }}
                />
                <span>Somente minhas tarefas</span>
              </label>
            ) : null}
          </div>
        </section>

        <section className="agenda-list-section">
          <div className="agenda-list-heading">
            <div>
              <span className="agenda-eyebrow">Programação comercial</span>
              <h2>Tarefas e próximas ações</h2>
            </div>
            <strong>{dados.paginacao.totalItens} registro(s)</strong>
          </div>

          {grupos.length ? (
            <div className="agenda-groups">
              {grupos.map((grupo) => (
                <section
                  key={grupo.titulo}
                  className={`agenda-group ${
                    grupo.titulo === "Atrasadas" ? "agenda-group-overdue" : ""
                  }`}
                >
                  <header>
                    <h3>{grupo.titulo}</h3>
                    <span>{grupo.tarefas.length}</span>
                  </header>

                  <div className="agenda-task-grid">
                    {grupo.tarefas.map((tarefa) => (
                      <CartaoTarefa
                        key={tarefa.id}
                        tarefa={tarefa}
                        permissoes={dados.permissoes}
                        processando={processandoAcao === tarefa.id}
                        onEditar={() => abrirEdicao(tarefa)}
                        onIniciar={() =>
                          atualizarStatus(tarefa, "EM_ANDAMENTO")
                        }
                        onConcluir={() => {
                          setTextoAcao("");
                          setAcaoEspecial({ tipo: "CONCLUIR", tarefa });
                        }}
                        onCancelar={() => {
                          setTextoAcao("");
                          setAcaoEspecial({ tipo: "CANCELAR", tarefa });
                        }}
                        onReabrir={() => atualizarStatus(tarefa, "PENDENTE")}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="agenda-surface agenda-empty-list">
              <div>📭</div>
              <h3>Nenhuma tarefa encontrada</h3>
              <p>
                Ajuste os filtros ou crie uma nova ação para organizar o
                próximo atendimento comercial.
              </p>
              {dados.permissoes.podeCriar ? (
                <button
                  type="button"
                  className="agenda-button agenda-button-primary"
                  onClick={abrirNovaTarefa}
                >
                  Criar primeira tarefa
                </button>
              ) : null}
            </div>
          )}

          <footer className="agenda-pagination">
            <span>
              Página {dados.paginacao.pagina} de {dados.paginacao.totalPaginas}
            </span>
            <div>
              <button
                type="button"
                className="agenda-button agenda-button-secondary"
                disabled={!dados.paginacao.temAnterior || atualizando}
                onClick={() => setPagina((valor) => Math.max(1, valor - 1))}
              >
                Anterior
              </button>
              <button
                type="button"
                className="agenda-button agenda-button-secondary"
                disabled={!dados.paginacao.temProxima || atualizando}
                onClick={() => setPagina((valor) => valor + 1)}
              >
                Próxima
              </button>
            </div>
          </footer>
        </section>
      </div>

      {modalTarefaAberto ? (
        <div
          className="agenda-modal-backdrop"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !salvando) {
              setModalTarefaAberto(false);
            }
          }}
        >
          <section
            className="agenda-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agenda-modal-title"
          >
            <header>
              <div>
                <span className="agenda-eyebrow">Agenda comercial</span>
                <h2 id="agenda-modal-title">
                  {tarefaEditando ? "Editar tarefa" : "Nova tarefa"}
                </h2>
                <p>
                  Registre a ação, o responsável e o horário do próximo contato.
                </p>
              </div>
              <button
                type="button"
                className="agenda-modal-close"
                disabled={salvando}
                onClick={() => setModalTarefaAberto(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <form onSubmit={salvarTarefa}>
              <div className="agenda-form-grid">
                <div className="agenda-field agenda-field-wide">
                  <span>Lead relacionado *</span>
                  <SelectAgenda
                    value={formulario.leadId}
                    ariaLabel="Selecionar lead relacionado"
                    options={[
                      { value: "", label: "Selecione o lead" },
                      ...dados.referencias.leads.map((lead) => ({
                        value: String(lead.id),
                        label: `#${lead.id} · ${lead.nome} · ${lead.email}`,
                      })),
                    ]}
                    onChange={alterarLead}
                  />
                </div>

                <div className="agenda-field agenda-field-wide">
                  <span>Responsável *</span>
                  <SelectAgenda
                    value={formulario.responsavelFuncionarioId}
                    disabled={!dados.permissoes.podeAtribuir}
                    ariaLabel="Selecionar responsável"
                    options={[
                      { value: "", label: "Selecione o responsável" },
                      ...dados.referencias.responsaveis.map((responsavel) => ({
                        value: String(responsavel.id),
                        label: `${responsavel.nome}${
                          responsavel.cargo ? ` · ${responsavel.cargo}` : ""
                        }`,
                      })),
                    ]}
                    onChange={(novoResponsavelId) =>
                      setFormulario((atual) => ({
                        ...atual,
                        responsavelFuncionarioId: novoResponsavelId,
                      }))
                    }
                  />
                  {!dados.permissoes.podeAtribuir ? (
                    <small>A tarefa será atribuída ao seu usuário.</small>
                  ) : null}
                </div>

                <div className="agenda-field">
                  <span>Tipo de ação *</span>
                  <SelectAgenda
                    value={formulario.tipo}
                    ariaLabel="Selecionar tipo de ação"
                    options={TIPOS.map((item) => ({
                      value: item.valor,
                      label: `${item.icone} ${item.nome}`,
                    }))}
                    onChange={(novoTipo) =>
                      alterarTipo(novoTipo as TipoTarefa)
                    }
                  />
                </div>

                <div className="agenda-field">
                  <span>Prioridade *</span>
                  <SelectAgenda
                    value={formulario.prioridade}
                    ariaLabel="Selecionar prioridade"
                    options={PRIORIDADES.map((item) => ({
                      value: item.valor,
                      label: item.nome,
                    }))}
                    onChange={(novaPrioridade) =>
                      setFormulario((atual) => ({
                        ...atual,
                        prioridade: novaPrioridade as PrioridadeTarefa,
                      }))
                    }
                  />
                </div>

                <label className="agenda-field agenda-field-wide">
                  <span>Título *</span>
                  <input
                    required
                    maxLength={180}
                    value={formulario.titulo}
                    onChange={(evento) =>
                      setFormulario((atual) => ({
                        ...atual,
                        titulo: evento.target.value,
                      }))
                    }
                    placeholder="Ex.: Retornar contato sobre a proposta"
                  />
                </label>

                <label className="agenda-field agenda-field-wide">
                  <span>Orientações para o atendimento</span>
                  <textarea
                    rows={3}
                    value={formulario.descricao}
                    onChange={(evento) =>
                      setFormulario((atual) => ({
                        ...atual,
                        descricao: evento.target.value,
                      }))
                    }
                    placeholder="Contexto, documentos necessários, assunto da conversa..."
                  />
                </label>

                <label className="agenda-field">
                  <span>Agendada para *</span>
                  <input
                    required
                    type="datetime-local"
                    value={formulario.agendadaPara}
                    onChange={(evento) =>
                      setFormulario((atual) => ({
                        ...atual,
                        agendadaPara: evento.target.value,
                      }))
                    }
                  />
                </label>

                <label className="agenda-field">
                  <span>Prazo final</span>
                  <input
                    type="datetime-local"
                    value={formulario.prazoEm}
                    onChange={(evento) =>
                      setFormulario((atual) => ({
                        ...atual,
                        prazoEm: evento.target.value,
                      }))
                    }
                  />
                </label>

                <label className="agenda-field agenda-field-wide">
                  <span>Lembrete</span>
                  <input
                    type="datetime-local"
                    value={formulario.lembreteEm}
                    onChange={(evento) =>
                      setFormulario((atual) => ({
                        ...atual,
                        lembreteEm: evento.target.value,
                      }))
                    }
                  />
                </label>

                <label className="agenda-check agenda-form-check">
                  <input
                    type="checkbox"
                    checked={formulario.proximaAcao}
                    onChange={(evento) =>
                      setFormulario((atual) => ({
                        ...atual,
                        proximaAcao: evento.target.checked,
                      }))
                    }
                  />
                  <span>
                    Definir como próxima ação do lead
                    <small>
                      A data aparecerá no Pipeline e na Ficha 360°.
                    </small>
                  </span>
                </label>
              </div>

              {erroFormulario ? (
                <div className="agenda-form-error">{erroFormulario}</div>
              ) : null}

              <footer>
                <button
                  type="button"
                  className="agenda-button agenda-button-secondary"
                  disabled={salvando}
                  onClick={() => setModalTarefaAberto(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="agenda-button agenda-button-primary"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : tarefaEditando
                      ? "Salvar alterações"
                      : "Criar tarefa"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {acaoEspecial ? (
        <div className="agenda-modal-backdrop" role="presentation">
          <section
            className="agenda-modal agenda-modal-small"
            role="dialog"
            aria-modal="true"
          >
            <header>
              <div>
                <span className="agenda-eyebrow">
                  {acaoEspecial.tipo === "CONCLUIR"
                    ? "Resultado da ação"
                    : "Cancelamento auditável"}
                </span>
                <h2>
                  {acaoEspecial.tipo === "CONCLUIR"
                    ? "Concluir tarefa"
                    : "Cancelar tarefa"}
                </h2>
                <p>{acaoEspecial.tarefa.titulo}</p>
              </div>
              <button
                type="button"
                className="agenda-modal-close"
                disabled={processandoAcao !== null}
                onClick={() => setAcaoEspecial(null)}
              >
                ×
              </button>
            </header>

            <form onSubmit={confirmarAcaoEspecial}>
              <label className="agenda-field">
                <span>
                  {acaoEspecial.tipo === "CONCLUIR"
                    ? "Resultado alcançado *"
                    : "Motivo do cancelamento *"}
                </span>
                <textarea
                  required
                  autoFocus
                  rows={5}
                  value={textoAcao}
                  onChange={(evento) => setTextoAcao(evento.target.value)}
                  placeholder={
                    acaoEspecial.tipo === "CONCLUIR"
                      ? "Ex.: interessado confirmou o recebimento da proposta e solicitou prazo..."
                      : "Explique por que esta tarefa não será mais realizada..."
                  }
                />
              </label>
              <footer>
                <button
                  type="button"
                  className="agenda-button agenda-button-secondary"
                  disabled={processandoAcao !== null}
                  onClick={() => setAcaoEspecial(null)}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className={`agenda-button ${
                    acaoEspecial.tipo === "CANCELAR"
                      ? "agenda-button-danger"
                      : "agenda-button-primary"
                  }`}
                  disabled={!textoAcao.trim() || processandoAcao !== null}
                >
                  {processandoAcao !== null
                    ? "Registrando..."
                    : acaoEspecial.tipo === "CONCLUIR"
                      ? "Confirmar conclusão"
                      : "Confirmar cancelamento"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {toast ? (
        <div className={`agenda-toast agenda-toast-${toast.tipo}`} role="status">
          <span>{toast.tipo === "sucesso" ? "✓" : "!"}</span>
          {toast.mensagem}
        </div>
      ) : null}

      <EstilosAgenda />
    </main>
  );
}

function CartaoTarefa({
  tarefa,
  permissoes,
  processando,
  onEditar,
  onIniciar,
  onConcluir,
  onCancelar,
  onReabrir,
}: {
  tarefa: Tarefa;
  permissoes: PermissoesAgenda;
  processando: boolean;
  onEditar: () => void;
  onIniciar: () => void;
  onConcluir: () => void;
  onCancelar: () => void;
  onReabrir: () => void;
}) {
  const visual = tipoVisual(tarefa.tipo);
  const aberta = tarefa.status === "PENDENTE" || tarefa.status === "EM_ANDAMENTO";

  return (
    <article
      className={`agenda-surface agenda-task agenda-task-${tarefa.status.toLowerCase()} ${
        tarefa.atrasada ? "agenda-task-overdue" : ""
      }`}
    >
      <div className="agenda-task-time">
        <span>{visual.icone}</span>
        <strong>{formatarHora(tarefa.agendadaPara)}</strong>
        {tarefa.prazoEm ? <small>Prazo {formatarDataHora(tarefa.prazoEm)}</small> : null}
      </div>

      <div className="agenda-task-content">
        <div className="agenda-task-badges">
          <span className={`agenda-badge agenda-priority-${tarefa.prioridade.toLowerCase()}`}>
            {rotulo(tarefa.prioridade)}
          </span>
          <span className={`agenda-badge agenda-status-${tarefa.status.toLowerCase()}`}>
            {rotulo(tarefa.status)}
          </span>
          {tarefa.proximaAcao ? (
            <span className="agenda-badge agenda-next-badge">Próxima ação</span>
          ) : null}
          {tarefa.atrasada ? (
            <span className="agenda-badge agenda-overdue-badge">Atrasada</span>
          ) : null}
        </div>

        <h4>{tarefa.titulo}</h4>
        <p className="agenda-task-lead">
          Lead #{tarefa.leadId} · {tarefa.lead?.nome ?? "Lead indisponível"}
        </p>
        {tarefa.descricao ? <p>{tarefa.descricao}</p> : null}

        <dl>
          <div>
            <dt>Responsável</dt>
            <dd>{tarefa.responsavel?.nome ?? "Não atribuído"}</dd>
          </div>
          <div>
            <dt>Tipo</dt>
            <dd>{visual.nome}</dd>
          </div>
          {tarefa.lembreteEm ? (
            <div>
              <dt>Lembrete</dt>
              <dd>{formatarDataHora(tarefa.lembreteEm)}</dd>
            </div>
          ) : null}
        </dl>

        {tarefa.resultado ? (
          <div className="agenda-result">
            <strong>Resultado</strong>
            <span>{tarefa.resultado}</span>
          </div>
        ) : null}
        {tarefa.motivoCancelamento ? (
          <div className="agenda-cancel-reason">
            <strong>Motivo do cancelamento</strong>
            <span>{tarefa.motivoCancelamento}</span>
          </div>
        ) : null}
      </div>

      <div className="agenda-task-actions">
        <Link
          href={`/admin/comercial/leads/${tarefa.leadId}`}
          className="agenda-mini-button"
        >
          Ficha 360°
        </Link>
        {aberta && permissoes.podeEditar ? (
          <button type="button" disabled={processando} onClick={onEditar}>
            Editar
          </button>
        ) : null}
        {tarefa.status === "PENDENTE" && permissoes.podeEditar ? (
          <button type="button" disabled={processando} onClick={onIniciar}>
            Iniciar
          </button>
        ) : null}
        {aberta && permissoes.podeConcluir ? (
          <button
            type="button"
            className="agenda-action-success"
            disabled={processando}
            onClick={onConcluir}
          >
            Concluir
          </button>
        ) : null}
        {aberta && permissoes.podeCancelar ? (
          <button
            type="button"
            className="agenda-action-danger"
            disabled={processando}
            onClick={onCancelar}
          >
            Cancelar
          </button>
        ) : null}
        {!aberta && permissoes.podeEditar ? (
          <button type="button" disabled={processando} onClick={onReabrir}>
            Reabrir
          </button>
        ) : null}
      </div>
    </article>
  );
}

function EstilosAgenda() {
  return (
    <style jsx global>{`
      .agenda-page {
        --ac-bg: transparent;
        --ac-surface: #ffffff;
        --ac-surface-soft: #f8fafc;
        --ac-surface-muted: #f1f5f9;
        --ac-text: #0f172a;
        --ac-muted: #52627a;
        --ac-border: #d7e0eb;
        --ac-border-strong: #c2cfdf;
        --ac-primary: #009f6b;
        --ac-primary-hover: #00885c;
        --ac-primary-text: #ffffff;
        --ac-focus: #2563eb;
        --ac-shadow: 0 2px 3px rgba(15, 23, 42, 0.08),
          0 18px 45px rgba(15, 23, 42, 0.05);
        min-height: 100%;
        padding: 28px 20px 90px;
        color: var(--ac-text);
        background: var(--ac-bg);
      }

      html[data-theme="dark"] .agenda-page {
        --ac-surface: #111827;
        --ac-surface-soft: #172033;
        --ac-surface-muted: #1e293b;
        --ac-text: #f8fafc;
        --ac-muted: #aebbd0;
        --ac-border: #334155;
        --ac-border-strong: #475569;
        --ac-primary: #15b981;
        --ac-primary-hover: #10a875;
        --ac-shadow: 0 2px 3px rgba(0, 0, 0, 0.25),
          0 20px 55px rgba(0, 0, 0, 0.18);
        color-scheme: dark;
      }

      html[data-theme="system"] .agenda-page {
        --ac-surface: #292929;
        --ac-surface-soft: #303030;
        --ac-surface-muted: #383838;
        --ac-text: #f5f5f5;
        --ac-muted: #c4c4c4;
        --ac-border: #4a4a4a;
        --ac-border-strong: #606060;
        --ac-primary: #15b981;
        --ac-primary-hover: #10a875;
        --ac-shadow: 0 2px 3px rgba(0, 0, 0, 0.25),
          0 20px 55px rgba(0, 0, 0, 0.18);
        color-scheme: dark;
      }

      html[data-theme="system"] .agenda-page .agenda-surface,
      html[data-theme="system"] .agenda-page .agenda-modal {
        background-color: #292929 !important;
        border-color: #4a4a4a !important;
      }

      html[data-theme="system"] .agenda-inline-error,
      html[data-theme="system"] .agenda-form-error {
        color: #fecaca;
        background: #451a1a;
        border-color: #7f1d1d;
      }

      html[data-theme="system"] .agenda-periods button.active {
        color: #0f172a;
        background: #f8fafc;
        border-color: #f8fafc;
      }

      html[data-theme="system"] .agenda-group-overdue > header h3 {
        color: #fca5a5;
      }

      .agenda-page *,
      .agenda-page *::before,
      .agenda-page *::after {
        box-sizing: border-box;
      }

      .agenda-container {
        width: min(1440px, 100%);
        margin: 0 auto;
      }

      .agenda-surface {
        background: var(--ac-surface);
        border: 1px solid var(--ac-border);
        box-shadow: var(--ac-shadow);
      }

      .agenda-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 28px;
        padding: 28px;
        border-radius: 24px;
      }

      .agenda-breadcrumb,
      .agenda-eyebrow {
        color: var(--ac-muted);
        font-size: 12px;
        font-weight: 850;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .agenda-breadcrumb span {
        margin: 0 7px;
        color: var(--ac-primary);
      }

      .agenda-header h1 {
        margin: 14px 0 0;
        color: var(--ac-text);
        font-size: clamp(27px, 3vw, 40px);
        line-height: 1.05;
        font-weight: 950;
      }

      .agenda-header p,
      .agenda-modal header p,
      .agenda-empty-page p,
      .agenda-empty-list p {
        margin: 10px 0 0;
        color: var(--ac-muted);
        font-size: 14px;
        line-height: 1.55;
      }

      .agenda-header-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
      }

      .agenda-button,
      .agenda-mini-button,
      .agenda-task-actions button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        border-radius: 13px;
        border: 1px solid transparent;
        padding: 10px 16px;
        font: inherit;
        font-size: 13px;
        font-weight: 850;
        text-decoration: none;
        cursor: pointer;
        transition: transform 0.16s ease, background 0.16s ease,
          border-color 0.16s ease, opacity 0.16s ease;
      }

      .agenda-button:hover:not(:disabled),
      .agenda-mini-button:hover,
      .agenda-task-actions button:hover:not(:disabled) {
        transform: translateY(-1px);
      }

      .agenda-button:disabled,
      .agenda-task-actions button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .agenda-button-primary {
        color: var(--ac-primary-text);
        background: var(--ac-primary);
        border-color: var(--ac-primary);
      }

      .agenda-button-primary:hover:not(:disabled) {
        background: var(--ac-primary-hover);
        border-color: var(--ac-primary-hover);
      }

      .agenda-button-secondary,
      .agenda-mini-button,
      .agenda-task-actions button {
        color: var(--ac-text);
        background: var(--ac-surface);
        border-color: var(--ac-border-strong);
      }

      .agenda-button-danger {
        color: #ffffff;
        background: #b91c1c;
        border-color: #b91c1c;
      }

      .agenda-inline-error,
      .agenda-form-error {
        margin-top: 14px;
        padding: 13px 15px;
        border: 1px solid #fca5a5;
        border-radius: 13px;
        color: #991b1b;
        background: #fef2f2;
        font-size: 13px;
        font-weight: 750;
      }

      html[data-theme="dark"] .agenda-inline-error,
      html[data-theme="dark"] .agenda-form-error {
        color: #fecaca;
        background: #451a1a;
        border-color: #7f1d1d;
      }

      .agenda-kpi-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 14px;
        margin-top: 18px;
      }

      .agenda-kpi {
        min-width: 0;
        padding: 20px;
        border-radius: 19px;
        text-align: left;
        font: inherit;
        color: var(--ac-text);
        cursor: pointer;
      }

      .agenda-kpi span,
      .agenda-kpi small {
        display: block;
      }

      .agenda-kpi span {
        color: var(--ac-muted);
        font-size: 12px;
        font-weight: 850;
        text-transform: uppercase;
        letter-spacing: 0.035em;
      }

      .agenda-kpi strong {
        display: block;
        margin-top: 9px;
        color: var(--ac-text);
        font-size: 27px;
        line-height: 1;
      }

      .agenda-kpi small {
        margin-top: 8px;
        color: var(--ac-muted);
      }

      .agenda-kpi-danger {
        border-top: 4px solid #dc2626;
      }

      .agenda-kpi-progress {
        border-top: 4px solid #2563eb;
      }

      .agenda-kpi-success {
        border-top: 4px solid #059669;
      }

      .agenda-filters {
        margin-top: 18px;
        padding: 20px;
        border-radius: 21px;
      }

      .agenda-filter-top {
        display: grid;
        grid-template-columns: minmax(240px, 2fr) repeat(4, minmax(145px, 1fr));
        gap: 12px;
      }

      .agenda-filter-top label,
      .agenda-filter-field,
      .agenda-field {
        display: flex;
        min-width: 0;
        flex-direction: column;
        gap: 7px;
      }

      .agenda-filter-top label > span,
      .agenda-filter-field > span,
      .agenda-field > span {
        color: var(--ac-muted);
        font-size: 11px;
        font-weight: 850;
        text-transform: uppercase;
        letter-spacing: 0.035em;
      }

      .agenda-page input,
      .agenda-page select,
      .agenda-page textarea {
        width: 100%;
        min-height: 45px;
        border: 1px solid var(--ac-border-strong);
        border-radius: 12px;
        padding: 10px 13px;
        color: var(--ac-text);
        background: var(--ac-surface-soft);
        font: inherit;
        font-size: 13px;
        outline: none;
      }

      .agenda-page textarea {
        min-height: 92px;
        resize: vertical;
      }

      .agenda-page input:focus,
      .agenda-page select:focus,
      .agenda-page textarea:focus {
        border-color: var(--ac-focus);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }

      .agenda-page input::placeholder,
      .agenda-page textarea::placeholder {
        color: var(--ac-muted);
        opacity: 0.78;
      }

      .agenda-custom-select {
        position: relative;
        width: 100%;
        min-width: 0;
      }

      .agenda-select-trigger {
        display: flex;
        width: 100%;
        min-height: 45px;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border: 1px solid var(--ac-border-strong);
        border-radius: 12px;
        padding: 10px 13px;
        color: var(--ac-text);
        background: var(--ac-surface-soft);
        font: inherit;
        font-size: 13px;
        text-align: left;
        cursor: pointer;
      }

      .agenda-select-trigger > span:first-child {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .agenda-select-trigger:focus-visible,
      .agenda-custom-select.is-open .agenda-select-trigger {
        border-color: var(--ac-focus);
        outline: none;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }

      .agenda-select-trigger:disabled {
        cursor: not-allowed;
        opacity: 0.58;
      }

      .agenda-select-arrow {
        flex: 0 0 auto;
        color: var(--ac-muted);
        font-size: 14px;
        line-height: 1;
        transition: transform 0.16s ease;
      }

      .agenda-custom-select.is-open .agenda-select-arrow {
        transform: rotate(180deg);
      }

      .agenda-select-list {
        position: absolute;
        z-index: 10200;
        top: calc(100% + 6px);
        right: 0;
        left: 0;
        max-height: 260px;
        overflow-y: auto;
        padding: 6px;
        border: 1px solid var(--ac-border-strong);
        border-radius: 12px;
        color: var(--ac-text);
        background: var(--ac-surface-soft);
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.24);
      }

      .agenda-select-option {
        display: block;
        width: 100%;
        min-height: 38px;
        border: 0;
        border-radius: 8px;
        padding: 9px 10px;
        color: var(--ac-text);
        background: transparent;
        font: inherit;
        font-size: 13px;
        line-height: 1.35;
        text-align: left;
        cursor: pointer;
      }

      .agenda-select-option:hover,
      .agenda-select-option[data-active="true"],
      .agenda-select-option[data-selected="true"] {
        color: var(--ac-text);
        background: var(--ac-surface-muted);
      }

      .agenda-select-option[data-selected="true"] {
        font-weight: 800;
      }

      .agenda-select-option:disabled {
        cursor: not-allowed;
        opacity: 0.48;
      }

      .agenda-filter-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid var(--ac-border);
      }

      .agenda-periods {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
      }

      .agenda-periods button {
        min-height: 36px;
        border: 1px solid var(--ac-border-strong);
        border-radius: 999px;
        padding: 7px 12px;
        color: var(--ac-text);
        background: var(--ac-surface);
        font: inherit;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
      }

      .agenda-periods button.active {
        color: #ffffff;
        background: #0f172a;
        border-color: #0f172a;
      }

      html[data-theme="dark"] .agenda-periods button.active {
        color: #0f172a;
        background: #f8fafc;
        border-color: #f8fafc;
      }

      .agenda-check {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        color: var(--ac-text);
        font-size: 13px;
        font-weight: 750;
        cursor: pointer;
      }

      .agenda-check input {
        flex: 0 0 auto;
        width: 18px;
        min-height: 18px;
        accent-color: var(--ac-primary);
      }

      .agenda-list-section {
        margin-top: 24px;
      }

      .agenda-list-heading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 16px;
      }

      .agenda-list-heading h2 {
        margin: 5px 0 0;
        color: var(--ac-text);
        font-size: 24px;
      }

      .agenda-list-heading > strong {
        color: var(--ac-muted);
        font-size: 13px;
      }

      .agenda-groups {
        display: grid;
        gap: 20px;
      }

      .agenda-group > header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }

      .agenda-group > header h3 {
        margin: 0;
        color: var(--ac-text);
        font-size: 18px;
        text-transform: capitalize;
      }

      .agenda-group > header span {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 28px;
        border-radius: 999px;
        color: var(--ac-text);
        background: var(--ac-surface-muted);
        font-size: 12px;
        font-weight: 900;
      }

      .agenda-group-overdue > header h3 {
        color: #b91c1c;
      }

      html[data-theme="dark"] .agenda-group-overdue > header h3 {
        color: #fca5a5;
      }

      .agenda-task-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .agenda-task {
        display: grid;
        grid-template-columns: 100px minmax(0, 1fr) auto;
        gap: 17px;
        padding: 18px;
        border-radius: 18px;
      }

      .agenda-task-overdue {
        border-left: 5px solid #dc2626;
      }

      .agenda-task-concluida {
        border-left: 5px solid #059669;
      }

      .agenda-task-cancelada {
        opacity: 0.78;
        border-left: 5px solid #64748b;
      }

      .agenda-task-time {
        display: flex;
        align-items: flex-start;
        flex-direction: column;
        gap: 6px;
      }

      .agenda-task-time > span {
        font-size: 22px;
      }

      .agenda-task-time strong {
        color: var(--ac-text);
        font-size: 20px;
      }

      .agenda-task-time small {
        color: var(--ac-muted);
        font-size: 10px;
        line-height: 1.4;
      }

      .agenda-task-content {
        min-width: 0;
      }

      .agenda-task-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .agenda-badge {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        border: 1px solid var(--ac-border-strong);
        border-radius: 999px;
        padding: 4px 8px;
        color: var(--ac-text);
        background: var(--ac-surface-soft);
        font-size: 9px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .agenda-priority-urgente,
      .agenda-overdue-badge {
        color: #991b1b;
        background: #fee2e2;
        border-color: #fca5a5;
      }

      .agenda-priority-alta {
        color: #9a3412;
        background: #ffedd5;
        border-color: #fdba74;
      }

      .agenda-status-concluida,
      .agenda-next-badge {
        color: #065f46;
        background: #d1fae5;
        border-color: #6ee7b7;
      }

      .agenda-status-em_andamento {
        color: #1e40af;
        background: #dbeafe;
        border-color: #93c5fd;
      }

      .agenda-task-content h4 {
        margin: 10px 0 0;
        color: var(--ac-text);
        font-size: 17px;
        line-height: 1.25;
      }

      .agenda-task-content > p {
        margin: 7px 0 0;
        color: var(--ac-muted);
        font-size: 12px;
        line-height: 1.5;
      }

      .agenda-task-lead {
        color: var(--ac-text) !important;
        font-weight: 750;
      }

      .agenda-task-content dl {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 18px;
        margin: 13px 0 0;
      }

      .agenda-task-content dl div {
        min-width: 100px;
      }

      .agenda-task-content dt {
        color: var(--ac-muted);
        font-size: 9px;
        font-weight: 850;
        text-transform: uppercase;
      }

      .agenda-task-content dd {
        margin: 3px 0 0;
        color: var(--ac-text);
        font-size: 11px;
        font-weight: 800;
      }

      .agenda-result,
      .agenda-cancel-reason {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 13px;
        padding: 10px 12px;
        border-radius: 11px;
        color: #065f46;
        background: #ecfdf5;
        font-size: 11px;
        line-height: 1.45;
      }

      .agenda-cancel-reason {
        color: #7f1d1d;
        background: #fef2f2;
      }

      .agenda-task-actions {
        display: flex;
        width: 110px;
        align-items: stretch;
        flex-direction: column;
        gap: 7px;
      }

      .agenda-task-actions button,
      .agenda-mini-button {
        min-height: 34px;
        padding: 7px 10px;
        font-size: 10px;
      }

      .agenda-task-actions .agenda-action-success {
        color: #ffffff;
        background: #059669;
        border-color: #059669;
      }

      .agenda-task-actions .agenda-action-danger {
        color: #b91c1c;
        border-color: #fca5a5;
      }

      .agenda-empty-list,
      .agenda-empty-page,
      .agenda-loading {
        display: flex;
        min-height: 330px;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        padding: 32px;
        border-radius: 22px;
        text-align: center;
      }

      .agenda-empty-list > div,
      .agenda-empty-icon {
        font-size: 35px;
      }

      .agenda-empty-list h3,
      .agenda-empty-page h1 {
        margin: 13px 0 0;
        color: var(--ac-text);
      }

      .agenda-empty-list .agenda-button,
      .agenda-empty-page .agenda-button {
        margin-top: 18px;
      }

      .agenda-pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-top: 20px;
        color: var(--ac-muted);
        font-size: 12px;
        font-weight: 750;
      }

      .agenda-pagination > div {
        display: flex;
        gap: 8px;
      }

      .agenda-modal-backdrop {
        position: fixed;
        z-index: 10050;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(15, 23, 42, 0.7);
        backdrop-filter: blur(4px);
      }

      .agenda-modal {
        width: min(760px, 100%);
        max-height: calc(100vh - 40px);
        overflow-y: auto;
        border: 1px solid var(--ac-border-strong);
        border-radius: 23px;
        color: var(--ac-text);
        background: var(--ac-surface);
        box-shadow: 0 30px 90px rgba(0, 0, 0, 0.3);
      }

      .agenda-modal-small {
        width: min(560px, 100%);
      }

      .agenda-modal > header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        padding: 24px 26px;
        border-bottom: 1px solid var(--ac-border);
      }

      .agenda-modal h2 {
        margin: 6px 0 0;
        color: var(--ac-text);
        font-size: 24px;
      }

      .agenda-modal-close {
        display: inline-flex;
        flex: 0 0 auto;
        width: 42px;
        height: 42px;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--ac-border-strong);
        border-radius: 12px;
        color: var(--ac-text);
        background: var(--ac-surface-soft);
        font: inherit;
        font-size: 25px;
        cursor: pointer;
      }

      .agenda-modal form {
        padding: 24px 26px 26px;
      }

      .agenda-form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .agenda-field-wide,
      .agenda-form-check {
        grid-column: 1 / -1;
      }

      .agenda-field small,
      .agenda-form-check small {
        display: block;
        margin-top: 3px;
        color: var(--ac-muted);
        font-size: 10px;
        font-weight: 500;
        text-transform: none;
      }

      .agenda-form-check {
        align-items: flex-start;
        padding: 14px;
        border: 1px solid var(--ac-border);
        border-radius: 13px;
        background: var(--ac-surface-soft);
      }

      .agenda-modal form > footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 22px;
        padding-top: 18px;
        border-top: 1px solid var(--ac-border);
      }

      .agenda-toast {
        position: fixed;
        z-index: 10100;
        right: 22px;
        bottom: 24px;
        display: flex;
        width: min(390px, calc(100vw - 44px));
        align-items: center;
        gap: 11px;
        padding: 14px 16px;
        border-radius: 14px;
        color: #ffffff;
        background: #047857;
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.25);
        font-size: 13px;
        font-weight: 800;
      }

      .agenda-toast-erro {
        background: #b91c1c;
      }

      .agenda-toast > span {
        display: inline-flex;
        width: 25px;
        height: 25px;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.55);
        border-radius: 999px;
      }

      .agenda-spinner {
        width: 44px;
        height: 44px;
        margin-bottom: 16px;
        border: 4px solid var(--ac-border);
        border-top-color: var(--ac-primary);
        border-radius: 50%;
        animation: agenda-spin 0.8s linear infinite;
      }

      .agenda-loading strong {
        color: var(--ac-text);
      }

      .agenda-loading span {
        margin-top: 7px;
        color: var(--ac-muted);
        font-size: 13px;
      }

      @keyframes agenda-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 1250px) {
        .agenda-kpi-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .agenda-filter-top {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .agenda-search {
          grid-column: span 2;
        }

        .agenda-task-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .agenda-page {
          padding: 16px 12px 92px;
        }

        .agenda-header {
          flex-direction: column;
          padding: 21px;
        }

        .agenda-header-actions {
          width: 100%;
          justify-content: flex-start;
        }

        .agenda-kpi-grid,
        .agenda-filter-top,
        .agenda-form-grid {
          grid-template-columns: 1fr;
        }

        .agenda-search,
        .agenda-field-wide,
        .agenda-form-check {
          grid-column: auto;
        }

        .agenda-filter-bottom,
        .agenda-list-heading,
        .agenda-pagination {
          align-items: flex-start;
          flex-direction: column;
        }

        .agenda-task {
          grid-template-columns: 75px minmax(0, 1fr);
        }

        .agenda-task-actions {
          grid-column: 1 / -1;
          width: 100%;
          flex-direction: row;
          flex-wrap: wrap;
        }

        .agenda-task-actions button,
        .agenda-mini-button {
          flex: 1 1 auto;
        }

        .agenda-modal-backdrop {
          align-items: flex-end;
          padding: 8px;
        }

        .agenda-modal {
          max-height: calc(100vh - 16px);
          border-radius: 20px 20px 12px 12px;
        }

        .agenda-modal > header,
        .agenda-modal form {
          padding: 19px;
        }
      }
    `}</style>
  );
}
