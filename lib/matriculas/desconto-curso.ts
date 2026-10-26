export class ErroDescontoCurso extends Error {
  readonly codigo = "DESCONTO_MENSALIDADE_INVALIDO";
}
export function percentualDescontoCurso(valor: unknown): number | null {
  if (valor == null || valor === "") return null;
  if ((typeof valor !== "number" && typeof valor !== "string") || !/^\d+(?:[.,]\d{1,2})?$/.test(String(valor).trim())) throw new ErroDescontoCurso();
  const n = Number(String(valor).trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new ErroDescontoCurso();
  return n;
}
export function mensalidadeComDesconto(valor: unknown, percentual?: unknown): number | null {
  if (valor == null || valor === "") return null;
  const base = Number(valor);
  if (!Number.isFinite(base) || base < 0) return null;
  const desconto = percentualDescontoCurso(percentual == null ? null : String(percentual)) ?? 0;
  const centavos = Math.round((base + Number.EPSILON) * 100);
  return Math.round(centavos * (10000 - Math.round(desconto * 100)) / 10000) / 100;
}
export function campoDescontoCurso(body: Record<string, unknown>) {
  return body.descontoMensalidadePercentual === undefined ? {} : { descontoMensalidadePercentual: percentualDescontoCurso(body.descontoMensalidadePercentual) };
}
