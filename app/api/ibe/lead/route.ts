import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nome = String(body?.nome || "").trim();
    const whatsapp = String(body?.whatsapp || "").trim();
    const email = String(body?.email || "").trim();
    const mensagem = String(body?.mensagem || "").trim();

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório." },
        { status: 400 }
      );
    }

    if (!whatsapp) {
      return NextResponse.json(
        { error: "WhatsApp é obrigatório." },
        { status: 400 }
      );
    }

    const lead = await prisma.leadMatriculaIbe.create({
      data: {
        nome,
        whatsapp,
        email: email || null,
        mensagem: mensagem || null,
        curso: "Bacharel Livre em Teologia",
        origem: "IBE_MATRICULA",
        status: "NOVO",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Lead enviado com sucesso.",
      leadId: lead.id,
    });
  } catch (error) {
    console.error("ERRO AO SALVAR LEAD IBE:", error);

    return NextResponse.json(
      { error: "Não foi possível enviar seu interesse agora." },
      { status: 500 }
    );
  }
}