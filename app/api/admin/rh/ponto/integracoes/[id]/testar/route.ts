import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const id = Number(params.id);

    const integracao = await prisma.integracaoPontoRH.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!integracao) {
      return NextResponse.json(
        { error: "Integração não encontrada." },
        { status: 404 }
      );
    }

    if (!integracao.baseUrl) {
      return NextResponse.json(
        { error: "Informe a Base URL antes de testar." },
        { status: 400 }
      );
    }

    /**
     * Teste genérico.
     * Para provedores específicos, depois vamos trocar por endpoints reais:
     * Control iD, Henry, TopData, Ahgora etc.
     */
    const res = await fetch(integracao.baseUrl, {
      method: "GET",
      headers: {
        ...(integracao.apiKey
          ? { Authorization: `Bearer ${integracao.apiKey}` }
          : {}),
        ...(integracao.token
          ? { "X-Api-Token": integracao.token }
          : {}),
      },
    });

    await prisma.integracaoPontoRH.update({
      where: { id: integracao.id },
      data: {
        status: res.ok ? "CONECTADA" : "FALHA_CONEXAO",
        ultimoSyncEm: new Date(),
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Falha ao conectar. Status: ${res.status}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Conexão testada com sucesso.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao testar conexão." },
      { status: 500 }
    );
  }
}