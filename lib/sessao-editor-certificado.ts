// Modulo compativel com Edge: nenhuma dependencia de Node ou de banco.
export const COOKIE_SESSAO_EDITOR_CERTIFICADO = "phanyx_editor_certificado";

/** O cookie do editor nunca autentica outras paginas ou operacoes do Admin. */
export function requisicaoPermitidaAoEditorCertificado(caminho: string, metodo: string) {
  const path = caminho.replace(/\/+$/, "") || "/";
  const method = metodo.toUpperCase();
  const leitura = method === "GET" || method === "HEAD";

  if (path === "/admin/configuracoes/certificado") return leitura;
  if (["/api/admin/plano", "/api/admin/configuracoes/instituicao"].includes(path)) return leitura;
  if (["/api/upload", "/api/admin/configuracoes/certificado/upload", "/api/admin/configuracoes/certificado/sessao"].includes(path)) return method === "POST";
  if (/^\/api\/admin\/certificado-modelos\/[1-9]\d*\/publicar$/.test(path)) return method === "POST";
  if (/^\/api\/admin\/certificado-modelos\/[1-9]\d*\/rascunho$/.test(path)) return ["GET", "HEAD", "PUT", "PATCH"].includes(method);
  if (["/api/admin/configuracoes/certificado", "/api/admin/certificado-campos", "/api/admin/certificado-modelos"].includes(path) ||
      /^\/api\/admin\/certificado-modelos\/[1-9]\d*$/.test(path)) {
    return ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"].includes(method);
  }
  return false;
}
