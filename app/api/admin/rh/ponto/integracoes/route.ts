import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const user = await getUserFromToken();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const integracoes = await prisma.integracaoPontoRH.findMany({
    where: {
      instituicaoId: user.instituicaoId,
    },
    orderBy: {
      criadoEm: "desc",
    },
  });

  return NextResponse.json(integracoes);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const integracao = await prisma.integracaoPontoRH.create({
      data: {
        instituicaoId: user.instituicaoId,
        nome: body.nome,
        provedor: body.provedor,
        baseUrl: body.baseUrl || null,
        apiKey: body.apiKey || null,
        usuario: body.usuario || null,
        senha: body.senha || null,
        token: body.token || null,
        observacoes: body.observacoes || null,
        status: "CONFIGURADA",
        ativo: true,
      },
    });

    return NextResponse.json(integracao);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao salvar integração." },
      { status: 500 }
    );
  }
}