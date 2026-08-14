import "server-only";

type AsaasBillingType = "PIX" | "BOLETO" | "CREDIT_CARD";
type AsaasCycle =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "BIMONTHLY"
  | "QUARTERLY"
  | "SEMIANNUALLY"
  | "YEARLY";

type AsaasCreditCard = {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
};

type CriarAssinaturaCartaoAsaasInput = {
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: "MONTHLY";
  description: string;
  externalReference: string;
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
  };
  remoteIp: string;
};

type CriarAssinaturaCartaoAsaasResponse = {
  id: string;
  customer: string;
  value: number;
  cycle: string;
  billingType: string;
  nextDueDate: string;
  externalReference?: string;
};

type AsaasCreditCardHolderInfo = {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone?: string;
  mobilePhone?: string;
};

type AsaasCustomerInput = {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
};

type AsaasCustomerResponse = {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
};

type CriarCobrancaAsaasInput = {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  postalService?: boolean;
  installmentCount?: number;
  installmentValue?: number;
  creditCard?: AsaasCreditCard;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
  creditCardToken?: string;
  remoteIp?: string;
};

type CriarCobrancaAsaasResponse = {
  id: string;
  customer: string;
  billingType: string;
  value: number;
  status: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixTransaction?: string;
};

type CriarAssinaturaAsaasInput = {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string;
  cycle: AsaasCycle;
  description?: string;
  endDate?: string;
  maxPayments?: number;
  externalReference?: string;
  creditCard?: AsaasCreditCard;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
  creditCardToken?: string;
  remoteIp?: string;
};

type CriarAssinaturaAsaasResponse = {
  id: string;
  customer: string;
  billingType: string;
  value: number;
  nextDueDate: string;
  cycle: AsaasCycle;
  status?: string;
};

type QrCodePixResponse = {
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
};

type AtualizarAssinaturaAsaasInput = Partial<{
  value: number;
  nextDueDate: string;
  cycle: AsaasCycle;
  description: string;
  endDate: string;
  maxPayments: number;
  creditCard: AsaasCreditCard;
  creditCardHolderInfo: AsaasCreditCardHolderInfo;
  creditCardToken: string;
  remoteIp: string;
  updatePendingPayments: boolean;
  externalReference: string;
}>;

function getAsaasConfig() {
  const apiKey = String(process.env.ASAAS_API_KEY || "").trim();

  const baseUrl = String(
    process.env.ASAAS_BASE_URL ||
    (process.env.ASAAS_ENV === "production"
      ? "https://api.asaas.com/v3"
      : "https://api-sandbox.asaas.com/v3")
  )
    .trim()
    .replace(/\/+$/, "");

  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurada no servidor.");
  }

  if (!baseUrl.startsWith("https://")) {
    throw new Error("ASAAS_BASE_URL inválida.");
  }

  return {
    apiKey,
    baseUrl,
  };
}

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiKey, baseUrl } = getAsaasConfig();

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "PHANYX",
      access_token: apiKey,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("Erro Asaas:", {
      path,
      status: res.status,
      data,
    });

    throw new Error(
      data?.errors?.[0]?.description ||
      data?.message ||
      `Erro HTTP ${res.status} ao comunicar com Asaas`
    );
  }

  return data as T;
}

export function getAsaasCycleFromPlano(
  periodicidade: "MENSAL" | "ANUAL"
): AsaasCycle {
  return periodicidade === "ANUAL" ? "YEARLY" : "MONTHLY";
}

export async function criarClienteAsaas(data: AsaasCustomerInput) {
  return asaasFetch<AsaasCustomerResponse>("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function criarCobrancaAsaas(data: CriarCobrancaAsaasInput) {
  return asaasFetch<CriarCobrancaAsaasResponse>("/payments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function obterQrCodePixAsaas(paymentId: string) {
  return asaasFetch<QrCodePixResponse>(`/payments/${paymentId}/pixQrCode`, {
    method: "GET",
  });
}

export async function criarAssinaturaAsaas(data: CriarAssinaturaAsaasInput) {
  return asaasFetch<CriarAssinaturaAsaasResponse>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function criarAssinaturaCartaoAsaas(
  data: CriarAssinaturaCartaoAsaasInput
): Promise<CriarAssinaturaCartaoAsaasResponse> {
  return asaasFetch<CriarAssinaturaCartaoAsaasResponse>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: data.customer,
      billingType: "CREDIT_CARD",
      value: data.value,
      nextDueDate: data.nextDueDate,
      cycle: data.cycle,
      description: data.description,
      externalReference: data.externalReference,
      creditCard: data.creditCard,
      creditCardHolderInfo: data.creditCardHolderInfo,
      remoteIp: data.remoteIp,
    }),
  });
}

export async function atualizarAssinaturaAsaas(
  subscriptionId: string,
  data: AtualizarAssinaturaAsaasInput
) {
  return asaasFetch<CriarAssinaturaAsaasResponse>(`/subscriptions/${subscriptionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function cancelarAssinaturaAsaas(subscriptionId: string) {
  return asaasFetch<{ deleted: boolean }>(`/subscriptions/${subscriptionId}`, {
    method: "DELETE",
  });
}

export async function buscarAssinaturaAsaas(subscriptionId: string) {
  return asaasFetch<CriarAssinaturaAsaasResponse>(`/subscriptions/${subscriptionId}`, {
    method: "GET",
  });
}

type CriarCheckoutAssinaturaInput = {
  value: number;
  plano: string;
  email: string;
  nomeResponsavel: string;
  cpfCnpj: string;
  telefone: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  province: string;
  city: string;
  externalReference: string;
  nextDueDate: string;
};

type CriarCheckoutAssinaturaResponse = {
  id: string;
  url: string;
};



export async function criarCheckoutAssinaturaAsaas(
  data: CriarCheckoutAssinaturaInput
): Promise<CriarCheckoutAssinaturaResponse> {
  const response = await asaasFetch<any>("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      billingTypes: ["CREDIT_CARD"],
      chargeTypes: ["RECURRENT"],

      name: "PHANYX - mensalidade base",
      description: `Plano ${data.plano}. Valor base mensal. Cadastro para cobrança futura após 60 dias grátis. A cobrança final poderá ser recalculada pelo PHANYX conforme alunos ativos e polos cadastrados antes da primeira cobrança.`,
      value: data.value,
      externalReference: data.externalReference,

      items: [
        {
          name: "PHANYX - mensalidade base",
          description: `Plano ${data.plano}. Valor base mensal. Os primeiros 60 dias são gratuitos. Alunos ativos e polos adicionais poderão compor o valor final da cobrança.`,
          quantity: 1,
          value: data.value,
        },
      ],

      subscription: {
        cycle: "MONTHLY",
        nextDueDate: data.nextDueDate,
      },
      customerData: {
        name: data.nomeResponsavel,
        cpfCnpj: data.cpfCnpj,
        email: data.email,
        phone: data.telefone,
        postalCode: data.postalCode,
        address: data.address,
        addressNumber: data.addressNumber,
        province: data.province,
        city: data.city,
      },

      callback: {
        successUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.phanyx.com.br"
          }/sucesso?checkout=recorrente&ref=${data.externalReference}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.phanyx.com.br"
          }/cancelado?motivo=checkout-cancelado&ref=${data.externalReference}`,
        autoRedirect: true,
      },
    }),
  });

  console.info("Checkout Asaas criado.", {
    id: response?.id,
    status: response?.status,
  });

  const checkoutUrl =
    response.url ||
    response.link ||
    response.checkoutUrl ||
    response.paymentUrl ||
    response.invoiceUrl ||
    "";

  if (!checkoutUrl) {
    throw new Error(
      "Asaas criou o checkout, mas não retornou uma URL válida para redirecionamento."
    );
  }

  return {
    id: response.id,
    url: checkoutUrl,
  };
}

export type CriarCheckoutBibliotecaAsaasInput = {
  contratacaoId: string;
  externalReference: string;

  planoNome: string;
  armazenamentoGb: number;
  valorMensal: number;
  nextDueDate: string;

  nomeResponsavel: string;
  email: string;
  cpfCnpj: string;
  telefone?: string;

  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string | number;
};

export type CriarCheckoutBibliotecaAsaasResponse = {
  id: string;
  url: string;
  status: string;
  externalReference: string;
};

type CheckoutBibliotecaCriadoAsaas = {
  id?: string;
  link?: string;
  url?: string;
  checkoutUrl?: string;
  status?: string;
  externalReference?: string;
};

export async function criarCheckoutBibliotecaAsaas(
  data: CriarCheckoutBibliotecaAsaasInput
): Promise<CriarCheckoutBibliotecaAsaasResponse> {
  const contratacaoId = String(
    data.contratacaoId || ""
  ).trim();

  const externalReference = String(
    data.externalReference || ""
  ).trim();

  const valorMensal = Number(
    data.valorMensal
  );

  const armazenamentoGb = Number(
    data.armazenamentoGb
  );

  const cpfCnpj = String(
    data.cpfCnpj || ""
  ).replace(/\D/g, "");

  const telefone = String(
    data.telefone || ""
  ).replace(/\D/g, "");

  const postalCode = String(
    data.postalCode || ""
  ).replace(/\D/g, "");

  if (!contratacaoId) {
    throw new Error(
      "Identificador da contratação da Biblioteca ausente."
    );
  }

  if (
    !externalReference.startsWith(
      "PHANYX_BIBLIOTECA:"
    )
  ) {
    throw new Error(
      "Referência externa da Biblioteca inválida."
    );
  }

  if (externalReference.length > 200) {
    throw new Error(
      "Referência externa da Biblioteca excede o limite permitido."
    );
  }

  if (
    !Number.isFinite(valorMensal) ||
    valorMensal <= 0
  ) {
    throw new Error(
      "Valor mensal da Biblioteca inválido."
    );
  }

  if (
    !Number.isInteger(armazenamentoGb) ||
    armazenamentoGb <= 0
  ) {
    throw new Error(
      "Armazenamento da Biblioteca inválido."
    );
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      data.nextDueDate
    )
  ) {
    throw new Error(
      "Data da primeira cobrança inválida."
    );
  }

  if (
    cpfCnpj.length !== 11 &&
    cpfCnpj.length !== 14
  ) {
    throw new Error(
      "CPF ou CNPJ do responsável financeiro inválido."
    );
  }

  const baseUrlPhanyx = String(
    process.env.PHANYX_BASE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://www.phanyx.com.br"
  ).replace(/\/+$/, "");

  const parametroContratacao =
    encodeURIComponent(contratacaoId);

  const response =
    await asaasFetch<CheckoutBibliotecaCriadoAsaas>(
      "/checkouts",
      {
        method: "POST",

        body: JSON.stringify({
          billingTypes: ["CREDIT_CARD"],
          chargeTypes: ["RECURRENT"],

          minutesToExpire: 120,

          externalReference,

          items: [
            {
              externalReference:
                `${externalReference}:MENSALIDADE`,

              name: `PHANYX - ${data.planoNome}`,

              description:
                `Biblioteca Virtual PHANYX com ${armazenamentoGb} GB de armazenamento.`,

              quantity: 1,
              value: valorMensal,
            },
          ],

          subscription: {
            cycle: "MONTHLY",
            nextDueDate: data.nextDueDate,
          },

          customerData: {
            name: String(
              data.nomeResponsavel || ""
            ).trim(),

            email: String(
              data.email || ""
            )
              .trim()
              .toLowerCase(),

            cpfCnpj,

            phone: telefone || undefined,

            postalCode:
              postalCode || undefined,

            address:
              String(data.address || "").trim() ||
              undefined,

            addressNumber:
              String(
                data.addressNumber || ""
              ).trim() || undefined,

            complement:
              String(
                data.complement || ""
              ).trim() || undefined,

            province:
              String(
                data.province || ""
              ).trim() || undefined,

            city:
              data.city || undefined,
          },

          callback: {
            successUrl:
              `${baseUrlPhanyx}/admin/biblioteca/contratacao` +
              `?retorno=sucesso&contratacao=${parametroContratacao}`,

            cancelUrl:
              `${baseUrlPhanyx}/admin/biblioteca/contratacao` +
              `?retorno=cancelado&contratacao=${parametroContratacao}`,

            expiredUrl:
              `${baseUrlPhanyx}/admin/biblioteca/contratacao` +
              `?retorno=expirado&contratacao=${parametroContratacao}`,

            autoRedirect: true,
          },
        }),
      }
    );

  const checkoutId = String(
    response?.id || ""
  ).trim();

  const checkoutUrl = String(
    response?.link ||
      response?.url ||
      response?.checkoutUrl ||
      ""
  ).trim();

  if (!checkoutId || !checkoutUrl) {
    throw new Error(
      "O Asaas não retornou os dados completos do checkout da Biblioteca."
    );
  }

  console.info(
    "Checkout da Biblioteca criado no Asaas.",
    {
      checkoutId,
      status: response?.status || "ACTIVE",
      externalReference,
    }
  );

  return {
    id: checkoutId,
    url: checkoutUrl,
    status: String(
      response?.status || "ACTIVE"
    ),
    externalReference,
  };
}

export async function atualizarClienteAsaas(
  customerId: string,
  data: Partial<AsaasCustomerInput>
) {
  return asaasFetch(`/customers/${customerId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}