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

    const hoje = new Date();
    const vencimento = hoje.toISOString().slice(0, 10);

    const clienteResposta = await fetch(`${baseUrl}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: apiKey,
      },
      body: JSON.stringify({
        name: user?.nome || nome,
        email: user?.email || email,
        mobilePhone: whatsapp || undefined,
}),
    });

    const cliente = await clienteResposta.json();

    if (!clienteResposta.ok) {
      console.error("Erro cliente Asaas:", cliente);

      return NextResponse.json(
        { error: "Não foi possível criar cliente no Asaas." },
        { status: 500 }
      );
    }

    const cobrancaResposta = await fetch(`${baseUrl}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: apiKey,
      },
      body: JSON.stringify({
        customer: cliente.id,
        billingType: "PIX",
        value: pacote.valor,
        dueDate: vencimento,
        description: pacote.descricao,
        externalReference: user
  ? `CREDITOS_IA:${user.id}:${pacote.creditos}`
  : `CREDITOS_IA_PUBLICO:${email}:${pacote.creditos}`,
      }),
    });

    const cobranca = await cobrancaResposta.json();

    if (!cobrancaResposta.ok) {
  console.error("Erro cobrança Asaas:", cobranca);

  return NextResponse.json(
    {
      error: "Não foi possível gerar cobrança Asaas.",
      detalhes: cobranca,
    },
    { status: 500 }
  );
}

    let pixQrCode = null;

    try {
      const pixResposta = await fetch(
        `${baseUrl}/payments/${cobranca.id}/pixQrCode`,
        {
          method: "GET",
          headers: {
            access_token: apiKey,
          },
        }
      );

      if (pixResposta.ok) {
        pixQrCode = await pixResposta.json();
      }
    } catch (error) {
      console.error("Erro ao buscar QR Code PIX:", error);
    }

    return NextResponse.json({
      ok: true,
      pacote: {
        creditos: pacote.creditos,
        valor: pacote.valor,
      },
      pagamento: {
        id: cobranca.id,
        status: cobranca.status,
        invoiceUrl: cobranca.invoiceUrl,
        bankSlipUrl: cobranca.bankSlipUrl,
        externalReference: cobranca.externalReference,
      },
      pix: pixQrCode,
    });
  } catch (error) {
    console.error("Erro ao comprar créditos IA:", error);

    return NextResponse.json(
      { error: "Erro interno ao comprar créditos IA." },
      { status: 500 }
    );
  }
}