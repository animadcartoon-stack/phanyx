import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getUserFromToken } from "@/lib/server-auth";
import { identificarSessaoAdmin, perfilPodeManterEditorCertificado } from "@/lib/sessao-inatividade-admin";
import { COOKIE_SESSAO_EDITOR_CERTIFICADO } from "@/lib/sessao-editor-certificado";

export const dynamic = "force-dynamic";

/** Mantem somente a credencial do editor; nunca renova o cookie geral do Admin. */
export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" ||
      (origin && origin !== new URL(request.url).origin)) {
    return NextResponse.json({ ativa: false }, { status: 403, headers });
  }
  const token = request.cookies.get("token")?.value;
  const sessao = identificarSessaoAdmin(token, process.env.JWT_SECRET);
  if (!token || !sessao || request.headers.get("x-phanyx-sessao-admin") !== sessao.referencia) {
    return NextResponse.json({ ativa: false }, { status: 409, headers });
  }
  const usuario = await getUserFromToken();
  if (!usuario || usuario.id !== sessao.id || !perfilPodeManterEditorCertificado(usuario.role)) {
    return NextResponse.json({ ativa: false }, { status: 401, headers });
  }
  // A autenticacao acima verifica assinatura, expiracao, usuario e impersonacao.
  const dados = jwt.decode(token) as { exp?: number } | null;
  const resposta = NextResponse.json({ ativa: true }, { headers });
  resposta.cookies.set(COOKIE_SESSAO_EDITOR_CERTIFICADO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(dados?.exp ? { expires: new Date(dados.exp * 1000) } : {}),
  });
  resposta.cookies.set("phanyx_certificado_ativo", "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 0,
  });
  return resposta;
}
