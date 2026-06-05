import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const role = String(user.role || "").toUpperCase();

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const historicos = await prisma.historicoRH.findMany({
      where: {
        funcionario: {
          instituicaoId: user.instituicaoId,
        },
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cargo: true,
            departamento: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
      orderBy: {
        dataEvento: "desc",
      },
      take: 100,
    });

    return NextResponse.json(historicos);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar histórico RH" },
      { status: 500 }
    );
  }
}