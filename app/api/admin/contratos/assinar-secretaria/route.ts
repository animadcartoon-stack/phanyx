import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      !["ADMIN", "SUPER_ADMIN", "SECRETARIA", "COORDENADOR"].includes(user.role)
    ) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const contratoId = Number(body.contratoId);
    const assinaturaBase64 = String(body.assinaturaBase64 || "").trim();

    if (!contratoId || !assinaturaBase64) {
      return NextResponse.json(
        { error: "Contrato e assinatura são obrigatórios." },
        { status: 400 }
      );
    }

    const contrato = await prisma.contrato.findFirst({
      where: {
        id: contratoId,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!contrato) {
      return NextResponse.json(
        { error: "Contrato não encontrado." },
        { status: 404 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";

    const userAgent = req.headers.get("user-agent") || "";

    const atualizado = await prisma.contrato.update({
      where: {
        id: contratoId,
      },
      data: {
        assinaturaSecretariaImagem: assinaturaBase64,
        assinaturaSecretariaNome: user.nome || user.email || "Secretaria",
        assinaturaSecretariaUserId: user.id,
        assinaturaSecretariaEm: new Date(),
        assinaturaSecretariaIp: ip,
        assinaturaSecretariaUserAgent: userAgent,
      },
    });

    return NextResponse.json({
      ok: true,
      contratoId: atualizado.id,
    });
  } catch (error: any) {
    console.error("Erro ao assinar como secretaria:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao assinar como secretaria." },
      { status: 500 }
    );
  }
}