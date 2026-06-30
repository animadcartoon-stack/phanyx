"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Historico = {
  id: number;
  versao: number;
  texto?: string | null;
  link?: string | null;
  arquivoUrl?: string | null;
  entregueEm?: string | null;
};

type Trabalho = {
  entregaId: number;
  titulo: string;
  descricao?: string | null;
  notaMaxima: number;
  prazo?: string | null;
  aluno: string;
  matricula?: string;
  curso?: string;
  turma: string;
  semestre: string;
  periodoLetivo: string;
  texto?: string | null;
  link?: string | null;
  arquivoUrl?: string | null;
  nota?: number | null;
  feedback?: string | null;
  entregueEm?: string | null;
  corrigidaEm?: string | null;
  historicos?: Historico[];
  status: "Enviado" | "Avaliado";
};

type Props = {
  entregaId: number;
};

function formatarData(data?: string | null) {
  if (!data) return "-";
  try {
    return new Date(data).toLocaleString("pt-BR");
  } catch {
    return data;
  }
}

export default function CorrecaoTrabalhoClient({ entregaId }: Props) {
  const [trabalho, setTrabalho] = useState<Trabalho | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarTrabalho();
  }, [entregaId]);

  async function carregarTrabalho() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch(`/api/professor/trabalhos/${entregaId}`, {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao carregar entrega");
      }

      setTrabalho(json.trabalho || null);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar entrega");
      setTrabalho(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6 p-4 text-slate-900 dark:text-slate-100">
      <div>
        <Link
          href="/professor/trabalhos"
          className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          ← Voltar para trabalhos
        </Link>
      </div>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {erro}
        </div>
      )}

      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Carregando entrega...
        </div>
      )}

      {!loading && trabalho && (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
              Trabalhos
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
              Correção da entrega
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Entrega #{trabalho.entregaId}
            </p>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <InfoCard titulo="Aluno" valor={trabalho.aluno} />
            <InfoCard titulo="Status" valor={trabalho.status} />
            <InfoCard titulo="Data da entrega" valor={formatarData(trabalho.entregueEm)} />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card titulo="Atividade">
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p>
                  <strong className="text-slate-800 dark:text-slate-100">Título:</strong>{" "}
                  {trabalho.titulo}
                </p>

                <p>
                  <strong className="text-slate-800 dark:text-slate-100">Nota máxima:</strong>{" "}
                  {trabalho.notaMaxima}
                </p>

                <p>
                  <strong className="text-slate-800 dark:text-slate-100">Prazo:</strong>{" "}
                  {formatarData(trabalho.prazo)}
                </p>

                <div className="whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  {trabalho.descricao || "Sem descrição informada."}
                </div>
              </div>
            </Card>

            <Card titulo="Dados acadêmicos">
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p><strong className="text-slate-800 dark:text-slate-100">Matrícula:</strong> {trabalho.matricula || "-"}</p>
                <p><strong className="text-slate-800 dark:text-slate-100">Curso:</strong> {trabalho.curso || "-"}</p>
                <p><strong className="text-slate-800 dark:text-slate-100">Turma:</strong> {trabalho.turma || "-"}</p>
                <p><strong className="text-slate-800 dark:text-slate-100">Semestre:</strong> {trabalho.semestre || "-"}</p>
                <p><strong className="text-slate-800 dark:text-slate-100">Período letivo:</strong> {trabalho.periodoLetivo || "-"}</p>
              </div>
            </Card>
          </section>

          <Card titulo="Entrega do aluno">
            <div className="space-y-4">
              <div className="whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                {trabalho.texto || "O aluno não enviou texto."}
              </div>

              <div className="flex flex-wrap gap-3">
                {trabalho.link ? (
                  <a
                    href={trabalho.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    Abrir link enviado
                  </a>
                ) : (
                  <span className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    Sem link enviado
                  </span>
                )}

                {trabalho.arquivoUrl ? (
                  <a
                    href={trabalho.arquivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    Abrir arquivo enviado
                  </a>
                ) : (
                  <span className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    Sem arquivo enviado
                  </span>
                )}
              </div>
            </div>
          </Card>

          <Card titulo="Avaliação">
            <div className="grid gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Nota
                </label>
                <input
                  type="number"
                  min={0}
                  max={trabalho.notaMaxima}
                  defaultValue={trabalho.nota ?? ""}
                  placeholder="Digite a nota"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Feedback para o aluno
                </label>
                <textarea
                  rows={6}
                  defaultValue={trabalho.feedback || ""}
                  placeholder="Digite o feedback da correção..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                >
                  Salvar correção
                </button>
              </div>
            </div>
          </Card>

          <Card titulo="Histórico de versões">
            {trabalho.historicos && trabalho.historicos.length > 0 ? (
              <div className="space-y-3">
                {trabalho.historicos.map((historico) => (
                  <div
                    key={historico.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <p className="font-black text-slate-900 dark:text-white">
                      Versão {historico.versao}
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Enviada em: {formatarData(historico.entregueEm)}
                    </p>

                    {historico.texto && (
                      <p className="mt-3 whitespace-pre-line text-slate-700 dark:text-slate-300">
                        {historico.texto}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-3">
                      {historico.link && (
                        <a href={historico.link} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline dark:text-blue-400">
                          Abrir link
                        </a>
                      )}

                      {historico.arquivoUrl && (
                        <a href={historico.arquivoUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline dark:text-blue-400">
                          Abrir arquivo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Nenhuma versão anterior registrada.
              </div>
            )}
          </Card>
        </>
      )}
    </main>
  );
}

function Card({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-black text-slate-900 dark:text-white">{titulo}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoCard({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {titulo}
      </p>
      <p className="mt-2 text-lg font-black text-slate-900 dark:text-white">
        {valor}
      </p>
    </section>
  );
}