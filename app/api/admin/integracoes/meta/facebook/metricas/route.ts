import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      !["ADMIN", "SUPER_ADMIN", "SECRETARIA", "COORDENADOR"].includes(user.role)
    ) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: {
        metaPageId: true,
        metaPageName: true,
        metaPageAccessToken: true,
      } as any,
    });

    if (!instituicao?.metaPageId || !instituicao?.metaPageAccessToken) {
      return NextResponse.json({
        conectado: false,
        mensagem: "Facebook ainda não conectado.",
      });
    }

    const pageUrl = new URL(
      `https://graph.facebook.com/v20.0/${instituicao.metaPageId}`
    );

    pageUrl.searchParams.set(
      "fields",
      "id,name,fan_count,followers_count,talking_about_count,category"
    );
    pageUrl.searchParams.set("access_token", instituicao.metaPageAccessToken);

    const pageRes = await fetch(pageUrl.toString());
    const pageData = await pageRes.json();

    if (!pageRes.ok) {
  return NextResponse.json({
    conectado: true,
    metricasDisponiveis: false,
    aguardandoPermissao: true,
    pagina: {
      id: instituicao.metaPageId,
      nome: instituicao.metaPageName,
    },
    metricas: {
      curtidas: 0,
      seguidores: 0,
      falandoSobre: 0,
    },
  });
}

    return NextResponse.json({
      conectado: true,
      pagina: {
        id: pageData.id,
        nome: pageData.name,
        categoria: pageData.category,
      },
      metricas: {
        curtidas: pageData.fan_count || 0,
        seguidores: pageData.followers_count || 0,
        falandoSobre: pageData.talking_about_count || 0,
      },
    });
  } catch (error) {
    console.error("Erro métricas Facebook:", error);

    return NextResponse.json(
      {
        conectado: false,
        erro: true,
        mensagem: "Erro ao buscar métricas do Facebook.",
        detalhe: String(error),
      },
      { status: 500 }
    );
  }
}