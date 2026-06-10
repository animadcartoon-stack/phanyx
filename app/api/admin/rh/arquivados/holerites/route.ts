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

    const holerites = await prisma.holeriteRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        arquivado: true,
      },
      include: {
  funcionario: {
    select: { id: true, nome: true, cargo: true },
  },
  criadoPor: {
    select: { id: true, nome: true, email: true },
  },
  arquivadoPor: {
    select: { id: true, nome: true, email: true },
  },
},
      orderBy: {
        arquivadoEm: "desc",
      },
    });

    return NextResponse.json(holerites);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar holerites arquivados." },
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
    const holeriteId = Number(body.holeriteId);

    const motivoRestauracao = String(
  body.motivoRestauracao || ""
).trim();

if (!motivoRestauracao) {
  return NextResponse.json(
    { error: "Informe o motivo da restauração." },
    { status: 400 }
  );
}

    if (!holeriteId) {
      return NextResponse.json({ error: "Informe o holerite." }, { status: 400 });
    }

    const holerite = await prisma.holeriteRH.findFirst({
      where: {
        id: holeriteId,
        instituicaoId: user.instituicaoId,
        arquivado: true,
      },
    });

    if (!holerite) {
      return NextResponse.json(
        { error: "Holerite arquivado não encontrado." },
        { status: 404 }
      );
    }

    const restaurado = await prisma.holeriteRH.update({
      where: { id: holerite.id },
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
        funcionarioId: holerite.funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        tipo: "RESTAURACAO_HOLERITE",
        titulo: "Holerite restaurado",
        descricao: motivoRestauracao,
        dataEvento: new Date(),
        observacoes: "Registro retornou para a lista principal de Holerites RH.",
      },
    });

    return NextResponse.json(restaurado);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao restaurar holerite." },
      { status: 500 }
    );
  }
}