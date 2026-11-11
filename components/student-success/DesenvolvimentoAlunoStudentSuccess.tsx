"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Registro = {
  id: number;
  titulo: string;
  tipo: string;
  descricao: string;
  conceito: string | null;
  nota: string | null;
  devolutiva: string | null;
  status: string;
  atualizadoEm: string;
  professor: { nome: string };
  turma: { nome: string };
};

export default function DesenvolvimentoAlunoStudentSuccess({ alunoId }: { alunoId: number }) {
  const tr = useTranslations("PlanningTracking");
  const locale = useLocale();
  const [registros, setRegistros] = useState<Registro[] | null>(null);
  const [erro, setErro] = useState(false);
  const [semAcesso, setSemAcesso] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function carregar() {
      try {
        const resposta = await fetch(`/api/admin/student-success/alunos/${alunoId}/desenvolvimento`, {
          cache: "no-store", signal: controller.signal,
        });
        if (resposta.status === 403) {
          if (!controller.signal.aborted) setSemAcesso(true);
          return;
        }
        if (!resposta.ok) throw new Error("Falha ao consultar desenvolvimento");
        const dados = await resposta.json();
        if (!controller.signal.aborted) setRegistros(dados.registros);
      } catch {
        if (!controller.signal.aborted) setErro(true);
      }
    }
    void carregar();
    return () => controller.abort();
  }, [alunoId]);

  if (semAcesso) return null;
  const tipos: Record<string, string> = {
    EVOLUCAO: tr("codeEvolution"), AVALIACAO: tr("codeAssessment"), TAREFA: tr("codeTask"),
  };
  const estados: Record<string, string> = {
    ENVIADO: tr("codeSent"), DEVOLVIDO: tr("codeReturned"), PUBLICADO: tr("codePublished"),
  };
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <h3 className="font-semibold">{tr("developmentTitle")}</h3>
      <a href="/admin/acompanhamento-aulas#desenvolvimento" className="inline-block text-sm text-blue-700 underline dark:text-blue-300">
        {tr("trackingTitle")}
      </a>
      {erro && <p role="alert" className="text-sm">{tr("cannotLoad")}</p>}
      {registros?.length === 0 && <p className="text-sm">{tr("noRecordsCreated")}</p>}
      {registros?.map(registro => (
        <article key={registro.id} className="space-y-2 border-t border-slate-200 pt-3 text-sm dark:border-slate-700">
          <h4 className="font-semibold">{registro.titulo}</h4>
          <p>{registro.professor.nome} · {registro.turma.nome}</p>
          <p>{tipos[registro.tipo]} · {estados[registro.status]} · {new Date(registro.atualizadoEm).toLocaleDateString(locale)}</p>
          {registro.conceito && <p>{tr("ratingLabel")} {registro.conceito}</p>}
          {registro.nota != null && <p>{tr("gradeLabel")} {Number(registro.nota).toLocaleString(locale)}</p>}
          <p className="whitespace-pre-wrap break-words">{registro.descricao}</p>
          {registro.devolutiva && <p className="whitespace-pre-wrap break-words">{tr("feedbackLabel")} {registro.devolutiva}</p>}
        </article>
      ))}
    </section>
  );
}
