export const PERIODO_CAMPO = "periodoData";
export const MARCADOR_PERIODO = /\{\{\s*campo:periodoData\s*\}\}/g;
export function separarPeriodo(valor: unknown): [string,string] {
  if (typeof valor !== "string") return ["", ""];
  const partes = valor.split("/");
  return partes.length === 2 ? [partes[0], partes[1]] : ["", ""];
}
function dataValida(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || s < "1900-01-01" || s > "9999-12-31") return false;
  const d = new Date(s + "T00:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === s;
}
export function periodoValido(modelo: string, campos: unknown, obrigatorio = true): boolean {
  if (!/\{\{\s*campo:periodoData\s*\}\}/.test(modelo)) return true;
  const valor = campos && typeof campos === "object" ? (campos as Record<string,unknown>)[PERIODO_CAMPO] : undefined;
  if (valor === undefined || valor === "" || valor === "/") return !obrigatorio;
  const [inicio,fim] = separarPeriodo(valor);
  if (!obrigatorio && (!inicio || !fim)) return (!inicio || dataValida(inicio)) && (!fim || dataValida(fim)) && (inicio !== "" || fim !== "");
  return dataValida(inicio) && dataValida(fim) && inicio <= fim;
}
export function textosPeriodo(locale: string) {
  const pt = {titulo:"Período personalizado",inicio:"Data inicial",fim:"Data final",erro:"Informe datas válidas; a data final não pode ser anterior à inicial.",ate:"a"};
  const traducoes: Record<string,typeof pt> = {"pt-BR":pt,"pt-PT":pt,"en-US":{titulo:"Custom date range",inicio:"Start date",fim:"End date",erro:"Enter valid dates; the end date cannot precede the start date.",ate:"to"},"es-ES":{titulo:"Período personalizado",inicio:"Fecha inicial",fim:"Fecha final",erro:"Introduzca fechas válidas; la fecha final no puede ser anterior a la inicial.",ate:"a"},"fr-FR":{titulo:"Période personnalisée",inicio:"Date de début",fim:"Date de fin",erro:"Saisissez des dates valides ; la date de fin ne peut pas précéder le début.",ate:"au"}};
  return traducoes[locale] || pt;
}
export function formatarPeriodo(valor: unknown, locale = "pt-BR", branco = false): string {
  const [inicio,fim] = separarPeriodo(valor);
  const fmt = (s:string) => dataValida(s) ? new Intl.DateTimeFormat(locale,{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"UTC"}).format(new Date(s+"T00:00:00Z")) : "____/____/________";
  return (branco ? "____/____/________" : fmt(inicio)) + " " + textosPeriodo(locale).ate + " " + (branco ? "____/____/________" : fmt(fim));
}
