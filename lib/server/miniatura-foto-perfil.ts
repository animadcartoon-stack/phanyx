import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";

const MAX_BYTES = 50 * 1024 * 1024;
const MAX_PIXELS = 600_000_000;
export const TAMANHO_FOTO_PERFIL = 512;
export const MAX_BYTES_FOTO_PERFIL_EXIBICAO = 2 * 1024 * 1024;

export function chaveMiniaturaPerfil(instituicaoId: number, funcionarioId: number, foto: string) {
  const hash = createHash("sha256").update(foto).digest("hex");
  return `miniaturas-perfil/v1/${instituicaoId}/${funcionarioId}/${hash}.webp`;
}

/** Somente os provedores públicos de arquivos já utilizados pelo PHANYX. */
export function origemFotoPerfilPermitida(foto: string, baseR2 = process.env.R2_PUBLIC_URL) {
  try {
    const url = new URL(foto);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    if (/^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i.test(url.hostname)) return true;
    if (!baseR2) return false;
    const base = new URL(baseR2);
    const prefixo = base.pathname.replace(/\/$/, "") + "/";
    return url.origin === base.origin && url.pathname.startsWith(prefixo);
  } catch { return false; }
}

export async function baixarFotoPerfil(foto: string) {
  if (!origemFotoPerfilPermitida(foto)) throw new Error("Origem de foto não permitida");
  const resposta = await fetch(foto, {
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15_000),
    headers: { "User-Agent": "PHANYX-Image/1.0" },
  });
  if (!resposta.ok || !resposta.body) throw new Error("Foto indisponível");
  if (Number(resposta.headers.get("content-length")) > MAX_BYTES) {
    await resposta.body.cancel();
    throw new Error("Foto acima do limite de processamento");
  }
  const leitor = resposta.body.getReader();
  const partes: Uint8Array[] = [];
  let tamanho = 0;
  try {
    while (true) {
      const parte = await leitor.read();
      if (parte.done) break;
      tamanho += parte.value.byteLength;
      if (tamanho > MAX_BYTES) {
        await leitor.cancel();
        throw new Error("Foto acima do limite de processamento");
      }
      partes.push(parte.value);
    }
  } finally { leitor.releaseLock(); }
  return Buffer.concat(partes);
}

export async function gerarMiniaturaPerfil(original: Buffer) {
  if (!original.length || original.length > MAX_BYTES) throw new Error("Foto inválida");
  const jpeg = original[0] === 0xff && original[1] === 0xd8 && original[2] === 0xff;
  const png = original.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp = original.subarray(0, 4).toString() === "RIFF" && original.subarray(8, 12).toString() === "WEBP";
  if (!jpeg && !png && !webp) throw new Error("Formato de foto inválido");
  // JPEG usa redução durante a leitura. O limite maior atende arquivos legados
  // de impressão; outros formatos grandes não são expandidos em memória.
  const imagem = sharp(original, { limitInputPixels: MAX_PIXELS, sequentialRead: true, animated: true });
  const meta = await imagem.metadata();
  if (!meta.width || !meta.height || !["jpeg", "png", "webp"].includes(meta.format || "")) {
    throw new Error("Formato de foto inválido");
  }
  if (meta.format !== "jpeg" && meta.width * meta.height > 40_000_000) {
    throw new Error("Dimensões de foto acima do limite de processamento");
  }
  const miniatura = await imagem.rotate().resize({
    width: TAMANHO_FOTO_PERFIL, height: TAMANHO_FOTO_PERFIL,
    fit: "inside", withoutEnlargement: true, fastShrinkOnLoad: true,
  }).webp({ quality: 85 }).timeout({ seconds: 15 }).toBuffer();
  if (miniatura.length > MAX_BYTES_FOTO_PERFIL_EXIBICAO) throw new Error("Foto de exibição acima de 2 MB");
  return miniatura;
}
