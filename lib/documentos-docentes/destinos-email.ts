export type TipoDestinoDocente = "EMAIL" | "USUARIO" | "DEPARTAMENTO";

export function emailDestinoDocente(valor: unknown) {
  if (typeof valor !== "string") return null;
  const email = valor.trim();
  return email.length <= 254 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(email) ? email : null;
}

export function idDestinoDocente(valor: unknown) {
  return typeof valor === "number" && Number.isSafeInteger(valor) && valor > 0 && valor <= 2147483647 ? valor : null;
}

export const eventosEmailDocente = ["EMAIL_EM_ENVIO", "EMAIL_ENVIADO", "EMAIL_SEM_CONFIRMACAO"] as const;

export type ResultadoEmailDocente =
  | { estado: "aceito"; aceitos: number; recusados: number }
  | { estado: "processando" | "incerto" };

export function lerRegistroEmailDocente(descricao: string | null) {
  if (!descricao?.startsWith("req:")) return null;
  try {
    return JSON.parse(descricao.slice(descricao.indexOf("|") + 1)) as {
      destino: string;
      resultado: ResultadoEmailDocente;
    };
  } catch {
    return null;
  }
}
