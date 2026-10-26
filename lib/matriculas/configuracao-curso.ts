import { mensalidadeComDesconto } from "@/lib/matriculas/desconto-curso";
import { organizacaoAcademica } from "@/lib/academico/organizacao";

type CursoConfiguracao = { organizacaoCurricular?: string | null; quantidadeEtapas?: number | null;
  descontoMensalidadePercentual?: unknown; valorMatricula?: unknown; valorMensalidade?: unknown; quantidadeParcelas?: unknown };
export function financeiroPadraoCurso(curso?: CursoConfiguracao | null) {
  const numero = (valor: unknown, aceitaZero = false) => {
    if (valor == null || valor === "") return "";
    const n = Number(valor);
    return Number.isFinite(n) && (aceitaZero ? n >= 0 : n > 0) ? String(n) : "";
  };
  if (!curso) return { valorMatricula: "", valorMensalidade: "", quantidadeMensalidades: "" };
  if (organizacaoAcademica(curso.organizacaoCurricular) === "LIVRE")
    return { valorMatricula: "0", valorMensalidade: "", quantidadeMensalidades: "" };
  return { valorMatricula: numero(curso.valorMatricula, true), valorMensalidade: numero(curso.valorMensalidade) === "" ? "" : numero(mensalidadeComDesconto(curso.valorMensalidade, curso.descontoMensalidadePercentual), true),
    quantidadeMensalidades: Number.isInteger(Number(curso.quantidadeParcelas)) ? numero(curso.quantidadeParcelas) : "" };
}
export function anualDeEtapaUnica(curso: CursoConfiguracao) {
  return curso.organizacaoCurricular === "ANUAL" && (curso.quantidadeEtapas == null || curso.quantidadeEtapas === 1);
}
export type EtapaMatricula = { id: number; numero: number; titulo?: string | null; descricao?: string | null;
  cargaMinima?: number | null; cargaMaxima?: number | null; virtual?: boolean;
  disciplinas: { id: number; disciplinaId: number; disciplina?: { id: number; nome: string; codigo?: string | null; cargaHoraria?: number | null } | null }[] };
export function etapasParaMatricula(curso: CursoConfiguracao, etapas: EtapaMatricula[], disciplinas: NonNullable<EtapaMatricula["disciplinas"][number]["disciplina"]>[]): EtapaMatricula[] {
  if (etapas.length || !anualDeEtapaUnica(curso)) return etapas;
  // Representação da oferta anual simples. Nenhuma etapa ou ID de grade é criado no banco.
  return [{ id: 0, numero: 1, virtual: true, disciplinas: disciplinas.map(d => ({ id: d.id, disciplinaId: d.id, disciplina: d })) }];
}
