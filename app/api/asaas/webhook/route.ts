import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";
import {
  enviarEmailAcesso,
  enviarEmailAcessoExistente,
  enviarEmailPrimeiroAcesso,
  enviarEmailAssinaturaContrato,
} from "@/lib/email";

const ASAAS_API_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

const ASAAS_WEBHOOK_TOKEN =
  process.env.ASAAS_WEBHOOK_TOKEN;

function tokensIguais(
  recebido: string,
  esperado: string
) {
  const bufferRecebido =
    Buffer.from(recebido);

  const bufferEsperado =
    Buffer.from(esperado);

  if (
    bufferRecebido.length !==
    bufferEsperado.length
  ) {
    return false;
  }

  return timingSafeEqual(
    bufferRecebido,
    bufferEsperado
  );
}

function gerarSlugBase(texto: string) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function gerarSenhaTemporaria() {
  return Math.random().toString(36).slice(-8);
}

async function gerarSlugUnico(nomeInstituicao: string, adesaoId: string) {
  const baseSlug = gerarSlugBase(nomeInstituicao) || "instituicao";

  const tentativas = [
    `${baseSlug}-${adesaoId.slice(-6).toLowerCase()}`,
    `${baseSlug}-${Date.now().toString().slice(-6)}`,
    `${baseSlug}-${Math.random().toString(36).slice(-6).toLowerCase()}`,
  ];

  for (const slug of tentativas) {
    const existente = await prisma.instituicao.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existente) return slug;
  }

  return `${baseSlug}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(-4)
    .toLowerCase()}`;
}

function gerarSenhaTemporariaPhanyx() {
  const sufixo = Math.floor(1000 + Math.random() * 9000);
  return `Phanyx@${sufixo}`;
}

function dataDaquiDias(dias: number) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data;
}

function getPoliticaPlano(plano: string) {
  const planoNormalizado = String(plano || "").trim().toUpperCase();

  if (planoNormalizado === "ESSENCIAL") {
    return {
      valorBase: 49,
      valorPorAluno: 3,
      valorPorPoloExtra: 49,
      polosInclusos: 1,
    };
  }

  if (planoNormalizado === "ENTERPRISE") {
    return {
      valorBase: 199,
      valorPorAluno: 7,
      valorPorPoloExtra: 99,
      polosInclusos: 10,
    };
  }

  return {
    valorBase: 99,
    valorPorAluno: 5,
    valorPorPoloExtra: 79,
    polosInclusos: 3,
  };
}

function normalizarStatusAssinaturaPhanyx(status?: string | null) {
  const valor = String(status || "").trim().toUpperCase();

  if (
    valor === "INACTIVE" ||
    valor === "INATIVA" ||
    valor === "DELETED" ||
    valor === "REMOVED" ||
    valor === "CANCELLED" ||
    valor === "CANCELED"
  ) {
    return "CANCELADA";
  }

  return "TESTE_GRATIS";
}

async function processarAssinaturaPhanyxCriada(body: any, adesaoId: string) {
  const subscription = body?.subscription;

  if (!subscription?.id || !adesaoId) {
    return false;
  }

  const adesao = await prisma.adesaoInstituicao.findUnique({
    where: { id: adesaoId },
  });

  if (!adesao) {
    return false;
  }

  if (adesao.instituicaoId) {
    await prisma.assinaturaPhanyx.updateMany({
      where: {
        OR: [
          { adesaoInstituicaoId: adesao.id },
          { asaasSubscriptionId: subscription.id },
        ],
      },
      data: {
        asaasSubscriptionId: subscription.id,
        asaasCustomerId: subscription.customer || undefined,
        asaasBillingType: subscription.billingType || undefined,
        asaasCycle: subscription.cycle || undefined,
        ultimoEventoAsaas: body?.event || "SUBSCRIPTION_CREATED",
        ultimoWebhookAsaasEm: new Date(),
      },
    });

    return true;
  }

  const emailExistente = await prisma.user.findUnique({
    where: { email: adesao.email },
  });

  if (emailExistente) {
    await prisma.adesaoInstituicao.update({
      where: { id: adesao.id },
      data: {
        status: "ERRO",
      },
    });

    console.log("Não foi possível criar admin PHANYX. Email já existe:", adesao.email);
    return true;
  }

  const politicaPlano = getPoliticaPlano(adesao.plano);
  const slug = await gerarSlugUnico(adesao.nomeInstituicao, adesao.id);

  const senhaTemporaria = gerarSenhaTemporariaPhanyx();
  const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

  const testeGratisInicioEm = new Date();

  const testeGratisFimEm = subscription.nextDueDate
    ? new Date(subscription.nextDueDate)
    : dataDaquiDias(60);

  const instituicao = await prisma.instituicao.create({
    data: {
      nome: adesao.nomeInstituicao,
      plano: adesao.plano,
      slug,
      statusAssinatura: "TESTE_GRATIS",
      isentaPagamento: false,
      updatedAt: new Date(),
    },
  });

  const admin = await prisma.user.create({
    data: {
      nome: adesao.nomeResponsavel,
      email: adesao.email,
      senha: senhaHash,
      role: "ADMIN",
      instituicaoId: instituicao.id,
      precisaTrocarSenha: true,
    },
  });

  await prisma.adesaoInstituicao.update({
    where: { id: adesao.id },
    data: {
      status: "TESTE_GRATIS",
      asaasId: subscription.id,
      instituicaoId: instituicao.id,
    },
  });

  await prisma.assinaturaPhanyx.create({
    data: {
      instituicaoId: instituicao.id,
      adesaoInstituicaoId: adesao.id,

      plano: adesao.plano,
      status: normalizarStatusAssinaturaPhanyx(subscription.status),

      testeGratisInicioEm,
      testeGratisFimEm,
      primeiraCobrancaEm: testeGratisFimEm,
      proximaCobrancaEm: testeGratisFimEm,

      asaasCustomerId: subscription.customer || null,
      asaasSubscriptionId: subscription.id,
      asaasBillingType: subscription.billingType || "CREDIT_CARD",
      asaasCycle: subscription.cycle || "MONTHLY",

      valorBase: politicaPlano.valorBase,
      valorPorAluno: politicaPlano.valorPorAluno,
      valorPorPoloExtra: politicaPlano.valorPorPoloExtra,
      valorMensalAtual: Number(
        subscription.value || adesao.valor || politicaPlano.valorBase
      ),

      alunosAtivosReferencia: 0,
      polosReferencia: 1,

      ultimoEventoAsaas: body?.event || "SUBSCRIPTION_CREATED",
      ultimoWebhookAsaasEm: new Date(),
    },
  });

  try {
    await enviarEmailAcesso({
      email: admin.email,
      nome: admin.nome,
      senha: senhaTemporaria,
      instituicao: instituicao.nome,
    });

    console.log("✅ EMAIL DE ACESSO PHANYX ENVIADO PELO WEBHOOK:", {
      email: admin.email,
      instituicao: instituicao.nome,
    });
  } catch (emailError) {
    console.error("❌ ERRO AO ENVIAR EMAIL PHANYX PELO WEBHOOK:", emailError);
  }

  return true;
}

async function processarAssinaturaPhanyxAtualizadaOuCancelada(
  body: any,
  asaasSubscriptionId: string
) {
  const event = String(body?.event || "").trim().toUpperCase();
  const subscription = body?.subscription;

  const subscriptionId = asaasSubscriptionId || subscription?.id;

  if (!subscriptionId) {
    return false;
  }

  const assinatura = await prisma.assinaturaPhanyx.findFirst({
    where: { asaasSubscriptionId: subscriptionId },
    select: {
      id: true,
      instituicaoId: true,
    },
  });

  if (!assinatura) {
    return false;
  }

  if (event === "SUBSCRIPTION_UPDATED") {
    await prisma.assinaturaPhanyx.update({
      where: { id: assinatura.id },
      data: {
        asaasBillingType: subscription?.billingType || undefined,
        asaasCycle: subscription?.cycle || undefined,
        valorMensalAtual: subscription?.value
          ? Number(subscription.value)
          : undefined,
        proximaCobrancaEm: subscription?.nextDueDate
          ? new Date(subscription.nextDueDate)
          : undefined,
        ultimoEventoAsaas: event,
        ultimoWebhookAsaasEm: new Date(),
      },
    });

    return true;
  }

  if (
    event === "SUBSCRIPTION_INACTIVATED" ||
    event === "SUBSCRIPTION_DELETED"
  ) {
    await prisma.assinaturaPhanyx.update({
      where: { id: assinatura.id },
      data: {
        status: "CANCELADA",
        canceladaEm: new Date(),
        motivoCancelamento: `Evento Asaas: ${event}`,
        ultimoEventoAsaas: event,
        ultimoWebhookAsaasEm: new Date(),
      },
    });

    await prisma.instituicao.update({
      where: { id: assinatura.instituicaoId },
      data: {
        statusAssinatura: "CANCELADA",
        updatedAt: new Date(),
      },
    });

    return true;
  }

  return false;
}

async function processarPagamentoAssinaturaPhanyx(
  event: string,
  asaasSubscriptionId: string
) {
  if (!asaasSubscriptionId) {
    return false;
  }

  const assinatura = await prisma.assinaturaPhanyx.findFirst({
    where: { asaasSubscriptionId },
    select: {
      id: true,
      instituicaoId: true,
    },
  });

  if (!assinatura) {
    return false;
  }

  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
    await prisma.assinaturaPhanyx.update({
      where: { id: assinatura.id },
      data: {
        status: "ATIVA",
        ultimoEventoAsaas: event,
        ultimoWebhookAsaasEm: new Date(),
      },
    });

    await prisma.instituicao.update({
      where: { id: assinatura.instituicaoId },
      data: {
        statusAssinatura: "ATIVA",
        updatedAt: new Date(),
      },
    });

    return true;
  }

  if (event === "PAYMENT_OVERDUE") {
    await prisma.assinaturaPhanyx.update({
      where: { id: assinatura.id },
      data: {
        status: "EM_ATRASO",
        ultimoEventoAsaas: event,
        ultimoWebhookAsaasEm: new Date(),
      },
    });

    await prisma.instituicao.update({
      where: { id: assinatura.instituicaoId },
      data: {
        statusAssinatura: "EM_ATRASO",
        updatedAt: new Date(),
      },
    });

    return true;
  }

  await prisma.assinaturaPhanyx.update({
    where: { id: assinatura.id },
    data: {
      ultimoEventoAsaas: event,
      ultimoWebhookAsaasEm: new Date(),
    },
  });

  return true;
}

function obterReferencia(body: any) {
  const payment = body?.payment;
  const subscription = body?.subscription;
  const checkout = body?.checkout;

  return {
    externalReference: payment?.externalReference
      ? String(payment.externalReference).trim()
      : subscription?.externalReference
      ? String(subscription.externalReference).trim()
      : checkout?.externalReference
      ? String(checkout.externalReference).trim()
      : "",

    asaasPaymentId: payment?.id ? String(payment.id).trim() : "",

    asaasSubscriptionId: payment?.subscription
      ? String(payment.subscription).trim()
      : subscription?.id
      ? String(subscription.id).trim()
      : "",

    asaasCheckoutId: checkout?.id ? String(checkout.id).trim() : "",
  };
}

function mapearFormaPagamentoCaixa(
  billingType: unknown
) {
  const tipo = String(
    billingType || ""
  )
    .trim()
    .toUpperCase();

  if (tipo === "PIX") {
    return "PIX" as const;
  }

  if (tipo === "BOLETO") {
    return "BOLETO" as const;
  }

  if (
    tipo === "CREDIT_CARD" ||
    tipo === "DEBIT_CARD"
  ) {
    return "CARTAO" as const;
  }

  return "OUTRO" as const;
}

async function buscarPagamentoDoCheckoutAsaas(
  checkoutId: string
) {
  if (!ASAAS_API_KEY || !checkoutId) {
    return null;
  }

  try {
    const url = new URL(
      `${ASAAS_API_URL}/payments`
    );

    url.searchParams.set(
      "checkoutSession",
      checkoutId
    );

    url.searchParams.set("limit", "10");

    const resposta = await fetch(
      url.toString(),
      {
        method: "GET",
        headers: {
          accept: "application/json",
          access_token: ASAAS_API_KEY,
          "User-Agent": "PHANYX/1.0",
        },
      }
    );

    const dados = await resposta
      .json()
      .catch(() => null);

    if (!resposta.ok) {
      console.error(
        "Erro ao consultar pagamento do Checkout:",
        dados
      );

      return null;
    }

    const pagamentos = Array.isArray(
      dados?.data
    )
      ? dados.data
      : [];

    return (
      pagamentos.find((item: any) =>
        [
          "RECEIVED",
          "CONFIRMED",
          "RECEIVED_IN_CASH",
        ].includes(
          String(
            item?.status || ""
          ).toUpperCase()
        )
      ) ||
      pagamentos[0] ||
      null
    );
  } catch (error) {
    console.error(
      "Falha ao consultar pagamento do Checkout:",
      error
    );

    return null;
  }
}

export async function POST(req: Request) {
  try {
    if (!ASAAS_WEBHOOK_TOKEN) {
      console.error(
        "ASAAS_WEBHOOK_TOKEN não configurado."
      );

      return NextResponse.json(
        {
          error:
            "Webhook não configurado.",
        },
        { status: 500 }
      );
    }

    const tokenRecebido =
      req.headers
        .get("asaas-access-token")
        ?.trim() || "";

    if (
      !tokenRecebido ||
      !tokensIguais(
        tokenRecebido,
        ASAAS_WEBHOOK_TOKEN
      )
    ) {
      console.error(
        "Tentativa de webhook com token inválido."
      );

      return NextResponse.json(
        {
          error:
            "Webhook não autorizado.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const event = String(body?.event || "").trim().toUpperCase();
    const payment = body?.payment;
    const subscription = body?.subscription;
    const checkout = body?.checkout;

    const paymentStatus = payment?.status
      ? String(payment.status).trim().toUpperCase()
      : "";

    console.log("🔥 Webhook recebido:", JSON.stringify(body, null, 2));

    const {
      externalReference,
      asaasPaymentId,
      asaasSubscriptionId,
      asaasCheckoutId,
    } = obterReferencia(body);

    // 🚀 CRÉDITOS IA
if (
  (event === "PAYMENT_RECEIVED" ||
    event === "PAYMENT_CONFIRMED" ||
    event === "PAYMENT_AUTHORIZED") &&
  externalReference?.startsWith("CREDITOS_IA:")
) {
  try {
    const partes = externalReference.split(":");

    const userId = Number(partes[1]);
    const creditos = Number(partes[2]);

    if (
  externalReference?.startsWith("CREDITOS_IA_PUBLICO:") &&
  ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED", "PAYMENT_AUTHORIZED"].includes(event)
) {
  const [, email, creditosTexto] = externalReference.split(":");
  const creditos = Number(creditosTexto);

  if (email && creditos > 0) {
    await prisma.creditoIAPublico.upsert({
      where: { email: email.toLowerCase() },
      update: {
        saldo: {
          increment: creditos,
        },
      },
      create: {
        email: email.toLowerCase(),
        saldo: creditos,
      },
    });
  }

  return NextResponse.json({ received: true });
}

    if (!userId || !creditos) {
      console.error("Webhook créditos IA inválido:", externalReference);
      return NextResponse.json({ ok: true });
    }

    await prisma.creditoIA.upsert({
  where: {
    userId,
  },
  update: {
    saldo: {
      increment: creditos,
    },
  },
  create: {
    userId,
    saldo: creditos,
  },
});

    console.log(
      `✅ Créditos IA adicionados | usuário ${userId} | +${creditos}`
    );

    return NextResponse.json({
      ok: true,
      creditosAdicionados: true,
    });
  } catch (error) {
    console.error("Erro webhook créditos IA:", error);

    return NextResponse.json({
      ok: true,
    });
  }
}

        // 🚀 BLOCO — MATRÍCULA IBE
    const filtrosPagamentoIbe: any[] = [];

    if (externalReference) {
      filtrosPagamentoIbe.push({
        externalReference,
      });
    }

    if (asaasCheckoutId) {
      filtrosPagamentoIbe.push({
        asaasCheckoutId,
      });
    }

    if (asaasPaymentId) {
      filtrosPagamentoIbe.push({
        asaasPaymentId,
      });
    }

    const pagamentoIbeLocalizado =
      filtrosPagamentoIbe.length > 0
        ? await prisma
            .matriculaOnlineIbePagamento
            .findFirst({
              where: {
                OR: filtrosPagamentoIbe,
              },
              include: {
                matriculaOnlineIbe: {
                  include: {
                    pagamentos: {
                      orderBy: {
                        ordem: "asc",
                      },
                    },
                  },
                },
              },
            })
        : null;

    const eventoMatriculaIbe =
      externalReference?.startsWith(
        "IBE_MATRICULA_"
      ) ||
      Boolean(pagamentoIbeLocalizado);

    if (eventoMatriculaIbe) {
      console.log(
        "🎓 Evento de matrícula IBE detectado:",
        {
          event,
          externalReference,
          asaasCheckoutId,
          asaasPaymentId,
        }
      );

      const pagamentoIbe =
        pagamentoIbeLocalizado;

      /*
       * Não devolvemos 404 para um webhook não
       * localizado. Respostas fora da faixa 2xx
       * provocam novas tentativas no Asaas.
       */
      if (!pagamentoIbe) {
        console.error(
          "Pagamento da matrícula IBE não encontrado:",
          {
            event,
            externalReference,
            asaasCheckoutId,
            asaasPaymentId,
          }
        );

        return NextResponse.json({
          ok: true,
          ignorado: true,
          motivo:
            "PAGAMENTO_IBE_NAO_LOCALIZADO",
        });
      }

      /*
       * O Checkout já foi salvo pela API de
       * matrícula. Este evento apenas sincroniza.
       */
      if (event === "CHECKOUT_CREATED") {
        await prisma
          .matriculaOnlineIbePagamento
          .update({
            where: {
              id: pagamentoIbe.id,
            },
            data: {
              status:
                "AGUARDANDO_PAGAMENTO",

              asaasCheckoutId:
                asaasCheckoutId ||
                pagamentoIbe.asaasCheckoutId,
            },
          });

        return NextResponse.json({
          ok: true,
          checkoutIbeCriado: true,
        });
      }

      const checkoutCancelado =
        event === "CHECKOUT_CANCELED" ||
        event === "PAYMENT_DELETED" ||
        paymentStatus === "DELETED" ||
        paymentStatus === "CANCELED" ||
        paymentStatus === "CANCELLED";

      const checkoutExpirado =
        event === "CHECKOUT_EXPIRED" ||
        event === "PAYMENT_OVERDUE" ||
        paymentStatus === "OVERDUE";

      if (
        checkoutCancelado ||
        checkoutExpirado
      ) {
        const statusParte =
          checkoutExpirado
            ? "EXPIRADO"
            : "CANCELADO";

        await prisma
          .matriculaOnlineIbePagamento
          .updateMany({
            where: {
              id: pagamentoIbe.id,

              /*
               * Um evento atrasado de expiração ou
               * cancelamento não pode desfazer um
               * pagamento já confirmado.
               */
              status: {
                not: "PAGO",
              },
            },
            data: {
              status: statusParte,

              asaasCheckoutId:
                asaasCheckoutId ||
                pagamentoIbe.asaasCheckoutId,

              asaasPaymentId:
                asaasPaymentId ||
                pagamentoIbe.asaasPaymentId,
            },
          });

        const partesAtualizadas =
          await prisma
            .matriculaOnlineIbePagamento
            .findMany({
              where: {
                matriculaOnlineIbeId:
                  pagamentoIbe
                    .matriculaOnlineIbeId,
              },
            });

        const valorJaPago =
          partesAtualizadas
            .filter(
              (parte) =>
                parte.status === "PAGO"
            )
            .reduce(
              (total, parte) =>
                total +
                Number(parte.valor || 0),
              0
            );

        const matriculaAtual =
          pagamentoIbe.matriculaOnlineIbe;

        if (
          matriculaAtual.status !== "PAGO"
        ) {
          await prisma
            .matriculaOnlineIbe
            .update({
              where: {
                id: matriculaAtual.id,
              },
              data: {
                valorPago: valorJaPago,

                status:
                  valorJaPago > 0
                    ? "PAGAMENTO_PARCIAL"
                    : statusParte,
              },
            });
        }

        return NextResponse.json({
          ok: true,
          checkoutIbeEncerrado: true,
          status: statusParte,
          valorPago: valorJaPago,
        });
      }

      /*
       * No CHECKOUT_PAID, consultamos a cobrança
       * criada pelo Checkout para obter o ID e a
       * forma realmente utilizada pelo comprador.
       */
      const checkoutIdParaConsulta =
        asaasCheckoutId ||
        pagamentoIbe.asaasCheckoutId ||
        "";

      const pagamentoDoCheckout =
        event === "CHECKOUT_PAID" &&
        checkoutIdParaConsulta
          ? await buscarPagamentoDoCheckoutAsaas(
              checkoutIdParaConsulta
            )
          : null;

      const asaasPaymentIdConfirmado =
        asaasPaymentId ||
        String(
          pagamentoDoCheckout?.id || ""
        ).trim() ||
        pagamentoIbe.asaasPaymentId ||
        "";

      const billingTypeConfirmado =
        String(
          payment?.billingType ||
            pagamentoDoCheckout?.billingType ||
            pagamentoIbe.billingTypeAsaas ||
            ""
        )
          .trim()
          .toUpperCase();

      const statusAsaasConfirmado =
        String(
          paymentStatus ||
            pagamentoDoCheckout?.status ||
            ""
        )
          .trim()
          .toUpperCase();

      const pagamentoConfirmado =
        event === "CHECKOUT_PAID" ||
        event === "PAYMENT_RECEIVED" ||
        event === "PAYMENT_CONFIRMED" ||
        statusAsaasConfirmado ===
          "RECEIVED" ||
        statusAsaasConfirmado ===
          "CONFIRMED" ||
        statusAsaasConfirmado ===
          "RECEIVED_IN_CASH";

      if (!pagamentoConfirmado) {
        console.log(
          "⏳ Matrícula IBE ainda aguardando pagamento:",
          {
            event,
            paymentStatus:
              statusAsaasConfirmado,
          }
        );

        return NextResponse.json({
          ok: true,
          aguardandoPagamento: true,
        });
      }

      await prisma
        .matriculaOnlineIbePagamento
        .update({
          where: {
            id: pagamentoIbe.id,
          },
          data: {
            status: "PAGO",
            pagoEm:
              pagamentoIbe.pagoEm ||
              new Date(),

            asaasCheckoutId:
              checkoutIdParaConsulta ||
              pagamentoIbe.asaasCheckoutId,

            asaasPaymentId:
              asaasPaymentIdConfirmado ||
              pagamentoIbe.asaasPaymentId,

            billingTypeAsaas:
              billingTypeConfirmado ||
              pagamentoIbe.billingTypeAsaas,
          },
        });

            const preMatricula =
        await prisma
          .matriculaOnlineIbe
          .findUnique({
            where: {
              id:
                pagamentoIbe
                  .matriculaOnlineIbeId,
            },

            include: {
              pagamentos: {
                orderBy: {
                  ordem: "asc",
                },
              },
            },
          });

      if (!preMatricula) {
        console.error(
          "Pré-matrícula IBE não encontrada:",
          pagamentoIbe
            .matriculaOnlineIbeId
        );

        return NextResponse.json({
          ok: true,
          ignorado: true,
          motivo:
            "PRE_MATRICULA_IBE_NAO_LOCALIZADA",
        });
      }

      if (
        preMatricula.status === "PAGO"
      ) {
        return NextResponse.json({
          ok: true,
          jaProcessado: true,
        });
      }

      const valorPagoConfirmado =
        preMatricula.pagamentos
          .filter(
            (parte) =>
              parte.status === "PAGO"
          )
          .reduce(
            (total, parte) =>
              total +
              Number(parte.valor || 0),
            0
          );

      const valorTotalMatricula =
        Number(
          preMatricula.valorTotal || 0
        );

      const matriculaQuitada =
        valorPagoConfirmado + 0.009 >=
        valorTotalMatricula;

      /*
       * Ainda falta uma parte.
       * Atualiza somente o valor confirmado.
       */
      if (!matriculaQuitada) {
        await prisma
          .matriculaOnlineIbe
          .update({
            where: {
              id: preMatricula.id,
            },

            data: {
              valorPago:
                valorPagoConfirmado,

              status:
                "PAGAMENTO_PARCIAL",

              asaasPaymentId:
                asaasPaymentIdConfirmado ||
                preMatricula.asaasPaymentId,
            },
          });

        console.log(
          "💰 Pagamento parcial da matrícula IBE:",
          {
            matriculaOnlineIbeId:
              preMatricula.id,

            valorPago:
              valorPagoConfirmado,

            valorTotal:
              valorTotalMatricula,
          }
        );

        return NextResponse.json({
          ok: true,
          pagamentoParcial: true,

          valorPago:
            valorPagoConfirmado,

          valorTotal:
            valorTotalMatricula,

          saldoRestante: Math.max(
            0,
            valorTotalMatricula -
              valorPagoConfirmado
          ),
        });
      }

      /*
       * Bloqueio atômico:
       * somente uma execução poderá criar
       * aluno, matrícula, contrato e caixa.
       */
      const bloqueioProcessamento =
        await prisma
          .matriculaOnlineIbe
          .updateMany({
            where: {
              id: preMatricula.id,

              status: {
                in: [
                  "AGUARDANDO_PAGAMENTO",
                  "PAGAMENTO_PARCIAL",
                  "EXPIRADO",
                  "CANCELADO",
                ],
              },
            },

            data: {
              valorPago:
                valorPagoConfirmado,

              status:
                "PROCESSANDO_MATRICULA",

              asaasPaymentId:
                asaasPaymentIdConfirmado ||
                preMatricula.asaasPaymentId,
            },
          });

      if (
        bloqueioProcessamento.count !== 1
      ) {
        return NextResponse.json({
          ok: true,

          jaProcessadoOuEmAndamento:
            true,
        });
      }

      try {
        const instituicaoIdIbe = 1;

    
  let senhaTempIbe = "";
  let userIbe = await prisma.user.findUnique({
    where: { email: preMatricula.email },
  });

  if (!userIbe) {
    senhaTempIbe = gerarSenhaTemporaria();
    const senhaHashIbe = await bcrypt.hash(senhaTempIbe, 10);

    userIbe = await prisma.user.create({
      data: {
        nome: preMatricula.nome,
        email: preMatricula.email,
        senha: senhaHashIbe,
        role: "ALUNO",
        instituicaoId: instituicaoIdIbe,
        precisaTrocarSenha: true,
      },
    });
  }

  let alunoIbe = await prisma.aluno.findFirst({
    where: {
      userId: userIbe.id,
      instituicaoId: instituicaoIdIbe,
    },
  });

  if (!alunoIbe) {
    alunoIbe = await prisma.aluno.create({
      data: {
        nome: preMatricula.nome,
        cpf: preMatricula.cpf || null,
        telefone: preMatricula.whatsapp,
        instituicaoId: instituicaoIdIbe,
        userId: userIbe.id,
        statusAluno: "ATIVO",
        matricula: `IBE-${Date.now().toString().slice(-6)}`,
      },
    });
  }

  const matriculaIbe = await prisma.matricula.create({
    data: {
      alunoId: alunoIbe.id,
      instituicaoId: instituicaoIdIbe,
      status: "ATIVA",
      realizadaPeloAluno: true,
      confirmadaEm: new Date(),
      valorMatricula: preMatricula.valorTotal,
    },
  });

  const turmaIbe = await prisma.turma.findFirst({
    where: {
      instituicaoId: instituicaoIdIbe,
      ativa: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (!turmaIbe) {
    throw new Error("Nenhuma turma ativa encontrada para a matrícula IBE.");
  }

  const disciplinasIds = JSON.parse(preMatricula.disciplinasIds || "[]");

  for (const disciplinaId of disciplinasIds) {
    await prisma.itemMatricula.create({
      data: {
        matriculaId: matriculaIbe.id,
        disciplinaId: Number(disciplinaId),
        turmaId: turmaIbe.id,
        instituicaoId: instituicaoIdIbe,
        tipoItem: "GRADE_PRINCIPAL",
        status: "EM_CURSO",
      },
    });
  }

  const lancamento = await prisma.lancamentoFinanceiro.create({
    data: {
      tipo: "MATRICULA",
      descricao: "Matrícula online IBE - Bacharel Livre em Teologia",
      valorOriginal: Number(preMatricula.valorTotal || 0),
      valorFinal: Number(preMatricula.valorTotal || 0),
      valorPago: Number(preMatricula.valorTotal || 0),
      vencimento: new Date(),
      pagoEm: new Date(),
      status: "PAGO",
      observacao:
  `Pagamento confirmado pelo Asaas. ` +
  `Referência: ${preMatricula.externalReference}`,
      instituicaoId: instituicaoIdIbe,
      alunoId: alunoIbe.id,
      matriculaId: matriculaIbe.id,
    },
  });

  const agora = new Date();
  const inicioDoDia = new Date(agora);
  inicioDoDia.setHours(0, 0, 0, 0);

  const fimDoDia = new Date(agora);
  fimDoDia.setHours(23, 59, 59, 999);

  const identificadorOnline = `ONLINE_ASAAS_IBE_${inicioDoDia
    .toISOString()
    .slice(0, 10)}`;

  let caixaOnline = await prisma.caixa.findFirst({
    where: {
      instituicaoId: instituicaoIdIbe,
      origem: "ONLINE_ASAAS_IBE",
      identificadorOnline,
      dataAbertura: {
        gte: inicioDoDia,
        lte: fimDoDia,
      },
    },
  });

  if (!caixaOnline) {
    caixaOnline = await prisma.caixa.create({
      data: {
        instituicaoId: instituicaoIdIbe,
        origem: "ONLINE_ASAAS_IBE",
        identificadorOnline,
        fechamentoAutomatico: true,
        status: "ABERTO",
        saldoInicial: 0,
        saldoSistema: 0,
        observacaoAbertura:
          "Caixa online criado automaticamente para pagamentos Asaas da matrícula IBE.",
      },
    });
  }

  let totalNovosMovimentos = 0;

  const partesPagas =
    preMatricula.pagamentos.filter(
      (parte) =>
        parte.status === "PAGO"
    );

  for (const partePaga of partesPagas) {
    const filtrosMovimento: any[] = [
      {
        externalReference:
          partePaga.externalReference,
      },
    ];

    if (partePaga.asaasPaymentId) {
      filtrosMovimento.push({
        asaasPaymentId:
          partePaga.asaasPaymentId,
      });
    }

    const movimentoExistente =
      await prisma.movimentoCaixa.findFirst({
        where: {
          OR: filtrosMovimento,
        },
      });

    if (movimentoExistente) {
      continue;
    }

    const valorParte = Number(
      partePaga.valor || 0
    );

    await prisma.movimentoCaixa.create({
      data: {
        tipo: "ENTRADA",

        descricao:
          `Recebimento online Asaas - ` +
          `matrícula IBE - parte ` +
          `${partePaga.ordem}`,

        valor: valorParte,

        formaPagamento:
          mapearFormaPagamentoCaixa(
            partePaga.billingTypeAsaas
          ),

        origem: "ONLINE_ASAAS_IBE",

        asaasPaymentId:
          partePaga.asaasPaymentId ||
          null,

        externalReference:
          partePaga.externalReference,

        instituicaoId:
          instituicaoIdIbe,

        caixaId: caixaOnline.id,
        alunoId: alunoIbe.id,
        lancamentoId: lancamento.id,
      },
    });

    totalNovosMovimentos +=
      valorParte;
  }

  if (totalNovosMovimentos > 0) {
    await prisma.caixa.update({
      where: {
        id: caixaOnline.id,
      },
      data: {
        saldoSistema: {
          increment:
            totalNovosMovimentos,
        },
      },
    });
  }

  const contrato = await prisma.contrato.create({
    data: {
      alunoId: alunoIbe.id,
      instituicaoId: instituicaoIdIbe,
      matriculaId: matriculaIbe.id,
      status: "PENDENTE",
      conteudo: `
        CONTRATO DE MATRÍCULA - IBE

        Aluno: ${alunoIbe.nome}
        Matrícula: ${alunoIbe.matricula || ""}
        Curso: Bacharel Livre em Teologia
        Valor: R$ ${String(preMatricula.valorTotal)}
      `,
    },
  });

  await prisma.matriculaOnlineIbe.update({
  where: {
    id: preMatricula.id,
  },
  data: {
    status: "PAGO",

    valorPago:
      preMatricula.valorTotal,

    asaasPaymentId:
      asaasPaymentIdConfirmado ||
      preMatricula.asaasPaymentId,
  },
});

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3001";

    const linkAssinatura = `${baseUrl}/assinatura/${contrato.tokenAssinatura}`;

    if (senhaTempIbe) {
      await enviarEmailPrimeiroAcesso({
        email: userIbe.email,
        nome: userIbe.nome,
        senha: senhaTempIbe,
        instituicao: "Instituto Batista de Educação",
        portal: "aluno",
      });
    }

    await enviarEmailAssinaturaContrato({
      email: userIbe.email,
      nome: userIbe.nome,
      instituicao: "Instituto Batista de Educação",
      titulo: "Contrato de matrícula - Bacharel Livre em Teologia",
      linkAssinatura,
    });
  } catch (e) {
    console.error("Erro ao enviar email de acesso/assinatura:", e);
  }

          return NextResponse.json({
          ok: true,
          alunoId: alunoIbe.id,
          matriculaId:
            matriculaIbe.id,
        });
      } catch (
        processamentoError
      ) {
        /*
         * Impede que uma nova entrega do
         * mesmo webhook crie registros
         * duplicados após uma falha parcial.
         */
        await prisma
          .matriculaOnlineIbe
          .updateMany({
            where: {
              id: preMatricula.id,

              status:
                "PROCESSANDO_MATRICULA",
            },

            data: {
              status:
                "ERRO_PROCESSAMENTO",

              valorPago:
                valorPagoConfirmado,
            },
          });

        throw processamentoError;
      }
    }

    console.log("🔎 Resumo webhook:", {
      event,
      paymentStatus,
      externalReference,
      asaasPaymentId,
      asaasSubscriptionId,
      asaasCheckoutId,
    });

    if (!event) {
      return NextResponse.json(
        { error: "Webhook inválido: evento ausente" },
        { status: 400 }
      );
    }

    // 🚀 PHANYX SaaS — assinatura criada pelo checkout com cartão
if (event === "SUBSCRIPTION_CREATED") {
  const tratado = await processarAssinaturaPhanyxCriada(
    body,
    externalReference
  );

  if (tratado) {
    return NextResponse.json({
      ok: true,
      assinaturaPhanyxCriada: true,
      adesaoId: externalReference,
      asaasSubscriptionId,
    });
  }
}

// 🚀 PHANYX SaaS — assinatura atualizada ou cancelada
if (
  event === "SUBSCRIPTION_UPDATED" ||
  event === "SUBSCRIPTION_INACTIVATED" ||
  event === "SUBSCRIPTION_DELETED"
) {
  const tratado = await processarAssinaturaPhanyxAtualizadaOuCancelada(
    body,
    asaasSubscriptionId
  );

  if (tratado) {
    return NextResponse.json({
      ok: true,
      assinaturaPhanyxAtualizada: true,
      asaasSubscriptionId,
      event,
    });
  }
}

// 🚀 PHANYX SaaS — pagamento de assinatura recorrente
if (event.startsWith("PAYMENT_") && asaasSubscriptionId) {
  const tratado = await processarPagamentoAssinaturaPhanyx(
    event,
    asaasSubscriptionId
  );

  if (tratado) {
    return NextResponse.json({
      ok: true,
      pagamentoAssinaturaPhanyx: true,
      asaasSubscriptionId,
      event,
    });
  }
}

    const eventoPagamento =
  event === "PAYMENT_CREATED" ||
  event === "PAYMENT_RECEIVED" ||
  event === "PAYMENT_CONFIRMED" ||
  event === "PAYMENT_AUTHORIZED" ||
  event === "PAYMENT_UPDATED" ||
  event === "PAYMENT_OVERDUE" ||
  event === "PAYMENT_DELETED" ||
  event === "PAYMENT_AWAITING_RISK_ANALYSIS" ||
  event === "PAYMENT_APPROVED_BY_RISK_ANALYSIS" ||
  event === "PAYMENT_REPROVED_BY_RISK_ANALYSIS";

    const eventoAssinatura =
      event === "SUBSCRIPTION_CREATED" ||
      event === "SUBSCRIPTION_UPDATED" ||
      event === "SUBSCRIPTION_DELETED";

    const eventoCheckout = event === "CHECKOUT_CREATED";

    if (!eventoPagamento && !eventoAssinatura && !eventoCheckout) {
      console.log("ℹ️ Evento ignorado:", { event, paymentStatus });
      return NextResponse.json({ ok: true, ignorado: true, event });
    }

    if (
      !externalReference &&
      !asaasPaymentId &&
      !asaasSubscriptionId &&
      !asaasCheckoutId
    ) {
      return NextResponse.json(
        { error: "Webhook sem referência suficiente para localizar a adesão" },
        { status: 400 }
      );
    }

    const filtrosOr: Array<{ id?: string; asaasId?: string }> = [];
    if (externalReference) filtrosOr.push({ id: externalReference });
    if (asaasPaymentId) filtrosOr.push({ asaasId: asaasPaymentId });
    if (asaasSubscriptionId) filtrosOr.push({ asaasId: asaasSubscriptionId });
    if (asaasCheckoutId) filtrosOr.push({ asaasId: asaasCheckoutId });

    const adesao = await prisma.adesaoInstituicao.findFirst({
      where: {
        OR: filtrosOr,
      },
    });

    if (!adesao) {
      console.error("❌ Adesão não encontrada", {
        externalReference,
        asaasPaymentId,
        asaasSubscriptionId,
        asaasCheckoutId,
      });

      return NextResponse.json(
        {
          error: "Adesão não encontrada",
          externalReference,
          asaasPaymentId,
          asaasSubscriptionId,
          asaasCheckoutId,
        },
        { status: 404 }
      );
    }

    console.log("✅ Adesão encontrada:", {
      id: adesao.id,
      email: adesao.email,
      statusAtual: adesao.status,
      instituicaoId: adesao.instituicaoId,
    });

    if (event === "CHECKOUT_CREATED") {
      await prisma.adesaoInstituicao.update({
        where: { id: adesao.id },
        data: {
          asaasId: asaasCheckoutId || adesao.asaasId,
          status: adesao.status === "PAGO" ? "PAGO" : "PROCESSANDO",
        },
      });

      return NextResponse.json({
        ok: true,
        checkoutCriado: true,
        adesaoId: adesao.id,
        asaasCheckoutId,
      });
    }

    if (
      event === "SUBSCRIPTION_CREATED" ||
      event === "SUBSCRIPTION_UPDATED" ||
      event === "SUBSCRIPTION_DELETED"
    ) {
      await prisma.adesaoInstituicao.update({
        where: { id: adesao.id },
        data: {
          asaasId: asaasSubscriptionId || adesao.asaasId,
          status:
            event === "SUBSCRIPTION_DELETED"
              ? "CANCELADO"
              : adesao.status === "PAGO"
              ? "PAGO"
              : "PROCESSANDO",
        },
      });

      return NextResponse.json({
        ok: true,
        assinaturaAtualizada: true,
        adesaoId: adesao.id,
        asaasSubscriptionId,
        event,
      });
    }

    if (event === "PAYMENT_CREATED") {
      await prisma.adesaoInstituicao.update({
        where: { id: adesao.id },
        data: {
          status: "PROCESSANDO",
          asaasId: asaasPaymentId || adesao.asaasId,
        },
      });

      return NextResponse.json({
        ok: true,
        pagamentoCriado: true,
        adesaoId: adesao.id,
        asaasPaymentId,
      });
    }

    if (
      event === "PAYMENT_DELETED" ||
      paymentStatus === "DELETED" ||
      paymentStatus === "CANCELLED" ||
      paymentStatus === "CANCELED"
    ) {
      await prisma.adesaoInstituicao.update({
        where: { id: adesao.id },
        data: {
          status: "CANCELADO",
          asaasId: asaasPaymentId || adesao.asaasId,
        },
      });

      return NextResponse.json({
        ok: true,
        cancelado: true,
        adesaoId: adesao.id,
      });
    }

    if (paymentStatus === "OVERDUE") {
      await prisma.adesaoInstituicao.update({
        where: { id: adesao.id },
        data: {
          status: "CANCELADO",
          asaasId: asaasPaymentId || adesao.asaasId,
        },
      });

      return NextResponse.json({
        ok: true,
        vencido: true,
        adesaoId: adesao.id,
      });
    }

    const statusPago =
      paymentStatus === "RECEIVED" ||
      paymentStatus === "CONFIRMED" ||
      paymentStatus === "RECEIVED_IN_CASH" ||
      event === "PAYMENT_RECEIVED" ||
      event === "PAYMENT_CONFIRMED" ||
      event === "PAYMENT_AUTHORIZED";

      if (event === "PAYMENT_AWAITING_RISK_ANALYSIS") {
  await prisma.adesaoInstituicao.update({
    where: { id: adesao.id },
    data: {
      status: "PROCESSANDO",
      asaasId: asaasPaymentId || adesao.asaasId,
    },
  });

  return NextResponse.json({
    ok: true,
    aguardandoAnaliseRisco: true,
    adesaoId: adesao.id,
  });
}

if (event === "PAYMENT_REPROVED_BY_RISK_ANALYSIS") {
  await prisma.adesaoInstituicao.update({
    where: { id: adesao.id },
    data: {
      status: "ERRO",
      asaasId: asaasPaymentId || adesao.asaasId,
    },
  });

  return NextResponse.json({
    ok: true,
    reprovadoAnaliseRisco: true,
    adesaoId: adesao.id,
  });
}

    if (!statusPago) {
      console.log("ℹ️ Evento recebido, mas ainda sem pagamento confirmado:", {
        event,
        paymentStatus,
        adesaoId: adesao.id,
      });

      return NextResponse.json({
        ok: true,
        aguardandoPagamento: true,
        adesaoId: adesao.id,
        event,
        paymentStatus,
      });
    }

    let instituicao = null;

    if (adesao.instituicaoId != null) {
      instituicao = await prisma.instituicao.findUnique({
        where: { id: adesao.instituicaoId },
      });
    }

    if (!instituicao) {
      const slug = await gerarSlugUnico(adesao.nomeInstituicao, adesao.id);

      instituicao = await prisma.instituicao.create({
        data: {
          nome: adesao.nomeInstituicao,
          plano: adesao.plano,
          slug,
          updatedAt: new Date(),
        },
      });

      console.log("✅ Instituição criada:", instituicao.id);
    } else {
      console.log("ℹ️ Instituição já existente:", instituicao.id);
    }

    let user = await prisma.user.findUnique({
      where: { email: adesao.email },
    });

    if (adesao.status === "PAGO" && user) {
      if (user.instituicaoId !== instituicao.id || user.role !== "ADMIN") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            instituicaoId: instituicao.id,
            role: "ADMIN",
          },
        });
      }

      await prisma.adesaoInstituicao.update({
        where: { id: adesao.id },
        data: {
          status: "PAGO",
          instituicaoId: instituicao.id,
          asaasId: asaasPaymentId || adesao.asaasId,
        },
      });

      return NextResponse.json({
        ok: true,
        reprocessoIgnorado: true,
        adesaoId: adesao.id,
      });
    }

    let senhaTemp = "";

if (!user) {
  senhaTemp = gerarSenhaTemporaria();
  const senhaHash = await bcrypt.hash(senhaTemp, 10);

  user = await prisma.user.create({
    data: {
      nome: adesao.nomeResponsavel,
      email: adesao.email,
      senha: senhaHash,
      role: "ADMIN",
      instituicaoId: instituicao.id,
      precisaTrocarSenha: true,
    },
  });

  console.log("✅ Admin criado:", user.email);
} else {
  user = await prisma.user.update({
    where: { id: user.id },
    data: {
      nome: user.nome || adesao.nomeResponsavel,
      role: "ADMIN",
      instituicaoId: instituicao.id,
    },
  });

  console.log("♻️ Admin reutilizado:", user.email);
}

    await prisma.adesaoInstituicao.update({
      where: { id: adesao.id },
      data: {
        status: "PAGO",
        instituicaoId: instituicao.id,
        asaasId: asaasPaymentId || adesao.asaasId,
      },
    });

    console.log("✅ Adesão atualizada para PAGO:", adesao.id);

    try {
      if (senhaTemp) {
        await enviarEmailAcesso({
          email: user.email,
          nome: user.nome,
          senha: senhaTemp,
          instituicao: instituicao.nome,
        });

        console.log("✅ Email de acesso enviado para:", user.email);
      } else {
        await enviarEmailAcessoExistente({
          email: user.email,
          nome: user.nome,
          instituicao: instituicao.nome,
        });

        console.log("✅ Email de acesso existente enviado para:", user.email);
      }
    } catch (emailError) {
      console.error("❌ Erro ao enviar email de acesso:", emailError);
    }

        return NextResponse.json({
      ok: true,
      pago: true,
      adesaoId: adesao.id,
      instituicaoId: instituicao.id,
      userId: user.id,
      asaasPaymentId,
    });
  } catch (error: any) {
    console.error("❌ ERRO WEBHOOK:", error);

    return NextResponse.json(
      {
        error: "Erro interno webhook",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}