import { NextRequest, NextResponse } from "next/server";
import { StatusWhatsAppMensagem } from "@prisma/client";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VERIFY_TOKEN =
  process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

const META_APP_SECRET =
  process.env.META_WHATSAPP_APP_SECRET;

type StatusMeta =
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | string;

type PayloadWhatsapp = {
  object?: string;

  entry?: Array<{
    id?: string;

    changes?: Array<{
      field?: string;

      value?: {
        messaging_product?: string;

        metadata?: {
          display_phone_number?: string;
          phone_number_id?: string;
        };

        statuses?: Array<{
          id?: string;
          status?: StatusMeta;
          timestamp?: string;
          recipient_id?: string;

          errors?: Array<{
            code?: number;
            title?: string;
            message?: string;
            error_data?: {
              details?: string;
            };
          }>;
        }>;
      };
    }>;
  }>;
};

function converterStatusMeta(
  status?: string
): StatusWhatsAppMensagem | null {
  switch (String(status || "").toLowerCase()) {
    case "sent":
      return StatusWhatsAppMensagem.ENVIADA;

    case "delivered":
      return StatusWhatsAppMensagem.ENTREGUE;

    case "read":
      return StatusWhatsAppMensagem.LIDA;

    case "failed":
      return StatusWhatsAppMensagem.FALHOU;

    default:
      return null;
  }
}

function converterTimestampMeta(
  valor?: string
): Date {
  if (!valor) {
    return new Date();
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return new Date();
  }

  return new Date(numero * 1000);
}

function validarAssinaturaMeta(params: {
  rawBody: string;
  assinatura: string;
  appSecret: string;
}): boolean {
  const {
    rawBody,
    assinatura,
    appSecret,
  } = params;

  const prefixo = "sha256=";

  if (
    !assinatura.startsWith(prefixo)
  ) {
    return false;
  }

  const assinaturaRecebida =
    assinatura
      .slice(prefixo.length)
      .trim()
      .toLowerCase();

  if (
    !/^[a-f0-9]{64}$/.test(
      assinaturaRecebida
    )
  ) {
    return false;
  }

  const assinaturaEsperada =
    crypto
      .createHmac(
        "sha256",
        appSecret
      )
      .update(rawBody, "utf8")
      .digest("hex");

  const bufferRecebido =
    Buffer.from(
      assinaturaRecebida,
      "hex"
    );

  const bufferEsperado =
    Buffer.from(
      assinaturaEsperada,
      "hex"
    );

  if (
    bufferRecebido.length !==
    bufferEsperado.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    bufferRecebido,
    bufferEsperado
  );
}

/**
 * GET
 *
 * Usado pela Meta para validar o endpoint de webhook.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (!VERIFY_TOKEN) {
    console.error(
      "WHATSAPP_WEBHOOK_VERIFY_TOKEN não configurado."
    );

    return new NextResponse(
      "Webhook não configurado.",
      {
        status: 500,
      }
    );
  }

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN &&
    challenge
  ) {
    return new NextResponse(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return new NextResponse(
    "Falha na verificação do webhook.",
    {
      status: 403,
    }
  );
}

/**
 * POST
 *
 * Recebe atualizações enviadas pela Meta.
 */
export async function POST(req: NextRequest) {
  try {
    if (!META_APP_SECRET) {
      console.error(
        "META_WHATSAPP_APP_SECRET não configurado."
      );

      return NextResponse.json(
        {
          received: false,
          error:
            "Webhook do WhatsApp não configurado.",
        },
        {
          status: 503,
        }
      );
    }

    const assinatura =
      req.headers.get(
        "x-hub-signature-256"
      );

    if (!assinatura) {
      return NextResponse.json(
        {
          received: false,
          error:
            "Assinatura do webhook ausente.",
        },
        {
          status: 401,
        }
      );
    }

    let rawBody: string;

    try {
      rawBody = await req.text();
    } catch {
      return NextResponse.json(
        {
          received: false,
          error:
            "Não foi possível ler o payload.",
        },
        {
          status: 400,
        }
      );
    }

    const assinaturaValida =
      validarAssinaturaMeta({
        rawBody,
        assinatura,
        appSecret:
          META_APP_SECRET,
      });

    if (!assinaturaValida) {
      console.warn(
        "Webhook WhatsApp rejeitado por assinatura inválida."
      );

      return NextResponse.json(
        {
          received: false,
          error:
            "Assinatura do webhook inválida.",
        },
        {
          status: 401,
        }
      );
    }

    let payload: PayloadWhatsapp;

    try {
      payload =
        JSON.parse(
          rawBody
        ) as PayloadWhatsapp;
    } catch {
      return NextResponse.json(
        {
          received: false,
          error:
            "Payload inválido.",
        },
        {
          status: 400,
        }
      );
    }

    if (payload.object !== "whatsapp_business_account") {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    const eventos: Array<{
      metaMessageId: string;
      status: StatusWhatsAppMensagem;
      dataEvento: Date;
      payload: Record<string, unknown>;
      erroCodigo?: string | null;
      erroMensagem?: string | null;
    }> = [];

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") {
          continue;
        }

        const phoneNumberId =
          change.value?.metadata?.phone_number_id ??
          null;

        for (const statusMeta of
          change.value?.statuses ?? []) {
          const metaMessageId =
            statusMeta.id;

          const status =
            converterStatusMeta(
              statusMeta.status
            );

          if (!metaMessageId || !status) {
            continue;
          }

          const primeiroErro =
            statusMeta.errors?.[0];

          const erroCodigo =
            primeiroErro?.code != null
              ? String(primeiroErro.code)
              : null;

          const erroMensagem =
            primeiroErro?.message ||
            primeiroErro?.title ||
            primeiroErro?.error_data?.details ||
            null;

          eventos.push({
            metaMessageId,

            status,

            dataEvento:
              converterTimestampMeta(
                statusMeta.timestamp
              ),

            erroCodigo,

            erroMensagem,

            payload: {
              entryId: entry.id ?? null,

              phoneNumberId,

              recipientId:
                statusMeta.recipient_id ??
                null,

              statusMeta:
                statusMeta.status ?? null,

              timestamp:
                statusMeta.timestamp ??
                null,

              errors:
                statusMeta.errors ?? [],
            },
          });
        }
      }
    }

    /**
     * A Meta espera resposta rápida.
     *
     * Por enquanto processamos em sequência,
     * mas sem lançar erro por mensagem individual.
     */
    for (const evento of eventos) {
      try {
        const mensagem =
          await prisma.whatsAppMensagem.findUnique({
            where: {
              metaMessageId:
                evento.metaMessageId,
            },

            select: {
              id: true,
              status: true,
            },
          });

        /**
         * Pode ocorrer webhook de uma mensagem
         * que não pertence ao PHANYX.
         */
        if (!mensagem) {
          continue;
        }

        const dataAtualizacao:
          Record<string, unknown> = {
          status: evento.status,
        };

        if (
          evento.status ===
          StatusWhatsAppMensagem.ENVIADA
        ) {
          dataAtualizacao.enviadaEm =
            evento.dataEvento;
        }

        if (
          evento.status ===
          StatusWhatsAppMensagem.ENTREGUE
        ) {
          dataAtualizacao.entregueEm =
            evento.dataEvento;
        }

        if (
          evento.status ===
          StatusWhatsAppMensagem.LIDA
        ) {
          dataAtualizacao.lidaEm =
            evento.dataEvento;
        }

        if (
          evento.status ===
          StatusWhatsAppMensagem.FALHOU
        ) {
          dataAtualizacao.falhouEm =
            evento.dataEvento;

          dataAtualizacao.erroCodigo =
            evento.erroCodigo;

          dataAtualizacao.erroMensagem =
            evento.erroMensagem;
        }

        await prisma.$transaction([
          prisma.whatsAppMensagem.update({
            where: {
              id: mensagem.id,
            },

            data: dataAtualizacao,
          }),

          prisma.whatsAppMensagemEvento.create({
            data: {
              mensagemId: mensagem.id,

              status: evento.status,

              payload: evento.payload,

              recebidoEm:
                evento.dataEvento,
            },
          }),
        ]);
      } catch (error) {
        console.error(
          "Erro ao processar status individual do WhatsApp:",
          evento.metaMessageId,
          error
        );
      }
    }

    return NextResponse.json({
      received: true,
      processed: eventos.length,
    });
  } catch (error) {
    console.error(
      "Erro no webhook WhatsApp:",
      error
    );

    return NextResponse.json(
      {
        received: false,
      },
      {
        status: 500,
      }
    );
  }
}