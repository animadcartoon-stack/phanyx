import {
  AcaoAuditoriaBiblioteca,
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

import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Operacao =
  | "ATUALIZAR_PERMISSOES"
  | "REVOGAR"
  | "RESTAURAR";

const OPERADOR_SELECT = {
  id: true,
  ativo: true,

  podeCatalogar: true,
  podePublicar: true,
  podeArquivar: true,
  podeGerenciarEmprestimo: true,
  podeGerenciarReserva: true,
  podeGerenciarColecao: true,
  podeGerenciarLicenca: true,
  podeGerenciarOperador: true,
  podeVisualizarRelatorio: true,
  podeGerenciarConfiguracao: true,

  criadoEm: true,
  atualizadoEm: true,

  revogadoEm: true,
  motivoRevogacao: true,

  funcionario: {
    select: {
      id: true,
      nome: true,
      cargo: true,
      setor: true,
      fotoPerfil: true,
      ativo: true,
      statusFuncionario: true,
    },
  },

  usuario: {
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      ativo: true,
      instituicaoId: true,
    },
  },

  criadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },

  revogadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },
} as const;

function responder(
  corpo: unknown,
  status = 200,
) {
  return NextResponse.json(
    corpo,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    },
  );
}

function falhar(
  status: number,
  mensagem: string,
  codigo: string,
): never {
  throw new ErroBiblioteca(
    status,
    mensagem,
    codigo,
  );
}

function responderErro(
  erro: unknown,
) {
  const resposta =
    respostaErroBiblioteca(
      erro,
    );

  return responder(
    resposta.corpo,
    resposta.status,
  );
}

function inteiroPositivo(
  valor: unknown,
  campo: string,
) {
  const numero =
    Number(valor);

  if (
    !Number.isInteger(
      numero,
    ) ||
    numero <= 0
  ) {
    falhar(
      400,
      `O campo ${campo} é inválido.`,
      "CAMPO_INVALIDO",
    );
  }

  return numero;
}

async function lerCorpo(
  request: NextRequest,
) {
  try {
    const corpo =
      await request.json();

    if (
      !corpo ||
      typeof corpo !== "object" ||
      Array.isArray(corpo)
    ) {
      falhar(
        400,
        "O corpo da requisição deve ser um objeto JSON válido.",
        "CORPO_INVALIDO",
      );
    }

    return corpo as Record<
      string,
      unknown
    >;
  } catch (erro) {
    if (
      erro instanceof
      ErroBiblioteca
    ) {
      throw erro;
    }

    falhar(
      400,
      "O corpo da requisição contém um JSON inválido.",
      "JSON_INVALIDO",
    );
  }
}

function booleanoObrigatorio(
  valor: unknown,
  campo: string,
) {
  if (
    typeof valor !==
    "boolean"
  ) {
    falhar(
      400,
      `O campo ${campo} deve ser verdadeiro ou falso.`,
      "CAMPO_BOOLEANO_INVALIDO",
    );
  }

  return valor;
}

function textoObrigatorio(
  valor: unknown,
  campo: string,
  limite: number,
) {
  if (
    typeof valor !==
    "string"
  ) {
    falhar(
      400,
      `O campo ${campo} deve ser um texto.`,
      "CAMPO_INVALIDO",
    );
  }

  const texto =
    valor.trim();

  if (!texto) {
    falhar(
      400,
      `O campo ${campo} é obrigatório.`,
      "CAMPO_OBRIGATORIO",
    );
  }

  if (
    texto.length >
    limite
  ) {
    falhar(
      400,
      `O campo ${campo} ultrapassa o limite permitido.`,
      "CAMPO_MUITO_LONGO",
    );
  }

  return texto;
}

function obterIp(
  request: NextRequest,
) {
  const encaminhado =
    request.headers.get(
      "x-forwarded-for",
    );

  const candidato =
    encaminhado
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get(
      "x-real-ip",
    ) ||
    null;

  return candidato
    ? candidato.slice(
        0,
        255,
      )
    : null;
}

function obterUserAgent(
  request: NextRequest,
) {
  const userAgent =
    request.headers.get(
      "user-agent",
    );

  return userAgent
    ? userAgent.slice(
        0,
        4000,
      )
    : null;
}

function permissoesDoOperador(
  operador: {
    podeCatalogar: boolean;
    podePublicar: boolean;
    podeArquivar: boolean;
    podeGerenciarEmprestimo: boolean;
    podeGerenciarReserva: boolean;
    podeGerenciarColecao: boolean;
    podeGerenciarLicenca: boolean;
    podeGerenciarOperador: boolean;
    podeVisualizarRelatorio: boolean;
    podeGerenciarConfiguracao: boolean;
  },
) {
  return {
    podeCatalogar:
      operador.podeCatalogar,

    podePublicar:
      operador.podePublicar,

    podeArquivar:
      operador.podeArquivar,

    podeGerenciarEmprestimo:
      operador.podeGerenciarEmprestimo,

    podeGerenciarReserva:
      operador.podeGerenciarReserva,

    podeGerenciarColecao:
      operador.podeGerenciarColecao,

    podeGerenciarLicenca:
      operador.podeGerenciarLicenca,

    podeGerenciarOperador:
      operador.podeGerenciarOperador,

    podeVisualizarRelatorio:
      operador.podeVisualizarRelatorio,

    podeGerenciarConfiguracao:
      operador.podeGerenciarConfiguracao,
  };
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: {
      operadorId: string;
    };
  },
) {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO",
      );
    }

    const contexto =
      await obterContextoBiblioteca(
        usuario,
      );

    if (
      usuario.impersonacao
    ) {
      falhar(
        403,
        "Não é permitido alterar operadores durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO",
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.operadores.gerenciar",
    );

    const operadorId =
      inteiroPositivo(
        context.params.operadorId,
        "operadorId",
      );

    const corpo =
      await lerCorpo(
        request,
      );

    const operacao =
      String(
        corpo.operacao || "",
      )
        .trim()
        .toUpperCase() as Operacao;

    if (
      ![
        "ATUALIZAR_PERMISSOES",
        "REVOGAR",
        "RESTAURAR",
      ].includes(
        operacao,
      )
    ) {
      falhar(
        400,
        "A operação informada é inválida.",
        "OPERACAO_INVALIDA",
      );
    }

    const ip =
      obterIp(
        request,
      );

    const userAgent =
      obterUserAgent(
        request,
      );

    const resultado =
      await prisma.$transaction(
        async (
          transacao,
        ) => {
          const anterior =
            await transacao
              .bibliotecaOperador
              .findFirst({
                where: {
                  id:
                    operadorId,

                  instituicaoId:
                    contexto.instituicaoId,
                },

                select:
                  OPERADOR_SELECT,
              });

          if (!anterior) {
            falhar(
              404,
              "Operador da Biblioteca não encontrado.",
              "OPERADOR_NAO_ENCONTRADO",
            );
          }

          /*
           * =====================================================
           * ATUALIZAR PERMISSÕES
           * =====================================================
           */
          if (
            operacao ===
            "ATUALIZAR_PERMISSOES"
          ) {
            if (
              !anterior.ativo
            ) {
              falhar(
                409,
                "Não é possível alterar permissões de um operador revogado. Restaure o acesso primeiro.",
                "OPERADOR_REVOGADO",
              );
            }

            const permissoes = {
              podeCatalogar:
                booleanoObrigatorio(
                  corpo.podeCatalogar,
                  "podeCatalogar",
                ),

              podePublicar:
                booleanoObrigatorio(
                  corpo.podePublicar,
                  "podePublicar",
                ),

              podeArquivar:
                booleanoObrigatorio(
                  corpo.podeArquivar,
                  "podeArquivar",
                ),

              podeGerenciarEmprestimo:
                booleanoObrigatorio(
                  corpo.podeGerenciarEmprestimo,
                  "podeGerenciarEmprestimo",
                ),

              podeGerenciarReserva:
                booleanoObrigatorio(
                  corpo.podeGerenciarReserva,
                  "podeGerenciarReserva",
                ),

              podeGerenciarColecao:
                booleanoObrigatorio(
                  corpo.podeGerenciarColecao,
                  "podeGerenciarColecao",
                ),

              podeGerenciarLicenca:
                booleanoObrigatorio(
                  corpo.podeGerenciarLicenca,
                  "podeGerenciarLicenca",
                ),

              podeGerenciarOperador:
                booleanoObrigatorio(
                  corpo.podeGerenciarOperador,
                  "podeGerenciarOperador",
                ),

              podeVisualizarRelatorio:
                booleanoObrigatorio(
                  corpo.podeVisualizarRelatorio,
                  "podeVisualizarRelatorio",
                ),

              podeGerenciarConfiguracao:
                booleanoObrigatorio(
                  corpo.podeGerenciarConfiguracao,
                  "podeGerenciarConfiguracao",
                ),
            };

            const atualizado =
              await transacao
                .bibliotecaOperador
                .update({
                  where: {
                    id:
                      anterior.id,
                  },

                  data:
                    permissoes,

                  select:
                    OPERADOR_SELECT,
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
                    "BibliotecaOperador",

                  entidadeId:
                    String(
                      anterior.id,
                    ),

                  acao:
                    AcaoAuditoriaBiblioteca
                      .ATUALIZAR,

                  descricao:
                    "Permissões do operador da Biblioteca atualizadas.",

                  dadosAnteriores: {
                    ativo:
                      anterior.ativo,

                    permissoes:
                      permissoesDoOperador(
                        anterior,
                      ),
                  },

                  dadosPosteriores: {
                    ativo:
                      atualizado.ativo,

                    permissoes:
                      permissoesDoOperador(
                        atualizado,
                      ),
                  },

                  metadados: {
                    origem:
                      "admin.biblioteca.operadores",

                    metodo:
                      "PATCH",

                    operacao,

                    funcionarioId:
                      anterior.funcionario.id,

                    funcionarioNome:
                      anterior.funcionario.nome,

                    usuarioOperadorId:
                      anterior.usuario.id,

                    usuarioOperadorEmail:
                      anterior.usuario.email,
                  },

                  ip,
                  userAgent,
                },
              });

            return atualizado;
          }

          /*
           * =====================================================
           * REVOGAR
           * =====================================================
           */
          if (
            operacao ===
            "REVOGAR"
          ) {
            if (
              !anterior.ativo
            ) {
              falhar(
                409,
                "O acesso deste operador já está revogado.",
                "OPERADOR_JA_REVOGADO",
              );
            }

            const ehProprioOperador =
              anterior.usuario.id ===
              usuario.id;

            const podeRevogarProprioAcesso =
              usuario.isMasterAdmin ||
              isAdminLike(
                usuario.role,
              );

            if (
              ehProprioOperador &&
              !podeRevogarProprioAcesso
            ) {
              falhar(
                409,
                "Você não pode revogar o próprio acesso de operador da Biblioteca.",
                "AUTO_REVOGACAO_BLOQUEADA",
              );
            }

            const motivo =
              textoObrigatorio(
                corpo.motivo,
                "motivo",
                1000,
              );

            const agora =
              new Date();

            const revogado =
              await transacao
                .bibliotecaOperador
                .update({
                  where: {
                    id:
                      anterior.id,
                  },

                  data: {
                    ativo:
                      false,

                    revogadoEm:
                      agora,

                    revogadoPorId:
                      usuario.id,

                    motivoRevogacao:
                      motivo,
                  },

                  select:
                    OPERADOR_SELECT,
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
                    "BibliotecaOperador",

                  entidadeId:
                    String(
                      anterior.id,
                    ),

                  acao:
                    AcaoAuditoriaBiblioteca
                      .REVOGAR_ACESSO,

                  descricao:
                    "Acesso de operador da Biblioteca revogado.",

                  dadosAnteriores: {
                    ativo:
                      anterior.ativo,

                    permissoes:
                      permissoesDoOperador(
                        anterior,
                      ),
                  },

                  dadosPosteriores: {
                    ativo:
                      false,

                    revogadoEm:
                      agora.toISOString(),

                    motivoRevogacao:
                      motivo,
                  },

                  metadados: {
                    origem:
                      "admin.biblioteca.operadores",

                    metodo:
                      "PATCH",

                    operacao,

                    funcionarioId:
                      anterior.funcionario.id,

                    funcionarioNome:
                      anterior.funcionario.nome,

                    usuarioOperadorId:
                      anterior.usuario.id,

                    usuarioOperadorEmail:
                      anterior.usuario.email,
                  },

                  ip,
                  userAgent,
                },
              });

            return revogado;
          }

          /*
           * =====================================================
           * RESTAURAR
           * =====================================================
           */
          if (
            anterior.ativo
          ) {
            falhar(
              409,
              "O operador já possui acesso ativo.",
              "OPERADOR_JA_ATIVO",
            );
          }

          if (
            !anterior.funcionario.ativo ||
            !anterior.usuario.ativo ||
            anterior.usuario.instituicaoId !==
              contexto.instituicaoId
          ) {
            falhar(
              409,
              "O acesso não pode ser restaurado porque o funcionário ou usuário não está ativo nesta instituição.",
              "OPERADOR_NAO_ELEGIVEL_RESTAURACAO",
            );
          }

          const restaurado =
            await transacao
              .bibliotecaOperador
              .update({
                where: {
                  id:
                    anterior.id,
                },

                data: {
                  ativo:
                    true,

                  revogadoEm:
                    null,

                  revogadoPorId:
                    null,

                  motivoRevogacao:
                    null,
                },

                select:
                  OPERADOR_SELECT,
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
                  "BibliotecaOperador",

                entidadeId:
                  String(
                    anterior.id,
                  ),

                acao:
                  AcaoAuditoriaBiblioteca
                    .RESTAURAR,

                descricao:
                  "Acesso de operador da Biblioteca restaurado.",

                dadosAnteriores: {
                  ativo:
                    false,

                  revogadoEm:
                    anterior.revogadoEm
                      ?.toISOString() ??
                    null,

                  motivoRevogacao:
                    anterior.motivoRevogacao,
                },

                dadosPosteriores: {
                  ativo:
                    true,

                  permissoes:
                    permissoesDoOperador(
                      restaurado,
                    ),
                },

                metadados: {
                  origem:
                    "admin.biblioteca.operadores",

                  metodo:
                    "PATCH",

                  operacao:
                    "RESTAURAR",

                  funcionarioId:
                    anterior.funcionario.id,

                  funcionarioNome:
                    anterior.funcionario.nome,

                  usuarioOperadorId:
                    anterior.usuario.id,

                  usuarioOperadorEmail:
                    anterior.usuario.email,
                },

                ip,
                userAgent,
              },
            });

          return restaurado;
        },
      );

    return responder({
      success: true,

      message:
        operacao ===
        "ATUALIZAR_PERMISSOES"
          ? "Permissões do operador atualizadas com sucesso."
          : operacao ===
              "REVOGAR"
            ? "Acesso do operador revogado com sucesso."
            : "Acesso do operador restaurado com sucesso.",

      operador:
        resultado,
    });
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}
