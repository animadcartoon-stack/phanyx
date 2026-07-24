"use client";

import { useEffect, useMemo, useState } from "react";

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
        throw new Error(data?.error || "Erro ao carregar configurações");
      }

      const paginasRecebidas = Array.isArray(data?.paginas)
  ? data.paginas
  : [];

setPaginas(normalizarPaginasPortal(paginasRecebidas));
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar configurações");
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
        throw new Error(data?.error || "Erro ao salvar configurações");
      }

      setMensagem("Configurações salvas com sucesso.");
      await carregar();
    } catch (e: any) {
      setErro(e?.message || "Erro ao salvar configurações");
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
            Configurações
          </p>

          <h1 className="phanyx-config-title mt-2 text-2xl font-black">
            Visibilidade dos Portais
          </h1>

          <p className="phanyx-config-muted mt-2 text-sm leading-6">
  Defina quais páginas aparecem para alunos e professores desta
  instituição. Páginas vinculadas a períodos acadêmicos também podem ser
  exibidas automaticamente durante as datas configuradas.
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
            Carregando configurações...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <BlocoPortal
              titulo="Área do Aluno"
              descricao="Controle as páginas visíveis no portal do aluno."
              paginas={paginasAluno}
              onAlternar={alternar}
              onAlterarModo={alterarModoVisibilidade}
            />

            <BlocoPortal
              titulo="Área do Professor"
              descricao="Controle as páginas visíveis no portal do professor."
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
            {salvando ? "Salvando..." : "Salvar configurações"}
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
              {pagina.nome}
            </p>

            <span className="rounded-full border border-emerald-500 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              Controle inteligente
            </span>
          </div>

          <p className="phanyx-config-muted mt-1 text-xs leading-5">
            {pagina.descricao}
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
            className={`rounded-xl border p-3 text-left transition ${
              modoAtual === "AUTOMATICO"
                ? "border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            <span className="block text-sm font-black">
              Automático
            </span>

            <span className="mt-1 block text-xs">
              Aparece somente quando houver período publicado e aberto para o aluno.
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
            className={`rounded-xl border p-3 text-left transition ${
              modoAtual === "SEMPRE_VISIVEL"
                ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            <span className="block text-sm font-black">
              Sempre visível
            </span>

            <span className="mt-1 block text-xs">
              A página aparece mesmo quando não existe período de rematrícula aberto.
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
            className={`rounded-xl border p-3 text-left transition ${
              modoAtual === "OCULTO"
                ? "border-red-600 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            <span className="block text-sm font-black">
              Ocultar temporariamente
            </span>

            <span className="mt-1 block text-xs">
              Não aparece no portal, mesmo que exista um período aberto e publicado.
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
          {pagina.nome}
        </p>

        <p className="phanyx-portal-key mt-1 text-xs">
          {pagina.chavePagina}
        </p>
      </div>

      <span
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
          pagina.visivel
            ? "bg-blue-600"
            : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            pagina.visivel
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