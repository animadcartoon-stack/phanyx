import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { planoTemRecurso } from "@/lib/plano-acesso";
import { assinaturaPermiteUso } from "@/lib/assinatura-acesso";
import { put } from "@vercel/blob";
import { gerarCertificadoVisualPdf } from "@/lib/certificados/gerarCertificadoVisualPdf";
import { resolverModeloCertificadoPublicado } from "@/lib/certificados/resolverModeloCertificadoPublicado";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function gerarCodigoCertificado(
  instituicaoId: number,
  alunoId: number,
  disciplinaId: number
) {
  const data = new Date();
  const ano = data.getFullYear();
  const sufixo = Date.now().toString(36).toUpperCase();

  return `PHX-${instituicaoId}-${ano}-${alunoId}-${disciplinaId}-${sufixo}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
    });

    const podeGerarCertificado =
      planoTemRecurso((instituicao as any)?.plano, "CERTIFICADOS_AUTOMATICOS") &&
      assinaturaPermiteUso(
        (instituicao as any)?.statusAssinatura,
        (instituicao as any)?.isentaPagamento
      );

    if (!podeGerarCertificado) {
      return NextResponse.json(
        {
          error:
            "A geração automática de certificados está disponível a partir do Plano Profissional e exige assinatura ativa.",
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const alunoId = Number(body.alunoId);
    const disciplinaIdRecebido = body.disciplinaId
      ? Number(body.disciplinaId)
      : null;

    if (!Number.isFinite(alunoId) || alunoId <= 0) {
      return NextResponse.json({ error: "Aluno inválido." }, { status: 400 });
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        instituicaoId: user.instituicaoId,
      },
      include: {
        matriculas: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            curso: true,
            polo: true,
            itens: {
              orderBy: {
                id: "asc",
              },
              include: {
                disciplina: true,
              },
            },
          },
        },
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado." },
        { status: 404 }
      );
    }

    let disciplina =
      disciplinaIdRecebido && Number.isFinite(disciplinaIdRecebido)
        ? await prisma.disciplina.findFirst({
            where: {
              id: disciplinaIdRecebido,
              instituicaoId: user.instituicaoId,
            },
          })
        : null;

    if (!disciplina) {
      disciplina =
        aluno.matriculas
          .flatMap((matricula) => matricula.itens)
          .map((item) => item.disciplina)
          .find(Boolean) || null;
    }

    if (!disciplina) {
      return NextResponse.json(
        {
          error:
            "Este aluno ainda não possui disciplina vinculada à matrícula. Não foi possível gerar certificado.",
        },
        { status: 400 }
      );
    }

    const matriculaDoCertificado =
  aluno.matriculas.find((matricula) =>
    matricula.itens.some(
      (item) => item.disciplinaId === disciplina.id
    )
  ) ||
  aluno.matriculas.find((matricula) => matricula.cursoId) ||
  aluno.matriculas[0] ||
  null;

const modeloResolvido =
  await resolverModeloCertificadoPublicado({
    instituicaoId: user.instituicaoId,
    cursoId: matriculaDoCertificado?.cursoId ?? null,
  });

if (!modeloResolvido) {
  return NextResponse.json(
    {
      error:
        "Nenhum modelo de certificado publicado foi encontrado para este curso. Configure um modelo da modalidade ou um modelo padrão geral.",
    },
    { status: 400 }
  );
}

    const existente = await prisma.certificado.findUnique({
      where: {
        alunoId_disciplinaId: {
          alunoId: aluno.id,
          disciplinaId: disciplina.id,
        },
      },
    });

    const codigo =
      existente?.codigo ||
      gerarCodigoCertificado(user.instituicaoId, aluno.id, disciplina.id);

    const certificado = await prisma.certificado.upsert({
      where: {
        alunoId_disciplinaId: {
          alunoId: aluno.id,
          disciplinaId: disciplina.id,
        },
      },
      update: {
        emitidoEm: new Date(),
      },
      create: {
        alunoId: aluno.id,
        disciplinaId: disciplina.id,
        instituicaoId: user.instituicaoId,
        codigo,
        certificadoModeloId: modeloResolvido.modelo.id,
        certificadoModeloVersaoId: modeloResolvido.versao.id,
      },
      include: {
        disciplina: true,
      },
    });

    const deveBaixar = body.baixar === true;

    if (!deveBaixar) {
      return NextResponse.json({
        sucesso: true,
        mensagem: "Certificado gerado com sucesso.",
        certificado: {
          id: certificado.id,
          codigo: certificado.codigo,
          alunoId: aluno.id,
          alunoNome: aluno.nome,
          disciplinaId: disciplina.id,
          disciplinaNome: disciplina.nome,
          emitidoEm: certificado.emitidoEm,
        },
      });
    }

    const nomeArquivo = String(aluno.nome || "aluno")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9-_ ]/g, "")
  .trim()
  .replace(/\s+/g, "-")
  .toLowerCase();

const nomeFinal = `certificado-${nomeArquivo || aluno.id}.pdf`;

if (certificado.arquivoUrl) {
  const arquivoExistente = await fetch(certificado.arquivoUrl, {
    cache: "no-store",
  });

  if (arquivoExistente.ok) {
    const arrayBuffer = await arquivoExistente.arrayBuffer();

    return new NextResponse(Buffer.from(arrayBuffer) as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomeFinal}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }
}

const pdfBuffer = await gerarCertificadoVisualPdf({
  certificadoId: certificado.id,
  origin: req.nextUrl.origin,
});

const caminhoBlob = `certificados/emitidos/instituicao-${user.instituicaoId}/certificado-${certificado.id}-${Date.now()}.pdf`;

const blob = await put(caminhoBlob, pdfBuffer, {
  access: "public",
  contentType: "application/pdf",
  addRandomSuffix: false,
});

await prisma.certificado.update({
  where: {
    id: certificado.id,
  },
  data: {
    arquivoUrl: blob.url,
  },
});

const pdfBytes = Uint8Array.from(pdfBuffer);

return new NextResponse(pdfBytes, {
  status: 200,
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${nomeFinal}"`,
    "Content-Length": String(pdfBytes.byteLength),
    "Cache-Control": "no-store",
  },
});

  } catch (error: any) {
    console.error("ERRO GERAR CERTIFICADO:", error);

    return NextResponse.json(
      {
        error: "Erro ao gerar certificado.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
