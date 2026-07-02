import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

const REGRAS_VALIDAS = [
  "DISCIPLINA_CONCLUIDA",
  "SEMESTRE_CONCLUIDO",
  "CURSO_COMPLETO",
  "MANUAL",
];

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN" || !user.instituicaoId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: {
        regraLiberacaoCertificado: true,
        mediaMinimaCertificado: true,
        frequenciaMinimaCertificado: true,
        liberarCertificadoAutomatico: true,
      },
    });

    if (!instituicao) {
      return NextResponse.json(
        { error: "Instituição não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      regraLiberacaoCertificado:
        instituicao.regraLiberacaoCertificado || "CURSO_COMPLETO",
      mediaMinimaCertificado: instituicao.mediaMinimaCertificado ?? 7,
      frequenciaMinimaCertificado:
        instituicao.frequenciaMinimaCertificado ?? 75,
      liberarCertificadoAutomatico:
        instituicao.liberarCertificadoAutomatico ?? true,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao carregar configuração de certificados.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN" || !user.instituicaoId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const regra = String(
      body.regraLiberacaoCertificado || "CURSO_COMPLETO"
    );

    if (!REGRAS_VALIDAS.includes(regra)) {
      return NextResponse.json(
        { error: "Regra de liberação inválida." },
        { status: 400 }
      );
    }

    const media = Number(body.mediaMinimaCertificado ?? 7);
    const frequencia = Number(body.frequenciaMinimaCertificado ?? 75);

    if (!Number.isFinite(media) || media < 0 || media > 10) {
      return NextResponse.json(
        { error: "A média mínima deve estar entre 0 e 10." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(frequencia) || frequencia < 0 || frequencia > 100) {
      return NextResponse.json(
        { error: "A frequência mínima deve estar entre 0 e 100." },
        { status: 400 }
      );
    }

    const atualizado = await prisma.instituicao.update({
      where: { id: user.instituicaoId },
      data: {
        regraLiberacaoCertificado: regra,
        mediaMinimaCertificado: media,
        frequenciaMinimaCertificado: frequencia,
        liberarCertificadoAutomatico:
          body.liberarCertificadoAutomatico !== false,
      },
      select: {
        regraLiberacaoCertificado: true,
        mediaMinimaCertificado: true,
        frequenciaMinimaCertificado: true,
        liberarCertificadoAutomatico: true,
      },
    });

    return NextResponse.json({
      sucesso: true,
      configuracao: atualizado,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao salvar configuração de certificados.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}