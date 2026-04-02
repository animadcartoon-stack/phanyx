import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("WEBHOOK ASAAS:", body);

    const event = body.event;
    const payment = body.payment;

    // Só processa pagamento confirmado
    if (event !== "PAYMENT_CONFIRMED") {
      return NextResponse.json({ received: true });
    }

    const asaasId = payment?.id;

    if (!asaasId) {
      return NextResponse.json(
        { error: "Pagamento sem ID" },
        { status: 400 }
      );
    }

    // 🔎 Busca adesão pelo ID do Asaas
    const adesao = await prisma.adesaoInstituicao.findFirst({
      where: {
        asaasId,
      },
    });

    if (!adesao) {
      console.log("Adesão não encontrada para:", asaasId);
      return NextResponse.json({ received: true });
    }

    // Evita duplicação
    if (adesao.status === "PAID") {
      return NextResponse.json({ received: true });
    }

    // 🔥 Chama sua lógica de confirmação
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/adesao/confirmar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: adesao.id }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ERRO WEBHOOK:", error);

    return NextResponse.json(
      { error: "Erro webhook" },
      { status: 500 }
    );
  }
}