/**
 * Parecer conservador, SOMENTE LEITURA, sobre riscos de reatribuir o aluno na MESMA matrícula.
 * Os contadores são sinais para revisão, não constituem autorização de execução.
 * Na eventual confirmação definitiva, todas as condições precisam ser reavaliadas
 * sob bloqueio transacional, inclusive ofertas, títulos externos e contrato.
 */
export type CodigoImpedimento =
  | "SOLICITACAO_INVALIDA" | "MATRICULA_ALTERADA" | "ALUNO_DESTINO_INVALIDO"
  | "PLANO_NAO_SALVO" | "PLANO_DESATUALIZADO" | "OFERTAS_NAO_REVALIDADAS"
  | "HISTORICO_ACADEMICO" | "FINANCEIRO_EXISTENTE" | "COBRANCAS_EXISTENTES"
  | "CONTRATOS_EXISTENTES" | "DOCUMENTOS_EXISTENTES" | "EVENTOS_MATRICULA"
  | "STATUS_MATRICULA_INVALIDO";

export type Impedimento = { codigo: CodigoImpedimento; grupo: "CADASTRAL" | "ACADEMICO" | "FINANCEIRO" | "DOCUMENTAL" | "INTEGRIDADE"; descricao: string; quantidade: number | null };

export type DadosParecer = {
  matricula: { alunoId: number; status: string; canceladaEm: Date | null; updatedAt: Date };
  transferencia: {
    tipo: string; status: string; alunoOrigemId: number | null;
    alunoDestinoId: number | null; snapshotAnterior: unknown;
  };
  destinoValido: boolean;
  planoSalvo: boolean;
  planoConsistente: boolean;
  ofertasRevalidadas: boolean;
  contagens: {
    presencas: number; notas: number; presencasOptativas: number;
    resultados: number; progresso: number; sessoesVideo: number;
    eventosAprendizagem: number; entregas: number;
    lancamentos: number; cobrancas: number;
    contratos: number; documentosGerados: number; documentosAluno: number;
    trancamentos: number; cancelamentos: number; rematriculas: number;
    periodosCursoLivre: number;
  };
};

export function montarParecerReatribuicao(dados: DadosParecer) {
  const impeditivos: Impedimento[] = [];
  const add = (codigo: CodigoImpedimento, grupo: Impedimento["grupo"], descricao: string, quantidade: number | null = null) => {
    impeditivos.push({ codigo, grupo, descricao, quantidade });
  };
  const { matricula, transferencia, contagens: c } = dados;
  if (transferencia.tipo !== "REATRIBUICAO_ALUNO" || transferencia.status !== "PENDENTE" ||
      transferencia.alunoOrigemId !== matricula.alunoId || !transferencia.alunoDestinoId ||
      transferencia.alunoDestinoId === matricula.alunoId) {
    add("SOLICITACAO_INVALIDA", "INTEGRIDADE", "A solicitação não está pendente ou os alunos de origem e destino não conferem.");
  }
  if (matricula.canceladaEm || !["ATIVA", "A_INICIAR", "AGUARDANDO"].includes(matricula.status)) {
    add("STATUS_MATRICULA_INVALIDO", "INTEGRIDADE", "A situação atual da matrícula não admite essa solicitação.");
  }
  const anterior = transferencia.snapshotAnterior;
  if (!anterior || typeof anterior !== "object" || Array.isArray(anterior) ||
      (anterior as Record<string, unknown>).finalidade !== "SOLICITACAO_SEM_EXECUCAO" ||
      (anterior as Record<string, unknown>).alunoId !== matricula.alunoId ||
      (anterior as Record<string, unknown>).atualizadoEm !== matricula.updatedAt.toISOString()) {
    add("MATRICULA_ALTERADA", "INTEGRIDADE", "A matrícula foi alterada desde a abertura da solicitação.");
  }
  if (!dados.destinoValido) add("ALUNO_DESTINO_INVALIDO", "CADASTRAL", "Aluno de destino não está ativo nesta instituição ou não possui cadastro válido.");
  if (!dados.planoSalvo) add("PLANO_NAO_SALVO", "ACADEMICO", "Não existe proposta acadêmica salva para o aluno de destino.");
  else {
    if (!dados.planoConsistente) add("PLANO_DESATUALIZADO", "ACADEMICO", "A proposta salva não corresponde à solicitação ou perdeu a validade.");
    if (!dados.ofertasRevalidadas) add("OFERTAS_NAO_REVALIDADAS", "ACADEMICO", "Vagas, horários, regras ou valores precisam de nova validação.");
  }
  const historico = c.presencas + c.notas + c.presencasOptativas + c.resultados + c.progresso + c.sessoesVideo + c.eventosAprendizagem + c.entregas;
  if (historico > 0) add("HISTORICO_ACADEMICO", "ACADEMICO", "Há histórico do aluno de origem que não pode ser atribuído ao aluno novo. Os indicadores podem incluir outras matrículas nas mesmas turmas.", historico);
  if (c.lancamentos > 0) add("FINANCEIRO_EXISTENTE", "FINANCEIRO", "Existem lançamentos. Preservar pagamentos, créditos e parcelas e revisar a obrigação contratual antes de reatribuir.", c.lancamentos);
  if (c.cobrancas > 0) add("COBRANCAS_EXISTENTES", "FINANCEIRO", "Existem títulos emitidos ou integrados. Não trocar o aluno ou pagador automaticamente.", c.cobrancas);
  if (c.contratos > 0) add("CONTRATOS_EXISTENTES", "DOCUMENTAL", "Existem contratos vinculados, inclusive possivelmente assinados. Exige novo instrumento jurídico.", c.contratos);
  const documentos = c.documentosGerados + c.documentosAluno;
  if (documentos > 0) add("DOCUMENTOS_EXISTENTES", "DOCUMENTAL", "Documentos do aluno de origem devem permanecer vinculados a ele.", documentos);
  const eventos = c.trancamentos + c.cancelamentos + c.rematriculas + c.periodosCursoLivre;
  if (eventos > 0) add("EVENTOS_MATRICULA", "INTEGRIDADE", "Existem eventos administrativos ou períodos associados que precisam manter sua titularidade histórica.", eventos);
  return {
    modo: "PARECER_SOMENTE_LEITURA" as const,
    podeExecutarTransferencia: false as const,
    impedimentos: impeditivos,
    quantidadeImpedimentos: impeditivos.length,
    semImpedimentosIdentificados: impeditivos.length === 0,
    observacao: "O parecer é informativo. Mesmo sem impedimentos identificados, a confirmação permanece desabilitada até ser implementada e testada a transação integral e a documentação contratual.",
    contagens: { ...c, historicoAcademico: historico },
  };
}
