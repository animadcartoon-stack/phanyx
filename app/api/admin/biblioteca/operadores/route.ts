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

/* =========================================================
   RESPOSTAS / ERROS
   ========================================================= */

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

/* =========================================================
   VALIDAÇÃO
   ========================================================= */

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

function booleanoOpcional(
  valor: unknown,
  padrao: boolean,
  campo: string,
) {
  if (
    valor === undefined
  ) {
    return padrao;
  }

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

/* =========================================================
   AUDITORIA
   ========================================================= */

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

/* =========================================================
   SERIALIZAÇÃO
   ========================================================= */

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

/* =========================================================
   GET
   Lista operadores + funcionários elegíveis
   ========================================================= */

export async function GET() {
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

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.operadores.ver",
    );

    const [
      operadores,
      funcionarios,
    ] =
      await prisma.$transaction([
        prisma
          .bibliotecaOperador
          .findMany({
            where: {
              instituicaoId:
                contexto.instituicaoId,
            },

            orderBy: [
              {
                ativo:
                  "desc",
              },
              {
                criadoEm:
                  "desc",
              },
              {
                id:
                  "desc",
              },
            ],

            select:
              OPERADOR_SELECT,
          }),

        prisma
          .funcionario
          .findMany({
            where: {
              instituicaoId:
                contexto.instituicaoId,

              ativo:
                true,

              userId: {
                not: null,
              },

              user: {
                is: {
                  ativo:
                    true,

                  instituicaoId:
                    contexto.instituicaoId,
                },
              },

              bibliotecaOperacoes: {
                none: {
                  instituicaoId:
                    contexto.instituicaoId,
                },
              },
            },

            orderBy: {
              nome:
                "asc",
            },

            select: {
              id: true,
              nome: true,
              cargo: true,
              setor: true,
              fotoPerfil: true,
              statusFuncionario: true,

              user: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                  role: true,
                  ativo: true,
                },
              },
            },
          }),
      ]);

    const podeGerenciarOperadores =
      usuario.isMasterAdmin ||
      isAdminLike(
        usuario.role,
      ) ||
      usuario.permissoes.includes(
        "biblioteca.operadores.gerenciar",
      ) ||
      contexto.operador
        ?.podeGerenciarOperador ===
        true;

    return responder({
      success: true,

      acesso: {
        podeGerenciar:
          podeGerenciarOperadores,
      },

      resumo: {
        total:
          operadores.length,

        ativos:
          operadores.filter(
            (item) =>
              item.ativo,
          ).length,

        revogados:
          operadores.filter(
            (item) =>
              !item.ativo,
          ).length,

        elegiveis:
          funcionarios.length,
      },

      operadores,

      funcionariosElegiveis:
        funcionarios,
    });
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}

/* =========================================================
   POST
   Concede acesso de operador
   ========================================================= */

export async function POST(
  request: NextRequest,
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
        "Não é permitido conceder acesso de operador durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO",
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.operadores.gerenciar",
    );

    const corpo =
      await lerCorpo(
        request,
      );

    const funcionarioId =
      inteiroPositivo(
        corpo.funcionarioId,
        "funcionarioId",
      );

    const permissoes = {
      podeCatalogar:
        booleanoOpcional(
          corpo.podeCatalogar,
          true,
          "podeCatalogar",
        ),

      podePublicar:
        booleanoOpcional(
          corpo.podePublicar,
          false,
          "podePublicar",
        ),

      podeArquivar:
        booleanoOpcional(
          corpo.podeArquivar,
          false,
          "podeArquivar",
        ),

      podeGerenciarEmprestimo:
        booleanoOpcional(
          corpo.podeGerenciarEmprestimo,
          true,
          "podeGerenciarEmprestimo",
        ),

      podeGerenciarReserva:
        booleanoOpcional(
          corpo.podeGerenciarReserva,
          true,
          "podeGerenciarReserva",
        ),

      podeGerenciarColecao:
        booleanoOpcional(
          corpo.podeGerenciarColecao,
          true,
          "podeGerenciarColecao",
        ),

      podeGerenciarLicenca:
        booleanoOpcional(
          corpo.podeGerenciarLicenca,
          false,
          "podeGerenciarLicenca",
        ),

      podeGerenciarOperador:
        booleanoOpcional(
          corpo.podeGerenciarOperador,
          false,
          "podeGerenciarOperador",
        ),

      podeVisualizarRelatorio:
        booleanoOpcional(
          corpo.podeVisualizarRelatorio,
          true,
          "podeVisualizarRelatorio",
        ),

      podeGerenciarConfiguracao:
        booleanoOpcional(
          corpo.podeGerenciarConfiguracao,
          false,
          "podeGerenciarConfiguracao",
        ),
    };

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
          const funcionario =
            await transacao
              .funcionario
              .findFirst({
                where: {
                  id:
                    funcionarioId,

                  instituicaoId:
                    contexto.instituicaoId,

                  ativo:
                    true,

                  userId: {
                    not:
                      null,
                  },
                },

                select: {
                  id: true,
                  nome: true,
                  cargo: true,
                  setor: true,
                  userId: true,

                  user: {
                    select: {
                      id: true,
                      nome: true,
                      email: true,
                      role: true,
                      ativo: true,
                      instituicaoId: true,
                    },
                  },
                },
              });

          if (
            !funcionario ||
            !funcionario.userId ||
            !funcionario.user ||
            !funcionario.user.ativo ||
            funcionario.user.instituicaoId !==
              contexto.instituicaoId
          ) {
            falhar(
              404,
              "Funcionário elegível não encontrado nesta instituição.",
              "FUNCIONARIO_NAO_ELEGIVEL",
            );
          }

          const existente =
            await transacao
              .bibliotecaOperador
              .findFirst({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,

                  OR: [
                    {
                      funcionarioId:
                        funcionario.id,
                    },
                    {
                      usuarioId:
                        funcionario.user.id,
                    },
                  ],
                },

                select: {
                  id: true,
                  ativo: true,
                },
              });

          if (existente) {
            falhar(
              409,
              existente.ativo
                ? "Este funcionário já é operador ativo da Biblioteca."
                : "Este funcionário já possui um operador revogado. Restaure o acesso existente em vez de criar outro.",
              existente.ativo
                ? "OPERADOR_JA_EXISTE"
                : "OPERADOR_REVOGADO_EXISTENTE",
            );
          }

          const operador =
            await transacao
              .bibliotecaOperador
              .create({
                data: {
                  instituicaoId:
                    contexto.instituicaoId,

                  funcionarioId:
                    funcionario.id,

                  usuarioId:
                    funcionario.user.id,

                  ativo:
                    true,

                  ...permissoes,

                  criadoPorId:
                    usuario.id,

                  revogadoPorId:
                    null,

                  revogadoEm:
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
                    operador.id,
                  ),

                acao:
                  AcaoAuditoriaBiblioteca
                    .CONCEDER_ACESSO,

                descricao:
                  "Acesso de operador da Biblioteca concedido.",

                dadosPosteriores: {
                  ativo:
                    operador.ativo,

                  funcionarioId:
                    operador.funcionario.id,

                  usuarioId:
                    operador.usuario.id,

                  permissoes:
                    permissoesDoOperador(
                      operador,
                    ),
                },

                metadados: {
                  origem:
                    "admin.biblioteca.operadores",

                  metodo:
                    "POST",

                  funcionarioNome:
                    operador.funcionario.nome,

                  usuarioEmail:
                    operador.usuario.email,
                },

                ip,
                userAgent,
              },
            });

          return operador;
        },
      );

    return responder(
      {
        success: true,

        message:
          "Operador da Biblioteca cadastrado com sucesso.",

        operador:
          resultado,
      },
      201,
    );
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}
