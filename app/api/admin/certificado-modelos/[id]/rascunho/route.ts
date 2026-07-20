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

class ErroRascunhoCertificado extends Error {
  status: number;

  constructor(mensagem: string, status = 400) {
    super(mensagem);
    this.name = "ErroRascunhoCertificado";
    this.status = status;
  }
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
    throw new ErroRascunhoCertificado(
      "Modelo de certificado inválido.",
      400
    );
  }

  return id;
}

function textoOpcional(valor: unknown) {
  const texto = String(valor ?? "").trim();

  return texto || null;
}

function inteiroPositivo(params: {
  valor: unknown;
  nome: string;
  minimo?: number;
  maximo?: number;
}) {
  const numero = Number(params.valor);
  const minimo = params.minimo ?? 1;
  const maximo = params.maximo ?? 10000;

  if (
    !Number.isInteger(numero) ||
    numero < minimo ||
    numero > maximo
  ) {
    throw new ErroRascunhoCertificado(
      `${params.nome} inválido.`,
      400
    );
  }

  return numero;
}

async function obterUsuarioAutorizado() {
  const user = await getUserFromToken();

  if (!user) {
    throw new ErroRascunhoCertificado(
      "Não autenticado.",
      401
    );
  }

  if (!isAdminLike(user.role)) {
    throw new ErroRascunhoCertificado(
      "Sem permissão para editar modelos de certificado.",
      403
    );
  }

  if (!user.instituicaoId) {
    throw new ErroRascunhoCertificado(
      "Usuário sem instituição vinculada.",
      400
    );
  }

  return user;
}

async function buscarModelo(params: {
  modeloId: number;
  instituicaoId: number;
}) {
  const modelo = await prisma.certificadoModelo.findFirst({
    where: {
      id: params.modeloId,
      instituicaoId: params.instituicaoId,
    },
    include: {
      versoes: {
        where: {
          tipo: TipoVersaoCertificado.RASCUNHO,
        },
        include: {
          _count: {
            select: {
              campos: true,
            },
          },
        },
      },
    },
  });

  if (!modelo) {
    throw new ErroRascunhoCertificado(
      "Modelo de certificado não encontrado.",
      404
    );
  }

  return modelo;
}

function responderErro(error: unknown) {
  if (error instanceof ErroRascunhoCertificado) {
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
    "ERRO NAS CONFIGURAÇÕES DO RASCUNHO:",
    error
  );

  return NextResponse.json(
    {
      error:
        "Erro ao processar as configurações do rascunho.",
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
      modeloId,
      instituicaoId: user.instituicaoId,
    });

    const rascunho = modelo.versoes[0] || null;

    if (!rascunho) {
      throw new ErroRascunhoCertificado(
        "Este modelo não possui uma versão de rascunho.",
        404
      );
    }

    return NextResponse.json({
      modelo: {
        id: modelo.id,
        nome: modelo.nome,
        descricao: modelo.descricao,
        modalidade: modelo.modalidade,
        ativo: modelo.ativo,
        arquivado: modelo.arquivado,
        padraoGeral: modelo.padraoGeral,
        padraoModalidade: modelo.padraoModalidade,
        publicadoEm: modelo.publicadoEm,
      },
      rascunho,
    });
  } catch (error: unknown) {
    return responderErro(error);
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

    const modelo = await buscarModelo({
      modeloId,
      instituicaoId: user.instituicaoId,
    });

    if (modelo.arquivado || !modelo.ativo) {
      throw new ErroRascunhoCertificado(
        "Um modelo arquivado ou inativo não pode ser editado.",
        409
      );
    }

    const dadosAtualizacao: Prisma.CertificadoModeloVersaoUncheckedUpdateInput =
      {};

    if (temPropriedade(body, "templateUrl")) {
      dadosAtualizacao.templateUrl = textoOpcional(
        body.templateUrl
      );
    }

    if (temPropriedade(body, "previewUrl")) {
      dadosAtualizacao.previewUrl = textoOpcional(
        body.previewUrl
      );
    }

    if (temPropriedade(body, "textoPadrao")) {
      dadosAtualizacao.textoPadrao = textoOpcional(
        body.textoPadrao
      );
    }

    if (temPropriedade(body, "assinaturaUrl")) {
      dadosAtualizacao.assinaturaUrl = textoOpcional(
        body.assinaturaUrl
      );
    }

    if (temPropriedade(body, "coordenadorNome")) {
      dadosAtualizacao.coordenadorNome = textoOpcional(
        body.coordenadorNome
      );
    }

    if (temPropriedade(body, "cidade")) {
      dadosAtualizacao.cidade = textoOpcional(
        body.cidade
      );
    }

    if (temPropriedade(body, "modoFundo")) {
      const modoFundo = String(
        body.modoFundo || ""
      ).toLowerCase();

      if (
        modoFundo !== "modelo" &&
        modoFundo !== "phanyx" &&
        modoFundo !== "cor"
      ) {
        throw new ErroRascunhoCertificado(
          "Modo de fundo inválido.",
          400
        );
      }

      dadosAtualizacao.modoFundo = modoFundo;
    }

    if (temPropriedade(body, "corFundoPagina")) {
      const cor = String(
        body.corFundoPagina || ""
      ).trim();

      if (!/^#[0-9a-fA-F]{6}$/.test(cor)) {
        throw new ErroRascunhoCertificado(
          "Cor de fundo inválida.",
          400
        );
      }

      dadosAtualizacao.corFundoPagina = cor;
    }

    if (temPropriedade(body, "tamanhoPapel")) {
      const tamanhoPapel = String(
        body.tamanhoPapel || ""
      ).toUpperCase();

      if (
        tamanhoPapel !== "A5" &&
        tamanhoPapel !== "A4" &&
        tamanhoPapel !== "A3"
      ) {
        throw new ErroRascunhoCertificado(
          "Tamanho de papel inválido.",
          400
        );
      }

      dadosAtualizacao.tamanhoPapel =
        tamanhoPapel;
    }

    if (temPropriedade(body, "orientacao")) {
      const orientacao = String(
        body.orientacao || ""
      ).toLowerCase();

      if (
        orientacao !== "paisagem" &&
        orientacao !== "retrato"
      ) {
        throw new ErroRascunhoCertificado(
          "Orientação do papel inválida.",
          400
        );
      }

      dadosAtualizacao.orientacao =
        orientacao;
    }

    if (temPropriedade(body, "larguraBase")) {
      dadosAtualizacao.larguraBase =
        inteiroPositivo({
          valor: body.larguraBase,
          nome: "Largura-base",
          minimo: 100,
          maximo: 10000,
        });
    }

    if (temPropriedade(body, "alturaBase")) {
      dadosAtualizacao.alturaBase =
        inteiroPositivo({
          valor: body.alturaBase,
          nome: "Altura-base",
          minimo: 100,
          maximo: 10000,
        });
    }

    const resultado = await prisma.$transaction(
      async (tx) => {
        const rascunho =
          await tx.certificadoModeloVersao.upsert({
            where: {
              modeloId_tipo: {
                modeloId,
                tipo: TipoVersaoCertificado.RASCUNHO,
              },
            },

            create: {
              modeloId,
              tipo: TipoVersaoCertificado.RASCUNHO,

              templateUrl: null,
              previewUrl: null,
              textoPadrao: null,
              assinaturaUrl: null,
              coordenadorNome: null,
              cidade: null,

              modoFundo: "modelo",
              corFundoPagina: "#ffffff",
              tamanhoPapel: "A4",
              orientacao: "paisagem",
              larguraBase: 1123,
              alturaBase: 794,

              ...(dadosAtualizacao as any),
            },

            update: dadosAtualizacao,
            include: {
              _count: {
                select: {
                  campos: true,
                },
              },
            },
          });

        await tx.certificadoModelo.update({
          where: {
            id: modeloId,
          },
          data: {
            atualizadoEm: new Date(),
          },
        });

        return rascunho;
      }
    );

    return NextResponse.json({
      mensagem:
        "Configurações do rascunho salvas com sucesso.",
      rascunho: resultado,
    });
  } catch (error: unknown) {
    return responderErro(error);
  }
}