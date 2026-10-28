// Cursos opt-in sem grade usam exclusivamente a API de modalidades.
// Este bloqueio impede que a rota legada crie ItemMatricula sem disciplina
// ou altere uma matricula tradicional para curso com matricula direta.
import { ErroModalidades } from "./combos";

export function exigirCursoComGradeNaRotaLegada(
  curso: { matriculaDiretaTurma?: boolean | null } | null | undefined,
): void {
  if (curso?.matriculaDiretaTurma === true)
    throw new ErroModalidades("TURMA_INDISPONIVEL", 409);
}
