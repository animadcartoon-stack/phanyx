import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { validarPaginaAluno } from "@/lib/portal-guard";

export default async function DetalheTrabalhoAlunoPage({
  params,
}: {
  params: Promise<{ atividadeId: string }>;
}) {
  const { atividadeId } = await params;

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
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Link
          href="/aluno/trabalhos"
          className="text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
        >
          ← Voltar para trabalhos
        </Link>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
          Atividade
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
          {atividade.titulo}
        </h1>

        <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
          <p>
            <strong className="text-slate-800 dark:text-slate-100">
              Disciplina:
            </strong>{" "}
            {atividade.disciplina?.nome || "Não informada"}
          </p>

          <p>
            <strong className="text-slate-800 dark:text-slate-100">
              Turma:
            </strong>{" "}
            {atividade.turma?.nome || "Não informada"}
          </p>

          <p>
            <strong className="text-slate-800 dark:text-slate-100">
              Prazo:
            </strong>{" "}
            {formatarData(atividade.prazo)}
          </p>

          <p>
            <strong className="text-slate-800 dark:text-slate-100">
              Nota máxima:
            </strong>{" "}
            {atividade.notaMaxima}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Orientações da atividade
        </h2>

        {atividade.descricao ? (
          <div className="mt-4 whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            {atividade.descricao}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Nenhuma orientação detalhada foi informada.
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Arquivos da atividade
        </h2>

        {atividade.anexos.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Nenhum arquivo foi anexado a esta atividade.
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
          Minha entrega
        </h2>

        {entrega ? (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200">
            <p className="font-bold">Você já enviou esta atividade.</p>

            <p className="mt-2">
              <strong>Enviado em:</strong> {formatarData(entrega.entregueEm)}
            </p>

            {entrega.texto && (
              <p className="mt-2 whitespace-pre-line">
                <strong>Texto:</strong> {entrega.texto}
              </p>
            )}

            {entrega.link && (
              <p className="mt-2">
                <strong>Link:</strong>{" "}
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
                <strong>Arquivo enviado:</strong>{" "}
                <a
                  href={entrega.arquivoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Abrir arquivo
                </a>
              </p>
            )}

            {entrega.nota != null && (
              <p className="mt-3 font-bold">
                Nota: {entrega.nota} / {atividade.notaMaxima}
              </p>
            )}

            {entrega.feedback && (
              <div className="mt-3 rounded-xl border border-green-300/70 bg-white/60 p-3 dark:bg-slate-950/40">
                <p className="font-bold">Feedback do professor</p>
                <p className="mt-1 whitespace-pre-line">{entrega.feedback}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Você ainda não enviou esta atividade.
          </p>
        )}

        <Link
  href={`/aluno/trabalhos/${atividade.id}/entrega`}
  className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
>
  Enviar ou atualizar entrega
</Link>
      </section>
    </div>
  );
}