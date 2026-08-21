import { NextResponse } from "next/server";

import {
  COOKIE_LOCALE_PHANYX,
  localeEhSuportado,
} from "@/i18n/config";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const locale =
    body && typeof body.locale === "string"
      ? body.locale
      : null;

  if (!localeEhSuportado(locale)) {
    return NextResponse.json(
      {
        ok: false,
        codigo: "IDIOMA_NAO_SUPORTADO",
        error:
          "O idioma informado não é suportado pelo PHANYX.",
      },
      { status: 400 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    locale,
  });

  response.cookies.set({
    name: COOKIE_LOCALE_PHANYX,
    value: locale,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return response;
}