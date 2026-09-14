export type ConfigPreviewDocumento =
  | Record<string, unknown>
  | null
  | undefined;

function textoConfig(
  config: ConfigPreviewDocumento,
  chave: string,
  fallback = ""
) {
  const valor =
    config?.[chave];

  if (
    typeof valor === "string" &&
    valor.trim()
  ) {
    return valor;
  }

  return fallback;
}

export function montarValoresPreviewDocumento(
  config?: ConfigPreviewDocumento
): Record<string, string> {
  const nomeInstituicao =
    textoConfig(
      config,
      "nomeFantasia",
      "Institui\u00e7\u00e3o Exemplo"
    );

  const cnpj =
    textoConfig(
      config,
      "cnpj",
      "00.000.000/0001-00"
    );

  const endereco =
    textoConfig(
      config,
      "endereco",
      ""
    );

  const telefone =
    textoConfig(
      config,
      "telefone",
      ""
    );

  const email =
    textoConfig(
      config,
      "email",
      ""
    );

  const cidade =
    textoConfig(
      config,
      "cidade",
      "Cidade"
    );

  const estado =
    textoConfig(
      config,
      "estado",
      "UF"
    );

  const cep =
    textoConfig(
      config,
      "cep",
      "00000-000"
    );

  const cidadeAssinatura =
    textoConfig(
      config,
      "cidadeAssinatura",
      cidade
    );

  const responsavelLegal =
    textoConfig(
      config,
      "responsavelNome",
      "Respons\u00e1vel legal"
    );

  const blocoInstituicao =
    [
      nomeInstituicao,

      cnpj
        ? `CNPJ: ${cnpj}`
        : "",

      endereco,

      [
        telefone,
        email,
      ]
        .filter(Boolean)
        .join(" \u2022 "),
    ]
      .filter(Boolean)
      .join("\n");

  const agora =
    new Date();

  return {
    blocoInstituicao,

    logoInstituicao:
      "__PHANYX_LOGO_INSTITUICAO__",

    nomeInstituicao,

    cnpjInstituicao:
      cnpj,

    enderecoInstituicao:
      endereco || "Endere\u00e7o institucional",

    telefoneInstituicao:
      telefone ||
      "(00) 00000-0000",

    emailInstituicao:
      email ||
      "contato@instituicao.com",

    cidadeInstituicao:
      cidade,

    estadoInstituicao:
      estado,

    cepInstituicao:
      cep,

    dataAtual:
      agora.toLocaleDateString(
        "pt-BR"
      ),

    cidadeAssinatura,

    responsavelLegal,

    nomeAluno:
      "Aluno Exemplo",

    cpfAluno:
      "000.000.000-00",

    rgAluno:
      "00.000.000-0",

    matriculaAluno:
      "2026-0001",

    numeroMatricula:
      "2026-0001",

    curso:
      "Bacharel Livre em Teologia",

    statusAluno:
      "ATIVO",

    statusMatricula:
      "ATIVA",

    dataMatricula:
      "03/06/2026",

    dataInicioAluno:
      "03/06/2026",

    dataConclusao:
      "-",

    dataConclusaoAluno:
      "-",

    semestreAtual:
      "1\u00ba semestre",

    cargaHorariaCurso:
      "3.200h",

    cargaHorariaMinimaCurso:
      "20h",

    cargaHorariaMaximaCurso:
      "550h",

    percentualConclusao:
      "25%",

    nomePolo:
      "N\u00e3o informado",

    enderecoPolo:
      "N\u00e3o informado",

    telefonePolo:
      "N\u00e3o informado",

    emailPolo:
      "N\u00e3o informado",

    cidadePolo:
      "N\u00e3o informado",

    estadoPolo:
      "N\u00e3o informado",

    cepPolo:
      "N\u00e3o informado",

    nomeTitularContrato:
      "Nome do titular do contrato",

    cpfTitularContrato:
      "CPF do titular",

    emailTitularContrato:
      "E-mail do titular",

    telefoneTitularContrato:
      "Telefone do titular",

    parentescoTitularContrato:
      "V\u00ednculo ou parentesco",

    tipoTitularContrato:
      "Tipo de titular",

    disciplinas:
      "- Antigo Testamento A \u2014 96h<br>" +
      "- Novo Testamento A \u2014 96h<br>" +
      "- Teologia B\u00edblica \u2014 64h",
    cursoNome:
      "Bacharel Livre em Teologia",

    disciplinasContratadas:
      "- Antigo Testamento A \u2014 96h<br>" +
      "- Novo Testamento A \u2014 96h<br>" +
      "- Teologia B\u00edblica \u2014 64h",
    valorContrato:
      "R$ 2.000,00",

    percentualBolsa:
      "20%",

    valorMensalidadeOriginal:
      "R$ 1.000,00",

    valorDescontoBolsa:
      "R$ 200,00",

    valorMensalidadeComBolsa:
      "R$ 800,00",

    quantidadeMensalidades:
      "12",

    valorTotalMensalidadesOriginal:
      "R$ 12.000,00",

    valorTotalBeneficioBolsa:
      "R$ 2.400,00",

    valorTotalMensalidadesComBolsa:
      "R$ 9.600,00",

    textoBolsaContrato:
      "CL\u00c1USULA ESPEC\u00cdFICA \u2013 DA BOLSA DE ESTUDOS\n\nO(A) aluno(a) \u00e9 benefici\u00e1rio(a) de bolsa de estudos parcial de 20%, incidente exclusivamente sobre as mensalidades vinculadas \u00e0 presente matr\u00edcula.\n\nO valor original de cada mensalidade \u00e9 de R$ 1.000,00. O desconto mensal correspondente \u00e0 bolsa \u00e9 de R$ 200,00, resultando em mensalidade de R$ 800,00.\n\nA presente matr\u00edcula prev\u00ea 12 mensalidades, correspondentes ao valor-base total de R$ 12.000,00. O benef\u00edcio total estimado da bolsa \u00e9 de R$ 2.400,00, resultando em valor total devido em mensalidades de R$ 9.600,00.\n\nA bolsa de estudos incide exclusivamente sobre as mensalidades, n\u00e3o abrangendo taxa de matr\u00edcula, materiais, servi\u00e7os adicionais, taxas administrativas ou outros encargos, salvo previs\u00e3o expressa da CONTRATADA.\n\nA manuten\u00e7\u00e3o do benef\u00edcio fica condicionada ao cumprimento das regras estabelecidas pela CONTRATADA em sua Pol\u00edtica e/ou Termo de Concess\u00e3o de Bolsa, podendo compreender, quando aplic\u00e1veis, requisitos de desempenho acad\u00eamico, frequ\u00eancia, manuten\u00e7\u00e3o regular do v\u00ednculo, cumprimento do regulamento institucional e das normas disciplinares, bem como outras condi\u00e7\u00f5es formalmente informadas ao benefici\u00e1rio.\n\nA eventual redu\u00e7\u00e3o, suspens\u00e3o ou encerramento da bolsa depender\u00e1 de an\u00e1lise e registro formal pela CONTRATADA, com comunica\u00e7\u00e3o ao aluno, \u00e0 aluna ou ao respons\u00e1vel, observadas as condi\u00e7\u00f5es da concess\u00e3o e a legisla\u00e7\u00e3o aplic\u00e1vel.\n\nA altera\u00e7\u00e3o do benef\u00edcio n\u00e3o modifica retroativamente as mensalidades que j\u00e1 tenham sido regularmente contempladas pela bolsa, ressalvadas as hip\u00f3teses previstas em lei ou em instrumento de concess\u00e3o validamente firmado.",

    codigoValidacao:
      "PHANYX-PREVIA-000001",

    urlValidacao:
      "https://www.phanyx.com.br/validar-documento",

    numeroDocumento:
      "CONTRATO-PREVIA-000001",

    dataEmissao:
      agora.toLocaleDateString(
        "pt-BR"
      ),

    horaEmissao:
      agora.toLocaleTimeString(
        "pt-BR"
      ),

    dataHoraEmissao:
      agora.toLocaleString(
        "pt-BR"
      ),

    nomeFuncionario:
      "Funcion\u00e1rio Exemplo",

    funcionarioNome:
      "Funcion\u00e1rio Exemplo",

    cpfFuncionario:
      "000.000.000-00",

    funcionarioCpf:
      "000.000.000-00",

    rgFuncionario:
      "00.000.000-0",

    funcionarioRg:
      "00.000.000-0",

    cargoFuncionario:
      "Auxiliar Administrativo",

    funcionarioCargo:
      "Auxiliar Administrativo",

    departamentoFuncionario:
      "Departamento Exemplo",

    funcionarioDepartamento:
      "Departamento Exemplo",

    dataAdmissaoFuncionario:
      "-",

    funcionarioDataAdmissao:
      "-",

    dataDesligamentoFuncionario:
      "-",

    funcionarioDataDesligamento:
      "-",

    motivoDemissao:
      "Motivo exemplo",

    tipoRescisao:
      "Sem justa causa",

    dataDemissao:
      "-",

    saldoSalario:
      "R$ 0,00",

    feriasVencidas:
      "R$ 0,00",

    feriasProporcionais:
      "R$ 0,00",

    decimoTerceiroProporcional:
      "R$ 0,00",

    avisoPrevio:
      "R$ 0,00",

    multaFgts:
      "-",

    valorBrutoRescisao:
      "-",

    descontoInss:
      "-",

    descontoIrrf:
      "-",

    outrosDescontos:
      "-",

    valorLiquidoRescisao:
      "R$ 0,00",

    valorRescisao:
      "R$ 0,00",
  };
}

export function substituirVariaveisPreviewDocumento(
  texto: string,
  config?: ConfigPreviewDocumento
) {
  const valores =
    montarValoresPreviewDocumento(
      config
    );

  let final =
    String(texto || "");

  for (
    const [chave, valor]
    of Object.entries(valores)
  ) {
    const chaveSegura =
      chave.replace(
        /[.*+?^\${}()|[\]\\]/g,
        "\\$&"
      );

    const padrao =
      new RegExp(
        `{{\\s*${chaveSegura}\\s*}}`,
        "g"
      );

    final =
      final.replace(
        padrao,
        () => valor || ""
      );
  }

  return final;
}
