import { descontoPontualidadeAposCredito, faixasDescontoPontualidade } from "@/lib/financeiro/desconto-pontualidade";
import { vencimentoMensal } from "@/lib/matriculas/combos";

export const VARIAVEIS_ANUIDADE_CONTRATO = [
  "inicioAnuidade",
  "fimAnuidade",
  "baseAnuidade",
  "percentualDescontoConjunto",
  "descontoComercialAnuidade",
  "bolsaAnuidade",
  "totalAnuidadeContratual",
  "quantidadeParcelasAnuidade",
  "primeiroVencimentoAnuidade",
  "ultimoVencimentoAnuidade",
  "antecipacaoAnuidade",
  "vencimentoAntecipacaoAnuidade",
  "percentualPontualidade",
  "descontoPontualidadeAnuidade",
  "totalAnuidadePontual",
  "textoMatriculaAnuidade",
  "textoPontualidadeAnuidade",
] as const;

const tagsAnuidade = new RegExp(`{{\\s*(?:${VARIAVEIS_ANUIDADE_CONTRATO.join("|")})\\s*}}`);

const tagsAntecipacaoLegadas = /{{\s*(?:antecipacaoAnuidade|vencimentoAntecipacaoAnuidade)\s*}}/;
const tagsPontualidadeLegadas = /{{\s*(?:percentualPontualidade|descontoPontualidadeAnuidade|totalAnuidadePontual)\s*}}/;

type MatriculaAnuidade = {
  dataInicioCurso?: Date | string | null;
  turmaPrincipal?: { dataFim?: Date | string | null } | null;
  primeiroVencimento?: Date | string | null;
  dataPrimeiroVencimento?: Date | string | null;
  planoPagamentoContratado?: unknown;
  contratacaoModalidades?: unknown;
  valorMatricula?: unknown;
  valorMensalidade?: unknown;
  bolsaPercentual?: unknown;
  quantidadeMensalidades?: number | null;
  quantidadeParcelas?: number | null;
  descontoPontualidade?: unknown;
  lancamentosFinanceiros?: { tipo: string; vencimento?: Date | string | null }[];
};

const registro = (valor: unknown) => valor && typeof valor === "object" && !Array.isArray(valor)
  ? valor as Record<string, unknown>
  : null;

function dataCivil(valor: unknown) {
  const texto = valor instanceof Date && Number.isFinite(valor.getTime())
    ? valor.toISOString().slice(0, 10)
    : typeof valor === "string" ? valor.slice(0, 10) : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto) || Number(texto.slice(0, 4)) < 1900) return null;
  const data = new Date(texto + "T12:00:00.000Z");
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === texto ? texto : null;
}

function erroAnuidade(mensagem: string): { valores: Record<string, string>; pendencia: string } {
  return { valores: {}, pendencia: mensagem };
}

export function montarDadosAnuidadeContrato(
  template: string,
  matricula: MatriculaAnuidade,
  locale = "pt-BR",
): { valores: Record<string, string>; pendencia: string | null } {
  if (!tagsAnuidade.test(template)) return { valores: {}, pendencia: null };

  const plano = registro(matricula.planoPagamentoContratado);
  const modalidades = registro(matricula.contratacaoModalidades);
  const calculo = registro(modalidades?.calculo);
  const avulso = registro(calculo?.avulso);
  const taxa = Math.round(Number(matricula.valorMatricula ?? 0) * 100);
  const antecipacaoCombo = plano?.tipo === "ANTECIPACAO_COMBO";
  const taxaSeparada = antecipacaoCombo ? Number(plano.taxaSeparadaCentavos) : plano ? 0 : taxa;
  if (!Number.isSafeInteger(taxa) || taxa < 0 ||
      !Number.isSafeInteger(taxaSeparada) || taxaSeparada < 0 || taxaSeparada > taxa) {
    return erroAnuidade("Confira o valor da taxa de matrícula registrado.");
  }
  if (taxaSeparada > 0 && tagsAntecipacaoLegadas.test(template)) {
    return erroAnuidade("A matrícula tem taxa separada. No modelo do contrato, substitua a cláusula de antecipação pela variável {{textoMatriculaAnuidade}}.");
  }

  const inicio = dataCivil(matricula.dataInicioCurso);
  const fim = dataCivil(matricula.turmaPrincipal?.dataFim);
  const lancamentos = matricula.lancamentosFinanceiros ?? [];
  const vencimentos = lancamentos.filter(item => item.tipo === "MENSALIDADE")
    .map(item => dataCivil(item.vencimento)).filter((data): data is string => data !== null).sort();
  const primeiro = dataCivil(plano?.primeiroVencimento ?? matricula.primeiroVencimento ?? matricula.dataPrimeiroVencimento)
    ?? vencimentos[0];
  const quantidade = Number(plano?.quantidadeParcelas ?? matricula.quantidadeMensalidades ?? matricula.quantidadeParcelas);
  if (!inicio || !primeiro || (fim && fim < inicio) || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 120) {
    return erroAnuidade("Confira o início do atendimento e o cronograma de parcelas da matrícula antes de emitir o contrato.");
  }

  let antecipacao = 0;
  let descontoComercial = 0;
  let bolsa = 0;
  let base: number;
  let parcelas: number[];
  if (plano) {
    const nominais = plano.parcelasCentavos;
    const exigiveis = plano.parcelasExigiveisCentavos;
    antecipacao = Number(plano.antecipacaoCentavos);
    if (plano.versao !== 1 || !Array.isArray(nominais) || !Array.isArray(exigiveis) ||
        nominais.length !== quantidade || exigiveis.length !== quantidade ||
        !Number.isSafeInteger(antecipacao) || antecipacao < 0 || antecipacao !== taxa - taxaSeparada ||
        !nominais.every((nominal, indice) => Number.isSafeInteger(nominal) && nominal > 0 &&
          Number.isSafeInteger(exigiveis[indice]) && exigiveis[indice] > 0 &&
          exigiveis[indice] === nominal - (indice === 0 ? antecipacao : 0))) {
      return erroAnuidade("O cronograma do plano contratado não confere com a antecipação registrada na matrícula.");
    }
    base = nominais.reduce((total, valor) => total + valor, 0);
    if (base !== plano.totalCentavos) return erroAnuidade("O total do plano contratado diverge das parcelas registradas.");
    parcelas = exigiveis;
    if (antecipacaoCombo) {
      const mensalidade = Math.round(Number(matricula.valorMensalidade) * 100);
      const avulsa = Number(avulso?.mensalidadeCentavos);
      const baseMensal = Math.max(mensalidade, Number.isSafeInteger(avulsa) ? avulsa : mensalidade);
      if (!Number.isSafeInteger(mensalidade) || mensalidade * quantidade < base)
        return erroAnuidade("Confira a mensalidade e a bolsa registradas na contratação conjunta.");
      bolsa = mensalidade * quantidade - base;
      descontoComercial = (baseMensal - mensalidade) * quantidade;
      base = baseMensal * quantidade;
    }
  } else {
    const mensalidade = Math.round(Number(matricula.valorMensalidade ?? NaN) * 100);
    const percentualBolsa = Number(matricula.bolsaPercentual ?? 0);
    if (!Number.isSafeInteger(mensalidade) || mensalidade < 0 ||
        !Number.isFinite(percentualBolsa) || percentualBolsa < 0 || percentualBolsa > 100) {
      return erroAnuidade("Confira o valor da mensalidade e os descontos registrados na matrícula.");
    }
    const liquida = Math.round(mensalidade * (100 - percentualBolsa) / 100);
    parcelas = Array.from({ length: quantidade }, () => liquida);
    base = mensalidade * quantidade;
    bolsa = (mensalidade - liquida) * quantidade;
    if (calculo?.comboId != null || calculo?.tipoPreco === "QUANTIDADE") {
      const antes = Number(avulso?.mensalidadeCentavos);
      if (!Number.isSafeInteger(antes) || antes < mensalidade || avulso?.quantidadeParcelas !== quantidade ||
          calculo?.mensalidadeCentavos !== mensalidade) {
        return erroAnuidade("Os valores registrados não permitem determinar o desconto conjunto deste contrato.");
      }
      base = antes * quantidade;
      descontoComercial = (antes - mensalidade) * quantidade;
    }
  }

  const faixas = faixasDescontoPontualidade(matricula.descontoPontualidade);
  if (faixas.antecipado && tagsPontualidadeLegadas.test(template)) {
    return erroAnuidade("A matrícula tem desconto por antecedência. No modelo do contrato, use {{textoPontualidadeAnuidade}} para descrever as condições de pontualidade registradas.");
  }
  const percentualPontualidade = faixas.vencimento?.percentual ?? 0;
  const descontoPara = (percentual: number) => parcelas.reduce((total, parcela, indice) =>
    total + Math.round(descontoPontualidadeAposCredito(parcela / 100, percentual,
      antecipacaoCombo && indice === 0 ? antecipacao / 100 : 0) * 100), 0);
  const descontoPontualidade = descontoPara(percentualPontualidade);
  const total = parcelas.reduce((soma, parcela) => soma + parcela, taxa);
  const moeda = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" });
  const percentual = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 });
  const data = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeZone: "UTC" });
  const formatarData = (civil: string) => data.format(new Date(civil + "T12:00:00.000Z"));
  const vencimentoMatricula = dataCivil(lancamentos.find(item => item.tipo === "MATRICULA")?.vencimento);
  const textoVencimento = vencimentoMatricula ? ` O vencimento é em ${formatarData(vencimentoMatricula)}.` : "";
  const cobrancasMatricula = [
    antecipacao > 0 ? `A antecipação de matrícula de ${moeda.format(antecipacao / 100)} integra o total contratado e é abatida da primeira parcela.` : "",
    taxaSeparada > 0 ? `A taxa de matrícula de ${moeda.format(taxaSeparada / 100)} é cobrada separadamente das mensalidades e está incluída no total contratual informado acima.` : "",
  ].filter(Boolean);
  const textoMatriculaAnuidade = cobrancasMatricula.length
    ? cobrancasMatricula.join(" ") + textoVencimento
    : "Esta contratação não prevê taxa de matrícula nem antecipação.";

  const textoFaixa = (percentualDaFaixa: number, condicao: string) => {
    const abatimento = descontoPara(percentualDaFaixa);
    const primeiraPontual = antecipacaoCombo
      ? parcelas[0] / 100 - descontoPontualidadeAposCredito(parcelas[0] / 100, percentualDaFaixa, antecipacao / 100)
      : null;
    const textoPrimeira = primeiraPontual === null ? "" :
      ` Nessa condição, o saldo da primeira parcela, com o abatimento da antecipação, é de ${moeda.format(primeiraPontual)}.`;
    return `Cada parcela quitada integralmente ${condicao} recebe ${percentual.format(percentualDaFaixa / 100)} de desconto.${textoPrimeira} Se todas as parcelas cumprirem essa condição, o abatimento total será de ${moeda.format(abatimento / 100)} e o valor total pago será de ${moeda.format((total - abatimento) / 100)}.`;
  };
  const regras: string[] = [];
  if (faixas.antecipado) {
    const dias = faixas.antecipado.diasAntecedencia;
    regras.push(textoFaixa(faixas.antecipado.percentual, `com pelo menos ${dias} ${dias === 1 ? "dia" : "dias"} de antecedência`));
  }
  if (faixas.vencimento) {
    regras.push(textoFaixa(faixas.vencimento.percentual, faixas.antecipado
      ? "após o prazo de antecipação e até o vencimento"
      : "até o vencimento"));
  }
  if (faixas.antecipado && faixas.vencimento) regras.push("Os descontos são aplicados conforme a data de pagamento, sem acumulação.");
  const textoPontualidadeAnuidade = regras.join(" ") || "Esta contratação não prevê desconto adicional por pontualidade.";
  const ultimo = vencimentos.length === quantidade
    ? formatarData(vencimentos[quantidade - 1])
    : data.format(vencimentoMensal(primeiro, quantidade - 1));

  return {
    pendencia: null,
    valores: {
      inicioAnuidade: formatarData(inicio),
      fimAnuidade: fim ? formatarData(fim) : "o indicado no Anexo I",
      baseAnuidade: moeda.format(base / 100),
      percentualDescontoConjunto: percentual.format(base ? descontoComercial / base : 0),
      descontoComercialAnuidade: moeda.format(descontoComercial / 100),
      bolsaAnuidade: moeda.format(bolsa / 100),
      totalAnuidadeContratual: moeda.format(total / 100),
      quantidadeParcelasAnuidade: String(quantidade),
      primeiroVencimentoAnuidade: formatarData(primeiro),
      ultimoVencimentoAnuidade: ultimo,
      antecipacaoAnuidade: moeda.format(antecipacao / 100),
      vencimentoAntecipacaoAnuidade: antecipacao === 0 ? "não se aplica" :
        vencimentoMatricula ? formatarData(vencimentoMatricula) : "não informado",
      percentualPontualidade: percentual.format(percentualPontualidade / 100),
      descontoPontualidadeAnuidade: moeda.format(descontoPontualidade / 100),
      totalAnuidadePontual: moeda.format((total - descontoPontualidade) / 100),
      textoMatriculaAnuidade,
      textoPontualidadeAnuidade,
    },
  };
}
