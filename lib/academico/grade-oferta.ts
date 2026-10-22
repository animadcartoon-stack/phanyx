export type CursoGradeOferta = {
  id: number;
  semestres: { numero: number; disciplinas: { disciplinaId: number }[] }[];
};

export function numeroSemestreOferta(valor: unknown): number | null {
  const numero = Number(String(valor ?? "").match(/\d+/)?.[0] || 0);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

// The explicit curriculum is authoritative. Direct fields are a legacy fallback
// only for courses that do not yet have any curriculum stages configured.
export function disciplinaPermitidaNaOferta(
  disciplina: { id: number; cursoId?: number | null; semestre?: number | null },
  curso: CursoGradeOferta | null,
  semestre: number | null,
): boolean {
  if (!curso) return disciplina.cursoId == null && (!semestre || disciplina.semestre === semestre);
  if (curso.semestres.length) {
    return curso.semestres.some(etapa =>
      (!semestre || etapa.numero === semestre) &&
      etapa.disciplinas.some(item => item.disciplinaId === disciplina.id),
    );
  }
  return disciplina.cursoId === curso.id && (!semestre || disciplina.semestre === semestre);
}

export function mesmaEtapaOferta(a: unknown, b: unknown): boolean {
  const numeroA = numeroSemestreOferta(a);
  const numeroB = numeroSemestreOferta(b);
  return numeroA !== null && numeroB !== null
    ? numeroA === numeroB : String(a ?? "").trim() === String(b ?? "").trim();
}
