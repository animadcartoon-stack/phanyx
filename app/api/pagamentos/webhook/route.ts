import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // evento do Asaas
    const event = body.event;

    if (event === "PAYMENT_CONFIRMED") {
      const payment = body.payment;

      const asaasId = payment.id;

      // encontra pagamento interno
      const pagamento = await prisma.checkoutPagamento.findFirst({
        where: { asaasPaymentId: asaasId },
      });

      if (!pagamento) {
        return NextResponse.json({ ok: true });
      }

      // atualiza
      await prisma.checkoutPagamento.update({
        where: { id: pagamento.id },
        data: { status: "PAID" },
      });

      // 🔥 aqui depois podemos reutilizar sua lógica de criação
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro webhook" }, { status: 500 });
  }
}