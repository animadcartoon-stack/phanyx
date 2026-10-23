import { centavos, ErroModalidades, normalizarPrecosComboPorQuantidade, type PrecoComboPorQuantidade } from "./combos";

export function camposComboCurso(body: Record<string, unknown>) {
  const dados: {
    participaCombo?: boolean;
    precosComboPorQuantidade?: PrecoComboPorQuantidade[];
    valorMensalidadeCombo?: number | null;
  } = {};
  if (Object.prototype.hasOwnProperty.call(body, "participaCombo")) {
    if (typeof body.participaCombo !== "boolean")
      throw new ErroModalidades("REGRA_INVALIDA");
    dados.participaCombo = body.participaCombo;
  }
  if (Object.prototype.hasOwnProperty.call(body, "valorMensalidadeCombo")) {
    dados.valorMensalidadeCombo =
      body.valorMensalidadeCombo === null || body.valorMensalidadeCombo === ""
        ? null
        : centavos(body.valorMensalidadeCombo) / 100;
  }
  if (Object.prototype.hasOwnProperty.call(body, "precosComboPorQuantidade")) {
    dados.precosComboPorQuantidade = normalizarPrecosComboPorQuantidade(body.precosComboPorQuantidade);
  }
  return dados;
}
