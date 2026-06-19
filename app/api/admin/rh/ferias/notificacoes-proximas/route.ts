import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

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

export async function POST() {
  try {
    const user = await getUserFromToken();
    const role = String(user?.role || "").toUpperCase();

    if (!user || (role !== "ADMIN" && role !== "SUPER_ADMIN" && user?.isMasterAdmin !== true)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const usuarioBanco = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        instituicaoId: true,
      },
    });

    if (!usuarioBanco?.instituicaoId) {
      return NextResponse.json(
        { error: "Instituição do usuário não encontrada." },
        { status: 400 }
      );
    }

    const hoje = inicioDoDia(new Date());
    const emSeteDias = fimDoDia(
      new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 7)
    );

    const ferias = await prisma.feriasRH.findMany({
      where: {
        instituicaoId: usuarioBanco.instituicaoId,
        arquivada: false,
        cancelada: false,
        status: "AGENDADA",
        dataInicio: {
          gte: hoje,
          lte: emSeteDias,
        },
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        dataInicio: "asc",
      },
    });

    if (ferias.length === 0) {
  await prisma.notificacao.updateMany({
    where: {
      instituicaoId: usuarioBanco.instituicaoId,
      chaveAgrupada: {
        in: [
          "RH_FERIAS_PROXIMAS_7_DIAS",
          `RH_FERIAS_PROXIMAS_7_DIAS_${usuarioBanco.instituicaoId}`,
        ],
      },
      lida: false,
    },
    data: {
      lida: true,
      quantidade: 0,
      descricao: "Nenhuma férias próxima encontrada.",
    },
  });

  return NextResponse.json({
    ok: true,
    mensagem: "Nenhuma férias próxima encontrada.",
    quantidade: 0,
  });
}

    const chaveAgrupada = `RH_FERIAS_PROXIMAS_7_DIAS_${usuarioBanco.instituicaoId}`;

    const descricao =
      ferias.length === 1
        ? `${ferias[0].funcionario?.nome || "1 funcionário"} entra em férias nos próximos 7 dias.`
        : `${ferias.length} funcionários entram em férias nos próximos 7 dias.`;

    const existente = await prisma.notificacao.findFirst({
      where: {
        instituicaoId: usuarioBanco.instituicaoId,
        chaveAgrupada,
        lida: false,
      },
    });

    if (existente) {
      const atualizada = await prisma.notificacao.update({
        where: { id: existente.id },
        data: {
          tipo: "RH",
          categoria: "RH",
          titulo: "Férias próximas",
          descricao,
          quantidade: ferias.length,
          link: "/admin/rh/ferias",
          lida: false,
        },
      });

      return NextResponse.json({
        ok: true,
        notificacao: atualizada,
        quantidade: ferias.length,
      });
    }

    const notificacao = await prisma.notificacao.create({
      data: {
        instituicaoId: usuarioBanco.instituicaoId,
        usuarioId: null,
        tipo: "RH",
        categoria: "RH",
        titulo: "Férias próximas",
        descricao,
        quantidade: ferias.length,
        chaveAgrupada,
        link: "/admin/rh/ferias",
        lida: false,
      },
    });

    return NextResponse.json({
      ok: true,
      notificacao,
      quantidade: ferias.length,
    });
  } catch (error: any) {
    console.error("Erro ao gerar notificação de férias próximas:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao gerar notificação de férias próximas." },
      { status: 500 }
    );
  }
}