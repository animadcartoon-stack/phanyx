"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import AdminSidebar from "@/components/layout/AdminSidebar";
export default function DetalhesAlunoPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  return (
    <>
      <Header />

      <main className="p-8 bg-white text-gray-900 min-h-screen space-y-6">
        {/* BOTÃO VOLTAR */}
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline"
        >
          ⬅ Voltar
        </button>

        <h1 className="text-2xl font-bold">
          📘 Detalhes do Aluno
        </h1>

        <p>
          <strong>ID do aluno:</strong> {params.id}
        </p>

        <div className="border rounded-lg p-6 space-y-4">
          <p>
            📊 <strong>Média do semestre:</strong> 8.5
          </p>

          <p>
            ✅ <strong>Situação:</strong> Aprovado
          </p>

          <button
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            📄 Gerar boletim em PDF
          </button>
        </div>
      </main>
    </>
  );
}
