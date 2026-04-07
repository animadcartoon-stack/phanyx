import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertAluno } from "@/lib/auth/getAuth";
import { entregarAtividadeSchema } from "@/lib/validators/atividade";
import { uploadArquivo } from "@/lib/storage/uploadArquivo";

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
        nome: true,
      },
    });

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

    const formData = await req.formData();

    const textoRaw = formData.get("texto");
    const linkRaw = formData.get("link");
    const arquivoRaw = formData.get("arquivo");

    const texto = typeof textoRaw === "string" ? textoRaw : "";
    const link = typeof linkRaw === "string" ? linkRaw : "";
    const arquivo =
      arquivoRaw instanceof File && arquivoRaw.size > 0 ? arquivoRaw : null;

    const parsed = entregarAtividadeSchema.safeParse({
      texto,
      link,
      arquivoUrl: "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let arquivoUrl: string | null = null;

    if (arquivo) {
      const upload = await uploadArquivo({
        file: arquivo,
        pasta: `atividades/${atividade.id}/aluno-${aluno.id}`,
      });

      arquivoUrl = upload.url;
    }

    const textoFinal = parsed.data.texto?.trim() || null;
    const linkFinal = parsed.data.link?.trim() || null;

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