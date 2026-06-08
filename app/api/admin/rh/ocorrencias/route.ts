import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseData(valor?: string | null) {
  if (!valor) return null;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  return data;
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const ocorrencias = await prisma.ocorrenciaRH.findMany({
      where: {
  instituicaoId: user.instituicaoId,
  arquivada: false,
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
      },
      orderBy: { criadoEm: "desc" },
      take: 100,
    });

    return NextResponse.json(ocorrencias);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar ocorrências RH." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();

    const funcionarioId = Number(body.funcionarioId);

    if (!funcionarioId) {
      return NextResponse.json(
        { error: "Selecione um funcionário." },
        { status: 400 }
      );
    }

    if (!body.tipo) {
      return NextResponse.json(
        { error: "Selecione o tipo da ocorrência." },
        { status: 400 }
      );
    }

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: funcionarioId,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true, nome: true },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado." },
        { status: 404 }
      );
    }

    const ocorrencia = await prisma.ocorrenciaRH.create({
      data: {
        funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        tipo: String(body.tipo),
        motivo: body.motivo || null,
        descricao: body.descricao || null,
        status: body.status || "REGISTRADA",
        dataEvento: parseData(body.dataEvento) || new Date(),
        dataInicio: parseData(body.dataInicio),
        dataFim: parseData(body.dataFim),
        dias: body.dias ? Number(body.dias) : null,
        cid: body.cid || null,
        dataPericia: parseData(body.dataPericia),
        resultadoPericia: body.resultadoPericia || null,
        documentoUrl: body.documentoUrl || null,
      },
    });

    await prisma.historicoRH.create({
      data: {
        funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        tipo: String(body.tipo),
        titulo: `Ocorrência RH - ${String(body.tipo)}`,
        descricao: body.descricao || body.motivo || null,
        dataEvento: parseData(body.dataEvento) || new Date(),
        observacoes: "Registro criado automaticamente a partir de Ocorrências RH.",
      },
    });

    return NextResponse.json(ocorrencia);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao registrar ocorrência RH." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();

    const ocorrenciaId = Number(body.ocorrenciaId);
    const motivoArquivo = String(body.motivoArquivo || "").trim();

    if (!ocorrenciaId) {
      return NextResponse.json(
        { error: "Informe a ocorrência." },
        { status: 400 }
      );
    }

    if (!motivoArquivo) {
      return NextResponse.json(
        { error: "Informe o motivo do arquivamento." },
        { status: 400 }
      );
    }

    const ocorrencia = await prisma.ocorrenciaRH.findFirst({
      where: {
        id: ocorrenciaId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!ocorrencia) {
      return NextResponse.json(
        { error: "Ocorrência não encontrada." },
        { status: 404 }
      );
    }

    const atualizada = await prisma.ocorrenciaRH.update({
      where: { id: ocorrencia.id },
      data: {
        arquivada: true,
        arquivadaEm: new Date(),
        arquivadaPorId: user.id,
        motivoArquivo,
        status: "ARQUIVADA",
      },
    });

    await prisma.historicoRH.create({
      data: {
        funcionarioId: ocorrencia.funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        tipo: "ARQUIVAMENTO_OCORRENCIA",
        titulo: "Ocorrência RH arquivada",
        descricao: motivoArquivo,
        dataEvento: new Date(),
        observacoes:
          "Ocorrência arquivada sem exclusão física. Registro mantido para auditoria.",
      },
    });

    return NextResponse.json(atualizada);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao arquivar ocorrência RH." },
      { status: 500 }
    );
  }
}