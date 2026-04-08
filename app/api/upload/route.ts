import { NextRequest, NextResponse } from "next/server";
import { uploadArquivo } from "@/lib/storage/uploadArquivo";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Arquivo não enviado." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo excede o limite de 500 MB." },
        { status: 400 }
      );
    }

    const resultado = await uploadArquivo({
      file,
      pasta: "uploads",
    });

    const url = typeof resultado === "string" ? resultado : resultado.url;

    return NextResponse.json({
      success: true,
      url,
      arquivo: resultado,
    });
  } catch (error) {
    console.error("Erro no upload:", error);

    return NextResponse.json(
      { error: "Erro interno ao fazer upload." },
      { status: 500 }
    );
  }
}