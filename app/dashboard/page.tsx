"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  return (
    <>
      <Header />

      <main className="p-8 bg-gray-100 min-h-screen text-gray-900">
        <h1 className="text-3xl font-bold mb-6">
          🎓 Dashboard
        </h1>

        <p className="text-gray-700 mb-8">
          Bem-vindo à plataforma educacional. Escolha uma opção abaixo:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* CARD ALUNOS */}
          <div
            onClick={() => router.push("/admin/alunos")}
            className="cursor-pointer bg-white rounded-xl shadow hover:shadow-lg transition p-6"
          >
            <div className="text-4xl mb-4">👩‍🎓</div>
            <h2 className="text-xl font-semibold mb-2">
              Gerenciar Alunos
            </h2>
            <p className="text-gray-600">
              Visualize alunos, notas, boletins e certificados
            </p>
          </div>

          {/* CARD PROFESSOR */}
          <div
            onClick={() => alert("Área do professor em construção")}
            className="cursor-pointer bg-white rounded-xl shadow hover:shadow-lg transition p-6"
          >
            <div className="text-4xl mb-4">👨‍🏫</div>
            <h2 className="text-xl font-semibold mb-2">
              Área do Professor
            </h2>
            <p className="text-gray-600">
              Lançamento de notas, feedbacks e acompanhamento
            </p>
          </div>

          {/* CARD CURSOS */}
          <div
            onClick={() => alert("Cursos em breve")}
            className="cursor-pointer bg-white rounded-xl shadow hover:shadow-lg transition p-6"
          >
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-xl font-semibold mb-2">
              Cursos
            </h2>
            <p className="text-gray-600">
              Acesso aos módulos, aulas e conteúdos
            </p>
          </div>

          {/* CARD BOLETINS */}
          <div
            onClick={() => alert("Boletins em breve")}
            className="cursor-pointer bg-white rounded-xl shadow hover:shadow-lg transition p-6"
          >
            <div className="text-4xl mb-4">📄</div>
            <h2 className="text-xl font-semibold mb-2">
              Boletins
            </h2>
            <p className="text-gray-600">
              Histórico acadêmico e desempenho
            </p>
          </div>

          {/* CARD CERTIFICADOS */}
          <div
            onClick={() => alert("Certificados em breve")}
            className="cursor-pointer bg-white rounded-xl shadow hover:shadow-lg transition p-6"
          >
            <div className="text-4xl mb-4">🎓</div>
            <h2 className="text-xl font-semibold mb-2">
              Certificados
            </h2>
            <p className="text-gray-600">
              Emissão automática de certificados
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
