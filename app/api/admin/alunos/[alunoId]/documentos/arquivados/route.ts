import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

export async function GET(
  req: NextRequest,
  context: { params: { alunoId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const alunoId = Number(context.params.alunoId);

    const documentos = await prisma.documentoAluno.findMany({
      where: {
        alunoId,
        instituicaoId: user.instituicaoId!,
        arquivado: true,
      },
      orderBy: {
        arquivadoEm: "desc",
      },
    });

    return NextResponse.json(documentos);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao buscar documentos arquivados." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: { alunoId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const alunoId = Number(context.params.alunoId);

    const body = await req.json();

    const documentoId = Number(body.documentoId);

    const documento = await prisma.documentoAluno.findFirst({
      where: {
        id: documentoId,
        alunoId,
        instituicaoId: user.instituicaoId!,
      },
    });

    if (!documento) {
      return NextResponse.json(
        { error: "Documento não encontrado." },
        { status: 404 }
      );
    }

    const atualizado = await prisma.documentoAluno.update({
      where: {
        id: documentoId,
      },
      data: {
        arquivado: false,
        restauradoEm: new Date(),
        restauradoPorId: user.id,
        motivoRestauracao:
          body.motivo || "Documento restaurado pelo administrador.",
      },
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao restaurar documento." },
      { status: 500 }
    );
  }
}