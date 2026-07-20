import {
  ModalidadeCertificado,
  Prisma,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import { podeCriarModeloCertificado } from "@/lib/certificados/limites-modelos";

class ErroModeloCertificado extends Error {
  status: number;

  constructor(mensagem: string, status = 400) {
    super(mensagem);
    this.name = "ErroModeloCertificado";
    this.status = status;
  }
}

type ContextoRota = {
  params: {
    id: string;
  };
};

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function temPropriedade(
  objeto: Record<string, unknown>,
  propriedade: string
) {
  return Object.prototype.hasOwnProperty.call(
    objeto,
    propriedade
  );
}

function lerModeloId(valor: unknown) {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ErroModeloCertificado(
      "Modelo de certificado inválido.",
      400
    );
  }

  return id;
}

function normalizarModalidade(
  valor: unknown
): ModalidadeCertificado {
  const modalidade = limparTexto(valor).toUpperCase();

  const modalidadesPermitidas = Object.values(
    ModalidadeCertificado
  ) as string[];

  if (!modalidadesPermitidas.includes(modalidade)) {
    throw new ErroModeloCertificado(
      "Modalidade de certificado inválida.",
      400
    );
  }

  return modalidade as ModalidadeCertificado;
}

async function obterUsuarioAutorizado() {
  const user = await getUserFromToken();

  if (!user) {
    throw new ErroModeloCertificado(
      "Não autenticado.",
      401
    );
  }

  if (!isAdminLike(user.role)) {
    throw new ErroModeloCertificado(
      "Sem permissão para gerenciar modelos de certificado.",
      403
    );
  }

  if (!user.instituicaoId) {
    throw new ErroModeloCertificado(
      "Usuário sem instituição vinculada.",
      400
    );
  }

  return user;
}

async function buscarModelo(params: {
  id: number;
  instituicaoId: number;
}) {
  const modelo = await prisma.certificadoModelo.findFirst({
    where: {
      id: params.id,
      instituicaoId: params.instituicaoId,
    },
    include: {
      versoes: {
        orderBy: {
          tipo: "asc",
        },
        include: {
          _count: {
            select: {
              campos: true,
            },
          },
        },
      },
      _count: {
        select: {
          cursos: true,
        },
      },
    },
  });

  if (!modelo) {
    throw new ErroModeloCertificado(
      "Modelo de certificado não encontrado.",
      404
    );
  }

  return modelo;
}

function responderErro(
  error: unknown,
  mensagemPadrao: string,
  identificadorLog: string
) {
  if (error instanceof ErroModeloCertificado) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: error.status,
      }
    );
  }

  console.error(identificadorLog, error);

  return NextResponse.json(
    {
      error: mensagemPadrao,
      detalhe:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    },
    {
      status: 500,
    }
  );
}

export async function GET(
  _request: NextRequest,
  contexto: ContextoRota
) {
  try {
    const user = await obterUsuarioAutorizado();
    const modeloId = lerModeloId(contexto.params.id);

    const modelo = await buscarModelo({
      id: modeloId,
      instituicaoId: user.instituicaoId,
    });

    return NextResponse.json({
      modelo,
    });
  } catch (error: unknown) {
    return responderErro(
      error,
      "Erro ao buscar modelo de certificado.",
      "ERRO AO BUSCAR MODELO DE CERTIFICADO:"
    );
  }
}

export async function PATCH(
  request: NextRequest,
  contexto: ContextoRota
) {
  try {
    const user = await obterUsuarioAutorizado();
    const modeloId = lerModeloId(contexto.params.id);

    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const modeloAtual = await buscarModelo({
      id: modeloId,
      instituicaoId: user.instituicaoId,
    });

    const acao = limparTexto(body.acao).toUpperCase();

    const arquivarSolicitado =
      acao === "ARQUIVAR" || body.arquivado === true;

    const restaurarSolicitado =
      acao === "RESTAURAR" || body.arquivado === false;

    if (arquivarSolicitado && restaurarSolicitado) {
      throw new ErroModeloCertificado(
        "Não é possível arquivar e restaurar o modelo ao mesmo tempo.",
        400
      );
    }

    if (
      arquivarSolicitado &&
      modeloAtual._count.cursos > 0
    ) {
      throw new ErroModeloCertificado(
        `Este modelo está vinculado a ${modeloAtual._count.cursos} curso(s). ` +
          "Desvincule ou substitua o modelo nesses cursos antes de arquivá-lo.",
        409
      );
    }

    if (
      restaurarSolicitado &&
      modeloAtual.arquivado
    ) {
      const instituicao =
        await prisma.instituicao.findUnique({
          where: {
            id: user.instituicaoId,
          },
          select: {
            plano: true,
          },
        });

      if (!instituicao) {
        throw new ErroModeloCertificado(
          "Instituição não encontrada.",
          404
        );
      }

      const quantidadeAtivos =
        await prisma.certificadoModelo.count({
          where: {
            instituicaoId: user.instituicaoId,
            ativo: true,
            arquivado: false,
          },
        });

      const regraPlano = podeCriarModeloCertificado({
        plano: instituicao.plano,
        quantidadeModelosAtivos: quantidadeAtivos,
      });

      if (!regraPlano.permitido) {
        throw new ErroModeloCertificado(
          `O plano ${regraPlano.plano} permite até ` +
            `${regraPlano.limite} modelo(s) de certificado ativo(s). ` +
            "Arquive outro modelo ou altere para um plano superior.",
          409
        );
      }
    }

    const dadosAtualizacao: Prisma.CertificadoModeloUncheckedUpdateInput =
      {};

    if (temPropriedade(body, "nome")) {
      const nome = limparTexto(body.nome);

      if (nome.length < 3) {
        throw new ErroModeloCertificado(
          "O nome do modelo precisa ter pelo menos 3 caracteres.",
          400
        );
      }

      if (nome.length > 120) {
        throw new ErroModeloCertificado(
          "O nome do modelo pode ter no máximo 120 caracteres.",
          400
        );
      }

      const nomeExistente =
        await prisma.certificadoModelo.findFirst({
          where: {
            instituicaoId: user.instituicaoId,
            id: {
              not: modeloId,
            },
            arquivado: false,
            nome: {
              equals: nome,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
          },
        });

      if (nomeExistente) {
        throw new ErroModeloCertificado(
          "Já existe outro modelo ativo com esse nome.",
          409
        );
      }

      dadosAtualizacao.nome = nome;
    }

    if (temPropriedade(body, "descricao")) {
      const descricao = limparTexto(body.descricao);

      if (descricao.length > 500) {
        throw new ErroModeloCertificado(
          "A descrição pode ter no máximo 500 caracteres.",
          400
        );
      }

      dadosAtualizacao.descricao =
        descricao || null;
    }

    const modalidadeFinal = temPropriedade(
      body,
      "modalidade"
    )
      ? normalizarModalidade(body.modalidade)
      : modeloAtual.modalidade;

    if (temPropriedade(body, "modalidade")) {
      dadosAtualizacao.modalidade =
        modalidadeFinal;
    }

    const arquivadoFinal = arquivarSolicitado
      ? true
      : restaurarSolicitado
        ? false
        : modeloAtual.arquivado;

    const ativoFinal = arquivarSolicitado
  ? false
  : restaurarSolicitado
    ? true
    : modeloAtual.ativo;

    const padraoGeralFinal = arquivadoFinal
      ? false
      : typeof body.padraoGeral === "boolean"
        ? body.padraoGeral
        : modeloAtual.padraoGeral;

    const padraoModalidadeFinal = arquivadoFinal
      ? false
      : typeof body.padraoModalidade === "boolean"
        ? body.padraoModalidade
        : modeloAtual.padraoModalidade;

    dadosAtualizacao.arquivado =
      arquivadoFinal;

    dadosAtualizacao.ativo =
      ativoFinal;

    dadosAtualizacao.padraoGeral =
      padraoGeralFinal;

    dadosAtualizacao.padraoModalidade =
      padraoModalidadeFinal;

    const modeloAtualizado =
      await prisma.$transaction(async (tx) => {
        if (padraoGeralFinal) {
          await tx.certificadoModelo.updateMany({
            where: {
              instituicaoId: user.instituicaoId,
              id: {
                not: modeloId,
              },
              padraoGeral: true,
            },
            data: {
              padraoGeral: false,
            },
          });
        }

        if (padraoModalidadeFinal) {
          await tx.certificadoModelo.updateMany({
            where: {
              instituicaoId: user.instituicaoId,
              id: {
                not: modeloId,
              },
              modalidade: modalidadeFinal,
              padraoModalidade: true,
            },
            data: {
              padraoModalidade: false,
            },
          });
        }

        await tx.certificadoModelo.update({
          where: {
            id: modeloId,
          },
          data: dadosAtualizacao,
        });

        return tx.certificadoModelo.findFirst({
          where: {
            id: modeloId,
            instituicaoId: user.instituicaoId,
          },
          include: {
            versoes: {
              orderBy: {
                tipo: "asc",
              },
              include: {
                _count: {
                  select: {
                    campos: true,
                  },
                },
              },
            },
            _count: {
              select: {
                cursos: true,
              },
            },
          },
        });
      });

    if (!modeloAtualizado) {
      throw new ErroModeloCertificado(
        "Não foi possível atualizar o modelo.",
        500
      );
    }

    return NextResponse.json({
      mensagem: arquivarSolicitado
        ? "Modelo arquivado com sucesso."
        : restaurarSolicitado
          ? "Modelo restaurado com sucesso."
          : "Modelo atualizado com sucesso.",
      modelo: modeloAtualizado,
    });
  } catch (error: unknown) {
    return responderErro(
      error,
      "Erro ao atualizar modelo de certificado.",
      "ERRO AO ATUALIZAR MODELO DE CERTIFICADO:"
    );
  }
}

/*
 * DELETE não apaga fisicamente o modelo.
 * Ele apenas arquiva, preservando versões e histórico.
 */
export async function DELETE(
  _request: NextRequest,
  contexto: ContextoRota
) {
  try {
    const user = await obterUsuarioAutorizado();
    const modeloId = lerModeloId(contexto.params.id);

    const modeloAtual = await buscarModelo({
      id: modeloId,
      instituicaoId: user.instituicaoId,
    });

    if (modeloAtual.arquivado) {
      return NextResponse.json({
        mensagem: "O modelo já está arquivado.",
        modelo: modeloAtual,
      });
    }

    if (modeloAtual._count.cursos > 0) {
      throw new ErroModeloCertificado(
        `Este modelo está vinculado a ${modeloAtual._count.cursos} curso(s). ` +
          "Desvincule ou substitua o modelo antes de arquivá-lo.",
        409
      );
    }

    const modeloArquivado =
      await prisma.certificadoModelo.update({
        where: {
          id: modeloId,
        },
        data: {
          ativo: false,
          arquivado: true,
          padraoGeral: false,
          padraoModalidade: false,
        },
        include: {
          versoes: {
            orderBy: {
              tipo: "asc",
            },
            include: {
              _count: {
                select: {
                  campos: true,
                },
              },
            },
          },
          _count: {
            select: {
              cursos: true,
            },
          },
        },
      });

    return NextResponse.json({
      mensagem: "Modelo arquivado com sucesso.",
      modelo: modeloArquivado,
    });
  } catch (error: unknown) {
    return responderErro(
      error,
      "Erro ao arquivar modelo de certificado.",
      "ERRO AO ARQUIVAR MODELO DE CERTIFICADO:"
    );
  }
}