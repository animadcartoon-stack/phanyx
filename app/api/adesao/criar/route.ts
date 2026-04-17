import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  criarClienteAsaas,
  criarCobrancaAsaas,
  criarCheckoutAssinaturaAsaas,
  obterQrCodePixAsaas,
  criarAssinaturaCartaoAsaas,
} from "@/lib/asaas";
import { enviarEmailCobranca } from "@/lib/email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getRemoteIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

function getValorPlano(plano: string) {
  const planoNormalizado = String(plano).trim().toUpperCase();

  if (planoNormalizado === "ESSENCIAL") return 49;
  if (planoNormalizado === "PROFISSIONAL") return 99;
  if (planoNormalizado === "ENTERPRISE") return 199;

  return 99;
}

function normalizarEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

function normalizarTelefone(telefone: string) {
  const digits = String(telefone || "").replace(/\D/g, "");
  return digits || null;
}

function normalizarCpfCnpj(valor: string) {
  return String(valor || "").replace(/\D/g, "");
}

function formatarDataISO(data?: string | null) {
  if (!data) return null;

  try {
    return new Date(data).toISOString().split("T")[0];
  } catch {
    return null;
  }
}

function normalizarFormaPagamento(
  valor: string
): "PIX" | "BOLETO" | "CREDIT_CARD" | "RECORRENTE" {
  const forma = String(valor || "PIX").trim().toUpperCase();

  if (forma === "BOLETO") return "BOLETO";
  if (forma === "CREDIT_CARD") return "CREDIT_CARD";
  if (forma === "RECORRENTE") return "RECORRENTE";
  return "PIX";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

const remoteIp =
  req.headers.get("x-forwarded-for")?.split(",")[0] ||
  req.headers.get("x-real-ip") ||
  "127.0.0.1";

    const nomeResponsavel = String(body?.nomeResponsavel || "").trim();
    const nomeInstituicao = String(body?.nomeInstituicao || "").trim();
    const email = normalizarEmail(body?.email || "");
    const telefone = normalizarTelefone(body?.telefone || "");
    const cpfCnpj = normalizarCpfCnpj(body?.cpfCnpj || "");
    const plano = String(body?.plano || "").trim().toUpperCase();
    const formaPagamento = normalizarFormaPagamento(body?.formaPagamento || "PIX");

    if (!nomeResponsavel) {
      return NextResponse.json(
        { error: "Nome do responsável é obrigatório." },
        { status: 400 }
      );
    }

    if (!nomeInstituicao) {
      return NextResponse.json(
        { error: "Nome da instituição é obrigatório." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório." },
        { status: 400 }
      );
    }

    if (!cpfCnpj) {
      return NextResponse.json(
        { error: "CPF/CNPJ é obrigatório." },
        { status: 400 }
      );
    }

    if (!plano) {
      return NextResponse.json(
        { error: "Plano é obrigatório." },
        { status: 400 }
      );
    }

    const valor = getValorPlano(plano);

    const adesaoPendenteExistente = await prisma.adesaoInstituicao.findFirst({
  where: {
    email,
    nomeInstituicao,
    plano,
    status: {
      in: ["PENDING", "PENDENTE", "AGUARDANDO_PAGAMENTO", "PROCESSANDO"],
    },
  },
  orderBy: {
    createdAt: "desc",
  },
});

if (adesaoPendenteExistente) {
  await prisma.adesaoInstituicao.update({
    where: { id: adesaoPendenteExistente.id },
    data: { status: "CANCELADO" },
  });
}

    const cliente = await criarClienteAsaas({
  name: nomeResponsavel,
  email,
  cpfCnpj,
  phone: telefone || undefined,

  postalCode: "88701-000",
  address: "Rua Lauro Müller",
  addressNumber: "123",
  province: "Centro",
  city: "Tubarão",       
});

    if (!cliente?.id) {
      throw new Error("Asaas não retornou o ID do cliente.");
    }
    const cartao = body?.cartao || null;
    const adesao = await prisma.adesaoInstituicao.create({
  data: {
    nomeResponsavel,
    nomeInstituicao,
    email,
    telefone,
    cpfCnpj,
    plano,
    valor,
    status: "PENDENTE",
    pixCode: "",
    asaasId: null,
  },
});

    try {
      const dueDate = new Date().toISOString().split("T")[0];

      let asaasId: string | null = null;
let pixCode = "";
let linkCobranca: string | null = null;
let vencimentoFormatado = formatarDataISO(dueDate);

if (formaPagamento === "RECORRENTE") {
  if (!cartao) {
    throw new Error("Dados do cartão não enviados para a assinatura.");
  }

  const remoteIp = getRemoteIp(req);

  const assinatura = await criarAssinaturaCartaoAsaas({
    customer: cliente.id,
    value: valor,
    nextDueDate: dueDate,
    cycle: "MONTHLY",
    description: `Assinatura PHANYX - ${plano}`,
    externalReference: String(adesao.id),
    creditCard: {
      holderName: cartao.nomeTitular,
      number: cartao.numero,
      expiryMonth: cartao.mesExpiracao,
      expiryYear: cartao.anoExpiracao,
      ccv: cartao.cvv,
    },
    creditCardHolderInfo: {
      name: nomeResponsavel,
      email,
      cpfCnpj: cartao.cpfCnpjTitular,
      postalCode: "88701-000",
      addressNumber: "123",
      addressComplement: "",
      phone: telefone || "48999999999",
    },
    remoteIp,
  });

  asaasId = assinatura.id;
  linkCobranca = null;
  vencimentoFormatado = formatarDataISO(dueDate);

  await prisma.adesaoInstituicao.update({
    where: { id: adesao.id },
    data: {
      asaasId: assinatura.id,
      status: "PROCESSANDO",
    },
  });

  return NextResponse.json({
    ok: true,
    recorrente: true,
    adesao: {
      id: adesao.id,
      status: "PROCESSANDO",
    },
    assinatura: {
      id: assinatura.id,
    },
  });
}

    } catch (err: any) {
      console.error("🔥 ERRO REAL ASAAS:", err);

      await prisma.adesaoInstituicao.update({
        where: { id: adesao.id },
        data: {
          status: "ERRO",
        },
      });

      return NextResponse.json(
        {
          error: err?.message || "Erro ao gerar cobrança no Asaas",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("ERRO CRIAR ADESAO:", error);

    return NextResponse.json(
      {
        error: "Erro ao criar adesão",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}