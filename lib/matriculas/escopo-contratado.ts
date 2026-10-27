import { normalizarSelecaoDisciplinas, validarSelecaoDisciplinas } from "./selecao-disciplinas";
import { prisma } from "@/lib/prisma";

export type TipoContratacaoEscopo =
  | "CURSO_COMPLETO"
  | "PARCIAL";

export type DisciplinaContratadaSnapshot = {
  disciplinaId: number;
  cursoSemestreIdSnapshot: number | null;
  semestreNumeroSnapshot: number | null;
  semestreTituloSnapshot: string | null;
  disciplinaNomeSnapshot: string;
  cargaHorariaSnapshot: number | null;
  ordemSnapshot: number | null;
};

function numerosUnicos(
  valores: Array<number | string>
) {
  return Array.from(
    new Set(
      valores
        .map((valor) => Number(valor))
        .filter(
          (valor) =>
            Number.isInteger(valor) &&
            valor > 0
        )
    )
  );
}

export async function montarEscopoContratado(params: {
  instituicaoId: number;
  cursoId: number;
  tipoContratacao: TipoContratacaoEscopo;
  regrasSelecaoDisciplinas?: unknown;
  disciplinaIdsContratadas?: Array<number | string>;
}) {
  const {
    instituicaoId,
    cursoId,
    tipoContratacao,
    disciplinaIdsContratadas = [],
  } = params;

  const semestres =
    await prisma.cursoSemestre.findMany({
      where: {
        instituicaoId,
        cursoId,
      },
      include: {
        disciplinas: {
          include: {
            disciplina: true,
          },
        },
      },
      orderBy: {
        numero: "asc",
      },
    });

  const cursoSemGrade = !semestres.length ? await prisma.curso.findFirst({ where: { id: cursoId, instituicaoId }, select: { organizacaoCurricular: true, quantidadeEtapas: true } }) : null;
  const anualSimples = cursoSemGrade?.organizacaoCurricular === "ANUAL" && (cursoSemGrade.quantidadeEtapas == null || cursoSemGrade.quantidadeEtapas === 1);
  const disciplinasDiretas =
    await prisma.disciplina.findMany({
      where: {
        instituicaoId,
        cursoId,
        ativo: true,
        ...(anualSimples ? {} : { semestre: { not: null } }),
      },
      orderBy: [
        { semestre: "asc" },
        { nome: "asc" },
      ],
    });

  const mapa =
    new Map<
      number,
      DisciplinaContratadaSnapshot
    >();

  for (const semestre of semestres) {
    const disciplinasOrdenadas =
      [...semestre.disciplinas].sort(
        (a, b) =>
          a.disciplina.nome.localeCompare(
            b.disciplina.nome,
            "pt-BR"
          )
      );

    for (
      const vinculo
      of disciplinasOrdenadas
    ) {
      const disciplina =
        vinculo.disciplina;

      if (mapa.has(disciplina.id)) {
        continue;
      }

      mapa.set(disciplina.id, {
        disciplinaId:
          disciplina.id,
        cursoSemestreIdSnapshot:
          semestre.id,
        semestreNumeroSnapshot:
          semestre.numero,
        semestreTituloSnapshot:
          semestre.titulo,
        disciplinaNomeSnapshot:
          disciplina.nome,
        cargaHorariaSnapshot:
          disciplina.cargaHoraria,
        ordemSnapshot:
          null,
      });
    }
  }

  for (
    const disciplina
    of (semestres.length ? [] : disciplinasDiretas)
  ) {
    if (mapa.has(disciplina.id)) {
      continue;
    }

    const semestre =
      semestres.find(
        (item) =>
          Number(item.numero) ===
          Number(disciplina.semestre)
      ) ?? null;

    mapa.set(disciplina.id, {
      disciplinaId:
        disciplina.id,
      cursoSemestreIdSnapshot:
        semestre?.id ?? null,
      semestreNumeroSnapshot:
        disciplina.semestre,
      semestreTituloSnapshot:
        semestre?.titulo ?? null,
      disciplinaNomeSnapshot:
        disciplina.nome,
      cargaHorariaSnapshot:
        disciplina.cargaHoraria,
      ordemSnapshot:
        null,
    });
  }

  const regras = params.regrasSelecaoDisciplinas === undefined
    ? normalizarSelecaoDisciplinas((await prisma.curso.findFirst({ where: { id: cursoId, instituicaoId }, select: { regrasSelecaoDisciplinas: true } }))?.regrasSelecaoDisciplinas)
    : normalizarSelecaoDisciplinas(params.regrasSelecaoDisciplinas);

  const todas =
    Array.from(
      mapa.values()
    ).sort((a, b) => {
      const semestreA =
        a.semestreNumeroSnapshot ??
        Number.MAX_SAFE_INTEGER;

      const semestreB =
        b.semestreNumeroSnapshot ??
        Number.MAX_SAFE_INTEGER;

      if (semestreA !== semestreB) {
        return semestreA - semestreB;
      }

      return a.disciplinaNomeSnapshot
        .localeCompare(
          b.disciplinaNomeSnapshot,
          "pt-BR"
        );
    });

  if (
    tipoContratacao ===
    "CURSO_COMPLETO"
  ) {
    validarSelecaoDisciplinas(regras, todas.map(d => d.disciplinaId), todas.map(d => d.disciplinaId));
    return todas;
  }

  const selecionadas =
    numerosUnicos(
      disciplinaIdsContratadas
    );

  if (selecionadas.length === 0) {
    throw new Error(
      "Selecione ao menos uma disciplina para a contratação parcial."
    );
  }

  const idsPermitidos =
    new Set(
      todas.map(
        (item) =>
          item.disciplinaId
      )
    );

  const invalidas =
    selecionadas.filter(
      (id) =>
        !idsPermitidos.has(id)
    );

  if (invalidas.length > 0) {
    throw new Error(
      "Uma ou mais disciplinas selecionadas não pertencem à grade deste curso."
    );
  }

  const idsSelecionadas =
    new Set(selecionadas);

  validarSelecaoDisciplinas(regras, selecionadas, todas.map(d => d.disciplinaId));
  return todas.filter(
    (item) =>
      idsSelecionadas.has(
        item.disciplinaId
      )
  );
}
