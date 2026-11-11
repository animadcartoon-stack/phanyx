import { createHash } from "node:crypto";

/** Identifica EXATAMENTE o plano salvo, inclusive revisões e data de registro.
 * Não autentica assinaturas: apenas impede reutilização de termos de outros planos.
 */
function ordenar(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenar);
  if (valor && typeof valor === "object") {
    const obj = valor as Record<string, unknown>;
    return Object.fromEntries(Object.keys(obj).sort().map(chave => [chave, ordenar(obj[chave])]));
  }
  return valor;
}
export function referenciaPlanoReatribuicao(plano: unknown): string | null {
  if (!plano || typeof plano !== "object" || Array.isArray(plano)) return null;
  const p = plano as Record<string, unknown>;
  if (p.finalidade !== "PLANO_ACADEMICO_SEM_EXECUCAO" ||
      typeof p.registradoEm !== "string" || !Number.isFinite(Date.parse(p.registradoEm)) ||
      !Array.isArray(p.turmaIds) || p.turmaIds.length === 0 ||
      typeof p.versaoOfertas !== "string" || !/^[0-9a-f]{64}$/i.test(p.versaoOfertas) ||
      !p.calculo || typeof p.calculo !== "object") return null;
  return "PLANO_SHA256:" + createHash("sha256")
    .update(JSON.stringify(ordenar(plano))).digest("hex");
}

export function sha256Pdf(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
export function descricaoPdf(hash: string): string {
  return `PDF_SHA256:${hash}; arquivo anexado pelo administrador; assinaturas devem ser conferidas.`;
}
export function conferirHashPdf(descricao: string | null | undefined, bytes: Uint8Array): boolean {
  return typeof descricao === "string" &&
    descricao.startsWith(`PDF_SHA256:${sha256Pdf(bytes)};`);
}
