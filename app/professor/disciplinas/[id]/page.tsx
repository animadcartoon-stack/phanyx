"use client";

import { useRouter, useParams } from "next/navigation";
import { useProfessor } from "@/app/context/ProfessorContext";
import { useState } from "react";

export default function DisciplinaProfessor() {
  const { id } = useParams();
  const disciplinaId = String(id);
  const router = useRouter();

  const {
  disciplinas,
  adicionarAula,
  matriculas,
  notas,
} = useProfessor();

  const disciplina = disciplinas.find((d) => d.id === disciplinaId);

  const alunosDaDisciplina = matriculas.filter(
    (m) => m.disciplinaId === disciplinaId
  );
const notasDaDisciplina = notas.filter(
  (n) => n.disciplinaId === disciplinaId
);

  const [titulo, setTitulo] = useState("");
  const [video, setVideo] = useState("");

  if (!disciplina) {
    return <p>Disciplina não encontrada.</p>;
  }

  function handleAddAula(e: React.FormEvent) {
    e.preventDefault();
    adicionarAula(disciplinaId, titulo, video);
    setTitulo("");
    setVideo("");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Botão voltar */}
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Voltar
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {disciplina.nome}
        </h1>
        <p className="text-gray-600">
          {disciplina.descricao}
        </p>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-3">
  <h2 className="font-semibold text-gray-900">
    👨‍🎓 Alunos matriculados
  </h2>

  {alunosDaDisciplina.map((m, index) => {
    const notaAluno = notasDaDisciplina.find(
      (n) => n.alunoEmail === m.alunoEmail
    );

    return (
      <div
        key={index}
        className="border rounded-lg p-3 bg-gray-50 flex justify-between"
      >
        <span>{m.alunoEmail}</span>

        {notaAluno ? (
          <span
            className={
              notaAluno.aprovado
                ? "text-green-600 font-semibold"
                : "text-red-600 font-semibold"
            }
          >
            Nota: {notaAluno.nota} —{" "}
            {notaAluno.aprovado
              ? "Aprovado"
              : "Reprovado"}
          </span>
        ) : (
          <span className="text-gray-500">
            Sem nota
          </span>
        )}
      </div>
    );
  })}

  {alunosDaDisciplina.length === 0 && (
    <p className="text-gray-600 text-sm">
      Nenhum aluno matriculado.
    </p>
  )}
</div>


      {/* Botão prova */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold text-gray-900 mb-3">
          Prova da disciplina
        </h2>

        <button
          onClick={() =>
            router.push(`/professor/disciplinas/${disciplinaId}/prova`)
          }
          className="px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          Criar / editar prova
        </button>
      </div>

      {/* Form aula */}
      <form
        onSubmit={handleAddAula}
        className="space-y-4 bg-white border rounded-lg p-6"
      >
        <h2 className="font-semibold text-gray-900">
          Nova aula
        </h2>

        <input
          placeholder="Título da aula"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full border rounded-lg p-2 text-gray-900"
          required
        />

        <input
          placeholder="Link do vídeo (YouTube)"
          value={video}
          onChange={(e) => setVideo(e.target.value)}
          className="w-full border rounded-lg p-2 text-gray-900"
          required
        />

        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Adicionar aula
        </button>
      </form>

      {/* Lista de aulas */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">
          Aulas
        </h2>

        {disciplina.aulas.map((aula) => (
          <div
            key={aula.id}
            onClick={() =>
              router.push(
                `/professor/disciplinas/${disciplinaId}/aula/${aula.id}`
              )
            }
            className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow"
          >
            {aula.titulo}
          </div>
        ))}

        {disciplina.aulas.length === 0 && (
          <p className="text-gray-600">
            Nenhuma aula criada ainda.
          </p>
        )}
      </div>
    </div>
  );
}

