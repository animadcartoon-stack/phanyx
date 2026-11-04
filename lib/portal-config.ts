import { prisma } from "@/lib/prisma";

export async function paginaVisivel(
  instituicaoId: number,
  portal: "ALUNO" | "PROFESSOR",
  chavePagina: string,
  visivelPadrao = true
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
    return visivelPadrao;
  }

  return configuracao.visivel;
}