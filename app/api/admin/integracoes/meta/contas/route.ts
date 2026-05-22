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

let instagramData = null;

if (primeiraPagina) {
  const instaUrl = new URL(
    `https://graph.facebook.com/v20.0/${primeiraPagina.id}`
  );

  instaUrl.searchParams.set(
    "fields",
    "connected_instagram_account{name,username,id}"
  );

  instaUrl.searchParams.set(
    "access_token",
    primeiraPagina.access_token
  );

  const instaRes = await fetch(instaUrl.toString());
const instaJson = await instaRes.json();

instagramData = {
  disponivel: instaRes.ok && !!instaJson?.connected_instagram_account,
  conta: instaJson?.connected_instagram_account || null,
  aguardandoPermissao:
    !instaRes.ok &&
    String(instaJson?.error?.message || "").includes("pages_read_engagement"),
  erro: instaRes.ok ? null : instaJson?.error?.message || null,
};

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
  facebook: {
    conectado: !!primeiraPagina,
    paginaId: primeiraPagina?.id || null,
    paginaNome: primeiraPagina?.name || null,
    categoria: primeiraPagina?.category || null,
    permissoes: primeiraPagina?.tasks || [],
  },
  instagram: instagramData || {
    disponivel: false,
    conta: null,
    aguardandoPermissao: true,
    erro: "Instagram Business ainda não verificado.",
  },
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