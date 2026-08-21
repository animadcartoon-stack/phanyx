import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";

import type { CountryCode } from "libphonenumber-js";

export type PaisTelefone = {
  codigo: CountryCode;
  nome: string;
  prefixo: string;
  label: string;
};

const cachePaises = new Map<string, PaisTelefone[]>();

function textoTelefone(valor: unknown) {
  return String(valor ?? "").trim();
}

function somenteDigitos(valor: unknown) {
  return textoTelefone(valor).replace(/\D/g, "");
}

function criarNomePais(
  codigo: CountryCode,
  locale: string
) {
  try {
    const nomes = new Intl.DisplayNames([locale], {
      type: "region",
    });

    return nomes.of(codigo) || codigo;
  } catch {
    return codigo;
  }
}

/**
 * Gera a lista mundial de países no idioma selecionado.
 *
 * Exemplos:
 * pt-BR: Estados Unidos
 * en-US: United States
 * es-ES: Estados Unidos
 * fr-FR: États-Unis
 */
export function obterPaisesTelefone(
  locale = "pt-BR"
): PaisTelefone[] {
  const localeNormalizado = String(locale || "pt-BR");

  const listaEmCache =
    cachePaises.get(localeNormalizado);

  if (listaEmCache) {
    return listaEmCache;
  }

  const lista = getCountries()
    .map((codigo) => {
      const nome = criarNomePais(
        codigo,
        localeNormalizado
      );

      const prefixo = `+${getCountryCallingCode(
        codigo
      )}`;

      return {
        codigo,
        nome,
        prefixo,
        label: `${nome} (${prefixo})`,
      };
    })
    .sort((a, b) =>
      a.nome.localeCompare(b.nome, localeNormalizado, {
        sensitivity: "base",
      })
    );

  cachePaises.set(localeNormalizado, lista);

  return lista;
}

/**
 * Compatibilidade temporária com páginas antigas.
 * Novos componentes devem usar obterPaisesTelefone(locale).
 */
export const PAISES_TELEFONE =
  obterPaisesTelefone("pt-BR");

export function obterPrefixoTelefone(
  pais: CountryCode
) {
  return `+${getCountryCallingCode(pais)}`;
}

/**
 * Detecta o país quando um telefone internacional
 * completo é colado no campo.
 */
export function detectarPaisTelefone(
  valor: unknown
): CountryCode | null {
  const texto = textoTelefone(valor);

  if (!texto.startsWith("+")) {
    return null;
  }

  const telefone =
    parsePhoneNumberFromString(texto);

  return telefone?.country ?? null;
}

/**
 * Formata apenas a parte nacional do telefone.
 * O prefixo internacional é exibido separadamente
 * pelo seletor de país.
 */
export function formatarTelefonePorPais(
  valor: unknown,
  pais: CountryCode
) {
  const texto = textoTelefone(valor);

  if (!texto) {
    return "";
  }

  if (texto.startsWith("+")) {
    const telefone =
      parsePhoneNumberFromString(texto);

    if (telefone) {
      return new AsYouType(
        telefone.country ?? pais
      ).input(telefone.nationalNumber);
    }
  }

  return new AsYouType(pais).input(
    somenteDigitos(texto)
  );
}

/**
 * Converte o telefone para o padrão internacional E.164.
 *
 * Exemplo:
 * país BR + telefone 11 98765-4321
 * resultado +5511987654321
 */
export function normalizarTelefoneE164(
  valor: unknown,
  pais: CountryCode
) {
  const texto = textoTelefone(valor);

  if (!texto) {
    return "";
  }

  const telefone = texto.startsWith("+")
    ? parsePhoneNumberFromString(texto)
    : parsePhoneNumberFromString(texto, pais);

  return telefone?.number ?? "";
}

export function telefoneValidoInternacional(
  valor: unknown,
  pais: CountryCode
) {
  const texto = textoTelefone(valor);

  if (!texto) {
    return false;
  }

  const telefone = texto.startsWith("+")
    ? parsePhoneNumberFromString(texto)
    : parsePhoneNumberFromString(texto, pais);

  return telefone?.isValid() === true;
}

export type TelefoneParaFormulario = {
  valor: string;
  pais: CountryCode;
  e164: string;
  valido: boolean;
};

/**
 * Prepara um telefone salvo no banco para ser exibido
 * no componente internacional.
 *
 * Aceita tanto números antigos nacionais quanto números
 * internacionais no padrão E.164.
 */
export function prepararTelefoneParaFormulario(
  valor: unknown,
  paisPadrao: CountryCode = "BR"
): TelefoneParaFormulario {
  const texto = textoTelefone(valor);

  if (!texto) {
    return {
      valor: "",
      pais: paisPadrao,
      e164: "",
      valido: false,
    };
  }

  const telefone = texto.startsWith("+")
    ? parsePhoneNumberFromString(texto)
    : parsePhoneNumberFromString(
      texto,
      paisPadrao
    );

  if (!telefone) {
    return {
      valor:
        formatarTelefonePorPais(
          texto,
          paisPadrao
        ),
      pais: paisPadrao,
      e164: "",
      valido: false,
    };
  }

  const paisDetectado =
    telefone.country ?? paisPadrao;

  return {
    valor: new AsYouType(
      paisDetectado
    ).input(
      telefone.nationalNumber
    ),

    pais: paisDetectado,
    e164: telefone.number,
    valido:
      telefone.isValid() === true,
  };
}

/**
 * Compatibilidade com páginas brasileiras antigas.
 * Estas funções serão mantidas durante a migração.
 */
export function normalizarTelefoneBR(
  valor: unknown
) {
  const texto = textoTelefone(valor);

  if (!texto) {
    return "";
  }

  if (texto.startsWith("+")) {
    const telefone =
      parsePhoneNumberFromString(texto);

    if (telefone?.country === "BR") {
      return String(telefone.nationalNumber);
    }
  }

  let numeros = somenteDigitos(texto);

  if (
    numeros.startsWith("55") &&
    (numeros.length === 12 ||
      numeros.length === 13)
  ) {
    numeros = numeros.slice(2);
  }

  return numeros.slice(0, 11);
}

export function formatarTelefoneBR(
  valor: unknown
) {
  return formatarTelefonePorPais(
    normalizarTelefoneBR(valor),
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