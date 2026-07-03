import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarCertificadoPdf } from "@/lib/certificados/gerarCertificado";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function normalizarTexto(valor: any) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function statusConcluido(valor: any) {
  const status = normalizarTexto(valor);

  return [
    "CONCLUIDO",
    "CONCLUIDA",
    "FINALIZADO",
    "FINALIZADA",
    "APROVADO",
    "APROVADA",
  ].includes(status);
}

function numeroValido(valor: any) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function itemDisciplinaConcluido(
  item: any,
  mediaMinima: number,
  frequenciaMinima: number
) {
  if (!item) return false;

  if (
    statusConcluido(item.status) ||
    statusConcluido(item.situacao) ||
    statusConcluido(item.statusAcademico) ||
    statusConcluido(item.resultado)
  ) {
    return true;
  }

  const nota =
    numeroValido(item.mediaFinal) ??
    numeroValido(item.notaFinal) ??
    numeroValido(item.media) ??
    numeroValido(item.nota);

  const frequencia =
    numeroValido(item.frequenciaFinal) ??
    numeroValido(item.frequencia) ??
    numeroValido(item.percentualFrequencia);

  if (nota === null || frequencia === null) {
    return false;
  }

  return nota >= mediaMinima && frequencia >= frequenciaMinima;
}

function matriculaCursoConcluida(
  matricula: any,
  mediaMinima: number,
  frequenciaMinima: number
) {
  if (!matricula) return false;

  if (
    statusConcluido(matricula.status) ||
    statusConcluido(matricula.situacao) ||
    statusConcluido(matricula.statusAcademico) ||
    statusConcluido(matricula.statusMatricula) ||
    matricula.dataConclusao ||
    matricula.concluido === true ||
    matricula.finalizada === true
  ) {
    return true;
  }

  const itens = Array.isArray(matricula.itens) ? matricula.itens : [];

  if (itens.length === 0) return false;

  return itens.every((item: any) =>
    itemDisciplinaConcluido(item, mediaMinima, frequenciaMinima)
  );
}

function disciplinaConcluida(
  aluno: any,
  disciplinaId: number,
  mediaMinima: number,
  frequenciaMinima: number
) {
  const matriculas = Array.isArray(aluno?.matriculas) ? aluno.matriculas : [];

  return matriculas.some((matricula: any) => {
    const itens = Array.isArray(matricula.itens) ? matricula.itens : [];

    return itens.some(
      (item: any) =>
        Number(item?.disciplinaId ?? item?.disciplina?.id) === disciplinaId &&
        itemDisciplinaConcluido(item, mediaMinima, frequenciaMinima)
    );
  });
}

function semestreDoItem(item: any, matricula: any) {
  return (
    item?.semestre ??
    item?.periodo ??
    item?.disciplina?.semestre ??
    item?.disciplina?.periodo ??
    matricula?.semestre ??
    null
  );
}

function semestreConcluido(
  aluno: any,
  disciplinaId: number,
  mediaMinima: number,
  frequenciaMinima: number
) {
  const matriculas = Array.isArray(aluno?.matriculas) ? aluno.matriculas : [];

  for (const matricula of matriculas) {
    const itens = Array.isArray(matricula.itens) ? matricula.itens : [];

    const itemAtual = itens.find(
      (item: any) =>
        Number(item?.disciplinaId ?? item?.disciplina?.id) === disciplinaId
    );

    if (!itemAtual) continue;

    const semestreAtual = semestreDoItem(itemAtual, matricula);

    if (!semestreAtual) {
      return itemDisciplinaConcluido(
        itemAtual,
        mediaMinima,
        frequenciaMinima
      );
    }

    const itensDoSemestre = itens.filter(
      (item: any) =>
        String(semestreDoItem(item, matricula)) === String(semestreAtual)
    );

    if (itensDoSemestre.length === 0) return false;

    return itensDoSemestre.every((item: any) =>
      itemDisciplinaConcluido(item, mediaMinima, frequenciaMinima)
    );
  }

  return false;
}

function cursoCompleto(
  aluno: any,
  disciplinaId: number,
  mediaMinima: number,
  frequenciaMinima: number
) {
  const matriculas = Array.isArray(aluno?.matriculas) ? aluno.matriculas : [];

  const matriculasDaDisciplina = matriculas.filter((matricula: any) => {
    const itens = Array.isArray(matricula.itens) ? matricula.itens : [];

    return itens.some(
      (item: any) =>
        Number(item?.disciplinaId ?? item?.disciplina?.id) === disciplinaId
    );
  });

  const base =
    matriculasDaDisciplina.length > 0 ? matriculasDaDisciplina : matriculas;

  return base.some((matricula: any) =>
    matriculaCursoConcluida(matricula, mediaMinima, frequenciaMinima)
  );
}

function certificadoLiberadoParaAluno(
  certificado: any,
  aluno: any,
  configuracao: any
) {
  if (configuracao?.liberarCertificadoAutomatico === false) {
    return false;
  }

  const regra =
    configuracao?.regraLiberacaoCertificado || "CURSO_COMPLETO";

  const mediaMinima = Number(configuracao?.mediaMinimaCertificado ?? 7);
  const frequenciaMinima = Number(
    configuracao?.frequenciaMinimaCertificado ?? 75
  );

  const disciplinaId = Number(certificado?.disciplinaId);

  if (!Number.isFinite(disciplinaId)) return false;

  if (regra === "MANUAL") {
    return false;
  }

  if (regra === "DISCIPLINA_CONCLUIDA") {
    return disciplinaConcluida(
      aluno,
      disciplinaId,
      mediaMinima,
      frequenciaMinima
    );
  }

  if (regra === "SEMESTRE_CONCLUIDO") {
    return semestreConcluido(
      aluno,
      disciplinaId,
      mediaMinima,
      frequenciaMinima
    );
  }

  return cursoCompleto(
    aluno,
    disciplinaId,
    mediaMinima,
    frequenciaMinima
  );
}

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

    const instituicaoConfig = await prisma.instituicao.findUnique({
  where: {
    id: user.instituicaoId,
  },
  select: {
    regraLiberacaoCertificado: true,
    mediaMinimaCertificado: true,
    frequenciaMinimaCertificado: true,
    liberarCertificadoAutomatico: true,
  },
});

const aluno = await prisma.aluno.findFirst({
  where: {
    userId: user.id,
    instituicaoId: user.instituicaoId,
  },
  include: {
    matriculas: {
      include: {
        curso: true,
        itens: {
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

    const certificado = await prisma.certificado.findFirst({
      where: {
        id,
        alunoId: aluno.id,
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

    const podeBaixar = certificadoLiberadoParaAluno(
  certificado,
  aluno,
  instituicaoConfig
);

if (!podeBaixar) {
  return NextResponse.json(
    {
      error:
        "Este certificado ainda não está liberado para o aluno conforme a regra da instituição.",
    },
    { status: 403 }
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