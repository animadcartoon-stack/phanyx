import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function isNumeroValido(valor: unknown) {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0;
}

function montarVencimento(ano: number, mes: number, dia: number) {
  const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();
  const diaAjustado = Math.min(Math.max(dia, 1), ultimoDiaDoMes);
  return new Date(ano, mes - 1, diaAjustado, 12, 0, 0, 0);
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken();

    if (
      !user ||
      (user.role !== "ADMIN" &&
        user.role !== "FINANCEIRO" &&
        user.role !== "SECRETARIA")
    ) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const hoje = new Date();
    const ano = Number(body?.ano) || hoje.getFullYear();
    const mes = Number(body?.mes) || hoje.getMonth() + 1;
    const diaVencimento = Number(body?.diaVencimento) || 10;

    if (!Number.isInteger(ano) || ano < 2000 || ano > 3000) {
      return NextResponse.json(
        { error: "ANO_INVALIDO" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
      return NextResponse.json(
        { error: "MES_INVALIDO" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(diaVencimento) || diaVencimento < 1 || diaVencimento > 31) {
      return NextResponse.json(
        { error: "DIA_VENCIMENTO_INVALIDO" },
        { status: 400 }
      );
    }

    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999);
    const vencimento = montarVencimento(ano, mes, diaVencimento);

    const matriculas = await prisma.matricula.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        status: "ATIVA",
        aluno: {
          ativo: true,
        },
      },
      include: {
        aluno: true,
        curso: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    let totalMatriculasAnalisadas = 0;
    let totalSemCurso = 0;
    let totalSemValorMensalidade = 0;
    let totalJaExistente = 0;
    let totalCriado = 0;

    const criados: Array<{
      alunoId: number;
      alunoNome: string;
      matriculaId: number;
      cursoNome: string;
      valor: number;
      vencimento: string;
    }> = [];

    for (const matricula of matriculas) {
      totalMatriculasAnalisadas += 1;

      if (!matricula.curso) {
        totalSemCurso += 1;
        continue;
      }

      const valorMensalidade = Number(matricula.curso.valorMensalidade || 0);

      if (!isNumeroValido(valorMensalidade)) {
        totalSemValorMensalidade += 1;
        continue;
      }

      const existente = await prisma.lancamentoFinanceiro.findFirst({
        where: {
          instituicaoId: user.instituicaoId,
          tipo: "MENSALIDADE",
          alunoId: matricula.alunoId,
          matriculaId: matricula.id,
          vencimento: {
            gte: inicioMes,
            lte: fimMes,
          },
        },
      });

      if (existente) {
        totalJaExistente += 1;
        continue;
      }

      const descricao = `Mensalidade ${String(mes).padStart(2, "0")}/${ano} - ${
        matricula.curso.nome
      }`;

      await prisma.lancamentoFinanceiro.create({
        data: {
          instituicaoId: user.instituicaoId,
          alunoId: matricula.alunoId,
          matriculaId: matricula.id,
          tipo: "MENSALIDADE",
          descricao,
          valorOriginal: valorMensalidade,
          valorFinal: valorMensalidade,
          valorPago: 0,
          status: "PENDENTE",
          vencimento,
        },
      });

      totalCriado += 1;

      criados.push({
        alunoId: matricula.alunoId,
        alunoNome: matricula.aluno.nome,
        matriculaId: matricula.id,
        cursoNome: matricula.curso.nome,
        valor: valorMensalidade,
        vencimento: vencimento.toISOString(),
      });
    }

    return NextResponse.json({
      message: "Mensalidades geradas com sucesso",
      competencia: {
        mes,
        ano,
        diaVencimento,
      },
      resumo: {
        totalMatriculasAnalisadas,
        totalSemCurso,
        totalSemValorMensalidade,
        totalJaExistente,
        totalCriado,
      },
      criados,
    });
  } catch (e: any) {
    console.error("ERRO GERAR MENSALIDADES:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao gerar mensalidades" },
      { status: 500 }
    );
  }
}