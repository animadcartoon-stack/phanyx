"use client";

import { useAluno } from "@/app/context/AlunoContext";
import { useRouter } from "next/navigation";

export default function CertificadosPage() {
  const { certificados } = useAluno();
  const router = useRouter();

  function nomeDisciplina(disciplinaId: number | string) {
  return `Disciplina ${disciplinaId}`;
}

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        🏆 Meus certificados
      </h1>

      {certificados.length === 0 ? (
        <div className="bg-white border rounded-lg p-6">
          <p className="text-gray-600">
            Você ainda não possui certificados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {certificados.map((c, index) => (
            <div
              key={index}
              className="bg-white border rounded-lg p-6 flex justify-between items-center"
            >
              <div>
                <h2 className="font-semibold text-lg">
                  {nomeDisciplina(c.disciplinaId)}
                </h2>
                <p className="text-sm text-gray-500">
                  Concluído em {c.data}
                </p>
              </div>

              <button
                onClick={() =>
                  router.push(
                    `/aluno/certificados/${c.disciplinaId}`
                  )
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Ver certificado
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
