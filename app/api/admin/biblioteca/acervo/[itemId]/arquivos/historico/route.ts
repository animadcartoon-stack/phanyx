import {
  StatusArquivoBiblioteca,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
  params: {
    itemId: string;
  };
};

function falhar(
  status: number,
  mensagem: string,
  codigo: string,
  detalhes?: Record<string, unknown>
): never {
  throw new ErroBiblioteca(
    status,
    mensagem,
    codigo,
    detalhes
  );
}

function obterItemId(
  params: ContextoRota["params"]
) {
  const itemId =
    Number(params.itemId);

  if (
    !Number.isInteger(itemId) ||
    itemId <= 0
  ) {
    falhar(
      400,
      "O identificador do item é inválido.",
      "ITEM_ID_INVALIDO"
    );
  }

  return itemId;
}

function responderErro(
  erro: unknown
) {
  const resposta =
    respostaErroBiblioteca(
      erro
    );

  return NextResponse.json(
    resposta.corpo,
    {
      status:
        resposta.status,

      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    }
  );
}

export async function GET(
  _request: NextRequest,
  { params }: ContextoRota
) {
  try {
    const usuario =
      await getUserFromToken();

    const contexto =
      await obterContextoBiblioteca(
        usuario
      );

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.arquivos.gerenciar"
    );

    const itemId =
      obterItemId(params);

    const item =
      await prisma
        .bibliotecaItem
        .findFirst({
          where: {
            id: itemId,

            instituicaoId:
              contexto.instituicaoId,
          },

          select: {
            id: true,
            titulo: true,
          },
        });

    if (!item) {
      falhar(
        404,
        "Item não encontrado nesta biblioteca.",
        "ITEM_NAO_ENCONTRADO"
      );
    }

    const arquivos =
      await prisma
        .bibliotecaArquivo
        .findMany({
          where: {
            instituicaoId:
              contexto.instituicaoId,

            itemId,
          },

          orderBy: [
            {
              versao:
                "desc",
            },

            {
              id:
                "desc",
            },
          ],

          select: {
            id: true,

            tipo: true,
            status: true,

            nomeOriginal:
              true,

            extensao:
              true,

            mimeType:
              true,

            tamanhoBytes:
              true,

            versao:
              true,

            principal:
              true,

            enviadoEm:
              true,

            atualizadoEm:
              true,

            processadoEm:
              true,

            arquivadoEm:
              true,

            motivoArquivamento:
              true,

            enviadoPor: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },

            arquivadoPor: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        });

    const historico =
      arquivos.map(
        (arquivo) => {
          const arquivado =
            Boolean(
              arquivo.arquivadoEm
            ) ||
            arquivo.status ===
              StatusArquivoBiblioteca.ARQUIVADO;

          const disponivel =
            !arquivado &&
            arquivo.status ===
              StatusArquivoBiblioteca.DISPONIVEL;

          return {
            id:
              arquivo.id,

            tipo:
              arquivo.tipo,

            status:
              arquivo.status,

            nomeOriginal:
              arquivo.nomeOriginal,

            extensao:
              arquivo.extensao,

            mimeType:
              arquivo.mimeType,

            tamanhoBytes:
              arquivo.tamanhoBytes.toString(),

            versao:
              arquivo.versao,

            /*
             * "principal" histórico pode
             * continuar true num registro
             * arquivado. Principal atual
             * só existe se estiver ativo.
             */
            principalAtual:
              disponivel &&
              arquivo.principal,

            eraPrincipal:
              arquivado &&
              arquivo.principal,

            disponivel,

            arquivado,

            enviadoEm:
              arquivo.enviadoEm,

            atualizadoEm:
              arquivo.atualizadoEm,

            processadoEm:
              arquivo.processadoEm,

            arquivadoEm:
              arquivo.arquivadoEm,

            motivoArquivamento:
              arquivo.motivoArquivamento,

            enviadoPor:
              arquivo.enviadoPor,

            arquivadoPor:
              arquivo.arquivadoPor,
          };
        }
      );

    const ativos =
      historico.filter(
        (arquivo) =>
          !arquivo.arquivado
      ).length;

    const arquivados =
      historico.filter(
        (arquivo) =>
          arquivo.arquivado
      ).length;

    return NextResponse.json(
      {
        ok: true,

        item: {
          id:
            item.id,

          titulo:
            item.titulo,
        },

        resumo: {
          total:
            historico.length,

          ativos,

          arquivados,
        },

        arquivos:
          historico,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}