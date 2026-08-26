import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { validarPaginaAluno } from "@/lib/portal-guard";
import { getTranslations } from "next-intl/server";

export default async function DetalheTrabalhoAlunoPage({
  params,
  searchParams,
}: {
  params: Promise<{ atividadeId: string }>;
  searchParams?: Promise<{ entrega?: string }>;
}) {
  const { atividadeId } = await params;
  const query = searchParams ? await searchParams : {};
  const entregaSucesso = query?.entrega === "sucesso";

  const t = await getTranslations("StudentAssignments");

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login?portal=aluno");
  }

  let decoded: {
    id: number;
    role: string;
    email: string;
    instituicaoId: number;
  };

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      role: string;
      email: string;
      instituicaoId: number;
    };
  } catch {
    redirect("/login?portal=aluno");
  }

  if (String(decoded.role).toUpperCase() !== "ALUNO") {
    redirect("/login?portal=aluno");
  }

  await validarPaginaAluno(decoded.instituicaoId, "aluno.trabalhos");

  const id = Number(atividadeId);

  if (!id || !Number.isFinite(id)) {
    notFound();
  }

  const aluno = await prisma.aluno.findFirst({
    where: {
      userId: decoded.id,
      instituicaoId: decoded.instituicaoId,
    },
    select: {
      id: true,
    },
  });

  if (!aluno) {
    redirect("/login?portal=aluno");
  }

  const matriculas = await prisma.matricula.findMany({
    where: {
      alunoId: aluno.id,
      instituicaoId: decoded.instituicaoId,
    },
    select: {
      itens: {
        select: {
          turmaId: true,
        },
      },
    },
  });

  const turmaIds = matriculas.flatMap((m) => m.itens.map((i) => i.turmaId));

  const atividade = await prisma.atividade.findFirst({
    where: {
      id,
      instituicaoId: decoded.instituicaoId,
      turmaId: {
        in: turmaIds,
      },
      status: "PUBLICADA",
    },
    include: {
      turma: {
        select: {
          id: true,
          nome: true,
        },
      },
      disciplina: {
        select: {
          id: true,
          nome: true,
        },
      },
      anexos: {
        orderBy: {
          createdAt: "asc",
        },
      },
      entregas: {
        where: {
          alunoId: aluno.id,
        },
        orderBy: {
          entregueEm: "desc",
        },
        take: 1,
      },
    },
  });

  if (!atividade) {
    notFound();
  }

  const entrega = atividade.entregas[0] || null;

  function formatarData(data?: Date | null) {
    if (!data) return "Sem prazo";

    return new Date(data).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  return (
    <div className="phanyx-aluno-trabalho-detalhe mx-auto max-w-5xl space-y-6">
      {entregaSucesso && (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-sm font-bold text-green-700 shadow-sm dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200">
          ✅ Atividade enviada com sucesso. Ela já está disponível para correção do professor.
        </div>
      )}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Link
          href="/aluno/trabalhos"
          className="text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
        >
          {t("backToAssignments")}
        </Link>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
          {t("assignment")}
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
          {atividade.titulo}
        </h1>

        <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
          <p>
            <strong className="text-slate-800 dark:text-slate-100">
              {t("subject")}:
            </strong>{" "}
            {atividade.disciplina?.nome || t("notProvidedFeminine")}
          </p>

          <p>
            <strong className="text-slate-800 dark:text-slate-100">
              {t("classLabel")}:
            </strong>{" "}
            {atividade.turma?.nome || t("notProvidedFeminine")}
          </p>

          <p>
            <strong className="text-slate-800 dark:text-slate-100">
              {t("deadline")}:
            </strong>{" "}
            {formatarData(atividade.prazo)}
          </p>

          <p>
            <strong className="text-slate-800 dark:text-slate-100">
              {t("maximumGrade")}:
            </strong>{" "}
            {atividade.notaMaxima}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          {t("guidanceTitle")}
        </h2>

        {atividade.descricao ? (
          <div className="mt-4 whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            {atividade.descricao}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            {t("noGuidance")}
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          {t("assignmentFiles")}
        </h2>

        {atividade.anexos.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            {t("noAttachment")}
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {atividade.anexos.map((anexo) => (
              <a
                key={anexo.id}
                href={anexo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200"
              >
                📎 {anexo.arquivoNome || anexo.titulo}
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          {t("mySubmission")}
        </h2>

        {entrega ? (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-800 shadow-sm dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200">
            <div className="mb-4 rounded-xl border border-green-200 bg-white/70 p-4 dark:border-green-900 dark:bg-slate-950/50">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-green-700 dark:text-green-300">
                {t("statusLabel")}
              </p>

              <p className="mt-2 text-lg font-black">
                {entrega.nota != null
                  ? `⭐ ${t("corrected")}`
                  : `✅ ${t("submitted")}`}
              </p>

              <p className="mt-1">
                {entrega.nota != null
                  ? t("evaluatedMessage")
                  : t("awaitingCorrectionMessage")}
              </p>
            </div>
            <p className="font-bold">{t("alreadySubmitted")}</p>

            <p className="mt-2">
              <strong>{t("submittedAt")}:</strong>{" "}
              {formatarData(entrega.entregueEm)}
            </p>

            {entrega.texto && (
              <p className="mt-2 whitespace-pre-line">
                <strong>{t("textLabel")}:</strong>
              </p>
            )}

            {entrega.link && (
              <p className="mt-2">
                <strong>{t("linkLabel")}:</strong>{" "}
                <a
                  href={entrega.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {entrega.link}
                </a>
              </p>
            )}

            {entrega.arquivoUrl && (
              <p className="mt-2">
                <strong>{t("submittedFile")}:</strong>{" "}
                <a
                  href={entrega.arquivoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {t("openFile")}
                </a>
              </p>
            )}

            {entrega.nota != null && (
              <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-200">
                <p className="text-xs font-black uppercase tracking-[0.2em]">
                  {t("assessment")}
                </p>
                <p className="mt-2 text-2xl font-black">
                  ⭐ {entrega.nota} / {atividade.notaMaxima}
                </p>
              </div>
            )}

            {entrega.feedback && (
              <div className="mt-3 rounded-xl border border-green-300/70 bg-white/60 p-3 dark:bg-slate-950/40">
                <p className="font-bold">{t("teacherFeedback")}</p>
                <p className="mt-1 whitespace-pre-line">{entrega.feedback}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            {t("notSubmittedYet")}
          </p>
        )}

        <Link
          href={`/aluno/trabalhos/${atividade.id}/entrega`}
          className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
        >
          {!entrega
            ? t("sendSubmission")
            : entrega.nota != null
              ? t("sendNewVersion")
              : t("updateSubmission")}
        </Link>
      </section>
    </div>
  );
}