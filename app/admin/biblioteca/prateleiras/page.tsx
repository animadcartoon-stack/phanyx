"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ItensPrateleira from "./ItensPrateleira";

type Prateleira = {
  id: number;
  nome: string;
  descricao: string | null;
  tipo: string;
  visibilidade: string;
  slug: string;
  capaUrl: string | null;
  cor: string | null;
  icone: string | null;
  ordem: number;
  destaque: boolean;
  ativa: boolean;
  _count: {
    itens: number;
  };
};

type DadosPrateleiras = {
  success: boolean;
  acesso: {
    podeGerenciar: boolean;
  };
  resumo: {
    total: number;
    ativas: number;
    inativas: number;
    destaques: number;
    itensVinculados: number;
  };
  tipos: string[];
  visibilidades: string[];
  prateleiras: Prateleira[];
};

type Formulario = {
  nome: string;
  descricao: string;
  tipo: string;
  visibilidade: string;
  capaUrl: string;
  cor: string;
  icone: string;
  ordem: string;
  destaque: boolean;
  ativa: boolean;
};

type Filtro = "TODAS" | "ATIVAS" | "INATIVAS";

type Toast = {
  texto: string;
  tipo: "sucesso" | "erro";
};

const formularioInicial: Formulario = {
  nome: "",
  descricao: "",
  tipo: "INSTITUCIONAL",
  visibilidade: "TODOS",
  capaUrl: "",
  cor: "",
  icone: "",
  ordem: "0",
  destaque: false,
  ativa: true,
};

const campoClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900";

const rotuloClass =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200";

function textoBusca(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function corSegura(valor: string | null) {
  return valor && /^#[0-9a-fA-F]{6}$/.test(valor)
    ? valor
    : "#2563eb";
}

export default function BibliotecaPrateleirasPage() {
  const t = useTranslations("AdminLibraryShelves");

  const [dados, setDados] = useState<DadosPrateleiras | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("TODAS");

  const [modalAberto, setModalAberto] = useState(false);
  const [prateleiraItens, setPrateleiraItens] = useState<Prateleira | null>(null);
  const [idEdicao, setIdEdicao] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(formularioInicial);
  const [salvando, setSalvando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroCarregamento(false);

    try {
      const resposta = await fetch("/api/admin/biblioteca/prateleiras", {
        cache: "no-store",
      });
      const corpo = (await resposta.json()) as DadosPrateleiras;

      if (!resposta.ok || !corpo.success) {
        throw new Error("PRATELEIRAS_INDISPONIVEIS");
      }

      setDados(corpo);
    } catch {
      setErroCarregamento(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (!toast) return;

    const temporizador = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(temporizador);
  }, [toast]);

  useEffect(() => {
    if (!modalAberto) return;

    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !salvando) {
        setModalAberto(false);
      }
    }

    window.addEventListener("keydown", aoPressionarTecla);
    return () => window.removeEventListener("keydown", aoPressionarTecla);
  }, [modalAberto, salvando]);

  const prateleirasFiltradas = useMemo(() => {
    const termo = textoBusca(busca.trim());

    return (dados?.prateleiras ?? []).filter((prateleira) => {
      if (filtro === "ATIVAS" && !prateleira.ativa) return false;
      if (filtro === "INATIVAS" && prateleira.ativa) return false;

      return !termo || textoBusca(prateleira.nome).includes(termo);
    });
  }, [dados, busca, filtro]);

  function rotuloTipo(tipo: string) {
    switch (tipo) {
      case "INSTITUCIONAL":
        return t("typeInstitucional");
      case "DIDATICA":
        return t("typeDidatica");
      case "DESTAQUE":
        return t("typeDestaque");
      case "TEMATICA":
        return t("typeTematica");
      default:
        return tipo;
    }
  }

  function rotuloVisibilidade(visibilidade: string) {
    switch (visibilidade) {
      case "TODOS":
        return t("visibilityTodos");
      case "ALUNOS":
        return t("visibilityAlunos");
      case "PROFESSORES":
        return t("visibilityProfessores");
      case "FUNCIONARIOS":
        return t("visibilityFuncionarios");
      default:
        return visibilidade;
    }
  }

  function alterar<K extends keyof Formulario>(
    campo: K,
    valor: Formulario[K],
  ) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function abrirCriacao() {
    setIdEdicao(null);
    setFormulario({
      ...formularioInicial,
      tipo: dados?.tipos[0] ?? "INSTITUCIONAL",
      visibilidade: dados?.visibilidades.includes("TODOS")
        ? "TODOS"
        : dados?.visibilidades[0] ?? "TODOS",
    });
    setErroFormulario(false);
    setModalAberto(true);
  }

  function abrirEdicao(prateleira: Prateleira) {
    setIdEdicao(prateleira.id);
    setFormulario({
      nome: prateleira.nome,
      descricao: prateleira.descricao ?? "",
      tipo: prateleira.tipo,
      visibilidade: prateleira.visibilidade,
      capaUrl: prateleira.capaUrl ?? "",
      cor: prateleira.cor ?? "",
      icone: prateleira.icone ?? "",
      ordem: String(prateleira.ordem),
      destaque: prateleira.destaque,
      ativa: prateleira.ativa,
    });
    setErroFormulario(false);
    setModalAberto(true);
  }

  async function salvar() {
    if (salvando) return;

    setSalvando(true);
    setErroFormulario(false);

    try {
      const corpo = {
        nome: formulario.nome.trim(),
        descricao: formulario.descricao.trim() || null,
        tipo: formulario.tipo,
        visibilidade: formulario.visibilidade,
        capaUrl: formulario.capaUrl.trim() || null,
        cor: formulario.cor.trim() || null,
        icone: formulario.icone.trim() || null,
        ordem: Number(formulario.ordem),
        destaque: formulario.destaque,
        ativa: formulario.ativa,
      };

      const resposta = await fetch(
        idEdicao === null
          ? "/api/admin/biblioteca/prateleiras"
          : `/api/admin/biblioteca/prateleiras/${idEdicao}`,
        {
          method: idEdicao === null ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(corpo),
        },
      );

      if (!resposta.ok) {
        throw new Error("FALHA_AO_SALVAR");
      }

      setModalAberto(false);
      setToast({
        texto: t(idEdicao === null ? "created" : "updated"),
        tipo: "sucesso",
      });
      await carregar();
    } catch {
      setErroFormulario(true);
      setToast({
        texto: t("saveError"),
        tipo: "erro",
      });
    } finally {
      setSalvando(false);
    }
  }

  const resumo = dados?.resumo;

  const indicadores = [
    { chave: "summaryTotal", valor: resumo?.total ?? 0, cor: "#1e40af" },
    { chave: "summaryActive", valor: resumo?.ativas ?? 0, cor: "#047857" },
    { chave: "summaryInactive", valor: resumo?.inativas ?? 0, cor: "#475569" },
    { chave: "summaryFeatured", valor: resumo?.destaques ?? 0, cor: "#6d28d9" },
    { chave: "summaryItems", valor: resumo?.itensVinculados ?? 0, cor: "#0e7490" },
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-900 to-blue-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1 className="text-2xl font-bold !text-white sm:text-3xl" style={{ color: "#ffffff" }}>
                {t("title")}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
                {t("subtitle")}
              </p>
            </div>

            <button
              type="button"
              onClick={abrirCriacao}
              disabled={!dados?.acesso.podeGerenciar}
              className="rounded-xl !bg-white px-5 py-2.5 text-sm font-bold !text-blue-900 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: "#ffffff", color: "#1e3a8a" }}
            >
              + {t("create")}
            </button>
          </div>
        </header>

        {toast && (
          <div
            role={toast.tipo === "erro" ? "alert" : "status"}
            className={`fixed right-4 top-4 z-[70] max-w-sm rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
              toast.tipo === "erro"
                ? "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
                : "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
            }`}
          >
            {toast.texto}
          </div>
        )}

        {resumo && (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {indicadores.map((indicador) => (
              <div
                key={indicador.chave}
                className="rounded-2xl border p-4 shadow-sm"
                style={{ backgroundColor: indicador.cor, borderColor: indicador.cor }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide !text-white" style={{ color: "#ffffff" }}>
                  {t(indicador.chave)}
                </p>
                <p className="mt-2 text-2xl font-bold !text-white" style={{ color: "#ffffff" }}>
                  {indicador.valor}
                </p>
              </div>
            ))}
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex-1">
              <span className="sr-only">{t("searchPlaceholder")}</span>
              <input
                type="search"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder={t("searchPlaceholder")}
                className={campoClass}
              />
            </label>

            <select
              value={filtro}
              onChange={(evento) => setFiltro(evento.target.value as Filtro)}
              className={`${campoClass} sm:w-48`}
              aria-label={t("filterAll")}
            >
              <option value="TODAS">{t("filterAll")}</option>
              <option value="ATIVAS">{t("filterActive")}</option>
              <option value="INATIVAS">{t("filterInactive")}</option>
            </select>
          </div>
        </section>

        {carregando ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {t("loading")}
          </div>
        ) : erroCarregamento ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
          >
            <p>{t("loadError")}</p>
            <button
              type="button"
              onClick={() => void carregar()}
              className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              {t("retry")}
            </button>
          </div>
        ) : prateleirasFiltradas.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {t("empty")}
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {prateleirasFiltradas.map((prateleira) => (
              <article
                key={prateleira.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div
                  className="relative h-24 overflow-hidden"
                  style={{ backgroundColor: corSegura(prateleira.cor) }}
                >
                  {prateleira.capaUrl?.startsWith("https://") && (
                    <img
                      src={prateleira.capaUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                  {prateleira.destaque && (
                    <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-900 shadow">
                      {t("summaryFeatured")}
                    </span>
                  )}
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {prateleira.icone ? `${prateleira.icone} ` : ""}
                        {prateleira.nome}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                          prateleira.ativa
                            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                            : "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                        }`}
                      >
                        {t(prateleira.ativa ? "statusActive" : "statusInactive")}
                      </span>
                    </div>

                    {prateleira.descricao && (
                      <p className="mt-2 line-clamp-3 text-sm text-slate-700 dark:text-slate-300">
                        {prateleira.descricao}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-900 dark:bg-blue-950 dark:text-blue-100">
                      {rotuloTipo(prateleira.tipo)}
                    </span>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-900 dark:bg-violet-950 dark:text-violet-100">
                      {rotuloVisibilidade(prateleira.visibilidade)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                      {t("itemCount", { count: prateleira._count.itens })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                    <span className="truncate text-xs text-slate-600 dark:text-slate-300">
                      {t("slug")}: {prateleira.slug}
                    </span>
                    <button
                      type="button"
                      onClick={() => abrirEdicao(prateleira)}
                      className="shrink-0 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100 dark:hover:bg-blue-900"
                    >
                      {t("edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrateleiraItens(prateleira)}
                      className="rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100 dark:hover:bg-blue-900"
                    >
                      {t("manage")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !salvando) {
              setModalAberto(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-prateleira"
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-7"
          >
            <h2
              id="titulo-modal-prateleira"
              className="text-xl font-bold text-slate-900 dark:text-white"
            >
              {t(idEdicao === null ? "createTitle" : "editTitle")}
            </h2>

            {erroFormulario && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
              >
                {t("saveError")}
              </p>
            )}

            <form
              className="mt-5 space-y-5"
              onSubmit={(evento) => {
                evento.preventDefault();
                void salvar();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className={rotuloClass}>{t("name")}</span>
                  <input
                    required
                    maxLength={180}
                    value={formulario.nome}
                    onChange={(evento) => alterar("nome", evento.target.value)}
                    className={campoClass}
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className={rotuloClass}>{t("description")}</span>
                  <textarea
                    rows={3}
                    maxLength={10000}
                    value={formulario.descricao}
                    onChange={(evento) =>
                      alterar("descricao", evento.target.value)
                    }
                    className={campoClass}
                  />
                </label>

                <label>
                  <span className={rotuloClass}>{t("type")}</span>
                  <select
                    value={formulario.tipo}
                    onChange={(evento) => alterar("tipo", evento.target.value)}
                    className={campoClass}
                  >
                    {(dados?.tipos ?? []).map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {rotuloTipo(tipo)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className={rotuloClass}>{t("visibility")}</span>
                  <select
                    value={formulario.visibilidade}
                    onChange={(evento) =>
                      alterar("visibilidade", evento.target.value)
                    }
                    className={campoClass}
                  >
                    {(dados?.visibilidades ?? []).map((visibilidade) => (
                      <option key={visibilidade} value={visibilidade}>
                        {rotuloVisibilidade(visibilidade)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="sm:col-span-2">
                  <span className={rotuloClass}>{t("coverUrl")}</span>
                  <input
                    type="url"
                    maxLength={2000}
                    value={formulario.capaUrl}
                    onChange={(evento) =>
                      alterar("capaUrl", evento.target.value)
                    }
                    className={campoClass}
                  />
                </label>

                <label>
                  <span className={rotuloClass}>{t("color")}</span>
                  <input
                    maxLength={100}
                    value={formulario.cor}
                    onChange={(evento) => alterar("cor", evento.target.value)}
                    className={campoClass}
                  />
                </label>

                <label>
                  <span className={rotuloClass}>{t("icon")}</span>
                  <input
                    maxLength={100}
                    value={formulario.icone}
                    onChange={(evento) => alterar("icone", evento.target.value)}
                    className={campoClass}
                  />
                </label>

                <label>
                  <span className={rotuloClass}>{t("order")}</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={formulario.ordem}
                    onChange={(evento) =>
                      alterar("ordem", evento.target.value)
                    }
                    className={campoClass}
                  />
                </label>

                <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <label className="flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    <input
                      type="checkbox"
                      checked={formulario.destaque}
                      onChange={(evento) =>
                        alterar("destaque", evento.target.checked)
                      }
                      className="h-4 w-4 accent-blue-700"
                    />
                    {t("featured")}
                  </label>
                  <label className="flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    <input
                      type="checkbox"
                      checked={formulario.ativa}
                      onChange={(evento) =>
                        alterar("ativa", evento.target.checked)
                      }
                      className="h-4 w-4 accent-blue-700"
                    />
                    {t("active")}
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
                <button
                  type="button"
                  disabled={salvando}
                  onClick={() => setModalAberto(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400"
                >
                  {t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {prateleiraItens && (
        <ItensPrateleira
          prateleira={prateleiraItens}
          onClose={() => setPrateleiraItens(null)}
          onChanged={carregar}
        />
      )}
    </main>
  );
}