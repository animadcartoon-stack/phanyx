import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { enviarEmailAcesso } from "@/lib/email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function gerarSlugInstituicao(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function gerarSenhaTemporaria() {
  const sufixo = Math.floor(1000 + Math.random() * 9000);
  return `Phanyx@${sufixo}`;
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

function normalizarStatusAssinaturaAsaas(status?: string | null) {
  const valor = String(status || "").trim().toUpperCase();

  if (valor === "ACTIVE" || valor === "ATIVA") return "TESTE_GRATIS";

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

async function processarAssinaturaCriada(body: any) {
  const subscription = body?.subscription;

  if (!subscription?.id) {
    console.log("Webhook assinatura sem subscription.id.");
    return;
  }

  const adesaoId = String(
    subscription?.externalReference ||
      body?.checkout?.externalReference ||
      body?.externalReference ||
      ""
  ).trim();

  if (!adesaoId) {
    console.log("Webhook assinatura sem externalReference:", subscription.id);
    return;
  }

  const adesao = await prisma.adesaoInstituicao.findUnique({
    where: { id: adesaoId },
  });

  if (!adesao) {
    console.log("Adesão não encontrada para assinatura:", {
      adesaoId,
      subscriptionId: subscription.id,
    });
    return;
  }

  if (adesao.instituicaoId) {
    console.log("Adesão já possui instituição. Apenas sincronizando assinatura:", {
      adesaoId: adesao.id,
      instituicaoId: adesao.instituicaoId,
      subscriptionId: subscription.id,
    });

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

    return;
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

    console.log("Não foi possível criar admin. Email já existe:", adesao.email);
    return;
  }

  const politicaPlano = getPoliticaPlano(adesao.plano);

  const slugBase = gerarSlugInstituicao(adesao.nomeInstituicao);
  const slugFinal = `${slugBase}-${Date.now()}`;

  const senhaTemporaria = gerarSenhaTemporaria();
  const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

  const testeGratisInicioEm = new Date();
  const testeGratisFimEm = subscription.nextDueDate
    ? new Date(subscription.nextDueDate)
    : new Date();

  const instituicao = await prisma.instituicao.create({
    data: {
      nome: adesao.nomeInstituicao,
      slug: slugFinal,
      plano: adesao.plano,
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
      precisaTrocarSenha: true,
      instituicao: {
        connect: { id: instituicao.id },
      },
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
      status: normalizarStatusAssinaturaAsaas(subscription.status),

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
      valorMensalAtual: Number(subscription.value || adesao.valor || politicaPlano.valorBase),

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

    console.log("✅ EMAIL DE ACESSO ENVIADO PELO WEBHOOK:", {
      email: admin.email,
      instituicao: instituicao.nome,
    });
  } catch (emailError) {
    console.error("❌ ERRO AO ENVIAR EMAIL PELO WEBHOOK:", emailError);
  }
}

async function processarPagamento(body: any) {
  const event = String(body?.event || "").trim().toUpperCase();
  const payment = body?.payment;

  if (!payment?.id) return;

  const subscriptionId = payment?.subscription
    ? String(payment.subscription)
    : null;

  if (subscriptionId) {
    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      await prisma.assinaturaPhanyx.updateMany({
        where: { asaasSubscriptionId: subscriptionId },
        data: {
          status: "ATIVA",
          ultimoEventoAsaas: event,
          ultimoWebhookAsaasEm: new Date(),
        },
      });

      const assinatura = await prisma.assinaturaPhanyx.findFirst({
        where: { asaasSubscriptionId: subscriptionId },
        select: { instituicaoId: true },
      });

      if (assinatura?.instituicaoId) {
        await prisma.instituicao.update({
          where: { id: assinatura.instituicaoId },
          data: {
            statusAssinatura: "ATIVA",
            updatedAt: new Date(),
          },
        });
      }

      return;
    }

    if (event === "PAYMENT_OVERDUE") {
      await prisma.assinaturaPhanyx.updateMany({
        where: { asaasSubscriptionId: subscriptionId },
        data: {
          status: "EM_ATRASO",
          ultimoEventoAsaas: event,
          ultimoWebhookAsaasEm: new Date(),
        },
      });

      const assinatura = await prisma.assinaturaPhanyx.findFirst({
        where: { asaasSubscriptionId: subscriptionId },
        select: { instituicaoId: true },
      });

      if (assinatura?.instituicaoId) {
        await prisma.instituicao.update({
          where: { id: assinatura.instituicaoId },
          data: {
            statusAssinatura: "EM_ATRASO",
            updatedAt: new Date(),
          },
        });
      }

      return;
    }
  }

  if (event !== "PAYMENT_CONFIRMED" && event !== "PAYMENT_RECEIVED") {
    return;
  }

  const adesao = await prisma.adesaoInstituicao.findFirst({
    where: {
      asaasId: payment.id,
    },
  });

  if (!adesao) {
    console.log("Adesão não encontrada para pagamento:", payment.id);
    return;
  }

  if (adesao.status === "PAID" || adesao.status === "PAGO") {
    return;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.phanyx.com.br";

  await fetch(`${baseUrl}/api/adesao/confirmar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: adesao.id }),
  });
}

async function processarAssinaturaAtualizadaOuCancelada(body: any) {
  const event = String(body?.event || "").trim().toUpperCase();
  const subscription = body?.subscription;

  if (!subscription?.id) return;

  if (event === "SUBSCRIPTION_UPDATED") {
    await prisma.assinaturaPhanyx.updateMany({
      where: { asaasSubscriptionId: subscription.id },
      data: {
        asaasBillingType: subscription.billingType || undefined,
        asaasCycle: subscription.cycle || undefined,
        valorMensalAtual: Number(subscription.value || 0),
        proximaCobrancaEm: subscription.nextDueDate
          ? new Date(subscription.nextDueDate)
          : undefined,
        ultimoEventoAsaas: event,
        ultimoWebhookAsaasEm: new Date(),
      },
    });

    return;
  }

  if (
    event === "SUBSCRIPTION_INACTIVATED" ||
    event === "SUBSCRIPTION_DELETED"
  ) {
    await prisma.assinaturaPhanyx.updateMany({
      where: { asaasSubscriptionId: subscription.id },
      data: {
        status: "CANCELADA",
        canceladaEm: new Date(),
        motivoCancelamento: `Evento Asaas: ${event}`,
        ultimoEventoAsaas: event,
        ultimoWebhookAsaasEm: new Date(),
      },
    });

    const assinatura = await prisma.assinaturaPhanyx.findFirst({
      where: { asaasSubscriptionId: subscription.id },
      select: { instituicaoId: true },
    });

    if (assinatura?.instituicaoId) {
      await prisma.instituicao.update({
        where: { id: assinatura.instituicaoId },
        data: {
          statusAssinatura: "CANCELADA",
          updatedAt: new Date(),
        },
      });
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("WEBHOOK ASAAS:", JSON.stringify(body, null, 2));

    const event = String(body?.event || "").trim().toUpperCase();

    if (!event) {
      return NextResponse.json({ received: true });
    }

    if (event === "SUBSCRIPTION_CREATED") {
      await processarAssinaturaCriada(body);
      return NextResponse.json({ received: true });
    }

    if (
      event === "SUBSCRIPTION_UPDATED" ||
      event === "SUBSCRIPTION_INACTIVATED" ||
      event === "SUBSCRIPTION_DELETED"
    ) {
      await processarAssinaturaAtualizadaOuCancelada(body);
      return NextResponse.json({ received: true });
    }

    if (event.startsWith("PAYMENT_")) {
      await processarPagamento(body);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("ERRO WEBHOOK ASAAS:", error);

    return NextResponse.json(
      {
        error: "Erro webhook Asaas",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}