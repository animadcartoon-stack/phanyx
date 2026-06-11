import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function texto(v: any) {
  return String(v || "").trim();
}

function numeroOuNull(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const integracoes = await prisma.integracaoPontoRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: [{ ativo: "desc" }, { atualizadoEm: "desc" }],
    });

    return NextResponse.json({ integracoes });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar configurações de ponto." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const modo = texto(body.modo || "MANUAL").toUpperCase();
    const nome = texto(body.nome || "Integração de ponto");
    const provedor = texto(body.provedor || "OUTRO").toUpperCase();

    const integracao = await prisma.integracaoPontoRH.create({
      data: {
        instituicaoId: user.instituicaoId,
        nome,
        modo,
        provedor,
        ativo: body.ativo === undefined ? true : Boolean(body.ativo),

        baseUrl: texto(body.baseUrl) || null,
        ipEquipamento: texto(body.ipEquipamento) || null,
        porta: numeroOuNull(body.porta),

        apiKey: texto(body.apiKey) || null,
        usuario: texto(body.usuario) || null,
        senha: texto(body.senha) || null,
        token: texto(body.token) || null,

        coletorIdentificador: texto(body.coletorIdentificador) || null,

        status: "NAO_CONFIGURADA",
        observacoes: texto(body.observacoes) || null,
      },
    });

    return NextResponse.json({ integracao });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao salvar configuração de ponto." },
      { status: 500 }
    );
  }
}