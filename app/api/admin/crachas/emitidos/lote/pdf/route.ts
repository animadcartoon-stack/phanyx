import {
  NextRequest,
  NextResponse,
} from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import { gerarCrachaVisualPdfLote } from "@/lib/crachas/gerarCrachaVisualPdfLote";
import { obterPlanoInstituicao } from "@/lib/obter-plano-instituicao";
import { planoTemRecurso } from "@/lib/plano-acesso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LIMITE_LOTE = 1000;

function normalizarIds(valor: unknown) {
  if (!Array.isArray(valor)) {
    return [];
  }

  const ids: number[] = [];
  const encontrados = new Set<number>();

  for (const item of valor) {
    const id = Number(item);

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      encontrados.has(id)
    ) {
      continue;
    }

    encontrados.add(id);
    ids.push(id);
  }

  return ids;
}

function limparNomeArquivo(valor: unknown) {
  return String(valor ?? "lote-crachas")
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
    new URL(req.url).protocol.replace(
      ":",
      ""
    ) ||
    "https";

  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host");

  if (!host) {
    return new URL(req.url).origin;
  }

  return `${protocolo}://${host}`;
}

export async function POST(req: NextRequest) {
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
        {
          error:
            "Usuário sem instituição vinculada.",
        },
        { status: 400 }
      );
    }

    const planoInstituicao =
      await obterPlanoInstituicao(
        user.instituicaoId
      );

    if (
      !planoTemRecurso(
        planoInstituicao,
        "CRACHAS_EMISSAO"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A geração de PDF de crachás está disponível a partir do Plano Profissional.",
          codigo:
            "RECURSO_NAO_DISPONIVEL_NO_PLANO",
          plano: planoInstituicao,
          recurso: "CRACHAS_EMISSAO",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const ids = normalizarIds(
      body.crachaIds
    );

    if (ids.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhum crachá foi informado para gerar o PDF do lote.",
        },
        { status: 400 }
      );
    }

    if (ids.length > LIMITE_LOTE) {
      return NextResponse.json(
        {
          error: `O PDF pode conter no máximo ${LIMITE_LOTE} crachás.`,
        },
        { status: 400 }
      );
    }

    const encontrados =
      await prisma.crachaEmitido.findMany({
        where: {
          id: {
            in: ids,
          },
          instituicaoId:
            user.instituicaoId,
        },
        select: {
          id: true,
          modeloId: true,
          tipoPessoa: true,
          status: true,
        },
      });

    if (encontrados.length !== ids.length) {
      return NextResponse.json(
        {
          error:
            "Um ou mais crachás do lote não foram encontrados nesta instituição.",
        },
        { status: 404 }
      );
    }

    const mapaCrachas = new Map<
      number,
      any
    >(
      encontrados.map(
        (cracha) =>
          [cracha.id, cracha] as const
      )
    );

    const crachas = ids.map((id) => {
      const cracha = mapaCrachas.get(id);

      if (!cracha) {
        throw new Error(
          `O crachá ${id} não foi encontrado.`
        );
      }

      return cracha;
    });

    if (
      crachas.some(
        (cracha) =>
          cracha.status === "CANCELADO"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "O lote possui um ou mais crachás cancelados.",
        },
        { status: 400 }
      );
    }

    const primeiroCracha = crachas[0];

    const loteCompativel = crachas.every(
      (cracha) =>
        cracha.modeloId ===
          primeiroCracha.modeloId &&
        cracha.tipoPessoa ===
          primeiroCracha.tipoPessoa
    );

    if (!loteCompativel) {
      return NextResponse.json(
        {
          error:
            "Todos os crachás do PDF devem usar o mesmo modelo e tipo de pessoa.",
        },
        { status: 400 }
      );
    }

    const modelo =
      await prisma.crachaModelo.findFirst({
        where: {
          id: primeiroCracha.modeloId,
          instituicaoId:
            user.instituicaoId,
        },
      });

    if (!modelo) {
      return NextResponse.json(
        {
          error:
            "O modelo utilizado pelo lote não foi encontrado.",
        },
        { status: 404 }
      );
    }

    const frenteJson = Array.isArray(
      modelo.frenteJson
    )
      ? modelo.frenteJson
      : [];

    const versoJson = Array.isArray(
      modelo.versoJson
    )
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

    const larguraMm =
      Number(modelo.larguraMm) > 0
        ? Number(modelo.larguraMm)
        : 54;

    const alturaMm =
      Number(modelo.alturaMm) > 0
        ? Number(modelo.alturaMm)
        : 86;

    const pdfBuffer =
      await gerarCrachaVisualPdfLote({
        crachaEmitidoIds: ids,
        origin: obterOrigin(req),
        larguraMm,
        alturaMm,
        possuiVerso: versoJson.length > 0,
      });

    const nomeModelo = limparNomeArquivo(
      modelo.nome
    );

    const nomeArquivo =
      `lote-${nomeModelo || "crachas"}-${ids.length}-crachas.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `inline; filename="${nomeArquivo}"`,
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
        "X-Total-Crachas": String(
          ids.length
        ),
      },
    });
  } catch (error: any) {
    console.error(
      "ERRO AO GERAR PDF DO LOTE DE CRACHÁS:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Não foi possível gerar o PDF do lote.",
      },
      { status: 500 }
    );
  }
}