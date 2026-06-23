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

    const dataAviso = parseDate(body?.dataAviso);
    const dataDesligamento = parseDate(body?.dataDesligamento);
    const dataAdmissaoBase =
      parseDate(body?.dataAdmissaoBase) || funcionario.dataAdmissao || null;
    const dataComunicacaoOficial =
      parseDate(body?.dataComunicacaoOficial) || dataAviso;

    if (!body?.tipo) {
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

    const rescisao = await prisma.$transaction(async (tx) => {
      const novaRescisao = await tx.rescisaoRH.create({
        data: {
          funcionarioId,
          instituicaoId: user.instituicaoId,
          criadoPorId: user.id,

          tipo: String(body.tipo).trim(),
          dataAviso,
          dataDesligamento,
          motivo: body?.motivo ? String(body.motivo).trim() : null,

          dataAdmissaoBase,
dataComunicacaoOficial,
salarioBaseMensal:
  parseDecimal(body?.salarioBaseMensal) ??
  parseDecimal(funcionario.salarioBase) ??
  parseDecimal(funcionario.salario),

quantidadeDependentesIRRF: Number(body?.quantidadeDependentesIRRF || 0),
quantidadeFilhosSalarioFamilia: Number(
  body?.quantidadeFilhosSalarioFamilia || 0
),

tipoAvisoPrevio: body?.tipoAvisoPrevio
  ? String(body.tipoAvisoPrevio).trim()
  : null,

motivoRescisaoDetalhado: body?.motivoRescisaoDetalhado
  ? String(body.motivoRescisaoDetalhado).trim()
  : null,

diasAvisoPrevioTrabalhado: Number(body?.diasAvisoPrevioTrabalhado || 0),
diasAvisoPrevioIndenizado: Number(body?.diasAvisoPrevioIndenizado || 0),

possuiFeriasVencidas: Boolean(body?.possuiFeriasVencidas),
quantidadeFeriasVencidas: Number(body?.quantidadeFeriasVencidas || 0),
mesesFeriasProporcionais: Number(body?.mesesFeriasProporcionais || 0),
mesesDecimoTerceiro: Number(body?.mesesDecimoTerceiro || 0),

saldoFgts: parseDecimal(body?.saldoFgts),
fgtsMesAnterior: parseDecimal(body?.fgtsMesAnterior),
fgtsMesRescisao: parseDecimal(body?.fgtsMesRescisao),
multaFgts: parseDecimal(body?.multaFgts),

descontoInss: parseDecimal(body?.descontoInss),
descontoIrrf: parseDecimal(body?.descontoIrrf),
outrosDescontos: parseDecimal(body?.outrosDescontos),

valorBrutoRescisao: parseDecimal(body?.valorBrutoRescisao),
valorLiquidoRescisao: parseDecimal(body?.valorLiquidoRescisao),

calculoAutomatico: body?.calculoAutomatico !== false,

          saldoSalario: parseDecimal(body?.saldoSalario),
          feriasVencidas: parseDecimal(body?.feriasVencidas),
          feriasProporcionais: parseDecimal(body?.feriasProporcionais),
          decimoTerceiroProporcional: parseDecimal(
            body?.decimoTerceiroProporcional
          ),
          avisoPrevio: parseDecimal(body?.avisoPrevio),
          valorRescisao: parseDecimal(body?.valorRescisao),

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
          descricao: `Rescisão ${String(body.tipo).trim()} registrada com desligamento em ${dataDesligamento.toLocaleDateString(
            "pt-BR"
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