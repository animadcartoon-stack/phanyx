"use client";

import { useParams, useRouter } from "next/navigation";
import { useAluno } from "@/app/context/AlunoContext";
import { useProfessor } from "@/app/context/ProfessorContext";
import { useAuth } from "@/lib/auth-context";

export default function CertificadoPage() {
 const params = useParams();
const router = useRouter();

const disciplinaId =
  typeof params.disciplinaId === "string"
    ? params.disciplinaId
    : "";


  const { certificados } = useAluno();
  const { disciplinas } = useProfessor();
  const { user } = useAuth();

  const disciplinaIdNumero = Number(disciplinaId);

const certificado = certificados.find(
  (c) => c.disciplinaId === disciplinaIdNumero
);

  const disciplina = disciplinas.find(
    (d) => d.id === disciplinaId
  );

  if (!certificado || !disciplina) {
    return (
      <div className="p-8">
        <p className="text-red-600">
          Certificado não encontrado.
        </p>

        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Voltar
        </button>
      </div>
    );
  }

  const dataRegistro = certificado.data || "00000000";

const numeroRegistro = `${disciplinaId}-${dataRegistro.replaceAll(
  "/",
  ""
)}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="bg-white border-4 border-yellow-500 rounded-xl p-12 max-w-3xl w-full text-center space-y-6 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900">
          Certificado de Conclusão
        </h1>

        <p className="text-lg text-gray-700">
          Instituto Bíblico de Ensino
        </p>

        <p className="text-lg text-gray-700">
          Certificamos que
        </p>

        <p className="text-2xl font-semibold text-blue-700">
          {user?.email}
        </p>

        <p className="text-lg text-gray-700">
          concluiu com aprovação a disciplina
        </p>

        <p className="text-2xl font-bold text-gray-900">
          {disciplina.nome}
        </p>

        <p className="text-gray-700">
          Carga horária: {disciplina.cargaHoraria || 40} horas
        </p>

        <p className="text-gray-600">
          Data de conclusão: {certificado.data}
        </p>

        <p className="text-sm text-gray-500">
          Registro nº {numeroRegistro}
        </p>

        <div className="pt-6">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg"
          >
            Imprimir / Salvar PDF
          </button>
        </div>

        <button
          onClick={() => router.push("/aluno/certificados")}
          className="text-blue-600 text-sm underline"
        >
          Voltar para certificados
        </button>
      </div>
    </div>
  );
}
