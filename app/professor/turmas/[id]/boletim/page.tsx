"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type BoletimItem = {
  alunoId: number;
  nome: string;
  email: string;
  nota: number | null;
  status: string;
};

type BoletimResponse = {
  turma: {
    id: number;
    nome: string;
  };
  disciplina: {
    id: number;
    nome: string;
  };
  resumo: {
    totalAlunos: number;
    mediaTurma: number;
    melhorNota: number;
    piorNota: number;
  };
  boletim: BoletimItem[];
};

export default function BoletimTurmaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = params.id;
  const turmaId = Number(id);

  const [data, setData] = useState<BoletimResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro("");

        const res = await fetch(`/api/professor/turmas/${turmaId}/boletim`, {
          credentials: "include",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Erro ao carregar boletim");
        }

        setData(json);
      } catch (e: any) {
        setErro(e?.message || "Erro ao carregar boletim");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    if (Number.isFinite(turmaId) && turmaId > 0) {
      carregar();
    } else {
      setErro("Turma inválida");
      setLoading(false);
    }
  }, [turmaId]);

  if (loading) {
    return <div className="p-8 text-gray-900">Carregando boletim...</div>;
  }

  if (erro) {
    return (
      <div className="p-8 space-y-4 text-gray-900">
        <p className="font-semibold text-red-600">Erro</p>
        <p>{erro}</p>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-gray-900">Boletim não encontrado.</div>;
  }

  return (
    <div className="space-y-6 p-8 text-gray-900">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline"
        >
          ← Voltar
        </button>

        <button
          onClick={() => window.open(`/api/professor/turmas/${id}/boletim/csv`)}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          ⬇ Exportar CSV
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">📊 Boletim da turma</h1>
        <p className="mt-2 text-gray-600">
          Turma: <strong>{data.turma.nome}</strong>
        </p>
        <p className="text-gray-600">
          Disciplina: <strong>{data.disciplina.nome}</strong>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total de alunos</p>
          <p className="mt-2 text-3xl font-bold">{data.resumo.totalAlunos}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Média da turma</p>
          <p className="mt-2 text-3xl font-bold">{data.resumo.mediaTurma}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Melhor nota</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {data.resumo.melhorNota}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pior nota</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {data.resumo.piorNota}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Alunos</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="pb-3 pr-4">Aluno</th>
                <th className="pb-3 pr-4">E-mail</th>
                <th className="pb-3 pr-4">Nota</th>
                <th className="pb-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.boletim.map((item) => (
                <tr key={item.alunoId} className="border-b">
                  <td className="py-3 pr-4 font-medium">{item.nome}</td>
                  <td className="py-3 pr-4 text-gray-600">{item.email}</td>
                  <td className="py-3 pr-4">{item.nota ?? "-"}</td>
                  <td
                    className={`py-3 pr-4 font-semibold ${
                      item.status === "APROVADO"
                        ? "text-green-600"
                        : item.status === "REPROVADO"
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {item.status}
                  </td>
                </tr>
              ))}

              {data.boletim.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    Nenhum aluno encontrado nesta turma.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}