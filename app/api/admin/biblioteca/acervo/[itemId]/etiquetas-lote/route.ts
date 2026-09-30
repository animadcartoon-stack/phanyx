import {
  TipoExemplarBiblioteca,
} from "@prisma/client";

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
  resolverLogoDocumentoInstituicao,
} from "@/lib/documentos/resolver-logo-documento";

import {
  prisma,
} from "@/lib/prisma";

import {
  getUserFromToken,
} from "@/lib/server-auth";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

type ContextoRota = {
  params: {
    itemId: string;
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
    "[biblioteca/etiquetas-lote]",
    erro,
  );

  return responder(
    {
      error:
        "Não foi possível preparar as etiquetas em lote.",
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

    const itemId =
      Number(
        params.itemId,
      );

    if (
      !Number.isInteger(
        itemId,
      ) ||
      itemId <= 0
    ) {
      falhar(
        400,
        "Item inválido.",
        "ITEM_INVALIDO",
      );
    }

    const [
      item,
      instituicao,
      configuracao,
    ] =
      await Promise.all([
        prisma.bibliotecaItem.findFirst({
          where: {
            id:
              itemId,

            instituicaoId:
              contexto.instituicaoId,
          },

          select: {
            id:
              true,

            titulo:
              true,

            sistemaClassificacao:
              true,

            codigoChamada:
              true,

            cdd:
              true,

            cdu:
              true,

            codigoCutter:
              true,

            exemplares: {
              where: {
                tipo:
                  TipoExemplarBiblioteca.FISICO,

                baixadoEm:
                  null,
              },

              orderBy: [
                {
                  codigoInterno:
                    "asc",
                },
                {
                  id:
                    "asc",
                },
              ],

              select: {
                id:
                  true,

                status:
                  true,

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

    if (!item) {
      falhar(
        404,
        "Item não encontrado nesta biblioteca.",
        "ITEM_NAO_ENCONTRADO",
      );
    }

    const logo =
      await resolverLogoDocumentoInstituicao({
        instituicaoId:
          contexto.instituicaoId,

        modoLogo:
          "FUNDO_CLARO",

        estiloDocumento:
          "INSTITUCIONAL",

        fallbackLogoUrl:
          configuracao
            ?.logoUrl ||
          null,
      });

    const nomeInstituicao =
      configuracao
        ?.nomeFantasia ||
      configuracao
        ?.razaoSocial ||
      instituicao?.nome ||
      "Biblioteca";

    const codigoChamada =
      item.codigoChamada ||
      [
        item.cdd ||
          item.cdu,
        item.codigoCutter,
      ]
        .filter(Boolean)
        .join(" ") ||
      null;

    return responder({
      ok:
        true,

      instituicao: {
        nome:
          nomeInstituicao,

        unidade:
          configuracao
            ?.nomeUnidadePrincipal ||
          null,

        logoUrl:
          logo.logoUrl,

        logoTipo:
          logo.tipoSelecionado,
      },

      item: {
        id:
          item.id,

        titulo:
          item.titulo,

        sistemaClassificacao:
          item.sistemaClassificacao,

        codigoChamada,

        cdd:
          item.cdd,

        cdu:
          item.cdu,

        cutter:
          item.codigoCutter,
      },

      exemplares:
        item.exemplares.map(
          (exemplar) => ({
            ...exemplar,

            valorCodigoBarras:
              exemplar.codigoBarras ||
              exemplar.codigoInterno,
          }),
        ),
    });
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}