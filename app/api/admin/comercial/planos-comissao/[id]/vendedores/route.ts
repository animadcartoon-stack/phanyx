import { randomUUID } from "crypto";
import { OrigemVinculoPlanoComissaoRH } from "@prisma/client";
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

type TipoVinculoSolicitado =
  | "INDIVIDUAL"
  | "DEPARTAMENTO";

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
  user: Awaited<ReturnType<typeof getUserFromToken>>,
) {
  return temAlgumaPermissao(user, [
    "comercial.configuracoes.gerenciar",
    "comercial.vendedores.gerenciar",
  ]);
}

function normalizarTipoVinculo(
  body: any,
): TipoVinculoSolicitado | null {
  const valor = String(
    body?.tipoVinculo ||
      (body?.departamentoId
        ? "DEPARTAMENTO"
        : "INDIVIDUAL"),
  ).toUpperCase();

  if (
    valor !== "INDIVIDUAL" &&
    valor !== "DEPARTAMENTO"
  ) {
    return null;
  }

  return valor;
}

export async function GET(
  _request: Request,
  { params }: ContextoRota,
) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 },
      );
    }

    if (!podeGerenciarVendedores(user)) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para gerenciar participantes de comissão.",
        },
        { status: 403 },
      );
    }

    const planoId = Number(params.id);

    if (
      !Number.isInteger(planoId) ||
      planoId <= 0
    ) {
      return NextResponse.json(
        { error: "Plano inválido." },
        { status: 400 },
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
        { status: 404 },
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

    const departamentosMap = new Map<
      number,
      {
        id: number;
        nome: string;
        quantidadeFuncionarios: number;
      }
    >();

    for (const funcionario of funcionarios) {
      const departamento = funcionario.departamento;

      if (!departamento) continue;

      const existente = departamentosMap.get(
        departamento.id,
      );

      if (existente) {
        existente.quantidadeFuncionarios += 1;
      } else {
        departamentosMap.set(departamento.id, {
          id: departamento.id,
          nome: departamento.nome,
          quantidadeFuncionarios: 1,
        });
      }
    }

    const departamentos = Array.from(
      departamentosMap.values(),
    ).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );

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
      departamentos,
      vinculos,
    });
  } catch (error) {
    console.error(
      "Erro ao carregar vínculos de participantes:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar os participantes do plano.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: ContextoRota,
) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 },
      );
    }

    if (!podeGerenciarVendedores(user)) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para vincular participantes.",
        },
        { status: 403 },
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
        { status: 400 },
      );
    }

    const body = await request.json();

    const tipoVinculo =
      normalizarTipoVinculo(body);

    const funcionarioId = Number(
      body?.funcionarioId,
    );

    const departamentoId = Number(
      body?.departamentoId,
    );

    const inicioVigencia = dataObrigatoria(
      body?.inicioVigencia,
    );

    const fimVigencia = dataOpcional(
      body?.fimVigencia,
    );

    const observacoes = textoOuNull(
      body?.observacoes,
    );

    if (!tipoVinculo) {
      return NextResponse.json(
        {
          error:
            "Selecione se o vínculo será individual ou por departamento.",
        },
        { status: 400 },
      );
    }

    if (
      tipoVinculo === "INDIVIDUAL" &&
      (!Number.isInteger(funcionarioId) ||
        funcionarioId <= 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione um funcionário válido.",
        },
        { status: 400 },
      );
    }

    if (
      tipoVinculo === "DEPARTAMENTO" &&
      (!Number.isInteger(departamentoId) ||
        departamentoId <= 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione um departamento válido.",
        },
        { status: 400 },
      );
    }

    if (!inicioVigencia) {
      return NextResponse.json(
        {
          error:
            "Informe o início da vigência.",
        },
        { status: 400 },
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
        { status: 400 },
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
        { status: 400 },
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
        { status: 404 },
      );
    }

    if (!plano.ativo) {
      return NextResponse.json(
        {
          error:
            "Não é possível vincular participantes a um plano inativo.",
        },
        { status: 400 },
      );
    }

    if (plano.regras.length === 0) {
      return NextResponse.json(
        {
          error:
            "Cadastre pelo menos uma regra ativa antes de vincular participantes.",
        },
        { status: 400 },
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
        { status: 400 },
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
        { status: 400 },
      );
    }

    if (tipoVinculo === "INDIVIDUAL") {
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
                id: true,
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
          { status: 400 },
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
          }),
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
          { status: 409 },
        );
      }

      const vinculo =
        await prisma.funcionarioPlanoComissaoRH.create({
          data: {
            instituicaoId,
            funcionarioId,
            planoId,
            criadoPorId: user.id,
            origemVinculo:
              OrigemVinculoPlanoComissaoRH.INDIVIDUAL,
            departamentoOrigemId: null,
            departamentoNomeSnapshot: null,
            loteVinculoId: null,
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
            "Funcionário vinculado ao plano de comissão com sucesso.",
          tipoVinculo,
          vinculo,
        },
        { status: 201 },
      );
    }

    const funcionariosDepartamento =
      await prisma.funcionario.findMany({
        where: {
          instituicaoId,
          departamentoId,
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
      });

    if (funcionariosDepartamento.length === 0) {
      return NextResponse.json(
        {
          error:
            "O departamento selecionado não possui funcionários ativos.",
        },
        { status: 400 },
      );
    }

    const departamento =
      funcionariosDepartamento[0].departamento;

    if (
      !departamento ||
      departamento.id !== departamentoId
    ) {
      return NextResponse.json(
        {
          error:
            "O departamento não pertence à instituição.",
        },
        { status: 400 },
      );
    }

    const funcionarioIds =
      funcionariosDepartamento.map(
        (funcionario) => funcionario.id,
      );

    const vinculosExistentes =
      await prisma.funcionarioPlanoComissaoRH.findMany({
        where: {
          instituicaoId,
          funcionarioId: {
            in: funcionarioIds,
          },
          ativo: true,
        },
        select: {
          funcionarioId: true,
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

    const conflitos =
      funcionariosDepartamento
        .map((funcionario) => {
          const conflito =
            vinculosExistentes.find(
              (vinculo) =>
                vinculo.funcionarioId ===
                  funcionario.id &&
                periodosSeSobrepoem({
                  inicioA: inicioVigencia,
                  fimA: fimVigencia,
                  inicioB:
                    vinculo.inicioVigencia,
                  fimB:
                    vinculo.fimVigencia,
                }),
            );

          if (!conflito) return null;

          return {
            funcionarioId: funcionario.id,
            funcionarioNome: funcionario.nome,
            planoConflitante:
              conflito.planoNomeSnapshot ||
              conflito.plano.nome,
          };
        })
        .filter(
          (
            item,
          ): item is {
            funcionarioId: number;
            funcionarioNome: string;
            planoConflitante: string;
          } => Boolean(item),
        );

    const idsComConflito = new Set(
      conflitos.map(
        (conflito) => conflito.funcionarioId,
      ),
    );

    const funcionariosElegiveis =
      funcionariosDepartamento.filter(
        (funcionario) =>
          !idsComConflito.has(funcionario.id),
      );

    if (funcionariosElegiveis.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhum funcionário do departamento pôde ser vinculado porque todos já possuem plano ativo no período informado.",
          tipoVinculo,
          quantidadeVinculada: 0,
          quantidadeIgnorada:
            conflitos.length,
          conflitos,
        },
        { status: 409 },
      );
    }

    const loteVinculoId = randomUUID();

    const resultado =
      await prisma.funcionarioPlanoComissaoRH.createMany({
        data: funcionariosElegiveis.map(
          (funcionario) => ({
            instituicaoId,
            funcionarioId: funcionario.id,
            planoId,
            criadoPorId: user.id,
            origemVinculo:
              OrigemVinculoPlanoComissaoRH.DEPARTAMENTO,
            departamentoOrigemId:
              departamento.id,
            departamentoNomeSnapshot:
              departamento.nome,
            loteVinculoId,
            inicioVigencia,
            fimVigencia,
            ativo: true,
            planoNomeSnapshot: plano.nome,
            observacoes,
          }),
        ),
      });

    const mensagem =
      conflitos.length > 0
        ? `${resultado.count} funcionário(s) do departamento ${departamento.nome} foram vinculados. ${conflitos.length} não foram incluídos porque já possuem outro plano ativo no período.`
        : `${resultado.count} funcionário(s) do departamento ${departamento.nome} foram vinculados ao plano com sucesso.`;

    return NextResponse.json(
      {
        message: mensagem,
        tipoVinculo,
        departamento: {
          id: departamento.id,
          nome: departamento.nome,
        },
        loteVinculoId,
        quantidadeVinculada:
          resultado.count,
        quantidadeIgnorada:
          conflitos.length,
        conflitos,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Erro ao vincular participantes ao plano:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível vincular os participantes ao plano de comissão.",
      },
      { status: 500 },
    );
  }
}