"use client";

import { useParams, useRouter } from "next/navigation";
import { useProfessor } from "@/app/context/ProfessorContext";
import { useState } from "react";

export default function ProvaProfessorPage() {
  const router = useRouter();
  const params = useParams();
  const disciplinaId = String(params.id);

  const { disciplinas, salvarProva } = useProfessor();

  const disciplina = disciplinas.find(
    (d) => d.id === disciplinaId
  );

  const [perguntas, setPerguntas] = useState<
    {
      id: string;
      enunciado: string;
      alternativas: string[];
      correta: number;
    }[]
  >(disciplina?.prova?.perguntas || []);

  function adicionarPergunta() {
    setPerguntas((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        enunciado: "",
        alternativas: ["", "", "", ""],
        correta: 0,
      },
    ]);
  }

  function atualizarPergunta(
    index: number,
    campo: string,
    valor: any
  ) {
    const copia = [...perguntas];

    if (campo === "enunciado") {
      copia[index].enunciado = valor;
    }

    if (campo === "correta") {
      copia[index].correta = valor;
    }

    setPerguntas(copia);
  }

  function atualizarAlternativa(
    pIndex: number,
    aIndex: number,
    valor: string
  ) {
    const copia = [...perguntas];
    copia[pIndex].alternativas[aIndex] = valor;
    setPerguntas(copia);
  }

  function salvar() {
    salvarProva(disciplinaId, perguntas);
    router.push(`/professor/disciplinas/${disciplinaId}`);
  }

  if (!disciplina) {
    return <p>Disciplina não encontrada.</p>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Voltar
      </button>

      <h1 className="text-2xl font-bold text-gray-900">
        Prova — {disciplina.nome}
      </h1>

      {perguntas.map((pergunta, pIndex) => (
        <div
          key={pergunta.id}
          className="bg-white border rounded-lg p-6 space-y-4"
        >
          <input
            placeholder="Enunciado da pergunta"
            value={pergunta.enunciado}
            onChange={(e) =>
              atualizarPergunta(
                pIndex,
                "enunciado",
                e.target.value
              )
            }
            className="w-full border rounded-lg p-2 text-gray-900"
          />

          <div className="space-y-2">
            {pergunta.alternativas.map((alt, aIndex) => (
              <div
                key={aIndex}
                className="flex items-center gap-2"
              >
                <input
                  type="radio"
                  checked={pergunta.correta === aIndex}
                  onChange={() =>
                    atualizarPergunta(
                      pIndex,
                      "correta",
                      aIndex
                    )
                  }
                />

                <input
                  placeholder={`Alternativa ${aIndex + 1}`}
                  value={alt}
                  onChange={(e) =>
                    atualizarAlternativa(
                      pIndex,
                      aIndex,
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-2 text-gray-900"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <button
          onClick={adicionarPergunta}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          + Adicionar pergunta
        </button>

        <button
          onClick={salvar}
          className="px-6 py-2 bg-green-600 text-white rounded-lg"
        >
          Salvar prova
        </button>
      </div>
    </div>
  );
}
