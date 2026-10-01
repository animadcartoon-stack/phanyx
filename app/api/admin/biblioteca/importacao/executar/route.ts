import { randomUUID } from "crypto";

import {
  AcaoAuditoriaBiblioteca,
  BibliotecaSistemaClassificacao,
  BibliotecariaFuncaoAutor,
  ModalidadeAcessoBiblioteca,
  Prisma,
  StatusExemplarBiblioteca,
  StatusItemBiblioteca,
  TipoExemplarBiblioteca,
  TipoItemBiblioteca,
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

import {
  ErroArquivoImportacao,
  extrairRegistrosMapeadosImportacao,
  normalizarTextoComparacao,
} from "@/lib/biblioteca-importacao";

import {
  criarIndiceCapasZip,
  importarCapa,
  type RegistroParaCapa,
} from "@/lib/biblioteca-importacao-capas";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIMITE_ARQUIVO_BYTES =
  4 * 1024 * 1024;

const LIMITE_REGISTROS_SINCRONOS =
  1_000;

const TIPOS_ITEM =
  new Set<string>(
    Object.values(
      TipoItemBiblioteca,
    ),
  );

type DadosLinha =
  Record<string, string>;

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

function responderErro(
  erro: unknown,
) {
  if (
    erro instanceof
    ErroArquivoImportacao
  ) {
    const resposta =
      respostaErroBiblioteca(
        new ErroBiblioteca(
          erro.status,
          erro.message,
          erro.codigo,
        ),
      );

    return responder(
      resposta.corpo,
      resposta.status,
    );
  }

  const resposta =
    respostaErroBiblioteca(
      erro,
    );

  return responder(
    resposta.corpo,
    resposta.status,
  );
}

function texto(
  valor:
    | string
    | null
    | undefined,
) {
  const resultado =
    String(valor ?? "")
      .trim();

  return resultado || null;
}

function chaveSimples(
  valor:
    | string
    | null
    | undefined,
) {
  return String(valor ?? "")
    .trim()
    .toLowerCase();
}

function idPhanyxDoLegado(
  valor:
    | string
    | null
    | undefined,
) {
  const resultado =
    String(valor ?? "")
      .trim()
      .match(
        /^PHANYX-(\d+)$/i,
      );

  if (!resultado) {
    return null;
  }

  const id =
    Number(
      resultado[1],
    );

  return (
    Number.isSafeInteger(id) &&
    id > 0
  )
    ? id
    : null;
}

function chaveIsbn(
  valor:
    | string
    | null
    | undefined,
) {
  return String(valor ?? "")
    .toUpperCase()
    .replace(
      /[^0-9X]/g,
      "",
    );
}

function normalizarDoi(
  valor:
    | string
    | null
    | undefined,
) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .replace(
      /^https?:\/\/(dx\.)?doi\.org\//,
      "",
    )
    .replace(
      /^doi:\s*/i,
      "",
    );
}

function gerarSlugBase(
  valor: string,
) {
  const slug =
    valor
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
        160,
      );

  return slug || "item";
}

async function gerarSlugUnico(
  transacao:
    Prisma.TransactionClient,
  instituicaoId: number,
  titulo: string,
) {
  const base =
    gerarSlugBase(
      titulo,
    );

  let candidato =
    base;

  for (
    let tentativa = 0;
    tentativa < 100;
    tentativa += 1
  ) {
    const existe =
      await transacao
        .bibliotecaItem
        .findFirst({
          where: {
            instituicaoId,
            slug:
              candidato,
          },
          select: {
            id: true,
          },
        });

    if (!existe) {
      return candidato;
    }

    candidato =
      `${base}-${tentativa + 2}`;
  }

  return `${base}-${randomUUID()
    .slice(0, 8)}`;
}

function inteiroOpcional(
  valor:
    | string
    | undefined,
  minimo = 1,
  maximo =
    Number.MAX_SAFE_INTEGER,
) {
  if (!valor?.trim()) {
    return null;
  }

  const numero =
    Number(
      valor
        .replace(/\s/g, "")
        .replace(",", "."),
    );

  if (
    !Number.isInteger(
      numero,
    ) ||
    numero < minimo ||
    numero > maximo
  ) {
    return null;
  }

  return numero;
}

function decimalOpcional(
  valor:
    | string
    | undefined,
) {
  if (!valor?.trim()) {
    return null;
  }

  let normalizado =
    valor
      .trim()
      .replace(/\s/g, "");

  if (
    normalizado.includes(
      ",",
    ) &&
    normalizado.includes(
      ".",
    )
  ) {
    normalizado =
      normalizado
        .replace(/\./g, "")
        .replace(",", ".");
  } else {
    normalizado =
      normalizado.replace(
        ",",
        ".",
      );
  }

  const numero =
    Number(
      normalizado,
    );

  if (
    !Number.isFinite(
      numero,
    ) ||
    numero < 0
  ) {
    return null;
  }

  return new Prisma.Decimal(
    numero.toFixed(2),
  );
}

function dataOpcional(
  valor:
    | string
    | undefined,
) {
  if (!valor?.trim()) {
    return null;
  }

  const textoData =
    valor.trim();

  const brasileira =
    textoData.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    );

  if (brasileira) {
    const data =
      new Date(
        Date.UTC(
          Number(
            brasileira[3],
          ),
          Number(
            brasileira[2],
          ) - 1,
          Number(
            brasileira[1],
          ),
        ),
      );

    return Number.isNaN(
      data.getTime(),
    )
      ? null
      : data;
  }

  const data =
    new Date(
      textoData,
    );

  return Number.isNaN(
    data.getTime(),
  )
    ? null
    : data;
}

function palavrasChave(
  valor:
    | string
    | undefined,
) {
  if (!valor) {
    return [];
  }

  return Array.from(
    new Set(
      valor
        .split(
          /[,|\n]+/,
        )
        .map(
          (item) =>
            item.trim(),
        )
        .filter(Boolean)
        .slice(0, 30),
    ),
  );
}

function tipoItem(
  valor:
    | string
    | undefined,
) {
  const normalizado =
    String(
      valor ?? "",
    )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .toUpperCase()
      .replace(
        /[^A-Z0-9]+/g,
        "_",
      )
      .replace(
        /^_+|_+$/g,
        "",
      );

  if (
    TIPOS_ITEM.has(
      normalizado,
    )
  ) {
    return normalizado as
      TipoItemBiblioteca;
  }

  const equivalencias:
    Record<
      string,
      TipoItemBiblioteca
    > = {
      BOOK:
        TipoItemBiblioteca.LIVRO,
      LIVRO_FISICO:
        TipoItemBiblioteca.LIVRO,
      E_BOOK:
        TipoItemBiblioteca.EBOOK,
      EBOOK:
        TipoItemBiblioteca.EBOOK,
      ARTIGO:
        TipoItemBiblioteca.ARTIGO_CIENTIFICO,
      ARTICLE:
        TipoItemBiblioteca.ARTIGO_CIENTIFICO,
      PERIODICAL:
        TipoItemBiblioteca.PERIODICO,
      MAGAZINE:
        TipoItemBiblioteca.REVISTA,
      THESIS:
        TipoItemBiblioteca.TESE,
      DISSERTATION:
        TipoItemBiblioteca.DISSERTACAO,
    };

  return (
    equivalencias[
      normalizado
    ] ??
    TipoItemBiblioteca.LIVRO
  );
}

function possuiExemplar(
  dados: DadosLinha,
) {
  return Boolean(
    dados.codigoInterno ||
      dados.codigoBarras ||
      dados.numeroTombo ||
      dados.patrimonio ||
      dados.setor ||
      dados.sala ||
      dados.corredor ||
      dados.estante ||
      dados.prateleira ||
      dados.localizacaoCompleta ||
      dados.dataAquisicao ||
      dados.formaAquisicao ||
      dados.fornecedor ||
      dados.valorAquisicao,
  );
}

function chaveObra(
  dados: DadosLinha,
) {
  if (dados.isbn13) {
    return `isbn13:${chaveIsbn(
      dados.isbn13,
    )}`;
  }

  if (dados.isbn10) {
    return `isbn10:${chaveIsbn(
      dados.isbn10,
    )}`;
  }

  if (dados.doi) {
    return `doi:${normalizarDoi(
      dados.doi,
    )}`;
  }

  return [
    "titulo",
    normalizarTextoComparacao(
      dados.titulo,
    ),
    "autor",
    normalizarTextoComparacao(
      dados.autor,
    ),
    "edicao",
    normalizarTextoComparacao(
      dados.edicao,
    ),
  ].join(":");
}

function sistemaClassificacao(
  dados: DadosLinha,
  padrao:
    BibliotecaSistemaClassificacao,
) {
  if (
    dados.cdd &&
    !dados.cdu
  ) {
    return BibliotecaSistemaClassificacao.CDD;
  }

  if (
    dados.cdu &&
    !dados.cdd
  ) {
    return BibliotecaSistemaClassificacao.CDU;
  }

  if (
    dados.classificacaoBibliografica &&
    !dados.cdd &&
    !dados.cdu
  ) {
    return BibliotecaSistemaClassificacao.OUTRO;
  }

  return padrao;
}

function funcaoAutores(
  dados: DadosLinha,
) {
  const entradas: Array<{
    campo: keyof DadosLinha;
    funcao:
      BibliotecariaFuncaoAutor;
  }> = [
    {
      campo: "autor",
      funcao:
        BibliotecariaFuncaoAutor.AUTOR,
    },
    {
      campo: "coautor",
      funcao:
        BibliotecariaFuncaoAutor.COAUTOR,
    },
    {
      campo: "organizador",
      funcao:
        BibliotecariaFuncaoAutor.ORGANIZADOR,
    },
    {
      campo: "tradutor",
      funcao:
        BibliotecariaFuncaoAutor.TRADUTOR,
    },
    {
      campo: "orientador",
      funcao:
        BibliotecariaFuncaoAutor.ORIENTADOR,
    },
    {
      campo: "colaborador",
      funcao:
        BibliotecariaFuncaoAutor.COLABORADOR,
    },
  ];

  const resultado: Array<{
    nome: string;
    funcao:
      BibliotecariaFuncaoAutor;
    ordem: number;
  }> = [];

  let ordem = 0;

  for (
    const entrada of
    entradas
  ) {
    const valor =
      dados[
        entrada.campo
      ];

    if (!valor) {
      continue;
    }

    const nomes =
      valor
        .split(
          /[|\n]+/,
        )
        .map(
          (nome) =>
            nome.trim(),
        )
        .filter(Boolean);

    for (
      const nome of nomes
    ) {
      resultado.push({
        nome,
        funcao:
          entrada.funcao,
        ordem,
      });

      ordem += 1;
    }
  }

  return resultado;
}

function obterIp(
  request: NextRequest,
) {
  return (
    request.headers
      .get(
        "x-forwarded-for",
      )
      ?.split(",")[0]
      ?.trim() ||
    request.headers
      .get("x-real-ip")
      ?.trim() ||
    null
  );
}

export async function POST(
  request: NextRequest,
) {
  let loteId:
    string | null = null;

  let contextoAuditoria:
    {
      instituicaoId: number;
      usuarioId: number;
      ip: string | null;
      userAgent:
        | string
        | null;
    } | null = null;

  try {
    const usuario =
      await getUserFromToken();

    const contexto =
      await obterContextoBiblioteca(
        usuario,
      );

    if (!usuario) {
      throw new ErroBiblioteca(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO",
      );
    }

    if (usuario.impersonacao) {
      throw new ErroBiblioteca(
        403,
        "Não é permitido importar acervo durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO",
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.catalogo.criar",
      "biblioteca.exemplares.gerenciar",
    );

    const formulario =
      await request.formData();

    const entrada =
      formulario.get(
        "arquivo",
      );

    const mapeamentoBruto =
      formulario.get(
        "mapeamento",
      );

    const confirmacao =
      formulario.get(
        "confirmacao",
      );

    const capasEntrada =
      formulario.get(
        "capasZip",
      );

    const copiarCapasUrl =
      formulario.get(
        "copiarCapasUrl",
      ) !== "false";

    const buscarCapasIsbn =
      formulario.get(
        "buscarCapasIsbn",
      ) === "true";

    if (
      confirmacao !==
      "IMPORTAR"
    ) {
      throw new ErroBiblioteca(
        400,
        "A confirmação da importação é obrigatória.",
        "CONFIRMACAO_IMPORTACAO_AUSENTE",
      );
    }

    if (
      !entrada ||
      typeof entrada ===
        "string" ||
      typeof entrada.arrayBuffer !==
        "function"
    ) {
      throw new ErroBiblioteca(
        400,
        "Envie o arquivo que será importado.",
        "ARQUIVO_NAO_INFORMADO",
      );
    }

    if (
      typeof mapeamentoBruto !==
      "string"
    ) {
      throw new ErroBiblioteca(
        400,
        "O mapeamento das colunas não foi informado.",
        "MAPEAMENTO_NAO_INFORMADO",
      );
    }

    if (
      entrada.size <= 0 ||
      entrada.size >
        LIMITE_ARQUIVO_BYTES
    ) {
      throw new ErroBiblioteca(
        entrada.size <= 0
          ? 400
          : 413,
        entrada.size <= 0
          ? "O arquivo está vazio."
          : "O arquivo ultrapassa o limite desta etapa.",
        entrada.size <= 0
          ? "ARQUIVO_VAZIO"
          : "ARQUIVO_MUITO_GRANDE",
      );
    }

    let mapeamento:
      Record<number, string> =
        {};

    try {
      const recebido =
        JSON.parse(
          mapeamentoBruto,
        ) as Record<
          string,
          unknown
        >;

      for (
        const [
          indiceTexto,
          destino,
        ] of Object.entries(
          recebido,
        )
      ) {
        const indice =
          Number(
            indiceTexto,
          );

        if (
          Number.isInteger(
            indice,
          ) &&
          indice >= 0 &&
          typeof destino ===
            "string"
        ) {
          mapeamento[
            indice
          ] =
            destino.trim();
        }
      }
    } catch {
      throw new ErroBiblioteca(
        400,
        "O mapeamento das colunas é inválido.",
        "MAPEAMENTO_INVALIDO",
      );
    }

    if (
      !Object.values(
        mapeamento,
      ).includes("titulo")
    ) {
      throw new ErroBiblioteca(
        400,
        "O campo Título deve estar mapeado.",
        "TITULO_NAO_MAPEADO",
      );
    }

    const buffer =
      Buffer.from(
        await entrada.arrayBuffer(),
      );

    const extraido =
      extrairRegistrosMapeadosImportacao(
        buffer,
        entrada.name,
        mapeamento,
      );

    if (
      extraido.registros.length >
      LIMITE_REGISTROS_SINCRONOS
    ) {
      throw new ErroBiblioteca(
        413,
        "Esta versão da importação aceita até 1.000 registros por lote. Arquivos maiores serão atendidos pelo processamento em fila.",
        "LOTE_EXCEDE_LIMITE_SINCRONO",
        {
          limite:
            LIMITE_REGISTROS_SINCRONOS,
          registros:
            extraido.registros.length,
        },
      );
    }

    if (
      extraido.registros.length ===
      0
    ) {
      throw new ErroBiblioteca(
        400,
        "O arquivo não possui registros para importar.",
        "ARQUIVO_SEM_REGISTROS",
      );
    }

    const arquivoCapas =
      capasEntrada &&
      typeof capasEntrada !== "string" &&
      typeof capasEntrada.arrayBuffer === "function" &&
      capasEntrada.size > 0
        ? capasEntrada
        : null;

    const indiceCapasZip =
      await criarIndiceCapasZip(
        arquivoCapas,
      );

    loteId =
      randomUUID();

    const ip =
      obterIp(
        request,
      );

    const userAgent =
      request.headers
        .get(
          "user-agent",
        )
        ?.slice(
          0,
          2_000,
        ) ??
      null;

    contextoAuditoria = {
      instituicaoId:
        contexto.instituicaoId,
      usuarioId:
        usuario.id,
      ip,
      userAgent,
    };

    await prisma
      .bibliotecaAuditoria
      .create({
        data: {
          instituicaoId:
            contexto.instituicaoId,
          usuarioId:
            usuario.id,
          entidade:
            "BibliotecaImportacaoLote",
          entidadeId:
            loteId,
          acao:
            AcaoAuditoriaBiblioteca.CRIAR,
          descricao:
            `Importação de acervo iniciada: ${entrada.name}.`,
          metadados: {
            loteId,
            status:
              "PROCESSANDO",
            arquivoNome:
              entrada.name,
            arquivoTamanhoBytes:
              entrada.size,
            planilha:
              extraido.planilha,
            registros:
              extraido.registros
                .length,
            origem:
              "IMPORTACAO_ARQUIVO",
          },
          ip,
          userAgent,
        },
      });

    const resultado =
      await prisma
        .$transaction(
          async (
            transacao,
          ) => {
            const itemPorChave =
              new Map<
                string,
                number
              >();

            const editorasCriadas =
              new Set<number>();

            const autoresCriados =
              new Set<number>();

            const itensCriados:
              number[] = [];

            const exemplaresCriados:
              number[] = [];

            const capasPorItem =
              new Map<
                number,
                RegistroParaCapa
              >();

            let obrasVinculadas =
              0;

            let obrasReutilizadas =
              0;

            for (
              const registro of
              extraido.registros
            ) {
              const dados =
                registro.dados;

              const titulo =
                texto(
                  dados.titulo,
                );

              if (!titulo) {
                throw new ErroBiblioteca(
                  409,
                  `A linha ${registro.linha} não possui título.`,
                  "IMPORTACAO_REGISTRO_INVALIDO",
                  {
                    linha:
                      registro.linha,
                    campo:
                      "titulo",
                  },
                );
              }

              const chave =
                chaveObra(
                  dados,
                );

              let itemId =
                itemPorChave.get(
                  chave,
                ) ??
                null;

              let itemNovo =
                false;

              if (!itemId) {
                const isbn10 =
                  chaveIsbn(
                    dados.isbn10,
                  ) || null;

                const isbn13 =
                  chaveIsbn(
                    dados.isbn13,
                  ) || null;

                const doi =
                  normalizarDoi(
                    dados.doi,
                  ) || null;

                const filtrosIdentificador:
                  Prisma.BibliotecaItemWhereInput[] =
                  [];


                const idPhanyx =
                  idPhanyxDoLegado(
                    dados.idLegado,
                  );

                if (idPhanyx) {
                  filtrosIdentificador.push(
                    {
                      id:
                        idPhanyx,
                      titulo: {
                        equals:
                          titulo,
                        mode:
                          "insensitive",
                      },
                    },
                  );
                }

                if (isbn10) {
                  filtrosIdentificador.push(
                    {
                      isbn10,
                    },
                  );
                }

                if (isbn13) {
                  filtrosIdentificador.push(
                    {
                      isbn13,
                    },
                  );
                }

                if (doi) {
                  filtrosIdentificador.push(
                    {
                      doi: {
                        equals:
                          doi,
                        mode:
                          "insensitive",
                      },
                    },
                  );
                }

                const existenteIdentificador =
                  filtrosIdentificador.length >
                  0
                    ? await transacao
                        .bibliotecaItem
                        .findFirst(
                          {
                            where:
                              {
                                instituicaoId:
                                  contexto.instituicaoId,
                                OR:
                                  filtrosIdentificador,
                              },
                            select:
                              {
                                id: true,
                                titulo:
                                  true,
                              },
                          },
                        )
                    : null;

                if (
                  existenteIdentificador
                ) {
                  itemId =
                    existenteIdentificador.id;

                  obrasVinculadas +=
                    1;

                  itemPorChave.set(
                    chave,
                    itemId,
                  );
                } else {
                  const candidatosTitulo =
                    await transacao
                      .bibliotecaItem
                      .findMany({
                        where: {
                          instituicaoId:
                            contexto.instituicaoId,
                          titulo: {
                            equals:
                              titulo,
                            mode:
                              "insensitive",
                          },
                        },
                        select: {
                          id: true,
                          titulo: true,
                          autores:
                            {
                              select:
                                {
                                  autor:
                                    {
                                      select:
                                        {
                                          nome: true,
                                        },
                                    },
                                },
                            },
                        },
                        take: 10,
                      });

                  if (
                    candidatosTitulo
                      .length > 0
                  ) {
                    throw new ErroBiblioteca(
                      409,
                      `A linha ${registro.linha} corresponde a uma possível obra já existente e precisa de revisão.`,
                      "IMPORTACAO_POSSIVEL_DUPLICIDADE",
                      {
                        linha:
                          registro.linha,
                        titulo,
                        candidatos:
                          candidatosTitulo.map(
                            (
                              item,
                            ) => ({
                              id:
                                item.id,
                              titulo:
                                item.titulo,
                              autores:
                                item.autores.map(
                                  (
                                    vinculo,
                                  ) =>
                                    vinculo
                                      .autor
                                      .nome,
                                ),
                            }),
                          ),
                      },
                    );
                  }

                  let editoraId:
                    number | null =
                    null;

                  const nomeEditora =
                    texto(
                      dados.editora,
                    );

                  if (
                    nomeEditora
                  ) {
                    const existente =
                      await transacao
                        .bibliotecaEditora
                        .findFirst(
                          {
                            where:
                              {
                                instituicaoId:
                                  contexto.instituicaoId,
                                nome: {
                                  equals:
                                    nomeEditora,
                                  mode:
                                    "insensitive",
                                },
                                ativo:
                                  true,
                              },
                            select:
                              {
                                id: true,
                              },
                          },
                        );

                    if (
                      existente
                    ) {
                      editoraId =
                        existente.id;
                    } else {
                      const criada =
                        await transacao
                          .bibliotecaEditora
                          .create({
                            data: {
                              instituicaoId:
                                contexto.instituicaoId,
                              nome:
                                nomeEditora,
                              ativo:
                                true,
                            },
                            select:
                              {
                                id: true,
                              },
                          });

                      editoraId =
                        criada.id;

                      editorasCriadas.add(
                        criada.id,
                      );
                    }
                  }

                  const sistema =
                    sistemaClassificacao(
                      dados,
                      contexto
                        .configuracao
                        ?.sistemaClassificacaoPadrao ??
                        BibliotecaSistemaClassificacao.CDD,
                    );

                  const cdd =
                    texto(
                      dados.cdd,
                    );

                  const cdu =
                    texto(
                      dados.cdu,
                    );

                  const classificacaoBibliografica =
                    texto(
                      dados.classificacaoBibliografica,
                    );

                  const cutter =
                    texto(
                      dados.codigoCutter,
                    );

                  const classificacaoPrincipal =
                    sistema ===
                    BibliotecaSistemaClassificacao.CDD
                      ? cdd
                      : sistema ===
                          BibliotecaSistemaClassificacao.CDU
                        ? cdu
                        : classificacaoBibliografica;

                  const codigoChamadaInformado =
                    texto(
                      dados.codigoChamada,
                    );

                  const codigoChamada =
                    codigoChamadaInformado ??
                    (
                      contexto
                        .configuracao
                        ?.gerarCodigoChamadaAutomaticamente !==
                      false
                        ? [
                            classificacaoPrincipal,
                            contexto
                              .configuracao
                              ?.usarCutter !==
                            false
                              ? cutter
                              : null,
                          ]
                            .filter(
                              Boolean,
                            )
                            .join(
                              " ",
                            ) ||
                          null
                        : null
                    );

                  const slug =
                    await gerarSlugUnico(
                      transacao,
                      contexto.instituicaoId,
                      titulo,
                    );

                  const criado =
                    await transacao
                      .bibliotecaItem
                      .create({
                        data: {
                          instituicaoId:
                            contexto.instituicaoId,
                          tipo:
                            tipoItem(
                              dados.tipo,
                            ),
                          status:
                            StatusItemBiblioteca.RASCUNHO,
                          modalidade:
                            possuiExemplar(
                              dados,
                            )
                              ? ModalidadeAcessoBiblioteca.EMPRESTIMO_FISICO
                              : ModalidadeAcessoBiblioteca.LEITURA_INTERNA,
                          titulo,
                          subtitulo:
                            texto(
                              dados.subtitulo,
                            ),
                          slug,
                          palavrasChave:
                            palavrasChave(
                              dados.palavrasChave,
                            ),
                          isbn10,
                          isbn13,
                          issn:
                            texto(
                              dados.issn,
                            ),
                          doi,
                          idioma:
                            texto(
                              dados.idioma,
                            ) ??
                            "pt-BR",
                          paisPublicacao:
                            texto(
                              dados.paisPublicacao,
                            ),
                          anoPublicacao:
                            inteiroOpcional(
                              dados.anoPublicacao,
                              1,
                              new Date()
                                .getFullYear() +
                                2,
                            ),
                          edicao:
                            texto(
                              dados.edicao,
                            ),
                          volume:
                            texto(
                              dados.volume,
                            ),
                          numero:
                            texto(
                              dados.numero,
                            ),
                          numeroPaginas:
                            inteiroOpcional(
                              dados.numeroPaginas,
                              1,
                              10_000_000,
                            ),
                          classificacaoBibliografica,
                          sistemaClassificacao:
                            sistema,
                          edicaoClassificacao:
                            sistema ===
                            BibliotecaSistemaClassificacao.CDD
                              ? contexto
                                  .configuracao
                                  ?.edicaoCDDPadrao ??
                                null
                              : sistema ===
                                  BibliotecaSistemaClassificacao.CDU
                                ? contexto
                                    .configuracao
                                    ?.edicaoCDUPadrao ??
                                  null
                                : null,
                          codigoCutter:
                            cutter,
                          codigoChamada,
                          cdd,
                          cdu,
                          editoraId,
                          permitirDownload:
                            false,
                          permitirAvaliacao:
                            contexto
                              .configuracao
                              ?.permitirAvaliacao ??
                            true,
                          acessoLivre:
                            false,
                          criadoPorId:
                            usuario.id,
                          atualizadoPorId:
                            usuario.id,
                        },
                        select: {
                          id: true,
                        },
                      });

                  itemId =
                    criado.id;

                  itemNovo =
                    true;

                  itensCriados.push(
                    criado.id,
                  );

                  itemPorChave.set(
                    chave,
                    criado.id,
                  );

                  const autores =
                    funcaoAutores(
                      dados,
                    );

                  for (
                    const autorImportado of
                    autores
                  ) {
                    let autorId:
                      number;

                    const autorExistente =
                      await transacao
                        .bibliotecaAutor
                        .findFirst(
                          {
                            where:
                              {
                                instituicaoId:
                                  contexto.instituicaoId,
                                nome: {
                                  equals:
                                    autorImportado.nome,
                                  mode:
                                    "insensitive",
                                },
                                ativo:
                                  true,
                              },
                            select:
                              {
                                id: true,
                              },
                          },
                        );

                    if (
                      autorExistente
                    ) {
                      autorId =
                        autorExistente.id;
                    } else {
                      const autorCriado =
                        await transacao
                          .bibliotecaAutor
                          .create({
                            data: {
                              instituicaoId:
                                contexto.instituicaoId,
                              nome:
                                autorImportado.nome,
                              ativo:
                                true,
                            },
                            select:
                              {
                                id: true,
                              },
                          });

                      autorId =
                        autorCriado.id;

                      autoresCriados.add(
                        autorCriado.id,
                      );
                    }

                    await transacao
                      .bibliotecaItemAutor
                      .create({
                        data: {
                          instituicaoId:
                            contexto.instituicaoId,
                          itemId:
                            criado.id,
                          autorId,
                          funcao:
                            autorImportado.funcao,
                          ordem:
                            autorImportado.ordem,
                        },
                      });
                  }

                  await transacao
                    .bibliotecaAuditoria
                    .create({
                      data: {
                        instituicaoId:
                          contexto.instituicaoId,
                        usuarioId:
                          usuario.id,
                        entidade:
                          "BibliotecaItem",
                        entidadeId:
                          String(
                            criado.id,
                          ),
                        acao:
                          AcaoAuditoriaBiblioteca.CRIAR,
                        descricao:
                          "Item criado por importação de acervo.",
                        dadosPosteriores:
                          {
                            itemId:
                              criado.id,
                            titulo,
                            linhaImportacao:
                              registro.linha,
                          },
                        metadados:
                          {
                            loteImportacaoId:
                              loteId,
                            origem:
                              "IMPORTACAO_ARQUIVO",
                            arquivoNome:
                              entrada.name,
                          },
                        ip,
                        userAgent,
                      },
                    });
                }
              } else {
                obrasReutilizadas +=
                  1;
              }

              if (
                !itemId
              ) {
                throw new ErroBiblioteca(
                  500,
                  "Não foi possível resolver a obra durante a importação.",
                  "IMPORTACAO_ITEM_NAO_RESOLVIDO",
                  {
                    linha:
                      registro.linha,
                  },
                );
              }

              if (
                !capasPorItem.has(
                  itemId,
                )
              ) {
                capasPorItem.set(
                  itemId,
                  {
                    itemId,
                    linha:
                      registro.linha,
                    titulo,
                    arquivoCapa:
                      texto(
                        dados.arquivoCapa,
                      ),
                    capaUrl:
                      texto(
                        dados.capaUrl,
                      ),
                    miniaturaUrl:
                      texto(
                        dados.miniaturaUrl,
                      ),
                    isbn:
                      texto(
                        dados.isbn,
                      ),
                    isbn10:
                      texto(
                        dados.isbn10,
                      ),
                    isbn13:
                      texto(
                        dados.isbn13,
                      ),
                    idLegado:
                      texto(
                        dados.idLegado,
                      ),
                    codigoBarras:
                      texto(
                        dados.codigoBarras,
                      ),
                    numeroTombo:
                      texto(
                        dados.numeroTombo,
                      ),
                    patrimonio:
                      texto(
                        dados.patrimonio,
                      ),
                  },
                );
              }

              if (
                possuiExemplar(
                  dados,
                )
              ) {
                const codigoInterno =
                  texto(
                    dados.codigoInterno,
                  ) ??
                  `IMP-${loteId
                    .slice(
                      0,
                      8,
                    )
                    .toUpperCase()}-${registro.linha}`;

                const codigoBarras =
                  texto(
                    dados.codigoBarras,
                  );

                const numeroTombo =
                  texto(
                    dados.numeroTombo,
                  );

                const conflitos =
                  await transacao
                    .bibliotecaExemplar
                    .findFirst({
                      where: {
                        instituicaoId:
                          contexto.instituicaoId,
                        OR: [
                          {
                            codigoInterno,
                          },
                          ...(codigoBarras
                            ? [
                                {
                                  codigoBarras,
                                },
                              ]
                            : []),
                          ...(numeroTombo
                            ? [
                                {
                                  numeroTombo,
                                },
                              ]
                            : []),
                        ],
                      },
                      select: {
                        id: true,
                        codigoInterno:
                          true,
                        codigoBarras:
                          true,
                        numeroTombo:
                          true,
                      },
                    });

                if (
                  conflitos
                ) {
                  throw new ErroBiblioteca(
                    409,
                    `A linha ${registro.linha} possui um identificador de exemplar que já existe no acervo.`,
                    "IMPORTACAO_CONFLITO_EXEMPLAR",
                    {
                      linha:
                        registro.linha,
                      exemplarId:
                        conflitos.id,
                      codigoInterno:
                        conflitos.codigoInterno,
                      codigoBarras:
                        conflitos.codigoBarras,
                      numeroTombo:
                        conflitos.numeroTombo,
                    },
                  );
                }

                const exemplar =
                  await transacao
                    .bibliotecaExemplar
                    .create({
                      data: {
                        instituicaoId:
                          contexto.instituicaoId,
                        itemId,
                        tipo:
                          TipoExemplarBiblioteca.FISICO,
                        status:
                          StatusExemplarBiblioteca.DISPONIVEL,
                        codigoInterno,
                        codigoBarras,
                        numeroTombo,
                        patrimonio:
                          texto(
                            dados.patrimonio,
                          ),
                        setor:
                          texto(
                            dados.setor,
                          ),
                        sala:
                          texto(
                            dados.sala,
                          ),
                        corredor:
                          texto(
                            dados.corredor,
                          ),
                        estante:
                          texto(
                            dados.estante,
                          ),
                        prateleira:
                          texto(
                            dados.prateleira,
                          ),
                        localizacaoCompleta:
                          texto(
                            dados.localizacaoCompleta,
                          ),
                        dataAquisicao:
                          dataOpcional(
                            dados.dataAquisicao,
                          ),
                        formaAquisicao:
                          texto(
                            dados.formaAquisicao,
                          ),
                        fornecedor:
                          texto(
                            dados.fornecedor,
                          ),
                        valorAquisicao:
                          decimalOpcional(
                            dados.valorAquisicao,
                          ),
                        permiteEmprestimo:
                          true,
                        observacoes:
                          texto(
                            dados.observacoes,
                          ),
                        criadoPorId:
                          usuario.id,
                        atualizadoPorId:
                          usuario.id,
                      },
                      select: {
                        id: true,
                      },
                    });

                exemplaresCriados.push(
                  exemplar.id,
                );

                await transacao
                  .bibliotecaAuditoria
                  .create({
                    data: {
                      instituicaoId:
                        contexto.instituicaoId,
                      usuarioId:
                        usuario.id,
                      entidade:
                        "BibliotecaExemplar",
                      entidadeId:
                        String(
                          exemplar.id,
                        ),
                      acao:
                        AcaoAuditoriaBiblioteca.CRIAR,
                      descricao:
                        "Exemplar criado por importação de acervo.",
                      dadosPosteriores:
                        {
                          exemplarId:
                            exemplar.id,
                          itemId,
                          codigoInterno,
                          codigoBarras,
                          numeroTombo,
                          linhaImportacao:
                            registro.linha,
                        },
                      metadados:
                        {
                          loteImportacaoId:
                            loteId,
                          origem:
                            "IMPORTACAO_ARQUIVO",
                          arquivoNome:
                            entrada.name,
                        },
                      ip,
                      userAgent,
                    },
                  });
              }

              if (
                !itemNovo &&
                itemPorChave.get(
                  chave,
                ) ===
                  itemId
              ) {
                // A obra existente é preservada.
                // A importação apenas pode acrescentar exemplar.
              }
            }

            const resumo = {
              loteId,
              arquivoNome:
                entrada.name,
              registros:
                extraido
                  .registros
                  .length,
              obrasCriadas:
                itensCriados.length,
              obrasVinculadas,
              obrasReutilizadas,
              exemplaresCriados:
                exemplaresCriados.length,
              autoresCriados:
                autoresCriados.size,
              editorasCriadas:
                editorasCriadas.size,
            };

            await transacao
              .bibliotecaAuditoria
              .create({
                data: {
                  instituicaoId:
                    contexto.instituicaoId,
                  usuarioId:
                    usuario.id,
                  entidade:
                    "BibliotecaImportacaoLote",
                  entidadeId:
                    loteId,
                  acao:
                    AcaoAuditoriaBiblioteca.ATUALIZAR,
                  descricao:
                    `Importação de acervo concluída: ${entrada.name}.`,
                  dadosPosteriores:
                    resumo,
                  metadados:
                    {
                      ...resumo,
                      status:
                        "CONCLUIDO",
                      origem:
                        "IMPORTACAO_ARQUIVO",
                    },
                  ip,
                  userAgent,
                },
              });

            return {
              resumo,
              registrosCapas:
                Array.from(
                  capasPorItem.values(),
                ),
            };
          },
          {
            maxWait:
              10_000,
            timeout:
              60_000,
          },
        );

    let capasImportadasZip =
      0;

    let capasImportadasUrl =
      0;

    let capasImportadasIsbn =
      0;

    let capasPreservadas =
      0;

    let semCapa =
      0;

    let falhasCapas =
      0;

    const falhasCapasDetalhes:
      Array<{
        itemId: number;
        titulo: string;
        mensagem: string;
      }> = [];

    for (
      const registroCapa of
      resultado.registrosCapas
    ) {
      try {
        const itemAtual =
          await prisma
            .bibliotecaItem
            .findFirst({
              where: {
                id:
                  registroCapa.itemId,
                instituicaoId:
                  contexto.instituicaoId,
              },
              select: {
                capaUrl: true,
                miniaturaUrl:
                  true,
              },
            });

        if (!itemAtual) {
          falhasCapas += 1;

          continue;
        }

        if (
          itemAtual.capaUrl ||
          itemAtual.miniaturaUrl
        ) {
          capasPreservadas +=
            1;

          continue;
        }

        const capa =
          await importarCapa(
            registroCapa,
            contexto.instituicaoId,
            indiceCapasZip,
            {
              copiarUrl:
                copiarCapasUrl,
              buscarPorIsbn:
                buscarCapasIsbn,
            },
          );

        if (!capa) {
          semCapa += 1;

          continue;
        }

        await prisma
          .$transaction(
            async (
              transacao,
            ) => {
              await transacao
                .bibliotecaItem
                .update({
                  where: {
                    id:
                      registroCapa.itemId,
                  },
                  data: {
                    capaUrl:
                      capa.url,
                    miniaturaUrl:
                      capa.url,
                    atualizadoPorId:
                      usuario.id,
                  },
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
                      "BibliotecaItem",
                    entidadeId:
                      String(
                        registroCapa.itemId,
                      ),
                    acao:
                      AcaoAuditoriaBiblioteca.ATUALIZAR,
                    descricao:
                      "Capa definida por importação de acervo.",
                    dadosAnteriores:
                      {
                        capaUrl:
                          itemAtual.capaUrl,
                        miniaturaUrl:
                          itemAtual.miniaturaUrl,
                      },
                    dadosPosteriores:
                      {
                        capaUrl:
                          capa.url,
                        miniaturaUrl:
                          capa.url,
                      },
                    metadados:
                      {
                        loteImportacaoId:
                          loteId,
                        origem:
                          "IMPORTACAO_CAPA",
                        origemCapa:
                          capa.origem,
                        referencia:
                          capa.referencia,
                      },
                    ip,
                    userAgent,
                  },
                });
            },
          );

        if (
          capa.origem ===
          "ZIP"
        ) {
          capasImportadasZip +=
            1;
        } else if (
          capa.origem ===
          "URL"
        ) {
          capasImportadasUrl +=
            1;
        } else if (
          capa.origem ===
          "ISBN"
        ) {
          capasImportadasIsbn +=
            1;
        }
      } catch (erroCapa) {
        falhasCapas += 1;

        if (
          falhasCapasDetalhes.length <
          50
        ) {
          falhasCapasDetalhes.push({
            itemId:
              registroCapa.itemId,
            titulo:
              registroCapa.titulo,
            mensagem:
              erroCapa instanceof
              Error
                ? erroCapa.message
                : "Falha ao importar capa.",
          });
        }
      }
    }

    const resultadoFinal = {
      ...resultado.resumo,

      capasZip:
        capasImportadasZip,

      capasUrl:
        capasImportadasUrl,

      capasIsbn:
        capasImportadasIsbn,

      capasPreservadas,

      semCapa,

      falhasCapas,

      capasNoPacote:
        indiceCapasZip
          ?.quantidade ??
        0,
    };

    try {
      await prisma
        .bibliotecaAuditoria
        .create({
          data: {
            instituicaoId:
              contexto.instituicaoId,
            usuarioId:
              usuario.id,
            entidade:
              "BibliotecaImportacaoLote",
            entidadeId:
              loteId,
            acao:
              AcaoAuditoriaBiblioteca.ATUALIZAR,
            descricao:
              "Processamento de capas da importação concluído.",
            dadosPosteriores:
              resultadoFinal,
            metadados: {
              ...resultadoFinal,
              status:
                "CONCLUIDO",
              origem:
                "IMPORTACAO_ARQUIVO",
              falhasCapas:
                falhasCapasDetalhes,
            },
            ip,
            userAgent,
          },
        });
    } catch (
      erroAuditoriaCapa
    ) {
      console.error(
        "Falha ao registrar resumo das capas:",
        erroAuditoriaCapa,
      );
    }

    return responder(
      {
        ok: true,
        resultado:
          resultadoFinal,
      },
      201,
    );
  } catch (erro) {
    if (
      loteId &&
      contextoAuditoria
    ) {
      try {
        const erroBiblioteca =
          erro instanceof
          ErroBiblioteca
            ? erro
            : null;

        await prisma
          .bibliotecaAuditoria
          .create({
            data: {
              instituicaoId:
                contextoAuditoria.instituicaoId,
              usuarioId:
                contextoAuditoria.usuarioId,
              entidade:
                "BibliotecaImportacaoLote",
              entidadeId:
                loteId,
              acao:
                AcaoAuditoriaBiblioteca.ATUALIZAR,
              descricao:
                "Importação de acervo não concluída.",
              metadados: {
                loteId,
                status:
                  "FALHOU",
                codigoErro:
                  erroBiblioteca
                    ?.codigo ??
                  "ERRO_INTERNO",
              },
              ip:
                contextoAuditoria.ip,
              userAgent:
                contextoAuditoria.userAgent,
            },
          });
      } catch (
        erroAuditoria
      ) {
        console.error(
          "Falha ao registrar auditoria da importação:",
          erroAuditoria,
        );
      }
    }

    return responderErro(
      erro,
    );
  }
}