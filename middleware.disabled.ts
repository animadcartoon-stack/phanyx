import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const userCookie = request.cookies.get("user")?.value;

  // rotas públicas
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // não logado → login
  if (!userCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let user;
  try {
    user = JSON.parse(userCookie);
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = user.role;

  // 🔒 proteção por papel
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/professor") && role !== "professor") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/aluno") && role !== "aluno") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// 👇 MUITO IMPORTANTE
export const config = {
  matcher: ["/admin/:path*", "/professor/:path*", "/aluno/:path*"],
};
