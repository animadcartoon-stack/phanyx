import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";

import type {
  CountryCode,
} from "libphonenumber-js";

export type PaisTelefone = {
  codigo: CountryCode;
  nome: string;
  prefixo: string;
  label: string;
};

function criarNomePais(
  codigo: CountryCode
) {
  try {
    const nomes =
      new Intl.DisplayNames(
        ["pt-BR"],
        {
          type: "region",
        }
      );

    return (
      nomes.of(codigo) ||
      codigo
    );
  } catch {
    return codigo;
  }
}

/*
 * Lista gerada automaticamente
 * pela biblioteca.
 *
 * Não mantemos manualmente
 * os países no PHANYX.
 */
export const PAISES_TELEFONE:
  PaisTelefone[] =
  getCountries()
    .map((codigo) => {
      const nome =
        criarNomePais(
          codigo
        );

      const prefixo =
        `+${getCountryCallingCode(
          codigo
        )}`;

      return {
        codigo,
        nome,
        prefixo,
        label:
          `${nome} (${prefixo})`,
      };
    })
    .sort((a, b) =>
      a.nome.localeCompare(
        b.nome,
        "pt-BR"
      )
    );

export function obterPrefixoTelefone(
  pais: CountryCode
) {
  return `+${getCountryCallingCode(
    pais
  )}`;
}

function textoTelefone(
  valor: unknown
) {
  return String(
    valor ?? ""
  ).trim();
}

function somenteDigitos(
  valor: unknown
) {
  return textoTelefone(
    valor
  ).replace(
    /\D/g,
    ""
  );
}

/*
 * Detecta o país quando a pessoa
 * cola um número internacional:
 *
 * +351...
 * +1...
 * +55...
 */
export function detectarPaisTelefone(
  valor: unknown
): CountryCode | null {
  const texto =
    textoTelefone(
      valor
    );

  if (
    !texto.startsWith("+")
  ) {
    return null;
  }

  const telefone =
    parsePhoneNumberFromString(
      texto
    );

  return (
    telefone?.country ??
    null
  );
}

/*
 * Formata somente a parte do telefone.
 * O prefixo internacional será mostrado
 * separadamente no seletor de país.
 */
export function formatarTelefonePorPais(
  valor: unknown,
  pais: CountryCode
) {
  const texto =
    textoTelefone(
      valor
    );

  if (!texto) {
    return "";
  }

  /*
   * Se a pessoa colar um telefone
   * internacional completo, aproveitamos
   * o número nacional detectado.
   */
  if (
    texto.startsWith("+")
  ) {
    const telefone =
      parsePhoneNumberFromString(
        texto
      );

    if (telefone) {
      return new AsYouType(
        telefone.country ??
          pais
      ).input(
        telefone.nationalNumber
      );
    }
  }

  return new AsYouType(
    pais
  ).input(
    somenteDigitos(
      texto
    )
  );
}

/*
 * Converte para o padrão internacional
 * E.164.
 *
 * Exemplo:
 * Brasil + 11 98765-4321
 * ->
 * +5511987654321
 */
export function normalizarTelefoneE164(
  valor: unknown,
  pais: CountryCode
) {
  const texto =
    textoTelefone(
      valor
    );

  if (!texto) {
    return "";
  }

  const telefone =
    texto.startsWith("+")
      ? parsePhoneNumberFromString(
          texto
        )
      : parsePhoneNumberFromString(
          texto,
          pais
        );

  return (
    telefone?.number ??
    ""
  );
}

export function telefoneValidoInternacional(
  valor: unknown,
  pais: CountryCode
) {
  const texto =
    textoTelefone(
      valor
    );

  if (!texto) {
    return false;
  }

  const telefone =
    texto.startsWith("+")
      ? parsePhoneNumberFromString(
          texto
        )
      : parsePhoneNumberFromString(
          texto,
          pais
        );

  return (
    telefone?.isValid() ===
    true
  );
}

/*
 * ------------------------------------------------
 * COMPATIBILIDADE COM O QUE JÁ EXISTE NO PHANYX
 * ------------------------------------------------
 *
 * Mantemos estas funções enquanto
 * migramos as telas para o novo
 * componente internacional.
 */

export function normalizarTelefoneBR(
  valor: unknown
) {
  const texto =
    textoTelefone(
      valor
    );

  if (!texto) {
    return "";
  }

  if (
    texto.startsWith("+")
  ) {
    const telefone =
      parsePhoneNumberFromString(
        texto
      );

    if (
      telefone?.country ===
      "BR"
    ) {
      return String(
        telefone.nationalNumber
      );
    }
  }

  let numeros =
    somenteDigitos(
      texto
    );

  if (
    numeros.startsWith(
      "55"
    ) &&
    (
      numeros.length === 12 ||
      numeros.length === 13
    )
  ) {
    numeros =
      numeros.slice(2);
  }

  return numeros.slice(
    0,
    11
  );
}

export function formatarTelefoneBR(
  valor: unknown
) {
  return formatarTelefonePorPais(
    normalizarTelefoneBR(
      valor
    ),
    "BR"
  );
}

export function telefoneValidoBR(
  valor: unknown
) {
  return telefoneValidoInternacional(
    valor,
    "BR"
  );
}