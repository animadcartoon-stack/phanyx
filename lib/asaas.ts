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
}>;



function getAsaasConfig() {
  const apiKey =
    process.env.ASAAS_API_KEY ||
    process.env.ASAAS_ACCESS_TOKEN ||
    process.env.ASAAS_TOKEN ||
    process.env.NEXT_PUBLIC_ASAAS_API_KEY ||
    process.env.NEXT_PUBLIC_ASAAS_ACCESS_TOKEN ||
    "";

    console.log("🔎 ENV RAW:", {
  ASAAS_API_KEY: process.env.ASAAS_API_KEY ? "OK" : "VAZIO",
  ASAAS_ACCESS_TOKEN: process.env.ASAAS_ACCESS_TOKEN ? "OK" : "VAZIO",
  ASAAS_TOKEN: process.env.ASAAS_TOKEN ? "OK" : "VAZIO",
  NEXT_PUBLIC_ASAAS_API_KEY: process.env.NEXT_PUBLIC_ASAAS_API_KEY ? "OK" : "VAZIO",
  NEXT_PUBLIC_ASAAS_ACCESS_TOKEN: process.env.NEXT_PUBLIC_ASAAS_ACCESS_TOKEN ? "OK" : "VAZIO",
});

  const baseUrl =
    process.env.ASAAS_BASE_URL ||
    process.env.NEXT_PUBLIC_ASAAS_BASE_URL ||
    "https://api-sandbox.asaas.com/v3";

  console.log("🔎 ASAAS CONFIG:", {
  temApiKey: Boolean(apiKey),
  tamanhoApiKey: apiKey ? apiKey.length : 0,
  inicioApiKey: apiKey ? apiKey.slice(0, 6) : "",
  baseUrl,
});

  if (!apiKey) {
    throw new Error("Configuração do Asaas ausente no servidor.");
  }

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ""),
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

      name: "PHANYX",
      description: `Plano ${data.plano}`,
      value: data.value,
      externalReference: data.externalReference,

      items: [
        {
          name: "PHANYX",
          description: `Plano ${data.plano}`,
          quantity: 1,
          value: data.value,
        },
      ],

      subscription: {
        cycle: "MONTHLY",
        nextDueDate: new Date().toISOString().split("T")[0],
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
        successUrl: `https://phanyx.com.br/sucesso?checkout=recorrente&ref=${data.externalReference}`,
        cancelUrl: `https://phanyx.com.br/cancelado?motivo=checkout-cancelado&ref=${data.externalReference}`,
        autoRedirect: true,
      },
    }),
  });

  const { baseUrl } = getAsaasConfig();

  const baseCheckoutUrl = baseUrl.includes("sandbox")
    ? "https://sandbox.asaas.com"
    : "https://www.asaas.com";

  console.log("🟣 RESPOSTA CHECKOUT ASAAS:", JSON.stringify(response, null, 2));

  return {
    id: response.id,
    url: `${baseCheckoutUrl}/checkoutSession/show?id=${response.id}`,
  };
}
export async function atualizarClienteAsaas(
  customerId: string,
  data: Partial<AsaasCustomerInput>
) {
  return asaasFetch(`/customers/${customerId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}