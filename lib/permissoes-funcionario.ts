import { prisma } from "@/lib/prisma";

export async function funcionarioTemPermissao(
  userId: number,
  chave: string
) {
  const funcionario = await prisma.funcionario.findUnique({
    where: { userId },
    include: {
      permissoes: true,
      departamento: {
        include: {
          permissoes: true,
        },
      },
    },
  });

  if (!funcionario) return false;

  const permissaoIndividual = funcionario.permissoes.some(
    (p) => p.chave === chave && p.ativo
  );

  const permissaoDepartamento = funcionario.departamento?.permissoes.some(
    (p) => p.chave === chave && p.ativo
  );

  return permissaoIndividual || Boolean(permissaoDepartamento);
}