import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

const PACOTES = {
  "5": {
    creditos: 5,
    valor: 19.9,
    descricao: "Pacote PHANYX IA - 5 créditos",
  },
  "15": {
    creditos: 15,
    valor: 49.9,
    descricao: "Pacote PHANYX IA - 15 créditos",
  },
  "50": {
    creditos: 50,
    valor: 129.9,
    descricao: "Pacote PHANYX IA - 50 créditos",
  },
} as const;

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken().catch(() => null);

    const body = await req.json();

const pacoteId = String(body.pacoteId || "") as keyof typeof PACOTES;
const nome = String(body.nome || "").trim();
const email = String(body.email || "").trim().toLowerCase();
const whatsapp = String(body.whatsapp || "").trim();

if (!user && !nome) {
  return NextResponse.json(
    { error: "Informe seu nome." },
    { status: 400 }
  );
}

if (!user && !email) {
  return NextResponse.json(
    { error: "Informe seu e-mail." },
    { status: 400 }
  );
}

    const pacote = PACOTES[pacoteId];

    if (!pacote) {
      return NextResponse.json(
        { error: "Pacote de créditos inválido." },
        { status: 400 }
      );
    }

    const apiKey = process.env.ASAAS_API_KEY;
    const baseUrl =
  process.env.ASAAS_BASE_URL || "https://api-sandbox.asaas.com/v3";

    if (!apiKey) {
      return NextResponse.json(
        { error: "ASAAS_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const externalReference = user
  ? `CREDITOS_IA:${user.id}:${pacote.creditos}`
  : `CREDITOS_IA_PUBLICO:${email}:${pacote.creditos}`;

const linkResposta = await fetch(`${baseUrl}/paymentLinks`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    access_token: apiKey,
  },
  body: JSON.stringify({
  name: pacote.descricao,
  description: pacote.descricao,
  value: pacote.valor,
  chargeType: "DETACHED",
  dueDateLimitDays: 1,
  externalReference,
  notificationEnabled: true,
}),
});

const link = await linkResposta.json();

if (!linkResposta.ok) {
  console.error("Erro link pagamento Asaas:", link);

  return NextResponse.json(
    {
      error: "Não foi possível gerar link de pagamento Asaas.",
      detalhes: link,
    },
    { status: 500 }
  );
}
    return NextResponse.json({
      ok: true,
      pacote: {
        creditos: pacote.creditos,
        valor: pacote.valor,
      },
      checkoutUrl: link.url,

pagamento: {
  id: link.id,
  status: "LINK_CRIADO",
  invoiceUrl: link.url,
  externalReference,
},
    });
  } catch (error) {
    console.error("Erro ao comprar créditos IA:", error);

    return NextResponse.json(
      { error: "Erro interno ao comprar créditos IA." },
      { status: 500 }
    );
  }
}