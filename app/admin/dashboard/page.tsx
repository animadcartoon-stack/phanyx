"use client";

import withAuth from "@/components/auth/withAuth";

function DashboardPage() {
  // 🔹 DADOS SIMULADOS
  const dados = {
    alunos: 120,
    professores: 18,
    disciplinas: 24,
    semestres: 6,
    certificados: 95,
  };

  return (
    <main className="p-8 bg-white text-gray-900 min-h-screen space-y-6">
      <h1 className="text-3xl font-bold">
        🧑‍🎓 Dashboard do Aluno
      </h1>

      <p className="text-gray-600">
        Visão geral da sua jornada acadêmica
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card titulo="Disciplinas" valor={dados.disciplinas} />
        <Card titulo="Semestres" valor={dados.semestres} />
        <Card titulo="Certificados" valor={dados.certificados} />
      </div>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="p-6 rounded-xl bg-gray-100 shadow hover:shadow-md transition">
      <h2 className="text-gray-700 font-semibold">{titulo}</h2>
      <p className="text-3xl font-bold text-gray-900 mt-2">
        {valor}
      </p>
    </div>
  );
}

// 🔐 Proteção de rota — somente ALUNO
export default withAuth(DashboardPage, ["aluno"]);
