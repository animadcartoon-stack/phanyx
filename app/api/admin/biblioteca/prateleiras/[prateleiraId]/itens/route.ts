import {
  AcaoAuditoriaBiblioteca,
  Prisma,
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
  };
};

const ITEM_SELECT = {
  id: true,
  titulo: true,
  subtitulo: true,
  tipo: true,
  status: true,
  slug: true,
  capaUrl: true,
  miniaturaUrl: true,
} as const;

const VINCULO_SELECT = {
  id: true,
  itemId: true,
  ordem: true,
  adicionadoEm: true,
  item: {
    select: ITEM_SELECT,
  },
  adicionadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },
} as const;

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

function idPrateleira(params: Parametros["params"]) {
  return inteiroPositivo(params.prateleiraId, "prateleiraId");
}

function numeroPagina(valor: string | null) {
  if (valor === null) {
    return 1;
  }

  const pagina = inteiroPositivo(valor, "pagina");

  if (pagina > 1000000) {
    falhar(400, "A p\u00e1gina solicitada \u00e9 inv\u00e1lida.", "PAGINA_INVALIDA");
  }

  return pagina;
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

export async function GET(
  request: NextRequest,
  { params }: Parametros,
) {
  try {
    const prateleiraId = idPrateleira(params);
    const usuario = await getUserFromToken();

    if (!usuario) {
      falhar(401, "Usu\u00e1rio n\u00e3o autenticado.", "NAO_AUTENTICADO");
    }

    const contexto = await obterContextoBiblioteca(usuario);

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.prateleiras.gerenciar",
    );

    const prateleira = await prisma.bibliotecaPrateleira.findFirst({
      where: {
        id: prateleiraId,
        instituicaoId: contexto.instituicaoId,
        tipo: {
          not: TipoPrateleiraBiblioteca.PESSOAL,
        },
      },
      select: {
        id: true,
        nome: true,
        ativa: true,
        _count: {
          select: {
            itens: true,
          },
        },
      },
    });

    if (!prateleira) {
      falhar(404, "Prateleira n\u00e3o encontrada.", "PRATELEIRA_NAO_ENCONTRADA");
    }

    const url = new URL(request.url);
    const pagina = numeroPagina(url.searchParams.get("pagina"));
    const busca = (url.searchParams.get("busca") ?? "").trim();

    if (busca.length > 120) {
      falhar(
        400,
        "A busca ultrapassa o limite permitido.",
        "BUSCA_MUITO_LONGA",
      );
    }

    const tamanhoPagina = 50;

    const [itens, disponiveis] = await Promise.all([
      prisma.bibliotecaPrateleiraItem.findMany({
        where: {
          instituicaoId: contexto.instituicaoId,
          prateleiraId,
        },
        orderBy: [
          { ordem: "asc" },
          { id: "asc" },
        ],
        skip: (pagina - 1) * tamanhoPagina,
        take: tamanhoPagina,
        select: VINCULO_SELECT,
      }),

      prisma.bibliotecaItem.findMany({
        where: {
          instituicaoId: contexto.instituicaoId,
          prateleiras: {
            none: {
              prateleiraId,
            },
          },
          ...(busca
            ? {
                titulo: {
                  contains: busca,
                  mode: "insensitive" as const,
                },
              }
            : {}),
        },
        orderBy: [
          { titulo: "asc" },
          { id: "asc" },
        ],
        take: 25,
        select: ITEM_SELECT,
      }),
    ]);

    return responder({
      success: true,
      prateleira,
      itens,
      paginacao: {
        pagina,
        tamanhoPagina,
        total: prateleira._count.itens,
        totalPaginas: Math.ceil(prateleira._count.itens / tamanhoPagina),
      },
      busca,
      disponiveis,
    });
  } catch (erro) {
    return responderErro(erro);
  }
}

export async function POST(
  request: NextRequest,
  { params }: Parametros,
) {
  try {
    const prateleiraId = idPrateleira(params);
    const usuario = await getUserFromToken();

    if (!usuario) {
      falhar(401, "Usu\u00e1rio n\u00e3o autenticado.", "NAO_AUTENTICADO");
    }

    const contexto = await obterContextoBiblioteca(usuario);

    if (usuario.impersonacao) {
      falhar(
        403,
        "N\u00e3o \u00e9 permitido adicionar itens durante uma sess\u00e3o de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO",
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.prateleiras.gerenciar",
    );

    const corpo = await lerCorpo(request);
    const itemId = inteiroPositivo(corpo.itemId, "itemId");

    const vinculo = await prisma.$transaction(async (transacao) => {
      const prateleira = await transacao.bibliotecaPrateleira.findFirst({
        where: {
          id: prateleiraId,
          instituicaoId: contexto.instituicaoId,
          tipo: {
            not: TipoPrateleiraBiblioteca.PESSOAL,
          },
        },
        select: {
          id: true,
          nome: true,
        },
      });

      if (!prateleira) {
        falhar(
          404,
          "Prateleira n\u00e3o encontrada.",
          "PRATELEIRA_NAO_ENCONTRADA",
        );
      }

      const item = await transacao.bibliotecaItem.findFirst({
        where: {
          id: itemId,
          instituicaoId: contexto.instituicaoId,
        },
        select: {
          id: true,
          titulo: true,
        },
      });

      if (!item) {
        falhar(
          404,
          "Item do acervo n\u00e3o encontrado.",
          "ITEM_NAO_ENCONTRADO",
        );
      }

      const existente = await transacao.bibliotecaPrateleiraItem.findFirst({
        where: {
          instituicaoId: contexto.instituicaoId,
          prateleiraId,
          itemId,
        },
        select: {
          id: true,
        },
      });

      if (existente) {
        falhar(
          409,
          "Este item j\u00e1 pertence \u00e0 prateleira.",
          "ITEM_JA_VINCULADO",
        );
      }

      const ultimo = await transacao.bibliotecaPrateleiraItem.aggregate({
        where: {
          instituicaoId: contexto.instituicaoId,
          prateleiraId,
        },
        _max: {
          ordem: true,
        },
      });

      const criado = await transacao.bibliotecaPrateleiraItem.create({
        data: {
          instituicaoId: contexto.instituicaoId,
          prateleiraId,
          itemId,
          ordem: (ultimo._max.ordem ?? -1) + 1,
          adicionadoPorId: usuario.id,
        },
        select: VINCULO_SELECT,
      });

      await transacao.bibliotecaAuditoria.create({
        data: {
          instituicaoId: contexto.instituicaoId,
          usuarioId: usuario.id,
          entidade: "BibliotecaPrateleira",
          entidadeId: String(prateleiraId),
          acao: AcaoAuditoriaBiblioteca.ATUALIZAR,
          descricao: "Item adicionado \u00e0 prateleira da Biblioteca.",
          dadosAnteriores: {
            itemId,
            vinculado: false,
          },
          dadosPosteriores: {
            itemId,
            titulo: item.titulo,
            vinculado: true,
            ordem: criado.ordem,
          },
          metadados: {
            origem: "admin.biblioteca.prateleiras.itens",
            metodo: "POST",
            vinculoId: criado.id,
          },
          ip: obterIp(request),
          userAgent: obterUserAgent(request),
        },
      });

      return criado;
    });

    return responder(
      {
        success: true,
        message: "Item adicionado \u00e0 prateleira com sucesso.",
        vinculo,
      },
      201,
    );
  } catch (erro) {
    if (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === "P2002"
    ) {
      return responderErro(
        new ErroBiblioteca(
          409,
          "Este item j\u00e1 pertence \u00e0 prateleira.",
          "ITEM_JA_VINCULADO",
        ),
      );
    }

    return responderErro(erro);
  }
}