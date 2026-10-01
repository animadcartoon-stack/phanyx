import * as XLSX from "xlsx";

export class ErroArquivoImportacao extends Error {
  codigo: string;
  status: number;

  constructor(
    codigo: string,
    mensagem: string,
    status = 400,
  ) {
    super(mensagem);
    this.name = "ErroArquivoImportacao";
    this.codigo = codigo;
    this.status = status;
  }
}

export type GrupoCampoImportacao =
  | "OBRA"
  | "AUTORIA"
  | "PUBLICACAO"
  | "CLASSIFICACAO"
  | "EXEMPLAR"
  | "AQUISICAO";

export type CampoImportacao = {
  chave: string;
  grupo: GrupoCampoImportacao;
  obrigatorio?: boolean;
  aliases: string[];
};

export const CAMPOS_IMPORTACAO: CampoImportacao[] = [
  {
    chave: "titulo",
    grupo: "OBRA",
    obrigatorio: true,
    aliases: [
      "titulo",
      "título",
      "title",
      "nome da obra",
      "obra",
    ],
  },
  {
    chave: "subtitulo",
    grupo: "OBRA",
    aliases: [
      "subtitulo",
      "subtítulo",
      "subtitle",
    ],
  },
  {
    chave: "tipo",
    grupo: "OBRA",
    aliases: [
      "tipo",
      "tipo de material",
      "material",
      "material type",
    ],
  },
  {
    chave: "palavrasChave",
    grupo: "OBRA",
    aliases: [
      "palavras chave",
      "palavras-chave",
      "keywords",
      "assunto",
      "assuntos",
      "subject",
      "subjects",
    ],
  },
  {
    chave: "capaUrl",
    grupo: "OBRA",
    aliases: [
      "capa",
      "capa url",
      "url da capa",
      "url capa",
      "imagem",
      "imagem da capa",
      "cover",
      "cover url",
      "cover image",
      "image url",
      "thumbnail url",
    ],
  },
  {
    chave: "miniaturaUrl",
    grupo: "OBRA",
    aliases: [
      "miniatura",
      "miniatura url",
      "url miniatura",
      "thumbnail",
      "thumbnail url",
      "thumb",
    ],
  },
  {
    chave: "arquivoCapa",
    grupo: "OBRA",
    aliases: [
      "arquivo capa",
      "arquivo da capa",
      "nome arquivo capa",
      "nome do arquivo da capa",
      "cover file",
      "cover filename",
      "image file",
      "image filename",
    ],
  },
  {
    chave: "idLegado",
    grupo: "OBRA",
    aliases: [
      "id legado",
      "codigo legado",
      "código legado",
      "id antigo",
      "codigo antigo",
      "código antigo",
      "legacy id",
      "legacy code",
      "record id",
      "registro antigo",
    ],
  },  {
    chave: "autor",
    grupo: "AUTORIA",
    aliases: [
      "autor",
      "autor principal",
      "author",
      "main author",
    ],
  },
  {
    chave: "coautor",
    grupo: "AUTORIA",
    aliases: [
      "coautor",
      "co-autor",
      "coauthor",
      "secondary author",
      "autor secundario",
      "autor secundário",
    ],
  },
  {
    chave: "organizador",
    grupo: "AUTORIA",
    aliases: [
      "organizador",
      "organizacao",
      "organização",
      "organizer",
    ],
  },
  {
    chave: "tradutor",
    grupo: "AUTORIA",
    aliases: [
      "tradutor",
      "translator",
    ],
  },
  {
    chave: "orientador",
    grupo: "AUTORIA",
    aliases: [
      "orientador",
      "advisor",
      "supervisor",
    ],
  },
  {
    chave: "colaborador",
    grupo: "AUTORIA",
    aliases: [
      "colaborador",
      "contributor",
    ],
  },
  {
    chave: "editora",
    grupo: "PUBLICACAO",
    aliases: [
      "editora",
      "publisher",
      "editorial",
    ],
  },
  {
    chave: "isbn",
    grupo: "PUBLICACAO",
    aliases: [
      "isbn",
    ],
  },
  {
    chave: "isbn10",
    grupo: "PUBLICACAO",
    aliases: [
      "isbn10",
      "isbn 10",
      "isbn-10",
    ],
  },
  {
    chave: "isbn13",
    grupo: "PUBLICACAO",
    aliases: [
      "isbn13",
      "isbn 13",
      "isbn-13",
    ],
  },
  {
    chave: "issn",
    grupo: "PUBLICACAO",
    aliases: [
      "issn",
    ],
  },
  {
    chave: "doi",
    grupo: "PUBLICACAO",
    aliases: [
      "doi",
    ],
  },
  {
    chave: "idioma",
    grupo: "PUBLICACAO",
    aliases: [
      "idioma",
      "language",
      "lang",
    ],
  },
  {
    chave: "paisPublicacao",
    grupo: "PUBLICACAO",
    aliases: [
      "pais de publicacao",
      "país de publicação",
      "pais publicacao",
      "país publicação",
      "publication country",
      "country",
    ],
  },
  {
    chave: "anoPublicacao",
    grupo: "PUBLICACAO",
    aliases: [
      "ano",
      "ano de publicacao",
      "ano de publicação",
      "publication year",
      "year",
    ],
  },
  {
    chave: "edicao",
    grupo: "PUBLICACAO",
    aliases: [
      "edicao",
      "edição",
      "edition",
    ],
  },
  {
    chave: "volume",
    grupo: "PUBLICACAO",
    aliases: [
      "volume",
      "vol",
    ],
  },
  {
    chave: "numero",
    grupo: "PUBLICACAO",
    aliases: [
      "numero",
      "número",
      "issue",
    ],
  },
  {
    chave: "numeroPaginas",
    grupo: "PUBLICACAO",
    aliases: [
      "paginas",
      "páginas",
      "numero de paginas",
      "número de páginas",
      "pages",
    ],
  },
  {
    chave: "classificacaoBibliografica",
    grupo: "CLASSIFICACAO",
    aliases: [
      "classificacao",
      "classificação",
      "classificacao bibliografica",
      "classificação bibliográfica",
      "classification",
    ],
  },
  {
    chave: "cdd",
    grupo: "CLASSIFICACAO",
    aliases: [
      "cdd",
      "dewey",
      "classificacao cdd",
      "classificação cdd",
    ],
  },
  {
    chave: "cdu",
    grupo: "CLASSIFICACAO",
    aliases: [
      "cdu",
      "udc",
      "classificacao cdu",
      "classificação cdu",
    ],
  },
  {
    chave: "codigoCutter",
    grupo: "CLASSIFICACAO",
    aliases: [
      "cutter",
      "codigo cutter",
      "código cutter",
    ],
  },
  {
    chave: "codigoChamada",
    grupo: "CLASSIFICACAO",
    aliases: [
      "numero de chamada",
      "número de chamada",
      "codigo de chamada",
      "código de chamada",
      "call number",
    ],
  },
  {
    chave: "codigoInterno",
    grupo: "EXEMPLAR",
    aliases: [
      "codigo interno",
      "código interno",
      "codigo do exemplar",
      "código do exemplar",
      "exemplar",
      "copy id",
    ],
  },
  {
    chave: "codigoBarras",
    grupo: "EXEMPLAR",
    aliases: [
      "codigo de barras",
      "código de barras",
      "barcode",
      "bar code",
    ],
  },
  {
    chave: "numeroTombo",
    grupo: "EXEMPLAR",
    aliases: [
      "tombo",
      "numero de tombo",
      "número de tombo",
      "registro",
      "accession number",
    ],
  },
  {
    chave: "patrimonio",
    grupo: "EXEMPLAR",
    aliases: [
      "patrimonio",
      "patrimônio",
      "numero patrimonio",
      "número patrimônio",
      "asset",
      "asset number",
    ],
  },
  {
    chave: "setor",
    grupo: "EXEMPLAR",
    aliases: [
      "setor",
      "sector",
      "section",
    ],
  },
  {
    chave: "sala",
    grupo: "EXEMPLAR",
    aliases: [
      "sala",
      "room",
    ],
  },
  {
    chave: "corredor",
    grupo: "EXEMPLAR",
    aliases: [
      "corredor",
      "aisle",
    ],
  },
  {
    chave: "estante",
    grupo: "EXEMPLAR",
    aliases: [
      "estante",
      "shelf unit",
      "bookcase",
    ],
  },
  {
    chave: "prateleira",
    grupo: "EXEMPLAR",
    aliases: [
      "prateleira",
      "shelf",
    ],
  },
  {
    chave: "localizacaoCompleta",
    grupo: "EXEMPLAR",
    aliases: [
      "localizacao",
      "localização",
      "localizacao completa",
      "localização completa",
      "location",
    ],
  },
  {
    chave: "dataAquisicao",
    grupo: "AQUISICAO",
    aliases: [
      "data de aquisicao",
      "data de aquisição",
      "aquisicao",
      "aquisição",
      "acquisition date",
    ],
  },
  {
    chave: "formaAquisicao",
    grupo: "AQUISICAO",
    aliases: [
      "forma de aquisicao",
      "forma de aquisição",
      "origem da aquisicao",
      "origem da aquisição",
      "acquisition type",
    ],
  },
  {
    chave: "fornecedor",
    grupo: "AQUISICAO",
    aliases: [
      "fornecedor",
      "supplier",
      "vendor",
    ],
  },
  {
    chave: "valorAquisicao",
    grupo: "AQUISICAO",
    aliases: [
      "valor",
      "valor de aquisicao",
      "valor de aquisição",
      "preco",
      "preço",
      "acquisition value",
      "price",
    ],
  },
  {
    chave: "observacoes",
    grupo: "EXEMPLAR",
    aliases: [
      "observacoes",
      "observações",
      "observacao",
      "observação",
      "notes",
      "note",
    ],
  },
];

function textoCelula(valor: unknown) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  return String(valor)
    .replace(/\uFEFF/g, "")
    .trim();
}

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_./\\()[\]{}:;-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ALIASES_NORMALIZADOS =
  CAMPOS_IMPORTACAO.map((campo) => ({
    ...campo,
    aliasesNormalizados: Array.from(
      new Set([
        normalizar(campo.chave),
        ...campo.aliases.map(normalizar),
      ]),
    ),
  }));

function sugerirDestino(cabecalho: string) {
  const valor = normalizar(cabecalho);

  if (!valor) {
    return null;
  }

  for (const campo of ALIASES_NORMALIZADOS) {
    if (
      campo.aliasesNormalizados.includes(valor)
    ) {
      return {
        chave: campo.chave,
        grupo: campo.grupo,
        confianca: "ALTA" as const,
      };
    }
  }

  return null;
}

function encontrarIndiceDestino(
  colunas: Array<{
    indice: number;
    destinoSugerido: string | null;
  }>,
  destino: string,
) {
  return (
    colunas.find(
      (coluna) =>
        coluna.destinoSugerido === destino,
    )?.indice ?? null
  );
}

function chaveIdentificador(valor: string) {
  return valor
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "");
}

function contarDuplicados(
  linhas: string[][],
  indice: number | null,
) {
  if (indice === null) {
    return 0;
  }

  const contagem = new Map<string, number>();

  for (const linha of linhas) {
    const bruto = textoCelula(linha[indice]);

    if (!bruto) continue;

    const chave = chaveIdentificador(bruto);

    if (!chave) continue;

    contagem.set(
      chave,
      (contagem.get(chave) ?? 0) + 1,
    );
  }

  let duplicados = 0;

  for (const quantidade of contagem.values()) {
    if (quantidade > 1) {
      duplicados += quantidade - 1;
    }
  }

  return duplicados;
}


type SubcampoMarcImportacao = {
  codigo: string;
  valor: string;
};

type CampoMarcImportacao = {
  tag: string;
  indicadores: string;
  valorControle?: string;
  subcampos: SubcampoMarcImportacao[];
};

type RegistroMarcImportacao = {
  leader: string;
  campos: CampoMarcImportacao[];
};

const COLUNAS_MARC_IMPORTACAO: Array<{
  chave: string;
  nome: string;
  grupo: GrupoCampoImportacao;
}> = [
  {
    chave: "capaUrl",
    nome: "MARC 856$u · URL da capa",
    grupo: "OBRA",
  },
  {
    chave: "idLegado",
    nome: "MARC 001 · ID do registro",
    grupo: "OBRA",
  },
  {
    chave: "titulo",
    nome: "MARC 245$a · Título",
    grupo: "OBRA",
  },
  {
    chave: "subtitulo",
    nome: "MARC 245$b · Subtítulo",
    grupo: "OBRA",
  },
  {
    chave: "tipo",
    nome: "Leader · Tipo de material",
    grupo: "OBRA",
  },
  {
    chave: "autor",
    nome: "MARC 100/110/111 · Autor principal",
    grupo: "AUTORIA",
  },
  {
    chave: "coautor",
    nome: "MARC 700/710/711 · Outras autorias",
    grupo: "AUTORIA",
  },
  {
    chave: "organizador",
    nome: "MARC 700 · Organizador",
    grupo: "AUTORIA",
  },
  {
    chave: "tradutor",
    nome: "MARC 700 · Tradutor",
    grupo: "AUTORIA",
  },
  {
    chave: "editora",
    nome: "MARC 264$b / 260$b · Editora",
    grupo: "PUBLICACAO",
  },
  {
    chave: "isbn",
    nome: "MARC 020$a · ISBN",
    grupo: "PUBLICACAO",
  },
  {
    chave: "issn",
    nome: "MARC 022$a · ISSN",
    grupo: "PUBLICACAO",
  },
  {
    chave: "doi",
    nome: "MARC 024$a · DOI",
    grupo: "PUBLICACAO",
  },
  {
    chave: "idioma",
    nome: "MARC 008 · Idioma",
    grupo: "PUBLICACAO",
  },
  {
    chave: "anoPublicacao",
    nome: "MARC 264$c / 260$c · Ano",
    grupo: "PUBLICACAO",
  },
  {
    chave: "edicao",
    nome: "MARC 250$a · Edição",
    grupo: "PUBLICACAO",
  },
  {
    chave: "numeroPaginas",
    nome: "MARC 300$a · Páginas",
    grupo: "PUBLICACAO",
  },
  {
    chave: "palavrasChave",
    nome: "MARC 650/651 · Assuntos",
    grupo: "OBRA",
  },
  {
    chave: "cdd",
    nome: "MARC 082$a · CDD",
    grupo: "CLASSIFICACAO",
  },
  {
    chave: "cdu",
    nome: "MARC 080$a · CDU",
    grupo: "CLASSIFICACAO",
  },
  {
    chave: "codigoCutter",
    nome: "MARC 090$b / 050$b · Cutter",
    grupo: "CLASSIFICACAO",
  },
  {
    chave: "codigoChamada",
    nome: "MARC 090 / 050 · Número de chamada",
    grupo: "CLASSIFICACAO",
  },
];

function extensaoImportacaoMarc(
  nomeArquivo: string,
) {
  return (
    nomeArquivo
      .toLowerCase()
      .split(".")
      .pop() ?? ""
  );
}

function ehArquivoMarc(
  nomeArquivo: string,
) {
  const extensao =
    extensaoImportacaoMarc(
      nomeArquivo,
    );

  return (
    extensao === "mrc" ||
    extensao === "marc" ||
    extensao === "xml"
  );
}

function decodificarXml(
  valor: string,
) {
  return valor
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_, hexadecimal: string) =>
        String.fromCodePoint(
          Number.parseInt(
            hexadecimal,
            16,
          ),
        ),
    )
    .replace(
      /&#([0-9]+);/g,
      (_, decimal: string) =>
        String.fromCodePoint(
          Number.parseInt(
            decimal,
            10,
          ),
        ),
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function lerAtributoXml(
  atributos: string,
  nome: string,
) {
  const expressao =
    new RegExp(
      `${nome}\\s*=\\s*["']([^"']*)["']`,
      "i",
    );

  return (
    atributos.match(
      expressao,
    )?.[1] ?? ""
  );
}

function interpretarMarcXml(
  buffer: Buffer,
) {
  const xml =
    buffer
      .toString("utf8")
      .replace(/^\uFEFF/, "");

  const registros:
    RegistroMarcImportacao[] = [];

  const regexRegistro =
    /<(?:[\w.-]+:)?record\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?record>/gi;

  let resultadoRegistro:
    RegExpExecArray | null;

  while (
    (
      resultadoRegistro =
        regexRegistro.exec(xml)
    )
  ) {
    const corpo =
      resultadoRegistro[1];

    const leader =
      decodificarXml(
        corpo.match(
          /<(?:[\w.-]+:)?leader\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?leader>/i,
        )?.[1] ?? "",
      );

    const campos:
      CampoMarcImportacao[] = [];

    const regexControle =
      /<(?:[\w.-]+:)?controlfield\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?controlfield>/gi;

    let controle:
      RegExpExecArray | null;

    while (
      (
        controle =
          regexControle.exec(
            corpo,
          )
      )
    ) {
      const tag =
        lerAtributoXml(
          controle[1],
          "tag",
        );

      if (!tag) {
        continue;
      }

      campos.push({
        tag,
        indicadores: "",
        valorControle:
          decodificarXml(
            controle[2],
          ),
        subcampos: [],
      });
    }

    const regexDados =
      /<(?:[\w.-]+:)?datafield\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?datafield>/gi;

    let dados:
      RegExpExecArray | null;

    while (
      (
        dados =
          regexDados.exec(
            corpo,
          )
      )
    ) {
      const atributos =
        dados[1];

      const tag =
        lerAtributoXml(
          atributos,
          "tag",
        );

      if (!tag) {
        continue;
      }

      const ind1 =
        lerAtributoXml(
          atributos,
          "ind1",
        );

      const ind2 =
        lerAtributoXml(
          atributos,
          "ind2",
        );

      const subcampos:
        SubcampoMarcImportacao[] =
          [];

      const regexSubcampo =
        /<(?:[\w.-]+:)?subfield\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?subfield>/gi;

      let subcampo:
        RegExpExecArray | null;

      while (
        (
          subcampo =
            regexSubcampo.exec(
              dados[2],
            )
        )
      ) {
        const codigo =
          lerAtributoXml(
            subcampo[1],
            "code",
          );

        if (!codigo) {
          continue;
        }

        subcampos.push({
          codigo,
          valor:
            decodificarXml(
              subcampo[2],
            ),
        });
      }

      campos.push({
        tag,
        indicadores:
          `${ind1 || " "}${ind2 || " "}`,
        subcampos,
      });
    }

    registros.push({
      leader,
      campos,
    });
  }

  if (
    registros.length === 0
  ) {
    throw new ErroArquivoImportacao(
      "MARCXML_SEM_REGISTROS",
      "O arquivo XML não contém registros MARCXML reconhecíveis.",
    );
  }

  return registros;
}

function decodificarCampoMarc(
  buffer: Buffer,
  utf8: boolean,
) {
  const texto =
    buffer.toString(
      utf8
        ? "utf8"
        : "latin1",
    );

  return texto
    .replace(/\u0000/g, "")
    .trim();
}

function interpretarMarcIso2709(
  bufferOriginal: Buffer,
) {
  let deslocamento = 0;

  if (
    bufferOriginal.length >= 3 &&
    bufferOriginal[0] === 0xef &&
    bufferOriginal[1] === 0xbb &&
    bufferOriginal[2] === 0xbf
  ) {
    deslocamento = 3;
  }

  const registros:
    RegistroMarcImportacao[] = [];

  while (
    deslocamento <
    bufferOriginal.length
  ) {
    while (
      deslocamento <
        bufferOriginal.length &&
      (
        bufferOriginal[
          deslocamento
        ] === 0x1d ||
        bufferOriginal[
          deslocamento
        ] === 0x0a ||
        bufferOriginal[
          deslocamento
        ] === 0x0d
      )
    ) {
      deslocamento += 1;
    }

    if (
      deslocamento >=
      bufferOriginal.length
    ) {
      break;
    }

    if (
      deslocamento + 24 >
      bufferOriginal.length
    ) {
      throw new ErroArquivoImportacao(
        "MARC21_REGISTRO_INCOMPLETO",
        "O arquivo MARC21 termina com um registro incompleto.",
      );
    }

    const tamanhoRegistro =
      Number.parseInt(
        bufferOriginal
          .subarray(
            deslocamento,
            deslocamento + 5,
          )
          .toString("ascii"),
        10,
      );

    if (
      !Number.isInteger(
        tamanhoRegistro,
      ) ||
      tamanhoRegistro < 25 ||
      deslocamento +
        tamanhoRegistro >
        bufferOriginal.length
    ) {
      throw new ErroArquivoImportacao(
        "MARC21_ESTRUTURA_INVALIDA",
        "Não foi possível interpretar a estrutura ISO2709 do arquivo MARC21.",
      );
    }

    const registroBuffer =
      bufferOriginal.subarray(
        deslocamento,
        deslocamento +
          tamanhoRegistro,
      );

    const leader =
      registroBuffer
        .subarray(
          0,
          24,
        )
        .toString(
          "ascii",
        );

    const utf8 =
      leader[9] === "a";

    const enderecoBase =
      Number.parseInt(
        leader.slice(
          12,
          17,
        ),
        10,
      );

    const fimDiretorio =
      registroBuffer.indexOf(
        0x1e,
        24,
      );

    if (
      !Number.isInteger(
        enderecoBase,
      ) ||
      enderecoBase <= 24 ||
      fimDiretorio < 24
    ) {
      throw new ErroArquivoImportacao(
        "MARC21_DIRETORIO_INVALIDO",
        "O diretório do registro MARC21 é inválido.",
      );
    }

    const diretorio =
      registroBuffer
        .subarray(
          24,
          fimDiretorio,
        )
        .toString("ascii");

    if (
      diretorio.length %
        12 !==
      0
    ) {
      throw new ErroArquivoImportacao(
        "MARC21_DIRETORIO_INVALIDO",
        "O diretório do registro MARC21 possui tamanho inválido.",
      );
    }

    const campos:
      CampoMarcImportacao[] =
        [];

    for (
      let indice = 0;
      indice <
      diretorio.length;
      indice += 12
    ) {
      const entrada =
        diretorio.slice(
          indice,
          indice + 12,
        );

      const tag =
        entrada.slice(
          0,
          3,
        );

      const tamanhoCampo =
        Number.parseInt(
          entrada.slice(
            3,
            7,
          ),
          10,
        );

      const inicioRelativo =
        Number.parseInt(
          entrada.slice(
            7,
            12,
          ),
          10,
        );

      if (
        !tag ||
        !Number.isInteger(
          tamanhoCampo,
        ) ||
        tamanhoCampo <= 0 ||
        !Number.isInteger(
          inicioRelativo,
        ) ||
        inicioRelativo < 0
      ) {
        continue;
      }

      const inicio =
        enderecoBase +
        inicioRelativo;

      const fim =
        Math.min(
          registroBuffer.length,
          inicio +
            Math.max(
              0,
              tamanhoCampo - 1,
            ),
        );

      if (
        inicio < 0 ||
        inicio >= fim
      ) {
        continue;
      }

      const conteudo =
        registroBuffer.subarray(
          inicio,
          fim,
        );

      if (
        Number(tag) < 10
      ) {
        campos.push({
          tag,
          indicadores: "",
          valorControle:
            decodificarCampoMarc(
              conteudo,
              utf8,
            ),
          subcampos: [],
        });

        continue;
      }

      const indicadores =
        conteudo
          .subarray(
            0,
            Math.min(
              2,
              conteudo.length,
            ),
          )
          .toString(
            "latin1",
          );

      const subcampos:
        SubcampoMarcImportacao[] =
          [];

      let cursor = 2;

      while (
        cursor <
        conteudo.length
      ) {
        if (
          conteudo[cursor] !==
          0x1f
        ) {
          cursor += 1;
          continue;
        }

        if (
          cursor + 1 >=
          conteudo.length
        ) {
          break;
        }

        const codigo =
          String.fromCharCode(
            conteudo[
              cursor + 1
            ],
          );

        const inicioValor =
          cursor + 2;

        let fimValor =
          inicioValor;

        while (
          fimValor <
            conteudo.length &&
          conteudo[
            fimValor
          ] !== 0x1f
        ) {
          fimValor += 1;
        }

        const valor =
          decodificarCampoMarc(
            conteudo.subarray(
              inicioValor,
              fimValor,
            ),
            utf8,
          );

        if (valor) {
          subcampos.push({
            codigo,
            valor,
          });
        }

        cursor =
          fimValor;
      }

      campos.push({
        tag,
        indicadores,
        subcampos,
      });
    }

    registros.push({
      leader,
      campos,
    });

    deslocamento +=
      tamanhoRegistro;
  }

  if (
    registros.length === 0
  ) {
    throw new ErroArquivoImportacao(
      "MARC21_SEM_REGISTROS",
      "O arquivo não contém registros MARC21 reconhecíveis.",
    );
  }

  return registros;
}

function lerRegistrosMarc(
  buffer: Buffer,
  nomeArquivo: string,
) {
  const extensao =
    extensaoImportacaoMarc(
      nomeArquivo,
    );

  const inicioTexto =
    buffer
      .subarray(
        0,
        Math.min(
          buffer.length,
          200,
        ),
      )
      .toString(
        "utf8",
      )
      .trimStart();

  if (
    extensao === "xml" ||
    inicioTexto.startsWith(
      "<?xml",
    ) ||
    inicioTexto.startsWith(
      "<collection",
    ) ||
    inicioTexto.includes(
      "<record",
    )
  ) {
    return interpretarMarcXml(
      buffer,
    );
  }

  return interpretarMarcIso2709(
    buffer,
  );
}

function camposMarc(
  registro:
    RegistroMarcImportacao,
  tag: string,
) {
  return registro.campos.filter(
    (campo) =>
      campo.tag === tag,
  );
}

function valoresMarc(
  registro:
    RegistroMarcImportacao,
  tag: string,
  codigo: string,
) {
  return camposMarc(
    registro,
    tag,
  ).flatMap(
    (campo) =>
      campo.subcampos
        .filter(
          (subcampo) =>
            subcampo.codigo ===
            codigo,
        )
        .map(
          (subcampo) =>
            subcampo.valor,
        ),
  );
}

function primeiroMarc(
  registro:
    RegistroMarcImportacao,
  tag: string,
  codigo: string,
) {
  return (
    valoresMarc(
      registro,
      tag,
      codigo,
    )[0] ?? ""
  );
}

function controleMarc(
  registro:
    RegistroMarcImportacao,
  tag: string,
) {
  return (
    camposMarc(
      registro,
      tag,
    )[0]?.valorControle ??
    ""
  );
}

function limparPontuacaoMarc(
  valor:
    | string
    | null
    | undefined,
) {
  return String(
    valor ?? "",
  )
    .trim()
    .replace(
      /[\s/:;,=]+$/g,
      "",
    )
    .trim();
}

function normalizarIsbnMarc(
  valores: string[],
) {
  for (
    const valor of valores
  ) {
    const semQualificadores =
      valor.replace(
        /\([^)]*\)/g,
        " ",
      );

    const candidatos =
      semQualificadores.match(
        /(?:97[89][0-9Xx\-\s]{10,}|[0-9Xx][0-9Xx\-\s]{8,})/g,
      ) ?? [];

    for (
      const candidato of
      candidatos
    ) {
      const limpo =
        candidato
          .toUpperCase()
          .replace(
            /[^0-9X]/g,
            "",
          );

      if (
        limpo.length === 10 ||
        limpo.length === 13
      ) {
        return limpo;
      }
    }
  }

  return "";
}

function idiomaMarc(
  registro:
    RegistroMarcImportacao,
) {
  const campo008 =
    controleMarc(
      registro,
      "008",
    );

  if (
    campo008.length < 38
  ) {
    return "";
  }

  const codigo =
    campo008
      .slice(
        35,
        38,
      )
      .toLowerCase();

  const equivalencias:
    Record<string, string> = {
      por: "pt-BR",
      eng: "en-US",
      spa: "es-ES",
      fre: "fr-FR",
      fra: "fr-FR",
    };

  return (
    equivalencias[
      codigo
    ] ??
    codigo
  );
}

function anoMarc(
  registro:
    RegistroMarcImportacao,
) {
  const publicacao =
    primeiroMarc(
      registro,
      "264",
      "c",
    ) ||
    primeiroMarc(
      registro,
      "260",
      "c",
    );

  const encontradoPublicacao =
    publicacao.match(
      /(?:18|19|20|21)\d{2}/,
    )?.[0];

  if (
    encontradoPublicacao
  ) {
    return encontradoPublicacao;
  }

  const campo008 =
    controleMarc(
      registro,
      "008",
    );

  const data1 =
    campo008.slice(
      7,
      11,
    );

  return /^\d{4}$/.test(
    data1,
  )
    ? data1
    : "";
}

function tipoMarc(
  registro:
    RegistroMarcImportacao,
) {
  const tipo =
    registro.leader[6] ?? "";

  const nivel =
    registro.leader[7] ?? "";

  if (
    nivel === "s" ||
    nivel === "b"
  ) {
    return "PERIODICO";
  }

  if (tipo === "g") {
    return "VIDEO";
  }

  if (
    tipo === "i" ||
    tipo === "j"
  ) {
    return "AUDIO";
  }

  return "LIVRO";
}

function paginasMarc(
  registro:
    RegistroMarcImportacao,
) {
  const descricao =
    primeiroMarc(
      registro,
      "300",
      "a",
    );

  const pagina =
    descricao.match(
      /(\d+)\s*p(?:\.|\b)/i,
    )?.[1];

  if (pagina) {
    return pagina;
  }

  const numeros =
    Array.from(
      descricao.matchAll(
        /\d+/g,
      ),
    )
      .map(
        (resultado) =>
          Number(
            resultado[0],
          ),
      )
      .filter(
        Number.isFinite,
      );

  if (
    numeros.length === 0
  ) {
    return "";
  }

  return String(
    Math.max(
      ...numeros,
    ),
  );
}

function autoriasMarc(
  registro:
    RegistroMarcImportacao,
) {
  const principal =
    limparPontuacaoMarc(
      primeiroMarc(
        registro,
        "100",
        "a",
      ) ||
        primeiroMarc(
          registro,
          "110",
          "a",
        ) ||
        primeiroMarc(
          registro,
          "111",
          "a",
        ),
    );

  const secundarias =
    [
      ...camposMarc(
        registro,
        "700",
      ),
      ...camposMarc(
        registro,
        "710",
      ),
      ...camposMarc(
        registro,
        "711",
      ),
    ];

  const coautores:
    string[] = [];

  const organizadores:
    string[] = [];

  const tradutores:
    string[] = [];

  for (
    const campo of
    secundarias
  ) {
    const nome =
      limparPontuacaoMarc(
        campo.subcampos.find(
          (subcampo) =>
            subcampo.codigo ===
            "a",
        )?.valor,
      );

    if (!nome) {
      continue;
    }

    const relacao =
      campo.subcampos
        .filter(
          (subcampo) =>
            subcampo.codigo ===
              "e" ||
            subcampo.codigo ===
              "4",
        )
        .map(
          (subcampo) =>
            subcampo.valor
              .toLowerCase(),
        )
        .join(" ");

    if (
      /\b(trad|translator|trl)\b/i.test(
        relacao,
      )
    ) {
      tradutores.push(
        nome,
      );
    } else if (
      /\b(organiz|organizer|editor|edt|org)\b/i.test(
        relacao,
      )
    ) {
      organizadores.push(
        nome,
      );
    } else {
      coautores.push(
        nome,
      );
    }
  }

  let autor =
    principal;

  if (
    !autor &&
    coautores.length > 0
  ) {
    autor =
      coautores.shift() ??
      "";
  }

  return {
    autor,
    coautor:
      Array.from(
        new Set(
          coautores,
        ),
      ).join(" | "),
    organizador:
      Array.from(
        new Set(
          organizadores,
        ),
      ).join(" | "),
    tradutor:
      Array.from(
        new Set(
          tradutores,
        ),
      ).join(" | "),
  };
}

function dadosRegistroMarc(
  registro:
    RegistroMarcImportacao,
) {
  const autorias =
    autoriasMarc(
      registro,
    );

  const partesTitulo = [
    primeiroMarc(
      registro,
      "245",
      "a",
    ),
    primeiroMarc(
      registro,
      "245",
      "n",
    ),
    primeiroMarc(
      registro,
      "245",
      "p",
    ),
  ]
    .map(
      limparPontuacaoMarc,
    )
    .filter(Boolean);

  const titulo =
    partesTitulo.join(
      " ",
    );

  const subtitulo =
    limparPontuacaoMarc(
      primeiroMarc(
        registro,
        "245",
        "b",
      ),
    );

  const editora =
    limparPontuacaoMarc(
      primeiroMarc(
        registro,
        "264",
        "b",
      ) ||
        primeiroMarc(
          registro,
          "260",
          "b",
        ),
    );

  const isbn =
    normalizarIsbnMarc(
      valoresMarc(
        registro,
        "020",
        "a",
      ),
    );

  const issn =
    limparPontuacaoMarc(
      primeiroMarc(
        registro,
        "022",
        "a",
      ),
    );

  let doi = "";

  for (
    const campo of
    camposMarc(
      registro,
      "024",
    )
  ) {
    const valor =
      campo.subcampos.find(
        (subcampo) =>
          subcampo.codigo ===
          "a",
      )?.valor ?? "";

    const origem =
      campo.subcampos.find(
        (subcampo) =>
          subcampo.codigo ===
          "2",
      )?.valor ?? "";

    if (
      origem
        .toLowerCase()
        .includes("doi") ||
      /^10\.\d{4,9}\//i.test(
        valor,
      )
    ) {
      doi =
        valor
          .replace(
            /^https?:\/\/(?:dx\.)?doi\.org\//i,
            "",
          )
          .replace(
            /^doi:\s*/i,
            "",
          )
          .trim();

      break;
    }
  }

  const assuntos =
    [
      ...valoresMarc(
        registro,
        "650",
        "a",
      ),
      ...valoresMarc(
        registro,
        "651",
        "a",
      ),
    ]
      .map(
        limparPontuacaoMarc,
      )
      .filter(Boolean);

  const cdd =
    limparPontuacaoMarc(
      primeiroMarc(
        registro,
        "082",
        "a",
      ),
    );

  const cdu =
    limparPontuacaoMarc(
      primeiroMarc(
        registro,
        "080",
        "a",
      ),
    );

  const chamadaA =
    limparPontuacaoMarc(
      primeiroMarc(
        registro,
        "090",
        "a",
      ) ||
        primeiroMarc(
          registro,
          "050",
          "a",
        ),
    );

  const chamadaB =
    limparPontuacaoMarc(
      primeiroMarc(
        registro,
        "090",
        "b",
      ) ||
        primeiroMarc(
          registro,
          "050",
          "b",
        ),
    );

  let capaUrlMarc =
    "";

  for (
    const campo of
    camposMarc(
      registro,
      "856",
    )
  ) {
    const url =
      campo.subcampos.find(
        (subcampo) =>
          subcampo.codigo ===
          "u",
      )?.valor?.trim() ??
      "";

    const descricao =
      campo.subcampos
        .filter(
          (subcampo) =>
            subcampo.codigo ===
              "3" ||
            subcampo.codigo ===
              "y",
        )
        .map(
          (subcampo) =>
            subcampo.valor,
        )
        .join(" ");

    if (
      url &&
      /\b(capa|cover)\b/i.test(
        descricao,
      )
    ) {
      capaUrlMarc =
        url;

      break;
    }
  }

  return {
    capaUrl:
      capaUrlMarc,

    idLegado:
      controleMarc(
        registro,
        "001",
      ),
    titulo,
    subtitulo,
    tipo:
      tipoMarc(
        registro,
      ),
    autor:
      autorias.autor,
    coautor:
      autorias.coautor,
    organizador:
      autorias.organizador,
    tradutor:
      autorias.tradutor,
    editora,
    isbn,
    issn,
    doi,
    idioma:
      idiomaMarc(
        registro,
      ),
    anoPublicacao:
      anoMarc(
        registro,
      ),
    edicao:
      limparPontuacaoMarc(
        primeiroMarc(
          registro,
          "250",
          "a",
        ),
      ),
    numeroPaginas:
      paginasMarc(
        registro,
      ),
    palavrasChave:
      Array.from(
        new Set(
          assuntos,
        ),
      ).join(" | "),
    cdd,
    cdu,
    codigoCutter:
      chamadaB,
    codigoChamada:
      [
        chamadaA,
        chamadaB,
      ]
        .filter(Boolean)
        .join(" "),
  };
}

function extrairMatrizMarc(
  buffer: Buffer,
  nomeArquivo: string,
) {
  const registros =
    lerRegistrosMarc(
      buffer,
      nomeArquivo,
    );

  if (
    registros.length >
    50_000
  ) {
    throw new ErroArquivoImportacao(
      "MUITOS_REGISTROS",
      "Esta etapa aceita no máximo 50.000 registros MARC por arquivo.",
      413,
    );
  }

  const linhas =
    registros.map(
      (registro) => {
        const dados =
          dadosRegistroMarc(
            registro,
          );

        return COLUNAS_MARC_IMPORTACAO.map(
          (coluna) =>
            textoCelula(
              dados[
                coluna.chave as keyof typeof dados
              ],
            ),
        );
      },
    );

  return {
    registros,
    linhas,
  };
}

function analisarArquivoMarc(
  buffer: Buffer,
  nomeArquivo: string,
) {
  const {
    linhas,
  } =
    extrairMatrizMarc(
      buffer,
      nomeArquivo,
    );

  const colunas =
    COLUNAS_MARC_IMPORTACAO.map(
      (
        coluna,
        indice,
      ) => ({
        indice,
        nome:
          coluna.nome,
        destinoSugerido:
          coluna.chave,
        grupo:
          coluna.grupo,
        confianca:
          "ALTA" as const,
      }),
    );

  const indiceTitulo =
    COLUNAS_MARC_IMPORTACAO.findIndex(
      (coluna) =>
        coluna.chave ===
        "titulo",
    );

  const indiceIsbn =
    COLUNAS_MARC_IMPORTACAO.findIndex(
      (coluna) =>
        coluna.chave ===
        "isbn",
    );

  const linhasSemTitulo =
    linhas.filter(
      (linha) =>
        !textoCelula(
          linha[
            indiceTitulo
          ],
        ),
    ).length;

  const alertas: Array<{
    codigo: string;
    quantidade: number;
  }> = [];

  if (
    linhasSemTitulo > 0
  ) {
    alertas.push({
      codigo:
        "LINHAS_SEM_TITULO",
      quantidade:
        linhasSemTitulo,
    });
  }

  const isbnDuplicados =
    contarDuplicados(
      linhas,
      indiceIsbn,
    );

  if (
    isbnDuplicados > 0
  ) {
    alertas.push({
      codigo:
        "ISBN_DUPLICADO_NO_ARQUIVO",
      quantidade:
        isbnDuplicados,
    });
  }

  const extensao =
    extensaoImportacaoMarc(
      nomeArquivo,
    );

  const nomeFormato =
    extensao === "xml"
      ? "MARCXML"
      : "MARC21 / ISO2709";

  return {
    arquivo: {
      nome:
        nomeArquivo,
      planilha:
        nomeFormato,
      planilhasDisponiveis:
        [nomeFormato],
      linhaCabecalho:
        1,
    },
    resumo: {
      registros:
        linhas.length,
      colunas:
        colunas.length,
      camposReconhecidos:
        colunas.length,
      camposNaoReconhecidos:
        0,
      linhasSemTitulo,
    },
    colunas,
    amostra:
      linhas
        .slice(
          0,
          10,
        )
        .map(
          (
            valores,
            indice,
          ) => ({
            linha:
              indice + 1,
            valores,
          }),
        ),
    alertas,
    camposDestino:
      CAMPOS_IMPORTACAO.map(
        ({
          chave,
          grupo,
          obrigatorio = false,
        }) => ({
          chave,
          grupo,
          obrigatorio,
        }),
      ),
  };
}

function extrairRegistrosMarcMapeados(
  buffer: Buffer,
  nomeArquivo: string,
  mapeamento:
    Record<number, string>,
) {
  const {
    linhas,
  } =
    extrairMatrizMarc(
      buffer,
      nomeArquivo,
    );

  const registros:
    RegistroMapeadoImportacao[] =
      linhas.map(
        (
          linha,
          indiceLinha,
        ) => {
          const dados:
            Record<string, string> =
              {};

          for (
            const [
              indiceTexto,
              destino,
            ] of Object.entries(
              mapeamento,
            )
          ) {
            if (!destino) {
              continue;
            }

            const indice =
              Number(
                indiceTexto,
              );

            if (
              !Number.isInteger(
                indice,
              ) ||
              indice < 0
            ) {
              continue;
            }

            const valor =
              textoCelula(
                linha[
                  indice
                ],
              );

            if (valor) {
              dados[
                destino
              ] = valor;
            }
          }

          const isbnGenerico =
            normalizarIsbnImportacao(
              dados.isbn,
            );

          if (
            isbnGenerico &&
            !dados.isbn10 &&
            !dados.isbn13
          ) {
            if (
              isbnGenerico.length ===
              10
            ) {
              dados.isbn10 =
                isbnGenerico;
            } else if (
              isbnGenerico.length ===
              13
            ) {
              dados.isbn13 =
                isbnGenerico;
            }
          }

          if (
            dados.isbn10
          ) {
            dados.isbn10 =
              normalizarIsbnImportacao(
                dados.isbn10,
              );
          }

          if (
            dados.isbn13
          ) {
            dados.isbn13 =
              normalizarIsbnImportacao(
                dados.isbn13,
              );
          }

          if (dados.doi) {
            dados.doi =
              dados.doi
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

          return {
            linha:
              indiceLinha +
              1,
            dados,
          };
        },
      );

  return {
    nomeArquivo,
    planilha:
      extensaoImportacaoMarc(
        nomeArquivo,
      ) === "xml"
        ? "MARCXML"
        : "MARC21 / ISO2709",
    registros,
  };
}
export function analisarArquivoImportacao(
  buffer: Buffer,
  nomeArquivo: string,
) {
  if (
    ehArquivoMarc(
      nomeArquivo,
    )
  ) {
    return analisarArquivoMarc(
      buffer,
      nomeArquivo,
    );
  }

  let workbook: XLSX.WorkBook;

  try {
    workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: false,
    });
  } catch {
    throw new ErroArquivoImportacao(
      "ARQUIVO_NAO_RECONHECIDO",
      "Não foi possível interpretar o arquivo enviado.",
    );
  }

  if (!workbook.SheetNames.length) {
    throw new ErroArquivoImportacao(
      "ARQUIVO_SEM_PLANILHA",
      "O arquivo não contém uma planilha válida.",
    );
  }

  const nomePlanilha =
    workbook.SheetNames[0];

  const planilha =
    workbook.Sheets[nomePlanilha];

  const matriz =
    XLSX.utils.sheet_to_json<unknown[]>(
      planilha,
      {
        header: 1,
        defval: "",
        raw: false,
        blankrows: false,
      },
    );

  const indiceCabecalho =
    matriz.findIndex((linha) =>
      Array.isArray(linha) &&
      linha.some(
        (celula) =>
          textoCelula(celula).length > 0,
      ),
    );

  if (indiceCabecalho < 0) {
    throw new ErroArquivoImportacao(
      "ARQUIVO_VAZIO",
      "O arquivo não possui dados para importar.",
    );
  }

  const matrizUtil =
    matriz.slice(indiceCabecalho);

  const quantidadeColunas =
    Math.max(
      0,
      ...matrizUtil.map((linha) =>
        Array.isArray(linha)
          ? linha.length
          : 0,
      ),
    );

  if (quantidadeColunas === 0) {
    throw new ErroArquivoImportacao(
      "ARQUIVO_SEM_COLUNAS",
      "Não foi possível identificar colunas no arquivo.",
    );
  }

  if (quantidadeColunas > 200) {
    throw new ErroArquivoImportacao(
      "MUITAS_COLUNAS",
      "O arquivo possui mais de 200 colunas.",
    );
  }

  const cabecalhoOriginal =
    matrizUtil[0] ?? [];

  const cabecalhos =
    Array.from(
      { length: quantidadeColunas },
      (_, indice) => {
        const nome = textoCelula(
          cabecalhoOriginal[indice],
        );

        return (
          nome ||
          `Coluna ${indice + 1}`
        );
      },
    );

  const linhas =
    matrizUtil
      .slice(1)
      .filter(
        (linha) =>
          Array.isArray(linha) &&
          linha.some(
            (celula) =>
              textoCelula(celula).length > 0,
          ),
      )
      .map((linha) =>
        Array.from(
          { length: quantidadeColunas },
          (_, indice) =>
            textoCelula(linha[indice]),
        ),
      );

  if (linhas.length === 0) {
    throw new ErroArquivoImportacao(
      "ARQUIVO_SEM_REGISTROS",
      "O arquivo possui cabeçalhos, mas não contém registros.",
    );
  }

  if (linhas.length > 50_000) {
    throw new ErroArquivoImportacao(
      "MUITOS_REGISTROS",
      "Esta etapa aceita no máximo 50.000 registros por arquivo.",
      413,
    );
  }

  const destinosJaUsados =
    new Set<string>();

  const colunas =
    cabecalhos.map(
      (nome, indice) => {
        const sugestao =
          sugerirDestino(nome);

        let destinoSugerido:
          | string
          | null = null;

        let grupo:
          | GrupoCampoImportacao
          | null = null;

        let confianca:
          | "ALTA"
          | null = null;

        if (
          sugestao &&
          !destinosJaUsados.has(
            sugestao.chave,
          )
        ) {
          destinoSugerido =
            sugestao.chave;

          grupo =
            sugestao.grupo;

          confianca =
            sugestao.confianca;

          destinosJaUsados.add(
            sugestao.chave,
          );
        }

        return {
          indice,
          nome,
          destinoSugerido,
          grupo,
          confianca,
        };
      },
    );

  const indiceTitulo =
    encontrarIndiceDestino(
      colunas,
      "titulo",
    );

  const indiceIsbn =
    encontrarIndiceDestino(
      colunas,
      "isbn",
    );

  const indiceIsbn10 =
    encontrarIndiceDestino(
      colunas,
      "isbn10",
    );

  const indiceIsbn13 =
    encontrarIndiceDestino(
      colunas,
      "isbn13",
    );

  const indiceCodigoBarras =
    encontrarIndiceDestino(
      colunas,
      "codigoBarras",
    );

  const indiceTombo =
    encontrarIndiceDestino(
      colunas,
      "numeroTombo",
    );

  const linhasSemTitulo =
    indiceTitulo === null
      ? linhas.length
      : linhas.filter(
          (linha) =>
            !textoCelula(
              linha[indiceTitulo],
            ),
        ).length;

  const alertas: Array<{
    codigo: string;
    quantidade: number;
  }> = [];

  if (indiceTitulo === null) {
    alertas.push({
      codigo: "COLUNA_TITULO_NAO_IDENTIFICADA",
      quantidade: 1,
    });
  } else if (linhasSemTitulo > 0) {
    alertas.push({
      codigo: "LINHAS_SEM_TITULO",
      quantidade: linhasSemTitulo,
    });
  }

  const isbnDuplicados =
    contarDuplicados(
      linhas,
      indiceIsbn13 ??
        indiceIsbn10 ??
        indiceIsbn,
    );

  const codigosBarrasDuplicados =
    contarDuplicados(
      linhas,
      indiceCodigoBarras,
    );

  const tombosDuplicados =
    contarDuplicados(
      linhas,
      indiceTombo,
    );

  if (isbnDuplicados > 0) {
    alertas.push({
      codigo: "ISBN_DUPLICADO_NO_ARQUIVO",
      quantidade: isbnDuplicados,
    });
  }

  if (codigosBarrasDuplicados > 0) {
    alertas.push({
      codigo:
        "CODIGO_BARRAS_DUPLICADO_NO_ARQUIVO",
      quantidade:
        codigosBarrasDuplicados,
    });
  }

  if (tombosDuplicados > 0) {
    alertas.push({
      codigo: "TOMBO_DUPLICADO_NO_ARQUIVO",
      quantidade: tombosDuplicados,
    });
  }

  const amostra =
    linhas
      .slice(0, 10)
      .map((valores, indice) => ({
        linha:
          indiceCabecalho +
          indice +
          2,
        valores,
      }));

  return {
    arquivo: {
      nome: nomeArquivo,
      planilha: nomePlanilha,
      planilhasDisponiveis:
        workbook.SheetNames,
      linhaCabecalho:
        indiceCabecalho + 1,
    },
    resumo: {
      registros: linhas.length,
      colunas: quantidadeColunas,
      camposReconhecidos:
        colunas.filter(
          (coluna) =>
            coluna.destinoSugerido !== null,
        ).length,
      camposNaoReconhecidos:
        colunas.filter(
          (coluna) =>
            coluna.destinoSugerido === null,
        ).length,
      linhasSemTitulo,
    },
    colunas,
    amostra,
    alertas,
    camposDestino:
      CAMPOS_IMPORTACAO.map(
        ({
          chave,
          grupo,
          obrigatorio = false,
        }) => ({
          chave,
          grupo,
          obrigatorio,
        }),
      ),
  };
}
export type RegistroMapeadoImportacao = {
  linha: number;
  dados: Record<string, string>;
};

function normalizarIsbnImportacao(
  valor: string | undefined,
) {
  if (!valor) return "";

  return valor
    .toUpperCase()
    .replace(/[^0-9X]/g, "");
}

export function extrairRegistrosMapeadosImportacao(
  buffer: Buffer,
  nomeArquivo: string,
  mapeamento: Record<number, string>,
) {
  if (
    ehArquivoMarc(
      nomeArquivo,
    )
  ) {
    return extrairRegistrosMarcMapeados(
      buffer,
      nomeArquivo,
      mapeamento,
    );
  }

  let workbook: XLSX.WorkBook;

  try {
    workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: false,
    });
  } catch {
    throw new ErroArquivoImportacao(
      "ARQUIVO_NAO_RECONHECIDO",
      "Não foi possível interpretar o arquivo enviado.",
    );
  }

  if (!workbook.SheetNames.length) {
    throw new ErroArquivoImportacao(
      "ARQUIVO_SEM_PLANILHA",
      "O arquivo não contém uma planilha válida.",
    );
  }

  const nomePlanilha =
    workbook.SheetNames[0];

  const planilha =
    workbook.Sheets[nomePlanilha];

  const matriz =
    XLSX.utils.sheet_to_json<unknown[]>(
      planilha,
      {
        header: 1,
        defval: "",
        raw: false,
        blankrows: false,
      },
    );

  const indiceCabecalho =
    matriz.findIndex(
      (linha) =>
        Array.isArray(linha) &&
        linha.some(
          (celula) =>
            textoCelula(celula).length > 0,
        ),
    );

  if (indiceCabecalho < 0) {
    throw new ErroArquivoImportacao(
      "ARQUIVO_VAZIO",
      "O arquivo não possui dados para importar.",
    );
  }

  const linhas =
    matriz
      .slice(indiceCabecalho + 1)
      .filter(
        (linha) =>
          Array.isArray(linha) &&
          linha.some(
            (celula) =>
              textoCelula(celula).length > 0,
          ),
      );

  if (linhas.length > 50_000) {
    throw new ErroArquivoImportacao(
      "MUITOS_REGISTROS",
      "Esta etapa aceita no máximo 50.000 registros por arquivo.",
      413,
    );
  }

  const registros:
    RegistroMapeadoImportacao[] =
      linhas.map(
        (linha, indiceLinha) => {
          const dados:
            Record<string, string> = {};

          for (
            const [
              indiceTexto,
              destino,
            ] of Object.entries(
              mapeamento,
            )
          ) {
            if (!destino) continue;

            const indice =
              Number(indiceTexto);

            if (
              !Number.isInteger(indice) ||
              indice < 0
            ) {
              continue;
            }

            const valor =
              textoCelula(
                linha[indice],
              );

            if (valor) {
              dados[destino] =
                valor;
            }
          }

          const isbnGenerico =
            normalizarIsbnImportacao(
              dados.isbn,
            );

          if (
            isbnGenerico &&
            !dados.isbn10 &&
            !dados.isbn13
          ) {
            if (
              isbnGenerico.length === 10
            ) {
              dados.isbn10 =
                isbnGenerico;
            } else if (
              isbnGenerico.length === 13
            ) {
              dados.isbn13 =
                isbnGenerico;
            }
          }

          if (dados.isbn10) {
            dados.isbn10 =
              normalizarIsbnImportacao(
                dados.isbn10,
              );
          }

          if (dados.isbn13) {
            dados.isbn13 =
              normalizarIsbnImportacao(
                dados.isbn13,
              );
          }

          if (dados.doi) {
            dados.doi =
              dados.doi
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

          return {
            linha:
              indiceCabecalho +
              indiceLinha +
              2,
            dados,
          };
        },
      );

  return {
    nomeArquivo,
    planilha:
      nomePlanilha,
    registros,
  };
}

export function normalizarTextoComparacao(
  valor: string | null | undefined,
) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}