import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function parseDate(valor: any) {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const exames = await prisma.exameMedicoRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        arquivado: false,
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            cargo: true,
            departamento: {
              select: { nome: true },
            },
          },
        },
      },
      orderBy: [{ dataExame: "desc" }, { criadoEm: "desc" }],
      take: 100,
    });

    return NextResponse.json(exames);
  } catch (error: any) {
    console.error("Erro ao listar exames médicos RH:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao listar exames médicos RH" },
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

    const dataExame = parseDate(body?.dataExame);
    const validade = parseDate(body?.validade);

    if (!body?.tipo) {
      return NextResponse.json(
        { error: "Tipo de exame é obrigatório." },
        { status: 400 }
      );
    }

    if (!dataExame) {
      return NextResponse.json(
        { error: "Data do exame é obrigatória." },
        { status: 400 }
      );
    }

    const exame = await prisma.$transaction(async (tx) => {
      const novoExame = await tx.exameMedicoRH.create({
        data: {
          funcionarioId,
          instituicaoId: user.instituicaoId,
          criadoPorId: user.id,

          tipo: String(body.tipo).trim(),
          dataExame,
          validade,

          clinica: body?.clinica ? String(body.clinica).trim() : null,
          medico: body?.medico ? String(body.medico).trim() : null,
          crm: body?.crm ? String(body.crm).trim() : null,
          resultado: body?.resultado ? String(body.resultado).trim() : null,
          arquivoUrl: body?.arquivoUrl ? String(body.arquivoUrl).trim() : null,
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
          tipo: "EXAME_MEDICO",
          titulo: "Exame médico registrado",
          descricao: `Exame ${String(body.tipo).trim()} registrado em ${dataExame.toLocaleDateString(
            "pt-BR"
          )}.`,
          dataEvento: new Date(),
          observacoes: body?.observacoes
            ? String(body.observacoes).trim()
            : null,
        },
      });

      return novoExame;
    });

    return NextResponse.json(exame, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar exame médico RH:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar exame médico RH" },
      { status: 500 }
    );
  }
}