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
  valor: unknown,
  padrao: number
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return padrao;
  }

  const numero =
    Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
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

function jsonOpcional(
  valor: unknown
): Prisma.InputJsonValue | undefined {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return undefined;
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
          "Já existe um formulário de captação com esse identificador nesta instituição.",
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
        "Não foi possível processar os formulários de captação.",
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
        "Você não possui permissão para consultar formulários de captação.",
        "SEM_PERMISSAO"
      );
    }

    const busca =
      textoOuNull(
        req.nextUrl.searchParams.get(
          "busca"
        )
      );

    const status =
      statusOuNull(
        req.nextUrl.searchParams.get(
          "status"
        )
      );

    const canalId =
      numeroPositivo(
        req.nextUrl.searchParams.get(
          "canalId"
        )
      );

    const campanhaId =
      numeroPositivo(
        req.nextUrl.searchParams.get(
          "campanhaId"
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

    const [
      formularios,
      canais,
      campanhas,
      funis,
      equipes,
      responsaveis,
      cursos,
      polos,
    ] = await prisma.$transaction([
      prisma.formularioCaptacaoLead.findMany({
        where: {
          instituicaoId,

          ...(status
            ? {
                status,
              }
            : {}),

          ...(canalId
            ? {
                canalId,
              }
            : {}),

          ...(campanhaId
            ? {
                campanhaId,
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
                    titulo: {
                      contains:
                        busca,
                      mode:
                        "insensitive",
                    },
                  },

                  {
                    slug: {
                      contains:
                        slugificar(
                          busca
                        ),
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

          tipoTarefaInicial:
            true,

          prazoPrimeiroContatoMinutos:
            true,

          recaptchaAtivo: true,
          honeypotAtivo: true,

          limiteSubmissoesPorIpHora:
            true,

          publicadoEm: true,
          pausadoEm: true,
          arquivadoEm: true,

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

          campanha: {
            select: {
              id: true,
              nome: true,
              codigo: true,
              status: true,
            },
          },

          funilPadrao: {
            select: {
              id: true,
              nome: true,
            },
          },

          etapaPadrao: {
            select: {
              id: true,
              nome: true,
              ordem: true,
              categoria: true,
            },
          },

          equipePadrao: {
            select: {
              id: true,
              nome: true,
            },
          },

          responsavelPadrao: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },

          cursoPadrao: {
            select: {
              id: true,
              nome: true,
              codigo: true,
            },
          },

          poloPadrao: {
            select: {
              id: true,
              nome: true,
              codigo: true,
            },
          },

          _count: {
            select: {
              campos: true,
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
            atualizadoEm:
              "desc",
          },
        ],
      }),

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
              arquivadoEm:
                null,
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

        resumo: {
          total:
            formularios.length,

          publicados:
            formularios.filter(
              (item) =>
                item.status ===
                  StatusFormularioCaptacaoLead.PUBLICADO &&
                item.ativo
            ).length,

          rascunhos:
            formularios.filter(
              (item) =>
                item.status ===
                StatusFormularioCaptacaoLead.RASCUNHO
            ).length,

          pausados:
            formularios.filter(
              (item) =>
                item.status ===
                StatusFormularioCaptacaoLead.PAUSADO
            ).length,

          arquivados:
            formularios.filter(
              (item) =>
                item.status ===
                StatusFormularioCaptacaoLead.ARQUIVADO
            ).length,
        },

        referencias: {
          canais,
          campanhas,
          funis,
          equipes,
          responsaveis,
          cursos,
          polos,
        },

        formularios,
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
      "Erro ao consultar formulários de captação:"
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
        "Você não possui permissão para cadastrar formulários de captação.",
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
        "Informe o nome interno do formulário com até 180 caracteres.",
        "NOME_INVALIDO"
      );
    }

    const titulo =
      textoOuNull(
        body.titulo
      );

    if (
      !titulo ||
      titulo.length > 250
    ) {
      throw new ErroHttp(
        400,
        "Informe o título público do formulário com até 250 caracteres.",
        "TITULO_INVALIDO"
      );
    }

    const slugInformado =
      textoOuNull(
        body.slug
      );

    const slug =
      slugificar(
        slugInformado ??
          nome
      );

    if (
      slug.length > 180
    ) {
      throw new ErroHttp(
        400,
        "O identificador do formulário deve possuir no máximo 180 caracteres.",
        "SLUG_INVALIDO"
      );
    }

    const existente =
      await prisma.formularioCaptacaoLead.findFirst({
        where: {
          instituicaoId,
          slug,
        },

        select: {
          id: true,
        },
      });

    if (existente) {
      throw new ErroHttp(
        409,
        "Já existe um formulário de captação com esse identificador.",
        "FORMULARIO_DUPLICADO",
        {
          formularioId:
            existente.id,
        }
      );
    }

    let canalId =
      numeroPositivo(
        body.canalId
      );

    let campanhaId =
      numeroPositivo(
        body.campanhaId
      );

    if (
      body.canalId !== undefined &&
      body.canalId !== null &&
      body.canalId !== "" &&
      !canalId
    ) {
      throw new ErroHttp(
        400,
        "Selecione um canal válido.",
        "CANAL_INVALIDO"
      );
    }

    if (
      body.campanhaId !== undefined &&
      body.campanhaId !== null &&
      body.campanhaId !== "" &&
      !campanhaId
    ) {
      throw new ErroHttp(
        400,
        "Selecione uma campanha válida.",
        "CAMPANHA_INVALIDA"
      );
    }

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

    if (campanhaId) {
      const campanha =
        await prisma.campanhaCaptacaoLead.findFirst({
          where: {
            id: campanhaId,
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
          "A campanha selecionada pertence a outro canal de captação.",
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
    }

    let funilPadraoId =
      numeroPositivo(
        body.funilPadraoId
      );

    let etapaPadraoId =
      numeroPositivo(
        body.etapaPadraoId
      );

    if (
      body.funilPadraoId !== undefined &&
      body.funilPadraoId !== null &&
      body.funilPadraoId !== "" &&
      !funilPadraoId
    ) {
      throw new ErroHttp(
        400,
        "Selecione um funil válido.",
        "FUNIL_INVALIDO"
      );
    }

    if (
      body.etapaPadraoId !== undefined &&
      body.etapaPadraoId !== null &&
      body.etapaPadraoId !== "" &&
      !etapaPadraoId
    ) {
      throw new ErroHttp(
        400,
        "Selecione uma etapa válida.",
        "ETAPA_INVALIDA"
      );
    }

    if (funilPadraoId) {
      const funil =
        await prisma.funilComercial.findFirst({
          where: {
            id: funilPadraoId,
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
    }

    if (etapaPadraoId) {
      const etapa =
        await prisma.etapaFunilComercial.findFirst({
          where: {
            id: etapaPadraoId,
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
          "A etapa selecionada não pertence ao funil informado.",
          "ETAPA_FUNIL_DIVERGENTE"
        );
      }

      if (!funilPadraoId) {
        funilPadraoId =
          etapa.funilId;
      }
    }

    const equipePadraoId =
      numeroPositivo(
        body.equipePadraoId
      );

    if (
      body.equipePadraoId !== undefined &&
      body.equipePadraoId !== null &&
      body.equipePadraoId !== "" &&
      !equipePadraoId
    ) {
      throw new ErroHttp(
        400,
        "Selecione uma equipe válida.",
        "EQUIPE_INVALIDA"
      );
    }

    if (equipePadraoId) {
      const equipe =
        await prisma.equipeComercial.findFirst({
          where: {
            id: equipePadraoId,
            instituicaoId,
            ativo: true,
          },

          select: {
            id: true,
          },
        });

      if (!equipe) {
        throw new ErroHttp(
          400,
          "A equipe selecionada não existe ou está inativa.",
          "EQUIPE_INVALIDA"
        );
      }
    }

    const responsavelPadraoId =
      numeroPositivo(
        body.responsavelPadraoId
      );

    if (
      body.responsavelPadraoId !== undefined &&
      body.responsavelPadraoId !== null &&
      body.responsavelPadraoId !== "" &&
      !responsavelPadraoId
    ) {
      throw new ErroHttp(
        400,
        "Selecione um responsável válido.",
        "RESPONSAVEL_INVALIDO"
      );
    }

    if (responsavelPadraoId) {
      const responsavel =
        await prisma.funcionario.findFirst({
          where: {
            id:
              responsavelPadraoId,
            instituicaoId,
            ativo: true,
            statusFuncionario:
              "ATIVO",
          },

          select: {
            id: true,
          },
        });

      if (!responsavel) {
        throw new ErroHttp(
          400,
          "O responsável selecionado não está ativo na instituição.",
          "RESPONSAVEL_INVALIDO"
        );
      }
    }

    const cursoPadraoId =
      numeroPositivo(
        body.cursoPadraoId
      );

    if (
      body.cursoPadraoId !== undefined &&
      body.cursoPadraoId !== null &&
      body.cursoPadraoId !== "" &&
      !cursoPadraoId
    ) {
      throw new ErroHttp(
        400,
        "Selecione um curso válido.",
        "CURSO_INVALIDO"
      );
    }

    if (cursoPadraoId) {
      const curso =
        await prisma.curso.findFirst({
          where: {
            id: cursoPadraoId,
            instituicaoId,
            ativo: true,
            excluidoEm:
              null,
          },

          select: {
            id: true,
          },
        });

      if (!curso) {
        throw new ErroHttp(
          400,
          "O curso selecionado não existe ou está inativo.",
          "CURSO_INVALIDO"
        );
      }
    }

    const poloPadraoId =
      numeroPositivo(
        body.poloPadraoId
      );

    if (
      body.poloPadraoId !== undefined &&
      body.poloPadraoId !== null &&
      body.poloPadraoId !== "" &&
      !poloPadraoId
    ) {
      throw new ErroHttp(
        400,
        "Selecione um polo válido.",
        "POLO_INVALIDO"
      );
    }

    if (poloPadraoId) {
      const polo =
        await prisma.polo.findFirst({
          where: {
            id: poloPadraoId,
            instituicaoId,
            ativo: true,
          },

          select: {
            id: true,
          },
        });

      if (!polo) {
        throw new ErroHttp(
          400,
          "O polo selecionado não existe ou está inativo.",
          "POLO_INVALIDO"
        );
      }
    }

    const status =
      statusOuNull(
        body.status
      ) ??
      StatusFormularioCaptacaoLead.RASCUNHO;

    const descricao =
      textoOuNull(
        body.descricao
      );

    const mensagemSucesso =
      textoOuNull(
        body.mensagemSucesso
      );

    const urlRedirecionamento =
      textoOuNull(
        body.urlRedirecionamento
      );

    const publico =
      booleano(
        body.publico,
        true
      );

    let ativo =
      booleano(
        body.ativo,
        true
      );

    const exigeConsentimento =
      booleano(
        body.exigeConsentimento,
        true
      );

    const textoConsentimento =
      textoOuNull(
        body.textoConsentimento
      );

    const versaoConsentimento =
      textoOuNull(
        body.versaoConsentimento
      );

    const politicaPrivacidadeUrl =
      textoOuNull(
        body.politicaPrivacidadeUrl
      );

    if (
      status ===
        StatusFormularioCaptacaoLead.PUBLICADO &&
      exigeConsentimento &&
      (
        !textoConsentimento ||
        !versaoConsentimento
      )
    ) {
      throw new ErroHttp(
        400,
        "Antes de publicar, informe o texto e a versão do consentimento LGPD.",
        "CONSENTIMENTO_INCOMPLETO"
      );
    }

    const bloquearDuplicados =
      booleano(
        body.bloquearDuplicados,
        true
      );

    const atualizarLeadExistente =
      booleano(
        body.atualizarLeadExistente,
        true
      );

    const criarTarefaPrimeiroContato =
      booleano(
        body.criarTarefaPrimeiroContato,
        true
      );

    const tipoTarefaInicial =
      tipoTarefaOuNull(
        body.tipoTarefaInicial
      ) ??
      TipoTarefaComercial.RETORNO;

    const prazoPrimeiroContatoMinutos =
      inteiroPositivo(
        body.prazoPrimeiroContatoMinutos,
        15
      );

    if (
      !prazoPrimeiroContatoMinutos ||
      prazoPrimeiroContatoMinutos >
        10080
    ) {
      throw new ErroHttp(
        400,
        "O prazo do primeiro contato deve estar entre 1 minuto e 7 dias.",
        "PRAZO_PRIMEIRO_CONTATO_INVALIDO"
      );
    }

    const recaptchaAtivo =
      booleano(
        body.recaptchaAtivo,
        false
      );

    const honeypotAtivo =
      booleano(
        body.honeypotAtivo,
        true
      );

    const limiteSubmissoesPorIpHora =
      inteiroPositivo(
        body.limiteSubmissoesPorIpHora,
        20
      );

    if (
      !limiteSubmissoesPorIpHora ||
      limiteSubmissoesPorIpHora >
        10000
    ) {
      throw new ErroHttp(
        400,
        "O limite de submissões por IP/hora deve estar entre 1 e 10.000.",
        "LIMITE_SUBMISSOES_INVALIDO"
      );
    }

    const configuracaoVisual =
      jsonOpcional(
        body.configuracaoVisual
      );

    const metadados =
      jsonOpcional(
        body.metadados
      );

    const agora =
      new Date();

    let publicadoEm:
      Date | null = null;

    let pausadoEm:
      Date | null = null;

    let arquivadoEm:
      Date | null = null;

    if (
      status ===
      StatusFormularioCaptacaoLead.PUBLICADO
    ) {
      publicadoEm =
        agora;

      ativo = true;
    }

    if (
      status ===
      StatusFormularioCaptacaoLead.PAUSADO
    ) {
      pausadoEm =
        agora;

      ativo = true;
    }

    if (
      status ===
      StatusFormularioCaptacaoLead.ARQUIVADO
    ) {
      arquivadoEm =
        agora;

      ativo = false;
    }

    const formulario =
      await prisma.formularioCaptacaoLead.create({
        data: {
          instituicaoId,

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

          ...(configuracaoVisual !==
          undefined
            ? {
                configuracaoVisual,
              }
            : {}),

          ...(metadados !==
          undefined
            ? {
                metadados,
              }
            : {}),

          publicadoEm,
          pausadoEm,
          arquivadoEm,

          criadoPorId:
            user.id,

          atualizadoPorId:
            user.id,
        },

        select: {
          id: true,

          nome: true,
          slug: true,
          tokenPublico: true,

          titulo: true,
          descricao: true,

          status: true,
          versao: true,
          publico: true,
          ativo: true,

          exigeConsentimento: true,

          bloquearDuplicados: true,
          atualizarLeadExistente: true,

          criarTarefaPrimeiroContato:
            true,

          tipoTarefaInicial:
            true,

          prazoPrimeiroContatoMinutos:
            true,

          recaptchaAtivo: true,
          honeypotAtivo: true,

          limiteSubmissoesPorIpHora:
            true,

          publicadoEm: true,
          pausadoEm: true,
          arquivadoEm: true,

          criadoEm: true,
          atualizadoEm: true,

          canal: {
            select: {
              id: true,
              nome: true,
              tipo: true,
            },
          },

          campanha: {
            select: {
              id: true,
              nome: true,
              codigo: true,
            },
          },

          funilPadrao: {
            select: {
              id: true,
              nome: true,
            },
          },

          etapaPadrao: {
            select: {
              id: true,
              nome: true,
              ordem: true,
            },
          },

          equipePadrao: {
            select: {
              id: true,
              nome: true,
            },
          },

          responsavelPadrao: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },

          cursoPadrao: {
            select: {
              id: true,
              nome: true,
            },
          },

          poloPadrao: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          status ===
          StatusFormularioCaptacaoLead.PUBLICADO
            ? "Formulário de captação criado e publicado com sucesso."
            : "Formulário de captação criado com sucesso.",

        formulario,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return responderErro(
      error,
      "Erro ao criar formulário de captação:"
    );
  }
}