"use client";

import { useEffect, useState } from "react";

type Reuniao = {
  id: number;
  titulo: string;
  descricao?: string | null;
  link: string;
  dataHora: string;
  publicoTipo: string;
  status: string;
};

export default function ProfessorReunioesPage() {
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [link, setLink] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [publicoTipo, setPublicoTipo] = useState("TURMA");

  async function carregarReunioes() {
    const res = await fetch("/api/reunioes");
    const data = await res.json();

    setReunioes(Array.isArray(data) ? data : []);
  }

  async function criarReuniao() {
    const res = await fetch("/api/reunioes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        titulo,
        descricao,
        link,
        dataHora,
        publicoTipo,
      }),
    });

    if (res.ok) {
      setTitulo("");
      setDescricao("");
      setLink("");
      setDataHora("");

      carregarReunioes();
    }
  }

  useEffect(() => {
    carregarReunioes();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          📅 Reuniões
        </h1>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Agende reuniões com alunos e turmas.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">

        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Nova reunião
        </h2>

        <div className="grid gap-4 md:grid-cols-2">

          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título"
            className="rounded-xl border px-4 py-3"
          />

          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link da reunião"
            className="rounded-xl border px-4 py-3"
          />

          <input
            type="datetime-local"
            value={dataHora}
            onChange={(e) => setDataHora(e.target.value)}
            className="rounded-xl border px-4 py-3"
          />

          <select
            value={publicoTipo}
            onChange={(e) => setPublicoTipo(e.target.value)}
            className="rounded-xl border px-4 py-3"
          >
            <option value="TURMA">Turma</option>
            <option value="CURSO">Curso</option>
            <option value="INDIVIDUAL">Individual</option>
          </select>

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição"
            className="md:col-span-2 min-h-28 rounded-xl border px-4 py-3"
          />
        </div>

        <button
          onClick={criarReuniao}
          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-white"
        >
          Criar reunião
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">

        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Reuniões agendadas
        </h2>

        <div className="space-y-3">

          {reunioes.map((reuniao) => (
            <div
              key={reuniao.id}
              className="rounded-2xl border p-4"
            >
              <h3 className="font-semibold">
                {reuniao.titulo}
              </h3>

              <p className="text-sm">
                {new Date(reuniao.dataHora).toLocaleString("pt-BR")}
              </p>

              <a
                href={reuniao.link}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block rounded-xl bg-blue-600 px-4 py-2 text-white"
              >
                Entrar na reunião
              </a>
            </div>
          ))}

        </div>
      </div>

    </div>
  );
}