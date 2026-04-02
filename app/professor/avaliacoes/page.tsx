"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Resultado = {
  aluno: string;
  prova: string;
  nota: number | null;
  status: string;
  tentativaId: number;
};

export default function AvaliacoesPage() {
  const [dados, setDados] = useState<Resultado[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch("/api/professor/avaliacoes", {
          credentials: "include",
        });

        const json = await res.json();
        setDados(Array.isArray(json) ? json : []);
      } catch (error) {
        console.error("Erro ao carregar avaliações:", error);
        setDados([]);
      }
    }

    carregar();
  }, []);

  return (
    <div className="p-8 text-gray-900 space-y-6">
      <h1 className="text-2xl font-bold">
        📝 Resultados das Provas
      </h1>

      {dados.length === 0 && (
        <p className="text-gray-600">
          Nenhum resultado encontrado.
        </p>
      )}

      {dados.map((r, i) => (
        <div
          key={i}
          onClick={() => router.push(`/professor/avaliacoes/${r.tentativaId}`)}
          className="bg-white border rounded-xl p-4 flex justify-between items-center cursor-pointer hover:shadow hover:border-blue-400 transition"
        >
          <div>
            <p className="font-semibold">{r.aluno}</p>

            <p className="text-sm text-gray-600">
              Prova: {r.prova}
            </p>
          </div>

          <div className="text-right space-y-1">
            <p className="font-bold">
              Nota: {r.nota ?? "-"}
            </p>

            <p
              className={
                r.status === "APROVADO"
                  ? "text-green-600"
                  : r.status === "REPROVADO"
                  ? "text-red-600"
                  : "text-gray-500"
              }
            >
              {r.status}
            </p>

            <p className="text-sm text-blue-600">
              Clique para ver respostas →
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}