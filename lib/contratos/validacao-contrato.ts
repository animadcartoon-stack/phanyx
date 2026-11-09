const variaveisPreenchidasNaEmissao = new Set([
  "codigoValidacao",
  "urlValidacao",
  "assinaturaDiretor",
  "blocoAssinaturaDiretor",
  "logoInstituicao",
]);

export class ErroContratoMatricula extends Error {
  readonly codigo = "CONTRATO_PENDENTE";
  readonly status = 422;
}

export function validarVariaveisContrato(conteudo: string, antesDaEmissao = false) {
  const variaveis = [...new Set(
    Array.from(conteudo.matchAll(/{{\s*([^{}]+?)\s*}}/g), resultado => resultado[1].trim()),
  )].filter(variavel => variavel && !(antesDaEmissao && variaveisPreenchidasNaEmissao.has(variavel)));
  if (variaveis.length) {
    const lista = variaveis.map(variavel => `{{${variavel}}}`).join(", ");
    throw new ErroContratoMatricula(`Revise o modelo do contrato. Variáveis não preenchidas: ${lista}.`);
  }
}
