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

export type UsuarioLogado = {
  id: number;
  email: string;
  role: string;
  instituicaoId: number | null;
  nome: string | null;
  plano: string | null;
  isMasterAdmin: boolean;
  precisaTrocarSenha: boolean;

  funcionarioId: number | null;
  departamentoId: number | null;
  departamentoNome: string | null;

  permissoes: string[];
  permissoesDepartamento: string[];
  permissoesFuncionario: string[];
};

function normalizarRole(role?: string | null) {
  return String(role || "").trim().toUpperCase();
}

function normalizarPermissoes(permissoes: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      permissoes
        .map((p) => String(p || "").trim())
        .filter(Boolean)
    )
  );
}

export async function getUserFromToken(): Promise<UsuarioLogado | null> {
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
        funcionario: {
          select: {
            id: true,
            departamentoId: true,
            departamento: {
              select: {
                id: true,
                nome: true,
                permissoes: {
                  where: {
                    ativo: true,
                  },
                  select: {
                    chave: true,
                  },
                },
              },
            },
            permissoes: {
              where: {
                ativo: true,
              },
              select: {
                chave: true,
              },
            },
          },
        },
      },
    });

    if (!usuario) return null;

    const roleNormalizada = normalizarRole(usuario.role);

    const permissoesDepartamento = normalizarPermissoes(
      usuario.funcionario?.departamento?.permissoes?.map((p) => p.chave) || []
    );

    const permissoesFuncionario = normalizarPermissoes(
      usuario.funcionario?.permissoes?.map((p) => p.chave) || []
    );

    const permissoes = normalizarPermissoes([
      ...permissoesDepartamento,
      ...permissoesFuncionario,
    ]);

    return {
      id: usuario.id,
      email: usuario.email,
      role: roleNormalizada,
      instituicaoId: usuario.instituicaoId ?? null,
      nome: usuario.nome || null,
      plano: usuario.instituicao?.plano ?? null,
      isMasterAdmin: Boolean(usuario.isMasterAdmin),
      precisaTrocarSenha: Boolean(usuario.precisaTrocarSenha),

      funcionarioId: usuario.funcionario?.id ?? null,
      departamentoId: usuario.funcionario?.departamentoId ?? null,
      departamentoNome: usuario.funcionario?.departamento?.nome ?? null,

      permissoes,
      permissoesDepartamento,
      permissoesFuncionario,
    };
  } catch (error) {
    console.error("Erro em getUserFromToken:", error);
    return null;
  }
}

export function isAdminLike(role?: string | null) {
  const roleNormalizada = normalizarRole(role);
  return ["ADMIN", "GERENCIA"].includes(roleNormalizada);
}

export function temPermissao(
  usuario: Pick<UsuarioLogado, "role" | "isMasterAdmin" | "permissoes"> | null,
  chave: string
) {
  if (!usuario) return false;

  if (usuario.isMasterAdmin) return true;

  if (isAdminLike(usuario.role)) return true;

  return usuario.permissoes.includes(chave);
}

export function temAlgumaPermissao(
  usuario: Pick<UsuarioLogado, "role" | "isMasterAdmin" | "permissoes"> | null,
  chaves: string[]
) {
  if (!usuario) return false;

  if (usuario.isMasterAdmin) return true;

  if (isAdminLike(usuario.role)) return true;

  return chaves.some((chave) => usuario.permissoes.includes(chave));
}

export function temTodasPermissoes(
  usuario: Pick<UsuarioLogado, "role" | "isMasterAdmin" | "permissoes"> | null,
  chaves: string[]
) {
  if (!usuario) return false;

  if (usuario.isMasterAdmin) return true;

  if (isAdminLike(usuario.role)) return true;

  return chaves.every((chave) => usuario.permissoes.includes(chave));
}