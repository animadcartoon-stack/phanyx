import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    "AdminCommercialOverview": {
      "header": {
        "kicker": "Gestão institucional",
        "title": "Comercial",
        "description": "Gerencie leads, vendedores, metas, vendas, matrículas, comissões e resultados comerciais da instituição."
      },
      "errors": {
        "loadSummary": "Não foi possível carregar o resumo comercial."
      },
      "metrics": {
        "activeLeads": {
          "title": "Leads ativos",
          "description": "Leads em andamento no funil comercial."
        },
        "periodSales": {
          "title": "Vendas no período",
          "description": "Matrículas confirmadas no mês atual."
        },
        "goals": {
          "title": "Metas atingidas",
          "progress": "{achieved} de {total} meta(s) do período.",
          "none": "Nenhuma meta ativa no período."
        },
        "pendingCommissions": {
          "title": "Comissões pendentes",
          "pending": "{count, plural, one {# lançamento aguardando análise.} other {# lançamentos aguardando análise.}}",
          "none": "Nenhuma comissão pendente no período."
        }
      },
      "resources": {
        "title": "Recursos do setor Comercial",
        "description": "Os recursos são liberados gradualmente e respeitam as permissões departamentais e individuais já cadastradas."
      },
      "statuses": {
        "available": "Disponível",
        "integrated": "Integração ativa"
      },
      "modules": {
        "leads": {
          "title": "Leads e oportunidades",
          "description": "Cadastre interessados, acompanhe contatos, etapas do funil e responsáveis.",
          "action": "Abrir leads e oportunidades"
        },
        "salespeople": {
          "title": "Vendedores",
          "description": "Gerencie os funcionários autorizados a atuar em vendas e matrículas.",
          "action": "Abrir funcionários"
        },
        "teams": {
          "title": "Equipes comerciais",
          "description": "Organize vendedores em equipes, defina lideranças e gerencie seus membros.",
          "action": "Abrir equipes comerciais"
        },
        "goals": {
          "title": "Metas comerciais",
          "description": "Defina metas por vendedor, equipe, curso, polo e período.",
          "action": "Abrir metas comerciais"
        },
        "salesEnrollments": {
          "title": "Vendas e matrículas",
          "description": "Acompanhe matrículas, valores negociados e vendedores responsáveis.",
          "action": "Abrir matrículas"
        },
        "commissions": {
          "title": "Comissões",
          "description": "Configure planos e regras para calcular e aprovar as comissões dos vendedores.",
          "action": "Abrir planos de comissão"
        },
        "reports": {
          "title": "Relatórios",
          "description": "Analise conversão, desempenho, leads, matrículas, vendas e resultados comerciais.",
          "action": "Abrir relatórios comerciais"
        }
      },
      "hrIntegration": {
        "title": "Integração com o RH",
        "description": "As comissões originadas por vendas e matrículas são calculadas e aprovadas no Comercial. Depois, podem ser enviadas ao RH e incluídas no holerite da competência correspondente. Bônus, prêmios e participações continuam sendo tratados em Remuneração Variável."
      }
    },
    "AdminCommercialTeams": {
      "header": {
        "kicker": "Comercial",
        "title": "Equipes comerciais",
        "description": "Organize vendedores em equipes, defina lideranças e prepare a estrutura para metas coletivas e individuais."
      },
      "common": {
        "employee": "Funcionário",
        "noDepartment": "Sem departamento",
        "noDescription": "Sem descrição cadastrada.",
        "noRole": "Cargo não informado"
      },
      "metrics": {
        "total": "Total de equipes",
        "active": "Equipes ativas",
        "inactive": "Equipes inativas",
        "activeMembers": "Membros ativos",
        "linkedGoals": "Metas vinculadas"
      },
      "filters": {
        "searchPlaceholder": "Buscar por equipe, líder ou membro",
        "active": "Equipes ativas",
        "inactive": "Equipes inativas",
        "all": "Todas as equipes"
      },
      "states": {
        "loading": "Carregando equipes comerciais...",
        "emptyTitle": "Nenhuma equipe encontrada",
        "emptyDescription": "Cadastre uma equipe ou ajuste os filtros da listagem.",
        "loadingEmployees": "Carregando funcionários...",
        "noEmployees": "Nenhum funcionário encontrado."
      },
      "status": {
        "active": "Ativa",
        "inactive": "Inativa"
      },
      "card": {
        "teamLeader": "Líder da equipe",
        "noLeader": "Liderança não definida",
        "members": "Membros",
        "noMembers": "Nenhum membro ativo."
      },
      "actions": {
        "newTeam": "+ Nova equipe",
        "edit": "Editar equipe",
        "deactivate": "Desativar",
        "reactivate": "Reativar",
        "close": "Fechar",
        "cancel": "Cancelar",
        "saving": "Salvando...",
        "saveChanges": "Salvar alterações",
        "createTeam": "Criar equipe",
        "keepTeam": "Manter equipe",
        "deactivating": "Desativando...",
        "deactivateTeam": "Desativar equipe"
      },
      "modal": {
        "newTitle": "Nova equipe comercial",
        "editTitle": "Editar equipe comercial",
        "teamName": "Nome da equipe",
        "teamNamePlaceholder": "Ex.: Equipe Comercial Centro",
        "description": "Descrição",
        "descriptionPlaceholder": "Descreva a atuação desta equipe.",
        "teamLeader": "Líder da equipe",
        "noLeader": "Sem liderança definida",
        "leaderHelp": "O líder será incluído automaticamente como membro da equipe.",
        "members": "Membros da equipe",
        "membersDescription": "Selecione os funcionários que participarão da equipe.",
        "selectedCount": "{count, plural, one {# selecionado} other {# selecionados}}",
        "searchEmployees": "Buscar funcionário, cargo ou departamento",
        "leaderBadge": "Líder",
        "activeTeam": "Equipe ativa",
        "activeTeamHelp": "Equipes inativas não devem receber novas metas."
      },
      "validation": {
        "teamName": "Informe o nome da equipe comercial."
      },
      "errors": {
        "loadTeams": "Não foi possível carregar as equipes comerciais.",
        "loadEmployees": "Não foi possível carregar os funcionários comerciais.",
        "saveTeam": "Não foi possível salvar a equipe comercial.",
        "deactivate": "Não foi possível desativar a equipe.",
        "reactivate": "Não foi possível reativar a equipe."
      },
      "success": {
        "created": "Equipe criada com sucesso.",
        "updated": "Equipe atualizada com sucesso.",
        "deactivated": "Equipe desativada com sucesso.",
        "reactivated": "Equipe reativada com sucesso."
      },
      "deactivateModal": {
        "title": "Desativar equipe comercial",
        "description": "A equipe <team></team> será desativada. O histórico e as metas já vinculadas serão preservados."
      }
    },
    "AdminCommercialFunnels": {
      "breadcrumb": {
        "commercial": "Comercial",
        "salesFunnels": "Funis comerciais"
      },
      "header": {
        "title": "Configuração do funil comercial",
        "description": "Organize as etapas do atendimento, os prazos, as probabilidades de conversão e os motivos de perda das oportunidades."
      },
      "actions": {
        "refresh": "Atualizar",
        "refreshing": "Atualizando...",
        "processing": "Processando...",
        "createStructure": "Criar estrutura comercial",
        "linkPendingLeads": "Vincular leads pendentes",
        "checkStructure": "Verificar estrutura",
        "initializeNow": "Inicializar agora",
        "initializing": "Inicializando...",
        "tryAgain": "Tentar novamente",
        "closeMessage": "Fechar mensagem"
      },
      "errors": {
        "load": "Não foi possível carregar os funis.",
        "initialize": "Não foi possível inicializar o funil.",
        "operationTitle": "Não foi possível concluir a operação"
      },
      "success": {
        "initialized": "Estrutura comercial inicializada."
      },
      "states": {
        "loading": "Carregando configuração comercial..."
      },
      "common": {
        "dateUnavailable": "Data indisponível",
        "noMaximumDeadline": "Sem prazo máximo",
        "hours": "{count}h",
        "days": "{count, plural, one {# dia} other {# dias}}",
        "active": "Ativo",
        "archived": "Arquivado",
        "required": "Obrigatória",
        "optional": "Opcional",
        "manual": "Manual",
        "automatic": "Automático"
      },
      "summary": {
        "status": {
          "title": "Situação",
          "configured": "Configurado",
          "pending": "Pendente",
          "available": "Funil padrão disponível",
          "initializationRequired": "Inicialização necessária"
        },
        "funnels": {
          "title": "Funis",
          "description": "Cadastrados na instituição"
        },
        "stages": {
          "title": "Etapas",
          "description": "No funil comercial padrão"
        },
        "lossReasons": {
          "title": "Motivos de perda",
          "description": "Motivos disponíveis"
        },
        "pendingLeads": {
          "title": "Leads pendentes",
          "description": "De {count} leads cadastrados"
        }
      },
      "initialization": {
        "title": "O CRM ainda precisa ser inicializado",
        "description": "A inicialização criará o funil padrão, suas etapas, os motivos de perda e vinculará os leads antigos. Nenhum lead será apagado.",
        "noPermission": "Você não possui permissão para inicializar esta estrutura."
      },
      "funnel": {
        "default": "Funil padrão",
        "updatedAt": "Atualizado em {date}"
      },
      "stages": {
        "title": "Etapas do processo comercial",
        "count": "{count, plural, one {# etapa configurada} other {# etapas configuradas}}",
        "empty": "Nenhuma etapa cadastrada neste funil."
      },
      "stageMetrics": {
        "conversion": "Conversão",
        "deadline": "Prazo",
        "nextAction": "Próxima ação",
        "movement": "Movimento"
      },
      "emptyFunnels": {
        "title": "Nenhum funil comercial cadastrado",
        "description": "Inicialize a estrutura para criar o funil padrão da instituição."
      },
      "lossReasons": {
        "title": "Motivos de perda",
        "description": "Motivos utilizados para compreender por que as oportunidades não foram convertidas.",
        "requiresObservation": "⚠ Exige observação complementar",
        "empty": "Nenhum motivo de perda cadastrado."
      },
      "stageCategories": {
        "entry": "Entrada",
        "firstContact": "Primeiro contato",
        "inService": "Em atendimento",
        "qualification": "Qualificação",
        "presentation": "Apresentação",
        "proposal": "Proposta",
        "negotiation": "Negociação",
        "documentation": "Documentação",
        "payment": "Pagamento",
        "conversion": "Conversão",
        "loss": "Perda",
        "pause": "Pausa",
        "discard": "Descarte"
      },
      "stageResults": {
        "open": "Em aberto",
        "won": "Ganha",
        "lost": "Perdida",
        "discarded": "Descartada"
      },
      "lossCategories": {
        "noInterest": "Sem interesse",
        "price": "Preço",
        "competition": "Concorrência",
        "noContact": "Sem contato",
        "courseUnavailable": "Curso indisponível",
        "scheduleConflict": "Horário incompatível",
        "location": "Localização",
        "documentation": "Documentação",
        "financial": "Financeiro",
        "withdrawal": "Desistência",
        "duplicate": "Duplicidade",
        "outOfProfile": "Fora do perfil",
        "other": "Outro"
      }
    },
    "AdminCommercialLead360": {
      "breadcrumb": {
        "commercial": "Comercial",
        "leads": "Leads",
        "lead360": "Ficha 360°"
      },
      "header": {
        "leadNumber": "Lead #{id}",
        "description": "Histórico comercial completo, dados de atendimento e situação da oportunidade em um só lugar."
      },
      "actions": {
        "pipeline": "← Pipeline",
        "leadList": "Lista de leads",
        "refresh": "Atualizar",
        "refreshing": "Atualizando...",
        "registerInteraction": "+ Registrar interação",
        "registerInteractionPlain": "Registrar interação",
        "registering": "Registrando...",
        "tryAgain": "Tentar novamente",
        "backToPipeline": "Voltar ao Pipeline",
        "cancel": "Cancelar",
        "close": "Fechar"
      },
      "errors": {
        "invalidLeadId": "O identificador do lead é inválido.",
        "loadLead": "Não foi possível carregar a ficha do lead."
      },
      "loading": {
        "title": "Montando a Ficha 360°...",
        "description": "Reunindo contatos, funil, tarefas e matrícula."
      },
      "empty": {
        "title": "Não foi possível abrir a Ficha 360°",
        "notFound": "O lead não foi encontrado."
      },
      "common": {
        "notProvided": "Não informado",
        "notDefined": "Não definido",
        "unassigned": "Não atribuído",
        "noResponsible": "Sem responsável",
        "noTeam": "Sem equipe",
        "noStage": "Sem etapa definida",
        "noFunnel": "Funil não definido",
        "noSalesTeam": "Sem equipe comercial"
      },
      "enum": {
        "low": "Baixa",
        "medium": "Média",
        "high": "Alta",
        "urgent": "Urgente",
        "new": "Novo",
        "inService": "Em atendimento",
        "qualified": "Qualificado",
        "converted": "Convertido",
        "lost": "Perdido",
        "archived": "Arquivado",
        "active": "Ativo",
        "inactive": "Inativo",
        "pending": "Pendente",
        "completed": "Concluído",
        "cancelled": "Cancelado"
      },
      "summary": {
        "currentStage": "Etapa atual",
        "responsible": "Responsável",
        "estimatedValue": "Valor estimado",
        "nextAction": "Próxima ação",
        "pendingTasks": "{count, plural, one {# tarefa pendente} other {# tarefas pendentes}}"
      },
      "quickContact": {
        "kicker": "Contato rápido",
        "title": "Fale com o interessado",
        "call": "Ligar",
        "email": "E-mail",
        "addNote": "Adicionar observação"
      },
      "timeline": {
        "eventCount": "{count, plural, one {# evento registrado} other {# eventos registrados}}",
        "title": "Linha do tempo comercial",
        "description": "Contatos, movimentações, tarefas e decisões em ordem cronológica.",
        "filterAria": "Filtrar eventos",
        "scheduledFor": "Agendada para {date}",
        "registeredBy": "Registrado por {name}",
        "systemRecord": "Registro automático do sistema",
        "emptyTitle": "Nenhum evento deste tipo nesta página",
        "emptyDescription": "Selecione outro filtro ou navegue pelas páginas.",
        "filters": {
          "all": "Tudo",
          "contacts": "Contatos",
          "funnel": "Funil",
          "tasks": "Tarefas",
          "transfers": "Transferências",
          "conversion": "Conversão"
        },
        "eventTypes": {
          "creation": "Criação",
          "contact": "Contato",
          "funnel": "Funil",
          "transfer": "Transferência",
          "task": "Tarefa",
          "loss": "Perda",
          "archiving": "Arquivamento",
          "restoration": "Restauração",
          "conversion": "Conversão"
        }
      },
      "pagination": {
        "page": "Página {current} de {total}",
        "previous": "Anterior",
        "next": "Próxima"
      },
      "commercialSummary": {
        "kicker": "Situação atual",
        "title": "Resumo comercial",
        "status": "Status",
        "stage": "Etapa",
        "funnel": "Funil",
        "responsible": "Responsável",
        "team": "Equipe"
      },
      "interest": {
        "kicker": "Interesse",
        "title": "Curso e unidade",
        "course": "Curso",
        "campus": "Polo",
        "organization": "Empresa / instituição",
        "source": "Origem",
        "initialNotes": "Observações iniciais"
      },
      "milestones": {
        "kicker": "Evolução",
        "title": "Marcos do relacionamento",
        "created": "Lead criado",
        "firstContact": "Primeiro contato",
        "qualified": "Qualificado",
        "converted": "Convertido",
        "notRecorded": "Ainda não registrado"
      },
      "enrollment": {
        "kicker": "Conversão concluída",
        "title": "Matrícula vinculada",
        "convertedAt": "Convertido em",
        "open": "Abrir matrícula"
      },
      "loss": {
        "kicker": "Oportunidade perdida",
        "noAdditionalNote": "Nenhuma observação complementar registrada."
      },
      "interaction": {
        "validationDescription": "Descreva o contato ou a observação realizada.",
        "errorRegister": "Não foi possível registrar a interação.",
        "successRegistered": "Interação registrada na linha do tempo."
      },
      "interactionTypes": {
        "whatsapp": "WhatsApp",
        "call": "Ligação",
        "email": "E-mail",
        "meeting": "Reunião",
        "note": "Observação"
      },
      "interactionModal": {
        "kicker": "Histórico comercial",
        "title": "Registrar nova interação",
        "description": "O registro ficará visível na Ficha 360° de {name}.",
        "type": "Tipo de interação",
        "descriptionLabel": "Descrição da interação *",
        "placeholder": "Ex.: conversamos sobre valores, o interessado pediu retorno na próxima semana..."
      }
    }
  },
  "en-US": {
    "AdminCommercialOverview": {
      "header": {
        "kicker": "Institutional management",
        "title": "Sales",
        "description": "Manage leads, salespeople, goals, sales, enrollments, commissions, and your institution's sales results."
      },
      "errors": {
        "loadSummary": "The sales summary could not be loaded."
      },
      "metrics": {
        "activeLeads": {
          "title": "Active leads",
          "description": "Leads currently moving through the sales funnel."
        },
        "periodSales": {
          "title": "Sales in the period",
          "description": "Enrollments confirmed in the current month."
        },
        "goals": {
          "title": "Goals achieved",
          "progress": "{achieved} of {total} goal(s) for the period.",
          "none": "No active goals for this period."
        },
        "pendingCommissions": {
          "title": "Pending commissions",
          "pending": "{count, plural, one {# entry awaiting review.} other {# entries awaiting review.}}",
          "none": "No pending commissions for this period."
        }
      },
      "resources": {
        "title": "Sales resources",
        "description": "Resources are released gradually and follow the department and individual permissions already configured."
      },
      "statuses": {
        "available": "Available",
        "integrated": "Integration active"
      },
      "modules": {
        "leads": {
          "title": "Leads and opportunities",
          "description": "Register prospects and track contacts, funnel stages, and owners.",
          "action": "Open leads and opportunities"
        },
        "salespeople": {
          "title": "Salespeople",
          "description": "Manage employees authorized to work with sales and enrollments.",
          "action": "Open employees"
        },
        "teams": {
          "title": "Sales teams",
          "description": "Organize salespeople into teams, define leaders, and manage members.",
          "action": "Open sales teams"
        },
        "goals": {
          "title": "Sales goals",
          "description": "Set goals by salesperson, team, course, campus, and period.",
          "action": "Open sales goals"
        },
        "salesEnrollments": {
          "title": "Sales and enrollments",
          "description": "Track enrollments, negotiated amounts, and responsible salespeople.",
          "action": "Open enrollments"
        },
        "commissions": {
          "title": "Commissions",
          "description": "Configure plans and rules to calculate and approve salesperson commissions.",
          "action": "Open commission plans"
        },
        "reports": {
          "title": "Reports",
          "description": "Analyze conversion, performance, leads, enrollments, sales, and sales results.",
          "action": "Open sales reports"
        }
      },
      "hrIntegration": {
        "title": "HR integration",
        "description": "Commissions generated from sales and enrollments are calculated and approved in Sales. They can then be sent to HR and included in the corresponding payroll period. Bonuses, awards, and profit-sharing remain under Variable Compensation."
      }
    },
    "AdminCommercialTeams": {
      "header": {
        "kicker": "Sales",
        "title": "Sales teams",
        "description": "Organize salespeople into teams, define leaders, and prepare the structure for team and individual goals."
      },
      "common": {
        "employee": "Employee",
        "noDepartment": "No department",
        "noDescription": "No description provided.",
        "noRole": "Role not provided"
      },
      "metrics": {
        "total": "Total teams",
        "active": "Active teams",
        "inactive": "Inactive teams",
        "activeMembers": "Active members",
        "linkedGoals": "Linked goals"
      },
      "filters": {
        "searchPlaceholder": "Search by team, leader, or member",
        "active": "Active teams",
        "inactive": "Inactive teams",
        "all": "All teams"
      },
      "states": {
        "loading": "Loading sales teams...",
        "emptyTitle": "No teams found",
        "emptyDescription": "Create a team or adjust the list filters.",
        "loadingEmployees": "Loading employees...",
        "noEmployees": "No employees found."
      },
      "status": {
        "active": "Active",
        "inactive": "Inactive"
      },
      "card": {
        "teamLeader": "Team leader",
        "noLeader": "No leader assigned",
        "members": "Members",
        "noMembers": "No active members."
      },
      "actions": {
        "newTeam": "+ New team",
        "edit": "Edit team",
        "deactivate": "Deactivate",
        "reactivate": "Reactivate",
        "close": "Close",
        "cancel": "Cancel",
        "saving": "Saving...",
        "saveChanges": "Save changes",
        "createTeam": "Create team",
        "keepTeam": "Keep team",
        "deactivating": "Deactivating...",
        "deactivateTeam": "Deactivate team"
      },
      "modal": {
        "newTitle": "New sales team",
        "editTitle": "Edit sales team",
        "teamName": "Team name",
        "teamNamePlaceholder": "e.g. Downtown Sales Team",
        "description": "Description",
        "descriptionPlaceholder": "Describe this team's responsibilities.",
        "teamLeader": "Team leader",
        "noLeader": "No leader assigned",
        "leaderHelp": "The leader will automatically be included as a team member.",
        "members": "Team members",
        "membersDescription": "Select the employees who will be part of this team.",
        "selectedCount": "{count, plural, one {# selected} other {# selected}}",
        "searchEmployees": "Search employee, role, or department",
        "leaderBadge": "Leader",
        "activeTeam": "Active team",
        "activeTeamHelp": "Inactive teams should not receive new goals."
      },
      "validation": {
        "teamName": "Enter the sales team name."
      },
      "errors": {
        "loadTeams": "The sales teams could not be loaded.",
        "loadEmployees": "The sales employees could not be loaded.",
        "saveTeam": "The sales team could not be saved.",
        "deactivate": "The team could not be deactivated.",
        "reactivate": "The team could not be reactivated."
      },
      "success": {
        "created": "Team created successfully.",
        "updated": "Team updated successfully.",
        "deactivated": "Team deactivated successfully.",
        "reactivated": "Team reactivated successfully."
      },
      "deactivateModal": {
        "title": "Deactivate sales team",
        "description": "The team <team></team> will be deactivated. Its history and already-linked goals will be preserved."
      }
    },
    "AdminCommercialFunnels": {
      "breadcrumb": {
        "commercial": "Sales",
        "salesFunnels": "Sales funnels"
      },
      "header": {
        "title": "Sales funnel configuration",
        "description": "Organize service stages, deadlines, conversion probabilities, and reasons for lost opportunities."
      },
      "actions": {
        "refresh": "Refresh",
        "refreshing": "Refreshing...",
        "processing": "Processing...",
        "createStructure": "Create sales structure",
        "linkPendingLeads": "Link pending leads",
        "checkStructure": "Check structure",
        "initializeNow": "Initialize now",
        "initializing": "Initializing...",
        "tryAgain": "Try again",
        "closeMessage": "Close message"
      },
      "errors": {
        "load": "The funnels could not be loaded.",
        "initialize": "The funnel could not be initialized.",
        "operationTitle": "The operation could not be completed"
      },
      "success": {
        "initialized": "Sales structure initialized."
      },
      "states": {
        "loading": "Loading sales configuration..."
      },
      "common": {
        "dateUnavailable": "Date unavailable",
        "noMaximumDeadline": "No maximum deadline",
        "hours": "{count}h",
        "days": "{count, plural, one {# day} other {# days}}",
        "active": "Active",
        "archived": "Archived",
        "required": "Required",
        "optional": "Optional",
        "manual": "Manual",
        "automatic": "Automatic"
      },
      "summary": {
        "status": {
          "title": "Status",
          "configured": "Configured",
          "pending": "Pending",
          "available": "Default funnel available",
          "initializationRequired": "Initialization required"
        },
        "funnels": {
          "title": "Funnels",
          "description": "Registered for this institution"
        },
        "stages": {
          "title": "Stages",
          "description": "In the default sales funnel"
        },
        "lossReasons": {
          "title": "Loss reasons",
          "description": "Available reasons"
        },
        "pendingLeads": {
          "title": "Pending leads",
          "description": "Out of {count} registered leads"
        }
      },
      "initialization": {
        "title": "The CRM still needs to be initialized",
        "description": "Initialization will create the default funnel, its stages, loss reasons, and link existing leads. No leads will be deleted.",
        "noPermission": "You do not have permission to initialize this structure."
      },
      "funnel": {
        "default": "Default funnel",
        "updatedAt": "Updated {date}"
      },
      "stages": {
        "title": "Sales process stages",
        "count": "{count, plural, one {# stage configured} other {# stages configured}}",
        "empty": "No stages are registered in this funnel."
      },
      "stageMetrics": {
        "conversion": "Conversion",
        "deadline": "Deadline",
        "nextAction": "Next action",
        "movement": "Movement"
      },
      "emptyFunnels": {
        "title": "No sales funnels registered",
        "description": "Initialize the structure to create the institution's default funnel."
      },
      "lossReasons": {
        "title": "Loss reasons",
        "description": "Reasons used to understand why opportunities were not converted.",
        "requiresObservation": "⚠ Additional note required",
        "empty": "No loss reasons registered."
      },
      "stageCategories": {
        "entry": "Entry",
        "firstContact": "First contact",
        "inService": "In progress",
        "qualification": "Qualification",
        "presentation": "Presentation",
        "proposal": "Proposal",
        "negotiation": "Negotiation",
        "documentation": "Documentation",
        "payment": "Payment",
        "conversion": "Conversion",
        "loss": "Loss",
        "pause": "Paused",
        "discard": "Discard"
      },
      "stageResults": {
        "open": "Open",
        "won": "Won",
        "lost": "Lost",
        "discarded": "Discarded"
      },
      "lossCategories": {
        "noInterest": "Not interested",
        "price": "Price",
        "competition": "Competition",
        "noContact": "No contact",
        "courseUnavailable": "Course unavailable",
        "scheduleConflict": "Schedule conflict",
        "location": "Location",
        "documentation": "Documentation",
        "financial": "Financial",
        "withdrawal": "Withdrawal",
        "duplicate": "Duplicate",
        "outOfProfile": "Outside target profile",
        "other": "Other"
      }
    },
    "AdminCommercialLead360": {
      "breadcrumb": {
        "commercial": "Sales",
        "leads": "Leads",
        "lead360": "360° Lead View"
      },
      "header": {
        "leadNumber": "Lead #{id}",
        "description": "Complete sales history, service data, and opportunity status in one place."
      },
      "actions": {
        "pipeline": "← Pipeline",
        "leadList": "Lead list",
        "refresh": "Refresh",
        "refreshing": "Refreshing...",
        "registerInteraction": "+ Log interaction",
        "registerInteractionPlain": "Log interaction",
        "registering": "Logging...",
        "tryAgain": "Try again",
        "backToPipeline": "Back to Pipeline",
        "cancel": "Cancel",
        "close": "Close"
      },
      "errors": {
        "invalidLeadId": "The lead identifier is invalid.",
        "loadLead": "The lead record could not be loaded."
      },
      "loading": {
        "title": "Building the 360° Lead View...",
        "description": "Gathering contacts, funnel activity, tasks, and enrollment data."
      },
      "empty": {
        "title": "The 360° Lead View could not be opened",
        "notFound": "The lead was not found."
      },
      "common": {
        "notProvided": "Not provided",
        "notDefined": "Not defined",
        "unassigned": "Unassigned",
        "noResponsible": "No owner",
        "noTeam": "No team",
        "noStage": "No stage defined",
        "noFunnel": "No funnel defined",
        "noSalesTeam": "No sales team"
      },
      "enum": {
        "low": "Low",
        "medium": "Medium",
        "high": "High",
        "urgent": "Urgent",
        "new": "New",
        "inService": "In progress",
        "qualified": "Qualified",
        "converted": "Converted",
        "lost": "Lost",
        "archived": "Archived",
        "active": "Active",
        "inactive": "Inactive",
        "pending": "Pending",
        "completed": "Completed",
        "cancelled": "Cancelled"
      },
      "summary": {
        "currentStage": "Current stage",
        "responsible": "Owner",
        "estimatedValue": "Estimated value",
        "nextAction": "Next action",
        "pendingTasks": "{count, plural, one {# pending task} other {# pending tasks}}"
      },
      "quickContact": {
        "kicker": "Quick contact",
        "title": "Contact the prospect",
        "call": "Call",
        "email": "Email",
        "addNote": "Add note"
      },
      "timeline": {
        "eventCount": "{count, plural, one {# event recorded} other {# events recorded}}",
        "title": "Sales timeline",
        "description": "Contacts, funnel movements, tasks, and decisions in chronological order.",
        "filterAria": "Filter events",
        "scheduledFor": "Scheduled for {date}",
        "registeredBy": "Recorded by {name}",
        "systemRecord": "Automatic system record",
        "emptyTitle": "No events of this type on this page",
        "emptyDescription": "Choose another filter or browse the other pages.",
        "filters": {
          "all": "All",
          "contacts": "Contacts",
          "funnel": "Funnel",
          "tasks": "Tasks",
          "transfers": "Transfers",
          "conversion": "Conversion"
        },
        "eventTypes": {
          "creation": "Creation",
          "contact": "Contact",
          "funnel": "Funnel",
          "transfer": "Transfer",
          "task": "Task",
          "loss": "Loss",
          "archiving": "Archiving",
          "restoration": "Restoration",
          "conversion": "Conversion"
        }
      },
      "pagination": {
        "page": "Page {current} of {total}",
        "previous": "Previous",
        "next": "Next"
      },
      "commercialSummary": {
        "kicker": "Current status",
        "title": "Sales summary",
        "status": "Status",
        "stage": "Stage",
        "funnel": "Funnel",
        "responsible": "Owner",
        "team": "Team"
      },
      "interest": {
        "kicker": "Interest",
        "title": "Course and campus",
        "course": "Course",
        "campus": "Campus",
        "organization": "Company / institution",
        "source": "Source",
        "initialNotes": "Initial notes"
      },
      "milestones": {
        "kicker": "Progress",
        "title": "Relationship milestones",
        "created": "Lead created",
        "firstContact": "First contact",
        "qualified": "Qualified",
        "converted": "Converted",
        "notRecorded": "Not recorded yet"
      },
      "enrollment": {
        "kicker": "Conversion completed",
        "title": "Linked enrollment",
        "convertedAt": "Converted on",
        "open": "Open enrollment"
      },
      "loss": {
        "kicker": "Lost opportunity",
        "noAdditionalNote": "No additional note was recorded."
      },
      "interaction": {
        "validationDescription": "Describe the contact or note you want to record.",
        "errorRegister": "The interaction could not be recorded.",
        "successRegistered": "Interaction added to the timeline."
      },
      "interactionTypes": {
        "whatsapp": "WhatsApp",
        "call": "Call",
        "email": "Email",
        "meeting": "Meeting",
        "note": "Note"
      },
      "interactionModal": {
        "kicker": "Sales history",
        "title": "Log a new interaction",
        "description": "This record will appear in {name}'s 360° Lead View.",
        "type": "Interaction type",
        "descriptionLabel": "Interaction description *",
        "placeholder": "e.g. We discussed pricing and the prospect asked for a follow-up next week..."
      }
    }
  },
  "es-ES": {
    "AdminCommercialOverview": {
      "header": {
        "kicker": "Gestión institucional",
        "title": "Comercial",
        "description": "Gestiona leads, vendedores, objetivos, ventas, matrículas, comisiones y resultados comerciales de la institución."
      },
      "errors": {
        "loadSummary": "No se pudo cargar el resumen comercial."
      },
      "metrics": {
        "activeLeads": {
          "title": "Leads activos",
          "description": "Leads en curso dentro del embudo comercial."
        },
        "periodSales": {
          "title": "Ventas del período",
          "description": "Matrículas confirmadas en el mes actual."
        },
        "goals": {
          "title": "Objetivos alcanzados",
          "progress": "{achieved} de {total} objetivo(s) del período.",
          "none": "No hay objetivos activos en el período."
        },
        "pendingCommissions": {
          "title": "Comisiones pendientes",
          "pending": "{count, plural, one {# registro pendiente de revisión.} other {# registros pendientes de revisión.}}",
          "none": "No hay comisiones pendientes en el período."
        }
      },
      "resources": {
        "title": "Recursos del sector Comercial",
        "description": "Los recursos se habilitan gradualmente y respetan los permisos departamentales e individuales ya configurados."
      },
      "statuses": {
        "available": "Disponible",
        "integrated": "Integración activa"
      },
      "modules": {
        "leads": {
          "title": "Leads y oportunidades",
          "description": "Registra interesados y acompaña contactos, etapas del embudo y responsables.",
          "action": "Abrir leads y oportunidades"
        },
        "salespeople": {
          "title": "Vendedores",
          "description": "Gestiona a los empleados autorizados a trabajar con ventas y matrículas.",
          "action": "Abrir empleados"
        },
        "teams": {
          "title": "Equipos comerciales",
          "description": "Organiza vendedores en equipos, define liderazgos y gestiona sus miembros.",
          "action": "Abrir equipos comerciales"
        },
        "goals": {
          "title": "Objetivos comerciales",
          "description": "Define objetivos por vendedor, equipo, curso, sede y período.",
          "action": "Abrir objetivos comerciales"
        },
        "salesEnrollments": {
          "title": "Ventas y matrículas",
          "description": "Acompaña matrículas, importes negociados y vendedores responsables.",
          "action": "Abrir matrículas"
        },
        "commissions": {
          "title": "Comisiones",
          "description": "Configura planes y reglas para calcular y aprobar las comisiones de los vendedores.",
          "action": "Abrir planes de comisión"
        },
        "reports": {
          "title": "Informes",
          "description": "Analiza conversión, rendimiento, leads, matrículas, ventas y resultados comerciales.",
          "action": "Abrir informes comerciales"
        }
      },
      "hrIntegration": {
        "title": "Integración con RR. HH.",
        "description": "Las comisiones originadas por ventas y matrículas se calculan y aprueban en Comercial. Después pueden enviarse a RR. HH. e incluirse en la nómina del período correspondiente. Bonificaciones, premios y participaciones continúan gestionándose en Remuneración Variable."
      }
    },
    "AdminCommercialTeams": {
      "header": {
        "kicker": "Comercial",
        "title": "Equipos comerciales",
        "description": "Organiza vendedores en equipos, define liderazgos y prepara la estructura para objetivos colectivos e individuales."
      },
      "common": {
        "employee": "Empleado",
        "noDepartment": "Sin departamento",
        "noDescription": "Sin descripción registrada.",
        "noRole": "Cargo no informado"
      },
      "metrics": {
        "total": "Total de equipos",
        "active": "Equipos activos",
        "inactive": "Equipos inactivos",
        "activeMembers": "Miembros activos",
        "linkedGoals": "Objetivos vinculados"
      },
      "filters": {
        "searchPlaceholder": "Buscar por equipo, líder o miembro",
        "active": "Equipos activos",
        "inactive": "Equipos inactivos",
        "all": "Todos los equipos"
      },
      "states": {
        "loading": "Cargando equipos comerciales...",
        "emptyTitle": "No se encontraron equipos",
        "emptyDescription": "Crea un equipo o ajusta los filtros de la lista.",
        "loadingEmployees": "Cargando empleados...",
        "noEmployees": "No se encontraron empleados."
      },
      "status": {
        "active": "Activo",
        "inactive": "Inactivo"
      },
      "card": {
        "teamLeader": "Líder del equipo",
        "noLeader": "Liderazgo no definido",
        "members": "Miembros",
        "noMembers": "No hay miembros activos."
      },
      "actions": {
        "newTeam": "+ Nuevo equipo",
        "edit": "Editar equipo",
        "deactivate": "Desactivar",
        "reactivate": "Reactivar",
        "close": "Cerrar",
        "cancel": "Cancelar",
        "saving": "Guardando...",
        "saveChanges": "Guardar cambios",
        "createTeam": "Crear equipo",
        "keepTeam": "Mantener equipo",
        "deactivating": "Desactivando...",
        "deactivateTeam": "Desactivar equipo"
      },
      "modal": {
        "newTitle": "Nuevo equipo comercial",
        "editTitle": "Editar equipo comercial",
        "teamName": "Nombre del equipo",
        "teamNamePlaceholder": "Ej.: Equipo Comercial Centro",
        "description": "Descripción",
        "descriptionPlaceholder": "Describe la actuación de este equipo.",
        "teamLeader": "Líder del equipo",
        "noLeader": "Sin liderazgo definido",
        "leaderHelp": "El líder se incluirá automáticamente como miembro del equipo.",
        "members": "Miembros del equipo",
        "membersDescription": "Selecciona a los empleados que formarán parte del equipo.",
        "selectedCount": "{count, plural, one {# seleccionado} other {# seleccionados}}",
        "searchEmployees": "Buscar empleado, cargo o departamento",
        "leaderBadge": "Líder",
        "activeTeam": "Equipo activo",
        "activeTeamHelp": "Los equipos inactivos no deben recibir nuevos objetivos."
      },
      "validation": {
        "teamName": "Indica el nombre del equipo comercial."
      },
      "errors": {
        "loadTeams": "No se pudieron cargar los equipos comerciales.",
        "loadEmployees": "No se pudieron cargar los empleados comerciales.",
        "saveTeam": "No se pudo guardar el equipo comercial.",
        "deactivate": "No se pudo desactivar el equipo.",
        "reactivate": "No se pudo reactivar el equipo."
      },
      "success": {
        "created": "Equipo creado correctamente.",
        "updated": "Equipo actualizado correctamente.",
        "deactivated": "Equipo desactivado correctamente.",
        "reactivated": "Equipo reactivado correctamente."
      },
      "deactivateModal": {
        "title": "Desactivar equipo comercial",
        "description": "El equipo <team></team> será desactivado. Se conservarán el historial y los objetivos ya vinculados."
      }
    },
    "AdminCommercialFunnels": {
      "breadcrumb": {
        "commercial": "Comercial",
        "salesFunnels": "Embudos comerciales"
      },
      "header": {
        "title": "Configuración del embudo comercial",
        "description": "Organiza las etapas de atención, los plazos, las probabilidades de conversión y los motivos de pérdida de oportunidades."
      },
      "actions": {
        "refresh": "Actualizar",
        "refreshing": "Actualizando...",
        "processing": "Procesando...",
        "createStructure": "Crear estructura comercial",
        "linkPendingLeads": "Vincular leads pendientes",
        "checkStructure": "Verificar estructura",
        "initializeNow": "Inicializar ahora",
        "initializing": "Inicializando...",
        "tryAgain": "Intentar de nuevo",
        "closeMessage": "Cerrar mensaje"
      },
      "errors": {
        "load": "No se pudieron cargar los embudos.",
        "initialize": "No se pudo inicializar el embudo.",
        "operationTitle": "No se pudo completar la operación"
      },
      "success": {
        "initialized": "Estructura comercial inicializada."
      },
      "states": {
        "loading": "Cargando configuración comercial..."
      },
      "common": {
        "dateUnavailable": "Fecha no disponible",
        "noMaximumDeadline": "Sin plazo máximo",
        "hours": "{count} h",
        "days": "{count, plural, one {# día} other {# días}}",
        "active": "Activo",
        "archived": "Archivado",
        "required": "Obligatoria",
        "optional": "Opcional",
        "manual": "Manual",
        "automatic": "Automático"
      },
      "summary": {
        "status": {
          "title": "Estado",
          "configured": "Configurado",
          "pending": "Pendiente",
          "available": "Embudo predeterminado disponible",
          "initializationRequired": "Inicialización necesaria"
        },
        "funnels": {
          "title": "Embudos",
          "description": "Registrados en la institución"
        },
        "stages": {
          "title": "Etapas",
          "description": "En el embudo comercial predeterminado"
        },
        "lossReasons": {
          "title": "Motivos de pérdida",
          "description": "Motivos disponibles"
        },
        "pendingLeads": {
          "title": "Leads pendientes",
          "description": "De {count} leads registrados"
        }
      },
      "initialization": {
        "title": "El CRM todavía debe inicializarse",
        "description": "La inicialización creará el embudo predeterminado, sus etapas, los motivos de pérdida y vinculará los leads antiguos. No se eliminará ningún lead.",
        "noPermission": "No tienes permiso para inicializar esta estructura."
      },
      "funnel": {
        "default": "Embudo predeterminado",
        "updatedAt": "Actualizado el {date}"
      },
      "stages": {
        "title": "Etapas del proceso comercial",
        "count": "{count, plural, one {# etapa configurada} other {# etapas configuradas}}",
        "empty": "No hay etapas registradas en este embudo."
      },
      "stageMetrics": {
        "conversion": "Conversión",
        "deadline": "Plazo",
        "nextAction": "Próxima acción",
        "movement": "Movimiento"
      },
      "emptyFunnels": {
        "title": "No hay embudos comerciales registrados",
        "description": "Inicializa la estructura para crear el embudo predeterminado de la institución."
      },
      "lossReasons": {
        "title": "Motivos de pérdida",
        "description": "Motivos utilizados para comprender por qué las oportunidades no se convirtieron.",
        "requiresObservation": "⚠ Requiere una observación adicional",
        "empty": "No hay motivos de pérdida registrados."
      },
      "stageCategories": {
        "entry": "Entrada",
        "firstContact": "Primer contacto",
        "inService": "En atención",
        "qualification": "Calificación",
        "presentation": "Presentación",
        "proposal": "Propuesta",
        "negotiation": "Negociación",
        "documentation": "Documentación",
        "payment": "Pago",
        "conversion": "Conversión",
        "loss": "Pérdida",
        "pause": "Pausa",
        "discard": "Descarte"
      },
      "stageResults": {
        "open": "Abierta",
        "won": "Ganada",
        "lost": "Perdida",
        "discarded": "Descartada"
      },
      "lossCategories": {
        "noInterest": "Sin interés",
        "price": "Precio",
        "competition": "Competencia",
        "noContact": "Sin contacto",
        "courseUnavailable": "Curso no disponible",
        "scheduleConflict": "Horario incompatible",
        "location": "Ubicación",
        "documentation": "Documentación",
        "financial": "Financiero",
        "withdrawal": "Desistimiento",
        "duplicate": "Duplicidad",
        "outOfProfile": "Fuera del perfil",
        "other": "Otro"
      }
    },
    "AdminCommercialLead360": {
      "breadcrumb": {
        "commercial": "Comercial",
        "leads": "Leads",
        "lead360": "Ficha 360°"
      },
      "header": {
        "leadNumber": "Lead #{id}",
        "description": "Historial comercial completo, datos de atención y estado de la oportunidad en un solo lugar."
      },
      "actions": {
        "pipeline": "← Pipeline",
        "leadList": "Lista de leads",
        "refresh": "Actualizar",
        "refreshing": "Actualizando...",
        "registerInteraction": "+ Registrar interacción",
        "registerInteractionPlain": "Registrar interacción",
        "registering": "Registrando...",
        "tryAgain": "Intentar de nuevo",
        "backToPipeline": "Volver al Pipeline",
        "cancel": "Cancelar",
        "close": "Cerrar"
      },
      "errors": {
        "invalidLeadId": "El identificador del lead no es válido.",
        "loadLead": "No se pudo cargar la ficha del lead."
      },
      "loading": {
        "title": "Preparando la Ficha 360°...",
        "description": "Reuniendo contactos, embudo, tareas y matrícula."
      },
      "empty": {
        "title": "No se pudo abrir la Ficha 360°",
        "notFound": "No se encontró el lead."
      },
      "common": {
        "notProvided": "No informado",
        "notDefined": "No definido",
        "unassigned": "No asignado",
        "noResponsible": "Sin responsable",
        "noTeam": "Sin equipo",
        "noStage": "Sin etapa definida",
        "noFunnel": "Embudo no definido",
        "noSalesTeam": "Sin equipo comercial"
      },
      "enum": {
        "low": "Baja",
        "medium": "Media",
        "high": "Alta",
        "urgent": "Urgente",
        "new": "Nuevo",
        "inService": "En atención",
        "qualified": "Calificado",
        "converted": "Convertido",
        "lost": "Perdido",
        "archived": "Archivado",
        "active": "Activo",
        "inactive": "Inactivo",
        "pending": "Pendiente",
        "completed": "Completado",
        "cancelled": "Cancelado"
      },
      "summary": {
        "currentStage": "Etapa actual",
        "responsible": "Responsable",
        "estimatedValue": "Valor estimado",
        "nextAction": "Próxima acción",
        "pendingTasks": "{count, plural, one {# tarea pendiente} other {# tareas pendientes}}"
      },
      "quickContact": {
        "kicker": "Contacto rápido",
        "title": "Habla con el interesado",
        "call": "Llamar",
        "email": "Correo electrónico",
        "addNote": "Añadir observación"
      },
      "timeline": {
        "eventCount": "{count, plural, one {# evento registrado} other {# eventos registrados}}",
        "title": "Línea de tiempo comercial",
        "description": "Contactos, movimientos, tareas y decisiones en orden cronológico.",
        "filterAria": "Filtrar eventos",
        "scheduledFor": "Programada para {date}",
        "registeredBy": "Registrado por {name}",
        "systemRecord": "Registro automático del sistema",
        "emptyTitle": "No hay eventos de este tipo en esta página",
        "emptyDescription": "Selecciona otro filtro o navega por las páginas.",
        "filters": {
          "all": "Todo",
          "contacts": "Contactos",
          "funnel": "Embudo",
          "tasks": "Tareas",
          "transfers": "Transferencias",
          "conversion": "Conversión"
        },
        "eventTypes": {
          "creation": "Creación",
          "contact": "Contacto",
          "funnel": "Embudo",
          "transfer": "Transferencia",
          "task": "Tarea",
          "loss": "Pérdida",
          "archiving": "Archivado",
          "restoration": "Restauración",
          "conversion": "Conversión"
        }
      },
      "pagination": {
        "page": "Página {current} de {total}",
        "previous": "Anterior",
        "next": "Siguiente"
      },
      "commercialSummary": {
        "kicker": "Estado actual",
        "title": "Resumen comercial",
        "status": "Estado",
        "stage": "Etapa",
        "funnel": "Embudo",
        "responsible": "Responsable",
        "team": "Equipo"
      },
      "interest": {
        "kicker": "Interés",
        "title": "Curso y sede",
        "course": "Curso",
        "campus": "Sede",
        "organization": "Empresa / institución",
        "source": "Origen",
        "initialNotes": "Observaciones iniciales"
      },
      "milestones": {
        "kicker": "Evolución",
        "title": "Hitos de la relación",
        "created": "Lead creado",
        "firstContact": "Primer contacto",
        "qualified": "Calificado",
        "converted": "Convertido",
        "notRecorded": "Aún no registrado"
      },
      "enrollment": {
        "kicker": "Conversión completada",
        "title": "Matrícula vinculada",
        "convertedAt": "Convertido el",
        "open": "Abrir matrícula"
      },
      "loss": {
        "kicker": "Oportunidad perdida",
        "noAdditionalNote": "No se registró ninguna observación adicional."
      },
      "interaction": {
        "validationDescription": "Describe el contacto o la observación realizada.",
        "errorRegister": "No se pudo registrar la interacción.",
        "successRegistered": "Interacción registrada en la línea de tiempo."
      },
      "interactionTypes": {
        "whatsapp": "WhatsApp",
        "call": "Llamada",
        "email": "Correo",
        "meeting": "Reunión",
        "note": "Observación"
      },
      "interactionModal": {
        "kicker": "Historial comercial",
        "title": "Registrar nueva interacción",
        "description": "El registro será visible en la Ficha 360° de {name}.",
        "type": "Tipo de interacción",
        "descriptionLabel": "Descripción de la interacción *",
        "placeholder": "Ej.: hablamos sobre precios y el interesado pidió que le contactáramos la próxima semana..."
      }
    }
  },
  "fr-FR": {
    "AdminCommercialOverview": {
      "header": {
        "kicker": "Gestion institutionnelle",
        "title": "Commercial",
        "description": "Gérez les prospects, les commerciaux, les objectifs, les ventes, les inscriptions, les commissions et les résultats commerciaux de l’établissement."
      },
      "errors": {
        "loadSummary": "Impossible de charger le résumé commercial."
      },
      "metrics": {
        "activeLeads": {
          "title": "Prospects actifs",
          "description": "Prospects actuellement en cours dans l’entonnoir commercial."
        },
        "periodSales": {
          "title": "Ventes sur la période",
          "description": "Inscriptions confirmées pendant le mois en cours."
        },
        "goals": {
          "title": "Objectifs atteints",
          "progress": "{achieved} sur {total} objectif(s) de la période.",
          "none": "Aucun objectif actif sur cette période."
        },
        "pendingCommissions": {
          "title": "Commissions en attente",
          "pending": "{count, plural, one {# élément en attente d’analyse.} other {# éléments en attente d’analyse.}}",
          "none": "Aucune commission en attente sur cette période."
        }
      },
      "resources": {
        "title": "Ressources du service Commercial",
        "description": "Les ressources sont activées progressivement et respectent les autorisations départementales et individuelles déjà configurées."
      },
      "statuses": {
        "available": "Disponible",
        "integrated": "Intégration active"
      },
      "modules": {
        "leads": {
          "title": "Prospects et opportunités",
          "description": "Enregistrez les prospects et suivez les contacts, les étapes de l’entonnoir et les responsables.",
          "action": "Ouvrir les prospects et opportunités"
        },
        "salespeople": {
          "title": "Commerciaux",
          "description": "Gérez les employés autorisés à intervenir sur les ventes et les inscriptions.",
          "action": "Ouvrir les employés"
        },
        "teams": {
          "title": "Équipes commerciales",
          "description": "Organisez les commerciaux en équipes, définissez les responsables et gérez les membres.",
          "action": "Ouvrir les équipes commerciales"
        },
        "goals": {
          "title": "Objectifs commerciaux",
          "description": "Définissez des objectifs par commercial, équipe, cours, site et période.",
          "action": "Ouvrir les objectifs commerciaux"
        },
        "salesEnrollments": {
          "title": "Ventes et inscriptions",
          "description": "Suivez les inscriptions, les montants négociés et les commerciaux responsables.",
          "action": "Ouvrir les inscriptions"
        },
        "commissions": {
          "title": "Commissions",
          "description": "Configurez les plans et règles pour calculer et approuver les commissions des commerciaux.",
          "action": "Ouvrir les plans de commission"
        },
        "reports": {
          "title": "Rapports",
          "description": "Analysez la conversion, les performances, les prospects, les inscriptions, les ventes et les résultats commerciaux.",
          "action": "Ouvrir les rapports commerciaux"
        }
      },
      "hrIntegration": {
        "title": "Intégration avec les RH",
        "description": "Les commissions issues des ventes et des inscriptions sont calculées et approuvées dans le module Commercial. Elles peuvent ensuite être transmises aux RH et intégrées à la paie de la période correspondante. Les primes, récompenses et participations restent gérées dans la rémunération variable."
      }
    },
    "AdminCommercialTeams": {
      "header": {
        "kicker": "Commercial",
        "title": "Équipes commerciales",
        "description": "Organisez les commerciaux en équipes, définissez les responsables et préparez la structure pour les objectifs collectifs et individuels."
      },
      "common": {
        "employee": "Employé",
        "noDepartment": "Sans département",
        "noDescription": "Aucune description enregistrée.",
        "noRole": "Poste non renseigné"
      },
      "metrics": {
        "total": "Total des équipes",
        "active": "Équipes actives",
        "inactive": "Équipes inactives",
        "activeMembers": "Membres actifs",
        "linkedGoals": "Objectifs associés"
      },
      "filters": {
        "searchPlaceholder": "Rechercher par équipe, responsable ou membre",
        "active": "Équipes actives",
        "inactive": "Équipes inactives",
        "all": "Toutes les équipes"
      },
      "states": {
        "loading": "Chargement des équipes commerciales...",
        "emptyTitle": "Aucune équipe trouvée",
        "emptyDescription": "Créez une équipe ou ajustez les filtres de la liste.",
        "loadingEmployees": "Chargement des employés...",
        "noEmployees": "Aucun employé trouvé."
      },
      "status": {
        "active": "Active",
        "inactive": "Inactive"
      },
      "card": {
        "teamLeader": "Responsable de l’équipe",
        "noLeader": "Aucun responsable défini",
        "members": "Membres",
        "noMembers": "Aucun membre actif."
      },
      "actions": {
        "newTeam": "+ Nouvelle équipe",
        "edit": "Modifier l’équipe",
        "deactivate": "Désactiver",
        "reactivate": "Réactiver",
        "close": "Fermer",
        "cancel": "Annuler",
        "saving": "Enregistrement...",
        "saveChanges": "Enregistrer les modifications",
        "createTeam": "Créer l’équipe",
        "keepTeam": "Conserver l’équipe",
        "deactivating": "Désactivation...",
        "deactivateTeam": "Désactiver l’équipe"
      },
      "modal": {
        "newTitle": "Nouvelle équipe commerciale",
        "editTitle": "Modifier l’équipe commerciale",
        "teamName": "Nom de l’équipe",
        "teamNamePlaceholder": "Ex. : Équipe commerciale Centre",
        "description": "Description",
        "descriptionPlaceholder": "Décrivez le rôle de cette équipe.",
        "teamLeader": "Responsable de l’équipe",
        "noLeader": "Aucun responsable défini",
        "leaderHelp": "Le responsable sera automatiquement ajouté comme membre de l’équipe.",
        "members": "Membres de l’équipe",
        "membersDescription": "Sélectionnez les employés qui feront partie de l’équipe.",
        "selectedCount": "{count, plural, one {# sélectionné} other {# sélectionnés}}",
        "searchEmployees": "Rechercher un employé, un poste ou un département",
        "leaderBadge": "Responsable",
        "activeTeam": "Équipe active",
        "activeTeamHelp": "Les équipes inactives ne doivent pas recevoir de nouveaux objectifs."
      },
      "validation": {
        "teamName": "Saisissez le nom de l’équipe commerciale."
      },
      "errors": {
        "loadTeams": "Impossible de charger les équipes commerciales.",
        "loadEmployees": "Impossible de charger les employés commerciaux.",
        "saveTeam": "Impossible d’enregistrer l’équipe commerciale.",
        "deactivate": "Impossible de désactiver l’équipe.",
        "reactivate": "Impossible de réactiver l’équipe."
      },
      "success": {
        "created": "Équipe créée avec succès.",
        "updated": "Équipe mise à jour avec succès.",
        "deactivated": "Équipe désactivée avec succès.",
        "reactivated": "Équipe réactivée avec succès."
      },
      "deactivateModal": {
        "title": "Désactiver l’équipe commerciale",
        "description": "L’équipe <team></team> sera désactivée. Son historique et les objectifs déjà associés seront conservés."
      }
    },
    "AdminCommercialFunnels": {
      "breadcrumb": {
        "commercial": "Commercial",
        "salesFunnels": "Entonnoirs commerciaux"
      },
      "header": {
        "title": "Configuration de l’entonnoir commercial",
        "description": "Organisez les étapes de suivi, les délais, les probabilités de conversion et les motifs de perte des opportunités."
      },
      "actions": {
        "refresh": "Actualiser",
        "refreshing": "Actualisation...",
        "processing": "Traitement...",
        "createStructure": "Créer la structure commerciale",
        "linkPendingLeads": "Associer les prospects en attente",
        "checkStructure": "Vérifier la structure",
        "initializeNow": "Initialiser maintenant",
        "initializing": "Initialisation...",
        "tryAgain": "Réessayer",
        "closeMessage": "Fermer le message"
      },
      "errors": {
        "load": "Impossible de charger les entonnoirs.",
        "initialize": "Impossible d’initialiser l’entonnoir.",
        "operationTitle": "Impossible de terminer l’opération"
      },
      "success": {
        "initialized": "Structure commerciale initialisée."
      },
      "states": {
        "loading": "Chargement de la configuration commerciale..."
      },
      "common": {
        "dateUnavailable": "Date indisponible",
        "noMaximumDeadline": "Aucun délai maximal",
        "hours": "{count} h",
        "days": "{count, plural, one {# jour} other {# jours}}",
        "active": "Actif",
        "archived": "Archivé",
        "required": "Obligatoire",
        "optional": "Facultative",
        "manual": "Manuel",
        "automatic": "Automatique"
      },
      "summary": {
        "status": {
          "title": "Statut",
          "configured": "Configuré",
          "pending": "En attente",
          "available": "Entonnoir par défaut disponible",
          "initializationRequired": "Initialisation requise"
        },
        "funnels": {
          "title": "Entonnoirs",
          "description": "Enregistrés pour l’établissement"
        },
        "stages": {
          "title": "Étapes",
          "description": "Dans l’entonnoir commercial par défaut"
        },
        "lossReasons": {
          "title": "Motifs de perte",
          "description": "Motifs disponibles"
        },
        "pendingLeads": {
          "title": "Prospects en attente",
          "description": "Sur {count} prospects enregistrés"
        }
      },
      "initialization": {
        "title": "Le CRM doit encore être initialisé",
        "description": "L’initialisation créera l’entonnoir par défaut, ses étapes, les motifs de perte et associera les anciens prospects. Aucun prospect ne sera supprimé.",
        "noPermission": "Vous n’avez pas l’autorisation d’initialiser cette structure."
      },
      "funnel": {
        "default": "Entonnoir par défaut",
        "updatedAt": "Mis à jour le {date}"
      },
      "stages": {
        "title": "Étapes du processus commercial",
        "count": "{count, plural, one {# étape configurée} other {# étapes configurées}}",
        "empty": "Aucune étape enregistrée dans cet entonnoir."
      },
      "stageMetrics": {
        "conversion": "Conversion",
        "deadline": "Délai",
        "nextAction": "Prochaine action",
        "movement": "Déplacement"
      },
      "emptyFunnels": {
        "title": "Aucun entonnoir commercial enregistré",
        "description": "Initialisez la structure pour créer l’entonnoir par défaut de l’établissement."
      },
      "lossReasons": {
        "title": "Motifs de perte",
        "description": "Motifs utilisés pour comprendre pourquoi les opportunités n’ont pas été converties.",
        "requiresObservation": "⚠ Observation complémentaire requise",
        "empty": "Aucun motif de perte enregistré."
      },
      "stageCategories": {
        "entry": "Entrée",
        "firstContact": "Premier contact",
        "inService": "En cours",
        "qualification": "Qualification",
        "presentation": "Présentation",
        "proposal": "Proposition",
        "negotiation": "Négociation",
        "documentation": "Documentation",
        "payment": "Paiement",
        "conversion": "Conversion",
        "loss": "Perte",
        "pause": "Pause",
        "discard": "Écart"
      },
      "stageResults": {
        "open": "Ouverte",
        "won": "Gagnée",
        "lost": "Perdue",
        "discarded": "Écartée"
      },
      "lossCategories": {
        "noInterest": "Sans intérêt",
        "price": "Prix",
        "competition": "Concurrence",
        "noContact": "Sans contact",
        "courseUnavailable": "Cours indisponible",
        "scheduleConflict": "Horaire incompatible",
        "location": "Localisation",
        "documentation": "Documentation",
        "financial": "Financier",
        "withdrawal": "Abandon",
        "duplicate": "Doublon",
        "outOfProfile": "Hors profil",
        "other": "Autre"
      }
    },
    "AdminCommercialLead360": {
      "breadcrumb": {
        "commercial": "Commercial",
        "leads": "Prospects",
        "lead360": "Fiche 360°"
      },
      "header": {
        "leadNumber": "Prospect #{id}",
        "description": "Historique commercial complet, données de suivi et statut de l’opportunité réunis au même endroit."
      },
      "actions": {
        "pipeline": "← Pipeline",
        "leadList": "Liste des prospects",
        "refresh": "Actualiser",
        "refreshing": "Actualisation...",
        "registerInteraction": "+ Enregistrer une interaction",
        "registerInteractionPlain": "Enregistrer l’interaction",
        "registering": "Enregistrement...",
        "tryAgain": "Réessayer",
        "backToPipeline": "Retour au Pipeline",
        "cancel": "Annuler",
        "close": "Fermer"
      },
      "errors": {
        "invalidLeadId": "L’identifiant du prospect est invalide.",
        "loadLead": "Impossible de charger la fiche du prospect."
      },
      "loading": {
        "title": "Préparation de la Fiche 360°...",
        "description": "Récupération des contacts, de l’entonnoir, des tâches et de l’inscription."
      },
      "empty": {
        "title": "Impossible d’ouvrir la Fiche 360°",
        "notFound": "Le prospect est introuvable."
      },
      "common": {
        "notProvided": "Non renseigné",
        "notDefined": "Non défini",
        "unassigned": "Non attribué",
        "noResponsible": "Sans responsable",
        "noTeam": "Sans équipe",
        "noStage": "Aucune étape définie",
        "noFunnel": "Aucun entonnoir défini",
        "noSalesTeam": "Aucune équipe commerciale"
      },
      "enum": {
        "low": "Basse",
        "medium": "Moyenne",
        "high": "Haute",
        "urgent": "Urgente",
        "new": "Nouveau",
        "inService": "En cours",
        "qualified": "Qualifié",
        "converted": "Converti",
        "lost": "Perdu",
        "archived": "Archivé",
        "active": "Actif",
        "inactive": "Inactif",
        "pending": "En attente",
        "completed": "Terminé",
        "cancelled": "Annulé"
      },
      "summary": {
        "currentStage": "Étape actuelle",
        "responsible": "Responsable",
        "estimatedValue": "Valeur estimée",
        "nextAction": "Prochaine action",
        "pendingTasks": "{count, plural, one {# tâche en attente} other {# tâches en attente}}"
      },
      "quickContact": {
        "kicker": "Contact rapide",
        "title": "Contacter le prospect",
        "call": "Appeler",
        "email": "E-mail",
        "addNote": "Ajouter une observation"
      },
      "timeline": {
        "eventCount": "{count, plural, one {# événement enregistré} other {# événements enregistrés}}",
        "title": "Chronologie commerciale",
        "description": "Contacts, changements d’étape, tâches et décisions dans l’ordre chronologique.",
        "filterAria": "Filtrer les événements",
        "scheduledFor": "Planifiée pour le {date}",
        "registeredBy": "Enregistré par {name}",
        "systemRecord": "Enregistrement automatique du système",
        "emptyTitle": "Aucun événement de ce type sur cette page",
        "emptyDescription": "Sélectionnez un autre filtre ou parcourez les autres pages.",
        "filters": {
          "all": "Tout",
          "contacts": "Contacts",
          "funnel": "Entonnoir",
          "tasks": "Tâches",
          "transfers": "Transferts",
          "conversion": "Conversion"
        },
        "eventTypes": {
          "creation": "Création",
          "contact": "Contact",
          "funnel": "Entonnoir",
          "transfer": "Transfert",
          "task": "Tâche",
          "loss": "Perte",
          "archiving": "Archivage",
          "restoration": "Restauration",
          "conversion": "Conversion"
        }
      },
      "pagination": {
        "page": "Page {current} sur {total}",
        "previous": "Précédente",
        "next": "Suivante"
      },
      "commercialSummary": {
        "kicker": "Statut actuel",
        "title": "Résumé commercial",
        "status": "Statut",
        "stage": "Étape",
        "funnel": "Entonnoir",
        "responsible": "Responsable",
        "team": "Équipe"
      },
      "interest": {
        "kicker": "Intérêt",
        "title": "Cours et site",
        "course": "Cours",
        "campus": "Site",
        "organization": "Entreprise / établissement",
        "source": "Origine",
        "initialNotes": "Observations initiales"
      },
      "milestones": {
        "kicker": "Évolution",
        "title": "Étapes de la relation",
        "created": "Prospect créé",
        "firstContact": "Premier contact",
        "qualified": "Qualifié",
        "converted": "Converti",
        "notRecorded": "Pas encore enregistré"
      },
      "enrollment": {
        "kicker": "Conversion terminée",
        "title": "Inscription associée",
        "convertedAt": "Converti le",
        "open": "Ouvrir l’inscription"
      },
      "loss": {
        "kicker": "Opportunité perdue",
        "noAdditionalNote": "Aucune observation complémentaire enregistrée."
      },
      "interaction": {
        "validationDescription": "Décrivez le contact ou l’observation effectuée.",
        "errorRegister": "Impossible d’enregistrer l’interaction.",
        "successRegistered": "Interaction ajoutée à la chronologie."
      },
      "interactionTypes": {
        "whatsapp": "WhatsApp",
        "call": "Appel",
        "email": "E-mail",
        "meeting": "Réunion",
        "note": "Observation"
      },
      "interactionModal": {
        "kicker": "Historique commercial",
        "title": "Enregistrer une nouvelle interaction",
        "description": "L’enregistrement sera visible dans la Fiche 360° de {name}.",
        "type": "Type d’interaction",
        "descriptionLabel": "Description de l’interaction *",
        "placeholder": "Ex. : nous avons parlé des tarifs et le prospect a demandé un rappel la semaine prochaine..."
      }
    }
  },
  "pt-PT": {
    "AdminCommercialOverview": {
      "header": {
        "kicker": "Gestão institucional",
        "title": "Comercial",
        "description": "Gira leads, comerciais, objetivos, vendas, matrículas, comissões e resultados comerciais da instituição."
      },
      "errors": {
        "loadSummary": "Não foi possível carregar o resumo comercial."
      },
      "metrics": {
        "activeLeads": {
          "title": "Leads ativos",
          "description": "Leads em acompanhamento no funil comercial."
        },
        "periodSales": {
          "title": "Vendas no período",
          "description": "Matrículas confirmadas no mês atual."
        },
        "goals": {
          "title": "Objetivos atingidos",
          "progress": "{achieved} de {total} objetivo(s) do período.",
          "none": "Nenhum objetivo ativo no período."
        },
        "pendingCommissions": {
          "title": "Comissões pendentes",
          "pending": "{count, plural, one {# registo a aguardar análise.} other {# registos a aguardar análise.}}",
          "none": "Nenhuma comissão pendente no período."
        }
      },
      "resources": {
        "title": "Recursos do setor Comercial",
        "description": "Os recursos são disponibilizados gradualmente e respeitam as permissões departamentais e individuais já configuradas."
      },
      "statuses": {
        "available": "Disponível",
        "integrated": "Integração ativa"
      },
      "modules": {
        "leads": {
          "title": "Leads e oportunidades",
          "description": "Registe interessados, acompanhe contactos, etapas do funil e responsáveis.",
          "action": "Abrir leads e oportunidades"
        },
        "salespeople": {
          "title": "Comerciais",
          "description": "Gira os funcionários autorizados a atuar em vendas e matrículas.",
          "action": "Abrir funcionários"
        },
        "teams": {
          "title": "Equipas comerciais",
          "description": "Organize comerciais em equipas, defina lideranças e gira os seus membros.",
          "action": "Abrir equipas comerciais"
        },
        "goals": {
          "title": "Objetivos comerciais",
          "description": "Defina objetivos por comercial, equipa, curso, polo e período.",
          "action": "Abrir objetivos comerciais"
        },
        "salesEnrollments": {
          "title": "Vendas e matrículas",
          "description": "Acompanhe matrículas, valores negociados e comerciais responsáveis.",
          "action": "Abrir matrículas"
        },
        "commissions": {
          "title": "Comissões",
          "description": "Configure planos e regras para calcular e aprovar as comissões dos comerciais.",
          "action": "Abrir planos de comissão"
        },
        "reports": {
          "title": "Relatórios",
          "description": "Analise conversão, desempenho, leads, matrículas, vendas e resultados comerciais.",
          "action": "Abrir relatórios comerciais"
        }
      },
      "hrIntegration": {
        "title": "Integração com os RH",
        "description": "As comissões originadas por vendas e matrículas são calculadas e aprovadas no Comercial. Depois, podem ser enviadas aos RH e incluídas no recibo de vencimento do período correspondente. Bónus, prémios e participações continuam a ser tratados em Remuneração Variável."
      }
    },
    "AdminCommercialTeams": {
      "header": {
        "kicker": "Comercial",
        "title": "Equipas comerciais",
        "description": "Organize comerciais em equipas, defina lideranças e prepare a estrutura para objetivos coletivos e individuais."
      },
      "common": {
        "employee": "Funcionário",
        "noDepartment": "Sem departamento",
        "noDescription": "Sem descrição registada.",
        "noRole": "Cargo não indicado"
      },
      "metrics": {
        "total": "Total de equipas",
        "active": "Equipas ativas",
        "inactive": "Equipas inativas",
        "activeMembers": "Membros ativos",
        "linkedGoals": "Objetivos associados"
      },
      "filters": {
        "searchPlaceholder": "Pesquisar por equipa, líder ou membro",
        "active": "Equipas ativas",
        "inactive": "Equipas inativas",
        "all": "Todas as equipas"
      },
      "states": {
        "loading": "A carregar equipas comerciais...",
        "emptyTitle": "Nenhuma equipa encontrada",
        "emptyDescription": "Crie uma equipa ou ajuste os filtros da lista.",
        "loadingEmployees": "A carregar funcionários...",
        "noEmployees": "Nenhum funcionário encontrado."
      },
      "status": {
        "active": "Ativa",
        "inactive": "Inativa"
      },
      "card": {
        "teamLeader": "Líder da equipa",
        "noLeader": "Liderança não definida",
        "members": "Membros",
        "noMembers": "Nenhum membro ativo."
      },
      "actions": {
        "newTeam": "+ Nova equipa",
        "edit": "Editar equipa",
        "deactivate": "Desativar",
        "reactivate": "Reativar",
        "close": "Fechar",
        "cancel": "Cancelar",
        "saving": "A guardar...",
        "saveChanges": "Guardar alterações",
        "createTeam": "Criar equipa",
        "keepTeam": "Manter equipa",
        "deactivating": "A desativar...",
        "deactivateTeam": "Desativar equipa"
      },
      "modal": {
        "newTitle": "Nova equipa comercial",
        "editTitle": "Editar equipa comercial",
        "teamName": "Nome da equipa",
        "teamNamePlaceholder": "Ex.: Equipa Comercial Centro",
        "description": "Descrição",
        "descriptionPlaceholder": "Descreva a atuação desta equipa.",
        "teamLeader": "Líder da equipa",
        "noLeader": "Sem liderança definida",
        "leaderHelp": "O líder será incluído automaticamente como membro da equipa.",
        "members": "Membros da equipa",
        "membersDescription": "Selecione os funcionários que farão parte da equipa.",
        "selectedCount": "{count, plural, one {# selecionado} other {# selecionados}}",
        "searchEmployees": "Pesquisar funcionário, cargo ou departamento",
        "leaderBadge": "Líder",
        "activeTeam": "Equipa ativa",
        "activeTeamHelp": "As equipas inativas não devem receber novos objetivos."
      },
      "validation": {
        "teamName": "Indique o nome da equipa comercial."
      },
      "errors": {
        "loadTeams": "Não foi possível carregar as equipas comerciais.",
        "loadEmployees": "Não foi possível carregar os funcionários comerciais.",
        "saveTeam": "Não foi possível guardar a equipa comercial.",
        "deactivate": "Não foi possível desativar a equipa.",
        "reactivate": "Não foi possível reativar a equipa."
      },
      "success": {
        "created": "Equipa criada com sucesso.",
        "updated": "Equipa atualizada com sucesso.",
        "deactivated": "Equipa desativada com sucesso.",
        "reactivated": "Equipa reativada com sucesso."
      },
      "deactivateModal": {
        "title": "Desativar equipa comercial",
        "description": "A equipa <team></team> será desativada. O histórico e os objetivos já associados serão preservados."
      }
    },
    "AdminCommercialFunnels": {
      "breadcrumb": {
        "commercial": "Comercial",
        "salesFunnels": "Funis comerciais"
      },
      "header": {
        "title": "Configuração do funil comercial",
        "description": "Organize as etapas de atendimento, os prazos, as probabilidades de conversão e os motivos de perda das oportunidades."
      },
      "actions": {
        "refresh": "Atualizar",
        "refreshing": "A atualizar...",
        "processing": "A processar...",
        "createStructure": "Criar estrutura comercial",
        "linkPendingLeads": "Associar leads pendentes",
        "checkStructure": "Verificar estrutura",
        "initializeNow": "Inicializar agora",
        "initializing": "A inicializar...",
        "tryAgain": "Tentar novamente",
        "closeMessage": "Fechar mensagem"
      },
      "errors": {
        "load": "Não foi possível carregar os funis.",
        "initialize": "Não foi possível inicializar o funil.",
        "operationTitle": "Não foi possível concluir a operação"
      },
      "success": {
        "initialized": "Estrutura comercial inicializada."
      },
      "states": {
        "loading": "A carregar configuração comercial..."
      },
      "common": {
        "dateUnavailable": "Data indisponível",
        "noMaximumDeadline": "Sem prazo máximo",
        "hours": "{count}h",
        "days": "{count, plural, one {# dia} other {# dias}}",
        "active": "Ativo",
        "archived": "Arquivado",
        "required": "Obrigatória",
        "optional": "Opcional",
        "manual": "Manual",
        "automatic": "Automático"
      },
      "summary": {
        "status": {
          "title": "Situação",
          "configured": "Configurado",
          "pending": "Pendente",
          "available": "Funil predefinido disponível",
          "initializationRequired": "Inicialização necessária"
        },
        "funnels": {
          "title": "Funis",
          "description": "Registados na instituição"
        },
        "stages": {
          "title": "Etapas",
          "description": "No funil comercial predefinido"
        },
        "lossReasons": {
          "title": "Motivos de perda",
          "description": "Motivos disponíveis"
        },
        "pendingLeads": {
          "title": "Leads pendentes",
          "description": "De {count} leads registados"
        }
      },
      "initialization": {
        "title": "O CRM ainda precisa de ser inicializado",
        "description": "A inicialização criará o funil predefinido, as respetivas etapas, os motivos de perda e associará os leads antigos. Nenhum lead será apagado.",
        "noPermission": "Não tem permissão para inicializar esta estrutura."
      },
      "funnel": {
        "default": "Funil predefinido",
        "updatedAt": "Atualizado em {date}"
      },
      "stages": {
        "title": "Etapas do processo comercial",
        "count": "{count, plural, one {# etapa configurada} other {# etapas configuradas}}",
        "empty": "Nenhuma etapa registada neste funil."
      },
      "stageMetrics": {
        "conversion": "Conversão",
        "deadline": "Prazo",
        "nextAction": "Próxima ação",
        "movement": "Movimento"
      },
      "emptyFunnels": {
        "title": "Nenhum funil comercial registado",
        "description": "Inicialize a estrutura para criar o funil predefinido da instituição."
      },
      "lossReasons": {
        "title": "Motivos de perda",
        "description": "Motivos utilizados para compreender porque é que as oportunidades não foram convertidas.",
        "requiresObservation": "⚠ Exige observação complementar",
        "empty": "Nenhum motivo de perda registado."
      },
      "stageCategories": {
        "entry": "Entrada",
        "firstContact": "Primeiro contacto",
        "inService": "Em atendimento",
        "qualification": "Qualificação",
        "presentation": "Apresentação",
        "proposal": "Proposta",
        "negotiation": "Negociação",
        "documentation": "Documentação",
        "payment": "Pagamento",
        "conversion": "Conversão",
        "loss": "Perda",
        "pause": "Pausa",
        "discard": "Descarte"
      },
      "stageResults": {
        "open": "Em aberto",
        "won": "Ganha",
        "lost": "Perdida",
        "discarded": "Descartada"
      },
      "lossCategories": {
        "noInterest": "Sem interesse",
        "price": "Preço",
        "competition": "Concorrência",
        "noContact": "Sem contacto",
        "courseUnavailable": "Curso indisponível",
        "scheduleConflict": "Horário incompatível",
        "location": "Localização",
        "documentation": "Documentação",
        "financial": "Financeiro",
        "withdrawal": "Desistência",
        "duplicate": "Duplicidade",
        "outOfProfile": "Fora do perfil",
        "other": "Outro"
      }
    },
    "AdminCommercialLead360": {
      "breadcrumb": {
        "commercial": "Comercial",
        "leads": "Leads",
        "lead360": "Ficha 360°"
      },
      "header": {
        "leadNumber": "Lead #{id}",
        "description": "Histórico comercial completo, dados de atendimento e situação da oportunidade num único local."
      },
      "actions": {
        "pipeline": "← Pipeline",
        "leadList": "Lista de leads",
        "refresh": "Atualizar",
        "refreshing": "A atualizar...",
        "registerInteraction": "+ Registar interação",
        "registerInteractionPlain": "Registar interação",
        "registering": "A registar...",
        "tryAgain": "Tentar novamente",
        "backToPipeline": "Voltar ao Pipeline",
        "cancel": "Cancelar",
        "close": "Fechar"
      },
      "errors": {
        "invalidLeadId": "O identificador do lead é inválido.",
        "loadLead": "Não foi possível carregar a ficha do lead."
      },
      "loading": {
        "title": "A preparar a Ficha 360°...",
        "description": "A reunir contactos, funil, tarefas e matrícula."
      },
      "empty": {
        "title": "Não foi possível abrir a Ficha 360°",
        "notFound": "O lead não foi encontrado."
      },
      "common": {
        "notProvided": "Não indicado",
        "notDefined": "Não definido",
        "unassigned": "Não atribuído",
        "noResponsible": "Sem responsável",
        "noTeam": "Sem equipa",
        "noStage": "Sem etapa definida",
        "noFunnel": "Funil não definido",
        "noSalesTeam": "Sem equipa comercial"
      },
      "enum": {
        "low": "Baixa",
        "medium": "Média",
        "high": "Alta",
        "urgent": "Urgente",
        "new": "Novo",
        "inService": "Em atendimento",
        "qualified": "Qualificado",
        "converted": "Convertido",
        "lost": "Perdido",
        "archived": "Arquivado",
        "active": "Ativo",
        "inactive": "Inativo",
        "pending": "Pendente",
        "completed": "Concluído",
        "cancelled": "Cancelado"
      },
      "summary": {
        "currentStage": "Etapa atual",
        "responsible": "Responsável",
        "estimatedValue": "Valor estimado",
        "nextAction": "Próxima ação",
        "pendingTasks": "{count, plural, one {# tarefa pendente} other {# tarefas pendentes}}"
      },
      "quickContact": {
        "kicker": "Contacto rápido",
        "title": "Fale com o interessado",
        "call": "Ligar",
        "email": "E-mail",
        "addNote": "Adicionar observação"
      },
      "timeline": {
        "eventCount": "{count, plural, one {# evento registado} other {# eventos registados}}",
        "title": "Linha cronológica comercial",
        "description": "Contactos, movimentações, tarefas e decisões por ordem cronológica.",
        "filterAria": "Filtrar eventos",
        "scheduledFor": "Agendada para {date}",
        "registeredBy": "Registado por {name}",
        "systemRecord": "Registo automático do sistema",
        "emptyTitle": "Nenhum evento deste tipo nesta página",
        "emptyDescription": "Selecione outro filtro ou navegue pelas páginas.",
        "filters": {
          "all": "Tudo",
          "contacts": "Contactos",
          "funnel": "Funil",
          "tasks": "Tarefas",
          "transfers": "Transferências",
          "conversion": "Conversão"
        },
        "eventTypes": {
          "creation": "Criação",
          "contact": "Contacto",
          "funnel": "Funil",
          "transfer": "Transferência",
          "task": "Tarefa",
          "loss": "Perda",
          "archiving": "Arquivo",
          "restoration": "Restauro",
          "conversion": "Conversão"
        }
      },
      "pagination": {
        "page": "Página {current} de {total}",
        "previous": "Anterior",
        "next": "Seguinte"
      },
      "commercialSummary": {
        "kicker": "Situação atual",
        "title": "Resumo comercial",
        "status": "Estado",
        "stage": "Etapa",
        "funnel": "Funil",
        "responsible": "Responsável",
        "team": "Equipa"
      },
      "interest": {
        "kicker": "Interesse",
        "title": "Curso e unidade",
        "course": "Curso",
        "campus": "Polo",
        "organization": "Empresa / instituição",
        "source": "Origem",
        "initialNotes": "Observações iniciais"
      },
      "milestones": {
        "kicker": "Evolução",
        "title": "Marcos da relação",
        "created": "Lead criado",
        "firstContact": "Primeiro contacto",
        "qualified": "Qualificado",
        "converted": "Convertido",
        "notRecorded": "Ainda não registado"
      },
      "enrollment": {
        "kicker": "Conversão concluída",
        "title": "Matrícula associada",
        "convertedAt": "Convertido em",
        "open": "Abrir matrícula"
      },
      "loss": {
        "kicker": "Oportunidade perdida",
        "noAdditionalNote": "Nenhuma observação complementar registada."
      },
      "interaction": {
        "validationDescription": "Descreva o contacto ou a observação realizada.",
        "errorRegister": "Não foi possível registar a interação.",
        "successRegistered": "Interação registada na linha cronológica."
      },
      "interactionTypes": {
        "whatsapp": "WhatsApp",
        "call": "Chamada",
        "email": "E-mail",
        "meeting": "Reunião",
        "note": "Observação"
      },
      "interactionModal": {
        "kicker": "Histórico comercial",
        "title": "Registar nova interação",
        "description": "O registo ficará visível na Ficha 360° de {name}.",
        "type": "Tipo de interação",
        "descriptionLabel": "Descrição da interação *",
        "placeholder": "Ex.: falámos sobre valores e o interessado pediu contacto na próxima semana..."
      }
    }
  }
};

const raiz = process.cwd();
const locales = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"];

for (const locale of locales) {
  const arquivo = path.join(raiz, "messages", `${locale}.json`);

  if (!fs.existsSync(arquivo)) {
    throw new Error(`Arquivo não encontrado: ${arquivo}`);
  }

  const conteudo = fs
    .readFileSync(arquivo, "utf8")
    .replace(/^\uFEFF/, "");

  const mensagens = JSON.parse(conteudo);
  const namespaces = traducoes[locale];

  for (const [namespace, valores] of Object.entries(namespaces)) {
    mensagens[namespace] = valores;
  }

  fs.writeFileSync(
    arquivo,
    `${JSON.stringify(mensagens, null, 2)}\n`,
    "utf8"
  );

  console.log(
    `✓ ${locale}: ${Object.keys(namespaces).join(", ")} atualizados`
  );
}

console.log(
  "\nConcluído. As quatro páginas foram adicionadas/atualizadas nos cinco arquivos de idioma."
);
