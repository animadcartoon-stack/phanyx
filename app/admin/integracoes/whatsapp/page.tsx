"use client";

import { useEffect, useMemo, useState } from "react";

type TipoComunicacao =
  | "REUNIAO_CRIADA"
  | "REUNIAO_ALTERADA"
  | "REUNIAO_CANCELADA"
  | "REUNIAO_LEMBRETE"
  | "OUVIDORIA_RESPONDIDA"
  | "MENSAGEM_ALUNO_PARA_PROFESSOR"
  | "MENSAGEM_PROFESSOR_PARA_ALUNO"
  | "ATIVIDADE_PUBLICADA"
  | "PROVA_PUBLICADA"
  | "DOCUMENTO_DISPONIVEL"
  | "AVISO_ACADEMICO"
  | "MENSALIDADE_VENCENDO"
  | "MENSALIDADE_VENCIDA"
  | "PAGAMENTO_CONFIRMADO";

type Integracao = {
  configurada: boolean;
  ativo: boolean;
  conectado: boolean;

  numeroTelefone?: string | null;
  numeroExibicao?: string | null;
  nomeExibicao?: string | null;

  phoneNumberId?: string | null;
  whatsappBusinessId?: string | null;
  metaBusinessId?: string | null;

  webhookAtivo: boolean;
  credencialConfigurada: boolean;

  conectadoEm?: string | null;
  ultimaSincronizacaoEm?: string | null;
  ultimaFalhaEm?: string | null;
  ultimaFalhaMensagem?: string | null;
};

type Comunicacao = {
  tipoComunicacao: TipoComunicacao;
  ativo: boolean;
  configuracaoId?: number | null;
};

type Resumo = {
  quantidadeTemplates: number;
  quantidadeMensagens: number;
};

type EventoMensagemWhatsapp = {
  id: number;
  status: string;
  payload?: unknown;
  recebidoEm: string;
};

type MensagemWhatsappRecente = {
  id: number;

  tipoComunicacao: string;
  status: string;

  telefoneDestinatario: string;
  nomeDestinatario?: string | null;

  metaMessageId?: string | null;
  tentativa: number;

  erroCodigo?: string | null;
  erroMensagem?: string | null;

  criadaEm: string;
  processadaEm?: string | null;
  enviadaEm?: string | null;
  entregueEm?: string | null;
  lidaEm?: string | null;
  falhouEm?: string | null;

  template?: {
    nome: string;
    nomeMeta: string;
  } | null;

  eventos: EventoMensagemWhatsapp[];
};

type RespostaConfiguracao = {
  integracao: Integracao;
  comunicacoes: Comunicacao[];
  mensagensRecentes: MensagemWhatsappRecente[];
  resumo: Resumo;
};

type TemplateWhatsapp = {
  id?: number;
  nome: string;
  nomeMeta: string;
  tipoComunicacao: TipoComunicacao;
  idioma: string;
  categoriaMeta?: string | null;
  statusMeta?: string | null;
  titulo?: string | null;
  corpo: string;
  rodape?: string | null;
  aprovadoMeta: boolean;
  ativo: boolean;
};

type TipoTemplateEditavel =
  | "REUNIAO_CRIADA"
  | "REUNIAO_LEMBRETE";

type DefinicaoTemplateWhatsapp = {
  tipo: TipoTemplateEditavel;
  titulo: string;
  descricao: string;

  variaveis: Array<{
    codigo: string;
    descricao: string;
  }>;

  inicial: TemplateWhatsapp;
};

type FormConexao = {
  phoneNumberId: string;
  whatsappBusinessId: string;
  metaBusinessId: string;
  accessToken: string;
};

const COMUNICACOES: Array<{
  tipo: TipoComunicacao;
  titulo: string;
  descricao: string;
  grupo: string;
}> = [
    {
      tipo: "REUNIAO_CRIADA",
      titulo: "Reunião criada",
      descricao:
        "Avisa os participantes quando uma nova reunião for marcada.",
      grupo: "Reuniões",
    },
    {
      tipo: "REUNIAO_ALTERADA",
      titulo: "Reunião alterada",
      descricao:
        "Avisa os participantes quando data, horário ou informações forem alteradas.",
      grupo: "Reuniões",
    },
    {
      tipo: "REUNIAO_CANCELADA",
      titulo: "Reunião cancelada",
      descricao:
        "Avisa os participantes quando uma reunião for cancelada.",
      grupo: "Reuniões",
    },
    {
      tipo: "REUNIAO_LEMBRETE",
      titulo: "Lembrete de reunião",
      descricao:
        "Permite o envio de lembretes antes de reuniões programadas.",
      grupo: "Reuniões",
    },

    {
      tipo: "OUVIDORIA_RESPONDIDA",
      titulo: "Resposta da ouvidoria",
      descricao:
        "Avisa o usuário quando sua manifestação receber uma resposta.",
      grupo: "Atendimento",
    },

    {
      tipo: "MENSAGEM_ALUNO_PARA_PROFESSOR",
      titulo: "Mensagem de aluno para professor",
      descricao:
        "Avisa o professor quando um aluno enviar uma pergunta ou mensagem.",
      grupo: "Mensagens",
    },
    {
      tipo: "MENSAGEM_PROFESSOR_PARA_ALUNO",
      titulo: "Mensagem de professor para aluno",
      descricao:
        "Avisa o aluno quando o professor enviar uma resposta.",
      grupo: "Mensagens",
    },

    {
      tipo: "ATIVIDADE_PUBLICADA",
      titulo: "Atividade publicada",
      descricao:
        "Avisa os alunos quando uma nova atividade acadêmica for publicada.",
      grupo: "Acadêmico",
    },
    {
      tipo: "PROVA_PUBLICADA",
      titulo: "Prova publicada",
      descricao:
        "Avisa os alunos quando uma prova ficar disponível.",
      grupo: "Acadêmico",
    },
    {
      tipo: "DOCUMENTO_DISPONIVEL",
      titulo: "Documento disponível",
      descricao:
        "Avisa quando um novo documento estiver disponível no PHANYX.",
      grupo: "Acadêmico",
    },
    {
      tipo: "AVISO_ACADEMICO",
      titulo: "Avisos acadêmicos",
      descricao:
        "Permite comunicações acadêmicas institucionais importantes.",
      grupo: "Acadêmico",
    },

    {
      tipo: "MENSALIDADE_VENCENDO",
      titulo: "Mensalidade vencendo",
      descricao:
        "Permite avisar o responsável antes do vencimento da mensalidade.",
      grupo: "Financeiro",
    },
    {
      tipo: "MENSALIDADE_VENCIDA",
      titulo: "Mensalidade vencida",
      descricao:
        "Permite avisar quando existir uma mensalidade vencida.",
      grupo: "Financeiro",
    },
    {
      tipo: "PAGAMENTO_CONFIRMADO",
      titulo: "Pagamento confirmado",
      descricao:
        "Avisa o usuário quando um pagamento for confirmado.",
      grupo: "Financeiro",
    },
  ];

const GRUPOS = [
  "Reuniões",
  "Atendimento",
  "Mensagens",
  "Acadêmico",
  "Financeiro",
];

const integracaoInicial: Integracao = {
  configurada: false,
  ativo: false,
  conectado: false,
  webhookAtivo: false,
  credencialConfigurada: false,
};

const resumoInicial: Resumo = {
  quantidadeTemplates: 0,
  quantidadeMensagens: 0,
};

const formConexaoInicial: FormConexao = {
  phoneNumberId: "",
  whatsappBusinessId: "",
  metaBusinessId: "",
  accessToken: "",
};

const TEMPLATES_EDITAVEIS: Record<
  TipoTemplateEditavel,
  DefinicaoTemplateWhatsapp
> = {
  REUNIAO_CRIADA: {
    tipo: "REUNIAO_CRIADA",

    titulo: "Reunião criada",

    descricao:
      "Mensagem enviada aos participantes quando uma nova reunião é agendada.",

    variaveis: [
      {
        codigo: "{{1}}",
        descricao: "Nome do participante",
      },
      {
        codigo: "{{2}}",
        descricao: "Título da reunião",
      },
      {
        codigo: "{{3}}",
        descricao: "Data e horário",
      },
      {
        codigo: "{{4}}",
        descricao: "Link ou orientação de acesso",
      },
    ],

    inicial: {
      nome: "Reunião criada",
      nomeMeta: "phanyx_reuniao_criada",
      tipoComunicacao: "REUNIAO_CRIADA",
      idioma: "pt_BR",
      categoriaMeta: "UTILITY",
      statusMeta: null,
      titulo: null,

      corpo: `Olá, {{1}}! 👋

Uma nova reunião foi agendada.

📌 {{2}}
📅 {{3}}

🔗 {{4}}`,

      rodape:
        "Mensagem automática enviada pelo PHANYX.",

      aprovadoMeta: false,
      ativo: true,
    },
  },

  REUNIAO_LEMBRETE: {
    tipo: "REUNIAO_LEMBRETE",

    titulo: "Lembrete de reunião",

    descricao:
      "Mensagem enviada no dia anterior ou no dia da reunião.",

    variaveis: [
      {
        codigo: "{{1}}",
        descricao: "Nome do participante",
      },
      {
        codigo: "{{2}}",
        descricao: "Título da reunião",
      },
      {
        codigo: "{{3}}",
        descricao:
          'Horário do lembrete, como "amanhã às 19:30" ou "hoje às 19:30"',
      },
      {
        codigo: "{{4}}",
        descricao: "Link da reunião",
      },
    ],

    inicial: {
      nome: "Lembrete de reunião",
      nomeMeta: "phanyx_reuniao_lembrete",
      tipoComunicacao: "REUNIAO_LEMBRETE",
      idioma: "pt_BR",
      categoriaMeta: "UTILITY",
      statusMeta: null,
      titulo: null,

      corpo: `Olá, {{1}}! 👋

Este é um lembrete da sua reunião.

📌 {{2}}
⏰ {{3}}

🔗 {{4}}`,

      rodape:
        "Mensagem automática enviada pelo PHANYX.",

      aprovadoMeta: false,
      ativo: true,
    },
  },
};

function formatarData(valor?: string | null) {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

export default function WhatsAppInstitucionalPage() {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [conectando, setConectando] = useState(false);
  const [desconectando, setDesconectando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [integracao, setIntegracao] =
    useState<Integracao>(integracaoInicial);

  const [comunicacoes, setComunicacoes] = useState<Comunicacao[]>([]);
  const [resumo, setResumo] = useState<Resumo>(resumoInicial);

  const [mensagensRecentes, setMensagensRecentes] =
    useState<MensagemWhatsappRecente[]>([]);

  const [templatesWhatsapp, setTemplatesWhatsapp] =
    useState<
      Record<TipoTemplateEditavel, TemplateWhatsapp>
    >({
      REUNIAO_CRIADA:
        TEMPLATES_EDITAVEIS.REUNIAO_CRIADA.inicial,

      REUNIAO_LEMBRETE:
        TEMPLATES_EDITAVEIS.REUNIAO_LEMBRETE.inicial,
    });

  const [
    tipoTemplateSelecionado,
    setTipoTemplateSelecionado,
  ] = useState<TipoTemplateEditavel>(
    "REUNIAO_CRIADA"
  );

  const [salvandoTemplate, setSalvandoTemplate] =
    useState(false);

  const [
    sincronizandoTemplates,
    setSincronizandoTemplates,
  ] = useState(false);

  const [enviandoTeste, setEnviandoTeste] =
    useState(false);

  const [telefoneTeste, setTelefoneTeste] =
    useState("");

  const [
    nomeDestinatarioTeste,
    setNomeDestinatarioTeste,
  ] = useState("");

  const [
    resultadoTeste,
    setResultadoTeste,
  ] = useState<{
    mensagemId: number;
    metaMessageId: string;
  } | null>(null);

  const templateSelecionado =
    templatesWhatsapp[tipoTemplateSelecionado];

  const definicaoTemplateSelecionado =
    TEMPLATES_EDITAVEIS[tipoTemplateSelecionado];

  const [modalConexaoAberto, setModalConexaoAberto] = useState(false);
  const [modalDesconectarAberto, setModalDesconectarAberto] =
    useState(false);

  const [formConexao, setFormConexao] =
    useState<FormConexao>(formConexaoInicial);

  async function carregarTemplatesWhatsapp() {
    try {
      const response = await fetch(
        "/api/admin/integracoes/whatsapp/templates",
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          "Não foi possível carregar os templates do WhatsApp."
        );
      }

      const recebidos: TemplateWhatsapp[] =
        Array.isArray(data?.templates)
          ? data.templates
          : [];

      const proximos: Record<
        TipoTemplateEditavel,
        TemplateWhatsapp
      > = {
        REUNIAO_CRIADA: {
          ...TEMPLATES_EDITAVEIS.REUNIAO_CRIADA
            .inicial,
        },

        REUNIAO_LEMBRETE: {
          ...TEMPLATES_EDITAVEIS.REUNIAO_LEMBRETE
            .inicial,
        },
      };

      (
        Object.keys(
          TEMPLATES_EDITAVEIS
        ) as TipoTemplateEditavel[]
      ).forEach((tipo) => {
        const encontrado = recebidos.find(
          (template) =>
            template.tipoComunicacao === tipo
        );

        if (encontrado) {
          proximos[tipo] = {
            ...TEMPLATES_EDITAVEIS[tipo].inicial,
            ...encontrado,
          };
        }
      });

      setTemplatesWhatsapp(proximos);
    } catch (error) {
      console.error(
        "Erro ao carregar templates do WhatsApp:",
        error
      );
    }
  }

  async function sincronizarTemplatesMeta() {
    try {
      setSincronizandoTemplates(true);
      setErro("");
      setSucesso("");

      const response = await fetch(
        "/api/admin/integracoes/whatsapp/templates/sincronizar",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          "Não foi possível sincronizar os templates com a Meta."
        );
      }

      await Promise.all([
        carregarTemplatesWhatsapp(),
        carregarConfiguracao(),
      ]);

      setSucesso(
        data?.message ||
        "Templates sincronizados com a Meta."
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao sincronizar os templates com a Meta."
      );
    } finally {
      setSincronizandoTemplates(false);
    }
  }

  async function enviarMensagemTeste() {
    try {
      setEnviandoTeste(true);
      setErro("");
      setSucesso("");
      setResultadoTeste(null);

      const response = await fetch(
        "/api/admin/integracoes/whatsapp/enviar-teste",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            telefone: telefoneTeste,

            nomeDestinatario:
              nomeDestinatarioTeste,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          "Não foi possível enviar a mensagem de teste."
        );
      }

      setResultadoTeste({
        mensagemId:
          Number(data.mensagemId),

        metaMessageId:
          String(data.metaMessageId),
      });

      await carregarConfiguracao();

      setSucesso(
        data?.message ||
        "Mensagem de teste enviada e registrada no PHANYX."
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao enviar a mensagem de teste."
      );
    } finally {
      setEnviandoTeste(false);
    }
  }

  async function carregarConfiguracao() {
    try {
      setCarregando(true);
      setErro("");

      const response = await fetch("/api/admin/integracoes/whatsapp", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          "Não foi possível carregar a configuração do WhatsApp."
        );
      }

      const payload = data as RespostaConfiguracao;

      setIntegracao({
        ...integracaoInicial,
        ...(payload.integracao || {}),
      });

      setResumo({
        ...resumoInicial,
        ...(payload.resumo || {}),
      });

      setMensagensRecentes(
        Array.isArray(payload.mensagensRecentes)
          ? payload.mensagensRecentes
          : []
      );

      const recebidas = Array.isArray(payload.comunicacoes)
        ? payload.comunicacoes
        : [];

      const normalizadas = COMUNICACOES.map((item) => {
        const encontrada = recebidas.find(
          (config) => config.tipoComunicacao === item.tipo
        );

        return {
          tipoComunicacao: item.tipo,
          ativo: encontrada?.ativo === true,
          configuracaoId: encontrada?.configuracaoId ?? null,
        };
      });

      setComunicacoes(normalizadas);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar a integração do WhatsApp."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarConfiguracao();
    carregarTemplatesWhatsapp();
  }, []);

  function alterarCampoConexao(
    campo: keyof FormConexao,
    valor: string
  ) {
    setFormConexao((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function alterarComunicacao(
    tipoComunicacao: TipoComunicacao,
    ativo: boolean
  ) {
    setComunicacoes((atuais) =>
      atuais.map((item) =>
        item.tipoComunicacao === tipoComunicacao
          ? {
            ...item,
            ativo,
          }
          : item
      )
    );
  }

  function atualizarTemplateSelecionado(
    alteracoes: Partial<TemplateWhatsapp>
  ) {
    setTemplatesWhatsapp((atuais) => ({
      ...atuais,

      [tipoTemplateSelecionado]: {
        ...atuais[tipoTemplateSelecionado],
        ...alteracoes,
      },
    }));
  }

  async function conectarWhatsApp() {
    try {
      setConectando(true);
      setErro("");
      setSucesso("");

      const response = await fetch(
        "/api/admin/integracoes/whatsapp/conectar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            phoneNumberId: formConexao.phoneNumberId.trim(),
            whatsappBusinessId:
              formConexao.whatsappBusinessId.trim(),
            metaBusinessId:
              formConexao.metaBusinessId.trim() || undefined,
            accessToken: formConexao.accessToken.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data?.ok === false) {
        throw new Error(
          data?.error ||
          "Não foi possível conectar o WhatsApp Business."
        );
      }

      setModalConexaoAberto(false);
      setFormConexao(formConexaoInicial);

      setSucesso(
        data?.message ||
        "WhatsApp Business conectado com sucesso."
      );

      await carregarConfiguracao();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao conectar o WhatsApp Business."
      );
    } finally {
      setConectando(false);
    }
  }

  async function testarConexao() {
    try {
      setTestando(true);
      setErro("");
      setSucesso("");

      const response = await fetch(
        "/api/admin/integracoes/whatsapp/testar",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok || data?.ok === false) {
        throw new Error(
          data?.error ||
          "Não foi possível validar a conexão com o WhatsApp Business."
        );
      }

      setSucesso(
        data?.message ||
        "Conexão com o WhatsApp Business validada com sucesso."
      );

      await carregarConfiguracao();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao testar a conexão do WhatsApp."
      );
    } finally {
      setTestando(false);
    }
  }

  async function desconectarWhatsApp() {
    try {
      setDesconectando(true);
      setErro("");
      setSucesso("");

      const response = await fetch(
        "/api/admin/integracoes/whatsapp/desconectar",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok || data?.ok === false) {
        throw new Error(
          data?.error ||
          "Não foi possível desconectar o WhatsApp Business."
        );
      }

      setModalDesconectarAberto(false);

      setSucesso(
        data?.message ||
        "WhatsApp Business desconectado com sucesso."
      );

      await carregarConfiguracao();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao desconectar o WhatsApp Business."
      );
    } finally {
      setDesconectando(false);
    }
  }

  async function salvarTemplateSelecionado() {
    try {
      setSalvandoTemplate(true);
      setErro("");
      setSucesso("");

      const template =
        templatesWhatsapp[tipoTemplateSelecionado];

      const response = await fetch(
        "/api/admin/integracoes/whatsapp/templates",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            nome:
              template.nome.trim() ||
              definicaoTemplateSelecionado.titulo,

            nomeMeta:
              template.nomeMeta.trim(),

            tipoComunicacao:
              tipoTemplateSelecionado,

            idioma:
              template.idioma || "pt_BR",

            categoriaMeta:
              template.categoriaMeta ||
              "UTILITY",

            statusMeta:
              template.statusMeta || null,

            titulo:
              template.titulo || null,

            corpo:
              template.corpo.trim(),

            rodape:
              template.rodape || null,

            aprovadoMeta:
              template.aprovadoMeta === true,

            ativo: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          "Não foi possível salvar o modelo de mensagem."
        );
      }

      if (data?.template) {
        setTemplatesWhatsapp((atuais) => ({
          ...atuais,

          [tipoTemplateSelecionado]: {
            ...TEMPLATES_EDITAVEIS[
              tipoTemplateSelecionado
            ].inicial,

            ...data.template,
          },
        }));
      }

      setSucesso(
        `Modelo "${definicaoTemplateSelecionado.titulo}" salvo com sucesso.`
      );

      await carregarConfiguracao();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao salvar o modelo de mensagem."
      );
    } finally {
      setSalvandoTemplate(false);
    }
  }

  async function salvarConfiguracao() {
    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const response = await fetch(
        "/api/admin/integracoes/whatsapp",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ativo: integracao.ativo,
            comunicacoes: comunicacoes.map((item) => ({
              tipoComunicacao: item.tipoComunicacao,
              ativo: item.ativo,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          "Não foi possível salvar as configurações."
        );
      }

      setSucesso(
        data?.message ||
        "Configurações do WhatsApp salvas com sucesso."
      );

      await carregarConfiguracao();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao salvar a configuração do WhatsApp."
      );
    } finally {
      setSalvando(false);
    }
  }

  const quantidadeAtivas = useMemo(
    () => comunicacoes.filter((item) => item.ativo).length,
    [comunicacoes]
  );

  if (carregando) {
    return (
      <div className="phanyx-whatsapp-page mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            Carregando configuração do WhatsApp institucional...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="phanyx-whatsapp-page mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
                  WhatsApp institucional
                </h1>

                <span
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-bold",
                    integracao.conectado
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-300 bg-white text-slate-600",
                  ].join(" ")}
                >
                  {integracao.conectado
                    ? "Conectado"
                    : "Não conectado"}
                </span>
              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Conecte o WhatsApp Business oficial desta instituição
                ao PHANYX e escolha quais acontecimentos poderão gerar
                comunicações automáticas aos usuários.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {integracao.conectado ? (
                <>
                  <button
                    type="button"
                    onClick={testarConexao}
                    disabled={testando}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {testando
                      ? "Testando..."
                      : "Testar conexão"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setModalDesconectarAberto(true)
                    }
                    className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Desconectar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setErro("");
                    setSucesso("");
                    setModalConexaoAberto(true);
                  }}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  Conectar WhatsApp Business
                </button>
              )}
            </div>
          </div>
        </div>

        {erro && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {sucesso}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-slate-700 dark:bg-slate-950">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                  Conta WhatsApp Business
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Dados da conta conectada exclusivamente a esta
                  instituição.
                </p>
              </div>

              <div
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold",
                  integracao.conectado
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 bg-slate-50 text-slate-600",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    integracao.conectado
                      ? "bg-emerald-500"
                      : "bg-slate-400",
                  ].join(" ")}
                />

                {integracao.conectado
                  ? "Conexão ativa"
                  : "Aguardando conexão"}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Info
                titulo="Nome comercial"
                valor={integracao.nomeExibicao || "—"}
              />

              <Info
                titulo="Número"
                valor={
                  integracao.numeroExibicao ||
                  integracao.numeroTelefone ||
                  "—"
                }
              />

              <Info
                titulo="Phone Number ID"
                valor={integracao.phoneNumberId || "—"}
              />

              <Info
                titulo="Webhook"
                valor={
                  integracao.webhookAtivo
                    ? "Ativo"
                    : "Ainda não ativo"
                }
              />

              <Info
                titulo="Última sincronização"
                valor={formatarData(
                  integracao.ultimaSincronizacaoEm
                )}
              />

              <Info
                titulo="Credencial"
                valor={
                  integracao.credencialConfigurada
                    ? "Protegida e armazenada"
                    : "Não configurada"
                }
              />
            </div>

            {integracao.ultimaFalhaMensagem && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-900">
                  Última falha registrada
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  {integracao.ultimaFalhaMensagem}
                </p>

                {integracao.ultimaFalhaEm && (
                  <p className="mt-2 text-xs text-amber-700">
                    {formatarData(integracao.ultimaFalhaEm)}
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              Resumo
            </h2>

            <div className="mt-5 space-y-3">
              <ResumoItem
                titulo="Automações ativas"
                valor={`${quantidadeAtivas} de ${COMUNICACOES.length}`}
              />

              <ResumoItem
                titulo="Templates"
                valor={String(resumo.quantidadeTemplates)}
              />

              <ResumoItem
                titulo="Mensagens registradas"
                valor={String(resumo.quantidadeMensagens)}
              />

              <ResumoItem
                titulo="Webhook"
                valor={
                  integracao.webhookAtivo ? "Ativo" : "Inativo"
                }
              />
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              Envio controlado de teste
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Envie o modelo aprovado de reunião criada para
              validar o envio, o registro no PHANYX e os retornos
              do webhook. Este teste não ativa as automações.
            </p>
          </div>

          <form
            className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              enviarMensagemTeste();
            }}
          >
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Nome do destinatário
              </label>

              <input
                type="text"
                value={nomeDestinatarioTeste}
                onChange={(event) =>
                  setNomeDestinatarioTeste(
                    event.target.value
                  )
                }
                placeholder="Ex.: Denise"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                WhatsApp de destino
              </label>

              <input
                type="tel"
                value={telefoneTeste}
                onChange={(event) =>
                  setTelefoneTeste(
                    event.target.value
                  )
                }
                placeholder="Ex.: 55 11 99999-9999"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />

              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Informe DDI, DDD e número.
              </p>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={
                  enviandoTeste ||
                  !integracao.conectado ||
                  telefoneTeste.replace(/\D/g, "")
                    .length < 10
                }
                className="w-full rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
              >
                {enviandoTeste
                  ? "Enviando teste..."
                  : "Enviar mensagem de teste"}
              </button>
            </div>
          </form>

          {resultadoTeste && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              <p className="font-bold">
                Mensagem aceita pela Meta
              </p>

              <p className="mt-2 break-all">
                Registro PHANYX:{" "}
                {resultadoTeste.mensagemId}
              </p>

              <p className="mt-1 break-all">
                Meta Message ID:{" "}
                {resultadoTeste.metaMessageId}
              </p>
            </div>
          )}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="border-b border-slate-200 p-5 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              Histórico de mensagens
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Acompanhe o envio, a entrega, a leitura e possíveis falhas
              informadas pela Meta.
            </p>
          </div>

          {mensagensRecentes.length === 0 ? (
            <div className="p-5 text-sm text-slate-600 dark:text-slate-300">
              Nenhuma mensagem foi registrada até o momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {mensagensRecentes.map((mensagem) => (
                <article
                  key={mensagem.id}
                  className="p-5"
                >
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-950 dark:text-white">
                          {mensagem.nomeDestinatario ||
                            "Destinatário não informado"}
                        </p>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${["ENTREGUE", "LIDA"].includes(mensagem.status)
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : ["FALHOU", "CANCELADA"].includes(
                                mensagem.status
                              )
                                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                                : mensagem.status === "ENVIADA"
                                  ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                            }`}
                        >
                          {mensagem.status === "ENVIADA"
                            ? "ACEITA PELA META"
                            : mensagem.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        WhatsApp: {mensagem.telefoneDestinatario}
                      </p>

                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Modelo:{" "}
                        {mensagem.template?.nome ||
                          mensagem.template?.nomeMeta ||
                          mensagem.tipoComunicacao.replace(/_/g, " ")}
                      </p>
                    </div>

                    <div className="text-sm text-slate-600 dark:text-slate-300 lg:text-right">
                      <p className="font-semibold">
                        Registro PHANYX: {mensagem.id}
                      </p>

                      <p className="mt-1">
                        {new Date(mensagem.criadaEm).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  {(mensagem.erroMensagem || mensagem.erroCodigo) && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                      <p className="font-bold">
                        Falha informada pela Meta
                      </p>

                      {mensagem.erroCodigo && (
                        <p className="mt-2">
                          Código: {mensagem.erroCodigo}
                        </p>
                      )}

                      {mensagem.erroMensagem && (
                        <p className="mt-1 whitespace-pre-wrap">
                          {mensagem.erroMensagem}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                        Registrada
                      </p>
                      <p className="mt-1 text-slate-900 dark:text-white">
                        {new Date(mensagem.criadaEm).toLocaleString("pt-BR")}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                        Aceita pela Meta
                      </p>
                      <p className="mt-1 text-slate-900 dark:text-white">
                        {mensagem.enviadaEm
                          ? new Date(mensagem.enviadaEm).toLocaleString("pt-BR")
                          : "Aguardando"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                        Entregue
                      </p>
                      <p className="mt-1 text-slate-900 dark:text-white">
                        {mensagem.entregueEm
                          ? new Date(mensagem.entregueEm).toLocaleString("pt-BR")
                          : "Aguardando"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                        Lida
                      </p>
                      <p className="mt-1 text-slate-900 dark:text-white">
                        {mensagem.lidaEm
                          ? new Date(mensagem.lidaEm).toLocaleString("pt-BR")
                          : "Aguardando"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                        Falhou
                      </p>
                      <p className="mt-1 text-slate-900 dark:text-white">
                        {mensagem.falhouEm
                          ? new Date(mensagem.falhouEm).toLocaleString("pt-BR")
                          : "Não"}
                      </p>
                    </div>
                  </div>

                  {mensagem.metaMessageId && (
                    <p className="mt-4 break-all text-xs text-slate-500 dark:text-slate-400">
                      Meta Message ID: {mensagem.metaMessageId}
                    </p>
                  )}

                  {mensagem.eventos.length > 0 && (
                    <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                      <summary className="cursor-pointer text-sm font-bold text-slate-900 dark:text-white">
                        Retornos recebidos pelo webhook (
                        {mensagem.eventos.length})
                      </summary>

                      <div className="mt-4 space-y-3">
                        {mensagem.eventos.map((evento) => (
                          <div
                            key={evento.id}
                            className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                          >
                            <div className="flex flex-col justify-between gap-1 sm:flex-row">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {evento.status.replace(/_/g, " ")}
                              </span>

                              <span className="text-slate-500 dark:text-slate-400">
                                {new Date(evento.recebidoEm).toLocaleString(
                                  "pt-BR"
                                )}
                              </span>
                            </div>

                            {evento.payload != null && (
                              <details className="mt-3">
                                <summary className="cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
                                  Ver retorno técnico
                                </summary>

                                <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                                  {JSON.stringify(evento.payload, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="border-b border-slate-200 p-5 dark:border-slate-700">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                  Modelos de mensagens
                </h2>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Configure os modelos utilizados pelo PHANYX nas
                  comunicações automáticas do WhatsApp.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Modelos configurados
                </p>

                <p className="mt-1 font-bold text-slate-950 dark:text-white">
                  {resumo.quantidadeTemplates}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(
                Object.keys(
                  TEMPLATES_EDITAVEIS
                ) as TipoTemplateEditavel[]
              ).map((tipo) => {
                const definicao =
                  TEMPLATES_EDITAVEIS[tipo];

                const template =
                  templatesWhatsapp[tipo];

                const selecionado =
                  tipoTemplateSelecionado === tipo;

                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() =>
                      setTipoTemplateSelecionado(tipo)
                    }
                    className={[
                      "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                      selecionado
                        ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {definicao.titulo}

                    {template.id ? (
                      <span
                        className={[
                          "h-2 w-2 rounded-full",
                          template.aprovadoMeta
                            ? "bg-emerald-500"
                            : "bg-amber-400",
                        ].join(" ")}
                      />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-start dark:border-slate-700">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                  {definicaoTemplateSelecionado.titulo}
                </h3>

                <span
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-bold",
                    templateSelecionado.aprovadoMeta
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : templateSelecionado.id
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-slate-300 bg-slate-50 text-slate-600",
                  ].join(" ")}
                >
                  {templateSelecionado.aprovadoMeta
                    ? "Aprovado pela Meta"
                    : templateSelecionado.id
                      ? "Aguardando Meta"
                      : "Ainda não salvo"}
                </span>
              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {definicaoTemplateSelecionado.descricao}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[220px]">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Categoria Meta
                </p>

                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  {templateSelecionado.categoriaMeta ||
                    "UTILITY"}
                </p>
              </div>

              <button
                type="button"
                onClick={sincronizarTemplatesMeta}
                disabled={
                  sincronizandoTemplates ||
                  !integracao.conectado
                }
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sincronizandoTemplates
                  ? "Sincronizando..."
                  : "Sincronizar com a Meta"}
              </button>
            </div>
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Nome interno
                </label>

                <input
                  type="text"
                  value={templateSelecionado.nome}
                  onChange={(event) =>
                    atualizarTemplateSelecionado({
                      nome: event.target.value,
                    })
                  }
                  placeholder={
                    definicaoTemplateSelecionado.titulo
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Nome do template na Meta
                </label>

                <input
                  type="text"
                  value={templateSelecionado.nomeMeta}
                  onChange={(event) =>
                    atualizarTemplateSelecionado({
                      nomeMeta: event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "_"),
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-950 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Use apenas letras minúsculas, números e underline.
                  O nome precisa corresponder exatamente ao template
                  aprovado na Meta.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Conteúdo da mensagem
                </label>

                <textarea
                  rows={10}
                  value={templateSelecionado.corpo}
                  onChange={(event) =>
                    atualizarTemplateSelecionado({
                      corpo: event.target.value,
                    })
                  }
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Rodapé
                </label>

                <input
                  type="text"
                  value={
                    templateSelecionado.rodape || ""
                  }
                  onChange={(event) =>
                    atualizarTemplateSelecionado({
                      rodape: event.target.value,
                    })
                  }
                  placeholder="Mensagem automática enviada pelo PHANYX."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <h3 className="font-bold text-slate-950 dark:text-white">
                  Variáveis disponíveis
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  {definicaoTemplateSelecionado.variaveis.map(
                    (variavel) => (
                      <VariavelTemplate
                        key={variavel.codigo}
                        codigo={variavel.codigo}
                        descricao={variavel.descricao}
                      />
                    )
                  )}
                </div>
              </div>

              {!templateSelecionado.aprovadoMeta && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-900">
                    Aprovação da Meta pendente
                  </p>

                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    O modelo pode ser preparado e salvo no
                    PHANYX antes da aprovação. Nenhum disparo
                    real será realizado enquanto ele não estiver
                    aprovado pela Meta.
                  </p>
                </div>
              )}

              {tipoTemplateSelecionado ===
                "REUNIAO_LEMBRETE" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Como funciona o lembrete
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      O mesmo modelo será utilizado tanto para o
                      aviso do dia anterior quanto para o aviso do
                      próprio dia. A variável {"{{3}}"} receberá
                      automaticamente textos como
                      &quot;amanhã às 19:30&quot; ou
                      &quot;hoje às 19:30&quot;.
                    </p>
                  </div>
                )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {templateSelecionado.id
                ? `Modelo salvo no PHANYX • ID ${templateSelecionado.id}`
                : "Este modelo ainda não foi salvo no PHANYX."}
            </p>

            <button
              type="button"
              onClick={salvarTemplateSelecionado}
              disabled={
                salvandoTemplate ||
                !templateSelecionado.nome.trim() ||
                !templateSelecionado.nomeMeta.trim() ||
                !templateSelecionado.corpo.trim()
              }
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvandoTemplate
                ? "Salvando modelo..."
                : "Salvar modelo"}
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center dark:border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                Envio automático pelo WhatsApp
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Ative o canal e escolha quais eventos do PHANYX poderão
                gerar mensagens.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Envio de WhatsApp
              </span>

              <input
                type="checkbox"
                checked={integracao.ativo}
                disabled={!integracao.conectado}
                onChange={(event) =>
                  setIntegracao((atual) => ({
                    ...atual,
                    ativo: event.target.checked,
                  }))
                }
                className="phanyx-whatsapp-checkbox h-5 w-5"
              />
            </label>
          </div>

          {!integracao.conectado && (
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Conecte primeiro o WhatsApp Business da instituição
                para liberar as automações.
              </p>
            </div>
          )}

          <div className="space-y-8 p-5">
            {GRUPOS.map((grupo) => (
              <div key={grupo}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {grupo}
                </h3>

                <div className="grid gap-3 md:grid-cols-2">
                  {COMUNICACOES.filter(
                    (item) => item.grupo === grupo
                  ).map((item) => {
                    const configuracao = comunicacoes.find(
                      (config) =>
                        config.tipoComunicacao === item.tipo
                    );

                    const habilitado =
                      integracao.conectado &&
                      integracao.ativo;

                    return (
                      <label
                        key={item.tipo}
                        className={[
                          "flex gap-4 rounded-xl border p-4 transition",
                          habilitado
                            ? "cursor-pointer border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                            : "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-900",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          disabled={!habilitado}
                          checked={configuracao?.ativo === true}
                          onChange={(event) =>
                            alterarComunicacao(
                              item.tipo,
                              event.target.checked
                            )
                          }
                          className="phanyx-whatsapp-checkbox mt-1 h-5 w-5 shrink-0"
                        />

                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {item.titulo}
                          </p>

                          <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
                            {item.descricao}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t border-slate-200 p-5 dark:border-slate-700">
            <button
              type="button"
              onClick={salvarConfiguracao}
              disabled={!integracao.conectado || salvando}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando
                ? "Salvando..."
                : "Salvar configurações"}
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Segurança e isolamento institucional
          </h3>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            As credenciais pertencem exclusivamente à instituição
            autenticada. O token não é exibido novamente depois da
            conexão e não deve ser compartilhado com outra
            instituição.
          </p>
        </section>
      </div>

      {modalConexaoAberto && (
        <div className="phanyx-whatsapp-page fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="border-b border-slate-200 p-5 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                Conectar WhatsApp Business
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Informe os identificadores fornecidos pela Meta para
                esta conta institucional.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <Campo
                label="Phone Number ID"
                value={formConexao.phoneNumberId}
                onChange={(valor) =>
                  alterarCampoConexao("phoneNumberId", valor)
                }
                placeholder="ID do número no WhatsApp Business"
              />

              <Campo
                label="WhatsApp Business Account ID"
                value={formConexao.whatsappBusinessId}
                onChange={(valor) =>
                  alterarCampoConexao(
                    "whatsappBusinessId",
                    valor
                  )
                }
                placeholder="WABA ID"
              />

              <Campo
                label="Meta Business ID"
                value={formConexao.metaBusinessId}
                onChange={(valor) =>
                  alterarCampoConexao("metaBusinessId", valor)
                }
                placeholder="Opcional"
              />

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Token de acesso
                </label>

                <input
                  type="password"
                  autoComplete="new-password"
                  value={formConexao.accessToken}
                  onChange={(event) =>
                    alterarCampoConexao(
                      "accessToken",
                      event.target.value
                    )
                  }
                  placeholder="Token fornecido pela Meta"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  O token será enviado diretamente ao servidor do
                  PHANYX e armazenado de forma protegida.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end dark:border-slate-700">
              <button
                type="button"
                disabled={conectando}
                onClick={() => {
                  setModalConexaoAberto(false);
                  setFormConexao(formConexaoInicial);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  conectando ||
                  !formConexao.phoneNumberId.trim() ||
                  !formConexao.whatsappBusinessId.trim() ||
                  !formConexao.accessToken.trim()
                }
                onClick={conectarWhatsApp}
                className="phanyx-whatsapp-connect-modal-button rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed"
              >
                {conectando
                  ? "Conectando..."
                  : "Conectar conta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalDesconectarAberto && (
        <div className="phanyx-whatsapp-page fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="p-5">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                Desconectar WhatsApp?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Os disparos automáticos serão interrompidos. O
                histórico de mensagens permanecerá preservado no
                PHANYX.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end dark:border-slate-700">
              <button
                type="button"
                disabled={desconectando}
                onClick={() =>
                  setModalDesconectarAberto(false)
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Manter conectado
              </button>

              <button
                type="button"
                disabled={desconectando}
                onClick={desconectarWhatsApp}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {desconectando
                  ? "Desconectando..."
                  : "Desconectar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {titulo}
      </p>

      <p className="mt-2 break-all text-sm font-semibold text-slate-900 dark:text-white">
        {valor}
      </p>
    </div>
  );
}

function ResumoItem({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <span className="text-sm text-slate-600 dark:text-slate-300">
        {titulo}
      </span>

      <strong className="text-sm text-slate-950 dark:text-white">
        {valor}
      </strong>
    </div>
  );
}

function Campo({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />
    </div>
  );
}

function VariavelTemplate({
  codigo,
  descricao,
}: {
  codigo: string;
  descricao: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <code className="shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-1 font-mono text-xs font-bold text-slate-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100">
        {codigo}
      </code>

      <span className="pt-1 text-slate-600 dark:text-slate-300">
        {descricao}
      </span>
    </div>
  );
}