import "server-only";

import {
  BibliotecaModeloEtiqueta,
  BibliotecaOrientacaoFolhaEtiqueta,
  BibliotecaTipoEtiquetaFolha,
} from "@prisma/client";

import {
  ErroBiblioteca,
} from "@/lib/biblioteca-acesso";

import {
  type ModeloFolhaEtiqueta,
  validarModeloEtiqueta,
} from "@/lib/biblioteca/modelos-etiqueta";


export type EntradaModeloEtiqueta = {
  nome: string;
  descricao: string | null;

  tipo:
    BibliotecaTipoEtiquetaFolha;

  marca: string | null;

  codigoFabricante:
    string | null;

  larguraFolhaMm:
    number;

  alturaFolhaMm:
    number;

  orientacao:
    BibliotecaOrientacaoFolhaEtiqueta;

  margemSuperiorMm:
    number;

  margemDireitaMm:
    number;

  margemInferiorMm:
    number;

  margemEsquerdaMm:
    number;

  larguraEtiquetaMm:
    number;

  alturaEtiquetaMm:
    number;

  espacoHorizontalMm:
    number;

  espacoVerticalMm:
    number;

  colunas:
    number;

  linhas:
    number;

  deslocamentoHorizontalMm:
    number;

  deslocamentoVerticalMm:
    number;
};


const TIPOS =
  new Set(
    Object.values(
      BibliotecaTipoEtiquetaFolha
    )
  );


const ORIENTACOES =
  new Set(
    Object.values(
      BibliotecaOrientacaoFolhaEtiqueta
    )
  );


function possui(
  corpo:
    Record<string, unknown>,
  chave:
    string,
) {
  return Object.prototype
    .hasOwnProperty
    .call(
      corpo,
      chave
    );
}


function valor(
  corpo:
    Record<string, unknown>,
  chave:
    string,
  atual:
    unknown,
) {
  return possui(
    corpo,
    chave
  )
    ? corpo[chave]
    : atual;
}


function textoObrigatorio(
  valorRecebido:
    unknown,
  campo:
    string,
  maximo:
    number,
) {
  if (
    typeof valorRecebido !==
    "string"
  ) {
    throw new ErroBiblioteca(
      400,
      `${campo} é obrigatório.`,
      "MODELO_ETIQUETA_CAMPO_INVALIDO",
      {
        campo,
      },
    );
  }

  const texto =
    valorRecebido.trim();

  if (!texto) {
    throw new ErroBiblioteca(
      400,
      `${campo} é obrigatório.`,
      "MODELO_ETIQUETA_CAMPO_INVALIDO",
      {
        campo,
      },
    );
  }

  if (
    texto.length >
    maximo
  ) {
    throw new ErroBiblioteca(
      400,
      `${campo} ultrapassa o limite de ${maximo} caracteres.`,
      "MODELO_ETIQUETA_CAMPO_INVALIDO",
      {
        campo,
        maximo,
      },
    );
  }

  return texto;
}


function textoOpcional(
  valorRecebido:
    unknown,
  campo:
    string,
  maximo:
    number,
) {
  if (
    valorRecebido ===
      undefined ||
    valorRecebido ===
      null ||
    valorRecebido ===
      ""
  ) {
    return null;
  }

  if (
    typeof valorRecebido !==
    "string"
  ) {
    throw new ErroBiblioteca(
      400,
      `${campo} é inválido.`,
      "MODELO_ETIQUETA_CAMPO_INVALIDO",
      {
        campo,
      },
    );
  }

  const texto =
    valorRecebido.trim();

  if (!texto) {
    return null;
  }

  if (
    texto.length >
    maximo
  ) {
    throw new ErroBiblioteca(
      400,
      `${campo} ultrapassa o limite de ${maximo} caracteres.`,
      "MODELO_ETIQUETA_CAMPO_INVALIDO",
      {
        campo,
        maximo,
      },
    );
  }

  return texto;
}


function numero(
  valorRecebido:
    unknown,
  campo:
    string,
  minimo:
    number,
  maximo:
    number,
) {
  const convertido =
    Number(
      valorRecebido
    );

  if (
    !Number.isFinite(
      convertido
    ) ||
    convertido < minimo ||
    convertido > maximo
  ) {
    throw new ErroBiblioteca(
      400,
      `${campo} deve estar entre ${minimo} e ${maximo}.`,
      "MODELO_ETIQUETA_CAMPO_INVALIDO",
      {
        campo,
        minimo,
        maximo,
      },
    );
  }

  return convertido;
}


function inteiro(
  valorRecebido:
    unknown,
  campo:
    string,
  minimo:
    number,
  maximo:
    number,
) {
  const convertido =
    Number(
      valorRecebido
    );

  if (
    !Number.isInteger(
      convertido
    ) ||
    convertido < minimo ||
    convertido > maximo
  ) {
    throw new ErroBiblioteca(
      400,
      `${campo} deve ser um número inteiro entre ${minimo} e ${maximo}.`,
      "MODELO_ETIQUETA_CAMPO_INVALIDO",
      {
        campo,
        minimo,
        maximo,
      },
    );
  }

  return convertido;
}


function enumObrigatorio<
  T extends string
>(
  valorRecebido:
    unknown,
  campo:
    string,
  valores:
    Set<T>,
) {
  if (
    typeof valorRecebido !==
      "string" ||
    !valores.has(
      valorRecebido as T
    )
  ) {
    throw new ErroBiblioteca(
      400,
      `${campo} é inválido.`,
      "MODELO_ETIQUETA_CAMPO_INVALIDO",
      {
        campo,
      },
    );
  }

  return valorRecebido as T;
}


export function booleanoOpcional(
  valorRecebido:
    unknown,
  campo:
    string,
  padrao:
    boolean,
) {
  if (
    valorRecebido ===
    undefined
  ) {
    return padrao;
  }

  if (
    typeof valorRecebido !==
    "boolean"
  ) {
    throw new ErroBiblioteca(
      400,
      `${campo} deve ser booleano.`,
      "MODELO_ETIQUETA_CAMPO_INVALIDO",
      {
        campo,
      },
    );
  }

  return valorRecebido;
}


export function bancoParaEntrada(
  modelo:
    BibliotecaModeloEtiqueta,
): EntradaModeloEtiqueta {
  return {
    nome:
      modelo.nome,

    descricao:
      modelo.descricao,

    tipo:
      modelo.tipo,

    marca:
      modelo.marca,

    codigoFabricante:
      modelo.codigoFabricante,

    larguraFolhaMm:
      Number(
        modelo.larguraFolhaMm
      ),

    alturaFolhaMm:
      Number(
        modelo.alturaFolhaMm
      ),

    orientacao:
      modelo.orientacao,

    margemSuperiorMm:
      Number(
        modelo.margemSuperiorMm
      ),

    margemDireitaMm:
      Number(
        modelo.margemDireitaMm
      ),

    margemInferiorMm:
      Number(
        modelo.margemInferiorMm
      ),

    margemEsquerdaMm:
      Number(
        modelo.margemEsquerdaMm
      ),

    larguraEtiquetaMm:
      Number(
        modelo.larguraEtiquetaMm
      ),

    alturaEtiquetaMm:
      Number(
        modelo.alturaEtiquetaMm
      ),

    espacoHorizontalMm:
      Number(
        modelo.espacoHorizontalMm
      ),

    espacoVerticalMm:
      Number(
        modelo.espacoVerticalMm
      ),

    colunas:
      modelo.colunas,

    linhas:
      modelo.linhas,

    deslocamentoHorizontalMm:
      Number(
        modelo.deslocamentoHorizontalMm
      ),

    deslocamentoVerticalMm:
      Number(
        modelo.deslocamentoVerticalMm
      ),
  };
}


export function normalizarEntradaModeloEtiqueta(
  corpo:
    Record<string, unknown>,
  atual?:
    EntradaModeloEtiqueta,
): EntradaModeloEtiqueta {
  const entrada:
    EntradaModeloEtiqueta = {
      nome:
        textoObrigatorio(
          valor(
            corpo,
            "nome",
            atual?.nome,
          ),
          "nome",
          160,
        ),

      descricao:
        textoOpcional(
          valor(
            corpo,
            "descricao",
            atual?.descricao,
          ),
          "descricao",
          2000,
        ),

      tipo:
        enumObrigatorio(
          valor(
            corpo,
            "tipo",
            atual?.tipo,
          ),
          "tipo",
          TIPOS,
        ),

      marca:
        textoOpcional(
          valor(
            corpo,
            "marca",
            atual?.marca,
          ),
          "marca",
          120,
        ),

      codigoFabricante:
        textoOpcional(
          valor(
            corpo,
            "codigoFabricante",
            atual?.codigoFabricante,
          ),
          "codigoFabricante",
          120,
        ),

      larguraFolhaMm:
        numero(
          valor(
            corpo,
            "larguraFolhaMm",
            atual?.larguraFolhaMm,
          ),
          "larguraFolhaMm",
          1,
          2000,
        ),

      alturaFolhaMm:
        numero(
          valor(
            corpo,
            "alturaFolhaMm",
            atual?.alturaFolhaMm,
          ),
          "alturaFolhaMm",
          1,
          2000,
        ),

      orientacao:
        enumObrigatorio(
          valor(
            corpo,
            "orientacao",
            atual?.orientacao,
          ),
          "orientacao",
          ORIENTACOES,
        ),

      margemSuperiorMm:
        numero(
          valor(
            corpo,
            "margemSuperiorMm",
            atual?.margemSuperiorMm,
          ),
          "margemSuperiorMm",
          0,
          1000,
        ),

      margemDireitaMm:
        numero(
          valor(
            corpo,
            "margemDireitaMm",
            atual?.margemDireitaMm,
          ),
          "margemDireitaMm",
          0,
          1000,
        ),

      margemInferiorMm:
        numero(
          valor(
            corpo,
            "margemInferiorMm",
            atual?.margemInferiorMm,
          ),
          "margemInferiorMm",
          0,
          1000,
        ),

      margemEsquerdaMm:
        numero(
          valor(
            corpo,
            "margemEsquerdaMm",
            atual?.margemEsquerdaMm,
          ),
          "margemEsquerdaMm",
          0,
          1000,
        ),

      larguraEtiquetaMm:
        numero(
          valor(
            corpo,
            "larguraEtiquetaMm",
            atual?.larguraEtiquetaMm,
          ),
          "larguraEtiquetaMm",
          0.1,
          1000,
        ),

      alturaEtiquetaMm:
        numero(
          valor(
            corpo,
            "alturaEtiquetaMm",
            atual?.alturaEtiquetaMm,
          ),
          "alturaEtiquetaMm",
          0.1,
          1000,
        ),

      espacoHorizontalMm:
        numero(
          valor(
            corpo,
            "espacoHorizontalMm",
            atual?.espacoHorizontalMm,
          ),
          "espacoHorizontalMm",
          0,
          1000,
        ),

      espacoVerticalMm:
        numero(
          valor(
            corpo,
            "espacoVerticalMm",
            atual?.espacoVerticalMm,
          ),
          "espacoVerticalMm",
          0,
          1000,
        ),

      colunas:
        inteiro(
          valor(
            corpo,
            "colunas",
            atual?.colunas,
          ),
          "colunas",
          1,
          100,
        ),

      linhas:
        inteiro(
          valor(
            corpo,
            "linhas",
            atual?.linhas,
          ),
          "linhas",
          1,
          100,
        ),

      deslocamentoHorizontalMm:
        numero(
          valor(
            corpo,
            "deslocamentoHorizontalMm",
            atual?.deslocamentoHorizontalMm,
          ),
          "deslocamentoHorizontalMm",
          -100,
          100,
        ),

      deslocamentoVerticalMm:
        numero(
          valor(
            corpo,
            "deslocamentoVerticalMm",
            atual?.deslocamentoVerticalMm,
          ),
          "deslocamentoVerticalMm",
          -100,
          100,
        ),
    };

  const modeloValidacao:
    ModeloFolhaEtiqueta = {
      id:
        "validacao",

      nome:
        entrada.nome,

      descricao:
        entrada.descricao,

      tipo:
        entrada.tipo,

      origem:
        "PERSONALIZADO",

      marca:
        entrada.marca,

      codigoFabricante:
        entrada.codigoFabricante,

      larguraFolhaMm:
        entrada.larguraFolhaMm,

      alturaFolhaMm:
        entrada.alturaFolhaMm,

      orientacao:
        entrada.orientacao,

      margemSuperiorMm:
        entrada.margemSuperiorMm,

      margemDireitaMm:
        entrada.margemDireitaMm,

      margemInferiorMm:
        entrada.margemInferiorMm,

      margemEsquerdaMm:
        entrada.margemEsquerdaMm,

      larguraEtiquetaMm:
        entrada.larguraEtiquetaMm,

      alturaEtiquetaMm:
        entrada.alturaEtiquetaMm,

      espacoHorizontalMm:
        entrada.espacoHorizontalMm,

      espacoVerticalMm:
        entrada.espacoVerticalMm,

      colunas:
        entrada.colunas,

      linhas:
        entrada.linhas,

      deslocamentoHorizontalMm:
        entrada.deslocamentoHorizontalMm,

      deslocamentoVerticalMm:
        entrada.deslocamentoVerticalMm,

      editavel:
        true,

      ativo:
        true,
    };

  const validacao =
    validarModeloEtiqueta(
      modeloValidacao
    );

  if (
    !validacao.valido
  ) {
    throw new ErroBiblioteca(
      400,
      validacao.erros[0] ||
        "O modelo de etiqueta é inválido.",
      "MODELO_ETIQUETA_DIMENSOES_INVALIDAS",
      {
        erros:
          validacao.erros,

        larguraOcupadaMm:
          validacao.larguraOcupadaMm,

        alturaOcupadaMm:
          validacao.alturaOcupadaMm,

        larguraDisponivelMm:
          validacao.larguraDisponivelMm,

        alturaDisponivelMm:
          validacao.alturaDisponivelMm,
      },
    );
  }

  return entrada;
}


export function serializarModeloBanco(
  modelo:
    BibliotecaModeloEtiqueta,
) {
  return {
    id:
      String(
        modelo.id
      ),

    idBanco:
      modelo.id,

    persistido:
      true,

    nome:
      modelo.nome,

    descricao:
      modelo.descricao,

    tipo:
      modelo.tipo,

    origem:
      modelo.origem,

    marca:
      modelo.marca,

    codigoFabricante:
      modelo.codigoFabricante,

    larguraFolhaMm:
      Number(
        modelo.larguraFolhaMm
      ),

    alturaFolhaMm:
      Number(
        modelo.alturaFolhaMm
      ),

    orientacao:
      modelo.orientacao,

    margemSuperiorMm:
      Number(
        modelo.margemSuperiorMm
      ),

    margemDireitaMm:
      Number(
        modelo.margemDireitaMm
      ),

    margemInferiorMm:
      Number(
        modelo.margemInferiorMm
      ),

    margemEsquerdaMm:
      Number(
        modelo.margemEsquerdaMm
      ),

    larguraEtiquetaMm:
      Number(
        modelo.larguraEtiquetaMm
      ),

    alturaEtiquetaMm:
      Number(
        modelo.alturaEtiquetaMm
      ),

    espacoHorizontalMm:
      Number(
        modelo.espacoHorizontalMm
      ),

    espacoVerticalMm:
      Number(
        modelo.espacoVerticalMm
      ),

    colunas:
      modelo.colunas,

    linhas:
      modelo.linhas,

    capacidade:
      modelo.colunas *
      modelo.linhas,

    deslocamentoHorizontalMm:
      Number(
        modelo.deslocamentoHorizontalMm
      ),

    deslocamentoVerticalMm:
      Number(
        modelo.deslocamentoVerticalMm
      ),

    padrao:
      modelo.padrao,

    ativo:
      modelo.ativo,

    editavel:
      modelo.origem ===
      "PERSONALIZADO",

    excluivel:
      modelo.origem ===
      "PERSONALIZADO",

    criadoPorId:
      modelo.criadoPorId,

    atualizadoPorId:
      modelo.atualizadoPorId,

    criadoEm:
      modelo.criadoEm
        .toISOString(),

    atualizadoEm:
      modelo.atualizadoEm
        .toISOString(),
  };
}


export function entradaParaDadosPrisma(
  entrada:
    EntradaModeloEtiqueta,
) {
  return {
    nome:
      entrada.nome,

    descricao:
      entrada.descricao,

    tipo:
      entrada.tipo,

    marca:
      entrada.marca,

    codigoFabricante:
      entrada.codigoFabricante,

    larguraFolhaMm:
      entrada.larguraFolhaMm,

    alturaFolhaMm:
      entrada.alturaFolhaMm,

    orientacao:
      entrada.orientacao,

    margemSuperiorMm:
      entrada.margemSuperiorMm,

    margemDireitaMm:
      entrada.margemDireitaMm,

    margemInferiorMm:
      entrada.margemInferiorMm,

    margemEsquerdaMm:
      entrada.margemEsquerdaMm,

    larguraEtiquetaMm:
      entrada.larguraEtiquetaMm,

    alturaEtiquetaMm:
      entrada.alturaEtiquetaMm,

    espacoHorizontalMm:
      entrada.espacoHorizontalMm,

    espacoVerticalMm:
      entrada.espacoVerticalMm,

    colunas:
      entrada.colunas,

    linhas:
      entrada.linhas,

    deslocamentoHorizontalMm:
      entrada.deslocamentoHorizontalMm,

    deslocamentoVerticalMm:
      entrada.deslocamentoVerticalMm,
  };
}
