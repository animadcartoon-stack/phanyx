import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const ocorrencias = await prisma.ocorrenciaRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        arquivada: true,
      },
      include: {
  funcionario: {
    select: {
      id: true,
      nome: true,
      cargo: true,
      codigoFuncionario: true,
    },
  },
  criadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },
  arquivadaPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },
},
      orderBy: {
        arquivadaEm: "desc",
      },
    });

    return NextResponse.json(ocorrencias);
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao carregar ocorrências arquivadas.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const ocorrenciaId = Number(body.ocorrenciaId);

    if (!ocorrenciaId) {
      return NextResponse.json(
        { error: "Informe a ocorrência." },
        { status: 400 }
      );
    }

    const ocorrencia = await prisma.ocorrenciaRH.findFirst({
      where: {
        id: ocorrenciaId,
        instituicaoId: user.instituicaoId,
        arquivada: true,
      },
    });

    if (!ocorrencia) {
      return NextResponse.json(
        { error: "Ocorrência arquivada não encontrada." },
        { status: 404 }
      );
    }

    const restaurada = await prisma.ocorrenciaRH.update({
      where: { id: ocorrencia.id },
      data: {
        arquivada: false,
        arquivadaEm: null,
        arquivadaPorId: null,
        motivoArquivo: null,
        status: "REGISTRADA",
      },
    });

    await prisma.historicoRH.create({
      data: {
        funcionarioId: ocorrencia.funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        tipo: "RESTAURACAO_OCORRENCIA",
        titulo: "Ocorrência RH restaurada",
        descricao: "Ocorrência restaurada a partir da central de arquivados.",
        dataEvento: new Date(),
        observacoes:
          "Registro retornou para a lista principal de Ocorrências RH.",
      },
    });

    return NextResponse.json(restaurada);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao restaurar ocorrência." },
      { status: 500 }
    );
  }
}