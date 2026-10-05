import {
  AcaoAuditoriaBiblioteca,
  Prisma,
  TipoVarianteAutorBiblioteca,
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
import {
  getUserFromToken,
  temAlgumaPermissao,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIMITE_MAXIMO_POR_PAGINA = 100;
const LIMITE_VARIANTES = 50;

function responder(
  corpo: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function responderErro(
  erro: unknown
) {
  if (erro instanceof ErroBiblioteca) {
    const resposta =
      respostaErroBiblioteca(
        erro
      );

    return responder(
      resposta.corpo,
      resposta.status
    );
  }

  console.error(
    "[biblioteca/autoridades/pessoas]",
    erro
  );

  return responder(
    {
      error:
        "Não foi possível processar as autoridades bibliográficas.",
      codigo: "ERRO_INTERNO",
    },
    500
  );
}

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

function numeroQuery(
  valor: string | null,
  padrao: number,
  minimo: number,
  maximo: number
) {
  if (!valor) {
    return padrao;
  }

  const numero =
    Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero < minimo ||
    numero > maximo
  ) {
    falhar(
      400,
      "Parâmetro numérico inválido.",
      "PARAMETRO_NUMERICO_INVALIDO"
    );
  }

  return numero;
}

function textoBusca(
  valor: string | null
) {
  if (!valor) {
    return null;
  }

  const texto =
    valor.trim();

  if (!texto) {
    return null;
  }

  if (texto.length > 150) {
    falhar(
      400,
      "O termo de busca ultrapassa o limite permitido.",
      "BUSCA_MUITO_LONGA"
    );
  }

  return texto;
}

function textoObrigatorio(
  valor: unknown,
  campo: string,
  limite: number
) {
  if (
    typeof valor !== "string" ||
    !valor.trim()
  ) {
    falhar(
      400,
      `O campo ${campo} é obrigatório.`,
      "CAMPO_OBRIGATORIO",
      { campo }
    );
  }

  const texto =
    valor.trim();

  if (texto.length > limite) {
    falhar(
      400,
      `O campo ${campo} ultrapassa o limite permitido.`,
      "CAMPO_MUITO_LONGO",
      { campo, limite }
    );
  }

  return texto;
}

function textoOpcional(
  valor: unknown,
  campo: string,
  limite: number
): string | null {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  if (typeof valor !== "string") {
    falhar(
      400,
      `O campo ${campo} é inválido.`,
      "CAMPO_INVALIDO",
      { campo }
    );
  }

  const texto =
    valor.trim();

  if (!texto) {
    return null;
  }

  if (texto.length > limite) {
    falhar(
      400,
      `O campo ${campo} ultrapassa o limite permitido.`,
      "CAMPO_MUITO_LONGO",
      { campo, limite }
    );
  }

  return texto;
}

function normalizarBusca(
  valor: string
) {
  return valor
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      " "
    )
    .trim();
}

function filtroAtivo(
  valor: string | null
): boolean | undefined {
  if (
    !valor ||
    valor.toLowerCase() === "true" ||
    valor.toLowerCase() === "ativos"
  ) {
    return true;
  }

  if (
    valor.toLowerCase() === "false" ||
    valor.toLowerCase() === "inativos"
  ) {
    return false;
  }

  if (
    valor.toLowerCase() === "todos" ||
    valor.toLowerCase() === "all"
  ) {
    return undefined;
  }

  falhar(
    400,
    "Filtro de situação inválido.",
    "FILTRO_ATIVO_INVALIDO"
  );
}

function dataOpcional(
  valor: unknown,
  campo: string
): Date | null {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  if (typeof valor !== "string") {
    falhar(
      400,
      `O campo ${campo} é inválido.`,
      "DATA_INVALIDA",
      { campo }
    );
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    falhar(
      400,
      `O campo ${campo} contém uma data inválida.`,
      "DATA_INVALIDA",
      { campo }
    );
  }

  return data;
}

function urlOpcional(
  valor: unknown,
  campo: string
) {
  const texto =
    textoOpcional(
      valor,
      campo,
      2_000
    );

  if (!texto) {
    return null;
  }

  let url: URL;

  try {
    url =
      new URL(texto);
  } catch {
    falhar(
      400,
      `O campo ${campo} deve conter uma URL válida.`,
      "URL_INVALIDA",
      { campo }
    );
  }

  if (
    url.protocol !== "http:" &&
    url.protocol !== "https:"
  ) {
    falhar(
      400,
      `O campo ${campo} deve usar HTTP ou HTTPS.`,
      "URL_INVALIDA",
      { campo }
    );
  }

  return url.toString();
}

function validarChecksumMod112(
  identificador: string
) {
  const compacto =
    identificador.replace(
      /[\s-]/g,
      ""
    );

  if (
    !/^\d{15}[\dX]$/i.test(
      compacto
    )
  ) {
    return false;
  }

  let total = 0;

  for (
    let indice = 0;
    indice < 15;
    indice += 1
  ) {
    total =
      (total +
        Number(
          compacto[indice]
        )) *
      2;
  }

  const resto =
    total % 11;

  const resultado =
    (12 - resto) % 11;

  const digito =
    resultado === 10
      ? "X"
      : String(resultado);

  return (
    digito ===
    compacto[15].toUpperCase()
  );
}

function normalizarOrcid(
  valor: unknown
) {
  const texto =
    textoOpcional(
      valor,
      "orcid",
      100
    );

  if (!texto) {
    return null;
  }

  const compacto =
    texto
      .replace(
        /^https?:\/\/orcid\.org\//i,
        ""
      )
      .replace(
        /[\s-]/g,
        ""
      )
      .toUpperCase();

  if (
    !validarChecksumMod112(
      compacto
    )
  ) {
    falhar(
      400,
      "O ORCID informado é inválido.",
      "ORCID_INVALIDO"
    );
  }

  return [
    compacto.slice(0, 4),
    compacto.slice(4, 8),
    compacto.slice(8, 12),
    compacto.slice(12, 16),
  ].join("-");
}

function normalizarIsni(
  valor: unknown
) {
  const texto =
    textoOpcional(
      valor,
      "isni",
      100
    );

  if (!texto) {
    return null;
  }

  const compacto =
    texto
      .replace(
        /^https?:\/\/isni\.org\/isni\//i,
        ""
      )
      .replace(
        /[\s-]/g,
        ""
      )
      .toUpperCase();

  if (
    !validarChecksumMod112(
      compacto
    )
  ) {
    falhar(
      400,
      "O ISNI informado é inválido.",
      "ISNI_INVALIDO"
    );
  }

  return [
    compacto.slice(0, 4),
    compacto.slice(4, 8),
    compacto.slice(8, 12),
    compacto.slice(12, 16),
  ].join(" ");
}

function normalizarViaf(
  valor: unknown
) {
  const texto =
    textoOpcional(
      valor,
      "viaf",
      100
    );

  if (!texto) {
    return null;
  }

  const normalizado =
    texto
      .replace(
        /^https?:\/\/(?:www\.)?viaf\.org\/viaf\//i,
        ""
      )
      .replace(
        /\/+$/,
        ""
      )
      .trim();

  if (
    !/^\d{1,30}$/.test(
      normalizado
    )
  ) {
    falhar(
      400,
      "O identificador VIAF informado é inválido.",
      "VIAF_INVALIDO"
    );
  }

  return normalizado;
}

function normalizarWikidata(
  valor: unknown
) {
  const texto =
    textoOpcional(
      valor,
      "wikidataId",
      100
    );

  if (!texto) {
    return null;
  }

  const normalizado =
    texto
      .replace(
        /^https?:\/\/www\.wikidata\.org\/wiki\//i,
        ""
      )
      .trim()
      .toUpperCase();

  if (
    !/^Q[1-9]\d*$/.test(
      normalizado
    )
  ) {
    falhar(
      400,
      "O identificador Wikidata informado é inválido.",
      "WIKIDATA_INVALIDO"
    );
  }

  return normalizado;
}

function normalizarLccn(
  valor: unknown
) {
  const texto =
    textoOpcional(
      valor,
      "lccn",
      100
    );

  if (!texto) {
    return null;
  }

  const normalizado =
    texto
      .replace(
        /^https?:\/\/id\.loc\.gov\/authorities\/names\//i,
        ""
      )
      .replace(
        /\/+$/,
        ""
      )
      .trim();

  if (
    !/^[a-zA-Z0-9-]{3,40}$/.test(
      normalizado
    )
  ) {
    falhar(
      400,
      "O identificador LCCN informado é inválido.",
      "LCCN_INVALIDO"
    );
  }

  return normalizado;
}

type VarianteNormalizada = {
  nome: string;
  nomeNormalizado: string;
  tipo:
    TipoVarianteAutorBiblioteca;
  idioma: string | null;
  observacao: string | null;
};

function normalizarVariantes(
  valor: unknown,
  nomeAutoridade: string
): VarianteNormalizada[] {
  if (
    valor === undefined ||
    valor === null
  ) {
    return [];
  }

  if (!Array.isArray(valor)) {
    falhar(
      400,
      "O campo variantes deve ser uma lista.",
      "VARIANTES_INVALIDAS"
    );
  }

  if (
    valor.length >
    LIMITE_VARIANTES
  ) {
    falhar(
      400,
      "A quantidade de variantes ultrapassa o limite permitido.",
      "MUITAS_VARIANTES",
      {
        limite:
          LIMITE_VARIANTES,
      }
    );
  }

  const nomeAutoridadeNormalizado =
    normalizarBusca(
      nomeAutoridade
    );

  const vistos =
    new Set<string>();

  return valor.map(
    (
      item: unknown,
      indice: number
    ) => {
      if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item)
      ) {
        falhar(
          400,
          "Uma variante informada é inválida.",
          "VARIANTE_INVALIDA",
          { indice }
        );
      }

      const registro =
        item as Record<
          string,
          unknown
        >;

      const nome =
        textoObrigatorio(
          registro.nome,
          `variantes[${indice}].nome`,
          240
        );

      const nomeNormalizado =
        normalizarBusca(nome);

      if (!nomeNormalizado) {
        falhar(
          400,
          "O nome da variante é inválido.",
          "VARIANTE_INVALIDA",
          { indice }
        );
      }

      if (
        nomeNormalizado ===
        nomeAutoridadeNormalizado
      ) {
        falhar(
          400,
          "Uma variante não pode ser igual ao nome autorizado.",
          "VARIANTE_IGUAL_NOME_AUTORIZADO",
          { indice, nome }
        );
      }

      if (
        vistos.has(
          nomeNormalizado
        )
      ) {
        falhar(
          400,
          "Há variantes repetidas no cadastro.",
          "VARIANTE_DUPLICADA",
          { indice, nome }
        );
      }

      vistos.add(
        nomeNormalizado
      );

      const tipoTexto =
        String(
          registro.tipo ||
            TipoVarianteAutorBiblioteca.VARIANTE
        )
          .trim()
          .toUpperCase();

      if (
        !Object.values(
          TipoVarianteAutorBiblioteca
        ).includes(
          tipoTexto as
            TipoVarianteAutorBiblioteca
        )
      ) {
        falhar(
          400,
          "O tipo da variante é inválido.",
          "TIPO_VARIANTE_INVALIDO",
          {
            indice,
            tipo:
              tipoTexto,
          }
        );
      }

      return {
        nome,
        nomeNormalizado,
        tipo:
          tipoTexto as
            TipoVarianteAutorBiblioteca,

        idioma:
          textoOpcional(
            registro.idioma,
            `variantes[${indice}].idioma`,
            30
          ),

        observacao:
          textoOpcional(
            registro.observacao,
            `variantes[${indice}].observacao`,
            2_000
          ),
      };
    }
  );
}

function obterIp(
  request: NextRequest
) {
  return (
    request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() ||
    request.headers
      .get("x-real-ip") ||
    null
  );
}

const PESSOA_SELECT = {
  id: true,
  nome: true,
  nomeOrdenacao: true,
  biografia: true,
  nacionalidade: true,
  dataNascimento: true,
  dataFalecimento: true,
  fotoUrl: true,
  siteUrl: true,

  orcid: true,
  viaf: true,
  isni: true,
  wikidataId: true,
  lccn: true,

  notaAutoridade: true,
  ativo: true,

  criadoEm: true,
  atualizadoEm: true,

  variantes: {
    where: {
      ativo: true,
    },

    orderBy: [
      {
        nome:
          "asc" as const,
      },
      {
        id:
          "asc" as const,
      },
    ],

    select: {
      id: true,
      nome: true,
      nomeNormalizado: true,
      tipo: true,
      idioma: true,
      observacao: true,
      ativo: true,
    },
  },

  _count: {
    select: {
      itens: true,
      variantes: true,
    },
  },
} satisfies Prisma.BibliotecaAutorSelect;

export async function GET(
  request: NextRequest
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
      "biblioteca.catalogo.ver"
    );

    const podeCriar =
      temAlgumaPermissao(
        usuario,
        [
          "biblioteca.catalogo.criar",
          "biblioteca.catalogo.editar",
        ]
      ) ||
      contexto.operador?.podeCatalogar ===
        true;

    const podeEditar =
      temAlgumaPermissao(
        usuario,
        [
          "biblioteca.catalogo.editar",
        ]
      ) ||
      contexto.operador?.podeCatalogar ===
        true;

    const parametros =
      request.nextUrl.searchParams;

    const pagina =
      numeroQuery(
        parametros.get("pagina"),
        1,
        1,
        Number.MAX_SAFE_INTEGER
      );

    const porPagina =
      numeroQuery(
        parametros.get("porPagina"),
        25,
        1,
        LIMITE_MAXIMO_POR_PAGINA
      );

    const busca =
      textoBusca(
        parametros.get("busca")
      );

    const buscaNormalizada =
      busca
        ? normalizarBusca(busca)
        : null;

    const ativo =
      filtroAtivo(
        parametros.get("ativo")
      );

    const onde:
      Prisma.BibliotecaAutorWhereInput = {
        instituicaoId:
          contexto.instituicaoId,

        ...(ativo === undefined
          ? {}
          : { ativo }),

        ...(busca
          ? {
              OR: [
                {
                  nome: {
                    contains: busca,
                    mode: "insensitive",
                  },
                },
                {
                  nomeOrdenacao: {
                    contains: busca,
                    mode: "insensitive",
                  },
                },
                {
                  orcid: {
                    contains: busca,
                    mode: "insensitive",
                  },
                },
                {
                  viaf: {
                    contains: busca,
                    mode: "insensitive",
                  },
                },
                {
                  isni: {
                    contains: busca,
                    mode: "insensitive",
                  },
                },
                {
                  wikidataId: {
                    contains: busca,
                    mode: "insensitive",
                  },
                },
                {
                  lccn: {
                    contains: busca,
                    mode: "insensitive",
                  },
                },
                {
                  variantes: {
                    some: {
                      ativo: true,
                      OR: [
                        {
                          nome: {
                            contains: busca,
                            mode: "insensitive",
                          },
                        },
                        ...(buscaNormalizada
                          ? [
                              {
                                nomeNormalizado: {
                                  contains:
                                    buscaNormalizada,
                                  mode:
                                    "insensitive" as const,
                                },
                              },
                            ]
                          : []),
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      };

    const [
      total,
      pessoas,
    ] =
      await prisma.$transaction([
        prisma.bibliotecaAutor.count({
          where: onde,
        }),

        prisma.bibliotecaAutor.findMany({
          where: onde,

          orderBy: [
            {
              nomeOrdenacao:
                "asc",
            },
            {
              nome:
                "asc",
            },
            {
              id:
                "asc",
            },
          ],

          skip:
            (pagina - 1) *
            porPagina,

          take:
            porPagina,

          select:
            PESSOA_SELECT,
        }),
      ]);

    return responder({
      ok: true,

      acesso: {
        podeCriar,
        podeEditar,
      },

      pessoas,

      paginacao: {
        pagina,
        porPagina,
        total,
        totalPaginas:
          Math.ceil(
            total / porPagina
          ),
      },

      filtros: {
        busca,
        ativo:
          ativo === undefined
            ? "todos"
            : ativo,
      },
    });
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}

export async function POST(
  request: NextRequest
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

    if (usuario.impersonacao) {
      falhar(
        403,
        "Não é permitido alterar autoridades bibliográficas durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.catalogo.criar",
      "biblioteca.catalogo.editar"
    );

    let corpo:
      Record<string, unknown>;

    try {
      corpo =
        await request.json();
    } catch {
      falhar(
        400,
        "O corpo da requisição deve conter JSON válido.",
        "JSON_INVALIDO"
      );
    }

    const nome =
      textoObrigatorio(
        corpo.nome,
        "nome",
        240
      );

    const nomeOrdenacao =
      textoOpcional(
        corpo.nomeOrdenacao,
        "nomeOrdenacao",
        240
      );

    const biografia =
      textoOpcional(
        corpo.biografia,
        "biografia",
        20_000
      );

    const nacionalidade =
      textoOpcional(
        corpo.nacionalidade,
        "nacionalidade",
        120
      );

    const dataNascimento =
      dataOpcional(
        corpo.dataNascimento,
        "dataNascimento"
      );

    const dataFalecimento =
      dataOpcional(
        corpo.dataFalecimento,
        "dataFalecimento"
      );

    if (
      dataNascimento &&
      dataFalecimento &&
      dataFalecimento <
        dataNascimento
    ) {
      falhar(
        400,
        "A data de falecimento não pode ser anterior à data de nascimento.",
        "PERIODO_VIDA_INVALIDO"
      );
    }

    const fotoUrl =
      urlOpcional(
        corpo.fotoUrl,
        "fotoUrl"
      );

    const siteUrl =
      urlOpcional(
        corpo.siteUrl,
        "siteUrl"
      );

    const orcid =
      normalizarOrcid(
        corpo.orcid
      );

    const viaf =
      normalizarViaf(
        corpo.viaf
      );

    const isni =
      normalizarIsni(
        corpo.isni
      );

    const wikidataId =
      normalizarWikidata(
        corpo.wikidataId
      );

    const lccn =
      normalizarLccn(
        corpo.lccn
      );

    const notaAutoridade =
      textoOpcional(
        corpo.notaAutoridade,
        "notaAutoridade",
        20_000
      );

    const variantes =
      normalizarVariantes(
        corpo.variantes,
        nome
      );

    const nomeNormalizado =
      normalizarBusca(nome);

    const filtrosDuplicidade:
      Prisma.BibliotecaAutorWhereInput[] =
        [
          {
            nome: {
              equals: nome,
              mode: "insensitive",
            },
          },
          {
            variantes: {
              some: {
                nomeNormalizado,
              },
            },
          },
        ];

    for (
      const variante
      of variantes
    ) {
      filtrosDuplicidade.push(
        {
          nome: {
            equals:
              variante.nome,
            mode:
              "insensitive",
          },
        },
        {
          variantes: {
            some: {
              nomeNormalizado:
                variante.nomeNormalizado,
            },
          },
        }
      );
    }

    if (orcid) {
      filtrosDuplicidade.push({
        orcid: {
          equals: orcid,
          mode: "insensitive",
        },
      });
    }

    if (viaf) {
      filtrosDuplicidade.push({
        viaf: {
          equals: viaf,
          mode: "insensitive",
        },
      });
    }

    if (isni) {
      filtrosDuplicidade.push({
        isni: {
          equals: isni,
          mode: "insensitive",
        },
      });
    }

    if (wikidataId) {
      filtrosDuplicidade.push({
        wikidataId: {
          equals:
            wikidataId,
          mode:
            "insensitive",
        },
      });
    }

    if (lccn) {
      filtrosDuplicidade.push({
        lccn: {
          equals: lccn,
          mode: "insensitive",
        },
      });
    }

    const possivelDuplicado =
      await prisma.bibliotecaAutor.findFirst({
        where: {
          instituicaoId:
            contexto.instituicaoId,

          OR:
            filtrosDuplicidade,
        },

        select: {
          id: true,
          nome: true,
          nomeOrdenacao: true,
          orcid: true,
          viaf: true,
          isni: true,
          wikidataId: true,
          lccn: true,
          ativo: true,
        },
      });

    if (possivelDuplicado) {
      falhar(
        409,
        "Já existe uma autoridade que pode representar a mesma pessoa.",
        "AUTORIDADE_POSSIVELMENTE_DUPLICADA",
        {
          autoridade:
            possivelDuplicado,
        }
      );
    }

    const ip =
      obterIp(request);

    const userAgent =
      request.headers
        .get("user-agent")
        ?.slice(0, 2_000) ||
      null;

    const pessoa =
      await prisma.$transaction(
        async (
          transacao
        ) => {
          const criada =
            await transacao.bibliotecaAutor.create({
              data: {
                instituicaoId:
                  contexto.instituicaoId,

                nome,
                nomeOrdenacao,
                biografia,
                nacionalidade,
                dataNascimento,
                dataFalecimento,
                fotoUrl,
                siteUrl,

                orcid,
                viaf,
                isni,
                wikidataId,
                lccn,

                notaAutoridade,
                ativo: true,
              },

              select: {
                id: true,
              },
            });

          if (
            variantes.length
          ) {
            await transacao.bibliotecaAutorVariante.createMany({
              data:
                variantes.map(
                  (
                    variante
                  ) => ({
                    instituicaoId:
                      contexto.instituicaoId,

                    autorId:
                      criada.id,

                    nome:
                      variante.nome,

                    nomeNormalizado:
                      variante.nomeNormalizado,

                    tipo:
                      variante.tipo,

                    idioma:
                      variante.idioma,

                    observacao:
                      variante.observacao,

                    ativo:
                      true,
                  })
                ),
            });
          }

          const registro =
            await transacao.bibliotecaAutor.findFirstOrThrow({
              where: {
                id:
                  criada.id,

                instituicaoId:
                  contexto.instituicaoId,
              },

              select:
                PESSOA_SELECT,
            });

          await transacao.bibliotecaAuditoria.create({
            data: {
              instituicaoId:
                contexto.instituicaoId,

              usuarioId:
                usuario.id,

              entidade:
                "BibliotecaAutor",

              entidadeId:
                String(
                  registro.id
                ),

              acao:
                AcaoAuditoriaBiblioteca.CRIAR,

              descricao:
                "Autoridade bibliográfica de pessoa cadastrada.",

              dadosPosteriores: {
                id:
                  registro.id,

                nome:
                  registro.nome,

                nomeOrdenacao:
                  registro.nomeOrdenacao,

                nacionalidade:
                  registro.nacionalidade,

                dataNascimento:
                  registro.dataNascimento
                    ?.toISOString() ||
                  null,

                dataFalecimento:
                  registro.dataFalecimento
                    ?.toISOString() ||
                  null,

                orcid:
                  registro.orcid,

                viaf:
                  registro.viaf,

                isni:
                  registro.isni,

                wikidataId:
                  registro.wikidataId,

                lccn:
                  registro.lccn,

                notaAutoridade:
                  registro.notaAutoridade,

                ativo:
                  registro.ativo,

                variantes:
                  registro.variantes.map(
                    (
                      variante
                    ) => ({
                      id:
                        variante.id,

                      nome:
                        variante.nome,

                      nomeNormalizado:
                        variante.nomeNormalizado,

                      tipo:
                        variante.tipo,

                      idioma:
                        variante.idioma,

                      observacao:
                        variante.observacao,

                      ativo:
                        variante.ativo,
                    })
                  ),
              },

              metadados: {
                origem:
                  "api_admin_biblioteca_autoridades_pessoas",
              },

              ip,
              userAgent,
            },
          });

          return registro;
        },
        {
          maxWait:
            5_000,

          timeout:
            10_000,
        }
      );

    return responder(
      {
        ok: true,

        mensagem:
          "Autoridade bibliográfica cadastrada com sucesso.",

        pessoa,
      },
      201
    );
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}
