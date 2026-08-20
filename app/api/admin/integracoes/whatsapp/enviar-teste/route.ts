import { randomUUID } from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  TipoComunicacaoWhatsApp,
} from "@prisma/client";

import { getUserFromToken } from "@/lib/server-auth";

import {
  enviarComunicacaoWhatsapp,
} from "@/lib/whatsapp/enviar-comunicacao";

export const dynamic = "force-dynamic";

function podeAdministrarWhatsapp(
  role?: string | null
) {
  const papel =
    String(role || "").toUpperCase();

  return (
    papel === "ADMIN" ||
    papel === "SUPER_ADMIN"
  );
}

function limparTexto(
  valor: unknown
): string | null {
  if (typeof valor !== "string") {
    return null;
  }

  const texto = valor.trim();

  return texto || null;
}

function normalizarTelefone(
  valor: unknown
): string | null {
  if (typeof valor !== "string") {
    return null;
  }

  const telefone =
    valor.replace(/\D/g, "");

  if (
    telefone.length < 10 ||
    telefone.length > 15
  ) {
    return null;
  }

  return telefone;
}

function mensagemMotivoIgnorado(
  motivo: string
) {
  const mensagens: Record<string, string> = {
    INSTITUICAO_INVALIDA:
      "A instituição informada é inválida.",

    WHATSAPP_NAO_CONFIGURADO:
      "O WhatsApp ainda não foi configurado para esta instituição.",

    WHATSAPP_DESATIVADO:
      "O envio de WhatsApp está desativado.",

    WHATSAPP_DESCONECTADO:
      "A integração do WhatsApp está desconectada.",

    PHONE_NUMBER_ID_AUSENTE:
      "O Phone Number ID não está configurado.",

    TOKEN_AUSENTE:
      "A credencial do WhatsApp não está configurada.",

    COMUNICACAO_DESATIVADA:
      "A comunicação de reunião criada está desativada.",

    TELEFONE_AUSENTE:
      "O telefone de destino não foi informado.",

    TELEFONE_INVALIDO:
      "O telefone de destino é inválido.",

    TEMPLATE_NAO_CONFIGURADO:
      "O template de reunião criada não está configurado.",

    TEMPLATE_META_NAO_CONFIGURADO:
      "O template não possui nome correspondente na Meta.",

    TEMPLATE_NAO_APROVADO_META:
      "O template ainda não foi aprovado pela Meta.",

    COMUNICACAO_DUPLICADA:
      "Esta mensagem de teste já foi processada.",
  };

  return (
    mensagens[motivo] ||
    "A mensagem de teste foi ignorada."
  );
}

export async function POST(
  req: NextRequest
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error: "Não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      !podeAdministrarWhatsapp(
        user.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para enviar uma mensagem de teste pelo WhatsApp.",
        },
        {
          status: 403,
        }
      );
    }

    const instituicaoId =
      Number(user.instituicaoId);

    if (
      !Number.isFinite(
        instituicaoId
      ) ||
      instituicaoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Instituição inválida.",
        },
        {
          status: 400,
        }
      );
    }

    let body: {
      telefone?: string;
      nomeDestinatario?: string;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Dados inválidos.",
        },
        {
          status: 400,
        }
      );
    }

    const telefoneDestino =
      normalizarTelefone(
        body.telefone
      );

    if (!telefoneDestino) {
      return NextResponse.json(
        {
          error:
            "Informe um telefone válido com DDI, DDD e número.",
        },
        {
          status: 400,
        }
      );
    }

    const nomeDestinatario =
      limparTexto(
        body.nomeDestinatario
      ) || "Participante";

    const dataHora =
      new Intl.DateTimeFormat(
        "pt-BR",
        {
          timeZone:
            "America/Sao_Paulo",
          dateStyle: "short",
          timeStyle: "short",
        }
      )
        .format(new Date())
        .replace(",", " às");

    const resultado =
      await enviarComunicacaoWhatsapp({
        instituicaoId,

        usuarioId:
          Number.isFinite(
            Number(user.id)
          )
            ? Number(user.id)
            : null,

        tipoComunicacao:
          TipoComunicacaoWhatsApp.REUNIAO_CRIADA,

        chaveIdempotencia:
          `whatsapp-teste:${instituicaoId}:${randomUUID()}`,

        telefone:
          telefoneDestino,

        nomeDestinatario,

        componentes: [
          {
            type: "body",

            parameters: [
              {
                type: "text",
                text:
                  nomeDestinatario,
              },
              {
                type: "text",
                text:
                  "Reunião de teste PHANYX",
              },
              {
                type: "text",
                text: dataHora,
              },
              {
                type: "text",
                text:
                  "Teste técnico — nenhuma ação é necessária.",
              },
            ],
          },
        ],

        parametros: {
          testeAdministrativo: true,

          nomeDestinatario,

          titulo:
            "Reunião de teste PHANYX",

          dataHora,

          acesso:
            "Teste técnico — nenhuma ação é necessária.",
        },

        modoTesteAdministrativo: true,
      });

    if (resultado.enviado) {
      return NextResponse.json({
        ok: true,

        message:
          "Mensagem de teste enviada e registrada no PHANYX.",

        mensagemId:
          resultado.mensagemId,

        metaMessageId:
          resultado.metaMessageId,
      });
    }

    if (resultado.ignorado) {
      return NextResponse.json(
        {
          ok: false,

          error:
            mensagemMotivoIgnorado(
              resultado.motivo
            ),

          motivo:
            resultado.motivo,
        },
        {
          status: 409,
        }
      );
    }

    if ("erro" in resultado) {
  return NextResponse.json(
    {
      ok: false,

      error:
        resultado.erro,

      motivo:
        resultado.motivo,

      mensagemId:
        resultado.mensagemId,
    },
    {
      status: 502,
    }
  );
}

return NextResponse.json(
  {
    ok: false,

    error:
      "O envio retornou um resultado inesperado.",
  },
  {
    status: 500,
  }
);
  } catch (error) {
    console.error(
      "Erro ao enviar mensagem administrativa de teste pelo WhatsApp:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar a mensagem de teste.",
      },
      {
        status: 500,
      }
    );
  }
}