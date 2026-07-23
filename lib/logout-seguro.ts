import {
  NextRequest,
  NextResponse,
} from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

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