import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";

function gerarSenhaTemporaria() {
  return randomBytes(9).toString("base64url");
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão para redefinir este acesso" },
        { status: 403 }
      );
    }

    const usuarioSolicitanteId = Number(user.id);
    const poloId = Number(params.id);

    if (
      !Number.isInteger(usuarioSolicitanteId) ||
      usuarioSolicitanteId <= 0
    ) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 401 }
      );
    }

    if (!Number.isInteger(poloId) || poloId <= 0) {
      return NextResponse.json(
        { error: "Polo inválido" },
        { status: 400 }
      );
    }

    const polo = await prisma.polo.findFirst({
      where: {
        id: poloId,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        nome: true,
        responsavelEmail: true,
        instituicaoGeradaId: true,
      },
    });

    if (!polo) {
      return NextResponse.json(
        { error: "Polo não encontrado" },
        { status: 404 }
      );
    }

    if (!polo.instituicaoGeradaId) {
      return NextResponse.json(
        {
          error:
            "Este polo ainda não possui uma instituição e um acesso institucional.",
        },
        { status: 409 }
      );
    }

    let administrador = null;

    /*
     * Primeiro tenta localizar o administrador pelo e-mail
     * registrado como responsável pelo polo.
     */
    if (polo.responsavelEmail) {
      administrador = await prisma.user.findFirst({
        where: {
          instituicaoId: polo.instituicaoGeradaId,
          role: Role.ADMIN,
          ativo: true,
          email: {
            equals: polo.responsavelEmail,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          nome: true,
          email: true,
          instituicaoId: true,
        },
      });
    }

    /*
     * Caso o e-mail do polo tenha sido alterado depois da
     * criação, usa o primeiro administrador ativo da unidade.
     */
    if (!administrador) {
      administrador = await prisma.user.findFirst({
        where: {
          instituicaoId: polo.instituicaoGeradaId,
          role: Role.ADMIN,
          ativo: true,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          nome: true,
          email: true,
          instituicaoId: true,
        },
      });
    }

    if (!administrador) {
      return NextResponse.json(
        {
          error:
            "Não foi encontrado um administrador ativo para esta unidade.",
        },
        { status: 404 }
      );
    }

    const senhaTemporaria = gerarSenhaTemporaria();

    const senhaCriptografada = await bcrypt.hash(
      senhaTemporaria,
      10
    );

    await prisma.user.update({
      where: {
        id: administrador.id,
      },
      data: {
        senha: senhaCriptografada,
        precisaTrocarSenha: true,
        resetToken: null,
        resetTokenExpira: null,
      },
    });

    /*
     * Não registra a senha no log.
     * Registra somente quem solicitou e qual usuário foi alterado.
     */
    console.info(
      "Senha institucional temporária redefinida:",
      {
        poloId: polo.id,
        instituicaoGeradaId: polo.instituicaoGeradaId,
        administradorId: administrador.id,
        redefinidoPorId: usuarioSolicitanteId,
        redefinidoEm: new Date().toISOString(),
      }
    );

    return NextResponse.json({
      sucesso: true,
      mensagem:
        "Nova senha temporária criada com sucesso.",
      instituicao: {
        id: polo.instituicaoGeradaId,
        nome: polo.nome,
      },
      usuario: {
        id: administrador.id,
        nome: administrador.nome,
        email: administrador.email,
      },
      credenciaisTemporarias: {
        login: administrador.email,
        senha: senhaTemporaria,
        precisaTrocarSenha: true,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao redefinir senha institucional do polo:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao gerar uma nova senha temporária para a unidade.",
      },
      { status: 500 }
    );
  }
}