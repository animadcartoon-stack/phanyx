import { NextRequest, NextResponse } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function criarNomeCurto(nome: string, fallback: string) {
  const nomeLimpo = String(nome || fallback).trim();

  const primeiraParte = nomeLimpo
    .split(/\s*[–—-]\s*/)
    .map((parte) => parte.trim())
    .find(Boolean);

  const nomeBase = primeiraParte || nomeLimpo;

  if (nomeBase.length <= 18) {
    return nomeBase;
  }

  const palavras = nomeBase.split(/\s+/).filter(Boolean);

  if (palavras.length > 1) {
    const sigla = palavras
      .map((palavra) => palavra.charAt(0))
      .join("")
      .toUpperCase();

    if (sigla.length >= 2 && sigla.length <= 10) {
      return sigla;
    }
  }

  return nomeBase.slice(0, 18).trim();
}

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      slug: string;
    };
  }
) {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("RhAppAccess"),
  ]);

  try {
    const slug = decodeURIComponent(
      String(params.slug || "")
    )
      .trim()
      .toLowerCase();

    if (!slug) {
      return NextResponse.json(
        { error: t("errors.institutionMissing") },
        { status: 400 }
      );
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: {
        slug,
      },

      select: {
        nome: true,
        slug: true,
        ativo: true,

        configuracaoInstituicao: {
          select: {
            nomeFantasia: true,
          },
        },
      },
    });

    if (!instituicao || !instituicao.ativo) {
      return NextResponse.json(
        { error: t("errors.institutionNotFound") },
        { status: 404 }
      );
    }

    const nomeInstituicao =
      instituicao.configuracaoInstituicao?.nomeFantasia?.trim() ||
      instituicao.nome;

    const nomeCurto = criarNomeCurto(
      nomeInstituicao,
      t("institutionFallback")
    );

    const caminhoApp = `/rh-app/${encodeURIComponent(
      instituicao.slug
    )}`;

    const manifesto = {
      id: `${caminhoApp}/`,
      name: t("manifest.name", { name: nomeInstituicao }),
      short_name: t("manifest.shortName", { name: nomeCurto }),
      description: t("manifest.description", { name: nomeInstituicao }),
      start_url: caminhoApp,
      scope: `${caminhoApp}/`,
      display: "standalone",
      orientation: "any",
      background_color: "#020617",
      theme_color: "#0f172a",
      categories: ["business", "productivity"],
      lang: locale,
      dir: "ltr",
      prefer_related_applications: false,
      icons: [
        {
          src: "/app-rh-icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/app-rh-icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
      ],
    };

    return new NextResponse(
      JSON.stringify(manifesto, null, 2),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/manifest+json; charset=utf-8",
          "Cache-Control":
            "private, no-store, max-age=0",
          "Content-Language": locale,
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao gerar manifesto do PHANYX RH:",
      error
    );

    return NextResponse.json(
      {
        error: t("errors.institutionLoad"),
      },
      { status: 500 }
    );
  }
}
