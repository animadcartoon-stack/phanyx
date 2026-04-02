import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = String(params.token || "").trim();

    if (!token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const contrato = await prisma.contrato.findFirst({
      where: {
        tokenAssinatura: token,
      },
      include: {
        aluno: true,
        assinatura: true,
        matricula: {
          include: {
            curso: true,
          },
        },
      },
    });

    if (!contrato) {
      return NextResponse.json(
        { error: "Contrato não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: contrato.id,
      tokenAssinatura: contrato.tokenAssinatura,
      status: contrato.status,
      conteudo: contrato.conteudo,
      dataCriacao: contrato.dataCriacao,
      dataAssinatura: contrato.dataAssinatura,
      aluno: contrato.aluno
        ? {
            id: contrato.aluno.id,
            nome: contrato.aluno.nome,
            cpf: contrato.aluno.cpf,
            matricula: contrato.aluno.matricula,
          }
        : null,
      matricula: contrato.matricula
        ? {
            id: contrato.matricula.id,
            status: contrato.matricula.status,
            semestre: contrato.matricula.semestre,
            curso: contrato.matricula.curso
              ? {
                  id: contrato.matricula.curso.id,
                  nome: contrato.matricula.curso.nome,
                }
              : null,
          }
        : null,
      assinatura: contrato.assinatura
        ? {
            id: contrato.assinatura.id,
            nome: contrato.assinatura.nome,
            cpf: contrato.assinatura.cpf,
            data: contrato.assinatura.data,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Erro ao buscar contrato por token:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar contrato" },
      { status: 500 }
    );
  }
}