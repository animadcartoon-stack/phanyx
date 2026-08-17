"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Tema =
  | "light"
  | "dark"
  | "system";

type Canal = {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
  tipo: string;
  cor: string;
  icone: string | null;
  padrao: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;

  _count: {
    campanhas: number;
    formularios: number;
    submissoes: number;
    regrasDistribuicao: number;
    integracoes: number;
  };
};

type RespostaCanais = {
  success: true;

  permissoes: {
    podeVer: boolean;
    podeGerenciar: boolean;
  };

  tiposDisponiveis: string[];

  resumo: {
    total: number;
    ativos: number;
    inativos: number;
    padrao: Canal | null;
  };

  canais: Canal[];
};

type RespostaErro = {
  success?: false;
  error?: string;
  codigo?: string;
};

type FormularioCanal = {
  nome: string;
  slug: string;
  descricao: string;
  tipo: string;
  cor: string;
  icone: string;
  padrao: boolean;
  ativo: boolean;
};

const FORMULARIO_INICIAL: FormularioCanal = {
  nome: "",
  slug: "",
  descricao: "",
  tipo: "SITE",
  cor: "#64748B",
  icone: "",
  padrao: false,
  ativo: true,
};

const OPCOES_ICONES_CANAL = [
  {
    valor: "",
    icone: "✨",
    nome: "Automático",
  },
  {
    valor: "🌐",
    icone: "🌐",
    nome: "Site",
  },
  {
    valor: "🖥️",
    icone: "🖥️",
    nome: "Landing page",
  },
  {
    valor: "📝",
    icone: "📝",
    nome: "Formulário",
  },
  {
    valor: "📘",
    icone: "📘",
    nome: "Meta / Facebook",
  },
  {
    valor: "🔎",
    icone: "🔎",
    nome: "Google",
  },
  {
    valor: "💬",
    icone: "💬",
    nome: "WhatsApp",
  },
  {
    valor: "📱",
    icone: "📱",
    nome: "Redes sociais",
  },
  {
    valor: "📞",
    icone: "📞",
    nome: "Telefone",
  },
  {
    valor: "✉️",
    icone: "✉️",
    nome: "E-mail",
  },
  {
    valor: "🤝",
    icone: "🤝",
    nome: "Indicação",
  },
  {
    valor: "🎪",
    icone: "🎪",
    nome: "Evento",
  },
  {
    valor: "🔗",
    icone: "🔗",
    nome: "Parceria",
  },
  {
    valor: "🎯",
    icone: "🎯",
    nome: "Campanha",
  },
  {
    valor: "📤",
    icone: "📤",
    nome: "Importação",
  },
  {
    valor: "⚙️",
    icone: "⚙️",
    nome: "API",
  },
  {
    valor: "📡",
    icone: "📡",
    nome: "Integração",
  },
  {
    valor: "🏫",
    icone: "🏫",
    nome: "Institucional",
  },
  {
    valor: "👥",
    icone: "👥",
    nome: "Pessoas",
  },
  {
    valor: "📣",
    icone: "📣",
    nome: "Divulgação",
  },
];

function formatarNumero(
  valor: number
) {
  return new Intl.NumberFormat(
    "pt-BR"
  ).format(
    Number(valor || 0)
  );
}

function formatarData(
  valor: string
) {
  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",

      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(data);
}

function nomeTipo(
  tipo: string
) {
  const mapa:
    Record<
      string,
      string
    > = {
    SITE:
      "Site",

    LANDING_PAGE:
      "Landing page",

    FORMULARIO:
      "Formulário",

    META_ADS:
      "Meta Ads",

    GOOGLE_ADS:
      "Google Ads",

    WHATSAPP:
      "WhatsApp",

    INDICACAO:
      "Indicação",

    EVENTO:
      "Evento",

    PARCERIA:
      "Parceria",

    IMPORTACAO:
      "Importação",

    API:
      "API",

    OUTRO:
      "Outro",
  };

  return (
    mapa[tipo] ??
    tipo
  );
}

function iconeTipo(
  tipo: string
) {
  const mapa:
    Record<
      string,
      string
    > = {
    SITE:
      "🌐",

    LANDING_PAGE:
      "🖥️",

    FORMULARIO:
      "📝",

    META_ADS:
      "📘",

    GOOGLE_ADS:
      "🔎",

    WHATSAPP:
      "💬",

    INDICACAO:
      "🤝",

    EVENTO:
      "🎪",

    PARCERIA:
      "🔗",

    IMPORTACAO:
      "📤",

    API:
      "⚙️",

    OUTRO:
      "📡",
  };

  return (
    mapa[tipo] ??
    "📡"
  );
}

export default function CanaisCaptacaoPage() {
  const [
    temaEscuro,
    setTemaEscuro,
  ] =
    useState(false);

  const [
    dados,
    setDados,
  ] =
    useState<RespostaCanais | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    atualizando,
    setAtualizando,
  ] =
    useState(false);

  const [
    salvando,
    setSalvando,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const [
    busca,
    setBusca,
  ] =
    useState("");

  const [
    tipoFiltro,
    setTipoFiltro,
  ] =
    useState("");

  const [
    ativoFiltro,
    setAtivoFiltro,
  ] =
    useState("");

  const [
    modalNovoAberto,
    setModalNovoAberto,
  ] =
    useState(false);

  const [
    canalEditando,
    setCanalEditando,
  ] =
    useState<Canal | null>(
      null
    );

  const [
    formulario,
    setFormulario,
  ] =
    useState<FormularioCanal>(
      FORMULARIO_INICIAL
    );

  const [
    erroFormulario,
    setErroFormulario,
  ] =
    useState("");

  const [
    toast,
    setToast,
  ] =
    useState<{
      tipo:
      | "sucesso"
      | "erro";

      mensagem:
      string;
    } | null>(
      null
    );

  useEffect(() => {
    function calcularTema() {
      const tema =
        (
          localStorage.getItem(
            "phanyx_tema"
          ) ||
          "system"
        ) as Tema;

      const sistemaEscuro =
        window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;

      setTemaEscuro(
        tema === "dark" ||
        (
          tema ===
          "system" &&
          sistemaEscuro
        )
      );
    }

    calcularTema();

    window.addEventListener(
      "storage",
      calcularTema
    );

    const media =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    media.addEventListener(
      "change",
      calcularTema
    );

    return () => {
      window.removeEventListener(
        "storage",
        calcularTema
      );

      media.removeEventListener(
        "change",
        calcularTema
      );
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer =
      setTimeout(
        () => {
          setToast(null);
        },
        3500
      );

    return () =>
      clearTimeout(
        timer
      );
  }, [toast]);

  const c =
    useMemo(
      () => ({
        pagina:
          temaEscuro
            ? "bg-slate-950 text-slate-100"
            : "bg-slate-100 text-slate-900",

        card:
          temaEscuro
            ? "border-slate-800 bg-slate-900"
            : "border-slate-200 bg-white",

        subCard:
          temaEscuro
            ? "border-slate-800 bg-slate-950"
            : "border-slate-200 bg-slate-50",

        titulo:
          temaEscuro
            ? "text-white"
            : "text-slate-900",

        texto:
          temaEscuro
            ? "text-slate-300"
            : "text-slate-700",

        muted:
          temaEscuro
            ? "text-slate-400"
            : "text-slate-500",

        divisoria:
          temaEscuro
            ? "border-slate-800"
            : "border-slate-200",

        input:
          temaEscuro
            ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
            : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400",

        botaoSecundario:
          temaEscuro
            ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
      }),
      [
        temaEscuro,
      ]
    );

  const carregar =
    useCallback(
      async (
        opcoes?: {
          silencioso?: boolean;
          busca?: string;
          tipo?: string;
          ativo?: string;
        }
      ) => {
        try {
          if (
            opcoes
              ?.silencioso
          ) {
            setAtualizando(
              true
            );
          } else {
            setCarregando(
              true
            );
          }

          setErro("");

          const params =
            new URLSearchParams();

          const buscaAtual =
            opcoes?.busca ??
            busca;

          const tipoAtual =
            opcoes?.tipo ??
            tipoFiltro;

          const ativoAtual =
            opcoes?.ativo ??
            ativoFiltro;

          if (
            buscaAtual.trim()
          ) {
            params.set(
              "busca",
              buscaAtual.trim()
            );
          }

          if (
            tipoAtual
          ) {
            params.set(
              "tipo",
              tipoAtual
            );
          }

          if (
            ativoAtual
          ) {
            params.set(
              "ativo",
              ativoAtual
            );
          }

          const query =
            params.toString();

          const resposta =
            await fetch(
              `/api/admin/comercial/captacao/canais${query
                ? `?${query}`
                : ""
              }`,
              {
                method:
                  "GET",

                cache:
                  "no-store",
              }
            );

          const json =
            (
              await resposta
                .json()
                .catch(
                  () => ({})
                )
            ) as
            | RespostaCanais
            | RespostaErro;

          if (
            !resposta.ok ||
            !(
              "success" in
              json
            ) ||
            json.success !==
            true
          ) {
            throw new Error(
              (
                json as
                RespostaErro
              ).error ||
              "Não foi possível carregar os canais."
            );
          }

          setDados(
            json
          );
        } catch (
        error
        ) {
          setErro(
            error instanceof
              Error
              ? error.message
              : "Não foi possível carregar os canais."
          );
        } finally {
          setCarregando(
            false
          );

          setAtualizando(
            false
          );
        }
      },
      [
        busca,
        tipoFiltro,
        ativoFiltro,
      ]
    );

  useEffect(() => {
    void carregar();
  }, []);

  function abrirNovoCanal() {
    const primeiroTipo =
      dados
        ?.tiposDisponiveis
      ?.[0] ??
      "SITE";

    setCanalEditando(
      null
    );

    setFormulario({
      ...FORMULARIO_INICIAL,

      tipo:
        primeiroTipo,
    });

    setErroFormulario(
      ""
    );

    setModalNovoAberto(
      true
    );
  }

  function abrirEditarCanal(
    canal: Canal
  ) {
    setCanalEditando(
      canal
    );

    setFormulario({
      nome:
        canal.nome,

      slug:
        canal.slug,

      descricao:
        canal.descricao ??
        "",

      tipo:
        canal.tipo,

      cor:
        canal.cor ||
        "#64748B",

      icone:
        canal.icone ??
        "",

      padrao:
        canal.padrao,

      ativo:
        canal.ativo,
    });

    setErroFormulario(
      ""
    );

    setModalNovoAberto(
      true
    );
  }

  function fecharNovoCanal() {
    if (salvando) {
      return;
    }

    setModalNovoAberto(
      false
    );

    setCanalEditando(
      null
    );

    setErroFormulario(
      ""
    );
  }
  function atualizarFormulario<
    K extends keyof FormularioCanal
  >(
    campo: K,
    valor:
      FormularioCanal[K]
  ) {
    setFormulario(
      (
        atual
      ) => ({
        ...atual,
        [campo]:
          valor,
      })
    );

    if (
      erroFormulario
    ) {
      setErroFormulario(
        ""
      );
    }
  }

  async function salvarCanal(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const nome =
      formulario
        .nome
        .trim();

    if (!nome) {
      setErroFormulario(
        "Informe o nome do canal."
      );

      return;
    }

    if (
      !formulario.tipo
    ) {
      setErroFormulario(
        "Selecione o tipo do canal."
      );

      return;
    }

    try {
      setSalvando(
        true
      );

      setErroFormulario(
        ""
      );

      const editando =
        Boolean(
          canalEditando
        );

      const url =
        canalEditando
          ? `/api/admin/comercial/captacao/canais/${canalEditando.id}`
          : "/api/admin/comercial/captacao/canais";

      const resposta =
        await fetch(
          url,
          {
            method:
              editando
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nome,

                tipo:
                  formulario.tipo,

                descricao:
                  formulario
                    .descricao
                    .trim() ||
                  null,

                slug:
                  formulario
                    .slug
                    .trim() ||
                  null,

                icone:
                  formulario
                    .icone
                    .trim() ||
                  null,

                cor:
                  formulario.cor,

                padrao:
                  formulario.padrao,

                ativo:
                  formulario.ativo,
              }),
          }
        );

      const json =
        (
          await resposta
            .json()
            .catch(
              () => ({})
            )
        ) as {
          success?:
          boolean;

          message?:
          string;

          error?:
          string;
        };

      if (
        !resposta.ok ||
        json.success !==
        true
      ) {
        throw new Error(
          json.error ||
          (
            editando
              ? "Não foi possível atualizar o canal."
              : "Não foi possível cadastrar o canal."
          )
        );
      }

      setModalNovoAberto(
        false
      );

      setCanalEditando(
        null
      );

      setToast({
        tipo:
          "sucesso",

        mensagem:
          json.message ||
          (
            editando
              ? "Canal atualizado com sucesso."
              : "Canal criado com sucesso."
          ),
      });

      await carregar({
        silencioso:
          true,
      });
    } catch (
    error
    ) {
      setErroFormulario(
        error instanceof
          Error
          ? error.message
          : "Não foi possível salvar o canal."
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  function aplicarFiltros(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    void carregar();
  }

  function limparFiltros() {
    setBusca("");
    setTipoFiltro("");
    setAtivoFiltro("");

    void carregar({
      busca: "",
      tipo: "",
      ativo: "",
    });
  }

  if (
    carregando &&
    !dados
  ) {
    return (
      <div
        className={`min-h-screen p-6 ${c.pagina}`}
      >
        <div className="mx-auto max-w-7xl space-y-5">
          <div
            className={`h-32 animate-pulse rounded-3xl border ${c.card}`}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({
              length: 3,
            }).map(
              (
                _,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className={`h-28 animate-pulse rounded-3xl border ${c.card}`}
                />
              )
            )}
          </div>

          <div
            className={`h-96 animate-pulse rounded-3xl border ${c.card}`}
          />
        </div>
      </div>
    );
  }

  if (
    erro &&
    !dados
  ) {
    return (
      <div
        className={`min-h-screen p-6 ${c.pagina}`}
      >
        <div
          className={`mx-auto max-w-2xl rounded-3xl border p-6 shadow-sm ${c.card}`}
        >
          <div className="text-3xl">
            ⚠️
          </div>

          <h1
            className={`mt-4 text-xl font-bold ${c.titulo}`}
          >
            Não foi possível
            carregar os canais
          </h1>

          <p
            className={`mt-2 text-sm ${c.texto}`}
          >
            {erro}
          </p>

          <button
            type="button"
            onClick={() =>
              void carregar()
            }
            className={`mt-5 rounded-xl border px-4 py-2 text-sm font-semibold ${c.botaoSecundario}`}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!dados) {
    return null;
  }

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 ${c.pagina}`}
    >
      {toast && (
        <div className="fixed right-5 top-5 z-[120]">
          <div
            className={
              toast.tipo ===
                "sucesso"
                ? (
                  temaEscuro
                    ? "rounded-2xl border border-emerald-800 bg-emerald-950 px-4 py-3 text-sm font-medium text-emerald-200 shadow-xl"
                    : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-xl"
                )
                : (
                  temaEscuro
                    ? "rounded-2xl border border-red-900 bg-red-950 px-4 py-3 text-sm font-medium text-red-200 shadow-xl"
                    : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-xl"
                )
            }
          >
            {
              toast.mensagem
            }
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-6">
        <section
          className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${c.card}`}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/admin/comercial/captacao"
                className={`text-sm font-semibold ${c.muted}`}
              >
                ← Central de
                Captação
              </Link>

              <h1
                className={`mt-3 text-2xl font-bold sm:text-3xl ${c.titulo}`}
              >
                📡 Canais de
                captação
              </h1>

              <p
                className={`mt-2 max-w-3xl text-sm leading-6 ${c.texto}`}
              >
                Organize as
                origens pelas quais
                os leads chegam à
                instituição.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  void carregar({
                    silencioso:
                      true,
                  })
                }
                disabled={
                  atualizando
                }
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${c.botaoSecundario}`}
              >
                {atualizando
                  ? "Atualizando..."
                  : "↻ Atualizar"}
              </button>

              {dados
                .permissoes
                .podeGerenciar && (
                  <button
                    type="button"
                    onClick={
                      abrirNovoCanal
                    }
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  >
                    + Novo canal
                  </button>
                )}
            </div>
          </div>
        </section>

        {erro && (
          <div
            className={
              temaEscuro
                ? "rounded-2xl border border-amber-900 bg-amber-950/50 px-4 py-3 text-sm text-amber-200"
                : "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            }
          >
            {erro}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div
            className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
          >
            <p
              className={`text-sm ${c.muted}`}
            >
              Total de canais
            </p>

            <p
              className={`mt-2 text-3xl font-bold ${c.titulo}`}
            >
              {formatarNumero(
                dados.resumo.total
              )}
            </p>
          </div>

          <div
            className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
          >
            <p
              className={`text-sm ${c.muted}`}
            >
              Canais ativos
            </p>

            <p
              className={`mt-2 text-3xl font-bold ${c.titulo}`}
            >
              {formatarNumero(
                dados.resumo.ativos
              )}
            </p>
          </div>

          <div
            className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
          >
            <p
              className={`text-sm ${c.muted}`}
            >
              Canal padrão
            </p>

            <p
              className={`mt-2 truncate text-lg font-bold ${c.titulo}`}
            >
              {dados.resumo
                .padrao
                ?.nome ||
                "Não definido"}
            </p>
          </div>
        </section>

        <section
          className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${c.card}`}
        >
          <form
            onSubmit={
              aplicarFiltros
            }
            className="grid gap-3 lg:grid-cols-[1fr_220px_180px_auto]"
          >
            <div>
              <label
                className={`text-xs font-semibold ${c.muted}`}
              >
                Buscar
              </label>

              <input
                type="text"
                value={busca}
                onChange={(
                  event
                ) =>
                  setBusca(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Nome, descrição ou identificador"
                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-slate-500 ${c.input}`}
              />
            </div>

            <div>
              <label
                className={`text-xs font-semibold ${c.muted}`}
              >
                Tipo
              </label>

              <select
                value={
                  tipoFiltro
                }
                onChange={(
                  event
                ) =>
                  setTipoFiltro(
                    event
                      .target
                      .value
                  )
                }
                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-slate-500 ${c.input}`}
              >
                <option value="">
                  Todos
                </option>

                {dados
                  .tiposDisponiveis
                  .map(
                    (
                      tipo
                    ) => (
                      <option
                        key={
                          tipo
                        }
                        value={
                          tipo
                        }
                      >
                        {nomeTipo(
                          tipo
                        )}
                      </option>
                    )
                  )}
              </select>
            </div>

            <div>
              <label
                className={`text-xs font-semibold ${c.muted}`}
              >
                Situação
              </label>

              <select
                value={
                  ativoFiltro
                }
                onChange={(
                  event
                ) =>
                  setAtivoFiltro(
                    event
                      .target
                      .value
                  )
                }
                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-slate-500 ${c.input}`}
              >
                <option value="">
                  Todos
                </option>

                <option value="true">
                  Ativos
                </option>

                <option value="false">
                  Inativos
                </option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Filtrar
              </button>

              <button
                type="button"
                onClick={
                  limparFiltros
                }
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${c.botaoSecundario}`}
              >
                Limpar
              </button>
            </div>
          </form>
        </section>

        <section
          className={`overflow-hidden rounded-3xl border shadow-sm ${c.card}`}
        >
          <div
            className={`border-b p-5 sm:p-6 ${c.divisoria}`}
          >
            <h2
              className={`text-lg font-bold ${c.titulo}`}
            >
              Canais cadastrados
            </h2>

            <p
              className={`mt-1 text-sm ${c.muted}`}
            >
              {formatarNumero(
                dados.canais.length
              )}{" "}
              resultado
              {dados.canais
                .length === 1
                ? ""
                : "s"}{" "}
              nesta consulta.
            </p>
          </div>

          {dados.canais
            .length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">
                📡
              </div>

              <p
                className={`mt-3 font-semibold ${c.titulo}`}
              >
                Nenhum canal
                encontrado
              </p>

              <p
                className={`mt-1 text-sm ${c.muted}`}
              >
                Cadastre o primeiro
                canal ou altere os
                filtros da consulta.
              </p>

              {dados
                .permissoes
                .podeGerenciar && (
                  <button
                    type="button"
                    onClick={
                      abrirNovoCanal
                    }
                    className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    + Cadastrar canal
                  </button>
                )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {dados.canais.map(
                (
                  canal
                ) => (
                  <article
                    key={
                      canal.id
                    }
                    className="p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-xl ${c.subCard}`}
                          style={{
                            borderColor:
                              canal.cor,
                          }}
                        >
                          {canal.icone ||
                            iconeTipo(
                              canal.tipo
                            )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={`text-lg font-bold ${c.titulo}`}
                            >
                              {
                                canal.nome
                              }
                            </h3>

                            {canal.padrao && (
                              <span
                                className={
                                  temaEscuro
                                    ? "rounded-full border border-amber-800 bg-amber-950/60 px-2.5 py-1 text-xs font-semibold text-amber-300"
                                    : "rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"
                                }
                              >
                                Padrão
                              </span>
                            )}

                            <span
                              className={
                                canal.ativo
                                  ? (
                                    temaEscuro
                                      ? "rounded-full border border-emerald-800 bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-emerald-300"
                                      : "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                  )
                                  : (
                                    temaEscuro
                                      ? "rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300"
                                      : "rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                                  )
                              }
                            >
                              {canal.ativo
                                ? "Ativo"
                                : "Inativo"}
                            </span>

                            {dados
                              .permissoes
                              .podeGerenciar && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirEditarCanal(
                                      canal
                                    )
                                  }
                                  className={`ml-1 rounded-lg border px-3 py-1 text-xs font-semibold transition ${c.botaoSecundario}`}
                                >
                                  ✏️ Editar
                                </button>
                              )}
                          </div>

                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            <span
                              className={`text-sm ${c.texto}`}
                            >
                              {nomeTipo(
                                canal.tipo
                              )}
                            </span>

                            <span
                              className={`text-sm ${c.muted}`}
                            >
                              /{
                                canal.slug
                              }
                            </span>
                          </div>

                          {canal.descricao && (
                            <p
                              className={`mt-3 max-w-3xl text-sm leading-6 ${c.texto}`}
                            >
                              {
                                canal.descricao
                              }
                            </p>
                          )}

                          <p
                            className={`mt-3 text-xs ${c.muted}`}
                          >
                            Atualizado em{" "}
                            {formatarData(
                              canal.atualizadoEm
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-5 xl:w-[520px]">
                        {[
                          {
                            nome:
                              "Campanhas",

                            valor:
                              canal
                                ._count
                                .campanhas,
                          },

                          {
                            nome:
                              "Formulários",

                            valor:
                              canal
                                ._count
                                .formularios,
                          },

                          {
                            nome:
                              "Submissões",

                            valor:
                              canal
                                ._count
                                .submissoes,
                          },

                          {
                            nome:
                              "Regras",

                            valor:
                              canal
                                ._count
                                .regrasDistribuicao,
                          },

                          {
                            nome:
                              "Integrações",

                            valor:
                              canal
                                ._count
                                .integracoes,
                          },
                        ].map(
                          (
                            item
                          ) => (
                            <div
                              key={
                                item.nome
                              }
                              className={`rounded-xl border p-3 text-center ${c.subCard}`}
                            >
                              <p
                                className={`text-lg font-bold ${c.titulo}`}
                              >
                                {formatarNumero(
                                  item.valor
                                )}
                              </p>

                              <p
                                className={`mt-1 text-[11px] ${c.muted}`}
                              >
                                {
                                  item.nome
                                }
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {modalNovoAberto && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharNovoCanal();
            }
          }}
        >
          <div
            className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border p-5 shadow-2xl sm:p-6 ${c.card}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  className={`text-xl font-bold ${c.titulo}`}
                >
                  {canalEditando
                    ? "Editar canal de captação"
                    : "Novo canal de captação"}
                </h2>

                <p
                  className={`mt-1 text-sm ${c.muted}`}
                >
                  {canalEditando
                    ? "Atualize as configurações deste canal."
                    : "Defina uma origem pela qual os leads poderão chegar."}
                </p>

              </div>

              <button
                type="button"
                onClick={
                  fecharNovoCanal
                }
                disabled={
                  salvando
                }
                className={`flex h-9 w-9 items-center justify-center rounded-xl border text-lg ${c.botaoSecundario}`}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                salvarCanal
              }
              className="mt-6 space-y-5"
            >
              {erroFormulario && (
                <div
                  className={
                    temaEscuro
                      ? "rounded-2xl border border-red-900 bg-red-950/60 px-4 py-3 text-sm text-red-300"
                      : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  }
                >
                  {
                    erroFormulario
                  }
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className={`text-sm font-semibold ${c.titulo}`}
                  >
                    Nome *
                  </label>

                  <input
                    type="text"
                    maxLength={
                      150
                    }
                    value={
                      formulario.nome
                    }
                    onChange={(
                      event
                    ) =>
                      atualizarFormulario(
                        "nome",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Ex.: Site institucional"
                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-slate-500 ${c.input}`}
                    required
                  />
                </div>

                <div>
                  <label
                    className={`text-sm font-semibold ${c.titulo}`}
                  >
                    Tipo *
                  </label>

                  <select
                    value={
                      formulario.tipo
                    }
                    onChange={(
                      event
                    ) =>
                      atualizarFormulario(
                        "tipo",
                        event
                          .target
                          .value
                      )
                    }
                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-slate-500 ${c.input}`}
                    required
                  >
                    {dados
                      .tiposDisponiveis
                      .map(
                        (
                          tipo
                        ) => (
                          <option
                            key={
                              tipo
                            }
                            value={
                              tipo
                            }
                          >
                            {nomeTipo(
                              tipo
                            )}
                          </option>
                        )
                      )}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className={`text-sm font-semibold ${c.titulo}`}
                >
                  Descrição
                </label>

                <textarea
                  rows={4}
                  maxLength={
                    3000
                  }
                  value={
                    formulario.descricao
                  }
                  onChange={(
                    event
                  ) =>
                    atualizarFormulario(
                      "descricao",
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Explique como este canal é utilizado."
                  className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-slate-500 ${c.input}`}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className={`text-sm font-semibold ${c.titulo}`}
                  >
                    Identificador
                    personalizado
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.slug
                    }
                    onChange={(
                      event
                    ) =>
                      atualizarFormulario(
                        "slug",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Opcional — gerado pelo nome"
                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-slate-500 ${c.input}`}
                  />

                  <p
                    className={`mt-1 text-xs ${c.muted}`}
                  >
                    Se ficar vazio, o
                    PHANYX gera
                    automaticamente.
                  </p>
                </div>


              </div>

              <div>
                <label
                  className={`text-sm font-semibold ${c.titulo}`}
                >
                  Ícone
                </label>

                <select
                  value={formulario.icone}
                  onChange={(event) =>
                    atualizarFormulario(
                      "icone",
                      event.target.value
                    )
                  }
                  className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-slate-500 ${c.input}`}
                >
                  {OPCOES_ICONES_CANAL.map(
                    (opcao) => (
                      <option
                        key={`${opcao.valor}-${opcao.nome}`}
                        value={opcao.valor}
                      >
                        {opcao.icone} {opcao.nome}
                      </option>
                    )
                  )}
                </select>

                <p
                  className={`mt-1 text-xs ${c.muted}`}
                >
                  {formulario.icone
                    ? `Selecionado: ${formulario.icone}`
                    : `Automático: ${iconeTipo(formulario.tipo)}`}
                </p>
              </div>

              <div>
                <label
                  className={`text-sm font-semibold ${c.titulo}`}
                >
                  Cor de
                  identificação
                </label>

                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={
                      formulario.cor
                    }
                    onChange={(
                      event
                    ) =>
                      atualizarFormulario(
                        "cor",
                        event
                          .target
                          .value
                          .toUpperCase()
                      )
                    }
                    className="h-11 w-14 cursor-pointer rounded-xl border border-slate-300 bg-transparent p-1"
                  />

                  <input
                    type="text"
                    value={
                      formulario.cor
                    }
                    onChange={(
                      event
                    ) =>
                      atualizarFormulario(
                        "cor",
                        event
                          .target
                          .value
                      )
                    }
                    maxLength={
                      7
                    }
                    className={`w-32 rounded-xl border px-3 py-2.5 text-sm uppercase outline-none ${c.input}`}
                  />
                </div>
              </div>

              <div
                className={`space-y-3 rounded-2xl border p-4 ${c.subCard}`}
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={
                      formulario.padrao
                    }
                    onChange={(
                      event
                    ) =>
                      atualizarFormulario(
                        "padrao",
                        event
                          .target
                          .checked
                      )
                    }
                    className="mt-1 h-4 w-4"
                  />

                  <div>
                    <p
                      className={`text-sm font-semibold ${c.titulo}`}
                    >
                      Canal padrão
                    </p>

                    <p
                      className={`mt-1 text-xs ${c.muted}`}
                    >
                      Ao marcar, este
                      canal substitui
                      qualquer outro
                      canal padrão da
                      instituição.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={
                      formulario.ativo
                    }
                    onChange={(
                      event
                    ) =>
                      atualizarFormulario(
                        "ativo",
                        event
                          .target
                          .checked
                      )
                    }
                    className="mt-1 h-4 w-4"
                  />

                  <div>
                    <p
                      className={`text-sm font-semibold ${c.titulo}`}
                    >
                      Canal ativo
                    </p>

                    <p
                      className={`mt-1 text-xs ${c.muted}`}
                    >
                      Canais inativos
                      permanecem no
                      histórico, mas
                      deixam de ser
                      usados nas novas
                      configurações.
                    </p>
                  </div>
                </label>
              </div>

              <div
                className={`flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end ${c.divisoria}`}
              >
                <button
                  type="button"
                  onClick={
                    fecharNovoCanal
                  }
                  disabled={
                    salvando
                  }
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${c.botaoSecundario}`}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    salvando
                  }
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando
                    ? "Salvando..."
                    : canalEditando
                      ? "Salvar alterações"
                      : "Cadastrar canal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}