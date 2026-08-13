import {
  criptografarCredencial,
  descriptografarCredencial,
} from "@/lib/crypto-credenciais";

export function criptografarTokenWhatsapp(
  valor: string
): string {
  return criptografarCredencial(valor);
}

export function descriptografarTokenWhatsapp(
  valorCriptografado: string
): string {
  return descriptografarCredencial(
    valorCriptografado
  );
}