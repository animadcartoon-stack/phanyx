import { prisma } from "@/lib/prisma";
import { atualizarAssinaturaAsaas } from "@/lib/asaas";

type OpcoesRecalculoAssinatura = {
  sincronizarAsaas?: boolean;
  atualizarCobrancasPendentes?: boolean;
  motivo?: string;
};

type ResultadoRecalculoAssinatura = {
  processado: boolean;
  sincronizadoAsaas: boolean;
  instituicaoContratanteId: number;
  assinaturaId: number | null;
  alunosAtivos: number;
  unidadesAtivas: number;
  unidadesIncluidas: number;
  unidadesExcedentes: number;
  valorBase: number;
  valorAlunos: number;
  valorUnidadesExcedentes: number;
  valorMensalCalculado: number;
  motivoIgnorado?: string;
};

function arredondarDinheiro(valor: number) {
  return (
    Math.round(
      (valor + Number.EPSILON) * 100
    ) / 100
  );
}

function numeroSeguro(valor: unknown) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return 0;
  }

  return numero;
}

function valoresDiferentes(
  valorAtual: number,
  novoValor: number
) {
  return (
    Math.abs(valorAtual - novoValor) >=
    0.01
  );
}

function statusPermiteSincronizacaoAsaas(
  status: unknown
) {
  const statusNormalizado = String(
    status ?? ""
  )
    .trim()
    .toUpperCase();

  return [
    "TESTE_GRATIS",
    "ATIVA",
    "EM_ATRASO",
  ].includes(statusNormalizado);
}

export async function recalcularAssinaturaPhanyx(
  instituicaoReferenciaId: number,
  opcoes: OpcoesRecalculoAssinatura = {}
): Promise<ResultadoRecalculoAssinatura> {
  const instituicaoId = Number(
    instituicaoReferenciaId
  );

  if (
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    throw new Error(
      "Instituição inválida para recalcular a assinatura."
    );
  }

  const instituicaoReferencia =
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
      },
    });

  if (!instituicaoReferencia) {
    throw new Error(
      "Instituição não encontrada para recalcular a assinatura."
    );
  }

  let instituicaoContratanteId =
    instituicaoReferencia.id;

  let instituicoesAtivasDaRedeIds:
    number[] = [];

  if (
    instituicaoReferencia.redeInstitucionalId
  ) {
    const rede =
      await prisma.redeInstitucional.findUnique({
        where: {
          id: instituicaoReferencia.redeInstitucionalId,
        },
        select: {
          id: true,
          ativo: true,
          instituicaoContratanteId: true,
          instituicoes: {
            where: {
              ativo: true,
            },
            select: {
              id: true,
            },
          },
        },
      });

    if (!rede) {
      throw new Error(
        "A rede institucional vinculada não foi encontrada."
      );
    }

    if (!rede.ativo) {
      throw new Error(
        "A rede institucional vinculada está inativa."
      );
    }

    instituicaoContratanteId =
      rede.instituicaoContratanteId;

    instituicoesAtivasDaRedeIds =
      Array.from(
        new Set(
          rede.instituicoes.map(
            (instituicao) =>
              instituicao.id
          )
        )
      );
  } else {
    if (
      instituicaoReferencia
        .herdaPlanoContratante
    ) {
      throw new Error(
        "A unidade herda o plano de uma contratante, mas não possui uma rede institucional válida."
      );
    }

    instituicoesAtivasDaRedeIds =
      instituicaoReferencia.ativo
        ? [instituicaoReferencia.id]
        : [];
  }

  const instituicaoContratante =
    await prisma.instituicao.findUnique({
      where: {
        id:
          instituicaoContratanteId,
      },
      select: {
        id: true,
        nome: true,
        ativo: true,
        isentaPagamento: true,
      },
    });

  if (!instituicaoContratante) {
    throw new Error(
      "A instituição contratante da rede não foi encontrada."
    );
  }

  /*
   * Garante que a contratante ativa esteja
   * presente na contagem da rede.
   */
  if (
    instituicaoContratante.ativo &&
    !instituicoesAtivasDaRedeIds.includes(
      instituicaoContratante.id
    )
  ) {
    instituicoesAtivasDaRedeIds.push(
      instituicaoContratante.id
    );
  }

  instituicoesAtivasDaRedeIds =
    Array.from(
      new Set(
        instituicoesAtivasDaRedeIds
      )
    );

  const unidadesAtivas =
    instituicoesAtivasDaRedeIds.length;

  const assinatura =
    await prisma.assinaturaPhanyx.findUnique({
      where: {
        instituicaoId:
          instituicaoContratanteId,
      },
      select: {
        id: true,
        plano: true,
        status: true,
        asaasSubscriptionId: true,
        valorBase: true,
        valorPorAluno: true,
        valorPorPoloExtra: true,
        valorMensalAtual: true,
        alunosAtivosReferencia: true,
        polosReferencia: true,
        polosInclusosContrato: true,
      },
    });

  const alunosAtivos =
    instituicoesAtivasDaRedeIds.length > 0
      ? await prisma.aluno.count({
          where: {
            instituicaoId: {
              in:
                instituicoesAtivasDaRedeIds,
            },
            ativo: true,
          },
        })
      : 0;

  if (!assinatura) {
    return {
      processado: false,
      sincronizadoAsaas: false,
      instituicaoContratanteId,
      assinaturaId: null,
      alunosAtivos,
      unidadesAtivas,
      unidadesIncluidas: 1,
      unidadesExcedentes:
        Math.max(
          0,
          unidadesAtivas - 1
        ),
      valorBase: 0,
      valorAlunos: 0,
      valorUnidadesExcedentes: 0,
      valorMensalCalculado: 0,
      motivoIgnorado:
        "A instituição contratante ainda não possui uma AssinaturaPhanyx.",
    };
  }

  const valorBase = numeroSeguro(
    assinatura.valorBase
  );

  const valorPorAluno = numeroSeguro(
    assinatura.valorPorAluno
  );

  const valorPorUnidadeExtra =
    numeroSeguro(
      assinatura.valorPorPoloExtra
    );

  const unidadesIncluidas =
    Math.max(
      1,
      Number(
        assinatura
          .polosInclusosContrato || 1
      )
    );

  const unidadesExcedentes =
    Math.max(
      0,
      unidadesAtivas -
        unidadesIncluidas
    );

  const valorAlunos =
    arredondarDinheiro(
      alunosAtivos *
        valorPorAluno
    );

  const valorUnidadesExcedentes =
    arredondarDinheiro(
      unidadesExcedentes *
        valorPorUnidadeExtra
    );

  const valorMensalCalculado =
    arredondarDinheiro(
      valorBase +
        valorAlunos +
        valorUnidadesExcedentes
    );

  const valorMensalAtual =
    numeroSeguro(
      assinatura.valorMensalAtual
    );

  const precisaAtualizarValor =
    valoresDiferentes(
      valorMensalAtual,
      valorMensalCalculado
    );

  let sincronizadoAsaas = false;

  const sincronizacaoSolicitada =
    opcoes.sincronizarAsaas === true;

  const podeSincronizarAsaas =
    sincronizacaoSolicitada &&
    precisaAtualizarValor &&
    Boolean(
      assinatura.asaasSubscriptionId
    ) &&
    !instituicaoContratante.isentaPagamento &&
    statusPermiteSincronizacaoAsaas(
      assinatura.status
    );

  if (
    podeSincronizarAsaas &&
    assinatura.asaasSubscriptionId
  ) {
    const descricao = [
      `PHANYX - Plano ${assinatura.plano}`,
      `${alunosAtivos} aluno(s) ativo(s) na rede`,
      `${unidadesAtivas} unidade(s) ativa(s) na rede`,
      `${unidadesIncluidas} unidade(s) incluída(s) no contrato`,
      `${unidadesExcedentes} unidade(s) excedente(s)`,
      opcoes.motivo
        ? `Motivo: ${opcoes.motivo}`
        : null,
    ]
      .filter(Boolean)
      .join(" | ")
      .slice(0, 500);

    await atualizarAssinaturaAsaas(
      assinatura.asaasSubscriptionId,
      {
        value:
          valorMensalCalculado,

        description:
          descricao,

        updatePendingPayments:
          opcoes
            .atualizarCobrancasPendentes ===
          true,
      }
    );

    sincronizadoAsaas = true;
  }

  await prisma.assinaturaPhanyx.update({
    where: {
      id: assinatura.id,
    },
    data: {
      alunosAtivosReferencia:
        alunosAtivos,

      polosReferencia:
        unidadesAtivas,

      valorMensalAtual:
        valorMensalCalculado,

      ultimoEventoAsaas:
        sincronizadoAsaas
          ? "PHANYX_RECALCULO_ASSINATURA"
          : undefined,

      ultimoWebhookAsaasEm:
        sincronizadoAsaas
          ? new Date()
          : undefined,
    },
  });

  return {
    processado: true,
    sincronizadoAsaas,
    instituicaoContratanteId,
    assinaturaId: assinatura.id,
    alunosAtivos,
    unidadesAtivas,
    unidadesIncluidas,
    unidadesExcedentes,
    valorBase,
    valorAlunos,
    valorUnidadesExcedentes,
    valorMensalCalculado,
  };
}