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

export async function POST(req: Request) {
  try {
    const body = await req.json();

const event = body?.event;
const payment = body?.payment;
const subscription = body?.subscription;

const paymentStatus = payment?.status
  ? String(payment.status).trim().toUpperCase()
  : "";

console.log("🔥 Webhook recebido:", JSON.stringify(body, null, 2));
console.log("🔎 Resumo webhook:", {
  event,
  paymentStatus,
  externalReference:
    payment?.externalReference ||
    subscription?.externalReference ||
    null,
  asaasPaymentId: payment?.id || null,
  subscriptionId:
    payment?.subscription ||
    subscription?.id ||
    null,
});

    if (!event || !payment) {
      console.error("❌ Webhook inválido: sem event ou payment");
      return NextResponse.json(
        { error: "Webhook inválido" },
        { status: 400 }
      );
    }

    const eventoPagamentoAceito =
  event === "PAYMENT_RECEIVED" ||
  event === "PAYMENT_CONFIRMED" ||
  event === "PAYMENT_AUTHORIZED";

const eventoAssinaturaAceito =
  event === "SUBSCRIPTION_CREATED" ||
  event === "SUBSCRIPTION_UPDATED";

const statusPago =
  paymentStatus === "RECEIVED" ||
  paymentStatus === "CONFIRMED" ||
  paymentStatus === "RECEIVED_IN_CASH";

if (!eventoPagamentoAceito && !eventoAssinaturaAceito && !statusPago) {
  console.log("ℹ️ Evento ignorado:", { event, paymentStatus });
  return NextResponse.json({ ok: true, ignorado: true });
}

    const externalReference =
  payment?.externalReference
    ? String(payment.externalReference).trim()
    : subscription?.externalReference
    ? String(subscription.externalReference).trim()
    : "";

const asaasPaymentId = payment?.id ? String(payment.id).trim() : "";

const asaasSubscriptionId =
  payment?.subscription
    ? String(payment.subscription).trim()
    : subscription?.id
    ? String(subscription.id).trim()
    : "";

    if (!externalReference && !asaasPaymentId && !asaasSubscriptionId) {
  console.error("❌ Webhook sem externalReference, payment.id ou subscription.id");
  return NextResponse.json(
    { error: "Webhook sem referência suficiente para localizar a adesão" },
    { status: 400 }
  );
}

    const filtrosOr: Array<{ id?: string; asaasId?: string }> = [];
if (externalReference) filtrosOr.push({ id: externalReference });
if (asaasPaymentId) filtrosOr.push({ asaasId: asaasPaymentId });
if (asaasSubscriptionId) filtrosOr.push({ asaasId: asaasSubscriptionId });

    const adesao = await prisma.adesaoInstituicao.findFirst({
      where: {
        OR: filtrosOr,
      },
    });

    if (!adesao) {
      console.error("❌ Adesão não encontrada", {
        externalReference,
        asaasPaymentId,
      });

      return NextResponse.json(
        {
          error: "Adesão não encontrada",
          externalReference,
          asaasPaymentId,
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

if (event === "SUBSCRIPTION_CREATED" || event === "SUBSCRIPTION_UPDATED") {
  await prisma.adesaoInstituicao.update({
    where: { id: adesao.id },
    data: {
      asaasId: asaasSubscriptionId || adesao.asaasId,
      status: adesao.status === "PAGO" ? "PAGO" : "PROCESSANDO",
    },
  });

  console.log("✅ Assinatura vinculada à adesão:", {
    adesaoId: adesao.id,
    asaasSubscriptionId,
  });

  return NextResponse.json({
    ok: true,
    assinaturaVinculada: true,
    adesaoId: adesao.id,
    asaasSubscriptionId,
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
  console.log("ℹ️ Adesão já estava paga e acesso já existe:", adesao.id);

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

  console.log("ℹ️ Reprocessamento detectado. Nenhum novo email será enviado.");

  return NextResponse.json({ ok: true, reprocessoIgnorado: true });
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
      adesaoId: adesao.id,
      instituicaoId: instituicao.id,
      userId: user.id,
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