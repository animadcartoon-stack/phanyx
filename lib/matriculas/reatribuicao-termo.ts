/**
 * Minuta documental da sucessão: NÃO é contrato, assinatura ou autorização
 * para transferir matrícula, movimentar créditos, cancelar/reemitir boletos.
 * Função pura: nunca acessa banco nem integrações externas.
 */
export type PessoaMinuta = {
  nome: string;
  cpf: string | null;
  responsavelNome: string | null;
  responsavelCpf: string | null;
};
export type EntradaMinuta = {
  instituicao: string;
  numeroMatricula: string | null;
  matriculaId: number;
  transferenciaId: number;
  referenciaPlano?: string;
  origem: PessoaMinuta;
  destino: PessoaMinuta;
  dataTransferencia: Date;
  dataInicio: string;
  motivo: string;
  observacoes: string | null;
  ofertas: { cursoNome: string; turmaNome: string }[];
  financeiro: { lancamentos: number; pagosOuParciais: number; titulos: number; titulosExternos: number };
  contratos: number;
  documentos: number;
};

const texto = (v: string | null | undefined, limite = 500) =>
  (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, limite) : "") || "não informado";
const cpf = (v: string | null | undefined) => texto(v, 30);
const dataCivil = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error("DATA_CIVIL_INVALIDA");
  const d = new Date(`${v}T12:00:00Z`);
  if (Number.isNaN(d.valueOf()) || d.toISOString().slice(0, 10) !== v) throw new Error("DATA_CIVIL_INVALIDA");
  return `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}`;
};
const inteiroNaoNegativo = (n: number, campo: string) => {
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(`QUANTIDADE_INVALIDA_${campo}`);
  return n;
};

export function gerarMinutaReatribuicao(entrada: EntradaMinuta) {
  if (!Number.isSafeInteger(entrada.matriculaId) || entrada.matriculaId <= 0 ||
      !Number.isSafeInteger(entrada.transferenciaId) || entrada.transferenciaId <= 0) {
    throw new Error("IDENTIFICADORES_INVALIDOS");
  }
  if (!(entrada.dataTransferencia instanceof Date) || Number.isNaN(entrada.dataTransferencia.valueOf())) {
    throw new Error("DATA_TRANSFERENCIA_INVALIDA");
  }
  const referencia = dataCivil(entrada.dataTransferencia.toISOString().slice(0, 10));
  const inicio = dataCivil(entrada.dataInicio);
  if (!Array.isArray(entrada.ofertas) || entrada.ofertas.length === 0 || entrada.ofertas.length > 24) {
    throw new Error("PROPOSTA_ACADEMICA_INVALIDA");
  }
  const lancamentos = inteiroNaoNegativo(entrada.financeiro.lancamentos, "LANCAMENTOS");
  const pagos = inteiroNaoNegativo(entrada.financeiro.pagosOuParciais, "PAGOS");
  const titulos = inteiroNaoNegativo(entrada.financeiro.titulos, "TITULOS");
  const externos = inteiroNaoNegativo(entrada.financeiro.titulosExternos, "EXTERNOS");
  const contratos = inteiroNaoNegativo(entrada.contratos, "CONTRATOS");
  const documentos = inteiroNaoNegativo(entrada.documentos, "DOCUMENTOS");
  if (pagos > lancamentos || externos > titulos) throw new Error("RESUMO_FINANCEIRO_INCONSISTENTE");
  const nomeOrigem = texto(entrada.origem.nome, 200);
  const nomeDestino = texto(entrada.destino.nome, 200);
  const instituicao = texto(entrada.instituicao, 200);
  const numero = texto(entrada.numeroMatricula, 100);
  const cursos = entrada.ofertas.map((o, indice) =>
    `   ${indice + 1}. ${texto(o.cursoNome, 160)} — turma ${texto(o.turmaNome, 160)}`).join("\n");
  const linhas = [
    "MINUTA PARA CONFERÊNCIA — NÃO ASSINADA / SEM EFEITO DE TRANSFERÊNCIA",
    "TERMO DE SOLICITAÇÃO DE REATRIBUIÇÃO DE MATRÍCULA",
    "",
    `Instituição: ${instituicao}`,
    `Matrícula pública: ${numero} | ID interno de origem: ${entrada.matriculaId}`,
    `Solicitação de reatribuição: ${entrada.transferenciaId}`,
    `Identificador do plano assinado: ${entrada.referenciaPlano ?? "não informado"}`,
    "Este identificador identifica a versão acadêmica e comercial à qual este pedido se refere; qualquer revisão exige novo termo assinado.",
    `Data prevista da transferência: ${referencia}`,
    "",
    "1. IDENTIFICAÇÃO DAS PARTES",
    `Aluno de origem: ${nomeOrigem} | CPF: ${cpf(entrada.origem.cpf)}`,
    `Responsável pelo aluno de origem (se aplicável): ${texto(entrada.origem.responsavelNome, 200)} | CPF: ${cpf(entrada.origem.responsavelCpf)}`,
    `Aluno de destino: ${nomeDestino} | CPF: ${cpf(entrada.destino.cpf)}`,
    `Responsável pelo aluno de destino (se aplicável): ${texto(entrada.destino.responsavelNome, 200)} | CPF: ${cpf(entrada.destino.responsavelCpf)}`,
    "",
    "2. OBJETO DO PEDIDO",
    `Solicita-se a análise da substituição do aluno ${nomeOrigem} pelo aluno ${nomeDestino}, com início previsto para ${inicio}.`,
    "O pedido não produz, por si só, mudança de matrícula, reserva de vaga ou substituição do devedor contratual.",
    `Motivo declarado: ${texto(entrada.motivo, 1000)}`,
    `Observações: ${texto(entrada.observacoes, 2000)}`,
    "",
    "3. PROPOSTA ACADÊMICA A VALIDAR",
    cursos,
    "As vagas, os horários, as disciplinas e eventuais optativas devem ser revalidados pela instituição na confirmação definitiva.",
    "",
    "4. HISTÓRICO E DOCUMENTAÇÃO",
    "Notas, presenças, certificados, documentos e contratos anteriores permanecem vinculados ao aluno de origem.",
    `Referências documentais existentes: ${contratos} contrato(s) e ${documentos} documento(s) relacionados à matrícula de origem.`,
    "A eventual matrícula sucessora terá vínculo próprio; este documento não altera os dados históricos nem substitui contratos assinados.",
    "",
    "5. CONDIÇÕES FINANCEIRAS E RESPONSABILIDADE",
    `Inventário na data da emissão: ${lancamentos} lançamento(s), ${pagos} pago(s)/parcial(is), ${titulos} título(s), sendo ${externos} integrado(s) a provedor externo.`,
    "Nenhum pagamento, crédito, boleto, dívida ou titularidade financeira é transferido por esta minuta.",
    "Parcelas vincendas, créditos, abatimentos, eventual cancelamento e reemissão de títulos, bem como o responsável financeiro, exigem análise e formalização em instrumento próprio antes da execução.",
    "",
    "6. ANUÊNCIA E EFETIVAÇÃO",
    "As pessoas abaixo declaram ter conhecimento do PEDIDO. A aprovação depende da instituição, da situação financeira e dos documentos exigíveis.",
    "O simples preenchimento ou assinatura desta minuta não efetiva a transferência no PHANYX.",
    "",
    "Local e data: _________________________________________________",
    `Aluno de origem / responsável: ${nomeOrigem} / ${texto(entrada.origem.responsavelNome, 200)}`,
    "Assinatura: ___________________________________________________",
    `Aluno de destino / responsável: ${nomeDestino} / ${texto(entrada.destino.responsavelNome, 200)}`,
    "Assinatura: ___________________________________________________",
    `Representante da instituição: ${instituicao}`,
    "Assinatura: ___________________________________________________",
    "",
    "ATENÇÃO: MINUTA NÃO ASSINADA. NÃO CONFIRMA REATRIBUIÇÃO, NÃO CRIA CONTRATO E NÃO MOVE VALORES.",
  ];
  return {
    tipo: "MINUTA_NAO_ASSINADA" as const,
    versao: 1 as const,
    matriculaOrigemId: entrada.matriculaId,
    transferenciaId: entrada.transferenciaId,
    referenciaPlano: entrada.referenciaPlano,
    texto: linhas.join("\n"),
    assinaturasPendentes: ["Aluno de origem ou responsável legal", "Aluno de destino ou responsável legal", "Instituição"],
    financeiroExigeRevisao: lancamentos > 0 || titulos > 0,
    podeExecutarTransferencia: false as const,
    mensagem: "Minuta para conferência e assinatura externa. A transferência continua bloqueada.",
  };
}
