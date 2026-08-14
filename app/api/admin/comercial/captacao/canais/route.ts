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
  const user = await getUserFromToken();

  if (!user) {
    throw new ErroHttp(
      401,
      "Usuário não autenticado.",
      "NAO_AUTENTICADO"
    );
  }

  const instituicaoId = Number(
    user.instituicaoId
  );

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

function textoOuNull(
  valor: unknown
) {
  const texto = String(
    valor ?? ""
  ).trim();

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

  return slug || "canal";
}

function tipoCanalOuNull(
  valor: unknown
): TipoCanalCaptacaoLead | null {
  const normalizado = String(
    valor ?? ""
  )
    .trim()
    .toUpperCase() as TipoCanalCaptacaoLead;

  return Object.values(
    TipoCanalCaptacaoLead
  ).includes(normalizado)
    ? normalizado
    : null;
}

function corOuPadrao(
  valor: unknown
) {
  const cor = String(
    valor ?? ""
  ).trim();

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
        "Não foi possível processar os canais de captação.",
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
        "Você não possui permissão para consultar os canais de captação.",
        "SEM_PERMISSAO"
      );
    }

    const busca =
      textoOuNull(
        req.nextUrl.searchParams.get(
          "busca"
        )
      );

    const tipo =
      tipoCanalOuNull(
        req.nextUrl.searchParams.get(
          "tipo"
        )
      );

    const ativoParam =
      req.nextUrl.searchParams.get(
        "ativo"
      );

    const somenteAtivos =
      ativoParam === null
        ? null
        : booleano(
            ativoParam
          );

    const canais =
      await prisma.canalCaptacaoLead.findMany(
        {
          where: {
            instituicaoId,

            ...(tipo
              ? {
                  tipo,
                }
              : {}),

            ...(somenteAtivos !==
            null
              ? {
                  ativo:
                    somenteAtivos,
                }
              : {}),

            ...(busca
              ? {
                  OR: [
                    {
                      nome: {
                        contains:
                          busca,
                        mode: "insensitive",
                      },
                    },
                    {
                      descricao: {
                        contains:
                          busca,
                        mode: "insensitive",
                      },
                    },
                    {
                      slug: {
                        contains:
                          slugificar(
                            busca
                          ),
                        mode: "insensitive",
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
              padrao: "desc",
            },
            {
              ativo: "desc",
            },
            {
              nome: "asc",
            },
          ],
        }
      );

    return NextResponse.json(
      {
        success: true,

        permissoes,

        tiposDisponiveis:
          Object.values(
            TipoCanalCaptacaoLead
          ),

        resumo: {
          total:
            canais.length,

          ativos:
            canais.filter(
              (canal) =>
                canal.ativo
            ).length,

          inativos:
            canais.filter(
              (canal) =>
                !canal.ativo
            ).length,

          padrao:
            canais.find(
              (canal) =>
                canal.padrao
            ) ?? null,
        },

        canais,
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
      "Erro ao consultar canais de captação:"
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
        "Você não possui permissão para cadastrar canais de captação.",
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
      nome.length > 150
    ) {
      throw new ErroHttp(
        400,
        "Informe o nome do canal com até 150 caracteres.",
        "NOME_INVALIDO"
      );
    }

    const tipo =
      tipoCanalOuNull(
        body.tipo
      );

    if (!tipo) {
      throw new ErroHttp(
        400,
        "Selecione um tipo de canal de captação válido.",
        "TIPO_INVALIDO"
      );
    }

    const descricao =
      textoOuNull(
        body.descricao
      );

    const icone =
      textoOuNull(
        body.icone
      );

    const cor =
      corOuPadrao(
        body.cor
      );

    const padrao =
      booleano(
        body.padrao,
        false
      );

    const ativo =
      booleano(
        body.ativo,
        true
      );

    const slugSolicitado =
      textoOuNull(
        body.slug
      );

    const slug =
      slugificar(
        slugSolicitado ??
          nome
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

    if (
      icone &&
      icone.length > 100
    ) {
      throw new ErroHttp(
        400,
        "O identificador do ícone deve possuir no máximo 100 caracteres.",
        "ICONE_INVALIDO"
      );
    }

    const existente =
      await prisma.canalCaptacaoLead.findFirst(
        {
          where: {
            instituicaoId,

            OR: [
              {
                nome: {
                  equals:
                    nome,
                  mode: "insensitive",
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
        }
      );

    if (existente) {
      throw new ErroHttp(
        409,
        "Já existe um canal de captação com esse nome ou identificador.",
        "CANAL_DUPLICADO",
        {
          canalId:
            existente.id,
        }
      );
    }

    const canal =
      await prisma.$transaction(
        async (tx) => {
          if (padrao) {
            await tx.canalCaptacaoLead.updateMany(
              {
                where: {
                  instituicaoId,
                  padrao: true,
                },

                data: {
                  padrao:
                    false,
                  atualizadoPorId:
                    user.id,
                },
              }
            );
          }

          return tx.canalCaptacaoLead.create(
            {
              data: {
                instituicaoId,

                nome,
                slug,
                descricao,
                tipo,
                cor,
                icone,
                padrao,
                ativo,

                criadoPorId:
                  user.id,

                atualizadoPorId:
                  user.id,
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
                atualizadoEm:
                  true,
              },
            }
          );
        }
      );

    return NextResponse.json(
      {
        success: true,

        message:
          "Canal de captação criado com sucesso.",

        canal,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return responderErro(
      error,
      "Erro ao criar canal de captação:"
    );
  }
}