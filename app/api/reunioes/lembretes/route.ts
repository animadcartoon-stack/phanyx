import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function inicioDoDia(data: Date) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fimDoDia(data: Date) {
  const d = new Date(data);
  d.setHours(23, 59, 59, 999);
  return d;
}

function linkPorTipo(tipo?: string | null) {
  if (tipo === "ALUNO") return "/aluno/reunioes";
  if (tipo === "PROFESSOR") return "/professor/reunioes";
  return "/admin/reunioes";
}

export async function GET() {
  try {
    const hoje = new Date();

    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    const reunioesAmanha = await prisma.reuniao.findMany({
      where: {
        status: "AGENDADA",
        dataHora: {
          gte: inicioDoDia(amanha),
          lte: fimDoDia(amanha),
        },
      },
      include: {
        participantes: true,
      },
    });

    const reunioesHoje = await prisma.reuniao.findMany({
      where: {
        status: "AGENDADA",
        dataHora: {
          gte: inicioDoDia(hoje),
          lte: fimDoDia(hoje),
        },
      },
      include: {
        participantes: true,
      },
    });

    const notificacoesParaCriar: {
      usuarioId: number;
      tipo: string;
      titulo: string;
      descricao?: string;
      link?: string;
    }[] = [];

    for (const reuniao of reunioesAmanha) {
      const hora = new Date(reuniao.dataHora).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      for (const participante of reuniao.participantes) {
        if (!participante.userId) continue;

        notificacoesParaCriar.push({
          usuarioId: participante.userId,
          tipo: "REUNIAO_LEMBRETE_AMANHA",
          titulo: "⏰ Amanhã você tem reunião",
          descricao: `${reuniao.titulo} • amanhã às ${hora}`,
          link: linkPorTipo(participante.tipo),
        });
      }
    }

    for (const reuniao of reunioesHoje) {
      const hora = new Date(reuniao.dataHora).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      for (const participante of reuniao.participantes) {
        if (!participante.userId) continue;

        notificacoesParaCriar.push({
          usuarioId: participante.userId,
          tipo: "REUNIAO_LEMBRETE_HOJE",
          titulo: "📅 Hoje você tem reunião",
          descricao: `${reuniao.titulo} • hoje às ${hora}`,
          link: linkPorTipo(participante.tipo),
        });
      }
    }

    if (notificacoesParaCriar.length > 0) {
      await prisma.notificacao.createMany({
        data: notificacoesParaCriar,
      });
    }

    return NextResponse.json({
      ok: true,
      reunioesAmanha: reunioesAmanha.length,
      reunioesHoje: reunioesHoje.length,
      notificacoesCriadas: notificacoesParaCriar.length,
    });
  } catch (error: any) {
    console.error("Erro ao gerar lembretes de reuniões:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao gerar lembretes de reuniões" },
      { status: 500 }
    );
  }
}