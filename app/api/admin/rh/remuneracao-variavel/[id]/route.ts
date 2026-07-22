import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import {
  StatusLancamentoRemuneracaoVariavelRH,
  StatusProgramaRemuneracaoVariavelRH,
} from "@prisma/client";

export const dynamic = "force-dynamic";

type ContextoRota = {
  params: {
    id: string;
  };
};

type FuncionarioElegibilidade = {
  id: number;
  nome: string;
  ativo: boolean;
  statusFuncionario: string;
  cargo: string | null;
  tipoContrato: string | null;
  dataAdmissao: Date | null;
  salarioBase: any;
  departamento: {
    id: number;
    nome: string;
  } | null;
};

type ProgramaElegibilidade = {
  exigirFuncionarioAtivo: boolean;
  excluirEmExperiencia: boolean;
  diasMinimosAdmissao: number | null;
};

function usuarioPodeGerenciar(user: any) {
  const role = String(user?.role || "").toUpperCase();

  return (
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    user?.isMasterAdmin === true
  );
}

function calcularElegibilidade(
  funcionario: FuncionarioElegibilidade,
  programa: ProgramaElegibilidade
) {
  const motivos: string[] = [];

  if (programa.exigirFuncionarioAtivo) {
    const status = String(
      funcionario.statusFuncionario || ""
    ).toUpperCase();

    if (
      !funcionario.ativo ||
      status === "INATIVO" ||
      status === "DESLIGADO"
    ) {
      motivos.push("Funcionário inativo ou desligado.");
    }
  }

  if (programa.excluirEmExperiencia) {
    const tipoContrato = String(
      funcionario.tipoContrato || ""
    )
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

    if (tipoContrato.includes("EXPERI")) {
      motivos.push("Funcionário em período de experiência.");
    }
  }

  if (
    programa.diasMinimosAdmissao &&
    programa.diasMinimosAdmissao > 0
  ) {
    if (!funcionario.dataAdmissao) {
      motivos.push("Data de admissão não informada.");
    } else {
      const agora = new Date();

      const diferenca =
        agora.getTime() -
        funcionario.dataAdmissao.getTime();

      const diasTrabalhados = Math.floor(
        diferenca / (1000 * 60 * 60 * 24)
      );

      if (diasTrabalhados < programa.diasMinimosAdmissao) {
        motivos.push(
          `Possui ${diasTrabalhados} dias desde a admissão; mínimo exigido: ${programa.diasMinimosAdmissao}.`
        );
      }
    }
  }

  return {
    elegivel: motivos.length === 0,
    motivos,
  };
}

function arredondarCentavos(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function numeroDecimal(valor: unknown) {
  const numero = Number(valor ?? 0);
  return Number.isFinite(numero) ? numero : 0;
}

function calcularDiasConsiderados(
  participante: any,
  programa: any
) {
  const diasSalvos = Number(participante.diasConsiderados || 0);

  if (diasSalvos > 0) {
    return diasSalvos;
  }

  const dataAdmissao = participante.dataAdmissaoSnapshot
    ? new Date(participante.dataAdmissaoSnapshot)
    : null;

  const periodoInicio = programa.periodoInicio
    ? new Date(programa.periodoInicio)
    : null;

  const periodoFim = programa.periodoFim
    ? new Date(programa.periodoFim)
    : new Date();

  let inicio = periodoInicio || dataAdmissao;

  if (
    dataAdmissao &&
    (!inicio || dataAdmissao.getTime() > inicio.getTime())
  ) {
    inicio = dataAdmissao;
  }

  if (!inicio || periodoFim.getTime() < inicio.getTime()) {
    return 0;
  }

  return Math.max(
    1,
    Math.floor(
      (periodoFim.getTime() - inicio.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
}

function calcularPreviaDistribuicao(programa: any) {
  const participantes = programa.participantes.filter(
    (participante: any) => participante.elegivel
  );

  const fundo = numeroDecimal(programa.valorFundo);

  const valorMinimo =
    programa.valorMinimoIndividual === null
      ? null
      : numeroDecimal(programa.valorMinimoIndividual);

  const valorMaximo =
    programa.valorMaximoIndividual === null
      ? null
      : numeroDecimal(programa.valorMaximoIndividual);

  const salarios = new Map<number, number>();
  const dias = new Map<number, number>();
  const pesos = new Map<number, number>();

  participantes.forEach((participante: any) => {
    salarios.set(
      participante.id,
      numeroDecimal(participante.salarioBaseSnapshot)
    );

    dias.set(
      participante.id,
      calcularDiasConsiderados(participante, programa)
    );

    pesos.set(
      participante.id,
      numeroDecimal(participante.peso || 1)
    );
  });

  const totalSalarios = Array.from(
    salarios.values()
  ).reduce((total, valor) => total + valor, 0);

  const totalDias = Array.from(dias.values()).reduce(
    (total, valor) => total + valor,
    0
  );

  const totalPesos = Array.from(pesos.values()).reduce(
    (total, valor) => total + valor,
    0
  );

  const alertasGerais: string[] = [];

  if (
    fundo <= 0 &&
    programa.metodoDistribuicao !==
      "VALOR_FIXO_INDIVIDUAL" &&
    programa.metodoDistribuicao !== "MANUAL"
  ) {
    alertasGerais.push(
      "Informe um valor monetário para o fundo antes de gerar os lançamentos."
    );
  }

  if (
    !programa.valorFundo &&
    programa.percentualFundo
  ) {
    alertasGerais.push(
      "O percentual do fundo foi informado, mas ainda é necessário definir o valor monetário apurado."
    );
  }

  if (
    programa.metodoDistribuicao ===
      "PROPORCIONAL_SALARIO" &&
    totalSalarios <= 0
  ) {
    alertasGerais.push(
      "Não existem salários-base válidos para calcular a distribuição proporcional."
    );
  }

  if (
    programa.metodoDistribuicao ===
      "PROPORCIONAL_TEMPO_TRABALHADO" &&
    totalDias <= 0
  ) {
    alertasGerais.push(
      "Não existem períodos trabalhados válidos para calcular a distribuição."
    );
  }

  if (
    programa.metodoDistribuicao === "PONTUACAO" &&
    totalPesos <= 0
  ) {
    alertasGerais.push(
      "A soma dos pesos dos participantes precisa ser maior que zero."
    );
  }

  const linhas = participantes.map(
    (participante: any) => {
      const alertas: string[] = [];

      const salario =
        salarios.get(participante.id) || 0;

      const diasConsiderados =
        dias.get(participante.id) || 0;

      const peso = pesos.get(participante.id) || 0;

      const percentualIndividual =
        participante.percentualIndividual === null
          ? null
          : numeroDecimal(
              participante.percentualIndividual
            );

      const valorFixo =
        participante.valorFixoIndividual === null
          ? null
          : numeroDecimal(
              participante.valorFixoIndividual
            );

      let valorBruto = 0;
      let baseCalculo = fundo;
      let criterio = "";

      switch (programa.metodoDistribuicao) {
        case "IGUALITARIO":
          criterio = "Divisão igualitária";

          valorBruto =
            participantes.length > 0
              ? fundo / participantes.length
              : 0;
          break;

        case "PROPORCIONAL_SALARIO":
          criterio = "Proporcional ao salário-base";
          baseCalculo = salario;

          valorBruto =
            totalSalarios > 0
              ? fundo * (salario / totalSalarios)
              : 0;

          if (salario <= 0) {
            alertas.push(
              "Salário-base não informado ou igual a zero."
            );
          }
          break;

        case "PROPORCIONAL_TEMPO_TRABALHADO":
          criterio = "Proporcional ao tempo trabalhado";
          baseCalculo = diasConsiderados;

          valorBruto =
            totalDias > 0
              ? fundo *
                (diasConsiderados / totalDias)
              : 0;

          if (diasConsiderados <= 0) {
            alertas.push(
              "Não foi possível calcular o período trabalhado."
            );
          }
          break;

        case "PERCENTUAL_INDIVIDUAL":
          criterio = "Percentual individual";

          valorBruto =
            percentualIndividual !== null
              ? fundo * (percentualIndividual / 100)
              : 0;

          if (percentualIndividual === null) {
            alertas.push(
              "Percentual individual não informado."
            );
          }
          break;

        case "PONTUACAO":
          criterio = "Peso ou pontuação";
          baseCalculo = peso;

          valorBruto =
            totalPesos > 0
              ? fundo * (peso / totalPesos)
              : 0;
          break;

        case "VALOR_FIXO_INDIVIDUAL":
          criterio = "Valor fixo individual";
          baseCalculo = valorFixo || 0;
          valorBruto = valorFixo || 0;

          if (valorFixo === null) {
            alertas.push(
              "Valor fixo individual não informado."
            );
          }
          break;

        case "MANUAL":
          criterio = "Definição manual";
          baseCalculo = valorFixo || 0;
          valorBruto = valorFixo || 0;

          if (valorFixo === null) {
            alertas.push(
              "O RH ainda não definiu o valor manual."
            );
          }
          break;

        default:
          criterio = programa.metodoDistribuicao;
          alertas.push(
            "Método de distribuição não reconhecido."
          );
      }

      let valorPrevisto = valorBruto;

      if (
        valorMinimo !== null &&
        valorPrevisto < valorMinimo
      ) {
        valorPrevisto = valorMinimo;
        alertas.push(
          `Aplicado o valor mínimo individual de R$ ${valorMinimo.toFixed(
            2
          )}.`
        );
      }

      if (
        valorMaximo !== null &&
        valorPrevisto > valorMaximo
      ) {
        valorPrevisto = valorMaximo;
        alertas.push(
          `Aplicado o valor máximo individual de R$ ${valorMaximo.toFixed(
            2
          )}.`
        );
      }

      return {
        participanteId: participante.id,
        funcionarioId: participante.funcionarioId,
        funcionarioNome:
          participante.funcionarioNomeSnapshot,
        funcionarioCargo:
          participante.funcionarioCargoSnapshot,
        funcionarioDepartamento:
          participante.funcionarioDepartamentoSnapshot,
        criterio,
        baseCalculo: arredondarCentavos(baseCalculo),
        percentualAplicado: percentualIndividual,
        pesoAplicado: peso,
        diasConsiderados,
        valorBruto: arredondarCentavos(valorBruto),
        valorPrevisto:
          arredondarCentavos(valorPrevisto),
        alertas,
      };
    }
  );

  const totalDistribuido = arredondarCentavos(
    linhas.reduce(
      (total: number, linha: any) =>
        total + linha.valorPrevisto,
      0
    )
  );

  const saldo = arredondarCentavos(
    fundo > 0 ? fundo - totalDistribuido : 0
  );

  if (saldo < 0) {
    alertasGerais.push(
      "O valor previsto ultrapassa o fundo configurado."
    );
  }

  if (saldo > 0 && fundo > 0) {
    alertasGerais.push(
      "Existe saldo do fundo ainda não distribuído."
    );
  }

  return {
    metodoDistribuicao:
      programa.metodoDistribuicao,
    totalParticipantes: participantes.length,
    valorFundo: fundo,
    totalDistribuido,
    saldo,
    linhas,
    alertasGerais,
  };
}

function validarAtivacaoPrograma(
  programa: any,
  previa: ReturnType<typeof calcularPreviaDistribuicao>
) {
  const erros: string[] = [];

  if (
    !programa.competenciaMes ||
    !programa.competenciaAno
  ) {
    erros.push(
      "Informe o mês e o ano da competência antes de ativar o programa."
    );
  }

  if (previa.totalParticipantes === 0) {
    erros.push(
      "O programa precisa possuir pelo menos um participante elegível."
    );
  }

  if (previa.totalDistribuido <= 0) {
    erros.push(
      "O total distribuído precisa ser maior que zero."
    );
  }

  if (previa.saldo < -0.009) {
    erros.push(
      "O total previsto ultrapassa o fundo disponível."
    );
  }

  if (
    programa.metodoDistribuicao ===
    "PROPORCIONAL_SALARIO"
  ) {
    const semSalario = programa.participantes.filter(
      (participante: any) =>
        participante.elegivel &&
        numeroDecimal(
          participante.salarioBaseSnapshot
        ) <= 0
    );

    if (semSalario.length > 0) {
      erros.push(
        `${semSalario.length} participante(s) não possuem salário-base válido.`
      );
    }
  }

  if (
    programa.metodoDistribuicao ===
    "PROPORCIONAL_TEMPO_TRABALHADO"
  ) {
    const semPeriodo = programa.participantes.filter(
      (participante: any) =>
        participante.elegivel &&
        calcularDiasConsiderados(
          participante,
          programa
        ) <= 0
    );

    if (semPeriodo.length > 0) {
      erros.push(
        `${semPeriodo.length} participante(s) não possuem período trabalhado válido.`
      );
    }
  }

  if (
    programa.metodoDistribuicao ===
    "PERCENTUAL_INDIVIDUAL"
  ) {
    const semPercentual =
      programa.participantes.filter(
        (participante: any) =>
          participante.elegivel &&
          participante.percentualIndividual === null
      );

    if (semPercentual.length > 0) {
      erros.push(
        `${semPercentual.length} participante(s) não possuem percentual individual.`
      );
    }
  }

  if (
    programa.metodoDistribuicao ===
      "VALOR_FIXO_INDIVIDUAL" ||
    programa.metodoDistribuicao === "MANUAL"
  ) {
    const semValor = programa.participantes.filter(
      (participante: any) =>
        participante.elegivel &&
        participante.valorFixoIndividual === null
    );

    if (semValor.length > 0) {
      erros.push(
        `${semValor.length} participante(s) não possuem valor individual definido.`
      );
    }
  }

  if (
    programa.metodoDistribuicao === "PONTUACAO"
  ) {
    const semPeso = programa.participantes.filter(
      (participante: any) =>
        participante.elegivel &&
        numeroDecimal(participante.peso) <= 0
    );

    if (semPeso.length > 0) {
      erros.push(
        `${semPeso.length} participante(s) não possuem peso ou pontuação válida.`
      );
    }
  }

  const valoresInvalidos = previa.linhas.filter(
    (linha) =>
      !Number.isFinite(linha.valorPrevisto) ||
      linha.valorPrevisto < 0
  );

  if (valoresInvalidos.length > 0) {
    erros.push(
      "Existem valores individuais inválidos na distribuição."
    );
  }

  return erros;
}

async function buscarPrograma(
  id: number,
  instituicaoId: number
) {
  return prisma.programaRemuneracaoVariavelRH.findFirst({
    where: {
      id,
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
      aprovadoPor: {
        select: {
          id: true,
          nome: true,
          email: true,
        },
      },
      participantes: {
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              ativo: true,
              statusFuncionario: true,
              cargo: true,
              salarioBase: true,
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
          funcionarioNomeSnapshot: "asc",
        },
      },
      lancamentos: {
  orderBy: [
    {
      status: "asc",
    },
    {
      funcionarioNomeSnapshot: "asc",
    },
  ],
},
      _count: {
        select: {
          participantes: true,
          lancamentos: true,
        },
      },
    },
  });
}

async function buscarFuncionarios(
  programa: any,
  instituicaoId: number
) {
  return prisma.funcionario.findMany({
    where: {
      instituicaoId,
      ...(programa.abrangencia === "DEPARTAMENTO" &&
      programa.departamentoId
        ? {
            departamentoId: programa.departamentoId,
          }
        : {}),
    },
    select: {
      id: true,
      nome: true,
      ativo: true,
      statusFuncionario: true,
      cargo: true,
      tipoContrato: true,
      dataAdmissao: true,
      salarioBase: true,
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
}

function normalizarLancamentoIds(valor: unknown) {
  if (!Array.isArray(valor)) {
    return [];
  }

  return Array.from(
    new Set(
      valor
        .map((id) => Number(id))
        .filter(
          (id) =>
            Number.isInteger(id) && id > 0
        )
    )
  );
}

export async function GET(
  _req: NextRequest,
  { params }: ContextoRota
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const instituicaoId = Number(user.instituicaoId);
    const programaId = Number(params.id);

    if (!instituicaoId || !programaId) {
      return NextResponse.json(
        { error: "Programa inválido." },
        { status: 400 }
      );
    }

    const programa = await buscarPrograma(
      programaId,
      instituicaoId
    );

    if (!programa) {
      return NextResponse.json(
        { error: "Programa não encontrado." },
        { status: 404 }
      );
    }

    const usuariosAuditoriaIds = Array.from(
  new Set(
    programa.lancamentos.flatMap((lancamento) =>
      [
        lancamento.criadoPorId,
        lancamento.aprovadoPorId,
        lancamento.reprovadoPorId,
        lancamento.estornadoPorId,
      ].filter(
        (id): id is number => typeof id === "number"
      )
    )
  )
);

const usuariosAuditoria =
  usuariosAuditoriaIds.length > 0
    ? await prisma.user.findMany({
        where: {
          instituicaoId,
          id: {
            in: usuariosAuditoriaIds,
          },
        },
        select: {
          id: true,
          nome: true,
          email: true,
        },
      })
    : [];

const usuariosAuditoriaPorId = new Map(
  usuariosAuditoria.map((usuario) => [
    usuario.id,
    usuario,
  ])
);

const lancamentosFormatados =
  programa.lancamentos.map((lancamento) => ({
    ...lancamento,

    baseCalculo:
      lancamento.baseCalculo?.toString() ?? "0",

    percentualAplicado:
      lancamento.percentualAplicado?.toString() ??
      null,

    pesoAplicado:
      lancamento.pesoAplicado?.toString() ?? null,

    valorCalculado:
      lancamento.valorCalculado?.toString() ?? "0",

    valorAprovado:
      lancamento.valorAprovado?.toString() ?? null,

    criadoPor:
      lancamento.criadoPorId !== null
        ? usuariosAuditoriaPorId.get(
            lancamento.criadoPorId
          ) ?? null
        : null,

    aprovadoPor:
      lancamento.aprovadoPorId !== null
        ? usuariosAuditoriaPorId.get(
            lancamento.aprovadoPorId
          ) ?? null
        : null,

    reprovadoPor:
      lancamento.reprovadoPorId !== null
        ? usuariosAuditoriaPorId.get(
            lancamento.reprovadoPorId
          ) ?? null
        : null,

    estornadoPor:
      lancamento.estornadoPorId !== null
        ? usuariosAuditoriaPorId.get(
            lancamento.estornadoPorId
          ) ?? null
        : null,
  }));

const resumoLancamentos = {
  total: programa.lancamentos.length,

  pendentes: programa.lancamentos.filter(
    (lancamento) =>
      lancamento.status ===
      StatusLancamentoRemuneracaoVariavelRH.PENDENTE
  ).length,

  aprovados: programa.lancamentos.filter(
    (lancamento) =>
      lancamento.status ===
      StatusLancamentoRemuneracaoVariavelRH.APROVADO
  ).length,

  reprovados: programa.lancamentos.filter(
    (lancamento) =>
      lancamento.status ===
      StatusLancamentoRemuneracaoVariavelRH.REPROVADO
  ).length,

  enviadosHolerite: programa.lancamentos.filter(
    (lancamento) =>
      lancamento.status ===
      StatusLancamentoRemuneracaoVariavelRH.ENVIADO_HOLERITE
  ).length,

  valorPendente: programa.lancamentos
    .filter(
      (lancamento) =>
        lancamento.status ===
        StatusLancamentoRemuneracaoVariavelRH.PENDENTE
    )
    .reduce(
      (total, lancamento) =>
        total + Number(lancamento.valorCalculado || 0),
      0
    ),

  valorAprovado: programa.lancamentos
    .filter(
      (lancamento) =>
        lancamento.status ===
        StatusLancamentoRemuneracaoVariavelRH.APROVADO
    )
    .reduce(
      (total, lancamento) =>
        total +
        Number(
          lancamento.valorAprovado ??
            lancamento.valorCalculado ??
            0
        ),
      0
    ),
};

    const funcionarios = await buscarFuncionarios(
      programa,
      instituicaoId
    );

    const participantesIds = new Set(
      programa.participantes.map(
        (participante) => participante.funcionarioId
      )
    );

    const funcionariosFormatados = funcionarios.map(
      (funcionario) => {
        const avaliacao = calcularElegibilidade(
          funcionario,
          programa
        );

        return {
          ...funcionario,
          salarioBase:
            funcionario.salarioBase?.toString() ?? null,
          jaParticipa: participantesIds.has(funcionario.id),
          elegivel: avaliacao.elegivel,
          motivosInelegibilidade: avaliacao.motivos,
        };
      }
    );

    return NextResponse.json({
      programa: {
        ...programa,
        percentualFundo:
          programa.percentualFundo?.toString() ?? null,
        valorFundo:
          programa.valorFundo?.toString() ?? null,
        valorMinimoIndividual:
          programa.valorMinimoIndividual?.toString() ?? null,
        valorMaximoIndividual:
          programa.valorMaximoIndividual?.toString() ?? null,
        participantes: programa.participantes.map(
          (participante) => ({
            ...participante,
            peso: participante.peso.toString(),
            percentualIndividual:
              participante.percentualIndividual?.toString() ??
              null,
            valorFixoIndividual:
              participante.valorFixoIndividual?.toString() ??
              null,
            salarioBaseSnapshot:
              participante.salarioBaseSnapshot?.toString() ??
              null,
            funcionario: {
              ...participante.funcionario,
              salarioBase:
                participante.funcionario.salarioBase?.toString() ??
                null,
            },
          })
        ),

        lancamentos: lancamentosFormatados,

      },
      funcionarios: funcionariosFormatados,
      resumoLancamentos,
    });
  } catch (error: any) {
    console.error(
      "Erro ao carregar programa de remuneração:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao carregar o programa.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: ContextoRota
) {
  try {
    const user = await getUserFromToken();

    if (!user || !usuarioPodeGerenciar(user)) {
      return NextResponse.json(
        {
          error:
            "Você não possui autorização para gerenciar participantes.",
        },
        { status: 403 }
      );
    }

    const instituicaoId = Number(user.instituicaoId);
    const incluidoPorId = Number(user.id) || null;
    const programaId = Number(params.id);

    if (!instituicaoId || !programaId) {
      return NextResponse.json(
        { error: "Programa inválido." },
        { status: 400 }
      );
    }

    const body = await req.json();
const acao = String(body.acao || "");

if (
  acao !== "GERAR_PARTICIPANTES" &&
  acao !== "PREVISUALIZAR_DISTRIBUICAO" &&
  acao !== "ATIVAR_E_GERAR_LANCAMENTOS" &&
  acao !== "APROVAR_LANCAMENTOS" &&
  acao !== "REPROVAR_LANCAMENTOS"
) {
  return NextResponse.json(
    { error: "Ação inválida." },
    { status: 400 }
  );
}
  
    const programa = await buscarPrograma(
      programaId,
      instituicaoId
    );

    if (!programa) {
      return NextResponse.json(
        { error: "Programa não encontrado." },
        { status: 404 }
      );
    }

    if (acao === "PREVISUALIZAR_DISTRIBUICAO") {
  if (programa.participantes.length === 0) {
    return NextResponse.json(
      {
        error:
          "Inclua os participantes antes de calcular a distribuição.",
      },
      { status: 400 }
    );
  }

  const previa =
    calcularPreviaDistribuicao(programa);

  return NextResponse.json({ previa });
}

if (acao === "ATIVAR_E_GERAR_LANCAMENTOS") {
  if (
    programa.status !==
    StatusProgramaRemuneracaoVariavelRH.RASCUNHO
  ) {
    return NextResponse.json(
      {
        error:
          "Somente programas em rascunho podem ser ativados.",
      },
      { status: 400 }
    );
  }

  if (programa.participantes.length === 0) {
    return NextResponse.json(
      {
        error:
          "Inclua os participantes antes de ativar o programa.",
      },
      { status: 400 }
    );
  }

  const previa =
    calcularPreviaDistribuicao(programa);

  const errosAtivacao = validarAtivacaoPrograma(
    programa,
    previa
  );

  if (errosAtivacao.length > 0) {
    return NextResponse.json(
      {
        error:
          "O programa ainda não pode ser ativado.",
        detalhes: errosAtivacao,
      },
      { status: 400 }
    );
  }

  const lancamentosExistentes =
    await prisma.lancamentoRemuneracaoVariavelRH.count(
      {
        where: {
          instituicaoId,
          programaId,
        },
      }
    );

  if (lancamentosExistentes > 0) {
    return NextResponse.json(
      {
        error:
          "Este programa já possui lançamentos gerados.",
      },
      { status: 409 }
    );
  }

  const usuarioResponsavelId =
    Number(user.id) || null;

  const competenciaMes =
    Number(programa.competenciaMes);

  const competenciaAno =
    Number(programa.competenciaAno);

  const agora = new Date();

  await prisma.$transaction(async (tx) => {
    const programaAtualizado =
      await tx.programaRemuneracaoVariavelRH.updateMany(
        {
          where: {
            id: programaId,
            instituicaoId,
            status:
              StatusProgramaRemuneracaoVariavelRH.RASCUNHO,
          },
          data: {
            status:
              StatusProgramaRemuneracaoVariavelRH.ATIVO,
            aprovadoPorId: usuarioResponsavelId,
            aprovadoEm: agora,
          },
        }
      );

    if (programaAtualizado.count !== 1) {
      throw new Error(
        "O programa foi alterado por outro usuário. Atualize a página."
      );
    }

    await tx.lancamentoRemuneracaoVariavelRH.createMany(
      {
        data: previa.linhas.map((linha) => ({
          instituicaoId,
          programaId,
          funcionarioId: linha.funcionarioId,
          participanteId: linha.participanteId,
          criadoPorId: usuarioResponsavelId,

          chaveLancamento: [
            "REMUNERACAO_VARIAVEL",
            programaId,
            linha.participanteId,
            competenciaAno,
            String(competenciaMes).padStart(2, "0"),
          ].join(":"),

          status:
            StatusLancamentoRemuneracaoVariavelRH.PENDENTE,

          competenciaMes,
          competenciaAno,

          descricao: programa.nome,

          baseCalculo: linha.baseCalculo,
          percentualAplicado:
            linha.percentualAplicado ?? null,
          pesoAplicado:
            linha.pesoAplicado ?? null,

          valorCalculado: linha.valorPrevisto,

          funcionarioNomeSnapshot:
            linha.funcionarioNome,

          funcionarioCargoSnapshot:
            linha.funcionarioCargo || null,

          funcionarioDepartamentoSnapshot:
            linha.funcionarioDepartamento || null,

          programaNomeSnapshot: programa.nome,
          tipoRemuneracaoSnapshot: programa.tipo,

          calculadoEm: agora,
        })),
      }
    );
  });

  return NextResponse.json({
    message: `Programa ativado e ${previa.totalParticipantes} lançamento(s) pendente(s) gerado(s).`,
    resumo: {
      programaId,
      totalLancamentos:
        previa.totalParticipantes,
      totalDistribuido:
        previa.totalDistribuido,
      saldo: previa.saldo,
      status:
        StatusProgramaRemuneracaoVariavelRH.ATIVO,
    },
  });
}

if (acao === "APROVAR_LANCAMENTOS") {
  if (
    programa.status !==
    StatusProgramaRemuneracaoVariavelRH.ATIVO
  ) {
    return NextResponse.json(
      {
        error:
          "Os lançamentos somente podem ser aprovados em um programa ativo.",
      },
      { status: 400 }
    );
  }

  const lancamentoIds = normalizarLancamentoIds(
    body.lancamentoIds
  );

  if (lancamentoIds.length === 0) {
    return NextResponse.json(
      {
        error:
          "Selecione pelo menos um lançamento pendente.",
      },
      { status: 400 }
    );
  }

  const lancamentosPendentes =
    await prisma.lancamentoRemuneracaoVariavelRH.findMany(
      {
        where: {
          id: {
            in: lancamentoIds,
          },
          instituicaoId,
          programaId,
          status:
            StatusLancamentoRemuneracaoVariavelRH.PENDENTE,
        },
        select: {
          id: true,
          valorCalculado: true,
        },
      }
    );

  if (lancamentosPendentes.length === 0) {
    return NextResponse.json(
      {
        error:
          "Nenhum dos lançamentos selecionados está pendente.",
      },
      { status: 400 }
    );
  }

  const aprovadoPorId = Number(user.id);
  const aprovadoEm = new Date();

  await prisma.$transaction(
    lancamentosPendentes.map((lancamento) =>
      prisma.lancamentoRemuneracaoVariavelRH.update({
        where: {
          id: lancamento.id,
        },
        data: {
          status:
            StatusLancamentoRemuneracaoVariavelRH.APROVADO,

          valorAprovado:
            lancamento.valorCalculado,

          aprovadoPorId,
          aprovadoEm,

          reprovadoPorId: null,
          reprovadoEm: null,
          motivoReprovacao: null,
        },
      })
    )
  );

  const ignorados =
    lancamentoIds.length -
    lancamentosPendentes.length;

  return NextResponse.json({
    message:
      `${lancamentosPendentes.length} lançamento(s) aprovado(s).` +
      (ignorados > 0
        ? ` ${ignorados} lançamento(s) já processado(s) foram ignorados.`
        : ""),

    aprovados: lancamentosPendentes.length,
    ignorados,
  });
}

if (acao === "REPROVAR_LANCAMENTOS") {
  if (
    programa.status !==
    StatusProgramaRemuneracaoVariavelRH.ATIVO
  ) {
    return NextResponse.json(
      {
        error:
          "Os lançamentos somente podem ser reprovados em um programa ativo.",
      },
      { status: 400 }
    );
  }

  const lancamentoIds = normalizarLancamentoIds(
    body.lancamentoIds
  );

  const motivoReprovacao = String(
    body.motivoReprovacao || ""
  ).trim();

  if (lancamentoIds.length === 0) {
    return NextResponse.json(
      {
        error:
          "Selecione pelo menos um lançamento pendente.",
      },
      { status: 400 }
    );
  }

  if (motivoReprovacao.length < 5) {
    return NextResponse.json(
      {
        error:
          "Informe o motivo da reprovação com pelo menos 5 caracteres.",
      },
      { status: 400 }
    );
  }

  const reprovadoPorId = Number(user.id);
  const reprovadoEm = new Date();

  const resultado =
    await prisma.lancamentoRemuneracaoVariavelRH.updateMany(
      {
        where: {
          id: {
            in: lancamentoIds,
          },
          instituicaoId,
          programaId,
          status:
            StatusLancamentoRemuneracaoVariavelRH.PENDENTE,
        },
        data: {
          status:
            StatusLancamentoRemuneracaoVariavelRH.REPROVADO,

          reprovadoPorId,
          reprovadoEm,
          motivoReprovacao,

          aprovadoPorId: null,
          aprovadoEm: null,
          valorAprovado: null,
        },
      }
    );

  if (resultado.count === 0) {
    return NextResponse.json(
      {
        error:
          "Nenhum dos lançamentos selecionados está pendente.",
      },
      { status: 400 }
    );
  }

  const ignorados =
    lancamentoIds.length - resultado.count;

  return NextResponse.json({
    message:
      `${resultado.count} lançamento(s) reprovado(s).` +
      (ignorados > 0
        ? ` ${ignorados} lançamento(s) já processado(s) foram ignorados.`
        : ""),

    reprovados: resultado.count,
    ignorados,
  });
}

    if (programa.status !== "RASCUNHO") {
      return NextResponse.json(
        {
          error:
            "Os participantes somente podem ser alterados enquanto o programa estiver em rascunho.",
        },
        { status: 400 }
      );
    }

    const funcionarios = await buscarFuncionarios(
      programa,
      instituicaoId
    );

    let funcionariosSelecionados = funcionarios;

    if (
      programa.abrangencia ===
      "FUNCIONARIOS_SELECIONADOS"
    ) {
      const idsInformados = Array.isArray(
        body.funcionarioIds
      )
        ? body.funcionarioIds
            .map((id: unknown) => Number(id))
            .filter((id: number) => Number.isInteger(id))
        : [];

      if (idsInformados.length === 0) {
        return NextResponse.json(
          {
            error:
              "Selecione pelo menos um funcionário.",
          },
          { status: 400 }
        );
      }

      const idsPermitidos = new Set(idsInformados);

      funcionariosSelecionados = funcionarios.filter(
        (funcionario) =>
          idsPermitidos.has(funcionario.id)
      );
    }

    const avaliados = funcionariosSelecionados.map(
      (funcionario) => ({
        funcionario,
        avaliacao: calcularElegibilidade(
          funcionario,
          programa
        ),
      })
    );

    const elegiveis = avaliados.filter(
      (item) => item.avaliacao.elegivel
    );

    const ignorados = avaliados
      .filter((item) => !item.avaliacao.elegivel)
      .map((item) => ({
        funcionarioId: item.funcionario.id,
        nome: item.funcionario.nome,
        motivos: item.avaliacao.motivos,
      }));

    if (elegiveis.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhum funcionário elegível foi encontrado.",
          ignorados,
        },
        { status: 400 }
      );
    }

    const resultado =
      await prisma.participanteProgramaRemuneracaoVariavelRH.createMany(
        {
          data: elegiveis.map(({ funcionario }) => ({
            instituicaoId,
            programaId,
            funcionarioId: funcionario.id,
            incluidoPorId,
            elegivel: true,
            peso: 1,
            funcionarioNomeSnapshot: funcionario.nome,
            funcionarioCargoSnapshot:
              funcionario.cargo || null,
            funcionarioDepartamentoSnapshot:
              funcionario.departamento?.nome || null,
            salarioBaseSnapshot:
              funcionario.salarioBase || null,
            dataAdmissaoSnapshot:
              funcionario.dataAdmissao || null,
          })),
          skipDuplicates: true,
        }
      );

    return NextResponse.json({
      message:
        resultado.count > 0
          ? `${resultado.count} participante(s) incluído(s) no programa.`
          : "Os funcionários selecionados já participavam do programa.",
      incluidos: resultado.count,
      ignorados,
    });
  } catch (error: any) {
    console.error(
  "Erro ao processar remuneração variável:",
  error
);

    return NextResponse.json(
      {
        error:
  error?.message ||
  "Erro ao processar a remuneração variável.",
      },
      { status: 500 }
    );
  }
}