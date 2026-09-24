type MatriculaBolsaDocumentoInput = {
  valorMensalidade?: unknown;
  bolsaPercentual?: unknown;
  quantidadeMensalidades?: unknown;
};

export type LocaleDocumento =
  | "pt-BR"
  | "pt-PT"
  | "en-US"
  | "es-ES"
  | "fr-FR";

const LOCALES_DOCUMENTO: LocaleDocumento[] = [
  "pt-BR",
  "pt-PT",
  "en-US",
  "es-ES",
  "fr-FR",
];

function normalizarLocaleDocumento(
  locale?: string | null
): LocaleDocumento {
  return LOCALES_DOCUMENTO.includes(
    locale as LocaleDocumento
  )
    ? (locale as LocaleDocumento)
    : "pt-BR";
}

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
  valor: number,
  locale: LocaleDocumento
) {
  return Number(
    valor || 0
  ).toLocaleString(
    locale,
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function formatarPercentualDocumento(
  valor: number,
  locale: LocaleDocumento
) {
  return Number(
    valor || 0
  ).toLocaleString(
    locale,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
}

function montarTextoBolsaContrato(params: {
  locale: LocaleDocumento;
  percentual: number;
  percentualFormatado: string;
  possuiValorMensalidade: boolean;
  possuiPlanoFinanceiroCompleto: boolean;
  quantidadeMensalidades: string;
  valorOriginalFormatado: string;
  valorDescontoFormatado: string;
  valorComBolsaFormatado: string;
  valorTotalOriginalFormatado: string;
  valorTotalBeneficioFormatado: string;
  valorTotalComBolsaFormatado: string;
}) {
  const {
    locale,
    percentual,
    percentualFormatado,
    possuiValorMensalidade,
    possuiPlanoFinanceiroCompleto,
    quantidadeMensalidades,
    valorOriginalFormatado,
    valorDescontoFormatado,
    valorComBolsaFormatado,
    valorTotalOriginalFormatado,
    valorTotalBeneficioFormatado,
    valorTotalComBolsaFormatado,
  } = params;

  if (percentual <= 0) {
    return "";
  }

  const integral =
    percentual >= 100;

  const textos: Record<
    LocaleDocumento,
    {
      titulo: string;
      integral: string;
      parcial: string;
      introducao: string;
      valor: string;
      plano: string;
      abrangencia: string;
      manutencao: string;
      encerramento: string;
      retroatividade: string;
    }
  > = {
    "pt-BR": {
      titulo:
        "CL\u00c1USULA ESPEC\u00cdFICA \u2013 DA BOLSA DE ESTUDOS",

      integral:
        "integral",

      parcial:
        "parcial",

      introducao:
        "O(A) aluno(a) \u00e9 benefici\u00e1rio(a) de bolsa de estudos {tipo} de {percentual}, incidente exclusivamente sobre as mensalidades vinculadas \u00e0 presente matr\u00edcula.",

      valor:
        "O valor original de cada mensalidade \u00e9 de {original}. O desconto mensal correspondente \u00e0 bolsa \u00e9 de {desconto}, resultando em mensalidade de {final}.",

      plano:
        "A presente matr\u00edcula prev\u00ea {quantidade} mensalidades, correspondentes ao valor-base total de {totalOriginal}. O benef\u00edcio total estimado da bolsa \u00e9 de {totalBeneficio}, resultando em valor total devido em mensalidades de {totalFinal}.",

      abrangencia:
        "A bolsa de estudos incide exclusivamente sobre as mensalidades, n\u00e3o abrangendo taxa de matr\u00edcula, materiais, servi\u00e7os adicionais, taxas administrativas ou outros encargos, salvo previs\u00e3o expressa da CONTRATADA.",

      manutencao:
        "A manuten\u00e7\u00e3o do benef\u00edcio fica condicionada ao cumprimento das regras estabelecidas pela CONTRATADA em sua Pol\u00edtica e/ou Termo de Concess\u00e3o de Bolsa, podendo compreender, quando aplic\u00e1veis, requisitos de desempenho acad\u00eamico, frequ\u00eancia, manuten\u00e7\u00e3o regular do v\u00ednculo, cumprimento do regulamento institucional e das normas disciplinares, bem como outras condi\u00e7\u00f5es formalmente informadas ao benefici\u00e1rio.",

      encerramento:
        "A eventual redu\u00e7\u00e3o, suspens\u00e3o ou encerramento da bolsa depender\u00e1 de an\u00e1lise e registro formal pela CONTRATADA, com comunica\u00e7\u00e3o ao aluno, \u00e0 aluna ou ao respons\u00e1vel, observadas as condi\u00e7\u00f5es da concess\u00e3o e a legisla\u00e7\u00e3o aplic\u00e1vel.",

      retroatividade:
        "A altera\u00e7\u00e3o do benef\u00edcio n\u00e3o modifica retroativamente as mensalidades que j\u00e1 tenham sido regularmente contempladas pela bolsa, ressalvadas as hip\u00f3teses previstas em lei ou em instrumento de concess\u00e3o validamente firmado.",
    },

    "pt-PT": {
      titulo:
        "CL\u00c1USULA ESPEC\u00cdFICA \u2013 DA BOLSA DE ESTUDOS",

      integral:
        "integral",

      parcial:
        "parcial",

      introducao:
        "O(A) aluno(a) beneficia de uma bolsa de estudos {tipo} de {percentual}, aplic\u00e1vel exclusivamente \u00e0s mensalidades associadas \u00e0 presente matr\u00edcula.",

      valor:
        "O valor original de cada mensalidade \u00e9 de {original}. O desconto mensal correspondente \u00e0 bolsa \u00e9 de {desconto}, resultando numa mensalidade de {final}.",

      plano:
        "A presente matr\u00edcula prev\u00ea {quantidade} mensalidades, correspondentes ao valor-base total de {totalOriginal}. O benef\u00edcio total estimado da bolsa \u00e9 de {totalBeneficio}, resultando num valor total devido em mensalidades de {totalFinal}.",

      abrangencia:
        "A bolsa de estudos incide exclusivamente sobre as mensalidades, n\u00e3o abrangendo taxa de matr\u00edcula, materiais, servi\u00e7os adicionais, taxas administrativas ou outros encargos, salvo previs\u00e3o expressa da ENTIDADE CONTRATADA.",

      manutencao:
        "A manuten\u00e7\u00e3o do benef\u00edcio fica condicionada ao cumprimento das regras estabelecidas pela ENTIDADE CONTRATADA na sua Pol\u00edtica e/ou Termo de Concess\u00e3o de Bolsa, podendo incluir, quando aplic\u00e1vel, requisitos de desempenho acad\u00e9mico, assiduidade, manuten\u00e7\u00e3o regular do v\u00ednculo, cumprimento do regulamento institucional e das normas disciplinares, bem como outras condi\u00e7\u00f5es formalmente comunicadas ao benefici\u00e1rio.",

      encerramento:
        "A eventual redu\u00e7\u00e3o, suspens\u00e3o ou cessa\u00e7\u00e3o da bolsa depender\u00e1 de an\u00e1lise e registo formal pela ENTIDADE CONTRATADA, com comunica\u00e7\u00e3o ao aluno, \u00e0 aluna ou ao respons\u00e1vel, observadas as condi\u00e7\u00f5es da concess\u00e3o e a legisla\u00e7\u00e3o aplic\u00e1vel.",

      retroatividade:
        "A altera\u00e7\u00e3o do benef\u00edcio n\u00e3o modifica retroativamente as mensalidades que j\u00e1 tenham sido regularmente abrangidas pela bolsa, ressalvadas as hip\u00f3teses previstas na lei ou em instrumento de concess\u00e3o validamente celebrado.",
    },

    "en-US": {
      titulo:
        "SPECIFIC CLAUSE \u2013 SCHOLARSHIP",

      integral:
        "full",

      parcial:
        "partial",

      introducao:
        "The student is the beneficiary of a {tipo} scholarship of {percentual}, applicable exclusively to the tuition installments related to this enrollment.",

      valor:
        "The original amount of each tuition installment is {original}. The monthly scholarship discount is {desconto}, resulting in a tuition installment of {final}.",

      plano:
        "This enrollment provides for {quantidade} tuition installments, corresponding to a total original amount of {totalOriginal}. The estimated total scholarship benefit is {totalBeneficio}, resulting in a total tuition amount due of {totalFinal}.",

      abrangencia:
        "The scholarship applies exclusively to tuition installments and does not include enrollment fees, materials, additional services, administrative fees, or other charges, unless expressly provided otherwise by the CONTRACTED INSTITUTION.",

      manutencao:
        "Continuation of the benefit is subject to compliance with the rules established by the CONTRACTED INSTITUTION in its Scholarship Policy and/or Scholarship Award Terms, which may include, when applicable, academic performance, attendance, maintenance of active enrollment, compliance with institutional regulations and disciplinary rules, as well as other conditions formally communicated to the beneficiary.",

      encerramento:
        "Any reduction, suspension, or termination of the scholarship shall depend on formal review and registration by the CONTRACTED INSTITUTION, with notice to the student or legal guardian, subject to the conditions of the scholarship award and applicable law.",

      retroatividade:
        "Any change to the benefit shall not retroactively modify tuition installments that were already duly covered by the scholarship, except in cases provided for by law or by a validly executed scholarship agreement.",
    },

    "es-ES": {
      titulo:
        "CL\u00c1USULA ESPEC\u00cdFICA \u2013 BECA DE ESTUDIOS",

      integral:
        "integral",

      parcial:
        "parcial",

      introducao:
        "El/La estudiante es beneficiario/a de una beca de estudios {tipo} del {percentual}, aplicable exclusivamente a las mensualidades vinculadas a la presente matr\u00edcula.",

      valor:
        "El importe original de cada mensualidad es de {original}. El descuento mensual correspondiente a la beca es de {desconto}, resultando en una mensualidad de {final}.",

      plano:
        "La presente matr\u00edcula contempla {quantidade} mensualidades, correspondientes a un importe total original de {totalOriginal}. El beneficio total estimado de la beca es de {totalBeneficio}, resultando en un importe total debido por mensualidades de {totalFinal}.",

      abrangencia:
        "La beca de estudios se aplica exclusivamente a las mensualidades y no incluye matr\u00edcula, materiales, servicios adicionales, tasas administrativas u otros cargos, salvo disposici\u00f3n expresa de la INSTITUCI\u00d3N CONTRATADA.",

      manutencao:
        "El mantenimiento del beneficio queda condicionado al cumplimiento de las normas establecidas por la INSTITUCI\u00d3N CONTRATADA en su Pol\u00edtica y/o T\u00e9rmino de Concesi\u00f3n de Becas, pudiendo incluir, cuando corresponda, requisitos de rendimiento acad\u00e9mico, asistencia, mantenimiento regular del v\u00ednculo, cumplimiento del reglamento institucional y de las normas disciplinarias, as\u00ed como otras condiciones formalmente comunicadas al beneficiario.",

      encerramento:
        "La eventual reducci\u00f3n, suspensi\u00f3n o terminaci\u00f3n de la beca depender\u00e1 del an\u00e1lisis y registro formal por parte de la INSTITUCI\u00d3N CONTRATADA, con comunicaci\u00f3n al estudiante o responsable legal, respetando las condiciones de concesi\u00f3n y la legislaci\u00f3n aplicable.",

      retroatividade:
        "La modificaci\u00f3n del beneficio no alterar\u00e1 retroactivamente las mensualidades que ya hayan sido regularmente cubiertas por la beca, salvo los supuestos previstos por la ley o por un instrumento de concesi\u00f3n v\u00e1lidamente celebrado.",
    },

    "fr-FR": {
      titulo:
        "CLAUSE SP\u00c9CIFIQUE \u2013 BOURSE D'\u00c9TUDES",

      integral:
        "int\u00e9grale",

      parcial:
        "partielle",

      introducao:
        "L'\u00e9tudiant(e) b\u00e9n\u00e9ficie d'une bourse d'\u00e9tudes {tipo} de {percentual}, applicable exclusivement aux mensualit\u00e9s li\u00e9es \u00e0 la pr\u00e9sente inscription.",

      valor:
        "Le montant initial de chaque mensualit\u00e9 est de {original}. La r\u00e9duction mensuelle correspondant \u00e0 la bourse est de {desconto}, ce qui porte la mensualit\u00e9 \u00e0 {final}.",

      plano:
        "La pr\u00e9sente inscription pr\u00e9voit {quantidade} mensualit\u00e9s, correspondant \u00e0 un montant total initial de {totalOriginal}. Le montant total estim\u00e9 de la bourse est de {totalBeneficio}, ce qui porte le montant total des mensualit\u00e9s dues \u00e0 {totalFinal}.",

      abrangencia:
        "La bourse d'\u00e9tudes s'applique exclusivement aux mensualit\u00e9s et ne couvre pas les frais d'inscription, le mat\u00e9riel, les services suppl\u00e9mentaires, les frais administratifs ou autres charges, sauf disposition expresse de l'\u00c9TABLISSEMENT CONTRACTANT.",

      manutencao:
        "Le maintien de cet avantage est subordonn\u00e9 au respect des r\u00e8gles \u00e9tablies par l'\u00c9TABLISSEMENT CONTRACTANT dans sa Politique et/ou ses Conditions d'attribution des bourses, lesquelles peuvent comprendre, le cas \u00e9ch\u00e9ant, des exigences relatives aux r\u00e9sultats acad\u00e9miques, \u00e0 l'assiduit\u00e9, au maintien r\u00e9gulier de l'inscription, au respect du r\u00e8glement institutionnel et des r\u00e8gles disciplinaires, ainsi que d'autres conditions formellement communiqu\u00e9es au b\u00e9n\u00e9ficiaire.",

      encerramento:
        "Toute r\u00e9duction, suspension ou cessation de la bourse est soumise \u00e0 une analyse et \u00e0 un enregistrement formels par l'\u00c9TABLISSEMENT CONTRACTANT, avec notification \u00e0 l'\u00e9tudiant(e) ou \u00e0 son repr\u00e9sentant l\u00e9gal, conform\u00e9ment aux conditions d'attribution et \u00e0 la l\u00e9gislation applicable.",

      retroatividade:
        "Toute modification de l'avantage ne modifie pas r\u00e9troactivement les mensualit\u00e9s ayant d\u00e9j\u00e0 b\u00e9n\u00e9fici\u00e9 r\u00e9guli\u00e8rement de la bourse, sauf dans les cas pr\u00e9vus par la loi ou par un acte d'attribution valablement conclu.",
    },
  };

  const texto =
    textos[locale];

  const preencher = (
    modelo: string,
    valores: Record<string, string>
  ) =>
    Object.entries(
      valores
    ).reduce(
      (
        resultado,
        [chave, valor]
      ) =>
        resultado
          .split(
            "{" + chave + "}"
          )
          .join(valor),
      modelo
    );

  const paragrafos: string[] = [
    preencher(
      texto.introducao,
      {
        tipo:
          integral
            ? texto.integral
            : texto.parcial,

        percentual:
          percentualFormatado,
      }
    ),
  ];

  if (possuiValorMensalidade) {
    paragrafos.push(
      preencher(
        texto.valor,
        {
          original:
            valorOriginalFormatado,

          desconto:
            valorDescontoFormatado,

          final:
            valorComBolsaFormatado,
        }
      )
    );
  }

  if (possuiPlanoFinanceiroCompleto) {
    paragrafos.push(
      preencher(
        texto.plano,
        {
          quantidade:
            quantidadeMensalidades,

          totalOriginal:
            valorTotalOriginalFormatado,

          totalBeneficio:
            valorTotalBeneficioFormatado,

          totalFinal:
            valorTotalComBolsaFormatado,
        }
      )
    );
  }

  paragrafos.push(
    texto.abrangencia,
    texto.manutencao,
    texto.encerramento,
    texto.retroatividade
  );

  return [
    texto.titulo,
    ...paragrafos,
  ].join("\n\n");
}

export function montarDadosBolsaDocumento(
  matricula?: MatriculaBolsaDocumentoInput | null,
  localeRecebido?: string | null
): Record<string, string> {
  const locale =
    normalizarLocaleDocumento(
      localeRecebido
    );

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
      percentual,
      locale
    )}%`;

  const valorOriginalFormatado =
    possuiValorMensalidade
      ? formatarMoedaDocumento(
          valorMensalidadeOriginal,
          locale
        )
      : "";

  const valorDescontoFormatado =
    possuiValorMensalidade
      ? formatarMoedaDocumento(
          valorDescontoBolsa,
          locale
        )
      : "";

  const valorComBolsaFormatado =
    possuiValorMensalidade
      ? formatarMoedaDocumento(
          valorMensalidadeComBolsa,
          locale
        )
      : "";

  const valorTotalOriginalFormatado =
    possuiPlanoFinanceiroCompleto
      ? formatarMoedaDocumento(
          valorTotalMensalidadesOriginal,
          locale
        )
      : "";

  const valorTotalBeneficioFormatado =
    possuiPlanoFinanceiroCompleto
      ? formatarMoedaDocumento(
          valorTotalBeneficioBolsa,
          locale
        )
      : "";

  const valorTotalComBolsaFormatado =
    possuiPlanoFinanceiroCompleto
      ? formatarMoedaDocumento(
          valorTotalMensalidadesComBolsa,
          locale
        )
      : "";

  const textoBolsaContrato =
    montarTextoBolsaContrato({
      locale,
      percentual,
      percentualFormatado,
      possuiValorMensalidade,
      possuiPlanoFinanceiroCompleto,
      quantidadeMensalidades,
      valorOriginalFormatado,
      valorDescontoFormatado,
      valorComBolsaFormatado,
      valorTotalOriginalFormatado,
      valorTotalBeneficioFormatado,
      valorTotalComBolsaFormatado,
    });

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
