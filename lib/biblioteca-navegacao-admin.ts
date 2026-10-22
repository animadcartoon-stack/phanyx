export const VISAO_GERAL_BIBLIOTECA = "/admin/biblioteca";
export const CONTRATACAO_BIBLIOTECA = "/admin/biblioteca/contratacao";

const CODIGOS_CONTRATACAO = new Set([
  "MODULO_NAO_CONTRATADO", "MODULO_INDISPONIVEL", "TESTE_GRATIS_EXPIRADO",
]);

export function decidirNavegacaoBiblioteca(status: number, corpo: unknown) {
  const dados = corpo && typeof corpo === "object" ? corpo as Record<string, unknown> : {};
  if (status === 200 && dados.disponivel === true && dados.acessoAdministrativo === true) return "permitido";
  if (status === 401) return "login";
  if (status === 403 && typeof dados.codigo === "string" && CODIGOS_CONTRATACAO.has(dados.codigo)) return "planos";
  if (status === 403) return "negado";
  return "erro";
}
