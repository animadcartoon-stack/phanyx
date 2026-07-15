import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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
  try {
    const slug = decodeURIComponent(
      String(params.slug || "")
    )
      .trim()
      .toLowerCase();

    if (!slug) {
      return NextResponse.json(
        { error: "Instituição não informada." },
        { status: 400 }
      );
    }

    const instituicao =
      await prisma.instituicao.findUnique({
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
              logoUrl: true,
              logoPath: true,
              cidade: true,
              estado: true,
            },
          },

          configuracaoPontoMobile: {
            select: {
              ativo: true,
            },
          },
        },
      });

    if (!instituicao || !instituicao.ativo) {
      return NextResponse.json(
        { error: "Instituição não encontrada." },
        { status: 404 }
      );
    }

    const configuracao =
      instituicao.configuracaoInstituicao;

    return NextResponse.json({
      slug: instituicao.slug,

      nome:
        configuracao?.nomeFantasia?.trim() ||
        instituicao.nome,

      nomeCadastro: instituicao.nome,

      logoUrl:
        configuracao?.logoUrl ||
        configuracao?.logoPath ||
        null,

      cidade: configuracao?.cidade || null,
      estado: configuracao?.estado || null,

      pontoMobileAtivo:
        instituicao.configuracaoPontoMobile?.ativo ===
        true,
    });
  } catch (error) {
    console.error(
      "Erro ao carregar instituição do PHANYX RH:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar o PHANYX RH desta instituição.",
      },
      { status: 500 }
    );
  }
}