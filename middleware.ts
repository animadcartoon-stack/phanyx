import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_LOCALE_PHANYX, localeEhSuportado } from "@/i18n/config";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const market = path === "/login"
    ? request.nextUrl.searchParams.get("lang")
    : path.split("/")[1];
  const portal = path === "/login" || /^\/(admin|professor|aluno)(\/|$)/.test(path);
  if (!portal && !localeEhSuportado(market)) return NextResponse.next();
  const headers = new Headers(request.headers);
  if (localeEhSuportado(market)) headers.set("x-phanyx-public-locale", market);
  if (portal) headers.set("x-phanyx-portal-default-en", "1");
  const response = NextResponse.next({ request: { headers } });
  if (path === "/login" && localeEhSuportado(market)) {
    response.cookies.set(COOKIE_LOCALE_PHANYX, market, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return response;
}

export const config = { matcher: ["/(pt-PT|en-US|es-ES|fr-FR)/:path*", "/login", "/admin/:path*", "/professor/:path*", "/aluno/:path*"] };
