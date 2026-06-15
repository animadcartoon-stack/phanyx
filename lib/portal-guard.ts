import { notFound } from "next/navigation";
import { paginaVisivel } from "@/lib/portal-config";

export async function validarPaginaAluno(
  instituicaoId: number,
  chavePagina: string
) {
  const permitido = await paginaVisivel(instituicaoId, "ALUNO", chavePagina);

  if (!permitido) {
    notFound();
  }

  return true;
}

export async function validarPaginaProfessor(
  instituicaoId: number,
  chavePagina: string
) {
  const permitido = await paginaVisivel(
    instituicaoId,
    "PROFESSOR",
    chavePagina
  );

  if (!permitido) {
    notFound();
  }

  return true;
}