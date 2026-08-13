export function somenteDigitos(valor?: string | null) {
  return String(valor || "").replace(/\D/g, "");
}

export function normalizarTelefoneWhatsappBrasil(
  valor?: string | null
): string | null {
  let telefone = somenteDigitos(valor);

  if (!telefone) {
    return null;
  }

  // Remove zeros usados como prefixo de discagem.
  telefone = telefone.replace(/^0+/, "");

  // Se já vier com código do Brasil, preserva.
  if (telefone.startsWith("55")) {
    const numeroSemPais = telefone.slice(2);

    // Brasil: DDD + número normalmente entre 10 e 11 dígitos.
    if (numeroSemPais.length < 10 || numeroSemPais.length > 11) {
      return null;
    }

    return telefone;
  }

  // Número brasileiro sem código do país.
  if (telefone.length < 10 || telefone.length > 11) {
    return null;
  }

  return `55${telefone}`;
}

export function telefoneWhatsappValido(
  valor?: string | null
): boolean {
  return normalizarTelefoneWhatsappBrasil(valor) !== null;
}

export function mascararTelefoneWhatsapp(
  valor?: string | null
): string | null {
  const telefone = normalizarTelefoneWhatsappBrasil(valor);

  if (!telefone) {
    return null;
  }

  const numero = telefone.slice(2);

  if (numero.length === 11) {
    return `+55 (${numero.slice(0, 2)}) ${numero.slice(
      2,
      7
    )}-${numero.slice(7)}`;
  }

  if (numero.length === 10) {
    return `+55 (${numero.slice(0, 2)}) ${numero.slice(
      2,
      6
    )}-${numero.slice(6)}`;
  }

  return `+${telefone}`;
}