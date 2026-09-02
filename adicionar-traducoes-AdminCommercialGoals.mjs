import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    "header": {
      "kicker": "Comercial",
      "title": "Metas comerciais",
      "description": "Defina objetivos para toda a instituição, equipes ou funcionários, com período, indicador, curso e polo opcionais.",
      "newGoal": "+ Nova meta"
    },
    "metrics": {
      "total": "Total de metas",
      "active": "Metas ativas",
      "drafts": "Rascunhos",
      "closed": "Encerradas",
      "canceled": "Canceladas"
    },
    "filters": {
      "searchPlaceholder": "Buscar meta, equipe, funcionário, curso ou polo",
      "allStatuses": "Todos os status",
      "allScopes": "Todos os escopos",
      "allIndicators": "Todos os indicadores",
      "statusAria": "Filtrar por status",
      "scopeAria": "Filtrar por escopo",
      "indicatorAria": "Filtrar por indicador"
    },
    "scope": {
      "institution": "Instituição",
      "team": "Equipe",
      "employee": "Funcionário"
    },
    "indicator": {
      "enrollments": "Quantidade de matrículas",
      "enrollmentsShort": "Matrículas",
      "soldAmount": "Valor vendido",
      "receivedAmount": "Valor recebido",
      "convertedLeads": "Leads convertidos"
    },
    "periodicity": {
      "monthly": "Mensal",
      "quarterly": "Trimestral",
      "semiannual": "Semestral",
      "annual": "Anual",
      "custom": "Personalizada"
    },
    "status": {
      "draft": "Rascunho",
      "active": "Ativa",
      "closed": "Encerrada",
      "canceled": "Cancelada"
    },
    "common": {
      "teamNotProvided": "Equipe não informada",
      "employeeNotProvided": "Funcionário não informado",
      "wholeInstitution": "Toda a instituição",
      "invalidDate": "Data inválida",
      "to": "a",
      "allCourses": "Todos os cursos",
      "allCampuses": "Todos os polos",
      "roleNotProvided": "Cargo não informado",
      "memberCount": "{count, plural, one {# membro} other {# membros}}",
      "selectedCount": "{count, plural, one {# selecionado} other {# selecionados}}"
    },
    "loading": "Carregando metas comerciais...",
    "empty": {
      "title": "Nenhuma meta encontrada",
      "description": "Cadastre uma meta comercial ou ajuste os filtros da listagem."
    },
    "card": {
      "noDescription": "Sem descrição cadastrada.",
      "definedGoal": "Meta definida",
      "progressTitle": "Acompanhamento da meta",
      "progressAuto": "Resultado calculado automaticamente pelos dados do PHANYX.",
      "achieved": "Meta atingida",
      "actual": "Realizado",
      "remaining": "Restante",
      "progress": "Progresso",
      "progressLabel": "Progresso da meta",
      "reached": "Meta alcançada",
      "aboveGoal": "{value}% acima do objetivo",
      "indicator": "Indicador",
      "responsible": "Responsável",
      "period": "Período",
      "segmentation": "Segmentação",
      "notes": "Observações"
    },
    "actions": {
      "edit": "Editar",
      "activate": "Ativar",
      "close": "Encerrar",
      "cancel": "Cancelar meta",
      "deleteDraft": "Excluir rascunho"
    },
    "modal": {
      "kicker": "Comercial",
      "editTitle": "Editar meta comercial",
      "newTitle": "Nova meta comercial",
      "close": "Fechar",
      "cancel": "Cancelar",
      "saving": "Salvando...",
      "saveChanges": "Salvar alterações",
      "createGoal": "Criar meta",
      "fields": {
        "name": "Nome da meta",
        "description": "Descrição",
        "scope": "Escopo",
        "indicator": "Indicador",
        "team": "Equipe responsável",
        "employee": "Funcionário responsável",
        "periodicity": "Periodicidade",
        "target": "Valor-alvo",
        "startDate": "Data inicial",
        "endDate": "Data final",
        "course": "Curso",
        "campus": "Polo",
        "initialStatus": "Situação inicial",
        "notes": "Observações internas"
      },
      "placeholders": {
        "name": "Ex.: Meta de matrículas do primeiro semestre",
        "description": "Descreva o objetivo desta meta.",
        "moneyTarget": "Ex.: 25.000,00",
        "quantityTarget": "Ex.: 100",
        "notes": "Registre critérios, orientações ou informações internas sobre a meta."
      },
      "scopeOptions": {
        "institution": "Toda a instituição",
        "team": "Equipe comercial",
        "employee": "Funcionário individual"
      },
      "selectTeam": "Selecione a equipe",
      "selectEmployee": "Selecione o funcionário",
      "helpers": {
        "moneyTarget": "Informe um valor monetário.",
        "quantityTarget": "Informe uma quantidade inteira."
      },
      "initialStatus": {
        "draftTitle": "Salvar como rascunho",
        "draftDescription": "Permite revisar a meta antes de ativá-la.",
        "activeTitle": "Criar como ativa",
        "activeDescription": "A meta já começa valendo para o período definido."
      }
    },
    "participants": {
      "title": "Participantes desta meta",
      "description": "Os membros da equipe são sugeridos automaticamente, mas você pode incluir outros funcionários da instituição somente nesta meta.",
      "selectTeamMembers": "Selecionar membros da equipe",
      "clearSelection": "Limpar seleção",
      "closeEmployees": "Fechar funcionários",
      "addOtherEmployees": "+ Adicionar outros funcionários",
      "teamMembers": "Membros da equipe",
      "teamMember": "Membro da equipe",
      "noActiveMembers": "Esta equipe não possui membros ativos. Você ainda pode adicionar outros funcionários à meta.",
      "additionalParticipants": "Participantes adicionais",
      "additionalParticipant": "Participante adicional",
      "addOtherEmployeesTitle": "Adicionar outros funcionários",
      "addOtherEmployeesDescription": "Selecionar um funcionário aqui não o adiciona à equipe comercial. Ele participará somente desta meta.",
      "searchPlaceholder": "Buscar por nome, cargo ou departamento",
      "noOtherEmployees": "Nenhum outro funcionário encontrado."
    },
    "confirmation": {
      "kicker": "Confirmação",
      "back": "Voltar",
      "processing": "Processando...",
      "activate": {
        "title": "Ativar meta comercial",
        "message": "A meta “{name}” passará a acompanhar oficialmente o período definido.",
        "action": "Ativar meta"
      },
      "close": {
        "title": "Encerrar meta comercial",
        "message": "A meta “{name}” será encerrada e não poderá ser reaberta ou editada.",
        "action": "Encerrar meta"
      },
      "cancel": {
        "title": "Cancelar meta comercial",
        "message": "A meta “{name}” será cancelada e seu histórico permanecerá preservado.",
        "action": "Cancelar meta"
      },
      "delete": {
        "title": "Excluir rascunho de meta",
        "message": "O rascunho “{name}” será excluído definitivamente. Esta ação é permitida somente para metas que ainda não foram ativadas.",
        "action": "Excluir rascunho"
      }
    },
    "errors": {
      "load": "Não foi possível carregar as metas comerciais.",
      "loadGeneric": "Erro ao carregar metas comerciais.",
      "lockedGoal": "Metas encerradas ou canceladas não podem mais ser alteradas.",
      "name": "Informe o nome da meta comercial.",
      "dates": "Informe a data inicial e a data final da meta.",
      "endBeforeStart": "A data final não pode ser anterior à data inicial.",
      "targetPositive": "Informe um valor-alvo maior que zero.",
      "integerTarget": "Para metas de quantidade, informe um número inteiro.",
      "team": "Selecione a equipe responsável pela meta.",
      "participant": "Selecione pelo menos um participante para a meta da equipe.",
      "employee": "Selecione o funcionário responsável pela meta.",
      "save": "Não foi possível salvar a meta comercial.",
      "saveGeneric": "Erro ao salvar a meta comercial.",
      "action": "Não foi possível concluir a ação sobre a meta.",
      "actionGeneric": "Erro ao processar a meta comercial."
    },
    "success": {
      "updated": "Meta comercial atualizada com sucesso.",
      "created": "Meta comercial criada com sucesso.",
      "action": "Ação concluída com sucesso."
    }
  },
  "pt-PT": {
    "header": {
      "kicker": "Comercial",
      "title": "Metas comerciais",
      "description": "Defina objetivos para toda a instituição, equipas ou funcionários, com período, indicador, curso e polo opcionais.",
      "newGoal": "+ Nova meta"
    },
    "metrics": {
      "total": "Total de metas",
      "active": "Metas ativas",
      "drafts": "Rascunhos",
      "closed": "Encerradas",
      "canceled": "Canceladas"
    },
    "filters": {
      "searchPlaceholder": "Pesquisar meta, equipa, funcionário, curso ou polo",
      "allStatuses": "Todos os estados",
      "allScopes": "Todos os âmbitos",
      "allIndicators": "Todos os indicadores",
      "statusAria": "Filtrar por estado",
      "scopeAria": "Filtrar por âmbito",
      "indicatorAria": "Filtrar por indicador"
    },
    "scope": {
      "institution": "Instituição",
      "team": "Equipa",
      "employee": "Funcionário"
    },
    "indicator": {
      "enrollments": "Quantidade de matrículas",
      "enrollmentsShort": "Matrículas",
      "soldAmount": "Valor vendido",
      "receivedAmount": "Valor recebido",
      "convertedLeads": "Leads convertidos"
    },
    "periodicity": {
      "monthly": "Mensal",
      "quarterly": "Trimestral",
      "semiannual": "Semestral",
      "annual": "Anual",
      "custom": "Personalizada"
    },
    "status": {
      "draft": "Rascunho",
      "active": "Ativa",
      "closed": "Encerrada",
      "canceled": "Cancelada"
    },
    "common": {
      "teamNotProvided": "Equipa não indicada",
      "employeeNotProvided": "Funcionário não indicado",
      "wholeInstitution": "Toda a instituição",
      "invalidDate": "Data inválida",
      "to": "a",
      "allCourses": "Todos os cursos",
      "allCampuses": "Todos os polos",
      "roleNotProvided": "Cargo não indicado",
      "memberCount": "{count, plural, one {# membro} other {# membros}}",
      "selectedCount": "{count, plural, one {# selecionado} other {# selecionados}}"
    },
    "loading": "A carregar metas comerciais...",
    "empty": {
      "title": "Nenhuma meta encontrada",
      "description": "Registe uma meta comercial ou ajuste os filtros da listagem."
    },
    "card": {
      "noDescription": "Sem descrição registada.",
      "definedGoal": "Meta definida",
      "progressTitle": "Acompanhamento da meta",
      "progressAuto": "Resultado calculado automaticamente com os dados do PHANYX.",
      "achieved": "Meta atingida",
      "actual": "Realizado",
      "remaining": "Restante",
      "progress": "Progresso",
      "progressLabel": "Progresso da meta",
      "reached": "Meta alcançada",
      "aboveGoal": "{value}% acima do objetivo",
      "indicator": "Indicador",
      "responsible": "Responsável",
      "period": "Período",
      "segmentation": "Segmentação",
      "notes": "Observações"
    },
    "actions": {
      "edit": "Editar",
      "activate": "Ativar",
      "close": "Encerrar",
      "cancel": "Cancelar meta",
      "deleteDraft": "Eliminar rascunho"
    },
    "modal": {
      "kicker": "Comercial",
      "editTitle": "Editar meta comercial",
      "newTitle": "Nova meta comercial",
      "close": "Fechar",
      "cancel": "Cancelar",
      "saving": "A guardar...",
      "saveChanges": "Guardar alterações",
      "createGoal": "Criar meta",
      "fields": {
        "name": "Nome da meta",
        "description": "Descrição",
        "scope": "Âmbito",
        "indicator": "Indicador",
        "team": "Equipa responsável",
        "employee": "Funcionário responsável",
        "periodicity": "Periodicidade",
        "target": "Valor-alvo",
        "startDate": "Data inicial",
        "endDate": "Data final",
        "course": "Curso",
        "campus": "Polo",
        "initialStatus": "Estado inicial",
        "notes": "Observações internas"
      },
      "placeholders": {
        "name": "Ex.: Meta de matrículas do primeiro semestre",
        "description": "Descreva o objetivo desta meta.",
        "moneyTarget": "Ex.: 25.000,00",
        "quantityTarget": "Ex.: 100",
        "notes": "Registe critérios, orientações ou informações internas sobre a meta."
      },
      "scopeOptions": {
        "institution": "Toda a instituição",
        "team": "Equipa comercial",
        "employee": "Funcionário individual"
      },
      "selectTeam": "Selecione a equipa",
      "selectEmployee": "Selecione o funcionário",
      "helpers": {
        "moneyTarget": "Indique um valor monetário.",
        "quantityTarget": "Indique uma quantidade inteira."
      },
      "initialStatus": {
        "draftTitle": "Guardar como rascunho",
        "draftDescription": "Permite rever a meta antes de a ativar.",
        "activeTitle": "Criar como ativa",
        "activeDescription": "A meta começa imediatamente a vigorar no período definido."
      }
    },
    "participants": {
      "title": "Participantes desta meta",
      "description": "Os membros da equipa são sugeridos automaticamente, mas pode incluir outros funcionários da instituição apenas nesta meta.",
      "selectTeamMembers": "Selecionar membros da equipa",
      "clearSelection": "Limpar seleção",
      "closeEmployees": "Fechar funcionários",
      "addOtherEmployees": "+ Adicionar outros funcionários",
      "teamMembers": "Membros da equipa",
      "teamMember": "Membro da equipa",
      "noActiveMembers": "Esta equipa não tem membros ativos. Ainda pode adicionar outros funcionários à meta.",
      "additionalParticipants": "Participantes adicionais",
      "additionalParticipant": "Participante adicional",
      "addOtherEmployeesTitle": "Adicionar outros funcionários",
      "addOtherEmployeesDescription": "Selecionar um funcionário aqui não o adiciona à equipa comercial. Participará apenas nesta meta.",
      "searchPlaceholder": "Pesquisar por nome, cargo ou departamento",
      "noOtherEmployees": "Nenhum outro funcionário encontrado."
    },
    "confirmation": {
      "kicker": "Confirmação",
      "back": "Voltar",
      "processing": "A processar...",
      "activate": {
        "title": "Ativar meta comercial",
        "message": "A meta “{name}” passará a acompanhar oficialmente o período definido.",
        "action": "Ativar meta"
      },
      "close": {
        "title": "Encerrar meta comercial",
        "message": "A meta “{name}” será encerrada e não poderá ser reaberta nem editada.",
        "action": "Encerrar meta"
      },
      "cancel": {
        "title": "Cancelar meta comercial",
        "message": "A meta “{name}” será cancelada e o respetivo histórico será preservado.",
        "action": "Cancelar meta"
      },
      "delete": {
        "title": "Eliminar rascunho da meta",
        "message": "O rascunho “{name}” será eliminado definitivamente. Esta ação só é permitida para metas que ainda não foram ativadas.",
        "action": "Eliminar rascunho"
      }
    },
    "errors": {
      "load": "Não foi possível carregar as metas comerciais.",
      "loadGeneric": "Erro ao carregar metas comerciais.",
      "lockedGoal": "As metas encerradas ou canceladas já não podem ser alteradas.",
      "name": "Indique o nome da meta comercial.",
      "dates": "Indique a data inicial e a data final da meta.",
      "endBeforeStart": "A data final não pode ser anterior à data inicial.",
      "targetPositive": "Indique um valor-alvo superior a zero.",
      "integerTarget": "Para metas de quantidade, indique um número inteiro.",
      "team": "Selecione a equipa responsável pela meta.",
      "participant": "Selecione pelo menos um participante para a meta da equipa.",
      "employee": "Selecione o funcionário responsável pela meta.",
      "save": "Não foi possível guardar a meta comercial.",
      "saveGeneric": "Erro ao guardar a meta comercial.",
      "action": "Não foi possível concluir a ação sobre a meta.",
      "actionGeneric": "Erro ao processar a meta comercial."
    },
    "success": {
      "updated": "Meta comercial atualizada com sucesso.",
      "created": "Meta comercial criada com sucesso.",
      "action": "Ação concluída com sucesso."
    }
  },
  "en-US": {
    "header": {
      "kicker": "Sales",
      "title": "Sales goals",
      "description": "Set goals for the entire institution, teams, or employees, with optional period, indicator, course, and campus filters.",
      "newGoal": "+ New goal"
    },
    "metrics": {
      "total": "Total goals",
      "active": "Active goals",
      "drafts": "Drafts",
      "closed": "Closed",
      "canceled": "Canceled"
    },
    "filters": {
      "searchPlaceholder": "Search goal, team, employee, course, or campus",
      "allStatuses": "All statuses",
      "allScopes": "All scopes",
      "allIndicators": "All indicators",
      "statusAria": "Filter by status",
      "scopeAria": "Filter by scope",
      "indicatorAria": "Filter by indicator"
    },
    "scope": {
      "institution": "Institution",
      "team": "Team",
      "employee": "Employee"
    },
    "indicator": {
      "enrollments": "Number of enrollments",
      "enrollmentsShort": "Enrollments",
      "soldAmount": "Amount sold",
      "receivedAmount": "Amount received",
      "convertedLeads": "Converted leads"
    },
    "periodicity": {
      "monthly": "Monthly",
      "quarterly": "Quarterly",
      "semiannual": "Semiannual",
      "annual": "Annual",
      "custom": "Custom"
    },
    "status": {
      "draft": "Draft",
      "active": "Active",
      "closed": "Closed",
      "canceled": "Canceled"
    },
    "common": {
      "teamNotProvided": "Team not provided",
      "employeeNotProvided": "Employee not provided",
      "wholeInstitution": "Entire institution",
      "invalidDate": "Invalid date",
      "to": "to",
      "allCourses": "All courses",
      "allCampuses": "All campuses",
      "roleNotProvided": "Role not provided",
      "memberCount": "{count, plural, one {# member} other {# members}}",
      "selectedCount": "{count, plural, one {# selected} other {# selected}}"
    },
    "loading": "Loading sales goals...",
    "empty": {
      "title": "No goals found",
      "description": "Create a sales goal or adjust the list filters."
    },
    "card": {
      "noDescription": "No description provided.",
      "definedGoal": "Target",
      "progressTitle": "Goal tracking",
      "progressAuto": "Result calculated automatically from PHANYX data.",
      "achieved": "Goal achieved",
      "actual": "Completed",
      "remaining": "Remaining",
      "progress": "Progress",
      "progressLabel": "Goal progress",
      "reached": "Goal reached",
      "aboveGoal": "{value}% above target",
      "indicator": "Indicator",
      "responsible": "Responsible",
      "period": "Period",
      "segmentation": "Segmentation",
      "notes": "Notes"
    },
    "actions": {
      "edit": "Edit",
      "activate": "Activate",
      "close": "Close",
      "cancel": "Cancel goal",
      "deleteDraft": "Delete draft"
    },
    "modal": {
      "kicker": "Sales",
      "editTitle": "Edit sales goal",
      "newTitle": "New sales goal",
      "close": "Close",
      "cancel": "Cancel",
      "saving": "Saving...",
      "saveChanges": "Save changes",
      "createGoal": "Create goal",
      "fields": {
        "name": "Goal name",
        "description": "Description",
        "scope": "Scope",
        "indicator": "Indicator",
        "team": "Responsible team",
        "employee": "Responsible employee",
        "periodicity": "Periodicity",
        "target": "Target value",
        "startDate": "Start date",
        "endDate": "End date",
        "course": "Course",
        "campus": "Campus",
        "initialStatus": "Initial status",
        "notes": "Internal notes"
      },
      "placeholders": {
        "name": "e.g. First-semester enrollment goal",
        "description": "Describe the purpose of this goal.",
        "moneyTarget": "e.g. 25,000.00",
        "quantityTarget": "e.g. 100",
        "notes": "Record criteria, guidance, or internal information about this goal."
      },
      "scopeOptions": {
        "institution": "Entire institution",
        "team": "Sales team",
        "employee": "Individual employee"
      },
      "selectTeam": "Select the team",
      "selectEmployee": "Select the employee",
      "helpers": {
        "moneyTarget": "Enter a monetary amount.",
        "quantityTarget": "Enter a whole number."
      },
      "initialStatus": {
        "draftTitle": "Save as draft",
        "draftDescription": "Lets you review the goal before activating it.",
        "activeTitle": "Create as active",
        "activeDescription": "The goal becomes effective immediately for the defined period."
      }
    },
    "participants": {
      "title": "Participants in this goal",
      "description": "Team members are suggested automatically, but you can include other institution employees only for this goal.",
      "selectTeamMembers": "Select team members",
      "clearSelection": "Clear selection",
      "closeEmployees": "Close employees",
      "addOtherEmployees": "+ Add other employees",
      "teamMembers": "Team members",
      "teamMember": "Team member",
      "noActiveMembers": "This team has no active members. You can still add other employees to the goal.",
      "additionalParticipants": "Additional participants",
      "additionalParticipant": "Additional participant",
      "addOtherEmployeesTitle": "Add other employees",
      "addOtherEmployeesDescription": "Selecting an employee here does not add them to the sales team. They will participate only in this goal.",
      "searchPlaceholder": "Search by name, role, or department",
      "noOtherEmployees": "No other employees found."
    },
    "confirmation": {
      "kicker": "Confirmation",
      "back": "Back",
      "processing": "Processing...",
      "activate": {
        "title": "Activate sales goal",
        "message": "The goal “{name}” will officially begin tracking the defined period.",
        "action": "Activate goal"
      },
      "close": {
        "title": "Close sales goal",
        "message": "The goal “{name}” will be closed and can no longer be reopened or edited.",
        "action": "Close goal"
      },
      "cancel": {
        "title": "Cancel sales goal",
        "message": "The goal “{name}” will be canceled and its history will be preserved.",
        "action": "Cancel goal"
      },
      "delete": {
        "title": "Delete goal draft",
        "message": "The draft “{name}” will be permanently deleted. This action is allowed only for goals that have never been activated.",
        "action": "Delete draft"
      }
    },
    "errors": {
      "load": "Could not load sales goals.",
      "loadGeneric": "Error loading sales goals.",
      "lockedGoal": "Closed or canceled goals can no longer be changed.",
      "name": "Enter the sales goal name.",
      "dates": "Enter the goal start and end dates.",
      "endBeforeStart": "The end date cannot be earlier than the start date.",
      "targetPositive": "Enter a target value greater than zero.",
      "integerTarget": "For quantity goals, enter a whole number.",
      "team": "Select the team responsible for the goal.",
      "participant": "Select at least one participant for the team goal.",
      "employee": "Select the employee responsible for the goal.",
      "save": "Could not save the sales goal.",
      "saveGeneric": "Error saving the sales goal.",
      "action": "Could not complete the action for this goal.",
      "actionGeneric": "Error processing the sales goal."
    },
    "success": {
      "updated": "Sales goal updated successfully.",
      "created": "Sales goal created successfully.",
      "action": "Action completed successfully."
    }
  },
  "es-ES": {
    "header": {
      "kicker": "Comercial",
      "title": "Objetivos comerciales",
      "description": "Define objetivos para toda la institución, equipos o empleados, con período, indicador, curso y sede opcionales.",
      "newGoal": "+ Nuevo objetivo"
    },
    "metrics": {
      "total": "Total de objetivos",
      "active": "Objetivos activos",
      "drafts": "Borradores",
      "closed": "Cerrados",
      "canceled": "Cancelados"
    },
    "filters": {
      "searchPlaceholder": "Buscar objetivo, equipo, empleado, curso o sede",
      "allStatuses": "Todos los estados",
      "allScopes": "Todos los ámbitos",
      "allIndicators": "Todos los indicadores",
      "statusAria": "Filtrar por estado",
      "scopeAria": "Filtrar por ámbito",
      "indicatorAria": "Filtrar por indicador"
    },
    "scope": {
      "institution": "Institución",
      "team": "Equipo",
      "employee": "Empleado"
    },
    "indicator": {
      "enrollments": "Cantidad de matrículas",
      "enrollmentsShort": "Matrículas",
      "soldAmount": "Importe vendido",
      "receivedAmount": "Importe recibido",
      "convertedLeads": "Leads convertidos"
    },
    "periodicity": {
      "monthly": "Mensual",
      "quarterly": "Trimestral",
      "semiannual": "Semestral",
      "annual": "Anual",
      "custom": "Personalizada"
    },
    "status": {
      "draft": "Borrador",
      "active": "Activo",
      "closed": "Cerrado",
      "canceled": "Cancelado"
    },
    "common": {
      "teamNotProvided": "Equipo no informado",
      "employeeNotProvided": "Empleado no informado",
      "wholeInstitution": "Toda la institución",
      "invalidDate": "Fecha no válida",
      "to": "a",
      "allCourses": "Todos los cursos",
      "allCampuses": "Todas las sedes",
      "roleNotProvided": "Cargo no informado",
      "memberCount": "{count, plural, one {# miembro} other {# miembros}}",
      "selectedCount": "{count, plural, one {# seleccionado} other {# seleccionados}}"
    },
    "loading": "Cargando objetivos comerciales...",
    "empty": {
      "title": "No se encontraron objetivos",
      "description": "Crea un objetivo comercial o ajusta los filtros de la lista."
    },
    "card": {
      "noDescription": "Sin descripción registrada.",
      "definedGoal": "Objetivo definido",
      "progressTitle": "Seguimiento del objetivo",
      "progressAuto": "Resultado calculado automáticamente con los datos de PHANYX.",
      "achieved": "Objetivo alcanzado",
      "actual": "Realizado",
      "remaining": "Restante",
      "progress": "Progreso",
      "progressLabel": "Progreso del objetivo",
      "reached": "Objetivo alcanzado",
      "aboveGoal": "{value}% por encima del objetivo",
      "indicator": "Indicador",
      "responsible": "Responsable",
      "period": "Período",
      "segmentation": "Segmentación",
      "notes": "Observaciones"
    },
    "actions": {
      "edit": "Editar",
      "activate": "Activar",
      "close": "Cerrar",
      "cancel": "Cancelar objetivo",
      "deleteDraft": "Eliminar borrador"
    },
    "modal": {
      "kicker": "Comercial",
      "editTitle": "Editar objetivo comercial",
      "newTitle": "Nuevo objetivo comercial",
      "close": "Cerrar",
      "cancel": "Cancelar",
      "saving": "Guardando...",
      "saveChanges": "Guardar cambios",
      "createGoal": "Crear objetivo",
      "fields": {
        "name": "Nombre del objetivo",
        "description": "Descripción",
        "scope": "Ámbito",
        "indicator": "Indicador",
        "team": "Equipo responsable",
        "employee": "Empleado responsable",
        "periodicity": "Periodicidad",
        "target": "Valor objetivo",
        "startDate": "Fecha inicial",
        "endDate": "Fecha final",
        "course": "Curso",
        "campus": "Sede",
        "initialStatus": "Estado inicial",
        "notes": "Observaciones internas"
      },
      "placeholders": {
        "name": "Ej.: Objetivo de matrículas del primer semestre",
        "description": "Describe la finalidad de este objetivo.",
        "moneyTarget": "Ej.: 25.000,00",
        "quantityTarget": "Ej.: 100",
        "notes": "Registra criterios, orientaciones o información interna sobre el objetivo."
      },
      "scopeOptions": {
        "institution": "Toda la institución",
        "team": "Equipo comercial",
        "employee": "Empleado individual"
      },
      "selectTeam": "Selecciona el equipo",
      "selectEmployee": "Selecciona el empleado",
      "helpers": {
        "moneyTarget": "Introduce un importe monetario.",
        "quantityTarget": "Introduce una cantidad entera."
      },
      "initialStatus": {
        "draftTitle": "Guardar como borrador",
        "draftDescription": "Permite revisar el objetivo antes de activarlo.",
        "activeTitle": "Crear como activo",
        "activeDescription": "El objetivo comienza a aplicarse inmediatamente durante el período definido."
      }
    },
    "participants": {
      "title": "Participantes de este objetivo",
      "description": "Los miembros del equipo se sugieren automáticamente, pero puedes incluir otros empleados de la institución solo para este objetivo.",
      "selectTeamMembers": "Seleccionar miembros del equipo",
      "clearSelection": "Limpiar selección",
      "closeEmployees": "Cerrar empleados",
      "addOtherEmployees": "+ Añadir otros empleados",
      "teamMembers": "Miembros del equipo",
      "teamMember": "Miembro del equipo",
      "noActiveMembers": "Este equipo no tiene miembros activos. Aun así, puedes añadir otros empleados al objetivo.",
      "additionalParticipants": "Participantes adicionales",
      "additionalParticipant": "Participante adicional",
      "addOtherEmployeesTitle": "Añadir otros empleados",
      "addOtherEmployeesDescription": "Seleccionar un empleado aquí no lo añade al equipo comercial. Participará únicamente en este objetivo.",
      "searchPlaceholder": "Buscar por nombre, cargo o departamento",
      "noOtherEmployees": "No se encontraron otros empleados."
    },
    "confirmation": {
      "kicker": "Confirmación",
      "back": "Volver",
      "processing": "Procesando...",
      "activate": {
        "title": "Activar objetivo comercial",
        "message": "El objetivo “{name}” comenzará a realizar el seguimiento oficial del período definido.",
        "action": "Activar objetivo"
      },
      "close": {
        "title": "Cerrar objetivo comercial",
        "message": "El objetivo “{name}” se cerrará y ya no podrá reabrirse ni editarse.",
        "action": "Cerrar objetivo"
      },
      "cancel": {
        "title": "Cancelar objetivo comercial",
        "message": "El objetivo “{name}” se cancelará y se conservará su historial.",
        "action": "Cancelar objetivo"
      },
      "delete": {
        "title": "Eliminar borrador del objetivo",
        "message": "El borrador “{name}” se eliminará definitivamente. Esta acción solo está permitida para objetivos que nunca se hayan activado.",
        "action": "Eliminar borrador"
      }
    },
    "errors": {
      "load": "No se pudieron cargar los objetivos comerciales.",
      "loadGeneric": "Error al cargar los objetivos comerciales.",
      "lockedGoal": "Los objetivos cerrados o cancelados ya no pueden modificarse.",
      "name": "Introduce el nombre del objetivo comercial.",
      "dates": "Introduce la fecha inicial y la fecha final del objetivo.",
      "endBeforeStart": "La fecha final no puede ser anterior a la fecha inicial.",
      "targetPositive": "Introduce un valor objetivo mayor que cero.",
      "integerTarget": "Para objetivos de cantidad, introduce un número entero.",
      "team": "Selecciona el equipo responsable del objetivo.",
      "participant": "Selecciona al menos un participante para el objetivo del equipo.",
      "employee": "Selecciona el empleado responsable del objetivo.",
      "save": "No se pudo guardar el objetivo comercial.",
      "saveGeneric": "Error al guardar el objetivo comercial.",
      "action": "No se pudo completar la acción sobre el objetivo.",
      "actionGeneric": "Error al procesar el objetivo comercial."
    },
    "success": {
      "updated": "Objetivo comercial actualizado correctamente.",
      "created": "Objetivo comercial creado correctamente.",
      "action": "Acción completada correctamente."
    }
  },
  "fr-FR": {
    "header": {
      "kicker": "Commercial",
      "title": "Objectifs commerciaux",
      "description": "Définissez des objectifs pour l’ensemble de l’établissement, les équipes ou les employés, avec période, indicateur, cours et site facultatifs.",
      "newGoal": "+ Nouvel objectif"
    },
    "metrics": {
      "total": "Total des objectifs",
      "active": "Objectifs actifs",
      "drafts": "Brouillons",
      "closed": "Clôturés",
      "canceled": "Annulés"
    },
    "filters": {
      "searchPlaceholder": "Rechercher un objectif, une équipe, un employé, un cours ou un site",
      "allStatuses": "Tous les statuts",
      "allScopes": "Tous les périmètres",
      "allIndicators": "Tous les indicateurs",
      "statusAria": "Filtrer par statut",
      "scopeAria": "Filtrer par périmètre",
      "indicatorAria": "Filtrer par indicateur"
    },
    "scope": {
      "institution": "Établissement",
      "team": "Équipe",
      "employee": "Employé"
    },
    "indicator": {
      "enrollments": "Nombre d’inscriptions",
      "enrollmentsShort": "Inscriptions",
      "soldAmount": "Montant vendu",
      "receivedAmount": "Montant encaissé",
      "convertedLeads": "Prospects convertis"
    },
    "periodicity": {
      "monthly": "Mensuelle",
      "quarterly": "Trimestrielle",
      "semiannual": "Semestrielle",
      "annual": "Annuelle",
      "custom": "Personnalisée"
    },
    "status": {
      "draft": "Brouillon",
      "active": "Actif",
      "closed": "Clôturé",
      "canceled": "Annulé"
    },
    "common": {
      "teamNotProvided": "Équipe non renseignée",
      "employeeNotProvided": "Employé non renseigné",
      "wholeInstitution": "Tout l’établissement",
      "invalidDate": "Date invalide",
      "to": "au",
      "allCourses": "Tous les cours",
      "allCampuses": "Tous les sites",
      "roleNotProvided": "Poste non renseigné",
      "memberCount": "{count, plural, one {# membre} other {# membres}}",
      "selectedCount": "{count, plural, one {# sélectionné} other {# sélectionnés}}"
    },
    "loading": "Chargement des objectifs commerciaux...",
    "empty": {
      "title": "Aucun objectif trouvé",
      "description": "Créez un objectif commercial ou ajustez les filtres de la liste."
    },
    "card": {
      "noDescription": "Aucune description renseignée.",
      "definedGoal": "Objectif défini",
      "progressTitle": "Suivi de l’objectif",
      "progressAuto": "Résultat calculé automatiquement à partir des données PHANYX.",
      "achieved": "Objectif atteint",
      "actual": "Réalisé",
      "remaining": "Restant",
      "progress": "Progression",
      "progressLabel": "Progression de l’objectif",
      "reached": "Objectif atteint",
      "aboveGoal": "{value}% au-dessus de l’objectif",
      "indicator": "Indicateur",
      "responsible": "Responsable",
      "period": "Période",
      "segmentation": "Segmentation",
      "notes": "Observations"
    },
    "actions": {
      "edit": "Modifier",
      "activate": "Activer",
      "close": "Clôturer",
      "cancel": "Annuler l’objectif",
      "deleteDraft": "Supprimer le brouillon"
    },
    "modal": {
      "kicker": "Commercial",
      "editTitle": "Modifier l’objectif commercial",
      "newTitle": "Nouvel objectif commercial",
      "close": "Fermer",
      "cancel": "Annuler",
      "saving": "Enregistrement...",
      "saveChanges": "Enregistrer les modifications",
      "createGoal": "Créer l’objectif",
      "fields": {
        "name": "Nom de l’objectif",
        "description": "Description",
        "scope": "Périmètre",
        "indicator": "Indicateur",
        "team": "Équipe responsable",
        "employee": "Employé responsable",
        "periodicity": "Périodicité",
        "target": "Valeur cible",
        "startDate": "Date de début",
        "endDate": "Date de fin",
        "course": "Cours",
        "campus": "Site",
        "initialStatus": "Statut initial",
        "notes": "Observations internes"
      },
      "placeholders": {
        "name": "Ex. : Objectif d’inscriptions du premier semestre",
        "description": "Décrivez l’objectif visé.",
        "moneyTarget": "Ex. : 25 000,00",
        "quantityTarget": "Ex. : 100",
        "notes": "Consignez les critères, consignes ou informations internes concernant l’objectif."
      },
      "scopeOptions": {
        "institution": "Tout l’établissement",
        "team": "Équipe commerciale",
        "employee": "Employé individuel"
      },
      "selectTeam": "Sélectionnez l’équipe",
      "selectEmployee": "Sélectionnez l’employé",
      "helpers": {
        "moneyTarget": "Saisissez un montant monétaire.",
        "quantityTarget": "Saisissez une quantité entière."
      },
      "initialStatus": {
        "draftTitle": "Enregistrer comme brouillon",
        "draftDescription": "Permet de vérifier l’objectif avant de l’activer.",
        "activeTitle": "Créer comme actif",
        "activeDescription": "L’objectif entre immédiatement en vigueur pour la période définie."
      }
    },
    "participants": {
      "title": "Participants à cet objectif",
      "description": "Les membres de l’équipe sont proposés automatiquement, mais vous pouvez inclure d’autres employés de l’établissement uniquement pour cet objectif.",
      "selectTeamMembers": "Sélectionner les membres de l’équipe",
      "clearSelection": "Effacer la sélection",
      "closeEmployees": "Fermer les employés",
      "addOtherEmployees": "+ Ajouter d’autres employés",
      "teamMembers": "Membres de l’équipe",
      "teamMember": "Membre de l’équipe",
      "noActiveMembers": "Cette équipe ne compte aucun membre actif. Vous pouvez néanmoins ajouter d’autres employés à l’objectif.",
      "additionalParticipants": "Participants supplémentaires",
      "additionalParticipant": "Participant supplémentaire",
      "addOtherEmployeesTitle": "Ajouter d’autres employés",
      "addOtherEmployeesDescription": "Sélectionner un employé ici ne l’ajoute pas à l’équipe commerciale. Il participera uniquement à cet objectif.",
      "searchPlaceholder": "Rechercher par nom, poste ou département",
      "noOtherEmployees": "Aucun autre employé trouvé."
    },
    "confirmation": {
      "kicker": "Confirmation",
      "back": "Retour",
      "processing": "Traitement...",
      "activate": {
        "title": "Activer l’objectif commercial",
        "message": "L’objectif « {name} » commencera officiellement à suivre la période définie.",
        "action": "Activer l’objectif"
      },
      "close": {
        "title": "Clôturer l’objectif commercial",
        "message": "L’objectif « {name} » sera clôturé et ne pourra plus être rouvert ni modifié.",
        "action": "Clôturer l’objectif"
      },
      "cancel": {
        "title": "Annuler l’objectif commercial",
        "message": "L’objectif « {name} » sera annulé et son historique sera conservé.",
        "action": "Annuler l’objectif"
      },
      "delete": {
        "title": "Supprimer le brouillon de l’objectif",
        "message": "Le brouillon « {name} » sera définitivement supprimé. Cette action n’est autorisée que pour les objectifs qui n’ont jamais été activés.",
        "action": "Supprimer le brouillon"
      }
    },
    "errors": {
      "load": "Impossible de charger les objectifs commerciaux.",
      "loadGeneric": "Erreur lors du chargement des objectifs commerciaux.",
      "lockedGoal": "Les objectifs clôturés ou annulés ne peuvent plus être modifiés.",
      "name": "Saisissez le nom de l’objectif commercial.",
      "dates": "Saisissez les dates de début et de fin de l’objectif.",
      "endBeforeStart": "La date de fin ne peut pas être antérieure à la date de début.",
      "targetPositive": "Saisissez une valeur cible supérieure à zéro.",
      "integerTarget": "Pour les objectifs quantitatifs, saisissez un nombre entier.",
      "team": "Sélectionnez l’équipe responsable de l’objectif.",
      "participant": "Sélectionnez au moins un participant pour l’objectif de l’équipe.",
      "employee": "Sélectionnez l’employé responsable de l’objectif.",
      "save": "Impossible d’enregistrer l’objectif commercial.",
      "saveGeneric": "Erreur lors de l’enregistrement de l’objectif commercial.",
      "action": "Impossible d’effectuer l’action sur cet objectif.",
      "actionGeneric": "Erreur lors du traitement de l’objectif commercial."
    },
    "success": {
      "updated": "Objectif commercial mis à jour avec succès.",
      "created": "Objectif commercial créé avec succès.",
      "action": "Action effectuée avec succès."
    }
  }
};

const arquivos = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"];

for (const locale of arquivos) {
  const arquivo = path.join(process.cwd(), "messages", `${locale}.json`);

  if (!fs.existsSync(arquivo)) {
    console.error(`✗ ${locale}: arquivo não encontrado em ${arquivo}`);
    process.exitCode = 1;
    continue;
  }

  const atual = JSON.parse(fs.readFileSync(arquivo, "utf8"));
  atual.AdminCommercialGoals = traducoes[locale];

  fs.writeFileSync(
    arquivo,
    JSON.stringify(atual, null, 2) + "\n",
    "utf8"
  );

  console.log(`✓ ${locale}: AdminCommercialGoals atualizado`);
}

console.log("\nConcluído. As traduções de Metas comerciais foram atualizadas nos cinco idiomas.");
