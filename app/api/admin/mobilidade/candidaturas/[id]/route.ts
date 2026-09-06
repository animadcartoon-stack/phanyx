import {
  MobilidadeStatusCandidatura,
  MobilidadeStatusDocumento,
  MobilidadeVinculoCandidato,
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

function idValido(
  valor: string
) {
  const id = Number(valor);

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null;
}

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

  return Number.isInteger(
    numero
  ) &&
    numero >= minimo
    ? numero
    : undefined;
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

  return Number.isFinite(
    numero
  )
    ? numero
    : undefined;
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

  return /^[A-Z]{2}$/.test(
    codigo
  )
    ? codigo
    : undefined;
}

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
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

    const id =
      idValido(
        params.id
      );

    if (!id) {
      throw new ErroMobilidade(
        400,
        "ID_INVALIDO",
        "ID inválido."
      );
    }

    const candidatura =
      await prisma.mobilidadeCandidatura.findFirst({
        where: {
          id,
          instituicaoId,
        },

        include: {
          oferta: {
            include: {
              programa: {
                include: {
                  instituicaoParceira:
                    true,

                  convenio:
                    true,
                },
              },

              cursos: {
                include: {
                  curso:
                    true,
                },
              },
            },
          },

          aluno: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },

          matricula: {
            include: {
              curso: true,
              polo: true,
              turmaPrincipal:
                true,
            },
          },

          documentos: {
            orderBy: [
              {
                obrigatorio:
                  "desc",
              },
              {
                titulo:
                  "asc",
              },
            ],
          },

          criadoPor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },

          analisadoPor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

    if (!candidatura) {
      throw new ErroMobilidade(
        404,
        "CANDIDATURA_NAO_ENCONTRADA",
        "Candidatura não encontrada."
      );
    }

    const documentosObrigatorios =
      candidatura.documentos.filter(
        (documento) =>
          documento.obrigatorio
      );

    const documentosPendentes =
      documentosObrigatorios.filter(
        (documento) =>
          documento.status !==
          MobilidadeStatusDocumento.APROVADO
      ).length;

    return NextResponse.json(
      {
        ok: true,

        candidatura: {
          ...candidatura,

          notaFinal:
            candidatura.notaFinal ===
            null
              ? null
              : Number(
                  candidatura.notaFinal
                ),

          documentosResumo: {
            total:
              candidatura
                .documentos
                .length,

            obrigatorios:
              documentosObrigatorios.length,

            pendentes:
              documentosPendentes,

            aprovados:
              candidatura.documentos.filter(
                (documento) =>
                  documento.status ===
                  MobilidadeStatusDocumento.APROVADO
              ).length,
          },
        },
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

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirGerenciamentoMobilidade(
        usuario,
        "mobilidade.candidaturas.gerenciar"
      );

    const id =
      idValido(
        params.id
      );

    if (!id) {
      throw new ErroMobilidade(
        400,
        "ID_INVALIDO",
        "ID inválido."
      );
    }

    const atual =
      await prisma.mobilidadeCandidatura.findFirst({
        where: {
          id,
          instituicaoId,
        },

        include: {
          oferta: {
            select: {
              id: true,

              cursos: {
                select: {
                  cursoId: true,
                },
              },
            },
          },
        },
      });

    if (!atual) {
      throw new ErroMobilidade(
        404,
        "CANDIDATURA_NAO_ENCONTRADA",
        "Candidatura não encontrada."
      );
    }

    const corpo =
      (await req.json()) as Record<
        string,
        unknown
      >;

    const status =
      corpo.status ===
        undefined
        ? atual.status
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

    const dados: {
      status: MobilidadeStatusCandidatura;
      motivoStatus: string | null;
      notaFinal: number | null;
      classificacao: number | null;
      enviadaEm?: Date;
      analisadaEm?: Date;
      analisadoPorId?: number | null;

      matriculaId?: number | null;

      nomeSnapshot?: string;
      emailSnapshot?: string | null;
      telefoneSnapshot?: string | null;
      instituicaoOrigemNome?: string | null;
      paisOrigemCodigo?: string | null;
    } = {
      status,

      motivoStatus:
        textoOpcional(
          corpo.motivoStatus,
          5000
        ),

      notaFinal,
      classificacao,
    };

    const agora =
      new Date();

    if (
      status !==
        MobilidadeStatusCandidatura.RASCUNHO &&
      atual.enviadaEm ===
        null
    ) {
      dados.enviadaEm =
        agora;
    }

    if (
      STATUS_ANALISADOS.has(
        status
      )
    ) {
      dados.analisadaEm =
        agora;

      dados.analisadoPorId =
        usuario?.id ??
        null;
    }

    if (
      atual.vinculoCandidato ===
      MobilidadeVinculoCandidato.ALUNO_PHANYX
    ) {
      if (!atual.alunoId) {
        throw new ErroMobilidade(
          400,
          "ALUNO_INVALIDO",
          "A candidatura não possui aluno vinculado."
        );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          corpo,
          "matriculaId"
        )
      ) {
        if (
          corpo.matriculaId ===
            null ||
          corpo.matriculaId ===
            undefined ||
          corpo.matriculaId ===
            ""
        ) {
          dados.matriculaId =
            null;
        } else {
          const matriculaId =
            Number(
              corpo.matriculaId
            );

          if (
            !Number.isInteger(
              matriculaId
            ) ||
            matriculaId <= 0
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
                  matriculaId,

                instituicaoId,

                alunoId:
                  atual.alunoId,
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
            atual.oferta.cursos
              .length > 0 &&
            (
              matricula.cursoId ===
                null ||
              !atual.oferta.cursos.some(
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

          dados.matriculaId =
            matricula.id;
        }
      }
    } else {
      if (
        Object.prototype.hasOwnProperty.call(
          corpo,
          "nomeSnapshot"
        )
      ) {
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

        dados.nomeSnapshot =
          nome;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          corpo,
          "emailSnapshot"
        )
      ) {
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

        if (email) {
          const duplicada =
            await prisma.mobilidadeCandidatura.findFirst({
              where: {
                instituicaoId,

                ofertaId:
                  atual.ofertaId,

                id: {
                  not: id,
                },

                vinculoCandidato:
                  MobilidadeVinculoCandidato.ALUNO_EXTERNO,

                emailSnapshot: {
                  equals:
                    email,

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
              "Já existe candidatura com este e-mail nesta oferta."
            );
          }
        }

        dados.emailSnapshot =
          email?.toLowerCase() ??
          null;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          corpo,
          "telefoneSnapshot"
        )
      ) {
        dados.telefoneSnapshot =
          textoOpcional(
            corpo.telefoneSnapshot,
            80
          );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          corpo,
          "instituicaoOrigemNome"
        )
      ) {
        dados.instituicaoOrigemNome =
          textoOpcional(
            corpo.instituicaoOrigemNome,
            250
          );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          corpo,
          "paisOrigemCodigo"
        )
      ) {
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

        dados.paisOrigemCodigo =
          pais;
      }
    }

    await prisma.mobilidadeCandidatura.update({
      where: {
        id,
      },

      data:
        dados,
    });

    return NextResponse.json({
      ok: true,
    });
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
