import {
  AcaoAuditoriaBiblioteca,
  TipoPrateleiraBiblioteca,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

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

type Parametros = {
  params: {
    prateleiraId: string;
    vinculoId: string;
  };
};

function responder(corpo: unknown, status = 200) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

function falhar(
  status: number,
  mensagem: string,
  codigo: string,
): never {
  throw new ErroBiblioteca(status, mensagem, codigo);
}

function responderErro(erro: unknown) {
  const resposta = respostaErroBiblioteca(erro);
  return responder(resposta.corpo, resposta.status);
}

function inteiroPositivo(valor: unknown, campo: string) {
  const texto = String(valor ?? "").trim();

  if (
    (typeof valor !== "string" && typeof valor !== "number") ||
    !/^[1-9]\d*$/.test(texto)
  ) {
    falhar(400, `O campo ${campo} deve ser um inteiro positivo.`, "ID_INVALIDO");
  }

  const numero = Number(texto);

  if (!Number.isSafeInteger(numero)) {
    falhar(400, `O campo ${campo} deve ser um inteiro positivo.`, "ID_INVALIDO");
  }

  return numero;
}

function posicaoValida(valor: unknown) {
  const texto = String(valor ?? "").trim();

  if (
    (typeof valor !== "string" && typeof valor !== "number") ||
    !/^\d+$/.test(texto)
  ) {
    falhar(
      400,
      "A nova posi\u00e7\u00e3o deve ser um inteiro maior ou igual a zero.",
      "POSICAO_INVALIDA",
    );
  }

  const numero = Number(texto);

  if (!Number.isSafeInteger(numero)) {
    falhar(
      400,
      "A nova posi\u00e7\u00e3o deve ser um inteiro maior ou igual a zero.",
      "POSICAO_INVALIDA",
    );
  }

  return numero;
}

async function lerCorpo(request: NextRequest) {
  try {
    const corpo = await request.json();

    if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) {
      falhar(
        400,
        "O corpo da requisi\u00e7\u00e3o deve ser um objeto JSON v\u00e1lido.",
        "CORPO_INVALIDO",
      );
    }

    return corpo as Record<string, unknown>;
  } catch (erro) {
    if (erro instanceof ErroBiblioteca) {
      throw erro;
    }

    falhar(
      400,
      "O corpo da requisi\u00e7\u00e3o cont\u00e9m um JSON inv\u00e1lido.",
      "JSON_INVALIDO",
    );
  }
}

function obterIp(request: NextRequest) {
  const encaminhado = request.headers.get("x-forwarded-for");
  const candidato =
    encaminhado?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  return candidato ? candidato.slice(0, 255) : null;
}

function obterUserAgent(request: NextRequest) {
  const valor = request.headers.get("user-agent");
  return valor ? valor.slice(0, 4000) : null;
}

async function obterAcesso(request: NextRequest) {
  const usuario = await getUserFromToken();

  if (!usuario) {
    falhar(401, "Usu\u00e1rio n\u00e3o autenticado.", "NAO_AUTENTICADO");
  }

  const contexto = await obterContextoBiblioteca(usuario);

  if (usuario.impersonacao) {
    falhar(
      403,
      "N\u00e3o \u00e9 permitido alterar itens durante uma sess\u00e3o de suporte.",
      "OPERACAO_BLOQUEADA_EM_IMPERSONACAO",
    );
  }

  exigirPermissaoBiblioteca(
    usuario,
    contexto,
    "biblioteca.prateleiras.gerenciar",
  );

  return {
    usuario,
    contexto,
    ip: obterIp(request),
    userAgent: obterUserAgent(request),
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: Parametros,
) {
  try {
    const prateleiraId = inteiroPositivo(
      params.prateleiraId,
      "prateleiraId",
    );
    const vinculoId = inteiroPositivo(params.vinculoId, "vinculoId");
    const acesso = await obterAcesso(request);
    const corpo = await lerCorpo(request);
    const novaPosicao = posicaoValida(corpo.novaPosicao);

    const resultado = await prisma.$transaction(
      async (transacao) => {
        const prateleira = await transacao.bibliotecaPrateleira.findFirst({
          where: {
            id: prateleiraId,
            instituicaoId: acesso.contexto.instituicaoId,
            tipo: {
              not: TipoPrateleiraBiblioteca.PESSOAL,
            },
          },
          select: {
            id: true,
          },
        });

        if (!prateleira) {
          falhar(
            404,
            "Prateleira n\u00e3o encontrada.",
            "PRATELEIRA_NAO_ENCONTRADA",
          );
        }

        const anteriores = await transacao.bibliotecaPrateleiraItem.findMany({
          where: {
            instituicaoId: acesso.contexto.instituicaoId,
            prateleiraId,
          },
          orderBy: [
            { ordem: "asc" },
            { id: "asc" },
          ],
          select: {
            id: true,
            itemId: true,
            ordem: true,
          },
        });

        const posicaoAnterior = anteriores.findIndex(
          (vinculo) => vinculo.id === vinculoId,
        );

        if (posicaoAnterior < 0) {
          falhar(
            404,
            "V\u00ednculo n\u00e3o encontrado nesta prateleira.",
            "VINCULO_NAO_ENCONTRADO",
          );
        }

        if (novaPosicao >= anteriores.length) {
          falhar(
            400,
            "A nova posi\u00e7\u00e3o excede a quantidade de itens.",
            "POSICAO_FORA_DA_PRATELEIRA",
          );
        }

        const [movido] = anteriores.splice(posicaoAnterior, 1);
        anteriores.splice(novaPosicao, 0, movido);

        for (let indice = 0; indice < anteriores.length; indice += 1) {
          const vinculo = anteriores[indice];

          if (vinculo.ordem === indice) {
            continue;
          }

          await transacao.bibliotecaPrateleiraItem.updateMany({
            where: {
              id: vinculo.id,
              instituicaoId: acesso.contexto.instituicaoId,
              prateleiraId,
            },
            data: {
              ordem: indice,
            },
          });
        }

        await transacao.bibliotecaAuditoria.create({
          data: {
            instituicaoId: acesso.contexto.instituicaoId,
            usuarioId: acesso.usuario.id,
            entidade: "BibliotecaPrateleira",
            entidadeId: String(prateleiraId),
            acao: AcaoAuditoriaBiblioteca.ATUALIZAR,
            descricao: "Ordem dos itens da prateleira atualizada.",
            dadosAnteriores: {
              vinculoId,
              itemId: movido.itemId,
              posicao: posicaoAnterior,
            },
            dadosPosteriores: {
              vinculoId,
              itemId: movido.itemId,
              posicao: novaPosicao,
            },
            metadados: {
              origem: "admin.biblioteca.prateleiras.itens",
              metodo: "PATCH",
              quantidadeItens: anteriores.length,
            },
            ip: acesso.ip,
            userAgent: acesso.userAgent,
          },
        });

        return {
          vinculoId,
          itemId: movido.itemId,
          novaPosicao,
          quantidadeItens: anteriores.length,
        };
      },
      {
        timeout: 20000,
      },
    );

    return responder({
      success: true,
      message: "Ordem dos itens atualizada com sucesso.",
      resultado,
    });
  } catch (erro) {
    return responderErro(erro);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Parametros,
) {
  try {
    const prateleiraId = inteiroPositivo(
      params.prateleiraId,
      "prateleiraId",
    );
    const vinculoId = inteiroPositivo(params.vinculoId, "vinculoId");
    const acesso = await obterAcesso(request);

    const removido = await prisma.$transaction(async (transacao) => {
      const prateleira = await transacao.bibliotecaPrateleira.findFirst({
        where: {
          id: prateleiraId,
          instituicaoId: acesso.contexto.instituicaoId,
          tipo: {
            not: TipoPrateleiraBiblioteca.PESSOAL,
          },
        },
        select: {
          id: true,
        },
      });

      if (!prateleira) {
        falhar(
          404,
          "Prateleira n\u00e3o encontrada.",
          "PRATELEIRA_NAO_ENCONTRADA",
        );
      }

      const vinculo = await transacao.bibliotecaPrateleiraItem.findFirst({
        where: {
          id: vinculoId,
          instituicaoId: acesso.contexto.instituicaoId,
          prateleiraId,
        },
        select: {
          id: true,
          itemId: true,
          ordem: true,
          item: {
            select: {
              titulo: true,
            },
          },
        },
      });

      if (!vinculo) {
        falhar(
          404,
          "V\u00ednculo n\u00e3o encontrado nesta prateleira.",
          "VINCULO_NAO_ENCONTRADO",
        );
      }

      const exclusao = await transacao.bibliotecaPrateleiraItem.deleteMany({
        where: {
          id: vinculoId,
          instituicaoId: acesso.contexto.instituicaoId,
          prateleiraId,
        },
      });

      if (exclusao.count !== 1) {
        falhar(
          409,
          "O v\u00ednculo foi alterado durante a opera\u00e7\u00e3o.",
          "VINCULO_ALTERADO",
        );
      }

      await transacao.bibliotecaAuditoria.create({
        data: {
          instituicaoId: acesso.contexto.instituicaoId,
          usuarioId: acesso.usuario.id,
          entidade: "BibliotecaPrateleira",
          entidadeId: String(prateleiraId),
          acao: AcaoAuditoriaBiblioteca.ATUALIZAR,
          descricao: "Item removido da prateleira da Biblioteca.",
          dadosAnteriores: {
            vinculoId,
            itemId: vinculo.itemId,
            titulo: vinculo.item.titulo,
            ordem: vinculo.ordem,
            vinculado: true,
          },
          dadosPosteriores: {
            itemId: vinculo.itemId,
            vinculado: false,
          },
          metadados: {
            origem: "admin.biblioteca.prateleiras.itens",
            metodo: "DELETE",
          },
          ip: acesso.ip,
          userAgent: acesso.userAgent,
        },
      });

      return {
        vinculoId,
        itemId: vinculo.itemId,
      };
    });

    return responder({
      success: true,
      message: "Item removido da prateleira com sucesso.",
      removido,
    });
  } catch (erro) {
    return responderErro(erro);
  }
}