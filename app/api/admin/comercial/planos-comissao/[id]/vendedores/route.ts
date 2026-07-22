import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  temAlgumaPermissao,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
  params: {
    id: string;
  };
};

function dataObrigatoria(valor: unknown) {
  if (!valor) return null;

  const data = new Date(String(valor));

  return Number.isNaN(data.getTime()) ? null : data;
}

function dataOpcional(valor: unknown) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  return dataObrigatoria(valor);
}

function textoOuNull(valor: unknown) {
  const texto = String(valor ?? "").trim();
  return texto || null;
}

function periodosSeSobrepoem(params: {
  inicioA: Date;
  fimA: Date | null;
  inicioB: Date;
  fimB: Date | null;
}) {
  const {
    inicioA,
    fimA,
    inicioB,
    fimB,
  } = params;

  const fimAEmMs =
    fimA?.getTime() ?? Number.POSITIVE_INFINITY;

  const fimBEmMs =
    fimB?.getTime() ?? Number.POSITIVE_INFINITY;

  return (
    inicioA.getTime() <= fimBEmMs &&
    inicioB.getTime() <= fimAEmMs
  );
}

function podeGerenciarVendedores(
  user: Awaited<ReturnType<typeof getUserFromToken>>
) {
  return temAlgumaPermissao(user, [
    "comercial.configuracoes.gerenciar",
    "comercial.vendedores.gerenciar",
  ]);
}

export async function GET(
  _request: Request,
  { params }: ContextoRota
) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    if (!podeGerenciarVendedores(user)) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para gerenciar vendedores.",
        },
        { status: 403 }
      );
    }

    const planoId = Number(params.id);

    if (
      !Number.isInteger(planoId) ||
      planoId <= 0
    ) {
      return NextResponse.json(
        { error: "Plano inválido." },
        { status: 400 }
      );
    }

    const instituicaoId = user.instituicaoId;

    const plano =
      await prisma.planoComissaoRH.findFirst({
        where: {
          id: planoId,
          instituicaoId,
        },
        select: {
          id: true,
          nome: true,
          ativo: true,
          inicioVigencia: true,
          fimVigencia: true,
          _count: {
            select: {
              regras: {
                where: {
                  ativo: true,
                },
              },
            },
          },
        },
      });

    if (!plano) {
      return NextResponse.json(
        {
          error:
            "Plano de comissão não encontrado.",
        },
        { status: 404 }
      );
    }

    const [funcionarios, vinculos] =
      await Promise.all([
        prisma.funcionario.findMany({
          where: {
            instituicaoId,
            ativo: true,
            statusFuncionario: "ATIVO",
          },
          select: {
            id: true,
            nome: true,
            cargo: true,
            departamento: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          orderBy: {
            nome: "asc",
          },
        }),

        prisma.funcionarioPlanoComissaoRH.findMany({
          where: {
            planoId,
            instituicaoId,
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
            criadoPor: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
          orderBy: [
            {
              ativo: "desc",
            },
            {
              inicioVigencia: "desc",
            },
          ],
        }),
      ]);

    return NextResponse.json({
      plano: {
        id: plano.id,
        nome: plano.nome,
        ativo: plano.ativo,
        inicioVigencia: plano.inicioVigencia,
        fimVigencia: plano.fimVigencia,
        quantidadeRegrasAtivas:
          plano._count.regras,
        podeReceberVendedores:
          plano.ativo &&
          plano._count.regras > 0,
      },
      funcionarios,
      vinculos,
    });
  } catch (error) {
    console.error(
      "Erro ao carregar vínculos de vendedores:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar os vendedores do plano.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: ContextoRota
) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    if (!podeGerenciarVendedores(user)) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para vincular vendedores.",
        },
        { status: 403 }
      );
    }

    const instituicaoId = user.instituicaoId;
    const planoId = Number(params.id);

    if (
      !Number.isInteger(planoId) ||
      planoId <= 0
    ) {
      return NextResponse.json(
        { error: "Plano inválido." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const funcionarioId = Number(
      body?.funcionarioId
    );

    const inicioVigencia = dataObrigatoria(
      body?.inicioVigencia
    );

    const fimVigencia = dataOpcional(
      body?.fimVigencia
    );

    const observacoes = textoOuNull(
      body?.observacoes
    );

    if (
      !Number.isInteger(funcionarioId) ||
      funcionarioId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione um funcionário válido.",
        },
        { status: 400 }
      );
    }

    if (!inicioVigencia) {
      return NextResponse.json(
        {
          error:
            "Informe o início da vigência.",
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
            "A data final da vigência é inválida.",
        },
        { status: 400 }
      );
    }

    if (
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

    const plano =
      await prisma.planoComissaoRH.findFirst({
        where: {
          id: planoId,
          instituicaoId,
        },
        select: {
          id: true,
          nome: true,
          ativo: true,
          inicioVigencia: true,
          fimVigencia: true,
          regras: {
            where: {
              ativo: true,
            },
            select: {
              id: true,
            },
            take: 1,
          },
        },
      });

    if (!plano) {
      return NextResponse.json(
        {
          error:
            "Plano de comissão não encontrado.",
        },
        { status: 404 }
      );
    }

    if (!plano.ativo) {
      return NextResponse.json(
        {
          error:
            "Não é possível vincular vendedores a um plano inativo.",
        },
        { status: 400 }
      );
    }

    if (plano.regras.length === 0) {
      return NextResponse.json(
        {
          error:
            "Cadastre pelo menos uma regra ativa antes de vincular vendedores.",
        },
        { status: 400 }
      );
    }

    if (
      plano.inicioVigencia &&
      inicioVigencia < plano.inicioVigencia
    ) {
      return NextResponse.json(
        {
          error:
            "O vínculo não pode começar antes da vigência do plano.",
        },
        { status: 400 }
      );
    }

    if (
      plano.fimVigencia &&
      (!fimVigencia ||
        fimVigencia > plano.fimVigencia)
    ) {
      return NextResponse.json(
        {
          error:
            "O vínculo não pode ultrapassar o fim da vigência do plano.",
        },
        { status: 400 }
      );
    }

    const funcionario =
      await prisma.funcionario.findFirst({
        where: {
          id: funcionarioId,
          instituicaoId,
          ativo: true,
          statusFuncionario: "ATIVO",
        },
        select: {
          id: true,
          nome: true,
          cargo: true,
          departamento: {
            select: {
              nome: true,
            },
          },
        },
      });

    if (!funcionario) {
      return NextResponse.json(
        {
          error:
            "O funcionário não pertence à instituição ou não está ativo.",
        },
        { status: 400 }
      );
    }

    const vinculosExistentes =
      await prisma.funcionarioPlanoComissaoRH.findMany({
        where: {
          instituicaoId,
          funcionarioId,
          ativo: true,
        },
        select: {
          id: true,
          planoId: true,
          inicioVigencia: true,
          fimVigencia: true,
          planoNomeSnapshot: true,
          plano: {
            select: {
              nome: true,
            },
          },
        },
      });

    const conflito = vinculosExistentes.find(
      (vinculo) =>
        periodosSeSobrepoem({
          inicioA: inicioVigencia,
          fimA: fimVigencia,
          inicioB: vinculo.inicioVigencia,
          fimB: vinculo.fimVigencia,
        })
    );

    if (conflito) {
      return NextResponse.json(
        {
          error:
            `O funcionário já possui um plano de comissão ativo nesse período: ${
              conflito.planoNomeSnapshot ||
              conflito.plano.nome
            }. Encerre o vínculo anterior antes de criar outro.`,
        },
        { status: 409 }
      );
    }

    const vinculo =
      await prisma.funcionarioPlanoComissaoRH.create({
        data: {
          instituicaoId,
          funcionarioId,
          planoId,
          criadoPorId: user.id,
          inicioVigencia,
          fimVigencia,
          ativo: true,
          planoNomeSnapshot: plano.nome,
          observacoes,
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
              departamento: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
          plano: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        message:
          "Vendedor vinculado ao plano de comissão com sucesso.",
        vinculo,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Erro ao vincular vendedor ao plano:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível vincular o vendedor ao plano de comissão.",
      },
      { status: 500 }
    );
  }
}