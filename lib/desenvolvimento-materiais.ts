export const MAX_ANEXOS_DESENVOLVIMENTO = 15;
export const MAX_LINKS_DESENVOLVIMENTO = 10;
const MB = 1024 * 1024;

export const TIPOS_ANEXO_DESENVOLVIMENTO: Readonly<Record<string, number>> = {
  "image/jpeg": 10 * MB,
  "image/png": 10 * MB,
  "image/webp": 10 * MB,
  "video/mp4": 100 * MB,
  "video/webm": 100 * MB,
  "application/pdf": 20 * MB,
};

export type AnexoDesenvolvimento = { id: number; nomeOriginal: string; mime: string };

export function exigeAutorizacaoImagem(mime: string) {
  return mime.startsWith("image/") || mime.startsWith("video/");
}

export function validarLinksDesenvolvimento(valor: unknown): string[] | null {
  if (!Array.isArray(valor) || valor.length > MAX_LINKS_DESENVOLVIMENTO) return null;
  const links: string[] = [];
  for (const item of valor) {
    if (typeof item !== "string" || item.length > 2048) return null;
    try {
      const url = new URL(item.trim());
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
      links.push(url.href);
    } catch {
      return null;
    }
  }
  return Array.from(new Set(links));
}
