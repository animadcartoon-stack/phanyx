import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

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
    "APROVEITADO",
    "APROVEITADA",
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
      (item: any) => Number(item?.disciplinaId ?? item?.disciplina?.id) === disciplinaId
    );

    if (!itemAtual) continue;

    const semestreAtual = semestreDoItem(itemAtual, matricula);

    if (!semestreAtual) {
      return itemDisciplinaConcluido(itemAtual, mediaMinima, frequenciaMinima);
    }

    const itensDoSemestre = itens.filter(
      (item: any) => String(semestreDoItem(item, matricula)) === String(semestreAtual)
    );

    if (itensDoSemestre.length === 0) return false;

    return itensDoSemestre.every((item: any) =>
      itemDisciplinaConcluido(item, mediaMinima, frequenciaMinima)
    );
  }

  return false;
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
  const liberarAutomatico =
    configuracao?.liberarCertificadoAutomatico !== false;

  if (!liberarAutomatico) return false;

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

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ALUNO") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const instituicao = await prisma.instituicao.findUnique({
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

    const certificados = await prisma.certificado.findMany({
      where: {
        alunoId: aluno.id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        disciplina: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        emitidoEm: "desc",
      },
    });

    const certificadosLiberados = certificados.filter((certificado) =>
      certificadoLiberadoParaAluno(certificado, aluno, instituicao)
    );

    return NextResponse.json({
      certificados: certificadosLiberados,
      regraLiberacaoCertificado:
        instituicao?.regraLiberacaoCertificado || "CURSO_COMPLETO",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao listar certificados.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}