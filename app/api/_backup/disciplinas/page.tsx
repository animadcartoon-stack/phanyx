"use client";

import { useEffect, useState } from "react";
import withAuth from "@/components/auth/withAuth";

function AdminDisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function carregarDados() {
    const [resDisc, resProf] = await Promise.all([
      fetch("/api/disciplina", { credentials: "include" }),
      fetch("/api/professor", { credentials: "include" }),
    ]);

    const discData = await resDisc.json();
    const profData = await resProf.json();

    setDisciplinas(discData);
    setProfessores(profData);
  }

  async function criarDisciplina() {
    const res = await fetch("/api/disciplina", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nome,
        professorId: Number(professorId),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setSucesso("");
      setErro(data.error || "Não foi possível criar a disciplina.");
      return;
    }

    setNome("");
    setProfessorId("");
    carregarDados();
  }

  setErro("");
  setSucesso("Disciplina criada com sucesso.");

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className="space-y-6">

{(erro || sucesso) && (
  <div
    className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
      erro
        ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-100"
        : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-100"
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <p>{erro || sucesso}</p>

      <button
        type="button"
        onClick={() => {
          setErro("");
          setSucesso("");
        }}
        className="rounded-full px-2 text-lg leading-none opacity-70 transition hover:opacity-100"
        aria-label="Fechar aviso"
      >
        ×
      </button>
    </div>
  </div>
)}

      <h1 className="text-2xl font-bold">📚 Disciplinas</h1>

      <div className="bg-white p-4 border rounded-lg space-y-3 max-w-md">
        <input
          placeholder="Nome da disciplina"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <select
          value={professorId}
          onChange={(e) => setProfessorId(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">Selecione o professor</option>
          {professores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>

        <button
          onClick={criarDisciplina}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Criar disciplina
        </button>
      </div>

      <div className="space-y-2">
        {disciplinas.map((d) => (
          <div key={d.id} className="border p-3 rounded bg-white">
            <p className="font-medium">{d.nome}</p>
            <p className="text-sm text-gray-600">
              Professor: {d.professor?.nome}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default withAuth(AdminDisciplinasPage, ["admin"]);