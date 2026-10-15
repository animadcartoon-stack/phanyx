import {
  NextRequest,
  NextResponse,
} from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { COOKIE_EDITOR_CERTIFICADO, editorCertificadoProtegido, identificarSessaoAdmin } from "@/lib/sessao-inatividade-admin";

type TokenLogoutPayload = {
  id?: number | string;
  impersonacao?: boolean;
  impersonacaoId?: number | string;
  masterOriginalId?: number | string;
};

async function finalizarImpersonacaoAtiva(
  request: NextRequest
) {
  const tokenAtual =
    request.cookies.get("token")?.value;

  if (!tokenAtual || !process.env.JWT_SECRET) {
    return;
  }

  try {
    const payload = jwt.verify(
      tokenAtual,
      process.env.JWT_SECRET,
      {
        ignoreExpiration: true,
      }
    ) as TokenLogoutPayload;

    if (payload.impersonacao !== true) {
      return;
    }

    const impersonacaoId = Number(
      payload.impersonacaoId
    );

    const masterOriginalId = Number(
      payload.masterOriginalId
    );

    if (
      !Number.isFinite(impersonacaoId) ||
      impersonacaoId <= 0 ||
      !Number.isFinite(masterOriginalId) ||
      masterOriginalId <= 0
    ) {
      return;
    }

    await prisma.impersonacaoSuporte.updateMany({
      where: {
        id: impersonacaoId,
        masterUserId: masterOriginalId,
        ativa: true,
      },
      data: {
        ativa: false,
        encerradoEm: new Date(),
      },
    });
  } catch (error) {
    console.error(
      "Não foi possível finalizar a auditoria da impersonação durante o logout:",
      error
    );
  }
}

function apagarCookiesDeSessao(
  response: NextResponse
) {
  const opcoes = {
    httpOnly: true,
    expires: new Date(0),
    maxAge: 0,
    path: "/",
    sameSite: "lax" as const,
    secure:
      process.env.NODE_ENV === "production",
  };

  response.cookies.set("token", "", opcoes);
  response.cookies.set(COOKIE_EDITOR_CERTIFICADO, "", opcoes);

  response.cookies.set(
    "phanyx_master_token",
    "",
    opcoes
  );
}

export async function criarLogoutSeguro(
  request: NextRequest,
  destino: string
) {
  await finalizarImpersonacaoAtiva(request);

  const response = NextResponse.redirect(
    new URL(destino, request.url),
    303
  );

  apagarCookiesDeSessao(response);

  return response;
}

/** Uma aba antiga do Admin não pode apagar a sessão aberta depois em outro portal. */
export async function criarLogoutAdmin(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const sessao = identificarSessaoAdmin(token, process.env.JWT_SECRET);
  const inatividade = request.headers.get("x-phanyx-logout-motivo") === "inatividade";
  const referencia = request.headers.get("x-phanyx-sessao-admin");
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) {
    return NextResponse.json({ encerrada: false }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }
  if ((token && !sessao) || (referencia && referencia !== sessao?.referencia) ||
      (inatividade && (!sessao || !referencia || referencia !== sessao.referencia))) {
    // Sem Set-Cookie e sem encerrar a auditoria da sessão de outro usuário/portal.
    return NextResponse.json({ encerrada: false }, { status: 409, headers: { "Cache-Control": "private, no-store" } });
  }
  if (!inatividade) return criarLogoutSeguro(request, "/login?portal=admin");
  if (sessao && editorCertificadoProtegido(
    request.cookies.get(COOKIE_EDITOR_CERTIFICADO)?.value,
    sessao.referencia, process.env.JWT_SECRET,
  )) {
    return NextResponse.json({ encerrada: false }, { status: 409, headers: { "Cache-Control": "private, no-store" } });
  }
  await finalizarImpersonacaoAtiva(request);
  const resposta = NextResponse.json({ encerrada: true }, { headers: { "Cache-Control": "private, no-store" } });
  apagarCookiesDeSessao(resposta);
  return resposta;
}
