import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, senha } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token inválido." }, { status: 400 });
    }

    if (!senha || String(senha).length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpira: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Link inválido ou expirado." },
        { status: 400 }
      );
    }

    const senhaHash = await bcrypt.hash(String(senha), 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        senha: senhaHash,
        resetToken: null,
        resetTokenExpira: null,
        precisaTrocarSenha: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erro ao redefinir senha." },
      { status: 500 }
    );
  }
}