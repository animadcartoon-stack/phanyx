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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContextoRota = {
  params: {
    slug: string;
  };
};

type ItemRecebido = {
  id?: number | null;
  tipo?: string;
  hora?: string;
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

function normalizarSlug(valor: unknown) {
  try {
    return decodeURIComponent(String(valor || ""))
      .trim()
      .toLowerCase();
  } catch {
    return String(valor || "")
      .trim()
      .toLowerCase();
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
        (parte) => parte.type === tipo
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

function tipoNormalizado(
  valor: unknown
): "ENTRADA" | "SAIDA" | null {
  const tipo = String(
    valor || ""
  )
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

function calcularResumo(
  itens: Array<{
    tipo: "ENTRADA" | "SAIDA";
    dataHora: Date;
  }>
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

  const saidas = ordenados.filter(
    (item) => item.tipo === "SAIDA"
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
    "PHX-CORR",
    Date.now().toString(36).toUpperCase(),
    crypto
      .randomBytes(5)
      .toString("hex")
      .toUpperCase(),
  ].join("-");
}

function gerarChaveIdempotencia() {
  return `correcao:${crypto.randomUUID()}`;
}

export async function POST(
  req: NextRequest,
  contexto: ContextoRota
) {
  try {
    const slug = normalizarSlug(
      contexto.params.slug
    );

    if (!slug) {
      throw new ErroHttp(
        400,
        "Instituição não identificada.",
        "INSTITUICAO_INVALIDA"
      );
    }

    const user =
      await getUserFromToken();

    if (!user) {
      throw new ErroHttp(
        401,
        "Sua sessão expirou. Entre novamente no RH Ponto.",
        "SESSAO_EXPIRADA"
      );
    }

    const usuarioId = Number(
      user.id
    );

    const instituicaoId = Number(
      user.instituicaoId
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

    const body = await req
      .json()
      .catch(() => ({}));

    const autorizacaoId = Number(
      body?.autorizacaoId
    );

    const motivoFuncionario =
      limparTexto(
        body?.motivoFuncionario,
        2000
      );

    const dispositivoId =
      limparTexto(
        body?.dispositivoId,
        180
      ) || null;

    const itensRecebidos =
      Array.isArray(body?.marcacoes)
        ? (body.marcacoes as ItemRecebido[])
        : [];

    if (
      !Number.isInteger(autorizacaoId) ||
      autorizacaoId <= 0
    ) {
      throw new ErroHttp(
        400,
        "Autorização inválida.",
        "AUTORIZACAO_INVALIDA"
      );
    }

    if (
      motivoFuncionario.length < 10
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
        "Informe de 1 a 20 marcações para o dia.",
        "QUANTIDADE_INVALIDA"
      );
    }

    const agora = new Date();

    const autorizacao =
      await prisma.autorizacaoCorrecaoPontoRH.findFirst({
        where: {
          id: autorizacaoId,
          instituicaoId,
        },

        select: {
          id: true,
          status: true,
          dataLocal: true,
          validoAte: true,
          limiteEnvios: true,
          enviosRealizados: true,
          motivoAutorizacao: true,
          autorizadoPorId: true,
          autorizadoPorNome: true,
          pontoFuncionarioRHId: true,

          funcionario: {
            select: {
              id: true,
              nome: true,
              userId: true,
            },
          },

          autorizadoPor: {
            select: {
              id: true,
              nome: true,

              funcionario: {
                select: {
                  telefone: true,
                },
              },
            },
          },

          instituicao: {
            select: {
              slug: true,
              nome: true,
              telefoneRH: true,
            },
          },

          pontoFuncionarioRH: {
            select: {
              id: true,
              data: true,
              horasTrabalhadas: true,
              horasExtras: true,
              horasAtraso: true,

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
          },
        },
      });

    if (!autorizacao) {
      throw new ErroHttp(
        404,
        "A autorização não foi encontrada.",
        "AUTORIZACAO_NAO_ENCONTRADA"
      );
    }

    const funcionarioConectado =
      await prisma.funcionario.findFirst({
        where: {
          userId: usuarioId,
          instituicaoId,
          id:
            autorizacao.funcionario.id,
          ativo: true,
        },

        select: {
          id: true,
        },
      });

    if (!funcionarioConectado) {
      throw new ErroHttp(
        403,
        "Esta autorização não pertence ao funcionário conectado.",
        "AUTORIZACAO_DIVERGENTE"
      );
    }

    if (
      autorizacao.status !== "ATIVA"
    ) {
      throw new ErroHttp(
        409,
        "Esta autorização não está mais ativa.",
        "AUTORIZACAO_NAO_ATIVA"
      );
    }

    if (
      autorizacao.validoAte.getTime() <=
      agora.getTime()
    ) {
      await prisma.autorizacaoCorrecaoPontoRH.update({
        where: {
          id: autorizacao.id,
        },

        data: {
          status: "EXPIRADA",
        },
      });

      throw new ErroHttp(
        409,
        "O prazo desta autorização expirou.",
        "AUTORIZACAO_EXPIRADA"
      );
    }

    if (
      autorizacao.enviosRealizados >=
      autorizacao.limiteEnvios
    ) {
      throw new ErroHttp(
        409,
        "O limite de envios desta autorização foi atingido.",
        "LIMITE_ATINGIDO"
      );
    }

    if (
      !autorizacao
        .pontoFuncionarioRH
    ) {
      throw new ErroHttp(
        409,
        "O registro diário vinculado à autorização não foi encontrado.",
        "PONTO_NAO_ENCONTRADO"
      );
    }

    const dataLocal =
      autorizacao.dataLocal
        .toISOString()
        .slice(0, 10);

    const configuracao =
      await prisma.configuracaoPontoMobileRH.findUnique({
        where: {
          instituicaoId,
        },

        select: {
          fusoHorario: true,
        },
      });

    const fusoHorario =
      configuracao?.fusoHorario ||
      "America/Sao_Paulo";

    const idsOriginais = new Set(
      autorizacao
        .pontoFuncionarioRH
        .marcacoesMobile.map(
          (marcacao) =>
            marcacao.id
        )
    );

    const itensNormalizados =
      itensRecebidos.map(
        (item, indice) => {
          const id =
            item.id === null ||
            item.id === undefined
              ? null
              : Number(item.id);

          if (
            id !== null &&
            (!Number.isInteger(id) ||
              id <= 0 ||
              !idsOriginais.has(id))
          ) {
            throw new ErroHttp(
              400,
              `A ${indice + 1}ª marcação não pertence a este dia.`,
              "MARCACAO_DIVERGENTE"
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

    const idsRepetidos =
      itensNormalizados
        .filter(
          (item) => item.id !== null
        )
        .map((item) => item.id as number);

    if (
      new Set(idsRepetidos).size !==
      idsRepetidos.length
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

    const resumo =
      calcularResumo(
        itensNormalizados
      );

    const pontoAtual =
      autorizacao
        .pontoFuncionarioRH;

    const horasTrabalhadasAnteriores =
      Number(
        pontoAtual.horasTrabalhadas ||
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
            resumo.horasTrabalhadas -
              jornadaEstimada
          )
        : 0;

    const horasAtraso =
      resumo.jornadaFechada
        ? Math.max(
            0,
            jornadaEstimada -
              resumo.horasTrabalhadas
          )
        : 0;

    const dadosAntes =
      pontoAtual
        .marcacoesMobile.map(
          (marcacao) => ({
            id: marcacao.id,
            tipo: marcacao.tipo,

            dataHora:
              marcacao.dataHora
                .toISOString(),

            comprovanteCodigo:
              marcacao
                .comprovanteCodigo,
          })
        );

    const dadosDepois =
      itensNormalizados.map(
        (item) => ({
          idOriginal: item.id,
          tipo: item.tipo,

          dataHora:
            item.dataHora
              .toISOString(),
        })
      );

    const ip = obterIp(req);

    const userAgent =
      req.headers
        .get("user-agent")
        ?.slice(0, 2000) ||
      null;

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          const consumoAutorizacao =
            await tx.autorizacaoCorrecaoPontoRH.updateMany({
              where: {
                id: autorizacao.id,
                instituicaoId,
                status: "ATIVA",

                validoAte: {
                  gt: agora,
                },

                enviosRealizados: {
                  lt:
                    autorizacao
                      .limiteEnvios,
                },
              },

              data: {
                status: "UTILIZADA",

                enviosRealizados: {
                  increment: 1,
                },

                utilizadoEm: agora,
              },
            });

          if (
            consumoAutorizacao.count !== 1
          ) {
            throw new ErroHttp(
              409,
              "A autorização já foi utilizada, cancelada ou expirou.",
              "AUTORIZACAO_INDISPONIVEL"
            );
          }

          const solicitacao =
            await tx.solicitacaoCorrecaoPontoRH.create({
              data: {
                instituicaoId,

                autorizacaoId:
                  autorizacao.id,

                funcionarioId:
                  autorizacao
                    .funcionario.id,

                pontoFuncionarioRHId:
                  pontoAtual.id,

                dataLocal:
                  autorizacao.dataLocal,

                status: "APLICADA",

                motivoFuncionario,

                dadosAntes,
                dadosDepois,

                enviadoEm: agora,
                aplicadoEm: agora,

                aplicadoPorId: null,

                ip,
                userAgent,
                dispositivoId,
              },

              select: {
                id: true,
              },
            });

          for (
            const marcacao of
              pontoAtual
                .marcacoesMobile
          ) {
            await tx.marcacaoPontoMobileRH.update({
              where: {
                id: marcacao.id,
              },

              data: {
                status: "INVALIDADA",
              },
            });

            await tx.ajusteMarcacaoPontoRH.create({
              data: {
                instituicaoId,

                funcionarioId:
                  autorizacao
                    .funcionario.id,

                marcacaoId:
                  marcacao.id,

                criadoPorId: null,

                acao:
                  "INVALIDACAO_CORRECAO_FUNCIONARIO",

                motivo:
                  motivoFuncionario,

                dadosAntes: {
                  tipo:
                    marcacao.tipo,

                  dataHora:
                    marcacao.dataHora
                      .toISOString(),

                  status:
                    marcacao.status,
                },

                dadosDepois: {
                  status:
                    "INVALIDADA",

                  autorizacaoId:
                    autorizacao.id,

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

                ordem: 0,
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
                    autorizacao
                      .funcionario.id,

                  pontoFuncionarioRHId:
                    pontoAtual.id,

                  localId: null,

                  dataHora:
                    item.dataHora,

                  dataLocal:
                    autorizacao.dataLocal,

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
                    "CORRECAO_AUTORIZADA",

                  reconhecimentoStatus:
                    "NAO_PROCESSADO",

                  similaridadeFacial:
                    null,

                  provaVidaConfirmada:
                    null,

                  origem:
                    "CORRECAO_FUNCIONARIO",

                  dispositivoId,
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

            await tx.solicitacaoCorrecaoPontoItemRH.create({
              data: {
                instituicaoId,

                solicitacaoId:
                  solicitacao.id,

                marcacaoOriginalId:
                  item.id,

                marcacaoGeradaId:
                  nova.id,

                acao:
                  item.id
                    ? "ALTERAR"
                    : "ADICIONAR",

                tipoOriginal:
                  item.id
                    ? pontoAtual
                        .marcacoesMobile
                        .find(
                          (marcacao) =>
                            marcacao.id ===
                            item.id
                        )?.tipo ||
                      null
                    : null,

                dataHoraOriginal:
                  item.id
                    ? pontoAtual
                        .marcacoesMobile
                        .find(
                          (marcacao) =>
                            marcacao.id ===
                            item.id
                        )?.dataHora ||
                      null
                    : null,

                tipoProposto:
                  item.tipo,

                dataHoraProposta:
                  item.dataHora,

                ordem: indice,
              },
            });
          }

          await tx.pontoFuncionarioRH.update({
            where: {
              id: pontoAtual.id,
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
                resumo.horasTrabalhadas,

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
                `Correção enviada pelo funcionário. Motivo: ${motivoFuncionario}`,
            },
          });

          await tx.notificacao.create({
            data: {
              usuarioId:
                autorizacao
                  .autorizadoPorId,

              instituicaoId,

              tipo:
                "PONTO_CORRIGIDO_FUNCIONARIO",

              categoria: "RH",

              titulo:
                "Ponto alterado pelo funcionário",

              descricao:
                `${autorizacao.funcionario.nome} alterou as marcações de ${dataLocal} usando a autorização emitida por ${autorizacao.autorizadoPorNome}.`,

              link:
                `/admin/rh/ponto?funcionarioId=${autorizacao.funcionario.id}&data=${dataLocal}`,

              quantidade: 1,

              chaveAgrupada:
                `ponto-corrigido-funcionario:${solicitacao.id}`,

              lida: false,
            },
          });

          const telefoneResponsavel =
            autorizacao
              .autorizadoPor
              .funcionario
              ?.telefone ||
            autorizacao
              .instituicao
              .telefoneRH ||
            null;

          const mensagemWhatsapp =
            `${autorizacao.funcionario.nome} alterou o ponto de ${dataLocal}. ` +
            `Autorizado por: ${autorizacao.autorizadoPorNome}. ` +
            `Motivo informado: ${motivoFuncionario}. ` +
            `Verifique no painel PHANYX RH.`;

          const avisoWhatsapp =
            await tx.avisoWhatsappCorrecaoPontoRH.create({
              data: {
                instituicaoId,

                autorizacaoId:
                  autorizacao.id,

                solicitacaoId:
                  solicitacao.id,

                destinatarioUsuarioId:
                  autorizacao
                    .autorizadoPorId,

                destinatarioNome:
                  autorizacao
                    .autorizadoPorNome,

                destinatarioTelefone:
                  telefoneResponsavel,

                tipo:
                  "CORRECAO_PONTO_FUNCIONARIO",

                mensagem:
                  mensagemWhatsapp,

                status:
                  telefoneResponsavel
                    ? "PENDENTE_CONFIGURACAO"
                    : "SEM_TELEFONE",

                tentativas: 0,
                agendadoEm: agora,
              },

              select: {
                status: true,
              },
            });

          return {
            solicitacaoId:
              solicitacao.id,

            novasMarcacoes,

            avisoWhatsappStatus:
              avisoWhatsapp.status,
          };
        },
        {
          isolationLevel:
            Prisma
              .TransactionIsolationLevel
              .Serializable,

          maxWait: 5000,
          timeout: 20000,
        }
      );

    return NextResponse.json({
      sucesso: true,

      mensagem:
        "Correção aplicada e responsável do RH notificado no PHANYX.",

      solicitacaoId:
        resultado.solicitacaoId,

      whatsappStatus:
        resultado
          .avisoWhatsappStatus,

      marcacoes:
        resultado
          .novasMarcacoes.map(
            (marcacao) => ({
              id: marcacao.id,
              tipo: marcacao.tipo,

              dataHora:
                marcacao.dataHora
                  .toISOString(),

              comprovanteCodigo:
                marcacao
                  .comprovanteCodigo,
            })
          ),
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
      "Erro ao aplicar correção de ponto pelo funcionário:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível aplicar a correção do ponto.",
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