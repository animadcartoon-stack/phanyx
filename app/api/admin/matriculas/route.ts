import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function formatarNumeroMatricula(instituicaoId: number, sequencial: number) {
  const ano = new Date().getFullYear();
  const numero = String(sequencial).padStart(6, "0");

  return `PHX-${instituicaoId}-${ano}-${numero}`;
}

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

    const resultado = await prisma.$transaction(async (tx) => {
      const aluno = await tx.aluno.findFirst({
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
        throw new Error("Aluno não encontrado nesta instituição");
      }

      const instituicao = await tx.instituicao.update({
        where: { id: user.instituicaoId },
        data: {
          proximoNumeroMatricula: {
            increment: 1,
          },
        },
        select: {
          id: true,
          proximoNumeroMatricula: true,
        },
      });

      const sequencialGerado = instituicao.proximoNumeroMatricula - 1;
      const numeroMatricula = formatarNumeroMatricula(
        user.instituicaoId,
        sequencialGerado
      );

      const idsTurmasInformadas = Array.isArray(turmaIds)
        ? Array.from(
          new Set<number>(
            turmaIds
              .map((turmaId: unknown) => Number(turmaId))
              .filter(
                (turmaId: number) =>
                  Number.isInteger(turmaId) &&
                  turmaId > 0
              )
          )
        )
        : [];

      let poloId: number | null = null;

      /*
       * 1. Prioridade: polo da turma escolhida.
       * A matrícula deve representar o local acadêmico
       * em que o aluno realmente está sendo matriculado.
       */
      if (idsTurmasInformadas.length > 0) {
        const turmasSelecionadas =
          await tx.turma.findMany({
            where: {
              instituicaoId:
                user.instituicaoId,

              id: {
                in: idsTurmasInformadas,
              },
            },

            select: {
              id: true,
              cursoId: true,
              poloId: true,
            },
          });

        if (
          turmasSelecionadas.length !==
          idsTurmasInformadas.length
        ) {
          throw new Error(
            "Uma ou mais turmas informadas não existem nesta instituição."
          );
        }

        const turmaDeOutroCurso =
          turmasSelecionadas.some(
            (turma) =>
              Number(turma.cursoId) !==
              Number(cursoId)
          );

        if (turmaDeOutroCurso) {
          throw new Error(
            "Uma ou mais turmas selecionadas não pertencem ao curso informado."
          );
        }

        const polosDasTurmas =
          Array.from(
            new Set<number>(
              turmasSelecionadas
                .map((turma) =>
                  turma.poloId
                    ? Number(turma.poloId)
                    : null
                )
                .filter(
                  (id): id is number =>
                    id !== null &&
                    Number.isInteger(id) &&
                    id > 0
                )
            )
          );

        if (polosDasTurmas.length > 1) {
          throw new Error(
            "As turmas selecionadas pertencem a polos diferentes. Selecione turmas do mesmo polo."
          );
        }

        if (polosDasTurmas.length === 1) {
          poloId = polosDasTurmas[0];
        }
      }

      /*
       * 2. Se a turma não definiu o polo,
       * usamos a lotação já registrada no aluno.
       */
      if (!poloId && aluno.poloId) {
        poloId = Number(
          aluno.poloId
        );
      }

      /*
       * 3. Se ainda não houver polo e a instituição
       * tiver somente um polo ativo, usamos esse polo.
       */
      if (!poloId) {
        const polosAtivos =
          await tx.polo.findMany({
            where: {
              instituicaoId:
                user.instituicaoId,

              ativo: true,
            },

            select: {
              id: true,
            },

            take: 2,
          });

        if (polosAtivos.length === 1) {
          poloId =
            polosAtivos[0].id;
        }
      }

      /*
       * 4. Nunca mais criar matrícula nova sem polo
       * quando o sistema não consegue determinar
       * com segurança onde ela pertence.
       */
      if (!poloId) {
        throw new Error(
          "Não foi possível determinar o polo desta matrícula. Informe o polo do aluno ou utilize uma turma vinculada a um polo."
        );
      }

      const matricula = await tx.matricula.create({
        data: {
          alunoId: Number(alunoId),
          cursoId: Number(cursoId),
          semestre: Number(semestre),
          instituicaoId: user.instituicaoId,
          poloId,
          numeroMatricula,
          status: "ATIVA",
          confirmadaEm: new Date(),
        },
      });

      await tx.aluno.update({
        where: { id: Number(alunoId) },
        data: {
          matricula: numeroMatricula,
        },
      });

      if (idsTurmasInformadas.length > 0) {
  await tx.itemMatricula.createMany({
    data:
      idsTurmasInformadas.map(
        (turmaId) => ({
          instituicaoId:
            user.instituicaoId,

          matriculaId:
            matricula.id,

          turmaId,

          status:
            "A_CURSAR",
        })
      ),

    skipDuplicates: true,
  });
}

      if (Number(valorPagoMatricula) > 0) {
        await tx.lancamentoFinanceiro.create({
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

        await tx.lancamentoFinanceiro.createMany({
          data: lancamentos,
        });
      }

      return matricula;
    });

    return NextResponse.json({
      message: "Matrícula criada com sucesso",
      matricula: resultado,
    });
  } catch (error: any) {
    console.error("Erro ao criar matrícula:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao criar matrícula" },
      { status: 500 }
    );
  }
}