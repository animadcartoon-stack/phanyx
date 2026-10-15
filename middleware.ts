import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO_EDITOR_CERTIFICADO, requisicaoPermitidaAoEditorCertificado } from "@/lib/sessao-editor-certificado";
import { COOKIE_LOCALE_PHANYX, localeEhSuportado } from "@/i18n/config";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // O cookie dedicado so e entregue internamente as rotas do editor.
  const headers = new Headers(request.headers);
  const tokenAdmin = request.cookies.get("token")?.value;
  const tokenEditor = request.cookies.get(COOKIE_SESSAO_EDITOR_CERTIFICADO)?.value;
  const rotaEditor = requisicaoPermitidaAoEditorCertificado(path, request.method);
  const leituraEditor = request.method === "GET" || request.method === "HEAD";
  const origin = request.headers.get("origin");
  const origemPermitida = request.headers.get("sec-fetch-site") !== "cross-site" && (!origin || origin === request.nextUrl.origin);
  if (!tokenAdmin && tokenEditor && rotaEditor && (leituraEditor || origemPermitida)) {
    const cookies = request.cookies.getAll().filter((cookie) => cookie.name !== "token")
      .map((cookie) => `${cookie.name}=${encodeURIComponent(cookie.value)}`);
    cookies.push(`token=${encodeURIComponent(tokenEditor)}`);
    headers.set("cookie", cookies.join("; "));
  }
  if (/^\/admin(?:\/|$)/.test(path) && !tokenAdmin && !(tokenEditor && rotaEditor)) {
    return NextResponse.redirect(new URL("/login?portal=admin", request.url));
  }
  const market = path === "/login"
    ? request.nextUrl.searchParams.get("lang")
    : path.split("/")[1];
  const portal = path === "/login" || /^\/(admin|professor|aluno)(\/|$)/.test(path);
  const removedorPtBr = path === "/removedor-de-fundo";
  if (!portal && !removedorPtBr && !localeEhSuportado(market)) return NextResponse.next({ request: { headers } });
  if (removedorPtBr) headers.set("x-phanyx-public-locale", "pt-BR");
  else if (localeEhSuportado(market)) headers.set("x-phanyx-public-locale", market);
  if (portal) headers.set("x-phanyx-portal-default-en", "1");
  const response = NextResponse.next({ request: { headers } });
  if (path === "/login" && localeEhSuportado(market)) {
    response.cookies.set(COOKIE_LOCALE_PHANYX, market, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return response;
}

export const config = { matcher: ["/removedor-de-fundo", "/(pt-PT|en-US|es-ES|fr-FR)/:path*", "/login", "/admin/:path*", "/professor/:path*", "/aluno/:path*", "/api/admin/:path*", "/api/upload"] };
