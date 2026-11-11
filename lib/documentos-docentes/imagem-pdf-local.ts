const tiposImagemPdf = ["image/png", "image/jpeg", "image/webp"];
const limiteImagem = 5 * 1024 * 1024;

export async function lerImagemPdf(arquivo: File) {
  if (!tiposImagemPdf.includes(arquivo.type) || !arquivo.size || arquivo.size > limiteImagem) {
    throw new Error("IMAGEM_INVALIDA");
  }
  const leitor = new FileReader();
  const src = await new Promise<string>((resolve, reject) => {
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(arquivo);
  });
  const imagem = new Image();
  imagem.src = src;
  await imagem.decode();
  return { src, imagem };
}

export async function bytesImagemPdf(arquivo: File) {
  const { imagem } = await lerImagemPdf(arquivo);
  if (arquivo.type !== "image/webp") {
    return { bytes: await arquivo.arrayBuffer(), jpeg: arquivo.type === "image/jpeg" };
  }
  const canvas = document.createElement("canvas");
  canvas.width = imagem.naturalWidth;
  canvas.height = imagem.naturalHeight;
  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("IMAGEM_INVALIDA");
  contexto.drawImage(imagem, 0, 0);
  const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => {
    if (blob) resolve(blob);
    else reject(new Error("IMAGEM_INVALIDA"));
  }, "image/png"));
  return { bytes: await png.arrayBuffer(), jpeg: false };
}

export function dimensoesImagemPdf(largura: number, altura: number, limiteLargura: number, limiteAltura: number, solicitada?: number) {
  const naturalPt = largura * 0.75;
  const escala = Math.min((solicitada ?? naturalPt) / largura, limiteLargura / largura, limiteAltura / altura);
  return { width: largura * escala, height: altura * escala };
}
