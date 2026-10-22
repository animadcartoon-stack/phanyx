// Keep multipart requests comfortably below the hosting provider's body limit.
export const LIMITE_LOGO_ORIGINAL = 5 * 1024 * 1024;
export const LIMITE_LOGO_ENVIO = 3 * 1024 * 1024;
const TIPOS_LOGO = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export class ErroPreparacaoLogo extends Error {
  constructor(public readonly codigo: "invalidFormat" | "emptyFile" | "originalTooLarge" | "prepareError" | "payloadTooLarge") {
    super(codigo);
    this.name = "ErroPreparacaoLogo";
  }
}

export async function prepararLogoParaUpload(file: File): Promise<File> {
  if (!TIPOS_LOGO.includes(file.type)) throw new ErroPreparacaoLogo("invalidFormat");
  if (!file.size) throw new ErroPreparacaoLogo("emptyFile");
  if (file.size > LIMITE_LOGO_ORIGINAL) throw new ErroPreparacaoLogo("originalTooLarge");
  if (file.size <= LIMITE_LOGO_ENVIO) return file;

  const url = URL.createObjectURL(file);
  try {
    const imagem = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new ErroPreparacaoLogo("prepareError"));
      img.src = url;
    });
    const largura = imagem.naturalWidth;
    const altura = imagem.naturalHeight;
    if (!largura || !altura) throw new ErroPreparacaoLogo("prepareError");
    let escala = Math.min(1, 2048 / Math.max(largura, altura));
    const canvas = document.createElement("canvas");
    const contexto = canvas.getContext("2d");
    if (!contexto) throw new ErroPreparacaoLogo("prepareError");

    for (let tentativa = 0; tentativa < 8; tentativa++) {
      canvas.width = Math.max(1, Math.round(largura * escala));
      canvas.height = Math.max(1, Math.round(altura * escala));
      contexto.clearRect(0, 0, canvas.width, canvas.height);
      contexto.imageSmoothingEnabled = true;
      contexto.imageSmoothingQuality = "high";
      contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
      // PNG preserves transparency without introducing a background color.
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((resultado) => {
          if (resultado?.size && resultado.type === "image/png") resolve(resultado);
          else reject(new ErroPreparacaoLogo("prepareError"));
        }, "image/png");
      });
      if (blob.size <= LIMITE_LOGO_ENVIO) {
        return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.png`, {
          type: "image/png",
          lastModified: file.lastModified,
        });
      }
      escala *= 0.75;
    }
    throw new ErroPreparacaoLogo("payloadTooLarge");
  } catch (error) {
    if (error instanceof ErroPreparacaoLogo) throw error;
    throw new ErroPreparacaoLogo("prepareError");
  } finally {
    URL.revokeObjectURL(url);
  }
}
