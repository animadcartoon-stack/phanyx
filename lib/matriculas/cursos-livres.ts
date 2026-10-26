export type PeriodicidadeLivre = "SEMANAL" | "MENSAL";
export class ErroCursoLivre extends Error {
  constructor(public codigo: string, public status = 400, public detalhes?: unknown) { super(codigo); }
}
export function idCursoLivre(valor: unknown): number {
  if ((typeof valor !== "string" && typeof valor !== "number") || !/^\d+$/.test(String(valor))) throw new ErroCursoLivre("DADOS_INVALIDOS");
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id <= 0) throw new ErroCursoLivre("DADOS_INVALIDOS");
  return id;
}
export function dataCivilLivre(valor: unknown): Date {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) throw new ErroCursoLivre("DATA_INVALIDA");
  const data = new Date(`${valor}T00:00:00.000Z`);
  if (!Number.isFinite(data.getTime()) || data.toISOString().slice(0, 10) !== valor || valor < "1900-01-01" || valor > "2199-12-31") throw new ErroCursoLivre("DATA_INVALIDA");
  return data;
}
export function validarPeriodoLivre(body: Record<string, unknown>): { periodicidade: PeriodicidadeLivre; dataInicio: Date; dataFim: Date } {
  const periodicidade = body.periodicidade;
  if (periodicidade !== "SEMANAL" && periodicidade !== "MENSAL") throw new ErroCursoLivre("PERIODICIDADE_INVALIDA");
  const dataInicio = dataCivilLivre(body.dataInicio), dataFim = dataCivilLivre(body.dataFim);
  const dias = (dataFim.getTime() - dataInicio.getTime()) / 86400000 + 1;
  if (dias < 1 || dias > (periodicidade === "SEMANAL" ? 7 : 31)) throw new ErroCursoLivre("PERIODO_INVALIDO");
  return { periodicidade, dataInicio, dataFim };
}
export function fimSugeridoLivre(inicio: string, tipo: PeriodicidadeLivre): string {
  if (!inicio) return "";
  const data = dataCivilLivre(inicio);
  if (tipo === "SEMANAL") data.setUTCDate(data.getUTCDate() + 6);
  else {
    const dia = data.getUTCDate();
    data.setUTCMonth(data.getUTCMonth() + 1, 1);
    const ultimo = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + 1, 0)).getUTCDate();
    data.setUTCDate(Math.min(dia, ultimo));
    data.setUTCDate(data.getUTCDate() - 1);
  }
  return data.toISOString().slice(0, 10);
}
export function precoLivre(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor !== "number" && typeof valor !== "string") throw new ErroCursoLivre("VALOR_INVALIDO");
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0 || n > 99999999.99 || Math.abs(n * 100 - Math.round(n * 100)) > 0.000001) throw new ErroCursoLivre("VALOR_INVALIDO");
  return Math.round(n * 100) / 100;
}
export function camposPrecoCursoLivre(body: Record<string, unknown>, organizacao: string) {
  const valorSemanal = organizacao === "LIVRE" ? precoLivre(body.valorSemanal) : null;
  const valorMensal = organizacao === "LIVRE" ? precoLivre(body.valorMensalidade) : null;
  if (organizacao === "LIVRE" && valorSemanal === null && valorMensal === null) throw new ErroCursoLivre("PRECO_NAO_CONFIGURADO");
  return { valorSemanal };
}
export function periodoEstaPago(lancamento: { status: string; valorPago?: unknown; valorFinal?: unknown }) {
  return lancamento.status === "PAGO" && Number(lancamento.valorPago) >= Number(lancamento.valorFinal);
}
