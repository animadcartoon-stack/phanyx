import {
  Prisma,
  StatusPublicacaoCursoRede,
} from "@prisma/client";

type PoloDestinoPublicacaoCurso = {
  id: number;
  nome: string;
  instituicaoGeradaId: number;
};

type ParametrosPublicacaoCursoRede = {
  tx: Prisma.TransactionClient;
  cursoOrigemId: number;
  instituicaoOrigemId: number;
  polosDestino: PoloDestinoPublicacaoCurso[];
  publicadoPorId: number;
};

export type ResultadoPublicacaoCursoRede = {
  poloId: number;
  poloNome: string;
  instituicaoDestinoId: number;
  cursoDestinoId: number;
  publicacaoId: number;
  criadaAgora: boolean;
};

function codigoNormalizado(
  valor: string | null | undefined
) {
  const codigo = String(valor ?? "").trim();

  return codigo || null;
}

async function verificarConflitoCursoDestino(
  tx: Prisma.TransactionClient,
  parametros: {
    instituicaoDestinoId: number;
    cursoDestinoId?: number;
    nome: string;
    codigo: string | null;
  }
) {
  const condicoes: Prisma.CursoWhereInput[] = [
    {
      nome: parametros.nome,
    },
  ];

  if (parametros.codigo) {
    condicoes.push({
      codigo: parametros.codigo,
    });
  }

  const conflito = await tx.curso.findFirst({
    where: {
      instituicaoId:
        parametros.instituicaoDestinoId,

      id: parametros.cursoDestinoId
        ? {
            not: parametros.cursoDestinoId,
          }
        : undefined,

      OR: condicoes,
    },

    select: {
      id: true,
      nome: true,
      codigo: true,
    },
  });

  if (!conflito) {
    return;
  }

  if (
    parametros.codigo &&
    conflito.codigo === parametros.codigo
  ) {
    throw new Error(
      `A unidade de destino já possui outro curso com o código "${parametros.codigo}". Altere o código antes de publicar.`
    );
  }

  throw new Error(
    `A unidade de destino já possui outro curso com o nome "${parametros.nome}". O curso existente precisa ser revisado antes da publicação.`
  );
}

async function verificarConflitoDisciplinaDestino(
  tx: Prisma.TransactionClient,
  parametros: {
    instituicaoDestinoId: number;
    disciplinaDestinoId?: number;
    nome: string;
    codigo: string | null;
  }
) {
  const condicoes: Prisma.DisciplinaWhereInput[] = [
    {
      nome: parametros.nome,
    },
  ];

  if (parametros.codigo) {
    condicoes.push({
      codigo: parametros.codigo,
    });
  }

  const conflito =
    await tx.disciplina.findFirst({
      where: {
        instituicaoId:
          parametros.instituicaoDestinoId,

        id: parametros.disciplinaDestinoId
          ? {
              not:
                parametros.disciplinaDestinoId,
            }
          : undefined,

        OR: condicoes,
      },

      select: {
        id: true,
        nome: true,
        codigo: true,
      },
    });

  if (!conflito) {
    return;
  }

  if (
    parametros.codigo &&
    conflito.codigo === parametros.codigo
  ) {
    throw new Error(
      `A unidade de destino já possui outra disciplina com o código "${parametros.codigo}".`
    );
  }

  throw new Error(
    `A unidade de destino já possui outra disciplina com o nome "${parametros.nome}".`
  );
}

export async function publicarCursoParaUnidadesIndependentes(
  parametros: ParametrosPublicacaoCursoRede
): Promise<ResultadoPublicacaoCursoRede[]> {
  const {
    tx,
    cursoOrigemId,
    instituicaoOrigemId,
    polosDestino,
    publicadoPorId,
  } = parametros;

  if (polosDestino.length === 0) {
    return [];
  }

  const cursoOrigem =
    await tx.curso.findFirst({
      where: {
        id: cursoOrigemId,
        instituicaoId:
          instituicaoOrigemId,
      },

      include: {
        instituicao: {
          select: {
            id: true,
            nome: true,
            ativo: true,
            redeInstitucionalId: true,
          },
        },

        disciplinas: {
          orderBy: {
            nome: "asc",
          },
        },

        semestres: {
          orderBy: {
            numero: "asc",
          },

          include: {
            disciplinas: {
              include: {
                disciplina: true,
              },

              orderBy: {
                id: "asc",
              },
            },
          },
        },
      },
    });

  if (!cursoOrigem) {
    throw new Error(
      "O curso de origem não foi encontrado."
    );
  }

  if (!cursoOrigem.instituicao.ativo) {
    throw new Error(
      "A instituição de origem está inativa."
    );
  }

  if (
    !cursoOrigem.instituicao
      .redeInstitucionalId
  ) {
    throw new Error(
      "A instituição de origem não possui uma rede institucional válida."
    );
  }

  const redeId =
    cursoOrigem.instituicao
      .redeInstitucionalId;

  const instituicoesDestinoIds =
    Array.from(
      new Set(
        polosDestino.map(
          (polo) =>
            polo.instituicaoGeradaId
        )
      )
    );

  const instituicoesDestino =
    await tx.instituicao.findMany({
      where: {
        id: {
          in: instituicoesDestinoIds,
        },
      },

      select: {
        id: true,
        nome: true,
        ativo: true,
        redeInstitucionalId: true,
        herdaPlanoContratante: true,
      },
    });

  if (
    instituicoesDestino.length !==
    instituicoesDestinoIds.length
  ) {
    throw new Error(
      "Uma ou mais instituições de destino não foram encontradas."
    );
  }

  const instituicoesDestinoPorId =
    new Map(
      instituicoesDestino.map(
        (instituicao) => [
          instituicao.id,
          instituicao,
        ]
      )
    );

  const disciplinasOrigemPorId =
    new Map<
      number,
      (typeof cursoOrigem.disciplinas)[number]
    >();

  for (const disciplina of cursoOrigem.disciplinas) {
    disciplinasOrigemPorId.set(
      disciplina.id,
      disciplina
    );
  }

  for (const semestre of cursoOrigem.semestres) {
    for (const item of semestre.disciplinas) {
      disciplinasOrigemPorId.set(
        item.disciplina.id,
        item.disciplina
      );
    }
  }

  const resultados: ResultadoPublicacaoCursoRede[] =
    [];

  for (const polo of polosDestino) {
    const instituicaoDestino =
      instituicoesDestinoPorId.get(
        polo.instituicaoGeradaId
      );

    if (!instituicaoDestino) {
      throw new Error(
        `A instituição vinculada ao polo "${polo.nome}" não foi encontrada.`
      );
    }

    if (!instituicaoDestino.ativo) {
      throw new Error(
        `A unidade "${instituicaoDestino.nome}" está inativa e não pode receber cursos.`
      );
    }

    if (
      instituicaoDestino
        .redeInstitucionalId !== redeId
    ) {
      throw new Error(
        `A unidade "${instituicaoDestino.nome}" não pertence à mesma rede institucional do curso.`
      );
    }

    if (
      instituicaoDestino
        .herdaPlanoContratante !== true
    ) {
      throw new Error(
        `A unidade "${instituicaoDestino.nome}" não está configurada como unidade dependente da rede.`
      );
    }

    const publicacaoExistente =
      await tx.cursoPublicacaoRede.findUnique({
        where: {
          cursoOrigemId_instituicaoDestinoId:
            {
              cursoOrigemId:
                cursoOrigem.id,

              instituicaoDestinoId:
                instituicaoDestino.id,
            },
        },

        select: {
          id: true,
          cursoDestinoId: true,
          status: true,
        },
      });

    const codigoCurso =
      codigoNormalizado(
        cursoOrigem.codigo
      );

    await verificarConflitoCursoDestino(
      tx,
      {
        instituicaoDestinoId:
          instituicaoDestino.id,

        cursoDestinoId:
          publicacaoExistente
            ?.cursoDestinoId,

        nome: cursoOrigem.nome,
        codigo: codigoCurso,
      }
    );

    let cursoDestino;
    let publicacaoId: number;
    let criadaAgora = false;

    if (publicacaoExistente) {
      cursoDestino =
        await tx.curso.update({
          where: {
            id:
              publicacaoExistente
                .cursoDestinoId,
          },

          data: {
            nome:
              cursoOrigem.nome,

            codigo:
              codigoCurso,

            descricao:
              cursoOrigem.descricao,

            ativo:
              cursoOrigem.ativo,

            modalidadeCertificado:
              cursoOrigem
                .modalidadeCertificado,

            quantidadeSemestres:
              cursoOrigem
                .quantidadeSemestres,

            cargaHorariaMaximaSemestre:
              cursoOrigem
                .cargaHorariaMaximaSemestre,

            /*
             * Valores financeiros não são
             * sobrescritos em sincronizações.
             * Eles permanecem locais.
             */
          },

          select: {
            id: true,
            instituicaoId: true,
          },
        });

      publicacaoId =
        publicacaoExistente.id;
    } else {
      cursoDestino =
        await tx.curso.create({
          data: {
            nome:
              cursoOrigem.nome,

            codigo:
              codigoCurso,

            descricao:
              cursoOrigem.descricao,

            ativo:
              cursoOrigem.ativo,

            modalidadeCertificado:
              cursoOrigem
                .modalidadeCertificado,

            quantidadeSemestres:
              cursoOrigem
                .quantidadeSemestres,

            cargaHorariaMaximaSemestre:
              cursoOrigem
                .cargaHorariaMaximaSemestre,

            /*
             * Estes valores funcionam como
             * configuração inicial da unidade.
             * Depois, permanecem locais.
             */
            valorMatricula:
              cursoOrigem
                .valorMatricula,

            valorMensalidade:
              cursoOrigem
                .valorMensalidade,

            quantidadeParcelas:
              cursoOrigem
                .quantidadeParcelas,

            /*
             * O modelo de certificado não é
             * reutilizado entre tenants.
             */
            certificadoModeloId:
              null,

            instituicaoId:
              instituicaoDestino.id,

            criadoPorId:
              publicadoPorId,
          },

          select: {
            id: true,
            instituicaoId: true,
          },
        });

      const novaPublicacao =
        await tx.cursoPublicacaoRede.create({
          data: {
            cursoOrigemId:
              cursoOrigem.id,

            cursoDestinoId:
              cursoDestino.id,

            instituicaoOrigemId:
              instituicaoOrigemId,

            instituicaoDestinoId:
              instituicaoDestino.id,

            poloId:
              polo.id,

            status:
              StatusPublicacaoCursoRede.ATIVA,

            publicadoPorId:
              publicadoPorId,

            atualizadoPorId:
              publicadoPorId,

            sincronizadoEm:
              new Date(),
          },

          select: {
            id: true,
          },
        });

      publicacaoId =
        novaPublicacao.id;

      criadaAgora = true;
    }

    const idsDisciplinasOrigemAtuais =
  new Set<number>(
    Array.from(
      disciplinasOrigemPorId.keys()
    )
  );

const disciplinasPublicadasNoDestino =
  await tx.disciplina.findMany({
    where: {
      instituicaoId:
        instituicaoDestino.id,

      cursoId:
        cursoDestino.id,

      disciplinaOrigemRedeId: {
        not: null,
      },
    },

    select: {
      id: true,
      disciplinaOrigemRedeId: true,
    },
  });

const idsDisciplinasObsoletas =
  disciplinasPublicadasNoDestino
    .filter(
      (disciplina) =>
        typeof disciplina
          .disciplinaOrigemRedeId ===
          "number" &&
        !idsDisciplinasOrigemAtuais.has(
          disciplina
            .disciplinaOrigemRedeId
        )
    )
    .map(
      (disciplina) => disciplina.id
    );

if (
  idsDisciplinasObsoletas.length > 0
) {
  await tx.cursoSemestreDisciplina.deleteMany(
    {
      where: {
        instituicaoId:
          instituicaoDestino.id,

        disciplinaId: {
          in:
            idsDisciplinasObsoletas,
        },
      },
    }
  );

  await tx.disciplina.updateMany({
    where: {
      instituicaoId:
        instituicaoDestino.id,

      id: {
        in:
          idsDisciplinasObsoletas,
      },
    },

    data: {
      ativo: false,
      cursoId: null,
      professorId: null,
    },
  });
}

    const disciplinaDestinoPorOrigemId =
      new Map<number, number>();

    for (
      const disciplinaOrigem of
      disciplinasOrigemPorId.values()
    ) {
      const codigoDisciplina =
        codigoNormalizado(
          disciplinaOrigem.codigo
        );

      const disciplinaPublicada =
        await tx.disciplina.findUnique({
          where: {
            instituicaoId_disciplinaOrigemRedeId:
              {
                instituicaoId:
                  instituicaoDestino.id,

                disciplinaOrigemRedeId:
                  disciplinaOrigem.id,
              },
          },

          select: {
            id: true,
          },
        });

      await verificarConflitoDisciplinaDestino(
        tx,
        {
          instituicaoDestinoId:
            instituicaoDestino.id,

          disciplinaDestinoId:
            disciplinaPublicada?.id,

          nome:
            disciplinaOrigem.nome,

          codigo:
            codigoDisciplina,
        }
      );

      let disciplinaDestino;

      if (disciplinaPublicada) {
        disciplinaDestino =
          await tx.disciplina.update({
            where: {
              id:
                disciplinaPublicada.id,
            },

            data: {
              nome:
                disciplinaOrigem.nome,

              codigo:
                codigoDisciplina,

              descricao:
                disciplinaOrigem
                  .descricao,

              semestre:
                disciplinaOrigem
                  .semestre,

              cargaHoraria:
                disciplinaOrigem
                  .cargaHoraria,

              ativo:
                disciplinaOrigem.ativo,

              cursoId:
                cursoDestino.id,

              professorId:
                null,
            },

            select: {
              id: true,
            },
          });
      } else {
        disciplinaDestino =
          await tx.disciplina.create({
            data: {
              nome:
                disciplinaOrigem.nome,

              codigo:
                codigoDisciplina,

              descricao:
                disciplinaOrigem
                  .descricao,

              semestre:
                disciplinaOrigem
                  .semestre,

              cargaHoraria:
                disciplinaOrigem
                  .cargaHoraria,

              ativo:
                disciplinaOrigem.ativo,

              cursoId:
                cursoDestino.id,

              instituicaoId:
                instituicaoDestino.id,

              professorId:
                null,

              disciplinaOrigemRedeId:
                disciplinaOrigem.id,
            },

            select: {
              id: true,
            },
          });
      }

      disciplinaDestinoPorOrigemId.set(
        disciplinaOrigem.id,
        disciplinaDestino.id
      );
    }

    for (const semestreOrigem of cursoOrigem.semestres) {
      const semestrePublicado =
        await tx.cursoSemestre.findUnique({
          where: {
            instituicaoId_cursoSemestreOrigemRedeId:
              {
                instituicaoId:
                  instituicaoDestino.id,

                cursoSemestreOrigemRedeId:
                  semestreOrigem.id,
              },
          },

          select: {
            id: true,
          },
        });

      let semestreDestino;

      if (semestrePublicado) {
        semestreDestino =
          await tx.cursoSemestre.update({
            where: {
              id:
                semestrePublicado.id,
            },

            data: {
              numero:
                semestreOrigem.numero,

              titulo:
                semestreOrigem.titulo,

              descricao:
                semestreOrigem.descricao,

              cargaMaxima:
                semestreOrigem
                  .cargaMaxima,

              cargaMinima:
                semestreOrigem
                  .cargaMinima,

              cursoId:
                cursoDestino.id,
            },

            select: {
              id: true,
            },
          });
      } else {
        const conflitoSemestre =
          await tx.cursoSemestre.findFirst({
            where: {
              cursoId:
                cursoDestino.id,

              numero:
                semestreOrigem.numero,
            },

            select: {
              id: true,
            },
          });

        if (conflitoSemestre) {
          throw new Error(
            `A unidade "${instituicaoDestino.nome}" já possui o semestre ${semestreOrigem.numero} cadastrado nesse curso sem vínculo com a rede.`
          );
        }

        semestreDestino =
          await tx.cursoSemestre.create({
            data: {
              numero:
                semestreOrigem.numero,

              titulo:
                semestreOrigem.titulo,

              descricao:
                semestreOrigem.descricao,

              cargaMaxima:
                semestreOrigem
                  .cargaMaxima,

              cargaMinima:
                semestreOrigem
                  .cargaMinima,

              cursoId:
                cursoDestino.id,

              instituicaoId:
                instituicaoDestino.id,

              cursoSemestreOrigemRedeId:
                semestreOrigem.id,
            },

            select: {
              id: true,
            },
          });
      }

      await tx.cursoSemestreDisciplina.deleteMany({
        where: {
          cursoSemestreId:
            semestreDestino.id,
        },
      });

      const disciplinasDoSemestre =
        semestreOrigem.disciplinas
          .map((item) => {
            const disciplinaDestinoId =
              disciplinaDestinoPorOrigemId.get(
                item.disciplinaId
              );

            if (!disciplinaDestinoId) {
              return null;
            }

            return {
              cursoSemestreId:
                semestreDestino.id,

              disciplinaId:
                disciplinaDestinoId,

              instituicaoId:
                instituicaoDestino.id,
            };
          })
          .filter(
            (
              item
            ): item is {
              cursoSemestreId: number;
              disciplinaId: number;
              instituicaoId: number;
            } => item !== null
          );

      if (
        disciplinasDoSemestre.length > 0
      ) {
        await tx.cursoSemestreDisciplina.createMany({
          data: disciplinasDoSemestre,
        });
      }
    }

    await tx.cursoPublicacaoRede.update({
      where: {
        id: publicacaoId,
      },

      data: {
        poloId:
          polo.id,

        status:
          StatusPublicacaoCursoRede.ATIVA,

        atualizadoPorId:
          publicadoPorId,

        sincronizadoEm:
          new Date(),

        retiradoPorId:
          null,

        retiradoEm:
          null,

        motivoRetirada:
          null,
      },
    });

    resultados.push({
      poloId:
        polo.id,

      poloNome:
        polo.nome,

      instituicaoDestinoId:
        instituicaoDestino.id,

      cursoDestinoId:
        cursoDestino.id,

      publicacaoId,

      criadaAgora,
    });
  }

  return resultados;
}

type ParametrosSincronizacaoPublicacoesCursoRede = {
  tx: Prisma.TransactionClient;
  cursoOrigemId: number;
  instituicaoOrigemId: number;
  atualizadoPorId: number;
};

export async function sincronizarPublicacoesAtivasDoCurso(
  parametros: ParametrosSincronizacaoPublicacoesCursoRede
): Promise<ResultadoPublicacaoCursoRede[]> {
  const {
    tx,
    cursoOrigemId,
    instituicaoOrigemId,
    atualizadoPorId,
  } = parametros;

  const publicacoes =
    await tx.cursoPublicacaoRede.findMany({
      where: {
        cursoOrigemId,
        instituicaoOrigemId,
        status:
          StatusPublicacaoCursoRede.ATIVA,
      },
      select: {
        id: true,
        polo: {
          select: {
            id: true,
            nome: true,
            instituicaoGeradaId: true,
          },
        },
      },
    });

  if (publicacoes.length === 0) {
    return [];
  }

  const polosDestino:
    PoloDestinoPublicacaoCurso[] = [];

  for (const publicacao of publicacoes) {
    const polo = publicacao.polo;

    const instituicaoGeradaId = Number(
      polo?.instituicaoGeradaId
    );

    if (
      !polo ||
      !Number.isInteger(
        instituicaoGeradaId
      ) ||
      instituicaoGeradaId <= 0
    ) {
      throw new Error(
        `A publicação ${publicacao.id} não possui um polo com instituição independente válida.`
      );
    }

    polosDestino.push({
      id: polo.id,
      nome: polo.nome,
      instituicaoGeradaId,
    });
  }

  return publicarCursoParaUnidadesIndependentes({
    tx,
    cursoOrigemId,
    instituicaoOrigemId,
    polosDestino,
    publicadoPorId:
      atualizadoPorId,
  });
}