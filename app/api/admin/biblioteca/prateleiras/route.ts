import {
  AcaoAuditoriaBiblioteca,
  TipoPrateleiraBiblioteca,
  VisibilidadePrateleiraBiblioteca,
} from "@prisma/client";

import {
  randomUUID,
} from "crypto";

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

import {
  getUserFromToken,
} from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TIPOS_ADMIN =
  new Set<TipoPrateleiraBiblioteca>([
    TipoPrateleiraBiblioteca.INSTITUCIONAL,
    TipoPrateleiraBiblioteca.DIDATICA,
    TipoPrateleiraBiblioteca.DESTAQUE,
    TipoPrateleiraBiblioteca.TEMATICA,
  ]);

const VISIBILIDADES =
  new Set<VisibilidadePrateleiraBiblioteca>(
    Object.values(
      VisibilidadePrateleiraBiblioteca,
    ),
  );

const PRATELEIRA_SELECT = {
  id: true,
  instituicaoId: true,

  nome: true,
  descricao: true,

  tipo: true,
  visibilidade: true,

  slug: true,
  capaUrl: true,
  cor: true,
  icone: true,

  ordem: true,
  destaque: true,
  ativa: true,

  criadoEm: true,
  atualizadoEm: true,

  criadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },

  atualizadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },

  _count: {
    select: {
      itens: true,
    },
  },
} as const;

function responder(
  corpo: unknown,
  status = 200,
) {
  return NextResponse.json(
    corpo,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
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
  const resposta =
    respostaErroBiblioteca(
      erro,
    );

  return responder(
    resposta.corpo,
    resposta.status,
  );
}

async function lerCorpo(
  request: NextRequest,
) {
  try {
    const corpo =
      await request.json();

    if (
      !corpo ||
      typeof corpo !== "object" ||
      Array.isArray(corpo)
    ) {
      falhar(
        400,
        "O corpo da requisição deve ser um objeto JSON válido.",
        "CORPO_INVALIDO",
      );
    }

    return corpo as Record<
      string,
      unknown
    >;
  } catch (erro) {
    if (
      erro instanceof
      ErroBiblioteca
    ) {
      throw erro;
    }

    falhar(
      400,
      "O corpo da requisição contém um JSON inválido.",
      "JSON_INVALIDO",
    );
  }
}

function textoObrigatorio(
  valor: unknown,
  campo: string,
  limite: number,
) {
  if (
    typeof valor !==
    "string"
  ) {
    falhar(
      400,
      `O campo ${campo} é obrigatório.`,
      "CAMPO_OBRIGATORIO",
    );
  }

  const texto =
    valor.trim();

  if (!texto) {
    falhar(
      400,
      `O campo ${campo} é obrigatório.`,
      "CAMPO_OBRIGATORIO",
    );
  }

  if (
    texto.length >
    limite
  ) {
    falhar(
      400,
      `O campo ${campo} ultrapassa o limite permitido.`,
      "CAMPO_MUITO_LONGO",
    );
  }

  return texto;
}

function textoOpcional(
  valor: unknown,
  campo: string,
  limite: number,
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  if (
    typeof valor !==
    "string"
  ) {
    falhar(
      400,
      `O campo ${campo} deve ser um texto.`,
      "CAMPO_INVALIDO",
    );
  }

  const texto =
    valor.trim();

  if (!texto) {
    return null;
  }

  if (
    texto.length >
    limite
  ) {
    falhar(
      400,
      `O campo ${campo} ultrapassa o limite permitido.`,
      "CAMPO_MUITO_LONGO",
    );
  }

  return texto;
}

function booleanoOpcional(
  valor: unknown,
  padrao: boolean,
  campo: string,
) {
  if (
    valor === undefined ||
    valor === null
  ) {
    return padrao;
  }

  if (
    typeof valor !==
    "boolean"
  ) {
    falhar(
      400,
      `O campo ${campo} deve ser verdadeiro ou falso.`,
      "CAMPO_BOOLEANO_INVALIDO",
    );
  }

  return valor;
}

function inteiroNaoNegativo(
  valor: unknown,
  padrao: number,
  campo: string,
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return padrao;
  }

  const numero =
    Number(valor);

  if (
    !Number.isInteger(
      numero,
    ) ||
    numero < 0
  ) {
    falhar(
      400,
      `O campo ${campo} deve ser um número inteiro maior ou igual a zero.`,
      "CAMPO_INVALIDO",
    );
  }

  return numero;
}

function tipoPrateleira(
  valor: unknown,
) {
  const normalizado =
    String(
      valor || "",
    )
      .trim()
      .toUpperCase() as TipoPrateleiraBiblioteca;

  if (
    !TIPOS_ADMIN.has(
      normalizado,
    )
  ) {
    falhar(
      400,
      "O tipo de prateleira informado é inválido para a Central administrativa.",
      "TIPO_PRATELEIRA_INVALIDO",
    );
  }

  return normalizado;
}

function visibilidade(
  valor: unknown,
) {
  const normalizado =
    String(
      valor ||
        VisibilidadePrateleiraBiblioteca.TODOS,
    )
      .trim()
      .toUpperCase() as VisibilidadePrateleiraBiblioteca;

  if (
    !VISIBILIDADES.has(
      normalizado,
    )
  ) {
    falhar(
      400,
      "A visibilidade informada é inválida.",
      "VISIBILIDADE_INVALIDA",
    );
  }

  if (
    normalizado ===
    VisibilidadePrateleiraBiblioteca.PRIVADA
  ) {
    falhar(
      400,
      "Prateleiras privadas pertencem à área pessoal do usuário.",
      "VISIBILIDADE_PRIVADA_NAO_PERMITIDA",
    );
  }

  return normalizado;
}

function gerarSlug(
  nome: string,
) {
  const base =
    nome
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      )
      .slice(
        0,
        140,
      ) ||
    "prateleira";

  return `${base}-${randomUUID().slice(0, 8)}`;
}

function obterIp(
  request: NextRequest,
) {
  const encaminhado =
    request.headers.get(
      "x-forwarded-for",
    );

  const candidato =
    encaminhado
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get(
      "x-real-ip",
    ) ||
    null;

  return candidato
    ? candidato.slice(
        0,
        255,
      )
    : null;
}

function obterUserAgent(
  request: NextRequest,
) {
  const valor =
    request.headers.get(
      "user-agent",
    );

  return valor
    ? valor.slice(
        0,
        4000,
      )
    : null;
}

function snapshotPrateleira(
  item: {
    nome: string;
    descricao: string | null;
    tipo: TipoPrateleiraBiblioteca;
    visibilidade: VisibilidadePrateleiraBiblioteca;
    slug: string;
    capaUrl: string | null;
    cor: string | null;
    icone: string | null;
    ordem: number;
    destaque: boolean;
    ativa: boolean;
  },
) {
  return {
    nome:
      item.nome,

    descricao:
      item.descricao,

    tipo:
      item.tipo,

    visibilidade:
      item.visibilidade,

    slug:
      item.slug,

    capaUrl:
      item.capaUrl,

    cor:
      item.cor,

    icone:
      item.icone,

    ordem:
      item.ordem,

    destaque:
      item.destaque,

    ativa:
      item.ativa,
  };
}

export async function GET() {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO",
      );
    }

    const contexto =
      await obterContextoBiblioteca(
        usuario,
      );

    /*
     * Hoje o PHANYX possui somente a permissão
     * biblioteca.prateleiras.gerenciar.
     *
     * Portanto, a Central administrativa é acessível
     * apenas a quem pode gerenciar coleções.
     */
    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.prateleiras.gerenciar",
    );

    const prateleiras =
      await prisma
        .bibliotecaPrateleira
        .findMany({
          where: {
            instituicaoId:
              contexto.instituicaoId,

            tipo: {
              not:
                TipoPrateleiraBiblioteca.PESSOAL,
            },
          },

          orderBy: [
            {
              ativa:
                "desc",
            },
            {
              destaque:
                "desc",
            },
            {
              ordem:
                "asc",
            },
            {
              nome:
                "asc",
            },
          ],

          select:
            PRATELEIRA_SELECT,
        });

    const totalItens =
      prateleiras.reduce(
        (
          total,
          item,
        ) =>
          total +
          item._count.itens,
        0,
      );

    return responder({
      success: true,

      acesso: {
        podeGerenciar:
          true,
      },

      resumo: {
        total:
          prateleiras.length,

        ativas:
          prateleiras.filter(
            (item) =>
              item.ativa,
          ).length,

        inativas:
          prateleiras.filter(
            (item) =>
              !item.ativa,
          ).length,

        destaques:
          prateleiras.filter(
            (item) =>
              item.ativa &&
              item.destaque,
          ).length,

        itensVinculados:
          totalItens,
      },

      tipos:
        Array.from(
          TIPOS_ADMIN,
        ),

      visibilidades:
        Array.from(
          VISIBILIDADES,
        ).filter(
          (item) =>
            item !==
            VisibilidadePrateleiraBiblioteca.PRIVADA,
        ),

      prateleiras,
    });
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO",
      );
    }

    const contexto =
      await obterContextoBiblioteca(
        usuario,
      );

    if (
      usuario.impersonacao
    ) {
      falhar(
        403,
        "Não é permitido cadastrar prateleiras durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO",
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.prateleiras.gerenciar",
    );

    const corpo =
      await lerCorpo(
        request,
      );

    const nome =
      textoObrigatorio(
        corpo.nome,
        "nome",
        180,
      );

    const dados = {
      nome,

      descricao:
        textoOpcional(
          corpo.descricao,
          "descricao",
          10000,
        ),

      tipo:
        tipoPrateleira(
          corpo.tipo,
        ),

      visibilidade:
        visibilidade(
          corpo.visibilidade,
        ),

      capaUrl:
        textoOpcional(
          corpo.capaUrl,
          "capaUrl",
          2000,
        ),

      cor:
        textoOpcional(
          corpo.cor,
          "cor",
          100,
        ),

      icone:
        textoOpcional(
          corpo.icone,
          "icone",
          100,
        ),

      ordem:
        inteiroNaoNegativo(
          corpo.ordem,
          0,
          "ordem",
        ),

      destaque:
        booleanoOpcional(
          corpo.destaque,
          false,
          "destaque",
        ),

      ativa:
        booleanoOpcional(
          corpo.ativa,
          true,
          "ativa",
        ),
    };

    const ip =
      obterIp(
        request,
      );

    const userAgent =
      obterUserAgent(
        request,
      );

    const criada =
      await prisma.$transaction(
        async (
          transacao,
        ) => {
          const prateleira =
            await transacao
              .bibliotecaPrateleira
              .create({
                data: {
                  instituicaoId:
                    contexto.instituicaoId,

                  proprietarioId:
                    null,

                  slug:
                    gerarSlug(
                      nome,
                    ),

                  ...dados,

                  criadoPorId:
                    usuario.id,

                  atualizadoPorId:
                    usuario.id,
                },

                select:
                  PRATELEIRA_SELECT,
              });

          await transacao
            .bibliotecaAuditoria
            .create({
              data: {
                instituicaoId:
                  contexto.instituicaoId,

                usuarioId:
                  usuario.id,

                entidade:
                  "BibliotecaPrateleira",

                entidadeId:
                  String(
                    prateleira.id,
                  ),

                acao:
                  AcaoAuditoriaBiblioteca
                    .CRIAR,

                descricao:
                  "Prateleira da Biblioteca cadastrada.",

                dadosPosteriores:
                  snapshotPrateleira(
                    prateleira,
                  ),

                metadados: {
                  origem:
                    "admin.biblioteca.prateleiras",

                  metodo:
                    "POST",
                },

                ip,
                userAgent,
              },
            });

          return prateleira;
        },
      );

    return responder(
      {
        success: true,

        message:
          "Prateleira cadastrada com sucesso.",

        prateleira:
          criada,
      },
      201,
    );
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}
