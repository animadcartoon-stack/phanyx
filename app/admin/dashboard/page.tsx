"use client";

import withAuth from "@/components/auth/withAuth";
import { useTranslations } from "next-intl";

function DashboardPage() {
  const t = useTranslations("AdminDashboard");

  // 🔹 DADOS SIMULADOS
  const dados = {
    alunos: 120,
    professores: 18,
    disciplinas: 24,
    semestres: 6,
    certificados: 95,
  };

  return (
    <main className="phanyx-admin-dashboard min-h-screen space-y-6 p-8">
      <h1 className="phanyx-admin-dashboard-title text-3xl font-bold">
        🧑‍🎓 {t("title")}
      </h1>

      <p className="phanyx-admin-dashboard-muted">
        {t("description")}
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card titulo={t("cards.subjects")} valor={dados.disciplinas} />
        <Card titulo={t("cards.semesters")} valor={dados.semestres} />
        <Card titulo={t("cards.certificates")} valor={dados.certificados} />
      </div>

      <style jsx global>{`
        .phanyx-admin-dashboard {
          background: #ffffff;
          color: #111827;
        }

        .phanyx-admin-dashboard-title {
          color: #111827;
        }

        .phanyx-admin-dashboard-muted {
          color: #4b5563;
        }

        .phanyx-admin-dashboard-card {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
        }

        .phanyx-admin-dashboard-card-title {
          color: #374151;
        }

        .phanyx-admin-dashboard-card-value {
          color: #111827;
        }

        html[data-theme-choice="dark"] .phanyx-admin-dashboard,
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-admin-dashboard {
          background: #061a3a;
          color: #f8fafc;
        }

        html[data-theme-choice="dark"] .phanyx-admin-dashboard-title,
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-admin-dashboard-title {
          color: #ffffff;
        }

        html[data-theme-choice="dark"] .phanyx-admin-dashboard-muted,
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-admin-dashboard-muted {
          color: #bfd2e8;
        }

        html[data-theme-choice="dark"] .phanyx-admin-dashboard-card,
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-admin-dashboard-card {
          background: #0b2a57;
          border-color: #2d5aa0;
        }

        html[data-theme-choice="dark"] .phanyx-admin-dashboard-card-title,
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-admin-dashboard-card-title {
          color: #dbeafe;
        }

        html[data-theme-choice="dark"] .phanyx-admin-dashboard-card-value,
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-admin-dashboard-card-value {
          color: #ffffff;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-admin-dashboard,
        html[data-theme="system"].dark
          .phanyx-admin-dashboard {
          background: #09090b;
          color: #fafafa;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-admin-dashboard-title,
        html[data-theme="system"].dark
          .phanyx-admin-dashboard-title {
          color: #fafafa;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-admin-dashboard-muted,
        html[data-theme="system"].dark
          .phanyx-admin-dashboard-muted {
          color: #a1a1aa;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-admin-dashboard-card,
        html[data-theme="system"].dark
          .phanyx-admin-dashboard-card {
          background: #18181b;
          border-color: #3f3f46;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-admin-dashboard-card-title,
        html[data-theme="system"].dark
          .phanyx-admin-dashboard-card-title {
          color: #e4e4e7;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-admin-dashboard-card-value,
        html[data-theme="system"].dark
          .phanyx-admin-dashboard-card-value {
          color: #fafafa;
        }
      `}</style>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="phanyx-admin-dashboard-card rounded-xl p-6 shadow transition hover:shadow-md">
      <h2 className="phanyx-admin-dashboard-card-title font-semibold">
        {titulo}
      </h2>

      <p className="phanyx-admin-dashboard-card-value mt-2 text-3xl font-bold">
        {valor}
      </p>
    </div>
  );
}

// 🔐 Proteção de rota — mantida exatamente como estava
export default withAuth(DashboardPage, ["aluno"]);
