import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { criarTransporter } from "@/lib/email";

export const dynamic = "force-dynamic";

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

    const horarios = await prisma.turmaDisciplinaHorario.findMany({
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

    const transporter = criarTransporter();

    const enviados: any[] = [];

    for (const horario of horarios) {
      const disciplina = horario.turmaDisciplina?.disciplina;
      const turma = horario.turmaDisciplina?.turma;
      const professor = disciplina?.professor;
      const user = professor?.user;

      if (!user?.email) {
        continue;
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
            <p><strong>Curso:</strong> ${disciplina?.curso?.nome || "—"}</p>
            <p><strong>Turma:</strong> ${turma?.nome || "—"}</p>
            <p><strong>Disciplina:</strong> ${disciplina?.nome || "—"}</p>
            <p><strong>Dia:</strong> ${nomeDiaSemana(diaSemana)}</p>
            <p><strong>Horário:</strong> ${horario.horaInicio}${
        horario.horaFim ? ` às ${horario.horaFim}` : ""
      }</p>
          </div>

          <p style="margin-top:20px;">
            Acesse o PHANYX para preparar suas aulas, materiais e atividades.
          </p>

          <p style="margin-top:30px;color:#64748b;font-size:12px;">
            Plataforma acadêmica PHANYX
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "📚 Lembrete de aula amanhã - PHANYX",
        html,
      });

      enviados.push({
        professor: user.email,
        turma: turma?.nome,
        disciplina: disciplina?.nome,
      });
    }

    return NextResponse.json({
      ok: true,
      total: enviados.length,
      enviados,
    });
  } catch (e: any) {
    console.error("ERRO CRON PROFESSORES:", e);

    return NextResponse.json(
      {
        error: e?.message || "Erro interno",
      },
      {
        status: 500,
      }
    );
  }
}