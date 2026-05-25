import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json(
        { error: "FAL_KEY não configurada" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const imageUrl = String(body.imageUrl || "");
    const maskUrl = String(body.maskUrl || "");

    if (!imageUrl || !maskUrl) {
      return NextResponse.json(
        { error: "Imagem ou máscara inválida" },
        { status: 400 }
      );
    }

    const result: any = await fal.subscribe("fal-ai/flux-pro/v1/erase", {
      input: {
        image_url: imageUrl,
        mask_url: maskUrl,
        dilate_pixels: 12,
        output_format: "png",
      } as any,
    });

    const imagemFinal =
      result?.images?.[0]?.url ||
      result?.data?.images?.[0]?.url ||
      result?.image?.url ||
      result?.data?.image?.url;

    if (!imagemFinal) {
      return NextResponse.json(
        { error: "A IA não retornou imagem." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imagemUrl: imagemFinal,
      preview: true,
      saldo: "teste-local",
    });
  } catch (error) {
    console.error("Erro FLUX Erase Pro:", error);

    return NextResponse.json(
      {
        error: "ERRO_IA",
        mensagem:
          "O apagador profissional não conseguiu remover essa área.",
      },
      { status: 500 }
    );
  }
}