export const PERMISSOES_PHANYX = [
  // =====================================================
  // GERAL / DASHBOARD
  // =====================================================
  { chave: "dashboard.ver", nome: "Geral - Ver dashboard" },

  // =====================================================
  // ASSINATURA PHANYX
  // =====================================================
  { chave: "assinatura.ver", nome: "Assinatura PHANYX - Ver" },
  { chave: "assinatura.cancelar", nome: "Assinatura PHANYX - Cancelar" },

  // =====================================================
  // ACADÊMICO
  // =====================================================
  { chave: "alunos.ver", nome: "Acadêmico - Ver alunos" },
  { chave: "alunos.criar", nome: "Acadêmico - Cadastrar alunos" },
  { chave: "alunos.editar", nome: "Acadêmico - Editar alunos" },

  { chave: "matriculas.ver", nome: "Acadêmico - Ver matrículas" },
  { chave: "matriculas.criar", nome: "Acadêmico - Criar matrículas" },

  // =====================================================
  // APOIO DOCENTE
  // Página própria no Admin
  // =====================================================
  {
    chave: "academico.publicacoes.ver",
    nome: "Apoio Docente - Ver publicações pendentes",
  },
  {
    chave: "academico.publicacoes.gerenciar",
    nome: "Apoio Docente - Gerenciar publicações acadêmicas",
  },

  {
    chave: "academico.materiais.anexar",
    nome: "Apoio Docente - Anexar materiais",
  },
  {
    chave: "academico.materiais.publicar",
    nome: "Apoio Docente - Publicar materiais para alunos",
  },

  {
    chave: "academico.trabalhos.anexar",
    nome: "Apoio Docente - Anexar arquivos em trabalhos",
  },
  {
    chave: "academico.trabalhos.publicar",
    nome: "Apoio Docente - Publicar trabalhos para alunos",
  },

  {
    chave: "academico.turmas.selecionar",
    nome: "Apoio Docente - Selecionar turmas acadêmicas",
  },
  {
    chave: "academico.disciplinas.selecionar",
    nome: "Apoio Docente - Selecionar disciplinas",
  },
  {
    chave: "academico.professores.selecionar",
    nome: "Apoio Docente - Selecionar professor responsável",
  },
  {
    chave: "academico.alunos.selecionar",
    nome: "Apoio Docente - Selecionar alunos específicos",
  },

    // =====================================================
  // COMERCIAL
  // =====================================================

  {
    chave: "comercial.ver",
    nome: "Comercial - Acessar módulo",
    descricao:
      "Permite visualizar o módulo Comercial da instituição.",
  },

  {
    chave: "comercial.dashboard.ver",
    nome: "Comercial - Ver visão geral",
    descricao:
      "Permite consultar indicadores, resultados e o resumo comercial.",
  },

  // LEADS E OPORTUNIDADES
  {
    chave: "comercial.leads.ver",
    nome: "Comercial - Ver leads e oportunidades",
    descricao:
      "Permite consultar interessados, contatos e oportunidades comerciais.",
  },
  {
    chave: "comercial.leads.criar",
    nome: "Comercial - Cadastrar leads",
    descricao:
      "Permite cadastrar novos interessados e oportunidades.",
  },
  {
    chave: "comercial.leads.editar",
    nome: "Comercial - Editar leads",
    descricao:
      "Permite alterar dados, etapa, origem e informações dos leads.",
  },
  {
    chave: "comercial.leads.excluir",
    nome: "Comercial - Excluir leads",
    descricao:
      "Permite excluir leads conforme as regras de auditoria da instituição.",
  },
  {
    chave: "comercial.leads.atribuir",
    nome: "Comercial - Atribuir responsável ao lead",
    descricao:
      "Permite encaminhar um lead para um vendedor ou responsável comercial.",
  },
  {
    chave: "comercial.leads.converter",
    nome: "Comercial - Converter lead em venda ou matrícula",
    descricao:
      "Permite transformar uma oportunidade em venda ou matrícula.",
  },

  // VENDEDORES
  {
    chave: "comercial.vendedores.ver",
    nome: "Comercial - Ver vendedores",
    descricao:
      "Permite consultar os funcionários vinculados às atividades comerciais.",
  },
  {
  chave: "comercial.vendedores.gerenciar",
  nome: "Comercial - Gerenciar vendedores",
  descricao:
    "Permite definir funcionários responsáveis por vendas, matrículas e metas.",
},

// EQUIPES COMERCIAIS
{
  chave: "comercial.equipes.ver",
  nome: "Comercial - Ver equipes comerciais",
  descricao:
    "Permite consultar equipes comerciais, líderes e membros vinculados.",
},
{
  chave: "comercial.equipes.criar",
  nome: "Comercial - Criar equipes comerciais",
  descricao:
    "Permite cadastrar novas equipes comerciais e selecionar seus membros.",
},
{
  chave: "comercial.equipes.editar",
  nome: "Comercial - Editar equipes comerciais",
  descricao:
    "Permite alterar nome, descrição, liderança, membros e situação das equipes.",
},
{
  chave: "comercial.equipes.excluir",
  nome: "Comercial - Desativar equipes comerciais",
  descricao:
    "Permite desativar equipes comerciais, preservando seu histórico e suas metas.",
},

// METAS
  {
    chave: "comercial.metas.ver",
    nome: "Comercial - Ver metas",
    descricao:
      "Permite consultar metas por vendedor, equipe, curso, polo ou período.",
  },
  {
    chave: "comercial.metas.criar",
    nome: "Comercial - Criar metas",
    descricao:
      "Permite cadastrar novas metas comerciais.",
  },
  {
    chave: "comercial.metas.editar",
    nome: "Comercial - Editar metas",
    descricao:
      "Permite alterar valores, períodos, participantes e critérios das metas.",
  },
  {
    chave: "comercial.metas.excluir",
    nome: "Comercial - Excluir metas",
    descricao:
      "Permite excluir metas comerciais ainda não consolidadas.",
  },

  // VENDAS E MATRÍCULAS
  {
    chave: "comercial.vendas.ver",
    nome: "Comercial - Ver vendas",
    descricao:
      "Permite consultar vendas, matrículas comerciais e responsáveis.",
  },
  {
    chave: "comercial.vendas.criar",
    nome: "Comercial - Registrar vendas",
    descricao:
      "Permite registrar vendas e matrículas com vendedor responsável.",
  },
  {
    chave: "comercial.vendas.editar",
    nome: "Comercial - Editar vendas",
    descricao:
      "Permite corrigir dados comerciais antes da consolidação da venda.",
  },
  {
    chave: "comercial.vendas.cancelar",
    nome: "Comercial - Cancelar vendas",
    descricao:
      "Permite cancelar vendas mediante justificativa e auditoria.",
  },
  {
    chave: "comercial.vendas.aprovar",
    nome: "Comercial - Aprovar vendas",
    descricao:
      "Permite validar vendas antes do cálculo de comissão.",
  },
  {
    chave: "comercial.matriculas.vincular_vendedor",
    nome: "Comercial - Vincular vendedor à matrícula",
    descricao:
      "Permite selecionar o funcionário responsável por uma matrícula.",
  },

  // COMISSÕES
  {
    chave: "comercial.comissoes.ver",
    nome: "Comercial - Ver comissões",
    descricao:
      "Permite consultar comissões originadas por vendas e matrículas.",
  },
  {
    chave: "comercial.comissoes.calcular",
    nome: "Comercial - Calcular comissões",
    descricao:
      "Permite calcular comissões conforme o plano comercial vigente.",
  },
  {
    chave: "comercial.comissoes.aprovar",
    nome: "Comercial - Aprovar comissões",
    descricao:
      "Permite aprovar ou devolver comissões para revisão.",
  },
  {
    chave: "comercial.comissoes.enviar_rh",
    nome: "Comercial - Enviar comissões ao RH",
    descricao:
      "Permite encaminhar comissões aprovadas para a remuneração variável e o holerite.",
  },

  // RELATÓRIOS
  {
    chave: "comercial.relatorios.ver",
    nome: "Comercial - Ver relatórios",
    descricao:
      "Permite consultar conversão, desempenho, metas, vendas e comissões.",
  },
  {
    chave: "comercial.relatorios.exportar",
    nome: "Comercial - Exportar relatórios",
    descricao:
      "Permite exportar relatórios comerciais em PDF ou Excel.",
  },

  // CONFIGURAÇÕES
  {
    chave: "comercial.configuracoes.gerenciar",
    nome: "Comercial - Gerenciar configurações",
    descricao:
      "Permite configurar etapas, origens, regras, planos e parâmetros comerciais.",
  },

  // =====================================================
  // FINANCEIRO
  // =====================================================
  { chave: "financeiro.ver", nome: "Financeiro - Ver financeiro" },
  { chave: "financeiro.recebimentos", nome: "Financeiro - Recebimentos" },
  { chave: "financeiro.inadimplentes", nome: "Financeiro - Inadimplentes" },
  { chave: "financeiro.relatorios", nome: "Financeiro - Relatórios financeiros" },
  { chave: "financeiro.fechamento", nome: "Financeiro - Fechamento geral" },

  { chave: "caixa.ver", nome: "Financeiro - Ver caixa" },
  { chave: "caixa.abrir", nome: "Financeiro - Abrir caixa" },
  { chave: "caixa.fechar", nome: "Financeiro - Fechar caixa" },
  { chave: "caixa.receber", nome: "Financeiro - Receber no caixa" },

  // =====================================================
  // DOCUMENTOS / CERTIFICADOS
  // =====================================================
  { chave: "documentos.ver", nome: "Documentos - Ver documentos" },
  { chave: "documentos.gerar", nome: "Documentos - Gerar documentos" },

  { chave: "certificados.ver", nome: "Documentos - Ver certificados" },
  {
    chave: "certificados.emitir",
    nome: "Documentos - Gerar / emitir certificados",
  },
  {
    chave: "certificados.editar_template",
    nome: "Documentos - Editar modelo de certificado",
  },

  // =====================================================
  // PESSOAL / RH
  // =====================================================
  { chave: "funcionarios.ver", nome: "RH - Ver funcionários" },
  { chave: "funcionarios.criar", nome: "RH - Cadastrar funcionários" },
  { chave: "funcionarios.editar", nome: "RH - Editar funcionários" },
  {
    chave: "funcionarios.permissoes.gerenciar",
    nome: "RH - Gerenciar permissões individuais de funcionários",
  },

  { chave: "departamentos.ver", nome: "RH - Ver departamentos" },
  { chave: "departamentos.editar", nome: "RH - Editar departamentos" },
  {
    chave: "departamentos.permissoes",
    nome: "RH - Gerenciar permissões dos departamentos",
  },

  { chave: "rh.ver", nome: "RH - Ver RH" },

  { chave: "rh.funcionarios", nome: "RH - Funcionários" },

{ chave: "rh.professores", nome: "RH - Professores" },

{
  chave: "rh.professores.ver",
  nome: "RH - Ver professores",
  descricao:
    "Permite acessar a lista de professores pelo módulo de RH.",
},
{
  chave: "rh.professores.criar",
  nome: "RH - Cadastrar professores",
  descricao:
    "Permite cadastrar professores acadêmicos e professores com vínculo trabalhista.",
},
{
  chave: "rh.professores.editar",
  nome: "RH - Editar professores",
  descricao:
    "Permite alterar os dados cadastrais e acadêmicos dos professores.",
},
{
  chave: "rh.professores.vinculo.gerenciar",
  nome: "RH - Gerenciar vínculo trabalhista dos professores",
  descricao:
    "Permite incluir o professor no RH e alterar dados do vínculo contratual.",
},
{
  chave: "rh.professores.remuneracao.ver",
  nome: "RH - Ver remuneração dos professores",
  descricao:
    "Permite visualizar salário, valores por hora, aula, turma ou disciplina.",
},
{
  chave: "rh.professores.remuneracao.editar",
  nome: "RH - Editar remuneração dos professores",
  descricao:
    "Permite alterar salário e demais modalidades de remuneração dos professores.",
},

{ chave: "rh.departamentos", nome: "RH - Departamentos" },
{ chave: "rh.permissoes", nome: "RH - Permissões por setor" },

  { chave: "rh.admissoes", nome: "RH - Admissões" },
  { chave: "rh.desligamentos", nome: "RH - Desligamentos" },

  { chave: "rh.ocorrencias", nome: "RH - Ocorrências funcionais" },
  { chave: "rh.historico", nome: "RH - Histórico funcional" },

  { chave: "rh.arquivados", nome: "RH - Arquivados" },

  { chave: "rh.arquivar_ocorrencias", nome: "RH - Arquivar ocorrências" },
  { chave: "rh.arquivar_holerites", nome: "RH - Arquivar holerites" },
  { chave: "rh.arquivar_ferias", nome: "RH - Arquivar férias" },
  { chave: "rh.arquivar_exames", nome: "RH - Arquivar exames" },
  { chave: "rh.arquivar_rescisoes", nome: "RH - Arquivar rescisões" },
  { chave: "rh.arquivar_documentos", nome: "RH - Arquivar documentos RH" },

  {
    chave: "rh.restaurar_arquivados",
    nome: "RH - Restaurar registros arquivados",
  },

  { chave: "rh.documentos", nome: "RH - Documentos" },
  { chave: "rh.documentos_modelos", nome: "RH - Modelos de documentos" },
  { chave: "rh.documentos_gerar", nome: "RH - Gerar documentos" },

  { chave: "rh.ponto", nome: "RH - Controle de ponto" },
  { chave: "rh.ponto_editar", nome: "RH - Ajustar registros de ponto" },
  {
    chave: "rh.ponto_integracoes",
    nome: "RH - Integrações de relógio ponto",
  },

  { chave: "rh.holerites", nome: "RH - Holerites" },
  { chave: "rh.holerites_gerar", nome: "RH - Gerar holerites" },
  {
  chave: "rh.holerites_assinar",
  nome: "RH - Assinar digitalmente recibos de holerites",
  descricao:
    "Permite ao funcionário autorizado do RH assinar digitalmente o recibo de pagamento com seu usuário e ID.",
},
  { chave: "rh.holerites_excluir", nome: "RH - Excluir holerites" },

  { chave: "rh.ferias", nome: "RH - Férias" },
  { chave: "rh.ferias_aprovar", nome: "RH - Aprovar férias" },

  { chave: "rh.exames", nome: "RH - Exames ocupacionais" },

  { chave: "rh.rescisoes", nome: "RH - Rescisões" },

  { chave: "rh.cargos", nome: "RH - Cargos" },
  { chave: "rh.salarios", nome: "RH - Faixas salariais" },

  { chave: "rh.relatorios", nome: "RH - Relatórios" },
  { chave: "rh.indicadores", nome: "RH - Indicadores e métricas" },

  {
  chave: "rh.ponto.mobile.ver",
  nome: "Ponto Mobile - Visualizar",
  descricao:
    "Permite visualizar o módulo e as informações gerais do Ponto Mobile.",
},
{
  chave: "rh.ponto.mobile.configurar",
  nome: "Ponto Mobile - Configurar",
  descricao:
    "Permite ativar o Ponto Mobile e alterar foto, localização, reconhecimento facial e raio permitido.",
},
{
  chave: "rh.ponto.mobile.funcionarios.gerenciar",
  nome: "Ponto Mobile - Gerenciar funcionários",
  descricao:
    "Permite liberar ou bloquear funcionários para registrar ponto pelo celular.",
},
{
  chave: "rh.ponto.mobile.locais.gerenciar",
  nome: "Ponto Mobile - Gerenciar locais",
  descricao:
    "Permite cadastrar e alterar unidades, endereços, coordenadas e áreas autorizadas.",
},
{
  chave: "rh.ponto.mobile.marcacoes.ver",
  nome: "Ponto Mobile - Ver marcações",
  descricao:
    "Permite consultar fotos, horários, localização e comprovantes das marcações mobile.",
},
{
  chave: "rh.ponto.mobile.ocorrencias.gerenciar",
  nome: "Ponto Mobile - Gerenciar ocorrências",
  descricao:
    "Permite analisar registros fora da área, falhas de localização e divergências de reconhecimento.",
},

  // =====================================================
  // CONTROLE DE ACESSO / CRACHÁS / VISITANTES
  // =====================================================
  { chave: "crachas.ver", nome: "Crachás - Ver" },
  { chave: "crachas.criar", nome: "Crachás - Criar" },
  { chave: "crachas.editar", nome: "Crachás - Editar" },
  { chave: "crachas.excluir", nome: "Crachás - Excluir" },
  { chave: "crachas.emitir", nome: "Crachás - Emitir" },
  { chave: "crachas.imprimir", nome: "Crachás - Imprimir" },

  { chave: "crachas.modelos.ver", nome: "Crachás - Ver modelos" },
  { chave: "crachas.modelos.criar", nome: "Crachás - Criar modelos" },
  { chave: "crachas.modelos.editar", nome: "Crachás - Editar modelos" },
  { chave: "crachas.modelos.excluir", nome: "Crachás - Excluir modelos" },

  { chave: "visitantes.ver", nome: "Visitantes - Ver" },
  { chave: "visitantes.criar", nome: "Visitantes - Cadastrar" },
  { chave: "visitantes.editar", nome: "Visitantes - Editar" },
  { chave: "visitantes.excluir", nome: "Visitantes - Excluir" },
  {
    chave: "visitantes.registrar_entrada",
    nome: "Visitantes - Registrar entrada",
  },
  {
    chave: "visitantes.registrar_saida",
    nome: "Visitantes - Registrar saída",
  },
  { chave: "visitantes.bloquear", nome: "Visitantes - Bloquear" },
  { chave: "visitantes.arquivar", nome: "Visitantes - Arquivar" },

  // =====================================================
  // COMUNICAÇÃO
  // =====================================================
  { chave: "reunioes.ver", nome: "Comunicação - Ver reuniões" },
  { chave: "reunioes.criar", nome: "Comunicação - Criar reuniões" },
  { chave: "reunioes.gerenciar", nome: "Comunicação - Gerenciar reuniões" },

  { chave: "ouvidoria.ver", nome: "Comunicação - Ver ouvidoria" },
  { chave: "ouvidoria.responder", nome: "Comunicação - Responder ouvidoria" },

  { chave: "aniversariantes.ver", nome: "Aniversariantes - Ver" },
  {
    chave: "aniversariantes.enviar_mensagem",
    nome: "Aniversariantes - Enviar mensagem",
  },
  {
    chave: "aniversariantes.gerar_links_whatsapp",
    nome: "Aniversariantes - Gerar links WhatsApp",
  },
  {
    chave: "aniversariantes.exportar_pdf",
    nome: "Aniversariantes - Baixar PDF",
  },
  {
    chave: "aniversariantes.exportar_excel",
    nome: "Aniversariantes - Baixar Excel",
  },
] as const;