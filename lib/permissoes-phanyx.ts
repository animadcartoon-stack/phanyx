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
  // ATIVIDADES EXTERNAS
  // Passeios, excursões, retiros, acampamentos e viagens
  // =====================================================
  {
    chave: "atividades-externas.ver",
    nome: "Acadêmico - Ver atividades externas",
    descricao:
      "Permite consultar passeios, excursões, viagens pedagógicas, retiros, acampamentos e demais atividades externas da instituição.",
  },
  {
    chave: "atividades-externas.gerenciar",
    nome: "Acadêmico - Gerenciar atividades externas",
    descricao:
      "Permite criar e administrar atividades externas, participantes, turmas, responsáveis, datas, destinos e planejamento geral.",
  },

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
  // BIBLIOTECA VIRTUAL
  // =====================================================

  {
    chave: "biblioteca.ver",
    nome: "Biblioteca Virtual - Acessar módulo",
    descricao:
      "Permite acessar o módulo da Biblioteca Virtual da instituição.",
  },
  {
    chave: "biblioteca.dashboard.ver",
    nome: "Biblioteca Virtual - Ver painel",
    descricao:
      "Permite consultar indicadores, atividades recentes e resumo da biblioteca.",
  },

  // CONTRATAÇÃO E COBRANÇA
  {
    chave: "biblioteca.contratacao.ver",
    nome: "Biblioteca Virtual - Ver contratação e plano",
    descricao:
      "Permite consultar o plano, armazenamento, mensalidade e situação da contratação da Biblioteca Virtual.",
  },
  {
    chave: "biblioteca.contratacao.gerenciar",
    nome: "Biblioteca Virtual - Contratar ou alterar plano",
    descricao:
      "Permite iniciar a contratação, realizar upgrade e adquirir armazenamento adicional para a Biblioteca Virtual.",
  },
  {
    chave: "biblioteca.contratacao.cancelar",
    nome: "Biblioteca Virtual - Cancelar contratação",
    descricao:
      "Permite cancelar a assinatura comercial da Biblioteca Virtual.",
  },

  // CATÁLOGO
  {
    chave: "biblioteca.catalogo.ver",
    nome: "Biblioteca Virtual - Ver catálogo",
  },
  {
    chave: "biblioteca.catalogo.criar",
    nome: "Biblioteca Virtual - Cadastrar itens",
  },
  {
    chave: "biblioteca.catalogo.editar",
    nome: "Biblioteca Virtual - Editar itens",
  },
  {
    chave: "biblioteca.catalogo.publicar",
    nome: "Biblioteca Virtual - Publicar itens",
  },
  {
    chave: "biblioteca.catalogo.arquivar",
    nome: "Biblioteca Virtual - Arquivar e restaurar itens",
  },
    // EXEMPLARES
  {
    chave: "biblioteca.exemplares.ver",
    nome: "Biblioteca Virtual - Ver exemplares",
    descricao:
      "Permite consultar exemplares físicos e digitais cadastrados no acervo.",
  },
  {
    chave: "biblioteca.exemplares.gerenciar",
    nome: "Biblioteca Virtual - Gerenciar exemplares",
    descricao:
      "Permite cadastrar e editar exemplares, localização, patrimônio e dados de aquisição.",
  },
  {
    chave: "biblioteca.exemplares.baixar",
    nome: "Biblioteca Virtual - Baixar exemplares",
    descricao:
      "Permite realizar a baixa de exemplares do acervo com motivo e auditoria.",
  },
  {
  chave: "biblioteca.exemplares.manutencao",
  nome: "Biblioteca Virtual - Gerenciar manutenção de exemplares",
  descricao:
    "Permite enviar exemplares para manutenção, registrar a conclusão, declarar exemplares irrecuperáveis e cancelar manutenções.",
},

  // ARQUIVOS E ARMAZENAMENTO
  {
    chave: "biblioteca.arquivos.upload",
    nome: "Biblioteca Virtual - Enviar arquivos",
  },
  {
    chave: "biblioteca.arquivos.gerenciar",
    nome: "Biblioteca Virtual - Gerenciar arquivos",
    descricao:
      "Permite definir arquivo principal, organizar versões e gerenciar propriedades administrativas dos arquivos da biblioteca.",
  },
  {
    chave: "biblioteca.arquivos.download",
    nome: "Biblioteca Virtual - Baixar arquivos administrativos",
  },
  {
    chave: "biblioteca.arquivos.excluir",
    nome: "Biblioteca Virtual - Arquivar ou remover arquivos",
  },
  {
    chave: "biblioteca.armazenamento.ver",
    nome: "Biblioteca Virtual - Ver armazenamento",
  },
  {
    chave: "biblioteca.armazenamento.gerenciar",
    nome: "Biblioteca Virtual - Gerenciar armazenamento",
  },

  // CIRCULAÇÃO
  {
    chave: "biblioteca.circulacao.ver",
    nome: "Biblioteca Virtual - Ver circulação",
  },
  {
    chave: "biblioteca.emprestimos.gerenciar",
    nome: "Biblioteca Virtual - Gerenciar empréstimos e devoluções",
  },
  {
    chave: "biblioteca.renovacoes.gerenciar",
    nome: "Biblioteca Virtual - Gerenciar renovações",
  },
  {
    chave: "biblioteca.reservas.gerenciar",
    nome: "Biblioteca Virtual - Gerenciar reservas",
  },

  // PRATELEIRAS E CONTEÚDO
  {
    chave: "biblioteca.prateleiras.gerenciar",
    nome: "Biblioteca Virtual - Gerenciar prateleiras",
  },
  {
    chave: "biblioteca.avaliacoes.moderar",
    nome: "Biblioteca Virtual - Moderar avaliações",
  },
  {
    chave: "biblioteca.recomendacoes.ver",
    nome: "Biblioteca Virtual - Ver recomendações acadêmicas",
  },
  {
    chave: "biblioteca.recomendacoes.gerenciar",
    nome: "Biblioteca Virtual - Gerenciar recomendações acadêmicas",
  },

  // LICENÇAS
  {
    chave: "biblioteca.licencas.ver",
    nome: "Biblioteca Virtual - Ver licenças e direitos",
  },
  {
    chave: "biblioteca.licencas.gerenciar",
    nome: "Biblioteca Virtual - Gerenciar licenças e direitos",
  },

  // ADMINISTRAÇÃO
  {
    chave: "biblioteca.operadores.ver",
    nome: "Biblioteca Virtual - Ver operadores",
  },
  {
    chave: "biblioteca.operadores.gerenciar",
    nome: "Biblioteca Virtual - Gerenciar operadores",
  },
  {
    chave: "biblioteca.configuracoes.gerenciar",
    nome: "Biblioteca Virtual - Gerenciar configurações",
  },
  {
    chave: "biblioteca.relatorios.ver",
    nome: "Biblioteca Virtual - Ver relatórios",
  },
  {
    chave: "biblioteca.relatorios.exportar",
    nome: "Biblioteca Virtual - Exportar relatórios",
  },
  {
    chave: "biblioteca.auditoria.ver",
    nome: "Biblioteca Virtual - Ver auditoria",
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

  // =====================================================
  // CENTRAL DE CAPTAÇÃO
  // =====================================================

  {
    chave: "comercial.captacao.ver",
    nome: "Comercial - Acessar Central de Captação",
    descricao:
      "Permite acessar a Central de Captação de Leads e consultar sua visão geral.",
  },

  // CANAIS DE CAPTAÇÃO
  {
    chave: "comercial.captacao.canais.ver",
    nome: "Comercial - Ver canais de captação",
    descricao:
      "Permite consultar os canais utilizados para entrada de leads na instituição.",
  },
  {
    chave: "comercial.captacao.canais.gerenciar",
    nome: "Comercial - Gerenciar canais de captação",
    descricao:
      "Permite criar, editar, ativar e desativar canais de captação de leads.",
  },

  // CAMPANHAS
  {
    chave: "comercial.captacao.campanhas.ver",
    nome: "Comercial - Ver campanhas de captação",
    descricao:
      "Permite consultar campanhas, origens, parâmetros UTM e indicadores de captação.",
  },
  {
    chave: "comercial.captacao.campanhas.gerenciar",
    nome: "Comercial - Gerenciar campanhas de captação",
    descricao:
      "Permite criar, editar, ativar, pausar e configurar campanhas de captação.",
  },

  // FORMULÁRIOS
  {
    chave: "comercial.captacao.formularios.ver",
    nome: "Comercial - Ver formulários de captação",
    descricao:
      "Permite consultar formulários públicos utilizados para captação de interessados.",
  },
  {
    chave: "comercial.captacao.formularios.gerenciar",
    nome: "Comercial - Gerenciar formulários de captação",
    descricao:
      "Permite criar, editar, publicar, pausar e configurar formulários e seus campos personalizados.",
  },

  // SUBMISSÕES
  {
    chave: "comercial.captacao.submissoes.ver",
    nome: "Comercial - Ver submissões de captação",
    descricao:
      "Permite consultar formulários recebidos, dados normalizados, origem, consentimento e situação do processamento.",
  },
  {
    chave: "comercial.captacao.submissoes.reprocessar",
    nome: "Comercial - Reprocessar submissões de captação",
    descricao:
      "Permite solicitar novo processamento de submissões que apresentaram falha ou ficaram pendentes.",
  },

  // DISTRIBUIÇÃO AUTOMÁTICA
  {
    chave: "comercial.captacao.distribuicao.ver",
    nome: "Comercial - Ver regras de distribuição de leads",
    descricao:
      "Permite consultar as regras responsáveis pela distribuição automática dos leads captados.",
  },
  {
    chave: "comercial.captacao.distribuicao.gerenciar",
    nome: "Comercial - Gerenciar distribuição de leads",
    descricao:
      "Permite criar, editar, priorizar, ativar e desativar regras de distribuição automática de leads.",
  },

  // INTEGRAÇÕES E WEBHOOKS
  {
    chave: "comercial.captacao.integracoes.ver",
    nome: "Comercial - Ver integrações de captação",
    descricao:
      "Permite consultar integrações, webhooks, eventos, tentativas de processamento e erros da Central de Captação.",
  },
  {
    chave: "comercial.captacao.integracoes.gerenciar",
    nome: "Comercial - Gerenciar integrações de captação",
    descricao:
      "Permite configurar, ativar, desativar e alterar integrações e webhooks utilizados na captação de leads.",
  },

  // AUDITORIA
  {
    chave: "comercial.captacao.auditoria.ver",
    nome: "Comercial - Ver auditoria da captação",
    descricao:
      "Permite consultar eventos, falhas, tentativas de processamento e registros de auditoria relacionados à captação de leads.",
  },

  // FUNIS COMERCIAIS
  {
    chave: "comercial.funis.ver",
    nome: "Comercial - Ver funis comerciais",
    descricao:
      "Permite consultar funis, etapas, probabilidades, prazos e motivos de perda.",
  },
  {
    chave: "comercial.funis.gerenciar",
    nome: "Comercial - Gerenciar funis comerciais",
    descricao:
      "Permite criar, editar, ordenar, arquivar e restaurar funis, etapas e motivos de perda.",
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
    chave: "comercial.leads.interagir",
    nome: "Comercial - Registrar interações com leads",
    descricao:
      "Permite registrar ligações, mensagens de WhatsApp, e-mails, reuniões e observações no histórico comercial dos leads.",
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
  {
    chave: "comercial.leads.ver_todos",
    nome: "Comercial - Ver todos os leads",
    descricao:
      "Permite visualizar leads de todos os vendedores e equipes da instituição.",
  },
  {
    chave: "comercial.leads.movimentar",
    nome: "Comercial - Movimentar leads no funil",
    descricao:
      "Permite movimentar oportunidades entre as etapas do funil comercial.",
  },
  {
    chave: "comercial.leads.registrar_perda",
    nome: "Comercial - Registrar perda de oportunidade",
    descricao:
      "Permite encerrar uma oportunidade como perdida, informando motivo e observação.",
  },
  {
    chave: "comercial.leads.transferir",
    nome: "Comercial - Transferir leads",
    descricao:
      "Permite transferir leads entre vendedores e equipes, preservando o histórico.",
  },
  {
    chave: "comercial.leads.arquivar",
    nome: "Comercial - Arquivar leads",
    descricao:
      "Permite arquivar leads sem apagar seus dados, contatos, tarefas e histórico.",
  },
  {
    chave: "comercial.leads.restaurar",
    nome: "Comercial - Restaurar leads",
    descricao:
      "Permite restaurar leads anteriormente arquivados.",
  },
  {
    chave: "comercial.leads.historico.ver",
    nome: "Comercial - Ver histórico dos leads",
    descricao:
      "Permite consultar movimentações, transferências, contatos e demais registros de auditoria.",
  },

  // TAREFAS E PRÓXIMAS AÇÕES
  {
    chave: "comercial.tarefas.ver",
    nome: "Comercial - Ver tarefas comerciais",
    descricao:
      "Permite consultar tarefas, retornos, ligações, reuniões e próximas ações atribuídas ao usuário.",
  },
  {
    chave: "comercial.tarefas.ver_todas",
    nome: "Comercial - Ver todas as tarefas comerciais",
    descricao:
      "Permite consultar tarefas comerciais de todos os vendedores e equipes.",
  },
  {
    chave: "comercial.tarefas.criar",
    nome: "Comercial - Criar tarefas comerciais",
    descricao:
      "Permite agendar ligações, retornos, reuniões e outras ações relacionadas aos leads.",
  },
  {
    chave: "comercial.tarefas.editar",
    nome: "Comercial - Editar tarefas comerciais",
    descricao:
      "Permite alterar informações, datas, responsáveis e prioridades das tarefas.",
  },
  {
    chave: "comercial.tarefas.atribuir",
    nome: "Comercial - Atribuir tarefas",
    descricao:
      "Permite atribuir ou transferir tarefas para outros funcionários comerciais.",
  },
  {
    chave: "comercial.tarefas.concluir",
    nome: "Comercial - Concluir tarefas comerciais",
    descricao:
      "Permite registrar a conclusão e o resultado de uma tarefa comercial.",
  },
  {
    chave: "comercial.tarefas.cancelar",
    nome: "Comercial - Cancelar tarefas comerciais",
    descricao:
      "Permite cancelar tarefas mediante registro do motivo e auditoria.",
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
  // INTEGRAÇÕES
  // =====================================================
  {
    chave: "integracoes.email.gerenciar",
    nome: "Integrações - Gerenciar e-mail institucional",
    descricao:
      "Permite configurar, testar, ativar e alterar as credenciais SMTP utilizadas pela instituição para envio de e-mails pelo PHANYX.",
  },
  {
    chave: "integracoes.whatsapp.gerenciar",
    nome: "Integrações - Gerenciar WhatsApp institucional",
    descricao:
      "Permite conectar, testar, ativar, desativar e configurar o WhatsApp Business utilizado pela instituição para comunicações automáticas pelo PHANYX.",
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