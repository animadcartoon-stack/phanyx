import {
  Prisma,
  TipoCanalCaptacaoLead,
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
      "comercial.captacao.canais.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.canais.gerenciar"
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

  return slug || "canal";
}

function tipoCanalOuNull(
  valor: unknown
): TipoCanalCaptacaoLead | null {
  const normalizado =
    String(valor ?? "")
      .trim()
      .toUpperCase() as
      TipoCanalCaptacaoLead;

  return Object.values(
    TipoCanalCaptacaoLead
  ).includes(normalizado)
    ? normalizado
    : null;
}

function corOuPadrao(
  valor: unknown
) {
  const cor =
    String(valor ?? "").trim();

  if (!cor) {
    return "#64748B";
  }

  if (
    !/^#[0-9A-Fa-f]{6}$/.test(
      cor
    )
  ) {
    throw new ErroHttp(
      400,
      "Informe uma cor hexadecimal válida, por exemplo #64748B.",
      "COR_INVALIDA"
    );
  }

  return cor.toUpperCase();
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
          "Já existe um canal de captação com esse nome ou identificador.",
        codigo:
          "CANAL_DUPLICADO",
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
        "Não foi possível processar o canal de captação.",
      codigo:
        "ERRO_INTERNO",
    },
    {
      status: 500,
    }
  );
}

async function localizarCanal(
  id: number,
  instituicaoId: number
) {
  return prisma.canalCaptacaoLead.findFirst({
    where: {
      id,
      instituicaoId,
    },

    select: {
      id: true,
      instituicaoId: true,

      nome: true,
      slug: true,
      descricao: true,
      tipo: true,
      cor: true,
      icone: true,
      padrao: true,
      ativo: true,

      criadoPorId: true,
      atualizadoPorId: true,

      criadoEm: true,
      atualizadoEm: true,

      _count: {
        select: {
          campanhas: true,
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
        "Você não possui permissão para consultar canais de captação.",
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
        "Canal inválido.",
        "CANAL_INVALIDO"
      );
    }

    const canal =
      await localizarCanal(
        id,
        instituicaoId
      );

    if (!canal) {
      throw new ErroHttp(
        404,
        "Canal de captação não encontrado.",
        "CANAL_NAO_ENCONTRADO"
      );
    }

    return NextResponse.json(
      {
        success: true,

        permissoes,

        tiposDisponiveis:
          Object.values(
            TipoCanalCaptacaoLead
          ),

        canal,
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
      "Erro ao consultar canal de captação:"
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
        "Você não possui permissão para editar canais de captação.",
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
        "Canal inválido.",
        "CANAL_INVALIDO"
      );
    }

    const atual =
      await localizarCanal(
        id,
        instituicaoId
      );

    if (!atual) {
      throw new ErroHttp(
        404,
        "Canal de captação não encontrado.",
        "CANAL_NAO_ENCONTRADO"
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

    const possuiAlteracao =
      [
        "nome",
        "slug",
        "descricao",
        "tipo",
        "cor",
        "icone",
        "padrao",
        "ativo",
      ].some(
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
          150
      ) {
        throw new ErroHttp(
          400,
          "Informe o nome do canal com até 150 caracteres.",
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

      slug =
        slugificar(
          informado ??
            nome
        );
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

      if (
        descricao &&
        descricao.length >
          3000
      ) {
        throw new ErroHttp(
          400,
          "A descrição deve possuir no máximo 3000 caracteres.",
          "DESCRICAO_INVALIDA"
        );
      }
    }

    let tipo =
      atual.tipo;

    if (
      possuiCampo(
        body,
        "tipo"
      )
    ) {
      const informado =
        tipoCanalOuNull(
          body.tipo
        );

      if (!informado) {
        throw new ErroHttp(
          400,
          "Selecione um tipo de canal de captação válido.",
          "TIPO_INVALIDO"
        );
      }

      tipo =
        informado;
    }

    let cor =
      atual.cor;

    if (
      possuiCampo(
        body,
        "cor"
      )
    ) {
      cor =
        corOuPadrao(
          body.cor
        );
    }

    let icone =
      atual.icone;

    if (
      possuiCampo(
        body,
        "icone"
      )
    ) {
      icone =
        textoOuNull(
          body.icone
        );

      if (
        icone &&
        icone.length >
          100
      ) {
        throw new ErroHttp(
          400,
          "O identificador do ícone deve possuir no máximo 100 caracteres.",
          "ICONE_INVALIDO"
        );
      }
    }

    let padrao =
      atual.padrao;

    if (
      possuiCampo(
        body,
        "padrao"
      )
    ) {
      padrao =
        booleano(
          body.padrao,
          atual.padrao
        );
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
     * Um canal padrão precisa
     * permanecer ativo.
     */
    if (padrao) {
      ativo = true;
    }

    /*
     * Um canal desativado não
     * pode permanecer como padrão.
     */
    if (!ativo) {
      padrao = false;
    }

    if (
      nome !== atual.nome ||
      slug !== atual.slug
    ) {
      const duplicado =
        await prisma.canalCaptacaoLead.findFirst({
          where: {
            instituicaoId,

            id: {
              not: id,
            },

            OR: [
              {
                nome: {
                  equals:
                    nome,
                  mode:
                    "insensitive",
                },
              },

              {
                slug,
              },
            ],
          },

          select: {
            id: true,
            nome: true,
            slug: true,
          },
        });

      if (duplicado) {
        throw new ErroHttp(
          409,
          "Já existe outro canal de captação com esse nome ou identificador.",
          "CANAL_DUPLICADO",
          {
            canalId:
              duplicado.id,
          }
        );
      }
    }

    const atualizado =
      await prisma.$transaction(
        async (tx) => {
          if (padrao) {
            await tx.canalCaptacaoLead.updateMany({
              where: {
                instituicaoId,

                id: {
                  not: id,
                },

                padrao: true,
              },

              data: {
                padrao: false,

                atualizadoPorId:
                  user.id,
              },
            });
          }

          await tx.canalCaptacaoLead.update({
            where: {
              id,
            },

            data: {
              nome,
              slug,
              descricao,
              tipo,
              cor,
              icone,
              padrao,
              ativo,

              atualizadoPorId:
                user.id,
            },
          });

          return tx.canalCaptacaoLead.findFirst({
            where: {
              id,
              instituicaoId,
            },

            select: {
              id: true,
              nome: true,
              slug: true,
              descricao: true,
              tipo: true,
              cor: true,
              icone: true,
              padrao: true,
              ativo: true,
              criadoEm: true,
              atualizadoEm: true,

              _count: {
                select: {
                  campanhas: true,
                  formularios:
                    true,
                  submissoes:
                    true,
                  regrasDistribuicao:
                    true,
                  integracoes:
                    true,
                },
              },
            },
          });
        }
      );

    return NextResponse.json(
      {
        success: true,

        message:
          ativo
            ? "Canal de captação atualizado com sucesso."
            : "Canal de captação desativado com sucesso.",

        canal:
          atualizado,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return responderErro(
      error,
      "Erro ao editar canal de captação:"
    );
  }
}