import { ErroMobilidade } from "@/lib/mobilidade-acesso";
import { exigirContextoMobilidadeDocente, filtroDocumentosDocente } from "@/lib/mobilidade-docente";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export type PortalDocumentoMobilidade = "ALUNO" | "PROFESSOR";

export async function contextoDocumentoMobilidade(portal: PortalDocumentoMobilidade) {
  const usuario = await getUserFromToken();
  if (String(usuario?.role || "").toUpperCase() !== portal || !usuario?.instituicaoId) {
    throw new ErroMobilidade(401, "NAO_AUTORIZADO", "Não autorizado.");
  }

  const instituicaoId = usuario.instituicaoId;
  if (portal === "PROFESSOR") {
    const { professor } = await exigirContextoMobilidadeDocente(usuario);
    if (usuario.impersonacao) {
      throw new ErroMobilidade(403, "NAO_AUTORIZADO", "Não autorizado.");
    }
    return {
      instituicaoId,
      candidatura: {
        instituicaoId,
        professorId: professor.id,
        vinculoCandidato: "PROFESSOR_PHANYX" as const,
        ...filtroDocumentosDocente(),
      },
    };
  }

  const aluno = await prisma.aluno.findFirst({
    where: { instituicaoId, userId: usuario.id },
    select: { id: true },
  });
  if (!aluno) {
    throw new ErroMobilidade(404, "ALUNO_NAO_ENCONTRADO", "Aluno não encontrado.");
  }
  return {
    instituicaoId,
    candidatura: { instituicaoId, alunoId: aluno.id, vinculoCandidato: "ALUNO_PHANYX" as const },
  };
}
