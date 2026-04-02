import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const token = String(body?.token || "").trim();
    const nome = String(body?.nome || "").trim();
    const cpf = String(body?.cpf || "").trim();
    const assinaturaBase64 = String(body?.assinaturaBase64 || "").trim();

    if (!token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    if (!nome) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    if (!cpf) {
      return NextResponse.json({ error: "CPF é obrigatório" }, { status: 400 });
    }

    if (!assinaturaBase64) {
      return NextResponse.json(
        { error: "Assinatura é obrigatória" },
        { status: 400 }
      );
    }

    const contrato = await prisma.contrato.findFirst({
      where: {
        tokenAssinatura: token,
      },
      include: {
        assinatura: true,
      },
    });

    if (!contrato) {
      return NextResponse.json(
        { error: "Contrato não encontrado" },
        { status: 404 }
      );
    }

    if (contrato.status === "ASSINADO") {
      return NextResponse.json(
        { error: "Este contrato já foi assinado" },
        { status: 400 }
      );
    }

    const ipBruto =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "";

    const ipAssinatura = ipBruto.split(",")[0]?.trim() || null;
    const userAgent = req.headers.get("user-agent") || null;

    await prisma.$transaction(async (tx) => {
      await tx.assinatura.upsert({
        where: {
          contratoId: contrato.id,
        },
        update: {
          nome,
          cpf,
          imagem: assinaturaBase64,
          data: new Date(),
        },
        create: {
          contratoId: contrato.id,
          nome,
          cpf,
          imagem: assinaturaBase64,
        },
      });

      await tx.contrato.update({
        where: {
          id: contrato.id,
        },
        data: {
          status: "ASSINADO",
          dataAssinatura: new Date(),
          ipAssinatura,
          userAgent,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      message: "Contrato assinado com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao assinar contrato por token:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao assinar contrato" },
      { status: 500 }
    );
  }
}