import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user?.instituicaoId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const registros = await prisma.ouvidoria.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return NextResponse.json({ registros });
  } catch (error) {
    console.error("Erro ao listar ouvidoria:", error);
    return NextResponse.json(
      { error: "Erro ao listar registros da ouvidoria" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user?.instituicaoId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();

    const tipo = String(body.tipo || "").trim();
    const titulo = String(body.titulo || "").trim();
    const mensagem = String(body.mensagem || "").trim();
    const origem = String(body.origem || user.role || "USUARIO").toUpperCase();
    const anonimo = Boolean(body.anonimo);

    if (!tipo || !mensagem) {
      return NextResponse.json(
        { error: "Tipo e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    const texto = `${tipo} ${titulo} ${mensagem}`.toLowerCase();

    const sentimento =
      texto.includes("ótimo") ||
      texto.includes("excelente") ||
      texto.includes("parabéns") ||
      texto.includes("gostei")
        ? "POSITIVO"
        : texto.includes("problema") ||
          texto.includes("reclama") ||
          texto.includes("ruim") ||
          texto.includes("demora") ||
          texto.includes("não consigo")
        ? "CRITICO"
        : "NEUTRO";

    const prioridade =
      sentimento === "CRITICO" || tipo.toLowerCase().includes("reclama")
        ? "ALTA"
        : "NORMAL";

    const registro = await prisma.ouvidoria.create({
      data: {
        instituicaoId: user.instituicaoId,
        usuarioId: user.id,
        origem,
        tipo,
        titulo,
        mensagem,
        anonimo,
        sentimento,
        prioridade,
        status: "ABERTO",
      },
    });

    return NextResponse.json({ ok: true, registro });
  } catch (error) {
    console.error("Erro ao criar ouvidoria:", error);
    return NextResponse.json(
      { error: "Erro ao enviar manifestação" },
      { status: 500 }
    );
  }
}