import {
  Prisma,
  StatusCampanhaCaptacaoLead,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  type UsuarioLogado,
} from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

class ErroHttp extends Error {
  status: number;
  codigo: string;
  detalhes?: Record<string, unknown>;

  constructor(
    status: number,
    mensagem: string,
    codigo: string,
    detalhes?: Record<string, unknown>
  ) {
    super(mensagem);

    this.name = "ErroHttp";
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

function ehMasterReal(
  user: UsuarioLogado
) {
  return (
    user.isMasterAdmin === true &&
    user.impersonacao === false &&
    user.email.trim().toLowerCase() ===
    "academicophanyx@gmail.com"
  );
}

async function autenticarUsuario() {
  const user =
    await getUserFromToken();

  if (!user) {
    throw new ErroHttp(
      401,
      "Usuário não autenticado.",
      "NAO_AUTENTICADO"
    );
  }

  const instituicaoId =
    Number(user.instituicaoId);

  if (
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    throw new ErroHttp(
      403,
      "O usuário não está vinculado a uma instituição válida.",
      "INSTITUICAO_INVALIDA"
    );
  }

  return {
    user,
    instituicaoId,
  };
}

async function obterPermissoes(
  user: UsuarioLogado
) {
  if (ehMasterReal(user)) {
    return {
      podeVer: true,
      podeGerenciar: true,
    };
  }

  const [
    podeVer,
    podeGerenciar,
  ] = await Promise.all([
    usuarioPossuiPermissao(
      user,
      "comercial.captacao.campanhas.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.campanhas.gerenciar"
    ),
  ]);

  return {
    podeVer:
      podeVer || podeGerenciar,
    podeGerenciar,
  };
}

function numeroPositivo(
  valor: unknown
) {
  const numero =
    Number(valor);

  return (
    Number.isInteger(numero) &&
    numero > 0
  )
    ? numero
    : null;
}

function textoOuNull(
  valor: unknown
) {
  const texto =
    String(valor ?? "").trim();

  return texto || null;
}

function booleano(
  valor: unknown,
  padrao = false
) {
  if (
    typeof valor === "boolean"
  ) {
    return valor;
  }

  if (
    valor === "true" ||
    valor === "1" ||
    valor === 1
  ) {
    return true;
  }

  if (
    valor === "false" ||
    valor === "0" ||
    valor === 0
  ) {
    return false;
  }

  return padrao;
}

function codigoCampanha(
  valor: string
) {
  const codigo = valor
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toUpperCase()
    .trim()
    .replace(
      /[^A-Z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );

  return codigo || "CAMPANHA";
}

function statusOuNull(
  valor: unknown
): StatusCampanhaCaptacaoLead | null {
  const normalizado =
    String(valor ?? "")
      .trim()
      .toUpperCase() as
    StatusCampanhaCaptacaoLead;

  return Object.values(
    StatusCampanhaCaptacaoLead
  ).includes(normalizado)
    ? normalizado
    : null;
}

function dataOuNull(
  valor: unknown
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  const data =
    new Date(String(valor));

  return Number.isNaN(
    data.getTime()
  )
    ? null
    : data;
}

function decimalOuNull(
  valor: unknown
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  const normalizado =
    String(valor)
      .trim()
      .replace(",", ".");

  try {
    const decimal =
      new Prisma.Decimal(
        normalizado
      );

    if (decimal.isNegative()) {
      throw new Error();
    }

    return decimal;
  } catch {
    throw new ErroHttp(
      400,
      "Informe um orçamento válido e não negativo.",
      "ORCAMENTO_INVALIDO"
    );
  }
}

function responderErro(
  error: unknown,
  contexto: string
) {
  if (
    error instanceof ErroHttp
  ) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        codigo: error.codigo,
        detalhes:
          error.detalhes,
      },
      {
        status: error.status,
      }
    );
  }

  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Já existe uma campanha com esse código nesta instituição.",
        codigo:
          "CAMPANHA_DUPLICADA",
      },
      {
        status: 409,
      }
    );
  }

  console.error(
    contexto,
    error
  );

  return NextResponse.json(
    {
      success: false,
      error:
        "Não foi possível processar as campanhas de captação.",
      codigo:
        "ERRO_INTERNO",
    },
    {
      status: 500,
    }
  );
}

export async function GET(
  req: NextRequest
) {
  try {
    const {
      user,
      instituicaoId,
    } =
      await autenticarUsuario();

    const permissoes =
      await obterPermissoes(
        user
      );

    if (
      !permissoes.podeVer
    ) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para consultar campanhas de captação.",
        "SEM_PERMISSAO"
      );
    }

    const busca =
      textoOuNull(
        req.nextUrl.searchParams.get(
          "busca"
        )
      );

    const canalId =
      numeroPositivo(
        req.nextUrl.searchParams.get(
          "canalId"
        )
      );

    const status =
      statusOuNull(
        req.nextUrl.searchParams.get(
          "status"
        )
      );

    const ativoParam =
      req.nextUrl.searchParams.get(
        "ativo"
      );

    const ativo =
      ativoParam === null
        ? null
        : booleano(
          ativoParam
        );

    const campanhas =
      await prisma.campanhaCaptacaoLead.findMany({
        where: {
          instituicaoId,

          ...(canalId
            ? {
              canalId,
            }
            : {}),

          ...(status
            ? {
              status,
            }
            : {}),

          ...(ativo !== null
            ? {
              ativo,
            }
            : {}),

          ...(busca
            ? {
              OR: [
                {
                  nome: {
                    contains:
                      busca,
                    mode:
                      "insensitive",
                  },
                },

                {
                  codigo: {
                    contains:
                      busca,
                    mode:
                      "insensitive",
                  },
                },

                {
                  descricao: {
                    contains:
                      busca,
                    mode:
                      "insensitive",
                  },
                },

                {
                  utmCampaign: {
                    contains:
                      busca,
                    mode:
                      "insensitive",
                  },
                },
              ],
            }
            : {}),
        },

        select: {
          id: true,
          nome: true,
          codigo: true,
          descricao: true,
          status: true,
          ativo: true,

          dataInicio: true,
          dataFim: true,

          orcamento: true,
          moeda: true,

          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          utmContent: true,
          utmTerm: true,

          urlDestino: true,
          observacoes: true,

          criadoEm: true,
          atualizadoEm: true,

          canal: {
            select: {
              id: true,
              nome: true,
              tipo: true,
              cor: true,
              ativo: true,
            },
          },

          _count: {
            select: {
              formularios: true,
              submissoes: true,
              regrasDistribuicao:
                true,
              integracoes: true,
            },
          },
        },

        orderBy: [
          {
            ativo: "desc",
          },

          {
            dataInicio: "desc",
          },

          {
            criadoEm: "desc",
          },
        ],
      });

    const canais =
      await prisma.canalCaptacaoLead.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },

        select: {
          id: true,
          nome: true,
          tipo: true,
          cor: true,
          padrao: true,
        },

        orderBy: [
          {
            padrao: "desc",
          },
          {
            nome: "asc",
          },
        ],
      });

    return NextResponse.json(
      {
        success: true,

        permissoes,

        statusDisponiveis:
          Object.values(
            StatusCampanhaCaptacaoLead
          ),

        referencias: {
          canais,
        },

        resumo: {
          total:
            campanhas.length,

          ativas:
            campanhas.filter(
              (campanha) =>
                campanha.status ===
                StatusCampanhaCaptacaoLead.ATIVA &&
                campanha.ativo
            ).length,

          agendadas:
            campanhas.filter(
              (campanha) =>
                campanha.status ===
                StatusCampanhaCaptacaoLead.AGENDADA
            ).length,

          pausadas:
            campanhas.filter(
              (campanha) =>
                campanha.status ===
                StatusCampanhaCaptacaoLead.PAUSADA
            ).length,
        },

        campanhas,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return responderErro(
      error,
      "Erro ao consultar campanhas de captação:"
    );
  }
}

export async function POST(
  req: NextRequest
) {
  try {
    const {
      user,
      instituicaoId,
    } =
      await autenticarUsuario();

    const permissoes =
      await obterPermissoes(
        user
      );

    if (
      !permissoes.podeGerenciar
    ) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para cadastrar campanhas de captação.",
        "SEM_PERMISSAO"
      );
    }

    const body =
      (await req
        .json()
        .catch(
          () => null
        )) as
      | Record<
        string,
        unknown
      >
      | null;

    if (!body) {
      throw new ErroHttp(
        400,
        "JSON inválido.",
        "JSON_INVALIDO"
      );
    }

    const nome =
      textoOuNull(
        body.nome
      );

    if (
      !nome ||
      nome.length > 180
    ) {
      throw new ErroHttp(
        400,
        "Informe o nome da campanha com até 180 caracteres.",
        "NOME_INVALIDO"
      );
    }

    const codigoInformado =
      textoOuNull(
        body.codigo
      );

    const codigo =
      codigoCampanha(
        codigoInformado ??
        nome
      );

    if (
      codigo.length > 100
    ) {
      throw new ErroHttp(
        400,
        "O código da campanha deve possuir no máximo 100 caracteres.",
        "CODIGO_INVALIDO"
      );
    }

    const canalId =
      numeroPositivo(
        body.canalId
      );

    if (canalId) {
      const canal =
        await prisma.canalCaptacaoLead.findFirst({
          where: {
            id: canalId,
            instituicaoId,
            ativo: true,
          },

          select: {
            id: true,
          },
        });

      if (!canal) {
        throw new ErroHttp(
          400,
          "O canal selecionado não existe ou está inativo.",
          "CANAL_INVALIDO"
        );
      }
    }

    const status =
      statusOuNull(
        body.status
      ) ??
      StatusCampanhaCaptacaoLead.RASCUNHO;

    let ativo =
      booleano(
        body.ativo,
        true
      );

    /*
     * Mantém criação e edição
     * com as mesmas regras.
     */
    if (
      status ===
      StatusCampanhaCaptacaoLead.ATIVA ||
      status ===
      StatusCampanhaCaptacaoLead.AGENDADA ||
      status ===
      StatusCampanhaCaptacaoLead.PAUSADA
    ) {
      ativo = true;
    }

    if (
      status ===
      StatusCampanhaCaptacaoLead.ENCERRADA ||
      status ===
      StatusCampanhaCaptacaoLead.ARQUIVADA
    ) {
      ativo = false;
    }

    const dataInicio =
      dataOuNull(
        body.dataInicio
      );

    const dataFim =
      dataOuNull(
        body.dataFim
      );

    if (
      body.dataInicio &&
      !dataInicio
    ) {
      throw new ErroHttp(
        400,
        "Informe uma data inicial válida.",
        "DATA_INICIO_INVALIDA"
      );
    }

    if (
      body.dataFim &&
      !dataFim
    ) {
      throw new ErroHttp(
        400,
        "Informe uma data final válida.",
        "DATA_FIM_INVALIDA"
      );
    }

    if (
      dataInicio &&
      dataFim &&
      dataFim.getTime() <
      dataInicio.getTime()
    ) {
      throw new ErroHttp(
        400,
        "A data final não pode ser anterior à data inicial.",
        "PERIODO_INVALIDO"
      );
    }

    const orcamento =
      decimalOuNull(
        body.orcamento
      );

    const moeda =
      (
        textoOuNull(
          body.moeda
        ) ?? "BRL"
      ).toUpperCase();

    if (
      moeda.length > 10
    ) {
      throw new ErroHttp(
        400,
        "Informe uma moeda válida.",
        "MOEDA_INVALIDA"
      );
    }

    const descricao =
      textoOuNull(
        body.descricao
      );

    const utmSource =
      textoOuNull(
        body.utmSource
      );

    const utmMedium =
      textoOuNull(
        body.utmMedium
      );

    const utmCampaign =
      textoOuNull(
        body.utmCampaign
      );

    const utmContent =
      textoOuNull(
        body.utmContent
      );

    const utmTerm =
      textoOuNull(
        body.utmTerm
      );

    const urlDestino =
      textoOuNull(
        body.urlDestino
      );

    const observacoes =
      textoOuNull(
        body.observacoes
      );

    const existente =
      await prisma.campanhaCaptacaoLead.findFirst({
        where: {
          instituicaoId,
          codigo,
        },

        select: {
          id: true,
          nome: true,
          codigo: true,
        },
      });

    if (existente) {
      throw new ErroHttp(
        409,
        "Já existe uma campanha com esse código nesta instituição.",
        "CAMPANHA_DUPLICADA",
        {
          campanhaId:
            existente.id,
        }
      );
    }

    const campanha =
      await prisma.campanhaCaptacaoLead.create({
        data: {
          instituicaoId,

          canalId,

          nome,
          codigo,
          descricao,

          status,
          ativo,

          dataInicio,
          dataFim,

          orcamento,
          moeda,

          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm,

          urlDestino,
          observacoes,

          criadoPorId:
            user.id,

          atualizadoPorId:
            user.id,
        },

        select: {
          id: true,
          nome: true,
          codigo: true,
          descricao: true,
          status: true,
          ativo: true,

          dataInicio: true,
          dataFim: true,

          orcamento: true,
          moeda: true,

          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          utmContent: true,
          utmTerm: true,

          urlDestino: true,
          observacoes: true,

          criadoEm: true,
          atualizadoEm: true,

          canal: {
            select: {
              id: true,
              nome: true,
              tipo: true,
              cor: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Campanha de captação criada com sucesso.",

        campanha,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return responderErro(
      error,
      "Erro ao criar campanha de captação:"
    );
  }
}