"use client";

import { useEffect, useMemo, useState } from "react";

type PaginaPortal = {
  id: number | null;
  portal: "ALUNO" | "PROFESSOR";
  chavePagina: string;
  nome: string;
  visivel: boolean;
  descricao?: string;
  automaticoNoPeriodo?: boolean;
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
            />

            <BlocoPortal
              titulo="Área do Professor"
              descricao="Controle as páginas visíveis no portal do professor."
              paginas={paginasProfessor}
              onAlternar={alternar}
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
}: {
  titulo: string;
  descricao: string;
  paginas: PaginaPortal[];
  onAlternar: (chavePagina: string) => void;
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
        {paginas.map((pagina) => (
          <button
            key={pagina.chavePagina}
            type="button"
            onClick={() => onAlternar(pagina.chavePagina)}
            className="phanyx-portal-row flex w-full items-center justify-between gap-4 rounded-2xl p-4 text-left transition"
          >
            <div className="min-w-0 flex-1">
  <div className="flex flex-wrap items-center gap-2">
    <p className="font-bold">
      {pagina.nome}
    </p>

    {pagina.automaticoNoPeriodo && (
      <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
        Automática no período
      </span>
    )}
  </div>

  {pagina.descricao && (
    <p className="phanyx-config-muted mt-1 text-xs leading-5">
      {pagina.descricao}
    </p>
  )}

  <p className="phanyx-portal-key mt-1 text-xs">
    {pagina.chavePagina}
  </p>

  {pagina.automaticoNoPeriodo && (
    <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
      Durante um período de rematrícula publicado, a página será exibida
      automaticamente aos alunos elegíveis.
    </p>
  )}
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
                  pagina.visivel ? "left-6" : "left-1"
                }`}
              />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}