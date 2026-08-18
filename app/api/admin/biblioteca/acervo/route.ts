import { randomUUID } from "crypto";

import {
  AcaoAuditoriaBiblioteca,
  BibliotecariaFuncaoAutor,
  ModalidadeAcessoBiblioteca,
  Prisma,
  StatusItemBiblioteca,
  TipoItemBiblioteca,
  StatusArquivoBiblioteca,
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIMITE_MAXIMO_POR_PAGINA = 100;
const LIMITE_AUTORES = 100;
const LIMITE_CATEGORIAS = 100;
const LIMITE_PALAVRAS_CHAVE = 30;

const TIPOS_ITEM = new Set<TipoItemBiblioteca>(
  Object.values(TipoItemBiblioteca)
);

const STATUS_ITEM = new Set<StatusItemBiblioteca>(
  Object.values(StatusItemBiblioteca)
);

const MODALIDADES_ACESSO =
  new Set<ModalidadeAcessoBiblioteca>(
    Object.values(ModalidadeAcessoBiblioteca)
  );

const FUNCOES_AUTOR =
  new Set<BibliotecariaFuncaoAutor>(
    Object.values(BibliotecariaFuncaoAutor)
  );

const ITEM_ACERVO_SELECT = {
  id: true,
  tipo: true,
  status: true,
  modalidade: true,
  titulo: true,
  subtitulo: true,
  tituloAlternativo: true,
  slug: true,
  sinopse: true,
  descricao: true,
  palavrasChave: true,
  isbn10: true,
  isbn13: true,
  issn: true,
  doi: true,
  idioma: true,
  paisPublicacao: true,
  anoPublicacao: true,
  dataPublicacao: true,
  edicao: true,
  volume: true,
  numero: true,
  numeroPaginas: true,
  duracaoSegundos: true,
  classificacaoBibliografica: true,
  codigoChamada: true,
  cdd: true,
  cdu: true,
  capaUrl: true,
  miniaturaUrl: true,
  classificacaoIndicativa: true,
  observacoesInternas: true,
  destaque: true,
  permitirDownload: true,
  permitirAvaliacao: true,
  acessoLivre: true,
  publicadoEm: true,
  arquivadoEm: true,
  criadoEm: true,
  atualizadoEm: true,
  editora: {
    select: {
      id: true,
      nome: true,
    },
  },
  autores: {
    orderBy: [{ ordem: "asc" }, { id: "asc" }],
    select: {
      funcao: true,
      ordem: true,
      autor: {
        select: {
          id: true,
          nome: true,
          nomeOrdenacao: true,
        },
      },
    },
  },
  categorias: {
    orderBy: [{ principal: "desc" }, { id: "asc" }],
    select: {
      principal: true,
      categoria: {
        select: {
          id: true,
          nome: true,
          slug: true,
          cor: true,
          icone: true,
        },
      },
    },
  },
  _count: {
  select: {
    arquivos: {
      where: {
        arquivadoEm:
          null,

        status: {
          not:
            StatusArquivoBiblioteca.ARQUIVADO,
        },
      },
    },

    exemplares:
      true,
  },
},
} satisfies Prisma.BibliotecaItemSelect;

type CorpoCadastro = Record<string, unknown>;

type VinculoAutor = {
  autorId: number;
  funcao: BibliotecariaFuncaoAutor;
  ordem: number;
};

type VinculoCategoria = {
  categoriaId: number;
  principal: boolean;
};

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

function textoObrigatorio(
  valor: unknown,
  campo: string,
  limite: number
) {
  if (typeof valor !== "string") {
    falhar(
      400,
      `O campo ${campo} é obrigatório.`,
      "CAMPO_OBRIGATORIO",
      { campo }
    );
  }

  const texto = valor.trim();

  if (!texto) {
    falhar(
      400,
      `O campo ${campo} é obrigatório.`,
      "CAMPO_OBRIGATORIO",
      { campo }
    );
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
      `O campo ${campo} deve ser um texto.`,
      "CAMPO_INVALIDO",
      { campo }
    );
  }

  const texto = valor.trim();

  if (!texto) return null;

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

function inteiroPositivo(
  valor: unknown,
  campo: string
) {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    falhar(
      400,
      `O campo ${campo} deve ser um número inteiro positivo.`,
      "CAMPO_INVALIDO",
      { campo }
    );
  }

  return numero;
}

function inteiroOpcional(
  valor: unknown,
  campo: string,
  minimo: number,
  maximo: number
): number | null {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero < minimo ||
    numero > maximo
  ) {
    falhar(
      400,
      `O campo ${campo} está fora do intervalo permitido.`,
      "CAMPO_INVALIDO",
      { campo, minimo, maximo }
    );
  }

  return numero;
}

function booleanoOpcional(
  valor: unknown,
  campo: string,
  padrao: boolean
) {
  if (valor === undefined || valor === null) {
    return padrao;
  }

  if (typeof valor !== "boolean") {
    falhar(
      400,
      `O campo ${campo} deve ser verdadeiro ou falso.`,
      "CAMPO_INVALIDO",
      { campo }
    );
  }

  return valor;
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

  if (
    typeof valor !== "string" &&
    !(valor instanceof Date)
  ) {
    falhar(
      400,
      `O campo ${campo} contém uma data inválida.`,
      "DATA_INVALIDA",
      { campo }
    );
  }

  const data =
    valor instanceof Date
      ? new Date(valor.getTime())
      : new Date(valor);

  if (Number.isNaN(data.getTime())) {
    falhar(
      400,
      `O campo ${campo} contém uma data inválida.`,
      "DATA_INVALIDA",
      { campo }
    );
  }

  return data;
}

function enumObrigatorio<T extends string>(
  valor: unknown,
  campo: string,
  permitidos: ReadonlySet<T>
): T {
  const normalizado = String(valor || "")
    .trim()
    .toUpperCase() as T;

  if (!permitidos.has(normalizado)) {
    falhar(
      400,
      `O campo ${campo} possui um valor inválido.`,
      "ENUM_INVALIDO",
      {
        campo,
        valoresPermitidos: Array.from(permitidos),
      }
    );
  }

  return normalizado;
}

function enumOpcional<T extends string>(
  valor: unknown,
  campo: string,
  permitidos: ReadonlySet<T>,
  padrao: T
): T {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return padrao;
  }

  return enumObrigatorio(
    valor,
    campo,
    permitidos
  );
}

function normalizarIdentificador(
  valor: unknown,
  campo: string,
  limite: number
) {
  return textoOpcional(valor, campo, limite);
}

function normalizarPalavrasChave(
  valor: unknown
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return [];
  }

  const valores = Array.isArray(valor)
    ? valor
    : typeof valor === "string"
      ? valor.split(",")
      : null;

  if (!valores) {
    falhar(
      400,
      "O campo palavrasChave deve ser uma lista de textos.",
      "CAMPO_INVALIDO",
      { campo: "palavrasChave" }
    );
  }

  const normalizadas = Array.from(
    new Set(
      valores
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );

  if (normalizadas.length > LIMITE_PALAVRAS_CHAVE) {
    falhar(
      400,
      "Foram informadas palavras-chave demais.",
      "LIMITE_PALAVRAS_CHAVE",
      { limite: LIMITE_PALAVRAS_CHAVE }
    );
  }

  const palavraLonga = normalizadas.find(
    (item) => item.length > 80
  );

  if (palavraLonga) {
    falhar(
      400,
      "Uma palavra-chave ultrapassa o limite de 80 caracteres.",
      "PALAVRA_CHAVE_INVALIDA"
    );
  }

  return normalizadas;
}

function normalizarAutores(
  valor: unknown
): VinculoAutor[] {
  if (valor === undefined || valor === null) {
    return [];
  }

  if (!Array.isArray(valor)) {
    falhar(
      400,
      "O campo autores deve ser uma lista.",
      "AUTORES_INVALIDOS"
    );
  }

  if (valor.length > LIMITE_AUTORES) {
    falhar(
      400,
      "A quantidade de autores ultrapassa o limite permitido.",
      "LIMITE_AUTORES",
      { limite: LIMITE_AUTORES }
    );
  }

  const resultado: VinculoAutor[] = [];
  const chaves = new Set<string>();

  valor.forEach((entrada, indice) => {
    const objeto =
      typeof entrada === "object" &&
      entrada !== null &&
      !Array.isArray(entrada)
        ? (entrada as Record<string, unknown>)
        : null;

    const autorId = inteiroPositivo(
      objeto?.autorId ?? entrada,
      `autores[${indice}].autorId`
    );

    const funcao = enumOpcional(
      objeto?.funcao,
      `autores[${indice}].funcao`,
      FUNCOES_AUTOR,
      BibliotecariaFuncaoAutor.AUTOR
    );

    const ordem =
      objeto?.ordem === undefined
        ? indice
        : inteiroOpcional(
            objeto.ordem,
            `autores[${indice}].ordem`,
            0,
            10_000
          ) ?? indice;

    const chave = `${autorId}:${funcao}`;

    if (!chaves.has(chave)) {
      chaves.add(chave);
      resultado.push({ autorId, funcao, ordem });
    }
  });

  return resultado;
}

function normalizarCategorias(
  valor: unknown
): VinculoCategoria[] {
  if (valor === undefined || valor === null) {
    return [];
  }

  if (!Array.isArray(valor)) {
    falhar(
      400,
      "O campo categorias deve ser uma lista.",
      "CATEGORIAS_INVALIDAS"
    );
  }

  if (valor.length > LIMITE_CATEGORIAS) {
    falhar(
      400,
      "A quantidade de categorias ultrapassa o limite permitido.",
      "LIMITE_CATEGORIAS",
      { limite: LIMITE_CATEGORIAS }
    );
  }

  const resultado: VinculoCategoria[] = [];
  const ids = new Set<number>();
  let quantidadePrincipais = 0;

  valor.forEach((entrada, indice) => {
    const objeto =
      typeof entrada === "object" &&
      entrada !== null &&
      !Array.isArray(entrada)
        ? (entrada as Record<string, unknown>)
        : null;

    const categoriaId = inteiroPositivo(
      objeto?.categoriaId ?? entrada,
      `categorias[${indice}].categoriaId`
    );

    const principal = booleanoOpcional(
      objeto?.principal,
      `categorias[${indice}].principal`,
      false
    );

    if (ids.has(categoriaId)) return;

    ids.add(categoriaId);

    if (principal) quantidadePrincipais += 1;

    resultado.push({ categoriaId, principal });
  });

  if (quantidadePrincipais > 1) {
    falhar(
      400,
      "Somente uma categoria pode ser marcada como principal.",
      "MULTIPLAS_CATEGORIAS_PRINCIPAIS"
    );
  }

  return resultado;
}

function gerarSlug(titulo: string) {
  const base = titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 170) || "item";

  return `${base}-${randomUUID().slice(0, 8)}`;
}

function numeroQuery(
  valor: string | null,
  padrao: number,
  maximo: number
) {
  if (!valor) return padrao;

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    return padrao;
  }

  return Math.min(numero, maximo);
}

function enumQuery<T extends string>(
  valor: string | null,
  campo: string,
  permitidos: ReadonlySet<T>
): T | undefined {
  if (!valor || valor.toLowerCase() === "todos") {
    return undefined;
  }

  return enumObrigatorio(valor, campo, permitidos);
}

async function lerCorpo(
  request: NextRequest
): Promise<CorpoCadastro> {
  try {
    const corpo = await request.json();

    if (
      typeof corpo !== "object" ||
      corpo === null ||
      Array.isArray(corpo)
    ) {
      falhar(
        400,
        "O corpo da requisição deve ser um objeto JSON.",
        "CORPO_INVALIDO"
      );
    }

    return corpo as CorpoCadastro;
  } catch (erro) {
    if (erro instanceof ErroBiblioteca) {
      throw erro;
    }

    falhar(
      400,
      "O corpo da requisição contém um JSON inválido.",
      "JSON_INVALIDO"
    );
  }
}

function obterIp(request: NextRequest) {
  const encaminhado = request.headers.get(
    "x-forwarded-for"
  );

  return (
    encaminhado?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

function responderErro(erro: unknown) {
  if (
    erro instanceof
      Prisma.PrismaClientKnownRequestError &&
    erro.code === "P2002"
  ) {
    return responder(
      {
        error:
          "Já existe um registro com estes dados na biblioteca.",
        codigo: "REGISTRO_DUPLICADO",
      },
      409
    );
  }

  const resposta = respostaErroBiblioteca(erro);

  return responder(
    resposta.corpo,
    resposta.status
  );
}

export async function GET(request: NextRequest) {
  try {
    const usuario = await getUserFromToken();
    const contexto = await obterContextoBiblioteca(
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

    const parametros = request.nextUrl.searchParams;
    const pagina = numeroQuery(
      parametros.get("pagina"),
      1,
      Number.MAX_SAFE_INTEGER
    );
    const porPagina = numeroQuery(
      parametros.get("porPagina"),
      20,
      LIMITE_MAXIMO_POR_PAGINA
    );
    const busca = textoOpcional(
      parametros.get("busca"),
      "busca",
      150
    );
    const tipo = enumQuery(
      parametros.get("tipo"),
      "tipo",
      TIPOS_ITEM
    );
    const status = enumQuery(
      parametros.get("status"),
      "status",
      STATUS_ITEM
    );

    const onde: Prisma.BibliotecaItemWhereInput = {
      instituicaoId: contexto.instituicaoId,
      ...(tipo ? { tipo } : {}),
      ...(status ? { status } : {}),
      ...(busca
        ? {
            OR: [
              {
                titulo: {
                  contains: busca,
                  mode: "insensitive",
                },
              },
              {
                subtitulo: {
                  contains: busca,
                  mode: "insensitive",
                },
              },
              {
                tituloAlternativo: {
                  contains: busca,
                  mode: "insensitive",
                },
              },
              { isbn10: { contains: busca } },
              { isbn13: { contains: busca } },
              { issn: { contains: busca } },
              {
                doi: {
                  contains: busca,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const [total, itens] = await prisma.$transaction([
      prisma.bibliotecaItem.count({
        where: onde,
      }),
      prisma.bibliotecaItem.findMany({
        where: onde,
        orderBy: [
          { atualizadoEm: "desc" },
          { id: "desc" },
        ],
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        select: ITEM_ACERVO_SELECT,
      }),
    ]);

    return responder({
      ok: true,
      itens,
      paginacao: {
        pagina,
        porPagina,
        total,
        totalPaginas: Math.ceil(total / porPagina),
      },
      filtros: {
        busca,
        tipo: tipo || null,
        status: status || null,
      },
    });
  } catch (erro) {
    return responderErro(erro);
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = await getUserFromToken();
    const contexto = await obterContextoBiblioteca(
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
        "Não é permitido cadastrar itens durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.catalogo.criar"
    );

    const corpo = await lerCorpo(request);
    const titulo = textoObrigatorio(
      corpo.titulo,
      "titulo",
      240
    );
    const tipo = enumObrigatorio(
      corpo.tipo,
      "tipo",
      TIPOS_ITEM
    );
    const modalidade = enumOpcional(
      corpo.modalidade,
      "modalidade",
      MODALIDADES_ACESSO,
      ModalidadeAcessoBiblioteca.LEITURA_INTERNA
    );
    const autores = normalizarAutores(
      corpo.autores
    );
    const categorias = normalizarCategorias(
      corpo.categorias
    );
    const editoraId =
      corpo.editoraId === undefined ||
      corpo.editoraId === null ||
      corpo.editoraId === ""
        ? null
        : inteiroPositivo(
            corpo.editoraId,
            "editoraId"
          );

    const isbn10 = normalizarIdentificador(
      corpo.isbn10,
      "isbn10",
      32
    );
    const isbn13 = normalizarIdentificador(
      corpo.isbn13,
      "isbn13",
      32
    );
    const doi = normalizarIdentificador(
      corpo.doi,
      "doi",
      255
    );

    const idsAutores = Array.from(
      new Set(autores.map((item) => item.autorId))
    );
    const idsCategorias = categorias.map(
      (item) => item.categoriaId
    );

    const filtrosDuplicidade:
      Prisma.BibliotecaItemWhereInput[] = [];

    if (isbn10) filtrosDuplicidade.push({ isbn10 });
    if (isbn13) filtrosDuplicidade.push({ isbn13 });
    if (doi) {
      filtrosDuplicidade.push({
        doi: {
          equals: doi,
          mode: "insensitive",
        },
      });
    }

    const [
      editora,
      autoresExistentes,
      categoriasExistentes,
      duplicado,
    ] = await Promise.all([
      editoraId
        ? prisma.bibliotecaEditora.findFirst({
            where: {
              id: editoraId,
              instituicaoId:
                contexto.instituicaoId,
              ativo: true,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      idsAutores.length
        ? prisma.bibliotecaAutor.findMany({
            where: {
              instituicaoId:
                contexto.instituicaoId,
              id: { in: idsAutores },
              ativo: true,
            },
            select: { id: true },
          })
        : Promise.resolve([]),
      idsCategorias.length
        ? prisma.bibliotecaCategoria.findMany({
            where: {
              instituicaoId:
                contexto.instituicaoId,
              id: { in: idsCategorias },
              ativo: true,
            },
            select: { id: true },
          })
        : Promise.resolve([]),
      filtrosDuplicidade.length
        ? prisma.bibliotecaItem.findFirst({
            where: {
              instituicaoId:
                contexto.instituicaoId,
              OR: filtrosDuplicidade,
            },
            select: {
              id: true,
              titulo: true,
              status: true,
            },
          })
        : Promise.resolve(null),
    ]);

    if (editoraId && !editora) {
      falhar(
        400,
        "A editora informada não pertence a esta instituição ou está inativa.",
        "EDITORA_INVALIDA"
      );
    }

    const autoresEncontrados = new Set(
      autoresExistentes.map((item) => item.id)
    );
    const autoresInvalidos = idsAutores.filter(
      (id) => !autoresEncontrados.has(id)
    );

    if (autoresInvalidos.length) {
      falhar(
        400,
        "Um ou mais autores não pertencem a esta instituição ou estão inativos.",
        "AUTORES_INVALIDOS",
        { ids: autoresInvalidos }
      );
    }

    const categoriasEncontradas = new Set(
      categoriasExistentes.map((item) => item.id)
    );
    const categoriasInvalidas =
      idsCategorias.filter(
        (id) => !categoriasEncontradas.has(id)
      );

    if (categoriasInvalidas.length) {
      falhar(
        400,
        "Uma ou mais categorias não pertencem a esta instituição ou estão inativas.",
        "CATEGORIAS_INVALIDAS",
        { ids: categoriasInvalidas }
      );
    }

    if (duplicado) {
      falhar(
        409,
        "Já existe um item com o mesmo ISBN ou DOI nesta biblioteca.",
        "ITEM_POSSIVELMENTE_DUPLICADO",
        {
          itemId: duplicado.id,
          titulo: duplicado.titulo,
          status: duplicado.status,
        }
      );
    }

    const permitirDownloadSolicitado =
      booleanoOpcional(
        corpo.permitirDownload,
        "permitirDownload",
        false
      );
    const permitirDownload = Boolean(
      contexto.configuracao?.permitirDownload &&
        permitirDownloadSolicitado
    );

    if (
      modalidade ===
        ModalidadeAcessoBiblioteca.DOWNLOAD_AUTORIZADO &&
      !contexto.configuracao?.permitirDownload
    ) {
      falhar(
        400,
        "O download está desativado nas configurações da biblioteca.",
        "DOWNLOAD_DESATIVADO"
      );
    }

    const agora = new Date();
    const anoMaximo = agora.getFullYear() + 2;
    const ip = obterIp(request);
    const userAgent = request.headers
      .get("user-agent")
      ?.slice(0, 2_000) || null;

    const item = await prisma.$transaction(
      async (transacao) => {
        const criado =
          await transacao.bibliotecaItem.create({
            data: {
              instituicaoId:
                contexto.instituicaoId,
              tipo,
              status:
                StatusItemBiblioteca.RASCUNHO,
              modalidade,
              titulo,
              subtitulo: textoOpcional(
                corpo.subtitulo,
                "subtitulo",
                240
              ),
              tituloAlternativo: textoOpcional(
                corpo.tituloAlternativo,
                "tituloAlternativo",
                240
              ),
              slug: gerarSlug(titulo),
              sinopse: textoOpcional(
                corpo.sinopse,
                "sinopse",
                20_000
              ),
              descricao: textoOpcional(
                corpo.descricao,
                "descricao",
                20_000
              ),
              palavrasChave: normalizarPalavrasChave(
                corpo.palavrasChave
              ),
              isbn10,
              isbn13,
              issn: normalizarIdentificador(
                corpo.issn,
                "issn",
                32
              ),
              doi,
              idioma:
                textoOpcional(
                  corpo.idioma,
                  "idioma",
                  30
                ) || "pt-BR",
              paisPublicacao: textoOpcional(
                corpo.paisPublicacao,
                "paisPublicacao",
                100
              ),
              anoPublicacao: inteiroOpcional(
                corpo.anoPublicacao,
                "anoPublicacao",
                1,
                anoMaximo
              ),
              dataPublicacao: dataOpcional(
                corpo.dataPublicacao,
                "dataPublicacao"
              ),
              edicao: textoOpcional(
                corpo.edicao,
                "edicao",
                80
              ),
              volume: textoOpcional(
                corpo.volume,
                "volume",
                80
              ),
              numero: textoOpcional(
                corpo.numero,
                "numero",
                80
              ),
              numeroPaginas: inteiroOpcional(
                corpo.numeroPaginas,
                "numeroPaginas",
                1,
                10_000_000
              ),
              duracaoSegundos: inteiroOpcional(
                corpo.duracaoSegundos,
                "duracaoSegundos",
                1,
                100_000_000
              ),
              classificacaoBibliografica:
                textoOpcional(
                  corpo.classificacaoBibliografica,
                  "classificacaoBibliografica",
                  120
                ),
              codigoChamada: textoOpcional(
                corpo.codigoChamada,
                "codigoChamada",
                120
              ),
              cdd: textoOpcional(
                corpo.cdd,
                "cdd",
                80
              ),
              cdu: textoOpcional(
                corpo.cdu,
                "cdu",
                80
              ),
              classificacaoIndicativa:
                textoOpcional(
                  corpo.classificacaoIndicativa,
                  "classificacaoIndicativa",
                  80
                ),
              observacoesInternas: textoOpcional(
                corpo.observacoesInternas,
                "observacoesInternas",
                20_000
              ),
              destaque: booleanoOpcional(
                corpo.destaque,
                "destaque",
                false
              ),
              permitirDownload,
              permitirAvaliacao: booleanoOpcional(
                corpo.permitirAvaliacao,
                "permitirAvaliacao",
                contexto.configuracao
                  ?.permitirAvaliacao ?? true
              ),
              acessoLivre: booleanoOpcional(
                corpo.acessoLivre,
                "acessoLivre",
                modalidade ===
                  ModalidadeAcessoBiblioteca.ACESSO_LIVRE
              ),
              editoraId,
              criadoPorId: usuario.id,
              atualizadoPorId: usuario.id,
            },
            select: {
              id: true,
              titulo: true,
              slug: true,
              tipo: true,
              status: true,
              modalidade: true,
            },
          });

        if (autores.length) {
          await transacao.bibliotecaItemAutor.createMany({
            data: autores.map((autor) => ({
              instituicaoId:
                contexto.instituicaoId,
              itemId: criado.id,
              autorId: autor.autorId,
              funcao: autor.funcao,
              ordem: autor.ordem,
            })),
          });
        }

        if (categorias.length) {
          await transacao.bibliotecaItemCategoria.createMany(
            {
              data: categorias.map((categoria) => ({
                instituicaoId:
                  contexto.instituicaoId,
                itemId: criado.id,
                categoriaId:
                  categoria.categoriaId,
                principal: categoria.principal,
              })),
            }
          );
        }

        await transacao.bibliotecaAuditoria.create({
          data: {
            instituicaoId:
              contexto.instituicaoId,
            usuarioId: usuario.id,
            entidade: "BibliotecaItem",
            entidadeId: String(criado.id),
            acao: AcaoAuditoriaBiblioteca.CRIAR,
            descricao:
              "Item cadastrado no acervo como rascunho.",
            dadosPosteriores: {
              id: criado.id,
              titulo: criado.titulo,
              slug: criado.slug,
              tipo: criado.tipo,
              status: criado.status,
              modalidade: criado.modalidade,
              autores: autores.map((autor) => ({
                autorId: autor.autorId,
                funcao: autor.funcao,
                ordem: autor.ordem,
              })),
              categorias,
              editoraId,
            },
            metadados: {
              origem: "api_admin_biblioteca_acervo",
            },
            ip,
            userAgent,
          },
        });

        return transacao.bibliotecaItem.findUniqueOrThrow(
          {
            where: { id: criado.id },
            select: ITEM_ACERVO_SELECT,
          }
        );
      },
      {
        maxWait: 5_000,
        timeout: 10_000,
      }
    );

    return responder(
      {
        ok: true,
        mensagem:
          "Item cadastrado no acervo como rascunho.",
        item,
      },
      201
    );
  } catch (erro) {
    return responderErro(erro);
  }
}