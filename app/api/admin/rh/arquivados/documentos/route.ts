import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const documentos = await prisma.documentoRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        arquivado: true,
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cargo: true,
          },
        },
      },
      orderBy: {
        arquivadaEm: "desc",
      },
    });

    return NextResponse.json(documentos);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar documentos arquivados." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const documentoId = Number(body.documentoId);

    if (!documentoId) {
      return NextResponse.json(
        { error: "Documento inválido." },
        { status: 400 }
      );
    }

    const documento = await prisma.documentoRH.findFirst({
      where: {
        id: documentoId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!documento) {
      return NextResponse.json(
        { error: "Documento não encontrado." },
        { status: 404 }
      );
    }

    const atualizado = await prisma.documentoRH.update({
      where: {
        id: documento.id,
      },
      data: {
        arquivado: false,
        arquivadoEm: null,
        arquivadoPorId: null,
        motivoArquivo: null,
      },
    });

    return NextResponse.json(atualizado);
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao restaurar documento.",
      },
      { status: 500 }
    );
  }
}