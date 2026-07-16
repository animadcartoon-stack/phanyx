import crypto from "crypto";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ItemRecebido = {
  id?: number | null;
  tipo?: string;
  hora?: string;
};

type ItemNormalizado = {
  id: number | null;
  tipo: "ENTRADA" | "SAIDA";
  hora: string;
  dataHora: Date;
};

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

function obterIp(req: NextRequest) {
  const encaminhado =
    req.headers.get("x-forwarded-for");

  if (encaminhado) {
    return encaminhado
      .split(",")[0]
      .trim()
      .slice(0, 120);
  }

  return (
    req.headers
      .get("x-real-ip")
      ?.trim()
      .slice(0, 120) || null
  );
}

async function validarPermissao(
  user: any
) {
  /*
   * A permissão específica será acrescentada
   * à lista oficial de permissões do PHANYX.
   *
   * Enquanto isso, usuários que já gerenciam
   * ocorrências do Ponto Mobile continuam
   * autorizados, evitando bloquear o RH atual.
   */
  const [
    podeCorrigirPonto,
    podeGerenciarOcorrencias,
  ] = await Promise.all([
    usuarioPossuiPermissao(
      user,
      "rh.ponto.corrigir"
    ),

    usuarioPossuiPermissao(
      user,
      "rh.ponto.mobile.ocorrencias.gerenciar"
    ),
  ]);

  if (
    !podeCorrigirPonto &&
    !podeGerenciarOcorrencias
  ) {
    throw new ErroHttp(
      403,
      "Você não possui permissão para corrigir registros de ponto.",
      "SEM_PERMISSAO"
    );
  }
}

function tipoNormalizado(
  valor: unknown
): "ENTRADA" | "SAIDA" | null {
  const tipo = String(valor || "")
    .trim()
    .toUpperCase();

  if (tipo === "ENTRADA") {
    return "ENTRADA";
  }

  if (tipo === "SAIDA") {
    return "SAIDA";
  }

  return null;
}

function obterOffsetFusoMs(
  data: Date,
  fusoHorario: string
) {
  const partes =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: fusoHorario,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }
    ).formatToParts(data);

  const valor = (
    tipo: Intl.DateTimeFormatPartTypes
  ) =>
    Number(
      partes.find(
        (parte) =>
          parte.type === tipo
      )?.value || 0
    );

  const horarioComoUtc = Date.UTC(
    valor("year"),
    valor("month") - 1,
    valor("day"),
    valor("hour"),
    valor("minute"),
    valor("second")
  );

  return (
    horarioComoUtc -
    data.getTime()
  );
}

function converterLocalParaUtc(
  dataLocal: string,
  hora: string,
  fusoHorario: string
) {
  const dataMatch =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      dataLocal
    );

  const horaMatch =
    /^([01]\d|2[0-3]):([0-5]\d)$/.exec(
      hora
    );

  if (!dataMatch || !horaMatch) {
    return null;
  }

  const [, ano, mes, dia] =
    dataMatch;

  const [, horas, minutos] =
    horaMatch;

  const baseUtc = Date.UTC(
    Number(ano),
    Number(mes) - 1,
    Number(dia),
    Number(horas),
    Number(minutos),
    0
  );

  let tentativa =
    new Date(baseUtc);

  const primeiroOffset =
    obterOffsetFusoMs(
      tentativa,
      fusoHorario
    );

  tentativa = new Date(
    baseUtc - primeiroOffset
  );

  const segundoOffset =
    obterOffsetFusoMs(
      tentativa,
      fusoHorario
    );

  if (
    segundoOffset !==
    primeiroOffset
  ) {
    tentativa = new Date(
      baseUtc - segundoOffset
    );
  }

  return tentativa;
}

function validarSequencia(
  itens: ItemNormalizado[]
) {
  if (itens.length === 0) {
    throw new ErroHttp(
      400,
      "Informe pelo menos uma marcação.",
      "SEM_MARCACOES"
    );
  }

  if (
    itens[0].tipo !== "ENTRADA"
  ) {
    throw new ErroHttp(
      400,
      "A primeira marcação da jornada deve ser uma Entrada.",
      "PRIMEIRA_MARCACAO_INVALIDA"
    );
  }

  for (
    let indice = 1;
    indice < itens.length;
    indice += 1
  ) {
    const anterior =
      itens[indice - 1];

    const atual =
      itens[indice];

    if (
      anterior.dataHora.getTime() ===
      atual.dataHora.getTime()
    ) {
      throw new ErroHttp(
        400,
        `A ${indice + 1}ª marcação possui o mesmo horário da marcação anterior.`,
        "HORARIO_REPETIDO"
      );
    }

    if (
      anterior.tipo === atual.tipo
    ) {
      throw new ErroHttp(
        400,
        `A sequência deve alternar Entrada e Saída. Verifique a ${indice + 1}ª marcação.`,
        "SEQUENCIA_INVALIDA"
      );
    }
  }
}

function calcularResumo(
  itens: ItemNormalizado[]
) {
  const ordenados = [...itens].sort(
    (a, b) =>
      a.dataHora.getTime() -
      b.dataHora.getTime()
  );

  let entradaAberta: Date | null =
    null;

  let horasTrabalhadas = 0;

  for (const item of ordenados) {
    if (item.tipo === "ENTRADA") {
      entradaAberta =
        item.dataHora;

      continue;
    }

    if (
      item.tipo === "SAIDA" &&
      entradaAberta
    ) {
      horasTrabalhadas +=
        Math.max(
          0,
          item.dataHora.getTime() -
            entradaAberta.getTime()
        ) /
        1000 /
        60 /
        60;

      entradaAberta = null;
    }
  }

  const primeiraEntrada =
    ordenados.find(
      (item) =>
        item.tipo === "ENTRADA"
    )?.dataHora || null;

  const saidas =
    ordenados.filter(
      (item) =>
        item.tipo === "SAIDA"
    );

  const ultimaSaida =
    saidas.length > 0
      ? saidas[
          saidas.length - 1
        ].dataHora
      : null;

  const primeiraSaidaComRetorno =
    ordenados.find(
      (item, indice) =>
        item.tipo === "SAIDA" &&
        ordenados
          .slice(indice + 1)
          .some(
            (posterior) =>
              posterior.tipo ===
              "ENTRADA"
          )
    )?.dataHora || null;

  let primeiroRetorno: Date | null =
    null;

  if (primeiraSaidaComRetorno) {
    primeiroRetorno =
      ordenados.find(
        (item) =>
          item.tipo === "ENTRADA" &&
          item.dataHora.getTime() >
            primeiraSaidaComRetorno.getTime()
      )?.dataHora || null;
  }

  return {
    entrada:
      primeiraEntrada,

    saidaAlmoco:
      primeiraSaidaComRetorno,

    retornoAlmoco:
      primeiroRetorno,

    saida:
      ultimaSaida,

    horasTrabalhadas:
      Number(
        horasTrabalhadas.toFixed(2)
      ),

    jornadaFechada:
      ordenados.length > 0 &&
      ordenados[
        ordenados.length - 1
      ].tipo === "SAIDA",
  };
}

function gerarCodigoComprovante() {
  return [
    "PHX-RH-CORR",
    Date.now()
      .toString(36)
      .toUpperCase(),

    crypto
      .randomBytes(5)
      .toString("hex")
      .toUpperCase(),
  ].join("-");
}

function gerarChaveIdempotencia() {
  return `correcao-rh:${crypto.randomUUID()}`;
}

function formatarDataPtBr(
  dataLocal: string
) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      dataLocal
    );

  if (!match) {
    return dataLocal;
  }

  const [, ano, mes, dia] =
    match;

  return `${dia}/${mes}/${ano}`;
}

async function executarTransacaoComRetry<T>(
  operacao: (
    tx: Prisma.TransactionClient
  ) => Promise<T>
) {
  const maximoTentativas = 3;

  for (
    let tentativa = 1;
    tentativa <= maximoTentativas;
    tentativa += 1
  ) {
    try {
      return await prisma.$transaction(
        operacao,
        {
          isolationLevel:
            Prisma
              .TransactionIsolationLevel
              .Serializable,

          maxWait: 5000,
          timeout: 20000,
        }
      );
    } catch (error) {
      const conflitoSerializacao =
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034";

      if (
        !conflitoSerializacao ||
        tentativa === maximoTentativas
      ) {
        throw error;
      }

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            tentativa * 100
          )
      );
    }
  }

  throw new ErroHttp(
    409,
    "O registro foi alterado simultaneamente. Atualize a página e tente novamente.",
    "CONFLITO_DE_ATUALIZACAO"
  );
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

    const motivoCorrecaoRH =
      limparTexto(
        body?.motivoCorrecaoRH,
        2000
      );

    const itensRecebidos =
      Array.isArray(body?.marcacoes)
        ? (
            body.marcacoes as
              ItemRecebido[]
          )
        : [];

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
      motivoCorrecaoRH.length < 10
    ) {
      throw new ErroHttp(
        400,
        "Informe o motivo da correção com pelo menos 10 caracteres.",
        "MOTIVO_OBRIGATORIO"
      );
    }

    if (
      itensRecebidos.length === 0 ||
      itensRecebidos.length > 20
    ) {
      throw new ErroHttp(
        400,
        "Informe de 1 a 20 marcações para a jornada.",
        "QUANTIDADE_INVALIDA"
      );
    }

    const [
      pontoBase,
      configuracao,
      usuarioAtual,
    ] = await Promise.all([
      prisma.pontoFuncionarioRH.findFirst({
        where: {
          id: pontoFuncionarioRHId,
          instituicaoId,
        },

        select: {
          id: true,
          data: true,

          marcacoesMobile: {
            where: {
              status: "VALIDA",
            },

            select: {
              id: true,
            },
          },
        },
      }),

      prisma.configuracaoPontoMobileRH.findUnique({
        where: {
          instituicaoId,
        },

        select: {
          fusoHorario: true,
        },
      }),

      prisma.user.findFirst({
        where: {
          id: usuarioId,
          instituicaoId,
        },

        select: {
          id: true,
          nome: true,
          email: true,

          funcionario: {
            select: {
              nome: true,
            },
          },
        },
      }),
    ]);

    if (!pontoBase) {
      throw new ErroHttp(
        404,
        "O registro de ponto não foi encontrado.",
        "PONTO_NAO_ENCONTRADO"
      );
    }

    const nomeResponsavel =
      limparTexto(
        usuarioAtual?.nome ||
          usuarioAtual
            ?.funcionario
            ?.nome ||
          usuarioAtual?.email ||
          user?.nome ||
          "Responsável do RH",
        200
      );

    const fusoHorario =
      configuracao?.fusoHorario ||
      "America/Sao_Paulo";

    const dataLocal =
      pontoBase.data
        .toISOString()
        .slice(0, 10);

    const itensNormalizados:
      ItemNormalizado[] =
      itensRecebidos.map(
        (item, indice) => {
          const id =
            item.id === null ||
            item.id === undefined
              ? null
              : Number(item.id);

          if (
            id !== null &&
            (
              !Number.isInteger(id) ||
              id <= 0
            )
          ) {
            throw new ErroHttp(
              400,
              `A identificação da ${indice + 1}ª marcação é inválida.`,
              "MARCACAO_INVALIDA"
            );
          }

          const tipo =
            tipoNormalizado(
              item.tipo
            );

          if (!tipo) {
            throw new ErroHttp(
              400,
              `Escolha Entrada ou Saída na ${indice + 1}ª marcação.`,
              "TIPO_INVALIDO"
            );
          }

          const hora = String(
            item.hora || ""
          ).trim();

          const dataHora =
            converterLocalParaUtc(
              dataLocal,
              hora,
              fusoHorario
            );

          if (!dataHora) {
            throw new ErroHttp(
              400,
              `Informe um horário válido na ${indice + 1}ª marcação.`,
              "HORARIO_INVALIDO"
            );
          }

          return {
            id,
            tipo,
            hora,
            dataHora,
          };
        }
      );

    const idsInformados =
      itensNormalizados
        .filter(
          (item) =>
            item.id !== null
        )
        .map(
          (item) =>
            item.id as number
        );

    if (
      new Set(idsInformados).size !==
      idsInformados.length
    ) {
      throw new ErroHttp(
        400,
        "Uma marcação original foi informada mais de uma vez.",
        "MARCACAO_REPETIDA"
      );
    }

    itensNormalizados.sort(
      (a, b) =>
        a.dataHora.getTime() -
        b.dataHora.getTime()
    );

    validarSequencia(
      itensNormalizados
    );

    const resumo =
      calcularResumo(
        itensNormalizados
      );

    const agora = new Date();
    const ip = obterIp(req);

    const userAgent =
      req.headers
        .get("user-agent")
        ?.slice(0, 2000) ||
      null;

    const resultado =
      await executarTransacaoComRetry(
        async (tx) => {
          const pontoAtual =
            await tx.pontoFuncionarioRH.findFirst({
              where: {
                id:
                  pontoFuncionarioRHId,

                instituicaoId,
              },

              select: {
                id: true,
                data: true,

                entrada: true,
                saidaAlmoco: true,
                retornoAlmoco: true,
                saida: true,

                horasTrabalhadas: true,
                horasExtras: true,
                horasAtraso: true,

                status: true,
                observacoes: true,

                funcionario: {
                  select: {
                    id: true,
                    nome: true,
                    telefone: true,
                    userId: true,
                  },
                },

                instituicao: {
                  select: {
                    slug: true,
                    nome: true,
                  },
                },

                marcacoesMobile: {
                  where: {
                    status: "VALIDA",
                  },

                  orderBy: [
                    {
                      dataHora: "asc",
                    },
                    {
                      id: "asc",
                    },
                  ],

                  select: {
                    id: true,
                    tipo: true,
                    dataHora: true,
                    dataLocal: true,
                    status: true,
                    comprovanteCodigo: true,
                  },
                },
              },
            });

          if (!pontoAtual) {
            throw new ErroHttp(
              404,
              "O registro de ponto não foi encontrado.",
              "PONTO_NAO_ENCONTRADO"
            );
          }

          const idsAtuais =
            new Set(
              pontoAtual
                .marcacoesMobile
                .map(
                  (marcacao) =>
                    marcacao.id
                )
            );

          for (
            let indice = 0;
            indice <
            itensNormalizados.length;
            indice += 1
          ) {
            const item =
              itensNormalizados[indice];

            if (
              item.id !== null &&
              !idsAtuais.has(item.id)
            ) {
              throw new ErroHttp(
                409,
                `A ${indice + 1}ª marcação foi alterada por outro usuário. Atualize a página.`,
                "MARCACAO_DESATUALIZADA"
              );
            }
          }

          /*
           * Uma correção direta do RH torna
           * desnecessária qualquer autorização
           * que estivesse aberta para o funcionário.
           */
          await tx.autorizacaoCorrecaoPontoRH.updateMany({
            where: {
              instituicaoId,

              pontoFuncionarioRHId:
                pontoAtual.id,

              status: "ATIVA",
            },

            data: {
              status: "CANCELADA",
              canceladoEm: agora,

              canceladoPorId:
                usuarioId,

              motivoCancelamento:
                "Autorização encerrada porque o RH aplicou uma correção diretamente.",
            },
          });

          /*
           * A solicitação exige vínculo com uma
           * autorização. Criamos uma autorização
           * administrativa já utilizada, garantindo
           * que a operação fique inteiramente
           * registrada no histórico existente.
           */
          const autorizacaoDireta =
            await tx.autorizacaoCorrecaoPontoRH.create({
              data: {
                instituicaoId,

                funcionarioId:
                  pontoAtual
                    .funcionario.id,

                pontoFuncionarioRHId:
                  pontoAtual.id,

                dataLocal:
                  pontoAtual.data,

                autorizadoPorId:
                  usuarioId,

                autorizadoPorNome:
                  nomeResponsavel,

                motivoAutorizacao:
                  `Correção aplicada diretamente pelo RH. Motivo: ${motivoCorrecaoRH}`,

                status: "UTILIZADA",

                autorizadoEm: agora,

                validoAte:
                  new Date(
                    agora.getTime() +
                      5 * 60 * 1000
                  ),

                limiteEnvios: 1,
                enviosRealizados: 1,
                utilizadoEm: agora,
              },

              select: {
                id: true,
              },
            });

          const horasTrabalhadasAnteriores =
            Number(
              pontoAtual
                .horasTrabalhadas ||
                0
            );

          const horasExtrasAnteriores =
            Number(
              pontoAtual.horasExtras ||
                0
            );

          const horasAtrasoAnteriores =
            Number(
              pontoAtual.horasAtraso ||
                0
            );

          const jornadaEstimada =
            horasTrabalhadasAnteriores -
              horasExtrasAnteriores +
              horasAtrasoAnteriores >
            0
              ? horasTrabalhadasAnteriores -
                horasExtrasAnteriores +
                horasAtrasoAnteriores
              : 8;

          const horasExtras =
            resumo.jornadaFechada
              ? Math.max(
                  0,
                  resumo
                    .horasTrabalhadas -
                    jornadaEstimada
                )
              : 0;

          const horasAtraso =
            resumo.jornadaFechada
              ? Math.max(
                  0,
                  jornadaEstimada -
                    resumo
                      .horasTrabalhadas
                )
              : 0;

          const dadosAntes = {
            resumoDiario: {
              entrada:
                pontoAtual.entrada
                  ?.toISOString() ||
                null,

              saidaAlmoco:
                pontoAtual
                  .saidaAlmoco
                  ?.toISOString() ||
                null,

              retornoAlmoco:
                pontoAtual
                  .retornoAlmoco
                  ?.toISOString() ||
                null,

              saida:
                pontoAtual.saida
                  ?.toISOString() ||
                null,

              horasTrabalhadas:
                horasTrabalhadasAnteriores,

              horasExtras:
                horasExtrasAnteriores,

              horasAtraso:
                horasAtrasoAnteriores,

              status:
                pontoAtual.status,
            },

            marcacoes:
              pontoAtual
                .marcacoesMobile
                .map(
                  (marcacao) => ({
                    id:
                      marcacao.id,

                    tipo:
                      marcacao.tipo,

                    dataHora:
                      marcacao
                        .dataHora
                        .toISOString(),

                    status:
                      marcacao.status,

                    comprovanteCodigo:
                      marcacao
                        .comprovanteCodigo,
                  })
                ),
          };

          const dadosDepois =
            itensNormalizados.map(
              (item) => ({
                idOriginal:
                  item.id,

                tipo:
                  item.tipo,

                dataHora:
                  item.dataHora
                    .toISOString(),
              })
            );

          const solicitacao =
            await tx.solicitacaoCorrecaoPontoRH.create({
              data: {
                instituicaoId,

                autorizacaoId:
                  autorizacaoDireta.id,

                funcionarioId:
                  pontoAtual
                    .funcionario.id,

                pontoFuncionarioRHId:
                  pontoAtual.id,

                dataLocal:
                  pontoAtual.data,

                status: "APLICADA",

                motivoFuncionario:
                  motivoCorrecaoRH,

                dadosAntes,
                dadosDepois,

                enviadoEm: agora,
                aplicadoEm: agora,

                aplicadoPorId:
                  usuarioId,

                ip,
                userAgent,
                dispositivoId: null,
              },

              select: {
                id: true,
              },
            });

          const idsMarcacoesAtuais =
            pontoAtual
              .marcacoesMobile
              .map(
                (marcacao) =>
                  marcacao.id
              );

          if (
            idsMarcacoesAtuais.length >
            0
          ) {
            const invalidacao =
              await tx.marcacaoPontoMobileRH.updateMany({
                where: {
                  instituicaoId,

                  id: {
                    in:
                      idsMarcacoesAtuais,
                  },

                  status: "VALIDA",
                },

                data: {
                  status: "INVALIDADA",
                },
              });

            if (
              invalidacao.count !==
              idsMarcacoesAtuais.length
            ) {
              throw new ErroHttp(
                409,
                "Uma das marcações foi alterada simultaneamente. Atualize a página e tente novamente.",
                "CONFLITO_MARCACOES"
              );
            }
          }

          for (
            let indice = 0;
            indice <
            pontoAtual
              .marcacoesMobile
              .length;
            indice += 1
          ) {
            const marcacao =
              pontoAtual
                .marcacoesMobile[
                  indice
                ];

            await tx.ajusteMarcacaoPontoRH.create({
              data: {
                instituicaoId,

                funcionarioId:
                  pontoAtual
                    .funcionario.id,

                marcacaoId:
                  marcacao.id,

                criadoPorId:
                  usuarioId,

                acao:
                  "INVALIDACAO_CORRECAO_RH",

                motivo:
                  motivoCorrecaoRH,

                dadosAntes: {
                  tipo:
                    marcacao.tipo,

                  dataHora:
                    marcacao
                      .dataHora
                      .toISOString(),

                  status:
                    marcacao.status,
                },

                dadosDepois: {
                  status:
                    "INVALIDADA",

                  autorizadoPorId:
                    usuarioId,

                  autorizadoPorNome:
                    nomeResponsavel,

                  solicitacaoId:
                    solicitacao.id,
                },

                ip,
                userAgent,
              },
            });

            await tx.solicitacaoCorrecaoPontoItemRH.create({
              data: {
                instituicaoId,

                solicitacaoId:
                  solicitacao.id,

                marcacaoOriginalId:
                  marcacao.id,

                acao: "INVALIDAR",

                tipoOriginal:
                  marcacao.tipo,

                dataHoraOriginal:
                  marcacao.dataHora,

                ordem: indice,
              },
            });
          }

          const novasMarcacoes: Array<{
            id: number;
            tipo: string;
            dataHora: Date;
            comprovanteCodigo: string;
          }> = [];

          for (
            let indice = 0;
            indice <
            itensNormalizados.length;
            indice += 1
          ) {
            const item =
              itensNormalizados[indice];

            const comprovanteCodigo =
              gerarCodigoComprovante();

            const nova =
              await tx.marcacaoPontoMobileRH.create({
                data: {
                  instituicaoId,

                  funcionarioId:
                    pontoAtual
                      .funcionario.id,

                  pontoFuncionarioRHId:
                    pontoAtual.id,

                  localId: null,

                  dataHora:
                    item.dataHora,

                  dataLocal:
                    pontoAtual.data,

                  tipo:
                    item.tipo,

                  status: "VALIDA",

                  fotoUrl: null,
                  fotoPathname: null,
                  fotoHash: null,

                  latitude: null,
                  longitude: null,
                  precisaoMetros: null,
                  distanciaMetros: null,

                  statusLocalizacao:
                    "CORRECAO_RH",

                  reconhecimentoStatus:
                    "NAO_PROCESSADO",

                  similaridadeFacial:
                    null,

                  provaVidaConfirmada:
                    null,

                  origem:
                    "CORRECAO_RH",

                  dispositivoId: null,
                  ip,
                  userAgent,

                  comprovanteCodigo,

                  idempotenciaChave:
                    gerarChaveIdempotencia(),
                },

                select: {
                  id: true,
                  tipo: true,
                  dataHora: true,
                  comprovanteCodigo: true,
                },
              });

            novasMarcacoes.push(
              nova
            );

            const original =
              item.id !== null
                ? pontoAtual
                    .marcacoesMobile
                    .find(
                      (marcacao) =>
                        marcacao.id ===
                        item.id
                    )
                : null;

            await tx.solicitacaoCorrecaoPontoItemRH.create({
              data: {
                instituicaoId,

                solicitacaoId:
                  solicitacao.id,

                marcacaoOriginalId:
                  original?.id ||
                  null,

                marcacaoGeradaId:
                  nova.id,

                acao:
                  original
                    ? "ALTERAR"
                    : "ADICIONAR",

                tipoOriginal:
                  original?.tipo ||
                  null,

                dataHoraOriginal:
                  original?.dataHora ||
                  null,

                tipoProposto:
                  item.tipo,

                dataHoraProposta:
                  item.dataHora,

                ordem: indice,
              },
            });
          }

          const observacaoCorrecao =
            `Correção aplicada diretamente pelo RH por ${nomeResponsavel}. Motivo: ${motivoCorrecaoRH}`;

          const observacoesAnteriores =
            limparTexto(
              pontoAtual.observacoes,
              3000
            );

          await tx.pontoFuncionarioRH.update({
            where: {
              id:
                pontoAtual.id,
            },

            data: {
              entrada:
                resumo.entrada,

              saidaAlmoco:
                resumo.saidaAlmoco,

              retornoAlmoco:
                resumo.retornoAlmoco,

              saida:
                resumo.saida,

              horasTrabalhadas:
                resumo
                  .horasTrabalhadas,

              horasExtras:
                Number(
                  horasExtras.toFixed(2)
                ),

              horasAtraso:
                Number(
                  horasAtraso.toFixed(2)
                ),

              status:
                resumo.jornadaFechada
                  ? "REGISTRADO"
                  : "ABERTO",

              observacoes:
                observacoesAnteriores
                  ? `${observacoesAnteriores}\n${observacaoCorrecao}`
                      .slice(
                        0,
                        5000
                      )
                  : observacaoCorrecao,
            },
          });

          let whatsappStatus =
            "NAO_APLICAVEL";

          const funcionarioUsuarioId =
            Number(
              pontoAtual
                .funcionario
                .userId
            );

          if (
            Number.isInteger(
              funcionarioUsuarioId
            ) &&
            funcionarioUsuarioId > 0
          ) {
            const dataPtBr =
              formatarDataPtBr(
                dataLocal
              );

            await tx.notificacao.create({
              data: {
                usuarioId:
                  funcionarioUsuarioId,

                instituicaoId,

                tipo:
                  "PONTO_CORRIGIDO_RH",

                categoria: "RH",

                titulo:
                  "Seu ponto foi corrigido pelo RH",

                descricao:
                  `${nomeResponsavel} corrigiu suas marcações de ${dataPtBr}. Motivo: ${motivoCorrecaoRH}`,

                link:
                  `/rh-app/${encodeURIComponent(
                    pontoAtual
                      .instituicao
                      .slug
                  )}/ponto#meus-pontos`,

                quantidade: 1,

                chaveAgrupada:
                  `ponto-corrigido-rh:${solicitacao.id}`,

                lida: false,
              },
            });

            const telefoneFuncionario =
              limparTexto(
                pontoAtual
                  .funcionario
                  .telefone,
                40
              ) || null;

            const mensagemWhatsapp =
              `Seu registro de ponto de ${dataPtBr} foi corrigido pelo RH. ` +
              `Responsável: ${nomeResponsavel}. ` +
              `Motivo: ${motivoCorrecaoRH}. ` +
              `Consulte o histórico no PHANYX RH.`;

            const avisoWhatsapp =
              await tx.avisoWhatsappCorrecaoPontoRH.create({
                data: {
                  instituicaoId,

                  autorizacaoId:
                    autorizacaoDireta.id,

                  solicitacaoId:
                    solicitacao.id,

                  destinatarioUsuarioId:
                    funcionarioUsuarioId,

                  destinatarioNome:
                    pontoAtual
                      .funcionario
                      .nome,

                  destinatarioTelefone:
                    telefoneFuncionario,

                  tipo:
                    "CORRECAO_PONTO_RH",

                  mensagem:
                    mensagemWhatsapp,

                  status:
                    telefoneFuncionario
                      ? "PENDENTE_CONFIGURACAO"
                      : "SEM_TELEFONE",

                  tentativas: 0,
                  agendadoEm: agora,
                },

                select: {
                  status: true,
                },
              });

            whatsappStatus =
              avisoWhatsapp.status;
          }

          return {
            solicitacaoId:
              solicitacao.id,

            novasMarcacoes,

            whatsappStatus,

            nomeFuncionario:
              pontoAtual
                .funcionario
                .nome,
          };
        }
      );

    return NextResponse.json(
      {
        sucesso: true,

        mensagem:
          `Ponto de ${resultado.nomeFuncionario} corrigido pelo RH. O funcionário foi notificado no PHANYX.`,

        solicitacaoId:
          resultado.solicitacaoId,

        whatsappStatus:
          resultado.whatsappStatus,

        marcacoes:
          resultado
            .novasMarcacoes
            .map(
              (marcacao) => ({
                id:
                  marcacao.id,

                tipo:
                  marcacao.tipo,

                dataHora:
                  marcacao
                    .dataHora
                    .toISOString(),

                comprovanteCodigo:
                  marcacao
                    .comprovanteCodigo,
              })
            ),
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    if (error instanceof ErroHttp) {
      return NextResponse.json(
        {
          error:
            error.message,

          codigo:
            error.codigo ||
            null,
        },
        {
          status:
            error.status,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        {
          error:
            "O registro foi alterado simultaneamente. Atualize a página e tente novamente.",

          codigo:
            "CONFLITO_DE_ATUALIZACAO",
        },
        {
          status: 409,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    console.error(
      "Erro ao corrigir ponto diretamente pelo RH:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível aplicar a correção administrativa do ponto.",

        codigo:
          "ERRO_INTERNO",
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}