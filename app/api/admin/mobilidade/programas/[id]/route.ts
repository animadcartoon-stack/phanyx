import {
  MobilidadeDirecao,
  MobilidadeStatusPrograma,
  MobilidadeTipoPrograma,
  Prisma,
} from "@prisma/client";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroMobilidade,
  exigirAcessoMobilidade,
  exigirGerenciamentoMobilidade,
  respostaErroMobilidade,
} from "@/lib/mobilidade-acesso";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TIPOS =
  new Set(
    Object.values(
      MobilidadeTipoPrograma
    )
  );

const DIRECOES =
  new Set(
    Object.values(
      MobilidadeDirecao
    )
  );

const STATUS =
  new Set(
    Object.values(
      MobilidadeStatusPrograma
    )
  );

function idValido(
  valor: string
) {
  const id =
    Number(valor);

  return Number.isInteger(
    id
  ) &&
    id > 0
    ? id
    : null;
}

function idOpcional(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero =
    Number(valor);

  return Number.isInteger(
    numero
  ) &&
    numero > 0
    ? numero
    : undefined;
}

function textoOpcional(
  valor: unknown,
  maximo = 500
) {
  if (
    typeof valor !==
    "string"
  ) {
    return null;
  }

  const texto =
    valor.trim();

  return texto
    ? texto.slice(
        0,
        maximo
      )
    : null;
}

function inteiroPositivoOuNulo(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero =
    Number(valor);

  return Number.isInteger(
    numero
  ) &&
    numero >= 0
    ? numero
    : undefined;
}

function tipoValido(
  valor: unknown
): MobilidadeTipoPrograma | null {
  return typeof valor === "string" &&
    TIPOS.has(
      valor as MobilidadeTipoPrograma
    )
    ? (valor as MobilidadeTipoPrograma)
    : null;
}

function direcaoValida(
  valor: unknown
): MobilidadeDirecao | null {
  return typeof valor === "string" &&
    DIRECOES.has(
      valor as MobilidadeDirecao
    )
    ? (valor as MobilidadeDirecao)
    : null;
}

function statusValido(
  valor: unknown
): MobilidadeStatusPrograma | null {
  return typeof valor === "string" &&
    STATUS.has(
      valor as MobilidadeStatusPrograma
    )
    ? (valor as MobilidadeStatusPrograma)
    : null;
}

function erroDuplicidade(
  erro: unknown
) {
  return (
    erro instanceof
      Prisma.PrismaClientKnownRequestError &&
    erro.code === "P2002"
  );
}

async function resolverVinculos({
  instituicaoId,
  convenioId,
  parceiroId,
}: {
  instituicaoId: number;
  convenioId: number | null;
  parceiroId: number | null;
}) {
  if (convenioId) {
    const convenio =
      await prisma.mobilidadeConvenio.findFirst({
        where: {
          id: convenioId,
          instituicaoId,
        },

        select: {
          id: true,
          instituicaoParceiraId: true,
        },
      });

    if (!convenio) {
      throw new ErroMobilidade(
        400,
        "CONVENIO_INVALIDO",
        "Convênio inválido."
      );
    }

    return {
      convenioId:
        convenio.id,

      instituicaoParceiraId:
        convenio.instituicaoParceiraId,
    };
  }

  if (parceiroId) {
    const parceiro =
      await prisma
        .mobilidadeInstituicaoParceira
        .findFirst({
          where: {
            id: parceiroId,
            instituicaoId,
          },

          select: {
            id: true,
          },
        });

    if (!parceiro) {
      throw new ErroMobilidade(
        400,
        "PARCEIRO_INVALIDO",
        "Instituição parceira inválida."
      );
    }
  }

  return {
    convenioId: null,
    instituicaoParceiraId:
      parceiroId,
  };
}

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirAcessoMobilidade(
        usuario,
        "mobilidade.programas.ver",
        "mobilidade.programas.gerenciar"
      );

    const id =
      idValido(
        params.id
      );

    if (!id) {
      throw new ErroMobilidade(
        400,
        "ID_INVALIDO",
        "ID inválido."
      );
    }

    const programa =
      await prisma.mobilidadePrograma.findFirst({
        where: {
          id,
          instituicaoId,
        },

        include: {
          convenio: true,
          instituicaoParceira:
            true,

          _count: {
            select: {
              ofertas: true,
            },
          },
        },
      });

    if (!programa) {
      throw new ErroMobilidade(
        404,
        "PROGRAMA_NAO_ENCONTRADO",
        "Programa não encontrado."
      );
    }

    return NextResponse.json({
      ok: true,
      programa,
    });
  } catch (erro) {
    const resposta =
      respostaErroMobilidade(
        erro
      );

    return NextResponse.json(
      resposta.corpo,
      {
        status:
          resposta.status,
      }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirGerenciamentoMobilidade(
        usuario,
        "mobilidade.programas.gerenciar"
      );

    const id =
      idValido(
        params.id
      );

    if (!id) {
      throw new ErroMobilidade(
        400,
        "ID_INVALIDO",
        "ID inválido."
      );
    }

    const atual =
      await prisma.mobilidadePrograma.findFirst({
        where: {
          id,
          instituicaoId,
        },

        select: {
          id: true,
          status: true,
        },
      });

    if (!atual) {
      throw new ErroMobilidade(
        404,
        "PROGRAMA_NAO_ENCONTRADO",
        "Programa não encontrado."
      );
    }

    const corpo =
      (await req.json()) as Record<
        string,
        unknown
      >;

    if (
      corpo.acao ===
      "ALTERAR_ATIVO"
    ) {
      if (
        typeof corpo.ativo !==
        "boolean"
      ) {
        throw new ErroMobilidade(
          400,
          "ATIVO_INVALIDO",
          "Situação inválida."
        );
      }

      await prisma.mobilidadePrograma.update({
        where: {
          id,
        },

        data: {
          ativo:
            corpo.ativo,

          ...(corpo.ativo
            ? (
                atual.status ===
                  MobilidadeStatusPrograma.INATIVO ||
                atual.status ===
                  MobilidadeStatusPrograma.ARQUIVADO
                  ? {
                      status:
                        MobilidadeStatusPrograma.ATIVO,
                    }
                  : {}
              )
            : {
                status:
                  MobilidadeStatusPrograma.INATIVO,
              }),
        },
      });

      return NextResponse.json({
        ok: true,
      });
    }

    const nome =
      textoOpcional(
        corpo.nome,
        180
      );

    if (!nome) {
      throw new ErroMobilidade(
        400,
        "NOME_OBRIGATORIO",
        "Nome obrigatório."
      );
    }

    const tipo =
      tipoValido(
        corpo.tipo
      );

    const direcao =
      direcaoValida(
        corpo.direcao
      );

    const status =
      statusValido(
        corpo.status
      );

    if (!tipo) {
      throw new ErroMobilidade(
        400,
        "TIPO_INVALIDO",
        "Tipo inválido."
      );
    }

    if (!direcao) {
      throw new ErroMobilidade(
        400,
        "DIRECAO_INVALIDA",
        "Direção inválida."
      );
    }

    if (!status) {
      throw new ErroMobilidade(
        400,
        "STATUS_INVALIDO",
        "Status inválido."
      );
    }

    const convenioId =
      idOpcional(
        corpo.convenioId
      );

    const parceiroId =
      idOpcional(
        corpo.instituicaoParceiraId
      );

    if (
      convenioId ===
        undefined ||
      parceiroId ===
        undefined
    ) {
      throw new ErroMobilidade(
        400,
        "VINCULO_INVALIDO",
        "Vínculo inválido."
      );
    }

    const vinculos =
      await resolverVinculos({
        instituicaoId,
        convenioId,
        parceiroId,
      });

    const duracaoMinimaDias =
      inteiroPositivoOuNulo(
        corpo.duracaoMinimaDias
      );

    const duracaoMaximaDias =
      inteiroPositivoOuNulo(
        corpo.duracaoMaximaDias
      );

    if (
      duracaoMinimaDias ===
        undefined ||
      duracaoMaximaDias ===
        undefined
    ) {
      throw new ErroMobilidade(
        400,
        "DURACAO_INVALIDA",
        "Duração inválida."
      );
    }

    if (
      duracaoMinimaDias !==
        null &&
      duracaoMaximaDias !==
        null &&
      duracaoMaximaDias <
        duracaoMinimaDias
    ) {
      throw new ErroMobilidade(
        400,
        "DURACAO_INTERVALO_INVALIDO",
        "Duração máxima inferior à mínima."
      );
    }

    try {
      await prisma.mobilidadePrograma.update({
        where: {
          id,
        },

        data: {
          convenioId:
            vinculos.convenioId,

          instituicaoParceiraId:
            vinculos.instituicaoParceiraId,

          nome,

          codigo:
            textoOpcional(
              corpo.codigo,
              80
            ),

          descricao:
            textoOpcional(
              corpo.descricao,
              5000
            ),

          tipo,
          direcao,
          status,

          idiomaPrincipal:
            textoOpcional(
              corpo.idiomaPrincipal,
              100
            ),

          nivelIdiomaMinimo:
            textoOpcional(
              corpo.nivelIdiomaMinimo,
              100
            ),

          duracaoMinimaDias,
          duracaoMaximaDias,

          ativo:
            corpo.ativo !==
            false,
        },
      });

      return NextResponse.json({
        ok: true,
      });
    } catch (erro) {
      if (
        erroDuplicidade(
          erro
        )
      ) {
        throw new ErroMobilidade(
          409,
          "CODIGO_DUPLICADO",
          "Código já utilizado."
        );
      }

      throw erro;
    }
  } catch (erro) {
    const resposta =
      respostaErroMobilidade(
        erro
      );

    return NextResponse.json(
      resposta.corpo,
      {
        status:
          resposta.status,
      }
    );
  }
}
