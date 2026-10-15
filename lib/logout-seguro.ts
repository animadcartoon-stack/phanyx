import {
  NextRequest,
  NextResponse,
} from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { identificarSessaoAdmin } from "@/lib/sessao-inatividade-admin";
import { COOKIE_SESSAO_EDITOR_CERTIFICADO } from "@/lib/sessao-editor-certificado";

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
    request.cookies.get("token")?.value ||
    request.cookies.get(COOKIE_SESSAO_EDITOR_CERTIFICADO)?.value;

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
  response: NextResponse,
  preservarEditor = false,
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
  response.cookies.set("phanyx_certificado_ativo", "", opcoes);
  if (!preservarEditor) response.cookies.set(COOKIE_SESSAO_EDITOR_CERTIFICADO, "", opcoes);

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
  const inatividade = request.headers.get("x-phanyx-logout-motivo") === "inatividade";
  const token = request.cookies.get("token")?.value ||
    (!inatividade ? request.cookies.get(COOKIE_SESSAO_EDITOR_CERTIFICADO)?.value : undefined);
  const sessao = identificarSessaoAdmin(token, process.env.JWT_SECRET);
  const referencia = request.headers.get("x-phanyx-sessao-admin");
  const origin = request.headers.get("origin");
  const headers = { "Cache-Control": "private, no-store" };
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) {
    return NextResponse.json({ encerrada: false }, { status: 403, headers });
  }
  // Outra aba ja encerrou o Admin: ela pode redirecionar sem apagar o editor.
  if (inatividade && !token) return NextResponse.json({ encerrada: true }, { headers });
  if ((token && !sessao) || (referencia && referencia !== sessao?.referencia) ||
      (inatividade && (!sessao || !referencia || referencia !== sessao.referencia))) {
    return NextResponse.json({ encerrada: false }, { status: 409, headers });
  }
  if (!inatividade) return criarLogoutSeguro(request, "/login?portal=admin");
  let editorSegueAtivo = false;
  if (token && request.cookies.get(COOKIE_SESSAO_EDITOR_CERTIFICADO)?.value === token && process.env.JWT_SECRET) {
    try { jwt.verify(token, process.env.JWT_SECRET); editorSegueAtivo = true; } catch {}
  }
  if (!editorSegueAtivo) await finalizarImpersonacaoAtiva(request);
  const resposta = NextResponse.json({ encerrada: true }, { headers });
  apagarCookiesDeSessao(resposta, true);
  return resposta;
}
