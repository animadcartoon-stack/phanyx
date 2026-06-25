import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

const COLUNAS_TABELA_PADRAO = [
  "data",
  "hora",
  "tipo",
  "evento",
  "turma",
  "professor",
  "funcionario",
  "status",
];

const COLUNAS_PDF_PADRAO = ["data", "hora", "tipo", "evento", "status"];
const COLUNAS_EXCEL_PADRAO = [...COLUNAS_TABELA_PADRAO];

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const preferencia = await prisma.preferenciaAgendaOperacional.findUnique({
      where: {
        instituicaoId_userId: {
          instituicaoId: user.instituicaoId,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({
      colunasTabela:
        Array.isArray(preferencia?.colunasTabela)
          ? preferencia?.colunasTabela
          : COLUNAS_TABELA_PADRAO,
      colunasPdf:
        Array.isArray(preferencia?.colunasPdf)
          ? preferencia?.colunasPdf
          : COLUNAS_PDF_PADRAO,
      colunasExcel:
        Array.isArray(preferencia?.colunasExcel)
          ? preferencia?.colunasExcel
          : COLUNAS_EXCEL_PADRAO,
    });
  } catch (error) {
    console.error("Erro ao carregar preferências da agenda:", error);
    return NextResponse.json(
      { error: "Erro ao carregar preferências da agenda." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();

    const colunasTabela = Array.isArray(body.colunasTabela)
      ? body.colunasTabela
      : COLUNAS_TABELA_PADRAO;

    const colunasPdf = Array.isArray(body.colunasPdf)
      ? body.colunasPdf
      : COLUNAS_PDF_PADRAO;

    const colunasExcel = Array.isArray(body.colunasExcel)
      ? body.colunasExcel
      : COLUNAS_EXCEL_PADRAO;

    const preferencia = await prisma.preferenciaAgendaOperacional.upsert({
      where: {
        instituicaoId_userId: {
          instituicaoId: user.instituicaoId,
          userId: user.id,
        },
      },
      update: {
        colunasTabela,
        colunasPdf,
        colunasExcel,
      },
      create: {
        instituicaoId: user.instituicaoId,
        userId: user.id,
        colunasTabela,
        colunasPdf,
        colunasExcel,
      },
    });

    return NextResponse.json({
      ok: true,
      preferencia,
    });
  } catch (error) {
    console.error("Erro ao salvar preferências da agenda:", error);
    return NextResponse.json(
      { error: "Erro ao salvar preferências da agenda." },
      { status: 500 }
    );
  }
}