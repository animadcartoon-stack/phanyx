import { prisma } from "@/lib/prisma";

export async function paginaVisivel(
  instituicaoId: number,
  portal: "ALUNO" | "PROFESSOR",
  chavePagina: string
) {
  const configuracao =
    await prisma.configuracaoPortalInstituicao.findUnique({
      where: {
        instituicaoId_portal_chavePagina: {
          instituicaoId,
          portal,
          chavePagina,
        },
      },
      select: {
        visivel: true,
      },
    });

  if (!configuracao) {
    return true;
  }

  return configuracao.visivel;
}