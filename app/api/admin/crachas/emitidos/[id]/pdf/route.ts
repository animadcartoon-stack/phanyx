import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { gerarCrachaVisualPdf } from "@/lib/crachas/gerarCrachaVisualPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

function limparNomeArquivo(valor: unknown) {
  return String(valor ?? "cracha")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function obterOrigin(req: NextRequest) {
  const protocolo =
    req.headers.get("x-forwarded-proto") ||
    new URL(req.url).protocol.replace(":", "") ||
    "https";

  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host");

  if (!host) {
    return new URL(req.url).origin;
  }

  return `${protocolo}://${host}`;
}

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão." },
        { status: 403 }
      );
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const crachaEmitidoId = Number(params.id);

    if (
      !crachaEmitidoId ||
      Number.isNaN(crachaEmitidoId)
    ) {
      return NextResponse.json(
        { error: "Identificador de crachá inválido." },
        { status: 400 }
      );
    }

    const crachaEmitido =
      await prisma.crachaEmitido.findFirst({
        where: {
          id: crachaEmitidoId,
          instituicaoId: user.instituicaoId,
        },
        include: {
          modelo: true,
          instituicao: {
            select: {
              nome: true,
            },
          },
        },
      });

    if (!crachaEmitido) {
      return NextResponse.json(
        { error: "Crachá emitido não encontrado." },
        { status: 404 }
      );
    }

    if (crachaEmitido.status === "CANCELADO") {
      return NextResponse.json(
        {
          error:
            "Este crachá está cancelado e não pode gerar PDF.",
        },
        { status: 400 }
      );
    }

    const modelo = crachaEmitido.modelo;

    const frenteJson = Array.isArray(modelo.frenteJson)
      ? modelo.frenteJson
      : [];

    const versoJson = Array.isArray(modelo.versoJson)
      ? modelo.versoJson
      : [];

    if (frenteJson.length === 0) {
      return NextResponse.json(
        {
          error:
            "O modelo selecionado não possui conteúdo na frente.",
        },
        { status: 400 }
      );
    }

    const possuiVerso = versoJson.length > 0;

    const larguraMm =
      Number(modelo.larguraMm) > 0
        ? Number(modelo.larguraMm)
        : 54;

    const alturaMm =
      Number(modelo.alturaMm) > 0
        ? Number(modelo.alturaMm)
        : 86;

    const origin = obterOrigin(req);

    const pdfBuffer = await gerarCrachaVisualPdf({
      crachaEmitidoId,
      origin,
      larguraMm,
      alturaMm,
      possuiVerso,
    });

    const codigoCracha =
      crachaEmitido.codigoCracha ||
      `cracha-${crachaEmitido.id}`;

    const nomeArquivoBase = limparNomeArquivo(
      `${crachaEmitido.tipoPessoa}-${codigoCracha}`
    );

    const nomeArquivo = `${nomeArquivoBase || "cracha"}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${nomeArquivo}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("ERRO AO GERAR PDF DO CRACHÁ:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Não foi possível gerar o PDF do crachá.",
      },
      { status: 500 }
    );
  }
}