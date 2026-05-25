import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json(
        { error: "FAL_KEY não configurada" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const cobrarCreditos = process.env.NODE_ENV === "production";

    const imageUrl = String(body.imageUrl || "");
    const maskUrl = String(body.maskUrl || "");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Imagem inválida" },
        { status: 400 }
      );
    }

    if (!maskUrl) {
      return NextResponse.json(
        { error: "Máscara obrigatória" },
        { status: 400 }
      );
    }

    const creditos = await prisma.creditoIA.findUnique({
      where: { userId: user.id },
    });

    if (cobrarCreditos && (!creditos || creditos.saldo <= 0)) {
      return NextResponse.json(
        {
          error: "SEM_CREDITOS",
          mensagem: "Você não possui créditos IA.",
        },
        { status: 400 }
      );
    }

    if (cobrarCreditos) {
  await prisma.creditoIA.update({
    where: { userId: user.id },
    data: {
      saldo: {
        decrement: 1,
      },
    },
  });
}

    try {
        console.log("IMAGE URL:", imageUrl.substring(0, 120));
        console.log("MASK URL:", maskUrl.substring(0, 120));
        console.log("REMOVER OBJETO - imageUrl:", imageUrl.substring(0, 80));
        console.log("REMOVER OBJETO - maskUrl:", maskUrl.substring(0, 80));
     const result: any = await fal.subscribe(
  "fal-ai/object-removal/mask",
  {
    input: {
      image_url: imageUrl,
      mask_url: maskUrl,
    } as any,
  }
);

      const imagemFinal =
        result?.image?.url ||
        result?.data?.image?.url ||
        result?.images?.[0]?.url ||
        result?.data?.images?.[0]?.url;

      if (!imagemFinal) {
        throw new Error("Sem imagem retornada");
      }

      const saldoAtual = await prisma.creditoIA.findUnique({
        where: { userId: user.id },
        select: { saldo: true },
      });

      return NextResponse.json({
        imagemUrl: imagemFinal,
        saldo: saldoAtual?.saldo ?? 0,
      });
    } catch (falError) {
      if (cobrarCreditos) {
  await prisma.creditoIA.update({
    where: { userId: user.id },
    data: {
      saldo: {
        increment: 1,
      },
    },
  });
}

      console.error("Erro remover objeto:", falError);

      return NextResponse.json(
        {
          error: "ERRO_IA",
          mensagem: "A IA não conseguiu remover o objeto. Crédito devolvido.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}