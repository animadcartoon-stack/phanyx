/*
 * PHANYX - Distribuição de Captação
 * Versão conservadora:
 * - preserva o fluxo original de criação/edição das regras;
 * - preserva os mesmos endpoints POST/PATCH/GET;
 * - preserva filtros, estratégias, critérios, equipes e responsáveis;
 * - adiciona internacionalização com next-intl;
 * - separa corretamente Claro / Escuro / Sistema;
 * - usa paleta azul apenas no tema Escuro;
 * - mantém o tema Sistema neutro;
 * - substitui selects do modal por seletor compatível com os três temas.
 */

"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";

type Tema = "light" | "dark" | "system";

type Estrategia =
  | "RODIZIO"
  | "MENOR_CARGA"
  | "ALEATORIA"
  | "RESPONSAVEL_FIXO"
  | "EQUIPE_SEM_RESPONSAVEL"
  | "MANUAL";

type Referencia = {
  id: number;
  nome: string;
};

type Regra = {
  id: number;
  nome: string;
  descricao?: string | null;
  estrategia: Estrategia;
  ordemPrioridade: number;
  maximoLeadsAbertosPorResponsavel?: number | null;
  somenteMembrosAtivos: boolean;
  respeitarDisponibilidade: boolean;
  ativo: boolean;
  canal?: Referencia | null;
  campanha?: Referencia | null;
  formulario?: {
    id: number;
    nome: string;
    titulo?: string | null;
  } | null;
  curso?: Referencia | null;
  polo?: Referencia | null;
  equipe?: Referencia | null;
  responsavelFixo?: {
    id: number;
    nome: string;
    cargo?: string | null;
  } | null;
  criadoEm?: string;
  atualizadoEm?: string;
};

type RespostaDistribuicao = {
  success: true;
  permissoes: {
    podeVer: boolean;
    podeGerenciar: boolean;
  };
  estrategiasDisponiveis: Estrategia[];
  resumo: {
    total: number;
    ativas: number;
    inativas: number;
  };
  referencias: {
    canais: Referencia[];
    campanhas: Referencia[];
    formularios: {
      id: number;
      nome: string;
      titulo?: string | null;
    }[];
    equipes: Referencia[];
    responsaveis: {
      id: number;
      nome: string;
      cargo?: string | null;
    }[];
    cursos: Referencia[];
    polos: Referencia[];
  };
  regras: Regra[];
};

type RespostaErro = {
  success?: false;
  error?: string;
  codigo?: string;
};

type OpcaoSeletor = {
  valor: string;
  rotulo: string;
};

const CHAVES_ESTRATEGIA: Record<
  Estrategia,
  {
    nome: string;
    descricao: string;
  }
> = {
  RODIZIO: {
    nome: "strategies.roundRobin.name",
    descricao: "strategies.roundRobin.description",
  },
  MENOR_CARGA: {
    nome: "strategies.lowestLoad.name",
    descricao: "strategies.lowestLoad.description",
  },
  ALEATORIA: {
    nome: "strategies.random.name",
    descricao: "strategies.random.description",
  },
  RESPONSAVEL_FIXO: {
    nome: "strategies.fixedOwner.name",
    descricao: "strategies.fixedOwner.description",
  },
  EQUIPE_SEM_RESPONSAVEL: {
    nome: "strategies.teamQueue.name",
    descricao: "strategies.teamQueue.description",
  },
  MANUAL: {
    nome: "strategies.manual.name",
    descricao: "strategies.manual.description",
  },
};

function SeletorTema({
  valor,
  opcoes,
  aoAlterar,
  temaEscuro,
  temaAzul,
  margem = "mt-2",
  ariaLabel,
}: {
  valor: string;
  opcoes: OpcaoSeletor[];
  aoAlterar: (valor: string) => void;
  temaEscuro: boolean;
  temaAzul: boolean;
  margem?: string;
  ariaLabel?: string;
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

    function fecharEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", fecharFora);
    document.addEventListener("keydown", fecharEscape);

    return () => {
      document.removeEventListener("mousedown", fecharFora);
      document.removeEventListener("keydown", fecharEscape);
    };
  }, [aberto]);

  const classeCampo = temaAzul
    ? "border-blue-900 bg-blue-950/70 text-blue-50 focus:ring-blue-800"
    : temaEscuro
      ? "border-neutral-600 bg-neutral-800 text-neutral-100 focus:ring-neutral-500"
      : "border-slate-300 bg-white text-slate-900 focus:ring-blue-200";

  const classeMenu = temaAzul
    ? "border-blue-900 bg-blue-950"
    : temaEscuro
      ? "border-neutral-600 bg-neutral-800"
      : "border-slate-300 bg-white";

  return (
    <div ref={raizRef} className={`relative ${margem}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={ariaLabel}
        onClick={() => setAberto((atual) => !atual)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm outline-none transition focus:ring-2 ${classeCampo}`}
      >
        <span className="min-w-0 truncate">
          {selecionada?.rotulo ?? "—"}
        </span>
        <span
          aria-hidden="true"
          className={`shrink-0 text-[10px] transition-transform ${
            aberto ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {aberto && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 top-full z-[220] mt-1 max-h-64 overflow-y-auto rounded-xl border p-1 shadow-2xl ${classeMenu}`}
        >
          {opcoes.map((opcao) => {
            const ativa = opcao.valor === valor;

            const classeOpcao = temaAzul
              ? ativa
                ? "bg-blue-900 text-white"
                : "bg-blue-950 text-blue-50 hover:bg-blue-900/70"
              : temaEscuro
                ? ativa
                  ? "bg-neutral-600 text-white"
                  : "bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
                : ativa
                  ? "bg-slate-200 text-slate-950"
                  : "bg-white text-slate-900 hover:bg-slate-100";

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
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${classeOpcao}`}
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

export default function DistribuicaoCaptacaoPage() {
  const t = useTranslations("AdminCommercialDistribution");
  const locale = useLocale();

  const [temaEscuro, setTemaEscuro] = useState(false);
  const [temaEscolhido, setTemaEscolhido] = useState<Tema>("light");

  const [dados, setDados] = useState<RespostaDistribuicao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [somenteAtivas, setSomenteAtivas] = useState(false);

  const [modalNovaRegraAberto, setModalNovaRegraAberto] = useState(false);
  const [regraEditandoId, setRegraEditandoId] = useState<number | null>(null);
  const [ativoRegra, setAtivoRegra] = useState(true);
  const [nomeNovaRegra, setNomeNovaRegra] = useState("");
  const [estrategiaNovaRegra, setEstrategiaNovaRegra] =
    useState<Estrategia>("RODIZIO");
  const [canalNovaRegra, setCanalNovaRegra] = useState("");
  const [campanhaNovaRegra, setCampanhaNovaRegra] = useState("");
  const [formularioNovaRegra, setFormularioNovaRegra] = useState("");
  const [cursoNovaRegra, setCursoNovaRegra] = useState("");
  const [poloNovaRegra, setPoloNovaRegra] = useState("");
  const [equipeNovaRegra, setEquipeNovaRegra] = useState("");
  const [responsavelNovaRegra, setResponsavelNovaRegra] = useState("");
  const [salvandoNovaRegra, setSalvandoNovaRegra] = useState(false);
  const [erroNovaRegra, setErroNovaRegra] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  useEffect(() => {
    const root = document.documentElement;

    function calcularTema() {
      const escolha = root.dataset.themeChoice;

      const temaSalvo =
        escolha === "light" || escolha === "dark" || escolha === "system"
          ? escolha
          : ((localStorage.getItem("phanyx_tema") || "light") as Tema);

      setTemaEscolhido(temaSalvo as Tema);
      setTemaEscuro(root.classList.contains("dark"));
    }

    calcularTema();

    const observador = new MutationObserver(calcularTema);

    observador.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-theme-choice"],
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", calcularTema);
    window.addEventListener("storage", calcularTema);

    return () => {
      observador.disconnect();
      media.removeEventListener("change", calcularTema);
      window.removeEventListener("storage", calcularTema);
    };
  }, []);

  const temaAzul = temaEscolhido === "dark";

  const c = useMemo(
    () => ({
      pagina: temaAzul
        ? "bg-[#020b2a] text-blue-50"
        : temaEscuro
          ? "bg-neutral-950 text-neutral-100"
          : "bg-slate-50 text-slate-900",

      card: temaAzul
        ? "border-blue-950 bg-[#0b1220]"
        : temaEscuro
          ? "border-neutral-700 bg-neutral-900"
          : "border-slate-200 bg-white",

      subCard: temaAzul
        ? "border-blue-900 bg-[#0f1a33]"
        : temaEscuro
          ? "border-neutral-700 bg-neutral-800"
          : "border-slate-200 bg-slate-50",

      titulo: temaAzul
        ? "text-blue-50"
        : temaEscuro
          ? "text-white"
          : "text-slate-950",

      texto: temaAzul
        ? "text-blue-100"
        : temaEscuro
          ? "text-neutral-200"
          : "text-slate-700",

      muted: temaAzul
        ? "text-blue-200/70"
        : temaEscuro
          ? "text-neutral-400"
          : "text-slate-600",

      divisoria: temaAzul
        ? "border-blue-950"
        : temaEscuro
          ? "border-neutral-700"
          : "border-slate-200",

      input: temaAzul
        ? "border-blue-900 bg-blue-950/70 text-blue-50 placeholder:text-blue-200/50 focus:border-blue-700 focus:ring-blue-900/70"
        : temaEscuro
          ? "border-neutral-600 bg-neutral-800 text-white placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-neutral-700"
          : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-100",

      botaoSecundario: temaAzul
        ? "border-blue-900 bg-[#0f1a33] text-blue-50 hover:bg-[#162447]"
        : temaEscuro
          ? "border-neutral-600 bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
          : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50",

      modal: temaAzul
        ? "border-blue-900 bg-[#071126]"
        : temaEscuro
          ? "border-neutral-700 bg-neutral-900"
          : "border-slate-200 bg-white",
    }),
    [temaAzul, temaEscuro]
  );

  function nomeEstrategia(estrategia: Estrategia) {
    return t(CHAVES_ESTRATEGIA[estrategia].nome);
  }

  function descricaoEstrategia(estrategia: Estrategia) {
    return t(CHAVES_ESTRATEGIA[estrategia].descricao);
  }

  function destinoRegra(regra: Regra) {
    if (
      regra.estrategia === "RESPONSAVEL_FIXO" &&
      regra.responsavelFixo
    ) {
      return regra.responsavelFixo.nome;
    }

    if (regra.equipe) {
      return regra.equipe.nome;
    }

    return t("rule.noSpecificDestination");
  }

  function criteriosRegra(regra: Regra) {
    const criterios: string[] = [];

    if (regra.canal?.nome) {
      criterios.push(
        t("criteria.channel", {
          name: regra.canal.nome,
        })
      );
    }

    if (regra.campanha?.nome) {
      criterios.push(
        t("criteria.campaign", {
          name: regra.campanha.nome,
        })
      );
    }

    if (regra.formulario) {
      criterios.push(
        t("criteria.form", {
          name: regra.formulario.titulo || regra.formulario.nome,
        })
      );
    }

    if (regra.curso?.nome) {
      criterios.push(
        t("criteria.course", {
          name: regra.curso.nome,
        })
      );
    }

    if (regra.polo?.nome) {
      criterios.push(
        t("criteria.unit", {
          name: regra.polo.nome,
        })
      );
    }

    return criterios;
  }

  const carregar = useCallback(
    async (silencioso = false) => {
      try {
        if (silencioso) {
          setAtualizando(true);
        } else {
          setCarregando(true);
        }

        setErro("");

        const resposta = await fetch(
          "/api/admin/comercial/captacao/distribuicao",
          {
            cache: "no-store",
          }
        );

        const json = (await resposta.json().catch(() => null)) as
          | RespostaDistribuicao
          | RespostaErro
          | null;

        if (!resposta.ok || !json || json.success !== true) {
          throw new Error(
            json && "error" in json
              ? json.error || t("errors.load")
              : t("errors.load")
          );
        }

        setDados(json);
      } catch (error) {
        setErro(error instanceof Error ? error.message : t("errors.load"));
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [t]
  );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const regrasFiltradas = useMemo(() => {
    if (!dados) {
      return [];
    }

    const termo = busca.trim().toLocaleLowerCase(locale);

    return dados.regras.filter((regra) => {
      if (somenteAtivas && !regra.ativo) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const texto = [
        regra.nome,
        regra.descricao,
        regra.canal?.nome,
        regra.campanha?.nome,
        regra.formulario?.titulo,
        regra.formulario?.nome,
        regra.curso?.nome,
        regra.polo?.nome,
        regra.equipe?.nome,
        regra.responsavelFixo?.nome,
        nomeEstrategia(regra.estrategia),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(locale);

      return texto.includes(termo);
    });
  }, [busca, dados, somenteAtivas, locale, t]);

  function abrirModalNovaRegra() {
    setRegraEditandoId(null);
    setNomeNovaRegra("");
    setEstrategiaNovaRegra("RODIZIO");
    setCanalNovaRegra("");
    setCampanhaNovaRegra("");
    setFormularioNovaRegra("");
    setCursoNovaRegra("");
    setPoloNovaRegra("");
    setEquipeNovaRegra("");
    setResponsavelNovaRegra("");
    setAtivoRegra(true);
    setErroNovaRegra("");
    setModalNovaRegraAberto(true);
  }

  function abrirModalEditarRegra(regra: Regra) {
    setRegraEditandoId(regra.id);
    setNomeNovaRegra(regra.nome || "");
    setEstrategiaNovaRegra(regra.estrategia);
    setCanalNovaRegra(regra.canal?.id ? String(regra.canal.id) : "");
    setCampanhaNovaRegra(
      regra.campanha?.id ? String(regra.campanha.id) : ""
    );
    setFormularioNovaRegra(
      regra.formulario?.id ? String(regra.formulario.id) : ""
    );
    setCursoNovaRegra(regra.curso?.id ? String(regra.curso.id) : "");
    setPoloNovaRegra(regra.polo?.id ? String(regra.polo.id) : "");
    setEquipeNovaRegra(regra.equipe?.id ? String(regra.equipe.id) : "");
    setResponsavelNovaRegra(
      regra.responsavelFixo?.id ? String(regra.responsavelFixo.id) : ""
    );
    setAtivoRegra(regra.ativo);
    setErroNovaRegra("");
    setModalNovaRegraAberto(true);
  }

  function fecharModalNovaRegra() {
    if (salvandoNovaRegra) {
      return;
    }

    setModalNovaRegraAberto(false);
    setErroNovaRegra("");
  }

  const estrategiaExigeEquipe =
    estrategiaNovaRegra === "RODIZIO" ||
    estrategiaNovaRegra === "MENOR_CARGA" ||
    estrategiaNovaRegra === "ALEATORIA" ||
    estrategiaNovaRegra === "EQUIPE_SEM_RESPONSAVEL";

  const estrategiaExigeResponsavel =
    estrategiaNovaRegra === "RESPONSAVEL_FIXO";

  const podeCriarNovaRegra =
    nomeNovaRegra.trim().length >= 3 &&
    (!estrategiaExigeEquipe || Boolean(equipeNovaRegra)) &&
    (!estrategiaExigeResponsavel || Boolean(responsavelNovaRegra));

  function idOuNull(valor: string) {
    if (!valor) {
      return null;
    }

    const numero = Number(valor);

    return Number.isFinite(numero) && numero > 0 ? numero : null;
  }

  async function criarNovaRegra() {
    if (!podeCriarNovaRegra || salvandoNovaRegra) {
      return;
    }

    const editando = regraEditandoId !== null;

    try {
      setSalvandoNovaRegra(true);
      setErroNovaRegra("");
      setMensagemSucesso("");

      const url = editando
        ? `/api/admin/comercial/captacao/distribuicao/${regraEditandoId}`
        : "/api/admin/comercial/captacao/distribuicao";

      const resposta = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nomeNovaRegra.trim(),
          estrategia: estrategiaNovaRegra,
          canalId: idOuNull(canalNovaRegra),
          campanhaId: idOuNull(campanhaNovaRegra),
          formularioId: idOuNull(formularioNovaRegra),
          cursoId: idOuNull(cursoNovaRegra),
          poloId: idOuNull(poloNovaRegra),
          equipeId: estrategiaExigeEquipe ? idOuNull(equipeNovaRegra) : null,
          responsavelFixoId: estrategiaExigeResponsavel
            ? idOuNull(responsavelNovaRegra)
            : null,
          ativo: editando ? ativoRegra : true,
        }),
      });

      const json = (await resposta.json().catch(() => null)) as
        | RespostaErro
        | {
            success?: boolean;
            message?: string;
          }
        | null;

      if (!resposta.ok) {
        throw new Error(
          json && "error" in json
            ? json.error || t("errors.save")
            : t("errors.save")
        );
      }

      setModalNovaRegraAberto(false);
      setRegraEditandoId(null);
      setErroNovaRegra("");
      setMensagemSucesso(
        editando ? t("success.updated") : t("success.created")
      );

      await carregar(true);
    } catch (error) {
      setErroNovaRegra(
        error instanceof Error ? error.message : t("errors.save")
      );
    } finally {
      setSalvandoNovaRegra(false);
    }
  }

  if (carregando) {
    return (
      <div
        className={`phanyx-captacao-distribuicao-page min-h-screen p-6 ${c.pagina}`}
      >
        <div className="mx-auto max-w-7xl">
          <div className={`rounded-3xl border p-8 shadow-sm ${c.card}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">🔄</span>
              <span className={`font-semibold ${c.texto}`}>
                {t("loading")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`phanyx-captacao-distribuicao-page min-h-screen p-6 ${c.pagina}`}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <section className={`rounded-3xl border p-6 shadow-sm ${c.card}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/admin/comercial/captacao"
                className={`text-sm font-semibold transition ${c.muted}`}
              >
                {t("header.back")}
              </Link>

              <div className="mt-3 flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-xl ${c.subCard}`}
                  aria-hidden="true"
                >
                  🔄
                </span>

                <h1
                  className={`text-3xl font-bold tracking-tight ${c.titulo}`}
                >
                  {t("header.title")}
                </h1>
              </div>

              <p className={`mt-3 max-w-3xl text-sm leading-6 ${c.texto}`}>
                {t("header.description")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void carregar(true)}
                disabled={atualizando}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${c.botaoSecundario}`}
              >
                {atualizando ? t("common.refreshing") : t("common.refresh")}
              </button>

              {dados?.permissoes.podeGerenciar && (
                <button
                  type="button"
                  onClick={abrirModalNovaRegra}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  {t("header.newRule")}
                </button>
              )}
            </div>
          </div>
        </section>

        {erro && (
          <div
            className={
              temaEscuro
                ? "rounded-2xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm font-medium text-red-200 shadow-sm"
                : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm"
            }
          >
            {erro}
          </div>
        )}

        {mensagemSucesso && (
          <div
            className={
              temaEscuro
                ? "rounded-2xl border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm font-semibold text-emerald-200"
                : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
            }
          >
            ✓ {mensagemSucesso}
          </div>
        )}

        {dados && (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: t("summary.total"),
                  value: dados.resumo.total,
                  helper: t("summary.totalHelp"),
                },
                {
                  label: t("summary.active"),
                  value: dados.resumo.ativas,
                  helper: t("summary.activeHelp"),
                },
                {
                  label: t("summary.inactive"),
                  value: dados.resumo.inativas,
                  helper: t("summary.inactiveHelp"),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
                >
                  <p className={`text-sm font-medium ${c.muted}`}>
                    {item.label}
                  </p>
                  <p className={`mt-1 text-3xl font-bold ${c.titulo}`}>
                    {item.value}
                  </p>
                  <p className={`mt-1 text-xs ${c.muted}`}>{item.helper}</p>
                </div>
              ))}
            </section>

            <section className={`rounded-3xl border p-5 shadow-sm ${c.card}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                  <label className={`text-sm font-semibold ${c.titulo}`}>
                    {t("filters.search")}
                  </label>

                  <input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder={t("filters.searchPlaceholder")}
                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm shadow-sm outline-none transition focus:ring-2 ${c.input}`}
                  />
                </div>

                <label
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition ${c.botaoSecundario}`}
                >
                  <input
                    type="checkbox"
                    checked={somenteAtivas}
                    onChange={(event) => setSomenteAtivas(event.target.checked)}
                    className="h-4 w-4"
                  />

                  {t("filters.onlyActive")}
                </label>
              </div>
            </section>

            <section
              className={`overflow-hidden rounded-3xl border shadow-sm ${c.card}`}
            >
              <div className={`border-b p-5 ${c.divisoria}`}>
                <h2 className={`text-xl font-bold ${c.titulo}`}>
                  {t("list.title")}
                </h2>

                <p className={`mt-1 text-sm ${c.muted}`}>
                  {t("list.results", {
                    count: regrasFiltradas.length,
                  })}
                </p>
              </div>

              {regrasFiltradas.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div
                    className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl ${c.subCard}`}
                  >
                    🔄
                  </div>

                  <h3 className={`mt-4 text-lg font-bold ${c.titulo}`}>
                    {t("list.emptyTitle")}
                  </h3>

                  <p
                    className={`mx-auto mt-2 max-w-xl text-sm leading-6 ${c.muted}`}
                  >
                    {t("list.emptyDescription")}
                  </p>

                  {dados.permissoes.podeGerenciar && (
                    <button
                      type="button"
                      onClick={abrirModalNovaRegra}
                      className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      {t("list.createFirst")}
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={`divide-y ${
                    temaAzul
                      ? "divide-blue-950"
                      : temaEscuro
                        ? "divide-neutral-700"
                        : "divide-slate-200"
                  }`}
                >
                  {regrasFiltradas.map((regra) => {
                    const criterios = criteriosRegra(regra);

                    return (
                      <article key={regra.id} className="p-5">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className={`text-lg font-bold ${c.titulo}`}>
                                {regra.nome}
                              </h3>

                              <span
                                className={
                                  regra.ativo
                                    ? temaEscuro
                                      ? "rounded-full border border-emerald-800 bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-emerald-300"
                                      : "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                    : temaAzul
                                      ? "rounded-full border border-blue-900 bg-[#0f1a33] px-2.5 py-1 text-xs font-semibold text-blue-100"
                                      : temaEscuro
                                        ? "rounded-full border border-neutral-600 bg-neutral-800 px-2.5 py-1 text-xs font-semibold text-neutral-200"
                                        : "rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                                }
                              >
                                {regra.ativo
                                  ? t("statuses.active")
                                  : t("statuses.inactive")}
                              </span>
                            </div>

                            {regra.descricao && (
                              <p className={`mt-2 text-sm leading-6 ${c.texto}`}>
                                {regra.descricao}
                              </p>
                            )}

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <div
                                className={`rounded-2xl border p-4 ${c.subCard}`}
                              >
                                <p
                                  className={`text-xs font-semibold uppercase tracking-wide ${c.muted}`}
                                >
                                  {t("rule.howToDistribute")}
                                </p>

                                <p className={`mt-1 font-bold ${c.titulo}`}>
                                  {nomeEstrategia(regra.estrategia)}
                                </p>

                                <p
                                  className={`mt-1 text-xs leading-5 ${c.muted}`}
                                >
                                  {descricaoEstrategia(regra.estrategia)}
                                </p>
                              </div>

                              <div
                                className={`rounded-2xl border p-4 ${c.subCard}`}
                              >
                                <p
                                  className={`text-xs font-semibold uppercase tracking-wide ${c.muted}`}
                                >
                                  {t("rule.destination")}
                                </p>

                                <p className={`mt-1 font-bold ${c.titulo}`}>
                                  {destinoRegra(regra)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4">
                              <p
                                className={`text-xs font-semibold uppercase tracking-wide ${c.muted}`}
                              >
                                {t("rule.whenApplies")}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2">
                                {criterios.length > 0 ? (
                                  criterios.map((criterio) => (
                                    <span
                                      key={criterio}
                                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${c.botaoSecundario}`}
                                    >
                                      {criterio}
                                    </span>
                                  ))
                                ) : (
                                  <span
                                    className={
                                      temaEscuro
                                        ? "rounded-full border border-blue-900 bg-blue-950 px-3 py-1.5 text-xs font-semibold text-blue-300"
                                        : "rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800"
                                    }
                                  >
                                    {t("rule.allNewLeads")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {dados.permissoes.podeGerenciar && (
                            <button
                              type="button"
                              onClick={() => abrirModalEditarRegra(regra)}
                              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition ${c.botaoSecundario}`}
                            >
                              {t("common.edit")}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {modalNovaRegraAberto &&
        dados &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[180] flex items-center justify-center bg-black/70 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                fecharModalNovaRegra();
              }
            }}
          >
            <div
              className={`max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border shadow-2xl ${c.modal}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-nova-regra"
            >
              <div
                className={`sticky top-0 z-20 flex items-start justify-between gap-4 border-b p-5 sm:p-6 ${c.divisoria} ${
                  temaAzul
                    ? "bg-[#071126]"
                    : temaEscuro
                      ? "bg-neutral-900"
                      : "bg-white"
                }`}
              >
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-[0.16em] ${c.muted}`}
                  >
                    {t("modal.kicker")}
                  </p>

                  <h2
                    id="titulo-nova-regra"
                    className={`mt-2 text-2xl font-bold ${c.titulo}`}
                  >
                    {regraEditandoId
                      ? t("modal.editTitle")
                      : t("modal.newTitle")}
                  </h2>

                  <p className={`mt-2 max-w-2xl text-sm leading-6 ${c.texto}`}>
                    {regraEditandoId
                      ? t("modal.editDescription")
                      : t("modal.newDescription")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fecharModalNovaRegra}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg ${c.botaoSecundario}`}
                  aria-label={t("common.close")}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <section className={`rounded-2xl border p-5 ${c.subCard}`}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      1
                    </span>
                    <div>
                      <h3 className={`font-bold ${c.titulo}`}>
                        {t("modal.identify.title")}
                      </h3>
                      <p className={`mt-1 text-sm ${c.muted}`}>
                        {t("modal.identify.description")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className={`text-sm font-semibold ${c.titulo}`}>
                      {t("modal.ruleName")}
                    </label>
                    <input
                      value={nomeNovaRegra}
                      onChange={(event) => setNomeNovaRegra(event.target.value)}
                      placeholder={t("modal.ruleNamePlaceholder")}
                      className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${c.input}`}
                    />
                  </div>

                  {regraEditandoId && (
                    <label
                      className={`mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${c.card}`}
                    >
                      <input
                        type="checkbox"
                        checked={ativoRegra}
                        onChange={(event) => setAtivoRegra(event.target.checked)}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <strong className={`block text-sm ${c.titulo}`}>
                          {ativoRegra
                            ? t("modal.activeRule")
                            : t("modal.pausedRule")}
                        </strong>
                        <small className={`mt-1 block text-xs ${c.muted}`}>
                          {ativoRegra
                            ? t("modal.activeRuleHelp")
                            : t("modal.pausedRuleHelp")}
                        </small>
                      </span>
                    </label>
                  )}
                </section>

                <section className={`rounded-2xl border p-5 ${c.subCard}`}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      2
                    </span>
                    <div>
                      <h3 className={`font-bold ${c.titulo}`}>
                        {t("modal.criteria.title")}
                      </h3>
                      <p className={`mt-1 text-sm ${c.muted}`}>
                        {t("modal.criteria.description")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={`text-sm font-semibold ${c.titulo}`}>
                        {t("fields.channel")}
                      </label>
                      <SeletorTema
                        valor={canalNovaRegra}
                        aoAlterar={setCanalNovaRegra}
                        temaEscuro={temaEscuro}
                        temaAzul={temaAzul}
                        ariaLabel={t("fields.channel")}
                        opcoes={[
                          {
                            valor: "",
                            rotulo: t("options.anyChannel"),
                          },
                          ...dados.referencias.canais.map((item) => ({
                            valor: String(item.id),
                            rotulo: item.nome,
                          })),
                        ]}
                      />
                    </div>

                    <div>
                      <label className={`text-sm font-semibold ${c.titulo}`}>
                        {t("fields.campaign")}
                      </label>
                      <SeletorTema
                        valor={campanhaNovaRegra}
                        aoAlterar={setCampanhaNovaRegra}
                        temaEscuro={temaEscuro}
                        temaAzul={temaAzul}
                        ariaLabel={t("fields.campaign")}
                        opcoes={[
                          {
                            valor: "",
                            rotulo: t("options.anyCampaign"),
                          },
                          ...dados.referencias.campanhas.map((item) => ({
                            valor: String(item.id),
                            rotulo: item.nome,
                          })),
                        ]}
                      />
                    </div>

                    <div>
                      <label className={`text-sm font-semibold ${c.titulo}`}>
                        {t("fields.form")}
                      </label>
                      <SeletorTema
                        valor={formularioNovaRegra}
                        aoAlterar={setFormularioNovaRegra}
                        temaEscuro={temaEscuro}
                        temaAzul={temaAzul}
                        ariaLabel={t("fields.form")}
                        opcoes={[
                          {
                            valor: "",
                            rotulo: t("options.anyForm"),
                          },
                          ...dados.referencias.formularios.map((item) => ({
                            valor: String(item.id),
                            rotulo: item.titulo || item.nome,
                          })),
                        ]}
                      />
                    </div>

                    <div>
                      <label className={`text-sm font-semibold ${c.titulo}`}>
                        {t("fields.course")}
                      </label>
                      <SeletorTema
                        valor={cursoNovaRegra}
                        aoAlterar={setCursoNovaRegra}
                        temaEscuro={temaEscuro}
                        temaAzul={temaAzul}
                        ariaLabel={t("fields.course")}
                        opcoes={[
                          {
                            valor: "",
                            rotulo: t("options.anyCourse"),
                          },
                          ...dados.referencias.cursos.map((item) => ({
                            valor: String(item.id),
                            rotulo: item.nome,
                          })),
                        ]}
                      />
                    </div>

                    <div>
                      <label className={`text-sm font-semibold ${c.titulo}`}>
                        {t("fields.unit")}
                      </label>
                      <SeletorTema
                        valor={poloNovaRegra}
                        aoAlterar={setPoloNovaRegra}
                        temaEscuro={temaEscuro}
                        temaAzul={temaAzul}
                        ariaLabel={t("fields.unit")}
                        opcoes={[
                          {
                            valor: "",
                            rotulo: t("options.anyUnit"),
                          },
                          ...dados.referencias.polos.map((item) => ({
                            valor: String(item.id),
                            rotulo: item.nome,
                          })),
                        ]}
                      />
                    </div>
                  </div>
                </section>

                <section className={`rounded-2xl border p-5 ${c.subCard}`}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      3
                    </span>
                    <div>
                      <h3 className={`font-bold ${c.titulo}`}>
                        {t("modal.distribution.title")}
                      </h3>
                      <p className={`mt-1 text-sm ${c.muted}`}>
                        {t("modal.distribution.description")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {dados.estrategiasDisponiveis.map((estrategia) => {
                      const selecionada = estrategiaNovaRegra === estrategia;

                      return (
                        <button
                          key={estrategia}
                          type="button"
                          onClick={() => setEstrategiaNovaRegra(estrategia)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            selecionada
                              ? temaAzul
                                ? "border-blue-500 bg-blue-900/40 ring-2 ring-blue-800"
                                : temaEscuro
                                  ? "border-blue-500 bg-neutral-800 ring-2 ring-blue-900"
                                  : "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                              : `${c.card} hover:-translate-y-0.5`
                          }`}
                        >
                          <strong className={`block text-sm ${c.titulo}`}>
                            {nomeEstrategia(estrategia)}
                          </strong>
                          <span className={`mt-1 block text-xs leading-5 ${c.muted}`}>
                            {descricaoEstrategia(estrategia)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {estrategiaNovaRegra === "RESPONSAVEL_FIXO" ? (
                  <section className={`rounded-2xl border p-5 ${c.subCard}`}>
                    <label className={`text-sm font-semibold ${c.titulo}`}>
                      {t("fields.owner")}
                    </label>
                    <SeletorTema
                      valor={responsavelNovaRegra}
                      aoAlterar={setResponsavelNovaRegra}
                      temaEscuro={temaEscuro}
                      temaAzul={temaAzul}
                      ariaLabel={t("fields.owner")}
                      opcoes={[
                        {
                          valor: "",
                          rotulo: t("options.selectPerson"),
                        },
                        ...dados.referencias.responsaveis.map((item) => ({
                          valor: String(item.id),
                          rotulo: item.cargo
                            ? `${item.nome} — ${item.cargo}`
                            : item.nome,
                        })),
                      ]}
                    />
                  </section>
                ) : estrategiaNovaRegra !== "MANUAL" ? (
                  <section className={`rounded-2xl border p-5 ${c.subCard}`}>
                    <label className={`text-sm font-semibold ${c.titulo}`}>
                      {t("fields.team")}
                    </label>
                    <SeletorTema
                      valor={equipeNovaRegra}
                      aoAlterar={setEquipeNovaRegra}
                      temaEscuro={temaEscuro}
                      temaAzul={temaAzul}
                      ariaLabel={t("fields.team")}
                      opcoes={[
                        {
                          valor: "",
                          rotulo: t("options.selectTeam"),
                        },
                        ...dados.referencias.equipes.map((item) => ({
                          valor: String(item.id),
                          rotulo: item.nome,
                        })),
                      ]}
                    />
                  </section>
                ) : null}

                {erroNovaRegra && (
                  <div
                    className={
                      temaEscuro
                        ? "rounded-xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm font-semibold text-red-200"
                        : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                    }
                  >
                    {erroNovaRegra}
                  </div>
                )}
              </div>

              <div
                className={`sticky bottom-0 z-20 flex flex-col-reverse gap-3 border-t p-5 sm:flex-row sm:justify-end sm:p-6 ${c.divisoria} ${
                  temaAzul
                    ? "bg-[#071126]"
                    : temaEscuro
                      ? "bg-neutral-900"
                      : "bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={fecharModalNovaRegra}
                  disabled={salvandoNovaRegra}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${c.botaoSecundario}`}
                >
                  {t("common.cancel")}
                </button>

                <button
                  type="button"
                  onClick={() => void criarNovaRegra()}
                  disabled={!podeCriarNovaRegra || salvandoNovaRegra}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvandoNovaRegra
                    ? regraEditandoId
                      ? t("common.saving")
                      : t("common.creating")
                    : regraEditandoId
                      ? t("common.saveChanges")
                      : t("common.createRule")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}