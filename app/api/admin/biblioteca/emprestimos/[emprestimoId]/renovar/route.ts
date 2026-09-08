import {
  AcaoAuditoriaBiblioteca,
  StatusEmprestimoBiblioteca,
  StatusRenovacaoBiblioteca,
  StatusReservaBiblioteca,
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
    emprestimoId: string;
  };
};

type CorpoRenovacao = {
  observacao?: unknown;
};

function responder(
  corpo: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(
    corpo,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    }
  );
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

function responderErro(
  erro: unknown
) {
  const resposta =
    respostaErroBiblioteca(
      erro
    );

  return responder(
    resposta.corpo,
    resposta.status
  );
}

function obterEmprestimoId(
  params: ContextoRota["params"]
) {
  const emprestimoId =
    Number(params.emprestimoId);

  if (
    !Number.isInteger(emprestimoId) ||
    emprestimoId <= 0
  ) {
    falhar(
      400,
      "Empr\u00e9stimo inv\u00e1lido.",
      "EMPRESTIMO_INVALIDO"
    );
  }

  return emprestimoId;
}

function textoOpcional(
  valor: unknown,
  limite: number
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  if (
    typeof valor !== "string"
  ) {
    falhar(
      400,
      "A observa\u00e7\u00e3o informada \u00e9 inv\u00e1lida.",
      "OBSERVACAO_INVALIDA"
    );
  }

  const texto =
    valor.trim();

  if (!texto) {
    return null;
  }

  if (
    texto.length > limite
  ) {
    falhar(
      400,
      "A observa\u00e7\u00e3o excede o limite permitido.",
      "OBSERVACAO_MUITO_LONGA"
    );
  }

  return texto;
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

function adicionarDiasUtc(
  data: Date,
  dias: number
) {
  const resultado =
    new Date(data);

  resultado.setUTCDate(
    resultado.getUTCDate() +
      dias
  );

  return resultado;
}

/* =========================================================
   POST
   Renova um emprestimo ativo
   ========================================================= */

export async function POST(
  request: NextRequest,
  { params }: ContextoRota
) {
  try {
    const usuario =
      await getUserFromToken();

    const contexto =
      await obterContextoBiblioteca(
        usuario
      );

    if (!usuario) {
      falhar(
        401,
        "Usu\u00e1rio n\u00e3o autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    if (usuario.impersonacao) {
      falhar(
        403,
        "N\u00e3o \u00e9 permitido renovar empr\u00e9stimos durante uma sess\u00e3o de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.renovacoes.gerenciar"
    );

    const emprestimoId =
      obterEmprestimoId(params);

    let corpo: CorpoRenovacao =
      {};

    try {
      corpo =
        await request.json();
    } catch {
      corpo = {};
    }

    const observacao =
      textoOpcional(
        corpo.observacao,
        5000
      );

    const ip =
      obterIp(request);

    const userAgent =
      request.headers.get(
        "user-agent"
      );

    const resultado =
      await prisma.$transaction(
        async (transacao) => {
          /*
           * Localiza o item antes do lock.
           */
          const referencia =
            await transacao
              .bibliotecaEmprestimo
              .findFirst({
                where: {
                  id:
                    emprestimoId,

                  instituicaoId:
                    contexto.instituicaoId,
                },

                select: {
                  id: true,

                  exemplar: {
                    select: {
                      itemId: true,
                    },
                  },
                },
              });

          if (!referencia) {
            falhar(
              404,
              "Empr\u00e9stimo n\u00e3o encontrado.",
              "EMPRESTIMO_NAO_ENCONTRADO"
            );
          }

          /*
           * Reserva e renovacao usam o mesmo lock
           * de BibliotecaItem. Assim uma reserva
           * concorrente nao consegue ultrapassar
           * a verificacao da fila.
           */
          await transacao.$queryRaw`
            SELECT "id"
            FROM "BibliotecaItem"
            WHERE "id" = ${referencia.exemplar.itemId}
              AND "instituicaoId" = ${contexto.instituicaoId}
            FOR UPDATE
          `;

          /*
           * Tambem bloqueia o emprestimo para evitar
           * duas renovacoes simultaneas.
           */
          await transacao.$queryRaw`
            SELECT "id"
            FROM "BibliotecaEmprestimo"
            WHERE "id" = ${emprestimoId}
              AND "instituicaoId" = ${contexto.instituicaoId}
            FOR UPDATE
          `;

          /*
           * Rele depois dos locks.
           */
          const emprestimo =
            await transacao
              .bibliotecaEmprestimo
              .findFirst({
                where: {
                  id:
                    emprestimoId,

                  instituicaoId:
                    contexto.instituicaoId,
                },

                select: {
                  id: true,
                  status: true,

                  usuarioId: true,
                  exemplarId: true,

                  emprestadoEm: true,
                  vencimentoEm: true,

                  quantidadeRenovacoes:
                    true,

                  exemplar: {
                    select: {
                      id: true,
                      itemId: true,

                      codigoInterno:
                        true,
                    },
                  },
                },
              });

          if (!emprestimo) {
            falhar(
              404,
              "Empr\u00e9stimo n\u00e3o encontrado.",
              "EMPRESTIMO_NAO_ENCONTRADO"
            );
          }

          if (
            emprestimo.status ===
            StatusEmprestimoBiblioteca
              .ATRASADO
          ) {
            falhar(
              409,
              "Empr\u00e9stimos em atraso n\u00e3o podem ser renovados.",
              "EMPRESTIMO_ATRASADO"
            );
          }

          if (
            emprestimo.status !==
            StatusEmprestimoBiblioteca
              .ATIVO
          ) {
            falhar(
              409,
              "Este empr\u00e9stimo n\u00e3o est\u00e1 ativo e n\u00e3o pode ser renovado.",
              "EMPRESTIMO_NAO_ATIVO"
            );
          }

          const agora =
            new Date();

          /*
           * Mesmo que ainda esteja marcado ATIVO,
           * um vencimento ja passado bloqueia a
           * renovacao.
           */
          if (
            emprestimo
              .vencimentoEm
              .getTime() <=
            agora.getTime()
          ) {
            falhar(
              409,
              "O empr\u00e9stimo est\u00e1 vencido e n\u00e3o pode ser renovado.",
              "EMPRESTIMO_ATRASADO"
            );
          }

          const configuracao =
            await transacao
              .bibliotecaConfiguracao
              .findUnique({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,
                },

                select: {
                  permitirRenovacao:
                    true,

                  limiteRenovacoes:
                    true,

                  diasEmprestimoPadrao:
                    true,
                },
              });

          if (
            !configuracao ||
            !configuracao
              .permitirRenovacao
          ) {
            falhar(
              409,
              "A renova\u00e7\u00e3o de empr\u00e9stimos est\u00e1 desabilitada para esta biblioteca.",
              "RENOVACAO_DESABILITADA"
            );
          }

          const limiteRenovacoes =
            Math.max(
              0,
              configuracao
                .limiteRenovacoes
            );

          if (
            emprestimo
              .quantidadeRenovacoes >=
            limiteRenovacoes
          ) {
            falhar(
              409,
              "O limite de renova\u00e7\u00f5es deste empr\u00e9stimo foi atingido.",
              "LIMITE_RENOVACOES_ATINGIDO"
            );
          }

          /*
           * PRIORIDADE DA FILA:
           *
           * Se outra pessoa estiver AGUARDANDO
           * este mesmo titulo, o usuario atual
           * nao pode renovar e passar na frente.
           */
          const reservaAguardando =
            await transacao
              .bibliotecaReserva
              .findFirst({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,

                  itemId:
                    emprestimo
                      .exemplar
                      .itemId,

                  status:
                    StatusReservaBiblioteca
                      .AGUARDANDO,

                  usuarioId: {
                    not:
                      emprestimo
                        .usuarioId,
                  },
                },

                orderBy: [
                  {
                    posicaoFila:
                      "asc",
                  },

                  {
                    reservadaEm:
                      "asc",
                  },

                  {
                    id:
                      "asc",
                  },
                ],

                select: {
                  id: true,
                  usuarioId: true,
                  posicaoFila: true,
                  reservadaEm: true,
                },
              });

          if (reservaAguardando) {
            falhar(
              409,
              "Existe outra pessoa aguardando este item. A prioridade da fila de reservas impede a renova\u00e7\u00e3o.",
              "ITEM_COM_FILA_DE_RESERVA"
            );
          }

          const diasRenovacao =
            Math.max(
              1,
              configuracao
                .diasEmprestimoPadrao
            );

          /*
           * Acrescenta um periodo completo ao
           * vencimento atual, e nao a data de hoje.
           */
          const vencimentoAnterior =
            emprestimo
              .vencimentoEm;

          const novoVencimento =
            adicionarDiasUtc(
              vencimentoAnterior,
              diasRenovacao
            );

          const analisadaEm =
            new Date();

          const renovacao =
            await transacao
              .bibliotecaRenovacao
              .create({
                data: {
                  instituicaoId:
                    contexto.instituicaoId,

                  emprestimoId:
                    emprestimo.id,

                  status:
                    StatusRenovacaoBiblioteca
                      .APROVADA,

                  vencimentoAnterior,
                  novoVencimento,

                  solicitadaEm:
                    analisadaEm,

                  analisadaEm,

                  observacao,

                  solicitadaPorId:
                    usuario.id,

                  analisadaPorId:
                    usuario.id,
                },

                select: {
                  id: true,
                  status: true,

                  vencimentoAnterior:
                    true,

                  novoVencimento:
                    true,

                  solicitadaEm:
                    true,

                  analisadaEm:
                    true,
                },
              });

          const atualizado =
            await transacao
              .bibliotecaEmprestimo
              .update({
                where: {
                  id:
                    emprestimo.id,
                },

                data: {
                  vencimentoEm:
                    novoVencimento,

                  quantidadeRenovacoes:
                    {
                      increment:
                        1,
                    },
                },

                select: {
                  id: true,
                  status: true,

                  vencimentoEm:
                    true,

                  quantidadeRenovacoes:
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
                  "BibliotecaEmprestimo",

                entidadeId:
                  String(
                    emprestimo.id
                  ),

                acao:
                  AcaoAuditoriaBiblioteca
                    .RENOVAR,

                descricao:
                  "Empr\u00e9stimo renovado na Biblioteca Virtual.",

                dadosAnteriores: {
                  status:
                    emprestimo.status,

                  vencimentoEm:
                    vencimentoAnterior
                      .toISOString(),

                  quantidadeRenovacoes:
                    emprestimo
                      .quantidadeRenovacoes,
                },

                dadosPosteriores: {
                  status:
                    atualizado.status,

                  vencimentoEm:
                    atualizado
                      .vencimentoEm
                      .toISOString(),

                  quantidadeRenovacoes:
                    atualizado
                      .quantidadeRenovacoes,
                },

                metadados: {
                  origem:
                    "api_admin_biblioteca_emprestimo_renovar",

                  renovacaoId:
                    renovacao.id,

                  exemplarId:
                    emprestimo
                      .exemplarId,

                  itemId:
                    emprestimo
                      .exemplar
                      .itemId,

                  codigoInterno:
                    emprestimo
                      .exemplar
                      .codigoInterno,

                  diasRenovacao,
                },

                ip,
                userAgent,
              },
            });

          return {
            renovacao,

            emprestimo:
              atualizado,
          };
        }
      );

    return responder({
      ok: true,

      mensagem:
        "Empr\u00e9stimo renovado com sucesso.",

      ...resultado,
    });
  } catch (erro) {
    return responderErro(erro);
  }
}
