import {
  AcaoAuditoriaBiblioteca,
  Prisma,
  StatusEmprestimoBiblioteca,
  StatusExemplarBiblioteca,
  StatusManutencaoExemplarBiblioteca,
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

export const runtime = "nodejs";
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

function textoObrigatorio(
  valor: unknown,
  campo: string,
  limite: number
) {
  if (
    typeof valor !== "string" ||
    !valor.trim()
  ) {
    falhar(
      400,
      `Informe ${campo}.`,
      "CAMPO_OBRIGATORIO"
    );
  }

  const texto = valor.trim();

  if (texto.length > limite) {
    falhar(
      400,
      `${campo} excede o limite permitido.`,
      "CAMPO_MUITO_LONGO"
    );
  }

  return texto;
}

function textoOpcional(
  valor: unknown,
  campo: string,
  limite: number
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  if (typeof valor !== "string") {
    falhar(
      400,
      `${campo} é inválido.`,
      "CAMPO_INVALIDO"
    );
  }

  const texto = valor.trim();

  if (!texto) {
    return null;
  }

  if (texto.length > limite) {
    falhar(
      400,
      `${campo} excede o limite permitido.`,
      "CAMPO_MUITO_LONGO"
    );
  }

  return texto;
}

function valorMonetarioOpcional(
  valor: unknown,
  campo: string
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  if (
    typeof valor !== "string" &&
    typeof valor !== "number"
  ) {
    falhar(
      400,
      `${campo} é inválido.`,
      "VALOR_MONETARIO_INVALIDO"
    );
  }

  const texto = String(valor).trim();

  const normalizado = texto.includes(",")
    ? texto
        .replace(/\./g, "")
        .replace(",", ".")
    : texto;

  if (
    !/^\d{1,10}(\.\d{1,2})?$/.test(
      normalizado
    )
  ) {
    falhar(
      400,
      `${campo} é inválido.`,
      "VALOR_MONETARIO_INVALIDO"
    );
  }

  return new Prisma.Decimal(
    normalizado
  );
}

function dataOpcional(
  valor: unknown
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  if (typeof valor !== "string") {
    falhar(
      400,
      "A previsão de retorno é inválida.",
      "PREVISAO_RETORNO_INVALIDA"
    );
  }

  const texto = valor.trim();

  const data =
    /^\d{4}-\d{2}-\d{2}$/.test(texto)
      ? new Date(
          `${texto}T12:00:00.000Z`
        )
      : new Date(texto);

  if (
    Number.isNaN(data.getTime())
  ) {
    falhar(
      400,
      "A previsão de retorno é inválida.",
      "PREVISAO_RETORNO_INVALIDA"
    );
  }

  return data;
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
   Envia um exemplar para manutenção
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
        "Não é permitido iniciar manutenções durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.exemplares.manutencao"
    );

    const exemplarId =
      obterExemplarId(params);

    let corpo: {
      motivo?: unknown;
      observacaoEntrada?: unknown;
      fornecedor?: unknown;
      custoEstimado?: unknown;
      previsaoRetornoEm?: unknown;
    };

    try {
      corpo = await request.json();
    } catch {
      falhar(
        400,
        "Os dados da manutenção são inválidos.",
        "JSON_INVALIDO"
      );
    }

    const motivo =
      textoObrigatorio(
        corpo.motivo,
        "o motivo da manutenção",
        1_000
      );

    const observacaoEntrada =
      textoOpcional(
        corpo.observacaoEntrada,
        "A observação de entrada",
        5_000
      );

    const fornecedor =
      textoOpcional(
        corpo.fornecedor,
        "O fornecedor",
        200
      );

    const custoEstimado =
      valorMonetarioOpcional(
        corpo.custoEstimado,
        "O custo estimado"
      );

    const previsaoRetornoEm =
      dataOpcional(
        corpo.previsaoRetornoEm
      );

    const ip = obterIp(request);

    const userAgent =
      request.headers.get(
        "user-agent"
      );

    const resultado =
      await prisma.$transaction(
        async (transacao) => {
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
            exemplar.baixadoEm ||
            exemplar.status ===
              StatusExemplarBiblioteca.BAIXADO
          ) {
            falhar(
              409,
              "Este exemplar foi baixado do acervo.",
              "EXEMPLAR_BAIXADO"
            );
          }

          if (
            exemplar.tipo !==
            TipoExemplarBiblioteca.FISICO
          ) {
            falhar(
              409,
              "Somente exemplares físicos podem ser enviados para manutenção.",
              "EXEMPLAR_NAO_FISICO"
            );
          }

          if (
            exemplar.status !==
              StatusExemplarBiblioteca.DANIFICADO &&
            exemplar.status !==
              StatusExemplarBiblioteca.INDISPONIVEL
          ) {
            falhar(
              409,
              "Somente exemplares danificados ou indisponíveis podem ser enviados para manutenção.",
              "STATUS_NAO_PERMITE_MANUTENCAO"
            );
          }

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
              "O exemplar possui um empréstimo em aberto.",
              "EMPRESTIMO_EM_ABERTO"
            );
          }

          const manutencaoAberta =
            await transacao
              .bibliotecaManutencaoExemplar
              .findFirst({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,

                  exemplarId,

                  status:
                    StatusManutencaoExemplarBiblioteca.ABERTA,
                },

                select: {
                  id: true,
                },
              });

          if (manutencaoAberta) {
            falhar(
              409,
              "Este exemplar já possui uma manutenção em andamento.",
              "MANUTENCAO_JA_ABERTA"
            );
          }

          const manutencao =
            await transacao
              .bibliotecaManutencaoExemplar
              .create({
                data: {
                  instituicaoId:
                    contexto.instituicaoId,

                  exemplarId,

                  status:
                    StatusManutencaoExemplarBiblioteca.ABERTA,

                  motivo,
                  observacaoEntrada,
                  fornecedor,
                  custoEstimado,
                  previsaoRetornoEm,

                  iniciadoPorId:
                    usuario.id,
                },

                select: {
                  id: true,
                  exemplarId: true,
                  status: true,
                  motivo: true,
                  observacaoEntrada:
                    true,
                  fornecedor: true,
                  custoEstimado: true,
                  iniciadaEm: true,
                  previsaoRetornoEm:
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
                    StatusExemplarBiblioteca.MANUTENCAO,

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
                  AcaoAuditoriaBiblioteca.INICIAR_MANUTENCAO,

                descricao:
                  "Exemplar enviado para manutenção na Biblioteca Virtual.",

                dadosAnteriores: {
                  exemplarStatus:
                    exemplar.status,
                },

                dadosPosteriores: {
                  exemplarStatus:
                    StatusExemplarBiblioteca.MANUTENCAO,

                  manutencaoStatus:
                    StatusManutencaoExemplarBiblioteca.ABERTA,

                  motivo,

                  fornecedor,

                  custoEstimado:
                    custoEstimado
                      ?.toString() ??
                    null,

                  previsaoRetornoEm:
                    previsaoRetornoEm
                      ?.toISOString() ??
                    null,
                },

                metadados: {
                  origem:
                    "api_admin_biblioteca_exemplar_iniciar_manutencao",

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
            manutencao,
            exemplar:
              exemplarAtualizado,
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
          "Exemplar enviado para manutenção com sucesso.",

        manutencao:
          resultado.manutencao,

        exemplar:
          resultado.exemplar,
      },
      201
    );
  } catch (erro) {
    return responderErro(erro);
  }
}