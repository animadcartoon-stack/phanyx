import { descontoPontualidadeEmReais, faixasDescontoPontualidade } from "@/lib/financeiro/desconto-pontualidade";
import { vencimentoMensal } from "@/lib/matriculas/combos";

const tagsAnuidade = /{{\s*(?:inicioAnuidade|fimAnuidade|baseAnuidade|percentualDescontoConjunto|descontoComercialAnuidade|bolsaAnuidade|totalAnuidadeContratual|quantidadeParcelasAnuidade|primeiroVencimentoAnuidade|ultimoVencimentoAnuidade|antecipacaoAnuidade|vencimentoAntecipacaoAnuidade|percentualPontualidade|descontoPontualidadeAnuidade|totalAnuidadePontual)\s*}}/;

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
  if (!plano && taxa > 0) {
    return erroAnuidade("A matrícula tem taxa separada, mas o modelo de contrato prevê abatimento na primeira parcela. Registre um cronograma contratado com a antecipação abatida antes de emitir o contrato.");
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
        !Number.isSafeInteger(antecipacao) || antecipacao < 0 || antecipacao !== taxa ||
        !nominais.every((nominal, indice) => Number.isSafeInteger(nominal) && nominal > 0 &&
          Number.isSafeInteger(exigiveis[indice]) && exigiveis[indice] > 0 &&
          exigiveis[indice] === nominal - (indice === 0 ? antecipacao : 0))) {
      return erroAnuidade("O cronograma do plano contratado não confere com a antecipação registrada na matrícula.");
    }
    base = nominais.reduce((total, valor) => total + valor, 0);
    if (base !== plano.totalCentavos) return erroAnuidade("O total do plano contratado diverge das parcelas registradas.");
    parcelas = exigiveis;
  } else {
    const mensalidade = Math.round(Number(matricula.valorMensalidade ?? NaN) * 100);
    const percentualBolsa = Number(matricula.bolsaPercentual ?? 0);
    if (taxa !== 0 || !Number.isSafeInteger(mensalidade) || mensalidade < 0 ||
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
  if (faixas.antecipado) {
    return erroAnuidade("Este modelo descreve desconto até o vencimento. Ajuste a cláusula de pontualidade para o plano com desconto por antecedência.");
  }
  const percentualPontualidade = faixas.vencimento?.percentual ?? 0;
  const descontoPontualidade = parcelas.reduce((total, parcela) =>
    total + Math.round(descontoPontualidadeEmReais(parcela / 100, percentualPontualidade) * 100), 0);
  const total = parcelas.reduce((soma, parcela) => soma + parcela, antecipacao);
  const moeda = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" });
  const percentual = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 });
  const data = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeZone: "UTC" });
  const formatarData = (civil: string) => data.format(new Date(civil + "T12:00:00.000Z"));
  const vencimentoAntecipacao = dataCivil(lancamentos.find(item => item.tipo === "MATRICULA")?.vencimento);
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
        vencimentoAntecipacao ? formatarData(vencimentoAntecipacao) : "não informado",
      percentualPontualidade: percentual.format(percentualPontualidade / 100),
      descontoPontualidadeAnuidade: moeda.format(descontoPontualidade / 100),
      totalAnuidadePontual: moeda.format((total - descontoPontualidade) / 100),
    },
  };
}
