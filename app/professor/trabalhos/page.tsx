"use client";

import { useState } from "react";

type Trabalho = {
  aluno: string;
  disciplina: string;
  titulo: string;
  observacao: string;
  status: "Enviado" | "Avaliado";
  nota?: number;
  feedback?: string;
};

export default function TrabalhosProfessorPage() {
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([
    {
      aluno: "João da Silva",
      disciplina: "Antigo Testamento",
      titulo: "Análise do Pentateuco",
      observacao: "Trabalho em PDF",
      status: "Enviado",
    },
  ]);

  function avaliar(index: number, nota: number, feedback: string) {
    const novos = [...trabalhos];
    novos[index] = {
      ...novos[index],
      status: "Avaliado",
      nota,
      feedback,
    };
    setTrabalhos(novos);
  }

  return (
    <main className="space-y-5 px-1 py-2 text-slate-900 sm:px-0">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Trabalhos
        </p>

        <h1 className="mt-2 text-2xl font-black text-slate-900">
          Avaliação de Trabalhos
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Avalie os trabalhos enviados pelos alunos com nota e feedback.
        </p>
      </section>

      <section className="space-y-4">
        {trabalhos.map((trabalho, index) => (
          <TrabalhoCard
            key={`${trabalho.aluno}-${trabalho.titulo}-${index}`}
            trabalho={trabalho}
            onAvaliar={(nota, feedback) => avaliar(index, nota, feedback)}
          />
        ))}
      </section>
    </main>
  );
}

function TrabalhoCard({
  trabalho,
  onAvaliar,
}: {
  trabalho: Trabalho;
  onAvaliar: (nota: number, feedback: string) => void;
}) {
  const [nota, setNota] = useState("");
  const [feedback, setFeedback] = useState("");

  const avaliado = trabalho.status === "Avaliado";

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Aluno
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-900">
            {trabalho.aluno}
          </h2>

          <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
            <p>
              <strong className="font-semibold text-slate-800">
                Disciplina:
              </strong>{" "}
              {trabalho.disciplina}
            </p>

            <p>
              <strong className="font-semibold text-slate-800">Título:</strong>{" "}
              {trabalho.titulo}
            </p>

            <p>
              <strong className="font-semibold text-slate-800">
                Observação:
              </strong>{" "}
              {trabalho.observacao}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${
            avaliado
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-blue-200 bg-blue-50 text-blue-700"
          }`}
        >
          {trabalho.status}
        </span>
      </div>

      {avaliado ? (
        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-800">
            Nota: {trabalho.nota}
          </p>

          <p className="mt-2 text-sm leading-6 text-emerald-700">
            {trabalho.feedback || "Sem feedback informado."}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
            <input
              type="number"
              min={0}
              max={10}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
              placeholder="Nota"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />

            <input
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
              placeholder="Feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => onAvaliar(Number(nota), feedback)}
            className="w-full rounded-2xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700"
          >
            Avaliar trabalho
          </button>
        </div>
      )}
    </article>
  );
}