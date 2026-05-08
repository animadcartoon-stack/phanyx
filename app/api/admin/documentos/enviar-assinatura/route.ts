import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { enviarEmailAssinaturaContrato } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "SECRETARIA" &&
      user.role !== "COORDENADOR"
    ) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const contratoId = Number(body?.contratoId);

    if (!contratoId) {
      return NextResponse.json(
        { error: "Contrato inválido" },
        { status: 400 }
      );
    }

    const contrato = await prisma.contrato.findFirst({
      where: {
        id: contratoId,
        instituicaoId: user.instituicaoId,
      },
      include: {
        aluno: {
          include: {
            user: true,
          },
        },
        instituicao: true,
        matricula: {
          include: {
            curso: true,
          },
        },
      },
    });

    if (!contrato) {
      return NextResponse.json(
        { error: "Contrato não encontrado" },
        { status: 404 }
      );
    }

    if (contrato.status === "ASSINADO") {
      return NextResponse.json(
        { error: "Este contrato já foi assinado" },
        { status: 400 }
      );
    }

    const tokenAssinatura = contrato.tokenAssinatura || randomUUID();

    if (!contrato.tokenAssinatura) {
      await prisma.contrato.update({
        where: { id: contrato.id },
        data: { tokenAssinatura },
      });
    }

    const emailAluno = contrato.aluno?.user?.email;

    if (!emailAluno) {
      return NextResponse.json(
        { error: "Aluno não possui e-mail vinculado ao usuário" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://phanyx.com.br";

    const linkAssinatura = `${baseUrl}/assinatura/${tokenAssinatura}`;

    await enviarEmailAssinaturaContrato({
      email: emailAluno,
      nome: contrato.aluno.nome,
      instituicao: contrato.instituicao.nome,
      titulo: contrato.matricula?.curso?.nome
        ? `Contrato de matrícula - ${contrato.matricula.curso.nome}`
        : "Contrato",
      linkAssinatura,
    });

    return NextResponse.json({
      ok: true,
      message: "E-mail de assinatura enviado com sucesso",
      linkAssinatura,
    });
  } catch (error: any) {
    console.error("Erro ao enviar assinatura:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao enviar assinatura" },
      { status: 500 }
    );
  }
}