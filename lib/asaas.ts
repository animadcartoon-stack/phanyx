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
    process.env.NEXT_PUBLIC_ASAAS_API_KEY ||
    "";

  const baseUrl =
    process.env.ASAAS_BASE_URL ||
    process.env.NEXT_PUBLIC_ASAAS_BASE_URL ||
    "";

  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não definida no .env");
  }

  if (!baseUrl) {
    throw new Error("ASAAS_BASE_URL não definida no .env");
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

export async function criarAssinaturaCartaoAsaas(data: CriarAssinaturaAsaasInput) {
  if (!data.remoteIp) {
    throw new Error("remoteIp é obrigatório para criar assinatura no cartão.");
  }

  if (!data.creditCard && !data.creditCardToken) {
    throw new Error(
      "Informe creditCard/creditCardHolderInfo ou creditCardToken para assinatura no cartão."
    );
  }

  return criarAssinaturaAsaas({
    ...data,
    billingType: "CREDIT_CARD",
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
  customer: string;
  value: number;
  plano: string;
  email: string;
};

type CriarCheckoutAssinaturaResponse = {
  id: string;
  url: string;
};

export async function criarCheckoutAssinaturaAsaas(
  data: CriarCheckoutAssinaturaInput
) {
  const response = await asaasFetch<any>("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      billingTypes: ["CREDIT_CARD"],
      chargeTypes: ["RECURRENT"],

      name: `Assinatura PHANYX - ${data.plano}`,
      description: `Plano ${data.plano} - PHANYX`,

      value: data.value,

      subscription: {
        cycle: "MONTHLY",
      },

      customer: data.customer,

      callback: {
        successUrl: "https://phanyx.com.br/sucesso",
        cancelUrl: "https://phanyx.com.br/cancelado",
      },
    }),
  });

  return {
    id: response.id,
    url: `https://www.asaas.com/c/${response.id}`,
  } as CriarCheckoutAssinaturaResponse;
}