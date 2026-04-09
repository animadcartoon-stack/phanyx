"use client";

import { useEffect, useState } from "react";

type Presenca = {
  id: number;
  status: string;
  observacao?: string;
  data?: string;
  aula?: string;
  turma?: string;
};

type RespostaApi = {
  ok: boolean;
  resumo: {
    total: number;
    presentes: number;
    faltas: number;
    justificadas: number;
    atestados: number;
  };
  items: Presenca[];
};

export default function PresencasAlunoPage() {
  const [dados, setDados] = useState<RespostaApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/aluno/presencas", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(setDados)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Carregando...</div>;

  if (!dados) return <div>Erro ao carregar</div>;

  const freq =
    dados.resumo.total > 0
      ? Math.round(
          (dados.resumo.presentes / dados.resumo.total) * 100
        )
      : 0;

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">
        Minha Presença
      </h1>

      {/* RESUMO */}
      <div className="grid grid-cols-5 gap-4">

        <Card title="Total" value={dados.resumo.total} />
        <Card title="Presentes" value={dados.resumo.presentes} green />
        <Card title="Faltas" value={dados.resumo.faltas} red />
        <Card title="Justificadas" value={dados.resumo.justificadas} yellow />
        <Card title="Atestados" value={dados.resumo.atestados} blue />

      </div>

      {/* FREQUÊNCIA */}
      <div className="p-4 border rounded-xl bg-white">
        <p className="text-sm text-gray-600">
          Frequência
        </p>
        <p className="text-2xl font-bold text-green-600">
          {freq}%
        </p>
      </div>

      {/* LISTA */}
      <div className="space-y-3">
        {dados.items.map(p => (
          <div
            key={p.id}
            className="border rounded-xl p-4 bg-white"
          >
            <p><strong>Aula:</strong> {p.aula}</p>
            <p><strong>Turma:</strong> {p.turma}</p>
            <p><strong>Status:</strong> {p.status}</p>

            {p.observacao && (
              <p className="text-sm text-gray-500">
                {p.observacao}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  green,
  red,
  yellow,
  blue,
}: any) {
  let color = "bg-gray-100";

  if (green) color = "bg-green-100";
  if (red) color = "bg-red-100";
  if (yellow) color = "bg-yellow-100";
  if (blue) color = "bg-blue-100";

  return (
    <div className={`p-4 rounded-xl ${color}`}>
      <p className="text-sm">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}