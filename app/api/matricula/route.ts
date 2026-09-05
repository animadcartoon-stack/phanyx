import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  getUserFromToken,
  temPermissao,
} from "@/lib/server-auth";

import {
  GatilhoComissaoRH,
  PapelParticipanteComercial,
  Prisma,
} from "@prisma/client";

import {
  processarComissaoAutomatica,
} from "@/lib/comercial/processar-comissao";

import {
  EVENTOS_SAIDA_CAPTACAO,
  enfileirarEventoSaidaCaptacaoSeguro,
} from "@/lib/comercial/captacao/enfileirar-evento-saida";

function addMonths(date: Date, months: number) {
  const diaOriginal = date.getDate();

  const primeiroDiaDoMesDestino =
    new Date(
      date.getFullYear(),
      date.getMonth() + months,
      1,
      12,
      0,
      0,
      0
    );

  const ultimoDiaDoMesDestino =
    new Date(
      primeiroDiaDoMesDestino.getFullYear(),
      primeiroDiaDoMesDestino.getMonth() + 1,
      0
    ).getDate();

  primeiroDiaDoMesDestino.setDate(
    Math.min(
      diaOriginal,
      ultimoDiaDoMesDestino
    )
  );

  return primeiroDiaDoMesDestino;
}

function campoFoiInformado(
  objeto: Record<string, unknown>,
  campo: string
) {
  return Object.prototype.hasOwnProperty.call(
    objeto,
    campo
  );
}

async function sincronizarMensalidadesDaMatricula(params: {
  tx: Prisma.TransactionClient;
  instituicaoId: number;
  matriculaId: number;
  alunoId: number;
  cursoNome: string;
  valorMensalidade: number;
  quantidadeMensalidades: number;
  primeiroVencimento: Date;
}) {
  const {
    tx,
    instituicaoId,
    matriculaId,
    alunoId,
    cursoNome,
    valorMensalidade,
    quantidadeMensalidades,
    primeiroVencimento,
  } = params;

  const existentes =
    await tx.lancamentoFinanceiro.findMany({
      where: {
        instituicaoId,
        matriculaId,
        tipo: "MENSALIDADE",
        status: {
          not: "CANCELADO",
        },
      },

      select: {
        id: true,
        status: true,
        valorPago: true,
        descontoValor: true,
        jurosValor: true,
        multaValor: true,

        _count: {
          select: {
            pagamentos: true,
          },
        },
      },

      orderBy: [
        {
          vencimento: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const totalPosicoes = Math.max(
    existentes.length,
    quantidadeMensalidades
  );

  for (
    let indice = 0;
    indice < totalPosicoes;
    indice += 1
  ) {
    const existente =
      existentes[indice];

    const dentroDaNovaQuantidade =
      indice < quantidadeMensalidades;

    const possuiPagamento =
      Boolean(existente) &&
      (
        Number(
          existente.valorPago || 0
        ) > 0 ||
        existente._count.pagamentos > 0 ||
        existente.status === "PAGO" ||
        existente.status === "PARCIAL"
      );

    if (!dentroDaNovaQuantidade) {
      if (
        existente &&
        !possuiPagamento
      ) {
        await tx.lancamentoFinanceiro.update({
          where: {
            id: existente.id,
          },

          data: {
            status: "CANCELADO",

            observacao:
              "Cancelado automaticamente após alteração da quantidade de mensalidades da matrícula.",
          },
        });
      }

      continue;
    }

    const vencimento = addMonths(
      primeiroVencimento,
      indice
    );

    const inicioVencimento =
      new Date(vencimento);

    inicioVencimento.setHours(
      0,
      0,
      0,
      0
    );

    const status =
      inicioVencimento < hoje
        ? "ATRASADO"
        : "PENDENTE";

    const descricao =
      `Mensalidade ${indice + 1}/${quantidadeMensalidades} - ${cursoNome}`;

    if (existente) {
      if (possuiPagamento) {
        continue;
      }

      const descontoValor = Number(
        existente.descontoValor || 0
      );

      const jurosValor = Number(
        existente.jurosValor || 0
      );

      const multaValor = Number(
        existente.multaValor || 0
      );

      const valorFinal = Math.max(
        0,
        Number(
          (
            valorMensalidade -
            descontoValor +
            jurosValor +
            multaValor
          ).toFixed(2)
        )
      );

      await tx.lancamentoFinanceiro.update({
        where: {
          id: existente.id,
        },

        data: {
          alunoId,
          descricao,
          valorOriginal:
            valorMensalidade,
          valorFinal,
          vencimento,
          status,

          observacao:
            "Sincronizado automaticamente após edição da matrícula.",
        },
      });

      continue;
    }

    await tx.lancamentoFinanceiro.create({
      data: {
        instituicaoId,
        alunoId,
        matriculaId,
        tipo: "MENSALIDADE",
        descricao,
        valorOriginal:
          valorMensalidade,
        valorFinal:
          valorMensalidade,
        valorPago: 0,
        vencimento,
        status,

        observacao:
          "Gerado automaticamente após edição da matrícula.",
      },
    });
  }
}

function toPositiveNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;

  const texto =
    String(value).trim();

  const dataSomente =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      texto
    );

  if (dataSomente) {
    const ano = Number(dataSomente[1]);
    const mes = Number(dataSomente[2]);
    const dia = Number(dataSomente[3]);

    const dataLocal = new Date(
      ano,
      mes - 1,
      dia,
      12,
      0,
      0,
      0
    );

    return Number.isNaN(
      dataLocal.getTime()
    )
      ? null
      : dataLocal;
  }

  const data = new Date(texto);

  return Number.isNaN(
    data.getTime()
  )
    ? null
    : data;
}

function uniqueNumbers(values: number[]) {
  return Array.from(new Set(values.filter((v) => Number.isFinite(v) && v > 0)));
}

function calcularIdade(
  dataNascimento: Date,
  dataReferencia = new Date()
) {
  let idade =
    dataReferencia.getUTCFullYear() -
    dataNascimento.getUTCFullYear();

  const mesReferencia =
    dataReferencia.getUTCMonth();

  const mesNascimento =
    dataNascimento.getUTCMonth();

  const diaReferencia =
    dataReferencia.getUTCDate();

  const diaNascimento =
    dataNascimento.getUTCDate();

  const aindaNaoFezAniversario =
    mesReferencia < mesNascimento ||
    (mesReferencia === mesNascimento &&
      diaReferencia < diaNascimento);

  if (aindaNaoFezAniversario) {
    idade -= 1;
  }

  return idade;
}

function verificarDadosResponsavel(
  aluno: {
    nomeResponsavel?: string | null;
    cpfResponsavel?: string | null;
    telefoneResponsavel?: string | null;
    emailResponsavel?: string | null;
    parentescoResponsavel?: string | null;
  }
) {
  const pendentes: string[] = [];

  const nomeResponsavel = String(
    aluno.nomeResponsavel || ""
  ).trim();

  const cpfResponsavel = String(
    aluno.cpfResponsavel || ""
  ).replace(/\D/g, "");

  const telefoneResponsavel = String(
    aluno.telefoneResponsavel || ""
  ).replace(/\D/g, "");

  const emailResponsavel = String(
    aluno.emailResponsavel || ""
  )
    .trim()
    .toLowerCase();

  const parentescoResponsavel = String(
    aluno.parentescoResponsavel || ""
  ).trim();

  if (!nomeResponsavel) {
    pendentes.push(
      "nome do responsável"
    );
  }

  if (cpfResponsavel.length !== 11) {
    pendentes.push(
      "CPF do responsável"
    );
  }

  if (telefoneResponsavel.length < 10) {
    pendentes.push(
      "telefone do responsável"
    );
  }

  if (
    !emailResponsavel ||
    !emailResponsavel.includes("@")
  ) {
    pendentes.push(
      "e-mail do responsável"
    );
  }

  if (!parentescoResponsavel) {
    pendentes.push(
      "parentesco do responsável"
    );
  }

  return pendentes;
}

type VendedorElegivel = {
  id: number;
  nome: string;
  cargo: string | null;
  departamento: {
    nome: string;
  } | null;
};

async function buscarVendedorElegivel(
  instituicaoId: number,
  funcionarioId: number
): Promise<VendedorElegivel | null> {
  /*
   * Cargo é a fonte oficial para determinar
   * quem pode ser vendedor responsável.
   *
   * Plano de comissão NÃO é requisito.
   */
  const cargosVendedor =
    await prisma.cargo.findMany({
      where: {
        instituicaoId,
        ativo: true,
        nomeNormalizado:
          "vendedor",
      },

      select: {
        id: true,
      },
    });

  const cargoIds =
    cargosVendedor.map(
      (cargo) => cargo.id
    );

  if (cargoIds.length === 0) {
    return null;
  }

  return prisma.funcionario.findFirst({
    where: {
      id: funcionarioId,
      instituicaoId,
      ativo: true,
      statusFuncionario:
        "ATIVO",

      cargoId: {
        in: cargoIds,
      },
    },

    select: {
      id: true,
      nome: true,
      cargo: true,

      departamento: {
        select: {
          nome: true,
        },
      },
    },
  });
}

type TipoItemMatricula =
  | "GRADE_PRINCIPAL"
  | "DEPENDENCIA"
  | "ADIANTAMENTO"
  | "EXTRA_MESMO_CURSO"
  | "EXTRA_OUTRO_CURSO";

type ItemMatriculaBody = {
  turmaId?: number | string;
  disciplinaId?: number | string;
  tipoItem?: TipoItemMatricula | string;
};

type ItemMatriculaNormalizado = {
  turmaId: number;
  disciplinaId: number;
  tipoItem: TipoItemMatricula;
};

type MatriculaBody = {
  id?: number | string;
  leadId?: number | string | null;
  alunoId?: number | string;
  cursoId?: number | string;
  vendedorResponsavelId?: number | string | null;
  cursoSemestreId?: number | string;
  periodoMatriculaId?: number | string;
  semestre?: number | string;
  periodoLetivo?: string;
  modalidade?: string;

  turmaPrincipalId?: number | string | null;

  turmaId?: number | string;
  turmaIds?: Array<number | string>;

  disciplinaIds?: Array<number | string>;
  itensMatricula?: ItemMatriculaBody[];
  valorMatricula?: number | string;
  valorPagoMatricula?: number | string;
  formaPagamentoMatricula?: string | null;
  valorMensalidade?: number | string;
  quantidadeParcelas?: number | string;
  quantidadeMensalidades?: number | string;
  dataPrimeiroVencimento?: string;
  primeiroVencimento?: string;
  nomeSocial?: string;
  genero?: string;
  status?: string;
  realizadaPeloAluno?: boolean;
  confirmacaoMenorAceita?: boolean;
};

type TurmaComDisciplina = {
  id: number;
  nome: string;
  semestre: string;
  disciplinaId: number;
  disciplina: {
    id: number;
    nome: string;
    cursoId: number | null;
    semestre: number | null;
  };
};

async function buscarDisciplinasAprovadasDoAluno(
  alunoId: number,
  instituicaoId: number
) {
  const resultados = await prisma.resultadoFinal.findMany({
    where: {
      alunoId,
      instituicaoId,
      situacao: "APROVADO",
    },
    select: {
      disciplinaId: true,
    },
  });

  return new Set(resultados.map((r) => r.disciplinaId));
}

async function validarPreRequisitos(
  alunoId: number,
  instituicaoId: number,
  disciplinaIdsSelecionadas: number[]
) {
  const disciplinaIdsUnicas = uniqueNumbers(disciplinaIdsSelecionadas);

  if (disciplinaIdsUnicas.length === 0) {
    return { ok: true as const };
  }

  const preRequisitos = await prisma.disciplinaPreRequisito.findMany({
    where: {
      instituicaoId,
      disciplinaId: { in: disciplinaIdsUnicas },
    },
    include: {
      disciplina: {
        select: { id: true, nome: true },
      },
      prerequisito: {
        select: { id: true, nome: true },
      },
    },
  });

  if (preRequisitos.length === 0) {
    return { ok: true as const };
  }

  const aprovadas = await buscarDisciplinasAprovadasDoAluno(
    alunoId,
    instituicaoId
  );

  const faltantes = preRequisitos.filter(
    (item) => !aprovadas.has(item.prerequisitoId)
  );

  if (faltantes.length === 0) {
    return { ok: true as const };
  }

  const mensagens = faltantes.map(
    (item) =>
      `"${item.disciplina.nome}" exige "${item.prerequisito.nome}" concluída/aprovada`
  );

  return {
    ok: false as const,
    error:
      "O aluno não pode se matricular em algumas disciplinas por falta de pré-requisito: " +
      mensagens.join("; "),
  };
}

async function buscarDisciplinaIdsDaGradeDoSemestre(
  instituicaoId: number,
  cursoId: number | null,
  semestre: number | null,
  cursoSemestreId?: number | null
) {
  if (!cursoId) return new Set<number>();

  let cursoSemestre = null;

  if (cursoSemestreId) {
    cursoSemestre = await prisma.cursoSemestre.findFirst({
      where: {
        id: cursoSemestreId,
        cursoId,
        instituicaoId,
      },
      select: { id: true },
    });
  }

  if (!cursoSemestre && semestre !== null) {
    cursoSemestre = await prisma.cursoSemestre.findFirst({
      where: {
        cursoId,
        instituicaoId,
        numero: semestre,
      },
      select: { id: true },
    });
  }

  if (!cursoSemestre) return new Set<number>();

  const itens = await prisma.cursoSemestreDisciplina.findMany({
    where: {
      instituicaoId,
      cursoSemestreId: cursoSemestre.id,
    },
    select: {
      disciplinaId: true,
    },
  });

  return new Set(itens.map((item) => item.disciplinaId));
}

async function buscarDisciplinaIdsExtrasPermitidas(
  instituicaoId: number,
  cursoId: number | null
) {
  if (!cursoId) return new Set<number>();

  const itens = await prisma.cursoDisciplinaExtraPermitida.findMany({
    where: {
      instituicaoId,
      cursoId,
    },
    select: {
      disciplinaId: true,
    },
  });

  return new Set(itens.map((item) => item.disciplinaId));
}

function montarResumoContratacao(
  itens: Array<{
    turma: {
      nome: string;
    };
    disciplina: {
      nome: string;
    };
    tipoItem: TipoItemMatricula;
  }>
) {
  const linhas = itens.map((item) => {
    const rotuloTipo =
      item.tipoItem === "GRADE_PRINCIPAL"
        ? "Grade principal"
        : item.tipoItem === "DEPENDENCIA"
          ? "Dependência"
          : item.tipoItem === "ADIANTAMENTO"
            ? "Adiantamento"
            : item.tipoItem === "EXTRA_MESMO_CURSO"
              ? "Extra do mesmo curso"
              : "Extra de outro curso";

    return `- ${item.disciplina.nome} (Turma: ${item.turma.nome}) — ${rotuloTipo}`;
  });

  return linhas.join("\n");
}

async function classificarItensMatricula(params: {
  instituicaoId: number;
  cursoIdFinal: number | null;
  semestreFinal: number | null;
  cursoSemestreId?: number | null;
  turmas: TurmaComDisciplina[];
}) {
  const {
    instituicaoId,
    cursoIdFinal,
    semestreFinal,
    cursoSemestreId,
    turmas,
  } = params;

  const disciplinaIdsGrade = await buscarDisciplinaIdsDaGradeDoSemestre(
    instituicaoId,
    cursoIdFinal,
    semestreFinal,
    cursoSemestreId ?? null
  );

  const disciplinaIdsExtrasPermitidas = await buscarDisciplinaIdsExtrasPermitidas(
    instituicaoId,
    cursoIdFinal
  );

  const itens = turmas.map((turma) => {
    let tipoItem: TipoItemMatricula;

    if (disciplinaIdsGrade.has(turma.disciplinaId)) {
      tipoItem = "GRADE_PRINCIPAL";
    } else if (
      cursoIdFinal &&
      turma.disciplina.cursoId &&
      turma.disciplina.cursoId === cursoIdFinal
    ) {
      tipoItem = "EXTRA_MESMO_CURSO";
    } else if (disciplinaIdsExtrasPermitidas.has(turma.disciplinaId)) {
      tipoItem = "EXTRA_OUTRO_CURSO";
    } else {
      throw new Error(
        `A disciplina "${turma.disciplina.nome}" não pertence à grade principal nem às disciplinas extras permitidas para este curso.`
      );
    }

    return {
      turmaId: turma.id,
      disciplinaId: turma.disciplinaId,
      tipoItem,
    };
  });

  return itens;
}

function removerItensDuplicadosPorTurma(
  itens: Array<{
    turmaId: number;
    disciplinaId: number;
    tipoItem: TipoItemMatricula;
  }>
) {
  const vistos = new Set<string>();

  return itens.filter((item) => {
    const chave = `${item.turmaId}-${item.disciplinaId}`;

    if (vistos.has(chave)) return false;

    vistos.add(chave);
    return true;
  });
}

const TIPOS_ITEM_MATRICULA_PERMITIDOS =
  new Set<TipoItemMatricula>([
    "GRADE_PRINCIPAL",
    "DEPENDENCIA",
    "ADIANTAMENTO",
    "EXTRA_MESMO_CURSO",
    "EXTRA_OUTRO_CURSO",
  ]);

function normalizarTipoItemMatricula(
  valor: unknown
): TipoItemMatricula | null {
  const tipo = String(
    valor || ""
  )
    .trim()
    .toUpperCase() as TipoItemMatricula;

  return TIPOS_ITEM_MATRICULA_PERMITIDOS.has(
    tipo
  )
    ? tipo
    : null;
}

async function validarItensMatriculaExplicitos(
  params: {
    itens: ItemMatriculaBody[];
    instituicaoId: number;
    alunoId: number;
    matriculaIdIgnorada?: number | null;
  }
) {
  const {
    itens,
    instituicaoId,
    alunoId,
    matriculaIdIgnorada = null,
  } = params;

  if (
    !Array.isArray(itens) ||
    itens.length === 0
  ) {
    throw new Error(
      "Selecione pelo menos uma disciplina para a matrícula."
    );
  }

  const itensNormalizados: ItemMatriculaNormalizado[] =
    itens.map((item, index) => {
      const turmaId =
        toPositiveNumberOrNull(
          item.turmaId
        );

      const disciplinaId =
        toPositiveNumberOrNull(
          item.disciplinaId
        );

      const tipoItem =
        normalizarTipoItemMatricula(
          item.tipoItem
        );

      if (
        !turmaId ||
        !disciplinaId ||
        !tipoItem
      ) {
        throw new Error(
          `O item ${index + 1} da matrícula possui turma, disciplina ou tipo inválido.`
        );
      }

      return {
        turmaId,
        disciplinaId,
        tipoItem,
      };
    });

  const ofertasVistas =
    new Set<string>();

  const disciplinasVistas =
    new Set<number>();

  for (const item of itensNormalizados) {
    const chaveOferta =
      `${item.turmaId}-${item.disciplinaId}`;

    if (
      ofertasVistas.has(chaveOferta)
    ) {
      throw new Error(
        "A mesma oferta de disciplina foi selecionada mais de uma vez."
      );
    }

    if (
      disciplinasVistas.has(
        item.disciplinaId
      )
    ) {
      throw new Error(
        "A mesma disciplina não pode ser cursada simultaneamente em duas turmas."
      );
    }

    ofertasVistas.add(chaveOferta);

    disciplinasVistas.add(
      item.disciplinaId
    );
  }

  const ofertas =
    await prisma.turmaDisciplina.findMany({
      where: {
        instituicaoId,

        OR: itensNormalizados.map(
          (item) => ({
            turmaId:
              item.turmaId,

            disciplinaId:
              item.disciplinaId,
          })
        ),
      },

      include: {
        turma: {
          select: {
            id: true,
            nome: true,
            semestre: true,
            cursoId: true,
          },
        },

        disciplina: {
          select: {
            id: true,
            nome: true,
            cursoId: true,
            semestre: true,
          },
        },
      },
    });

  const ofertasPorChave =
    new Map<
      string,
      (typeof ofertas)[number]
    >();

  for (const oferta of ofertas) {
    ofertasPorChave.set(
      `${oferta.turmaId}-${oferta.disciplinaId}`,
      oferta
    );
  }

  for (const item of itensNormalizados) {
    const chave =
      `${item.turmaId}-${item.disciplinaId}`;

    if (!ofertasPorChave.has(chave)) {
      throw new Error(
        `A disciplina ${item.disciplinaId} não está vinculada à turma ${item.turmaId}.`
      );
    }
  }

  const disciplinasAprovadas =
    await buscarDisciplinasAprovadasDoAluno(
      alunoId,
      instituicaoId
    );

  const itensConcluidos =
    await prisma.itemMatricula.findMany({
      where: {
        instituicaoId,

        disciplinaId: {
          in: Array.from(
            disciplinasVistas
          ),
        },

        status:
          "CONCLUIDO" as any,

        matricula: {
          is: {
            alunoId,
          },
        },

        matriculaId:
          matriculaIdIgnorada
            ? {
              not:
                matriculaIdIgnorada,
            }
            : undefined,
      },

      select: {
        disciplinaId: true,
      },
    });

  for (const item of itensConcluidos) {
    disciplinasAprovadas.add(
      item.disciplinaId
    );
  }

  const disciplinasJaConcluidas =
    itensNormalizados.filter(
      (item) =>
        disciplinasAprovadas.has(
          item.disciplinaId
        )
    );

  if (
    disciplinasJaConcluidas.length > 0
  ) {
    const nomes =
      disciplinasJaConcluidas.map(
        (item) => {
          const oferta =
            ofertasPorChave.get(
              `${item.turmaId}-${item.disciplinaId}`
            );

          return (
            oferta?.disciplina.nome ||
            `Disciplina ${item.disciplinaId}`
          );
        }
      );

    throw new Error(
      `O aluno já concluiu ou foi aprovado nas seguintes disciplinas: ${nomes.join(", ")}.`
    );
  }

  const validacaoPreRequisitos =
    await validarPreRequisitos(
      alunoId,
      instituicaoId,
      Array.from(
        disciplinasVistas
      )
    );

  if (!validacaoPreRequisitos.ok) {
    throw new Error(
      validacaoPreRequisitos.error
    );
  }

  const turmasComDisciplinas:
    TurmaComDisciplina[] =
    itensNormalizados.map((item) => {
      const oferta =
        ofertasPorChave.get(
          `${item.turmaId}-${item.disciplinaId}`
        )!;

      return {
        id:
          oferta.turma.id,

        nome:
          oferta.turma.nome,

        semestre:
          oferta.turma.semestre,

        disciplinaId:
          oferta.disciplina.id,

        disciplina: {
          id:
            oferta.disciplina.id,

          nome:
            oferta.disciplina.nome,

          cursoId:
            oferta.disciplina.cursoId,

          semestre:
            oferta.disciplina.semestre,
        },
      };
    });

  return {
    itens:
      itensNormalizados,

    turmasComDisciplinas,
  };
}

async function sincronizarItensMatricula(params: {
  matriculaId: number;
  instituicaoId: number;
  itens: ItemMatriculaNormalizado[];
  statusNovos: "A_CURSAR" | "EM_CURSO";
}) {
  const {
    matriculaId,
    instituicaoId,
    itens,
    statusNovos,
  } = params;

  const existentes =
    await prisma.itemMatricula.findMany({
      where: {
        matriculaId,
        instituicaoId,
      },

      select: {
        id: true,
        turmaId: true,
        disciplinaId: true,
        tipoItem: true,
        status: true,
      },
    });

  const existentesPorChave =
    new Map<
      string,
      (typeof existentes)[number]
    >();

  for (const itemExistente of existentes) {
    existentesPorChave.set(
      `${itemExistente.turmaId}-${itemExistente.disciplinaId}`,
      itemExistente
    );
  }

  const chavesSelecionadas =
    new Set(
      itens.map(
        (item) =>
          `${item.turmaId}-${item.disciplinaId}`
      )
    );

  const itensParaCriar:
    ItemMatriculaNormalizado[] = [];

  const itensParaAtualizar: Array<{
    id: number;
    tipoItem: TipoItemMatricula;
    restaurarStatus: boolean;
  }> = [];

  for (const item of itens) {
    const chave =
      `${item.turmaId}-${item.disciplinaId}`;

    const existente =
      existentesPorChave.get(chave);

    if (!existente) {
      itensParaCriar.push(item);
      continue;
    }

    const tipoFoiAlterado =
      existente.tipoItem !==
      item.tipoItem;

    const estavaCancelado =
      existente.status ===
      "CANCELADO";

    if (
      tipoFoiAlterado ||
      estavaCancelado
    ) {
      itensParaAtualizar.push({
        id: existente.id,
        tipoItem: item.tipoItem,
        restaurarStatus:
          estavaCancelado,
      });
    }
  }

  const itensParaCancelar =
    existentes
      .filter((item) => {
        const chave =
          `${item.turmaId}-${item.disciplinaId}`;

        const foiRemovido =
          !chavesSelecionadas.has(
            chave
          );

        const podeCancelar =
          item.status ===
          "A_CURSAR" ||
          item.status ===
          "EM_CURSO";

        return (
          foiRemovido &&
          podeCancelar
        );
      })
      .map((item) => item.id);

  await prisma.$transaction(
    async (tx) => {
      for (
        const item of
        itensParaAtualizar
      ) {
        await tx.itemMatricula.update({
          where: {
            id: item.id,
          },

          data: {
            tipoItem:
              item.tipoItem as any,

            status:
              item.restaurarStatus
                ? (statusNovos as any)
                : undefined,
          },
        });
      }

      if (
        itensParaCriar.length > 0
      ) {
        await tx.itemMatricula.createMany({
          data:
            itensParaCriar.map(
              (item) => ({
                matriculaId,
                instituicaoId,
                turmaId:
                  item.turmaId,
                disciplinaId:
                  item.disciplinaId,
                tipoItem:
                  item.tipoItem as any,
                status:
                  statusNovos as any,
              })
            ),
        });
      }

      if (
        itensParaCancelar.length > 0
      ) {
        await tx.itemMatricula.updateMany({
          where: {
            id: {
              in:
                itensParaCancelar,
            },

            matriculaId,
            instituicaoId,
          },

          data: {
            status:
              "CANCELADO" as any,
          },
        });
      }
    }
  );
}

const includeMatricula = {
  aluno: true,
  curso: true,
  cursoSemestre: true,
  periodoMatricula: true,
  turmaPrincipal: true,
  itens: {
    include: {
      disciplina: true,
      turma: {
        include: {
          disciplinas: {
            include: {
              disciplina: true,
            },
          },
          professor: true,
          _count: { select: { aulas: true } },
        },
      },
    },
  },
} as const;

const includeMatriculaAdmin = {
  ...includeMatricula,

  vendedorResponsavel: {
    select: {
      id: true,
      nome: true,
      cargo: true,

      departamento: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  },

  participantesComerciais: {
    where: {
      papel:
        PapelParticipanteComercial.RESPONSAVEL,
    },

    select: {
      id: true,
      funcionarioId: true,
      papel: true,
      percentualParticipacao: true,
      funcionarioNomeSnapshot: true,
      funcionarioCargoSnapshot: true,
      funcionarioDepartamentoSnapshot: true,
      criadoPorId: true,
      criadoEm: true,
    },
  },
} as const;

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role === "ALUNO") {
      const aluno = await prisma.aluno.findFirst({
        where: { userId: user.id, instituicaoId: user.instituicaoId },
        select: { id: true },
      });

      if (!aluno) {
        return NextResponse.json(
          { error: "Aluno não encontrado" },
          { status: 404 }
        );
      }

      const matriculas = await prisma.matricula.findMany({
        where: {
          alunoId: aluno.id,
          instituicaoId: user.instituicaoId,
        },
        include: includeMatricula,
        orderBy: { id: "desc" },
      });

      return NextResponse.json(matriculas);
    }

    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      const matriculas = await prisma.matricula.findMany({
        where: {
          instituicaoId: user.instituicaoId,
        },
        include: includeMatriculaAdmin,
        orderBy: { id: "desc" },
      });

      return NextResponse.json(matriculas);
    }

    if (user.role === "PROFESSOR") {
      const professor = await prisma.professor.findFirst({
        where: { userId: user.id, instituicaoId: user.instituicaoId },
        select: { id: true },
      });

      if (!professor) {
        return NextResponse.json(
          { error: "Professor não encontrado" },
          { status: 404 }
        );
      }

      const matriculas = await prisma.matricula.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          itens: {
            some: {
              turma: {
                professorId: professor.id,
              },
            },
          },
        },
        include: includeMatricula,
        orderBy: { id: "desc" },
      });

      return NextResponse.json(matriculas);
    }

    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  } catch (error: any) {
    console.error("ERRO AO BUSCAR MATRÍCULAS:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar matrículas" },
      { status: 500 }
    );
  }
}

async function buscarTurmasComDisciplinas(params: {
  turmaIds: number[];
  instituicaoId: number;
  disciplinaIdsBody?: number[];
}) {
  const { turmaIds, instituicaoId, disciplinaIdsBody = [] } = params;

  const turmas = await prisma.turma.findMany({
    where: {
      id: { in: turmaIds },
      instituicaoId,
    },
    include: {
      disciplinas: {
        include: {
          disciplina: {
            include: {
              curso: true,
            },
          },
        },
      },
      professor: true,
    },
  });

  const turmasComDisciplinas = turmas.flatMap((turma) => {
    let disciplinasParaUsar = turma.disciplinas;

    if (disciplinaIdsBody.length > 0) {
      const filtradas = turma.disciplinas.filter((td) =>
        disciplinaIdsBody.includes(td.disciplinaId)
      );

      if (filtradas.length > 0) {
        disciplinasParaUsar = filtradas;
      }
    }

    return disciplinasParaUsar.map((td) => ({
      id: turma.id,
      nome: turma.nome,
      semestre: turma.semestre,
      disciplinaId: td.disciplinaId,
      disciplina: td.disciplina,
    }));
  });

  return { turmas, turmasComDisciplinas };
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as MatriculaBody;

    const leadIdValor =
      body.leadId;

    const leadId =
      toPositiveNumberOrNull(
        leadIdValor
      );

    if (
      leadIdValor !== undefined &&
      leadIdValor !== null &&
      leadIdValor !== "" &&
      !leadId
    ) {
      return NextResponse.json(
        {
          error:
            "O lead informado para a conversão é inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const leadParaConversao =
      leadId
        ? await prisma.lead.findFirst({
          where: {
            id: leadId,

            instituicaoGestoraId:
              user.instituicaoId,
          },

          select: {
            id: true,
            nome: true,
            tipo: true,
            status: true,

            responsavelFuncionarioId:
              true,

            matriculaConvertida: {
              select: {
                id: true,
                alunoId: true,
              },
            },
          },
        })
        : null;

    if (
      leadId &&
      !leadParaConversao
    ) {
      return NextResponse.json(
        {
          error:
            "Lead não encontrado nesta instituição.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      leadParaConversao &&
      leadParaConversao.tipo !==
      "INSTITUICAO"
    ) {
      return NextResponse.json(
        {
          error:
            "Somente leads institucionais podem ser convertidos em matrícula por esta rotina.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      leadParaConversao
        ?.matriculaConvertida
    ) {
      return NextResponse.json(
        {
          codigo:
            "LEAD_JA_CONVERTIDO",

          error:
            "Este lead já foi convertido em matrícula.",

          matriculaId:
            leadParaConversao
              .matriculaConvertida.id,

          alunoId:
            leadParaConversao
              .matriculaConvertida.alunoId,
        },
        {
          status: 409,
        }
      );
    }

    if (
      leadParaConversao?.status ===
      "FECHADO"
    ) {
      return NextResponse.json(
        {
          codigo: "LEAD_FECHADO",

          error:
            "Este lead já está fechado e não pode iniciar uma nova conversão.",
        },
        {
          status: 409,
        }
      );
    }

    const vendedorResponsavelValor =
      body.vendedorResponsavelId;

    const vendedorResponsavelId =
      toPositiveNumberOrNull(
        vendedorResponsavelValor
      );

    if (
      leadParaConversao
        ?.responsavelFuncionarioId &&
      vendedorResponsavelId !==
      leadParaConversao
        .responsavelFuncionarioId
    ) {
      return NextResponse.json(
        {
          error:
            "O vendedor responsável da matrícula deve ser o mesmo responsável comercial vinculado ao lead.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      vendedorResponsavelValor !== undefined &&
      vendedorResponsavelValor !== null &&
      vendedorResponsavelValor !== "" &&
      !vendedorResponsavelId
    ) {
      return NextResponse.json(
        {
          error:
            "O vendedor responsável informado é inválido.",
        },
        { status: 400 }
      );
    }

    let vendedorResponsavel:
      | VendedorElegivel
      | null = null;

    if (vendedorResponsavelId) {
      if (
        !temPermissao(
          user,
          "comercial.matriculas.vincular_vendedor"
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Você não possui permissão para vincular um vendedor à matrícula.",
          },
          { status: 403 }
        );
      }

      vendedorResponsavel =
        await buscarVendedorElegivel(
          user.instituicaoId,
          vendedorResponsavelId
        );

      if (!vendedorResponsavel) {
        return NextResponse.json(
          {
            error:
              "O vendedor não está ativo, não pertence à instituição ou não possui o cargo ativo de Vendedor.",
          },
          { status: 400 }
        );
      }
    }

    const alunoId = Number(body.alunoId);
    const cursoIdBody = body.cursoId ? Number(body.cursoId) : null;
    const cursoSemestreId = toPositiveNumberOrNull(body.cursoSemestreId);
    const periodoMatriculaId = toPositiveNumberOrNull(body.periodoMatriculaId);
    const semestreBody =
      body.semestre !== undefined &&
        body.semestre !== null &&
        body.semestre !== ""
        ? Number(body.semestre)
        : null;

    const valorPagoMatricula =
      Number(
        body.valorPagoMatricula || 0
      );

    const formaPagamentoMatricula =
      String(
        body.formaPagamentoMatricula ||
        ""
      )
        .trim()
        .toUpperCase();

    const formasPagamentoPermitidas =
      new Set([
        "DINHEIRO",
        "PIX",
        "CARTAO",
        "BOLETO",
        "TRANSFERENCIA",
        "OUTRO",
      ]);

    if (
      !Number.isFinite(
        valorPagoMatricula
      ) ||
      valorPagoMatricula < 0
    ) {
      return NextResponse.json(
        {
          error:
            "O valor pago no ato da matrícula é inválido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      valorPagoMatricula > 0 &&
      !formasPagamentoPermitidas.has(
        formaPagamentoMatricula
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione uma forma de pagamento válida para o valor recebido no ato da matrícula.",
        },
        {
          status: 400,
        }
      );
    }

    const turmaIdsRaw =
      Array.isArray(body.turmaIds)
        ? body.turmaIds
        : body.turmaId
          ? [body.turmaId]
          : [];

    const turmaIds = uniqueNumbers(
      turmaIdsRaw
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    );
    const turmaPrincipalIdRecebido =
      toPositiveNumberOrNull(
        body.turmaPrincipalId ??
        body.turmaId
      );

    const disciplinaIdsBody = uniqueNumbers(
      Array.isArray(body.disciplinaIds)
        ? body.disciplinaIds.map((id) => Number(id))
        : []
    );

    const itensMatriculaBody =
      Array.isArray(
        body.itensMatricula
      )
        ? body.itensMatricula
        : null;

    const usaItensExplicitos =
      itensMatriculaBody !== null;

    if (
      !alunoId ||
      (!usaItensExplicitos &&
        turmaIds.length === 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Aluno e disciplinas/turmas são obrigatórios.",
        },
        { status: 400 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        instituicaoId: user.instituicaoId,
      },
      include: {
        user: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    if (!aluno.dataNascimento) {
      return NextResponse.json(
        {
          error:
            "Informe a data de nascimento do aluno antes de realizar a matrícula.",
        },
        {
          status: 400,
        }
      );
    }

    const idadeNoMomentoMatricula =
      calcularIdade(
        aluno.dataNascimento
      );

    if (
      idadeNoMomentoMatricula < 0 ||
      idadeNoMomentoMatricula > 120
    ) {
      return NextResponse.json(
        {
          error:
            "A data de nascimento do aluno é inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const alunoMenorNoMomentoMatricula =
      idadeNoMomentoMatricula < 18;

    const camposResponsavelPendentes =
      alunoMenorNoMomentoMatricula
        ? verificarDadosResponsavel(
          aluno
        )
        : [];

    const responsavelIncompletoNoMomentoMatricula =
      alunoMenorNoMomentoMatricula &&
      camposResponsavelPendentes.length > 0;

    if (
      alunoMenorNoMomentoMatricula &&
      body.confirmacaoMenorAceita !==
      true
    ) {
      const mensagem =
        responsavelIncompletoNoMomentoMatricula
          ? `Este aluno possui ${idadeNoMomentoMatricula} ano(s) e os dados do responsável estão incompletos. Campos pendentes: ${camposResponsavelPendentes.join(
            ", "
          )}.`
          : `Este aluno possui ${idadeNoMomentoMatricula} ano(s) e ainda não atingiu a idade adulta.`;

      return NextResponse.json(
        {
          codigo:
            "CONFIRMACAO_MENOR_NECESSARIA",

          error: mensagem,

          idade:
            idadeNoMomentoMatricula,

          responsavelIncompleto:
            responsavelIncompletoNoMomentoMatricula,

          camposResponsavelPendentes,
        },
        {
          status: 409,
        }
      );
    }

    const usuarioConfirmador =
      alunoMenorNoMomentoMatricula
        ? await prisma.user.findFirst({
          where: {
            id: user.id,
            instituicaoId:
              user.instituicaoId,
          },

          select: {
            id: true,
            nome: true,

            funcionario: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        })
        : null;

    if (
      alunoMenorNoMomentoMatricula &&
      !usuarioConfirmador
    ) {
      return NextResponse.json(
        {
          error:
            "Não foi possível identificar o usuário responsável pela confirmação.",
        },
        {
          status: 401,
        }
      );
    }

    const nomeConfirmador =
      usuarioConfirmador?.funcionario
        ?.nome ||
      usuarioConfirmador?.nome ||
      null;

    const textoConfirmacaoMenor =
      alunoMenorNoMomentoMatricula
        ? responsavelIncompletoNoMomentoMatricula
          ? `O usuário ${nomeConfirmador || "não identificado"} confirmou a matrícula do aluno menor de idade, com ${idadeNoMomentoMatricula} ano(s), mesmo com dados incompletos do responsável. Campos pendentes: ${camposResponsavelPendentes.join(
            ", "
          )}.`
          : `O usuário ${nomeConfirmador || "não identificado"} confirmou a matrícula do aluno menor de idade, com ${idadeNoMomentoMatricula} ano(s), declarando ciência e responsabilidade pela operação.`
        : null;

    let turmasComDisciplinas:
      TurmaComDisciplina[] = [];

    let itensExplicitos:
      ItemMatriculaNormalizado[] |
      null = null;

    if (
      usaItensExplicitos &&
      itensMatriculaBody
    ) {
      const resultado =
        await validarItensMatriculaExplicitos({
          itens:
            itensMatriculaBody,

          instituicaoId:
            user.instituicaoId,

          alunoId,
        });

      itensExplicitos =
        resultado.itens;

      turmasComDisciplinas =
        resultado.turmasComDisciplinas;
    } else {
      const resultado =
        await buscarTurmasComDisciplinas({
          turmaIds,

          instituicaoId:
            user.instituicaoId,

          disciplinaIdsBody,
        });

      if (
        resultado.turmas.length !==
        turmaIds.length
      ) {
        return NextResponse.json(
          {
            error:
              "Uma ou mais turmas são inválidas para esta instituição.",
          },
          { status: 400 }
        );
      }

      turmasComDisciplinas =
        resultado.turmasComDisciplinas;

      if (
        turmasComDisciplinas.length ===
        0
      ) {
        return NextResponse.json(
          {
            error:
              "Nenhuma disciplina válida foi encontrada para a turma selecionada.",
          },
          { status: 400 }
        );
      }

      const disciplinaIdsSelecionadas =
        uniqueNumbers(
          turmasComDisciplinas.map(
            (turma) =>
              turma.disciplinaId
          )
        );

      const validacaoPreReq =
        await validarPreRequisitos(
          alunoId,
          user.instituicaoId,
          disciplinaIdsSelecionadas
        );

      if (!validacaoPreReq.ok) {
        return NextResponse.json(
          {
            error:
              validacaoPreReq.error,
          },
          { status: 400 }
        );
      }
    }

    const cursoIdsEncontrados: number[] = [];
    for (const turma of turmasComDisciplinas) {
      const cursoId = turma.disciplina?.cursoId;
      if (
        typeof cursoId === "number" &&
        Number.isFinite(cursoId) &&
        !cursoIdsEncontrados.includes(cursoId)
      ) {
        cursoIdsEncontrados.push(cursoId);
      }
    }

    const semestresEncontrados: number[] = [];
    for (const turma of turmasComDisciplinas) {
      const semestre = turma.disciplina?.semestre;
      if (
        typeof semestre === "number" &&
        Number.isFinite(semestre) &&
        !semestresEncontrados.includes(semestre)
      ) {
        semestresEncontrados.push(semestre);
      }
    }

    let cursoIdFinal = cursoIdBody;
    let semestreFinal = semestreBody;

    if (!cursoIdFinal) {
      if (cursoIdsEncontrados.length === 1) {
        cursoIdFinal = cursoIdsEncontrados[0];
      } else if (cursoIdsEncontrados.length > 1) {
        return NextResponse.json(
          {
            error:
              "As turmas selecionadas pertencem a cursos diferentes. Informe o curso corretamente.",
          },
          { status: 400 }
        );
      }
    }

    if (semestreFinal === null) {
      if (semestresEncontrados.length === 1) {
        semestreFinal = semestresEncontrados[0];
      } else if (semestresEncontrados.length > 1) {
        return NextResponse.json(
          {
            error:
              "As turmas selecionadas pertencem a semestres diferentes. Informe o semestre corretamente.",
          },
          { status: 400 }
        );
      }
    }

    const curso =
      cursoIdFinal !== null
        ? await prisma.curso.findFirst({
          where: {
            id: cursoIdFinal,
            instituicaoId: user.instituicaoId,
          },
        })
        : null;

    if (cursoIdFinal && !curso) {
      return NextResponse.json(
        { error: "Curso inválido para esta instituição" },
        { status: 400 }
      );
    }

    const periodoMatricula =
      periodoMatriculaId !== null
        ? await prisma.periodoMatricula.findFirst({
          where: {
            id: periodoMatriculaId,
            instituicaoId: user.instituicaoId,
          },
        })
        : null;

    if (periodoMatriculaId && !periodoMatricula) {
      return NextResponse.json(
        { error: "Período de matrícula inválido para esta instituição" },
        { status: 400 }
      );
    }

    const existe = await prisma.matricula.findFirst({
      where: {
        alunoId,
        cursoId: cursoIdFinal,
        semestre: semestreFinal,
        instituicaoId: user.instituicaoId,
      },
    });

    if (existe) {
      return NextResponse.json(
        {
          error: "Já existe uma matrícula para este aluno nesse curso/semestre",
        },
        { status: 400 }
      );
    }

    const itensClassificados =
      itensExplicitos
        ? removerItensDuplicadosPorTurma(
          itensExplicitos
        )
        : removerItensDuplicadosPorTurma(
          await classificarItensMatricula({
            instituicaoId:
              user.instituicaoId,

            cursoIdFinal,

            semestreFinal,

            cursoSemestreId,

            turmas:
              turmasComDisciplinas,
          })
        );

    const turmaPrincipalIdFinal =
      turmaPrincipalIdRecebido ??
      itensClassificados[0]?.turmaId ??
      null;

    if (!turmaPrincipalIdFinal) {
      return NextResponse.json(
        {
          error:
            "Selecione a turma principal do aluno.",
        },
        {
          status: 400,
        }
      );
    }

    const turmaPrincipal =
      await prisma.turma.findFirst({
        where: {
          id:
            turmaPrincipalIdFinal,

          instituicaoId:
            user.instituicaoId,

          ativa: true,

          ...(cursoIdFinal
            ? {
              cursoId:
                cursoIdFinal,
            }
            : {}),
        },

        select: {
          id: true,
          nome: true,
          cursoId: true,
          poloId: true,
        },
      });

    if (!turmaPrincipal) {
      return NextResponse.json(
        {
          error:
            "A turma principal selecionada é inválida, está inativa ou não pertence ao curso.",
        },
        {
          status: 400,
        }
      );
    }

    const turmaIdsDaMatricula =
      uniqueNumbers(
        itensClassificados.map(
          (item) =>
            Number(item.turmaId)
        )
      );

    const turmaIdsParaValidarPolo =
      uniqueNumbers([
        ...turmaIdsDaMatricula,
        turmaPrincipalIdFinal,
      ]);

    const turmasParaDefinirPolo =
      await prisma.turma.findMany({
        where: {
          instituicaoId:
            user.instituicaoId,

          id: {
            in: turmaIdsParaValidarPolo,
          },
        },

        select: {
          id: true,
          poloId: true,
        },
      });

    if (
      turmasParaDefinirPolo.length !==
      turmaIdsParaValidarPolo.length
    ) {
      return NextResponse.json(
        {
          error:
            "Uma ou mais turmas da matrícula não foram encontradas nesta instituição.",
        },
        {
          status: 400,
        }
      );
    }

    const poloIdsDasTurmas =
      uniqueNumbers(
        turmasParaDefinirPolo.map(
          (turma) =>
            turma.poloId
              ? Number(turma.poloId)
              : 0
        )
      );

    if (
      poloIdsDasTurmas.length > 1
    ) {
      return NextResponse.json(
        {
          error:
            "As disciplinas selecionadas pertencem a turmas de polos diferentes. A matrícula deve pertencer a um único polo.",
        },
        {
          status: 400,
        }
      );
    }

    let poloIdFinal: number | null =
      poloIdsDasTurmas[0] ??
      (
        aluno.poloId
          ? Number(aluno.poloId)
          : null
      );

    if (!poloIdFinal) {
      const polosAtivos =
        await prisma.polo.findMany({
          where: {
            instituicaoId:
              user.instituicaoId,

            ativo: true,
          },

          select: {
            id: true,
          },

          take: 2,
        });

      if (
        polosAtivos.length === 1
      ) {
        poloIdFinal =
          polosAtivos[0].id;
      }
    }

    if (!poloIdFinal) {
      return NextResponse.json(
        {
          error:
            "Não foi possível determinar o polo desta matrícula. Vincule o aluno ou a turma a um polo antes de concluir a matrícula.",
        },
        {
          status: 400,
        }
      );
    }

    const valorMatricula = Number(
      body.valorMatricula ??
      body.valorPagoMatricula ??
      curso?.valorMatricula ??
      0
    );

    const valorMensalidade = Number(
      body.valorMensalidade ?? curso?.valorMensalidade ?? 0
    );

    const quantidadeParcelas = Number(
      body.quantidadeParcelas ??
      body.quantidadeMensalidades ??
      curso?.quantidadeParcelas ??
      0
    );

    const dataPrimeiroVencimento =
      toDateOrNull(body.dataPrimeiroVencimento) ??
      toDateOrNull(body.primeiroVencimento) ??
      new Date();

    const statusRecebido = String(body.status || "ATIVA").trim().toUpperCase();

    const statusInicialMatricula =
      statusRecebido === "A_INICIAR" ? "A_INICIAR" : "ATIVA";

    const statusInicialItens =
      statusInicialMatricula === "A_INICIAR" ? "A_CURSAR" : "EM_CURSO";

    const periodoLetivoFinal =
      String(body.periodoLetivo || "").trim() ||
      periodoMatricula?.periodoLetivo ||
      (semestreFinal !== null ? `${semestreFinal}` : null);

    const modalidadeFinal =
      String(
        body.modalidade || ""
      ).trim() || null;

    const matricula =
      await prisma.$transaction(
        async (tx) => {
          const agoraConversao =
            new Date();

          if (!aluno.poloId) {
            await tx.aluno.updateMany({
              where: {
                id: alunoId,
                instituicaoId:
                  user.instituicaoId,
                poloId: null,
              },

              data: {
                poloId:
                  poloIdFinal,
              },
            });
          }

          const matriculaCriada =
            await tx.matricula.create({
              data: {
                alunoId,

                turmaPrincipalId:
                  turmaPrincipalIdFinal,

                leadOrigemId:
                  leadId ?? null,

                cursoId:
                  cursoIdFinal,

                cursoSemestreId,
                periodoMatriculaId,

                periodoLetivo:
                  periodoLetivoFinal ||
                  null,

                modalidade:
                  modalidadeFinal,

                realizadaPeloAluno:
                  Boolean(
                    body.realizadaPeloAluno
                  ),

                confirmadaEm:
                  agoraConversao,

                alunoMenorNoMomentoMatricula:
                  alunoMenorNoMomentoMatricula,

                idadeNoMomentoMatricula:
                  idadeNoMomentoMatricula,

                responsavelIncompletoNoMomentoMatricula:
                  responsavelIncompletoNoMomentoMatricula,

                confirmacaoMenorEm:
                  alunoMenorNoMomentoMatricula
                    ? agoraConversao
                    : null,

                confirmacaoMenorPorUserId:
                  alunoMenorNoMomentoMatricula
                    ? usuarioConfirmador?.id ??
                    user.id
                    : null,

                confirmacaoMenorPorFuncionarioId:
                  alunoMenorNoMomentoMatricula
                    ? usuarioConfirmador
                      ?.funcionario
                      ?.id ?? null
                    : null,

                confirmacaoMenorPorNomeSnapshot:
                  alunoMenorNoMomentoMatricula
                    ? nomeConfirmador
                    : null,

                textoConfirmacaoMenor:
                  textoConfirmacaoMenor,

                semestre:
                  semestreFinal,

                instituicaoId:
                  user.instituicaoId,

                poloId:
                  poloIdFinal,

                status:
                  statusInicialMatricula as any,

                valorMatricula:
                  Number.isFinite(
                    valorMatricula
                  )
                    ? valorMatricula
                    : null,

                valorMensalidade:
                  Number.isFinite(
                    valorMensalidade
                  )
                    ? valorMensalidade
                    : null,

                quantidadeMensalidades:
                  Number.isFinite(
                    quantidadeParcelas
                  )
                    ? quantidadeParcelas
                    : null,

                primeiroVencimento:
                  dataPrimeiroVencimento,

                vendedorResponsavelId:
                  vendedorResponsavel?.id ??
                  null,

                vendedorResponsavelNomeSnapshot:
                  vendedorResponsavel?.nome ??
                  null,

                origemComercial:
                  leadId
                    ? "CRM_LEADS"
                    : null,

                atendidoComercialEm:
                  leadId
                    ? agoraConversao
                    : null,

                observacaoComercial:
                  leadId
                    ? `Matrícula originada da conversão do lead #${leadId}.`
                    : null,

                participantesComerciais:
                  vendedorResponsavel
                    ? {
                      create: {
                        instituicaoId:
                          user.instituicaoId,

                        funcionarioId:
                          vendedorResponsavel.id,

                        criadoPorId:
                          user.id,

                        papel:
                          PapelParticipanteComercial.RESPONSAVEL,

                        percentualParticipacao:
                          100,

                        funcionarioNomeSnapshot:
                          vendedorResponsavel.nome,

                        funcionarioCargoSnapshot:
                          vendedorResponsavel.cargo,

                        funcionarioDepartamentoSnapshot:
                          vendedorResponsavel
                            .departamento?.nome ??
                          null,
                      },
                    }
                    : undefined,

                itens: {
                  create:
                    itensClassificados.map(
                      (item) => ({
                        turmaId:
                          item.turmaId,

                        disciplinaId:
                          item.disciplinaId,

                        tipoItem:
                          item.tipoItem as any,

                        instituicaoId:
                          user.instituicaoId,

                        status:
                          statusInicialItens as any,
                      })
                    ),
                },
              },

              include:
                includeMatriculaAdmin,
            });

          const resumoContratacao =
            montarResumoContratacao(
              matriculaCriada.itens.map(
                (item) => ({
                  turma: {
                    nome:
                      item.turma.nome,
                  },

                  disciplina: {
                    nome:
                      item.disciplina.nome,
                  },

                  tipoItem:
                    item.tipoItem as TipoItemMatricula,
                })
              )
            );

          const contratoTexto = `
CONTRATO DE MATRÍCULA

Instituição ID: ${user.instituicaoId}
Aluno: ${aluno.nome ?? "Aluno"}
Email: ${aluno.user?.email ?? "-"}
Curso: ${curso?.nome ?? "Curso não informado"}
Semestre: ${semestreFinal ?? "-"}
Período letivo: ${periodoLetivoFinal ?? "-"}
Disciplinas contratadas:
${resumoContratacao || "-"}

Data da matrícula: ${agoraConversao.toLocaleDateString("pt-BR")}

CLÁUSULAS:
1. O aluno declara estar ciente das normas acadêmicas da instituição.
2. O pagamento da matrícula e das mensalidades seguirá as regras financeiras cadastradas.
3. O não pagamento poderá gerar bloqueio de acesso acadêmico, conforme política institucional.
4. Este contrato poderá ser assinado e arquivado pela instituição.

Assinatura do aluno/responsável: __________________________
Assinatura da instituição: ________________________________
`;

          await tx.documentoAluno.create({
            data: {
              titulo:
                `Contrato de matrícula - ${aluno.nome ?? "Aluno"
                }`,

              tipo:
                "CONTRATO" as any,

              conteudo:
                contratoTexto,

              alunoId,

              instituicaoId:
                user.instituicaoId,

              matriculaId:
                matriculaCriada.id,
            },
          });

          /*
           * Lançamento da taxa de matrícula.
           *
           * Importante:
           * o valor informado no ato NÃO é baixado
           * automaticamente. O recebimento somente
           * ocorrerá pelo Caixa.
           */
          if (valorMatricula > 0) {
            await tx.lancamentoFinanceiro.create({
              data: {
                tipo: "MATRICULA",

                descricao:
                  `Taxa de matrícula - ${curso?.nome || "Curso"
                  }`,

                valorOriginal:
                  valorMatricula,

                valorFinal:
                  valorMatricula,

                valorPago: 0,

                pagoEm: null,

                status: "PENDENTE",

                observacao:
                  formaPagamentoMatricula
                    ? `Forma de pagamento informada na matrícula: ${formaPagamentoMatricula}. Não representa pagamento realizado. A baixa ocorrerá somente após recebimento no Caixa.`
                    : "Gerado no ato da matrícula. A baixa ocorrerá somente após recebimento no Caixa.",

                alunoId,

                matriculaId:
                  matriculaCriada.id,

                instituicaoId:
                  user.instituicaoId,

                poloId:
                  poloIdFinal,
              },
            });
          }

          /*
           * Geração das mensalidades.
           */
          if (
            valorMensalidade > 0 &&
            quantidadeParcelas > 0
          ) {
            for (
              let indice = 0;
              indice < quantidadeParcelas;
              indice += 1
            ) {
              const vencimento =
                addMonths(
                  dataPrimeiroVencimento,
                  indice
                );

              await tx.lancamentoFinanceiro.create({
                data: {
                  tipo:
                    "MENSALIDADE",

                  descricao:
                    `Mensalidade ${indice + 1
                    }/${quantidadeParcelas} - ${curso?.nome ?? "Curso"
                    }`,

                  valorOriginal:
                    valorMensalidade,

                  valorFinal:
                    valorMensalidade,

                  valorPago: 0,

                  vencimento,

                  status:
                    "PENDENTE",

                  observacao:
                    "Gerado automaticamente na matrícula",

                  alunoId,

                  matriculaId:
                    matriculaCriada.id,

                  instituicaoId:
                    user.instituicaoId,

                  poloId:
                    poloIdFinal,
                },
              });
            }
          }

          /*
           * Conversão do lead em matrícula.
           */
          if (
            leadId &&
            leadParaConversao
          ) {
            const usuarioAuditoria =
              await tx.user.findFirst({
                where: {
                  id: user.id,

                  instituicaoId:
                    user.instituicaoId,
                },

                select: {
                  nome: true,
                },
              });

            const leadAtualizado =
              await tx.lead.updateMany({
                where: {
                  id: leadId,

                  instituicaoGestoraId:
                    user.instituicaoId,
                },

                data: {
                  status:
                    "FECHADO",

                  proximoContatoEm:
                    null,

                  ultimoContatoEm:
                    agoraConversao,

                  atualizadoPorId:
                    user.id,
                },
              });

            if (
              leadAtualizado.count !==
              1
            ) {
              throw new Error(
                "Não foi possível fechar o lead da conversão."
              );
            }

            await tx.leadInteracao.create({
              data: {
                leadId,

                instituicaoGestoraId:
                  user.instituicaoId,

                criadoPorId:
                  user.id,

                tipo:
                  "CONVERSAO",

                descricao:
                  `Lead convertido em aluno e matrícula com sucesso. Aluno: ${aluno.nome ?? "Aluno"
                  }. Matrícula ID: ${matriculaCriada.id
                  }. Curso: ${curso?.nome ?? "não informado"
                  }.`,

                usuarioNomeSnapshot:
                  usuarioAuditoria?.nome ??
                  "Usuário autenticado",
              },
            });
          }

          return matriculaCriada;
        },
        {
          maxWait: 5000,
          timeout: 20000,
        }
            );

/*
 * Se esta matrícula nasceu da
 * conversão de um lead comercial,
 * emitimos o evento somente depois
 * que toda a transação foi concluída.
 *
 * Neste ponto já estão persistidos:
 * - a matrícula;
 * - o vínculo leadOrigemId;
 * - o fechamento do lead;
 * - a interação de CONVERSAO.
 *
 * Uma falha externa nunca poderá
 * desfazer a matrícula.
 */
if (
  leadId &&
  leadParaConversao
) {
  await enfileirarEventoSaidaCaptacaoSeguro({
    instituicaoId:
      user.instituicaoId,

    tipoEvento:
      EVENTOS_SAIDA_CAPTACAO.LEAD_CONVERTIDO,

    chaveEvento:
      `matricula:${matricula.id}:lead:${leadId}`,

    payload: {
      lead: {
        id:
          leadParaConversao.id,

        nome:
          leadParaConversao.nome,

        statusAnterior:
          leadParaConversao.status,

        statusNovo:
          "FECHADO",

        responsavelFuncionarioId:
          leadParaConversao.responsavelFuncionarioId,
      },

      matricula: {
        id:
          matricula.id,

        alunoId:
          matricula.alunoId,

        cursoId:
          matricula.cursoId,

        poloId:
          matricula.poloId,

        status:
          matricula.status,

        confirmadaEm:
          matricula.confirmadaEm,

        leadOrigemId:
          matricula.leadOrigemId,
      },

      conversao: {
        origem:
          "CRM_LEADS",

        usuarioId:
          user.id,
      },
    },
  });
}

return NextResponse.json({
      message: "Matrícula criada com sucesso",
      matricula,
      financeiro: {
        valorMatricula,
        valorPagoMatricula,
        valorMensalidade,
        quantidadeParcelas,
      },
    });
  } catch (error: any) {
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const alvo =
        Array.isArray(
          error.meta?.target
        )
          ? error.meta.target.join(
            ","
          )
          : String(
            error.meta?.target ||
            ""
          );

      if (
        alvo.includes(
          "leadOrigemId"
        )
      ) {
        return NextResponse.json(
          {
            codigo:
              "LEAD_JA_CONVERTIDO",

            error:
              "Este lead já foi convertido em outra matrícula.",
          },
          {
            status: 409,
          }
        );
      }
    }

    console.error("ERRO COMPLETO AO CRIAR MATRÍCULA:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar matrícula" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as MatriculaBody;

    const id = Number(body.id);
    const status = String(body.status || "").trim();

    const statusPermitidos = [
      "A_INICIAR",
      "ATIVA",
      "TRANCADA",
      "SUSPENSA",
      "CANCELADA",
      "CONCLUIDA",
    ];

    if (!id || !statusPermitidos.includes(status)) {
      return NextResponse.json(
        { error: "ID ou status inválido" },
        { status: 400 }
      );
    }

    const matricula = await prisma.matricula.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!matricula) {
      return NextResponse.json(
        { error: "Matrícula não encontrada" },
        { status: 404 }
      );
    }

    let statusItens: string | null = null;

    if (status === "A_INICIAR") statusItens = "A_CURSAR";
    if (status === "ATIVA") statusItens = "EM_CURSO";
    if (status === "TRANCADA") statusItens = "TRANCADO";
    if (status === "CANCELADA") statusItens = "CANCELADO";
    if (status === "CONCLUIDA") statusItens = "CONCLUIDO";

    if (statusItens) {
      await prisma.itemMatricula.updateMany({
        where: {
          matriculaId: id,
          instituicaoId: user.instituicaoId,
        },
        data: {
          status: statusItens as any,
        },
      });
    }

    const atualizada = await prisma.matricula.update({
      where: { id },
      data: {
        status: status as any,
      },
      include: includeMatricula,
    });

    return NextResponse.json(atualizada);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar status da matrícula" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as MatriculaBody;
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const matricula = await prisma.matricula.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!matricula) {
      return NextResponse.json(
        { error: "Matrícula não encontrada" },
        { status: 404 }
      );
    }

    await prisma.itemMatricula.deleteMany({
      where: {
        matriculaId: id,
        instituicaoId: user.instituicaoId,
      },
    });

    await prisma.lancamentoFinanceiro.deleteMany({
      where: {
        matriculaId: id,
        instituicaoId: user.instituicaoId,
      },
    });

    await prisma.documentoAluno.deleteMany({
      where: {
        matriculaId: id,
        instituicaoId: user.instituicaoId,
      },
    });

    await prisma.matricula.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao excluir matrícula" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as MatriculaBody;

    const vendedorFoiInformado =
      Object.prototype.hasOwnProperty.call(
        body,
        "vendedorResponsavelId"
      );

    const vendedorResponsavelValor =
      body.vendedorResponsavelId;

    const vendedorResponsavelId =
      vendedorFoiInformado
        ? toPositiveNumberOrNull(
          vendedorResponsavelValor
        )
        : null;

    if (
      vendedorFoiInformado &&
      vendedorResponsavelValor !== null &&
      vendedorResponsavelValor !== undefined &&
      vendedorResponsavelValor !== "" &&
      !vendedorResponsavelId
    ) {
      return NextResponse.json(
        {
          error:
            "O vendedor responsável informado é inválido.",
        },
        { status: 400 }
      );
    }

    let vendedorResponsavel:
      | VendedorElegivel
      | null = null;

    if (vendedorFoiInformado) {
      if (
        !temPermissao(
          user,
          "comercial.matriculas.vincular_vendedor"
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Você não possui permissão para vincular um vendedor à matrícula.",
          },
          { status: 403 }
        );
      }

      if (vendedorResponsavelId) {
        vendedorResponsavel =
          await buscarVendedorElegivel(
            user.instituicaoId,
            vendedorResponsavelId
          );

        if (!vendedorResponsavel) {
          return NextResponse.json(
            {
              error:
                "O vendedor não está ativo, não pertence à instituição ou não possui o cargo ativo de Vendedor.",
            },
            { status: 400 }
          );
        }
      }
    }

    const id = Number(body.id);
    const alunoId = toPositiveNumberOrNull(body.alunoId);
    const cursoId = toPositiveNumberOrNull(body.cursoId);
    const cursoSemestreId = toPositiveNumberOrNull(body.cursoSemestreId);
    const periodoMatriculaId = toPositiveNumberOrNull(body.periodoMatriculaId);
    const semestre = toPositiveNumberOrNull(body.semestre);

    const turmaPrincipalFoiInformada =
      campoFoiInformado(
        body as Record<
          string,
          unknown
        >,
        "turmaPrincipalId"
      );

    const turmaPrincipalIdRecebido =
      turmaPrincipalFoiInformada
        ? toPositiveNumberOrNull(
          body.turmaPrincipalId
        )
        : null;

    if (
      turmaPrincipalFoiInformada &&
      !turmaPrincipalIdRecebido
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione uma turma principal válida para o aluno.",
        },
        {
          status: 400,
        }
      );
    }

    const turmaIdsRaw = Array.isArray(body.turmaIds)
      ? body.turmaIds
      : body.turmaId
        ? [body.turmaId]
        : [];

    const turmaIds = uniqueNumbers(
      turmaIdsRaw
        .map((turmaId) => Number(turmaId))
        .filter((turmaId) => Number.isFinite(turmaId) && turmaId > 0)
    );

    const disciplinaIdsBody = uniqueNumbers(
      Array.isArray(body.disciplinaIds)
        ? body.disciplinaIds.map((disciplinaId) => Number(disciplinaId))
        : []
    );

    const itensMatriculaBody =
      Array.isArray(
        body.itensMatricula
      )
        ? body.itensMatricula
        : null;

    const usaItensExplicitos =
      itensMatriculaBody !== null;

    const deveSincronizarItens =
      usaItensExplicitos ||
      Array.isArray(body.turmaIds) ||
      body.turmaId !== undefined;

    const valorPagoMatriculaFoiInformado =
      campoFoiInformado(
        body as Record<string, unknown>,
        "valorPagoMatricula"
      );

    const dadosMensalidadeForamInformados =
      campoFoiInformado(
        body as Record<string, unknown>,
        "valorMensalidade"
      ) ||
      campoFoiInformado(
        body as Record<string, unknown>,
        "quantidadeMensalidades"
      ) ||
      campoFoiInformado(
        body as Record<string, unknown>,
        "quantidadeParcelas"
      ) ||
      campoFoiInformado(
        body as Record<string, unknown>,
        "primeiroVencimento"
      ) ||
      campoFoiInformado(
        body as Record<string, unknown>,
        "dataPrimeiroVencimento"
      );

    const valorPagoMatriculaRecebido =
      toPositiveNumberOrNull(
        body.valorPagoMatricula
      );

    const valorMensalidadeRecebido =
      toPositiveNumberOrNull(
        body.valorMensalidade
      );

    const quantidadeMensalidadesRecebida =
      toPositiveNumberOrNull(
        body.quantidadeMensalidades ??
        body.quantidadeParcelas
      );

    const primeiroVencimentoRecebido =
      toDateOrNull(
        body.primeiroVencimento
      ) ??
      toDateOrNull(
        body.dataPrimeiroVencimento
      );

    const nomeSocial =
      body.nomeSocial !== undefined ? String(body.nomeSocial || "") : undefined;
    const genero =
      body.genero !== undefined ? String(body.genero || "") : undefined;

    if (!id) {
      return NextResponse.json(
        { error: "ID da matrícula é obrigatório" },
        { status: 400 }
      );
    }

    const matriculaExistente = await prisma.matricula.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        aluno: true,
      },
    });

    if (!matriculaExistente) {
      return NextResponse.json(
        { error: "Matrícula não encontrada" },
        { status: 404 }
      );
    }

    const valorPagoMatriculaFinal =
      valorPagoMatriculaFoiInformado
        ? valorPagoMatriculaRecebido
        : Number(
          matriculaExistente.valorMatricula ||
          0
        ) || null;

    const valorMensalidadeFinal =
      dadosMensalidadeForamInformados
        ? valorMensalidadeRecebido
        : Number(
          matriculaExistente.valorMensalidade ||
          0
        ) || null;

    const quantidadeMensalidadesFinal =
      dadosMensalidadeForamInformados
        ? quantidadeMensalidadesRecebida
        : Number(
          matriculaExistente.quantidadeMensalidades ||
          0
        ) || null;

    const primeiroVencimentoFinal =
      dadosMensalidadeForamInformados
        ? primeiroVencimentoRecebido
        : matriculaExistente.primeiroVencimento;

    if (
      dadosMensalidadeForamInformados &&
      (
        !valorMensalidadeFinal ||
        !quantidadeMensalidadesFinal ||
        !Number.isInteger(
          quantidadeMensalidadesFinal
        ) ||
        !primeiroVencimentoFinal
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Para gerar as mensalidades, informe um valor maior que zero, uma quantidade inteira maior que zero e o primeiro vencimento.",
        },
        {
          status: 400,
        }
      );
    }

    if (vendedorFoiInformado) {
      const vendedorAtualId =
        matriculaExistente.vendedorResponsavelId ??
        null;

      const novoVendedorId =
        vendedorResponsavel?.id ?? null;

      const tentandoAlterarOuRemover =
        vendedorAtualId !== null &&
        novoVendedorId !== vendedorAtualId;

      if (tentandoAlterarOuRemover) {
        return NextResponse.json(
          {
            error:
              "Esta matrícula já possui um vendedor responsável. A alteração ou remoção deverá ser feita pela rotina auditada, com motivo obrigatório.",
          },
          { status: 409 }
        );
      }
    }

    const alunoIdFinal = alunoId ?? matriculaExistente.alunoId;
    const cursoIdFinal = cursoId ?? matriculaExistente.cursoId ?? null;
    const semestreFinal = semestre ?? matriculaExistente.semestre ?? null;

    const turmaPrincipalIdFinal =
      turmaPrincipalFoiInformada
        ? turmaPrincipalIdRecebido
        : matriculaExistente
          .turmaPrincipalId ??
        null;

    if (alunoId) {
      const alunoExiste = await prisma.aluno.findFirst({
        where: {
          id: alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: { id: true },
      });

      if (!alunoExiste) {
        return NextResponse.json(
          { error: "Aluno inválido para esta instituição" },
          { status: 400 }
        );
      }
    }

    let cursoNomeFinal =
      "Curso não informado";

    if (cursoIdFinal) {
      const cursoExiste =
        await prisma.curso.findFirst({
          where: {
            id: cursoIdFinal,
            instituicaoId:
              user.instituicaoId,
          },

          select: {
            id: true,
            nome: true,
          },
        });

      if (!cursoExiste) {
        return NextResponse.json(
          {
            error:
              "Curso inválido para esta instituição",
          },
          {
            status: 400,
          }
        );
      }

      if (turmaPrincipalIdFinal) {
        const turmaPrincipal =
          await prisma.turma.findFirst({
            where: {
              id:
                turmaPrincipalIdFinal,

              instituicaoId:
                user.instituicaoId,

              ativa: true,

              ...(cursoIdFinal
                ? {
                  cursoId:
                    cursoIdFinal,
                }
                : {}),
            },

            select: {
              id: true,
            },
          });

        if (!turmaPrincipal) {
          return NextResponse.json(
            {
              error:
                "A turma principal selecionada é inválida, está inativa ou não pertence ao curso.",
            },
            {
              status: 400,
            }
          );
        }
      }

      cursoNomeFinal =
        cursoExiste.nome;
    }

    let itensClassificados:
      ItemMatriculaNormalizado[] = [];

    if (
      usaItensExplicitos &&
      itensMatriculaBody
    ) {
      const resultado =
        await validarItensMatriculaExplicitos({
          itens:
            itensMatriculaBody,

          instituicaoId:
            user.instituicaoId,

          alunoId:
            alunoIdFinal,

          matriculaIdIgnorada:
            id,
        });

      itensClassificados =
        resultado.itens;
    } else if (
      Array.isArray(body.turmaIds) ||
      body.turmaId !== undefined
    ) {
      const {
        turmas,
        turmasComDisciplinas,
      } =
        await buscarTurmasComDisciplinas({
          turmaIds,

          instituicaoId:
            user.instituicaoId,

          disciplinaIdsBody,
        });

      if (
        turmas.length !==
        turmaIds.length
      ) {
        return NextResponse.json(
          {
            error:
              "Uma ou mais turmas são inválidas para esta instituição.",
          },
          { status: 400 }
        );
      }

      if (
        turmasComDisciplinas.length ===
        0
      ) {
        return NextResponse.json(
          {
            error:
              "Nenhuma disciplina válida foi encontrada para as turmas selecionadas.",
          },
          { status: 400 }
        );
      }

      const disciplinaIdsSelecionadas =
        uniqueNumbers(
          turmasComDisciplinas.map(
            (turma) =>
              turma.disciplinaId
          )
        );

      const validacaoPreReq =
        await validarPreRequisitos(
          alunoIdFinal,
          user.instituicaoId,
          disciplinaIdsSelecionadas
        );

      if (!validacaoPreReq.ok) {
        return NextResponse.json(
          {
            error:
              validacaoPreReq.error,
          },
          { status: 400 }
        );
      }

      itensClassificados =
        removerItensDuplicadosPorTurma(
          await classificarItensMatricula({
            instituicaoId:
              user.instituicaoId,

            cursoIdFinal,

            semestreFinal,

            cursoSemestreId:
              cursoSemestreId ??
              matriculaExistente
                .cursoSemestreId ??
              null,

            turmas:
              turmasComDisciplinas as TurmaComDisciplina[],
          })
        );
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.matricula.update({
          where: {
            id,
          },

          data: {
            alunoId: alunoIdFinal,
            cursoId: cursoIdFinal,

            turmaPrincipalId:
              turmaPrincipalFoiInformada
                ? turmaPrincipalIdFinal
                : undefined,

            cursoSemestreId:
              cursoSemestreId ??
              matriculaExistente
                .cursoSemestreId ??
              null,

            periodoMatriculaId:
              periodoMatriculaId ??
              matriculaExistente
                .periodoMatriculaId ??
              null,

            periodoLetivo:
              String(
                body.periodoLetivo || ""
              ).trim() ||
              matriculaExistente.periodoLetivo ||
              null,

            modalidade:
              String(
                body.modalidade || ""
              ).trim() ||
              matriculaExistente.modalidade ||
              null,

            semestre: semestreFinal,
            valorMatricula:
              valorPagoMatriculaFinal,

            valorMensalidade:
              valorMensalidadeFinal,

            quantidadeMensalidades:
              quantidadeMensalidadesFinal,

            primeiroVencimento:
              primeiroVencimentoFinal,

            vendedorResponsavelId:
              vendedorFoiInformado
                ? vendedorResponsavel?.id ??
                null
                : undefined,

            vendedorResponsavelNomeSnapshot:
              vendedorFoiInformado
                ? vendedorResponsavel?.nome ??
                null
                : undefined,
          },
        });

        if (
          vendedorFoiInformado &&
          vendedorResponsavel
        ) {
          await tx
            .matriculaParticipanteComercial
            .upsert({
              where: {
                matriculaId_funcionarioId: {
                  matriculaId: id,
                  funcionarioId:
                    vendedorResponsavel.id,
                },
              },

              update: {
                papel:
                  PapelParticipanteComercial.RESPONSAVEL,

                percentualParticipacao: 100,

                funcionarioNomeSnapshot:
                  vendedorResponsavel.nome,

                funcionarioCargoSnapshot:
                  vendedorResponsavel.cargo,

                funcionarioDepartamentoSnapshot:
                  vendedorResponsavel
                    .departamento?.nome ?? null,
              },

              create: {
                instituicaoId:
                  user.instituicaoId,

                matriculaId: id,

                funcionarioId:
                  vendedorResponsavel.id,

                criadoPorId:
                  user.id,

                papel:
                  PapelParticipanteComercial.RESPONSAVEL,

                percentualParticipacao: 100,

                funcionarioNomeSnapshot:
                  vendedorResponsavel.nome,

                funcionarioCargoSnapshot:
                  vendedorResponsavel.cargo,

                funcionarioDepartamentoSnapshot:
                  vendedorResponsavel
                    .departamento?.nome ?? null,
              },
            });
        }

        if (
          dadosMensalidadeForamInformados &&
          valorMensalidadeFinal &&
          quantidadeMensalidadesFinal &&
          primeiroVencimentoFinal
        ) {
          await sincronizarMensalidadesDaMatricula({
            tx,

            instituicaoId:
              user.instituicaoId,

            matriculaId: id,
            alunoId: alunoIdFinal,
            cursoNome:
              cursoNomeFinal,

            valorMensalidade:
              valorMensalidadeFinal,

            quantidadeMensalidades:
              quantidadeMensalidadesFinal,

            primeiroVencimento:
              primeiroVencimentoFinal,
          });
        }
      }
    );

    if (deveSincronizarItens) {
      const statusNovos:
        "A_CURSAR" | "EM_CURSO" =
        matriculaExistente.status ===
          "A_INICIAR"
          ? "A_CURSAR"
          : "EM_CURSO";

      await sincronizarItensMatricula({
        matriculaId: id,

        instituicaoId:
          user.instituicaoId,

        itens:
          itensClassificados,

        statusNovos,
      });
    }

    await prisma.contrato.updateMany({
      where: {
        matriculaId: id,
        instituicaoId: user.instituicaoId,
        status: {
          in: ["PENDENTE", "ASSINADO"] as any,
        },
      },
      data: {
        status: "CANCELADO",
      },
    });

    const matriculaAtualizadaParaContrato = await prisma.matricula.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        aluno: {
          include: {
            user: true,
          },
        },
        curso: true,
        itens: {
          where: {
            status: {
              not:
                "CANCELADO" as any,
            },
          },

          include: {
            disciplina: true,
            turma: true,
          },

          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (matriculaAtualizadaParaContrato) {
      const resumoContratacaoAtualizado = montarResumoContratacao(
        matriculaAtualizadaParaContrato.itens.map((item) => ({
          turma: {
            nome: item.turma?.nome || "Turma não informada",
          },
          disciplina: {
            nome: item.disciplina?.nome || "Disciplina não informada",
          },
          tipoItem: item.tipoItem as TipoItemMatricula,
        }))
      );

      const contratoTextoAtualizado = `
CONTRATO DE MATRÍCULA - ATUALIZAÇÃO

Instituição ID: ${user.instituicaoId}
Aluno: ${matriculaAtualizadaParaContrato.aluno?.nome ?? "Aluno"}
Email: ${matriculaAtualizadaParaContrato.aluno?.user?.email ?? "-"}
Curso: ${matriculaAtualizadaParaContrato.curso?.nome ?? "Curso não informado"}
Semestre: ${matriculaAtualizadaParaContrato.semestre ?? "-"}
Período letivo: ${matriculaAtualizadaParaContrato.periodoLetivo ?? "-"}
Disciplinas contratadas:
${resumoContratacaoAtualizado || "-"}

Data da atualização: ${new Date().toLocaleDateString("pt-BR")}

CLÁUSULAS:
1. O aluno declara estar ciente da atualização da matrícula.
2. As disciplinas acima substituem ou complementam a contratação acadêmica vigente.
3. O acesso às aulas seguirá a liberação acadêmica e financeira da instituição.
4. Este contrato substitui o contrato anterior da matrícula para fins de registro documental.

Assinatura do aluno/responsável: __________________________
Assinatura da instituição: ________________________________
`;

      await prisma.contrato.create({
        data: {
          alunoId: matriculaAtualizadaParaContrato.alunoId,
          matriculaId: id,
          instituicaoId: user.instituicaoId,
          conteudo: contratoTextoAtualizado,
          status: "PENDENTE",
        },
      });
    }

    if (nomeSocial !== undefined || genero !== undefined) {
      await prisma.aluno.updateMany({
        where: {
          id: alunoIdFinal,
          instituicaoId: user.instituicaoId,
        },
        data: {
          nomeSocial:
            nomeSocial !== undefined ? nomeSocial || null : undefined,
          genero: genero !== undefined ? genero || null : undefined,
        },
      });
    }

    const retorno = await prisma.matricula.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: includeMatriculaAdmin,
    });

    return NextResponse.json(retorno);
  } catch (error: any) {
    console.error("ERRO AO ATUALIZAR MATRÍCULA:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao atualizar matrícula" },
      { status: 500 }
    );
  }
}