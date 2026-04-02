async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey =
    process.env.ASAAS_API_KEY ||
    process.env.NEXT_PUBLIC_ASAAS_API_KEY ||
    "";

  const baseUrl =
    process.env.ASAAS_BASE_URL ||
    process.env.NEXT_PUBLIC_ASAAS_BASE_URL ||
    "";

  console.log("DEBUG ASAAS ENV =>", {
    apiKeyExiste: !!apiKey,
    baseUrl,
  });

  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não definida no .env");
  }

  if (!baseUrl) {
    throw new Error("ASAAS_BASE_URL não definida no .env");
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "FORMAX",
      access_token: apiKey,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("Erro Asaas:", data);
    throw new Error(
      data?.errors?.[0]?.description ||
        data?.message ||
        `Erro HTTP ${res.status} ao comunicar com Asaas`
    );
  }

  return data as T;
}

export async function criarClienteAsaas(data: {
  name: string;
  email: string;
  cpfCnpj?: string;
}) {
  return asaasFetch<{
    id: string;
    name: string;
    email: string;
    cpfCnpj?: string;
  }>("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function criarCobrancaAsaas(data: {
  customer: string;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD";
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}) {
  return asaasFetch<{
    id: string;
    customer: string;
    billingType: string;
    value: number;
    status: string;
  }>("/payments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function obterQrCodePixAsaas(paymentId: string) {
  return asaasFetch<{
    encodedImage?: string;
    payload?: string;
    expirationDate?: string;
  }>(`/payments/${paymentId}/pixQrCode`, {
    method: "GET",
  });
}