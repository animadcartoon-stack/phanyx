import { upload } from "@vercel/blob/client";
import { ErroArquivoLogo, validarArquivoLogo } from "@/lib/logos-upload";

const UPLOAD_URL = "/api/admin/configuracoes/logos/upload-direto";

/** O arquivo não atravessa a função: somente os metadados e a autorização. */
export async function enviarLogoInstitucional(arquivo: File) {
  validarArquivoLogo(arquivo);
  try {
    const resposta = await fetch(UPLOAD_URL, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "logo.prepare-upload", nome: arquivo.name,
        mimeType: arquivo.type, tamanho: arquivo.size,
      }),
    });
    const preparacao = await resposta.json().catch(() => null);
    if (!resposta.ok || typeof preparacao?.pathname !== "string") throw new ErroArquivoLogo("uploadError");

    const blob = await upload(preparacao.pathname, arquivo, {
      access: "public", handleUploadUrl: UPLOAD_URL, contentType: arquivo.type,
      clientPayload: JSON.stringify({ mimeType: arquivo.type, tamanho: arquivo.size }),
    });
    return { arquivoUrl: blob.url, arquivoPath: blob.pathname, mimeType: arquivo.type };
  } catch {
    throw new ErroArquivoLogo("uploadError");
  }
}
