import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ASAAS_API_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

export async function POST(req: Request) {
  try {
    if (!ASAAS_API_KEY) {
      return NextResponse.json(
        { error: "ASAAS_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const nome = String(body.nome || "").trim();
    const email = String(body.email || "").trim();
    const whatsapp = String(body.whatsapp || "").trim();
    const valorTotal = Number(body.valorTotal || 0);

    if (!nome || !email || !whatsapp) {
      return NextResponse.json(
        { error: "Nome, email e WhatsApp são obrigatórios." },
        { status: 400 }
      );
    }

    if (!valorTotal || valorTotal <= 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos uma disciplina para gerar pagamento." },
        { status: 400 }
      );
    }

    const clienteRes = await fetch(`${ASAAS_API_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify({
        name: nome,
        email,
        mobilePhone: whatsapp.replace(/\D/g, ""),
      }),
    });

    const cliente = await clienteRes.json();

    if (!clienteRes.ok) {
      return NextResponse.json(
        { error: cliente?.errors?.[0]?.description || "Erro ao criar cliente no Asaas." },
        { status: 400 }
      );
    }

    const hoje = new Date();
    const vencimento = new Date(hoje);
    vencimento.setDate(hoje.getDate() + 2);

    const dueDate = vencimento.toISOString().slice(0, 10);

    const externalReference = `IBE_MATRICULA_${Date.now()}`;

await prisma.matriculaOnlineIbe.create({
  data: {
    nome,
    email,
    whatsapp,
    valorTotal,
    disciplinasIds: JSON.stringify(body.disciplinas || []),
    externalReference,
    status: "AGUARDANDO_PAGAMENTO",
  },
});

const pagamentoRes = await fetch(`${ASAAS_API_URL}/payments`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    access_token: ASAAS_API_KEY,
  },
  body: JSON.stringify({
    customer: cliente.id,
    billingType: "UNDEFINED",
    value: valorTotal,
    dueDate,
    description: "Matrícula online IBE - Bacharel Livre em Teologia",
    externalReference,
  }),
});

    const pagamento = await pagamentoRes.json();

    if (!pagamentoRes.ok) {
      return NextResponse.json(
        { error: pagamento?.errors?.[0]?.description || "Erro ao criar cobrança no Asaas." },
        { status: 400 }
      );
    }

    return NextResponse.json({
  paymentId: pagamento.id,
  externalReference,
  checkoutUrl: pagamento.invoiceUrl || pagamento.bankSlipUrl,
});

  } catch (error: any) {
    console.error("Erro matrícula IBE:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao iniciar matrícula." },
      { status: 500 }
    );
  }
}