import {
  Prisma,
  StatusFormularioCaptacaoLead,
  TipoTarefaComercial,
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
      "comercial.captacao.formularios.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.formularios.gerenciar"
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

function inteiroPositivo(
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

function slugificar(
  valor: string
) {
  const slug = valor
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

  return slug || "formulario";
}

function statusOuNull(
  valor: unknown
): StatusFormularioCaptacaoLead | null {
  const normalizado =
    String(valor ?? "")
      .trim()
      .toUpperCase() as
    StatusFormularioCaptacaoLead;

  return Object.values(
    StatusFormularioCaptacaoLead
  ).includes(normalizado)
    ? normalizado
    : null;
}

function tipoTarefaOuNull(
  valor: unknown
): TipoTarefaComercial | null {
  const normalizado =
    String(valor ?? "")
      .trim()
      .toUpperCase() as
    TipoTarefaComercial;

  return Object.values(
    TipoTarefaComercial
  ).includes(normalizado)
    ? normalizado
    : null;
}

function jsonParaPrisma(
  valor: unknown
) {
  if (
    valor === null ||
    valor === ""
  ) {
    return Prisma.JsonNull;
  }

  if (
    typeof valor === "string"
  ) {
    try {
      return JSON.parse(
        valor
      ) as Prisma.InputJsonValue;
    } catch {
      throw new ErroHttp(
        400,
        "Foi informada uma configuração JSON inválida.",
        "JSON_CONFIGURACAO_INVALIDO"
      );
    }
  }

  return valor as
    Prisma.InputJsonValue;
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
          "Já existe um formulário de captação com esse identificador.",
        codigo:
          "FORMULARIO_DUPLICADO",
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
        "Não foi possível processar o formulário de captação.",
      codigo:
        "ERRO_INTERNO",
    },
    {
      status: 500,
    }
  );
}

async function localizarFormulario(
  id: number,
  instituicaoId: number
) {
  return prisma.formularioCaptacaoLead.findFirst({
    where: {
      id,
      instituicaoId,
    },

    select: {
      id: true,
      instituicaoId: true,

      canalId: true,
      campanhaId: true,

      funilPadraoId: true,
      etapaPadraoId: true,
      equipePadraoId: true,
      responsavelPadraoId: true,
      cursoPadraoId: true,
      poloPadraoId: true,

      nome: true,
      slug: true,
      tokenPublico: true,

      titulo: true,
      descricao: true,

      mensagemSucesso: true,
      urlRedirecionamento: true,

      status: true,
      versao: true,
      publico: true,
      ativo: true,

      exigeConsentimento: true,
      textoConsentimento: true,
      versaoConsentimento: true,
      politicaPrivacidadeUrl: true,

      bloquearDuplicados: true,
      atualizarLeadExistente: true,

      criarTarefaPrimeiroContato:
        true,

      tipoTarefaInicial: true,

      prazoPrimeiroContatoMinutos:
        true,

      recaptchaAtivo: true,
      honeypotAtivo: true,

      limiteSubmissoesPorIpHora:
        true,

      configuracaoVisual: true,
      metadados: true,

      publicadoEm: true,
      pausadoEm: true,
      arquivadoEm: true,

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

      campanha: {
        select: {
          id: true,
          nome: true,
          codigo: true,
          status: true,
          ativo: true,
        },
      },

      funilPadrao: {
        select: {
          id: true,
          nome: true,
          ativo: true,
        },
      },

      etapaPadrao: {
        select: {
          id: true,
          nome: true,
          ordem: true,
          categoria: true,
          ativo: true,
        },
      },

      equipePadrao: {
        select: {
          id: true,
          nome: true,
          ativo: true,
        },
      },

      responsavelPadrao: {
        select: {
          id: true,
          nome: true,
          cargo: true,
          ativo: true,
          statusFuncionario: true,
        },
      },

      cursoPadrao: {
        select: {
          id: true,
          nome: true,
          codigo: true,
          ativo: true,
        },
      },

      poloPadrao: {
        select: {
          id: true,
          nome: true,
          codigo: true,
          ativo: true,
        },
      },

      campos: {
        orderBy: {
          ordem: "asc",
        },

        select: {
          id: true,
          chave: true,
          rotulo: true,
          tipo: true,
          mapeamento: true,
          placeholder: true,
          textoAjuda: true,
          valorPadrao: true,
          mascara: true,
          obrigatorio: true,
          ativo: true,
          ordem: true,
          largura: true,
          opcoes: true,
          validacoes: true,
          criadoEm: true,
          atualizadoEm: true,
        },
      },

      _count: {
        select: {
          campos: true,
          submissoes: true,
          regrasDistribuicao: true,
          integracoes: true,
        },
      },
    },
  });
}

async function obterReferencias(
  instituicaoId: number
) {
  const [
    canais,
    campanhas,
    funis,
    equipes,
    responsaveis,
    cursos,
    polos,
  ] = await prisma.$transaction([
    prisma.canalCaptacaoLead.findMany({
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
    }),

    prisma.campanhaCaptacaoLead.findMany({
      where: {
        instituicaoId,
        ativo: true,
      },

      select: {
        id: true,
        canalId: true,
        nome: true,
        codigo: true,
        status: true,
      },

      orderBy: {
        nome: "asc",
      },
    }),

    prisma.funilComercial.findMany({
      where: {
        instituicaoId,
        ativo: true,
        arquivadoEm: null,
      },

      select: {
        id: true,
        nome: true,
        padrao: true,

        etapas: {
          where: {
            ativo: true,
            arquivadoEm: null,
          },

          select: {
            id: true,
            nome: true,
            ordem: true,
            categoria: true,
          },

          orderBy: {
            ordem: "asc",
          },
        },
      },

      orderBy: [
        {
          padrao: "desc",
        },
        {
          nome: "asc",
        },
      ],
    }),

    prisma.equipeComercial.findMany({
      where: {
        instituicaoId,
        ativo: true,
      },

      select: {
        id: true,
        nome: true,
        responsavelFuncionarioId:
          true,
      },

      orderBy: {
        nome: "asc",
      },
    }),

    prisma.funcionario.findMany({
      where: {
        instituicaoId,
        ativo: true,
        statusFuncionario:
          "ATIVO",
      },

      select: {
        id: true,
        nome: true,
        cargo: true,
        poloId: true,
      },

      orderBy: {
        nome: "asc",
      },
    }),

    prisma.curso.findMany({
      where: {
        instituicaoId,
        ativo: true,
        excluidoEm: null,
      },

      select: {
        id: true,
        nome: true,
        codigo: true,
      },

      orderBy: {
        nome: "asc",
      },
    }),

    prisma.polo.findMany({
      where: {
        instituicaoId,
        ativo: true,
      },

      select: {
        id: true,
        nome: true,
        codigo: true,
        tipoUnidade: true,
        statusComercial: true,
      },

      orderBy: {
        nome: "asc",
      },
    }),
  ]);

  return {
    canais,
    campanhas,
    funis,
    equipes,
    responsaveis,
    cursos,
    polos,
  };
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
        "Você não possui permissão para consultar formulários de captação.",
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
        "Formulário inválido.",
        "FORMULARIO_INVALIDO"
      );
    }

    const [
      formulario,
      referencias,
    ] =
      await Promise.all([
        localizarFormulario(
          id,
          instituicaoId
        ),

        obterReferencias(
          instituicaoId
        ),
      ]);

    if (!formulario) {
      throw new ErroHttp(
        404,
        "Formulário de captação não encontrado.",
        "FORMULARIO_NAO_ENCONTRADO"
      );
    }

    return NextResponse.json(
      {
        success: true,

        permissoes,

        statusDisponiveis:
          Object.values(
            StatusFormularioCaptacaoLead
          ),

        tiposTarefaDisponiveis:
          Object.values(
            TipoTarefaComercial
          ),

        referencias,

        formulario,
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
      "Erro ao consultar formulário de captação:"
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
        "Você não possui permissão para editar formulários de captação.",
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
        "Formulário inválido.",
        "FORMULARIO_INVALIDO"
      );
    }

    const atual =
      await localizarFormulario(
        id,
        instituicaoId
      );

    if (!atual) {
      throw new ErroHttp(
        404,
        "Formulário de captação não encontrado.",
        "FORMULARIO_NAO_ENCONTRADO"
      );
    }

    if (
      atual.status ===
      StatusFormularioCaptacaoLead.ARQUIVADO
    ) {
      throw new ErroHttp(
        409,
        "Este formulário está arquivado e não pode mais ser alterado.",
        "FORMULARIO_ARQUIVADO"
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
      "campanhaId",

      "funilPadraoId",
      "etapaPadraoId",
      "equipePadraoId",
      "responsavelPadraoId",
      "cursoPadraoId",
      "poloPadraoId",

      "nome",
      "slug",
      "titulo",
      "descricao",

      "mensagemSucesso",
      "urlRedirecionamento",

      "status",
      "publico",
      "ativo",

      "exigeConsentimento",
      "textoConsentimento",
      "versaoConsentimento",
      "politicaPrivacidadeUrl",

      "bloquearDuplicados",
      "atualizarLeadExistente",

      "criarTarefaPrimeiroContato",
      "tipoTarefaInicial",
      "prazoPrimeiroContatoMinutos",

      "recaptchaAtivo",
      "honeypotAtivo",
      "limiteSubmissoesPorIpHora",

      "configuracaoVisual",
      "metadados",
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
          "Informe o nome interno do formulário com até 180 caracteres.",
          "NOME_INVALIDO"
        );
      }

      nome =
        informado;
    }

    let slug =
      atual.slug;

    if (
      possuiCampo(
        body,
        "slug"
      )
    ) {
      const informado =
        textoOuNull(
          body.slug
        );

      if (!informado) {
        throw new ErroHttp(
          400,
          "Informe o identificador do formulário.",
          "SLUG_INVALIDO"
        );
      }

      slug =
        slugificar(
          informado
        );

      if (
        slug.length >
        180
      ) {
        throw new ErroHttp(
          400,
          "O identificador do formulário deve possuir no máximo 180 caracteres.",
          "SLUG_INVALIDO"
        );
      }
    }

    if (
      slug !== atual.slug
    ) {
      const duplicado =
        await prisma.formularioCaptacaoLead.findFirst({
          where: {
            instituicaoId,

            id: {
              not: id,
            },

            slug,
          },

          select: {
            id: true,
          },
        });

      if (duplicado) {
        throw new ErroHttp(
          409,
          "Já existe outro formulário com esse identificador.",
          "FORMULARIO_DUPLICADO",
          {
            formularioId:
              duplicado.id,
          }
        );
      }
    }

    let titulo =
      atual.titulo;

    if (
      possuiCampo(
        body,
        "titulo"
      )
    ) {
      const informado =
        textoOuNull(
          body.titulo
        );

      if (
        !informado ||
        informado.length >
        250
      ) {
        throw new ErroHttp(
          400,
          "Informe o título público do formulário com até 250 caracteres.",
          "TITULO_INVALIDO"
        );
      }

      titulo =
        informado;
    }

    const descricao =
      possuiCampo(
        body,
        "descricao"
      )
        ? textoOuNull(
          body.descricao
        )
        : atual.descricao;

    const mensagemSucesso =
      possuiCampo(
        body,
        "mensagemSucesso"
      )
        ? textoOuNull(
          body.mensagemSucesso
        )
        : atual.mensagemSucesso;

    const urlRedirecionamento =
      possuiCampo(
        body,
        "urlRedirecionamento"
      )
        ? textoOuNull(
          body.urlRedirecionamento
        )
        : atual.urlRedirecionamento;

    let canalId =
      atual.canalId;

    if (
      possuiCampo(
        body,
        "canalId"
      )
    ) {
      if (
        body.canalId ===
        null ||
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

    let campanhaId =
      atual.campanhaId;

    if (
      possuiCampo(
        body,
        "campanhaId"
      )
    ) {
      if (
        body.campanhaId ===
        null ||
        body.campanhaId === ""
      ) {
        campanhaId = null;
      } else {
        const informado =
          numeroPositivo(
            body.campanhaId
          );

        if (!informado) {
          throw new ErroHttp(
            400,
            "Selecione uma campanha válida.",
            "CAMPANHA_INVALIDA"
          );
        }

        const campanha =
          await prisma.campanhaCaptacaoLead.findFirst({
            where: {
              id: informado,
              instituicaoId,
              ativo: true,
            },

            select: {
              id: true,
              canalId: true,
            },
          });

        if (!campanha) {
          throw new ErroHttp(
            400,
            "A campanha selecionada não existe ou está inativa.",
            "CAMPANHA_INVALIDA"
          );
        }

        if (
          canalId &&
          campanha.canalId &&
          campanha.canalId !==
          canalId
        ) {
          throw new ErroHttp(
            400,
            "A campanha pertence a outro canal de captação.",
            "CAMPANHA_CANAL_DIVERGENTE"
          );
        }

        if (
          !canalId &&
          campanha.canalId
        ) {
          canalId =
            campanha.canalId;
        }

        campanhaId =
          informado;
      }
    }

    /*
     * Caso o canal seja alterado,
     * verificamos também a campanha
     * que já estava vinculada.
     */
    if (
      campanhaId &&
      canalId
    ) {
      const campanhaAtual =
        await prisma.campanhaCaptacaoLead.findFirst({
          where: {
            id: campanhaId,
            instituicaoId,
          },

          select: {
            canalId: true,
          },
        });

      if (
        campanhaAtual?.canalId &&
        campanhaAtual.canalId !==
        canalId
      ) {
        throw new ErroHttp(
          400,
          "A campanha vinculada não pertence ao canal selecionado.",
          "CAMPANHA_CANAL_DIVERGENTE"
        );
      }
    }

    let funilPadraoId =
      atual.funilPadraoId;

    if (
      possuiCampo(
        body,
        "funilPadraoId"
      )
    ) {
      if (
        body.funilPadraoId ===
        null ||
        body.funilPadraoId ===
        ""
      ) {
        funilPadraoId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.funilPadraoId
          );

        if (!informado) {
          throw new ErroHttp(
            400,
            "Selecione um funil válido.",
            "FUNIL_INVALIDO"
          );
        }

        const funil =
          await prisma.funilComercial.findFirst({
            where: {
              id: informado,
              instituicaoId,
              ativo: true,
              arquivadoEm:
                null,
            },

            select: {
              id: true,
            },
          });

        if (!funil) {
          throw new ErroHttp(
            400,
            "O funil selecionado não existe ou está inativo.",
            "FUNIL_INVALIDO"
          );
        }

        funilPadraoId =
          informado;
      }
    }

    let etapaPadraoId =
      atual.etapaPadraoId;

    if (
      possuiCampo(
        body,
        "etapaPadraoId"
      )
    ) {
      if (
        body.etapaPadraoId ===
        null ||
        body.etapaPadraoId ===
        ""
      ) {
        etapaPadraoId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.etapaPadraoId
          );

        if (!informado) {
          throw new ErroHttp(
            400,
            "Selecione uma etapa válida.",
            "ETAPA_INVALIDA"
          );
        }

        const etapa =
          await prisma.etapaFunilComercial.findFirst({
            where: {
              id: informado,
              instituicaoId,
              ativo: true,
              arquivadoEm:
                null,
            },

            select: {
              id: true,
              funilId: true,
            },
          });

        if (!etapa) {
          throw new ErroHttp(
            400,
            "A etapa selecionada não existe ou está inativa.",
            "ETAPA_INVALIDA"
          );
        }

        if (
          funilPadraoId &&
          etapa.funilId !==
          funilPadraoId
        ) {
          throw new ErroHttp(
            400,
            "A etapa não pertence ao funil selecionado.",
            "ETAPA_FUNIL_DIVERGENTE"
          );
        }

        if (!funilPadraoId) {
          funilPadraoId =
            etapa.funilId;
        }

        etapaPadraoId =
          informado;
      }
    }

    /*
     * Se trocar somente o funil,
     * a etapa antiga não pode
     * permanecer ligada a outro funil.
     */
    if (
      funilPadraoId &&
      etapaPadraoId
    ) {
      const etapa =
        await prisma.etapaFunilComercial.findFirst({
          where: {
            id:
              etapaPadraoId,
            instituicaoId,
          },

          select: {
            funilId: true,
          },
        });

      if (
        etapa &&
        etapa.funilId !==
        funilPadraoId
      ) {
        etapaPadraoId =
          null;
      }
    }

    let equipePadraoId =
      atual.equipePadraoId;

    if (
      possuiCampo(
        body,
        "equipePadraoId"
      )
    ) {
      if (
        body.equipePadraoId ===
        null ||
        body.equipePadraoId ===
        ""
      ) {
        equipePadraoId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.equipePadraoId
          );

        const equipe =
          informado
            ? await prisma.equipeComercial.findFirst({
              where: {
                id: informado,
                instituicaoId,
                ativo: true,
              },

              select: {
                id: true,
              },
            })
            : null;

        if (!equipe) {
          throw new ErroHttp(
            400,
            "A equipe selecionada não existe ou está inativa.",
            "EQUIPE_INVALIDA"
          );
        }

        equipePadraoId =
          informado;
      }
    }

    let responsavelPadraoId =
      atual.responsavelPadraoId;

    if (
      possuiCampo(
        body,
        "responsavelPadraoId"
      )
    ) {
      if (
        body.responsavelPadraoId ===
        null ||
        body.responsavelPadraoId ===
        ""
      ) {
        responsavelPadraoId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.responsavelPadraoId
          );

        const funcionario =
          informado
            ? await prisma.funcionario.findFirst({
              where: {
                id: informado,
                instituicaoId,
                ativo: true,

                statusFuncionario:
                  "ATIVO",
              },

              select: {
                id: true,
              },
            })
            : null;

        if (!funcionario) {
          throw new ErroHttp(
            400,
            "O responsável selecionado não está ativo na instituição.",
            "RESPONSAVEL_INVALIDO"
          );
        }

        responsavelPadraoId =
          informado;
      }
    }

    let cursoPadraoId =
      atual.cursoPadraoId;

    if (
      possuiCampo(
        body,
        "cursoPadraoId"
      )
    ) {
      if (
        body.cursoPadraoId ===
        null ||
        body.cursoPadraoId ===
        ""
      ) {
        cursoPadraoId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.cursoPadraoId
          );

        const curso =
          informado
            ? await prisma.curso.findFirst({
              where: {
                id: informado,
                instituicaoId,
                ativo: true,
                excluidoEm:
                  null,
              },

              select: {
                id: true,
              },
            })
            : null;

        if (!curso) {
          throw new ErroHttp(
            400,
            "O curso selecionado não existe ou está inativo.",
            "CURSO_INVALIDO"
          );
        }

        cursoPadraoId =
          informado;
      }
    }

    let poloPadraoId =
      atual.poloPadraoId;

    if (
      possuiCampo(
        body,
        "poloPadraoId"
      )
    ) {
      if (
        body.poloPadraoId ===
        null ||
        body.poloPadraoId ===
        ""
      ) {
        poloPadraoId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.poloPadraoId
          );

        const polo =
          informado
            ? await prisma.polo.findFirst({
              where: {
                id: informado,
                instituicaoId,
                ativo: true,
              },

              select: {
                id: true,
              },
            })
            : null;

        if (!polo) {
          throw new ErroHttp(
            400,
            "O polo selecionado não existe ou está inativo.",
            "POLO_INVALIDO"
          );
        }

        poloPadraoId =
          informado;
      }
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
          "Informe um status válido.",
          "STATUS_INVALIDO"
        );
      }

      status =
        informado;
    }

    let publico =
      possuiCampo(
        body,
        "publico"
      )
        ? booleano(
          body.publico,
          atual.publico
        )
        : atual.publico;

    let ativo =
      possuiCampo(
        body,
        "ativo"
      )
        ? booleano(
          body.ativo,
          atual.ativo
        )
        : atual.ativo;

    const exigeConsentimento =
      possuiCampo(
        body,
        "exigeConsentimento"
      )
        ? booleano(
          body.exigeConsentimento,
          atual.exigeConsentimento
        )
        : atual.exigeConsentimento;

    const textoConsentimento =
      possuiCampo(
        body,
        "textoConsentimento"
      )
        ? textoOuNull(
          body.textoConsentimento
        )
        : atual.textoConsentimento;

    const versaoConsentimento =
      possuiCampo(
        body,
        "versaoConsentimento"
      )
        ? textoOuNull(
          body.versaoConsentimento
        )
        : atual.versaoConsentimento;

    const politicaPrivacidadeUrl =
      possuiCampo(
        body,
        "politicaPrivacidadeUrl"
      )
        ? textoOuNull(
          body.politicaPrivacidadeUrl
        )
        : atual.politicaPrivacidadeUrl;

    if (
      status ===
      StatusFormularioCaptacaoLead.PUBLICADO
    ) {
      const pendencias:
        string[] = [];

      const camposAtivos =
        atual.campos.filter(
          (campo) =>
            campo.ativo
        );

      if (
        camposAtivos.length ===
        0
      ) {
        pendencias.push(
          "Adicione pelo menos um campo ao formulário."
        );
      }

      const campoNome =
        camposAtivos.find(
          (campo) =>
            campo.mapeamento ===
            "NOME"
        );

      if (!campoNome) {
        pendencias.push(
          "Adicione o campo Nome completo."
        );
      } else if (
        !campoNome.obrigatorio
      ) {
        pendencias.push(
          "Marque Nome completo como obrigatório."
        );
      }

      const campoEmail =
        camposAtivos.find(
          (campo) =>
            campo.mapeamento ===
            "EMAIL"
        );

      if (!campoEmail) {
        pendencias.push(
          "Adicione o campo E-mail."
        );
      } else if (
        !campoEmail.obrigatorio
      ) {
        pendencias.push(
          "Marque E-mail como obrigatório."
        );
      }

      const usaCurso =
        camposAtivos.some(
          (campo) =>
            campo.mapeamento ===
            "CURSO_INTERESSE_ID"
        );

      if (usaCurso) {
        const totalCursos =
          await prisma.curso.count({
            where: {
              instituicaoId,
              ativo: true,
              excluidoEm: null,
            },
          });

        if (
          totalCursos ===
          0
        ) {
          pendencias.push(
            "Cadastre pelo menos um curso ativo antes de publicar."
          );
        }
      }

      const usaPolo =
        camposAtivos.some(
          (campo) =>
            campo.mapeamento ===
            "POLO_INTERESSE_ID"
        );

      if (usaPolo) {
        const totalPolos =
          await prisma.polo.count({
            where: {
              instituicaoId,
              ativo: true,
            },
          });

        if (
          totalPolos ===
          0
        ) {
          pendencias.push(
            "Cadastre pelo menos uma unidade ou polo ativo antes de publicar."
          );
        }
      }

      if (
        exigeConsentimento &&
        (
          !textoConsentimento ||
          !versaoConsentimento
        )
      ) {
        pendencias.push(
          "Revise e salve a seção Proteção de dados."
        );
      }

      if (
        pendencias.length >
        0
      ) {
        throw new ErroHttp(
          400,
          "O formulário ainda não está pronto para publicação.",
          "FORMULARIO_INCOMPLETO",
          {
            pendencias,
          }
        );
      }

      /*
       * Publicar significa tornar
       * disponível pelo endereço público.
       * O administrador não precisa
       * entender a diferença entre
       * status e flag `publico`.
       */
      publico = true;
    }

    const bloquearDuplicados =
      possuiCampo(
        body,
        "bloquearDuplicados"
      )
        ? booleano(
          body.bloquearDuplicados,
          atual.bloquearDuplicados
        )
        : atual.bloquearDuplicados;

    const atualizarLeadExistente =
      possuiCampo(
        body,
        "atualizarLeadExistente"
      )
        ? booleano(
          body.atualizarLeadExistente,
          atual.atualizarLeadExistente
        )
        : atual.atualizarLeadExistente;

    const criarTarefaPrimeiroContato =
      possuiCampo(
        body,
        "criarTarefaPrimeiroContato"
      )
        ? booleano(
          body.criarTarefaPrimeiroContato,
          atual.criarTarefaPrimeiroContato
        )
        : atual.criarTarefaPrimeiroContato;

    let tipoTarefaInicial =
      atual.tipoTarefaInicial;

    if (
      possuiCampo(
        body,
        "tipoTarefaInicial"
      )
    ) {
      const informado =
        tipoTarefaOuNull(
          body.tipoTarefaInicial
        );

      if (!informado) {
        throw new ErroHttp(
          400,
          "Informe um tipo válido para a tarefa inicial.",
          "TIPO_TAREFA_INVALIDO"
        );
      }

      tipoTarefaInicial =
        informado;
    }

    let prazoPrimeiroContatoMinutos =
      atual.prazoPrimeiroContatoMinutos;

    if (
      possuiCampo(
        body,
        "prazoPrimeiroContatoMinutos"
      )
    ) {
      const informado =
        inteiroPositivo(
          body.prazoPrimeiroContatoMinutos
        );

      if (
        !informado ||
        informado > 10080
      ) {
        throw new ErroHttp(
          400,
          "O prazo do primeiro contato deve estar entre 1 minuto e 7 dias.",
          "PRAZO_PRIMEIRO_CONTATO_INVALIDO"
        );
      }

      prazoPrimeiroContatoMinutos =
        informado;
    }

    const recaptchaAtivo =
      possuiCampo(
        body,
        "recaptchaAtivo"
      )
        ? booleano(
          body.recaptchaAtivo,
          atual.recaptchaAtivo
        )
        : atual.recaptchaAtivo;

    const honeypotAtivo =
      possuiCampo(
        body,
        "honeypotAtivo"
      )
        ? booleano(
          body.honeypotAtivo,
          atual.honeypotAtivo
        )
        : atual.honeypotAtivo;

    let limiteSubmissoesPorIpHora =
      atual.limiteSubmissoesPorIpHora;

    if (
      possuiCampo(
        body,
        "limiteSubmissoesPorIpHora"
      )
    ) {
      const informado =
        inteiroPositivo(
          body.limiteSubmissoesPorIpHora
        );

      if (
        !informado ||
        informado > 10000
      ) {
        throw new ErroHttp(
          400,
          "O limite de submissões por IP/hora deve estar entre 1 e 10.000.",
          "LIMITE_SUBMISSOES_INVALIDO"
        );
      }

      limiteSubmissoesPorIpHora =
        informado;
    }

    let configuracaoVisual:
      any =
      atual.configuracaoVisual;

    if (
      possuiCampo(
        body,
        "configuracaoVisual"
      )
    ) {
      configuracaoVisual =
        jsonParaPrisma(
          body.configuracaoVisual
        );
    }

    let metadados:
      any =
      atual.metadados;

    if (
      possuiCampo(
        body,
        "metadados"
      )
    ) {
      metadados =
        jsonParaPrisma(
          body.metadados
        );
    }

    const agora =
      new Date();

    let publicadoEm =
      atual.publicadoEm;

    let pausadoEm =
      atual.pausadoEm;

    let arquivadoEm =
      atual.arquivadoEm;

    /*
     * Se desativar um formulário
     * publicado sem informar status,
     * ele passa a PAUSADO.
     */
    if (
      !ativo &&
      status ===
      StatusFormularioCaptacaoLead.PUBLICADO
    ) {
      status =
        StatusFormularioCaptacaoLead.PAUSADO;
    }

    if (
      status ===
      StatusFormularioCaptacaoLead.PUBLICADO
    ) {
      ativo = true;

      publicadoEm =
        publicadoEm ??
        agora;

      pausadoEm =
        null;

      arquivadoEm =
        null;
    }

    if (
      status ===
      StatusFormularioCaptacaoLead.PAUSADO
    ) {
      ativo = true;

      pausadoEm =
        atual.status ===
          StatusFormularioCaptacaoLead.PAUSADO
          ? (
            atual.pausadoEm ??
            agora
          )
          : agora;

      arquivadoEm =
        null;
    }

    if (
      status ===
      StatusFormularioCaptacaoLead.ARQUIVADO
    ) {
      ativo = false;

      arquivadoEm =
        agora;
    }

    if (
      status ===
      StatusFormularioCaptacaoLead.RASCUNHO
    ) {
      pausadoEm =
        null;

      arquivadoEm =
        null;
    }

    await prisma.formularioCaptacaoLead.update({
      where: {
        id,
      },

      data: {
        canalId,
        campanhaId,

        funilPadraoId,
        etapaPadraoId,
        equipePadraoId,
        responsavelPadraoId,
        cursoPadraoId,
        poloPadraoId,

        nome,
        slug,
        titulo,
        descricao,

        mensagemSucesso,
        urlRedirecionamento,

        status,
        publico,
        ativo,

        exigeConsentimento,
        textoConsentimento,
        versaoConsentimento,
        politicaPrivacidadeUrl,

        bloquearDuplicados,
        atualizarLeadExistente,

        criarTarefaPrimeiroContato,
        tipoTarefaInicial,
        prazoPrimeiroContatoMinutos,

        recaptchaAtivo,
        honeypotAtivo,
        limiteSubmissoesPorIpHora,

        configuracaoVisual,
        metadados,

        publicadoEm,
        pausadoEm,
        arquivadoEm,

        versao: {
          increment: 1,
        },

        atualizadoPorId:
          user.id,
      },
    });

    const formulario =
      await localizarFormulario(
        id,
        instituicaoId
      );

    return NextResponse.json(
      {
        success: true,

        message:
          status ===
            StatusFormularioCaptacaoLead.PUBLICADO
            ? "Formulário publicado com sucesso."
            : status ===
              StatusFormularioCaptacaoLead.PAUSADO
              ? "Formulário pausado com sucesso."
              : status ===
                StatusFormularioCaptacaoLead.ARQUIVADO
                ? "Formulário arquivado com sucesso."
                : "Formulário atualizado com sucesso.",

        formulario,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return responderErro(
      error,
      "Erro ao editar formulário de captação:"
    );
  }
}