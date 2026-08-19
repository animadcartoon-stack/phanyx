import {
  AcaoAuditoriaBiblioteca,
  StatusEmprestimoBiblioteca,
  StatusExemplarBiblioteca,
  TipoExemplarBiblioteca,
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
  params: {
    exemplarId: string;
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

function obterExemplarId(
  params: ContextoRota["params"]
) {
  const exemplarId =
    Number(params.exemplarId);

  if (
    !Number.isInteger(exemplarId) ||
    exemplarId <= 0
  ) {
    falhar(
      400,
      "Exemplar inválido.",
      "EXEMPLAR_INVALIDO"
    );
  }

  return exemplarId;
}

function inteiroPositivo(
  valor: unknown,
  campo: string
) {
  const numero =
    Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    falhar(
      400,
      `O campo ${campo} é inválido.`,
      "CAMPO_INVALIDO"
    );
  }

  return numero;
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
      "A observação informada é inválida.",
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
      "A observação excede o limite permitido.",
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

/* =========================================================
   POST
   Registra o empréstimo de um exemplar físico
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
        "Não é permitido registrar empréstimos durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.emprestimos.gerenciar"
    );

    const exemplarId =
      obterExemplarId(params);

    let corpo: {
      usuarioId?: unknown;
      vencimentoEm?: unknown;
      observacaoRetirada?: unknown;
    };

    try {
      corpo =
        await request.json();
    } catch {
      falhar(
        400,
        "O corpo da requisição contém um JSON inválido.",
        "JSON_INVALIDO"
      );
    }

    const usuarioId =
      inteiroPositivo(
        corpo.usuarioId,
        "usuarioId"
      );

    if (
      typeof corpo.vencimentoEm !==
      "string"
    ) {
      falhar(
        400,
        "Informe a data de vencimento do empréstimo.",
        "VENCIMENTO_OBRIGATORIO"
      );
    }

    const vencimentoEm =
      new Date(
        corpo.vencimentoEm
      );

    if (
      Number.isNaN(
        vencimentoEm.getTime()
      )
    ) {
      falhar(
        400,
        "A data de vencimento é inválida.",
        "VENCIMENTO_INVALIDO"
      );
    }

    if (
      vencimentoEm.getTime() <=
      Date.now()
    ) {
      falhar(
        400,
        "A data de vencimento deve ser futura.",
        "VENCIMENTO_DEVE_SER_FUTURO"
      );
    }

    const observacaoRetirada =
      textoOpcional(
        corpo.observacaoRetirada,
        5_000
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
           * Impede empréstimo, baixa ou outra
           * alteração simultânea no mesmo exemplar.
           */
          await transacao.$queryRaw`
            SELECT "id"
            FROM "BibliotecaExemplar"
            WHERE "id" = ${exemplarId}
              AND "instituicaoId" = ${contexto.instituicaoId}
            FOR UPDATE
          `;

          const exemplar =
            await transacao
              .bibliotecaExemplar
              .findFirst({
                where: {
                  id: exemplarId,

                  instituicaoId:
                    contexto.instituicaoId,
                },

                select: {
                  id: true,
                  itemId: true,

                  tipo: true,
                  status: true,

                  codigoInterno: true,
                  numeroTombo: true,

                  permiteEmprestimo:
                    true,

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
            exemplar.tipo !==
            TipoExemplarBiblioteca.FISICO
          ) {
            falhar(
              409,
              "Este fluxo de empréstimo é destinado a exemplares físicos.",
              "EXEMPLAR_NAO_FISICO"
            );
          }

          if (
            exemplar.baixadoEm ||
            exemplar.status ===
              StatusExemplarBiblioteca.BAIXADO
          ) {
            falhar(
              409,
              "Este exemplar foi baixado do acervo e não pode ser emprestado.",
              "EXEMPLAR_BAIXADO"
            );
          }

          if (
            !exemplar.permiteEmprestimo
          ) {
            falhar(
              409,
              "Este exemplar não está autorizado para empréstimo.",
              "EMPRESTIMO_NAO_PERMITIDO"
            );
          }

          if (
            exemplar.status !==
            StatusExemplarBiblioteca.DISPONIVEL
          ) {
            falhar(
              409,
              `O exemplar não está disponível para empréstimo. Status atual: ${exemplar.status}.`,
              "EXEMPLAR_NAO_DISPONIVEL"
            );
          }

          /*
           * O tomador precisa pertencer à mesma
           * instituição e possuir usuário ativo.
           *
           * Isso permite empréstimo a aluno,
           * professor ou funcionário.
           */
          const tomador =
            await transacao.user.findFirst({
              where: {
                id: usuarioId,

                instituicaoId:
                  contexto.instituicaoId,

                ativo: true,
              },

              select: {
                id: true,
                nome: true,
                email: true,
                role: true,
              },
            });

          if (!tomador) {
            falhar(
              404,
              "O usuário selecionado não foi encontrado ou está inativo.",
              "USUARIO_EMPRESTIMO_INVALIDO"
            );
          }

          /*
           * Proteção adicional contra inconsistência.
           */
          const emprestimoAberto =
            await transacao
              .bibliotecaEmprestimo
              .findFirst({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,

                  exemplarId,

                  status: {
                    in: [
                      StatusEmprestimoBiblioteca.ATIVO,
                      StatusEmprestimoBiblioteca.ATRASADO,
                    ],
                  },
                },

                select: {
                  id: true,
                },
              });

          if (emprestimoAberto) {
            falhar(
              409,
              "Já existe um empréstimo em aberto para este exemplar.",
              "EMPRESTIMO_JA_ABERTO"
            );
          }

          const emprestimo =
            await transacao
              .bibliotecaEmprestimo
              .create({
                data: {
                  instituicaoId:
                    contexto.instituicaoId,

                  exemplarId:
                    exemplar.id,

                  usuarioId:
                    tomador.id,

                  status:
                    StatusEmprestimoBiblioteca.ATIVO,

                  vencimentoEm,

                  observacaoRetirada,

                  registradoPorId:
                    usuario.id,
                },

                select: {
                  id: true,
                  exemplarId: true,
                  usuarioId: true,
                  status: true,
                  emprestadoEm: true,
                  vencimentoEm: true,
                  observacaoRetirada:
                    true,
                },
              });

          await transacao
            .bibliotecaExemplar
            .update({
              where: {
                id: exemplar.id,
              },

              data: {
                status:
                  StatusExemplarBiblioteca.EMPRESTADO,

                atualizadoPorId:
                  usuario.id,
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
                  AcaoAuditoriaBiblioteca.EMPRESTAR,

                descricao:
                  "Empréstimo de exemplar registrado na Biblioteca Virtual.",

                dadosAnteriores: {
                  exemplarStatus:
                    exemplar.status,
                },

                dadosPosteriores: {
                  exemplarStatus:
                    StatusExemplarBiblioteca.EMPRESTADO,

                  emprestimoId:
                    emprestimo.id,

                  usuarioId:
                    tomador.id,

                  usuarioNome:
                    tomador.nome,

                  vencimentoEm:
                    emprestimo.vencimentoEm,
                },

                metadados: {
                  origem:
                    "api_admin_biblioteca_exemplar_emprestar",

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
            emprestimo,
            tomador,
          };
        },
        {
          maxWait: 5_000,
          timeout: 10_000,
        }
      );

    return responder(
      {
        ok: true,

        mensagem:
          "Empréstimo registrado com sucesso.",

        emprestimo:
          resultado.emprestimo,

        usuario:
          resultado.tomador,
      },
      201
    );
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}