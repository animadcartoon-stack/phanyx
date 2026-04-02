import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertAluno } from "@/lib/auth/getAuth";
import { entregarAtividadeSchema } from "@/lib/validators/atividade";

export async function POST(
  req: NextRequest,
  ctx: { params: { atividadeId: string } }
) {
  try {
    const auth = getAuth(req);
    assertAluno(auth);

    const atividadeId = Number(ctx.params.atividadeId);

    const aluno: any = await prisma.aluno.findFirst({
      where: {
        userId: auth.userId,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Perfil de aluno não encontrado" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const parsed = entregarAtividadeSchema.safeParse({
      texto: body.texto ?? "",
      link: body.link ?? "",
      arquivoUrl: body.arquivoUrl ?? "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const semTexto = !parsed.data.texto || parsed.data.texto.trim() === "";
    const semLink = !parsed.data.link || parsed.data.link.trim() === "";
    const semArquivo =
      !parsed.data.arquivoUrl || parsed.data.arquivoUrl.trim() === "";

    if (semTexto && semLink && semArquivo) {
      return NextResponse.json(
        { error: "Envie pelo menos texto, link ou arquivoUrl" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Endpoint de entrega preparado",
      payload: {
        atividadeId,
        alunoId: aluno.id,
        texto: parsed.data.texto || null,
        link: parsed.data.link || null,
        arquivoUrl: parsed.data.arquivoUrl || null,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao entregar atividade" },
      { status: 401 }
    );
  }
}