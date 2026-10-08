export function normalizarCutterBase(
  valor: string | null | undefined
) {
  const texto =
    String(valor ?? "")
      .trim()
      .replace(/\s+/g, "")
      .toUpperCase();

  if (!/^[A-Z]\d{1,6}$/.test(texto)) {
    return null;
  }

  return texto;
}

export function inicialTituloCutter(
  titulo: string | null | undefined
) {
  const texto =
    String(titulo ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const encontrada =
    texto.match(/[A-Za-z]/);

  return encontrada
    ? encontrada[0].toLowerCase()
    : null;
}

export function gerarCodigoCutterObra(
  codigoCutterBase: string | null | undefined,
  titulo: string | null | undefined
) {
  const base =
    normalizarCutterBase(
      codigoCutterBase
    );

  const inicial =
    inicialTituloCutter(
      titulo
    );

  if (!base || !inicial) {
    return null;
  }

  return `${base}${inicial}`;
}
