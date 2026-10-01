import {
  NextResponse,
} from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";

import {
  prisma,
} from "@/lib/prisma";

import {
  resolverLogoDocumentoInstituicao,
} from "@/lib/documentos/resolver-logo-documento";

import {
  getUserFromToken,
} from "@/lib/server-auth";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

type ContextoRota = {
  params: {
    exemplarId: string;
  };
};

function responder(
  corpo: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(
    corpo,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}

function falhar(
  status: number,
  mensagem: string,
  codigo: string,
): never {
  throw new ErroBiblioteca(
    status,
    mensagem,
    codigo,
  );
}

function responderErro(
  erro: unknown,
) {
  if (
    erro instanceof
      ErroBiblioteca
  ) {
    const resposta =
      respostaErroBiblioteca(
        erro,
      );

    return responder(
      resposta.corpo,
      resposta.status,
    );
  }

  console.error(
    "[biblioteca/exemplar/etiqueta]",
    erro,
  );

  return responder(
    {
      error:
        "Não foi possível preparar a etiqueta do exemplar.",
      codigo:
        "ERRO_INTERNO",
    },
    500,
  );
}

export async function GET(
  _request: Request,
  {
    params,
  }: ContextoRota,
) {
  try {
    const usuario =
      await getUserFromToken();

    const contexto =
      await obterContextoBiblioteca(
        usuario,
      );

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO",
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.catalogo.ver",
    );

    const exemplarId =
      Number(
        params.exemplarId,
      );

    if (
      !Number.isInteger(
        exemplarId,
      ) ||
      exemplarId <= 0
    ) {
      falhar(
        400,
        "Exemplar inválido.",
        "EXEMPLAR_INVALIDO",
      );
    }

    const [
      exemplar,
      instituicao,
      configuracaoInstituicao,
    ] =
      await Promise.all([
        prisma.bibliotecaExemplar.findFirst({
          where: {
            id:
              exemplarId,
            instituicaoId:
              contexto.instituicaoId,
          },

          select: {
            id: true,
            tipo: true,
            codigoInterno:
              true,
            codigoBarras:
              true,
            numeroTombo:
              true,
            patrimonio:
              true,
            unidadeSnapshot:
              true,
            setor:
              true,
            sala:
              true,
            corredor:
              true,
            estante:
              true,
            prateleira:
              true,

            item: {
              select: {
                id:
                  true,
                titulo:
                  true,
                codigoChamada:
                  true,
                cdd:
                  true,
                cdu:
                  true,
                codigoCutter:
                  true,
                sistemaClassificacao:
                  true,
              },
            },
          },
        }),

        prisma.instituicao.findUnique({
          where: {
            id:
              contexto.instituicaoId,
          },

          select: {
            id:
              true,
            nome:
              true,
          },
        }),

        prisma.configuracaoInstituicao.findUnique({
          where: {
            instituicaoId:
              contexto.instituicaoId,
          },

          select: {
            nomeFantasia:
              true,
            razaoSocial:
              true,
            nomeUnidadePrincipal:
              true,
            logoUrl:
              true,
          },
        }),
      ]);

    if (!exemplar) {
      falhar(
        404,
        "Exemplar não encontrado nesta biblioteca.",
        "EXEMPLAR_NAO_ENCONTRADO",
      );
    }

    const nomeInstituicao =
      configuracaoInstituicao
        ?.nomeFantasia ||
      configuracaoInstituicao
        ?.razaoSocial ||
      instituicao?.nome ||
      "Biblioteca";

    const unidade =
      exemplar.unidadeSnapshot ||
      configuracaoInstituicao
        ?.nomeUnidadePrincipal ||
      null;

    /*
     * Usa a mesma infraestrutura oficial de logos
     * j? utilizada pelos documentos do PHANYX.
     *
     * Etiquetas possuem fundo branco, por isso
     * priorizamos a vers?o FUNDO_CLARO.
     */
    const logoResolvida =
      await resolverLogoDocumentoInstituicao({
        instituicaoId:
          contexto.instituicaoId,

        modoLogo:
          "FUNDO_CLARO",

        estiloDocumento:
          "INSTITUCIONAL",

        fallbackLogoUrl:
          configuracaoInstituicao
            ?.logoUrl ||
          null,
      });

    const valorCodigoBarras =
      exemplar.codigoBarras ||
      exemplar.codigoInterno;

    const codigoChamada =
      exemplar.item
        .codigoChamada ||
      [
        exemplar.item.cdd ||
          exemplar.item.cdu,
        exemplar.item
          .codigoCutter,
      ]
        .filter(Boolean)
        .join(" ") ||
      null;

    return responder({
      ok:
        true,

      etiqueta: {
        exemplarId:
          exemplar.id,

        itemId:
          exemplar.item.id,

        instituicao: {
          nome:
            nomeInstituicao,
          unidade,

          logoUrl:
            logoResolvida.logoUrl,

          logoTipo:
            logoResolvida.tipoSelecionado,
        },

        item: {
          titulo:
            exemplar.item.titulo,

          sistemaClassificacao:
            exemplar.item
              .sistemaClassificacao,

          cdd:
            exemplar.item.cdd,

          cdu:
            exemplar.item.cdu,

          cutter:
            exemplar.item
              .codigoCutter,

          codigoChamada,
        },

        exemplar: {
          tipo:
            exemplar.tipo,

          codigoInterno:
            exemplar.codigoInterno,

          codigoBarras:
            exemplar.codigoBarras,

          valorCodigoBarras,

          numeroTombo:
            exemplar.numeroTombo,

          patrimonio:
            exemplar.patrimonio,

          setor:
            exemplar.setor,

          sala:
            exemplar.sala,

          corredor:
            exemplar.corredor,

          estante:
            exemplar.estante,

          prateleira:
            exemplar.prateleira,
        },
      },
    });
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}