import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não enviado." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Envie um arquivo PDF." },
        { status: 400 }
      );
    }

    const nomeSeguro = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w.\-]/g, "_");

    const caminhoArquivo = `certificados/modelos/instituicao-${user.instituicaoId}-${Date.now()}-${nomeSeguro}`;

    const blob = await put(caminhoArquivo, file, {
      access: "public",
    });

    await prisma.instituicao.update({
      where: { id: user.instituicaoId },
      data: {
        certificadoTemplateUrl: blob.url,
      },
    });

    return NextResponse.json({
      ok: true,
      url: blob.url,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao fazer upload do modelo.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}