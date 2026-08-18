import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  type UsuarioLogado,
} from "@/lib/server-auth";

const STATUS_VALIDOS = [
  "NOVO",
  "CONTATO",
  "PROPOSTA",
  "FECHADO",
  "PERDIDO",
] as const;

const PRIORIDADES_VALIDAS = ["BAIXA", "MEDIA", "ALTA"] as const;

function ehMasterReal(user: UsuarioLogado) {
  return (
    user.isMasterAdmin === true &&
    user.impersonacao === false &&
    user.email.trim().toLowerCase() === "academicophanyx@gmail.com"
  );
}

function podeGerenciar(user: UsuarioLogado | null) {
  if (!user) return false;
  if (ehMasterReal(user)) return true;

  return ["ADMIN", "SECRETARIA", "FINANCEIRO"].includes(user.role);
}

function normalizarStatus(valor: unknown) {
  const texto = String(valor || "")
    .trim()
    .toUpperCase();

  return STATUS_VALIDOS.includes(
    texto as (typeof STATUS_VALIDOS)[number]
  )
    ? texto
    : "NOVO";
}

function normalizarPrioridade(valor: unknown) {
  const texto = String(valor || "")
    .trim()
    .toUpperCase();

  return PRIORIDADES_VALIDAS.includes(
    texto as (typeof PRIORIDADES_VALIDAS)[number]
  )
    ? texto
    : "MEDIA";
}

function textoOuNull(valor: unknown) {
  const texto = String(valor ?? "").trim();
  return texto || null;
}

function normalizarOrigem(valor: unknown) {
  const texto = String(valor ?? "")
    .trim()
    .toUpperCase();

  return texto || "ADMIN_MANUAL";
}

function lerIdOpcional(valor: unknown) {
  if (valor === undefined || valor === null || valor === "") {
    return {
      valido: true,
      valor: null as number | null,
    };
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    return {
      valido: false,
      valor: null as number | null,
    };
  }

  return {
    valido: true,
    valor: numero,
  };
}

function lerValorMonetarioOpcional(valor: unknown) {
  if (valor === undefined || valor === null || valor === "") {
    return {
      valido: true,
      valor: null as number | null,
    };
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero < 0) {
    return {
      valido: false,
      valor: null as number | null,
    };
  }

  return {
    valido: true,
    valor: numero,
  };
}

function lerDataOpcional(valor: unknown) {
  if (valor === undefined || valor === null || valor === "") {
    return {
      valido: true,
      valor: null as Date | null,
    };
  }

  const data = new Date(String(valor));

  if (Number.isNaN(data.getTime())) {
    return {
      valido: false,
      valor: null as Date | null,
    };
  }

  return {
    valido: true,
    valor: data,
  };
}

function serializarLead(
  lead: any
) {
  const captacaoMaisRecente =
    Array.isArray(
      lead.submissoesCaptacao
    ) &&
      lead.submissoesCaptacao
        .length > 0
      ? lead
        .submissoesCaptacao[0]
      : null;

  return {
    ...lead,

    responsavelNome:
      lead
        .responsavelFuncionario
        ?.nome ||
      lead
        .responsavelNomeSnapshot ||
      null,

    instituicaoId:
      lead
        .instituicaoInteressadaId ??
      null,

    captacaoMaisRecente,

    submissoesCaptacao:
      undefined,
  };
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!podeGerenciar(user)) {
      return NextResponse.json(
        { error: "Sem permissão." },
        { status: 403 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const masterReal = ehMasterReal(user);

    if (!masterReal && !user.instituicaoId) {
      return NextResponse.json(
        {
          error:
            "O usuário não está vinculado a uma instituição.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const q = String(searchParams.get("q") || "").trim();
    const origem = String(
      searchParams.get("origem") || ""
    ).trim();

    const leads = await prisma.lead.findMany({
      where: {
        AND: [
          masterReal
            ? {
              instituicaoGestoraId: null,
              tipo: "PHANYX",
            }
            : {
              instituicaoGestoraId: user.instituicaoId,
              tipo: "INSTITUICAO",
            },

          q
            ? {
              OR: [
                {
                  nome: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  telefone: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  instituicaoNome: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  cargo: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  origem: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  tipo: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  interesse: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  observacoes: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  responsavelNomeSnapshot: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  responsavelFuncionario: {
                    nome: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
            : {},

          origem
            ? {
              origem,
            }
            : {},
        ],
      },

      include: {
        responsavelFuncionario: {
          select: {
            id: true,
            nome: true,
            cargo: true,
            departamentoId: true,
            ativo: true,
            statusFuncionario: true,
          },
        },

        instituicaoInteressada: {
          select: {
            id: true,
            nome: true,
            ativo: true,
          },
        },

        cursoInteresse: {
          select: {
            id: true,
            nome: true,
          },
        },

        poloInteresse: {
          select: {
            id: true,
            nome: true,
          },
        },

        submissoesCaptacao: {
          orderBy: {
            recebidoEm: "desc",
          },

          take: 1,

          select: {
            id: true,
            recebidoEm: true,

            consentimentoLgpd: true,
            consentimentoEm: true,

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

            formulario: {
              select: {
                id: true,
                nome: true,
                titulo: true,
              },
            },
          },
        },
      },

      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json(
      leads.map(serializarLead)
    );
  } catch (error) {
    console.error("Erro ao listar leads admin:", error);

    return NextResponse.json(
      {
        error: "Não foi possível listar os leads.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!podeGerenciar(user)) {
      return NextResponse.json(
        { error: "Sem permissão." },
        { status: 403 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const masterReal = ehMasterReal(user);

    if (!masterReal && !user.instituicaoId) {
      return NextResponse.json(
        {
          error:
            "O usuário não está vinculado a uma instituição.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const nome = String(body?.nome || "").trim();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    if (!nome || !email) {
      return NextResponse.json(
        {
          error: "Nome e e-mail são obrigatórios.",
        },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        {
          error: "Informe um e-mail válido.",
        },
        { status: 400 }
      );
    }

    const valorEstimado = lerValorMonetarioOpcional(
      body?.valorEstimado
    );

    if (!valorEstimado.valido) {
      return NextResponse.json(
        {
          error:
            "O valor estimado precisa ser um número válido e não negativo.",
        },
        { status: 400 }
      );
    }

    const proximoContatoEm = lerDataOpcional(
      body?.proximoContatoEm
    );

    if (!proximoContatoEm.valido) {
      return NextResponse.json(
        {
          error: "A data do próximo contato é inválida.",
        },
        { status: 400 }
      );
    }

    const ultimoContatoEm = lerDataOpcional(
      body?.ultimoContatoEm
    );

    if (!ultimoContatoEm.valido) {
      return NextResponse.json(
        {
          error: "A data do último contato é inválida.",
        },
        { status: 400 }
      );
    }

    const responsavelInformado = lerIdOpcional(
      body?.responsavelFuncionarioId
    );

    if (!responsavelInformado.valido) {
      return NextResponse.json(
        {
          error: "O funcionário responsável informado é inválido.",
        },
        { status: 400 }
      );
    }

    let responsavelFuncionario:
      | {
        id: number;
        nome: string;
      }
      | null = null;

    if (responsavelInformado.valor) {
      if (masterReal) {
        return NextResponse.json(
          {
            error:
              "O CRM global da PHANYX ainda não possui uma instituição gestora para vincular funcionários responsáveis.",
          },
          { status: 400 }
        );
      }

      responsavelFuncionario =
        await prisma.funcionario.findFirst({
          where: {
            id: responsavelInformado.valor,
            instituicaoId: user.instituicaoId!,
            ativo: true,
            statusFuncionario: "ATIVO",
          },
          select: {
            id: true,
            nome: true,
          },
        });

      if (!responsavelFuncionario) {
        return NextResponse.json(
          {
            error:
              "O funcionário responsável não foi encontrado ou não está ativo nesta instituição.",
          },
          { status: 400 }
        );
      }
    }

    let instituicaoInteressadaId: number | null = null;

    if (masterReal) {
      const instituicaoInteressadaInformada =
        lerIdOpcional(
          body?.instituicaoInteressadaId ??
          body?.instituicaoId
        );

      if (!instituicaoInteressadaInformada.valido) {
        return NextResponse.json(
          {
            error:
              "A instituição interessada informada é inválida.",
          },
          { status: 400 }
        );
      }

      instituicaoInteressadaId =
        instituicaoInteressadaInformada.valor;

      if (instituicaoInteressadaId) {
        const instituicaoExiste =
          await prisma.instituicao.findUnique({
            where: {
              id: instituicaoInteressadaId,
            },
            select: {
              id: true,
            },
          });

        if (!instituicaoExiste) {
          return NextResponse.json(
            {
              error:
                "A instituição interessada informada não foi encontrada.",
            },
            { status: 400 }
          );
        }
      }
    }

    const lead = await prisma.lead.create({
      data: {
        instituicaoGestoraId: masterReal
          ? null
          : user.instituicaoId,

        instituicaoInteressadaId: masterReal
          ? instituicaoInteressadaId
          : null,

        responsavelFuncionarioId:
          responsavelFuncionario?.id || null,

        responsavelNomeSnapshot:
          responsavelFuncionario?.nome || null,

        criadoPorId: user.id,
        atualizadoPorId: user.id,

        nome,
        email,

        telefone: textoOuNull(body?.telefone),

        instituicaoNome: textoOuNull(
          body?.instituicaoNome
        ),

        cargo: textoOuNull(body?.cargo),

        origem: normalizarOrigem(body?.origem),

        tipo: masterReal
          ? "PHANYX"
          : "INSTITUICAO",

        interesse: textoOuNull(body?.interesse),

        observacoes: textoOuNull(
          body?.observacoes
        ),

        status: normalizarStatus(body?.status),

        prioridade: normalizarPrioridade(
          body?.prioridade
        ),

        valorEstimado: valorEstimado.valor,

        proximoContatoEm:
          proximoContatoEm.valor,

        ultimoContatoEm:
          ultimoContatoEm.valor,
      },

      include: {
        responsavelFuncionario: {
          select: {
            id: true,
            nome: true,
            cargo: true,
            departamentoId: true,
            ativo: true,
            statusFuncionario: true,
          },
        },

        instituicaoInteressada: {
          select: {
            id: true,
            nome: true,
            ativo: true,
          },
        },
      },
    });

    return NextResponse.json(
      serializarLead(lead),
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar lead admin:", error);

    return NextResponse.json(
      {
        error: "Não foi possível criar o lead.",
      },
      { status: 500 }
    );
  }
}