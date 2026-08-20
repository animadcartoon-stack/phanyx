import {
  DirecaoEventoIntegracaoCaptacaoLead,
  StatusEventoIntegracaoCaptacaoLead,
  StatusIntegracaoCaptacaoLead,
  TipoIntegracaoCaptacaoLead,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  timingSafeEqual,
} from "crypto";

import { prisma } from "@/lib/prisma";

import {
  processarEventoSaidaCaptacao,
} from "@/lib/comercial/captacao/processar-evento-saida";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const maxDuration = 60;

/*
 * Mantemos lotes pequenos porque
 * cada evento pode realizar uma
 * chamada HTTP externa.
 */
const LOTE_PADRAO =
  10;

const LOTE_MAXIMO =
  25;

/*
* Deixamos margem para o último
* webhook iniciado usar seu timeout
* máximo de 30 segundos sem exceder
* os 60 segundos da função.
*/
const LIMITE_INICIO_NOVO_EVENTO_MS =
  25_000;

/*
 * Se uma execução morrer depois do
 * claim PROCESSANDO, o evento não
 * pode ficar preso para sempre.
 */
const TEMPO_PROCESSAMENTO_TRAVADO_MS =
  15 * 60 * 1000;

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

function inteiroPositivo(
  valor: unknown,
  padrao: number,
  maximo: number
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return padrao;
  }

  const numero =
    Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return Math.min(
    numero,
    maximo
  );
}

function obterSegredoWorker() {
  /*
   * CRON_SECRET será o principal
   * quando ligarmos este endpoint
   * ao cron.
   *
   * CAPTACAO_WORKER_SECRET fica como
   * alternativa para execução
   * interna/manual.
   */
  const segredo =
    process.env.CRON_SECRET ||
    process.env
      .CAPTACAO_WORKER_SECRET;

  if (!segredo) {
    throw new ErroHttp(
      503,
      "O worker da Central de Captação não está configurado.",
      "WORKER_NAO_CONFIGURADO"
    );
  }

  return segredo;
}

function obterBearer(
  req: NextRequest
) {
  const authorization =
    req.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization
      .toLowerCase()
      .startsWith(
        "bearer "
      )
  ) {
    return null;
  }

  const segredo =
    authorization
      .slice(7)
      .trim();

  return segredo || null;
}

function compararSegredos(
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

function autenticarWorker(
  req: NextRequest
) {
  const recebido =
    obterBearer(
      req
    );

  if (!recebido) {
    throw new ErroHttp(
      401,
      "Credencial do worker não informada.",
      "WORKER_NAO_AUTENTICADO"
    );
  }

  const esperado =
    obterSegredoWorker();

  if (
    !compararSegredos(
      recebido,
      esperado
    )
  ) {
    throw new ErroHttp(
      401,
      "Credencial do worker inválida.",
      "WORKER_CREDENCIAL_INVALIDA"
    );
  }
}

function mensagemErro(
  error: unknown
) {
  if (
    error instanceof Error
  ) {
    return error.message.slice(
      0,
      4000
    );
  }

  return "Erro desconhecido.";
}

function responderErro(
  error: unknown
) {
  if (
    error instanceof ErroHttp
  ) {
    return NextResponse.json(
      {
        success: false,

        error:
          error.message,

        codigo:
          error.codigo,
      },
      {
        status:
          error.status,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  console.error(
    "Erro no worker da fila de integrações da Central de Captação:",
    error
  );

  return NextResponse.json(
    {
      success: false,

      error:
        "Não foi possível executar a fila das integrações.",

      codigo:
        "ERRO_INTERNO",
    },
    {
      status: 500,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    }
  );
}

async function recuperarProcessamentosTravados() {
  const limite =
    new Date(
      Date.now() -
      TEMPO_PROCESSAMENTO_TRAVADO_MS
    );

  const agora =
    new Date();

  const recuperados =
    await prisma.eventoIntegracaoCaptacaoLead.updateMany({
      where: {
        direcao:
          DirecaoEventoIntegracaoCaptacaoLead.SAIDA,

        status:
          StatusEventoIntegracaoCaptacaoLead.PROCESSANDO,

        atualizadoEm: {
          lte:
            limite,
        },
      },

      data: {
        status:
          StatusEventoIntegracaoCaptacaoLead.ERRO,

        proximaTentativaEm:
          agora,

        mensagemErro:
          "Processamento anterior interrompido antes da conclusão. Evento devolvido automaticamente à fila.",
      },
    });

  return recuperados.count;
}

async function executarWorker(
  req: NextRequest
) {
  try {
    autenticarWorker(
      req
    );

    const limite =
      inteiroPositivo(
        req.nextUrl.searchParams.get(
          "limite"
        ),
        LOTE_PADRAO,
        LOTE_MAXIMO
      );

    if (!limite) {
      throw new ErroHttp(
        400,
        "O limite do lote é inválido.",
        "LIMITE_INVALIDO"
      );
    }

    const iniciadoEm =
      new Date();

    const inicioMs =
      Date.now();

    /*
     * Primeiro recuperamos possíveis
     * eventos abandonados por uma
     * execução anterior interrompida.
     */
    const travadosRecuperados =
      await recuperarProcessamentosTravados();

    const agora =
      new Date();

    /*
     * Não filtramos a integração por
     * ATIVA aqui.
     *
     * O processador individual decide
     * se deve:
     *
     * - entregar;
     * - manter em fila;
     * - descartar;
     * - registrar erro.
     *
     * Isso é importante para eventos
     * antigos de integrações que foram
     * posteriormente revogadas.
     */
    const eventos =
      await prisma.eventoIntegracaoCaptacaoLead.findMany({
        where: {
          direcao:
            DirecaoEventoIntegracaoCaptacaoLead.SAIDA,

          integracao: {
            OR: [
              /*
               * Integrações ativas podem
               * entregar normalmente.
               */
              {
                tipo:
                  TipoIntegracaoCaptacaoLead.WEBHOOK_SAIDA,

                status:
                  StatusIntegracaoCaptacaoLead.ATIVA,

                ativo:
                  true,
              },

              /*
               * Estes casos precisam passar
               * pelo processador uma vez para
               * que seus eventos sejam
               * descartados corretamente.
               */
              {
                status:
                  StatusIntegracaoCaptacaoLead.REVOGADA,
              },

              {
                ativo:
                  false,
              },

              {
                tipo: {
                  not:
                    TipoIntegracaoCaptacaoLead.WEBHOOK_SAIDA,
                },
              },
            ],
          },

          status: {
            in: [
              StatusEventoIntegracaoCaptacaoLead.PENDENTE,
              StatusEventoIntegracaoCaptacaoLead.ERRO,
            ],
          },

          OR: [
            {
              proximaTentativaEm:
                null,
            },

            {
              proximaTentativaEm: {
                lte:
                  agora,
              },
            },
          ],
        },

        select: {
          id: true,

          instituicaoId:
            true,

          integracaoId:
            true,

          tipoEvento:
            true,

          status:
            true,

          numeroTentativas:
            true,

          proximaTentativaEm:
            true,

          criadoEm:
            true,
        },

        orderBy: [
          {
            proximaTentativaEm:
              "asc",
          },

          {
            criadoEm:
              "asc",
          },

          {
            id:
              "asc",
          },
        ],

        take:
          limite,
      });

    const resultados: Array<{
      eventoId: number;

      instituicaoId:
      number;

      integracaoId:
      number;

      tipoEvento:
      string;

      statusAnterior:
      string;

      statusFinal:
      string | null;

      tentativa:
      number | null;

      entregue:
      boolean;

      descartado:
      boolean;

      ignorado:
      boolean;

      codigoHttp:
      number | null;

      proximaTentativaEm:
      Date | null;

      mensagem:
      string;

      duracaoMs:
      number;
    }> = [];

    let interrompidoPorTempo =
      false;

    /*
     * Processamento sequencial
     * proposital.
     *
     * Cada evento já possui timeout
     * próprio e o lote é pequeno.
     * Isso reduz rajadas contra
     * sistemas externos e diminui
     * risco de estourar conexões.
     */

    for (
      const evento of
      eventos
    ) {
      if (
        Date.now() -
        inicioMs >=
        LIMITE_INICIO_NOVO_EVENTO_MS
      ) {
        interrompidoPorTempo =
          true;

        break;
      }
      const inicioEvento =
        Date.now();

      try {
        const resultado =
          await processarEventoSaidaCaptacao({
            eventoId:
              evento.id,

            instituicaoId:
              evento.instituicaoId,
          });

        resultados.push({
          eventoId:
            evento.id,

          instituicaoId:
            evento.instituicaoId,

          integracaoId:
            evento.integracaoId,

          tipoEvento:
            evento.tipoEvento,

          statusAnterior:
            evento.status,

          statusFinal:
            resultado.status,

          tentativa:
            resultado.tentativa,

          entregue:
            resultado.entregue,

          descartado:
            resultado.descartado,

          ignorado:
            resultado.ignorado,

          codigoHttp:
            resultado.codigoHttp,

          proximaTentativaEm:
            resultado.proximaTentativaEm,

          mensagem:
            resultado.mensagem,

          duracaoMs:
            Date.now() -
            inicioEvento,
        });
      } catch (error) {
        /*
         * Uma falha inesperada em um
         * evento não deve interromper
         * todo o lote.
         */
        console.error(
          `Erro inesperado ao processar evento de saída ${evento.id}:`,
          error
        );

        resultados.push({
          eventoId:
            evento.id,

          instituicaoId:
            evento.instituicaoId,

          integracaoId:
            evento.integracaoId,

          tipoEvento:
            evento.tipoEvento,

          statusAnterior:
            evento.status,

          statusFinal:
            null,

          tentativa:
            null,

          entregue:
            false,

          descartado:
            false,

          ignorado:
            false,

          codigoHttp:
            null,

          proximaTentativaEm:
            evento.proximaTentativaEm,

          mensagem:
            mensagemErro(
              error
            ),

          duracaoMs:
            Date.now() -
            inicioEvento,
        });
      }
    }

    const entregues =
      resultados.filter(
        (item) =>
          item.entregue
      ).length;

    const descartados =
      resultados.filter(
        (item) =>
          item.descartado
      ).length;

    const ignorados =
      resultados.filter(
        (item) =>
          item.ignorado
      ).length;

    const comErro =
      resultados.filter(
        (item) =>
          !item.entregue &&
          !item.descartado &&
          !item.ignorado
      ).length;

    const finalizadoEm =
      new Date();

    return NextResponse.json(
      {
        success: true,

        message:
          "Fila de integrações processada.",

        execucao: {
          iniciadoEm,
          finalizadoEm,

          duracaoMs:
            Date.now() -
            inicioMs,

          limite,

          travadosRecuperados,

          interrompidoPorTempo,

          encontrados:
            eventos.length,

          processados:
            resultados.length,

          entregues,

          descartados,

          ignorados,

          comErro,
        },

        resultados,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return responderErro(
      error
    );
  }
}

/*
 * GET:
 * usado pelo agendador.
 */
export async function GET(
  req: NextRequest
) {
  return executarWorker(
    req
  );
}

/*
 * POST:
 * permite execução interna/manual
 * usando a mesma credencial.
 */
export async function POST(
  req: NextRequest
) {
  return executarWorker(
    req
  );
}