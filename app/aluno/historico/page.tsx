"use client";

import { useAluno } from "@/app/context/AlunoContext";
import { useProfessor } from "@/app/context/ProfessorContext";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function HistoricoPage() {
  const { notas } = useAluno();
  const { disciplinas } = useProfessor();
  const router = useRouter();

  // 📊 Média geral
  const mediaGeral =
    notas.length > 0
      ? (
          notas.reduce((acc, nota) => acc + nota.nota, 0) /
          notas.length
        ).toFixed(1)
      : null;

  // 📈 Dados do gráfico
  const dadosGrafico = notas.map((nota) => {
  const disciplina = disciplinas.find(
    (d) => Number(d.id) === nota.disciplinaId
  );

    return {
      nome: disciplina?.nome || "Disciplina",
      nota: nota.nota,
    };
  });

  if (notas.length === 0) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">
          📚 Histórico de Provas
        </h1>
        <p>Nenhuma prova realizada ainda.</p>
      </main>
    );
  }

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">
        📚 Histórico de Provas
      </h1>

      {/* 📊 Média */}
      {mediaGeral && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-lg font-semibold text-blue-700">
            📊 Média Geral: {mediaGeral}
          </p>
        </div>
      )}

      {/* 📈 Gráfico */}
      {notas.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            📈 Desempenho por Disciplina
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dadosGrafico}>
              <XAxis dataKey="nome" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="nota" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 📋 Lista de provas */}
      {notas.map((nota) => {
        const disciplina = disciplinas.find(
          (d) => Number(d.id) === nota.disciplinaId
        );

        return (
          <div
            key={nota.disciplinaId}
            className="border rounded-lg p-6 bg-white space-y-2"
          >
            <h2 className="text-lg font-semibold">
              {disciplina?.nome || "Disciplina"}
            </h2>

            <p>
              📊 Nota: <strong>{nota.nota}</strong>
            </p>

            <p
              className={`font-semibold ${
                nota.aprovado
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {nota.aprovado
                ? "Aprovado 🎉"
                : "Reprovado ❌"}
            </p>

            <p className="text-sm text-gray-600">
              📅 Data: {nota.data}
            </p>

            <p className="text-sm text-gray-600">
              ⏱ Tempo: {Math.floor(nota.tempo / 60)} min{" "}
              {nota.tempo % 60} seg
            </p>

            <button
              onClick={() =>
                router.push(
                  `/aluno/historico/${nota.disciplinaId}`
                )
              }
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Ver detalhes
            </button>
          </div>
        );
      })}
    </main>
  );
}