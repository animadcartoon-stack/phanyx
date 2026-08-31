import {
  calcularRiscoAcademico,
  type EntradaRiscoAcademico,
  type NivelRiscoAcademico,
} from "./calcular-risco-academico";

type Cenario = {
  nome: string;
  esperado: NivelRiscoAcademico;
  entrada: EntradaRiscoAcademico;
};

const cenarios: Cenario[] = [
  {
    nome: "Aluno em situação normal",
    esperado: "NORMAL",
    entrada: {
      frequenciaPercentual: 96,
      quantidadeAulas: 30,

      mediaPercentual: 88,
      quantidadeAvaliacoes: 8,

      atividadesVencidas: 0,
      totalAtividadesConsideradas: 10,

      mediaAnteriorPercentual: 85,
      mediaRecentePercentual: 86,

      participacaoPercentual: 95,
    },
  },

  {
    nome: "Aluno em atenção",
    esperado: "ATENCAO",
    entrada: {
      frequenciaPercentual: 88,
      quantidadeAulas: 25,

      mediaPercentual: 68,
      quantidadeAvaliacoes: 6,

      atividadesVencidas: 1,
      totalAtividadesConsideradas: 10,

      mediaAnteriorPercentual: 76,
      mediaRecentePercentual: 68,

      participacaoPercentual: 85,
    },
  },

  {
    nome: "Aluno em risco",
    esperado: "RISCO",
    entrada: {
      frequenciaPercentual: 82,
      quantidadeAulas: 32,

      mediaPercentual: 58,
      quantidadeAvaliacoes: 8,

      atividadesVencidas: 2,
      totalAtividadesConsideradas: 12,

      mediaAnteriorPercentual: 73,
      mediaRecentePercentual: 61,

      participacaoPercentual: 70,
    },
  },

  {
    nome: "Aluno em situação crítica",
    esperado: "CRITICO",
    entrada: {
      frequenciaPercentual: 72,
      quantidadeAulas: 35,

      mediaPercentual: 48,
      quantidadeAvaliacoes: 10,

      atividadesVencidas: 3,
      totalAtividadesConsideradas: 12,

      mediaAnteriorPercentual: 78,
      mediaRecentePercentual: 53,

      participacaoPercentual: 35,
    },
  },

  {
    nome: "Aluno com dados insuficientes",
    esperado: "DADOS_INSUFICIENTES",
    entrada: {
      frequenciaPercentual: 65,
      quantidadeAulas: 2,

      mediaPercentual: null,
      quantidadeAvaliacoes: 0,

      atividadesVencidas: 0,
      totalAtividadesConsideradas: 0,

      mediaAnteriorPercentual: null,
      mediaRecentePercentual: null,

      participacaoPercentual: null,
    },
  },
];

let erros = 0;

console.log(
  "\n============================================"
);

console.log(
  " PHANYX STUDENT SUCCESS — TESTE DO MOTOR"
);

console.log(
  "============================================\n"
);

for (const cenario of cenarios) {
  const resultado =
    calcularRiscoAcademico(
      cenario.entrada
    );

  const passou =
    resultado.nivel ===
    cenario.esperado;

  if (!passou) {
    erros += 1;
  }

  console.log(
    passou
      ? "✅ TESTE APROVADO"
      : "❌ TESTE FALHOU"
  );

  console.log(
    `Cenário: ${cenario.nome}`
  );

  console.log(
    `Esperado: ${cenario.esperado}`
  );

  console.log(
    `Obtido: ${resultado.nivel}`
  );

  console.log(
    `Risco: ${resultado.pontuacao}/100`
  );

  console.log(
    `Cobertura: ${resultado.coberturaPercentual}%`
  );

  console.log(
    `Confiabilidade: ${resultado.confiabilidade}`
  );

  console.log(
    "\nComponentes:"
  );

  for (
    const componente of
    resultado.componentes
  ) {
    console.log(
      componente.disponivel
        ? `  • ${componente.titulo}: ${componente.pontos}/${componente.maximo}`
        : `  • ${componente.titulo}: indisponível`
    );

    console.log(
      `    ${componente.detalhe}`
    );
  }

  if (
    resultado.fatoresPrincipais
      .length > 0
  ) {
    console.log(
      "\nPrincipais fatores:"
    );

    for (
      const fator of
      resultado.fatoresPrincipais
    ) {
      console.log(
        `  → ${fator.titulo}: ${fator.pontos}/${fator.maximo}`
      );
    }
  }

  console.log(
    "\n--------------------------------------------\n"
  );
}

if (erros > 0) {
  console.error(
    `❌ ${erros} cenário(s) não produziram o resultado esperado.`
  );

  process.exitCode = 1;
}
else {
  console.log(
    "✅ TODOS OS CENÁRIOS FORAM APROVADOS."
  );
}