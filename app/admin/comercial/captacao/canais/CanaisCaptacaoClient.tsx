"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";

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
    chave: "icons.automatic",
  },
  {
    valor: "🌐",
    icone: "🌐",
    chave: "icons.site",
  },
  {
    valor: "🖥️",
    icone: "🖥️",
    chave: "icons.landingPage",
  },
  {
    valor: "📝",
    icone: "📝",
    chave: "icons.form",
  },
  {
    valor: "📘",
    icone: "📘",
    chave: "icons.meta",
  },
  {
    valor: "🔎",
    icone: "🔎",
    chave: "icons.google",
  },
  {
    valor: "💬",
    icone: "💬",
    chave: "icons.whatsapp",
  },
  {
    valor: "📱",
    icone: "📱",
    chave: "icons.socialNetworks",
  },
  {
    valor: "📞",
    icone: "📞",
    chave: "icons.phone",
  },
  {
    valor: "✉️",
    icone: "✉️",
    chave: "icons.email",
  },
  {
    valor: "🤝",
    icone: "🤝",
    chave: "icons.referral",
  },
  {
    valor: "🎪",
    icone: "🎪",
    chave: "icons.event",
  },
  {
    valor: "🔗",
    icone: "🔗",
    chave: "icons.partnership",
  },
  {
    valor: "🎯",
    icone: "🎯",
    chave: "icons.campaign",
  },
  {
    valor: "📤",
    icone: "📤",
    chave: "icons.import",
  },
  {
    valor: "⚙️",
    icone: "⚙️",
    chave: "icons.api",
  },
  {
    valor: "📡",
    icone: "📡",
    chave: "icons.integration",
  },
  {
    valor: "🏫",
    icone: "🏫",
    chave: "icons.institutional",
  },
  {
    valor: "👥",
    icone: "👥",
    chave: "icons.people",
  },
  {
    valor: "📣",
    icone: "📣",
    chave: "icons.promotion",
  },
];

function formatarNumero(
  valor: number,
  locale: string
) {
  return new Intl.NumberFormat(
    locale
  ).format(
    Number(valor || 0)
  );
}

function formatarData(
  valor: string,
  locale: string
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
    locale,
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

const CHAVES_TIPO: Record<string, string> = {
  SITE: "types.site",
  LANDING_PAGE: "types.landingPage",
  FORMULARIO: "types.form",
  META_ADS: "types.metaAds",
  GOOGLE_ADS: "types.googleAds",
  WHATSAPP: "types.whatsapp",
  INDICACAO: "types.referral",
  EVENTO: "types.event",
  PARCERIA: "types.partnership",
  IMPORTACAO: "types.import",
  API: "types.api",
  OUTRO: "types.other",
};

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

type OpcaoSeletor = {
  valor: string;
  rotulo: string;
};

function SeletorCinza({
  valor,
  opcoes,
  aoAlterar,
  temaEscuro,
  temaAzul,
  margem = "mt-1",
}: {
  valor: string;
  opcoes: OpcaoSeletor[];
  aoAlterar: (valor: string) => void;
  temaEscuro: boolean;
  temaAzul: boolean;
  margem?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);
  const selecionada =
    opcoes.find((opcao) => opcao.valor === valor) ?? opcoes[0];

  useEffect(() => {
    if (!aberto) return;

    function fecharFora(event: MouseEvent) {
      if (
        raizRef.current &&
        !raizRef.current.contains(event.target as Node)
      ) {
        setAberto(false);
      }
    }

    function fecharEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setAberto(false);
    }

    document.addEventListener("mousedown", fecharFora);
    document.addEventListener("keydown", fecharEscape);

    return () => {
      document.removeEventListener("mousedown", fecharFora);
      document.removeEventListener("keydown", fecharEscape);
    };
  }, [aberto]);

  return (
    <div ref={raizRef} className={`relative ${margem}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm outline-none focus:ring-2 focus:ring-neutral-400 ${temaAzul
          ? "border-blue-900 bg-blue-950/70 text-blue-50"
          : temaEscuro
            ? "border-neutral-600 bg-neutral-800 text-neutral-100"
            : "border-slate-300 bg-slate-50 text-slate-900"
          }`}
      >
        <span className="min-w-0 truncate">{selecionada?.rotulo ?? "—"}</span>
        <span
          aria-hidden="true"
          className={`shrink-0 text-[10px] transition-transform ${aberto ? "rotate-180" : ""
            }`}
        >
          ▼
        </span>
      </button>

      {aberto && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 top-full z-[160] mt-1 max-h-64 overflow-y-auto rounded-xl border p-1 shadow-2xl ${temaAzul
            ? "border-blue-900 bg-blue-950"
            : temaEscuro
              ? "border-neutral-600 bg-neutral-800"
              : "border-slate-300 bg-neutral-100"
            }`}
        >
          {opcoes.map((opcao) => {
            const ativa = opcao.valor === valor;

            return (
              <button
                key={`${opcao.valor}-${opcao.rotulo}`}
                type="button"
                role="option"
                aria-selected={ativa}
                onClick={() => {
                  aoAlterar(opcao.valor);
                  setAberto(false);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${temaAzul
                    ? ativa
                      ? "bg-blue-900 text-white"
                      : "bg-blue-950 text-blue-50 hover:bg-blue-900/70"
                    : temaEscuro
                      ? ativa
                        ? "bg-neutral-600 text-white"
                        : "bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
                      : ativa
                        ? "bg-neutral-300 text-neutral-950"
                        : "bg-neutral-100 text-neutral-950 hover:bg-neutral-200"
                  }`}
              >
                {opcao.rotulo}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CanaisCaptacaoClient() {
  const t = useTranslations("AdminCommercialChannels");
  const locale = useLocale();

  function rotuloTipo(tipo: string) {
    const chave = CHAVES_TIPO[tipo];
    return chave ? t(chave) : tipo;
  }
  const [
    temaEscuro,
    setTemaEscuro,
  ] =
    useState(false);

  const [
    temaEscolhido,
    setTemaEscolhido,
  ] =
    useState<Tema>("light");

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
    const root =
      document.documentElement;

    function calcularTema() {
      const escolha =
        document.documentElement
          .dataset
          .themeChoice;

      const temaSalvo =
        (
          escolha === "light" ||
          escolha === "dark" ||
          escolha === "system"
        )
          ? escolha
          : (
            localStorage.getItem(
              "phanyx_tema"
            ) ||
            "light"
          );

      setTemaEscolhido(
        temaSalvo as Tema
      );

      setTemaEscuro(
        document
          .documentElement
          .classList
          .contains("dark")
      );
    }
    calcularTema();

    const observador =
      new MutationObserver(() => {
        calcularTema();
      });

    observador.observe(
      root,
      {
        attributes: true,
        attributeFilter: [
          "class",
          "data-theme",
          "data-theme-choice",
        ],
      }
    );

    const media =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    media.addEventListener(
      "change",
      calcularTema
    );

    window.addEventListener(
      "storage",
      calcularTema
    );

    return () => {
      observador.disconnect();

      media.removeEventListener(
        "change",
        calcularTema
      );

      window.removeEventListener(
        "storage",
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

  const temaAzul =
    temaEscolhido === "dark";

  const c =
    useMemo(
      () => ({
        pagina:
          temaAzul
            ? "bg-[#020b2a] text-blue-50"
            : temaEscuro
              ? "bg-neutral-950 text-neutral-100"
              : "bg-slate-100 text-slate-900",

        card:
          temaAzul
            ? "border-blue-950 bg-[#0b1220]"
            : temaEscuro
              ? "border-neutral-700 bg-neutral-900"
              : "border-slate-200 bg-white",

        subCard:
          temaAzul
            ? "border-blue-900 bg-[#0f1a33]"
            : temaEscuro
              ? "border-neutral-700 bg-neutral-800"
              : "border-slate-200 bg-slate-50",

        titulo:
          temaAzul
            ? "text-blue-50"
            : temaEscuro
              ? "text-white"
              : "text-slate-900",

        texto:
          temaAzul
            ? "text-blue-100"
            : temaEscuro
              ? "text-neutral-200"
              : "text-slate-700",

        muted:
          temaAzul
            ? "text-blue-200/70"
            : temaEscuro
              ? "text-neutral-400"
              : "text-slate-500",

        divisoria:
          temaAzul
            ? "border-blue-950"
            : temaEscuro
              ? "border-neutral-700"
              : "border-slate-200",

        input:
          temaAzul
            ? "border-blue-900 bg-blue-950/70 text-blue-50 placeholder:text-blue-200/50"
            : temaEscuro
              ? "border-neutral-600 bg-neutral-800 text-white placeholder:text-neutral-400"
              : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400",

        botaoSecundario:
          temaAzul
            ? "border-blue-900 bg-[#0f1a33] text-blue-50 hover:bg-[#162447]"
            : temaEscuro
              ? "border-neutral-600 bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",

        botaoPrimario:
          temaEscuro
            ? "bg-emerald-500 text-white hover:bg-emerald-400"
            : "bg-slate-900 text-white hover:bg-slate-800",
      }),
      [
        temaEscuro,
        temaAzul,
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
              t("errors.load")
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
              : t("errors.load")
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
        t,
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
        t("errors.nameRequired")
      );

      return;
    }

    if (
      !formulario.tipo
    ) {
      setErroFormulario(
        t("errors.typeRequired")
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
              ? t("errors.update")
              : t("errors.create")
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
              ? t("success.updated")
              : t("success.created")
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
          : t("errors.save")
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
            {t("errorPage.title")}
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
            {t("errorPage.retry")}
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
                {t("header.back")}
              </Link>

              <h1
                className={`mt-3 text-2xl font-bold sm:text-3xl ${c.titulo}`}
              >
                {t("header.title")}
              </h1>

              <p
                className={`mt-2 max-w-3xl text-sm leading-6 ${c.texto}`}
              >
                {t("header.description")}
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
                  ? t("common.refreshing")
                  : t("common.refresh")}
              </button>

              {dados
                .permissoes
                .podeGerenciar && (
                  <button
                    type="button"
                    onClick={
                      abrirNovoCanal
                    }
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${c.botaoPrimario}`}
                  >
                    {t("header.newChannel")}
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
              {t("summary.total")}
            </p>

            <p
              className={`mt-2 text-3xl font-bold ${c.titulo}`}
            >
              {formatarNumero(
                dados.resumo.total,
                locale
              )}
            </p>
          </div>

          <div
            className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
          >
            <p
              className={`text-sm ${c.muted}`}
            >
              {t("summary.active")}
            </p>

            <p
              className={`mt-2 text-3xl font-bold ${c.titulo}`}
            >
              {formatarNumero(
                dados.resumo.ativos,
                locale
              )}
            </p>
          </div>

          <div
            className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
          >
            <p
              className={`text-sm ${c.muted}`}
            >
              {t("summary.default")}
            </p>

            <p
              className={`mt-2 truncate text-lg font-bold ${c.titulo}`}
            >
              {dados.resumo
                .padrao
                ?.nome ||
                t("summary.notDefined")}
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
                {t("filters.search")}
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
                placeholder={t("filters.searchPlaceholder")}
                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-slate-500 ${c.input}`}
              />
            </div>

            <div>
              <label
                className={`text-xs font-semibold ${c.muted}`}
              >
                {t("filters.type")}
              </label>

              <SeletorCinza
                valor={tipoFiltro}
                aoAlterar={setTipoFiltro}
                temaEscuro={temaEscuro}
                temaAzul={temaAzul}
                opcoes={[
                  {
                    valor: "",
                    rotulo: t("common.all"),
                  },
                  ...dados.tiposDisponiveis.map((tipo) => ({
                    valor: tipo,
                    rotulo: rotuloTipo(tipo),
                  })),
                ]}
              />
            </div>

            <div>
              <label
                className={`text-xs font-semibold ${c.muted}`}
              >
                {t("filters.situation")}
              </label>

              <SeletorCinza
                valor={ativoFiltro}
                aoAlterar={setAtivoFiltro}
                temaEscuro={temaEscuro}
                temaAzul={temaAzul}
                opcoes={[
                  {
                    valor: "",
                    rotulo: t("common.all"),
                  },
                  {
                    valor: "true",
                    rotulo: t("filters.active"),
                  },
                  {
                    valor: "false",
                    rotulo: t("filters.inactive"),
                  },
                ]}
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${c.botaoPrimario}`}
              >
                {t("filters.apply")}
              </button>

              <button
                type="button"
                onClick={
                  limparFiltros
                }
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${c.botaoSecundario}`}
              >
                {t("filters.clear")}
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
              {t("list.title")}
            </h2>

            <p
              className={`mt-1 text-sm ${c.muted}`}
            >
              {formatarNumero(
                dados.canais.length,
                locale
              )}{" "}
              {t("list.results", {
                count: dados.canais.length,
              })}
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
                {t("list.emptyTitle")}
              </p>

              <p
                className={`mt-1 text-sm ${c.muted}`}
              >
                {t("list.emptyDescription")}
              </p>

              {dados
                .permissoes
                .podeGerenciar && (
                  <button
                    type="button"
                    onClick={
                      abrirNovoCanal
                    }
                    className={`mt-5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${c.botaoPrimario}`}
                  >
                    {t("list.createChannel")}
                  </button>
                )}
            </div>
          ) : (
            <div className={`divide-y ${temaEscuro ? "divide-neutral-700" : "divide-slate-200"}`}>
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
                                {t("statuses.default")}
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
                                      ? "rounded-full border border-neutral-600 bg-neutral-800 px-2.5 py-1 text-xs font-semibold text-neutral-200"
                                      : "rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                                  )
                              }
                            >
                              {canal.ativo
                                ? t("statuses.active")
                                : t("statuses.inactive")}
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
                                  {t("common.edit")}
                                </button>
                              )}
                          </div>

                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            <span
                              className={`text-sm ${c.texto}`}
                            >
                              {rotuloTipo(
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
                            {t("card.updatedAt", {
                              date: formatarData(
                                canal.atualizadoEm,
                                locale
                              ),
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-5 xl:w-[520px]">
                        {[
                          {
                            nome:
                              t("counts.campaigns"),

                            valor:
                              canal
                                ._count
                                .campanhas,
                          },

                          {
                            nome:
                              t("counts.forms"),

                            valor:
                              canal
                                ._count
                                .formularios,
                          },

                          {
                            nome:
                              t("counts.submissions"),

                            valor:
                              canal
                                ._count
                                .submissoes,
                          },

                          {
                            nome:
                              t("counts.rules"),

                            valor:
                              canal
                                ._count
                                .regrasDistribuicao,
                          },

                          {
                            nome:
                              t("counts.integrations"),

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
                                  item.valor,
                                  locale
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
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
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
                    ? t("modal.editTitle")
                    : t("modal.newTitle")}
                </h2>

                <p
                  className={`mt-1 text-sm ${c.muted}`}
                >
                  {canalEditando
                    ? t("modal.editDescription")
                    : t("modal.newDescription")}
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
                aria-label={t("common.close")}
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
                    {t("modal.name")} *
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
                    placeholder={t("modal.namePlaceholder")}
                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-slate-500 ${c.input}`}
                    required
                  />
                </div>

                <div>
                  <label
                    className={`text-sm font-semibold ${c.titulo}`}
                  >
                    {t("modal.type")} *
                  </label>

                  <SeletorCinza
                    margem="mt-2"
                    valor={formulario.tipo}
                    aoAlterar={(valor) =>
                      atualizarFormulario("tipo", valor)
                    }
                    temaEscuro={temaEscuro}
                    temaAzul={temaAzul}
                    opcoes={dados.tiposDisponiveis.map((tipo) => ({
                      valor: tipo,
                      rotulo: rotuloTipo(tipo),
                    }))}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`text-sm font-semibold ${c.titulo}`}
                >
                  {t("modal.description")}
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
                  placeholder={t("modal.descriptionPlaceholder")}
                  className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-slate-500 ${c.input}`}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className={`text-sm font-semibold ${c.titulo}`}
                  >
                    {t("modal.slug")}
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
                    placeholder={t("modal.slugPlaceholder")}
                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-slate-500 ${c.input}`}
                  />

                  <p
                    className={`mt-1 text-xs ${c.muted}`}
                  >
                    {t("modal.slugHelp")}
                  </p>
                </div>


              </div>

              <div>
                <label
                  className={`text-sm font-semibold ${c.titulo}`}
                >
                  {t("modal.icon")}
                </label>

                <SeletorCinza
                  margem="mt-2"
                  valor={formulario.icone}
                  aoAlterar={(valor) =>
                    atualizarFormulario("icone", valor)
                  }
                  temaEscuro={temaEscuro}
                  temaAzul={temaAzul}
                  opcoes={OPCOES_ICONES_CANAL.map((opcao) => ({
                    valor: opcao.valor,
                    rotulo: `${opcao.icone} ${t(opcao.chave)}`,
                  }))}
                />

                <p
                  className={`mt-1 text-xs ${c.muted}`}
                >
                  {formulario.icone
                    ? t("modal.iconSelected", {
                      icon: formulario.icone,
                    })
                    : t("modal.iconAutomatic", {
                      icon: iconeTipo(formulario.tipo),
                    })}
                </p>
              </div>

              <div>
                <label
                  className={`text-sm font-semibold ${c.titulo}`}
                >
                  {t("modal.color")}
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
                      {t("modal.defaultChannel")}
                    </p>

                    <p
                      className={`mt-1 text-xs ${c.muted}`}
                    >
                      {t("modal.defaultHelp")}
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
                      {t("modal.activeChannel")}
                    </p>

                    <p
                      className={`mt-1 text-xs ${c.muted}`}
                    >
                      {t("modal.activeHelp")}
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
                  {t("common.cancel")}
                </button>

                <button
                  type="submit"
                  disabled={
                    salvando
                  }
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${c.botaoPrimario}`}
                >
                  {salvando
                    ? t("common.saving")
                    : canalEditando
                      ? t("common.saveChanges")
                      : t("common.createChannel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
