"use client";

import { useParams, useRouter } from "next/navigation";
import { useAluno } from "@/app/context/AlunoContext";
import { useProfessor } from "@/app/context/ProfessorContext";

export default function DetalheProvaPage() {
  const { notas } = useAluno();
  const { disciplinas } = useProfessor();
  const params = useParams();
  const router = useRouter();

  const disciplinaId = String(params.disciplinaId);
const disciplinaIdNumero = Number(disciplinaId);

const nota = notas.find(
  (n) => n.disciplinaId === disciplinaIdNumero
);

const disciplina = disciplinas.find(
  (d) => d.id === disciplinaId
);

  if (!nota || !disciplina) {
    return (
      <main className="p-8">
        <p>Prova não encontrada.</p>
      </main>
    );
  }

  const perguntas = disciplina.prova?.perguntas || [];

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">
        📋 Revisão da Prova - {disciplina.nome}
      </h1>

      <div className="border rounded-lg p-6 bg-white space-y-2">
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
          {nota.aprovado ? "Aprovado 🎉" : "Reprovado ❌"}
        </p>

        <p className="text-sm text-gray-600">
          📅 Data: {nota.data}
        </p>

        <p className="text-sm text-gray-600">
          ⏱ Tempo: {Math.floor(nota.tempo / 60)} min{" "}
          {nota.tempo % 60} seg
        </p>
      </div>

      <div className="space-y-4">
        {perguntas.map((pergunta, index) => {
          const respostaAluno = nota.respostas[index];
          const correta = pergunta.correta;
          const acertou = respostaAluno === correta;

          return (
            <div
              key={pergunta.id}
              className="border rounded-lg p-4 bg-white space-y-2"
            >
              <p className="font-medium">
                {index + 1}. {pergunta.enunciado}
              </p>

              <p>
                Sua resposta:{" "}
                <strong>
                  {pergunta.alternativas[respostaAluno]}
                </strong>
              </p>

              {!acertou && (
                <p className="text-green-600">
                  Resposta correta:{" "}
                  {pergunta.alternativas[correta]}
                </p>
              )}

              <p
                className={`font-semibold ${
                  acertou
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {acertou ? "✔ Acertou" : "❌ Errou"}
              </p>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => router.push("/aluno/historico")}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Voltar para histórico
      </button>
    </main>
  );
}