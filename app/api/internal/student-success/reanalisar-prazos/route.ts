import { OrigemAnaliseStudentSuccess } from "@prisma/client";

import { NextRequest, NextResponse } from "next/server";

import { timingSafeEqual } from "crypto";

import { prisma } from "@/lib/prisma";

import { reanalisarInstituicaoStudentSuccess } from "@/lib/student-success/reanalisar-instituicao-student-success";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export const revalidate = 0;

export const maxDuration = 60;

/*
 * O cron poderá executar de hora em hora.
 *
 * Mantemos uma janela de 24 horas para
 * tolerar atrasos ou uma execução perdida.
 *
 * A deduplicação do histórico impede que
 * reprocessamentos dessa janela criem
 * fotografias repetidas.
 */
const JANELA_REANALISE_MS = 24 * 60 * 60 * 1000;

class ErroHttp extends Error {
  status: number;

  codigo: string;

  constructor(status: number, mensagem: string, codigo: string) {
    super(mensagem);

    this.name = "ErroHttp";

    this.status = status;

    this.codigo = codigo;
  }
}

function obterSegredoCron() {
  const segredo = process.env.CRON_SECRET?.trim();

  if (!segredo) {
    throw new ErroHttp(
      503,
      "O cron do Student Success não está configurado.",
      "CRON_NAO_CONFIGURADO",
    );
  }

  return segredo;
}

function obterBearer(req: NextRequest) {
  const authorization = req.headers.get("authorization");

  if (!authorization || !authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const segredo = authorization.slice(7).trim();

  return segredo || null;
}

function compararSegredos(recebido: string, esperado: string) {
  const recebidoBuffer = Buffer.from(recebido, "utf8");

  const esperadoBuffer = Buffer.from(esperado, "utf8");

  if (recebidoBuffer.length !== esperadoBuffer.length) {
    return false;
  }

  return timingSafeEqual(recebidoBuffer, esperadoBuffer);
}

function autenticarCron(req: NextRequest) {
  const recebido = obterBearer(req);

  if (!recebido) {
    throw new ErroHttp(
      401,
      "Credencial do cron não informada.",
      "CRON_NAO_AUTENTICADO",
    );
  }

  const esperado = obterSegredoCron();

  if (!compararSegredos(recebido, esperado)) {
    throw new ErroHttp(
      401,
      "Credencial do cron inválida.",
      "CRON_CREDENCIAL_INVALIDA",
    );
  }
}

function responderErro(error: unknown) {
  if (error instanceof ErroHttp) {
    return NextResponse.json(
      {
        success: false,

        error: error.message,

        codigo: error.codigo,
      },
      {
        status: error.status,

        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }

  console.error("[STUDENT_SUCCESS_CRON_PRAZOS]", error);

  return NextResponse.json(
    {
      success: false,

      error:
        "Não foi possível executar a reanálise automática do Student Success.",

      codigo: "ERRO_INTERNO",
    },
    {
      status: 500,

      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}

async function executarCron(req: NextRequest) {
  try {
    autenticarCron(req);

    const iniciadoEm = new Date();

    const agora = new Date();

    const inicioJanela = new Date(agora.getTime() - JANELA_REANALISE_MS);

    /*
     * Procuramos somente instituições em que
     * alguma atividade passou do prazo dentro
     * da janela de segurança.
     */
    const atividades = await prisma.atividade.findMany({
      where: {
        status: {
          in: ["PUBLICADA", "ENCERRADA"],
        },

        prazo: {
          gt: inicioJanela,

          lte: agora,
        },

        instituicao: {
          ativo: true,
        },
      },

      select: {
        instituicaoId: true,
      },

      distinct: ["instituicaoId"],
    });

    const instituicaoIds = atividades
      .map((atividade) => atividade.instituicaoId)
      .filter(
        (instituicaoId): instituicaoId is number =>
          typeof instituicaoId === "number" &&
          Number.isInteger(instituicaoId) &&
          instituicaoId > 0,
      );

    const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";

    if (dryRun) {
      const finalizadoEm = new Date();

      return NextResponse.json(
        {
          success: true,

          dryRun: true,

          message:
            "Simulação da reanálise automática do Student Success concluída.",

          execucao: {
            iniciadoEm,

            finalizadoEm,

            duracaoMs: finalizadoEm.getTime() - iniciadoEm.getTime(),

            inicioJanela,

            fimJanela: agora,

            atividadesDetectadas: atividades.length,

            instituicoesDetectadas: instituicaoIds.length,

            instituicaoIds,
          },
        },
        {
          status: 200,

          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        },
      );
    }

    const resultados: Array<{
      instituicaoId: number;

      monitorados: number;

      gravadas: number;

      semAlteracao: number;

      iniciais: number;

      alteracoes: number;
    }> = [];

    /*
     * Processamento sequencial proposital.
     *
     * Evita rajadas contra o banco e segue
     * o mesmo padrão das demais reanálises.
     */
    for (const instituicaoId of instituicaoIds) {
      /*
       * Antes de executar o motor inteiro,
       * confirmamos que ainda existe ao menos
       * uma matrícula ativa de aluno ativo.
       */
      const possuiAlunoMonitoravel = await prisma.matricula.findFirst({
        where: {
          instituicaoId,

          status: "ATIVA",

          aluno: {
            ativo: true,
          },

          instituicao: {
            ativo: true,
          },
        },

        select: {
          id: true,
        },
      });

      if (!possuiAlunoMonitoravel) {
        continue;
      }

      const resultado = await reanalisarInstituicaoStudentSuccess({
        instituicaoId,

        origem: OrigemAnaliseStudentSuccess.AUTOMATICA,

        executadoPorId: null,
      });

      resultados.push({
        instituicaoId,

        monitorados: resultado.resumo.monitorados,

        gravadas: resultado.resumo.gravadas,

        semAlteracao: resultado.resumo.semAlteracao,

        iniciais: resultado.resumo.iniciais,

        alteracoes: resultado.resumo.alteracoes,
      });
    }

    const finalizadoEm = new Date();

    return NextResponse.json(
      {
        success: true,

        message: "Reanálise automática do Student Success concluída.",

        execucao: {
          iniciadoEm,

          finalizadoEm,

          duracaoMs: finalizadoEm.getTime() - iniciadoEm.getTime(),

          inicioJanela,

          fimJanela: agora,

          instituicoesDetectadas: instituicaoIds.length,

          instituicoesProcessadas: resultados.length,
        },

        resultados,
      },
      {
        status: 200,

        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    return responderErro(error);
  }
}

/*
 * GET:
 * utilizado pelo Vercel Cron.
 */
export async function GET(req: NextRequest) {
  return executarCron(req);
}

/*
 * POST:
 * permite teste ou execução manual
 * usando o mesmo CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  return executarCron(req);
}
