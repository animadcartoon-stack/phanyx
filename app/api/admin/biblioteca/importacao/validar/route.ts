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

import { prisma } from "@/lib/prisma";
import { abrirArquivoImportacao } from "@/lib/biblioteca-importacao-pacote";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIMITE_ARQUIVO_BYTES =
  4 * 1024 * 1024;

type AcaoObra =
  | "CRIAR_NOVA"
  | "VINCULAR_EXISTENTE"
  | "REUTILIZAR_DO_ARQUIVO"
  | "REVISAR_DUPLICIDADE"
  | "INVALIDA";

type SituacaoExemplar =
  | "SEM_EXEMPLAR"
  | "NOVO_EXEMPLAR"
  | "CONFLITO"
  | "AVISO";

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

function dividir<T>(
  valores: T[],
  tamanho = 500,
) {
  const lotes: T[][] = [];

  for (
    let indice = 0;
    indice < valores.length;
    indice += tamanho
  ) {
    lotes.push(
      valores.slice(
        indice,
        indice + tamanho,
      ),
    );
  }

  return lotes;
}

function unicos(
  valores: Array<
    string | null | undefined
  >,
) {
  return Array.from(
    new Set(
      valores
        .map(
          (valor) =>
            String(
              valor ?? "",
            ).trim(),
        )
        .filter(Boolean),
    ),
  );
}

function chaveIsbn(
  valor: string | null | undefined,
) {
  return String(valor ?? "")
    .toUpperCase()
    .replace(/[^0-9X]/g, "");
}

function chaveSimples(
  valor: string | null | undefined,
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

function possuiDadosExemplar(
  dados: Record<string, string>,
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
      dados.localizacaoCompleta,
  );
}

function chaveObraArquivo(
  dados: Record<string, string>,
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
    return `doi:${chaveSimples(
      dados.doi,
    )}`;
  }

  const titulo =
    normalizarTextoComparacao(
      dados.titulo,
    );

  const autor =
    normalizarTextoComparacao(
      dados.autor,
    );

  return `titulo:${titulo}|autor:${autor}`;
}

export async function POST(
  request: NextRequest,
) {
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
        "Não é permitido validar importações durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO",
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.catalogo.criar",
    );

    const formulario =
      await request.formData();

    const entrada =
      formulario.get("arquivo");

    const mapeamentoBruto =
      formulario.get(
        "mapeamento",
      );

    if (
      !entrada ||
      typeof entrada === "string" ||
      typeof entrada.arrayBuffer !==
        "function"
    ) {
      throw new ErroBiblioteca(
        400,
        "Envie o arquivo que será validado.",
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
      Record<number, string>;

    try {
      const recebido =
        JSON.parse(
          mapeamentoBruto,
        ) as Record<
          string,
          unknown
        >;

      mapeamento = {};

      for (
        const [
          indiceTexto,
          destino,
        ] of Object.entries(
          recebido,
        )
      ) {
        const indice =
          Number(indiceTexto);

        if (
          Number.isInteger(indice) &&
          indice >= 0 &&
          typeof destino ===
            "string"
        ) {
          mapeamento[indice] =
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
        "O campo Título deve estar mapeado antes da validação.",
        "TITULO_NAO_MAPEADO",
      );
    }

    const buffer =
      Buffer.from(
        await entrada.arrayBuffer(),
      );

    const pacote = await abrirArquivoImportacao(buffer, entrada.name);
    const extraido = extrairRegistrosMapeadosImportacao(pacote.buffer, pacote.nomeArquivo, mapeamento);

    const registros =
      extraido.registros;

    const isbn10 =
      unicos(
        registros.map(
          (registro) =>
            registro.dados
              .isbn10,
        ),
      );

    const isbn13 =
      unicos(
        registros.map(
          (registro) =>
            registro.dados
              .isbn13,
        ),
      );

    const dois =
      unicos(
        registros.map(
          (registro) =>
            registro.dados.doi,
        ),
      );

    const titulos =
      unicos(
        registros.map(
          (registro) =>
            registro.dados
              .titulo,
        ),
      );

    const idsPhanyx =
      Array.from(
        new Set(
          registros
            .map(
              (registro) =>
                idPhanyxDoLegado(
                  registro.dados
                    .idLegado,
                ),
            )
            .filter(
              (
                valor,
              ): valor is number =>
                valor !== null,
            ),
        ),
      );

    const codigosInternos =
      unicos(
        registros.map(
          (registro) =>
            registro.dados
              .codigoInterno,
        ),
      );

    const codigosBarras =
      unicos(
        registros.map(
          (registro) =>
            registro.dados
              .codigoBarras,
        ),
      );

    const tombos =
      unicos(
        registros.map(
          (registro) =>
            registro.dados
              .numeroTombo,
        ),
      );

    const patrimonios =
      unicos(
        registros.map(
          (registro) =>
            registro.dados
              .patrimonio,
        ),
      );

    const itensEncontrados: Array<{
      id: number;
      titulo: string;
      status: string;
      isbn10: string | null;
      isbn13: string | null;
      doi: string | null;
      autores: Array<{
        funcao: string;
        ordem: number;
        autor: {
          nome: string;
        };
      }>;
    }> = [];

    const filtrosItens = [
      ...dividir(
        idsPhanyx,
      ).map(
        (lote) => ({
          id: {
            in: lote,
          },
        }),
      ),

      ...dividir(
        isbn10,
      ).map(
        (lote) => ({
          isbn10: {
            in: lote,
          },
        }),
      ),

      ...dividir(
        isbn13,
      ).map(
        (lote) => ({
          isbn13: {
            in: lote,
          },
        }),
      ),

      ...dividir(
        dois,
      ).map(
        (lote) => ({
          doi: {
            in: lote,
            mode:
              "insensitive" as const,
          },
        }),
      ),

      ...dividir(
        titulos,
      ).map(
        (lote) => ({
          titulo: {
            in: lote,
            mode:
              "insensitive" as const,
          },
        }),
      ),
    ];

    for (
      const filtro of
      filtrosItens
    ) {
      const encontrados =
        await prisma.bibliotecaItem.findMany(
          {
            where: {
              instituicaoId:
                contexto.instituicaoId,
              ...filtro,
            },
            select: {
              id: true,
              titulo: true,
              status: true,
              isbn10: true,
              isbn13: true,
              doi: true,
              autores: {
                orderBy: [
                  {
                    ordem:
                      "asc",
                  },
                  {
                    id: "asc",
                  },
                ],
                select: {
                  funcao: true,
                  ordem: true,
                  autor: {
                    select: {
                      nome: true,
                    },
                  },
                },
              },
            },
          },
        );

      itensEncontrados.push(
        ...encontrados,
      );
    }

    const itensUnicos =
      Array.from(
        new Map(
          itensEncontrados.map(
            (item) => [
              item.id,
              item,
            ],
          ),
        ).values(),
      );

    const exemplaresEncontrados: Array<{
      id: number;
      itemId: number;
      status: string;
      codigoInterno:
        | string
        | null;
      codigoBarras:
        | string
        | null;
      numeroTombo:
        | string
        | null;
      patrimonio:
        | string
        | null;
      item: {
        titulo: string;
      };
    }> = [];

    const filtrosExemplares = [
      ...dividir(
        codigosInternos,
      ).map(
        (lote) => ({
          codigoInterno: {
            in: lote,
          },
        }),
      ),

      ...dividir(
        codigosBarras,
      ).map(
        (lote) => ({
          codigoBarras: {
            in: lote,
          },
        }),
      ),

      ...dividir(
        tombos,
      ).map(
        (lote) => ({
          numeroTombo: {
            in: lote,
          },
        }),
      ),

      ...dividir(
        patrimonios,
      ).map(
        (lote) => ({
          patrimonio: {
            in: lote,
          },
        }),
      ),
    ];

    for (
      const filtro of
      filtrosExemplares
    ) {
      const encontrados =
        await prisma.bibliotecaExemplar.findMany(
          {
            where: {
              instituicaoId:
                contexto.instituicaoId,
              ...filtro,
            },
            select: {
              id: true,
              itemId: true,
              status: true,
              codigoInterno: true,
              codigoBarras: true,
              numeroTombo: true,
              patrimonio: true,
              item: {
                select: {
                  titulo: true,
                },
              },
            },
          },
        );

      exemplaresEncontrados.push(
        ...encontrados,
      );
    }

    const exemplaresUnicos =
      Array.from(
        new Map(
          exemplaresEncontrados.map(
            (exemplar) => [
              exemplar.id,
              exemplar,
            ],
          ),
        ).values(),
      );

    const porIsbn10 =
      new Map<string, typeof itensUnicos[number]>();

    const porIsbn13 =
      new Map<string, typeof itensUnicos[number]>();

    const porDoi =
      new Map<string, typeof itensUnicos[number]>();


    const porIdPhanyx =
      new Map<number, typeof itensUnicos[number]>();

    const porTitulo =
      new Map<
        string,
        typeof itensUnicos
      >();

    for (
      const item of
      itensUnicos
    ) {
      porIdPhanyx.set(
        item.id,
        item,
      );

      const isbn10Item =
        chaveIsbn(
          item.isbn10,
        );

      const isbn13Item =
        chaveIsbn(
          item.isbn13,
        );

      const doiItem =
        chaveSimples(
          item.doi,
        );

      if (isbn10Item) {
        porIsbn10.set(
          isbn10Item,
          item,
        );
      }

      if (isbn13Item) {
        porIsbn13.set(
          isbn13Item,
          item,
        );
      }

      if (doiItem) {
        porDoi.set(
          doiItem,
          item,
        );
      }

      const tituloNormalizado =
        normalizarTextoComparacao(
          item.titulo,
        );

      const atuais =
        porTitulo.get(
          tituloNormalizado,
        ) ?? [];

      atuais.push(item);

      porTitulo.set(
        tituloNormalizado,
        atuais,
      );
    }

    const mapaCodigoInterno =
      new Map<string, typeof exemplaresUnicos[number]>();

    const mapaCodigoBarras =
      new Map<string, typeof exemplaresUnicos[number]>();

    const mapaTombo =
      new Map<string, typeof exemplaresUnicos[number]>();

    const mapaPatrimonio =
      new Map<string, typeof exemplaresUnicos[number]>();

    for (
      const exemplar of
      exemplaresUnicos
    ) {
      if (
        exemplar.codigoInterno
      ) {
        mapaCodigoInterno.set(
          chaveSimples(
            exemplar.codigoInterno,
          ),
          exemplar,
        );
      }

      if (
        exemplar.codigoBarras
      ) {
        mapaCodigoBarras.set(
          chaveSimples(
            exemplar.codigoBarras,
          ),
          exemplar,
        );
      }

      if (
        exemplar.numeroTombo
      ) {
        mapaTombo.set(
          chaveSimples(
            exemplar.numeroTombo,
          ),
          exemplar,
        );
      }

      if (
        exemplar.patrimonio
      ) {
        mapaPatrimonio.set(
          chaveSimples(
            exemplar.patrimonio,
          ),
          exemplar,
        );
      }
    }

    const gruposArquivo =
      new Map<
        string,
        number[]
      >();

    registros.forEach(
      (registro, indice) => {
        const chave =
          chaveObraArquivo(
            registro.dados,
          );

        const atuais =
          gruposArquivo.get(
            chave,
          ) ?? [];

        atuais.push(indice);

        gruposArquivo.set(
          chave,
          atuais,
        );
      },
    );

    const primeiroIndiceGrupo =
      new Map<
        string,
        number
      >();

    for (
      const [
        chave,
        indices,
      ] of gruposArquivo
    ) {
      primeiroIndiceGrupo.set(
        chave,
        indices[0],
      );
    }

    const valoresArquivo =
      new Map<
        string,
        Map<string, number[]>
      >();

    function registrarValorArquivo(
      tipo: string,
      valor:
        | string
        | undefined,
      indice: number,
    ) {
      const chave =
        chaveSimples(valor);

      if (!chave) return;

      if (
        !valoresArquivo.has(
          tipo,
        )
      ) {
        valoresArquivo.set(
          tipo,
          new Map(),
        );
      }

      const mapa =
        valoresArquivo.get(
          tipo,
        )!;

      const atuais =
        mapa.get(chave) ?? [];

      atuais.push(indice);

      mapa.set(
        chave,
        atuais,
      );
    }

    registros.forEach(
      (registro, indice) => {
        registrarValorArquivo(
          "codigoInterno",
          registro.dados
            .codigoInterno,
          indice,
        );

        registrarValorArquivo(
          "codigoBarras",
          registro.dados
            .codigoBarras,
          indice,
        );

        registrarValorArquivo(
          "numeroTombo",
          registro.dados
            .numeroTombo,
          indice,
        );
      },
    );

    const resultados =
      registros.map(
        (registro, indice) => {
          const dados =
            registro.dados;

          const titulo =
            dados.titulo?.trim() ??
            "";

          const autor =
            dados.autor?.trim() ??
            "";

          let acaoObra:
            AcaoObra;

          let motivoObra:
            string;

          let itemExistente:
            | {
                id: number;
                titulo: string;
                status: string;
              }
            | null = null;

          if (!titulo) {
            acaoObra =
              "INVALIDA";

            motivoObra =
              "TITULO_AUSENTE";
          } else {
            const idPhanyx =
              idPhanyxDoLegado(
                dados.idLegado,
              );

            const candidatoIdPhanyx =
              idPhanyx
                ? porIdPhanyx.get(
                    idPhanyx,
                  )
                : undefined;

            const porIdLegado =
              candidatoIdPhanyx &&
              normalizarTextoComparacao(
                candidatoIdPhanyx.titulo,
              ) ===
                normalizarTextoComparacao(
                  titulo,
                )
                ? candidatoIdPhanyx
                : undefined;

            const porIdentificador =
              porIdLegado ??
              (dados.isbn13
                ? porIsbn13.get(
                    chaveIsbn(
                      dados.isbn13,
                    ),
                  )
                : undefined) ??
              (dados.isbn10
                ? porIsbn10.get(
                    chaveIsbn(
                      dados.isbn10,
                    ),
                  )
                : undefined) ??
              (dados.doi
                ? porDoi.get(
                    chaveSimples(
                      dados.doi,
                    ),
                  )
                : undefined);

            if (
              porIdentificador
            ) {
              acaoObra =
                "VINCULAR_EXISTENTE";

              motivoObra =
                porIdLegado
                  ? "ID_PHANYX_EXISTENTE"
                  : "IDENTIFICADOR_EXISTENTE";

              itemExistente = {
                id:
                  porIdentificador.id,
                titulo:
                  porIdentificador.titulo,
                status:
                  porIdentificador.status,
              };
            } else {
              const chaveGrupo =
                chaveObraArquivo(
                  dados,
                );

              const primeiro =
                primeiroIndiceGrupo.get(
                  chaveGrupo,
                );

              const candidatosTitulo =
                porTitulo.get(
                  normalizarTextoComparacao(
                    titulo,
                  ),
                ) ?? [];

              const autorNormalizado =
                normalizarTextoComparacao(
                  autor,
                );

              const candidatoTituloAutor =
                candidatosTitulo.find(
                  (item) => {
                    if (
                      !autorNormalizado
                    ) {
                      return false;
                    }

                    return item.autores.some(
                      (vinculo) =>
                        normalizarTextoComparacao(
                          vinculo
                            .autor
                            .nome,
                        ) ===
                        autorNormalizado,
                    );
                  },
                );

              const candidatoSomenteTitulo =
                candidatosTitulo[0];

              if (
                candidatoTituloAutor
              ) {
                acaoObra =
                  "REVISAR_DUPLICIDADE";

                motivoObra =
                  "TITULO_AUTOR_EXISTENTE";

                itemExistente = {
                  id:
                    candidatoTituloAutor.id,
                  titulo:
                    candidatoTituloAutor.titulo,
                  status:
                    candidatoTituloAutor.status,
                };
              } else if (
                candidatoSomenteTitulo
              ) {
                acaoObra =
                  "REVISAR_DUPLICIDADE";

                motivoObra =
                  "TITULO_EXISTENTE";

                itemExistente = {
                  id:
                    candidatoSomenteTitulo.id,
                  titulo:
                    candidatoSomenteTitulo.titulo,
                  status:
                    candidatoSomenteTitulo.status,
                };
              } else if (
                primeiro !==
                  undefined &&
                primeiro !== indice
              ) {
                acaoObra =
                  "REUTILIZAR_DO_ARQUIVO";

                motivoObra =
                  "MESMA_OBRA_NO_ARQUIVO";
              } else {
                acaoObra =
                  "CRIAR_NOVA";

                motivoObra =
                  "OBRA_NOVA";
              }
            }
          }

          let situacaoExemplar:
            SituacaoExemplar =
              possuiDadosExemplar(
                dados,
              )
                ? "NOVO_EXEMPLAR"
                : "SEM_EXEMPLAR";

          const conflitos:
            Array<{
              tipo: string;
              valor: string;
              origem:
                | "BANCO"
                | "ARQUIVO";
              exemplarId?:
                number;
              itemId?:
                number;
              itemTitulo?:
                string;
            }> = [];

          const avisos:
            Array<{
              tipo: string;
              valor: string;
              exemplarId?:
                number;
              itemId?:
                number;
              itemTitulo?:
                string;
            }> = [];

          function verificarConflito(
            tipo:
              | "codigoInterno"
              | "codigoBarras"
              | "numeroTombo",
            valor:
              | string
              | undefined,
            mapaBanco:
              Map<
                string,
                typeof exemplaresUnicos[number]
              >,
          ) {
            const chave =
              chaveSimples(
                valor,
              );

            if (!chave) return;

            const existente =
              mapaBanco.get(
                chave,
              );

            if (existente) {
              conflitos.push({
                tipo,
                valor:
                  valor!,
                origem:
                  "BANCO",
                exemplarId:
                  existente.id,
                itemId:
                  existente.itemId,
                itemTitulo:
                  existente.item
                    .titulo,
              });
            }

            const indices =
              valoresArquivo
                .get(tipo)
                ?.get(chave) ??
              [];

            if (
              indices.length > 1
            ) {
              conflitos.push({
                tipo,
                valor:
                  valor!,
                origem:
                  "ARQUIVO",
              });
            }
          }

          verificarConflito(
            "codigoInterno",
            dados.codigoInterno,
            mapaCodigoInterno,
          );

          verificarConflito(
            "codigoBarras",
            dados.codigoBarras,
            mapaCodigoBarras,
          );

          verificarConflito(
            "numeroTombo",
            dados.numeroTombo,
            mapaTombo,
          );

          if (
            dados.patrimonio
          ) {
            const existente =
              mapaPatrimonio.get(
                chaveSimples(
                  dados.patrimonio,
                ),
              );

            if (existente) {
              avisos.push({
                tipo:
                  "patrimonio",
                valor:
                  dados.patrimonio,
                exemplarId:
                  existente.id,
                itemId:
                  existente.itemId,
                itemTitulo:
                  existente.item
                    .titulo,
              });
            }
          }

          if (
            conflitos.length > 0
          ) {
            situacaoExemplar =
              "CONFLITO";
          } else if (
            avisos.length > 0 &&
            situacaoExemplar ===
              "NOVO_EXEMPLAR"
          ) {
            situacaoExemplar =
              "AVISO";
          }

          return {
            indice,
            linha:
              registro.linha,
            titulo:
              titulo || null,
            autor:
              autor || null,
            isbn10:
              dados.isbn10 ??
              null,
            isbn13:
              dados.isbn13 ??
              null,
            doi:
              dados.doi ??
              null,
            codigoInterno:
              dados.codigoInterno ??
              null,
            codigoBarras:
              dados.codigoBarras ??
              null,
            numeroTombo:
              dados.numeroTombo ??
              null,
            patrimonio:
              dados.patrimonio ??
              null,
            acaoObra,
            motivoObra,
            itemExistente,
            situacaoExemplar,
            conflitos,
            avisos,
          };
        },
      );

    const resumo = {
      registros:
        resultados.length,

      novasObras:
        resultados.filter(
          (resultado) =>
            resultado.acaoObra ===
            "CRIAR_NOVA",
        ).length,

      reutilizacoesArquivo:
        resultados.filter(
          (resultado) =>
            resultado.acaoObra ===
            "REUTILIZAR_DO_ARQUIVO",
        ).length,

      obrasExistentes:
        resultados.filter(
          (resultado) =>
            resultado.acaoObra ===
            "VINCULAR_EXISTENTE",
        ).length,

      possiveisDuplicidades:
        resultados.filter(
          (resultado) =>
            resultado.acaoObra ===
            "REVISAR_DUPLICIDADE",
        ).length,

      invalidos:
        resultados.filter(
          (resultado) =>
            resultado.acaoObra ===
            "INVALIDA",
        ).length,

      novosExemplares:
        resultados.filter(
          (resultado) =>
            resultado.situacaoExemplar ===
              "NOVO_EXEMPLAR" ||
            resultado.situacaoExemplar ===
              "AVISO",
        ).length,

      conflitosExemplares:
        resultados.filter(
          (resultado) =>
            resultado.situacaoExemplar ===
            "CONFLITO",
        ).length,

      avisosExemplares:
        resultados.filter(
          (resultado) =>
            resultado.situacaoExemplar ===
            "AVISO",
        ).length,
    };

    return responder({
      ok: true,
      resumo,
      resultados,
    });
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}