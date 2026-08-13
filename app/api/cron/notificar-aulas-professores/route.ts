import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  criarTransporterEmailInstituicao,
  montarRemetenteEmail,
} from "@/lib/email-instituicao/transporter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function nomeDiaSemana(numero: number) {
  const dias = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  return dias[numero] || "Dia inválido";
}

export async function GET() {
  try {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    const diaSemana = amanha.getDay();

    const horarios =
      await prisma.turmaDisciplinaHorario.findMany({
        where: {
          ativo: true,
          diaSemana,
        },
        include: {
          turmaDisciplina: {
            include: {
              disciplina: {
                include: {
                  curso: true,
                  professor: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
              turma: true,
            },
          },
        },
      });

    const enviados: any[] = [];
    const ignorados: any[] = [];
    const erros: any[] = [];

    /*
     * Cache por instituição.
     *
     * Se uma instituição tiver várias aulas amanhã,
     * não precisamos recriar o transporter para cada aula.
     */
    const transporters = new Map<
      number,
      Awaited<
        ReturnType<
          typeof criarTransporterEmailInstituicao
        >
      >
    >();

    /*
     * Também guardamos instituições sem SMTP configurado,
     * evitando tentar carregar a mesma configuração várias vezes.
     */
    const instituicoesSemEmail =
      new Map<number, string>();

    for (const horario of horarios) {
      const instituicaoId =
        horario.instituicaoId;

      const disciplina =
        horario.turmaDisciplina?.disciplina;

      const turma =
        horario.turmaDisciplina?.turma;

      const professor =
        disciplina?.professor;

      const user =
        professor?.user;

      /*
       * Segurança multi-tenant:
       * nunca enviamos mensagem se o usuário não pertence
       * à mesma instituição do horário processado.
       */
      if (
        !user ||
        user.instituicaoId !== instituicaoId
      ) {
        ignorados.push({
          instituicaoId,
          motivo:
            "Professor ou usuário não pertence à instituição do horário.",
          turma: turma?.nome || null,
          disciplina:
            disciplina?.nome || null,
        });

        continue;
      }

      if (!user.email) {
        ignorados.push({
          instituicaoId,
          motivo:
            "Professor não possui e-mail cadastrado.",
          professor:
            professor?.nome || null,
          turma: turma?.nome || null,
          disciplina:
            disciplina?.nome || null,
        });

        continue;
      }

      /*
       * Se já sabemos que a instituição não possui
       * SMTP disponível, não tentamos novamente.
       */
      const erroConfiguracaoAnterior =
        instituicoesSemEmail.get(
          instituicaoId
        );

      if (erroConfiguracaoAnterior) {
        ignorados.push({
          instituicaoId,
          professor: user.email,
          motivo:
            erroConfiguracaoAnterior,
          turma: turma?.nome || null,
          disciplina:
            disciplina?.nome || null,
        });

        continue;
      }

      try {
        let emailInstituicao =
          transporters.get(
            instituicaoId
          );

        if (!emailInstituicao) {
          try {
            emailInstituicao =
              await criarTransporterEmailInstituicao(
                instituicaoId
              );

            transporters.set(
              instituicaoId,
              emailInstituicao
            );
          } catch (configError: any) {
            const mensagemErro =
              configError?.message ||
              "A instituição não possui configuração de e-mail disponível.";

            instituicoesSemEmail.set(
              instituicaoId,
              mensagemErro
            );

            ignorados.push({
              instituicaoId,
              professor: user.email,
              motivo: mensagemErro,
              turma: turma?.nome || null,
              disciplina:
                disciplina?.nome || null,
            });

            continue;
          }
        }

        const html = `
          <div style="font-family: Arial; padding: 20px;">
            <h2 style="color:#1d4ed8;">
              📚 Lembrete de aula - PHANYX
            </h2>

            <p>
              Olá, professor(a)!
            </p>

            <p>
              Você possui aula agendada para amanhã.
            </p>

            <div style="background:#f8fafc;padding:16px;border-radius:12px;border:1px solid #e2e8f0;">
              <p>
                <strong>Curso:</strong>
                ${disciplina?.curso?.nome || "—"}
              </p>

              <p>
                <strong>Turma:</strong>
                ${turma?.nome || "—"}
              </p>

              <p>
                <strong>Disciplina:</strong>
                ${disciplina?.nome || "—"}
              </p>

              <p>
                <strong>Dia:</strong>
                ${nomeDiaSemana(diaSemana)}
              </p>

              <p>
                <strong>Horário:</strong>
                ${horario.horaInicio}${
                  horario.horaFim
                    ? ` às ${horario.horaFim}`
                    : ""
                }
              </p>
            </div>

            <p style="margin-top:20px;">
              Acesse o PHANYX para preparar suas aulas,
              materiais e atividades.
            </p>

            <p style="margin-top:30px;color:#64748b;font-size:12px;">
              Plataforma acadêmica PHANYX
            </p>
          </div>
        `;

        await emailInstituicao.transporter.sendMail({
          from: montarRemetenteEmail({
            nome:
              emailInstituicao.remetente
                .nome,
            email:
              emailInstituicao.remetente
                .email,
          }),

          to: user.email,

          subject:
            "📚 Lembrete de aula amanhã - PHANYX",

          html,
        });

        enviados.push({
          instituicaoId,
          professor: user.email,
          turma: turma?.nome || null,
          disciplina:
            disciplina?.nome || null,
        });
      } catch (envioError: any) {
        console.error(
          "ERRO AO ENVIAR LEMBRETE DE AULA:",
          {
            instituicaoId,
            professor: user.email,
            erro:
              envioError?.message ||
              envioError,
          }
        );

        erros.push({
          instituicaoId,
          professor: user.email,
          turma: turma?.nome || null,
          disciplina:
            disciplina?.nome || null,
          erro:
            envioError?.message ||
            "Erro ao enviar e-mail.",
        });
      }
    }

    return NextResponse.json({
      ok: true,

      resumo: {
        totalHorarios:
          horarios.length,

        enviados:
          enviados.length,

        ignorados:
          ignorados.length,

        erros:
          erros.length,
      },

      enviados,
      ignorados,
      erros,
    });
  } catch (e: any) {
    console.error(
      "ERRO CRON PROFESSORES:",
      e
    );

    return NextResponse.json(
      {
        error:
          e?.message ||
          "Erro interno",
      },
      {
        status: 500,
      }
    );
  }
}