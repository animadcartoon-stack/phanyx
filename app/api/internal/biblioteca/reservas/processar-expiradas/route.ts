import {
  StatusExemplarBiblioteca,
  StatusReservaBiblioteca,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { timingSafeEqual } from "crypto";

import { prisma } from "@/lib/prisma";

import {
  processarExpiracaoReservaDisponivel,
} from "@/lib/biblioteca/processar-expiracao-reserva";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export const revalidate = 0;

export const maxDuration = 60;

const LIMITE_POR_EXECUCAO = 100;

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

function obterSegredoCron() {
  const segredo =
    process.env.CRON_SECRET?.trim();

  if (!segredo) {
    throw new ErroHttp(
      503,
      "O cron de expiração das reservas da Biblioteca não está configurado.",
      "CRON_NAO_CONFIGURADO"
    );
  }

  return segredo;
}

function obterBearer(
  request: NextRequest
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
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

function autenticarCron(
  request: NextRequest
) {
  const recebido =
    obterBearer(request);

  if (!recebido) {
    throw new ErroHttp(
      401,
      "Credencial do cron não informada.",
      "CRON_NAO_AUTENTICADO"
    );
  }

  const esperado =
    obterSegredoCron();

  if (
    !compararSegredos(
      recebido,
      esperado
    )
  ) {
    throw new ErroHttp(
      401,
      "Credencial do cron inválida.",
      "CRON_CREDENCIAL_INVALIDA"
    );
  }
}

function obterIp(
  request: NextRequest
) {
  const encaminhado =
    request.headers.get(
      "x-forwarded-for"
    );

  return (
    encaminhado
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get(
      "x-real-ip"
    ) ||
    null
  );
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
    "[biblioteca][reservas][expiracao]",
    error
  );

  return NextResponse.json(
    {
      success: false,

      error:
        "Não foi possível processar as reservas expiradas.",

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

async function executar(
  request: NextRequest
) {
  try {
    autenticarCron(
      request
    );

    const agora =
      new Date();

    const ip =
      obterIp(request);

    const userAgent =
      request.headers.get(
        "user-agent"
      );

    /*
     * Selecionamos apenas reservas
     * que já venceram e continuam
     * marcadas como DISPONIVEL.
     *
     * Cada uma será novamente
     * validada dentro da transação.
     */
    const candidatas =
      await prisma.bibliotecaReserva.findMany({
        where: {
          status:
            StatusReservaBiblioteca.DISPONIVEL,

          expiraEm: {
            not: null,
            lte: agora,
          },
        },

        orderBy: [
          {
            expiraEm: "asc",
          },
          {
            id: "asc",
          },
        ],

        take:
          LIMITE_POR_EXECUCAO,

        select: {
          id: true,
        },
      });

    let processadas = 0;

    let ignoradas = 0;

    let falhas = 0;

    let promovidas = 0;

    let exemplaresLiberados = 0;

    const reservasProcessadas:
      number[] = [];

    const reservasIgnoradas:
      {
        id: number;
        motivo: string | null;
      }[] = [];

    const erros:
      {
        id: number;
        mensagem: string;
      }[] = [];

    for (
      const candidata
      of candidatas
    ) {
      try {
        const resultado =
          await prisma.$transaction(
            async (transacao) => {
              return processarExpiracaoReservaDisponivel({
                transacao,

                reservaId:
                  candidata.id,

                agora,

                origem:
                  "cron_biblioteca_reservas_expiradas",

                usuarioId:
                  null,

                ip,

                userAgent,
              });
            },
            {
              maxWait: 5_000,
              timeout: 10_000,
            }
          );

        if (
          !resultado.processada
        ) {
          ignoradas += 1;

          reservasIgnoradas.push({
            id:
              candidata.id,

            motivo:
              resultado.motivoIgnorada ??
              null,
          });

          continue;
        }

        processadas += 1;

        reservasProcessadas.push(
          candidata.id
        );

        if (
          resultado.proximaReservaId !==
          null
        ) {
          promovidas += 1;
        }

        if (
          resultado.exemplarStatus ===
          StatusExemplarBiblioteca.DISPONIVEL
        ) {
          exemplaresLiberados += 1;
        }
      } catch (error) {
        falhas += 1;

        erros.push({
          id:
            candidata.id,

          mensagem:
            error instanceof Error
              ? error.message
              : "Erro desconhecido",
        });

        console.error(
          `[biblioteca][reservas][expiracao][reserva:${candidata.id}]`,
          error
        );
      }
    }

    const corpo = {
      success:
        falhas === 0,

      executadoEm:
        agora.toISOString(),

      limitePorExecucao:
        LIMITE_POR_EXECUCAO,

      encontradas:
        candidatas.length,

      processadas,

      ignoradas,

      falhas,

      promovidas,

      exemplaresLiberados,

      reservasProcessadas,

      reservasIgnoradas,

      erros,
    };

    return NextResponse.json(
      corpo,
      {
        status:
          falhas > 0
            ? 500
            : 200,

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
 * Vercel Cron executa GET.
 *
 * Mantemos POST também para
 * testes manuais e execução
 * operacional autenticada.
 */
export async function GET(
  request: NextRequest
) {
  return executar(
    request
  );
}

export async function POST(
  request: NextRequest
) {
  return executar(
    request
  );
}