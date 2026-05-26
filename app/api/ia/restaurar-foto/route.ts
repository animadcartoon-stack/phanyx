import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json(
        { mensagem: "Imagem não enviada." },
        { status: 400 }
      );
    }

    const apiKey = process.env.FAL_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { mensagem: "FAL_KEY não configurada." },
        { status: 500 }
      );
    }

    const resposta = await fetch(
      "https://fal.run/fal-ai/image-editing/photo-restoration",
      {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl,
        }),
      }
    );

    const data = await resposta.json();

    if (!resposta.ok) {
      console.error(data);

      return NextResponse.json(
        {
          mensagem: "Falha ao restaurar foto.",
          erro: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imagemUrl: data.images?.[0]?.url || data.image?.url,
      saldo: "OK",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { mensagem: "Erro interno ao restaurar foto." },
      { status: 500 }
    );
  }
}