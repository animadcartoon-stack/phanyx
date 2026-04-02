import { NextRequest, NextResponse } from "next/server";
import { uploadArquivo } from "@/lib/storage/uploadArquivo";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const TIPOS_PERMITIDOS = [
  "application/pdf",

  // Word
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  // Slides
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Vídeos
  "video/mp4",
  "video/quicktime",

  // Imagens
  "image/png",
  "image/jpeg",
  "image/webp",

  // Texto
  "text/plain",
];

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
        { error: "Arquivo excede o limite de 10MB." },
        { status: 400 }
      );
    }

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido: ${file.type}` },
        { status: 400 }
      );
    }

   if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json(
    { error: "Arquivo muito grande (máx 500MB)" },
    { status: 400 }
  )
}

    const resultado = await uploadArquivo({
      file,
      pasta: "uploads",
    });

    return NextResponse.json({
      success: true,
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