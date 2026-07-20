import {
  Prisma,
  TipoVersaoCertificado,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";

export const runtime = "nodejs";

type ContextoRota = {
  params: {
    id: string;
  };
};

class ErroPublicacaoCertificado extends Error {
  status: number;

  constructor(mensagem: string, status = 400) {
    super(mensagem);
    this.name = "ErroPublicacaoCertificado";
    this.status = status;
  }
}

function lerModeloId(valor: unknown) {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ErroPublicacaoCertificado(
      "Modelo de certificado inválido.",
      400
    );
  }

  return id;
}

async function obterUsuarioAutorizado() {
  const user = await getUserFromToken();

  if (!user) {
    throw new ErroPublicacaoCertificado(
      "Não autenticado.",
      401
    );
  }

  if (!isAdminLike(user.role)) {
    throw new ErroPublicacaoCertificado(
      "Sem permissão para publicar modelos de certificado.",
      403
    );
  }

  if (!user.instituicaoId) {
    throw new ErroPublicacaoCertificado(
      "Usuário sem instituição vinculada.",
      400
    );
  }

  return user;
}

function responderErro(error: unknown) {
  if (error instanceof ErroPublicacaoCertificado) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: error.status,
      }
    );
  }

  console.error(
    "ERRO AO PUBLICAR MODELO DE CERTIFICADO:",
    error
  );

  return NextResponse.json(
    {
      error: "Erro ao publicar modelo de certificado.",
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

export async function POST(
  _request: NextRequest,
  contexto: ContextoRota
) {
  try {
    const user = await obterUsuarioAutorizado();
    const modeloId = lerModeloId(contexto.params.id);

    const modeloAtual =
      await prisma.certificadoModelo.findFirst({
        where: {
          id: modeloId,
          instituicaoId: user.instituicaoId,
        },
        include: {
          versoes: {
            include: {
              campos: {
                orderBy: [
                  {
                    pagina: "asc",
                  },
                  {
                    ordem: "asc",
                  },
                  {
                    id: "asc",
                  },
                ],
              },
            },
          },
        },
      });

    if (!modeloAtual) {
      throw new ErroPublicacaoCertificado(
        "Modelo de certificado não encontrado.",
        404
      );
    }

    if (modeloAtual.arquivado || !modeloAtual.ativo) {
      throw new ErroPublicacaoCertificado(
        "Um modelo arquivado ou inativo não pode ser publicado.",
        409
      );
    }

    const rascunho = modeloAtual.versoes.find(
      (versao) =>
        versao.tipo === TipoVersaoCertificado.RASCUNHO
    );

    if (!rascunho) {
      throw new ErroPublicacaoCertificado(
        "Este modelo não possui uma versão de rascunho.",
        404
      );
    }

    if (rascunho.campos.length === 0) {
      throw new ErroPublicacaoCertificado(
        "O rascunho está vazio. Adicione elementos antes de publicar.",
        409
      );
    }

    const resultado = await prisma.$transaction(
      async (tx) => {
        /*
         * Cria a versão PUBLICADO na primeira publicação
         * ou atualiza suas configurações nas publicações seguintes.
         */
        const versaoPublicada =
          await tx.certificadoModeloVersao.upsert({
            where: {
              modeloId_tipo: {
                modeloId,
                tipo: TipoVersaoCertificado.PUBLICADO,
              },
            },

            create: {
              modeloId,
              tipo: TipoVersaoCertificado.PUBLICADO,

              templateUrl: rascunho.templateUrl,
              previewUrl: rascunho.previewUrl,
              textoPadrao: rascunho.textoPadrao,
              assinaturaUrl: rascunho.assinaturaUrl,
              coordenadorNome: rascunho.coordenadorNome,
              cidade: rascunho.cidade,

              modoFundo: rascunho.modoFundo,
              corFundoPagina: rascunho.corFundoPagina,
              tamanhoPapel: rascunho.tamanhoPapel,
              orientacao: rascunho.orientacao,
              larguraBase: rascunho.larguraBase,
              alturaBase: rascunho.alturaBase,
            },

            update: {
              templateUrl: rascunho.templateUrl,
              previewUrl: rascunho.previewUrl,
              textoPadrao: rascunho.textoPadrao,
              assinaturaUrl: rascunho.assinaturaUrl,
              coordenadorNome: rascunho.coordenadorNome,
              cidade: rascunho.cidade,

              modoFundo: rascunho.modoFundo,
              corFundoPagina: rascunho.corFundoPagina,
              tamanhoPapel: rascunho.tamanhoPapel,
              orientacao: rascunho.orientacao,
              larguraBase: rascunho.larguraBase,
              alturaBase: rascunho.alturaBase,
            },
          });

        /*
         * Substitui somente os elementos da versão publicada.
         * O rascunho permanece intacto.
         */
        await tx.certificadoCampo.deleteMany({
          where: {
            instituicaoId: user.instituicaoId,
            certificadoModeloVersaoId:
              versaoPublicada.id,
          },
        });

        await tx.certificadoCampo.createMany({
          data: rascunho.campos.map((campo) => ({
            instituicaoId: user.instituicaoId,
            certificadoModeloVersaoId:
              versaoPublicada.id,

            tipo: campo.tipo,
            x: campo.x,
            y: campo.y,
            largura: campo.largura,
            altura: campo.altura,

            fonte: campo.fonte,
            tamanho: campo.tamanho,
            cor: campo.cor,
            alinhamento: campo.alinhamento,

            pagina: campo.pagina,
            ordem: campo.ordem,
            lineHeight: campo.lineHeight,
            marcador: campo.marcador,

            dadosJson:
              campo.dadosJson === null
                ? Prisma.JsonNull
                : campo.dadosJson,
          })),
        });

        const agora = new Date();

        await tx.certificadoModelo.update({
          where: {
            id: modeloId,
          },
          data: {
            publicadoEm: agora,
            publicadoPorId: user.id,
          },
        });

        const modeloPublicado =
          await tx.certificadoModelo.findFirst({
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

        if (!modeloPublicado) {
          throw new Error(
            "O modelo desapareceu após a publicação."
          );
        }

        return {
          modelo: modeloPublicado,
          versaoPublicadaId: versaoPublicada.id,
          totalCamposPublicados:
            rascunho.campos.length,
        };
      }
    );

    return NextResponse.json({
      mensagem:
        "Modelo de certificado publicado com sucesso.",
      modelo: resultado.modelo,
      publicacao: {
        versaoPublicadaId:
          resultado.versaoPublicadaId,
        totalCampos:
          resultado.totalCamposPublicados,
      },
    });
  } catch (error: unknown) {
    return responderErro(error);
  }
}