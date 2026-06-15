"use client";

import { useEffect, useState } from "react";

type Publicacao = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  notaMaxima: number;
  status: string;
  enviadoParaApoioDocenteEm?: string | null;
  createdAt?: string | null;
  turma?: { id: number; nome: string } | null;
  disciplina?: { id: number; nome: string } | null;
  professorResponsavel?: { id: number; nome: string } | null;
  criadoPor?: { id: number; nome: string; email: string } | null;
  anexos?: {
    id: number;
    titulo: string;
    url: string;
    arquivoNome?: string | null;
  }[];
};

export default function PublicacoesAcademicasPage() {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/admin/academico/publicacoes", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar publicações");
      }

      setPublicacoes(Array.isArray(data?.atividades) ? data.atividades : []);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar publicações");
      setPublicacoes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function formatarData(data?: string | null) {
    if (!data) return "-";

    try {
      return new Date(data).toLocaleString("pt-BR");
    } catch {
      return data;
    }
  }

  async function publicarAtividade(atividadeId: number) {
  try {
    setErro("");

    const res = await fetch(
      `/api/admin/academico/publicacoes/${atividadeId}/publicar`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao publicar atividade");
    }

    await carregar();
  } catch (e: any) {
    setErro(e?.message || "Erro ao publicar atividade");
  }
}

async function devolverAtividade(atividadeId: number) {
  try {
    setErro("");

    const res = await fetch(
      `/api/admin/academico/publicacoes/${atividadeId}/devolver`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao devolver atividade");
    }

    await carregar();
  } catch (e: any) {
    setErro(e?.message || "Erro ao devolver atividade");
  }
}

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
            Secretaria Acadêmica
          </p>

          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            Publicações acadêmicas
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Fila de atividades e trabalhos enviados pelos professores para
            conferência e publicação.
          </p>
        </section>

        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {erro}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Carregando publicações...
          </div>
        )}

        {!loading && publicacoes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Nenhuma publicação aguardando análise no momento.
          </div>
        )}

        {!loading && publicacoes.length > 0 && (
          <div className="grid gap-4">
            {publicacoes.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                        Aguardando publicação
                      </span>

                      <h2 className="mt-3 text-xl font-black text-slate-900 dark:text-white">
                        {item.titulo}
                      </h2>
                    </div>

                    {item.descricao && (
                      <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {item.descricao}
                      </p>
                    )}

                    <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
                      <p>
                        <strong className="text-slate-800 dark:text-slate-100">
                          Professor:
                        </strong>{" "}
                        {item.professorResponsavel?.nome || "-"}
                      </p>

                      <p>
                        <strong className="text-slate-800 dark:text-slate-100">
                          Turma:
                        </strong>{" "}
                        {item.turma?.nome || "-"}
                      </p>

                      <p>
                        <strong className="text-slate-800 dark:text-slate-100">
                          Disciplina:
                        </strong>{" "}
                        {item.disciplina?.nome || "-"}
                      </p>

                      <p>
                        <strong className="text-slate-800 dark:text-slate-100">
                          Prazo:
                        </strong>{" "}
                        {formatarData(item.prazo)}
                      </p>

                      <p>
                        <strong className="text-slate-800 dark:text-slate-100">
                          Nota máxima:
                        </strong>{" "}
                        {item.notaMaxima}
                      </p>

                      <p>
                        <strong className="text-slate-800 dark:text-slate-100">
                          Enviado em:
                        </strong>{" "}
                        {formatarData(item.enviadoParaApoioDocenteEm)}
                      </p>
                    </div>

                    {item.anexos && item.anexos.length > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Anexos
                        </p>

                        <div className="mt-3 space-y-2">
                          {item.anexos.map((anexo) => (
                            <a
                              key={anexo.id}
                              href={anexo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800"
                            >
                              {anexo.titulo || anexo.arquivoNome || "Anexo"}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-[220px] flex-col gap-2">
                    <button
  type="button"
  onClick={() => publicarAtividade(item.id)}
  className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700"
>
  Publicar para alunos
</button>

                    <button
  type="button"
  onClick={() => devolverAtividade(item.id)}
  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
>
  Devolver ao professor
</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}