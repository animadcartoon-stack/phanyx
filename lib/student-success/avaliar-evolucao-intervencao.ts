export type ClassificacaoEvolucaoIntervencao =
  | "POSITIVA"
  | "NEGATIVA"
  | "NEUTRA"
  | "NAO_MENSURAVEL";

type IndicadoresSnapshot = {
  frequenciaPercentual?:
    | number
    | null;

  mediaPercentual?:
    | number
    | null;

  atividadesVencidas?:
    | number
    | null;
};

export type EntradaEvolucaoIntervencao = {
  nivelRiscoNoRegistro:
    | string
    | null;

  pontuacaoNoRegistro:
    | number
    | null;

  indicadoresNoRegistro:
    | unknown
    | null;

  nivelRiscoNoEncerramento:
    | string
    | null;

  pontuacaoNoEncerramento:
    | number
    | null;

  indicadoresNoEncerramento:
    | unknown
    | null;
};

export type ResultadoEvolucaoIntervencao = {
  classificacao:
    ClassificacaoEvolucaoIntervencao;

  saldo:
    number;

  criteriosComparados:
    number;

  melhoras:
    string[];

  pioras:
    string[];
};

const ORDEM_RISCO:
  Record<
    string,
    number
  > = {
    NORMAL: 0,
    ATENCAO: 1,
    RISCO: 2,
    CRITICO: 3,
  };

function objetoIndicadores(
  valor:
    unknown
):
  IndicadoresSnapshot | null {
  if (
    !valor ||
    typeof valor !==
      "object" ||
    Array.isArray(
      valor
    )
  ) {
    return null;
  }

  return valor as
    IndicadoresSnapshot;
}

function numeroValido(
  valor:
    unknown
):
  valor is number {
  return (
    typeof valor ===
      "number" &&
    Number.isFinite(
      valor
    )
  );
}

export function avaliarEvolucaoIntervencao(
  entrada:
    EntradaEvolucaoIntervencao
):
  ResultadoEvolucaoIntervencao {
  let saldo =
    0;

  let criteriosComparados =
    0;

  const melhoras:
    string[] =
    [];

  const pioras:
    string[] =
    [];

  const riscoAntes =
    entrada
      .nivelRiscoNoRegistro;

  const riscoDepois =
    entrada
      .nivelRiscoNoEncerramento;

  const ordemAntes =
    riscoAntes
      ? ORDEM_RISCO[
          riscoAntes
        ]
      : undefined;

  const ordemDepois =
    riscoDepois
      ? ORDEM_RISCO[
          riscoDepois
        ]
      : undefined;

  /*
   * Mudança de nível de risco tem
   * peso maior por resumir múltiplos
   * indicadores acadêmicos.
   */
  if (
    ordemAntes !==
      undefined &&
    ordemDepois !==
      undefined
  ) {
    criteriosComparados +=
      1;

    if (
      ordemDepois <
      ordemAntes
    ) {
      saldo +=
        3;

      melhoras.push(
        "RISCO"
      );
    }
    else if (
      ordemDepois >
      ordemAntes
    ) {
      saldo -=
        3;

      pioras.push(
        "RISCO"
      );
    }
  }

  /*
   * Pontuação é usada quando o nível
   * permaneceu igual. Isso evita contar
   * duas vezes essencialmente a mesma
   * mudança de risco.
   */
  if (
    numeroValido(
      entrada
        .pontuacaoNoRegistro
    ) &&
    numeroValido(
      entrada
        .pontuacaoNoEncerramento
    ) &&
    ordemAntes ===
      ordemDepois
  ) {
    criteriosComparados +=
      1;

    const diferenca =
      entrada
        .pontuacaoNoEncerramento -
      entrada
        .pontuacaoNoRegistro;

    if (
      diferenca < 0
    ) {
      saldo +=
        2;

      melhoras.push(
        "PONTUACAO_RISCO"
      );
    }
    else if (
      diferenca > 0
    ) {
      saldo -=
        2;

      pioras.push(
        "PONTUACAO_RISCO"
      );
    }
  }

  const inicio =
    objetoIndicadores(
      entrada
        .indicadoresNoRegistro
    );

  const fim =
    objetoIndicadores(
      entrada
        .indicadoresNoEncerramento
    );

  /*
   * Frequência.
   */
  if (
    numeroValido(
      inicio
        ?.frequenciaPercentual
    ) &&
    numeroValido(
      fim
        ?.frequenciaPercentual
    )
  ) {
    criteriosComparados +=
      1;

    const diferenca =
      fim.frequenciaPercentual -
      inicio.frequenciaPercentual;

    if (
      diferenca >
      0
    ) {
      saldo +=
        1;

      melhoras.push(
        "FREQUENCIA"
      );
    }
    else if (
      diferenca <
      0
    ) {
      saldo -=
        1;

      pioras.push(
        "FREQUENCIA"
      );
    }
  }

  /*
   * Desempenho.
   */
  if (
    numeroValido(
      inicio
        ?.mediaPercentual
    ) &&
    numeroValido(
      fim
        ?.mediaPercentual
    )
  ) {
    criteriosComparados +=
      1;

    const diferenca =
      fim.mediaPercentual -
      inicio.mediaPercentual;

    if (
      diferenca >
      0
    ) {
      saldo +=
        1;

      melhoras.push(
        "DESEMPENHO"
      );
    }
    else if (
      diferenca <
      0
    ) {
      saldo -=
        1;

      pioras.push(
        "DESEMPENHO"
      );
    }
  }

  /*
   * Atividades pendentes.
   * Aqui menos é melhor.
   */
  if (
    numeroValido(
      inicio
        ?.atividadesVencidas
    ) &&
    numeroValido(
      fim
        ?.atividadesVencidas
    )
  ) {
    criteriosComparados +=
      1;

    const diferenca =
      fim.atividadesVencidas -
      inicio.atividadesVencidas;

    if (
      diferenca <
      0
    ) {
      saldo +=
        1;

      melhoras.push(
        "PENDENCIAS"
      );
    }
    else if (
      diferenca >
      0
    ) {
      saldo -=
        1;

      pioras.push(
        "PENDENCIAS"
      );
    }
  }

  if (
    criteriosComparados ===
    0
  ) {
    return {
      classificacao:
        "NAO_MENSURAVEL",

      saldo:
        0,

      criteriosComparados:
        0,

      melhoras,

      pioras,
    };
  }

  if (
    saldo > 0
  ) {
    return {
      classificacao:
        "POSITIVA",

      saldo,

      criteriosComparados,

      melhoras,

      pioras,
    };
  }

  if (
    saldo < 0
  ) {
    return {
      classificacao:
        "NEGATIVA",

      saldo,

      criteriosComparados,

      melhoras,

      pioras,
    };
  }

  return {
    classificacao:
      "NEUTRA",

    saldo:
      0,

    criteriosComparados,

    melhoras,

    pioras,
  };
}