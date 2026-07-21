import {
  ModalidadeCertificado,
  TipoVersaoCertificado,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type ResolverModeloCertificadoParams = {
  instituicaoId: number;
  cursoId?: number | null;
};

export async function resolverModeloCertificadoPublicado({
  instituicaoId,
  cursoId,
}: ResolverModeloCertificadoParams) {
  const curso = cursoId
    ? await prisma.curso.findFirst({
        where: {
          id: cursoId,
          instituicaoId,
        },
        select: {
          id: true,
          certificadoModeloId: true,
          modalidadeCertificado: true,
        },
      })
    : null;

  const modalidade =
    curso?.modalidadeCertificado || ModalidadeCertificado.GERAL;

  /*
   * 1. Modelo vinculado diretamente ao curso.
   */
  if (curso?.certificadoModeloId) {
    const modeloDoCurso =
      await prisma.certificadoModelo.findFirst({
        where: {
          id: curso.certificadoModeloId,
          instituicaoId,
          ativo: true,
          arquivado: false,
          publicadoEm: {
            not: null,
          },
          versoes: {
            some: {
              tipo: TipoVersaoCertificado.PUBLICADO,
            },
          },
        },
        include: {
          versoes: {
            where: {
              tipo: TipoVersaoCertificado.PUBLICADO,
            },
            take: 1,
          },
        },
      });

    const versaoPublicada = modeloDoCurso?.versoes[0];

    if (modeloDoCurso && versaoPublicada) {
      return {
        modelo: modeloDoCurso,
        versao: versaoPublicada,
        modalidade,
        origem: "CURSO" as const,
      };
    }
  }

  /*
   * 2. Modelo padrão da modalidade do curso.
   */
  const modeloDaModalidade =
    await prisma.certificadoModelo.findFirst({
      where: {
        instituicaoId,
        modalidade,
        padraoModalidade: true,
        ativo: true,
        arquivado: false,
        publicadoEm: {
          not: null,
        },
        versoes: {
          some: {
            tipo: TipoVersaoCertificado.PUBLICADO,
          },
        },
      },
      orderBy: {
        atualizadoEm: "desc",
      },
      include: {
        versoes: {
          where: {
            tipo: TipoVersaoCertificado.PUBLICADO,
          },
          take: 1,
        },
      },
    });

  const versaoDaModalidade =
    modeloDaModalidade?.versoes[0];

  if (modeloDaModalidade && versaoDaModalidade) {
    return {
      modelo: modeloDaModalidade,
      versao: versaoDaModalidade,
      modalidade,
      origem: "MODALIDADE" as const,
    };
  }

  /*
   * 3. Modelo padrão geral da instituição.
   */
  const modeloGeral =
    await prisma.certificadoModelo.findFirst({
      where: {
        instituicaoId,
        padraoGeral: true,
        ativo: true,
        arquivado: false,
        publicadoEm: {
          not: null,
        },
        versoes: {
          some: {
            tipo: TipoVersaoCertificado.PUBLICADO,
          },
        },
      },
      orderBy: {
        atualizadoEm: "desc",
      },
      include: {
        versoes: {
          where: {
            tipo: TipoVersaoCertificado.PUBLICADO,
          },
          take: 1,
        },
      },
    });

  const versaoGeral = modeloGeral?.versoes[0];

  if (modeloGeral && versaoGeral) {
    return {
      modelo: modeloGeral,
      versao: versaoGeral,
      modalidade,
      origem: "GERAL" as const,
    };
  }

  return null;
}