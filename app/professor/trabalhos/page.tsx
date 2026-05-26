"use client";

import { useEffect, useMemo, useState } from "react";

type Trabalho = {
  entregaId: number;
  atividadeId: number;
  titulo: string;
  notaMaxima: number;
  alunoId: number;
  aluno: string;
  matricula?: string;
  turmaId: number;
  turma: string;
  curso?: string;
  semestre: string;
  periodoLetivo: string;
  texto?: string | null;
  link?: string | null;
  arquivoUrl?: string | null;
  nota?: number | null;
  feedback?: string | null;
  entregueEm?: string;
  corrigidaEm?: string | null;
  status: "Enviado" | "Avaliado";
};

function normalizarTexto(valor: string) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function calcularSimilaridade(busca: string, texto: string) {
  const b = normalizarTexto(busca);
  const t = normalizarTexto(texto);

  if (!b || !t) return 0;
  if (t.startsWith(b)) return 100;
  if (t.includes(b)) return 90;

  let iguais = 0;
  for (const letra of b) {
    if (t.includes(letra)) iguais++;
  }

  return Math.round((iguais / Math.max(b.length, 1)) * 70);
}

function textoDoTrabalho(t: Trabalho) {
  return [
    t.aluno,
    t.matricula,
    t.turma,
    t.curso,
    t.semestre,
    t.periodoLetivo,
    t.titulo,
    t.status,
    String(t.nota ?? ""),
    t.feedback || "",
  ].join(" ");
}

function formatarData(data?: string | null) {
  if (!data) return "-";

  try {
    return new Date(data).toLocaleString("pt-BR");
  } catch {
    return data;
  }
}

export default function TrabalhosProfessorPage() {
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    carregarTrabalhos();
  }, []);

  async function carregarTrabalhos() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/professor/trabalhos", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao carregar trabalhos");
      }

      setTrabalhos(Array.isArray(json.trabalhos) ? json.trabalhos : []);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar trabalhos");
      setTrabalhos([]);
    } finally {
      setLoading(false);
    }
  }

  function alternar(chave: string) {
    setAbertos((prev) => ({
      ...prev,
      [chave]: !prev[chave],
    }));
  }

  const sugestoes = useMemo(() => {
    const termo = normalizarTexto(busca);
    if (!termo) return [];

    const opcoes = trabalhos
      .flatMap((t) => [
        t.aluno,
        t.matricula || "",
        t.turma,
        t.curso || "",
        t.semestre,
        t.periodoLetivo,
        t.titulo,
        t.status,
        String(t.nota ?? ""),
        t.feedback || "",
      ])
      .filter(Boolean);

    const unicas = Array.from(new Set(opcoes));

    return unicas
      .map((opcao) => ({
        texto: opcao,
        score: calcularSimilaridade(busca, opcao),
      }))
      .filter((item) => item.score >= 35)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.texto.localeCompare(b.texto, "pt-BR");
      })
      .slice(0, 8);
  }, [busca, trabalhos]);

  const trabalhosFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca);

    if (!termo) return trabalhos;

    return trabalhos
      .map((t) => ({
        trabalho: t,
        score: calcularSimilaridade(busca, textoDoTrabalho(t)),
      }))
      .filter((item) => item.score >= 35)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.trabalho.aluno.localeCompare(b.trabalho.aluno, "pt-BR");
      })
      .map((item) => item.trabalho);
  }, [busca, trabalhos]);

  const agrupado = useMemo(() => {
    const mapa: Record<string, Record<string, Record<string, Trabalho[]>>> = {};

    for (const trabalho of trabalhosFiltrados) {
      const periodo = trabalho.periodoLetivo || "Período não informado";
      const semestre = trabalho.semestre || "Semestre não informado";
      const turma = trabalho.turma || "Turma não informada";

      if (!mapa[periodo]) mapa[periodo] = {};
      if (!mapa[periodo][semestre]) mapa[periodo][semestre] = {};
      if (!mapa[periodo][semestre][turma]) mapa[periodo][semestre][turma] = [];

      mapa[periodo][semestre][turma].push(trabalho);
    }

    return mapa;
  }, [trabalhosFiltrados]);

  async function avaliar(entregaId: number, nota: string, feedback: string) {
    try {
      setErro("");

      const res = await fetch("/api/professor/trabalhos", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entregaId,
          nota: nota === "" ? null : Number(nota),
          feedback,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao avaliar trabalho");
      }

      await carregarTrabalhos();
    } catch (e: any) {
      setErro(e?.message || "Erro ao avaliar trabalho");
    }
  }

  return (
    <main className="space-y-5 p-4 text-slate-900">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Trabalhos
        </p>

        <h1 className="mt-2 text-2xl font-black text-slate-900">
          Avaliação de Trabalhos
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Busque, organize por período, semestre e turma, e avalie os trabalhos enviados pelos alunos.
        </p>
      </section>

      <section className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          Buscar trabalhos
        </label>

        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite aluno, turma, semestre, status, nota ou feedback..."
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
        />

        {busca && sugestoes.length > 0 && (
          <div className="absolute left-4 right-4 top-[88px] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            {sugestoes.map((sugestao) => (
              <button
                key={sugestao.texto}
                type="button"
                onClick={() => setBusca(sugestao.texto)}
                className="block w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-blue-50"
              >
                {sugestao.texto}
              </button>
            ))}
          </div>
        )}
      </section>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          Carregando trabalhos...
        </div>
      )}

      {!loading && trabalhosFiltrados.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Nenhum trabalho encontrado.
        </div>
      )}

      {!loading &&
        Object.entries(agrupado).map(([periodo, semestres]) => {
          const chavePeriodo = `periodo-${periodo}`;
          const periodoAberto = abertos[chavePeriodo] ?? true;

          return (
            <section key={periodo} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => alternar(chavePeriodo)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                    Ano / período
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {periodo}
                  </h2>
                </div>

                <span className="text-2xl font-black text-slate-500">
                  {periodoAberto ? "−" : "+"}
                </span>
              </button>

              {periodoAberto && (
                <div className="space-y-4 border-t border-slate-100 p-4">
                  {Object.entries(semestres).map(([semestre, turmas]) => {
                    const chaveSemestre = `${chavePeriodo}-semestre-${semestre}`;
                    const semestreAberto = abertos[chaveSemestre] ?? true;

                    return (
                      <div key={semestre} className="rounded-2xl border border-slate-200 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => alternar(chaveSemestre)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left"
                        >
                          <h3 className="font-black text-slate-900">
                            {semestre}
                          </h3>

                          <span className="text-xl font-black text-slate-500">
                            {semestreAberto ? "−" : "+"}
                          </span>
                        </button>

                        {semestreAberto && (
                          <div className="space-y-3 border-t border-slate-200 p-3">
                            {Object.entries(turmas).map(([turma, lista]) => {
                              const chaveTurma = `${chaveSemestre}-turma-${turma}`;
                              const turmaAberta = abertos[chaveTurma] ?? true;

                              return (
                                <div key={turma} className="rounded-2xl border border-slate-200 bg-white">
                                  <button
                                    type="button"
                                    onClick={() => alternar(chaveTurma)}
                                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                                  >
                                    <div>
                                      <h4 className="font-black text-slate-900">
                                        {turma}
                                      </h4>
                                      <p className="text-xs text-slate-500">
                                        {lista.length} trabalho(s)
                                      </p>
                                    </div>

                                    <span className="text-xl font-black text-slate-500">
                                      {turmaAberta ? "−" : "+"}
                                    </span>
                                  </button>

                                  {turmaAberta && (
                                    <div className="space-y-3 border-t border-slate-100 p-3">
                                      {lista
                                        .sort((a, b) => a.aluno.localeCompare(b.aluno, "pt-BR"))
                                        .map((trabalho) => (
                                          <TrabalhoAluno
                                            key={trabalho.entregaId}
                                            trabalho={trabalho}
                                            onAvaliar={avaliar}
                                          />
                                        ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
    </main>
  );
}

function TrabalhoAluno({
  trabalho,
  onAvaliar,
}: {
  trabalho: Trabalho;
  onAvaliar: (entregaId: number, nota: string, feedback: string) => void;
}) {
  const [nota, setNota] = useState(String(trabalho.nota ?? ""));
  const [feedback, setFeedback] = useState(trabalho.feedback || "");

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Aluno
          </p>

          <h5 className="mt-1 text-lg font-black text-slate-900">
            {trabalho.aluno}
          </h5>

          <div className="mt-3 space-y-1 text-sm leading-6 text-slate-600">
            <p>
              <strong className="text-slate-800">Trabalho:</strong>{" "}
              {trabalho.titulo}
            </p>

            {trabalho.matricula && (
              <p>
                <strong className="text-slate-800">Matrícula:</strong>{" "}
                {trabalho.matricula}
              </p>
            )}

            <p>
              <strong className="text-slate-800">Entregue em:</strong>{" "}
              {formatarData(trabalho.entregueEm)}
            </p>

            {trabalho.arquivoUrl && (
              <a
                href={trabalho.arquivoUrl}
                target="_blank"
rel="noopener noreferrer"
className="inline-flex text-sm font-bold text-blue-600 hover:underline"
              >
                Abrir arquivo enviado
              </a>
            )}

            {trabalho.link && (
              <a
                href={trabalho.link}
                target="_blank"
rel="noopener noreferrer"
className="block text-sm font-bold text-blue-600 hover:underline"
              >
                Abrir link enviado
              </a>
            )}
          </div>
        </div>

        <span
          className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
            trabalho.status === "Avaliado"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-blue-200 bg-blue-50 text-blue-700"
          }`}
        >
          {trabalho.status}
        </span>
      </div>

      {trabalho.texto && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
          {trabalho.texto}
        </div>
      )}

      <div className="mt-4 grid gap-3 lg:grid-cols-[140px_1fr_160px]">
        <input
          type="number"
          min={0}
          max={trabalho.notaMaxima || 10}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Nota"
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
        />

        <input
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Feedback"
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
        />

        <button
          type="button"
          onClick={() => onAvaliar(trabalho.entregaId, nota, feedback)}
          className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700"
        >
          Avaliar
        </button>
      </div>
    </article>
  );
}