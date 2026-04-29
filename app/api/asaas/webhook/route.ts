import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  enviarEmailAcesso,
  enviarEmailAcessoExistente,
} from "@/lib/email";

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

export async function POST(req: Request) {
  try {
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

    // 🚀 NOVO BLOCO — MATRÍCULA IBE
if (externalReference?.startsWith("IBE_MATRICULA_")) {
  console.log("🎓 Pagamento de matrícula IBE detectado");

  const pagamentoConfirmado =
    paymentStatus === "RECEIVED" ||
    paymentStatus === "CONFIRMED" ||
    paymentStatus === "RECEIVED_IN_CASH" ||
    event === "PAYMENT_RECEIVED" ||
    event === "PAYMENT_CONFIRMED";

  if (!pagamentoConfirmado) {
    console.log("⏳ Matrícula aguardando pagamento...");
    return NextResponse.json({ ok: true });
  }

  console.log("✅ Pagamento confirmado - liberar matrícula IBE");

  // 👉 PRÓXIMO PASSO VAI AQUI

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

    const eventoPagamento =
      event === "PAYMENT_CREATED" ||
      event === "PAYMENT_RECEIVED" ||
      event === "PAYMENT_CONFIRMED" ||
      event === "PAYMENT_AUTHORIZED" ||
      event === "PAYMENT_UPDATED" ||
      event === "PAYMENT_OVERDUE" ||
      event === "PAYMENT_DELETED";

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