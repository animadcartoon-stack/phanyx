// Validacao antes da gravacao: jamais criar um vinculo sem vagas ou
// com disciplina legada misturada ao curso que utiliza matricula direta.
import { ErroModalidades } from "./combos";

type OfertaDireta = {
  curso: { matriculaDiretaTurma?: boolean };
  disciplinaIds: number[];
  disciplinas: Array<{ id: number }>;
  horariosPendentes: boolean;
  capacidadePendente: boolean;
  vagas: number | null;
};
export function validarOfertasDiretasParaGravacao(ofertas: OfertaDireta[]): void {
  for (const o of ofertas) {
    if (!o.curso.matriculaDiretaTurma) continue;
    if (o.disciplinaIds.length || o.disciplinas.length || o.horariosPendentes)
      throw new ErroModalidades("HORARIOS_INCOMPLETOS", 409);
    // Matricula direta requer limite explicito; null NAO e ilimitado.
    if (o.capacidadePendente || o.vagas === null || o.vagas <= 0)
      throw new ErroModalidades("TURMA_SEM_VAGAS", 409);
  }
}
