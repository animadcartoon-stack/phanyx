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

  criadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },

  arquivadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },

  restauradoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },
},
      orderBy: {
  arquivadoEm: "desc",
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

    const motivoRestauracao = String(
  body.motivoRestauracao || "Restauração solicitada pelo administrador."
).trim();

const atualizado = await prisma.documentoRH.update({
  where: {
    id: documento.id,
  },
  data: {
    arquivado: false,
    arquivadoEm: null,
    arquivadoPorId: null,
    motivoArquivo: null,
    restauradoEm: new Date(),
    restauradoPorId: user.id,
    motivoRestauracao,
    status: "GERADO",
  },
});

await prisma.historicoRH.create({
  data: {
    funcionarioId: documento.funcionarioId,
    instituicaoId: user.instituicaoId!,
    criadoPorId: user.id,
    tipo: "RESTAURACAO_DOCUMENTO_RH",
    titulo: "Documento RH restaurado",
    descricao: motivoRestauracao,
    dataEvento: new Date(),
    observacoes:
      "Documento RH restaurado para documentos ativos. A restauração foi registrada para auditoria.",
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