import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = Number(params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const documento = await prisma.documentoGerado.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            matricula: true,
            cpf: true,
          },
        },
        matricula: {
          select: {
            id: true,
            status: true,
            semestre: true,
          },
        },
        template: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            exigeAssinatura: true,
          },
        },
      },
    });

    if (!documento) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(documento);
  } catch (error: any) {
    console.error("Erro ao buscar documento gerado:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar documento gerado" },
      { status: 500 }
    );
  }
}