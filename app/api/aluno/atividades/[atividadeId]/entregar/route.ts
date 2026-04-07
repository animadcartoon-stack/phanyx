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

    if (!Number.isFinite(atividadeId) || atividadeId <= 0) {
      return NextResponse.json(
        { error: "Atividade inválida" },
        { status: 400 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: auth.userId,
        instituicaoId: auth.instituicaoId,
      },
      select: {
  id: true,
  instituicaoId: true,
  titulo: true,
  prazo: true,
},

    if (!aluno) {
      return NextResponse.json(
        { error: "Perfil de aluno não encontrado" },
        { status: 404 }
      );
    }

    const atividade = await prisma.atividade.findFirst({
      
      where: {
        id: atividadeId,
        instituicaoId: auth.instituicaoId,
        status: "PUBLICADA",
      },
      select: {
  id: true,
  instituicaoId: true,
  titulo: true,
  prazo: true, 
},
    });

if (atividade.prazo && new Date() > new Date(atividade.prazo)) {
  return NextResponse.json(
    { error: "Prazo da atividade encerrado" },
    { status: 403 }
  );
}

    if (!atividade) {
      return NextResponse.json(
        { error: "Atividade não encontrada ou indisponível" },
        { status: 404 }
      );
    }

    const body = await req.json();

const parsed = entregarAtividadeSchema.safeParse({
  texto: body?.texto ?? "",
  link: body?.link ?? "",
  arquivoUrl: body?.arquivoUrl ?? "",
});

if (!parsed.success) {
  return NextResponse.json(
    { error: "Dados inválidos", details: parsed.error.flatten() },
    { status: 400 }
  );
}

const textoFinal = parsed.data.texto?.trim() || null;
const linkFinal = parsed.data.link?.trim() || null;
const arquivoUrl = parsed.data.arquivoUrl?.trim() || null;

if (!textoFinal && !linkFinal && !arquivoUrl) {
  return NextResponse.json(
    { error: "Envie pelo menos texto, link ou arquivo" },
    { status: 400 }
  );
}

    const entrega = await prisma.entregaAtividade.upsert({
      where: {
        atividadeId_alunoId: {
          atividadeId: atividade.id,
          alunoId: aluno.id,
        },
      },
      update: {
        texto: textoFinal,
        link: linkFinal,
        arquivoUrl,
        entregueEm: new Date(),
      },
      create: {
        instituicaoId: aluno.instituicaoId,
        atividadeId: atividade.id,
        alunoId: aluno.id,
        texto: textoFinal,
        link: linkFinal,
        arquivoUrl,
      },
      include: {
        atividade: {
          select: {
            id: true,
            titulo: true,
            notaMaxima: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Atividade entregue com sucesso",
      entrega: {
        id: entrega.id,
        texto: entrega.texto,
        link: entrega.link,
        arquivoUrl: entrega.arquivoUrl,
        entregueEm: entrega.entregueEm,
        atividade: entrega.atividade,
      },
    });
  } catch (e: any) {
    console.error("ERRO AO ENTREGAR ATIVIDADE:", e);

    return NextResponse.json(
      { error: e.message || "Erro ao entregar atividade" },
      { status: 401 }
    );
  }
}