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
  prisma,
} from "@/lib/prisma";

import {
  getUserFromToken,
} from "@/lib/server-auth";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

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
    "[biblioteca/etiquetas-lote-global]",
    erro,
  );

  return responder(
    {
      error:
        "N\u00e3o foi poss\u00edvel preparar as etiquetas em lote.",
      codigo:
        "ERRO_INTERNO",
    },
    500,
  );
}

export async function GET() {
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
        "Usu\u00e1rio n\u00e3o autenticado.",
        "NAO_AUTENTICADO",
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.catalogo.ver",
    );

    const exemplares =
      await prisma.bibliotecaExemplar.findMany(
        {
          where: {
            instituicaoId:
              contexto.instituicaoId,

            tipo:
              TipoExemplarBiblioteca.FISICO,

            baixadoEm:
              null,
          },

          orderBy: [
            {
              itemId:
                "asc",
            },
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

            itemId:
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

            localizacaoCompleta:
              true,

            item: {
              select: {
                id:
                  true,

                titulo:
                  true,

                subtitulo:
                  true,

                isbn10:
                  true,

                isbn13:
                  true,

                issn:
                  true,

                doi:
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
              },
            },
          },
        },
      );

    exemplares.sort(
      (
        a,
        b,
      ) => {
        const titulo =
          a.item.titulo.localeCompare(
            b.item.titulo,
            "pt-BR",
            {
              sensitivity:
                "base",
            },
          );

        if (titulo !== 0) {
          return titulo;
        }

        return a.codigoInterno.localeCompare(
          b.codigoInterno,
          "pt-BR",
          {
            sensitivity:
              "base",
          },
        );
      },
    );

    return responder({
      exemplares:
        exemplares.map(
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