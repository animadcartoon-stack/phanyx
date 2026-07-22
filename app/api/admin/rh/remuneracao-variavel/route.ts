import { NextRequest, NextResponse } from "next/server";
import {
  AbrangenciaRemuneracaoVariavelRH,
  MetodoDistribuicaoRemuneracaoVariavelRH,
  StatusLancamentoComissaoRH,
  StatusLancamentoRemuneracaoVariavelRH,
  StatusProgramaRemuneracaoVariavelRH,
  TipoRemuneracaoVariavelRH,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const TIPOS_VALIDOS = Object.values(TipoRemuneracaoVariavelRH);
const ABRANGENCIAS_VALIDAS = Object.values(
  AbrangenciaRemuneracaoVariavelRH
);
const METODOS_VALIDOS = Object.values(
  MetodoDistribuicaoRemuneracaoVariavelRH
);

function normalizarTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function numeroOuNull(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const numero = Number(
    String(valor)
      .replace(/\./g, "")
      .replace(",", ".")
  );

  return Number.isFinite(numero) ? numero : null;
}

function inteiroOuNull(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero)) {
    return null;
  }

  return numero;
}

function dataOuNull(valor: unknown) {
  const texto = normalizarTexto(valor);

  if (!texto) {
    return null;
  }

  const data = new Date(`${texto}T12:00:00`);

  return Number.isNaN(data.getTime()) ? null : data;
}

function usuarioPodeGerenciar(user: any) {
  const role = String(user?.role || "").toUpperCase();

  return (
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    user?.isMasterAdmin === true
  );
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const instituicaoId = Number(user.instituicaoId);

    if (!instituicaoId) {
      return NextResponse.json(
        { error: "Instituição não identificada." },
        { status: 400 }
      );
    }

    const [
      programas,
      departamentos,
      totalProgramas,
      programasAtivos,
      programasRascunho,
      comissoesPendentes,
      remuneracoesPendentes,
      valorComissoesPendentes,
      valorRemuneracoesPendentes,
    ] = await Promise.all([
      prisma.programaRemuneracaoVariavelRH.findMany({
        where: {
          instituicaoId,
        },
        include: {
  departamento: {
    select: {
      id: true,
      nome: true,
    },
  },
  criadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },
  _count: {
    select: {
      participantes: true,
      lancamentos: true,
    },
  },
},
        orderBy: [
          {
            criadoEm: "desc",
          },
          {
            nome: "asc",
          },
        ],
      }),

      prisma.departamento.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
        },
        orderBy: {
          nome: "asc",
        },
      }),

      prisma.programaRemuneracaoVariavelRH.count({
        where: {
          instituicaoId,
        },
      }),

      prisma.programaRemuneracaoVariavelRH.count({
        where: {
          instituicaoId,
          status: StatusProgramaRemuneracaoVariavelRH.ATIVO,
        },
      }),

      prisma.programaRemuneracaoVariavelRH.count({
        where: {
          instituicaoId,
          status: StatusProgramaRemuneracaoVariavelRH.RASCUNHO,
        },
      }),

      prisma.lancamentoComissaoRH.count({
        where: {
          instituicaoId,
          status: StatusLancamentoComissaoRH.PENDENTE,
        },
      }),

      prisma.lancamentoRemuneracaoVariavelRH.count({
        where: {
          instituicaoId,
          status: StatusLancamentoRemuneracaoVariavelRH.PENDENTE,
        },
      }),

      prisma.lancamentoComissaoRH.aggregate({
        where: {
          instituicaoId,
          status: StatusLancamentoComissaoRH.PENDENTE,
        },
        _sum: {
          valorCalculado: true,
        },
      }),

      prisma.lancamentoRemuneracaoVariavelRH.aggregate({
        where: {
          instituicaoId,
          status: StatusLancamentoRemuneracaoVariavelRH.PENDENTE,
        },
        _sum: {
          valorCalculado: true,
        },
      }),
    ]);

    const idsCriadores = Array.from(
  new Set(
    programas
      .map((programa) => programa.criadoPorId)
      .filter((id): id is number => typeof id === "number")
  )
);

const usuariosCriadores =
  idsCriadores.length > 0
    ? await prisma.user.findMany({
        where: {
          instituicaoId,
          id: {
            in: idsCriadores,
          },
        },
        select: {
          id: true,
          nome: true,
          email: true,
        },
      })
    : [];

const usuariosCriadoresPorId = new Map(
  usuariosCriadores.map((usuario) => [
    usuario.id,
    usuario,
  ])
);

    const programasFormatados = programas.map((programa) => ({
  ...programa,
  criadoPor:
    programa.criadoPor ??
    (programa.criadoPorId
      ? usuariosCriadoresPorId.get(programa.criadoPorId) ??
        null
      : null),
  percentualFundo:
    programa.percentualFundo?.toString() ?? null,
  valorFundo: programa.valorFundo?.toString() ?? null,
  valorMinimoIndividual:
    programa.valorMinimoIndividual?.toString() ?? null,
  valorMaximoIndividual:
    programa.valorMaximoIndividual?.toString() ?? null,
}));

    const totalLancamentosPendentes =
      comissoesPendentes + remuneracoesPendentes;

    const totalValorPendente =
      Number(
        valorComissoesPendentes._sum.valorCalculado ?? 0
      ) +
      Number(
        valorRemuneracoesPendentes._sum.valorCalculado ?? 0
      );

    return NextResponse.json({
      programas: programasFormatados,
      departamentos,
      resumo: {
        totalProgramas,
        programasAtivos,
        programasRascunho,
        comissoesPendentes,
        remuneracoesPendentes,
        totalLancamentosPendentes,
        totalValorPendente,
      },
    });
  } catch (error: any) {
    console.error(
      "Erro ao carregar remuneração variável:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao carregar a remuneração variável.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !usuarioPodeGerenciar(user)) {
      return NextResponse.json(
        { error: "Você não possui autorização para criar programas." },
        { status: 403 }
      );
    }

    const instituicaoId = Number(user.instituicaoId);
    const criadoPorId = Number(user.id);

    if (!instituicaoId) {
      return NextResponse.json(
        { error: "Instituição não identificada." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const nome = normalizarTexto(body.nome);
    const descricao = normalizarTexto(body.descricao);
    const observacoes = normalizarTexto(body.observacoes);

    const tipo = normalizarTexto(
      body.tipo
    ) as TipoRemuneracaoVariavelRH;

    const abrangencia = normalizarTexto(
      body.abrangencia
    ) as AbrangenciaRemuneracaoVariavelRH;

    const metodoDistribuicao = normalizarTexto(
      body.metodoDistribuicao
    ) as MetodoDistribuicaoRemuneracaoVariavelRH;

    const departamentoId = inteiroOuNull(body.departamentoId);
    const competenciaMes = inteiroOuNull(body.competenciaMes);
    const competenciaAno = inteiroOuNull(body.competenciaAno);

    const periodoInicio = dataOuNull(body.periodoInicio);
    const periodoFim = dataOuNull(body.periodoFim);

    const percentualFundo = numeroOuNull(body.percentualFundo);
    const valorFundo = numeroOuNull(body.valorFundo);

    const valorMinimoIndividual = numeroOuNull(
      body.valorMinimoIndividual
    );

    const valorMaximoIndividual = numeroOuNull(
      body.valorMaximoIndividual
    );

    const diasMinimosAdmissao = inteiroOuNull(
      body.diasMinimosAdmissao
    );

    if (!nome) {
      return NextResponse.json(
        { error: "Informe o nome do programa." },
        { status: 400 }
      );
    }

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo de remuneração inválido." },
        { status: 400 }
      );
    }

    if (!ABRANGENCIAS_VALIDAS.includes(abrangencia)) {
      return NextResponse.json(
        { error: "Abrangência inválida." },
        { status: 400 }
      );
    }

    if (!METODOS_VALIDOS.includes(metodoDistribuicao)) {
      return NextResponse.json(
        { error: "Método de distribuição inválido." },
        { status: 400 }
      );
    }

    if (
      competenciaMes !== null &&
      (competenciaMes < 1 || competenciaMes > 12)
    ) {
      return NextResponse.json(
        { error: "A competência deve possuir um mês entre 1 e 12." },
        { status: 400 }
      );
    }

    if (
      competenciaAno !== null &&
      (competenciaAno < 2000 || competenciaAno > 2200)
    ) {
      return NextResponse.json(
        { error: "Informe um ano de competência válido." },
        { status: 400 }
      );
    }

    if (
      (competenciaMes === null && competenciaAno !== null) ||
      (competenciaMes !== null && competenciaAno === null)
    ) {
      return NextResponse.json(
        {
          error:
            "Informe o mês e o ano da competência juntos.",
        },
        { status: 400 }
      );
    }

    if (
      periodoInicio &&
      periodoFim &&
      periodoFim < periodoInicio
    ) {
      return NextResponse.json(
        {
          error:
            "A data final não pode ser anterior à data inicial.",
        },
        { status: 400 }
      );
    }

    if (
      valorMinimoIndividual !== null &&
      valorMaximoIndividual !== null &&
      valorMaximoIndividual < valorMinimoIndividual
    ) {
      return NextResponse.json(
        {
          error:
            "O valor máximo não pode ser menor que o valor mínimo.",
        },
        { status: 400 }
      );
    }

    let departamentoIdValidado: number | null = null;

    if (
      abrangencia ===
      AbrangenciaRemuneracaoVariavelRH.DEPARTAMENTO
    ) {
      if (!departamentoId) {
        return NextResponse.json(
          {
            error:
              "Selecione o departamento participante.",
          },
          { status: 400 }
        );
      }

      const departamento = await prisma.departamento.findFirst({
        where: {
          id: departamentoId,
          instituicaoId,
          ativo: true,
        },
        select: {
          id: true,
        },
      });

      if (!departamento) {
        return NextResponse.json(
          {
            error:
              "Departamento não encontrado nesta instituição.",
          },
          { status: 404 }
        );
      }

      departamentoIdValidado = departamento.id;
    }

    const programa =
      await prisma.programaRemuneracaoVariavelRH.create({
        data: {
          instituicaoId,
          criadoPorId: criadoPorId || null,
          departamentoId: departamentoIdValidado,
          nome,
          descricao: descricao || null,
          observacoes: observacoes || null,
          tipo,
          abrangencia,
          metodoDistribuicao,
          competenciaMes,
          competenciaAno,
          periodoInicio,
          periodoFim,
          percentualFundo,
          valorFundo,
          valorMinimoIndividual,
          valorMaximoIndividual,
          considerarSalarioBase: Boolean(
            body.considerarSalarioBase
          ),
          considerarTempoTrabalhado: Boolean(
            body.considerarTempoTrabalhado
          ),
          exigirFuncionarioAtivo:
            body.exigirFuncionarioAtivo === undefined
              ? true
              : Boolean(body.exigirFuncionarioAtivo),
          excluirEmExperiencia: Boolean(
            body.excluirEmExperiencia
          ),
          diasMinimosAdmissao,
          permitirAjusteManual:
            body.permitirAjusteManual === undefined
              ? true
              : Boolean(body.permitirAjusteManual),
          status: StatusProgramaRemuneracaoVariavelRH.RASCUNHO,
        },
        include: {
  departamento: {
    select: {
      id: true,
      nome: true,
    },
  },
  criadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },
  _count: {
    select: {
      participantes: true,
      lancamentos: true,
    },
  },
},
      });

    return NextResponse.json(
      {
        programa: {
          ...programa,
          percentualFundo:
            programa.percentualFundo?.toString() ?? null,
          valorFundo: programa.valorFundo?.toString() ?? null,
          valorMinimoIndividual:
            programa.valorMinimoIndividual?.toString() ?? null,
          valorMaximoIndividual:
            programa.valorMaximoIndividual?.toString() ?? null,
        },
        message:
          "Programa de remuneração variável criado como rascunho.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "Erro ao criar programa de remuneração variável:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao criar o programa de remuneração variável.",
      },
      { status: 500 }
    );
  }
}