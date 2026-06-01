import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const conversas = await prisma.chatConversa.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        participantes: {
          some: {
            usuarioId: user.id,
          },
        },
      },
      orderBy: {
        atualizadoEm: "desc",
      },
      include: {
        participantes: true,
        mensagens: {
          orderBy: {
            criadoEm: "desc",
          },
          take: 1,
          include: {
            anexos: true,
          },
        },
      },
    });

    const conversasFormatadas = conversas.map((conversa) => {
      const outroParticipante = conversa.participantes.find(
        (participante) => participante.usuarioId !== user.id
      );

      const ultimaMensagem = conversa.mensagens[0] || null;

      return {
        id: conversa.id,
        nome: outroParticipante?.nomeExibicao || "Conversa",
        role: outroParticipante?.papel || "",
        ultimaMensagem: ultimaMensagem?.texto || "",
        tipoUltimaMensagem: ultimaMensagem?.tipo || "",
        atualizadoEm: conversa.atualizadoEm,
      };
    });

    return NextResponse.json({
      conversas: conversasFormatadas,
    });
  } catch (error) {
    console.error("Erro ao listar conversas:", error);

    return NextResponse.json(
      { error: "Erro ao listar conversas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const outroUsuarioId = Number(body.usuarioId);

    if (!outroUsuarioId) {
      return NextResponse.json(
        { error: "Usuário inválido" },
        { status: 400 }
      );
    }

    const outroUsuario = await prisma.user.findFirst({
      where: {
        id: outroUsuarioId,
        ativo: true,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        nome: true,
        role: true,
      },
    });

    if (!outroUsuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const conversaExistente = await prisma.chatConversa.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        tipo: "INDIVIDUAL",
        participantes: {
          every: {
            usuarioId: {
              in: [user.id, outroUsuario.id],
            },
          },
        },
      },
      include: {
        participantes: true,
      },
    });

    if (
      conversaExistente &&
      conversaExistente.participantes.length === 2
    ) {
      return NextResponse.json({
        conversa: conversaExistente,
      });
    }

    const conversa = await prisma.chatConversa.create({
      data: {
        instituicaoId: user.instituicaoId,
        tipo: "INDIVIDUAL",
        criadaPorId: user.id,
        participantes: {
          create: [
            {
              usuarioId: user.id,
              nomeExibicao: user.nome,
              papel: user.role,
            },
            {
              usuarioId: outroUsuario.id,
              nomeExibicao: outroUsuario.nome,
              papel: outroUsuario.role,
            },
          ],
        },
      },
      include: {
        participantes: true,
      },
    });

    return NextResponse.json({
      conversa,
    });
  } catch (error) {
    console.error("Erro ao abrir conversa:", error);

    return NextResponse.json(
      { error: "Erro ao abrir conversa" },
      { status: 500 }
    );
  }
}