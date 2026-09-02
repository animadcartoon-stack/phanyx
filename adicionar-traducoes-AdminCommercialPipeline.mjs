import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    "header": {
      "sales": "Comercial",
      "pipeline": "Pipeline",
      "title": "Pipeline comercial",
      "description": "Acompanhe cada oportunidade, identifique atrasos e organize as próximas ações do setor comercial.",
      "viewLeadList": "Ver lista de leads",
      "configureFunnel": "Configurar funil",
      "updating": "Atualizando...",
      "update": "Atualizar"
    },
    "filters": {
      "searchLabel": "Buscar oportunidades",
      "searchPlaceholder": "Nome, e-mail, telefone, interesse...",
      "priority": "Prioridade",
      "allPriorities": "Todas",
      "onlyMine": "Somente meus leads"
    },
    "summary": {
      "activeFunnel": "Funil ativo",
      "opportunities": "Oportunidades",
      "estimatedValue": "Valor estimado",
      "view": "Visualização",
      "myLeads": "Meus leads",
      "wholeTeam": "Toda a equipe"
    },
    "stages": {
      "title": "Etapas do funil",
      "scrollHelp": "Role horizontalmente para visualizar todas as etapas.",
      "updatingData": "Atualizando dados...",
      "stage": "Etapa {number}",
      "value": "Valor",
      "probability": "Probabilidade",
      "empty": "Nenhuma oportunidade nesta etapa.",
      "moreLeads": "Existem mais leads nesta etapa"
    },
    "lead": {
      "noInterest": "Interesse não informado",
      "responsible": "Responsável",
      "course": "Curso",
      "campus": "Polo",
      "value": "Valor",
      "stageOverdue": "Etapa com prazo vencido",
      "followUpOverdue": "Acompanhamento atrasado",
      "noNextAction": "Próxima ação não definida",
      "nextAction": "Próxima ação",
      "enrollment": "Matrícula",
      "moveStage": "Mover etapa"
    },
    "common": {
      "notDefined": "Não definido",
      "invalidDate": "Data inválida"
    },
    "loading": "Carregando pipeline comercial...",
    "priority": {
      "low": "Baixa",
      "medium": "Média",
      "high": "Alta",
      "urgent": "Urgente"
    },
    "taskTypes": {
      "call": "Ligação",
      "email": "E-mail",
      "meeting": "Reunião",
      "followUp": "Retorno",
      "sendProposal": "Enviar proposta",
      "requestDocuments": "Solicitar documentos",
      "confirmPayment": "Confirmar pagamento",
      "other": "Outra"
    },
    "categories": {
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
    "errors": {
      "load": "Não foi possível carregar o pipeline.",
      "loadTitle": "Não foi possível carregar o pipeline",
      "tryAgain": "Tentar novamente",
      "noMovePermission": "Você não possui permissão para movimentar leads."
    },
    "movement": {
      "kicker": "Movimentação do pipeline",
      "title": "Mover {name}",
      "description": "A alteração ficará registrada no histórico comercial do lead.",
      "closeAria": "Fechar movimentação",
      "currentStage": "Etapa atual",
      "responsible": "Responsável",
      "destinationStage": "Etapa de destino",
      "selectStage": "Selecione a nova etapa",
      "movementNote": "Observação da movimentação",
      "movementNotePlaceholder": "Ex.: lead respondeu, proposta aceita, documentos recebidos...",
      "selectLossReason": "Selecione o motivo",
      "stageSuffix": {
        "automatic": " — automática",
        "noPermission": " — sem permissão",
        "requiresEnrollment": " — exige matrícula"
      },
      "loss": {
        "title": "Registro da perda",
        "description": "O motivo será usado nos relatórios de conversão e melhoria comercial.",
        "reason": "Motivo da perda",
        "observation": "Observação complementar",
        "observationPlaceholder": "Registre os detalhes que ajudarão a compreender a perda.",
        "observationRequired": "Este motivo exige observação."
      },
      "nextAction": {
        "title": "Próxima ação",
        "description": "Mantenha o acompanhamento do lead com data, canal e prioridade definidos.",
        "alreadyDefined": "Próxima ação já definida",
        "required": "Próxima ação obrigatória",
        "schedule": "Agendar uma próxima ação",
        "requiredDescription": "A etapa selecionada exige uma tarefa pendente.",
        "noResponsible": "O lead ainda não possui responsável. Defina o responsável antes de movimentá-lo para esta etapa.",
        "actionType": "Tipo de ação",
        "priority": "Prioridade",
        "taskTitle": "Título",
        "taskTitlePlaceholder": "Próxima ação — {stage}",
        "scheduledFor": "Agendada para",
        "deadline": "Data limite",
        "reminder": "Lembrete",
        "responsible": "Responsável",
        "instructions": "Orientações da tarefa",
        "instructionsPlaceholder": "Descreva o que deverá ser feito no próximo contato."
      },
      "errors": {
        "selectStage": "Selecione a etapa de destino.",
        "automaticStage": "Esta etapa é controlada automaticamente pelo sistema.",
        "requiresEnrollment": "O lead somente pode ser convertido depois da criação de uma matrícula válida.",
        "enrollmentKeepsConverted": "Este lead possui matrícula válida e deve permanecer convertido.",
        "noLossPermission": "Você não possui permissão para registrar perdas comerciais.",
        "lossReason": "Selecione o motivo da perda.",
        "lossObservation": "Este motivo de perda exige uma observação complementar.",
        "responsibleBeforeTask": "Defina um responsável para o lead antes de agendar a próxima ação.",
        "schedule": "Informe quando a próxima ação deverá ser realizada.",
        "invalidSchedule": "A data da próxima ação é inválida.",
        "scheduleInPast": "A próxima ação não pode ser agendada no passado.",
        "invalidDeadline": "A data limite é inválida.",
        "invalidReminder": "A data do lembrete é inválida.",
        "deadlineBeforeSchedule": "A data limite não pode ser anterior ao agendamento.",
        "reminderAfterSchedule": "O lembrete não pode ocorrer depois do agendamento.",
        "save": "Não foi possível movimentar o lead."
      },
      "success": "Lead movimentado com sucesso.",
      "cancel": "Cancelar",
      "moving": "Movimentando...",
      "confirm": "Confirmar movimentação"
    }
  },
  "pt-PT": {
    "header": {
      "sales": "Comercial",
      "pipeline": "Pipeline",
      "title": "Pipeline comercial",
      "description": "Acompanhe cada oportunidade, identifique atrasos e organize as próximas ações do setor comercial.",
      "viewLeadList": "Ver lista de leads",
      "configureFunnel": "Configurar funil",
      "updating": "A atualizar...",
      "update": "Atualizar"
    },
    "filters": {
      "searchLabel": "Pesquisar oportunidades",
      "searchPlaceholder": "Nome, e-mail, telefone, interesse...",
      "priority": "Prioridade",
      "allPriorities": "Todas",
      "onlyMine": "Apenas os meus leads"
    },
    "summary": {
      "activeFunnel": "Funil ativo",
      "opportunities": "Oportunidades",
      "estimatedValue": "Valor estimado",
      "view": "Visualização",
      "myLeads": "Os meus leads",
      "wholeTeam": "Toda a equipa"
    },
    "stages": {
      "title": "Etapas do funil",
      "scrollHelp": "Desloque horizontalmente para visualizar todas as etapas.",
      "updatingData": "A atualizar dados...",
      "stage": "Etapa {number}",
      "value": "Valor",
      "probability": "Probabilidade",
      "empty": "Nenhuma oportunidade nesta etapa.",
      "moreLeads": "Existem mais leads nesta etapa"
    },
    "lead": {
      "noInterest": "Interesse não indicado",
      "responsible": "Responsável",
      "course": "Curso",
      "campus": "Polo",
      "value": "Valor",
      "stageOverdue": "Etapa com prazo expirado",
      "followUpOverdue": "Acompanhamento em atraso",
      "noNextAction": "Próxima ação não definida",
      "nextAction": "Próxima ação",
      "enrollment": "Matrícula",
      "moveStage": "Mover etapa"
    },
    "common": {
      "notDefined": "Não definido",
      "invalidDate": "Data inválida"
    },
    "loading": "A carregar pipeline comercial...",
    "priority": {
      "low": "Baixa",
      "medium": "Média",
      "high": "Alta",
      "urgent": "Urgente"
    },
    "taskTypes": {
      "call": "Chamada",
      "email": "E-mail",
      "meeting": "Reunião",
      "followUp": "Retorno",
      "sendProposal": "Enviar proposta",
      "requestDocuments": "Solicitar documentos",
      "confirmPayment": "Confirmar pagamento",
      "other": "Outra"
    },
    "categories": {
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
    "errors": {
      "load": "Não foi possível carregar o pipeline.",
      "loadTitle": "Não foi possível carregar o pipeline",
      "tryAgain": "Tentar novamente",
      "noMovePermission": "Não possui permissão para movimentar leads."
    },
    "movement": {
      "kicker": "Movimentação do pipeline",
      "title": "Mover {name}",
      "description": "A alteração ficará registada no histórico comercial do lead.",
      "closeAria": "Fechar movimentação",
      "currentStage": "Etapa atual",
      "responsible": "Responsável",
      "destinationStage": "Etapa de destino",
      "selectStage": "Selecione a nova etapa",
      "movementNote": "Observação da movimentação",
      "movementNotePlaceholder": "Ex.: lead respondeu, proposta aceite, documentos recebidos...",
      "selectLossReason": "Selecione o motivo",
      "stageSuffix": {
        "automatic": " — automática",
        "noPermission": " — sem permissão",
        "requiresEnrollment": " — exige matrícula"
      },
      "loss": {
        "title": "Registo da perda",
        "description": "O motivo será utilizado nos relatórios de conversão e melhoria comercial.",
        "reason": "Motivo da perda",
        "observation": "Observação complementar",
        "observationPlaceholder": "Registe os detalhes que ajudarão a compreender a perda.",
        "observationRequired": "Este motivo exige uma observação."
      },
      "nextAction": {
        "title": "Próxima ação",
        "description": "Mantenha o acompanhamento do lead com data, canal e prioridade definidos.",
        "alreadyDefined": "Próxima ação já definida",
        "required": "Próxima ação obrigatória",
        "schedule": "Agendar uma próxima ação",
        "requiredDescription": "A etapa selecionada exige uma tarefa pendente.",
        "noResponsible": "O lead ainda não tem responsável. Defina o responsável antes de o movimentar para esta etapa.",
        "actionType": "Tipo de ação",
        "priority": "Prioridade",
        "taskTitle": "Título",
        "taskTitlePlaceholder": "Próxima ação — {stage}",
        "scheduledFor": "Agendada para",
        "deadline": "Data limite",
        "reminder": "Lembrete",
        "responsible": "Responsável",
        "instructions": "Orientações da tarefa",
        "instructionsPlaceholder": "Descreva o que deverá ser feito no próximo contacto."
      },
      "errors": {
        "selectStage": "Selecione a etapa de destino.",
        "automaticStage": "Esta etapa é controlada automaticamente pelo sistema.",
        "requiresEnrollment": "O lead só pode ser convertido após a criação de uma matrícula válida.",
        "enrollmentKeepsConverted": "Este lead possui uma matrícula válida e deve permanecer convertido.",
        "noLossPermission": "Não possui permissão para registar perdas comerciais.",
        "lossReason": "Selecione o motivo da perda.",
        "lossObservation": "Este motivo de perda exige uma observação complementar.",
        "responsibleBeforeTask": "Defina um responsável para o lead antes de agendar a próxima ação.",
        "schedule": "Indique quando a próxima ação deverá ser realizada.",
        "invalidSchedule": "A data da próxima ação é inválida.",
        "scheduleInPast": "A próxima ação não pode ser agendada no passado.",
        "invalidDeadline": "A data limite é inválida.",
        "invalidReminder": "A data do lembrete é inválida.",
        "deadlineBeforeSchedule": "A data limite não pode ser anterior ao agendamento.",
        "reminderAfterSchedule": "O lembrete não pode ocorrer depois do agendamento.",
        "save": "Não foi possível movimentar o lead."
      },
      "success": "Lead movimentado com sucesso.",
      "cancel": "Cancelar",
      "moving": "A movimentar...",
      "confirm": "Confirmar movimentação"
    }
  },
  "en-US": {
    "header": {
      "sales": "Sales",
      "pipeline": "Pipeline",
      "title": "Sales pipeline",
      "description": "Track every opportunity, identify delays, and organize the sales team's next actions.",
      "viewLeadList": "View lead list",
      "configureFunnel": "Configure funnel",
      "updating": "Updating...",
      "update": "Update"
    },
    "filters": {
      "searchLabel": "Search opportunities",
      "searchPlaceholder": "Name, email, phone, interest...",
      "priority": "Priority",
      "allPriorities": "All",
      "onlyMine": "Only my leads"
    },
    "summary": {
      "activeFunnel": "Active funnel",
      "opportunities": "Opportunities",
      "estimatedValue": "Estimated value",
      "view": "View",
      "myLeads": "My leads",
      "wholeTeam": "Entire team"
    },
    "stages": {
      "title": "Funnel stages",
      "scrollHelp": "Scroll horizontally to view all stages.",
      "updatingData": "Updating data...",
      "stage": "Stage {number}",
      "value": "Value",
      "probability": "Probability",
      "empty": "No opportunities in this stage.",
      "moreLeads": "There are more leads in this stage"
    },
    "lead": {
      "noInterest": "Interest not provided",
      "responsible": "Responsible",
      "course": "Course",
      "campus": "Campus",
      "value": "Value",
      "stageOverdue": "Stage deadline overdue",
      "followUpOverdue": "Follow-up overdue",
      "noNextAction": "Next action not defined",
      "nextAction": "Next action",
      "enrollment": "Enrollment",
      "moveStage": "Move stage"
    },
    "common": {
      "notDefined": "Not defined",
      "invalidDate": "Invalid date"
    },
    "loading": "Loading sales pipeline...",
    "priority": {
      "low": "Low",
      "medium": "Medium",
      "high": "High",
      "urgent": "Urgent"
    },
    "taskTypes": {
      "call": "Call",
      "email": "Email",
      "meeting": "Meeting",
      "followUp": "Follow-up",
      "sendProposal": "Send proposal",
      "requestDocuments": "Request documents",
      "confirmPayment": "Confirm payment",
      "other": "Other"
    },
    "categories": {
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
      "discard": "Discarded"
    },
    "errors": {
      "load": "Could not load the pipeline.",
      "loadTitle": "Could not load the pipeline",
      "tryAgain": "Try again",
      "noMovePermission": "You do not have permission to move leads."
    },
    "movement": {
      "kicker": "Pipeline movement",
      "title": "Move {name}",
      "description": "The change will be recorded in the lead's sales history.",
      "closeAria": "Close movement",
      "currentStage": "Current stage",
      "responsible": "Responsible",
      "destinationStage": "Destination stage",
      "selectStage": "Select the new stage",
      "movementNote": "Movement note",
      "movementNotePlaceholder": "e.g. lead replied, proposal accepted, documents received...",
      "selectLossReason": "Select the reason",
      "stageSuffix": {
        "automatic": " — automatic",
        "noPermission": " — no permission",
        "requiresEnrollment": " — requires enrollment"
      },
      "loss": {
        "title": "Loss record",
        "description": "The reason will be used in conversion and sales-improvement reports.",
        "reason": "Loss reason",
        "observation": "Additional note",
        "observationPlaceholder": "Record details that will help explain the loss.",
        "observationRequired": "This reason requires a note."
      },
      "nextAction": {
        "title": "Next action",
        "description": "Keep lead follow-up organized with a defined date, channel, and priority.",
        "alreadyDefined": "Next action already defined",
        "required": "Next action required",
        "schedule": "Schedule a next action",
        "requiredDescription": "The selected stage requires a pending task.",
        "noResponsible": "This lead does not have a responsible person yet. Assign one before moving it to this stage.",
        "actionType": "Action type",
        "priority": "Priority",
        "taskTitle": "Title",
        "taskTitlePlaceholder": "Next action — {stage}",
        "scheduledFor": "Scheduled for",
        "deadline": "Deadline",
        "reminder": "Reminder",
        "responsible": "Responsible",
        "instructions": "Task instructions",
        "instructionsPlaceholder": "Describe what should be done during the next contact."
      },
      "errors": {
        "selectStage": "Select the destination stage.",
        "automaticStage": "This stage is controlled automatically by the system.",
        "requiresEnrollment": "The lead can only be converted after a valid enrollment is created.",
        "enrollmentKeepsConverted": "This lead has a valid enrollment and must remain converted.",
        "noLossPermission": "You do not have permission to record sales losses.",
        "lossReason": "Select the loss reason.",
        "lossObservation": "This loss reason requires an additional note.",
        "responsibleBeforeTask": "Assign a responsible person to the lead before scheduling the next action.",
        "schedule": "Specify when the next action should be performed.",
        "invalidSchedule": "The next action date is invalid.",
        "scheduleInPast": "The next action cannot be scheduled in the past.",
        "invalidDeadline": "The deadline is invalid.",
        "invalidReminder": "The reminder date is invalid.",
        "deadlineBeforeSchedule": "The deadline cannot be earlier than the scheduled time.",
        "reminderAfterSchedule": "The reminder cannot occur after the scheduled time.",
        "save": "Could not move the lead."
      },
      "success": "Lead moved successfully.",
      "cancel": "Cancel",
      "moving": "Moving...",
      "confirm": "Confirm movement"
    }
  },
  "es-ES": {
    "header": {
      "sales": "Comercial",
      "pipeline": "Pipeline",
      "title": "Pipeline comercial",
      "description": "Haz seguimiento de cada oportunidad, identifica retrasos y organiza las próximas acciones del equipo comercial.",
      "viewLeadList": "Ver lista de leads",
      "configureFunnel": "Configurar embudo",
      "updating": "Actualizando...",
      "update": "Actualizar"
    },
    "filters": {
      "searchLabel": "Buscar oportunidades",
      "searchPlaceholder": "Nombre, correo, teléfono, interés...",
      "priority": "Prioridad",
      "allPriorities": "Todas",
      "onlyMine": "Solo mis leads"
    },
    "summary": {
      "activeFunnel": "Embudo activo",
      "opportunities": "Oportunidades",
      "estimatedValue": "Valor estimado",
      "view": "Visualización",
      "myLeads": "Mis leads",
      "wholeTeam": "Todo el equipo"
    },
    "stages": {
      "title": "Etapas del embudo",
      "scrollHelp": "Desplázate horizontalmente para ver todas las etapas.",
      "updatingData": "Actualizando datos...",
      "stage": "Etapa {number}",
      "value": "Valor",
      "probability": "Probabilidad",
      "empty": "No hay oportunidades en esta etapa.",
      "moreLeads": "Hay más leads en esta etapa"
    },
    "lead": {
      "noInterest": "Interés no informado",
      "responsible": "Responsable",
      "course": "Curso",
      "campus": "Sede",
      "value": "Valor",
      "stageOverdue": "Etapa con plazo vencido",
      "followUpOverdue": "Seguimiento atrasado",
      "noNextAction": "Próxima acción no definida",
      "nextAction": "Próxima acción",
      "enrollment": "Matrícula",
      "moveStage": "Mover etapa"
    },
    "common": {
      "notDefined": "No definido",
      "invalidDate": "Fecha no válida"
    },
    "loading": "Cargando pipeline comercial...",
    "priority": {
      "low": "Baja",
      "medium": "Media",
      "high": "Alta",
      "urgent": "Urgente"
    },
    "taskTypes": {
      "call": "Llamada",
      "email": "Correo electrónico",
      "meeting": "Reunión",
      "followUp": "Seguimiento",
      "sendProposal": "Enviar propuesta",
      "requestDocuments": "Solicitar documentos",
      "confirmPayment": "Confirmar pago",
      "other": "Otra"
    },
    "categories": {
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
      "discard": "Descartado"
    },
    "errors": {
      "load": "No se pudo cargar el pipeline.",
      "loadTitle": "No se pudo cargar el pipeline",
      "tryAgain": "Intentar de nuevo",
      "noMovePermission": "No tienes permiso para mover leads."
    },
    "movement": {
      "kicker": "Movimiento del pipeline",
      "title": "Mover {name}",
      "description": "El cambio quedará registrado en el historial comercial del lead.",
      "closeAria": "Cerrar movimiento",
      "currentStage": "Etapa actual",
      "responsible": "Responsable",
      "destinationStage": "Etapa de destino",
      "selectStage": "Selecciona la nueva etapa",
      "movementNote": "Observación del movimiento",
      "movementNotePlaceholder": "Ej.: el lead respondió, propuesta aceptada, documentos recibidos...",
      "selectLossReason": "Selecciona el motivo",
      "stageSuffix": {
        "automatic": " — automática",
        "noPermission": " — sin permiso",
        "requiresEnrollment": " — requiere matrícula"
      },
      "loss": {
        "title": "Registro de la pérdida",
        "description": "El motivo se utilizará en los informes de conversión y mejora comercial.",
        "reason": "Motivo de la pérdida",
        "observation": "Observación complementaria",
        "observationPlaceholder": "Registra los detalles que ayuden a comprender la pérdida.",
        "observationRequired": "Este motivo requiere una observación."
      },
      "nextAction": {
        "title": "Próxima acción",
        "description": "Mantén el seguimiento del lead con fecha, canal y prioridad definidos.",
        "alreadyDefined": "Próxima acción ya definida",
        "required": "Próxima acción obligatoria",
        "schedule": "Programar una próxima acción",
        "requiredDescription": "La etapa seleccionada requiere una tarea pendiente.",
        "noResponsible": "El lead aún no tiene responsable. Define uno antes de moverlo a esta etapa.",
        "actionType": "Tipo de acción",
        "priority": "Prioridad",
        "taskTitle": "Título",
        "taskTitlePlaceholder": "Próxima acción — {stage}",
        "scheduledFor": "Programada para",
        "deadline": "Fecha límite",
        "reminder": "Recordatorio",
        "responsible": "Responsable",
        "instructions": "Orientaciones de la tarea",
        "instructionsPlaceholder": "Describe qué deberá hacerse en el próximo contacto."
      },
      "errors": {
        "selectStage": "Selecciona la etapa de destino.",
        "automaticStage": "Esta etapa está controlada automáticamente por el sistema.",
        "requiresEnrollment": "El lead solo puede convertirse después de crear una matrícula válida.",
        "enrollmentKeepsConverted": "Este lead tiene una matrícula válida y debe permanecer convertido.",
        "noLossPermission": "No tienes permiso para registrar pérdidas comerciales.",
        "lossReason": "Selecciona el motivo de la pérdida.",
        "lossObservation": "Este motivo de pérdida requiere una observación complementaria.",
        "responsibleBeforeTask": "Define un responsable para el lead antes de programar la próxima acción.",
        "schedule": "Indica cuándo debe realizarse la próxima acción.",
        "invalidSchedule": "La fecha de la próxima acción no es válida.",
        "scheduleInPast": "La próxima acción no puede programarse en el pasado.",
        "invalidDeadline": "La fecha límite no es válida.",
        "invalidReminder": "La fecha del recordatorio no es válida.",
        "deadlineBeforeSchedule": "La fecha límite no puede ser anterior a la programación.",
        "reminderAfterSchedule": "El recordatorio no puede ocurrir después de la programación.",
        "save": "No se pudo mover el lead."
      },
      "success": "Lead movido correctamente.",
      "cancel": "Cancelar",
      "moving": "Moviendo...",
      "confirm": "Confirmar movimiento"
    }
  },
  "fr-FR": {
    "header": {
      "sales": "Commercial",
      "pipeline": "Pipeline",
      "title": "Pipeline commercial",
      "description": "Suivez chaque opportunité, identifiez les retards et organisez les prochaines actions de l’équipe commerciale.",
      "viewLeadList": "Voir la liste des prospects",
      "configureFunnel": "Configurer l’entonnoir",
      "updating": "Mise à jour...",
      "update": "Mettre à jour"
    },
    "filters": {
      "searchLabel": "Rechercher des opportunités",
      "searchPlaceholder": "Nom, e-mail, téléphone, intérêt...",
      "priority": "Priorité",
      "allPriorities": "Toutes",
      "onlyMine": "Uniquement mes prospects"
    },
    "summary": {
      "activeFunnel": "Entonnoir actif",
      "opportunities": "Opportunités",
      "estimatedValue": "Valeur estimée",
      "view": "Vue",
      "myLeads": "Mes prospects",
      "wholeTeam": "Toute l’équipe"
    },
    "stages": {
      "title": "Étapes de l’entonnoir",
      "scrollHelp": "Faites défiler horizontalement pour afficher toutes les étapes.",
      "updatingData": "Mise à jour des données...",
      "stage": "Étape {number}",
      "value": "Valeur",
      "probability": "Probabilité",
      "empty": "Aucune opportunité à cette étape.",
      "moreLeads": "D’autres prospects existent à cette étape"
    },
    "lead": {
      "noInterest": "Intérêt non renseigné",
      "responsible": "Responsable",
      "course": "Cours",
      "campus": "Site",
      "value": "Valeur",
      "stageOverdue": "Délai de l’étape dépassé",
      "followUpOverdue": "Suivi en retard",
      "noNextAction": "Prochaine action non définie",
      "nextAction": "Prochaine action",
      "enrollment": "Inscription",
      "moveStage": "Changer d’étape"
    },
    "common": {
      "notDefined": "Non défini",
      "invalidDate": "Date invalide"
    },
    "loading": "Chargement du pipeline commercial...",
    "priority": {
      "low": "Faible",
      "medium": "Moyenne",
      "high": "Élevée",
      "urgent": "Urgente"
    },
    "taskTypes": {
      "call": "Appel",
      "email": "E-mail",
      "meeting": "Réunion",
      "followUp": "Suivi",
      "sendProposal": "Envoyer une proposition",
      "requestDocuments": "Demander des documents",
      "confirmPayment": "Confirmer le paiement",
      "other": "Autre"
    },
    "categories": {
      "entry": "Entrée",
      "firstContact": "Premier contact",
      "inService": "En traitement",
      "qualification": "Qualification",
      "presentation": "Présentation",
      "proposal": "Proposition",
      "negotiation": "Négociation",
      "documentation": "Documentation",
      "payment": "Paiement",
      "conversion": "Conversion",
      "loss": "Perte",
      "pause": "Pause",
      "discard": "Rejet"
    },
    "errors": {
      "load": "Impossible de charger le pipeline.",
      "loadTitle": "Impossible de charger le pipeline",
      "tryAgain": "Réessayer",
      "noMovePermission": "Vous n’avez pas l’autorisation de déplacer des prospects."
    },
    "movement": {
      "kicker": "Déplacement dans le pipeline",
      "title": "Déplacer {name}",
      "description": "La modification sera enregistrée dans l’historique commercial du prospect.",
      "closeAria": "Fermer le déplacement",
      "currentStage": "Étape actuelle",
      "responsible": "Responsable",
      "destinationStage": "Étape de destination",
      "selectStage": "Sélectionnez la nouvelle étape",
      "movementNote": "Observation sur le déplacement",
      "movementNotePlaceholder": "Ex. : le prospect a répondu, proposition acceptée, documents reçus...",
      "selectLossReason": "Sélectionnez le motif",
      "stageSuffix": {
        "automatic": " — automatique",
        "noPermission": " — sans autorisation",
        "requiresEnrollment": " — inscription requise"
      },
      "loss": {
        "title": "Enregistrement de la perte",
        "description": "Le motif sera utilisé dans les rapports de conversion et d’amélioration commerciale.",
        "reason": "Motif de la perte",
        "observation": "Observation complémentaire",
        "observationPlaceholder": "Consignez les détails permettant de comprendre la perte.",
        "observationRequired": "Ce motif nécessite une observation."
      },
      "nextAction": {
        "title": "Prochaine action",
        "description": "Assurez le suivi du prospect avec une date, un canal et une priorité définis.",
        "alreadyDefined": "Prochaine action déjà définie",
        "required": "Prochaine action obligatoire",
        "schedule": "Planifier une prochaine action",
        "requiredDescription": "L’étape sélectionnée exige une tâche en attente.",
        "noResponsible": "Ce prospect n’a pas encore de responsable. Définissez-en un avant de le déplacer vers cette étape.",
        "actionType": "Type d’action",
        "priority": "Priorité",
        "taskTitle": "Titre",
        "taskTitlePlaceholder": "Prochaine action — {stage}",
        "scheduledFor": "Planifiée pour",
        "deadline": "Date limite",
        "reminder": "Rappel",
        "responsible": "Responsable",
        "instructions": "Consignes de la tâche",
        "instructionsPlaceholder": "Décrivez ce qui devra être fait lors du prochain contact."
      },
      "errors": {
        "selectStage": "Sélectionnez l’étape de destination.",
        "automaticStage": "Cette étape est contrôlée automatiquement par le système.",
        "requiresEnrollment": "Le prospect ne peut être converti qu’après la création d’une inscription valide.",
        "enrollmentKeepsConverted": "Ce prospect possède une inscription valide et doit rester converti.",
        "noLossPermission": "Vous n’avez pas l’autorisation d’enregistrer des pertes commerciales.",
        "lossReason": "Sélectionnez le motif de la perte.",
        "lossObservation": "Ce motif de perte nécessite une observation complémentaire.",
        "responsibleBeforeTask": "Définissez un responsable pour le prospect avant de planifier la prochaine action.",
        "schedule": "Indiquez quand la prochaine action doit être effectuée.",
        "invalidSchedule": "La date de la prochaine action est invalide.",
        "scheduleInPast": "La prochaine action ne peut pas être planifiée dans le passé.",
        "invalidDeadline": "La date limite est invalide.",
        "invalidReminder": "La date du rappel est invalide.",
        "deadlineBeforeSchedule": "La date limite ne peut pas être antérieure à la date planifiée.",
        "reminderAfterSchedule": "Le rappel ne peut pas avoir lieu après la date planifiée.",
        "save": "Impossible de déplacer le prospect."
      },
      "success": "Prospect déplacé avec succès.",
      "cancel": "Annuler",
      "moving": "Déplacement...",
      "confirm": "Confirmer le déplacement"
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
  atual.AdminCommercialPipeline = traducoes[locale];

  fs.writeFileSync(
    arquivo,
    JSON.stringify(atual, null, 2) + "\n",
    "utf8"
  );

  console.log(`✓ ${locale}: AdminCommercialPipeline atualizado`);
}

console.log("\nConcluído. As traduções do Pipeline comercial foram atualizadas nos cinco idiomas.");
