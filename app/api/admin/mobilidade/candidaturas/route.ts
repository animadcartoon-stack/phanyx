import {
  MobilidadeStatusCandidatura,
  MobilidadeStatusDocumento,
  MobilidadeStatusOferta,
  MobilidadeVinculoCandidato,
  Prisma,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroMobilidade,
  exigirAcessoMobilidade,
  exigirGerenciamentoMobilidade,
  respostaErroMobilidade,
  temPermissaoMobilidade,
} from "@/lib/mobilidade-acesso";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_VALIDOS =
  new Set(
    Object.values(
      MobilidadeStatusCandidatura
    )
  );

const VINCULOS_VALIDOS =
  new Set(
    Object.values(
      MobilidadeVinculoCandidato
    )
  );

const STATUS_PENDENTES: MobilidadeStatusCandidatura[] =
  [
    MobilidadeStatusCandidatura.ENVIADA,
    MobilidadeStatusCandidatura.EM_ANALISE,
    MobilidadeStatusCandidatura.DOCUMENTACAO_PENDENTE,
    MobilidadeStatusCandidatura.ELEGIVEL,
    MobilidadeStatusCandidatura.EM_SELECAO,
    MobilidadeStatusCandidatura.CLASSIFICADA,
    MobilidadeStatusCandidatura.LISTA_ESPERA,
  ];

const STATUS_ANALISADOS =
  new Set<
    MobilidadeStatusCandidatura
  >([
    MobilidadeStatusCandidatura.EM_ANALISE,
    MobilidadeStatusCandidatura.DOCUMENTACAO_PENDENTE,
    MobilidadeStatusCandidatura.ELEGIVEL,
    MobilidadeStatusCandidatura.INELEGIVEL,
    MobilidadeStatusCandidatura.EM_SELECAO,
    MobilidadeStatusCandidatura.CLASSIFICADA,
    MobilidadeStatusCandidatura.LISTA_ESPERA,
    MobilidadeStatusCandidatura.APROVADA,
    MobilidadeStatusCandidatura.REPROVADA,
  ]);

function textoOpcional(
  valor: unknown,
  maximo = 500
) {
  if (
    typeof valor !== "string"
  ) {
    return null;
  }

  const texto =
    valor.trim();

  return texto
    ? texto.slice(
        0,
        maximo
      )
    : null;
}

function statusValido(
  valor: unknown
): MobilidadeStatusCandidatura | null {
  return typeof valor ===
      "string" &&
    STATUS_VALIDOS.has(
      valor as
        MobilidadeStatusCandidatura
    )
    ? (
        valor as
          MobilidadeStatusCandidatura
      )
    : null;
}

function vinculoValido(
  valor: unknown
): MobilidadeVinculoCandidato | null {
  return typeof valor ===
      "string" &&
    VINCULOS_VALIDOS.has(
      valor as
        MobilidadeVinculoCandidato
    )
    ? (
        valor as
          MobilidadeVinculoCandidato
      )
    : null;
}

function inteiroOuNulo(
  valor: unknown,
  minimo = 1
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero =
    Number(valor);

  if (
    !Number.isInteger(
      numero
    ) ||
    numero < minimo
  ) {
    return undefined;
  }

  return numero;
}

function decimalOuNulo(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero =
    Number(valor);

  if (
    !Number.isFinite(
      numero
    )
  ) {
    return undefined;
  }

  return numero;
}

function emailValido(
  email: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function paisCodigo(
  valor: unknown
) {
  const texto =
    textoOpcional(
      valor,
      2
    );

  if (!texto) {
    return null;
  }

  const codigo =
    texto.toUpperCase();

  if (
    !/^[A-Z]{2}$/.test(
      codigo
    )
  ) {
    return undefined;
  }

  return codigo;
}

function erroDuplicidade(
  erro: unknown
) {
  return (
    erro instanceof
      Prisma.PrismaClientKnownRequestError &&
    erro.code === "P2002"
  );
}

async function obterOferta(
  instituicaoId: number,
  ofertaId: number
) {
  const oferta =
    await prisma.mobilidadeOferta.findFirst({
      where: {
        id: ofertaId,
        instituicaoId,

        status: {
          notIn: [
            MobilidadeStatusOferta.RASCUNHO,
            MobilidadeStatusOferta.FINALIZADA,
            MobilidadeStatusOferta.CANCELADA,
          ],
        },
      },

      select: {
        id: true,
        titulo: true,
        status: true,
        vagas: true,
        permiteListaEspera: true,

        cursos: {
          select: {
            cursoId: true,
          },
        },

        programa: {
          select: {
            id: true,
            nome: true,
            direcao: true,

            instituicaoParceira: {
              select: {
                id: true,
                nome: true,
                paisCodigo: true,
              },
            },
          },
        },
      },
    });

  if (!oferta) {
    throw new ErroMobilidade(
      400,
      "OFERTA_INVALIDA",
      "Oferta inválida."
    );
  }

  return oferta;
}

export async function GET(
  req: NextRequest
) {
  try {
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirAcessoMobilidade(
        usuario,
        "mobilidade.candidaturas.ver",
        "mobilidade.candidaturas.gerenciar"
      );

    const q =
      req.nextUrl.searchParams
        .get("q")
        ?.trim() ?? "";

    const statusParam =
      req.nextUrl.searchParams
        .get("status");

    const vinculoParam =
      req.nextUrl.searchParams
        .get("vinculo");

    const ofertaIdParam =
      Number(
        req.nextUrl.searchParams
          .get("ofertaId") ?? ""
      );

    const status =
      statusParam
        ? statusValido(
            statusParam
          )
        : null;

    const vinculo =
      vinculoParam
        ? vinculoValido(
            vinculoParam
          )
        : null;

    const ofertaId =
      Number.isInteger(
        ofertaIdParam
      ) &&
      ofertaIdParam > 0
        ? ofertaIdParam
        : null;

    const where: Prisma.MobilidadeCandidaturaWhereInput =
      {
        instituicaoId,

        ...(status
          ? {
              status,
            }
          : {}),

        ...(vinculo
          ? {
              vinculoCandidato:
                vinculo,
            }
          : {}),

        ...(ofertaId
          ? {
              ofertaId,
            }
          : {}),

        ...(q
          ? {
              OR: [
                {
                  nomeSnapshot: {
                    contains: q,
                    mode: "insensitive",
                  },
                },

                {
                  emailSnapshot: {
                    contains: q,
                    mode: "insensitive",
                  },
                },

                {
                  telefoneSnapshot: {
                    contains: q,
                    mode: "insensitive",
                  },
                },

                {
                  instituicaoOrigemNome: {
                    contains: q,
                    mode: "insensitive",
                  },
                },

                {
                  oferta: {
                    titulo: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                },

                {
                  matricula: {
                    numeroMatricula: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                },

                {
                  aluno: {
                    matricula: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),
      };

    const [
      total,
      pendentes,
      aprovadas,
      naoAprovadas,
      candidaturasRaw,
      ofertas,
    ] =
      await prisma.$transaction([
        prisma.mobilidadeCandidatura.count({
          where: {
            instituicaoId,
          },
        }),

        prisma.mobilidadeCandidatura.count({
          where: {
            instituicaoId,

            status: {
              in:
                STATUS_PENDENTES,
            },
          },
        }),

        prisma.mobilidadeCandidatura.count({
          where: {
            instituicaoId,
            status:
              MobilidadeStatusCandidatura.APROVADA,
          },
        }),

        prisma.mobilidadeCandidatura.count({
          where: {
            instituicaoId,

            status: {
              in: [
                MobilidadeStatusCandidatura.INELEGIVEL,
                MobilidadeStatusCandidatura.REPROVADA,
              ],
            },
          },
        }),

        prisma.mobilidadeCandidatura.findMany({
          where,

          select: {
            id: true,
            ofertaId: true,
            alunoId: true,
            matriculaId: true,
            vinculoCandidato: true,
            nomeSnapshot: true,
            emailSnapshot: true,
            telefoneSnapshot: true,
            instituicaoOrigemNome: true,
            paisOrigemCodigo: true,
            status: true,
            motivoStatus: true,
            enviadaEm: true,
            analisadaEm: true,
            notaFinal: true,
            classificacao: true,
            createdAt: true,
            updatedAt: true,

            oferta: {
              select: {
                id: true,
                titulo: true,
                codigo: true,
                status: true,
                ano: true,
                periodo: true,
                vagas: true,

                programa: {
                  select: {
                    id: true,
                    nome: true,
                    direcao: true,

                    instituicaoParceira: {
                      select: {
                        id: true,
                        nome: true,
                        paisCodigo: true,
                      },
                    },
                  },
                },
              },
            },

            aluno: {
              select: {
                id: true,
                nome: true,
                nomeSocial: true,
                matricula: true,
              },
            },

            matricula: {
              select: {
                id: true,
                numeroMatricula: true,
                numeroMatriculaLegado: true,
                status: true,
                semestre: true,
                periodoLetivo: true,

                curso: {
                  select: {
                    id: true,
                    nome: true,
                    codigo: true,
                  },
                },
              },
            },

            documentos: {
              select: {
                id: true,
                obrigatorio: true,
                status: true,
              },
            },
          },

          orderBy: [
            {
              createdAt:
                "desc",
            },
          ],

          take: 300,
        }),

        prisma.mobilidadeOferta.findMany({
          where: {
            instituicaoId,

            status: {
              notIn: [
                MobilidadeStatusOferta.RASCUNHO,
                MobilidadeStatusOferta.FINALIZADA,
                MobilidadeStatusOferta.CANCELADA,
              ],
            },
          },

          select: {
            id: true,
            titulo: true,
            codigo: true,
            status: true,
            ano: true,
            periodo: true,
            vagas: true,

            programa: {
              select: {
                id: true,
                nome: true,
                direcao: true,

                instituicaoParceira: {
                  select: {
                    id: true,
                    nome: true,
                    paisCodigo: true,
                  },
                },
              },
            },
          },

          orderBy: [
            {
              inscricoesFim:
                "desc",
            },
            {
              titulo:
                "asc",
            },
          ],
        }),
      ]);

    const candidaturas =
      candidaturasRaw.map(
        (item) => {
          const documentosObrigatorios =
            item.documentos.filter(
              (documento) =>
                documento.obrigatorio
            );

          const documentosPendentes =
            documentosObrigatorios.filter(
              (documento) =>
                documento.status !==
                MobilidadeStatusDocumento.APROVADO
            ).length;

          return {
            ...item,

            notaFinal:
              item.notaFinal ===
              null
                ? null
                : Number(
                    item.notaFinal
                  ),

            documentosResumo: {
              total:
                item.documentos.length,

              obrigatorios:
                documentosObrigatorios.length,

              pendentes:
                documentosPendentes,

              aprovados:
                item.documentos.filter(
                  (documento) =>
                    documento.status ===
                    MobilidadeStatusDocumento.APROVADO
                ).length,
            },

            documentos:
              undefined,
          };
        }
      );

    return NextResponse.json(
      {
        ok: true,

        permissoes: {
          podeGerenciar:
            temPermissaoMobilidade(
              usuario,
              "mobilidade.gerenciar",
              "mobilidade.candidaturas.gerenciar"
            ),
        },

        resumo: {
          total,
          pendentes,
          aprovadas,
          naoAprovadas,
        },

        candidaturas,
        ofertas,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (erro) {
    const resposta =
      respostaErroMobilidade(
        erro
      );

    return NextResponse.json(
      resposta.corpo,
      {
        status:
          resposta.status,
      }
    );
  }
}

export async function POST(
  req: NextRequest
) {
  try {
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirGerenciamentoMobilidade(
        usuario,
        "mobilidade.candidaturas.gerenciar"
      );

    const corpo =
      (await req.json()) as Record<
        string,
        unknown
      >;

    const ofertaId =
      Number(
        corpo.ofertaId
      );

    if (
      !Number.isInteger(
        ofertaId
      ) ||
      ofertaId <= 0
    ) {
      throw new ErroMobilidade(
        400,
        "OFERTA_INVALIDA",
        "Oferta inválida."
      );
    }

    const oferta =
      await obterOferta(
        instituicaoId,
        ofertaId
      );

    const vinculo =
      vinculoValido(
        corpo.vinculoCandidato
      );

    if (!vinculo) {
      throw new ErroMobilidade(
        400,
        "VINCULO_INVALIDO",
        "Vínculo inválido."
      );
    }

    const status =
      corpo.status ===
        undefined
        ? MobilidadeStatusCandidatura.RASCUNHO
        : statusValido(
            corpo.status
          );

    if (!status) {
      throw new ErroMobilidade(
        400,
        "STATUS_INVALIDO",
        "Status inválido."
      );
    }

    const notaFinal =
      decimalOuNulo(
        corpo.notaFinal
      );

    if (
      notaFinal === undefined
    ) {
      throw new ErroMobilidade(
        400,
        "NOTA_INVALIDA",
        "Nota inválida."
      );
    }

    const classificacao =
      inteiroOuNulo(
        corpo.classificacao,
        1
      );

    if (
      classificacao ===
      undefined
    ) {
      throw new ErroMobilidade(
        400,
        "CLASSIFICACAO_INVALIDA",
        "Classificação inválida."
      );
    }

    let alunoId:
      | number
      | null = null;

    let matriculaId:
      | number
      | null = null;

    let nomeSnapshot:
      string;

    let emailSnapshot:
      | string
      | null = null;

    let telefoneSnapshot:
      | string
      | null = null;

    let instituicaoOrigemNome:
      | string
      | null = null;

    let paisOrigemCodigo:
      | string
      | null = null;

    if (
      vinculo ===
      MobilidadeVinculoCandidato.ALUNO_PHANYX
    ) {
      const alunoIdRecebido =
        Number(
          corpo.alunoId
        );

      if (
        !Number.isInteger(
          alunoIdRecebido
        ) ||
        alunoIdRecebido <=
          0
      ) {
        throw new ErroMobilidade(
          400,
          "ALUNO_INVALIDO",
          "Aluno inválido."
        );
      }

      const aluno =
        await prisma.aluno.findFirst({
          where: {
            id:
              alunoIdRecebido,

            instituicaoId,
          },

          select: {
            id: true,
            nome: true,
            nomeSocial: true,
            telefone: true,

            user: {
              select: {
                email: true,
              },
            },
          },
        });

      if (!aluno) {
        throw new ErroMobilidade(
          400,
          "ALUNO_INVALIDO",
          "Aluno inválido."
        );
      }

      alunoId =
        aluno.id;

      nomeSnapshot =
        aluno.nomeSocial?.trim() ||
        aluno.nome;

      emailSnapshot =
        aluno.user.email;

      telefoneSnapshot =
        aluno.telefone;

      const matriculaRecebida =
        corpo.matriculaId ===
          null ||
        corpo.matriculaId ===
          undefined ||
        corpo.matriculaId ===
          ""
          ? null
          : Number(
              corpo.matriculaId
            );

      if (
        matriculaRecebida !==
        null
      ) {
        if (
          !Number.isInteger(
            matriculaRecebida
          ) ||
          matriculaRecebida <=
            0
        ) {
          throw new ErroMobilidade(
            400,
            "MATRICULA_INVALIDA",
            "Matrícula inválida."
          );
        }

        const matricula =
          await prisma.matricula.findFirst({
            where: {
              id:
                matriculaRecebida,

              instituicaoId,

              alunoId:
                aluno.id,
            },

            select: {
              id: true,
              cursoId: true,
            },
          });

        if (!matricula) {
          throw new ErroMobilidade(
            400,
            "MATRICULA_INVALIDA",
            "Matrícula inválida."
          );
        }

        if (
          oferta.cursos.length >
            0 &&
          (
            matricula.cursoId ===
              null ||
            !oferta.cursos.some(
              (item) =>
                item.cursoId ===
                matricula.cursoId
            )
          )
        ) {
          throw new ErroMobilidade(
            400,
            "CURSO_NAO_ELEGIVEL",
            "O curso da matrícula não está contemplado nesta oferta."
          );
        }

        matriculaId =
          matricula.id;
      }

      const duplicada =
        await prisma.mobilidadeCandidatura.findFirst({
          where: {
            instituicaoId,
            ofertaId,
            alunoId:
              aluno.id,
          },

          select: {
            id: true,
          },
        });

      if (duplicada) {
        throw new ErroMobilidade(
          409,
          "CANDIDATURA_DUPLICADA",
          "O aluno já possui candidatura nesta oferta."
        );
      }
    } else {
      const nome =
        textoOpcional(
          corpo.nomeSnapshot,
          220
        );

      if (!nome) {
        throw new ErroMobilidade(
          400,
          "NOME_OBRIGATORIO",
          "Nome obrigatório."
        );
      }

      const email =
        textoOpcional(
          corpo.emailSnapshot,
          320
        );

      if (
        email &&
        !emailValido(
          email
        )
      ) {
        throw new ErroMobilidade(
          400,
          "EMAIL_INVALIDO",
          "E-mail inválido."
        );
      }

      const pais =
        paisCodigo(
          corpo.paisOrigemCodigo
        );

      if (
        pais === undefined
      ) {
        throw new ErroMobilidade(
          400,
          "PAIS_INVALIDO",
          "País inválido."
        );
      }

      nomeSnapshot =
        nome;

      emailSnapshot =
        email?.toLowerCase() ??
        null;

      telefoneSnapshot =
        textoOpcional(
          corpo.telefoneSnapshot,
          80
        );

      instituicaoOrigemNome =
        textoOpcional(
          corpo.instituicaoOrigemNome,
          250
        );

      paisOrigemCodigo =
        pais;

      if (emailSnapshot) {
        const duplicada =
          await prisma.mobilidadeCandidatura.findFirst({
            where: {
              instituicaoId,
              ofertaId,

              vinculoCandidato:
                MobilidadeVinculoCandidato.ALUNO_EXTERNO,

              emailSnapshot: {
                equals:
                  emailSnapshot,

                mode:
                  "insensitive",
              },
            },

            select: {
              id: true,
            },
          });

        if (duplicada) {
          throw new ErroMobilidade(
            409,
            "CANDIDATURA_DUPLICADA",
            "Já existe uma candidatura externa com este e-mail nesta oferta."
          );
        }
      }
    }

    const agora =
      new Date();

    const enviadaEm =
      status ===
      MobilidadeStatusCandidatura.RASCUNHO
        ? null
        : agora;

    const analisada =
      STATUS_ANALISADOS.has(
        status
      );

    try {
      const candidatura =
        await prisma.mobilidadeCandidatura.create({
          data: {
            instituicaoId,
            ofertaId,

            alunoId,
            matriculaId,

            vinculoCandidato:
              vinculo,

            nomeSnapshot,
            emailSnapshot,
            telefoneSnapshot,

            instituicaoOrigemNome,
            paisOrigemCodigo,

            status,

            motivoStatus:
              textoOpcional(
                corpo.motivoStatus,
                5000
              ),

            enviadaEm,

            analisadaEm:
              analisada
                ? agora
                : null,

            notaFinal,

            classificacao,

            criadoPorId:
              usuario?.id ??
              null,

            analisadoPorId:
              analisada
                ? (
                    usuario?.id ??
                    null
                  )
                : null,
          },

          select: {
            id: true,
          },
        });

      return NextResponse.json(
        {
          ok: true,
          id:
            candidatura.id,
        },
        {
          status: 201,
        }
      );
    } catch (erro) {
      if (
        erroDuplicidade(
          erro
        )
      ) {
        throw new ErroMobilidade(
          409,
          "CANDIDATURA_DUPLICADA",
          "Esta candidatura já existe."
        );
      }

      throw erro;
    }
  } catch (erro) {
    const resposta =
      respostaErroMobilidade(
        erro
      );

    return NextResponse.json(
      resposta.corpo,
      {
        status:
          resposta.status,
      }
    );
  }
}
