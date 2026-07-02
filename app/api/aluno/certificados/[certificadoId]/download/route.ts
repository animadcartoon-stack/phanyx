import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarCertificadoPdf } from "@/lib/certificados/gerarCertificado";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ certificadoId: string }> }
) {
  try {
    const { certificadoId } = await params;
    const id = Number(certificadoId);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: "Certificado inválido." },
        { status: 400 }
      );
    }

    const user = await getUserFromToken();

    if (!user || user.role !== "ALUNO") {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const alunoLogado = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!alunoLogado) {
      return NextResponse.json(
        { error: "Aluno não encontrado." },
        { status: 404 }
      );
    }

    const certificado = await prisma.certificado.findFirst({
      where: {
        id,
        alunoId: alunoLogado.id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        aluno: true,
        disciplina: true,
        instituicao: true,
      },
    });

    if (!certificado) {
      return NextResponse.json(
        { error: "Certificado não encontrado." },
        { status: 404 }
      );
    }

    const templateUrl = (certificado.instituicao as any)?.certificadoTemplateUrl;

    if (!templateUrl) {
      return NextResponse.json(
        { error: "A instituição ainda não configurou o modelo de certificado." },
        { status: 400 }
      );
    }

    const templateResponse = await fetch(templateUrl);

    if (!templateResponse.ok) {
      return NextResponse.json(
        { error: "Não foi possível carregar o modelo de certificado." },
        { status: 500 }
      );
    }

    const matriculaAtual = await prisma.matricula.findFirst({
      where: {
        alunoId: certificado.alunoId,
        instituicaoId: user.instituicaoId,
      },
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
    });

    const camposModelo = await prisma.certificadoCampo.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: {
        ordem: "asc",
      },
    });

    const disciplinasConcluidas =
      matriculaAtual?.itens
        ?.map((item) => item.disciplina?.nome)
        ?.filter(Boolean)
        ?.join("\n") || certificado.disciplina?.nome;

    const templateArrayBuffer = await templateResponse.arrayBuffer();

    const pdfBytes = await gerarCertificadoPdf(
      new Uint8Array(templateArrayBuffer),
      {
        nomeAluno: certificado.aluno?.nome || "Aluno",
        nomeCurso:
          matriculaAtual?.curso?.nome ||
          certificado.disciplina?.nome ||
          "Curso concluído pelo aluno",
        nomeInstituicao: certificado.instituicao?.nome || "Instituição",
        dataConclusao: certificado.emitidoEm,
        codigoValidacao: certificado.codigo,

        numeroMatricula:
          (matriculaAtual as any)?.numeroMatricula ||
          (certificado.aluno as any)?.matricula ||
          null,
        cpfAluno: (certificado.aluno as any)?.cpf || null,
        rgAluno: (certificado.aluno as any)?.rg || null,
        cidade: (certificado.instituicao as any)?.certificadoCidade || null,
        coordenadorNome:
          (certificado.instituicao as any)?.certificadoCoordenadorNome || null,
        assinaturaUrl:
          (certificado.instituicao as any)?.certificadoAssinaturaUrl || null,
        logoUrl:
          (certificado.instituicao as any)?.logoUrl ||
          (certificado.instituicao as any)?.logo ||
          (certificado.instituicao as any)?.imagemUrl ||
          null,

        disciplinasConcluidas:
          disciplinasConcluidas || certificado.disciplina?.nome || null,
        cargaHoraria:
          (certificado.disciplina as any)?.cargaHoraria
            ? `${(certificado.disciplina as any).cargaHoraria} horas`
            : null,
        anoConclusao: String(new Date(certificado.emitidoEm).getFullYear()),
        aproveitamento: "100%",
        frequenciaTotal: "100%",
        modalidade: (matriculaAtual as any)?.modalidade || null,
        turma:
          matriculaAtual?.itens
            ?.map((item) => (item as any)?.turma?.nome)
            ?.filter(Boolean)
            ?.join(", ") || null,
        polo: (matriculaAtual as any)?.polo?.nome || null,
        cnpjInstituicao: (certificado.instituicao as any)?.cnpj || null,
      },
      camposModelo
    );

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificado-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("ERRO DOWNLOAD CERTIFICADO:", error);

    return NextResponse.json(
      {
        error: "Erro ao gerar certificado.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}