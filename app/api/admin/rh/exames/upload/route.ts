import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const arquivo = formData.get("arquivo") as File | null;

    if (!arquivo) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    const tiposPermitidos = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    if (!tiposPermitidos.includes(arquivo.type)) {
      return NextResponse.json(
        { error: "Envie apenas PDF, PNG, JPG ou JPEG." },
        { status: 400 }
      );
    }

    const extensao = arquivo.name.split(".").pop() || "arquivo";
    const nomeArquivo = `rh/exames/aso-${Date.now()}.${extensao}`;

    const blob = await put(nomeArquivo, arquivo, {
      access: "public",
    });

    return NextResponse.json({
      url: blob.url,
    });
  } catch (error) {
    console.error("Erro ao enviar arquivo do ASO:", error);

    return NextResponse.json(
      { error: "Erro ao enviar arquivo do ASO." },
      { status: 500 }
    );
  }
}