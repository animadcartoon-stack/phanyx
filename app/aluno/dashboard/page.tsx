"use client";

import { useEffect, useState } from "react";
import withAuth from "@/components/auth/withAuth";

function AlunoDashboardPage() {
  const [matriculas, setMatriculas] = useState<any[]>([]);

  async function carregarDados() {
    const res = await fetch("/api/matricula", {
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();
    setMatriculas(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🎓 Minhas Disciplinas</h1>

      {matriculas.length === 0 && (
        <p className="text-gray-500">
          Você ainda não está matriculado em nenhuma disciplina.
        </p>
      )}

      {matriculas.map((m) => (
        <div key={m.id} className="border p-4 rounded bg-white">
          <p className="font-medium">{m.turma?.disciplina?.nome}</p>
          <p className="text-sm text-gray-600">
            Professor: {m.turma?.professor?.nome}
          </p>
          <p className="text-xs text-gray-500">
            Turma: {m.turma?.nome} • Semestre: {m.turma?.semestre}
          </p>
        </div>
      ))}
    </div>
  );
}

export default withAuth(AlunoDashboardPage, ["aluno"]);