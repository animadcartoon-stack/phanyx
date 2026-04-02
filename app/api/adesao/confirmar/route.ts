import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { enviarEmailAcesso } from "@/lib/email";

function gerarSlugInstituicao(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function gerarSenhaTemporaria() {
  const sufixo = Math.floor(1000 + Math.random() * 9000);
  return `Phanyx@${sufixo}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID da adesão é obrigatório." },
        { status: 400 }
      );
    }

    const adesao = await prisma.adesaoInstituicao.findUnique({
      where: { id: String(id) },
    });

    if (!adesao) {
      return NextResponse.json(
        { error: "Adesão não encontrada." },
        { status: 404 }
      );
    }

    if (adesao.status === "PAID" && adesao.instituicaoId) {
      return NextResponse.json(
        { error: "Esta adesão já foi confirmada." },
        { status: 400 }
      );
    }

    const emailExistente = await prisma.user.findUnique({
      where: { email: adesao.email.trim().toLowerCase() },
    });

    if (emailExistente) {
      return NextResponse.json(
        {
          error:
            "Já existe um usuário com este email. Use outro email para a instituição.",
        },
        { status: 400 }
      );
    }

    const slugBase = gerarSlugInstituicao(adesao.nomeInstituicao);
    const slugFinal = `${slugBase}-${Date.now()}`;

    const senhaTemporaria = gerarSenhaTemporaria();
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    const instituicao = await prisma.instituicao.create({
      data: {
        nome: adesao.nomeInstituicao,
        slug: slugFinal,
        plano: adesao.plano,
      },
    });

    const admin = await prisma.user.create({
      data: {
        nome: adesao.nomeResponsavel,
        email: adesao.email.trim().toLowerCase(),
        senha: senhaHash,
        role: "ADMIN",
        precisaTrocarSenha: true,
        instituicao: {
          connect: { id: instituicao.id },
        },
      },
    });

    const adesaoAtualizada = await prisma.adesaoInstituicao.update({
      where: { id: adesao.id },
      data: {
        status: "PAID",
        instituicaoId: instituicao.id,
      },
    });

const portal = `${process.env.NEXT_PUBLIC_BASE_URL}/login?portal=admin`;

try {
  await enviarEmailAcesso({
  email: admin.email,
  nome: admin.nome,
  senha: senhaTemporaria,
  instituicao: instituicao.nome,
});
} catch (emailError) {
  console.error("ERRO AO ENVIAR EMAIL DE ACESSO:", emailError);
}

    return NextResponse.json({
      success: true,
      adesao: adesaoAtualizada,
      instituicao: {
        id: instituicao.id,
        nome: instituicao.nome,
        plano: instituicao.plano,
      },
      admin: {
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
      },
      acesso: {
        login: admin.email,
        senhaTemporaria,
        portal: "/login?portal=admin",
      },
    });
  } catch (error: any) {
    console.error("ERRO CONFIRMAR ADESAO:", error);

    return NextResponse.json(
      {
        error: "Erro ao confirmar adesão",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}