import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Instituição do usuário não encontrada." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não enviado." },
        { status: 400 }
      );
    }

    const tipoArquivo = String(file.type || "").toLowerCase();
    const nomeArquivo = String(file.name || "");

    if (tipoArquivo !== "application/pdf" && !nomeArquivo.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Envie um arquivo PDF." },
        { status: 400 }
      );
    }

    const nomeSeguro = nomeArquivo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w.\-]/g, "_");

    const caminhoArquivo = `certificados/modelos/instituicao-${user.instituicaoId}-${Date.now()}-${nomeSeguro}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const blob = await put(caminhoArquivo, buffer, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
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
    console.error("ERRO UPLOAD MODELO CERTIFICADO:", error);

    return NextResponse.json(
      {
        error: "Erro ao fazer upload do modelo.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}