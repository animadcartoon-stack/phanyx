"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Tentativa = {
  id: number;
  finalizada: boolean;
  notaFinal?: number | null;
  aluno?: {
    id: number;
    nome?: string | null;
  };
};

export default function TentativasPage() {
  const params = useParams();
  const provaId = params.provaId;

  const [tentativas, setTentativas] = useState<Tentativa[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    const res = await fetch(`/api/professor/provas/${provaId}/tentativas`);
    const data = await res.json();
    setTentativas(data);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  if (loading) return <div className="p-6">Carregando tentativas...</div>;

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Tentativas da prova
      </h1>

      {tentativas.length === 0 && (
        <div className="border p-4 rounded bg-white">
          Nenhuma tentativa ainda.
        </div>
      )}

      {tentativas.map((t) => (
        <div
          key={t.id}
          className="border rounded p-4 bg-white flex justify-between items-center"
        >
          <div>
            <div className="font-medium">
              {t.aluno?.nome || `Aluno ${t.aluno?.id}`}
            </div>

            <div className="text-sm text-gray-500">
              {t.finalizada ? "Finalizada" : "Em andamento"}
            </div>

            <div className="text-sm">
              Nota: {t.notaFinal ?? "-"}
            </div>
          </div>

          <a
            href={`/professor/tentativas/${t.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Ver tentativa
          </a>
        </div>
      ))}
    </div>
  );
}