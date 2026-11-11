/**
 * Confirmação transacional de sucessão limitada a uma matrícula de origem SEM
 * financeiro, sem contrato/documento assinado, nem eventos administrativos.
 * A avaliação dos vínculos precisa ocorrer NOVAMENTE dentro da transação.
 */
export class ErroExecucaoReatribuicao extends Error {
  constructor(public codigo: string, public status = 409, mensagem?: string) {
    super(mensagem || codigo);
  }
}

export type ConfirmacaoReatribuicao = {
  transferenciaId: number;
  primeiroVencimento: string;
  referenciaTermoAssinado: string;
  reconheceAutorizacao: true;
  confirmacaoDigitada: "REATRIBUIR";
};

export const FRASE_CONFIRMACAO = "REATRIBUIR" as const;

function dataCivil(valor: unknown): valor is string {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T12:00:00.000Z`);
  return !Number.isNaN(data.valueOf()) && data.toISOString().slice(0, 10) === valor;
}

/**
 * Confere o endpoint do banco EFETIVAMENTE usado pelo Prisma em runtime.
 * Uma URL de homologação não pode ser inferida apenas de NODE_ENV/VERCEL_ENV:
 * uma execução local/preview poderia apontar para o banco de produção.
 * O operador precisa autorizar explicitamente o hostname de seu endpoint Neon.
 * Não registra, retorna ou envia credenciais da conexão.
 */
export function destinoHomologacaoAutorizado(entrada: {
  databaseUrl?: string;
  hostAutorizado?: string;
}) {
  const autorizado = entrada.hostAutorizado?.trim().toLowerCase();
  if (!autorizado || !/^[a-z0-9.-]+$/.test(autorizado) ||
      !autorizado.endsWith(".neon.tech")) return false;
  try {
    if (!entrada.databaseUrl) return false;
    const conexao = new URL(entrada.databaseUrl);
    if (conexao.protocol !== "postgres:" && conexao.protocol !== "postgresql:") return false;
    if (!conexao.username || !conexao.pathname.slice(1)) return false;
    return conexao.hostname.toLowerCase() === autorizado;
  } catch {
    return false;
  }
}

export function execucaoHabilitada(ambiente: {
  flag?: string;
  seloHomologacao?: string;
  vercelEnv?: string;
  nodeEnv?: string;
  databaseUrl?: string;
  hostAutorizado?: string;
}) {
  return destinoHomologacaoAutorizado(ambiente) && ambiente.flag === "true" && ambiente.seloHomologacao === "HOMOLOGACAO" &&
    ambiente.vercelEnv !== "production" &&
    (ambiente.vercelEnv === "preview" || ambiente.nodeEnv === "development");
}

export function validarConfirmacaoReatribuicao(entrada: unknown): ConfirmacaoReatribuicao {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
    throw new ErroExecucaoReatribuicao("CORPO_INVALIDO", 400, "Dados da confirmação inválidos.");
  }
  const body = entrada as Record<string, unknown>;
  if (typeof body.transferenciaId !== "number" || !Number.isSafeInteger(body.transferenciaId) || body.transferenciaId <= 0) {
    throw new ErroExecucaoReatribuicao("SOLICITACAO_INVALIDA", 400, "Informe uma solicitação válida.");
  }
  if (!dataCivil(body.primeiroVencimento)) {
    throw new ErroExecucaoReatribuicao("VENCIMENTO_INVALIDO", 400, "Informe a data válida do primeiro vencimento.");
  }
  const referencia = typeof body.referenciaTermoAssinado === "string" ? body.referenciaTermoAssinado.trim() : "";
  if (referencia.length < 5 || referencia.length > 180 || /[\u0000-\u001f\u007f]/.test(referencia)) {
    throw new ErroExecucaoReatribuicao("TERMO_NAO_IDENTIFICADO", 400,
      "Identifique o documento assinado que autoriza a sucessão (5 a 180 caracteres).");
  }
  if (body.reconheceAutorizacao !== true || body.confirmacaoDigitada !== FRASE_CONFIRMACAO) {
    throw new ErroExecucaoReatribuicao("AUTORIZACAO_NAO_CONFIRMADA", 400,
      "Confira as autorizações das partes e digite REATRIBUIR.");
  }
  return { transferenciaId: body.transferenciaId as number,
    primeiroVencimento: body.primeiroVencimento,
    referenciaTermoAssinado: referencia,
    reconheceAutorizacao: true,
    confirmacaoDigitada: FRASE_CONFIRMACAO };
}

export type RestricoesOrigem = {
  lancamentos: number;
  cobrancas: number;
  contratosAssinados: number;
  documentosAssinados: number;
  documentosAssinaveis: number;
  trancamentos: number;
  cancelamentos: number;
  rematriculas: number;
  periodosCursoLivre: number;
};

export function conferirRestricoesOrigem(entrada: RestricoesOrigem) {
  const campos = Object.entries(entrada);
  if (campos.some(([, n]) => !Number.isSafeInteger(n) || n < 0)) {
    throw new ErroExecucaoReatribuicao("CONTAGEM_INVALIDA", 409,
      "Os vínculos da matrícula não puderam ser conferidos.");
  }
  const financeiros = entrada.lancamentos + entrada.cobrancas;
  if (financeiros > 0) {
    throw new ErroExecucaoReatribuicao("FINANCEIRO_EXISTENTE", 409,
      "A origem possui lançamentos ou cobranças. Esta execução controlada não transfere dívidas, pagamentos ou títulos. Use a revisão financeira antes de prosseguir.");
  }
  if (entrada.contratosAssinados || entrada.documentosAssinados || entrada.documentosAssinaveis) {
    throw new ErroExecucaoReatribuicao("DOCUMENTO_ASSINADO", 409,
      "Há contrato ou documento assinado na origem. A sucessão exige revisão contratual específica.");
  }
  if (entrada.trancamentos || entrada.cancelamentos || entrada.rematriculas || entrada.periodosCursoLivre) {
    throw new ErroExecucaoReatribuicao("EVENTO_ADMINISTRATIVO", 409,
      "Há eventos de matrícula que exigem tratamento antes da sucessão.");
  }
  return true;
}

export function conferirPlanoExecutavel(entrada: {
  snapshot: unknown;
  matriculaId: number;
  alunoOrigemId: number;
  alunoDestinoId: number;
}) {
  const plano = entrada.snapshot;
  if (!plano || typeof plano !== "object" || Array.isArray(plano)) {
    throw new ErroExecucaoReatribuicao("PROPOSTA_NAO_ENCONTRADA", 409, "Salve uma proposta acadêmica antes de confirmar.");
  }
  const p = plano as Record<string, unknown>;
  if (p.finalidade !== "PLANO_ACADEMICO_SEM_EXECUCAO" ||
    p.matriculaOrigemId !== entrada.matriculaId ||
    p.alunoOrigemId !== entrada.alunoOrigemId ||
    p.alunoDestinoId !== entrada.alunoDestinoId ||
    !Array.isArray(p.turmaIds) || p.turmaIds.length === 0 ||
    typeof p.versaoOfertas !== "string" || !/^[0-9a-f]{64}$/i.test(p.versaoOfertas) ||
    !dataCivil(p.dataInicioCurso)) {
    throw new ErroExecucaoReatribuicao("PROPOSTA_INVALIDA", 409,
      "A proposta salva não corresponde à solicitação ou está incompleta.");
  }
  return p;
}

export function conferirDatasExecucao(entrada: {
  hoje: string;
  dataTransferencia: string;
  dataInicioCurso: string;
  primeiroVencimento: string;
}) {
  if (!Object.values(entrada).every(dataCivil)) throw new ErroExecucaoReatribuicao("DATA_INVALIDA", 400);
  if (entrada.dataTransferencia > entrada.hoje) {
    throw new ErroExecucaoReatribuicao("TRANSFERENCIA_FUTURA", 409,
      "A data prevista ainda não chegou. Não efetive a transferência antecipadamente.");
  }
  if (entrada.dataInicioCurso < entrada.dataTransferencia) {
    throw new ErroExecucaoReatribuicao("INICIO_ANTERIOR_TRANSFERENCIA", 409);
  }
  if (entrada.primeiroVencimento < entrada.hoje || entrada.primeiroVencimento < entrada.dataTransferencia) {
    throw new ErroExecucaoReatribuicao("VENCIMENTO_RETROATIVO", 409,
      "Escolha um primeiro vencimento não anterior à data atual nem à transferência.");
  }
  return true;
}

export function numeroHistorico(numero: string, matriculaId: number, transferenciaId: number) {
  if (!numero || numero.length > 180 || !Number.isSafeInteger(matriculaId) || matriculaId <= 0 ||
    !Number.isSafeInteger(transferenciaId) || transferenciaId <= 0) {
    throw new ErroExecucaoReatribuicao("NUMERO_INVALIDO", 409);
  }
  return `${numero}-HIST-${matriculaId}-${transferenciaId}`;
}
