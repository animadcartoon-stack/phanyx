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

type RespostaConfiguracao = {
  integracao: Integracao;
  comunicacoes: Comunicacao[];
  resumo: Resumo;
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

  const [modalConexaoAberto, setModalConexaoAberto] = useState(false);
  const [modalDesconectarAberto, setModalDesconectarAberto] =
    useState(false);

  const [formConexao, setFormConexao] =
    useState<FormConexao>(formConexaoInicial);

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
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
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
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