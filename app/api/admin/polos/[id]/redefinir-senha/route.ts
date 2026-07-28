import { NextResponse } from "next/server";
import {
  Role,
  StatusComercialPolo,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import {
  filtroPoloGerenciavel,
  obterContextoGestaoPolos,
} from "@/lib/polos-rede";

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
        {
          error:
            "Sem permissão para redefinir este acesso.",
        },
        { status: 403 }
      );
    }

    const usuarioSolicitanteId =
      Number(user.id);

    const poloId = Number(params.id);

    if (
      !Number.isInteger(
        usuarioSolicitanteId
      ) ||
      usuarioSolicitanteId <= 0
    ) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 401 }
      );
    }

    if (
      !Number.isInteger(poloId) ||
      poloId <= 0
    ) {
      return NextResponse.json(
        { error: "Polo inválido" },
        { status: 400 }
      );
    }

    const contexto = await obterContextoGestaoPolos(
      user.instituicaoId
    );

    if (!contexto) {
      return NextResponse.json(
        { error: "Instituição não encontrada" },
        { status: 404 }
      );
    }

    if (!contexto.podeGerenciarPolos) {
      return NextResponse.json(
        {
          error:
            "A gestão de polos não está habilitada para esta unidade.",
        },
        { status: 403 }
      );
    }

    const polo =
      await prisma.polo.findFirst({
        where: filtroPoloGerenciavel(
          contexto,
          poloId
        ),
        select: {
          id: true,
          nome: true,
          ativo: true,
          statusComercial: true,
          responsavelEmail: true,
          instituicaoGeradaId: true,
        },
      });

    if (!polo) {
      return NextResponse.json(
        {
          error:
            "Polo não encontrado ou fora do escopo de gestão desta unidade.",
        },
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

    if (
      !polo.ativo ||
      polo.statusComercial !==
        StatusComercialPolo.ATIVO
    ) {
      return NextResponse.json(
        {
          error:
            "Não é possível gerar senha para um polo suspenso ou encerrado.",
        },
        { status: 409 }
      );
    }

    const instituicaoGerada =
      await prisma.instituicao.findUnique({
        where: {
          id: polo.instituicaoGeradaId,
        },
        select: {
          id: true,
          ativo: true,
        },
      });

    if (!instituicaoGerada?.ativo) {
      return NextResponse.json(
        {
          error:
            "A instituição vinculada a este polo está inativa.",
        },
        { status: 409 }
      );
    }

    let administrador = null;

    if (polo.responsavelEmail) {
      administrador =
        await prisma.user.findFirst({
          where: {
            instituicaoId:
              polo.instituicaoGeradaId,
            role: Role.ADMIN,
            ativo: true,
            email: {
              equals:
                polo.responsavelEmail,
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

    if (!administrador) {
      administrador =
        await prisma.user.findFirst({
          where: {
            instituicaoId:
              polo.instituicaoGeradaId,
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

    const senhaTemporaria =
      gerarSenhaTemporaria();

    const senhaCriptografada =
      await bcrypt.hash(
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

    console.info(
      "Senha institucional temporária redefinida:",
      {
        poloId: polo.id,
        instituicaoGeradaId:
          polo.instituicaoGeradaId,
        instituicaoContratanteId:
          contexto.instituicaoContratanteId,
        administradorId:
          administrador.id,
        redefinidoPorId:
          usuarioSolicitanteId,
        redefinidoEm:
          new Date().toISOString(),
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