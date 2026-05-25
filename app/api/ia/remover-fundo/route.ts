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
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json(
        { error: "FAL_KEY não configurada" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const imageUrl = String(body.imageUrl || body.imagemUrl || "");

    if (!imageUrl.startsWith("data:image/") && !imageUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "Imagem inválida" },
        { status: 400 }
      );
    }

    const creditos = await prisma.creditoIA.findUnique({
      where: { userId: user.id },
    });

    if (!creditos || creditos.saldo <= 0) {
      return NextResponse.json(
        {
          error: "SEM_CREDITOS",
          mensagem: "Você não possui créditos IA.",
        },
        { status: 400 }
      );
    }

    await prisma.creditoIA.update({
      where: { userId: user.id },
      data: {
        saldo: {
          decrement: 1,
        },
      },
    });

    try {
      const result: any = await fal.subscribe("fal-ai/bria/background/remove", {
  input: {
    image_url: imageUrl,
  } as any,
});

      const imagemSemFundo =
        result?.image?.url ||
        result?.data?.image?.url ||
        result?.images?.[0]?.url ||
        result?.data?.images?.[0]?.url;

      if (!imagemSemFundo) {
        throw new Error("A FAL não retornou a imagem sem fundo.");
      }

      const saldoAtual = await prisma.creditoIA.findUnique({
        where: { userId: user.id },
        select: { saldo: true },
      });

      return NextResponse.json({
        imagemUrl: imagemSemFundo,
        saldo: saldoAtual?.saldo ?? 0,
      });
    } catch (falError) {
      await prisma.creditoIA.update({
        where: { userId: user.id },
        data: {
          saldo: {
            increment: 1,
          },
        },
      });

      console.error("Erro FAL remover fundo:", falError);

      return NextResponse.json(
        {
          error: "ERRO_IA",
          mensagem:
            "A IA não conseguiu remover o fundo dessa imagem. O crédito foi devolvido.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro geral remover fundo IA:", error);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}