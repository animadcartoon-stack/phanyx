/** Limite do arquivo original, também aplicado à autorização no armazenamento. */
export const LIMITE_LOGO_INSTITUCIONAL = 5 * 1024 * 1024;
export const TIPOS_LOGO_INSTITUCIONAL = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export type CodigoErroLogo = "invalidFormat" | "emptyFile" | "originalTooLarge" | "uploadError";

export class ErroArquivoLogo extends Error {
  constructor(public readonly codigo: CodigoErroLogo) {
    super(codigo);
    this.name = "ErroArquivoLogo";
  }
}

export function validarArquivoLogo(arquivo: { type: string; size: number }) {
  if (!TIPOS_LOGO_INSTITUCIONAL.includes(arquivo.type)) throw new ErroArquivoLogo("invalidFormat");
  if (!Number.isSafeInteger(arquivo.size) || arquivo.size <= 0) throw new ErroArquivoLogo("emptyFile");
  if (arquivo.size > LIMITE_LOGO_INSTITUCIONAL) throw new ErroArquivoLogo("originalTooLarge");
}

export function limparNomeLogo(nome: string) {
  return String(nome || "logo.png").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "").toLowerCase().slice(0, 120) || "logo.png";
}

export function caminhoLogoDaInstituicao(caminho: string, instituicaoId: number) {
  if (!Number.isSafeInteger(instituicaoId) || instituicaoId <= 0) return false;
  const prefixo = `instituicoes/${instituicaoId}/logos/`;
  if (!caminho.startsWith(prefixo)) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[a-z0-9][a-z0-9._-]{0,119}$/.test(caminho.slice(prefixo.length));
}
