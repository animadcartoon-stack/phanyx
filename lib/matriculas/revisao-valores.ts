import { descontoPontualidadeEmReais, faixasDescontoPontualidade } from "@/lib/financeiro/desconto-pontualidade";
import { centavos, ErroModalidades } from "./combos";

export class ErroRevisaoValores extends Error {
  constructor(message: string, readonly status = 409) {
    super(message);
  }
}

export function lerValoresRevisao(body: Record<string, unknown>) {
  const motivo = typeof body.motivo === "string" ? body.motivo.trim() : "";
  if (motivo.length < 3 || motivo.length > 1000) {
    throw new ErroRevisaoValores("Informe o motivo da alteração, com 3 a 1000 caracteres.", 400);
  }
  try {
    const taxa = centavos(body.valorMatricula);
    const mensalidade = centavos(body.valorMensalidade);
    const bolsa = centavos(body.bolsaPercentual);
    if (bolsa > 10000) throw new ErroModalidades("VALOR_INVALIDO");
    return { taxa, mensalidade, bolsa, motivo };
  } catch (erro) {
    if (!(erro instanceof ErroModalidades)) throw erro;
    throw new ErroRevisaoValores("Informe valores com até duas casas decimais e uma bolsa entre 0% e 100%.", 400);
  }
}

export type ValoresMatricula = Pick<ReturnType<typeof lerValoresRevisao>, "taxa" | "mensalidade" | "bolsa">;

export function calcularValoresRevisao(
  valores: ValoresMatricula,
  taxaSeparadaOriginal: number | null,
  descontoPontualidade: unknown,
) {
  const { taxa, mensalidade, bolsa } = valores;
  const liquida = Math.round(mensalidade * (10000 - bolsa) / 10000);
  const antecipacao = taxaSeparadaOriginal === null ? 0 : Math.max(0, taxa - taxaSeparadaOriginal);
  if (antecipacao > 0) {
    const faixas = faixasDescontoPontualidade(descontoPontualidade);
    const desconto = Math.max(faixas.antecipado?.percentual ?? 0, faixas.vencimento?.percentual ?? 0);
    const descontoCentavos = Math.round(descontoPontualidadeEmReais(liquida / 100, desconto) * 100);
    if (antecipacao >= liquida - descontoCentavos) {
      throw new ErroRevisaoValores("A antecipação precisa ser menor que a primeira parcela após bolsa e pontualidade.");
    }
  }
  return { ...valores, liquida, antecipacao, taxaSeparada: taxa - antecipacao };
}
