import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { criarContratoPendenteMatricula } from "@/lib/contratos/contrato-matricula";
import { ErroContratoMatricula } from "@/lib/contratos/validacao-contrato";


export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const matriculaId = Number(searchParams.get("matriculaId"));

    if (!Number.isFinite(matriculaId) || matriculaId <= 0) {
      return NextResponse.json({ error: "Matrícula inválida" }, { status: 400 });
    }

    const contrato = await prisma.contrato.findFirst({
      where: {
        matriculaId,
        instituicaoId: user.instituicaoId,
      },
      include: {
        assinatura: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    if (!contrato) {
      return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      id: contrato.id,
      matriculaId: contrato.matriculaId,
      alunoId: contrato.alunoId,
      status: contrato.status,
      tokenAssinatura: contrato.tokenAssinatura,
      dataCriacao: contrato.dataCriacao,
      dataAssinatura: contrato.dataAssinatura,
      assinatura: contrato.assinatura,
    });
  } catch (error: any) {
    console.error("Erro ao buscar contrato:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar contrato" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const matriculaId = Number(body?.matriculaId);

    if (!Number.isFinite(matriculaId) || matriculaId <= 0) {
      return NextResponse.json({ error: "Matrícula inválida" }, { status: 400 });
    }

    const instituicaoId = user.instituicaoId;
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Matricula" WHERE "id" = ${matriculaId} AND "instituicaoId" = ${instituicaoId} FOR UPDATE`;
      const existente = await tx.contrato.findFirst({
        where: { matriculaId, instituicaoId },
        include: { assinatura: true },
        orderBy: { id: "desc" },
      });
      if (existente) {
        return NextResponse.json({
          id: existente.id, matriculaId: existente.matriculaId, alunoId: existente.alunoId,
          status: existente.status, tokenAssinatura: existente.tokenAssinatura,
          dataCriacao: existente.dataCriacao, dataAssinatura: existente.dataAssinatura,
          assinatura: existente.assinatura, jaExistia: true,
        });
      }
      const { contrato } = await criarContratoPendenteMatricula({ db: tx, matriculaId, instituicaoId });
      return NextResponse.json({
        id: contrato.id, matriculaId: contrato.matriculaId, alunoId: contrato.alunoId,
        status: contrato.status, tokenAssinatura: contrato.tokenAssinatura,
        dataCriacao: contrato.dataCriacao, jaExistia: false,
      });
    });
  } catch (error: any) {
    if (error instanceof ErroContratoMatricula) {
      return NextResponse.json({ codigo: error.codigo, error: error.message }, { status: error.status });
    }
    console.error("Erro ao criar contrato:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar contrato" },
      { status: 500 }
    );
  }
}
