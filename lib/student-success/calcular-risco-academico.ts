export type NivelRiscoAcademico =
  | "NORMAL"
  | "ATENCAO"
  | "RISCO"
  | "CRITICO"
  | "DADOS_INSUFICIENTES";

export type ConfiabilidadeAnalise =
  | "BAIXA"
  | "MEDIA"
  | "ALTA";

export type CodigoComponenteRisco =
  | "FREQUENCIA"
  | "DESEMPENHO"
  | "PENDENCIAS"
  | "QUEDA_DESEMPENHO"
  | "PARTICIPACAO";

export type ComponenteRiscoAcademico = {
  codigo: CodigoComponenteRisco;
  titulo: string;

  pontos: number;
  maximo: number;

  disponivel: boolean;

  detalhe: string;
};

export type EntradaRiscoAcademico = {
  /**
   * Frequência atual do aluno entre 0 e 100.
   *
   * Exemplo:
   * 82.5 = 82,5%
   */
  frequenciaPercentual?: number | null;

  /**
   * Quantidade de aulas consideradas
   * no cálculo da frequência.
   */
  quantidadeAulas?: number | null;

  /**
   * Média acadêmica já normalizada
   * para percentual entre 0 e 100.
   *
   * Exemplos:
   * 7/10 = 70
   * 14/20 = 70
   */
  mediaPercentual?: number | null;

  /**
   * Quantidade de avaliações usadas
   * para calcular a média.
   */
  quantidadeAvaliacoes?: number | null;

  /**
   * Quantidade de atividades vencidas
   * que deveriam ter sido entregues
   * pelo aluno, mas não foram.
   */
  atividadesVencidas?: number | null;

  /**
   * Quantidade de atividades consideradas
   * na análise.
   */
  totalAtividadesConsideradas?: number | null;

  /**
   * Média percentual do período recente.
   *
   * Exemplo:
   * últimas 4 avaliações.
   */
  mediaRecentePercentual?: number | null;

  /**
   * Média percentual do período anterior.
   *
   * Exemplo:
   * 4 avaliações anteriores às recentes.
   */
  mediaAnteriorPercentual?: number | null;

  /**
   * Participação acadêmica entre 0 e 100.
   *
   * Essa informação será opcional na V1.
   */
  participacaoPercentual?: number | null;
};

export type ResultadoRiscoAcademico = {
  pontuacao: number;

  pontuacaoBruta: number;

  maximoDisponivel: number;

  nivel: NivelRiscoAcademico;

  coberturaPercentual: number;

  confiabilidade: ConfiabilidadeAnalise;

  componentes: ComponenteRiscoAcademico[];

  fatoresPrincipais: ComponenteRiscoAcademico[];
};

function limitarPercentual(
  valor: number
) {
  return Math.max(
    0,
    Math.min(
      100,
      valor
    )
  );
}

function formatarPercentual(
  valor: number
) {
  return `${valor
    .toFixed(1)
    .replace(".", ",")}%`;
}

function componenteIndisponivel(
  codigo: CodigoComponenteRisco,
  titulo: string,
  maximo: number,
  detalhe: string
): ComponenteRiscoAcademico {
  return {
    codigo,
    titulo,
    pontos: 0,
    maximo,
    disponivel: false,
    detalhe,
  };
}

function calcularFrequencia(
  entrada: EntradaRiscoAcademico
): ComponenteRiscoAcademico {
  const maximo = 30;

  const frequencia =
    entrada.frequenciaPercentual;

  const quantidadeAulas =
    entrada.quantidadeAulas ?? 0;

  if (
    frequencia === null ||
    frequencia === undefined ||
    quantidadeAulas <= 0
  ) {
    return componenteIndisponivel(
      "FREQUENCIA",
      "Frequência",
      maximo,
      "Ainda não há aulas suficientes para analisar a frequência."
    );
  }

  const percentual =
    limitarPercentual(
      frequencia
    );

  let pontos = 0;

  if (percentual < 75) {
    pontos = 30;
  }
  else if (percentual < 80) {
    pontos = 20;
  }
  else if (percentual < 85) {
    pontos = 10;
  }
  else if (percentual < 90) {
    pontos = 5;
  }

  return {
    codigo: "FREQUENCIA",
    titulo: "Frequência",
    pontos,
    maximo,
    disponivel: true,
    detalhe:
      `Frequência atual de ${formatarPercentual(
        percentual
      )} em ${quantidadeAulas} aula${
        quantidadeAulas === 1
          ? ""
          : "s"
      } considerada${
        quantidadeAulas === 1
          ? ""
          : "s"
      }.`,
  };
}

function calcularDesempenho(
  entrada: EntradaRiscoAcademico
): ComponenteRiscoAcademico {
  const maximo = 30;

  const media =
    entrada.mediaPercentual;

  const quantidadeAvaliacoes =
    entrada.quantidadeAvaliacoes ?? 0;

  if (
    media === null ||
    media === undefined ||
    quantidadeAvaliacoes <= 0
  ) {
    return componenteIndisponivel(
      "DESEMPENHO",
      "Desempenho",
      maximo,
      "Ainda não há avaliações suficientes para analisar o desempenho."
    );
  }

  const percentual =
    limitarPercentual(
      media
    );

  let pontos = 0;

  if (percentual < 50) {
    pontos = 30;
  }
  else if (percentual < 60) {
    pontos = 20;
  }
  else if (percentual < 70) {
    pontos = 10;
  }
  else if (percentual < 75) {
    pontos = 5;
  }

  return {
    codigo: "DESEMPENHO",
    titulo: "Desempenho",
    pontos,
    maximo,
    disponivel: true,
    detalhe:
      `Desempenho médio de ${formatarPercentual(
        percentual
      )} considerando ${quantidadeAvaliacoes} avaliação${
        quantidadeAvaliacoes === 1
          ? ""
          : "ões"
      }.`,
  };
}

function calcularPendencias(
  entrada: EntradaRiscoAcademico
): ComponenteRiscoAcademico {
  const maximo = 20;

  const total =
    entrada.totalAtividadesConsideradas ??
    0;

  const vencidas =
    Math.max(
      0,
      entrada.atividadesVencidas ??
        0
    );

  if (total <= 0) {
    return componenteIndisponivel(
      "PENDENCIAS",
      "Atividades pendentes",
      maximo,
      "Ainda não há atividades vencidas ou concluídas suficientes para análise."
    );
  }

  let pontos = 0;

  if (vencidas >= 4) {
    pontos = 20;
  }
  else if (vencidas === 3) {
    pontos = 15;
  }
  else if (vencidas === 2) {
    pontos = 10;
  }
  else if (vencidas === 1) {
    pontos = 5;
  }

  return {
    codigo: "PENDENCIAS",
    titulo: "Atividades pendentes",
    pontos,
    maximo,
    disponivel: true,
    detalhe:
      vencidas === 0
        ? "Nenhuma atividade vencida sem entrega."
        : `${vencidas} atividade${
            vencidas === 1
              ? ""
              : "s"
          } vencida${
            vencidas === 1
              ? ""
              : "s"
          } sem entrega.`,
  };
}

function calcularQuedaDesempenho(
  entrada: EntradaRiscoAcademico
): ComponenteRiscoAcademico {
  const maximo = 10;

  const recente =
    entrada.mediaRecentePercentual;

  const anterior =
    entrada.mediaAnteriorPercentual;

  if (
    recente === null ||
    recente === undefined ||
    anterior === null ||
    anterior === undefined
  ) {
    return componenteIndisponivel(
      "QUEDA_DESEMPENHO",
      "Evolução recente",
      maximo,
      "Ainda não há histórico suficiente para comparar períodos de desempenho."
    );
  }

  const mediaRecente =
    limitarPercentual(
      recente
    );

  const mediaAnterior =
    limitarPercentual(
      anterior
    );

  const queda =
    mediaAnterior -
    mediaRecente;

  let pontos = 0;

  if (queda > 20) {
    pontos = 10;
  }
  else if (queda > 15) {
    pontos = 8;
  }
  else if (queda > 10) {
    pontos = 6;
  }
  else if (queda > 5) {
    pontos = 3;
  }

  let detalhe =
    "O desempenho permaneceu estável.";

  if (queda > 0) {
    detalhe =
      `O desempenho caiu ${formatarPercentual(
        queda
      )} em relação ao período anterior.`;
  }
  else if (queda < 0) {
    detalhe =
      `O desempenho evoluiu ${formatarPercentual(
        Math.abs(
          queda
        )
      )} em relação ao período anterior.`;
  }

  return {
    codigo:
      "QUEDA_DESEMPENHO",
    titulo:
      "Evolução recente",
    pontos,
    maximo,
    disponivel: true,
    detalhe,
  };
}

function calcularParticipacao(
  entrada: EntradaRiscoAcademico
): ComponenteRiscoAcademico {
  const maximo = 10;

  const participacao =
    entrada.participacaoPercentual;

  if (
    participacao === null ||
    participacao === undefined
  ) {
    return componenteIndisponivel(
      "PARTICIPACAO",
      "Participação",
      maximo,
      "A participação acadêmica ainda não está disponível para esta análise."
    );
  }

  const percentual =
    limitarPercentual(
      participacao
    );

  let pontos = 0;

  if (percentual < 40) {
    pontos = 10;
  }
  else if (percentual < 60) {
    pontos = 8;
  }
  else if (percentual < 75) {
    pontos = 5;
  }
  else if (percentual < 90) {
    pontos = 2;
  }

  return {
    codigo:
      "PARTICIPACAO",
    titulo:
      "Participação",
    pontos,
    maximo,
    disponivel: true,
    detalhe:
      `Participação acadêmica estimada em ${formatarPercentual(
        percentual
      )}.`,
  };
}

function determinarNivel(
  pontuacao: number,
  coberturaPercentual: number,
  quantidadeComponentes: number
): NivelRiscoAcademico {
  if (
    coberturaPercentual < 50 ||
    quantidadeComponentes < 2
  ) {
    return "DADOS_INSUFICIENTES";
  }

  if (pontuacao >= 75) {
    return "CRITICO";
  }

  if (pontuacao >= 50) {
    return "RISCO";
  }

  if (pontuacao >= 25) {
    return "ATENCAO";
  }

  return "NORMAL";
}

function determinarConfiabilidade(
  coberturaPercentual: number
): ConfiabilidadeAnalise {
  if (
    coberturaPercentual >= 80
  ) {
    return "ALTA";
  }

  if (
    coberturaPercentual >= 60
  ) {
    return "MEDIA";
  }

  return "BAIXA";
}

export function calcularRiscoAcademico(
  entrada: EntradaRiscoAcademico
): ResultadoRiscoAcademico {
  const componentes = [
    calcularFrequencia(
      entrada
    ),
    calcularDesempenho(
      entrada
    ),
    calcularPendencias(
      entrada
    ),
    calcularQuedaDesempenho(
      entrada
    ),
    calcularParticipacao(
      entrada
    ),
  ];

  const disponiveis =
    componentes.filter(
      (item) =>
        item.disponivel
    );

  const pontuacaoBruta =
    disponiveis.reduce(
      (
        total,
        item
      ) =>
        total +
        item.pontos,
      0
    );

  const maximoDisponivel =
    disponiveis.reduce(
      (
        total,
        item
      ) =>
        total +
        item.maximo,
      0
    );

  const coberturaPercentual =
    Math.round(
      (
        maximoDisponivel /
        100
      ) *
        100
    );

  const pontuacao =
    maximoDisponivel > 0
      ? Math.round(
          (
            pontuacaoBruta /
            maximoDisponivel
          ) *
            100
        )
      : 0;

  const nivel =
    determinarNivel(
      pontuacao,
      coberturaPercentual,
      disponiveis.length
    );

  const confiabilidade =
    determinarConfiabilidade(
      coberturaPercentual
    );

  const fatoresPrincipais =
    disponiveis
      .filter(
        (item) =>
          item.pontos > 0
      )
      .sort(
        (
          a,
          b
        ) =>
          b.pontos /
            b.maximo -
          a.pontos /
            a.maximo
      );

  return {
    pontuacao,
    pontuacaoBruta,
    maximoDisponivel,
    nivel,
    coberturaPercentual,
    confiabilidade,
    componentes,
    fatoresPrincipais,
  };
}