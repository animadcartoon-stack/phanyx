"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Nota = {
  alunoId: string;
  nome: string;
  email: string;
  disciplina: string;
  nota: string;
  feedback: string;
};

export default function NotasAlunoPage() {
  const t = useTranslations("StudentNotes");

  // Simulação existente: aluno logado.
  const alunoId = "1";

  const [notas, setNotas] = useState<Nota[]>([]);

  useEffect(() => {
    const todasNotas: Nota[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i);

      if (!chave?.startsWith("nota-")) {
        continue;
      }

      const item = localStorage.getItem(chave);

      if (!item) {
        continue;
      }

      try {
        const nota = JSON.parse(item) as Nota;

        if (nota.alunoId === alunoId) {
          todasNotas.push(nota);
        }
      } catch (error) {
        console.error(`Nota inválida armazenada em ${chave}:`, error);
      }
    }

    setNotas(todasNotas);
  }, []);

  function situacao(nota: number) {
    if (nota >= 7) {
      return `✅ ${t("situations.approved")}`;
    }

    if (nota >= 5) {
      return `⚠️ ${t("situations.recovery")}`;
    }

    return `❌ ${t("situations.failed")}`;
  }

  return (
    <main className="min-h-screen space-y-6 bg-white p-8 text-slate-900 dark:bg-slate-950 dark:text-white">
      <h1 className="text-3xl font-bold">📊 {t("title")}</h1>

      {notas.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-300">{t("empty")}</p>
      ) : (
        <div className="space-y-4">
          {notas.map((nota, index) => (
            <div
              key={`${nota.disciplina}-${index}`}
              className="space-y-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                📘 {nota.disciplina}
              </h2>

              <p className="text-slate-700 dark:text-slate-200">
                <strong>{t("labels.grade")}:</strong>{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {nota.nota}
                </span>
              </p>

              <p className="text-slate-700 dark:text-slate-200">
                <strong>{t("labels.status")}:</strong>{" "}
                {situacao(Number(nota.nota))}
              </p>

              {nota.feedback && (
                <p className="text-slate-700 dark:text-slate-200">
                  <strong>{t("labels.feedback")}:</strong>{" "}
                  {nota.feedback}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}