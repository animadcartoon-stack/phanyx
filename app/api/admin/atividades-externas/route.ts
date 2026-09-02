import {
  Prisma,
  StatusAtividadeExterna,
  TipoAtividadeExterna,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

const PERMISSAO_VER = "atividades-externas.ver";
const PERMISSAO_GERENCIAR = "atividades-externas.gerenciar";

const TIPOS_ATIVIDADE = new Set(
  Object.values(TipoAtividadeExterna)
);

const STATUS_ATIVIDADE = new Set(
  Object.values(StatusAtividadeExterna)
);

class ErroHttp extends Error {
  status: number;
  codigo: string;

  constructor(
    status: number,
    message: string,
    codigo: string
  ) {
    super(message);
    this.status = status;
    this.codigo = codigo;
  }
}

function respostaErro(error: unknown) {
  if (error instanceof ErroHttp) {
    return NextResponse.json(
      {
        ok: false,
        error: error.codigo,
        message: error.message,
      },
      {
        status: error.status,
      }
    );
  }

  console.error(
    "[ATIVIDADES_EXTERNAS]",
    error
  );

  return NextResponse.json(
    {
      ok: false,
      error: "ERRO_INTERNO",
      message:
        "Não foi possível concluir a operação.",
    },
    {
      status: 500,
    }
  );
}

function textoOpcional(
  valor: unknown,
  limite = 500
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return null;
  }

  const texto = String(valor).trim();

  if (!texto) {
    return null;
  }

  return texto.slice(0, limite);
}

function inteiroOpcional(
  valor: unknown
): number | null {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    throw new ErroHttp(
      400,
      "Identificador inválido.",
      "ID_INVALIDO"
    );
  }

  return numero;
}

function booleano(
  valor: unknown,
  padrao: boolean
) {
  if (typeof valor === "boolean") {
    return valor;
  }

  return padrao;
}

function dataOpcional(
  valor: unknown,
  campo: string
): Date | null {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const data = new Date(String(valor));

  if (Number.isNaN(data.getTime())) {
    throw new ErroHttp(
      400,
      `Data inválida em ${campo}.`,
      "DATA_INVALIDA"
    );
  }

  return data;
}

function normalizarIds(
  valor: unknown
): number[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return Array.from(
    new Set(
      valor
        .map((item) => Number(item))
        .filter(
          (item) =>
            Number.isInteger(item) &&
            item > 0
        )
    )
  );
}

function normalizarRole(
  role: unknown
) {
  return String(role || "")
    .trim()
    .toUpperCase();
}

function roleAdministrativa(
  role: string
) {
  return (
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

async function carregarContextoAcesso(
  permissaoNecessaria:
    | typeof PERMISSAO_VER
    | typeof PERMISSAO_GERENCIAR
) {
  const token = await getUserFromToken();

  if (!token) {
    throw new ErroHttp(
      401,
      "Sessão não autenticada.",
      "NAO_AUTORIZADO"
    );
  }

  const usuario =
    await prisma.user.findFirst({
      where: {
        id: token.id,
        instituicaoId:
          token.instituicaoId,
        ativo: true,
      },
      select: {
        id: true,
        instituicaoId: true,
        role: true,
        acessoTodosPolos: true,

        funcionario: {
          select: {
            id: true,
            ativo: true,
            statusFuncionario: true,

            permissoes: {
              where: {
                ativo: true,
              },
              select: {
                chave: true,
              },
            },

            departamento: {
              select: {
                permissoes: {
                  where: {
                    ativo: true,
                  },
                  select: {
                    chave: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!usuario) {
    throw new ErroHttp(
      401,
      "Usuário não encontrado ou inativo.",
      "NAO_AUTORIZADO"
    );
  }

  const role = normalizarRole(
    usuario.role
  );

  const admin =
    roleAdministrativa(role);

  if (!admin) {
    const funcionario =
      usuario.funcionario;

    if (
      !funcionario ||
      !funcionario.ativo ||
      funcionario.statusFuncionario !==
      "ATIVO"
    ) {
      throw new ErroHttp(
        403,
        "Usuário sem acesso administrativo a este recurso.",
        "SEM_PERMISSAO"
      );
    }

    const permissoes = new Set([
      ...funcionario.permissoes.map(
        (item) => item.chave
      ),
      ...(
        funcionario.departamento
          ?.permissoes || []
      ).map((item) => item.chave),
    ]);

    const podeVer =
      permissoes.has(PERMISSAO_VER) ||
      permissoes.has(
        PERMISSAO_GERENCIAR
      );

    const podeGerenciar =
      permissoes.has(
        PERMISSAO_GERENCIAR
      );

    if (
      permissaoNecessaria ===
      PERMISSAO_VER &&
      !podeVer
    ) {
      throw new ErroHttp(
        403,
        "Usuário sem permissão para visualizar atividades externas.",
        "SEM_PERMISSAO"
      );
    }

    if (
      permissaoNecessaria ===
      PERMISSAO_GERENCIAR &&
      !podeGerenciar
    ) {
      throw new ErroHttp(
        403,
        "Usuário sem permissão para gerenciar atividades externas.",
        "SEM_PERMISSAO"
      );
    }
  }

  let polosPermitidos: number[] | null =
    null;

  if (!usuario.acessoTodosPolos) {
    const acessos =
      await prisma.userPolo.findMany({
        where: {
          userId: usuario.id,
          instituicaoId:
            usuario.instituicaoId,
          ativo: true,
        },
        select: {
          poloId: true,
        },
      });

    polosPermitidos = acessos.map(
      (item) => item.poloId
    );
  }

  return {
    usuarioId: usuario.id,
    instituicaoId:
      usuario.instituicaoId,
    acessoTodosPolos:
      usuario.acessoTodosPolos,
    polosPermitidos,
  };
}

function filtroPoloPermitido(
  polosPermitidos: number[] | null
): Prisma.AtividadeExternaWhereInput {
  if (polosPermitidos === null) {
    return {};
  }

  if (polosPermitidos.length === 0) {
    return {
      id: -1,
    };
  }

  return {
    poloId: {
      in: polosPermitidos,
    },
  };
}

export async function GET(
  request: NextRequest
) {
  try {
    const contexto =
      await carregarContextoAcesso(
        PERMISSAO_VER
      );

    const { searchParams } =
      new URL(request.url);

    const pagina = Math.max(
      1,
      Number(
        searchParams.get("pagina") || 1
      ) || 1
    );

    const limite = Math.min(
      100,
      Math.max(
        1,
        Number(
          searchParams.get("limite") ||
          24
        ) || 24
      )
    );

    const busca =
      searchParams
        .get("busca")
        ?.trim() || "";

    const statusParam =
      searchParams
        .get("status")
        ?.trim()
        .toUpperCase() || "";

    const tipoParam =
      searchParams
        .get("tipo")
        ?.trim()
        .toUpperCase() || "";

    const poloIdParam =
      searchParams.get("poloId");

    const poloId = poloIdParam
      ? inteiroOpcional(poloIdParam)
      : null;

    if (
      statusParam &&
      !STATUS_ATIVIDADE.has(
        statusParam as StatusAtividadeExterna
      )
    ) {
      throw new ErroHttp(
        400,
        "Status de atividade externa inválido.",
        "STATUS_INVALIDO"
      );
    }

    if (
      tipoParam &&
      !TIPOS_ATIVIDADE.has(
        tipoParam as TipoAtividadeExterna
      )
    ) {
      throw new ErroHttp(
        400,
        "Tipo de atividade externa inválido.",
        "TIPO_INVALIDO"
      );
    }

    if (
      poloId &&
      contexto.polosPermitidos !==
      null &&
      !contexto.polosPermitidos.includes(
        poloId
      )
    ) {
      throw new ErroHttp(
        403,
        "Usuário sem acesso a este polo.",
        "POLO_SEM_ACESSO"
      );
    }

    const where: Prisma.AtividadeExternaWhereInput =
    {
      instituicaoId:
        contexto.instituicaoId,

      ...filtroPoloPermitido(
        contexto.polosPermitidos
      ),

      ...(poloId
        ? {
          poloId,
        }
        : {}),

      ...(statusParam
        ? {
          status:
            statusParam as StatusAtividadeExterna,
        }
        : {}),

      ...(tipoParam
        ? {
          tipo:
            tipoParam as TipoAtividadeExterna,
        }
        : {}),

      ...(busca
        ? {
          OR: [
            {
              titulo: {
                contains: busca,
                mode: "insensitive",
              },
            },
            {
              destinoNome: {
                contains: busca,
                mode: "insensitive",
              },
            },
            {
              cidadeDestino: {
                contains: busca,
                mode: "insensitive",
              },
            },
            {
              paisDestino: {
                contains: busca,
                mode: "insensitive",
              },
            },
          ],
        }
        : {}),
    };

    const [total, atividades] =
      await prisma.$transaction([
        prisma.atividadeExterna.count({
          where,
        }),

        prisma.atividadeExterna.findMany({
          where,

          skip:
            (pagina - 1) * limite,

          take: limite,

          orderBy: [
            {
              saidaEm: "desc",
            },
            {
              createdAt: "desc",
            },
          ],

          include: {
            polo: {
              select: {
                id: true,
                nome: true,
                codigo: true,
              },
            },

            responsavelPrincipal: {
              select: {
                id: true,
                nome: true,
                email: true,

                funcionario: {
                  select: {
                    nome: true,
                  },
                },
              },
            },

            turmas: {
              select: {
                id: true,
                turma: {
                  select: {
                    id: true,
                    nome: true,
                    codigo: true,
                    periodoLetivo: true,
                    turno: true,
                  },
                },
              },
            },

            _count: {
              select: {
                participantes: true,
                equipe: true,
                autorizacoes: true,
                trechos: true,
                documentos: true,
                riscos: true,
                checkpoints: true,
              },
            },
          },
        }),
      ]);

    return NextResponse.json({
      ok: true,

      atividades,

      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas:
          total === 0
            ? 0
            : Math.ceil(
              total / limite
            ),
      },
    });
  } catch (error) {
    return respostaErro(error);
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const contexto =
      await carregarContextoAcesso(
        PERMISSAO_GERENCIAR
      );

    const body = await request.json();

    const titulo = String(
      body?.titulo || ""
    ).trim();

    if (!titulo) {
      throw new ErroHttp(
        400,
        "O título é obrigatório.",
        "TITULO_OBRIGATORIO"
      );
    }

    if (titulo.length > 200) {
      throw new ErroHttp(
        400,
        "O título deve ter no máximo 200 caracteres.",
        "TITULO_MUITO_LONGO"
      );
    }

    const tipoRaw = String(
      body?.tipo || ""
    )
      .trim()
      .toUpperCase();

    if (
      !TIPOS_ATIVIDADE.has(
        tipoRaw as TipoAtividadeExterna
      )
    ) {
      throw new ErroHttp(
        400,
        "Selecione um tipo de atividade externa válido.",
        "TIPO_INVALIDO"
      );
    }

    const tipo =
      tipoRaw as TipoAtividadeExterna;

    const poloId =
      inteiroOpcional(body?.poloId);

    if (
      !contexto.acessoTodosPolos
    ) {
      if (!poloId) {
        throw new ErroHttp(
          400,
          "Selecione um polo para esta atividade.",
          "POLO_OBRIGATORIO"
        );
      }

      if (
        !contexto.polosPermitidos?.includes(
          poloId
        )
      ) {
        throw new ErroHttp(
          403,
          "Usuário sem acesso ao polo selecionado.",
          "POLO_SEM_ACESSO"
        );
      }
    }

    if (poloId) {
      const polo =
        await prisma.polo.findFirst({
          where: {
            id: poloId,
            instituicaoId:
              contexto.instituicaoId,
            ativo: true,
          },
          select: {
            id: true,
          },
        });

      if (!polo) {
        throw new ErroHttp(
          400,
          "Polo não encontrado ou inativo.",
          "POLO_INVALIDO"
        );
      }
    }

    const saidaEm = dataOpcional(
      body?.saidaEm,
      "saidaEm"
    );

    const retornoPrevistoEm =
      dataOpcional(
        body?.retornoPrevistoEm,
        "retornoPrevistoEm"
      );

    if (
      saidaEm &&
      retornoPrevistoEm &&
      retornoPrevistoEm <= saidaEm
    ) {
      throw new ErroHttp(
        400,
        "O retorno previsto deve ocorrer depois da saída.",
        "PERIODO_INVALIDO"
      );
    }

    const capacidadeMaxima =
      inteiroOpcional(
        body?.capacidadeMaxima
      );

    const valorRecebido =
      body?.valorParticipante;

    let valorParticipante:
      | Prisma.Decimal
      | null = null;

    if (
      valorRecebido !== null &&
      valorRecebido !== undefined &&
      valorRecebido !== ""
    ) {
      try {
        valorParticipante =
          new Prisma.Decimal(
            String(valorRecebido)
              .replace(",", ".")
              .trim()
          );
      } catch {
        throw new ErroHttp(
          400,
          "Valor por participante inválido.",
          "VALOR_INVALIDO"
        );
      }

      if (
        valorParticipante.lessThan(0)
      ) {
        throw new ErroHttp(
          400,
          "O valor por participante não pode ser negativo.",
          "VALOR_INVALIDO"
        );
      }
    }

    const moedaRaw =
      textoOpcional(body?.moeda, 3);

    const moeda = moedaRaw
      ? moedaRaw.toUpperCase()
      : null;

    if (
      moeda &&
      !/^[A-Z]{3}$/.test(moeda)
    ) {
      throw new ErroHttp(
        400,
        "Código de moeda inválido.",
        "MOEDA_INVALIDA"
      );
    }

    const responsavelPrincipalUserId =
      inteiroOpcional(
        body?.responsavelPrincipalUserId
      ) || contexto.usuarioId;

    const responsavel =
      await prisma.user.findFirst({
        where: {
          id:
            responsavelPrincipalUserId,
          instituicaoId:
            contexto.instituicaoId,
          ativo: true,
        },
        select: {
          id: true,
        },
      });

    if (!responsavel) {
      throw new ErroHttp(
        400,
        "Responsável principal não encontrado nesta instituição.",
        "RESPONSAVEL_INVALIDO"
      );
    }

    const turmaIds = normalizarIds(
      body?.turmaIds
    );

    if (turmaIds.length > 0) {
      const turmas =
        await prisma.turma.findMany({
          where: {
            instituicaoId:
              contexto.instituicaoId,

            id: {
              in: turmaIds,
            },

            ativa: true,

            ...(contexto
              .polosPermitidos !== null
              ? {
                poloId: {
                  in:
                    contexto.polosPermitidos,
                },
              }
              : {}),
          },
          select: {
            id: true,
          },
        });

      if (
        turmas.length !==
        turmaIds.length
      ) {
        throw new ErroHttp(
          400,
          "Uma ou mais turmas são inválidas, estão inativas ou não pertencem ao escopo do usuário.",
          "TURMA_INVALIDA"
        );
      }
    }

    const atividade =
      await prisma.$transaction(
        async (tx) => {
          const criada =
            await tx.atividadeExterna.create(
              {
                data: {
                  instituicaoId:
                    contexto.instituicaoId,

                  poloId,

                  titulo,

                  tipo,

                  status:
                    StatusAtividadeExterna.RASCUNHO,

                  descricao:
                    textoOpcional(
                      body?.descricao,
                      10000
                    ),

                  objetivoPedagogico:
                    textoOpcional(
                      body?.objetivoPedagogico,
                      10000
                    ),

                  curricular: booleano(
                    body?.curricular,
                    false
                  ),

                  obrigatoria: booleano(
                    body?.obrigatoria,
                    false
                  ),

                  internacional:
                    booleano(
                      body?.internacional,
                      false
                    ),

                  destinoNome:
                    textoOpcional(
                      body?.destinoNome,
                      300
                    ),

                  enderecoDestino:
                    textoOpcional(
                      body?.enderecoDestino,
                      500
                    ),

                  cidadeDestino:
                    textoOpcional(
                      body?.cidadeDestino,
                      160
                    ),

                  regiaoDestino:
                    textoOpcional(
                      body?.regiaoDestino,
                      160
                    ),

                  paisDestino:
                    textoOpcional(
                      body?.paisDestino,
                      160
                    ),

                  fusoHorario:
                    textoOpcional(
                      body?.fusoHorario,
                      100
                    ),

                  saidaEm,
                  retornoPrevistoEm,

                  capacidadeMaxima,

                  valorParticipante,
                  moeda,

                  exigeAutorizacaoResponsavel:
                    booleano(
                      body?.exigeAutorizacaoResponsavel,
                      true
                    ),

                  exigePagamento:
                    booleano(
                      body?.exigePagamento,
                      false
                    ),

                  exigeCheckin:
                    booleano(
                      body?.exigeCheckin,
                      true
                    ),

                  criadoPorId:
                    contexto.usuarioId,

                  responsavelPrincipalUserId,
                },
              }
            );

          if (
            turmaIds.length > 0
          ) {
            await tx
              .atividadeExternaTurma
              .createMany({
                data: turmaIds.map(
                  (turmaId) => ({
                    instituicaoId:
                      contexto.instituicaoId,

                    atividadeExternaId:
                      criada.id,

                    turmaId,
                  })
                ),

                skipDuplicates: true,
              });
          }

          return tx.atividadeExterna.findFirst(
            {
              where: {
                id: criada.id,
                instituicaoId:
                  contexto.instituicaoId,
              },

              include: {
                polo: {
                  select: {
                    id: true,
                    nome: true,
                    codigo: true,
                  },
                },

                responsavelPrincipal: {
                  select: {
                    id: true,
                    nome: true,
                    email: true,

                    funcionario: {
                      select: {
                        nome: true,
                      },
                    },
                  },
                },

                turmas: {
                  select: {
                    turma: {
                      select: {
                        id: true,
                        nome: true,
                        codigo: true,
                        periodoLetivo:
                          true,
                        turno: true,
                      },
                    },
                  },
                },
              },
            }
          );
        }
      );

    if (!atividade) {
      throw new ErroHttp(
        500,
        "A atividade foi criada, mas não pôde ser carregada.",
        "ATIVIDADE_NAO_CARREGADA"
      );
    }

    return NextResponse.json(
      {
        ok: true,
        atividade,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return respostaErro(error);
  }
}