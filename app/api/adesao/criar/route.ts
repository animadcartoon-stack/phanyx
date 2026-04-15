import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  criarClienteAsaas,
  criarCobrancaAsaas,
  criarAssinaturaCartaoAsaas,
  obterQrCodePixAsaas,
} from "@/lib/asaas";
import { enviarEmailCobranca } from "@/lib/email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
          in: ["PENDING", "PENDENTE", "AGUARDANDO_PAGAMENTO"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (adesaoPendenteExistente?.asaasId) {
      return NextResponse.json({
        success: true,
        reutilizada: true,
        adesao: adesaoPendenteExistente,
      });
    }

    const cliente = await criarClienteAsaas({
      name: nomeResponsavel,
      email,
      cpfCnpj,
    });

    if (!cliente?.id) {
      throw new Error("Asaas não retornou o ID do cliente.");
    }

    const adesao = await prisma.adesaoInstituicao.create({
      data: {
        nomeResponsavel,
        nomeInstituicao,
        email,
        telefone,
        cpfCnpj,
        plano,
        valor,
        status: "PENDING",
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
  const assinatura = await criarAssinaturaCartaoAsaas({
    customer: cliente.id,
    billingType: "CREDIT_CARD",
    value: Number(valor),
    nextDueDate: dueDate,
    cycle: "MONTHLY",
    description: `Assinatura PHANYX - ${plano}`,
    externalReference: String(adesao.id),
  });

  asaasId = assinatura?.id ? String(assinatura.id) : null;

  if (!asaasId) {
    throw new Error("Asaas não retornou o ID da assinatura.");
  }

  vencimentoFormatado = formatarDataISO(assinatura?.nextDueDate || dueDate);
} else {
  const cobranca = await criarCobrancaAsaas({
    customer: cliente.id,
    billingType: formaPagamento as "PIX" | "BOLETO" | "CREDIT_CARD",
    value: Number(valor),
    dueDate,
    description: `Adesão PHANYX - ${plano}`,
    externalReference: String(adesao.id),
  });

  asaasId = cobranca?.id ? String(cobranca.id) : null;

  if (!asaasId) {
    throw new Error("Asaas não retornou o ID da cobrança.");
  }

  if (formaPagamento === "PIX") {
    const qrCode = await obterQrCodePixAsaas(asaasId);
    pixCode = qrCode?.payload ? String(qrCode.payload) : "";

    if (!pixCode) {
      throw new Error("Asaas não retornou o código Pix.");
    }
  }

  const cobrancaAny = cobranca as any;
  linkCobranca = cobrancaAny?.invoiceUrl || null;
  vencimentoFormatado = formatarDataISO(cobrancaAny?.dueDate || dueDate);
}

const adesaoAtualizada = await prisma.adesaoInstituicao.update({
  where: { id: adesao.id },
  data: {
    asaasId,
    pixCode,
  },
});
  
      try {
        await enviarEmailCobranca({
          email,
          nome: nomeResponsavel,
          instituicao: nomeInstituicao,
          valor,
          vencimento: vencimentoFormatado,
          descricao: `Adesão PHANYX - ${plano} (${formaPagamento})`,
          linkCobranca,
        });
      } catch (emailError) {
        console.error("ERRO AO ENVIAR EMAIL DE COBRANÇA:", emailError);
      }

      return NextResponse.json({
        success: true,
        adesao: adesaoAtualizada,
        formaPagamento,
        invoiceUrl: linkCobranca,
        pixCode,
      });
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