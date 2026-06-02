import { prisma } from "@/lib/prisma";

export async function obterPlanoInstituicao(
  instituicaoId: number
) {
  const instituicao = await prisma.instituicao.findUnique({
    where: {
      id: instituicaoId,
    },
    select: {
      plano: true,
    },
  });

  return instituicao?.plano || "ESSENCIAL";
}