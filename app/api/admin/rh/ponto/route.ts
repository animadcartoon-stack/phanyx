import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function paraDataHora(data: string, hora?: string | null) {
  if (!hora) return null;
  return new Date(`${data}T${hora}:00`);
}

function calcularHoras(inicio: Date | null, fim: Date | null) {
  if (!inicio || !fim) return 0;
  return Math.max(0, (fim.getTime() - inicio.getTime()) / 1000 / 60 / 60);
}

export async function GET() {
  try {
    const user = await getUserFromToken();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const pontos = await prisma.pontoFuncionarioRH.findMany({
      where: { instituicaoId: user.instituicaoId },
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
      },
      orderBy: { data: "desc" },
      take: 100,
    });

    return NextResponse.json(pontos);
  } catch {
    return NextResponse.json({ error: "Erro ao carregar pontos." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();

    const data = String(body.data || "");
    const funcionarioId = Number(body.funcionarioId);

    if (!funcionarioId || !data) {
      return NextResponse.json({ error: "Informe funcionário e data." }, { status: 400 });
    }

    const entrada = paraDataHora(data, body.entrada);
    const saidaAlmoco = paraDataHora(data, body.saidaAlmoco);
    const retornoAlmoco = paraDataHora(data, body.retornoAlmoco);
    const saida = paraDataHora(data, body.saida);

    const horasManha = calcularHoras(entrada, saidaAlmoco);
    const horasTarde = calcularHoras(retornoAlmoco, saida);
    const horasTrabalhadas = horasManha + horasTarde;

    const jornada = Number(body.jornada || 8);
    const horasExtras = Math.max(0, horasTrabalhadas - jornada);
    const horasAtraso = Math.max(0, jornada - horasTrabalhadas);

    const ponto = await prisma.pontoFuncionarioRH.create({
      data: {
        funcionarioId,
        instituicaoId: user.instituicaoId,
        data: new Date(`${data}T00:00:00`),
        entrada,
        saidaAlmoco,
        retornoAlmoco,
        saida,
        horasTrabalhadas,
        horasExtras,
        horasAtraso,
        observacoes: body.observacoes || null,
        status: body.status || "REGISTRADO",
      },
    });

    return NextResponse.json(ponto);
  } catch {
    return NextResponse.json({ error: "Erro ao salvar ponto." }, { status: 500 });
  }
}