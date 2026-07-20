import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { uploadArquivo } from "@/lib/storage/uploadArquivo";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const TIPOS_PERMITIDOS = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const LIMITE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário ou instituição não identificados." },
        { status: 401 }
      );
    }

    if (String(user.role).toUpperCase() !== "ADMIN") {
      return NextResponse.json(
        { error: "Somente o administrador pode alterar a logo da instituição." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Nenhuma imagem foi selecionada." },
        { status: 400 }
      );
    }

    if (!file.size) {
      return NextResponse.json(
        { error: "O arquivo selecionado está vazio." },
        { status: 400 }
      );
    }

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Envie uma imagem PNG, JPG, JPEG ou WEBP." },
        { status: 400 }
      );
    }

    if (file.size > LIMITE_BYTES) {
      return NextResponse.json(
        { error: "A imagem excede o limite de 5 MB." },
        { status: 400 }
      );
    }

    const instituicaoId = Number(user.instituicaoId);

    const resultado = await uploadArquivo({
      file,
      pasta: `instituicoes/${instituicaoId}/logos`,
    });

    if (!resultado?.url) {
      throw new Error("O armazenamento não retornou a URL da logo.");
    }

    await prisma.configuracaoInstituicao.upsert({
      where: {
        instituicaoId,
      },
      update: {
        logoUrl: resultado.url,
      },
      create: {
        instituicaoId,
        logoUrl: resultado.url,
      },
    });

    return NextResponse.json({
      ok: true,
      url: resultado.url,
      arquivo: resultado,
    });
  } catch (error) {
    console.error("ERRO AO ENVIAR LOGO DA INSTITUIÇÃO:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao enviar a logo.",
      },
      { status: 500 }
    );
  }
}