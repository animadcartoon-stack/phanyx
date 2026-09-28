import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_LOCALE_PHANYX, localeEhSuportado } from "@/i18n/config";

export function middleware(request: NextRequest) {
  const market = request.nextUrl.pathname === "/login"
    ? request.nextUrl.searchParams.get("lang")
    : request.nextUrl.pathname.split("/")[1];
  if (!localeEhSuportado(market)) return NextResponse.next();
  const headers = new Headers(request.headers);
  headers.set("x-phanyx-public-locale", market);
  const response = NextResponse.next({ request: { headers } });
  if (request.nextUrl.pathname === "/login") {
    response.cookies.set(COOKIE_LOCALE_PHANYX, market, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return response;
}

export const config = { matcher: ["/(pt-PT|en-US|es-ES|fr-FR)/:path*", "/login"] };
