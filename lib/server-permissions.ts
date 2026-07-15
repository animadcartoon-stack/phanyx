import { prisma } from "@/lib/prisma";

type UsuarioPermissao = {
  id?: number | null;
  role?: string | null;
  instituicaoId?: number | null;
  isMasterAdmin?: boolean | null;
};

function usuarioTemAcessoTotal(user: UsuarioPermissao) {
  const role = String(user?.role || "").toUpperCase();

  return (
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    user?.isMasterAdmin === true
  );
}

export async function obterPermissoesDoUsuario(
  user: UsuarioPermissao
): Promise<string[]> {
  if (usuarioTemAcessoTotal(user)) {
    return ["*"];
  }

  const userId = Number(user?.id);
  const instituicaoId = Number(user?.instituicaoId);

  if (
    !Number.isInteger(userId) ||
    userId <= 0 ||
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    return [];
  }

  const funcionario = await prisma.funcionario.findFirst({
    where: {
      userId,
      instituicaoId,
    },
    select: {
      permissoes: {
        where: {
          ativo: true,
        },
        select: {
          chave: true,
        },
      },

      departamento: {
        select: {
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

  if (!funcionario) {
    return [];
  }

  const permissoesIndividuais = funcionario.permissoes.map(
    (permissao) => permissao.chave
  );

  const permissoesDepartamento =
    funcionario.departamento?.permissoes.map(
      (permissao) => permissao.chave
    ) || [];

  return Array.from(
    new Set([
      ...permissoesDepartamento,
      ...permissoesIndividuais,
    ])
  );
}

export async function usuarioPossuiPermissao(
  user: UsuarioPermissao,
  ...chavesAceitas: string[]
): Promise<boolean> {
  if (usuarioTemAcessoTotal(user)) {
    return true;
  }

  const permissoes = await obterPermissoesDoUsuario(user);

  if (permissoes.includes("*")) {
    return true;
  }

  return chavesAceitas.some((chave) =>
    permissoes.includes(chave)
  );
}