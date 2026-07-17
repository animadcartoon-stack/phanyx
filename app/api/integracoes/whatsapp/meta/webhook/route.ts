import {
  createHmac,
  timingSafeEqual,
} from "crypto";
import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: unknown;
    }>;
  }>;
};

function respostaTexto(
  texto: string,
  status = 200
) {
  return new NextResponse(texto, {
    status,
    headers: {
      "Content-Type":
        "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function assinaturaValida(
  corpoOriginal: string,
  assinaturaRecebida: string,
  appSecret: string
) {
  const assinaturaEsperada =
    `sha256=${createHmac("sha256", appSecret)
      .update(corpoOriginal)
      .digest("hex")}`;

  const bufferRecebido = Buffer.from(
    assinaturaRecebida,
    "utf8"
  );

  const bufferEsperado = Buffer.from(
    assinaturaEsperada,
    "utf8"
  );

  if (
    bufferRecebido.length !==
    bufferEsperado.length
  ) {
    return false;
  }

  return timingSafeEqual(
    bufferRecebido,
    bufferEsperado
  );
}

/**
 * A Meta usa esta rota GET para confirmar
 * que o endereço do webhook pertence ao PHANYX.
 */
export async function GET(
  request: NextRequest
) {
  const url = new URL(request.url);

  const modo = url.searchParams.get(
    "hub.mode"
  );

  const tokenRecebido =
    url.searchParams.get("hub.verify_token");

  const desafio = url.searchParams.get(
    "hub.challenge"
  );

  const tokenEsperado =
    process.env
      .META_WHATSAPP_WEBHOOK_VERIFY_TOKEN
      ?.trim();

  if (!tokenEsperado) {
    console.error(
      "META_WHATSAPP_WEBHOOK_VERIFY_TOKEN não configurado."
    );

    return respostaTexto(
      "Configuração do webhook ausente.",
      500
    );
  }

  if (
    modo === "subscribe" &&
    tokenRecebido === tokenEsperado &&
    desafio
  ) {
    /*
     * A Meta exige o valor puro do desafio,
     * e não um objeto JSON.
     */
    return respostaTexto(desafio, 200);
  }

  return respostaTexto(
    "Verificação recusada.",
    403
  );
}

/**
 * A Meta usa esta rota POST para enviar
 * mensagens recebidas e alterações de status.
 */
export async function POST(
  request: NextRequest
) {
  const appSecret =
    process.env
      .META_WHATSAPP_APP_SECRET
      ?.trim();

  if (!appSecret) {
    console.error(
      "META_WHATSAPP_APP_SECRET não configurado."
    );

    return respostaTexto(
      "Configuração do aplicativo ausente.",
      500
    );
  }

  const corpoOriginal = await request.text();

  const assinaturaRecebida =
    request.headers
      .get("x-hub-signature-256")
      ?.trim();

  if (
    !assinaturaRecebida ||
    !assinaturaValida(
      corpoOriginal,
      assinaturaRecebida,
      appSecret
    )
  ) {
    console.warn(
      "Webhook Meta WhatsApp recusado por assinatura inválida."
    );

    return respostaTexto(
      "Assinatura inválida.",
      401
    );
  }

  let payload: MetaWebhookPayload;

  try {
    payload = JSON.parse(
      corpoOriginal
    ) as MetaWebhookPayload;
  } catch {
    return respostaTexto(
      "Conteúdo inválido.",
      400
    );
  }

  const camposRecebidos =
    payload.entry?.flatMap((entrada) =>
      (entrada.changes || [])
        .map((alteracao) => alteracao.field)
        .filter(
          (campo): campo is string =>
            Boolean(campo)
        )
    ) || [];

  /*
   * Não registra token nem conteúdo completo
   * das mensagens no console.
   */
  console.info(
    "Webhook Meta WhatsApp recebido.",
    {
      object: payload.object || null,
      quantidadeEntradas:
        payload.entry?.length || 0,
      campos: camposRecebidos,
    }
  );

  /*
   * Na próxima etapa conectaremos este payload
   * às notificações e ao histórico do PHANYX.
   */
  return respostaTexto(
    "EVENT_RECEIVED",
    200
  );
}