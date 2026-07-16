import {
  NextRequest,
  NextResponse,
} from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class ErroHttp extends Error {
  status: number;
  codigo?: string;

  constructor(
    status: number,
    mensagem: string,
    codigo?: string
  ) {
    super(mensagem);

    this.name = "ErroHttp";
    this.status = status;
    this.codigo = codigo;
  }
}

function limparTexto(
  valor: unknown,
  tamanhoMaximo: number
) {
  return String(valor || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, tamanhoMaximo);
}

function obterIdsUsuario(user: any) {
  const usuarioId = Number(user?.id);
  const instituicaoId = Number(
    user?.instituicaoId
  );

  if (
    !Number.isInteger(usuarioId) ||
    usuarioId <= 0 ||
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    throw new ErroHttp(
      401,
      "Usuário ou instituição não identificado.",
      "USUARIO_INVALIDO"
    );
  }

  return {
    usuarioId,
    instituicaoId,
  };
}

function dataValida(valor: unknown) {
  const data = new Date(
    String(valor || "")
  );

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}

async function validarPermissao(
  user: any
) {
  const podeGerenciar =
    await usuarioPossuiPermissao(
      user,
      "rh.ponto.mobile.ocorrencias.gerenciar"
    );

  if (!podeGerenciar) {
    throw new ErroHttp(
      403,
      "Você não possui permissão para autorizar correções de ponto.",
      "SEM_PERMISSAO"
    );
  }
}

export async function POST(
  req: NextRequest
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      throw new ErroHttp(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    await validarPermissao(user);

    const {
      usuarioId,
      instituicaoId,
    } = obterIdsUsuario(user);

    const body = await req
      .json()
      .catch(() => ({}));

    const pontoFuncionarioRHId =
      Number(
        body?.pontoFuncionarioRHId
      );

    const motivoAutorizacao =
      limparTexto(
        body?.motivoAutorizacao,
        1500
      );

    const validoAte =
      dataValida(body?.validoAte);

    if (
      !Number.isInteger(
        pontoFuncionarioRHId
      ) ||
      pontoFuncionarioRHId <= 0
    ) {
      throw new ErroHttp(
        400,
        "Registro diário de ponto inválido.",
        "PONTO_INVALIDO"
      );
    }

    if (
      motivoAutorizacao.length < 10
    ) {
      throw new ErroHttp(
        400,
        "Informe o motivo da autorização com pelo menos 10 caracteres.",
        "MOTIVO_OBRIGATORIO"
      );
    }

    if (!validoAte) {
      throw new ErroHttp(
        400,
        "Informe até quando a autorização será válida.",
        "VALIDADE_INVALIDA"
      );
    }

    const agora = new Date();

    if (
      validoAte.getTime() <=
      agora.getTime() + 5 * 60 * 1000
    ) {
      throw new ErroHttp(
        400,
        "A validade precisa ser pelo menos 5 minutos após o horário atual.",
        "VALIDADE_MUITO_CURTA"
      );
    }

    if (
      validoAte.getTime() >
      agora.getTime() +
        30 * 24 * 60 * 60 * 1000
    ) {
      throw new ErroHttp(
        400,
        "A autorização não pode ficar válida por mais de 30 dias.",
        "VALIDADE_MUITO_LONGA"
      );
    }

    const ponto =
      await prisma.pontoFuncionarioRH.findFirst({
        where: {
          id: pontoFuncionarioRHId,
          instituicaoId,
        },

        select: {
          id: true,
          data: true,

          funcionario: {
            select: {
              id: true,
              nome: true,
              userId: true,
            },
          },

          instituicao: {
            select: {
              slug: true,
            },
          },
        },
      });

    if (!ponto) {
      throw new ErroHttp(
        404,
        "O registro de ponto não foi encontrado nesta instituição.",
        "PONTO_NAO_ENCONTRADO"
      );
    }

    await prisma.autorizacaoCorrecaoPontoRH.updateMany({
      where: {
        instituicaoId,
        pontoFuncionarioRHId:
          ponto.id,

        status: "ATIVA",

        validoAte: {
          lte: agora,
        },
      },

      data: {
        status: "EXPIRADA",
      },
    });

    const existente =
      await prisma.autorizacaoCorrecaoPontoRH.findFirst({
        where: {
          instituicaoId,
          pontoFuncionarioRHId:
            ponto.id,

          status: "ATIVA",

          validoAte: {
            gt: agora,
          },
        },

        orderBy: {
          criadoEm: "desc",
        },

        select: {
          id: true,
          autorizadoPorNome: true,
          validoAte: true,
        },
      });

    if (existente) {
      throw new ErroHttp(
        409,
        `Já existe uma autorização ativa emitida por ${existente.autorizadoPorNome}.`,
        "AUTORIZACAO_JA_EXISTE"
      );
    }

    const nomeResponsavel =
      limparTexto(
        user.nome ||
          "Responsável do RH",
        200
      );

    const dataTexto =
      ponto.data
        .toISOString()
        .slice(0, 10);

    const autorizacao =
      await prisma.$transaction(
        async (tx) => {
          const criada =
            await tx.autorizacaoCorrecaoPontoRH.create({
              data: {
                instituicaoId,

                funcionarioId:
                  ponto.funcionario.id,

                pontoFuncionarioRHId:
                  ponto.id,

                dataLocal:
                  ponto.data,

                autorizadoPorId:
                  usuarioId,

                autorizadoPorNome:
                  nomeResponsavel,

                motivoAutorizacao,

                status: "ATIVA",

                autorizadoEm: agora,
                validoAte,

                limiteEnvios: 1,
                enviosRealizados: 0,
              },

              select: {
                id: true,
                status: true,
                motivoAutorizacao: true,
                autorizadoEm: true,
                validoAte: true,
                autorizadoPorNome: true,
              },
            });

          if (
            Number.isInteger(
              ponto.funcionario.userId
            ) &&
            ponto.funcionario.userId > 0
          ) {
            await tx.notificacao.create({
              data: {
                usuarioId:
                  ponto.funcionario.userId,

                instituicaoId,

                tipo:
                  "PONTO_CORRECAO_AUTORIZADA",

                categoria: "RH",

                titulo:
                  "Correção de ponto autorizada",

                descricao:
                  `${nomeResponsavel} autorizou você a corrigir as marcações de ${dataTexto}. A autorização é válida até ${validoAte.toLocaleString("pt-BR")}.`,

                link:
                  `/rh-app/${encodeURIComponent(
                    ponto.instituicao.slug
                  )}/ponto#meus-pontos`,

                quantidade: 1,

                chaveAgrupada:
                  `ponto-correcao-autorizada:${criada.id}`,

                lida: false,
              },
            });
          }

          return criada;
        }
      );

    return NextResponse.json(
      {
        sucesso: true,

        mensagem:
          "Correção autorizada para o funcionário.",

        autorizacao: {
          id: autorizacao.id,
          status:
            autorizacao.status,

          motivoAutorizacao:
            autorizacao
              .motivoAutorizacao,

          autorizadoEm:
            autorizacao
              .autorizadoEm
              .toISOString(),

          validoAte:
            autorizacao
              .validoAte
              .toISOString(),

          autorizadoPorNome:
            autorizacao
              .autorizadoPorNome,
        },
      },
      {
        status: 201,

        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    if (error instanceof ErroHttp) {
      return NextResponse.json(
        {
          error: error.message,
          codigo:
            error.codigo || null,
        },
        {
          status: error.status,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    console.error(
      "Erro ao autorizar correção de ponto:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível autorizar a correção de ponto.",
        codigo: "ERRO_INTERNO",
      },
      {
        status: 500,

        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

export async function DELETE(
  req: NextRequest
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      throw new ErroHttp(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    await validarPermissao(user);

    const {
      usuarioId,
      instituicaoId,
    } = obterIdsUsuario(user);

    const body = await req
      .json()
      .catch(() => ({}));

    const autorizacaoId =
      Number(body?.autorizacaoId);

    const motivoCancelamento =
      limparTexto(
        body?.motivoCancelamento,
        1500
      );

    if (
      !Number.isInteger(
        autorizacaoId
      ) ||
      autorizacaoId <= 0
    ) {
      throw new ErroHttp(
        400,
        "Autorização inválida.",
        "AUTORIZACAO_INVALIDA"
      );
    }

    if (
      motivoCancelamento.length < 5
    ) {
      throw new ErroHttp(
        400,
        "Informe o motivo do cancelamento.",
        "MOTIVO_CANCELAMENTO_OBRIGATORIO"
      );
    }

    const autorizacao =
      await prisma.autorizacaoCorrecaoPontoRH.findFirst({
        where: {
          id: autorizacaoId,
          instituicaoId,
        },

        select: {
          id: true,
          status: true,
          funcionario: {
            select: {
              userId: true,
              nome: true,
            },
          },
        },
      });

    if (!autorizacao) {
      throw new ErroHttp(
        404,
        "Autorização não encontrada.",
        "AUTORIZACAO_NAO_ENCONTRADA"
      );
    }

    if (
      autorizacao.status !== "ATIVA"
    ) {
      throw new ErroHttp(
        409,
        "Somente autorizações ativas podem ser canceladas.",
        "AUTORIZACAO_NAO_ATIVA"
      );
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.autorizacaoCorrecaoPontoRH.update({
          where: {
            id: autorizacao.id,
          },

          data: {
            status: "CANCELADA",
            canceladoEm: new Date(),
            canceladoPorId:
              usuarioId,
            motivoCancelamento,
          },
        });

        if (
          Number.isInteger(
            autorizacao
              .funcionario.userId
          ) &&
          autorizacao
            .funcionario.userId > 0
        ) {
          await tx.notificacao.create({
            data: {
              usuarioId:
                autorizacao
                  .funcionario.userId,

              instituicaoId,

              tipo:
                "PONTO_CORRECAO_CANCELADA",

              categoria: "RH",

              titulo:
                "Autorização de correção cancelada",

              descricao:
                `A autorização de correção de ponto foi cancelada pelo RH. Motivo: ${motivoCancelamento}`,

              link: null,

              quantidade: 1,

              chaveAgrupada:
                `ponto-correcao-cancelada:${autorizacao.id}`,

              lida: false,
            },
          });
        }
      }
    );

    return NextResponse.json({
      sucesso: true,
      mensagem:
        "Autorização cancelada.",
    });
  } catch (error) {
    if (error instanceof ErroHttp) {
      return NextResponse.json(
        {
          error: error.message,
          codigo:
            error.codigo || null,
        },
        {
          status: error.status,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    console.error(
      "Erro ao cancelar autorização de correção:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível cancelar a autorização.",
      },
      {
        status: 500,

        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}