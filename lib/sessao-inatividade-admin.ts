import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";

export const COOKIE_EDITOR_CERTIFICADO = "phanyx_certificado_ativo";

const PERFIS_ADMIN = new Set([
  "ADMIN", "SUPER_ADMIN", "FUNCIONARIO", "SECRETARIA", "FINANCEIRO", "COORDENADOR", "SUPORTE", "GERENCIA",
]);

export function perfilPodeManterEditorCertificado(role: string) {
  return PERFIS_ADMIN.has(String(role).trim().toUpperCase());
}

/** Protecao curta, assinada e vinculada a sessao que abriu o editor. */
export function criarProtecaoEditorCertificado(referencia: string, segredo: string) {
  return jwt.sign({ referencia }, segredo, {
    expiresIn: 180,
    audience: "phanyx-certificado-editor",
    issuer: "phanyx",
    algorithm: "HS256",
  });
}

export function editorCertificadoProtegido(cookie: string | undefined, referencia: string, segredo: string | undefined) {
  if (!cookie || !segredo) return false;
  try {
    const dados = jwt.verify(cookie, segredo, {
      audience: "phanyx-certificado-editor",
      issuer: "phanyx",
      algorithms: ["HS256"],
    }) as { referencia?: string };
    return dados.referencia === referencia;
  } catch { return false; }
}

/** Referência de comparação; o token httpOnly nunca é entregue ao navegador. */
export function referenciaTokenSessao(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function identificarSessaoAdmin(token: string | undefined, segredo: string | undefined) {
  if (!token || !segredo) return null;
  try {
    // Expiração não concede acesso: permite apenas encerrar o próprio cookie já vencido.
    const dados = jwt.verify(token, segredo, { ignoreExpiration: true }) as {
      id?: number | string; role?: string; portal?: string;
    };
    const id = Number(dados.id), role = String(dados.role || "").trim().toUpperCase();
    const portal = String(dados.portal || "").trim().toLowerCase();
    if (!Number.isSafeInteger(id) || id <= 0 || !PERFIS_ADMIN.has(role) || (portal && portal !== "admin")) return null;
    return { id, referencia: referenciaTokenSessao(token) };
  } catch { return null; }
}
