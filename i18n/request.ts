import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import {
  COOKIE_LOCALE_PHANYX,
  LOCALE_PADRAO,
  localeEhSuportado,
  type LocalePhanyx,
} from "./config";

async function carregarMensagens(
  locale: LocalePhanyx
) {
  switch (locale) {
    case "pt-PT":
      return (
        await import("../messages/pt-PT.json")
      ).default;

    case "en-US":
      return (
        await import("../messages/en-US.json")
      ).default;

    case "es-ES":
      return (
        await import("../messages/es-ES.json")
      ).default;

    case "fr-FR":
      return (
        await import("../messages/fr-FR.json")
      ).default;

    case "pt-BR":
    default:
      return (
        await import("../messages/pt-BR.json")
      ).default;
  }
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requestHeaders = await headers();

  const localeSalvo = cookieStore.get(
    COOKIE_LOCALE_PHANYX
  )?.value;

  const localeDaPagina = requestHeaders.get("x-phanyx-public-locale");
  const inicioEmIngles = requestHeaders.get("x-phanyx-portal-default-en") === "1";
  const locale = localeEhSuportado(localeDaPagina)
    ? localeDaPagina
    : localeEhSuportado(localeSalvo)
      ? localeSalvo
      : inicioEmIngles ? "en-US" : LOCALE_PADRAO;

  return {
    locale,
    messages: await carregarMensagens(locale),
  };
});
