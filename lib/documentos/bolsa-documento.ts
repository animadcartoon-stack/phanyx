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

  let textoBolsaContrato = "";

  if (percentual >= 100) {
    textoBolsaContrato =
      "Nesta matr\u00edcula, foi registrada bolsa integral de estudos de 100%, ficando o(a) aluno(a) isento(a) do pagamento das mensalidades referentes a esta matr\u00edcula.";
  } else if (percentual > 0) {
    if (possuiValorMensalidade) {
      textoBolsaContrato =
        `Nesta matr\u00edcula, foi registrada bolsa de estudos de ${percentualFormatado}, aplicada \u00e0s mensalidades, reduzindo o valor mensal de ${valorOriginalFormatado} para ${valorComBolsaFormatado}.`;
    } else {
      textoBolsaContrato =
        `Nesta matr\u00edcula, foi registrada bolsa de estudos de ${percentualFormatado}, aplicada \u00e0s mensalidades.`;
    }
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

    textoBolsaContrato,
  };
}
