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

export function analisarArquivoImportacao(
  buffer: Buffer,
  nomeArquivo: string,
) {
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