import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { LIMITE_LOGO_ENVIO } from "@/lib/imagens/preparar-logo-upload";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { gerarCrachaVisualPdf } from "@/lib/crachas/gerarCrachaVisualPdf";
import { obterPlanoInstituicao } from "@/lib/obter-plano-instituicao";
import { planoTemRecurso } from "@/lib/plano-acesso";

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

async function gerarPdfCracha(
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

    const planoInstituicao =
  await obterPlanoInstituicao(
    user.instituicaoId
  );

const podeEmitirCrachas = planoTemRecurso(
  planoInstituicao,
  "CRACHAS_EMISSAO"
);

if (!podeEmitirCrachas) {
  return NextResponse.json(
    {
      error:
        "A geração de PDF de crachás está disponível a partir do Plano Profissional.",
      codigo: "RECURSO_NAO_DISPONIVEL_NO_PLANO",
      plano: planoInstituicao,
      recurso: "CRACHAS_EMISSAO",
    },
    { status: 403 }
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

    let fotoAvulsaDataUrl: string | undefined;
    if (req.method === "POST") {
      const foto = (await req.formData().catch(() => null))?.get("foto");
      if (!(foto instanceof File) || !foto.size || foto.size > LIMITE_LOGO_ENVIO) {
        return NextResponse.json({ error: "Foto avulsa inválida." }, { status: 400 });
      }

      const imagem = sharp(Buffer.from(await foto.arrayBuffer()), { limitInputPixels: 24_000_000 });
      const formato = (await imagem.metadata().catch(() => null))?.format;
      if (formato !== "png" && formato !== "jpeg" && formato !== "webp") {
        return NextResponse.json({ error: "Formato de foto avulsa inválido." }, { status: 400 });
      }

      const buffer = await imagem.rotate().resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      }).png().toBuffer().catch(() => null);
      if (!buffer) {
        return NextResponse.json({ error: "Foto avulsa inválida." }, { status: 400 });
      }

      fotoAvulsaDataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
    }

    const origin = obterOrigin(req);

    const pdfBuffer = await gerarCrachaVisualPdf({
      crachaEmitidoId,
      origin,
      larguraMm,
      alturaMm,
      possuiVerso,
      fotoAvulsaDataUrl,
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

export { gerarPdfCracha as GET, gerarPdfCracha as POST };
