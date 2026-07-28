import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ContextoGestaoPolos = {
  instituicaoId: number;
  instituicaoNome: string;
  instituicaoAtiva: boolean;
  redeId: number | null;
  instituicaoContratanteId: number;
  ehInstituicaoContratante: boolean;
  herdaPlanoContratante: boolean;
  permissaoDelegada: boolean;
  podeGerenciarPolos: boolean;
};

export async function obterContextoGestaoPolos(
  instituicaoId: number
): Promise<ContextoGestaoPolos | null> {
  if (
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    return null;
  }

  const instituicao =
    await prisma.instituicao.findUnique({
      where: {
        id: instituicaoId,
      },
      select: {
        id: true,
        nome: true,
        ativo: true,
        redeInstitucionalId: true,
        herdaPlanoContratante: true,
        podeCriarGerenciarPolos: true,
      },
    });

  if (!instituicao) {
    return null;
  }

  let rede:
    | {
        id: number;
        instituicaoContratanteId: number;
        ativo: boolean;
      }
    | null = null;

  if (instituicao.redeInstitucionalId) {
    rede = await prisma.redeInstitucional.findUnique({
      where: {
        id: instituicao.redeInstitucionalId,
      },
      select: {
        id: true,
        instituicaoContratanteId: true,
        ativo: true,
      },
    });
  } else if (!instituicao.herdaPlanoContratante) {
    rede =
      await prisma.redeInstitucional.findUnique({
        where: {
          instituicaoContratanteId:
            instituicao.id,
        },
        select: {
          id: true,
          instituicaoContratanteId: true,
          ativo: true,
        },
      });
  }

  const instituicaoContratanteId =
    rede?.instituicaoContratanteId ??
    instituicao.id;

  const ehInstituicaoContratante =
    instituicao.id ===
      instituicaoContratanteId &&
    instituicao.herdaPlanoContratante === false;

  const permissaoDelegada =
    instituicao.podeCriarGerenciarPolos ===
    true;

  const possuiVinculoDeRedeValido =
  instituicao.herdaPlanoContratante === false ||
  rede !== null;

const redeAtiva =
  rede !== null
    ? rede.ativo === true
    : instituicao.herdaPlanoContratante === false;

const podeGerenciarPolos =
  instituicao.ativo === true &&
  possuiVinculoDeRedeValido &&
  redeAtiva &&
  (ehInstituicaoContratante ||
    permissaoDelegada);

  return {
    instituicaoId: instituicao.id,
    instituicaoNome: instituicao.nome,
    instituicaoAtiva: instituicao.ativo,
    redeId: rede?.id ?? null,
    instituicaoContratanteId,
    ehInstituicaoContratante,
    herdaPlanoContratante:
      instituicao.herdaPlanoContratante,
    permissaoDelegada,
    podeGerenciarPolos,
  };
}

export function filtroInstituicoesDaRede(
  contexto: ContextoGestaoPolos
): Prisma.InstituicaoWhereInput {
  if (contexto.redeId) {
    return {
      redeInstitucionalId: contexto.redeId,
    };
  }

  return {
    id: contexto.instituicaoContratanteId,
  };
}

export function filtroPolosVisiveis(
  contexto: ContextoGestaoPolos
): Prisma.PoloWhereInput {
  /*
   * A contratante vê todos os polos cadastrados
   * pelas instituições pertencentes à rede.
   */
  if (
    contexto.ehInstituicaoContratante &&
    contexto.redeId
  ) {
    return {
      instituicao: {
        is: {
          redeInstitucionalId:
            contexto.redeId,
        },
      },
    };
  }

  /*
   * Uma unidade com permissão delegada visualiza
   * somente os polos cadastrados pelo próprio ID.
   */
  return {
    instituicaoId: contexto.instituicaoId,
  };
}

export function filtroPoloGerenciavel(
  contexto: ContextoGestaoPolos,
  poloId: number
): Prisma.PoloWhereInput {
  return {
    AND: [
      {
        id: poloId,
      },
      filtroPolosVisiveis(contexto),
    ],
  };
}

export async function obterResumoUnidadesDaRede(
  contexto: ContextoGestaoPolos
) {
  const contratante =
    await prisma.instituicao.findUnique({
      where: {
        id: contexto.instituicaoContratanteId,
      },
      select: {
        id: true,
        ativo: true,
        isentaPagamento: true,
        plano: true,
      },
    });

  if (!contratante) {
    throw new Error(
      "Instituição contratante da rede não encontrada."
    );
  }

  const assinatura =
    await prisma.assinaturaPhanyx.findUnique({
      where: {
        instituicaoId: contratante.id,
      },
      select: {
        polosInclusosContrato: true,
      },
    });

  let unidadesAtivas = contratante.ativo
    ? 1
    : 0;

  if (contexto.redeId) {
    unidadesAtivas =
      await prisma.instituicao.count({
        where: {
          redeInstitucionalId:
            contexto.redeId,
          ativo: true,
        },
      });
  }

  const limiteUnidadesIncluidas =
    contratante.isentaPagamento
      ? null
      : Math.max(
          1,
          Number(
            assinatura?.polosInclusosContrato ??
              1
          )
        );

  const unidadesExcedentes =
    limiteUnidadesIncluidas === null
      ? 0
      : Math.max(
          0,
          unidadesAtivas -
            limiteUnidadesIncluidas
        );

  /*
   * A próxima unidade será excedente quando
   * a quantidade atual já tiver atingido o limite.
   */
  const proximaUnidadeSeraExcedente =
    limiteUnidadesIncluidas !== null &&
    unidadesAtivas >=
      limiteUnidadesIncluidas;

  return {
    instituicaoContratanteId:
      contratante.id,
    isentaPagamento:
      contratante.isentaPagamento,
    unidadesAtivas,
    limiteUnidadesIncluidas,
    unidadesExcedentes,
    proximaUnidadeSeraExcedente,
  };
}