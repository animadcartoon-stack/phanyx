import { prisma } from "@/lib/prisma";

type ContextoAulaAlunoParams = {
  instituicaoId: number;
  userId: number;
  aulaId: number;
};

type AtualizarProgressoParams = {
  instituicaoId: number;
  alunoId: number;
  aulaId: number;
  posicaoSegundos: number;
  tempoMinimoSegundos?: number;
};

function inteiroNaoNegativo(
  valor: unknown
) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(numero)
  );
}

export async function obterContextoAulaAluno({
  instituicaoId,
  userId,
  aulaId,
}: ContextoAulaAlunoParams) {
  const aluno =
    await prisma.aluno.findFirst({
      where: {
        userId,
        instituicaoId,
      },
      select: {
        id: true,
      },
    });

  if (!aluno) {
    throw new Error(
      "ALUNO_NAO_ENCONTRADO"
    );
  }

  const aula =
    await prisma.aula.findFirst({
      where: {
        id: aulaId,
        instituicaoId,
      },
      select: {
        id: true,
        turmaId: true,
        disciplinaId: true,
        videoUrl: true,
      },
    });

  if (!aula) {
    throw new Error(
      "AULA_NAO_ENCONTRADA"
    );
  }

  if (!aula.disciplinaId) {
    throw new Error(
      "AULA_SEM_DISCIPLINA"
    );
  }

  const vinculo =
    await prisma.itemMatricula.findFirst({
      where: {
        instituicaoId,
        turmaId: aula.turmaId,
        disciplinaId:
          aula.disciplinaId,
        matricula: {
          alunoId: aluno.id,
          instituicaoId,
        },
      },
      select: {
        id: true,
      },
    });

  if (!vinculo) {
    throw new Error(
      "ALUNO_SEM_ACESSO_A_AULA"
    );
  }

  return {
    alunoId: aluno.id,
    aulaId: aula.id,
    turmaId: aula.turmaId,
    disciplinaId:
      aula.disciplinaId,
    videoUrl: aula.videoUrl,
  };
}

export async function atualizarProgressoAulaCheckpoint({
  instituicaoId,
  alunoId,
  aulaId,
  posicaoSegundos,
  tempoMinimoSegundos = 0,
}: AtualizarProgressoParams) {
  const posicao =
    inteiroNaoNegativo(
      posicaoSegundos
    );

  const minimo =
    inteiroNaoNegativo(
      tempoMinimoSegundos
    );

  const existente =
    await prisma.progressoAula.findFirst({
      where: {
        instituicaoId,
        alunoId,
        aulaId,
      },
      select: {
        id: true,
        tempoAssistidoSegundos: true,
        tempoMinimoSegundos: true,
      },
    });

  if (existente) {
    return prisma.progressoAula.update({
      where: {
        id: existente.id,
      },
      data: {
        tempoAssistidoSegundos:
          Math.max(
            existente
              .tempoAssistidoSegundos,
            posicao
          ),
        tempoMinimoSegundos:
          Math.max(
            existente
              .tempoMinimoSegundos,
            minimo
          ),
      },
    });
  }

  return prisma.progressoAula.create({
    data: {
      instituicaoId,
      alunoId,
      aulaId,
      tempoAssistidoSegundos:
        posicao,
      tempoMinimoSegundos:
        minimo,
      concluida: false,
    },
  });
}

export function normalizarSegundos(
  valor: unknown
) {
  return inteiroNaoNegativo(valor);
}
