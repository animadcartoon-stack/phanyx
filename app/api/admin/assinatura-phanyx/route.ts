import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, temPermissao } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
  return NextResponse.json(
    { error: "Não autorizado." },
    { status: 401 }
  );
}

const roleUsuario = String(user.role || "").toUpperCase();

const podeVerAssinatura =
  user.isMasterAdmin === true ||
  roleUsuario === "SUPER_ADMIN" ||
  temPermissao(user, "assinatura.ver") ||
  temPermissao(user, "*");

if (!podeVerAssinatura) {
  return NextResponse.json(
    { error: "Você não tem permissão para ver a assinatura PHANYX." },
    { status: 403 }
  );
}

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: {
        id: user.instituicaoId,
      },
      select: {
        id: true,
        nome: true,
        plano: true,
        statusAssinatura: true,
        isentaPagamento: true,
      },
    });

    const assinatura = await prisma.assinaturaPhanyx.findUnique({
      where: {
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        plano: true,
        status: true,
        testeGratisInicioEm: true,
        testeGratisFimEm: true,
        primeiraCobrancaEm: true,
        proximaCobrancaEm: true,
        asaasBillingType: true,
        asaasCycle: true,
        valorBase: true,
        valorPorAluno: true,
        valorPorPoloExtra: true,
        valorMensalAtual: true,
        alunosAtivosReferencia: true,
        polosReferencia: true,
        canceladaEm: true,
        motivoCancelamento: true,
        asaasSubscriptionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      instituicao,
      assinatura: assinatura
        ? {
            ...assinatura,
            valorBase: Number(assinatura.valorBase),
            valorPorAluno: Number(assinatura.valorPorAluno),
            valorPorPoloExtra: Number(assinatura.valorPorPoloExtra),
            valorMensalAtual: Number(assinatura.valorMensalAtual),
          }
        : null,
    });
  } catch (error: any) {
    console.error("ERRO AO BUSCAR ASSINATURA PHANYX:", error);

    return NextResponse.json(
      {
        error: "Erro ao buscar assinatura PHANYX.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}