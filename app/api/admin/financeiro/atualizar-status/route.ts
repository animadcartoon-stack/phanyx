import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST() {
  try {
    const user = getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // 🔹 Buscar configuração financeira
    const config = await prisma.configuracaoFinanceiraInstituicao.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
      },
    });

    const diasTolerancia = config?.diasTolerancia ?? 0;

    // 🔹 Buscar cobranças pendentes
    const cobrancas = await prisma.cobranca.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        status: "PENDENTE",
      },
    });

    const hoje = new Date();

    for (const cobranca of cobrancas) {
      const vencimento = new Date(cobranca.dataVencimento);

      // aplica tolerância
      vencimento.setDate(vencimento.getDate() + diasTolerancia);

      if (hoje > vencimento) {
        await prisma.cobranca.update({
          where: { id: cobranca.id },
          data: {
            status: "ATRASADO",
          },
        });
      }
    }

    return NextResponse.json({
      message: "Status atualizado com sucesso",
      total: cobrancas.length,
    });
  } catch (error) {
    console.error("Erro ao atualizar status financeiro:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status financeiro" },
      { status: 500 }
    );
  }
}