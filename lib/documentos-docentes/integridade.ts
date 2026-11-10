import { createHash } from "node:crypto";

type VersaoAssinavel = { numero: number; modeloSnapshot: string; campos: unknown };
type AnexoAssinavel = { id: number; versao: number; nomeOriginal: string; mime: string; tamanho: number; sha256: string | null };

// A assinatura vincula o snapshot de um documento e os anexos já incorporados até essa versão.
// Campos são serializados em ordem fixa, independentes da ordem de chaves do JSON.
export function hashVersaoDocente(documentoId: number, versao: VersaoAssinavel, anexos: AnexoAssinavel[]): string {
  const campos = versao.campos && typeof versao.campos === "object" && !Array.isArray(versao.campos)
    ? Object.entries(versao.campos as Record<string, unknown>)
        .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    : [];
  const arquivos = anexos.filter(a => a.versao <= versao.numero)
    .sort((a,b) => a.id - b.id)
    .map(a => [a.id, a.versao, a.nomeOriginal, a.mime, a.tamanho, a.sha256 || ""]);
  const conteudo = JSON.stringify({ modelo: "PHANYX_DOCENTE_V1", documentoId, versao: versao.numero, html: versao.modeloSnapshot, campos, arquivos });
  return createHash("sha256").update(conteudo, "utf8").digest("hex");
}

export function escaparHtmlDocente(valor: string): string {
  return String(valor).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
