import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import {
  COOKIE_EDITOR_CERTIFICADO,
  criarProtecaoEditorCertificado,
  identificarSessaoAdmin,
  perfilPodeManterEditorCertificado,
} from "@/lib/sessao-inatividade-admin";

export const dynamic = "force-dynamic";

/** A protecao impede apenas logout automatico; nao substitui a autenticacao. */
export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" ||
      (origin && origin !== new URL(request.url).origin)) {
    return NextResponse.json({ ativa: false }, { status: 403, headers });
  }
  const token = request.cookies.get("token")?.value;
  const sessao = identificarSessaoAdmin(token, process.env.JWT_SECRET);
  if (!sessao || request.headers.get("x-phanyx-sessao-admin") !== sessao.referencia) {
    return NextResponse.json({ ativa: false }, { status: 409, headers });
  }
  const usuario = await getUserFromToken();
  if (!usuario || usuario.id !== sessao.id || !perfilPodeManterEditorCertificado(usuario.role)) {
    return NextResponse.json({ ativa: false }, { status: 401, headers });
  }
  const resposta = NextResponse.json({ ativa: true }, { headers });
  resposta.cookies.set(COOKIE_EDITOR_CERTIFICADO,
    criarProtecaoEditorCertificado(sessao.referencia, process.env.JWT_SECRET!), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 180,
    });
  return resposta;
}
