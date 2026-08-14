import {
  AcaoAuditoriaBiblioteca,
  ModalidadeAcessoBiblioteca,
  Prisma,
  StatusItemBiblioteca,
  TipoItemBiblioteca,
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

type ContextoRota = {
  params: {
    itemId: string;
  };
};

type CorpoEdicao = Record<string, unknown>;

const LIMITE_PALAVRAS_CHAVE = 30;

const TIPOS_ITEM = new Set<TipoItemBiblioteca>(
  Object.values(TipoItemBiblioteca)
);

const MODALIDADES_ACESSO =
  new Set<ModalidadeAcessoBiblioteca>(
    Object.values(ModalidadeAcessoBiblioteca)
  );

const ITEM_DETALHE_SELECT = {
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
  motivoArquivamento: true,
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
  arquivos: {
    orderBy: [{ principal: "desc" }, { id: "asc" }],
    select: {
      id: true,
      tipo: true,
      status: true,
      nomeOriginal: true,
      extensao: true,
      mimeType: true,
      tamanhoBytes: true,
      principal: true,
      enviadoEm: true,
      atualizadoEm: true,
    },
  },
  exemplares: {
    orderBy: [{ id: "asc" }],
    select: {
      id: true,
      tipo: true,
      codigoInterno: true,
      codigoBarras: true,
      numeroTombo: true,
      status: true,
      setor: true,
      sala: true,
      estante: true,
      prateleira: true,
      localizacaoCompleta: true,
      criadoEm: true,
      atualizadoEm: true,
    },
  },
  _count: {
    select: {
      arquivos: true,
      exemplares: true,
    },
  },
} satisfies Prisma.BibliotecaItemSelect;

type ItemDetalhe = Prisma.BibliotecaItemGetPayload<{
  select: typeof ITEM_DETALHE_SELECT;
}>;

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

function obterItemId(params: ContextoRota["params"]) {
  const itemId = Number(params.itemId);

  if (!Number.isInteger(itemId) || itemId <= 0) {
    falhar(
      400,
      "O identificador do item é inválido.",
      "ITEM_ID_INVALIDO"
    );
  }

  return itemId;
}

function textoObrigatorio(
  valor: unknown,
  campo: string,
  limite: number
) {
  if (typeof valor !== "string" || !valor.trim()) {
    falhar(
      400,
      `O campo ${campo} é obrigatório.`,
      "CAMPO_OBRIGATORIO",
      { campo }
    );
  }

  const texto = valor.trim();

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

function booleanoObrigatorio(
  valor: unknown,
  campo: string
) {
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

  if (typeof valor !== "string") {
    falhar(
      400,
      `O campo ${campo} contém uma data inválida.`,
      "DATA_INVALIDA",
      { campo }
    );
  }

  const data = new Date(valor);

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

function normalizarPalavrasChave(valor: unknown) {
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

  if (normalizadas.some((item) => item.length > 80)) {
    falhar(
      400,
      "Uma palavra-chave ultrapassa o limite de 80 caracteres.",
      "PALAVRA_CHAVE_INVALIDA"
    );
  }

  return normalizadas;
}

async function lerCorpo(
  request: NextRequest
): Promise<CorpoEdicao> {
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

    return corpo as CorpoEdicao;
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

function serializarItemParaAuditoria(
  item: ItemDetalhe
) {
  return {
    id: item.id,
    tipo: item.tipo,
    status: item.status,
    modalidade: item.modalidade,
    titulo: item.titulo,
    subtitulo: item.subtitulo,
    tituloAlternativo: item.tituloAlternativo,
    slug: item.slug,
    sinopse: item.sinopse,
    descricao: item.descricao,
    palavrasChave: item.palavrasChave,
    isbn10: item.isbn10,
    isbn13: item.isbn13,
    issn: item.issn,
    doi: item.doi,
    idioma: item.idioma,
    paisPublicacao: item.paisPublicacao,
    anoPublicacao: item.anoPublicacao,
    dataPublicacao:
      item.dataPublicacao?.toISOString() || null,
    edicao: item.edicao,
    volume: item.volume,
    numero: item.numero,
    numeroPaginas: item.numeroPaginas,
    duracaoSegundos: item.duracaoSegundos,
    classificacaoBibliografica:
      item.classificacaoBibliografica,
    codigoChamada: item.codigoChamada,
    cdd: item.cdd,
    cdu: item.cdu,
    capaUrl: item.capaUrl,
    miniaturaUrl: item.miniaturaUrl,
    classificacaoIndicativa:
      item.classificacaoIndicativa,
    observacoesInternas: item.observacoesInternas,
    destaque: item.destaque,
    permitirDownload: item.permitirDownload,
    permitirAvaliacao: item.permitirAvaliacao,
    acessoLivre: item.acessoLivre,
    editoraId: item.editora?.id || null,
    autores: item.autores.map((vinculo) => ({
      autorId: vinculo.autor.id,
      funcao: vinculo.funcao,
      ordem: vinculo.ordem,
    })),
    categorias: item.categorias.map((vinculo) => ({
      categoriaId: vinculo.categoria.id,
      principal: vinculo.principal,
    })),
  };
}

function serializarItemParaResposta(item: ItemDetalhe) {
  return {
    ...item,
    arquivos: item.arquivos.map((arquivo) => ({
      ...arquivo,
      tamanhoBytes: arquivo.tamanhoBytes.toString(),
    })),
  };
}

async function buscarItem(
  itemId: number,
  instituicaoId: number
) {
  return prisma.bibliotecaItem.findFirst({
    where: {
      id: itemId,
      instituicaoId,
    },
    select: ITEM_DETALHE_SELECT,
  });
}

export async function GET(
  _request: NextRequest,
  { params }: ContextoRota
) {
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

    const itemId = obterItemId(params);
    const item = await buscarItem(
      itemId,
      contexto.instituicaoId
    );

    if (!item) {
      falhar(
        404,
        "Item não encontrado nesta biblioteca.",
        "ITEM_NAO_ENCONTRADO"
      );
    }

    let podeEditar =
      !usuario.impersonacao &&
      item.status !== StatusItemBiblioteca.ARQUIVADO;

    if (podeEditar) {
      try {
        exigirPermissaoBiblioteca(
          usuario,
          contexto,
          "biblioteca.catalogo.editar"
        );
      } catch {
        podeEditar = false;
      }
    }

    return responder({
      ok: true,
      item: serializarItemParaResposta(item),
      permissoes: {
        podeEditar,
        impersonacao: usuario.impersonacao,
      },
      configuracao: {
        permitirDownload:
          contexto.configuracao?.permitirDownload ??
          false,
      },
    });
  } catch (erro) {
    return responderErro(erro);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: ContextoRota
) {
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
        "Não é permitido editar itens durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.catalogo.editar"
    );

    const itemId = obterItemId(params);
    const anterior = await buscarItem(
      itemId,
      contexto.instituicaoId
    );

    if (!anterior) {
      falhar(
        404,
        "Item não encontrado nesta biblioteca.",
        "ITEM_NAO_ENCONTRADO"
      );
    }

    if (
      anterior.status === StatusItemBiblioteca.ARQUIVADO
    ) {
      falhar(
        409,
        "Restaure o item antes de editar seus dados.",
        "ITEM_ARQUIVADO"
      );
    }

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
    const modalidade = enumObrigatorio(
      corpo.modalidade,
      "modalidade",
      MODALIDADES_ACESSO
    );
    const isbn10 = textoOpcional(
      corpo.isbn10,
      "isbn10",
      32
    );
    const isbn13 = textoOpcional(
      corpo.isbn13,
      "isbn13",
      32
    );
    const doi = textoOpcional(
      corpo.doi,
      "doi",
      255
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

    if (filtrosDuplicidade.length) {
      const duplicado =
        await prisma.bibliotecaItem.findFirst({
          where: {
            instituicaoId:
              contexto.instituicaoId,
            id: { not: itemId },
            OR: filtrosDuplicidade,
          },
          select: {
            id: true,
            titulo: true,
            status: true,
          },
        });

      if (duplicado) {
        falhar(
          409,
          "Já existe outro item com o mesmo ISBN ou DOI nesta biblioteca.",
          "ITEM_POSSIVELMENTE_DUPLICADO",
          {
            itemId: duplicado.id,
            titulo: duplicado.titulo,
            status: duplicado.status,
          }
        );
      }
    }

    const permitirDownloadSolicitado =
      booleanoObrigatorio(
        corpo.permitirDownload,
        "permitirDownload"
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

    const permitirDownload = Boolean(
      contexto.configuracao?.permitirDownload &&
        permitirDownloadSolicitado
    );
    const anoMaximo = new Date().getFullYear() + 2;
    const ip = obterIp(request);
    const userAgent = request.headers
      .get("user-agent")
      ?.slice(0, 2_000) || null;

    const item = await prisma.$transaction(
      async (transacao) => {
        const atualizado =
          await transacao.bibliotecaItem.update({
            where: {
              id_instituicaoId: {
                id: itemId,
                instituicaoId:
                  contexto.instituicaoId,
              },
            },
            data: {
              tipo,
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
              issn: textoOpcional(
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
              capaUrl: textoOpcional(
                corpo.capaUrl,
                "capaUrl",
                2_048
              ),
              miniaturaUrl: textoOpcional(
                corpo.miniaturaUrl,
                "miniaturaUrl",
                2_048
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
              destaque: booleanoObrigatorio(
                corpo.destaque,
                "destaque"
              ),
              permitirDownload,
              permitirAvaliacao: booleanoObrigatorio(
                corpo.permitirAvaliacao,
                "permitirAvaliacao"
              ),
              acessoLivre: booleanoObrigatorio(
                corpo.acessoLivre,
                "acessoLivre"
              ),
              atualizadoPorId: usuario.id,
            },
            select: ITEM_DETALHE_SELECT,
          });

        await transacao.bibliotecaAuditoria.create({
          data: {
            instituicaoId:
              contexto.instituicaoId,
            usuarioId: usuario.id,
            entidade: "BibliotecaItem",
            entidadeId: String(itemId),
            acao: AcaoAuditoriaBiblioteca.ATUALIZAR,
            descricao:
              "Dados bibliográficos e de acesso do item foram atualizados.",
            dadosAnteriores:
              serializarItemParaAuditoria(anterior),
            dadosPosteriores:
              serializarItemParaAuditoria(atualizado),
            metadados: {
              origem:
                "api_admin_biblioteca_acervo_item",
            },
            ip,
            userAgent,
          },
        });

        return atualizado;
      },
      {
        maxWait: 5_000,
        timeout: 10_000,
      }
    );

    return responder({
      ok: true,
      mensagem: "Item atualizado com sucesso.",
      item: serializarItemParaResposta(item),
      permissoes: {
        podeEditar: true,
        impersonacao: false,
      },
      configuracao: {
        permitirDownload:
          contexto.configuracao?.permitirDownload ??
          false,
      },
    });
  } catch (erro) {
    return responderErro(erro);
  }
}