import {
  AcaoAuditoriaBiblioteca,
  StatusExemplarBiblioteca,
  StatusManutencaoExemplarBiblioteca,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
  params: {
    manutencaoId: string;
  };
};

function responder(
  corpo: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control":
        "no-store, max-age=0",
    },
  });
}

function falhar(
  status: number,
  mensagem: string,
  codigo: string
): never {
  throw new ErroBiblioteca(
    status,
    mensagem,
    codigo
  );
}

function obterManutencaoId(
  params: ContextoRota["params"]
) {
  const manutencaoId =
    Number(params.manutencaoId);

  if (
    !Number.isInteger(manutencaoId) ||
    manutencaoId <= 0
  ) {
    falhar(
      400,
      "Manutenção inválida.",
      "MANUTENCAO_INVALIDA"
    );
  }

  return manutencaoId;
}

function obterMotivo(
  valor: unknown
) {
  if (
    typeof valor !== "string" ||
    !valor.trim()
  ) {
    falhar(
      400,
      "Informe o motivo do cancelamento.",
      "MOTIVO_CANCELAMENTO_OBRIGATORIO"
    );
  }

  const motivo = valor.trim();

  if (motivo.length > 5_000) {
    falhar(
      400,
      "O motivo do cancelamento excede o limite permitido.",
      "MOTIVO_CANCELAMENTO_MUITO_LONGO"
    );
  }

  return motivo;
}

function obterStatusRetorno(
  valor: unknown
) {
  if (typeof valor !== "string") {
    falhar(
      400,
      "Informe como o exemplar ficará após o cancelamento.",
      "STATUS_RETORNO_OBRIGATORIO"
    );
  }

  const status =
    valor.trim().toUpperCase();

  if (
    status !==
      StatusExemplarBiblioteca.DANIFICADO &&
    status !==
      StatusExemplarBiblioteca.INDISPONIVEL
  ) {
    falhar(
      400,
      "O exemplar deve retornar como danificado ou indisponível.",
      "STATUS_RETORNO_INVALIDO"
    );
  }

  return status as
    | typeof StatusExemplarBiblioteca.DANIFICADO
    | typeof StatusExemplarBiblioteca.INDISPONIVEL;
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
  erro: unknown
) {
  const resposta =
    respostaErroBiblioteca(erro);

  return responder(
    resposta.corpo,
    resposta.status
  );
}

/* =========================================================
   POST
   Cancela uma manutenção em andamento
   ========================================================= */

export async function POST(
  request: NextRequest,
  { params }: ContextoRota
) {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    const contexto =
      await obterContextoBiblioteca(
        usuario
      );

    if (usuario.impersonacao) {
      falhar(
        403,
        "Não é permitido cancelar manutenções durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.exemplares.manutencao"
    );

    const manutencaoId =
      obterManutencaoId(params);

    let corpo: {
      motivoCancelamento?: unknown;
      statusRetorno?: unknown;
    };

    try {
      corpo = await request.json();
    } catch {
      falhar(
        400,
        "Os dados do cancelamento são inválidos.",
        "JSON_INVALIDO"
      );
    }

    const motivoCancelamento =
      obterMotivo(
        corpo.motivoCancelamento
      );

    const statusRetorno =
      obterStatusRetorno(
        corpo.statusRetorno
      );

    const agora = new Date();
    const ip = obterIp(request);

    const userAgent =
      request.headers.get(
        "user-agent"
      );

    const resposta =
      await prisma.$transaction(
        async (transacao) => {
          await transacao.$queryRaw`
            SELECT "id"
            FROM "BibliotecaManutencaoExemplar"
            WHERE "id" = ${manutencaoId}
              AND "instituicaoId" = ${contexto.instituicaoId}
            FOR UPDATE
          `;

          const manutencao =
            await transacao
              .bibliotecaManutencaoExemplar
              .findFirst({
                where: {
                  id: manutencaoId,
                  instituicaoId:
                    contexto.instituicaoId,
                },

                select: {
                  id: true,
                  exemplarId: true,
                  status: true,
                  resultado: true,
                  motivo: true,
                  fornecedor: true,
                  custoEstimado: true,
                  iniciadaEm: true,
                },
              });

          if (!manutencao) {
            falhar(
              404,
              "Manutenção não encontrada.",
              "MANUTENCAO_NAO_ENCONTRADA"
            );
          }

          if (
            manutencao.status !==
            StatusManutencaoExemplarBiblioteca.ABERTA
          ) {
            falhar(
              409,
              "Esta manutenção não está mais em andamento.",
              "MANUTENCAO_NAO_ABERTA"
            );
          }

          await transacao.$queryRaw`
            SELECT "id"
            FROM "BibliotecaExemplar"
            WHERE "id" = ${manutencao.exemplarId}
              AND "instituicaoId" = ${contexto.instituicaoId}
            FOR UPDATE
          `;

          const exemplar =
            await transacao
              .bibliotecaExemplar
              .findFirst({
                where: {
                  id:
                    manutencao.exemplarId,

                  instituicaoId:
                    contexto.instituicaoId,
                },

                select: {
                  id: true,
                  itemId: true,
                  status: true,
                  codigoInterno: true,
                  numeroTombo: true,
                  baixadoEm: true,
                },
              });

          if (!exemplar) {
            falhar(
              404,
              "Exemplar não encontrado.",
              "EXEMPLAR_NAO_ENCONTRADO"
            );
          }

          if (
            exemplar.baixadoEm ||
            exemplar.status ===
              StatusExemplarBiblioteca.BAIXADO
          ) {
            falhar(
              409,
              "O exemplar foi baixado do acervo e a manutenção não pode ser cancelada.",
              "EXEMPLAR_BAIXADO"
            );
          }

          if (
            exemplar.status !==
            StatusExemplarBiblioteca.MANUTENCAO
          ) {
            falhar(
              409,
              "O exemplar não está marcado como em manutenção.",
              "EXEMPLAR_FORA_DE_MANUTENCAO"
            );
          }

          const manutencaoAtualizada =
            await transacao
              .bibliotecaManutencaoExemplar
              .update({
                where: {
                  id: manutencao.id,
                },

                data: {
                  status:
                    StatusManutencaoExemplarBiblioteca.CANCELADA,

                  canceladaEm: agora,

                  canceladoPorId:
                    usuario.id,

                  observacaoConclusao:
                    motivoCancelamento,
                },

                select: {
                  id: true,
                  exemplarId: true,
                  status: true,
                  motivo: true,
                  fornecedor: true,
                  custoEstimado: true,
                  iniciadaEm: true,
                  canceladaEm: true,
                  observacaoConclusao:
                    true,
                },
              });

          const exemplarAtualizado =
            await transacao
              .bibliotecaExemplar
              .update({
                where: {
                  id: exemplar.id,
                },

                data: {
                  status:
                    statusRetorno,

                  atualizadoPorId:
                    usuario.id,
                },

                select: {
                  id: true,
                  status: true,
                  codigoInterno:
                    true,
                  numeroTombo:
                    true,
                },
              });

          await transacao
            .bibliotecaAuditoria
            .create({
              data: {
                instituicaoId:
                  contexto.instituicaoId,

                usuarioId:
                  usuario.id,

                entidade:
                  "BibliotecaManutencaoExemplar",

                entidadeId:
                  String(
                    manutencao.id
                  ),

                acao:
                  AcaoAuditoriaBiblioteca.CANCELAR_MANUTENCAO,

                descricao:
                  "Manutenção de exemplar cancelada na Biblioteca Virtual.",

                dadosAnteriores: {
                  manutencaoStatus:
                    manutencao.status,

                  exemplarStatus:
                    exemplar.status,
                },

                dadosPosteriores: {
                  manutencaoStatus:
                    StatusManutencaoExemplarBiblioteca.CANCELADA,

                  exemplarStatus:
                    statusRetorno,

                  canceladaEm:
                    agora.toISOString(),

                  motivoCancelamento,
                },

                metadados: {
                  origem:
                    "api_admin_biblioteca_manutencao_cancelar",

                  itemId:
                    exemplar.itemId,

                  exemplarId:
                    exemplar.id,

                  codigoInterno:
                    exemplar.codigoInterno,

                  numeroTombo:
                    exemplar.numeroTombo,
                },

                ip,
                userAgent,
              },
            });

          return {
            manutencao:
              manutencaoAtualizada,

            exemplar:
              exemplarAtualizado,
          };
        },
        {
          maxWait: 5_000,
          timeout: 10_000,
        }
      );

    return responder({
      ok: true,

      mensagem:
        "Manutenção cancelada com sucesso.",

      manutencao:
        resposta.manutencao,

      exemplar:
        resposta.exemplar,
    });
  } catch (erro) {
    return responderErro(erro);
  }
}