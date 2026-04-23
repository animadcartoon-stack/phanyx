import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const polos = await prisma.polo.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(polos);
  } catch (error) {
    console.error("Erro ao buscar polos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar polos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const nome = String(body?.nome ?? "").trim();
    const codigo = String(body?.codigo ?? "").trim();
    const descricao = String(body?.descricao ?? "").trim();
    const cidade = String(body?.cidade ?? "").trim();
    const estado = String(body?.estado ?? "").trim();
    const endereco = String(body?.endereco ?? "").trim();
    const ativo =
      body?.ativo !== undefined ? Boolean(body.ativo) : true;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome do polo é obrigatório" },
        { status: 400 }
      );
    }

    const poloExistente = await prisma.polo.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        OR: [
          { nome },
          ...(codigo ? [{ codigo }] : []),
        ],
      },
    });

    if (poloExistente) {
      return NextResponse.json(
        { error: "Já existe um polo com esse nome ou código" },
        { status: 400 }
      );
    }

    const polo = await prisma.polo.create({
      data: {
        nome,
        codigo: codigo || null,
        descricao: descricao || null,
        cidade: cidade || null,
        estado: estado || null,
        endereco: endereco || null,
        ativo,
        instituicaoId: user.instituicaoId,
      },
    });

    return NextResponse.json(polo, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar polo:", error);
    return NextResponse.json(
      { error: "Erro ao criar polo" },
      { status: 500 }
    );
  }
}