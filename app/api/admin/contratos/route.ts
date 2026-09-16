import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { criarContratoPendenteMatricula } from "@/lib/contratos/contrato-matricula";


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

    const contratoExistente = await prisma.contrato.findFirst({
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

    if (contratoExistente) {
      return NextResponse.json({
        id: contratoExistente.id,
        matriculaId: contratoExistente.matriculaId,
        alunoId: contratoExistente.alunoId,
        status: contratoExistente.status,
        tokenAssinatura: contratoExistente.tokenAssinatura,
        dataCriacao: contratoExistente.dataCriacao,
        dataAssinatura: contratoExistente.dataAssinatura,
        assinatura: contratoExistente.assinatura,
        jaExistia: true,
      });
    }

    const resultado =
      await criarContratoPendenteMatricula({
        matriculaId,
        instituicaoId:
          user.instituicaoId,
      });

    const contrato =
      resultado.contrato;
    return NextResponse.json({
      id: contrato.id,
      matriculaId: contrato.matriculaId,
      alunoId: contrato.alunoId,
      status: contrato.status,
      tokenAssinatura: contrato.tokenAssinatura,
      dataCriacao: contrato.dataCriacao,
      jaExistia: false,
    });
  } catch (error: any) {
    console.error("Erro ao criar contrato:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar contrato" },
      { status: 500 }
    );
  }
}