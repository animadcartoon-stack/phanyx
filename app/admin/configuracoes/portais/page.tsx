"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type ModoVisibilidadePortal =
  | "AUTOMATICO"
  | "SEMPRE_VISIVEL"
  | "OCULTO";

type PaginaPortal = {
  id: number | null;
  portal: "ALUNO" | "PROFESSOR";
  chavePagina: string;
  nome: string;
  visivel: boolean;
  descricao?: string;
  automaticoNoPeriodo?: boolean;
  controleAutomatico?: boolean;
  modoVisibilidade?: ModoVisibilidadePortal | null;
};

const CHAVE_REMATRICULA_ALUNO = "aluno.rematricula";

const PAGINA_REMATRICULA_ALUNO: PaginaPortal = {
  id: null,
  portal: "ALUNO",
  chavePagina: CHAVE_REMATRICULA_ALUNO,
  nome: "Rematrícula semestral",
  visivel: false,
  descricao:
    "Permite ao aluno consultar e realizar a rematrícula para o próximo semestre.",
  automaticoNoPeriodo: true,
  controleAutomatico: true,
  modoVisibilidade: "AUTOMATICO",
};

function normalizarPaginasPortal(
  paginasRecebidas: PaginaPortal[],
): PaginaPortal[] {
  const paginaExistente = paginasRecebidas.find(
    (pagina) =>
      pagina.portal === "ALUNO" &&
      pagina.chavePagina === CHAVE_REMATRICULA_ALUNO,
  );

  const paginaRematricula: PaginaPortal = {
    ...PAGINA_REMATRICULA_ALUNO,
    ...paginaExistente,
    nome: "Rematrícula semestral",
    descricao:
      "Permite ao aluno consultar e realizar a rematrícula para o próximo semestre.",
    automaticoNoPeriodo: true,
    controleAutomatico: true,
    modoVisibilidade:
      paginaExistente?.modoVisibilidade ??
      "AUTOMATICO",
  };

  const paginasSemRematricula = paginasRecebidas.filter(
    (pagina) =>
      !(
        pagina.portal === "ALUNO" &&
        pagina.chavePagina === CHAVE_REMATRICULA_ALUNO
      ),
  );

  const indicePainelAluno = paginasSemRematricula.findIndex(
    (pagina) =>
      pagina.portal === "ALUNO" &&
      pagina.chavePagina === "aluno.painel",
  );

  paginasSemRematricula.splice(
    indicePainelAluno >= 0 ? indicePainelAluno + 1 : 0,
    0,
    paginaRematricula,
  );

  return paginasSemRematricula;
}

export default function ConfiguracaoPortaisPage() {
  const t = useTranslations("AdminPortalVisibilitySettings");
  const [paginas, setPaginas] = useState<PaginaPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/admin/configuracoes/portais", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("messages.loadError"));
      }

      const paginasRecebidas = Array.isArray(data?.paginas)
        ? data.paginas
        : [];

      setPaginas(normalizarPaginasPortal(paginasRecebidas));
    } catch (e: any) {
      setErro(e?.message || t("messages.loadError"));
      setPaginas([]);
    } finally {
      setLoading(false);
    }
  }

  async function salvar() {
    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const res = await fetch("/api/admin/configuracoes/portais", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paginas: paginas.map((pagina) => ({
            id: pagina.id,
            portal: pagina.portal,
            chavePagina: pagina.chavePagina,
            nome: pagina.nome,
            visivel: pagina.visivel,
            modoVisibilidade:
              pagina.modoVisibilidade,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("messages.saveError"));
      }

      setMensagem(t("messages.saveSuccess"));
      await carregar();
    } catch (e: any) {
      setErro(e?.message || t("messages.saveError"));
    } finally {
      setSalvando(false);
    }
  }

  function alternar(chavePagina: string) {
    setPaginas((atuais) =>
      atuais.map((item) =>
        item.chavePagina === chavePagina
          ? { ...item, visivel: !item.visivel }
          : item
      )
    );
  }

  function alterarModoVisibilidade(
    chavePagina: string,
    modoVisibilidade: ModoVisibilidadePortal,
  ) {
    setPaginas((atuais) =>
      atuais.map((item) =>
        item.chavePagina === chavePagina
          ? {
            ...item,
            modoVisibilidade,
            visivel:
              modoVisibilidade ===
              "SEMPRE_VISIVEL",
          }
          : item,
      ),
    );
  }

  useEffect(() => {
    carregar();
  }, []);

  const paginasAluno = useMemo(
    () => paginas.filter((p) => p.portal === "ALUNO"),
    [paginas]
  );

  const paginasProfessor = useMemo(
    () => paginas.filter((p) => p.portal === "PROFESSOR"),
    [paginas]
  );

  return (
    <main className="phanyx-config-page phanyx-portais-page min-h-screen p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="phanyx-config-card p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
            {t("page.kicker")}
          </p>

          <h1 className="phanyx-config-title mt-2 text-2xl font-black">
            {t("page.title")}
          </h1>

          <p className="phanyx-config-muted mt-2 text-sm leading-6">
            {t("page.description")}
          </p>
        </section>

        {mensagem && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {erro}
          </div>
        )}

        {loading ? (
          <div className="phanyx-config-card p-6 text-sm shadow-sm">
            {t("page.loading")}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <BlocoPortal
              titulo={t("sections.student.title")}
              descricao={t("sections.student.description")}
              paginas={paginasAluno}
              onAlternar={alternar}
              onAlterarModo={alterarModoVisibilidade}
            />

            <BlocoPortal
              titulo={t("sections.professor.title")}
              descricao={t("sections.professor.description")}
              paginas={paginasProfessor}
              onAlternar={alternar}
              onAlterarModo={alterarModoVisibilidade}
            />
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando || loading}
            className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando ? t("actions.saving") : t("actions.save")}
          </button>
        </div>
      </div>
    </main>
  );
}

function BlocoPortal({
  titulo,
  descricao,
  paginas,
  onAlternar,
  onAlterarModo,
}: {
  titulo: string;
  descricao: string;
  paginas: PaginaPortal[];
  onAlternar: (chavePagina: string) => void;
  onAlterarModo: (
    chavePagina: string,
    modo: ModoVisibilidadePortal,
  ) => void;
}) {
  const t = useTranslations("AdminPortalVisibilitySettings");

  function nomePaginaTraduzido(
    pagina: PaginaPortal,
  ) {
    switch (pagina.chavePagina) {
      case "aluno.painel":
        return t("pages.student.dashboard");
      case CHAVE_REMATRICULA_ALUNO:
        return t("pages.student.rematriculation");
      case "aluno.disciplinas":
        return t("pages.student.subjects");
      case "aluno.progresso":
        return t("pages.student.progress");
      case "aluno.trabalhos":
        return t("pages.student.assignments");
      case "aluno.presenca":
        return t("pages.student.attendance");
      case "aluno.boletim":
        return t("pages.student.reportCard");
      case "aluno.certificados":
        return t("pages.student.certificates");
      case "aluno.historico":
        return t("pages.student.academicHistory");
      case "aluno.reunioes":
        return t("pages.student.meetings");
      case "aluno.ouvidoria":
        return t("pages.student.ombudsman");
      case "aluno.dados":
        return t("pages.student.data");
      case "professor.painel":
        return t("pages.professor.dashboard");
      case "professor.substituicoes":
        return t("pages.professor.substitutions");
      case "professor.alunos":
        return t("pages.professor.students");
      case "professor.atividades":
        return t("pages.professor.activities");
      case "professor.provas":
        return t("pages.professor.assessments");
      case "professor.trabalhos":
        return t("pages.professor.assignments");
      case "professor.reunioes":
        return t("pages.professor.meetings");
      case "professor.ouvidoria":
        return t("pages.professor.ombudsman");
      case "professor.materiais":
        return t("pages.professor.materials");
      default:
        return pagina.nome;
    }
  }
  return (
    <section className="phanyx-config-card p-6 shadow-sm">
      <div>
        <h2 className="phanyx-config-title text-xl font-black">
          {titulo}
        </h2>

        <p className="phanyx-config-muted mt-1 text-sm">
          {descricao}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {paginas.map((pagina) => {
          const ehRematricula =
            pagina.chavePagina ===
            CHAVE_REMATRICULA_ALUNO;

          if (ehRematricula) {
            const modoAtual =
              pagina.modoVisibilidade ??
              "AUTOMATICO";

            return (
              <div
                key={pagina.chavePagina}
                className="phanyx-portal-row rounded-2xl p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">
                      {t("rematriculation.name")}
                    </p>

                    <span className="rounded-full border border-emerald-500 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                      {t("rematriculation.smartControl")}
                    </span>
                  </div>

                  <p className="phanyx-config-muted mt-1 text-xs leading-5">
                    {t("rematriculation.description")}
                  </p>

                  <p className="phanyx-portal-key mt-1 text-xs">
                    {pagina.chavePagina}
                  </p>
                </div>

                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onAlterarModo(
                        pagina.chavePagina,
                        "AUTOMATICO",
                      )
                    }
                    className={`phanyx-portal-modo rounded-xl border p-3 text-left transition ${modoAtual === "AUTOMATICO"
                        ? "phanyx-portal-modo-automatico-ativo"
                        : ""
                      }`}
                  >
                    <span className="phanyx-portal-modo-titulo block text-sm font-black">
                      {t("rematriculation.modes.automatic.title")}
                    </span>

                    <span className="phanyx-portal-modo-descricao mt-1 block text-xs">
                      {t("rematriculation.modes.automatic.description")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onAlterarModo(
                        pagina.chavePagina,
                        "SEMPRE_VISIVEL",
                      )
                    }
                    className={`phanyx-portal-modo rounded-xl border p-3 text-left transition ${modoAtual === "SEMPRE_VISIVEL"
                        ? "phanyx-portal-modo-sempre-ativo"
                        : ""
                      }`}
                  >
                    <span className="phanyx-portal-modo-titulo block text-sm font-black">
                      {t("rematriculation.modes.always.title")}
                    </span>

                    <span className="phanyx-portal-modo-descricao mt-1 block text-xs">
                      {t("rematriculation.modes.always.description")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onAlterarModo(
                        pagina.chavePagina,
                        "OCULTO",
                      )
                    }
                    className={`phanyx-portal-modo rounded-xl border p-3 text-left transition ${modoAtual === "OCULTO"
                        ? "phanyx-portal-modo-oculto-ativo"
                        : ""
                      }`}
                  >
                    <span className="phanyx-portal-modo-titulo block text-sm font-black">
                      {t("rematriculation.modes.hidden.title")}
                    </span>

                    <span className="phanyx-portal-modo-descricao mt-1 block text-xs">
                      {t("rematriculation.modes.hidden.description")}
                    </span>
                  </button>
                </div>
              </div>
            );
          }

          return (
            <button
              key={pagina.chavePagina}
              type="button"
              onClick={() =>
                onAlternar(pagina.chavePagina)
              }
              className="phanyx-portal-row flex w-full items-center justify-between gap-4 rounded-2xl p-4 text-left transition"
            >
              <div>
                <p className="font-bold">
                  {nomePaginaTraduzido(pagina)}
                </p>

                <p className="phanyx-portal-key mt-1 text-xs">
                  {pagina.chavePagina}
                </p>
              </div>

              <span
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${pagina.visivel
                    ? "bg-blue-600"
                    : "bg-slate-300 dark:bg-slate-700"
                  }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${pagina.visivel
                      ? "left-6"
                      : "left-1"
                    }`}
                />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}