import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;

type TokenPayload = {
  id: number | string;
  email: string;
  role: string;
  instituicaoId: number | null;
  nome?: string | null;
};

export async function getUserFromToken() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    const roleNormalizada = String(decoded.role || "").trim().toUpperCase();

    let plano: string | null = null;
    let isMasterAdmin = false;

    if (decoded.instituicaoId) {
      const instituicao = await prisma.instituicao.findUnique({
        where: { id: Number(decoded.instituicaoId) },
        select: {
          plano: true,
        },
      });

      plano = instituicao?.plano ?? null;
    }

    const usuario = await prisma.user.findUnique({
      where: { id: Number(decoded.id) },
      select: {
        isMasterAdmin: true,
        precisaTrocarSenha: true,
      },
    });

    isMasterAdmin = Boolean(usuario?.isMasterAdmin);

    return {
      id: Number(decoded.id),
      email: decoded.email,
      role: roleNormalizada,
      instituicaoId: decoded.instituicaoId ? Number(decoded.instituicaoId) : null,
      nome: decoded.nome || null,
      plano,
      isMasterAdmin,
      precisaTrocarSenha: Boolean(usuario?.precisaTrocarSenha),
    };
  } catch (error) {
    return null;
  }
}