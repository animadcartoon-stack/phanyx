export type TipoEtiquetaBiblioteca =
  | "LOMBADA"
  | "CODIGO_BARRAS";

export type OrigemModeloEtiqueta =
  | "SISTEMA"
  | "FABRICANTE"
  | "PERSONALIZADO";

export type OrientacaoFolhaEtiqueta =
  | "RETRATO"
  | "PAISAGEM";

export interface ModeloFolhaEtiqueta {
  /**
   * Identificador estável.
   *
   * Modelos do sistema usam IDs textuais.
   * Modelos personalizados poderão usar
   * IDs vindos do banco.
   */
  id: string;

  nome: string;

  descricao?: string | null;

  tipo:
    TipoEtiquetaBiblioteca;

  origem:
    OrigemModeloEtiqueta;

  marca?: string | null;

  codigoFabricante?: string | null;

  /**
   * Dimensões da folha.
   */
  larguraFolhaMm: number;

  alturaFolhaMm: number;

  orientacao:
    OrientacaoFolhaEtiqueta;

  /**
   * Margens físicas da folha.
   */
  margemSuperiorMm: number;

  margemDireitaMm: number;

  margemInferiorMm: number;

  margemEsquerdaMm: number;

  /**
   * Dimensões de cada etiqueta.
   */
  larguraEtiquetaMm: number;

  alturaEtiquetaMm: number;

  /**
   * Espaçamento entre etiquetas.
   */
  espacoHorizontalMm: number;

  espacoVerticalMm: number;

  colunas: number;

  linhas: number;

  /**
   * Pequena calibração para diferenças
   * entre impressoras.
   *
   * Não altera o modelo original.
   */
  deslocamentoHorizontalMm: number;

  deslocamentoVerticalMm: number;

  /**
   * Modelos de sistema/fabricante não
   * devem ser editados diretamente.
   */
  editavel: boolean;

  ativo: boolean;
}

export interface ResultadoValidacaoModeloEtiqueta {
  valido: boolean;

  erros: string[];

  larguraOcupadaMm: number;

  alturaOcupadaMm: number;

  larguraDisponivelMm: number;

  alturaDisponivelMm: number;

  capacidade: number;
}


export interface ModeloEtiquetaDisponivel
  extends ModeloFolhaEtiqueta {
  padrao: boolean;

  persistido: boolean;

  idBanco: number | null;

  capacidade: number;

  excluivel: boolean;
}


export interface RespostaModelosEtiqueta {
  ok?: boolean;

  modelos?:
    ModeloEtiquetaDisponivel[];

  modelo?:
    ModeloEtiquetaDisponivel;

  mensagem?: string;

  message?: string;

  error?: string;
}


/* =========================================================
   MODELOS NATIVOS PHANYX
   ========================================================= */

/**
 * Este é exatamente o modelo de lombada
 * já validado visualmente e na impressão
 * real durante os testes do PHANYX.
 */
export const MODELO_PHANYX_LOMBADA_35X25:
  ModeloFolhaEtiqueta = {
    id:
      "phanyx-lombada-35x25-a4",

    nome:
      "PHANYX — Lombada 35 × 25 mm",

    descricao:
      "Modelo padrão PHANYX para etiquetas de lombada em folha A4.",

    tipo:
      "LOMBADA",

    origem:
      "SISTEMA",

    marca:
      "PHANYX",

    codigoFabricante:
      null,

    larguraFolhaMm:
      210,

    alturaFolhaMm:
      297,

    orientacao:
      "RETRATO",

    margemSuperiorMm:
      10,

    margemDireitaMm:
      10,

    margemInferiorMm:
      10,

    margemEsquerdaMm:
      10,

    larguraEtiquetaMm:
      35,

    alturaEtiquetaMm:
      25,

    espacoHorizontalMm:
      3,

    espacoVerticalMm:
      2,

    colunas:
      5,

    linhas:
      9,

    deslocamentoHorizontalMm:
      0,

    deslocamentoVerticalMm:
      0,

    editavel:
      false,

    ativo:
      true,
  };


/**
 * Este é exatamente o modelo de código
 * de barras já validado visualmente e
 * na impressão real durante os testes.
 */
export const MODELO_PHANYX_CODIGO_BARRAS_50X28:
  ModeloFolhaEtiqueta = {
    id:
      "phanyx-codigo-barras-50x28-a4",

    nome:
      "PHANYX — Código de barras 50 × 28 mm",

    descricao:
      "Modelo padrão PHANYX para códigos de barras em folha A4.",

    tipo:
      "CODIGO_BARRAS",

    origem:
      "SISTEMA",

    marca:
      "PHANYX",

    codigoFabricante:
      null,

    larguraFolhaMm:
      210,

    alturaFolhaMm:
      297,

    orientacao:
      "RETRATO",

    margemSuperiorMm:
      10,

    margemDireitaMm:
      10,

    margemInferiorMm:
      10,

    margemEsquerdaMm:
      10,

    larguraEtiquetaMm:
      50,

    alturaEtiquetaMm:
      28,

    espacoHorizontalMm:
      5,

    espacoVerticalMm:
      4,

    colunas:
      3,

    linhas:
      7,

    deslocamentoHorizontalMm:
      0,

    deslocamentoVerticalMm:
      0,

    editavel:
      false,

    ativo:
      true,
  };


export const MODELOS_ETIQUETA_PHANYX:
  readonly ModeloFolhaEtiqueta[] = [
    MODELO_PHANYX_LOMBADA_35X25,
    MODELO_PHANYX_CODIGO_BARRAS_50X28,
  ];


/* =========================================================
   FUNÇÕES DO MOTOR
   ========================================================= */

export function capacidadeModeloEtiqueta(
  modelo:
    Pick<
      ModeloFolhaEtiqueta,
      "colunas" | "linhas"
    >,
) {
  return (
    modelo.colunas *
    modelo.linhas
  );
}


export function larguraOcupadaModeloEtiqueta(
  modelo:
    Pick<
      ModeloFolhaEtiqueta,
      | "colunas"
      | "larguraEtiquetaMm"
      | "espacoHorizontalMm"
    >,
) {
  return (
    modelo.colunas *
      modelo.larguraEtiquetaMm +
    Math.max(
      0,
      modelo.colunas - 1,
    ) *
      modelo.espacoHorizontalMm
  );
}


export function alturaOcupadaModeloEtiqueta(
  modelo:
    Pick<
      ModeloFolhaEtiqueta,
      | "linhas"
      | "alturaEtiquetaMm"
      | "espacoVerticalMm"
    >,
) {
  return (
    modelo.linhas *
      modelo.alturaEtiquetaMm +
    Math.max(
      0,
      modelo.linhas - 1,
    ) *
      modelo.espacoVerticalMm
  );
}


export function dimensoesFolhaModeloEtiqueta(
  modelo:
    Pick<
      ModeloFolhaEtiqueta,
      | "larguraFolhaMm"
      | "alturaFolhaMm"
      | "orientacao"
    >,
) {
  const menor =
    Math.min(
      modelo.larguraFolhaMm,
      modelo.alturaFolhaMm,
    );

  const maior =
    Math.max(
      modelo.larguraFolhaMm,
      modelo.alturaFolhaMm,
    );

  return modelo.orientacao ===
    "PAISAGEM"
    ? {
        larguraMm:
          maior,

        alturaMm:
          menor,
      }
    : {
        larguraMm:
          menor,

        alturaMm:
          maior,
      };
}


export function modelosEtiquetaAtivosPorTipo(
  modelos:
    ModeloEtiquetaDisponivel[],
  tipo:
    TipoEtiquetaBiblioteca,
) {
  return modelos.filter(
    (modelo) =>
      modelo.tipo === tipo &&
      modelo.ativo,
  );
}


export function selecionarModeloEtiqueta(
  modelos:
    ModeloEtiquetaDisponivel[],
  tipo:
    TipoEtiquetaBiblioteca,
  idSelecionado?:
    string | null,
) {
  const ativos =
    modelosEtiquetaAtivosPorTipo(
      modelos,
      tipo,
    );

  if (idSelecionado) {
    const selecionado =
      ativos.find(
        (modelo) =>
          modelo.id ===
          idSelecionado,
      );

    if (selecionado) {
      return selecionado;
    }
  }

  return (
    ativos.find(
      (modelo) =>
        modelo.padrao,
    ) ??
    ativos[0] ??
    null
  );
}


export function validarModeloEtiqueta(
  modelo:
    ModeloFolhaEtiqueta,
): ResultadoValidacaoModeloEtiqueta {
  const erros:
    string[] = [];

  const numerosPositivos = [
    [
      "largura da folha",
      modelo.larguraFolhaMm,
    ],
    [
      "altura da folha",
      modelo.alturaFolhaMm,
    ],
    [
      "largura da etiqueta",
      modelo.larguraEtiquetaMm,
    ],
    [
      "altura da etiqueta",
      modelo.alturaEtiquetaMm,
    ],
  ] as const;

  for (
    const [
      campo,
      valor,
    ] of numerosPositivos
  ) {
    if (
      !Number.isFinite(
        valor,
      ) ||
      valor <= 0
    ) {
      erros.push(
        `${campo} deve ser maior que zero.`,
      );
    }
  }

  const numerosNaoNegativos = [
    [
      "margem superior",
      modelo.margemSuperiorMm,
    ],
    [
      "margem direita",
      modelo.margemDireitaMm,
    ],
    [
      "margem inferior",
      modelo.margemInferiorMm,
    ],
    [
      "margem esquerda",
      modelo.margemEsquerdaMm,
    ],
    [
      "espaço horizontal",
      modelo.espacoHorizontalMm,
    ],
    [
      "espaço vertical",
      modelo.espacoVerticalMm,
    ],
  ] as const;

  for (
    const [
      campo,
      valor,
    ] of numerosNaoNegativos
  ) {
    if (
      !Number.isFinite(
        valor,
      ) ||
      valor < 0
    ) {
      erros.push(
        `${campo} não pode ser negativo.`,
      );
    }
  }

  if (
    !Number.isInteger(
      modelo.colunas,
    ) ||
    modelo.colunas < 1
  ) {
    erros.push(
      "O número de colunas deve ser um inteiro maior que zero.",
    );
  }

  if (
    !Number.isInteger(
      modelo.linhas,
    ) ||
    modelo.linhas < 1
  ) {
    erros.push(
      "O número de linhas deve ser um inteiro maior que zero.",
    );
  }

  const larguraOcupadaMm =
    larguraOcupadaModeloEtiqueta(
      modelo,
    );

  const alturaOcupadaMm =
    alturaOcupadaModeloEtiqueta(
      modelo,
    );

  const dimensoesFolha =
    dimensoesFolhaModeloEtiqueta(
      modelo,
    );

  const larguraDisponivelMm =
    dimensoesFolha.larguraMm -
    modelo.margemEsquerdaMm -
    modelo.margemDireitaMm;

  const alturaDisponivelMm =
    dimensoesFolha.alturaMm -
    modelo.margemSuperiorMm -
    modelo.margemInferiorMm;

  if (
    larguraDisponivelMm <= 0
  ) {
    erros.push(
      "As margens horizontais ocupam toda a largura da folha.",
    );
  }

  if (
    alturaDisponivelMm <= 0
  ) {
    erros.push(
      "As margens verticais ocupam toda a altura da folha.",
    );
  }

  if (
    larguraOcupadaMm >
    larguraDisponivelMm +
      0.01
  ) {
    erros.push(
      `A grade ocupa ${larguraOcupadaMm.toFixed(
        2,
      )} mm, mas há apenas ${larguraDisponivelMm.toFixed(
        2,
      )} mm disponíveis na largura.`,
    );
  }

  if (
    alturaOcupadaMm >
    alturaDisponivelMm +
      0.01
  ) {
    erros.push(
      `A grade ocupa ${alturaOcupadaMm.toFixed(
        2,
      )} mm, mas há apenas ${alturaDisponivelMm.toFixed(
        2,
      )} mm disponíveis na altura.`,
    );
  }

  return {
    valido:
      erros.length === 0,

    erros,

    larguraOcupadaMm,

    alturaOcupadaMm,

    larguraDisponivelMm,

    alturaDisponivelMm,

    capacidade:
      capacidadeModeloEtiqueta(
        modelo,
      ),
  };
}


export function obterModeloEtiquetaPhanyx(
  id:
    string,
) {
  return (
    MODELOS_ETIQUETA_PHANYX.find(
      (modelo) =>
        modelo.id === id,
    ) ?? null
  );
}


export function modelosEtiquetaPorTipo(
  tipo:
    TipoEtiquetaBiblioteca,
) {
  return (
    MODELOS_ETIQUETA_PHANYX.filter(
      (modelo) =>
        modelo.tipo === tipo &&
        modelo.ativo,
    )
  );
}
