import "server-only";

import type {
  ConfiguracaoProvedorFinanceiro,
  ProvedorFinanceiro,
} from "./types";

import {
  criarProvedorAsaas,
} from "./asaas";

export function obterProvedorFinanceiro(
  configuracao: ConfiguracaoProvedorFinanceiro
): ProvedorFinanceiro {
  const provedor = String(
    configuracao.provedor || ""
  )
    .trim()
    .toUpperCase();

  switch (provedor) {
    case "ASAAS":
      return criarProvedorAsaas(
        configuracao
      );

    default:
      throw new Error(
        `Provedor financeiro ainda não suportado: ${provedor || "NÃO INFORMADO"}.`
      );
  }
}

export type {
  ConfiguracaoProvedorFinanceiro,
  CriarBoletoFinanceiroInput,
  CriarBoletoFinanceiroResult,
  CriarClienteFinanceiroInput,
  CriarClienteFinanceiroResult,
  ProvedorFinanceiro,
} from "./types";
