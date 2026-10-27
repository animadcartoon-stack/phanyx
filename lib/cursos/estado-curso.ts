import type { Prisma } from "@prisma/client";

const PRAZO_RECUPERACAO_MS = 3 * 24 * 60 * 60 * 1000;
type EstadoCurso = { ativo?: boolean; excluidoEm?: Date | string | null; expiraExclusaoEm?: Date | string | null };

export function cursoDisponivelParaMatricula(curso: EstadoCurso | null | undefined) {
  return curso?.ativo === true && !curso.excluidoEm;
}

export function exclusaoCursoExpirada(curso: EstadoCurso, agora = new Date()) {
  if (!curso.excluidoEm) return false;
  const prazo = curso.expiraExclusaoEm
    ? new Date(curso.expiraExclusaoEm).getTime()
    : new Date(curso.excluidoEm).getTime() + PRAZO_RECUPERACAO_MS;
  return !Number.isFinite(prazo) || prazo <= agora.getTime();
}

// O fim da recuperação independe da limpeza física: vínculos acadêmicos continuam preservados.
export function filtroCursosRecuperaveis(agora = new Date()): Prisma.CursoWhereInput {
  return { OR: [
    { excluidoEm: null },
    { expiraExclusaoEm: { gt: agora } },
    { expiraExclusaoEm: null, excluidoEm: { gt: new Date(agora.getTime() - PRAZO_RECUPERACAO_MS) } },
  ] };
}
