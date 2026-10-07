import "server-only";

import {
  descriptografarCredencial,
} from "@/lib/crypto-credenciais";

import type {
  ConfiguracaoProvedorFinanceiro,
  CriarBoletoFinanceiroInput,
  CriarBoletoFinanceiroResult,
  CriarClienteFinanceiroInput,
  CriarClienteFinanceiroResult,
  ProvedorFinanceiro,
} from "./types";

type CredenciaisAsaas = {
  apiKey: string;
  baseUrl?: string;
};

type AsaasCustomerResponse = {
  id: string;
  name?: string;
  email?: string;
};

type AsaasPaymentResponse = {
  id: string;
  customer?: string;
  billingType?: string;
  value?: number;
  status?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  externalReference?: string;
};

type AsaasIdentificationFieldResponse = {
  identificationField?: string;
  barCode?: string;
  nossoNumero?: string;
};

function somenteNumeros(
  valor: string | null | undefined
) {
  return String(valor || "")
    .replace(/\D/g, "");
}

function obterCredenciais(
  configuracao: ConfiguracaoProvedorFinanceiro
): CredenciaisAsaas {
  /*
   * PHANYX_LEGACY_IBE_ASAAS_ENV
   *
   * A IBE já possui integração Asaas de produção
   * baseada em variáveis de ambiente da Vercel.
   *
   * Para preservar compatibilidade com esse fluxo
   * legado sem compartilhar a credencial entre
   * outras instituições, somente a instituição
   * identificada por IBE_INSTITUICAO_ID pode usar
   * ASAAS_API_KEY como credencial do provedor.
   *
   * Demais instituições continuam usando apenas
   * suas próprias credenciais criptografadas em
   * ContaFinanceiraInstituicao.
   */
  const ibeInstituicaoId = Number(
    process.env.IBE_INSTITUICAO_ID || 0
  );

  const apiKeyLegadaIbe = String(
    process.env.ASAAS_API_KEY || ""
  ).trim();

  if (
    ibeInstituicaoId > 0 &&
    configuracao.instituicaoId ===
      ibeInstituicaoId &&
    apiKeyLegadaIbe
  ) {
    return {
      apiKey: apiKeyLegadaIbe,
    };
  }

  if (!configuracao.credenciaisCriptografadas) {
    throw new Error(
      "Credenciais do Asaas não configuradas."
    );
  }

  const descriptografada =
    descriptografarCredencial(
      configuracao.credenciaisCriptografadas
    ).trim();

  if (!descriptografada) {
    throw new Error(
      "Credenciais do Asaas vazias."
    );
  }

  /*
   * Aceitamos dois formatos:
   *
   * 1. objeto:
   *    { "apiKey": "$aact_..." }
   *
   * 2. token puro:
   *    $aact_...
   *
   * Isso facilita migração de configurações antigas,
   * sem expor a credencial para o navegador.
   */
  try {
    const objeto = JSON.parse(
      descriptografada
    );

    const apiKey = String(
      objeto?.apiKey ||
      objeto?.accessToken ||
      objeto?.token ||
      ""
    ).trim();

    const baseUrl = String(
      objeto?.baseUrl || ""
    ).trim();

    if (!apiKey) {
      throw new Error(
        "API key do Asaas ausente."
      );
    }

    return {
      apiKey,
      baseUrl:
        baseUrl || undefined,
    };
  } catch (error) {
    if (
      error instanceof SyntaxError
    ) {
      return {
        apiKey: descriptografada,
      };
    }

    throw error;
  }
}

function obterBaseUrl(
  configuracao: ConfiguracaoProvedorFinanceiro,
  credenciais: CredenciaisAsaas
) {
  if (credenciais.baseUrl) {
    if (
      !credenciais.baseUrl.startsWith(
        "https://"
      )
    ) {
      throw new Error(
        "URL da API Asaas inválida."
      );
    }

    return credenciais.baseUrl
      .replace(/\/+$/, "");
  }

  const ambiente = String(
    configuracao.ambienteIntegracao ||
      "PRODUCAO"
  )
    .trim()
    .toUpperCase();

  if (ambiente === "PRODUCAO") {
    return "https://api.asaas.com/v3";
  }

  return "https://api-sandbox.asaas.com/v3";
}

async function requisicaoAsaas<T>(
  configuracao: ConfiguracaoProvedorFinanceiro,
  path: string,
  init?: RequestInit
): Promise<T> {
  const credenciais =
    obterCredenciais(configuracao);

  const baseUrl =
    obterBaseUrl(
      configuracao,
      credenciais
    );

  const resposta = await fetch(
    `${baseUrl}${path}`,
    {
      ...init,

      headers: {
        "Content-Type":
          "application/json",

        "User-Agent":
          "PHANYX",

        access_token:
          credenciais.apiKey,

        ...(init?.headers || {}),
      },

      cache: "no-store",
    }
  );

  const dados =
    await resposta
      .json()
      .catch(() => null);

  if (!resposta.ok) {
    console.error(
      "Erro no provedor Asaas:",
      {
        path,
        status:
          resposta.status,

        /*
         * Não registrar API key.
         */
        resposta:
          dados,
      }
    );

    throw new Error(
      dados?.errors?.[0]?.description ||
      dados?.message ||
      `Erro HTTP ${resposta.status} no Asaas.`
    );
  }

  return dados as T;
}

export function criarProvedorAsaas(
  configuracao: ConfiguracaoProvedorFinanceiro
): ProvedorFinanceiro {
  return {
    nome: "ASAAS",

    async buscarClientePorReferencia(
      referenciaExterna: string
    ): Promise<CriarClienteFinanceiroResult | null> {
      const referencia = String(
        referenciaExterna || ""
      ).trim();

      if (!referencia) {
        throw new Error(
          "Referência externa do cliente não informada."
        );
      }

      const lista = await requisicaoAsaas<{
        data?: AsaasCustomerResponse[];
      }>(
        configuracao,
        `/customers?externalReference=${encodeURIComponent(
          referencia
        )}&limit=1`,
        {
          method: "GET",
        }
      );

      const cliente =
        lista?.data?.[0];

      if (!cliente?.id) {
        return null;
      }

      return {
        clienteExternoId:
          cliente.id,

        metadata: {
          recuperadoPorReferencia:
            true,

          name:
            cliente.name,

          email:
            cliente.email,
        },
      };
    },

    async criarCliente(
      input: CriarClienteFinanceiroInput
    ): Promise<CriarClienteFinanceiroResult> {
      const cpfCnpj =
        somenteNumeros(
          input.cpfCnpj
        );

      const telefone =
        somenteNumeros(
          input.telefone
        );

      const cliente =
        await requisicaoAsaas<AsaasCustomerResponse>(
          configuracao,
          "/customers",
          {
            method: "POST",

            body: JSON.stringify({
              name:
                input.nome,

              email:
                input.email,

              cpfCnpj:
                cpfCnpj ||
                undefined,

              mobilePhone:
                telefone ||
                undefined,

              externalReference:
                input.referenciaExterna,
            }),
          }
        );

      if (!cliente?.id) {
        throw new Error(
          "Asaas não retornou o ID do cliente."
        );
      }

      return {
        clienteExternoId:
          cliente.id,

        metadata: {
          name:
            cliente.name,
          email:
            cliente.email,
        },
      };
    },

    async buscarBoletoPorReferencia(
      referenciaExterna: string
    ): Promise<CriarBoletoFinanceiroResult | null> {
      const referencia = String(
        referenciaExterna || ""
      ).trim();

      if (!referencia) {
        throw new Error(
          "Referência externa da cobrança não informada."
        );
      }

      const lista = await requisicaoAsaas<{
        data?: AsaasPaymentResponse[];
      }>(
        configuracao,
        `/payments?externalReference=${encodeURIComponent(
          referencia
        )}&limit=1`,
        {
          method: "GET",
        }
      );

      const pagamento =
        lista?.data?.[0];

      if (!pagamento?.id) {
        return null;
      }

      let linhaDigitavel: string | null =
        null;

      let codigoBarras: string | null =
        null;

      try {
        const identificacao =
          await requisicaoAsaas<AsaasIdentificationFieldResponse>(
            configuracao,
            `/payments/${encodeURIComponent(
              pagamento.id
            )}/identificationField`,
            {
              method: "GET",
            }
          );

        linhaDigitavel =
          identificacao?.identificationField ||
          null;

        codigoBarras =
          identificacao?.barCode ||
          null;
      } catch (error) {
        console.error(
          "Cobrança recuperada, mas identificação do boleto não pôde ser consultada:",
          {
            paymentId: pagamento.id,
            error:
              error instanceof Error
                ? error.message
                : String(error),
          }
        );
      }

      return {
        cobrancaExternaId: pagamento.id,
        statusExterno: String(
          pagamento.status || "PENDING"
        ),
        invoiceUrl:
          pagamento.invoiceUrl || null,
        boletoUrl:
          pagamento.bankSlipUrl || null,
        linhaDigitavel,
        codigoBarras,
        metadata: {
          recuperadaPorReferencia: true,
          customer: pagamento.customer,
          externalReference:
            pagamento.externalReference,
        },
      };
    },

    async criarBoleto(
      input: CriarBoletoFinanceiroInput
    ): Promise<CriarBoletoFinanceiroResult> {
      const pagamento =
        await requisicaoAsaas<AsaasPaymentResponse>(
          configuracao,
          "/payments",
          {
            method: "POST",

            body: JSON.stringify({
              customer:
                input.clienteExternoId,

              billingType:
                "BOLETO",

              value:
                input.valor,

              dueDate:
                input.vencimento,

              description:
                input.descricao,

              externalReference:
                input.referenciaExterna,
            }),
          }
        );

      if (!pagamento?.id) {
        throw new Error(
          "Asaas não retornou o ID da cobrança."
        );
      }

      let linhaDigitavel:
        string | null = null;

      let codigoBarras:
        string | null = null;

      /*
       * A cobrança já existe neste ponto.
       *
       * Se a consulta da linha digitável falhar,
       * não devemos recriar o boleto e correr
       * risco de duplicidade.
       */
      try {
        const identificacao =
          await requisicaoAsaas<AsaasIdentificationFieldResponse>(
            configuracao,
            `/payments/${encodeURIComponent(
              pagamento.id
            )}/identificationField`,
            {
              method: "GET",
            }
          );

        linhaDigitavel =
          identificacao
            ?.identificationField ||
          null;

        codigoBarras =
          identificacao
            ?.barCode ||
          null;
      } catch (error) {
        console.error(
          "Cobrança Asaas criada, mas a linha digitável ainda não pôde ser consultada:",
          {
            paymentId:
              pagamento.id,

            error:
              error instanceof Error
                ? error.message
                : String(error),
          }
        );
      }

      return {
        cobrancaExternaId:
          pagamento.id,

        statusExterno:
          String(
            pagamento.status ||
              "PENDING"
          ),

        invoiceUrl:
          pagamento.invoiceUrl ||
          null,

        boletoUrl:
          pagamento.bankSlipUrl ||
          null,

        linhaDigitavel,
        codigoBarras,

        metadata: {
          billingType:
            pagamento.billingType,

          customer:
            pagamento.customer,

          externalReference:
            pagamento.externalReference,
        },
      };
    },
  };
}
