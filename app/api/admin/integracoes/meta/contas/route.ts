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
        metaAccessToken: true,
      },
    });

    if (!instituicao?.metaAccessToken) {
      return NextResponse.json(
        { error: "Meta ainda não conectado" },
        { status: 400 }
      );
    }

    const url = new URL("https://graph.facebook.com/v20.0/me/accounts");
    url.searchParams.set("access_token", instituicao.metaAccessToken);
    url.searchParams.set(
      "fields",
      "id,name,access_token,category,tasks,connected_instagram_account"
    );

    const res = await fetch(url.toString());
    const data = await res.json();

const primeiraPagina = data?.data?.[0];

if (primeiraPagina) {
  await prisma.instituicao.update({
    where: { id: user.instituicaoId },
    data: {
      metaPageId: primeiraPagina.id,
      metaPageName: primeiraPagina.name,
      metaPageAccessToken: primeiraPagina.access_token,
    } as any,
  });
}


return NextResponse.json({
  ok: res.ok,
  paginaSalva: !!primeiraPagina,
  data,
});
  } catch (error) {
    console.error("Erro ao buscar contas Meta:", error);

    return NextResponse.json(
      {
        error: "Erro ao buscar contas Meta",
        detalhe: String(error),
      },
      { status: 500 }
    );
  }
}