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

if (role === "ADMIN" || user.isMasterAdmin) {
      return NextResponse.json({
        permissoes: ["*"],
      });
    }

    const funcionario = await prisma.funcionario.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        permissoes: true,
        departamento: {
          include: {
            permissoes: true,
          },
        },
      },
    });

    if (!funcionario) {
      return NextResponse.json({
        permissoes: [],
      });
    }

    const permissoes = new Set<string>();

    funcionario.departamento?.permissoes.forEach((p) => {
      if (p.ativo) permissoes.add(p.chave);
    });

    funcionario.permissoes.forEach((p) => {
      if (p.ativo) permissoes.add(p.chave);
    });

    return NextResponse.json({
      permissoes: Array.from(permissoes),
    });
  } catch (error: any) {
    console.error("Erro ao buscar permissões:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao buscar permissões" },
      { status: 500 }
    );
  }
}