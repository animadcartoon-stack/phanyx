type MatriculaBolsaDocumentoInput = {
  valorMensalidade?: unknown;
  bolsaPercentual?: unknown;
  quantidadeMensalidades?: unknown;
};

function numeroSeguro(
  valor: unknown
) {
  const numero =
    Number(valor ?? 0);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function arredondarMoeda(
  valor: number
) {
  return Number(
    Number(valor || 0).toFixed(2)
  );
}

function formatarMoedaDocumento(
  valor: number
) {
  return Number(
    valor || 0
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function formatarPercentualDocumento(
  valor: number
) {
  return Number(
    valor || 0
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
}

export function montarDadosBolsaDocumento(
  matricula?: MatriculaBolsaDocumentoInput | null
): Record<string, string> {
  const percentual =
    Math.min(
      100,
      Math.max(
        0,
        numeroSeguro(
          matricula?.bolsaPercentual
        )
      )
    );

  const possuiValorMensalidade =
    matricula?.valorMensalidade !==
      null &&
    matricula?.valorMensalidade !==
      undefined &&
    String(
      matricula?.valorMensalidade
    ).trim() !== "";

  const valorMensalidadeOriginal =
    possuiValorMensalidade
      ? Math.max(
          0,
          numeroSeguro(
            matricula?.valorMensalidade
          )
        )
      : 0;

  const valorDescontoBolsa =
    arredondarMoeda(
      valorMensalidadeOriginal *
      percentual /
      100
    );

  const valorMensalidadeComBolsa =
    arredondarMoeda(
      valorMensalidadeOriginal -
      valorDescontoBolsa
    );

  const quantidadeBruta =
    numeroSeguro(
      matricula?.quantidadeMensalidades
    );

  const quantidadeMensalidades =
    Number.isInteger(
      quantidadeBruta
    ) &&
    quantidadeBruta > 0
      ? String(
          quantidadeBruta
        )
      : "";

  const possuiQuantidadeMensalidades =
    quantidadeMensalidades !== "";

  const possuiPlanoFinanceiroCompleto =
    possuiValorMensalidade &&
    possuiQuantidadeMensalidades;

  const valorTotalMensalidadesOriginal =
    possuiPlanoFinanceiroCompleto
      ? arredondarMoeda(
          valorMensalidadeOriginal *
          quantidadeBruta
        )
      : 0;

  const valorTotalBeneficioBolsa =
    possuiPlanoFinanceiroCompleto
      ? arredondarMoeda(
          valorDescontoBolsa *
          quantidadeBruta
        )
      : 0;

  const valorTotalMensalidadesComBolsa =
    possuiPlanoFinanceiroCompleto
      ? arredondarMoeda(
          valorMensalidadeComBolsa *
          quantidadeBruta
        )
      : 0;

  const percentualFormatado =
    `${formatarPercentualDocumento(
      percentual
    )}%`;

  const valorOriginalFormatado =
    possuiValorMensalidade
      ? formatarMoedaDocumento(
          valorMensalidadeOriginal
        )
      : "";

  const valorDescontoFormatado =
    possuiValorMensalidade
      ? formatarMoedaDocumento(
          valorDescontoBolsa
        )
      : "";

  const valorComBolsaFormatado =
    possuiValorMensalidade
      ? formatarMoedaDocumento(
          valorMensalidadeComBolsa
        )
      : "";

  const valorTotalOriginalFormatado =
    possuiPlanoFinanceiroCompleto
      ? formatarMoedaDocumento(
          valorTotalMensalidadesOriginal
        )
      : "";

  const valorTotalBeneficioFormatado =
    possuiPlanoFinanceiroCompleto
      ? formatarMoedaDocumento(
          valorTotalBeneficioBolsa
        )
      : "";

  const valorTotalComBolsaFormatado =
    possuiPlanoFinanceiroCompleto
      ? formatarMoedaDocumento(
          valorTotalMensalidadesComBolsa
        )
      : "";

  let textoBolsaContrato = "";

  if (percentual > 0) {
    const tipoBolsa =
      percentual >= 100
        ? "integral"
        : "parcial";

    const paragrafosBolsa: string[] = [
      `O(A) aluno(a) é beneficiário(a) de bolsa de estudos ${tipoBolsa} de ${percentualFormatado}, incidente exclusivamente sobre as mensalidades vinculadas à presente matrícula.`,
    ];

    if (possuiValorMensalidade) {
      paragrafosBolsa.push(
        `O valor original de cada mensalidade é de ${valorOriginalFormatado}. O desconto mensal correspondente à bolsa é de ${valorDescontoFormatado}, resultando em mensalidade de ${valorComBolsaFormatado}.`
      );
    }

    if (possuiPlanoFinanceiroCompleto) {
      paragrafosBolsa.push(
        `A presente matrícula prevê ${quantidadeMensalidades} mensalidades, correspondentes ao valor-base total de ${valorTotalOriginalFormatado}. O benefício total estimado da bolsa é de ${valorTotalBeneficioFormatado}, resultando em valor total devido em mensalidades de ${valorTotalComBolsaFormatado}.`
      );
    }

    paragrafosBolsa.push(
      "A bolsa de estudos incide exclusivamente sobre as mensalidades, não abrangendo taxa de matrícula, materiais, serviços adicionais, taxas administrativas ou outros encargos, salvo previsão expressa da CONTRATADA."
    );

    paragrafosBolsa.push(
      "A manutenção do benefício fica condicionada ao cumprimento das regras estabelecidas pela CONTRATADA em sua Política e/ou Termo de Concessão de Bolsa, podendo compreender, quando aplicáveis, requisitos de desempenho acadêmico, frequência, manutenção regular do vínculo, cumprimento do regulamento institucional e das normas disciplinares, bem como outras condições formalmente informadas ao beneficiário."
    );

    paragrafosBolsa.push(
      "A eventual redu\u00e7\u00e3o, suspens\u00e3o ou encerramento da bolsa depender\u00e1 de an\u00e1lise e registro formal pela CONTRATADA, com comunica\u00e7\u00e3o ao aluno, \u00e0 aluna ou ao respons\u00e1vel, observadas as condi\u00e7\u00f5es da concess\u00e3o e a legisla\u00e7\u00e3o aplic\u00e1vel."
    );

    paragrafosBolsa.push(
      "A alteração do benefício não modifica retroativamente as mensalidades que já tenham sido regularmente contempladas pela bolsa, ressalvadas as hipóteses previstas em lei ou em instrumento de concessão validamente firmado."
    );

    textoBolsaContrato =
      [
        "CLÁUSULA ESPECÍFICA – DA BOLSA DE ESTUDOS",
        ...paragrafosBolsa,
      ].join("\n\n");
  }

  return {
    percentualBolsa:
      percentualFormatado,

    valorMensalidadeOriginal:
      valorOriginalFormatado,

    valorDescontoBolsa:
      valorDescontoFormatado,

    valorMensalidadeComBolsa:
      valorComBolsaFormatado,

    quantidadeMensalidades,

    valorTotalMensalidadesOriginal:
      valorTotalOriginalFormatado,

    valorTotalBeneficioBolsa:
      valorTotalBeneficioFormatado,

    valorTotalMensalidadesComBolsa:
      valorTotalComBolsaFormatado,

    textoBolsaContrato,
  };
}
