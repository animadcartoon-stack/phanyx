import {
  DirecaoEventoIntegracaoCaptacaoLead,
  Prisma,
  StatusEventoIntegracaoCaptacaoLead,
  StatusIntegracaoCaptacaoLead,
  StatusSubmissaoCaptacaoLead,
  TipoIntegracaoCaptacaoLead,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createDecipheriv,
  createHash,
  timingSafeEqual,
} from "crypto";

import { prisma } from "@/lib/prisma";

import {
  ErroProcessamentoCaptacao,
  processarSubmissaoCaptacao,
} from "@/lib/comercial/captacao/processar-submissao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIMITE_BODY_BYTES =
  256 * 1024;

class ErroHttp extends Error {
  status: number;
  codigo: string;

  constructor(
    status: number,
    mensagem: string,
    codigo: string
  ) {
    super(mensagem);

    this.name = "ErroHttp";
    this.status = status;
    this.codigo = codigo;
  }
}

function ehRegistro(
  valor: unknown
): valor is Record<string, unknown> {
  return (
    Boolean(valor) &&
    typeof valor === "object" &&
    !Array.isArray(valor)
  );
}

function textoOuNull(
  valor: unknown,
  limite = 2000
) {
  const resultado =
    String(valor ?? "").trim();

  if (!resultado) {
    return null;
  }

  return resultado.slice(
    0,
    limite
  );
}

function booleano(
  valor: unknown
) {
  if (
    typeof valor === "boolean"
  ) {
    return valor;
  }

  if (
    typeof valor === "number"
  ) {
    return valor === 1;
  }

  const normalizado =
    String(valor ?? "")
      .trim()
      .toLowerCase();

  return [
    "1",
    "true",
    "sim",
    "yes",
    "on",
    "aceito",
    "aceita",
  ].includes(normalizado);
}

function paraJsonPrisma(
  valor: unknown
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(valor)
  ) as Prisma.InputJsonValue;
}

function obterChaveCriptografia() {
  const segredoBase =
    process.env
      .CAPTACAO_INTEGRACAO_CRYPTO_SECRET ||
    process.env.JWT_SECRET;

  if (!segredoBase) {
    throw new ErroHttp(
      503,
      "A criptografia das integrações não está configurada.",
      "CRIPTOGRAFIA_NAO_CONFIGURADA"
    );
  }

  return createHash(
    "sha256"
  )
    .update(segredoBase)
    .digest();
}

function descriptografarSegredo(
  valor: string
) {
  const partes =
    valor.split(":");

  if (
    partes.length !== 4 ||
    partes[0] !== "v1"
  ) {
    throw new ErroHttp(
      503,
      "A credencial desta integração possui um formato inválido.",
      "CREDENCIAL_INVALIDA"
    );
  }

  try {
    const [
      _versao,
      ivBase64,
      tagBase64,
      dadosBase64,
    ] = partes;

    const chave =
      obterChaveCriptografia();

    const iv =
      Buffer.from(
        ivBase64,
        "base64url"
      );

    const tag =
      Buffer.from(
        tagBase64,
        "base64url"
      );

    const dados =
      Buffer.from(
        dadosBase64,
        "base64url"
      );

    const decipher =
      createDecipheriv(
        "aes-256-gcm",
        chave,
        iv
      );

    decipher.setAuthTag(
      tag
    );

    return Buffer.concat([
      decipher.update(
        dados
      ),
      decipher.final(),
    ]).toString(
      "utf8"
    );
  } catch (error) {
    if (
      error instanceof
      ErroHttp
    ) {
      throw error;
    }

    throw new ErroHttp(
      503,
      "Não foi possível validar a credencial desta integração.",
      "CREDENCIAL_CORROMPIDA"
    );
  }
}

function segredosIguais(
  recebido: string,
  esperado: string
) {
  const recebidoBuffer =
    Buffer.from(
      recebido,
      "utf8"
    );

  const esperadoBuffer =
    Buffer.from(
      esperado,
      "utf8"
    );

  if (
    recebidoBuffer.length !==
    esperadoBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    recebidoBuffer,
    esperadoBuffer
  );
}

function obterSegredo(
  req: NextRequest
) {
  /*
   * Padrão principal:
   *
   * Authorization:
   * Bearer SEU_SEGREDO
   */
  const authorization =
    req.headers.get(
      "authorization"
    );

  if (
    authorization
      ?.toLowerCase()
      .startsWith("bearer ")
  ) {
    return textoOuNull(
      authorization.slice(
        7
      ),
      5000
    );
  }

  /*
   * Alternativa útil para
   * ferramentas de webhook.
   */
  return textoOuNull(
    req.headers.get(
      "x-phanyx-secret"
    ),
    5000
  );
}

function headersAuditaveis(
  req: NextRequest
) {
  const headers:
    Record<string, string> = {};

  const bloqueados =
    new Set([
      "authorization",
      "cookie",
      "set-cookie",
      "x-phanyx-secret",
      "proxy-authorization",
    ]);

  req.headers.forEach(
    (valor, chave) => {
      const normalizada =
        chave.toLowerCase();

      if (
        bloqueados.has(
          normalizada
        )
      ) {
        return;
      }

      headers[normalizada] =
        valor.slice(
          0,
          4000
        );
    }
  );

  return headers;
}

function valorMetadata(
  metadata:
    Record<string, unknown>,
  nomes: string[],
  limite = 500
) {
  for (
    const nome of nomes
  ) {
    const valor =
      textoOuNull(
        metadata[nome],
        limite
      );

    if (valor) {
      return valor;
    }
  }

  return null;
}

function obterIdentificadorEvento(
  req: NextRequest,
  body:
    Record<string, unknown>
) {
  return (
    textoOuNull(
      req.headers.get(
        "x-event-id"
      ),
      300
    ) ??
    textoOuNull(
      req.headers.get(
        "x-idempotency-key"
      ),
      300
    ) ??
    textoOuNull(
      body.identificadorEvento,
      300
    ) ??
    textoOuNull(
      body.eventId,
      300
    ) ??
    null
  );
}

function obterIdentificadorExterno(
  body:
    Record<string, unknown>,
  identificadorEvento:
    string | null
) {
  return (
    textoOuNull(
      body.identificadorExterno,
      300
    ) ??
    textoOuNull(
      body.externalId,
      300
    ) ??
    identificadorEvento
  );
}

function responder(
  body:
    Record<string, unknown>,
  status: number
) {
  return NextResponse.json(
    body,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    }
  );
}

function responderErro(
  error: unknown
) {
  if (
    error instanceof ErroHttp
  ) {
    return responder(
      {
        success: false,
        error:
          error.message,
        codigo:
          error.codigo,
      },
      error.status
    );
  }

  if (
    error instanceof
    ErroProcessamentoCaptacao
  ) {
    return responder(
      {
        success: false,

        error:
          error.statusFinal ===
            StatusSubmissaoCaptacaoLead.REJEITADA
            ? error.message
            : "O evento foi recebido, mas não pôde ser processado.",

        codigo:
          error.codigo,

        recebido: true,
      },
      error.statusFinal ===
        StatusSubmissaoCaptacaoLead.REJEITADA
        ? 422
        : 500
    );
  }

  console.error(
    "Erro no endpoint público de integração da Central de Captação:",
    error
  );

  return responder(
    {
      success: false,

      error:
        "Não foi possível processar o evento da integração.",

      codigo:
        "ERRO_INTERNO",
    },
    500
  );
}

export async function POST(
  req: NextRequest,
  ctx: {
    params: {
      chave: string;
    };
  }
) {
  let eventoId:
    number | null =
    null;

  let integracaoId:
    number | null =
    null;

  try {
    const chavePublica =
      textoOuNull(
        ctx.params.chave,
        300
      );

    if (!chavePublica) {
      throw new ErroHttp(
        404,
        "Integração não encontrada.",
        "INTEGRACAO_NAO_ENCONTRADA"
      );
    }

    const contentLength =
      Number(
        req.headers.get(
          "content-length"
        ) || 0
      );

    if (
      Number.isFinite(
        contentLength
      ) &&
      contentLength >
      LIMITE_BODY_BYTES
    ) {
      throw new ErroHttp(
        413,
        "O payload excede o tamanho permitido.",
        "PAYLOAD_MUITO_GRANDE"
      );
    }

    const textoBody =
      await req.text();

    if (
      Buffer.byteLength(
        textoBody,
        "utf8"
      ) >
      LIMITE_BODY_BYTES
    ) {
      throw new ErroHttp(
        413,
        "O payload excede o tamanho permitido.",
        "PAYLOAD_MUITO_GRANDE"
      );
    }

    let body:
      Record<string, unknown>;

    try {
      const recebido =
        JSON.parse(
          textoBody
        ) as unknown;

      if (
        !ehRegistro(
          recebido
        )
      ) {
        throw new Error();
      }

      body =
        recebido;
    } catch {
      throw new ErroHttp(
        400,
        "JSON inválido.",
        "JSON_INVALIDO"
      );
    }

    const integracao =
      await prisma.integracaoCaptacaoLead.findFirst({
        where: {
          chavePublica,

          ativo: true,

          status:
            StatusIntegracaoCaptacaoLead.ATIVA,

          tipo: {
            in: [
              TipoIntegracaoCaptacaoLead.WEBHOOK_ENTRADA,
              TipoIntegracaoCaptacaoLead.API,
            ],
          },
        },

        select: {
          id: true,
          instituicaoId:
            true,

          canalId: true,
          campanhaId:
            true,
          formularioId:
            true,

          tipo: true,
          status: true,

          segredoCriptografado:
            true,

          formulario: {
            select: {
              id: true,

              textoConsentimento:
                true,

              versaoConsentimento:
                true,
            },
          },
        },
      });

    if (!integracao) {
      /*
       * Não revelamos se a chave
       * existe mas está pausada,
       * revogada ou pertence a
       * outro tipo.
       */
      throw new ErroHttp(
        404,
        "Integração não encontrada ou indisponível.",
        "INTEGRACAO_INDISPONIVEL"
      );
    }

    integracaoId =
      integracao.id;

    if (
      !integracao
        .segredoCriptografado
    ) {
      throw new ErroHttp(
        503,
        "Esta integração ainda não possui credencial configurada.",
        "SEGREDO_NAO_CONFIGURADO"
      );
    }

    const segredoRecebido =
      obterSegredo(req);

    if (!segredoRecebido) {
      throw new ErroHttp(
        401,
        "Credencial da integração não informada.",
        "CREDENCIAL_AUSENTE"
      );
    }

    const segredoEsperado =
      descriptografarSegredo(
        integracao
          .segredoCriptografado
      );

    if (
      !segredosIguais(
        segredoRecebido,
        segredoEsperado
      )
    ) {
      throw new ErroHttp(
        401,
        "Credencial da integração inválida.",
        "CREDENCIAL_INVALIDA"
      );
    }

    const dados =
      ehRegistro(
        body.dados
      )
        ? body.dados
        : null;

    if (!dados) {
      throw new ErroHttp(
        400,
        'Envie os dados do lead dentro da propriedade "dados".',
        "DADOS_INVALIDOS"
      );
    }

    const metadata =
      ehRegistro(
        body.metadados
      )
        ? body.metadados
        : {};

    const identificadorEvento =
      obterIdentificadorEvento(
        req,
        body
      );

    const identificadorExterno =
      obterIdentificadorExterno(
        body,
        identificadorEvento
      );

    /*
     * Idempotência por evento.
     *
     * Se o sistema externo repetir
     * a mesma entrega, retornamos
     * sucesso sem criar outro lead.
     */
    if (identificadorEvento) {
      const eventoExistente =
        await prisma.eventoIntegracaoCaptacaoLead.findFirst({
          where: {
            integracaoId:
              integracao.id,

            identificadorEvento,
          },

          select: {
            id: true,
            submissaoId:
              true,
            status: true,
          },
        });

      if (
        eventoExistente
      ) {
        return responder(
          {
            success: true,

            message:
              "Evento já recebido anteriormente.",

            idempotente:
              true,

            eventoId:
              eventoExistente.id,

            submissaoId:
              eventoExistente.submissaoId,

            statusEvento:
              eventoExistente.status,
          },
          200
        );
      }
    }

    /*
     * Também há idempotência no
     * nível da submissão:
     *
     * @@unique([
     *   integracaoId,
     *   identificadorExterno
     * ])
     */
    if (
      identificadorExterno
    ) {
      const existente =
        await prisma.submissaoCaptacaoLead.findFirst({
          where: {
            integracaoId:
              integracao.id,

            identificadorExterno,
          },

          select: {
            id: true,
            leadId: true,
            status: true,
          },
        });

      if (existente) {
        return responder(
          {
            success: true,

            message:
              "Submissão já recebida anteriormente.",

            idempotente:
              true,

            submissaoId:
              existente.id,

            statusSubmissao:
              existente.status,
          },
          200
        );
      }
    }

    const consentimentoLgpd =
      booleano(
        body.consentimentoLgpd ??
        metadata.consentimentoLgpd
      );

    const utmSource =
      valorMetadata(
        metadata,
        [
          "utmSource",
          "utm_source",
        ]
      );

    const utmMedium =
      valorMetadata(
        metadata,
        [
          "utmMedium",
          "utm_medium",
        ]
      );

    const utmCampaign =
      valorMetadata(
        metadata,
        [
          "utmCampaign",
          "utm_campaign",
        ]
      );

    const utmContent =
      valorMetadata(
        metadata,
        [
          "utmContent",
          "utm_content",
        ]
      );

    const utmTerm =
      valorMetadata(
        metadata,
        [
          "utmTerm",
          "utm_term",
        ]
      );

    const gclid =
      valorMetadata(
        metadata,
        ["gclid"]
      );

    const fbclid =
      valorMetadata(
        metadata,
        ["fbclid"]
      );

    const msclkid =
      valorMetadata(
        metadata,
        ["msclkid"]
      );

    const paginaOrigem =
      valorMetadata(
        metadata,
        [
          "paginaOrigem",
          "pageUrl",
          "url",
        ],
        4000
      );

    const referrer =
      valorMetadata(
        metadata,
        [
          "referrer",
          "referer",
        ],
        4000
      );

    const idioma =
      valorMetadata(
        metadata,
        [
          "idioma",
          "language",
        ],
        100
      );

    const userAgent =
      textoOuNull(
        req.headers.get(
          "user-agent"
        ),
        4000
      );

    const tipoEvento =
      textoOuNull(
        body.tipoEvento,
        200
      ) ??
      "LEAD_RECEBIDO";

    /*
     * Primeiro persistimos evento
     * e submissão.
     *
     * Só depois chamamos o motor.
     * Assim nenhum webhook recebido
     * desaparece se houver erro.
     */
    const criado =
      await prisma.$transaction(
        async (tx) => {
          const evento =
            await tx.eventoIntegracaoCaptacaoLead.create({
              data: {
                instituicaoId:
                  integracao.instituicaoId,

                integracaoId:
                  integracao.id,

                identificadorEvento,

                tipoEvento,

                direcao:
                  DirecaoEventoIntegracaoCaptacaoLead.ENTRADA,

                status:
                  StatusEventoIntegracaoCaptacaoLead.RECEBIDO,

                headers:
                  paraJsonPrisma(
                    headersAuditaveis(
                      req
                    )
                  ),

                payload:
                  paraJsonPrisma(
                    body
                  ),
              },

              select: {
                id: true,
              },
            });

          const submissao =
            await tx.submissaoCaptacaoLead.create({
              data: {
                instituicaoId:
                  integracao.instituicaoId,

                canalId:
                  integracao.canalId,

                campanhaId:
                  integracao.campanhaId,

                formularioId:
                  integracao.formularioId,

                integracaoId:
                  integracao.id,

                identificadorExterno,

                status:
                  StatusSubmissaoCaptacaoLead.RECEBIDA,

                dadosOriginais:
                  paraJsonPrisma(
                    dados
                  ),

                utmSource,
                utmMedium,
                utmCampaign,
                utmContent,
                utmTerm,

                gclid,
                fbclid,
                msclkid,

                paginaOrigem,
                referrer,
                userAgent,
                idioma,

                consentimentoLgpd,

                consentimentoEm:
                  consentimentoLgpd
                    ? new Date()
                    : null,

                versaoConsentimento:
                  consentimentoLgpd
                    ? (
                      textoOuNull(
                        body.versaoConsentimento,
                        200
                      ) ??
                      integracao
                        .formulario
                        ?.versaoConsentimento ??
                      null
                    )
                    : null,

                textoConsentimentoSnapshot:
                  consentimentoLgpd
                    ? (
                      integracao
                        .formulario
                        ?.textoConsentimento ??
                      null
                    )
                    : null,
              },

              select: {
                id: true,
              },
            });

          await tx.eventoIntegracaoCaptacaoLead.update({
            where: {
              id:
                evento.id,
            },

            data: {
              submissaoId:
                submissao.id,

              status:
                StatusEventoIntegracaoCaptacaoLead.PROCESSANDO,

              numeroTentativas: {
                increment: 1,
              },
            },
          });

          return {
            eventoId:
              evento.id,

            submissaoId:
              submissao.id,
          };
        }
      );

    eventoId =
      criado.eventoId;

    try {
      const resultado =
        await processarSubmissaoCaptacao({
          submissaoId:
            criado.submissaoId,

          instituicaoId:
            integracao.instituicaoId,
        });

      const agora =
        new Date();

      await prisma.$transaction([
        prisma.eventoIntegracaoCaptacaoLead.update({
          where: {
            id:
              criado.eventoId,
          },

          data: {
            status:
              StatusEventoIntegracaoCaptacaoLead.PROCESSADO,

            processadoEm:
              agora,

            codigoHttp:
              200,

            resposta:
              paraJsonPrisma({
                success: true,

                submissaoId:
                  resultado.submissaoId,

                status:
                  resultado.status,

                resultadoDeduplicacao:
                  resultado.resultadoDeduplicacao,

                leadId:
                  resultado.leadId,
              }),

            mensagemErro:
              null,
          },
        }),

        prisma.integracaoCaptacaoLead.update({
          where: {
            id:
              integracao.id,
          },

          data: {
            ultimoSucessoEm:
              agora,
          },
        }),
      ]);

      /*
       * Não devolvemos os dados do
       * lead nem se ele já existia.
       *
       * O integrador recebe somente
       * os IDs técnicos necessários
       * para rastrear a entrega.
       */
      return responder(
        {
          success: true,

          message:
            "Evento recebido e processado com sucesso.",

          eventoId:
            criado.eventoId,

          submissaoId:
            criado.submissaoId,

          status:
            resultado.status,

          idempotente:
            false,
        },
        201
      );
    } catch (error) {
      const agora =
        new Date();

      const codigo =
        error instanceof
          ErroProcessamentoCaptacao
          ? error.codigo
          : "ERRO_PROCESSAMENTO";

      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro desconhecido no processamento.";

      const codigoHttp =
        error instanceof ErroProcessamentoCaptacao &&
          error.statusFinal ===
          StatusSubmissaoCaptacaoLead.REJEITADA
          ? 422
          : 500;

      try {
        await prisma.$transaction([
          prisma.eventoIntegracaoCaptacaoLead.update({
            where: {
              id:
                criado.eventoId,
            },

            data: {
              status:
                StatusEventoIntegracaoCaptacaoLead.ERRO,

              processadoEm:
                agora,

              codigoHttp,

              mensagemErro:
                mensagem,

              resposta:
                paraJsonPrisma({
                  success:
                    false,
                  codigo,
                }),
            },
          }),

          prisma.integracaoCaptacaoLead.update({
            where: {
              id:
                integracao.id,
            },

            data: {
              ultimoErroEm:
                agora,

              ultimoErro:
                mensagem,
            },
          }),
        ]);
      } catch (
      erroAuditoria
      ) {
        console.error(
          "Erro ao registrar falha do evento de integração:",
          erroAuditoria
        );
      }

      throw error;
    }
  } catch (error) {
    /*
     * Se o evento já foi persistido,
     * a tentativa de processamento
     * acima já registra a falha.
     *
     * Antes disso não existe evento
     * seguro para atualizar.
     */
    if (
      eventoId &&
      integracaoId
    ) {
      // Falha já auditada.
    }

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      /*
       * Proteção contra duas entregas
       * idênticas chegando exatamente
       * ao mesmo tempo.
       */
      return responder(
        {
          success: true,

          message:
            "Evento já recebido anteriormente.",

          idempotente:
            true,
        },
        200
      );
    }

    return responderErro(
      error
    );
  }
}