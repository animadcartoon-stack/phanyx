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

    /**
     * Primeira versão:
     * Ainda NÃO busca marcações reais do fornecedor.
     * Apenas valida a estrutura e atualiza o último sync.
     *
     * Depois vamos adaptar por provedor:
     * CONTROL_ID, HENRY, TOPDATA, AHGORA ou API_GENERICA.
     */
    await prisma.integracaoPontoRH.update({
      where: { id: integracao.id },
      data: {
        ultimoSyncEm: new Date(),
        status: "SINCRONIZADA",
      },
    });

    return NextResponse.json({
      ok: true,
      message:
        "Sincronização registrada. Próxima etapa: mapear o endpoint real do provedor.",
      registrosImportados: 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao sincronizar marcações." },
      { status: 500 }
    );
  }
}