import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;

type TokenPayload = {
  id: number | string;
  email?: string;
  role?: string;
  instituicaoId?: number | null;
  nome?: string | null;
};

export async function getUserFromToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    const usuario = await prisma.user.findUnique({
      where: { id: Number(decoded.id) },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        instituicaoId: true,
        isMasterAdmin: true,
        precisaTrocarSenha: true,
        instituicao: {
          select: {
            plano: true,
          },
        },
      },
    });

    if (!usuario) return null;

    const roleNormalizada = String(usuario.role || "")
      .trim()
      .toUpperCase();

    return {
      id: usuario.id,
      email: usuario.email,
      role: roleNormalizada,
      instituicaoId: usuario.instituicaoId ?? null,
      nome: usuario.nome || null,
      plano: usuario.instituicao?.plano ?? null,
      isMasterAdmin: Boolean(usuario.isMasterAdmin),
      precisaTrocarSenha: Boolean(usuario.precisaTrocarSenha),
    };
  } catch (error) {
    console.error("Erro em getUserFromToken:", error);
    return null;
  }
}

export function isAdminLike(role?: string | null) {
  const roleNormalizada = String(role || "").trim().toUpperCase();
  return ["ADMIN", "GERENCIA"].includes(roleNormalizada);
}