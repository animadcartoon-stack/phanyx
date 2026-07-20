import {
  ModalidadeCertificado,
  Prisma,
  TipoVersaoCertificado,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { podeCriarModeloCertificado } from "@/lib/certificados/limites-modelos";

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function normalizarModalidade(
  valor: unknown
): ModalidadeCertificado | null {
  const modalidade = limparTexto(valor || "GERAL").toUpperCase();

  const modalidadesPermitidas = Object.values(
    ModalidadeCertificado
  ) as string[];

  if (!modalidadesPermitidas.includes(modalidade)) {
    return null;
  }

  return modalidade as ModalidadeCertificado;
}

function mensagemLimitePlano(params: {
  plano: string;
  limite: number;
}) {
  const plano = String(params.plano || "ESSENCIAL").toUpperCase();

  if (params.limite === 1) {
    return (
      "O plano Essencial permite somente 1 modelo de certificado ativo. " +
      "Arquive o modelo atual ou altere para um plano superior."
    );
  }

  return (
    `O plano ${plano} permite até ${params.limite} modelos de ` +
    "certificado ativos. Arquive um modelo existente ou altere para " +
    "um plano superior."
  );
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão para gerenciar modelos de certificado." },
        { status: 403 }
      );
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const instituicaoId = Number(user.instituicaoId);

    const instituicao = await prisma.instituicao.findUnique({
      where: {
        id: instituicaoId,
      },
      select: {
        id: true,
        plano: true,
      },
    });

    if (!instituicao) {
      return NextResponse.json(
        { error: "Instituição não encontrada." },
        { status: 404 }
      );
    }

    const [modelos, quantidadeModelosAtivos] = await Promise.all([
      prisma.certificadoModelo.findMany({
        where: {
          instituicaoId,
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
        orderBy: [
          {
            arquivado: "asc",
          },
          {
            padraoGeral: "desc",
          },
          {
            padraoModalidade: "desc",
          },
          {
            atualizadoEm: "desc",
          },
        ],
      }),

      prisma.certificadoModelo.count({
        where: {
          instituicaoId,
          ativo: true,
          arquivado: false,
        },
      }),
    ]);

    const regraPlano = podeCriarModeloCertificado({
      plano: instituicao.plano,
      quantidadeModelosAtivos,
    });

    return NextResponse.json({
      modelos,
      resumo: {
        plano: regraPlano.plano,
        limite: regraPlano.limite,
        utilizados: regraPlano.utilizados,
        restantes: regraPlano.restantes,
        podeCriar: regraPlano.permitido,
      },
    });
  } catch (error: any) {
    console.error("ERRO AO LISTAR MODELOS DE CERTIFICADO:", error);

    return NextResponse.json(
      {
        error: "Erro ao listar modelos de certificado.",
        detalhe:
          process.env.NODE_ENV === "development"
            ? error?.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão para criar modelos de certificado." },
        { status: 403 }
      );
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const instituicaoId = Number(user.instituicaoId);
    const body = await request.json();

    const nome = limparTexto(body.nome);
    const descricao = limparTexto(body.descricao) || null;
    const modalidade = normalizarModalidade(body.modalidade);

    if (!nome) {
      return NextResponse.json(
        { error: "Informe o nome do modelo de certificado." },
        { status: 400 }
      );
    }

    if (nome.length < 3) {
      return NextResponse.json(
        {
          error:
            "O nome do modelo precisa ter pelo menos 3 caracteres.",
        },
        { status: 400 }
      );
    }

    if (nome.length > 120) {
      return NextResponse.json(
        {
          error:
            "O nome do modelo pode ter no máximo 120 caracteres.",
        },
        { status: 400 }
      );
    }

    if (descricao && descricao.length > 500) {
      return NextResponse.json(
        {
          error:
            "A descrição do modelo pode ter no máximo 500 caracteres.",
        },
        { status: 400 }
      );
    }

    if (!modalidade) {
      return NextResponse.json(
        { error: "Modalidade de certificado inválida." },
        { status: 400 }
      );
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: {
        id: instituicaoId,
      },
      select: {
        id: true,
        plano: true,

        certificadoTemplateUrl: true,
        certificadoPreviewUrl: true,
        certificadoTextoPadrao: true,
        certificadoAssinaturaUrl: true,
        certificadoCoordenadorNome: true,
        certificadoCidade: true,

        certificadoModoFundo: true,
        certificadoCorFundoPagina: true,
        certificadoTamanhoPapel: true,
        certificadoOrientacao: true,
        certificadoLarguraBase: true,
        certificadoAlturaBase: true,
      },
    });

    if (!instituicao) {
      return NextResponse.json(
        { error: "Instituição não encontrada." },
        { status: 404 }
      );
    }

    const nomeExistente = await prisma.certificadoModelo.findFirst({
      where: {
        instituicaoId,
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
      return NextResponse.json(
        {
          error:
            "Já existe um modelo ativo com esse nome nesta instituição.",
        },
        { status: 409 }
      );
    }

    const quantidadeModelosAtivos =
      await prisma.certificadoModelo.count({
        where: {
          instituicaoId,
          ativo: true,
          arquivado: false,
        },
      });

    const regraPlano = podeCriarModeloCertificado({
      plano: instituicao.plano,
      quantidadeModelosAtivos,
    });

    if (!regraPlano.permitido) {
      return NextResponse.json(
        {
          error: mensagemLimitePlano({
            plano: regraPlano.plano,
            limite: regraPlano.limite,
          }),
          codigo: "LIMITE_MODELOS_CERTIFICADO",
          resumo: {
            plano: regraPlano.plano,
            limite: regraPlano.limite,
            utilizados: regraPlano.utilizados,
            restantes: regraPlano.restantes,
          },
        },
        { status: 409 }
      );
    }

    const copiarLegadoSolicitado =
      body.copiarLegado === true ||
      body.copiarModeloAtual === true;

    /*
     * O primeiro modelo da instituição copia automaticamente o certificado
     * legado atual, salvo se a requisição enviar copiarLegado: false.
     */
    const copiarLegado =
      body.copiarLegado === false
        ? false
        : copiarLegadoSolicitado || quantidadeModelosAtivos === 0;

    const padraoGeralSolicitado =
      body.padraoGeral === true || quantidadeModelosAtivos === 0;

    const padraoModalidadeSolicitado =
      body.padraoModalidade === true;

    const camposLegados = copiarLegado
      ? await prisma.certificadoCampo.findMany({
          where: {
            instituicaoId,
            certificadoModeloVersaoId: null,
          },
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
        })
      : [];

    const modeloCriado = await prisma.$transaction(async (tx) => {
      if (padraoGeralSolicitado) {
        await tx.certificadoModelo.updateMany({
          where: {
            instituicaoId,
            padraoGeral: true,
          },
          data: {
            padraoGeral: false,
          },
        });
      }

      if (padraoModalidadeSolicitado) {
        await tx.certificadoModelo.updateMany({
          where: {
            instituicaoId,
            modalidade,
            padraoModalidade: true,
          },
          data: {
            padraoModalidade: false,
          },
        });
      }

      const modelo = await tx.certificadoModelo.create({
        data: {
          instituicaoId,
          nome,
          descricao,
          modalidade,

          ativo: true,
          arquivado: false,

          padraoGeral: padraoGeralSolicitado,
          padraoModalidade: padraoModalidadeSolicitado,

          criadoPorId: user.id,

          versoes: {
            create: {
              tipo: TipoVersaoCertificado.RASCUNHO,

              templateUrl: instituicao.certificadoTemplateUrl,
              previewUrl: instituicao.certificadoPreviewUrl,
              textoPadrao: instituicao.certificadoTextoPadrao,
              assinaturaUrl: instituicao.certificadoAssinaturaUrl,
              coordenadorNome:
                instituicao.certificadoCoordenadorNome,
              cidade: instituicao.certificadoCidade,

              modoFundo:
                instituicao.certificadoModoFundo || "modelo",
              corFundoPagina:
                instituicao.certificadoCorFundoPagina || "#ffffff",
              tamanhoPapel:
                instituicao.certificadoTamanhoPapel || "A4",
              orientacao:
                instituicao.certificadoOrientacao || "paisagem",
              larguraBase:
                instituicao.certificadoLarguraBase || 1123,
              alturaBase:
                instituicao.certificadoAlturaBase || 794,
            },
          },
        },
        include: {
          versoes: true,
          _count: {
            select: {
              cursos: true,
            },
          },
        },
      });

      const versaoRascunho = modelo.versoes.find(
        (versao) =>
          versao.tipo === TipoVersaoCertificado.RASCUNHO
      );

      if (!versaoRascunho) {
        throw new Error(
          "Não foi possível criar a versão de rascunho do modelo."
        );
      }

      if (copiarLegado && camposLegados.length > 0) {
        await tx.certificadoCampo.createMany({
          data: camposLegados.map((campo) => ({
            instituicaoId,
            certificadoModeloVersaoId: versaoRascunho.id,

            tipo: campo.tipo,
            x: campo.x,
            y: campo.y,
            largura: campo.largura,
            altura: campo.altura,
            fonte: campo.fonte,
            tamanho: campo.tamanho,
            cor: campo.cor,
            alinhamento: campo.alinhamento,

            dadosJson:
              campo.dadosJson === null
                ? Prisma.JsonNull
                : campo.dadosJson,

            lineHeight: campo.lineHeight,
            marcador: campo.marcador,
            pagina: campo.pagina,
            ordem: campo.ordem,
          })),
        });
      }

      return tx.certificadoModelo.findFirst({
        where: {
          id: modelo.id,
          instituicaoId,
        },
        include: {
          versoes: {
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

    if (!modeloCriado) {
      return NextResponse.json(
        { error: "Não foi possível criar o modelo." },
        { status: 500 }
      );
    }

    const novaQuantidadeModelosAtivos =
      quantidadeModelosAtivos + 1;

    const novoResumo = podeCriarModeloCertificado({
      plano: instituicao.plano,
      quantidadeModelosAtivos: novaQuantidadeModelosAtivos,
    });

    return NextResponse.json(
      {
        mensagem: "Modelo de certificado criado com sucesso.",
        modelo: modeloCriado,
        legadoCopiado: copiarLegado,
        resumo: {
          plano: novoResumo.plano,
          limite: novoResumo.limite,
          utilizados: novoResumo.utilizados,
          restantes: novoResumo.restantes,
          podeCriar: novoResumo.permitido,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("ERRO AO CRIAR MODELO DE CERTIFICADO:", error);

    return NextResponse.json(
      {
        error: "Erro ao criar modelo de certificado.",
        detalhe:
          process.env.NODE_ENV === "development"
            ? error?.message
            : undefined,
      },
      { status: 500 }
    );
  }
}