export const LOCALES_SUPORTADOS = [
  "pt-BR",
  "pt-PT",
  "en-US",
  "es-ES",
  "fr-FR",
] as const;

export type LocalePhanyx =
  (typeof LOCALES_SUPORTADOS)[number];

export const LOCALE_PADRAO: LocalePhanyx = "pt-BR";

export const COOKIE_LOCALE_PHANYX =
  "PHANYX_LOCALE";

export const NOMES_DOS_LOCALES: Record<
  LocalePhanyx,
  string
> = {
  "pt-BR": "Português (Brasil)",
  "pt-PT": "Português (Portugal)",
  "en-US": "English (United States)",
  "es-ES": "Español (España)",
  "fr-FR": "Français (France)",
};

export function localeEhSuportado(
  valor: string | null | undefined
): valor is LocalePhanyx {
  return LOCALES_SUPORTADOS.includes(
    valor as LocalePhanyx
  );
}