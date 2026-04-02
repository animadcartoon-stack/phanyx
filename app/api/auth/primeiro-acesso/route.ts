import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { senha } = body;

    if (!senha || senha.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const cookieHeader = req.headers.get("cookie") || "";
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch?.[1];

    if (!token) {
      return NextResponse.json(
        { error: "Token não encontrado." },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      role: string;
    };

    const senhaHash = await bcrypt.hash(senha, 10);

    await prisma.user.update({
      where: { id: decoded.id },
      data: {
        senha: senhaHash,
        precisaTrocarSenha: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ERRO PRIMEIRO ACESSO:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar senha." },
      { status: 500 }
    );
  }
}