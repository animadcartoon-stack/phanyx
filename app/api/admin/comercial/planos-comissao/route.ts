import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  temPermissao,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function textoOuNull(valor: unknown) {
  const texto = String(valor ?? "").trim();
  return texto || null;
}

function dataOuNull(valor: unknown) {
  if (!valor) return null;

  const data = new Date(String(valor));

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}

function booleanoOuPadrao(
  valor: unknown,
  padrao: boolean
) {
  if (typeof valor === "boolean") {
    return valor;
  }

  return padrao;
}

function planoEstaVigente(
  inicioVigencia: Date | null,
  fimVigencia: Date | null
) {
  const agora = new Date();

  if (inicioVigencia && inicioVigencia > agora) {
    return false;
  }

  if (fimVigencia && fimVigencia < agora) {
    return false;
  }

  return true;
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    if (
      !temPermissao(
        user,
        "comercial.configuracoes.gerenciar"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para gerenciar as configurações comerciais.",
        },
        { status: 403 }
      );
    }

    const instituicaoId = user.instituicaoId;
    const agora = new Date();

    const planos =
      await prisma.planoComissaoRH.findMany({
        where: {
          instituicaoId,
        },

        include: {
          criadoPor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },

          regras: {
            include: {
              curso: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
            orderBy: [
              {
                ordem: "asc",
              },
              {
                criadoEm: "asc",
              },
            ],
          },

          funcionarios: {
            where: {
              ativo: true,
              inicioVigencia: {
                lte: agora,
              },
              OR: [
                {
                  fimVigencia: null,
                },
                {
                  fimVigencia: {
                    gte: agora,
                  },
                },
              ],
            },

            include: {
              funcionario: {
                select: {
                  id: true,
                  nome: true,
                  cargo: true,
                  ativo: true,
                  statusFuncionario: true,

                  departamento: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                },
              },
            },

            orderBy: {
              inicioVigencia: "desc",
            },
          },

          _count: {
            select: {
              regras: true,
              funcionarios: true,
              lancamentos: true,
            },
          },
        },

        orderBy: [
          {
            ativo: "desc",
          },
          {
            nome: "asc",
          },
        ],
      });

    return NextResponse.json(
      planos.map((plano) => {
        const regrasAtivas = plano.regras.filter(
          (regra) => regra.ativo
        );

        const possuiRegraAtiva =
          regrasAtivas.length > 0;

        const vigente = planoEstaVigente(
          plano.inicioVigencia,
          plano.fimVigencia
        );

        return {
          ...plano,

          resumo: {
            vigente,
            configurado:
              plano.ativo &&
              vigente &&
              possuiRegraAtiva,

            quantidadeRegras:
              plano._count.regras,

            quantidadeRegrasAtivas:
              regrasAtivas.length,

            quantidadeVendedoresAtivos:
              plano.funcionarios.length,

            quantidadeVinculos:
              plano._count.funcionarios,

            quantidadeLancamentos:
              plano._count.lancamentos,
          },
        };
      })
    );
  } catch (error) {
    console.error(
      "Erro ao listar planos de comissão:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar os planos de comissão.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    if (
      !temPermissao(
        user,
        "comercial.configuracoes.gerenciar"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para criar planos de comissão.",
        },
        { status: 403 }
      );
    }

    const instituicaoId = user.instituicaoId;
    const body = await request.json();

    const nome = String(body?.nome ?? "").trim();
    const descricao = textoOuNull(body?.descricao);

    const inicioVigencia = dataOuNull(
      body?.inicioVigencia
    );

    const fimVigencia = dataOuNull(
      body?.fimVigencia
    );

    const ativo = booleanoOuPadrao(
      body?.ativo,
      true
    );

    const exigePagamentoConfirmado =
      booleanoOuPadrao(
        body?.exigePagamentoConfirmado,
        true
      );

    const permiteCompartilhamento =
      booleanoOuPadrao(
        body?.permiteCompartilhamento,
        false
      );

    if (!nome) {
      return NextResponse.json(
        {
          error:
            "Informe o nome do plano de comissão.",
        },
        { status: 400 }
      );
    }

    if (
      body?.inicioVigencia &&
      !inicioVigencia
    ) {
      return NextResponse.json(
        {
          error:
            "A data inicial de vigência é inválida.",
        },
        { status: 400 }
      );
    }

    if (
      body?.fimVigencia &&
      !fimVigencia
    ) {
      return NextResponse.json(
        {
          error:
            "A data final de vigência é inválida.",
        },
        { status: 400 }
      );
    }

    if (
      inicioVigencia &&
      fimVigencia &&
      fimVigencia < inicioVigencia
    ) {
      return NextResponse.json(
        {
          error:
            "A data final não pode ser anterior à data inicial.",
        },
        { status: 400 }
      );
    }

    const planoComMesmoNome =
      await prisma.planoComissaoRH.findFirst({
        where: {
          instituicaoId,
          nome: {
            equals: nome,
            mode: "insensitive",
          },
        },

        select: {
          id: true,
          nome: true,
        },
      });

    if (planoComMesmoNome) {
      return NextResponse.json(
        {
          error:
            "Já existe um plano de comissão com esse nome.",
        },
        { status: 409 }
      );
    }

    const plano =
      await prisma.planoComissaoRH.create({
        data: {
          instituicaoId,
          criadoPorId: user.id,

          nome,
          descricao,

          ativo,
          inicioVigencia,
          fimVigencia,

          exigePagamentoConfirmado,
          permiteCompartilhamento,
        },

        include: {
          criadoPor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },

          regras: true,
          funcionarios: true,
        },
      });

    return NextResponse.json(
      {
        message:
          "Plano de comissão criado com sucesso.",
        plano,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Erro ao criar plano de comissão:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível criar o plano de comissão.",
      },
      { status: 500 }
    );
  }
}