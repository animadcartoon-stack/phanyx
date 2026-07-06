import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { cancelarAssinaturaAsaas } from "@/lib/asaas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const motivo = String(body?.motivo || "").trim();

    const assinatura = await prisma.assinaturaPhanyx.findUnique({
      where: {
        instituicaoId: user.instituicaoId,
      },
      include: {
        instituicao: {
          select: {
            id: true,
            nome: true,
            isentaPagamento: true,
            statusAssinatura: true,
          },
        },
      },
    });

    if (!assinatura) {
      return NextResponse.json(
        { error: "Assinatura PHANYX não encontrada para esta instituição." },
        { status: 404 }
      );
    }

    if (assinatura.instituicao?.isentaPagamento) {
      return NextResponse.json(
        { error: "Esta instituição é isenta de pagamento e não possui cancelamento de assinatura comercial." },
        { status: 400 }
      );
    }

    if (assinatura.status === "CANCELADA") {
      return NextResponse.json({
        ok: true,
        jaCancelada: true,
        assinatura: {
          id: assinatura.id,
          status: assinatura.status,
          canceladaEm: assinatura.canceladaEm,
        },
      });
    }

    if (!assinatura.asaasSubscriptionId) {
      return NextResponse.json(
        { error: "Assinatura sem ID de recorrência do Asaas." },
        { status: 400 }
      );
    }

    const resultadoAsaas = await cancelarAssinaturaAsaas(
      assinatura.asaasSubscriptionId
    );

    const agora = new Date();

    const assinaturaAtualizada = await prisma.assinaturaPhanyx.update({
      where: {
        id: assinatura.id,
      },
      data: {
        status: "CANCELADA",
        canceladaEm: agora,
        canceladaPorId: user.id,
        motivoCancelamento:
          motivo || "Cancelamento solicitado pela instituição no PHANYX.",
        ultimoEventoAsaas: "CANCELAMENTO_SOLICITADO_PHANYX",
        ultimoWebhookAsaasEm: agora,
      },
    });

    await prisma.instituicao.update({
      where: {
        id: user.instituicaoId,
      },
      data: {
        statusAssinatura: "CANCELADA",
        updatedAt: agora,
      },
    });

    return NextResponse.json({
      ok: true,
      mensagem: "Assinatura cancelada com sucesso.",
      asaas: resultadoAsaas,
      assinatura: {
        id: assinaturaAtualizada.id,
        status: assinaturaAtualizada.status,
        canceladaEm: assinaturaAtualizada.canceladaEm,
        motivoCancelamento: assinaturaAtualizada.motivoCancelamento,
      },
    });
  } catch (error: any) {
    console.error("ERRO AO CANCELAR ASSINATURA PHANYX:", error);

    return NextResponse.json(
      {
        error: "Erro ao cancelar assinatura PHANYX.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}