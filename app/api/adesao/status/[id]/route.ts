import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: {
    id: string;
  };
};

function normalizarStatus(status?: string | null) {
  const valor = String(status || "")
    .trim()
    .toUpperCase();

  if (valor === "PAYMENT_CONFIRMED" || valor === "PAYMENT_RECEIVED") {
    return "PAGO";
  }

  if (valor === "PENDING" || valor === "PENDENTE" || valor === "AGUARDANDO_PAGAMENTO") {
    return "PENDENTE";
  }

  if (valor === "PAID" || valor === "PAGO") {
    return "PAGO";
  }

  if (valor === "ERROR" || valor === "ERRO") {
    return "ERRO";
  }

  return valor || "PENDENTE";
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const id = String(params?.id || "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "ID da adesão não informado." },
        { status: 400 }
      );
    }

    const adesao = await prisma.adesaoInstituicao.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        nomeInstituicao: true,
        nomeResponsavel: true,
        email: true,
        telefone: true,
        cpfCnpj: true,
        plano: true,
        valor: true,
        pixCode: true,
        asaasId: true,
        instituicaoId: true,
        createdAt: true,
        updatedAt: true,
        instituicao: {
          select: {
            id: true,
            nome: true,
            slug: true,
            plano: true,
          },
        },
      },
    });

    if (!adesao) {
      return NextResponse.json(
        { error: "Adesão não encontrada." },
        { status: 404 }
      );
    }

    const statusNormalizado = normalizarStatus(adesao.status);

    return NextResponse.json({
      success: true,
      adesao: {
        ...adesao,
        status: statusNormalizado,
        valor: Number(adesao.valor),
      },
      fluxo: {
        pago: statusNormalizado === "PAGO",
        pendente: statusNormalizado === "PENDENTE",
        erro: statusNormalizado === "ERRO",
        possuiPix: Boolean(adesao.pixCode),
        possuiCobrancaAsaas: Boolean(adesao.asaasId),
        instituicaoCriada: Boolean(adesao.instituicaoId),
      },
    });
  } catch (error: any) {
    console.error("ERRO STATUS ADESAO:", error);

    return NextResponse.json(
      {
        error: "Erro ao consultar status da adesão.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}