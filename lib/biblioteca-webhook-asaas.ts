import "server-only";

import {
  AcaoAuditoriaBiblioteca,
  Prisma,
  StatusContratacaoModulo,
  StatusModuloAdicional,
  StatusProcessamentoWebhookAsaas,
  TipoModuloAdicional,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

const PREFIXO_REFERENCIA = "PHANYX_BIBLIOTECA:";
const TEMPO_PROCESSAMENTO_MS = 5 * 60 * 1000;

type ReferenciasWebhook = {
  eventoId: string;
  evento: string;
  externalReference: string;
  asaasPaymentId: string;
  asaasSubscriptionId: string;
  asaasCheckoutId: string;
  asaasCustomerId: string;
  billingType: string;
  cycle: string;
  proximaCobrancaEm: Date | null;
  valorPagamento: number | null;
};

type ResultadoWebhookBiblioteca = {
  reconhecido: boolean;
  processado?: boolean;
  duplicado?: boolean;
  evento?: string;
  contratacaoId?: string;
  acao?: string;
};

function texto(valor: unknown) {
  return String(valor || "").trim();
}

function dataValida(valor: unknown) {
  const valorTexto = texto(valor);

  if (!valorTexto) return null;

  const data = new Date(valorTexto);

  return Number.isNaN(data.getTime())
    ? null
    : data;
}

function numeroValido(valor: unknown) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : null;
}

function extrairReferencias(
  body: any
): ReferenciasWebhook {
  const payment = body?.payment || {};
  const subscription = body?.subscription || {};
  const checkout = body?.checkout || {};

  const externalReference =
    texto(payment?.externalReference) ||
    texto(subscription?.externalReference) ||
    texto(checkout?.externalReference);

  const asaasSubscriptionId =
    texto(payment?.subscription) ||
    texto(subscription?.id) ||
    texto(checkout?.subscription?.id);

  const asaasCheckoutId =
    texto(checkout?.id) ||
    texto(payment?.checkoutSession) ||
    texto(payment?.checkout?.id);

  const billingType =
    texto(payment?.billingType) ||
    texto(subscription?.billingType) ||
    texto(checkout?.billingTypes?.[0]);

  const cycle =
    texto(subscription?.cycle) ||
    texto(checkout?.subscription?.cycle);

  return {
    eventoId: texto(body?.id),
    evento: texto(body?.event).toUpperCase(),
    externalReference,
    asaasPaymentId: texto(payment?.id),
    asaasSubscriptionId,
    asaasCheckoutId,
    asaasCustomerId:
      texto(payment?.customer) ||
      texto(subscription?.customer) ||
      texto(checkout?.customer),
    billingType,
    cycle,
    proximaCobrancaEm: dataValida(
      subscription?.nextDueDate ||
        checkout?.subscription?.nextDueDate
    ),
    valorPagamento: numeroValido(
      payment?.value ?? checkout?.value
    ),
  };
}

function mensagemErro(erro: unknown) {
  return erro instanceof Error
    ? erro.message.slice(0, 2000)
    : "Falha desconhecida ao processar webhook da biblioteca.";
}

function ehErroPrisma(
  erro: unknown,
  codigo: string
) {
  return (
    erro instanceof
      Prisma.PrismaClientKnownRequestError &&
    erro.code === codigo
  );
}

async function localizarContratacao(
  referencias: ReferenciasWebhook
) {
  const filtros: Prisma.ModuloAdicionalContratacaoWhereInput[] = [];

  if (
    referencias.externalReference.startsWith(
      PREFIXO_REFERENCIA
    )
  ) {
    filtros.push({
      externalReference:
        referencias.externalReference,
    });

    const contratacaoId =
      referencias.externalReference.slice(
        PREFIXO_REFERENCIA.length
      );

    if (contratacaoId) {
      filtros.push({ id: contratacaoId });
    }
  }

  if (referencias.asaasCheckoutId) {
    filtros.push({
      asaasCheckoutId:
        referencias.asaasCheckoutId,
    });
  }

  if (referencias.asaasSubscriptionId) {
    filtros.push({
      asaasSubscriptionId:
        referencias.asaasSubscriptionId,
    });
  }

  if (filtros.length === 0) {
    return null;
  }

  return prisma.moduloAdicionalContratacao.findFirst({
    where: {
      tipo:
        TipoModuloAdicional.BIBLIOTECA_VIRTUAL,
      OR: filtros,
    },
    select: {
      id: true,
      moduloId: true,
      instituicaoId: true,
      status: true,
      valorMensal: true,
      plano: true,
      armazenamentoContratadoBytes: true,
      solicitadoPorId: true,
      pagoEm: true,
    },
  });
}

async function assumirEvento(
  referencias: ReferenciasWebhook
) {
  try {
    const evento =
      await prisma.asaasWebhookEvento.create({
        data: {
          asaasEventoId: referencias.eventoId,
          evento: referencias.evento,
          status:
            StatusProcessamentoWebhookAsaas.PROCESSANDO,
          externalReference:
            referencias.externalReference || null,
          asaasPaymentId:
            referencias.asaasPaymentId || null,
          asaasSubscriptionId:
            referencias.asaasSubscriptionId || null,
          asaasCheckoutId:
            referencias.asaasCheckoutId || null,
          tentativas: 1,
        },
        select: {
          id: true,
        },
      });

    return {
      processar: true as const,
      eventoBancoId: evento.id,
    };
  } catch (erro) {
    if (!ehErroPrisma(erro, "P2002")) {
      throw erro;
    }

    const existente =
      await prisma.asaasWebhookEvento.findUnique({
        where: {
          asaasEventoId: referencias.eventoId,
        },
        select: {
          id: true,
          status: true,
          atualizadoEm: true,
        },
      });

    if (!existente) {
      throw erro;
    }

    if (
      existente.status ===
      StatusProcessamentoWebhookAsaas.PROCESSADO
    ) {
      return {
        processar: false as const,
        eventoBancoId: existente.id,
      };
    }

    const processamentoTravadoAntesDe = new Date(
      Date.now() - TEMPO_PROCESSAMENTO_MS
    );

    if (
      existente.status ===
        StatusProcessamentoWebhookAsaas.PROCESSANDO &&
      existente.atualizadoEm.getTime() >
        processamentoTravadoAntesDe.getTime()
    ) {
      return {
        processar: false as const,
        eventoBancoId: existente.id,
      };
    }

    const assumido =
      await prisma.asaasWebhookEvento.updateMany({
        where: {
          id: existente.id,
          OR: [
            {
              status:
                StatusProcessamentoWebhookAsaas.ERRO,
            },
            {
              status:
                StatusProcessamentoWebhookAsaas.RECEBIDO,
            },
            {
              status:
                StatusProcessamentoWebhookAsaas.PROCESSANDO,
              atualizadoEm: {
                lte: processamentoTravadoAntesDe,
              },
            },
          ],
        },
        data: {
          status:
            StatusProcessamentoWebhookAsaas.PROCESSANDO,
          tentativas: {
            increment: 1,
          },
          ultimoErro: null,
          processadoEm: null,
        },
      });

    return {
      processar: assumido.count === 1,
      eventoBancoId: existente.id,
    };
  }
}

function validarValorPagamento(
  valorEsperado: unknown,
  valorPagamento: number | null
) {
  if (valorPagamento === null) return;

  const esperado = Number(valorEsperado);

  if (
    !Number.isFinite(esperado) ||
    Math.abs(esperado - valorPagamento) > 0.01
  ) {
    throw new Error(
      "O valor confirmado pelo Asaas não corresponde ao valor da contratação da biblioteca."
    );
  }
}

async function ativarBiblioteca(
  contratacao: NonNullable<
    Awaited<ReturnType<typeof localizarContratacao>>
  >,
  referencias: ReferenciasWebhook
) {
  validarValorPagamento(
    contratacao.valorMensal,
    referencias.valorPagamento
  );

  const agora = new Date();

  await prisma.$transaction(async (tx) => {
    const modulo =
      await tx.moduloAdicionalInstituicao.findFirst({
        where: {
          id: contratacao.moduloId,
          instituicaoId: contratacao.instituicaoId,
          tipo:
            TipoModuloAdicional.BIBLIOTECA_VIRTUAL,
        },
        select: {
          id: true,
          status: true,
          inicioEm: true,
        },
      });

    if (!modulo) {
      throw new Error(
        "Módulo da Biblioteca Virtual não encontrado."
      );
    }

    await tx.moduloAdicionalContratacao.update({
      where: {
        id: contratacao.id,
      },
      data: {
        status: StatusContratacaoModulo.PAGA,
        chaveVigente: null,
        pagoEm: contratacao.pagoEm || agora,
        asaasCheckoutId:
          referencias.asaasCheckoutId || undefined,
        asaasSubscriptionId:
          referencias.asaasSubscriptionId || undefined,
        ultimoErro: null,
      },
    });

    await tx.moduloAdicionalInstituicao.update({
      where: {
        id: modulo.id,
      },
      data: {
        plano: contratacao.plano,
        status: StatusModuloAdicional.ATIVO,
        valorMensal: contratacao.valorMensal,
        armazenamentoContratadoBytes:
          contratacao.armazenamentoContratadoBytes,
        inicioEm: modulo.inicioEm || agora,
        proximaCobrancaEm:
          referencias.proximaCobrancaEm || undefined,
        suspensoEm: null,
        canceladoEm: null,
        motivoSuspensao: null,
        motivoCancelamento: null,
        asaasSubscriptionId:
          referencias.asaasSubscriptionId || undefined,
        asaasCustomerId:
          referencias.asaasCustomerId || undefined,
        asaasBillingType:
          referencias.billingType || "CREDIT_CARD",
        asaasCycle:
          referencias.cycle || "MONTHLY",
      },
    });

    await tx.bibliotecaConfiguracao.upsert({
      where: {
        instituicaoId: contratacao.instituicaoId,
      },
      update: {},
      create: {
        instituicaoId: contratacao.instituicaoId,
      },
    });

    if (
      modulo.status !== StatusModuloAdicional.ATIVO
    ) {
      await tx.bibliotecaAuditoria.create({
        data: {
          instituicaoId: contratacao.instituicaoId,
          usuarioId: contratacao.solicitadoPorId,
          entidade: "ModuloAdicionalInstituicao",
          entidadeId: String(modulo.id),
          acao:
            AcaoAuditoriaBiblioteca.CONCEDER_ACESSO,
          descricao:
            "Biblioteca Virtual ativada após confirmação de pagamento do Asaas.",
          dadosAnteriores: {
            status: modulo.status,
          },
          dadosPosteriores: {
            status: StatusModuloAdicional.ATIVO,
            plano: contratacao.plano,
          },
          metadados: {
            origem: "ASAAS_WEBHOOK",
            eventoId: referencias.eventoId,
            evento: referencias.evento,
            contratacaoId: contratacao.id,
            asaasPaymentId:
              referencias.asaasPaymentId || null,
            asaasSubscriptionId:
              referencias.asaasSubscriptionId || null,
          },
        },
      });
    }
  });
}

async function atualizarIdentificadores(
  contratacao: NonNullable<
    Awaited<ReturnType<typeof localizarContratacao>>
  >,
  referencias: ReferenciasWebhook
) {
  await prisma.$transaction([
    prisma.moduloAdicionalContratacao.update({
      where: {
        id: contratacao.id,
      },
      data: {
        status:
          contratacao.status ===
          StatusContratacaoModulo.CRIADA
            ? StatusContratacaoModulo
                .AGUARDANDO_PAGAMENTO
            : undefined,
        asaasCheckoutId:
          referencias.asaasCheckoutId || undefined,
        asaasSubscriptionId:
          referencias.asaasSubscriptionId || undefined,
      },
    }),

    prisma.moduloAdicionalInstituicao.update({
      where: {
        id: contratacao.moduloId,
      },
      data: {
        asaasSubscriptionId:
          referencias.asaasSubscriptionId || undefined,
        asaasCustomerId:
          referencias.asaasCustomerId || undefined,
        asaasBillingType:
          referencias.billingType || undefined,
        asaasCycle:
          referencias.cycle || undefined,
        proximaCobrancaEm:
          referencias.proximaCobrancaEm || undefined,
      },
    }),
  ]);
}

async function encerrarCheckout(
  contratacao: NonNullable<
    Awaited<ReturnType<typeof localizarContratacao>>
  >,
  referencias: ReferenciasWebhook,
  expirado: boolean
) {
  const agora = new Date();

  await prisma.$transaction(async (tx) => {
    const atualizado =
      await tx.moduloAdicionalContratacao.updateMany({
        where: {
          id: contratacao.id,
          status: {
            in: [
              StatusContratacaoModulo.CRIADA,
              StatusContratacaoModulo
                .AGUARDANDO_PAGAMENTO,
            ],
          },
        },
        data: expirado
          ? {
              status:
                StatusContratacaoModulo.EXPIRADA,
              chaveVigente: null,
              expiradoEm: agora,
            }
          : {
              status:
                StatusContratacaoModulo.CANCELADA,
              chaveVigente: null,
              canceladoEm: agora,
            },
      });

    if (atualizado.count === 0) return;

    await tx.moduloAdicionalInstituicao.updateMany({
      where: {
        id: contratacao.moduloId,
        instituicaoId: contratacao.instituicaoId,
        status: StatusModuloAdicional.PENDENTE,
      },
      data: expirado
        ? {
            status: StatusModuloAdicional.PENDENTE,
          }
        : {
            status: StatusModuloAdicional.CANCELADO,
            canceladoEm: agora,
            motivoCancelamento:
              `Checkout cancelado no Asaas (${referencias.evento}).`,
          },
    });
  });
}

async function cancelarAssinaturaBiblioteca(
  contratacao: NonNullable<
    Awaited<ReturnType<typeof localizarContratacao>>
  >,
  referencias: ReferenciasWebhook
) {
  const agora = new Date();

  await prisma.$transaction([
    prisma.moduloAdicionalContratacao.update({
      where: {
        id: contratacao.id,
      },
      data: {
        status: StatusContratacaoModulo.CANCELADA,
        chaveVigente: null,
        canceladoEm: agora,
        asaasSubscriptionId:
          referencias.asaasSubscriptionId || undefined,
      },
    }),

    prisma.moduloAdicionalInstituicao.update({
      where: {
        id: contratacao.moduloId,
      },
      data: {
        status: StatusModuloAdicional.CANCELADO,
        canceladoEm: agora,
        motivoCancelamento:
          `Assinatura encerrada pelo Asaas (${referencias.evento}).`,
      },
    }),

    prisma.bibliotecaAuditoria.create({
      data: {
        instituicaoId: contratacao.instituicaoId,
        usuarioId: contratacao.solicitadoPorId,
        entidade: "ModuloAdicionalInstituicao",
        entidadeId: String(contratacao.moduloId),
        acao:
          AcaoAuditoriaBiblioteca.REVOGAR_ACESSO,
        descricao:
          "Acesso à Biblioteca Virtual cancelado por evento do Asaas.",
        metadados: {
          origem: "ASAAS_WEBHOOK",
          eventoId: referencias.eventoId,
          evento: referencias.evento,
          contratacaoId: contratacao.id,
        },
      },
    }),
  ]);
}

async function marcarEmAtraso(
  contratacao: NonNullable<
    Awaited<ReturnType<typeof localizarContratacao>>
  >,
  referencias: ReferenciasWebhook
) {
  await prisma.moduloAdicionalInstituicao.updateMany({
    where: {
      id: contratacao.moduloId,
      instituicaoId: contratacao.instituicaoId,
      status: {
        in: [
          StatusModuloAdicional.ATIVO,
          StatusModuloAdicional.EM_ATRASO,
        ],
      },
    },
    data: {
      status: StatusModuloAdicional.EM_ATRASO,
      motivoSuspensao:
        `Pagamento em atraso no Asaas (${referencias.evento}).`,
    },
  });
}

async function suspenderPorEstorno(
  contratacao: NonNullable<
    Awaited<ReturnType<typeof localizarContratacao>>
  >,
  referencias: ReferenciasWebhook
) {
  await prisma.moduloAdicionalInstituicao.updateMany({
    where: {
      id: contratacao.moduloId,
      instituicaoId: contratacao.instituicaoId,
      status: {
        in: [
          StatusModuloAdicional.ATIVO,
          StatusModuloAdicional.EM_ATRASO,
        ],
      },
    },
    data: {
      status: StatusModuloAdicional.SUSPENSO,
      suspensoEm: new Date(),
      motivoSuspensao:
        `Pagamento estornado ou contestado no Asaas (${referencias.evento}).`,
    },
  });
}

async function processarEvento(
  contratacao: NonNullable<
    Awaited<ReturnType<typeof localizarContratacao>>
  >,
  referencias: ReferenciasWebhook
) {
  const evento = referencias.evento;

  if (
    evento === "PAYMENT_CONFIRMED" ||
    evento === "PAYMENT_RECEIVED" ||
    evento === "CHECKOUT_PAID"
  ) {
    await ativarBiblioteca(
      contratacao,
      referencias
    );

    return "BIBLIOTECA_ATIVADA";
  }

  if (
    evento === "CHECKOUT_CREATED" ||
    evento === "SUBSCRIPTION_CREATED" ||
    evento === "SUBSCRIPTION_UPDATED"
  ) {
    await atualizarIdentificadores(
      contratacao,
      referencias
    );

    return "IDENTIFICADORES_ATUALIZADOS";
  }

  if (evento === "CHECKOUT_CANCELED") {
    await encerrarCheckout(
      contratacao,
      referencias,
      false
    );

    return "CHECKOUT_CANCELADO";
  }

  if (evento === "CHECKOUT_EXPIRED") {
    await encerrarCheckout(
      contratacao,
      referencias,
      true
    );

    return "CHECKOUT_EXPIRADO";
  }

  if (
    evento === "SUBSCRIPTION_INACTIVATED" ||
    evento === "SUBSCRIPTION_DELETED"
  ) {
    await cancelarAssinaturaBiblioteca(
      contratacao,
      referencias
    );

    return "ASSINATURA_CANCELADA";
  }

  if (
    evento === "PAYMENT_OVERDUE" ||
    evento ===
      "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED" ||
    evento ===
      "PAYMENT_REPROVED_BY_RISK_ANALYSIS"
  ) {
    await marcarEmAtraso(
      contratacao,
      referencias
    );

    return "PAGAMENTO_EM_ATRASO";
  }

  if (
    evento === "PAYMENT_REFUNDED" ||
    evento === "PAYMENT_PARTIALLY_REFUNDED" ||
    evento === "PAYMENT_CHARGEBACK_REQUESTED"
  ) {
    await suspenderPorEstorno(
      contratacao,
      referencias
    );

    return "BIBLIOTECA_SUSPENSA";
  }

  return "EVENTO_SEM_ALTERACAO";
}

export async function processarWebhookBibliotecaAsaas(
  body: any
): Promise<ResultadoWebhookBiblioteca> {
  const referencias = extrairReferencias(body);

  const possuiPrefixoBiblioteca =
    referencias.externalReference.startsWith(
      PREFIXO_REFERENCIA
    );

  const contratacao =
    await localizarContratacao(referencias);

  if (!possuiPrefixoBiblioteca && !contratacao) {
    return {
      reconhecido: false,
    };
  }

  if (!referencias.eventoId) {
    throw new Error(
      "Webhook da biblioteca sem identificador único do evento."
    );
  }

  if (!referencias.evento) {
    throw new Error(
      "Webhook da biblioteca sem tipo de evento."
    );
  }

  const eventoAssumido =
    await assumirEvento(referencias);

  if (!eventoAssumido.processar) {
    return {
      reconhecido: true,
      processado: true,
      duplicado: true,
      evento: referencias.evento,
      contratacaoId: contratacao?.id,
    };
  }

  try {
    if (!contratacao) {
      throw new Error(
        "Contratação da Biblioteca Virtual não encontrada para o evento do Asaas."
      );
    }

    const acao = await processarEvento(
      contratacao,
      referencias
    );

    await prisma.asaasWebhookEvento.update({
      where: {
        id: eventoAssumido.eventoBancoId,
      },
      data: {
        status:
          StatusProcessamentoWebhookAsaas.PROCESSADO,
        processadoEm: new Date(),
        ultimoErro: null,
      },
    });

    return {
      reconhecido: true,
      processado: true,
      duplicado: false,
      evento: referencias.evento,
      contratacaoId: contratacao.id,
      acao,
    };
  } catch (erro) {
    await prisma.asaasWebhookEvento.update({
      where: {
        id: eventoAssumido.eventoBancoId,
      },
      data: {
        status:
          StatusProcessamentoWebhookAsaas.ERRO,
        ultimoErro: mensagemErro(erro),
      },
    });

    throw erro;
  }
}