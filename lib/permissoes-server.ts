import { prisma } from "@/lib/prisma";

type UsuarioParaPermissao = {
  id: number;
  role?: string | null;
  instituicaoId?: number | null;
  isMasterAdmin?: boolean | null;
};

export function usuarioTemAcessoTotal(
  user: UsuarioParaPermissao
) {
  const role = String(
    user.role || ""
  ).toUpperCase();

  return (
    role === "ADMIN" ||
    role === "GERENCIA" ||
    role === "SUPER_ADMIN" ||
    user.isMasterAdmin === true
  );
}

export async function obterPermissoesUsuario(
  user: UsuarioParaPermissao
): Promise<string[]> {
  if (usuarioTemAcessoTotal(user)) {
    return ["*"];
  }

  if (!user.instituicaoId) {
    return [];
  }

  const funcionario =
    await prisma.funcionario.findFirst({
      where: {
        userId: user.id,
        instituicaoId:
          user.instituicaoId,
      },
      include: {
        permissoes: true,
        departamento: {
          include: {
            permissoes: true,
          },
        },
      },
    });

  if (!funcionario) {
    return [];
  }

  const permissoes =
    new Set<string>();

  funcionario.departamento?.permissoes.forEach(
    (permissao) => {
      if (permissao.ativo) {
        permissoes.add(
          permissao.chave
        );
      }
    }
  );

  funcionario.permissoes.forEach(
    (permissao) => {
      if (permissao.ativo) {
        permissoes.add(
          permissao.chave
        );
      }
    }
  );

  return Array.from(permissoes);
}

export async function usuarioTemPermissao(
  user: UsuarioParaPermissao,
  chave: string
): Promise<boolean> {
  if (usuarioTemAcessoTotal(user)) {
    return true;
  }

  const permissoes =
    await obterPermissoesUsuario(
      user
    );

  return (
    permissoes.includes("*") ||
    permissoes.includes(chave)
  );
}