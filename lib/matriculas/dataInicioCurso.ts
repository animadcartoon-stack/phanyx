// Data civil opcional: nao depende do fuso horario do servidor.
export function validarDataInicioCurso(valor: unknown): {
  valida: boolean; data: Date | null | undefined;
} {
  if (valor === undefined) return { valida: true, data: undefined };
  if (valor === null || valor === "") return { valida: true, data: null };
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return { valida: false, data: undefined };
  }
  const data = new Date(`${valor}T00:00:00.000Z`);
  const valida = !Number.isNaN(data.getTime()) &&
    data.getUTCFullYear() > 0 && data.toISOString().slice(0, 10) === valor;
  return { valida, data: valida ? data : undefined };
}

export function formatarDataInicioCurso(valor: Date | string | null | undefined) {
  if (!valor) return "";
  const iso = valor instanceof Date ?
    (Number.isNaN(valor.getTime()) ? "" : valor.toISOString().slice(0, 10)) :
    String(valor).slice(0, 10);
  const resultado = validarDataInicioCurso(iso);
  return resultado.valida && resultado.data ?
    `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "";
}
