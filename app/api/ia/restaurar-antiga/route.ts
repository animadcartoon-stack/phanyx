import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json(
        { mensagem: "Imagem não enviada." },
        { status: 400 }
      );
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json(
        { mensagem: "FAL_KEY não configurada." },
        { status: 500 }
      );
    }

    const result: any = await fal.subscribe(
      "fal-ai/image-apps-v2/photo-restoration",
      {
        input: {
          image_url: imageUrl,
        } as any,
      }
    );

    const imagemUrl =
      result?.data?.image?.url ||
      result?.data?.images?.[0]?.url ||
      result?.image?.url ||
      result?.images?.[0]?.url;

    if (!imagemUrl) {
      console.log("RETORNO FAL RESTAURAR ANTIGA:", result);

      return NextResponse.json(
        { mensagem: "A IA não retornou a imagem restaurada." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imagemUrl,
      saldo: "OK",
    });
  } catch (error) {
    console.error("Erro restaurar foto antiga:", error);

    return NextResponse.json(
      { mensagem: "Erro interno ao restaurar foto antiga." },
      { status: 500 }
    );
  }
}