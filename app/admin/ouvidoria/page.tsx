"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useTranslations,
} from "next-intl";

type ChamadoOuvidoria = {
  id: number;
  origem: string;
  tipo: string;
  titulo?: string | null;
  mensagem: string;
  status: string;
  prioridade: string;
  sentimento: string;
  criadoEm: string;
  resposta?: string | null;
};

type FiltroOuvidoria =
  | "TODOS"
  | "ALUNO"
  | "PROFESSOR"
  | "CRITICO"
  | "NEUTRO"
  | "POSITIVO"
  | "PENDENTE"
  | "EM_ANALISE"
  | "RESOLVIDO";

type TipoManifestacao =
  | "Sugestão"
  | "Reclamação"
  | "Elogio"
  | "Relato";

type Prioridade =
  | "BAIXA"
  | "NORMAL"
  | "ALTA"
  | "URGENTE";

const FILTROS: FiltroOuvidoria[] = [
  "TODOS",
  "ALUNO",
  "PROFESSOR",
  "CRITICO",
  "NEUTRO",
  "POSITIVO",
  "PENDENTE",
  "EM_ANALISE",
  "RESOLVIDO",
];

const TIPOS: TipoManifestacao[] = [
  "Sugestão",
  "Reclamação",
  "Elogio",
  "Relato",
];

const PRIORIDADES: Prioridade[] = [
  "BAIXA",
  "NORMAL",
  "ALTA",
  "URGENTE",
];

function normalizarTexto(valor?: string | null) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export default function OuvidoriaAdminPage() {
  const t = useTranslations("AdminOmbudsman");

  const [filtro, setFiltro] =
    useState<FiltroOuvidoria>("TODOS");

  const [chamados, setChamados] =
    useState<ChamadoOuvidoria[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [atualizandoId, setAtualizandoId] =
    useState<number | null>(null);

  const [chamadoSelecionado, setChamadoSelecionado] =
    useState<ChamadoOuvidoria | null>(null);

  const [respostaTexto, setRespostaTexto] =
    useState("");

  const [salvandoResposta, setSalvandoResposta] =
    useState(false);

  const [modalNovoChamado, setModalNovoChamado] =
    useState(false);

  const [novoTipo, setNovoTipo] =
    useState<TipoManifestacao>("Sugestão");

  const [novoTitulo, setNovoTitulo] =
    useState("");

  const [novaMensagem, setNovaMensagem] =
    useState("");

  const [novaPrioridade, setNovaPrioridade] =
    useState<Prioridade>("NORMAL");

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  useEffect(() => {
    async function carregarOuvidoria() {
      try {
        setCarregando(true);
        setErro("");

        const res = await fetch("/api/ouvidoria", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.error ||
            t("errors.load")
          );
        }

        setChamados(
          Array.isArray(data?.registros)
            ? data.registros
            : []
        );
      } catch (error: unknown) {
        console.error(error);

        setErro(
          error instanceof Error
            ? error.message
            : t("errors.load")
        );
      } finally {
        setCarregando(false);
      }
    }

    void carregarOuvidoria();
  }, [t]);

  function limparFeedback() {
    setErro("");
    setSucesso("");
  }

  function rotuloFiltro(valor: FiltroOuvidoria) {
    switch (valor) {
      case "TODOS":
        return t("filters.all");
      case "ALUNO":
        return t("filters.student");
      case "PROFESSOR":
        return t("filters.teacher");
      case "CRITICO":
        return t("filters.critical");
      case "NEUTRO":
        return t("filters.neutral");
      case "POSITIVO":
        return t("filters.positive");
      case "PENDENTE":
        return t("filters.pending");
      case "EM_ANALISE":
        return t("filters.inAnalysis");
      case "RESOLVIDO":
        return t("filters.resolved");
    }
  }

  function rotuloTipo(valor?: string | null) {
    const codigo = normalizarTexto(valor);

    if (codigo.includes("sugest")) {
      return t("types.suggestion");
    }

    if (codigo.includes("reclama")) {
      return t("types.complaint");
    }

    if (
      codigo.includes("elogio") ||
      codigo.includes("compliment") ||
      codigo.includes("praise")
    ) {
      return t("types.compliment");
    }

    if (
      codigo.includes("relato") ||
      codigo.includes("report")
    ) {
      return t("types.report");
    }

    return valor || "-";
  }

  function rotuloOrigem(valor?: string | null) {
    switch (String(valor || "").toUpperCase()) {
      case "ALUNO":
        return t("values.origin.student");
      case "PROFESSOR":
        return t("values.origin.teacher");
      case "ADMIN":
        return t("values.origin.admin");
      case "FUNCIONARIO":
        return t("values.origin.employee");
      default:
        return valor || "-";
    }
  }

  function rotuloStatus(valor?: string | null) {
    switch (String(valor || "").toUpperCase()) {
      case "ABERTO":
        return t("values.status.open");
      case "PENDENTE":
        return t("values.status.pending");
      case "EM_ANALISE":
        return t("values.status.inAnalysis");
      case "RESOLVIDO":
        return t("values.status.resolved");
      default:
        return valor || "-";
    }
  }

  function rotuloSentimento(valor?: string | null) {
    switch (String(valor || "").toUpperCase()) {
      case "CRITICO":
        return t("values.sentiment.critical");
      case "NEUTRO":
        return t("values.sentiment.neutral");
      case "POSITIVO":
        return t("values.sentiment.positive");
      default:
        return valor || "-";
    }
  }

  function rotuloPrioridade(valor?: string | null) {
    switch (String(valor || "").toUpperCase()) {
      case "BAIXA":
        return t("priorities.low");
      case "NORMAL":
        return t("priorities.normal");
      case "ALTA":
        return t("priorities.high");
      case "URGENTE":
        return t("priorities.urgent");
      default:
        return valor || "-";
    }
  }

  function rotuloTipoNovo(valor: TipoManifestacao) {
    switch (valor) {
      case "Sugestão":
        return t("types.suggestion");
      case "Reclamação":
        return t("types.complaint");
      case "Elogio":
        return t("types.compliment");
      case "Relato":
        return t("types.report");
    }
  }

  function rotuloPrioridadeNova(valor: Prioridade) {
    switch (valor) {
      case "BAIXA":
        return t("priorities.low");
      case "NORMAL":
        return t("priorities.normal");
      case "ALTA":
        return t("priorities.high");
      case "URGENTE":
        return t("priorities.urgent");
    }
  }

  async function marcarComoResolvido(id: number) {
    try {
      setAtualizandoId(id);
      limparFeedback();

      const res = await fetch(`/api/ouvidoria/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: "RESOLVIDO",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
          t("errors.resolve")
        );
      }

      setChamados((atuais) =>
        atuais.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "RESOLVIDO",
              }
            : item
        )
      );

      setSucesso(t("feedback.resolved"));
    } catch (error: unknown) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : t("errors.resolve")
      );
    } finally {
      setAtualizandoId(null);
    }
  }

  function gerarRespostaSugerida(
    item: ChamadoOuvidoria
  ) {
    const tipo = normalizarTexto(item.tipo);

    if (tipo.includes("elogio")) {
      return t("suggestedReplies.compliment");
    }

    if (tipo.includes("sugest")) {
      return t("suggestedReplies.suggestion");
    }

    if (tipo.includes("reclama")) {
      return t("suggestedReplies.complaint");
    }

    return t("suggestedReplies.default");
  }

  async function salvarNovoChamado() {
    if (!novaMensagem.trim()) {
      setSucesso("");
      setErro(t("validation.messageRequired"));
      return;
    }

    try {
      limparFeedback();

      const res = await fetch(
        "/api/ouvidoria-phanyx",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            origem: "ADMIN",
            tipo: novoTipo,
            titulo: novoTitulo,
            mensagem: novaMensagem,
            prioridade: novaPrioridade,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
          t("errors.create")
        );
      }

      setModalNovoChamado(false);
      setNovoTipo("Sugestão");
      setNovoTitulo("");
      setNovaMensagem("");
      setNovaPrioridade("NORMAL");
      setSucesso(t("feedback.created"));
    } catch (error: unknown) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : t("errors.create")
      );
    }
  }

  function abrirModalResposta(
    item: ChamadoOuvidoria
  ) {
    limparFeedback();
    setChamadoSelecionado(item);

    setRespostaTexto(
      item.resposta ||
      gerarRespostaSugerida(item)
    );
  }

  async function salvarResposta() {
    if (!chamadoSelecionado) {
      return;
    }

    if (!respostaTexto.trim()) {
      setSucesso("");
      setErro(t("validation.responseRequired"));
      return;
    }

    try {
      setSalvandoResposta(true);
      limparFeedback();

      const res = await fetch(
        `/api/ouvidoria/${chamadoSelecionado.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            resposta: respostaTexto,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
          t("errors.saveResponse")
        );
      }

      setChamados((atuais) =>
        atuais.map((item) =>
          item.id === chamadoSelecionado.id
            ? {
                ...item,
                resposta: respostaTexto,
                status: "RESOLVIDO",
              }
            : item
        )
      );

      setChamadoSelecionado(null);
      setRespostaTexto("");
      setSucesso(t("feedback.responseSaved"));
    } catch (error: unknown) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : t("errors.saveResponse")
      );
    } finally {
      setSalvandoResposta(false);
    }
  }

  const chamadosFiltrados =
    chamados.filter((item) => {
      if (filtro === "TODOS") {
        return true;
      }

      return (
        String(item.status || "").toUpperCase() === filtro ||
        String(item.sentimento || "").toUpperCase() === filtro ||
        String(item.origem || "").toUpperCase() === filtro
      );
    });

  return (
    <main className="space-y-8 text-slate-900 dark:text-slate-100">
      {(erro || sucesso) && (
        <div className="fixed right-4 top-4 z-[99999] w-[calc(100%-2rem)] max-w-md">
          <div
            role={erro ? "alert" : "status"}
            className={[
              "rounded-2xl border px-5 py-4 text-sm font-bold shadow-2xl backdrop-blur",
              erro
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/90 dark:text-red-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/90 dark:text-emerald-100",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-4">
              <p>{erro || sucesso}</p>

              <button
                type="button"
                onClick={limparFeedback}
                className="rounded-full px-2 text-lg leading-none opacity-70 transition hover:opacity-100"
                aria-label={t("actions.closeNotice")}
              >
                {"×"}
              </button>
            </div>
          </div>
        </div>
      )}

      <header>
        <p className="text-sm font-bold tracking-[0.25em] text-blue-700 dark:text-blue-300">
          {t("header.eyebrow")}
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
          {t("header.title")}
        </h1>

        <p className="mt-2 max-w-4xl text-slate-600 dark:text-slate-300">
          {t("header.description")}
        </p>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setModalNovoChamado(true)}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
          >
            {t("actions.newManifestation")}
          </button>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-blue-100 p-8 shadow-xl dark:border-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-700 dark:text-cyan-300">
          {t("executive.eyebrow")}
        </p>

        <h2 className="mt-4 text-4xl font-black text-slate-900 dark:text-white">
          {t("executive.title")}
        </h2>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          {t("executive.description")}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t("stats.total")}
          </p>
          <h3 className="mt-2 text-3xl font-black">
            {chamados.length}
          </h3>
        </div>

        <div className="rounded-3xl border border-red-200 bg-white p-5 shadow-sm dark:border-red-900/60 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t("stats.critical")}
          </p>
          <h3 className="mt-2 text-3xl font-black text-red-600 dark:text-red-400">
            {
              chamados.filter(
                (item) => item.sentimento === "CRITICO"
              ).length
            }
          </h3>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm dark:border-amber-900/60 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t("stats.inAnalysis")}
          </p>
          <h3 className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">
            {
              chamados.filter(
                (item) => item.status === "EM_ANALISE"
              ).length
            }
          </h3>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900/60 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t("stats.resolved")}
          </p>
          <h3 className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {
              chamados.filter(
                (item) => item.status === "RESOLVIDO"
              ).length
            }
          </h3>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFiltro(item)}
            className={[
              "rounded-full border px-4 py-2 text-xs font-black transition",
              filtro === item
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
            ].join(" ")}
          >
            {rotuloFiltro(item)}
          </button>
        ))}
      </div>

      <section className="space-y-4">
        {carregando ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {t("states.loading")}
          </div>
        ) : null}

        {!carregando &&
        chamadosFiltrados.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {t("states.emptyTitle")}
            </h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t("states.emptyDescription")}
            </p>
          </div>
        ) : null}

        {!carregando &&
          chamadosFiltrados.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    {t("item.manifestation", {
                      id: item.id,
                    })}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {rotuloOrigem(item.origem)}{" "}
                    {"•"}{" "}
                    {rotuloTipo(item.tipo)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {rotuloStatus(item.status)}
                  </span>

                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-bold",
                      item.sentimento === "CRITICO"
                        ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                        : item.sentimento === "POSITIVO"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300",
                    ].join(" ")}
                  >
                    {rotuloSentimento(item.sentimento)}
                  </span>

                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300">
                    {rotuloPrioridade(item.prioridade)}
                  </span>
                </div>
              </div>

              {item.titulo ? (
                <h3 className="mt-5 font-bold text-slate-900 dark:text-white">
                  {item.titulo}
                </h3>
              ) : null}

              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {"“"}
                {item.mensagem}
                {"”"}
              </p>

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
                <p className="text-xs font-black uppercase text-blue-700 dark:text-blue-300">
                  {t("item.aiSuggestionTitle")}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {t("item.aiSuggestion")}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t("actions.details")}
                </button>

                <button
                  type="button"
                  onClick={() => abrirModalResposta(item)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  {t("actions.reply")}
                </button>

                <button
                  type="button"
                  onClick={() => marcarComoResolvido(item.id)}
                  disabled={
                    atualizandoId === item.id ||
                    item.status === "RESOLVIDO" ||
                    !item.resposta
                  }
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {item.status === "RESOLVIDO"
                    ? t("actions.resolved")
                    : !item.resposta
                      ? t("actions.replyFirst")
                      : atualizandoId === item.id
                        ? t("actions.updating")
                        : t("actions.markResolved")}
                </button>
              </div>
            </article>
          ))}
      </section>

      {chamadoSelecionado ? (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700 dark:text-blue-300">
                  {t("responseModal.eyebrow")}
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {t("responseModal.title")}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setChamadoSelecionado(null)}
                aria-label={t("actions.closeModal")}
                className="rounded-full bg-slate-100 px-3 py-2 font-black text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {"×"}
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                {t("responseModal.received")}
              </p>

              <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                {rotuloOrigem(chamadoSelecionado.origem)}{" "}
                {"•"}{" "}
                {rotuloTipo(chamadoSelecionado.tipo)}
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {"“"}
                {chamadoSelecionado.mensagem}
                {"”"}
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                {t("responseModal.responseLabel")}
              </label>

              <textarea
                value={respostaTexto}
                onChange={(event) =>
                  setRespostaTexto(
                    event.target.value
                  )
                }
                rows={7}
                className="w-full rounded-2xl border border-slate-300 bg-white p-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setChamadoSelecionado(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t("actions.cancel")}
              </button>

              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(
                    respostaTexto
                  )
                }
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                {t("actions.copyResponse")}
              </button>

              <button
                type="button"
                onClick={salvarResposta}
                disabled={salvandoResposta}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {salvandoResposta
                  ? t("actions.saving")
                  : t("actions.saveResponse")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalNovoChamado ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {t("newModal.title")}
              </h2>

              <button
                type="button"
                onClick={() => setModalNovoChamado(false)}
                aria-label={t("actions.closeModal")}
                className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                {"×"}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  {t("newModal.type")}
                </label>

                <select
                  value={novoTipo}
                  onChange={(event) =>
                    setNovoTipo(
                      event.target.value as TipoManifestacao
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                >
                  {TIPOS.map((tipo) => (
                    <option
                      key={tipo}
                      value={tipo}
                    >
                      {rotuloTipoNovo(tipo)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  {t("newModal.priority")}
                </label>

                <select
                  value={novaPrioridade}
                  onChange={(event) =>
                    setNovaPrioridade(
                      event.target.value as Prioridade
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                >
                  {PRIORIDADES.map((prioridade) => (
                    <option
                      key={prioridade}
                      value={prioridade}
                    >
                      {rotuloPrioridadeNova(prioridade)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  {t("newModal.titleLabel")}
                </label>

                <input
                  value={novoTitulo}
                  onChange={(event) =>
                    setNovoTitulo(
                      event.target.value
                    )
                  }
                  placeholder={t(
                    "newModal.titlePlaceholder"
                  )}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  {t("newModal.message")}
                </label>

                <textarea
                  value={novaMensagem}
                  onChange={(event) =>
                    setNovaMensagem(
                      event.target.value
                    )
                  }
                  rows={6}
                  placeholder={t(
                    "newModal.messagePlaceholder"
                  )}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalNovoChamado(false)}
                className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                {t("actions.cancel")}
              </button>

              <button
                type="button"
                onClick={salvarNovoChamado}
                className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
              >
                {t("actions.saveManifestation")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
