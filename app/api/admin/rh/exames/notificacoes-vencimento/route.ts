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
    const emTrintaDias = fimDoDia(
      new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 30)
    );

    const examesVencendo = await prisma.exameMedicoRH.findMany({
      where: {
        instituicaoId: usuarioBanco.instituicaoId,
        arquivado: false,
        cancelado: false,
        validade: {
          gte: hoje,
          lte: emTrintaDias,
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
        validade: "asc",
      },
    });

    const examesVencidos = await prisma.exameMedicoRH.findMany({
      where: {
        instituicaoId: usuarioBanco.instituicaoId,
        arquivado: false,
        cancelado: false,
        validade: {
          lt: hoje,
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
        validade: "asc",
      },
    });

    const chaveVencendo = `RH_EXAMES_VENCENDO_30_DIAS_${usuarioBanco.instituicaoId}`;
    const chaveVencidos = `RH_EXAMES_VENCIDOS_${usuarioBanco.instituicaoId}`;

    if (examesVencendo.length === 0) {
      await prisma.notificacao.updateMany({
        where: {
          instituicaoId: usuarioBanco.instituicaoId,
          chaveAgrupada: chaveVencendo,
          lida: false,
        },
        data: {
          lida: true,
          quantidade: 0,
          descricao: "Nenhum exame médico vencendo nos próximos 30 dias.",
        },
      });
    } else {
      const descricao =
        examesVencendo.length === 1
          ? `${examesVencendo[0].funcionario?.nome || "1 funcionário"} possui exame médico vencendo nos próximos 30 dias.`
          : `${examesVencendo.length} funcionários possuem exames médicos vencendo nos próximos 30 dias.`;

      const existente = await prisma.notificacao.findFirst({
        where: {
          instituicaoId: usuarioBanco.instituicaoId,
          chaveAgrupada: chaveVencendo,
          lida: false,
        },
      });

      if (existente) {
        await prisma.notificacao.update({
          where: { id: existente.id },
          data: {
            tipo: "RH",
            categoria: "RH",
            titulo: "Exames médicos vencendo",
            descricao,
            quantidade: examesVencendo.length,
            link: "/admin/rh/exames",
            lida: false,
          },
        });
      } else {
        await prisma.notificacao.create({
          data: {
            instituicaoId: usuarioBanco.instituicaoId,
            usuarioId: null,
            tipo: "RH",
            categoria: "RH",
            titulo: "Exames médicos vencendo",
            descricao,
            quantidade: examesVencendo.length,
            chaveAgrupada: chaveVencendo,
            link: "/admin/rh/exames",
            lida: false,
          },
        });
      }
    }

    if (examesVencidos.length === 0) {
      await prisma.notificacao.updateMany({
        where: {
          instituicaoId: usuarioBanco.instituicaoId,
          chaveAgrupada: chaveVencidos,
          lida: false,
        },
        data: {
          lida: true,
          quantidade: 0,
          descricao: "Nenhum exame médico vencido encontrado.",
        },
      });
    } else {
      const descricao =
        examesVencidos.length === 1
          ? `${examesVencidos[0].funcionario?.nome || "1 funcionário"} possui exame médico vencido.`
          : `${examesVencidos.length} funcionários possuem exames médicos vencidos.`;

      const existente = await prisma.notificacao.findFirst({
        where: {
          instituicaoId: usuarioBanco.instituicaoId,
          chaveAgrupada: chaveVencidos,
          lida: false,
        },
      });

      if (existente) {
        await prisma.notificacao.update({
          where: { id: existente.id },
          data: {
            tipo: "RH",
            categoria: "RH",
            titulo: "Exames médicos vencidos",
            descricao,
            quantidade: examesVencidos.length,
            link: "/admin/rh/exames",
            lida: false,
          },
        });
      } else {
        await prisma.notificacao.create({
          data: {
            instituicaoId: usuarioBanco.instituicaoId,
            usuarioId: null,
            tipo: "RH",
            categoria: "RH",
            titulo: "Exames médicos vencidos",
            descricao,
            quantidade: examesVencidos.length,
            chaveAgrupada: chaveVencidos,
            link: "/admin/rh/exames",
            lida: false,
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      vencendo: examesVencendo.length,
      vencidos: examesVencidos.length,
    });
  } catch (error: any) {
    console.error("Erro ao gerar notificações de exames médicos:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao gerar notificações de vencimento dos exames médicos.",
      },
      { status: 500 }
    );
  }
}