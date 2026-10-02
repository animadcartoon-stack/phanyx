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
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    "[biblioteca/autoridades/pessoas/autorId]",
    erro
  );

  return responder(
    {
      error:
        "Não foi possível processar a autoridade bibliográfica.",
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

function obterAutorId(
  valor: string
) {
  const id =
    Number(valor);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    falhar(
      400,
      "Identificador da autoridade inválido.",
      "AUTORIDADE_ID_INVALIDO"
    );
  }

  return id;
}

function campoPresente(
  corpo: Record<string, unknown>,
  campo: string
) {
  return Object.prototype.hasOwnProperty.call(
    corpo,
    campo
  );
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

function booleano(
  valor: unknown,
  campo: string
) {
  if (
    typeof valor !== "boolean"
  ) {
    falhar(
      400,
      `O campo ${campo} deve ser booleano.`,
      "CAMPO_BOOLEANO_INVALIDO",
      { campo }
    );
  }

  return valor;
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
  if (!Array.isArray(valor)) {
    falhar(
      400,
      "O campo variantes deve ser uma lista.",
      "VARIANTES_INVALIDAS"
    );
  }

  if (
    valor.length > 50
  ) {
    falhar(
      400,
      "A quantidade de variantes ultrapassa o limite permitido.",
      "MUITAS_VARIANTES",
      { limite: 50 }
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

      if (
        !nomeNormalizado
      ) {
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
    orderBy: [
      {
        ativo:
          "desc" as const,
      },
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
      criadoEm: true,
      atualizadoEm: true,
    },
  },

  _count: {
    select: {
      itens: true,
      variantes: true,
    },
  },
} satisfies Prisma.BibliotecaAutorSelect;

function snapshot(
  pessoa: {
    id: number;
    nome: string;
    nomeOrdenacao: string | null;
    biografia: string | null;
    nacionalidade: string | null;
    dataNascimento: Date | null;
    dataFalecimento: Date | null;
    fotoUrl: string | null;
    siteUrl: string | null;
    orcid: string | null;
    viaf: string | null;
    isni: string | null;
    wikidataId: string | null;
    lccn: string | null;
    notaAutoridade: string | null;
    ativo: boolean;
    variantes: Array<{
      id: number;
      nome: string;
      nomeNormalizado: string;
      tipo: TipoVarianteAutorBiblioteca;
      idioma: string | null;
      observacao: string | null;
      ativo: boolean;
    }>;
  }
) {
  return {
    id:
      pessoa.id,

    nome:
      pessoa.nome,

    nomeOrdenacao:
      pessoa.nomeOrdenacao,

    biografia:
      pessoa.biografia,

    nacionalidade:
      pessoa.nacionalidade,

    dataNascimento:
      pessoa.dataNascimento
        ?.toISOString() ||
      null,

    dataFalecimento:
      pessoa.dataFalecimento
        ?.toISOString() ||
      null,

    fotoUrl:
      pessoa.fotoUrl,

    siteUrl:
      pessoa.siteUrl,

    orcid:
      pessoa.orcid,

    viaf:
      pessoa.viaf,

    isni:
      pessoa.isni,

    wikidataId:
      pessoa.wikidataId,

    lccn:
      pessoa.lccn,

    notaAutoridade:
      pessoa.notaAutoridade,

    ativo:
      pessoa.ativo,

    variantes:
      pessoa.variantes.map(
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
  };
}

export async function GET(
  _request: NextRequest,
  context: {
    params: {
      autorId: string;
    };
  }
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

    const autorId =
      obterAutorId(
        context.params.autorId
      );

    const pessoa =
      await prisma.bibliotecaAutor.findFirst({
        where: {
          id:
            autorId,

          instituicaoId:
            contexto.instituicaoId,
        },

        select:
          PESSOA_SELECT,
      });

    if (!pessoa) {
      falhar(
        404,
        "Autoridade bibliográfica não encontrada.",
        "AUTORIDADE_NAO_ENCONTRADA"
      );
    }

    return responder({
      ok: true,
      pessoa,
    });
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: {
      autorId: string;
    };
  }
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
      "biblioteca.catalogo.editar"
    );

    const autorId =
      obterAutorId(
        context.params.autorId
      );

    const atual =
      await prisma.bibliotecaAutor.findFirst({
        where: {
          id:
            autorId,

          instituicaoId:
            contexto.instituicaoId,
        },

        select:
          PESSOA_SELECT,
      });

    if (!atual) {
      falhar(
        404,
        "Autoridade bibliográfica não encontrada.",
        "AUTORIDADE_NAO_ENCONTRADA"
      );
    }

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
      campoPresente(
        corpo,
        "nome"
      )
        ? textoObrigatorio(
            corpo.nome,
            "nome",
            240
          )
        : atual.nome;

    const nomeOrdenacao =
      campoPresente(
        corpo,
        "nomeOrdenacao"
      )
        ? textoOpcional(
            corpo.nomeOrdenacao,
            "nomeOrdenacao",
            240
          )
        : atual.nomeOrdenacao;

    const biografia =
      campoPresente(
        corpo,
        "biografia"
      )
        ? textoOpcional(
            corpo.biografia,
            "biografia",
            20_000
          )
        : atual.biografia;

    const nacionalidade =
      campoPresente(
        corpo,
        "nacionalidade"
      )
        ? textoOpcional(
            corpo.nacionalidade,
            "nacionalidade",
            120
          )
        : atual.nacionalidade;

    const dataNascimento =
      campoPresente(
        corpo,
        "dataNascimento"
      )
        ? dataOpcional(
            corpo.dataNascimento,
            "dataNascimento"
          )
        : atual.dataNascimento;

    const dataFalecimento =
      campoPresente(
        corpo,
        "dataFalecimento"
      )
        ? dataOpcional(
            corpo.dataFalecimento,
            "dataFalecimento"
          )
        : atual.dataFalecimento;

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
      campoPresente(
        corpo,
        "fotoUrl"
      )
        ? urlOpcional(
            corpo.fotoUrl,
            "fotoUrl"
          )
        : atual.fotoUrl;

    const siteUrl =
      campoPresente(
        corpo,
        "siteUrl"
      )
        ? urlOpcional(
            corpo.siteUrl,
            "siteUrl"
          )
        : atual.siteUrl;

    const orcid =
      campoPresente(
        corpo,
        "orcid"
      )
        ? normalizarOrcid(
            corpo.orcid
          )
        : atual.orcid;

    const viaf =
      campoPresente(
        corpo,
        "viaf"
      )
        ? normalizarViaf(
            corpo.viaf
          )
        : atual.viaf;

    const isni =
      campoPresente(
        corpo,
        "isni"
      )
        ? normalizarIsni(
            corpo.isni
          )
        : atual.isni;

    const wikidataId =
      campoPresente(
        corpo,
        "wikidataId"
      )
        ? normalizarWikidata(
            corpo.wikidataId
          )
        : atual.wikidataId;

    const lccn =
      campoPresente(
        corpo,
        "lccn"
      )
        ? normalizarLccn(
            corpo.lccn
          )
        : atual.lccn;

    const notaAutoridade =
      campoPresente(
        corpo,
        "notaAutoridade"
      )
        ? textoOpcional(
            corpo.notaAutoridade,
            "notaAutoridade",
            20_000
          )
        : atual.notaAutoridade;

    const ativo =
      campoPresente(
        corpo,
        "ativo"
      )
        ? booleano(
            corpo.ativo,
            "ativo"
          )
        : atual.ativo;

    const alterarVariantes =
      campoPresente(
        corpo,
        "variantes"
      );

    const variantes =
      alterarVariantes
        ? normalizarVariantes(
            corpo.variantes,
            nome
          )
        : null;

    const nomeNormalizado =
      normalizarBusca(
        nome
      );

    const variantesParaValidacao =
      variantes ||
      atual.variantes
        .filter(
          (
            variante
          ) =>
            variante.ativo
        )
        .map(
          (
            variante
          ) => ({
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
          })
        );

    if (
      variantesParaValidacao.some(
        (
          variante
        ) =>
          variante.nomeNormalizado ===
          nomeNormalizado
      )
    ) {
      falhar(
        400,
        "Uma variante não pode ser igual ao nome autorizado.",
        "VARIANTE_IGUAL_NOME_AUTORIZADO"
      );
    }

    const filtrosDuplicidade:
      Prisma.BibliotecaAutorWhereInput[] =
        [
          {
            nome: {
              equals:
                nome,
              mode:
                "insensitive",
            },
          },
          {
            variantes: {
              some: {
                ativo:
                  true,

                nomeNormalizado:
                  nomeNormalizado,
              },
            },
          },
        ];

    for (
      const variante
      of variantesParaValidacao
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
              ativo:
                true,

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
          equals:
            orcid,

          mode:
            "insensitive",
        },
      });
    }

    if (viaf) {
      filtrosDuplicidade.push({
        viaf: {
          equals:
            viaf,

          mode:
            "insensitive",
        },
      });
    }

    if (isni) {
      filtrosDuplicidade.push({
        isni: {
          equals:
            isni,

          mode:
            "insensitive",
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
          equals:
            lccn,

          mode:
            "insensitive",
        },
      });
    }

    const possivelDuplicado =
      await prisma.bibliotecaAutor.findFirst({
        where: {
          instituicaoId:
            contexto.instituicaoId,

          id: {
            not:
              autorId,
          },

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

    if (
      possivelDuplicado
    ) {
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
          await transacao.bibliotecaAutor.update({
            where: {
              id:
                autorId,
            },

            data: {
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
              ativo,
            },
          });

          if (
            alterarVariantes &&
            variantes
          ) {
            const existentesPorNome =
              new Map<
                string,
                (typeof atual.variantes)[number]
              >(
                atual.variantes.map(
                  (
                    variante
                  ) => [
                    variante.nomeNormalizado,
                    variante,
                  ] as const
                )
              );

            const idsMantidos:
              number[] = [];

            for (
              const variante
              of variantes
            ) {
              const existente =
                existentesPorNome.get(
                  variante.nomeNormalizado
                );

              if (existente) {
                await transacao.bibliotecaAutorVariante.update({
                  where: {
                    id:
                      existente.id,
                  },

                  data: {
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
                  },
                });

                idsMantidos.push(
                  existente.id
                );

                continue;
              }

              const criada =
                await transacao.bibliotecaAutorVariante.create({
                  data: {
                    instituicaoId:
                      contexto.instituicaoId,

                    autorId:
                      autorId,

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
                  },

                  select: {
                    id:
                      true,
                  },
                });

              idsMantidos.push(
                criada.id
              );
            }

            await transacao.bibliotecaAutorVariante.updateMany({
              where: {
                instituicaoId:
                  contexto.instituicaoId,

                autorId:
                  autorId,

                ...(idsMantidos.length
                  ? {
                      id: {
                        notIn:
                          idsMantidos,
                      },
                    }
                  : {}),
              },

              data: {
                ativo:
                  false,
              },
            });
          }

          const atualizado =
            await transacao.bibliotecaAutor.findFirstOrThrow({
              where: {
                id:
                  autorId,

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
                  autorId
                ),

              acao:
                AcaoAuditoriaBiblioteca.ATUALIZAR,

              descricao:
                "Autoridade bibliográfica de pessoa atualizada.",

              dadosAnteriores:
                snapshot(
                  atual
                ),

              dadosPosteriores:
                snapshot(
                  atualizado
                ),

              metadados: {
                origem:
                  "api_admin_biblioteca_autoridades_pessoas",

                variantesSubstituidas:
                  alterarVariantes,
              },

              ip,
              userAgent,
            },
          });

          return atualizado;
        },
        {
          maxWait:
            5_000,

          timeout:
            10_000,
        }
      );

    return responder({
      ok: true,

      mensagem:
        "Autoridade bibliográfica atualizada com sucesso.",

      pessoa,
    });
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}
