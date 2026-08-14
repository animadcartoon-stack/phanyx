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

function possuiCampo(
  objeto: Record<string, unknown>,
  campo: string
) {
  return Object.prototype.hasOwnProperty.call(
    objeto,
    campo
  );
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

    if (
      decimal.isNegative()
    ) {
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
        "Não foi possível processar a campanha de captação.",
      codigo:
        "ERRO_INTERNO",
    },
    {
      status: 500,
    }
  );
}

async function localizarCampanha(
  id: number,
  instituicaoId: number
) {
  return prisma.campanhaCaptacaoLead.findFirst({
    where: {
      id,
      instituicaoId,
    },

    select: {
      id: true,
      instituicaoId: true,
      canalId: true,

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

      criadoPorId: true,
      atualizadoPorId: true,

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
          regrasDistribuicao: true,
          integracoes: true,
        },
      },
    },
  });
}

export async function GET(
  _req: NextRequest,
  ctx: {
    params: {
      id: string;
    };
  }
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

    const id =
      numeroPositivo(
        ctx.params.id
      );

    if (!id) {
      throw new ErroHttp(
        400,
        "Campanha inválida.",
        "CAMPANHA_INVALIDA"
      );
    }

    const campanha =
      await localizarCampanha(
        id,
        instituicaoId
      );

    if (!campanha) {
      throw new ErroHttp(
        404,
        "Campanha de captação não encontrada.",
        "CAMPANHA_NAO_ENCONTRADA"
      );
    }

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

        campanha,
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
      "Erro ao consultar campanha de captação:"
    );
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: {
    params: {
      id: string;
    };
  }
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
        "Você não possui permissão para editar campanhas de captação.",
        "SEM_PERMISSAO"
      );
    }

    const id =
      numeroPositivo(
        ctx.params.id
      );

    if (!id) {
      throw new ErroHttp(
        400,
        "Campanha inválida.",
        "CAMPANHA_INVALIDA"
      );
    }

    const atual =
      await localizarCampanha(
        id,
        instituicaoId
      );

    if (!atual) {
      throw new ErroHttp(
        404,
        "Campanha de captação não encontrada.",
        "CAMPANHA_NAO_ENCONTRADA"
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

    const camposPermitidos = [
      "canalId",
      "nome",
      "codigo",
      "descricao",
      "status",
      "ativo",
      "dataInicio",
      "dataFim",
      "orcamento",
      "moeda",
      "utmSource",
      "utmMedium",
      "utmCampaign",
      "utmContent",
      "utmTerm",
      "urlDestino",
      "observacoes",
    ];

    const possuiAlteracao =
      camposPermitidos.some(
        (campo) =>
          possuiCampo(
            body,
            campo
          )
      );

    if (!possuiAlteracao) {
      throw new ErroHttp(
        400,
        "Nenhuma alteração foi informada.",
        "SEM_ALTERACOES"
      );
    }

    let canalId =
      atual.canalId;

    if (
      possuiCampo(
        body,
        "canalId"
      )
    ) {
      if (
        body.canalId === null ||
        body.canalId === ""
      ) {
        canalId = null;
      } else {
        const informado =
          numeroPositivo(
            body.canalId
          );

        if (!informado) {
          throw new ErroHttp(
            400,
            "Selecione um canal válido.",
            "CANAL_INVALIDO"
          );
        }

        const canal =
          await prisma.canalCaptacaoLead.findFirst({
            where: {
              id: informado,
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

        canalId =
          informado;
      }
    }

    let nome =
      atual.nome;

    if (
      possuiCampo(
        body,
        "nome"
      )
    ) {
      const informado =
        textoOuNull(
          body.nome
        );

      if (
        !informado ||
        informado.length >
          180
      ) {
        throw new ErroHttp(
          400,
          "Informe o nome da campanha com até 180 caracteres.",
          "NOME_INVALIDO"
        );
      }

      nome =
        informado;
    }

    let codigo =
      atual.codigo;

    if (
      possuiCampo(
        body,
        "codigo"
      )
    ) {
      const informado =
        textoOuNull(
          body.codigo
        );

      if (!informado) {
        throw new ErroHttp(
          400,
          "Informe o código da campanha.",
          "CODIGO_INVALIDO"
        );
      }

      codigo =
        codigoCampanha(
          informado
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
    }

    if (
      codigo !== atual.codigo
    ) {
      const duplicada =
        await prisma.campanhaCaptacaoLead.findFirst({
          where: {
            instituicaoId,

            id: {
              not: id,
            },

            codigo,
          },

          select: {
            id: true,
          },
        });

      if (duplicada) {
        throw new ErroHttp(
          409,
          "Já existe outra campanha com esse código nesta instituição.",
          "CAMPANHA_DUPLICADA",
          {
            campanhaId:
              duplicada.id,
          }
        );
      }
    }

    let descricao =
      atual.descricao;

    if (
      possuiCampo(
        body,
        "descricao"
      )
    ) {
      descricao =
        textoOuNull(
          body.descricao
        );
    }

    let status =
      atual.status;

    if (
      possuiCampo(
        body,
        "status"
      )
    ) {
      const informado =
        statusOuNull(
          body.status
        );

      if (!informado) {
        throw new ErroHttp(
          400,
          "Informe um status válido para a campanha.",
          "STATUS_INVALIDO"
        );
      }

      status =
        informado;
    }

    let ativo =
      atual.ativo;

    if (
      possuiCampo(
        body,
        "ativo"
      )
    ) {
      ativo =
        booleano(
          body.ativo,
          atual.ativo
        );
    }

    /*
     * Regras de consistência
     * entre status e ativo.
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

    /*
     * Se o usuário desativar uma
     * campanha que ainda constava
     * como ativa, ela passa a pausada.
     */
    if (
      !ativo &&
      status ===
        StatusCampanhaCaptacaoLead.ATIVA
    ) {
      status =
        StatusCampanhaCaptacaoLead.PAUSADA;
    }

    let dataInicio =
      atual.dataInicio;

    if (
      possuiCampo(
        body,
        "dataInicio"
      )
    ) {
      dataInicio =
        dataOuNull(
          body.dataInicio
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
    }

    let dataFim =
      atual.dataFim;

    if (
      possuiCampo(
        body,
        "dataFim"
      )
    ) {
      dataFim =
        dataOuNull(
          body.dataFim
        );

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

    let orcamento =
      atual.orcamento;

    if (
      possuiCampo(
        body,
        "orcamento"
      )
    ) {
      orcamento =
        decimalOuNull(
          body.orcamento
        );
    }

    let moeda =
      atual.moeda;

    if (
      possuiCampo(
        body,
        "moeda"
      )
    ) {
      moeda =
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
    }

    let utmSource =
      atual.utmSource;

    if (
      possuiCampo(
        body,
        "utmSource"
      )
    ) {
      utmSource =
        textoOuNull(
          body.utmSource
        );
    }

    let utmMedium =
      atual.utmMedium;

    if (
      possuiCampo(
        body,
        "utmMedium"
      )
    ) {
      utmMedium =
        textoOuNull(
          body.utmMedium
        );
    }

    let utmCampaign =
      atual.utmCampaign;

    if (
      possuiCampo(
        body,
        "utmCampaign"
      )
    ) {
      utmCampaign =
        textoOuNull(
          body.utmCampaign
        );
    }

    let utmContent =
      atual.utmContent;

    if (
      possuiCampo(
        body,
        "utmContent"
      )
    ) {
      utmContent =
        textoOuNull(
          body.utmContent
        );
    }

    let utmTerm =
      atual.utmTerm;

    if (
      possuiCampo(
        body,
        "utmTerm"
      )
    ) {
      utmTerm =
        textoOuNull(
          body.utmTerm
        );
    }

    let urlDestino =
      atual.urlDestino;

    if (
      possuiCampo(
        body,
        "urlDestino"
      )
    ) {
      urlDestino =
        textoOuNull(
          body.urlDestino
        );
    }

    let observacoes =
      atual.observacoes;

    if (
      possuiCampo(
        body,
        "observacoes"
      )
    ) {
      observacoes =
        textoOuNull(
          body.observacoes
        );
    }

    const campanha =
      await prisma.campanhaCaptacaoLead.update({
        where: {
          id,
        },

        data: {
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
              ativo: true,
            },
          },

          _count: {
            select: {
              formularios: true,
              submissoes: true,
              regrasDistribuicao: true,
              integracoes: true,
            },
          },
        },
      });

    let message =
      "Campanha de captação atualizada com sucesso.";

    if (
      campanha.status ===
      StatusCampanhaCaptacaoLead.ATIVA
    ) {
      message =
        "Campanha de captação ativada com sucesso.";
    }

    if (
      campanha.status ===
      StatusCampanhaCaptacaoLead.PAUSADA
    ) {
      message =
        "Campanha de captação pausada com sucesso.";
    }

    if (
      campanha.status ===
      StatusCampanhaCaptacaoLead.ENCERRADA
    ) {
      message =
        "Campanha de captação encerrada com sucesso.";
    }

    if (
      campanha.status ===
      StatusCampanhaCaptacaoLead.ARQUIVADA
    ) {
      message =
        "Campanha de captação arquivada com sucesso.";
    }

    return NextResponse.json(
      {
        success: true,
        message,
        campanha,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return responderErro(
      error,
      "Erro ao editar campanha de captação:"
    );
  }
}