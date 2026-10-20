import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { verificarCredencialEditor } from "@/lib/credencial-editor-certificado";

const PERFIS_ADMIN = new Set([
  "ADMIN", "SUPER_ADMIN", "FUNCIONARIO", "SECRETARIA", "FINANCEIRO", "COORDENADOR", "SUPORTE", "GERENCIA",
]);

export function perfilPodeManterEditorCertificado(role: string) {
  return PERFIS_ADMIN.has(String(role).trim().toUpperCase());
}

/** Referência de comparação; o token httpOnly nunca é entregue ao navegador. */
export function referenciaTokenSessao(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function identificarSessaoAdmin(token: string | undefined, segredo: string | undefined) {
  if (!token || !segredo) return null;
  try {
    // Expiração não concede acesso: permite apenas encerrar o próprio cookie já vencido.
    let dados: { id?: number | string; role?: string; portal?: string; escopo?: string; referenciaSessaoAdmin?: string };
    try { dados = jwt.verify(token, segredo, { ignoreExpiration: true }) as typeof dados; }
    catch { dados = verificarCredencialEditor(token, segredo, true) as typeof dados; }
    const id = Number(dados.id), role = String(dados.role || "").trim().toUpperCase();
    const portal = String(dados.portal || "").trim().toLowerCase();
    if (!Number.isSafeInteger(id) || id <= 0 || !PERFIS_ADMIN.has(role) || (portal && portal !== "admin")) return null;
    return { id, referencia: dados.escopo === "editor-certificado" ? dados.referenciaSessaoAdmin! : referenciaTokenSessao(token) };
  } catch { return null; }
}
