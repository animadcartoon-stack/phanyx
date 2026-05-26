"use client";

import { useMemo, useState } from "react";

type Trabalho = {
  aluno: string;
  disciplina: string;
  titulo: string;
  observacao: string;
  status: "Enviado" | "Avaliado";
  nota?: number;
  feedback?: string;
};

function normalizarTexto(valor: string) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function distanciaLevenshtein(a: string, b: string) {
  const matriz = Array.from({ length: b.length + 1 }, (_, i) => [i]);

  for (let j = 0; j <= a.length; j++) {
    matriz[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matriz[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? matriz[i - 1][j - 1]
          : Math.min(
              matriz[i - 1][j - 1] + 1,
              matriz[i][j - 1] + 1,
              matriz[i - 1][j] + 1
            );
    }
  }

  return matriz[b.length][a.length];
}

function calcularSimilaridade(busca: string, texto: string) {
  const b = normalizarTexto(busca);
  const t = normalizarTexto(texto);

  if (!b || !t) return 0;
  if (t.startsWith(b)) return 100;
  if (t.includes(b)) return 90;

  const distancia = distanciaLevenshtein(b, t);
  const maior = Math.max(b.length, t.length);

  return Math.round((1 - distancia / maior) * 100);
}

function textoDoTrabalho(t: Trabalho) {
  return [
    t.aluno,
    t.disciplina,
    t.titulo,
    t.observacao,
    t.status,
    String(t.nota ?? ""),
    t.feedback || "",
  ].join(" ");
}

export default function TrabalhosProfessorPage() {
  const [busca, setBusca] = useState("");
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([
    {
      aluno: "João da Silva",
      disciplina: "Antigo Testamento",
      titulo: "Análise do Pentateuco",
      observacao: "Trabalho em PDF",
      status: "Enviado",
    },
  ]);

const sugestoes = useMemo(() => {
  const termo = normalizarTexto(busca);

  if (!termo) return [];

  const opcoes = trabalhos
    .flatMap((t) => [
      t.aluno,
      t.disciplina,
      t.titulo,
      t.observacao,
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
    .slice(0, 6);
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
    <main className="p-4 text-slate-900">
      <h1 className="text-2xl font-bold mb-6">
        Avaliação de Trabalhos
      </h1>

<div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
  <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
    Buscar trabalhos
  </label>

  <input
    value={busca}
    onChange={(e) => setBusca(e.target.value)}
    placeholder="Digite aluno, disciplina, status, nota ou feedback..."
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
</div>

{busca && trabalhosFiltrados.length === 0 && (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
    Nenhum trabalho encontrado. Tente buscar pelo nome do aluno, disciplina,
    título, status, nota ou feedback.
  </div>
)}

<div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
  <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
    Buscar trabalhos
  </label>

  <input
    value={busca}
    onChange={(e) => setBusca(e.target.value)}
    placeholder="Digite aluno, disciplina, status, nota ou feedback..."
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
</div>

{busca && trabalhosFiltrados.length === 0 && (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
    Nenhum trabalho encontrado. Tente buscar pelo nome do aluno, disciplina,
    título, status, nota ou feedback.
  </div>
)}

      <div className="overflow-x-auto rounded-2xl bg-white shadow">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-8 font-semibold bg-gray-100 p-3 border-b">
            <span>Aluno</span>
            <span>Disciplina</span>
            <span>Título</span>
            <span>Status</span>
            <span>Nota</span>
            <span>Feedback</span>
            <span></span>
            <span></span>
          </div>

          {trabalhosFiltrados.map((t, i) => (
            <TrabalhoRow
              key={i}
              trabalho={t}
              onAvaliar={(nota, feedback) =>
                avaliar(i, nota, feedback)
              }
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function TrabalhoRow({
  trabalho,
  onAvaliar,
}: {
  trabalho: Trabalho;
  onAvaliar: (nota: number, feedback: string) => void;
}) {
  const [nota, setNota] = useState("");
  const [feedback, setFeedback] = useState("");

  return (
    <div className="grid grid-cols-8 p-3 border-t items-center gap-3">
      <span>{trabalho.aluno}</span>
      <span>{trabalho.disciplina}</span>
      <span>{trabalho.titulo}</span>

      <span
        className={
          trabalho.status === "Avaliado"
            ? "text-green-600 font-semibold"
            : "text-blue-600 font-semibold"
        }
      >
        {trabalho.status}
      </span>

      {trabalho.status === "Avaliado" ? (
        <>
          <span>{trabalho.nota}</span>
          <span className="text-sm">{trabalho.feedback}</span>
          <span></span>
          <span></span>
        </>
      ) : (
        <>
          <input
            type="number"
            min={0}
            max={10}
            className="border p-2 rounded w-full bg-white text-black"
            placeholder="Nota"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />

          <input
            className="border p-2 rounded w-full bg-white text-black"
            placeholder="Feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />

          <button
            onClick={() => onAvaliar(Number(nota), feedback)}
            className="bg-green-600 text-white px-3 py-2 rounded whitespace-nowrap"
          >
            Avaliar
          </button>

          <span></span>
        </>
      )}
    </div>
  );
}