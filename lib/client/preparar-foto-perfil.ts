/** Mantem o limite funcional de 5 MB sem ultrapassar o teto de 4,5 MB da Vercel. */
export async function prepararFotoPerfil(file: File): Promise<File> {
  const MAX_ENTRADA = 5 * 1024 * 1024;
  const MAX_ENVIO = 4 * 1024 * 1024;
  if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
    throw new Error("Selecione uma fotografia PNG, JPG ou WebP.");
  }
  if (file.size > MAX_ENTRADA) throw new Error("A fotografia deve ter no maximo 5 MB.");
  if (file.size <= MAX_ENVIO) return file;
  // O canvas reduz apenas fotos maiores que a rota aceita; imagens pequenas sao preservadas.
  const imagem = await createImageBitmap(file);
  try {
    const escala = Math.min(1, 1280 / Math.max(imagem.width, imagem.height));
    const largura = Math.max(1, Math.round(imagem.width * escala));
    const altura = Math.max(1, Math.round(imagem.height * escala));
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("Não foi possível preparar a fotografia neste navegador.");
    contexto.drawImage(imagem, 0, 0, largura, altura);
    for (const qualidade of [0.85, 0.72, 0.58]) {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", qualidade));
      if (blob?.type === "image/webp" && blob.size > 0 && blob.size <= MAX_ENVIO) {
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
          type: "image/webp", lastModified: Date.now(),
        });
      }
    }
    throw new Error("Não foi possível reduzir esta fotografia. Escolha uma imagem menor.");
  } finally {
    imagem.close();
  }
}
