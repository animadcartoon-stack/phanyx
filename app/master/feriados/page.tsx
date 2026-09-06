"use client";

import Link from "next/link";
import BandeiraPais from "@/components/internacionalizacao/BandeiraPais";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCountries, type CountryCode } from "libphonenumber-js";
import { useLocale, useTranslations } from "next-intl";

const LOCALES = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"] as const;

type LocaleSuportado = (typeof LOCALES)[number];

type StatusFeriado = "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";

type TipoFeriado = "NACIONAL" | "REGIONAL" | "LOCAL";

type Traducao = {
  id?: number;
  locale: string;
  nome: string;
  titulo: string;
  mensagem: string;
};

type Feriado = {
  id: number;

  paisCodigo: string;
  regiaoCodigo: string | null;
  cidade: string | null;

  dataFeriado: string;
  inicioExibicao: string;
  fimExibicao: string;

  tipo: TipoFeriado;
  status: StatusFeriado;

  prioridade: number;
  emoji: string | null;

  criadoPorId: number | null;
  atualizadoPorId: number | null;
  publicadoPorId: number | null;

  criadoEm: string;
  atualizadoEm: string;
  publicadoEm: string | null;

  traducoes: Traducao[];
};

type RespostaApi = {
  ok?: boolean;
  feriados?: Feriado[];
  feriado?: Feriado;
  total?: number;
  excluido?: boolean;
  id?: number;
  code?: string;
  error?: string;
};

type ConteudoTraducao = {
  nome: string;
  titulo: string;
  mensagem: string;
};

type EstadoFormulario = {
  paisCodigo: string;
  regiaoCodigo: string;
  cidade: string;

  dataFeriado: string;
  inicioExibicao: string;
  fimExibicao: string;

  tipo: TipoFeriado;
  prioridade: string;
  emoji: string;

  traducoes: Record<LocaleSuportado, ConteudoTraducao>;
};

function traducoesVazias(): Record<LocaleSuportado, ConteudoTraducao> {
  return {
    "pt-BR": {
      nome: "",
      titulo: "",
      mensagem: "",
    },
    "pt-PT": {
      nome: "",
      titulo: "",
      mensagem: "",
    },
    "en-US": {
      nome: "",
      titulo: "",
      mensagem: "",
    },
    "es-ES": {
      nome: "",
      titulo: "",
      mensagem: "",
    },
    "fr-FR": {
      nome: "",
      titulo: "",
      mensagem: "",
    },
  };
}

function formularioVazio(): EstadoFormulario {
  return {
    paisCodigo: "",
    regiaoCodigo: "",
    cidade: "",

    dataFeriado: "",
    inicioExibicao: "",
    fimExibicao: "",

    tipo: "NACIONAL",
    prioridade: "0",
    emoji: "",

    traducoes: traducoesVazias(),
  };
}

function dataInput(valor: string | null | undefined) {
  if (!valor) {
    return "";
  }

  return valor.slice(0, 10);
}

function normalizarLocale(locale: string): LocaleSuportado {
  if (LOCALES.includes(locale as LocaleSuportado)) {
    return locale as LocaleSuportado;
  }

  return "pt-BR";
}

const ICONES_RAPIDOS = [
  "📅",
  "🎉",
  "🏛️",
  "⭐",
  "🎓",
] as const;

function usarBandeiraDoPais(
  valor: string | null | undefined
) {
  const atual = String(
    valor || ""
  ).trim();

  return (
    !atual ||
    /^[A-Za-z]{2}$/.test(atual)
  );
}

function normalizarIconeSalvo(
  valor: string | null | undefined
) {
  const atual = String(
    valor || ""
  ).trim();

  // Registros antigos salvos como BR, FR, US etc.
  // passam a usar automaticamente a bandeira gráfica.
  if (
    !atual ||
    /^[A-Za-z]{2}$/.test(atual)
  ) {
    return "";
  }

  return atual;
}

export default function MasterFeriadosPage() {
  const t = useTranslations("MasterHolidays");

  const locale = useLocale();

  const localeAtual = normalizarLocale(locale);

  const [montado, setMontado] = useState(false);

  const [feriados, setFeriados] = useState<Feriado[]>([]);

  const [carregando, setCarregando] = useState(true);

  const [salvando, setSalvando] = useState(false);

  const [acaoId, setAcaoId] = useState<number | null>(null);

  const [erro, setErro] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const [paisFiltro, setPaisFiltro] = useState("");

  const [statusFiltro, setStatusFiltro] = useState("");

  const [anoFiltro, setAnoFiltro] = useState("");

  const [modalAberto, setModalAberto] = useState(false);

  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [form, setForm] = useState<EstadoFormulario>(formularioVazio());

  const [localeAtivo, setLocaleAtivo] = useState<LocaleSuportado>(localeAtual);

  const [excluirFeriado, setExcluirFeriado] = useState<Feriado | null>(null);

  const nomesPaises = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], {
        type: "region",
      });
    } catch {
      return new Intl.DisplayNames(["pt-BR"], {
        type: "region",
      });
    }
  }, [locale]);

  const paises = useMemo(() => {
    if (!montado) {
      return [];
    }

    return getCountries()
      .map((codigo) => ({
        codigo,
        nome: nomesPaises.of(codigo) || codigo,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, locale));
  }, [locale, montado, nomesPaises]);

  const nomePais = useCallback(
    (codigo: string) => {
      if (!montado) {
        return codigo;
      }

      return nomesPaises.of(codigo as CountryCode) || codigo;
    },
    [montado, nomesPaises],
  );

  const mostrarToast = useCallback((mensagem: string) => {
    setToast(mensagem);

    window.setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  const mensagemErroApi = useCallback(
    (
      resposta: RespostaApi,
      contexto: "load" | "save" | "generic" = "generic",
    ) => {
      if (resposta.code === "SEM_PERMISSAO_MASTER") {
        return t("messages.permission");
      }

      if (resposta.code === "TRADUCOES_PUBLICACAO_INCOMPLETAS") {
        return t("messages.publishTranslations");
      }

      if (
        resposta.code === "PERIODO_EXIBICAO_INVALIDO" ||
        resposta.code === "FERIADO_FORA_DO_PERIODO"
      ) {
        return t("messages.invalidPeriod");
      }

      if (contexto === "load") {
        return t("messages.loadError");
      }

      if (contexto === "save") {
        return t("messages.saveError");
      }

      return t("messages.genericError");
    },
    [t],
  );

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/master/feriados", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const corpo = (await resposta.json()) as RespostaApi;

      if (!resposta.ok) {
        throw new Error(mensagemErroApi(corpo, "load"));
      }

      setFeriados(Array.isArray(corpo.feriados) ? corpo.feriados : []);
    } catch (error) {
      setErro(error instanceof Error ? error.message : t("messages.loadError"));
    } finally {
      setCarregando(false);
    }
  }, [mensagemErroApi, t]);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const resumo = useMemo(() => {
    return {
      total: feriados.length,

      publicados: feriados.filter((item) => item.status === "PUBLICADO").length,

      rascunhos: feriados.filter((item) => item.status === "RASCUNHO").length,

      arquivados: feriados.filter((item) => item.status === "ARQUIVADO").length,
    };
  }, [feriados]);

  const feriadosFiltrados = useMemo(() => {
    return feriados.filter((feriado) => {
      if (paisFiltro && feriado.paisCodigo !== paisFiltro) {
        return false;
      }

      if (statusFiltro && feriado.status !== statusFiltro) {
        return false;
      }

      if (anoFiltro) {
        const ano = feriado.dataFeriado.slice(0, 4);

        if (ano !== anoFiltro) {
          return false;
        }
      }

      return true;
    });
  }, [anoFiltro, feriados, paisFiltro, statusFiltro]);

  function formatarData(valor: string) {
    const civil = dataInput(valor);

    const resultado = /^(\d{4})-(\d{2})-(\d{2})$/.exec(civil);

    if (!resultado) {
      return civil;
    }

    const data = new Date(
      Date.UTC(
        Number(resultado[1]),
        Number(resultado[2]) - 1,
        Number(resultado[3]),
      ),
    );

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(data);
  }

  function labelStatus(status: StatusFeriado) {
    switch (status) {
      case "PUBLICADO":
        return t("status.published");

      case "ARQUIVADO":
        return t("status.archived");

      default:
        return t("status.draft");
    }
  }

  function classeStatus(status: StatusFeriado) {
    switch (status) {
      case "PUBLICADO":
        return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300";

      case "ARQUIVADO":
        return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

      default:
        return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300";
    }
  }

  function traducaoPreferida(feriado: Feriado) {
    return (
      feriado.traducoes.find((item) => item.locale === locale) ||
      feriado.traducoes.find((item) => item.locale === "pt-BR") ||
      feriado.traducoes[0] ||
      null
    );
  }

  function abrirNovo() {
    setEditandoId(null);
    setForm(formularioVazio());
    setLocaleAtivo(localeAtual);
    setModalAberto(true);
  }

  function abrirEdicao(feriado: Feriado) {
    const traducoes = traducoesVazias();

    for (const item of feriado.traducoes) {
      if (LOCALES.includes(item.locale as LocaleSuportado)) {
        traducoes[item.locale as LocaleSuportado] = {
          nome: item.nome,
          titulo: item.titulo,
          mensagem: item.mensagem,
        };
      }
    }

    setEditandoId(feriado.id);

    setForm({
      paisCodigo: feriado.paisCodigo,

      regiaoCodigo: feriado.regiaoCodigo || "",

      cidade: feriado.cidade || "",

      dataFeriado: dataInput(feriado.dataFeriado),

      inicioExibicao: dataInput(feriado.inicioExibicao),

      fimExibicao: dataInput(feriado.fimExibicao),

      tipo: feriado.tipo,

      prioridade: String(feriado.prioridade),

      emoji:
        normalizarIconeSalvo(
          feriado.emoji
        ),

      traducoes,
    });

    setLocaleAtivo(localeAtual);
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);
    setEditandoId(null);
  }

  function atualizarTraducao(campo: keyof ConteudoTraducao, valor: string) {
    setForm((atual) => ({
      ...atual,

      traducoes: {
        ...atual.traducoes,

        [localeAtivo]: {
          ...atual.traducoes[localeAtivo],

          [campo]: valor,
        },
      },
    }));
  }

  function prepararTraducoes() {
    const resultado: {
      locale: LocaleSuportado;
      nome: string;
      titulo: string;
      mensagem: string;
    }[] = [];

    let existeIncompleta = false;

    for (const idioma of LOCALES) {
      const item = form.traducoes[idioma];

      const nome = item.nome.trim();

      const titulo = item.titulo.trim();

      const mensagem = item.mensagem.trim();

      const temAlgum = Boolean(nome || titulo || mensagem);

      const completa = Boolean(nome && titulo && mensagem);

      if (temAlgum && !completa) {
        existeIncompleta = true;
      }

      if (completa) {
        resultado.push({
          locale: idioma,
          nome,
          titulo,
          mensagem,
        });
      }
    }

    return {
      traducoes: resultado,
      existeIncompleta,
    };
  }

  async function salvar(statusDestino?: StatusFeriado) {
    if (
      !form.paisCodigo ||
      !form.dataFeriado ||
      !form.inicioExibicao ||
      !form.fimExibicao
    ) {
      mostrarToast(t("messages.saveError"));
      return;
    }

    if (
      form.inicioExibicao > form.fimExibicao ||
      form.dataFeriado < form.inicioExibicao ||
      form.dataFeriado > form.fimExibicao
    ) {
      mostrarToast(t("messages.invalidPeriod"));
      return;
    }

    const preparado = prepararTraducoes();

    if (preparado.existeIncompleta || preparado.traducoes.length === 0) {
      mostrarToast(t("messages.saveError"));
      return;
    }

    if (
      statusDestino === "PUBLICADO" &&
      preparado.traducoes.length !== LOCALES.length
    ) {
      mostrarToast(t("messages.publishTranslations"));
      return;
    }

    setSalvando(true);

    try {
      const payload: Record<string, unknown> = {
        paisCodigo: form.paisCodigo,

        regiaoCodigo: form.regiaoCodigo,

        cidade: form.cidade,

        dataFeriado: form.dataFeriado,

        inicioExibicao: form.inicioExibicao,

        fimExibicao: form.fimExibicao,

        tipo: form.tipo,

        prioridade: Number(form.prioridade || 0),

        emoji: form.emoji,

        traducoes: preparado.traducoes,
      };

      if (statusDestino) {
        payload.status = statusDestino;
      } else if (!editandoId) {
        payload.status = "RASCUNHO";
      }

      const url = editandoId
        ? `/api/master/feriados/${editandoId}`
        : "/api/master/feriados";

      const resposta = await fetch(url, {
        method: editandoId ? "PATCH" : "POST",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const corpo = (await resposta.json()) as RespostaApi;

      if (!resposta.ok) {
        mostrarToast(mensagemErroApi(corpo, "save"));
        return;
      }

      setModalAberto(false);
      setEditandoId(null);

      if (statusDestino === "PUBLICADO") {
        mostrarToast(t("messages.published"));
      } else {
        mostrarToast(t("messages.saved"));
      }

      await carregar();
    } catch {
      mostrarToast(t("messages.saveError"));
    } finally {
      setSalvando(false);
    }
  }

  async function alterarStatus(feriado: Feriado, status: StatusFeriado) {
    setAcaoId(feriado.id);

    try {
      const resposta = await fetch(`/api/master/feriados/${feriado.id}`, {
        method: "PATCH",
        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          status,
        }),
      });

      const corpo = (await resposta.json()) as RespostaApi;

      if (!resposta.ok) {
        mostrarToast(mensagemErroApi(corpo, "generic"));
        return;
      }

      mostrarToast(
        status === "PUBLICADO"
          ? t("messages.published")
          : t("messages.archived"),
      );

      await carregar();
    } catch {
      mostrarToast(t("messages.genericError"));
    } finally {
      setAcaoId(null);
    }
  }

  async function confirmarExclusao() {
    if (!excluirFeriado) {
      return;
    }

    setAcaoId(excluirFeriado.id);

    try {
      const resposta = await fetch(
        `/api/master/feriados/${excluirFeriado.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const corpo = (await resposta.json()) as RespostaApi;

      if (!resposta.ok) {
        mostrarToast(mensagemErroApi(corpo, "generic"));
        return;
      }

      setExcluirFeriado(null);

      mostrarToast(t("messages.deleted"));

      await carregar();
    } catch {
      mostrarToast(t("messages.genericError"));
    } finally {
      setAcaoId(null);
    }
  }

  const traducaoPreview = form.traducoes[localeAtivo];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/master"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← PHANYX Master
              </Link>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                {t("title")}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                {t("subtitle")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void carregar()}
                disabled={carregando}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                ↻ {t("actions.refresh")}
              </button>

              <button
                type="button"
                onClick={abrirNovo}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                + {t("actions.newHoliday")}
              </button>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: t("summary.total"),
              valor: resumo.total,
              icone: "🌍",
            },
            {
              label: t("summary.published"),
              valor: resumo.publicados,
              icone: "✅",
            },
            {
              label: t("summary.drafts"),
              valor: resumo.rascunhos,
              icone: "📝",
            },
            {
              label: t("summary.archived"),
              valor: resumo.arquivados,
              icone: "🗃️",
            },
          ].map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {card.label}
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {card.valor.toLocaleString(locale)}
                  </p>
                </div>

                <span className="rounded-xl bg-slate-100 p-2 text-xl dark:bg-slate-800">
                  {card.icone}
                </span>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-[1.4fr_1fr_0.7fr_auto]">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                {t("filters.country")}
              </span>

              <select
                value={paisFiltro}
                onChange={(event) => setPaisFiltro(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">{t("filters.allCountries")}</option>

                {paises.map((pais) => (
                  <option key={pais.codigo} value={pais.codigo}>
                    {pais.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                {t("filters.status")}
              </span>

              <select
                value={statusFiltro}
                onChange={(event) => setStatusFiltro(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">{t("filters.allStatuses")}</option>

                <option value="PUBLICADO">{t("status.published")}</option>

                <option value="RASCUNHO">{t("status.draft")}</option>

                <option value="ARQUIVADO">{t("status.archived")}</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                {t("filters.year")}
              </span>

              <input
                type="number"
                min="1900"
                max="2200"
                value={anoFiltro}
                onChange={(event) => setAnoFiltro(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setPaisFiltro("");
                  setStatusFiltro("");
                  setAnoFiltro("");
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t("filters.clear")}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {carregando ? (
            <div
              className="flex min-h-56 items-center justify-center"
              role="status"
              aria-label={t("actions.refresh")}
            >
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
            </div>
          ) : erro ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {erro}
              </p>

              <button
                type="button"
                onClick={() => void carregar()}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                {t("actions.refresh")}
              </button>
            </div>
          ) : feriadosFiltrados.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
                📅
              </div>

              <h2 className="mt-4 text-lg font-bold">{t("empty.title")}</h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t("empty.description")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/60">
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="px-5 py-4">{t("table.holiday")}</th>

                    <th className="px-5 py-4">{t("table.country")}</th>

                    <th className="px-5 py-4">{t("table.date")}</th>

                    <th className="px-5 py-4">{t("table.displayPeriod")}</th>

                    <th className="px-5 py-4">{t("table.status")}</th>

                    <th className="px-5 py-4">{t("table.priority")}</th>

                    <th className="px-5 py-4 text-right">
                      {t("table.actions")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {feriadosFiltrados.map((feriado) => {
                    const traducao = traducaoPreferida(feriado);

                    return (
                      <tr
                        key={feriado.id}
                        className="border-b border-slate-100 align-top transition hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-5">
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-xl dark:bg-slate-800">
                                {usarBandeiraDoPais(
                                  feriado.emoji
                                ) ? (
                                  <BandeiraPais
                                    codigo={
                                      feriado.paisCodigo
                                    }
                                    nome={nomePais(
                                      feriado.paisCodigo
                                    )}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  feriado.emoji
                                )}
                              </span>

                            <div>
                              <p className="font-bold">
                                {traducao?.nome || "-"}
                              </p>

                              <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                                {traducao?.titulo || "-"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <span className="font-semibold">
                            {nomePais(feriado.paisCodigo)}
                          </span>

                          <div className="mt-1 text-xs text-slate-500">
                            {feriado.paisCodigo}
                          </div>
                        </td>

                        <td className="px-5 py-5 font-medium">
                          {formatarData(feriado.dataFeriado)}
                        </td>

                        <td className="px-5 py-5 text-slate-600 dark:text-slate-300">
                          {formatarData(feriado.inicioExibicao)}
                          <span className="mx-2">→</span>
                          {formatarData(feriado.fimExibicao)}
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${classeStatus(
                              feriado.status,
                            )}`}
                          >
                            {labelStatus(feriado.status)}
                          </span>
                        </td>

                        <td className="px-5 py-5 font-semibold">
                          {feriado.prioridade}
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => abrirEdicao(feriado)}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              {t("actions.edit")}
                            </button>

                            {feriado.status !== "PUBLICADO" && (
                              <button
                                type="button"
                                disabled={acaoId === feriado.id}
                                onClick={() =>
                                  void alterarStatus(feriado, "PUBLICADO")
                                }
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {t("actions.publish")}
                              </button>
                            )}

                            {feriado.status === "PUBLICADO" && (
                              <button
                                type="button"
                                disabled={acaoId === feriado.id}
                                onClick={() =>
                                  void alterarStatus(feriado, "ARQUIVADO")
                                }
                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {t("actions.archive")}
                              </button>
                            )}

                            {feriado.status === "RASCUNHO" && (
                              <button
                                type="button"
                                disabled={acaoId === feriado.id}
                                onClick={() => setExcluirFeriado(feriado)}
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                              >
                                {t("actions.deleteDraft")}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="my-6 w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold">
                  {editandoId ? t("form.editTitle") : t("form.newTitle")}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {editandoId ? t("form.publicationHint") : t("form.draftHint")}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                aria-label={t("actions.close")}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-xl text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <div className="grid gap-6 p-6 xl:grid-cols-[1fr_1.15fr]">
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("form.general")}
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="mb-2 block text-sm font-semibold">
                        {t("form.countryValidity")}
                      </span>

                      <p className="mb-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {t("form.countryHint")}
                      </p>

                      <select
                        required
                        value={form.paisCodigo}
                        onChange={(event) => {
                          const novoPais =
                            event.target.value;

                          setForm(
                            (atual) => ({
                              ...atual,
                              paisCodigo:
                                novoPais,
                              emoji: "",
                            })
                          );
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
                      >
                        <option value="">—</option>

                        {paises.map((pais) => (
                          <option key={pais.codigo} value={pais.codigo}>
                            {pais.nome}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-2 block text-sm font-semibold">
                        {t("form.date")}
                      </span>

                      <input
                        type="date"
                        required
                        value={form.dataFeriado}
                        onChange={(event) =>
                          setForm((atual) => ({
                            ...atual,
                            dataFeriado: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </label>

                    <label>
                      <span className="mb-2 block text-sm font-semibold">
                        {t("form.type")}
                      </span>

                      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                        {t("form.national")}
                      </div>
                    </label>

                    <label>
                      <span className="mb-2 block text-sm font-semibold">
                        {t("form.displayStart")}
                      </span>

                      <input
                        type="date"
                        required
                        value={form.inicioExibicao}
                        onChange={(event) =>
                          setForm((atual) => ({
                            ...atual,
                            inicioExibicao: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </label>

                    <label>
                      <span className="mb-2 block text-sm font-semibold">
                        {t("form.displayEnd")}
                      </span>

                      <input
                        type="date"
                        required
                        value={form.fimExibicao}
                        onChange={(event) =>
                          setForm((atual) => ({
                            ...atual,
                            fimExibicao: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </label>

                    <label>
                      <span className="mb-2 block text-sm font-semibold">
                        {t("form.priority")}
                      </span>

                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={form.prioridade}
                        onChange={(event) =>
                          setForm((atual) => ({
                            ...atual,
                            prioridade: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </label>

                    <div>
                      <span className="mb-2 block text-sm font-semibold">
                        {t("form.emoji")}
                      </span>

                      <p className="mb-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {t("form.iconHint")}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {form.paisCodigo && (
                          <button
                            type="button"
                            aria-pressed={
                              form.emoji === ""
                            }
                            onClick={() =>
                              setForm(
                                (atual) => ({
                                  ...atual,
                                  emoji: "",
                                })
                              )
                            }
                            className={`flex h-12 min-w-14 items-center justify-center rounded-xl border px-3 transition ${
                              form.emoji === ""
                                ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500/20 dark:bg-blue-950/50"
                                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-700 dark:hover:bg-slate-800"
                            }`}
                          >
                            <BandeiraPais
                              codigo={
                                form.paisCodigo
                              }
                              nome={nomePais(
                                form.paisCodigo
                              )}
                              className="h-7 w-10 rounded-md object-cover shadow-sm"
                            />
                          </button>
                        )}

                        {ICONES_RAPIDOS.map(
                          (icone) => {
                            const selecionado =
                              form.emoji ===
                              icone;

                            return (
                              <button
                                key={icone}
                                type="button"
                                aria-pressed={
                                  selecionado
                                }
                                onClick={() =>
                                  setForm(
                                    (atual) => ({
                                      ...atual,
                                      emoji:
                                        icone,
                                    })
                                  )
                                }
                                className={`flex h-12 min-w-12 items-center justify-center rounded-xl border px-3 text-xl transition ${
                                  selecionado
                                    ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500/20 dark:bg-blue-950/50"
                                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-700 dark:hover:bg-slate-800"
                                }`}
                              >
                                {icone}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {form.tipo !== "NACIONAL" && (
                      <label>
                        <span className="mb-2 block text-sm font-semibold">
                          {t("form.region")}
                        </span>

                        <input
                          type="text"
                          maxLength={30}
                          value={form.regiaoCodigo}
                          onChange={(event) =>
                            setForm((atual) => ({
                              ...atual,
                              regiaoCodigo: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
                        />
                      </label>
                    )}

                    {form.tipo === "LOCAL" && (
                      <label>
                        <span className="mb-2 block text-sm font-semibold">
                          {t("form.city")}
                        </span>

                        <input
                          type="text"
                          maxLength={200}
                          value={form.cidade}
                          onChange={(event) =>
                            setForm((atual) => ({
                              ...atual,
                              cidade: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
                        />
                      </label>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("form.translations")}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {t("form.translationsHint")}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {LOCALES.map((idioma) => {
                      const item = form.traducoes[idioma];

                      const completo = Boolean(
                        item.nome.trim() &&
                        item.titulo.trim() &&
                        item.mensagem.trim(),
                      );

                      return (
                        <button
                          type="button"
                          key={idioma}
                          onClick={() => setLocaleAtivo(idioma)}
                          className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                            localeAtivo === idioma
                              ? "border-blue-600 bg-blue-600 text-white"
                              : completo
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          {idioma}
                          {completo ? " ✓" : ""}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold">
                        {t("form.name")}
                      </span>

                      <input
                        type="text"
                        maxLength={200}
                        value={traducaoPreview.nome}
                        onChange={(event) =>
                          atualizarTraducao("nome", event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold">
                        {t("form.bannerTitle")}
                      </span>

                      <input
                        type="text"
                        maxLength={300}
                        value={traducaoPreview.titulo}
                        onChange={(event) =>
                          atualizarTraducao("titulo", event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold">
                        {t("form.message")}
                      </span>

                      <textarea
                        rows={5}
                        maxLength={4000}
                        value={traducaoPreview.mensagem}
                        onChange={(event) =>
                          atualizarTraducao("mensagem", event.target.value)
                        }
                        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </label>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("form.preview")}
                  </h3>

                  <div className="mt-4 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm dark:border-blue-900 dark:from-blue-950/50 dark:to-slate-900">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-800">
                        {form.paisCodigo &&
                        form.emoji === "" ? (
                          <BandeiraPais
                            codigo={
                              form.paisCodigo
                            }
                            nome={nomePais(
                              form.paisCodigo
                            )}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          form.emoji || "📅"
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                          {t("preview.origin")}
                        </p>

                        {traducaoPreview.nome ||
                        traducaoPreview.titulo ||
                        traducaoPreview.mensagem ? (
                          <>
                            <h4 className="mt-1 text-lg font-bold">
                              {traducaoPreview.titulo || traducaoPreview.nome}
                            </h4>

                            <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {t("preview.category")}
                            </span>

                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                              {traducaoPreview.mensagem}
                            </p>

                            <button
                              type="button"
                              className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                              {t("preview.viewCalendar")} →
                            </button>
                          </>
                        ) : (
                          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            {t("preview.noContent")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-6 sm:flex-row sm:justify-end dark:border-slate-800">
              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t("actions.cancel")}
              </button>

              <button
                type="button"
                onClick={() => void salvar()}
                disabled={salvando}
                className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-950"
              >
                {editandoId ? t("actions.saveChanges") : t("actions.saveDraft")}
              </button>

              <button
                type="button"
                onClick={() => void salvar("PUBLICADO")}
                disabled={salvando}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {t("actions.publish")}
              </button>
            </div>
          </div>
        </div>
      )}

      {excluirFeriado && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl dark:bg-red-950/50">
              🗑️
            </div>

            <h2 className="mt-4 text-xl font-bold">
              {t("confirmDelete.title")}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t("confirmDelete.description")}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setExcluirFeriado(null)}
                disabled={acaoId === excluirFeriado.id}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                {t("actions.cancel")}
              </button>

              <button
                type="button"
                onClick={() => void confirmarExclusao()}
                disabled={acaoId === excluirFeriado.id}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {t("confirmDelete.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[70] max-w-sm rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-800 shadow-2xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
