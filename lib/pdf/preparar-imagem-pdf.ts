import sharp from "sharp";

// O tamanho comprimido de um PNG não representa a memória usada ao abri-lo.
// Logos legadas podem ultrapassar 500 MP, embora tenham poucos MB em disco.
export const LIMITE_BYTES_IMAGEM_PDF = 20 * 1024 * 1024;
const LIMITE_PIXELS_ORIGINAIS = 600_000_000;
const LADO_MAXIMO_PDF = 2048;

export async function lerImagemPdfLimitada(resposta: Response): Promise<Buffer> {
  const tamanho = Number(resposta.headers.get("content-length"));
  if (Number.isFinite(tamanho) && tamanho > LIMITE_BYTES_IMAGEM_PDF) {
    await resposta.body?.cancel();
    throw new Error("Imagem acima do limite de tamanho para o PDF.");
  }
  if (!resposta.body) throw new Error("Imagem vazia para o PDF.");
  const leitor = resposta.body.getReader();
  const partes: Buffer[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await leitor.read();
      if (done) break;
      total += value.byteLength;
      if (total > LIMITE_BYTES_IMAGEM_PDF) {
        await leitor.cancel();
        throw new Error("Imagem acima do limite de tamanho para o PDF.");
      }
      partes.push(Buffer.from(value));
    }
  } finally {
    leitor.releaseLock();
  }
  return Buffer.concat(partes, total);
}

export async function prepararImagemPdf(original: Uint8Array): Promise<{
  bytes: Buffer;
  formato: "png" | "jpeg";
}> {
  if (!original.byteLength || original.byteLength > LIMITE_BYTES_IMAGEM_PDF) {
    throw new Error("Imagem vazia ou acima do limite de tamanho para o PDF.");
  }
  const bytes = Buffer.from(original);
  const imagem = sharp(bytes, {
    limitInputPixels: LIMITE_PIXELS_ORIGINAIS,
    sequentialRead: true,
  });
  const info = await imagem.metadata();
  if (!["png", "jpeg"].includes(info.format) || !info.width || !info.height) {
    throw new Error("Formato de imagem incompatível com o PDF.");
  }
  if (info.width <= LADO_MAXIMO_PDF && info.height <= LADO_MAXIMO_PDF) {
    return { bytes, formato: info.format as "png" | "jpeg" };
  }
  // libvips lê a imagem sequencialmente e reduz ANTES de o pdf-lib descompactar
  // os pixels. O original e a proporção/transparência não são alterados no cadastro.
  const reduzida = await imagem
    .rotate()
    .resize({ width: LADO_MAXIMO_PDF, height: LADO_MAXIMO_PDF, fit: "inside", withoutEnlargement: true })
    .png()
    .timeout({ seconds: 60 })
    .toBuffer();
  return { bytes: reduzida, formato: "png" };
}
