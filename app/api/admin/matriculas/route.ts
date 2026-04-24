import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const {
      alunoId,
      cursoId,
      semestre,
      turmaIds,
      valorPagoMatricula,
      valorMensalidade,
      quantidadeParcelas,
      dataPrimeiroVencimento,
    } = body;

        if (!alunoId || !cursoId || !semestre) {
      return NextResponse.json(
        { error: "Dados obrigatórios não informados" },
        { status: 400 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: Number(alunoId),
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        poloId: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado nesta instituição" },
        { status: 404 }
      );
    }

    const poloId = aluno.poloId ?? null;

    const matricula = await prisma.matricula.create({
            data: {
        alunoId: Number(alunoId),
        cursoId: Number(cursoId),
        semestre: Number(semestre),
        instituicaoId: user.instituicaoId,
        poloId,
        status: "ATIVA",
      },
    });

    if (Array.isArray(turmaIds) && turmaIds.length > 0) {
      await prisma.itemMatricula.createMany({
        data: turmaIds.map((turmaId: number) => ({
          instituicaoId: user.instituicaoId,
          matriculaId: matricula.id,
          turmaId: Number(turmaId),
          status: "A_CURSAR",
        })),
        skipDuplicates: true,
      });
    }

    if (
      Number(valorPagoMatricula) > 0
    ) {
      await prisma.lancamentoFinanceiro.create({
        data: {
                    alunoId: Number(alunoId),
          matriculaId: matricula.id,
          instituicaoId: user.instituicaoId,
          poloId,
          tipo: "MATRICULA",
          valorOriginal: Number(valorPagoMatricula),
          valorFinal: Number(valorPagoMatricula),
          status: "PENDENTE",
          vencimento: dataPrimeiroVencimento
            ? new Date(dataPrimeiroVencimento)
            : new Date(),
        },
      });
    }

    if (
      Number(valorMensalidade) > 0 &&
      Number(quantidadeParcelas) > 0 &&
      dataPrimeiroVencimento
    ) {
      const dataInicial = new Date(dataPrimeiroVencimento);

      const lancamentos = [];

      for (let i = 0; i < Number(quantidadeParcelas); i++) {
        const vencimento = new Date(dataInicial);
        vencimento.setMonth(vencimento.getMonth() + i);

                lancamentos.push({
          alunoId: Number(alunoId),
          matriculaId: matricula.id,
          instituicaoId: user.instituicaoId,
          poloId,
          tipo: "MENSALIDADE",
          valorOriginal: Number(valorMensalidade),
          valorFinal: Number(valorMensalidade),
          vencimento,
          status: "PENDENTE",
        });
      }

      await prisma.lancamentoFinanceiro.createMany({
        data: lancamentos,
      });
    }

    return NextResponse.json({
      message: "Matrícula criada com sucesso",
      matricula,
    });
  } catch (error: any) {
    console.error("Erro ao criar matrícula:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar matrícula" },
      { status: 500 }
    );
  }
}