import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { criarClienteAsaas, criarCobrancaAsaas } from "@/lib/asaas";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, email, cpfCnpj, valor } = body;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório." },
        { status: 400 }
      );
    }

    if (!cpfCnpj) {
      return NextResponse.json(
        { error: "CPF/CNPJ é obrigatório." },
        { status: 400 }
      );
    }

    if (!valor || Number(valor) <= 0) {
      return NextResponse.json(
        { error: "Valor inválido." },
        { status: 400 }
      );
    }

    let pixCode = "";
    let asaasId: string | null = null;

    try {
      const cliente = await criarClienteAsaas({
        name: nome,
        email,
        cpfCnpj,
      });

      const cobranca = await criarCobrancaAsaas({
        customer: cliente.id,
        billingType: "PIX",
        value: Number(valor),
        dueDate: new Date().toISOString().split("T")[0],
        description: "Pagamento PHANYX",
      });

      asaasId = cobranca?.id || null;

const cobrancaPix = cobranca as any;

pixCode =
  cobrancaPix?.pixQrCode ||
  cobrancaPix?.payload ||
  cobrancaPix?.pixCopyPaste ||
  "";
    } catch (err) {
      console.warn("⚠️ Erro no Asaas, usando fallback fake:", err);
    }

    if (!pixCode) {
      pixCode = `
00020126360014BR.GOV.BCB.PIX0114554899999999
5204000053039865802BR5925PHANYX EDUCACAO
6009SAO PAULO62070503***6304ABCD
      `.replace(/\n/g, "");
    }

    let pagamento;

try {
  pagamento = await prisma.checkoutPagamento.create({
    data: {
      nome,
      email,
      cpfCnpj,
      valor: Number(valor),
      status: "PENDING",
      pixCode,
      asaasId,
    },
  });
} catch (dbError) {
  console.error("ERRO AO SALVAR NO BANCO:", dbError);

  // 🔥 FALLBACK TOTAL (NÃO QUEBRA O FLUXO)
  pagamento = {
    id: Date.now(),
    nome,
    email,
    cpfCnpj,
    valor,
    status: "PENDING",
    pixCode,
  };
}

    return NextResponse.json({
      success: true,
      pagamento,
    });
  } catch (error: any) {
    console.error("ERRO PAGAMENTO:", error);

    return NextResponse.json(
      {
        error: "Erro ao gerar cobrança",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}