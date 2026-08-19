import {
  AcaoAuditoriaBiblioteca,
  Prisma,
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

type CorpoEdicao = Record<
  string,
  unknown
>;

const TIPOS_EXEMPLAR =
  new Set<TipoExemplarBiblioteca>(
    Object.values(
      TipoExemplarBiblioteca
    )
  );

const EXEMPLAR_SELECT = {
  id: true,
  instituicaoId: true,
  itemId: true,
  licencaId: true,

  tipo: true,
  status: true,

  codigoInterno: true,
  codigoBarras: true,
  numeroTombo: true,
  patrimonio: true,

  poloIdSnapshot: true,
  unidadeSnapshot: true,
  setor: true,
  sala: true,
  estante: true,
  prateleira: true,
  localizacaoCompleta: true,

  dataAquisicao: true,
  formaAquisicao: true,
  fornecedor: true,
  valorAquisicao: true,

  permiteEmprestimo: true,
  observacoes: true,

  criadoPorId: true,
  atualizadoPorId: true,

  criadoEm: true,
  atualizadoEm: true,

  baixadoEm: true,
  motivoBaixa: true,
} satisfies Prisma.BibliotecaExemplarSelect;

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

async function lerCorpo(
  request: NextRequest
): Promise<CorpoEdicao> {
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
        "O corpo da requisição é inválido.",
        "CORPO_INVALIDO"
      );
    }

    return corpo as CorpoEdicao;
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
      "JSON_INVALIDO"
    );
  }
}

function textoObrigatorio(
  valor: unknown,
  campo: string,
  limite: number
) {
  if (
    typeof valor !== "string"
  ) {
    falhar(
      400,
      `O campo ${campo} é obrigatório.`,
      "CAMPO_OBRIGATORIO"
    );
  }

  const texto =
    valor.trim();

  if (!texto) {
    falhar(
      400,
      `O campo ${campo} é obrigatório.`,
      "CAMPO_OBRIGATORIO"
    );
  }

  if (
    texto.length > limite
  ) {
    falhar(
      400,
      `O campo ${campo} excede o limite permitido.`,
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

  if (
    typeof valor !== "string"
  ) {
    falhar(
      400,
      `O campo ${campo} é inválido.`,
      "CAMPO_INVALIDO"
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
      `O campo ${campo} excede o limite permitido.`,
      "CAMPO_MUITO_LONGO"
    );
  }

  return texto;
}

function tipoExemplar(
  valor: unknown
): TipoExemplarBiblioteca {
  if (
    typeof valor !== "string" ||
    !TIPOS_EXEMPLAR.has(
      valor as
        TipoExemplarBiblioteca
    )
  ) {
    falhar(
      400,
      "O tipo do exemplar é inválido.",
      "TIPO_EXEMPLAR_INVALIDO"
    );
  }

  return valor as
    TipoExemplarBiblioteca;
}

function booleano(
  valor: unknown,
  campo: string
) {
  if (
    typeof valor !== "boolean"
  ) {
    falhar(
      400,
      `O campo ${campo} deve ser verdadeiro ou falso.`,
      "CAMPO_INVALIDO"
    );
  }

  return valor;
}

function dataOpcional(
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
    typeof valor !== "string"
  ) {
    falhar(
      400,
      `O campo ${campo} possui uma data inválida.`,
      "DATA_INVALIDA"
    );
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    falhar(
      400,
      `O campo ${campo} possui uma data inválida.`,
      "DATA_INVALIDA"
    );
  }

  return data;
}

function decimalOpcional(
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

  let normalizado =
    String(valor).trim();

  /*
   * Aceita tanto:
   * 1.234,56
   * quanto:
   * 1234.56
   */
  if (
    normalizado.includes(",")
  ) {
    normalizado =
      normalizado
        .replace(/\./g, "")
        .replace(",", ".");
  }

  try {
    const decimal =
      new Prisma.Decimal(
        normalizado
      );

    if (
      decimal.isNegative()
    ) {
      falhar(
        400,
        `O campo ${campo} não pode ser negativo.`,
        "VALOR_INVALIDO"
      );
    }

    return decimal;
  } catch {
    falhar(
      400,
      `O campo ${campo} possui um valor inválido.`,
      "VALOR_INVALIDO"
    );
  }
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
  if (
    erro instanceof
      Prisma.PrismaClientKnownRequestError &&
    erro.code === "P2002"
  ) {
    return responder(
      {
        error:
          "Já existe outro exemplar com um destes identificadores nesta instituição.",
        codigo:
          "EXEMPLAR_IDENTIFICADOR_DUPLICADO",
      },
      409
    );
  }

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
   PATCH
   Edita um exemplar existente
   ========================================================= */

export async function PATCH(
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

    if (
      usuario.impersonacao
    ) {
      falhar(
        403,
        "Não é permitido editar exemplares durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.exemplares.gerenciar"
    );

    const exemplarId =
      obterExemplarId(params);

    const corpo =
      await lerCorpo(
        request
      );

    const atual =
      await prisma
        .bibliotecaExemplar
        .findFirst({
          where: {
            id: exemplarId,
            instituicaoId:
              contexto.instituicaoId,
          },

          select:
            EXEMPLAR_SELECT,
        });

    if (!atual) {
      falhar(
        404,
        "Exemplar não encontrado.",
        "EXEMPLAR_NAO_ENCONTRADO"
      );
    }

    if (
      atual.baixadoEm ||
      atual.status ===
        StatusExemplarBiblioteca.BAIXADO
    ) {
      falhar(
        409,
        "Um exemplar baixado não pode ser editado.",
        "EXEMPLAR_BAIXADO"
      );
    }

    const tipo =
      tipoExemplar(
        corpo.tipo
      );

    const codigoInterno =
      textoObrigatorio(
        corpo.codigoInterno,
        "codigoInterno",
        120
      );

    const codigoBarras =
      textoOpcional(
        corpo.codigoBarras,
        "codigoBarras",
        120
      );

    const numeroTombo =
      textoOpcional(
        corpo.numeroTombo,
        "numeroTombo",
        120
      );

    const patrimonio =
      textoOpcional(
        corpo.patrimonio,
        "patrimonio",
        120
      );

    const unidadeSnapshot =
      textoOpcional(
        corpo.unidadeSnapshot,
        "unidadeSnapshot",
        200
      );

    const setor =
      textoOpcional(
        corpo.setor,
        "setor",
        160
      );

    const sala =
      textoOpcional(
        corpo.sala,
        "sala",
        120
      );

    const estante =
      textoOpcional(
        corpo.estante,
        "estante",
        120
      );

    const prateleira =
      textoOpcional(
        corpo.prateleira,
        "prateleira",
        120
      );

    const localizacaoCompleta =
      textoOpcional(
        corpo.localizacaoCompleta,
        "localizacaoCompleta",
        500
      );

    const dataAquisicao =
      dataOpcional(
        corpo.dataAquisicao,
        "dataAquisicao"
      );

    const formaAquisicao =
      textoOpcional(
        corpo.formaAquisicao,
        "formaAquisicao",
        160
      );

    const fornecedor =
      textoOpcional(
        corpo.fornecedor,
        "fornecedor",
        240
      );

    const valorAquisicao =
      decimalOpcional(
        corpo.valorAquisicao,
        "valorAquisicao"
      );

    const permiteEmprestimo =
      booleano(
        corpo.permiteEmprestimo,
        "permiteEmprestimo"
      );

    const observacoes =
      textoOpcional(
        corpo.observacoes,
        "observacoes",
        10_000
      );

    const conflitos:
      Prisma.BibliotecaExemplarWhereInput[] =
        [
          {
            codigoInterno,
          },
        ];

    if (codigoBarras) {
      conflitos.push({
        codigoBarras,
      });
    }

    if (numeroTombo) {
      conflitos.push({
        numeroTombo,
      });
    }

    const duplicado =
      await prisma
        .bibliotecaExemplar
        .findFirst({
          where: {
            instituicaoId:
              contexto.instituicaoId,

            id: {
              not: exemplarId,
            },

            OR: conflitos,
          },

          select: {
            id: true,
            codigoInterno: true,
            codigoBarras: true,
            numeroTombo: true,
          },
        });

    if (duplicado) {
      if (
        duplicado.codigoInterno ===
        codigoInterno
      ) {
        falhar(
          409,
          "Já existe outro exemplar com este código interno.",
          "CODIGO_INTERNO_DUPLICADO"
        );
      }

      if (
        codigoBarras &&
        duplicado.codigoBarras ===
          codigoBarras
      ) {
        falhar(
          409,
          "Já existe outro exemplar com este código de barras.",
          "CODIGO_BARRAS_DUPLICADO"
        );
      }

      if (
        numeroTombo &&
        duplicado.numeroTombo ===
          numeroTombo
      ) {
        falhar(
          409,
          "Já existe outro exemplar com este número de tombo.",
          "NUMERO_TOMBO_DUPLICADO"
        );
      }
    }

    const ip =
      obterIp(request);

    const userAgent =
      request.headers.get(
        "user-agent"
      );

    const atualizado =
      await prisma.$transaction(
        async (transacao) => {
          const exemplar =
            await transacao
              .bibliotecaExemplar
              .update({
                where: {
                  id: exemplarId,
                },

                data: {
                  tipo,

                  codigoInterno,
                  codigoBarras,
                  numeroTombo,
                  patrimonio,

                  unidadeSnapshot,
                  setor,
                  sala,
                  estante,
                  prateleira,
                  localizacaoCompleta,

                  dataAquisicao,
                  formaAquisicao,
                  fornecedor,
                  valorAquisicao,

                  permiteEmprestimo,
                  observacoes,

                  atualizadoPorId:
                    usuario.id,
                },

                select:
                  EXEMPLAR_SELECT,
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
                  "BibliotecaExemplar",

                entidadeId:
                  String(
                    exemplar.id
                  ),

                acao:
                  AcaoAuditoriaBiblioteca.ATUALIZAR,

                descricao:
                  "Exemplar atualizado na Biblioteca Virtual.",

                dadosAnteriores: {
                  tipo:
                    atual.tipo,

                  codigoInterno:
                    atual.codigoInterno,

                  codigoBarras:
                    atual.codigoBarras,

                  numeroTombo:
                    atual.numeroTombo,

                  patrimonio:
                    atual.patrimonio,

                  unidadeSnapshot:
                    atual.unidadeSnapshot,

                  setor:
                    atual.setor,

                  sala:
                    atual.sala,

                  estante:
                    atual.estante,

                  prateleira:
                    atual.prateleira,

                  localizacaoCompleta:
                    atual.localizacaoCompleta,

                  dataAquisicao:
                    atual.dataAquisicao,

                  formaAquisicao:
                    atual.formaAquisicao,

                  fornecedor:
                    atual.fornecedor,

                  valorAquisicao:
                    atual.valorAquisicao
                      ?.toString() ||
                    null,

                  permiteEmprestimo:
                    atual.permiteEmprestimo,

                  observacoes:
                    atual.observacoes,
                },

                dadosPosteriores: {
                  tipo:
                    exemplar.tipo,

                  codigoInterno:
                    exemplar.codigoInterno,

                  codigoBarras:
                    exemplar.codigoBarras,

                  numeroTombo:
                    exemplar.numeroTombo,

                  patrimonio:
                    exemplar.patrimonio,

                  unidadeSnapshot:
                    exemplar.unidadeSnapshot,

                  setor:
                    exemplar.setor,

                  sala:
                    exemplar.sala,

                  estante:
                    exemplar.estante,

                  prateleira:
                    exemplar.prateleira,

                  localizacaoCompleta:
                    exemplar.localizacaoCompleta,

                  dataAquisicao:
                    exemplar.dataAquisicao,

                  formaAquisicao:
                    exemplar.formaAquisicao,

                  fornecedor:
                    exemplar.fornecedor,

                  valorAquisicao:
                    exemplar.valorAquisicao
                      ?.toString() ||
                    null,

                  permiteEmprestimo:
                    exemplar.permiteEmprestimo,

                  observacoes:
                    exemplar.observacoes,
                },

                metadados: {
                  origem:
                    "api_admin_biblioteca_exemplar_editar",

                  itemId:
                    exemplar.itemId,
                },

                ip,
                userAgent,
              },
            });

          return exemplar;
        },
        {
          maxWait: 5_000,
          timeout: 10_000,
        }
      );

    return responder({
      ok: true,
      mensagem:
        "Exemplar atualizado com sucesso.",
      exemplar: atualizado,
    });
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}