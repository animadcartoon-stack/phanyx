"use server";

import { randomUUID } from "node:crypto";
import { Prisma, StatusMatricula } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  temPermissao,
  type UsuarioLogado,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const STATUS = {
  RASCUNHO: "RASCUNHO",
  FINALIZADO: "FINALIZADO",
  CANCELADO: "CANCELADO",
} as const;

const SITUACOES = new Set([
  "PENDENTE",
  "QUITADO",
  "ISENTO",
  "VALOR_A_DEVOLVER",
]);

type UsuarioComInstituicao =
  UsuarioLogado & { instituicaoId: number };

class ErroApi extends Error {
  status: number;
  codigo: string;
  detalhes?: Record<string, unknown>;

  constructor(
    status: number,
    mensagem: string,
    codigo: string,
    detalhes?: Record<string, unknown>
  ) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

function inteiroPositivo(valor: unknown) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function texto(valor: unknown, minimo = 0) {
  const final =
    typeof valor === "string"
      ? valor.trim()
      : "";
  return final.length >= minimo ? final : null;
}

function lerData(valor: unknown) {
  const final =
    typeof valor === "string"
      ? valor.trim()
      : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(final)) return null;

  const data =
    new Date(`${final}T12:00:00.000Z`);

  return Number.isNaN(data.getTime())
    ? null
    : data;
}

function numero(
  valor: unknown,
  maximo?: number
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) return 0;

  const final =
    typeof valor === "string"
      ? valor.trim().replace(/\./g, "").replace(",", ".")
      : valor;

  const n = Number(final);

  if (
    !Number.isFinite(n) ||
    n < 0 ||
    (
      maximo !== undefined &&
      n > maximo
    )
  ) {
    throw new ErroApi(
      400,
      "Valor financeiro inválido.",
      "VALOR_FINANCEIRO_INVALIDO"
    );
  }

  return Number(n.toFixed(4));
}

function validar(body: unknown) {
  const corpo =
    body &&
    typeof body === "object" &&
    !Array.isArray(body)
      ? body as Record<string, unknown>
      : {};

  const motivo =
    texto(corpo.motivo, 3);

  if (!motivo) {
    throw new ErroApi(
      400,
      "Informe o motivo do cancelamento.",
      "MOTIVO_CANCELAMENTO_OBRIGATORIO"
    );
  }

  const dataSolicitacao =
    lerData(corpo.dataSolicitacao);

  const dataEfetiva =
    lerData(corpo.dataEfetiva);

  if (!dataSolicitacao) {
    throw new ErroApi(
      400,
      "Data da solicitação inválida.",
      "DATA_SOLICITACAO_INVALIDA"
    );
  }

  if (!dataEfetiva) {
    throw new ErroApi(
      400,
      "Data efetiva inválida.",
      "DATA_EFETIVA_INVALIDA"
    );
  }

  if (
    dataEfetiva.getTime() <
    dataSolicitacao.getTime()
  ) {
    throw new ErroApi(
      400,
      "A data efetiva não pode ser anterior à solicitação.",
      "DATA_EFETIVA_ANTERIOR_SOLICITACAO"
    );
  }

  const situacaoFinanceira =
    String(
      corpo.situacaoFinanceira ||
      "PENDENTE"
    )
      .trim()
      .toUpperCase();

  if (!SITUACOES.has(situacaoFinanceira)) {
    throw new ErroApi(
      400,
      "Situação financeira inválida.",
      "SITUACAO_FINANCEIRA_INVALIDA"
    );
  }

  const valorParcelasVencidas =
    numero(corpo.valorParcelasVencidas);

  const valorMulta =
    numero(corpo.valorMulta);

  const valorJuros =
    numero(corpo.valorJuros);

  const valorCredito =
    numero(corpo.valorCredito);

  const valorDevolucao =
    numero(corpo.valorDevolucao);

  return {
    motivo,
    observacoes:
      texto(corpo.observacoes),
    dataSolicitacao,
    dataEfetiva,
    regraContratual:
      texto(corpo.regraContratual),
    baseCalculoMulta:
      numero(corpo.baseCalculoMulta),
    percentualMulta:
      numero(corpo.percentualMulta, 100),
    valorParcelasVencidas,
    valorMulta,
    valorJuros,
    valorCredito,
    valorDevolucao,
    valorTotal:
      Number(
        Math.max(
          0,
          valorParcelasVencidas +
          valorMulta +
          valorJuros -
          valorCredito
        ).toFixed(2)
      ),
    situacaoFinanceira,
  };
}

function ip(req: Request) {
  return (
    req.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

function userAgent(req: Request) {
  return (
    req.headers
      .get("user-agent")
      ?.trim()
      .slice(0, 4000) ||
    null
  );
}

async function exigirUsuario(
  mutacao = false
): Promise<UsuarioComInstituicao> {
  const user =
    await getUserFromToken();

  if (!user?.instituicaoId) {
    throw new ErroApi(
      401,
      "Usuário não autenticado.",
      "NAO_AUTENTICADO"
    );
  }

  if (
    !temPermissao(
      user,
      "matriculas.cancelar"
    )
  ) {
    throw new ErroApi(
      403,
      "Sem permissão para gerenciar cancelamentos.",
      "SEM_PERMISSAO_CANCELAMENTO"
    );
  }

  if (
    mutacao &&
    user.impersonacao
  ) {
    throw new ErroApi(
      403,
      "Operação bloqueada durante sessão de suporte.",
      "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
    );
  }

  return user as UsuarioComInstituicao;
}

function responder(erro: unknown) {
  if (erro instanceof ErroApi) {
    return NextResponse.json(
      {
        success: false,
        codigo: erro.codigo,
        error: erro.message,
        ...(erro.detalhes
          ? { detalhes: erro.detalhes }
          : {}),
      },
      { status: erro.status }
    );
  }

  console.error(
    "Erro no fluxo de cancelamento:",
    erro
  );

  return NextResponse.json(
    {
      success: false,
      codigo:
        "ERRO_CANCELAMENTO_MATRICULA",
      error:
        "Não foi possível processar o cancelamento.",
    },
    { status: 500 }
  );
}

async function bloquear(
  tx: Prisma.TransactionClient,
  matriculaId: number,
  instituicaoId: number
) {
  await tx.$queryRaw<
    Array<{ id: number }>
  >`
    SELECT "id"
    FROM "Matricula"
    WHERE "id" = ${matriculaId}
      AND "instituicaoId" = ${instituicaoId}
    FOR UPDATE
  `;
}

async function buscarMatricula(
  tx: Prisma.TransactionClient,
  matriculaId: number,
  instituicaoId: number
) {
  return tx.matricula.findFirst({
    where: {
      id: matriculaId,
      instituicaoId,
    },
    select: {
      id: true,
      instituicaoId: true,
      numeroMatricula: true,
      status: true,
      excluidaEm: true,
      canceladaEm: true,
      alunoId: true,
      periodoLetivo: true,
      semestre: true,
      modalidade: true,
      aluno: {
        select: {
          id: true,
          nome: true,
          nomeSocial: true,
          cpf: true,
        },
      },
      curso: {
        select: {
          id: true,
          nome: true,
        },
      },
      polo: {
        select: {
          id: true,
          nome: true,
        },
      },
      turmaPrincipal: {
        select: {
          id: true,
          nome: true,
        },
      },
      instituicao: {
        select: {
          id: true,
          nome: true,
          slug: true,
        },
      },
    },
  });
}

type MatriculaCancelamento =
  Awaited<
    ReturnType<typeof buscarMatricula>
  >;

function validarMatricula(
  matricula: MatriculaCancelamento
) {
  if (!matricula) {
    throw new ErroApi(
      404,
      "Matrícula não encontrada.",
      "MATRICULA_NAO_ENCONTRADA"
    );
  }

  if (matricula.excluidaEm) {
    throw new ErroApi(
      409,
      "Matrícula em quarentena não pode ser cancelada.",
      "MATRICULA_EM_QUARENTENA"
    );
  }

  if (
    matricula.canceladaEm ||
    (
      [
        StatusMatricula.CANCELADA,
        StatusMatricula.CONCLUIDA,
        StatusMatricula.TRANSFERIDA,
      ] as StatusMatricula[]
    ).includes(
      matricula.status
    )
  ) {
    throw new ErroApi(
      409,
      "Matrícula não pode ser cancelada no status atual.",
      "STATUS_MATRICULA_NAO_CANCELAVEL",
      { status: matricula.status }
    );
  }
}

async function responsavel(
  tx: Prisma.TransactionClient,
  user: UsuarioComInstituicao
) {
  const usuario =
    await tx.user.findFirst({
      where: {
        id: user.id,
        instituicaoId:
          user.instituicaoId,
      },
      select: {
        nome: true,
        email: true,
        role: true,
        funcionario: {
          select: {
            cargo: true,
            cargoCadastro: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    });

  return {
    nome:
      usuario?.nome?.trim() ||
      usuario?.email?.trim() ||
      user.nome?.trim() ||
      user.email ||
      `User ${user.id}`,
    cargo:
      usuario?.funcionario
        ?.cargoCadastro?.nome?.trim() ||
      usuario?.funcionario
        ?.cargo?.trim() ||
      usuario?.role ||
      user.role ||
      null,
  };
}

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: { id: string };
  }
) {
  try {
    const user =
      await exigirUsuario();

    const matriculaId =
      inteiroPositivo(params.id);

    if (!matriculaId) {
      throw new ErroApi(
        400,
        "Matrícula inválida.",
        "MATRICULA_INVALIDA"
      );
    }

    const matricula =
      await buscarMatricula(
        prisma,
        matriculaId,
        user.instituicaoId
      );

    if (!matricula) {
      throw new ErroApi(
        404,
        "Matrícula não encontrada.",
        "MATRICULA_NAO_ENCONTRADA"
      );
    }

    const cancelamentos =
      await prisma.cancelamentoMatricula.findMany({
        where: {
          instituicaoId:
            user.instituicaoId,
          matriculaId,
        },
        orderBy: [
          { criadoEm: "desc" },
          { id: "desc" },
        ],
        select: {
          id: true,
          numeroProtocolo: true,
          status: true,
          statusAnterior: true,
          motivo: true,
          observacoes: true,
          dataSolicitacao: true,
          dataEfetiva: true,
          regraContratual: true,
          baseCalculoMulta: true,
          percentualMulta: true,
          valorParcelasVencidas: true,
          valorMulta: true,
          valorJuros: true,
          valorCredito: true,
          valorDevolucao: true,
          valorTotal: true,
          situacaoFinanceira: true,
          registradoPorId: true,
          registradoPorNomeSnapshot: true,
          registradoPorCargoSnapshot: true,
          finalizadoPorId: true,
          finalizadoPorNomeSnapshot: true,
          finalizadoPorCargoSnapshot: true,
          finalizadoEm: true,
          canceladoEm: true,
          criadoEm: true,
          atualizadoEm: true,
          _count: {
            select: {
              documentosGerados: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      matricula,
      rascunho:
        cancelamentos.find(
          (item) =>
            item.status ===
            STATUS.RASCUNHO
        ) || null,
      cancelamentos,
    });
  } catch (erro) {
    return responder(erro);
  }
}

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: { id: string };
  }
) {
  try {
    const user =
      await exigirUsuario(true);

    const matriculaId =
      inteiroPositivo(params.id);

    if (!matriculaId) {
      throw new ErroApi(
        400,
        "Matrícula inválida.",
        "MATRICULA_INVALIDA"
      );
    }

    const dados =
      validar(await req.json());

    const cancelamento =
      await prisma.$transaction(
        async (tx) => {
          await bloquear(
            tx,
            matriculaId,
            user.instituicaoId
          );

          const matricula =
            await buscarMatricula(
              tx,
              matriculaId,
              user.instituicaoId
            );

          validarMatricula(matricula);

          const existente =
            await tx.cancelamentoMatricula.findFirst({
              where: {
                instituicaoId:
                  user.instituicaoId,
                matriculaId,
                status:
                  STATUS.RASCUNHO,
              },
              select: {
                id: true,
                numeroProtocolo: true,
              },
            });

          if (existente) {
            throw new ErroApi(
              409,
              "Já existe um rascunho de cancelamento para esta matrícula.",
              "RASCUNHO_CANCELAMENTO_EXISTENTE",
              {
                cancelamentoId:
                  existente.id,
                numeroProtocolo:
                  existente.numeroProtocolo,
              }
            );
          }

          const resp =
            await responsavel(
              tx,
              user
            );

          const criado =
            await tx.cancelamentoMatricula.create({
              data: {
                instituicaoId:
                  user.instituicaoId,
                matriculaId,
                numeroProtocolo:
                  `PENDENTE-${randomUUID()}`,
                status:
                  STATUS.RASCUNHO,
                statusAnterior:
                  matricula!.status,
                ...dados,
                registradoPorId:
                  user.id,
                registradoPorNomeSnapshot:
                  resp.nome,
                registradoPorCargoSnapshot:
                  resp.cargo,
              },
              select: { id: true },
            });

          const sigla =
            String(
              matricula!.instituicao?.slug ||
              user.instituicaoId
            )
              .normalize("NFD")
              .replace(
                /[\u0300-\u036f]/g,
                ""
              )
              .replace(
                /[^a-zA-Z0-9]/g,
                ""
              )
              .toUpperCase()
              .slice(0, 8) ||
            String(user.instituicaoId);

          const ano =
            new Date().getUTCFullYear();

          return tx.cancelamentoMatricula.update({
            where: { id: criado.id },
            data: {
              numeroProtocolo:
                [
                  "CAN",
                  sigla,
                  ano,
                  String(criado.id).padStart(6, "0"),
                ].join("-"),
            },
          });
        }
      );

    return NextResponse.json(
      {
        success: true,
        cancelamento,
      },
      { status: 201 }
    );
  } catch (erro) {
    return responder(erro);
  }
}

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: { id: string };
  }
) {
  try {
    const user =
      await exigirUsuario(true);

    const matriculaId =
      inteiroPositivo(params.id);

    if (!matriculaId) {
      throw new ErroApi(
        400,
        "Matrícula inválida.",
        "MATRICULA_INVALIDA"
      );
    }

    const body =
      await req.json();

    const corpo =
      body &&
      typeof body === "object" &&
      !Array.isArray(body)
        ? body as Record<string, unknown>
        : {};

    const cancelamentoId =
      inteiroPositivo(
        corpo.cancelamentoId
      );

    if (!cancelamentoId) {
      throw new ErroApi(
        400,
        "Cancelamento inválido.",
        "CANCELAMENTO_INVALIDO"
      );
    }

    const acao =
      String(
        corpo.acao ||
        "SALVAR_RASCUNHO"
      )
        .trim()
        .toUpperCase();

    if (
      ![
        "SALVAR_RASCUNHO",
        "FINALIZAR",
      ].includes(acao)
    ) {
      throw new ErroApi(
        400,
        "Ação de cancelamento inválida.",
        "ACAO_CANCELAMENTO_INVALIDA"
      );
    }

    const dados =
      validar(corpo);

    const cancelamento =
      await prisma.$transaction(
        async (tx) => {
          await bloquear(
            tx,
            matriculaId,
            user.instituicaoId
          );

          const matricula =
            await buscarMatricula(
              tx,
              matriculaId,
              user.instituicaoId
            );

          validarMatricula(matricula);

          const atual =
            await tx.cancelamentoMatricula.findFirst({
              where: {
                id:
                  cancelamentoId,
                instituicaoId:
                  user.instituicaoId,
                matriculaId,
              },
              select: {
                id: true,
                status: true,
                statusAnterior: true,
                numeroProtocolo: true,
              },
            });

          if (!atual) {
            throw new ErroApi(
              404,
              "Cancelamento não encontrado.",
              "CANCELAMENTO_NAO_ENCONTRADO"
            );
          }

          if (
            atual.status !==
            STATUS.RASCUNHO
          ) {
            throw new ErroApi(
              409,
              "Somente rascunhos podem ser alterados ou finalizados.",
              "CANCELAMENTO_NAO_E_RASCUNHO"
            );
          }

          if (
            acao ===
            "SALVAR_RASCUNHO"
          ) {
            return tx.cancelamentoMatricula.update({
              where: { id: atual.id },
              data: {
                ...dados,
                statusAnterior:
                  matricula!.status,
              },
            });
          }

          if (
            matricula!.status !==
            atual.statusAnterior
          ) {
            throw new ErroApi(
              409,
              "A situação da matrícula mudou depois da criação do rascunho.",
              "MATRICULA_ALTERADA_APOS_RASCUNHO",
              {
                statusRascunho:
                  atual.statusAnterior,
                statusAtual:
                  matricula!.status,
              }
            );
          }

          const resp =
            await responsavel(
              tx,
              user
            );

          const agora =
            new Date();

          const alterada =
            await tx.matricula.updateMany({
              where: {
                id: matriculaId,
                instituicaoId:
                  user.instituicaoId,
                excluidaEm: null,
                status:
                  matricula!.status,
              },
              data: {
                status:
                  StatusMatricula.CANCELADA,
                canceladaEm:
                  agora,
                canceladaPorId:
                  user.id,
                motivoCancelamento:
                  dados.motivo,
              },
            });

          if (
            alterada.count !== 1
          ) {
            throw new ErroApi(
              409,
              "A matrícula foi alterada por outro processo.",
              "MATRICULA_ALTERADA_DURANTE_CANCELAMENTO"
            );
          }

          await tx.trancamentoMatricula.updateMany({
            where: {
              instituicaoId:
                user.instituicaoId,
              matriculaId,
              status: "CONFIRMADO",
            },
            data: {
              status: "ENCERRADO",
              encerradoEm: agora,
            },
          });

          return tx.cancelamentoMatricula.update({
            where: { id: atual.id },
            data: {
              ...dados,
              status:
                STATUS.FINALIZADO,
              finalizadoPorId:
                user.id,
              finalizadoPorNomeSnapshot:
                resp.nome,
              finalizadoPorCargoSnapshot:
                resp.cargo,
              ipFinalizacao:
                ip(req),
              userAgentFinalizacao:
                userAgent(req),
              finalizadoEm:
                agora,
            },
          });
        }
      );

    return NextResponse.json({
      success: true,
      acao,
      cancelamento,
      matriculaStatus:
        acao === "FINALIZAR"
          ? StatusMatricula.CANCELADA
          : undefined,
    });
  } catch (erro) {
    return responder(erro);
  }
}
