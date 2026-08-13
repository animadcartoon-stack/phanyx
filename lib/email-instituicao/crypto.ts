import {
  criptografarCredencial,
  descriptografarCredencial,
} from "@/lib/crypto-credenciais";

export function criptografarSenhaEmail(
  senha: string
): string {
  return criptografarCredencial(senha);
}

export function descriptografarSenhaEmail(
  senhaCriptografada: string
): string {
  return descriptografarCredencial(
    senhaCriptografada
  );
}