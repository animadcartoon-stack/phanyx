import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function parseDate(valor: any) {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function parseDecimal(valor: any) {
  if (valor === undefined || valor === null || valor === "") return null;
  const numero = Number(String(valor).replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
}

function numero(valor: any) {
  return parseDecimal(valor) ?? 0;
}

function arredondar(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function diferencaMesesProporcionais(dataInicio: Date | null, dataFim: Date | null) {
  if (!dataInicio || !dataFim) return 0;

  let meses =
    dataFim.getMonth() -
    dataInicio.getMonth() +
    12 * (dataFim.getFullYear() - dataInicio.getFullYear());

  if (dataFim.getDate() >= 15) {
    meses += 1;
  }

  return Math.max(0, Math.min(12, meses));
}

function calcularRescisao({
  tipo,
  salarioBaseMensal,
  dataAdmissaoBase,
  dataDesligamento,
  possuiFeriasVencidas,
  quantidadeFeriasVencidas,
  mesesFeriasProporcionais,
  mesesDecimoTerceiro,
  tipoAvisoPrevio,
  diasAvisoPrevioIndenizado,
  saldoFgts,
  multaFgtsManual,
  descontoInss,
  descontoIrrf,
  outrosDescontos,
}: {
  tipo: string;
  salarioBaseMensal: number;
  dataAdmissaoBase: Date | null;
  dataDesligamento: Date;
  possuiFeriasVencidas: boolean;
  quantidadeFeriasVencidas: number;
  mesesFeriasProporcionais: number;
  mesesDecimoTerceiro: number;
  tipoAvisoPrevio: string | null;
  diasAvisoPrevioIndenizado: number;
  saldoFgts: number;
  multaFgtsManual: number | null;
  descontoInss: number;
  descontoIrrf: number;
  outrosDescontos: number;
}) {
  const diasTrabalhados = Math.max(1, Math.min(30, dataDesligamento.getDate()));

  const saldoSalario = arredondar((salarioBaseMensal / 30) * diasTrabalhados);

  const mesesFerias =
    mesesFeriasProporcionais ||
    diferencaMesesProporcionais(dataAdmissaoBase, dataDesligamento);

  const inicioAno = new Date(dataDesligamento.getFullYear(), 0, 1);

  const mesesDecimo =
    mesesDecimoTerceiro ||
    diferencaMesesProporcionais(inicioAno, dataDesligamento);

  const feriasVencidas = possuiFeriasVencidas
    ? arredondar(
        salarioBaseMensal *
          Math.max(1, quantidadeFeriasVencidas || 1) *
          (4 / 3)
      )
    : 0;

  const feriasProporcionais = arredondar(
    ((salarioBaseMensal / 12) * mesesFerias) * (4 / 3)
  );

  const decimoTerceiroProporcional = arredondar(
    (salarioBaseMensal / 12) * mesesDecimo
  );

  const diasAviso =
    diasAvisoPrevioIndenizado ||
    (tipoAvisoPrevio === "Indenizado pelo empregador" ? 30 : 0);

  const avisoPrevio = arredondar((salarioBaseMensal / 30) * diasAviso);

  let multaFgts = multaFgtsManual ?? 0;

  if (!multaFgtsManual) {
    if (tipo === "Dispensa sem justa causa") {
      multaFgts = arredondar(saldoFgts * 0.4);
    }

    if (tipo === "Acordo entre as partes") {
      multaFgts = arredondar(saldoFgts * 0.2);
    }
  }

  const valorBrutoRescisao = arredondar(
    saldoSalario +
      feriasVencidas +
      feriasProporcionais +
      decimoTerceiroProporcional +
      avisoPrevio +
      multaFgts
  );

  const valorLiquidoRescisao = arredondar(
    Math.max(
      0,
      valorBrutoRescisao - descontoInss - descontoIrrf - outrosDescontos
    )
  );

  return {
    saldoSalario,
    feriasVencidas,
    feriasProporcionais,
    decimoTerceiroProporcional,
    avisoPrevio,
    multaFgts,
    valorBrutoRescisao,
    valorLiquidoRescisao,
    valorRescisao: valorLiquidoRescisao,
    mesesFerias,
    mesesDecimo,
  };
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const rescisoes = await prisma.rescisaoRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        arquivada: false,
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            cargo: true,
            salarioBase: true,
            salario: true,
            dataAdmissao: true,
            departamento: {
              select: { nome: true },
            },
          },
        },
      },
      orderBy: [{ criadoEm: "desc" }],
      take: 100,
    });

    return NextResponse.json(rescisoes);
  } catch (error: any) {
    console.error("Erro ao listar rescisões RH:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao listar rescisões RH" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const funcionarioId = Number(body?.funcionarioId || 0);

    if (!funcionarioId) {
      return NextResponse.json(
        { error: "Funcionário é obrigatório." },
        { status: 400 }
      );
    }

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: funcionarioId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado." },
        { status: 404 }
      );
    }

    const tipo = String(body?.tipo || "").trim();
    const dataAviso = parseDate(body?.dataAviso);
    const dataDesligamento = parseDate(body?.dataDesligamento);
    const dataAdmissaoBase =
      parseDate(body?.dataAdmissaoBase) || funcionario.dataAdmissao || null;
    const dataComunicacaoOficial =
      parseDate(body?.dataComunicacaoOficial) || dataAviso;

    const salarioBaseMensal =
      parseDecimal(body?.salarioBaseMensal) ??
      parseDecimal(funcionario.salarioBase) ??
      parseDecimal(funcionario.salario);

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo de rescisão é obrigatório." },
        { status: 400 }
      );
    }

    if (!dataDesligamento) {
      return NextResponse.json(
        { error: "Data de desligamento é obrigatória." },
        { status: 400 }
      );
    }

    if (!dataAdmissaoBase) {
      return NextResponse.json(
        {
          error:
            "O funcionário precisa ter Data de Admissão cadastrada antes de registrar a rescisão.",
        },
        { status: 400 }
      );
    }

    if (!salarioBaseMensal || salarioBaseMensal <= 0) {
      return NextResponse.json(
        {
          error:
            "O funcionário precisa ter Salário Base cadastrado antes de registrar a rescisão.",
        },
        { status: 400 }
      );
    }

    if (dataDesligamento < dataAdmissaoBase) {
      return NextResponse.json(
        {
          error:
            "A data de desligamento não pode ser anterior à data de admissão.",
        },
        { status: 400 }
      );
    }

    const calculoAutomatico = body?.calculoAutomatico !== false;

    const valoresCalculados = calcularRescisao({
      tipo,
      salarioBaseMensal,
      dataAdmissaoBase,
      dataDesligamento,
      possuiFeriasVencidas: Boolean(body?.possuiFeriasVencidas),
      quantidadeFeriasVencidas: Number(body?.quantidadeFeriasVencidas || 0),
      mesesFeriasProporcionais: Number(body?.mesesFeriasProporcionais || 0),
      mesesDecimoTerceiro: Number(body?.mesesDecimoTerceiro || 0),
      tipoAvisoPrevio: body?.tipoAvisoPrevio
        ? String(body.tipoAvisoPrevio).trim()
        : null,
      diasAvisoPrevioIndenizado: Number(
        body?.diasAvisoPrevioIndenizado || 0
      ),
      saldoFgts: numero(body?.saldoFgts),
      multaFgtsManual: parseDecimal(body?.multaFgts),
      descontoInss: numero(body?.descontoInss),
      descontoIrrf: numero(body?.descontoIrrf),
      outrosDescontos: numero(body?.outrosDescontos),
    });

    const saldoSalario = calculoAutomatico
      ? valoresCalculados.saldoSalario
      : parseDecimal(body?.saldoSalario);

    const feriasVencidas = calculoAutomatico
      ? valoresCalculados.feriasVencidas
      : parseDecimal(body?.feriasVencidas);

    const feriasProporcionais = calculoAutomatico
      ? valoresCalculados.feriasProporcionais
      : parseDecimal(body?.feriasProporcionais);

    const decimoTerceiroProporcional = calculoAutomatico
      ? valoresCalculados.decimoTerceiroProporcional
      : parseDecimal(body?.decimoTerceiroProporcional);

    const avisoPrevio = calculoAutomatico
      ? valoresCalculados.avisoPrevio
      : parseDecimal(body?.avisoPrevio);

    const multaFgts = calculoAutomatico
      ? valoresCalculados.multaFgts
      : parseDecimal(body?.multaFgts);

    const valorBrutoRescisao = calculoAutomatico
      ? valoresCalculados.valorBrutoRescisao
      : parseDecimal(body?.valorBrutoRescisao);

    const valorLiquidoRescisao = calculoAutomatico
      ? valoresCalculados.valorLiquidoRescisao
      : parseDecimal(body?.valorLiquidoRescisao);

    const valorRescisao = calculoAutomatico
      ? valoresCalculados.valorRescisao
      : parseDecimal(body?.valorRescisao);

    if (calculoAutomatico && (!valorLiquidoRescisao || valorLiquidoRescisao <= 0)) {
      return NextResponse.json(
        {
          error:
            "A rescisão ficou zerada. Revise salário, data de desligamento, FGTS, férias e descontos antes de registrar.",
        },
        { status: 400 }
      );
    }

    const rescisao = await prisma.$transaction(async (tx) => {
      const novaRescisao = await tx.rescisaoRH.create({
        data: {
          funcionarioId,
          instituicaoId: user.instituicaoId,
          criadoPorId: user.id,

          tipo,
          dataAviso,
          dataDesligamento,
          motivo: body?.motivo ? String(body.motivo).trim() : null,

          dataAdmissaoBase,
          dataComunicacaoOficial,
          salarioBaseMensal,

          quantidadeDependentesIRRF: Number(
            body?.quantidadeDependentesIRRF || 0
          ),
          quantidadeFilhosSalarioFamilia: Number(
            body?.quantidadeFilhosSalarioFamilia || 0
          ),

          tipoAvisoPrevio: body?.tipoAvisoPrevio
            ? String(body.tipoAvisoPrevio).trim()
            : null,

          motivoRescisaoDetalhado: body?.motivoRescisaoDetalhado
            ? String(body.motivoRescisaoDetalhado).trim()
            : null,

          diasAvisoPrevioTrabalhado: Number(
            body?.diasAvisoPrevioTrabalhado || 0
          ),
          diasAvisoPrevioIndenizado: Number(
            body?.diasAvisoPrevioIndenizado || 0
          ),

          possuiFeriasVencidas: Boolean(body?.possuiFeriasVencidas),
          quantidadeFeriasVencidas: Number(
            body?.quantidadeFeriasVencidas || 0
          ),
          mesesFeriasProporcionais: calculoAutomatico
            ? valoresCalculados.mesesFerias
            : Number(body?.mesesFeriasProporcionais || 0),
          mesesDecimoTerceiro: calculoAutomatico
            ? valoresCalculados.mesesDecimo
            : Number(body?.mesesDecimoTerceiro || 0),

          saldoFgts: parseDecimal(body?.saldoFgts),
          fgtsMesAnterior: parseDecimal(body?.fgtsMesAnterior),
          fgtsMesRescisao: parseDecimal(body?.fgtsMesRescisao),
          multaFgts,

          descontoInss: parseDecimal(body?.descontoInss),
          descontoIrrf: parseDecimal(body?.descontoIrrf),
          outrosDescontos: parseDecimal(body?.outrosDescontos),

          valorBrutoRescisao,
          valorLiquidoRescisao,

          calculoAutomatico,

          saldoSalario,
          feriasVencidas,
          feriasProporcionais,
          decimoTerceiroProporcional,
          avisoPrevio,
          valorRescisao,

          status: String(body?.status || "EM_ANDAMENTO"),
          observacoes: body?.observacoes
            ? String(body.observacoes).trim()
            : null,
        },
      });

      await tx.historicoRH.create({
        data: {
          funcionarioId,
          instituicaoId: user.instituicaoId,
          criadoPorId: user.id,
          tipo: "RESCISAO",
          titulo: "Rescisão registrada",
          descricao: `Rescisão ${tipo} registrada com desligamento em ${dataDesligamento.toLocaleDateString(
            "pt-BR"
          )}. Valor líquido: ${Number(valorLiquidoRescisao || 0).toLocaleString(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL",
            }
          )}.`,
          dataEvento: new Date(),
          observacoes: body?.motivo ? String(body.motivo).trim() : null,
        },
      });

      return novaRescisao;
    });

    return NextResponse.json(rescisao, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar rescisão RH:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar rescisão RH" },
      { status: 500 }
    );
  }
}