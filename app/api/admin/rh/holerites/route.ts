import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toDecimalNumber(valor: any) {
  return Number(valor || 0);
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const holerites = await prisma.holeriteRH.findMany({
      where: {
  instituicaoId: user.instituicaoId,
  arquivado: false,
},
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cargo: true,
            codigoFuncionario: true,
            departamento: { select: { nome: true } },
          },
        },
        eventos: true,
      },
      orderBy: [
        { competenciaAno: "desc" },
        { competenciaMes: "desc" },
      ],
      take: 100,
    });

    return NextResponse.json(holerites);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar holerites." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const funcionarioId = Number(body.funcionarioId);
    const competenciaMes = Number(body.competenciaMes);
    const competenciaAno = Number(body.competenciaAno);

    const salarioBase = toDecimalNumber(body.salarioBase);
    const eventos = Array.isArray(body.eventos) ? body.eventos : [];

    if (!funcionarioId || !competenciaMes || !competenciaAno) {
      return NextResponse.json(
        { error: "Informe funcionário, mês e ano da competência." },
        { status: 400 }
      );
    }

    const totalVencimentos = eventos
  .filter((e: any) => e.tipo === "VENCIMENTO")
  .reduce((acc: number, e: any) => acc + toDecimalNumber(e.valor), 0);

const totalDescontos = eventos
  .filter((e: any) => e.tipo === "DESCONTO")
  .reduce((acc: number, e: any) => acc + toDecimalNumber(e.valor), 0);

const valorLiquido = totalVencimentos - totalDescontos;

    const holerite = await prisma.holeriteRH.create({
      data: {
        funcionarioId,
        instituicaoId: user.instituicaoId,
        criadoPorId: user.id,
        competenciaMes,
        competenciaAno,
        salarioBase,
        totalVencimentos,
        totalDescontos,
        valorLiquido,
        baseInss: body.baseInss || null,
        baseFgts: body.baseFgts || null,
        fgtsMes: body.fgtsMes || null,
        baseIrrf: body.baseIrrf || null,
        status: "GERADO",
        eventos: {
          create: eventos.map((e: any) => ({
            codigo: e.codigo || null,
            descricao: e.descricao,
            referencia: e.referencia || null,
            tipo: e.tipo,
            valor: toDecimalNumber(e.valor),
          })),
        },
      },
      include: {
        funcionario: true,
        eventos: true,
      },
    });

    return NextResponse.json(holerite);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao gerar holerite." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const holeriteId = Number(body.holeriteId);
    const motivoArquivo = String(body.motivoArquivo || "").trim();

    if (!holeriteId) {
      return NextResponse.json({ error: "Informe o holerite." }, { status: 400 });
    }

    if (!motivoArquivo) {
      return NextResponse.json(
        { error: "Informe o motivo do arquivamento." },
        { status: 400 }
      );
    }

    const holerite = await prisma.holeriteRH.findFirst({
      where: {
        id: holeriteId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!holerite) {
      return NextResponse.json(
        { error: "Holerite não encontrado." },
        { status: 404 }
      );
    }

    const atualizado = await prisma.holeriteRH.update({
      where: { id: holerite.id },
      data: {
        arquivado: true,
        arquivadoEm: new Date(),
        arquivadoPorId: user.id,
        motivoArquivo,
        status: "ARQUIVADO",
      },
    });

    await prisma.historicoRH.create({
      data: {
        funcionarioId: holerite.funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        tipo: "ARQUIVAMENTO_HOLERITE",
        titulo: "Holerite arquivado",
        descricao: motivoArquivo,
        dataEvento: new Date(),
        observacoes:
          "Holerite arquivado sem exclusão física. Registro mantido para auditoria.",
      },
    });

    return NextResponse.json(atualizado);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao arquivar holerite." },
      { status: 500 }
    );
  }
}