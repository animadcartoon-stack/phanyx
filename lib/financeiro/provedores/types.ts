export type AmbienteIntegracaoFinanceira =
  | "PRODUCAO"
  | "HOMOLOGACAO"
  | "SANDBOX";

export type ConfiguracaoProvedorFinanceiro = {
  id: number;
  instituicaoId: number;
  provedor: string;
  ambienteIntegracao: string;
  credenciaisCriptografadas: string | null;
};

export type CriarClienteFinanceiroInput = {
  nome: string;
  email: string;
  cpfCnpj?: string | null;
  telefone?: string | null;
  referenciaExterna: string;
};

export type CriarClienteFinanceiroResult = {
  clienteExternoId: string;
  metadata?: Record<string, unknown>;
};

export type CriarBoletoFinanceiroInput = {
  clienteExternoId: string;
  valor: number;
  vencimento: string;
  descricao: string;
  referenciaExterna: string;
};

export type CriarBoletoFinanceiroResult = {
  cobrancaExternaId: string;
  statusExterno: string;
  invoiceUrl?: string | null;
  boletoUrl?: string | null;
  linhaDigitavel?: string | null;
  codigoBarras?: string | null;
  metadata?: Record<string, unknown>;
};

export interface ProvedorFinanceiro {
  readonly nome: string;

  buscarClientePorReferencia(
    referenciaExterna: string
  ): Promise<CriarClienteFinanceiroResult | null>;

  criarCliente(
    input: CriarClienteFinanceiroInput
  ): Promise<CriarClienteFinanceiroResult>;

  buscarBoletoPorReferencia(
    referenciaExterna: string
  ): Promise<CriarBoletoFinanceiroResult | null>;

  criarBoleto(
    input: CriarBoletoFinanceiroInput
  ): Promise<CriarBoletoFinanceiroResult>;
}
