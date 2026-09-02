import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    "common": {
      "backToLeadGenerationCenter": "← Central de Captação",
      "refresh": "↻ Atualizar",
      "refreshing": "Atualizando...",
      "search": "Buscar",
      "status": "Situação",
      "allFeminine": "Todas",
      "allMasculine": "Todos",
      "channel": "Canal",
      "campaign": "Campanha",
      "form": "Formulário",
      "integration": "Integração",
      "clear": "Limpar",
      "filter": "Filtrar",
      "origin": "Origem",
      "interest": "Interesse",
      "unit": "Unidade",
      "notInformed": "Não informado",
      "consentRecorded": "Consentimento registrado",
      "consentNotRecorded": "Consentimento não registrado",
      "whatHappened": "O que aconteceu",
      "viewDetails": "Ver detalhes",
      "openLead": "Abrir lead",
      "retry": "Tentar novamente",
      "processing": "Processando...",
      "previous": "Anterior",
      "next": "Próxima",
      "cancel": "Cancelar",
      "pagination": "Página {page} de {pages}",
      "name": "Nome",
      "email": "E-mail",
      "phone": "Telefone",
      "language": "Idioma",
      "inbound": "Entrada",
      "outbound": "Saída",
      "result": "Resultado",
      "attempts": "Tentativas",
      "received": "Recebido",
      "processed": "Processado",
      "lastUpdate": "Última atualização",
      "lead": "Lead",
      "course": "Curso",
      "owner": "Responsável",
      "team": "Equipe",
      "submissionNumber": "Submissão #{id}"
    },
    "statuses": {
      "received": {
        "name": "Recebida",
        "description": "Os dados foram recebidos e aguardam processamento."
      },
      "validating": {
        "name": "Validando dados",
        "description": "O PHANYX está verificando os dados recebidos."
      },
      "processing": {
        "name": "Em processamento",
        "description": "O PHANYX está criando ou atualizando o lead."
      },
      "processed": {
        "name": "Processada",
        "description": "Os dados foram processados com sucesso."
      },
      "duplicate": {
        "name": "Duplicada",
        "description": "Esta entrada já havia sido recebida anteriormente."
      },
      "rejected": {
        "name": "Não processada",
        "description": "Os dados não puderam ser processados."
      },
      "spam": {
        "name": "Bloqueada como spam",
        "description": "A entrada foi bloqueada pelos mecanismos de proteção."
      },
      "error": {
        "name": "Com erro",
        "description": "Ocorreu um problema durante o processamento."
      }
    },
    "results": {
      "waiting": "Aguardando resultado",
      "notChecked": "Ainda não verificado",
      "newLead": "Novo lead criado",
      "existingLeadUpdated": "Lead existente atualizado",
      "duplicateIgnored": "Entrada duplicada ignorada",
      "manualReview": "Necessita revisão"
    },
    "eventStatuses": {
      "received": "Recebido",
      "pending": "Pendente",
      "processing": "Processando",
      "processed": "Processado",
      "delivered": "Entregue",
      "discarded": "Descartado",
      "error": "Com erro"
    },
    "persistedErrors": {
      "requiredField": "O campo \"{field}\" é obrigatório.",
      "fields": {
        "fullName": "Nome completo",
        "email": "E-mail",
        "phone": "Telefone"
      }
    },
    "errors": {
      "load": "Não foi possível carregar as submissões.",
      "loadDetail": "Não foi possível consultar esta submissão.",
      "invalidSubmission": "Submissão inválida.",
      "retry": "Não foi possível tentar novamente."
    },
    "list": {
      "loading": "Carregando submissões...",
      "header": {
        "title": "Submissões recebidas",
        "description": "Acompanhe os dados enviados pelos interessados e o resultado de cada processamento."
      },
      "summary": {
        "total": "Total recebido",
        "totalHelp": "Todas as submissões",
        "processed": "Processadas",
        "processedHelp": "Concluídas com sucesso",
        "inProgress": "Em andamento",
        "inProgressHelp": "Aguardando ou processando",
        "attention": "Exigem atenção",
        "attentionHelp": "Rejeitadas ou com erro"
      },
      "filters": {
        "searchPlaceholder": "Nome, e-mail ou telefone...",
        "leadResult": "Resultado do lead",
        "allChannels": "Todos os canais",
        "allCampaigns": "Todas as campanhas",
        "allForms": "Todos os formulários",
        "allIntegrations": "Todas as integrações"
      },
      "received": {
        "title": "Envios recebidos",
        "results": "{count, plural, one {# submissão encontrada.} other {# submissões encontradas.}}"
      },
      "empty": {
        "title": "Nenhuma submissão encontrada",
        "description": "Ajuste os filtros ou aguarde novos interessados enviarem seus dados."
      },
      "item": {
        "unnamedProspect": "Interessado sem nome",
        "unknownOrigin": "Origem não identificada",
        "receivedAt": "Recebido em",
        "processedPrefix": "Processado"
      },
      "retryModal": {
        "title": "Tentar processar novamente?",
        "description": "O PHANYX verificará novamente os dados enviados por {name}.",
        "thisProspect": "este interessado",
        "deduplication": "Caso já exista um lead correspondente, as regras de deduplicação serão respeitadas."
      },
      "success": {
        "requeued": "Submissão enviada novamente para processamento."
      }
    },
    "detail": {
      "loading": "Carregando submissão...",
      "loadError": {
        "back": "← Voltar às submissões",
        "title": "Não foi possível abrir esta submissão"
      },
      "header": {
        "back": "← Submissões recebidas",
        "receivedAt": "Submissão #{id} recebida em {date}"
      },
      "summary": {
        "resultingLead": "Lead resultante",
        "unknownOrigin": "Não identificada",
        "noCampaign": "Sem campanha vinculada",
        "unitNotInformed": "Unidade não informada",
        "unitValue": "Unidade: {name}",
        "notCreatedYet": "Ainda não criado",
        "noOwner": "Sem responsável definido"
      },
      "prospect": {
        "eyebrow": "INTERESSADO",
        "title": "Dados recebidos",
        "description": "Informações principais enviadas pelo interessado."
      },
      "source": {
        "eyebrow": "CAPTAÇÃO",
        "title": "Origem do interessado",
        "description": "Veja de onde este envio chegou ao PHANYX.",
        "originPage": "Página de origem",
        "referrer": "Referência"
      },
      "privacy": {
        "eyebrow": "PRIVACIDADE",
        "title": "Consentimento e proteção de dados",
        "consentText": "Texto apresentado ao interessado",
        "registeredAt": "Registrado em {date}",
        "versionSuffix": " · Versão {version}"
      },
      "marketing": {
        "eyebrow": "MARKETING",
        "title": "Rastreamento da campanha",
        "description": "Dados utilizados para identificar a origem da campanha.",
        "adIdentifiers": "Identificadores de anúncios",
        "source": "Origem da campanha",
        "medium": "Meio",
        "content": "Conteúdo",
        "term": "Termo"
      },
      "integrationHistory": {
        "eyebrow": "INTEGRAÇÕES",
        "title": "Histórico de integração",
        "description": "Eventos relacionados à entrada ou saída desta submissão.",
        "technicalInformation": "Informações técnicas",
        "headers": "Cabeçalhos",
        "sentData": "Dados enviados",
        "response": "Resposta"
      },
      "processing": {
        "eyebrow": "PROCESSAMENTO",
        "title": "Situação atual"
      },
      "commercial": {
        "title": "Resultado comercial",
        "open360": "Abrir Ficha 360°",
        "noLeadTitle": "Nenhum lead vinculado",
        "noLeadDescription": "O processamento ainda não gerou ou vinculou um lead a esta submissão."
      },
      "technical": {
        "title": "Dados técnicos",
        "description": "Informações para suporte, auditoria e diagnóstico.",
        "externalIdentifier": "Identificador externo",
        "errorCode": "Código do erro",
        "deduplicationKey": "Chave de deduplicação",
        "protectedIp": "IP protegido",
        "originalData": "Dados originalmente recebidos",
        "normalizedData": "Dados normalizados pelo PHANYX",
        "noData": "Sem dados.",
        "cannotDisplayData": "Não foi possível exibir estes dados."
      },
      "retryModal": {
        "title": "Tentar processar novamente?",
        "description": "O PHANYX verificará novamente os dados desta submissão.",
        "deduplication": "Se já existir um lead correspondente, as regras de deduplicação serão respeitadas."
      },
      "success": {
        "reprocessed": "Submissão reprocessada com sucesso."
      }
    }
  },
  "pt-PT": {
    "common": {
      "backToLeadGenerationCenter": "← Central de Captação",
      "refresh": "↻ Atualizar",
      "refreshing": "A atualizar...",
      "search": "Pesquisar",
      "status": "Situação",
      "allFeminine": "Todas",
      "allMasculine": "Todos",
      "channel": "Canal",
      "campaign": "Campanha",
      "form": "Formulário",
      "integration": "Integração",
      "clear": "Limpar",
      "filter": "Filtrar",
      "origin": "Origem",
      "interest": "Interesse",
      "unit": "Unidade",
      "notInformed": "Não informado",
      "consentRecorded": "Consentimento registado",
      "consentNotRecorded": "Consentimento não registado",
      "whatHappened": "O que aconteceu",
      "viewDetails": "Ver detalhes",
      "openLead": "Abrir lead",
      "retry": "Tentar novamente",
      "processing": "A processar...",
      "previous": "Anterior",
      "next": "Seguinte",
      "cancel": "Cancelar",
      "pagination": "Página {page} de {pages}",
      "name": "Nome",
      "email": "E-mail",
      "phone": "Telefone",
      "language": "Idioma",
      "inbound": "Entrada",
      "outbound": "Saída",
      "result": "Resultado",
      "attempts": "Tentativas",
      "received": "Recebido",
      "processed": "Processado",
      "lastUpdate": "Última atualização",
      "lead": "Lead",
      "course": "Curso",
      "owner": "Responsável",
      "team": "Equipa",
      "submissionNumber": "Submissão #{id}"
    },
    "statuses": {
      "received": {
        "name": "Recebida",
        "description": "Os dados foram recebidos e aguardam processamento."
      },
      "validating": {
        "name": "A validar dados",
        "description": "O PHANYX está a verificar os dados recebidos."
      },
      "processing": {
        "name": "Em processamento",
        "description": "O PHANYX está a criar ou atualizar o lead."
      },
      "processed": {
        "name": "Processada",
        "description": "Os dados foram processados com sucesso."
      },
      "duplicate": {
        "name": "Duplicada",
        "description": "Esta entrada já tinha sido recebida anteriormente."
      },
      "rejected": {
        "name": "Não processada",
        "description": "Não foi possível processar os dados."
      },
      "spam": {
        "name": "Bloqueada como spam",
        "description": "A entrada foi bloqueada pelos mecanismos de proteção."
      },
      "error": {
        "name": "Com erro",
        "description": "Ocorreu um problema durante o processamento."
      }
    },
    "results": {
      "waiting": "A aguardar resultado",
      "notChecked": "Ainda não verificado",
      "newLead": "Novo lead criado",
      "existingLeadUpdated": "Lead existente atualizado",
      "duplicateIgnored": "Entrada duplicada ignorada",
      "manualReview": "Necessita de revisão"
    },
    "eventStatuses": {
      "received": "Recebido",
      "pending": "Pendente",
      "processing": "A processar",
      "processed": "Processado",
      "delivered": "Entregue",
      "discarded": "Descartado",
      "error": "Com erro"
    },
    "persistedErrors": {
      "requiredField": "O campo \"{field}\" é obrigatório.",
      "fields": {
        "fullName": "Nome completo",
        "email": "E-mail",
        "phone": "Telefone"
      }
    },
    "errors": {
      "load": "Não foi possível carregar as submissões.",
      "loadDetail": "Não foi possível consultar esta submissão.",
      "invalidSubmission": "Submissão inválida.",
      "retry": "Não foi possível tentar novamente."
    },
    "list": {
      "loading": "A carregar submissões...",
      "header": {
        "title": "Submissões recebidas",
        "description": "Acompanhe os dados enviados pelos interessados e o resultado de cada processamento."
      },
      "summary": {
        "total": "Total recebido",
        "totalHelp": "Todas as submissões",
        "processed": "Processadas",
        "processedHelp": "Concluídas com sucesso",
        "inProgress": "Em curso",
        "inProgressHelp": "A aguardar ou a processar",
        "attention": "Exigem atenção",
        "attentionHelp": "Rejeitadas ou com erro"
      },
      "filters": {
        "searchPlaceholder": "Nome, e-mail ou telefone...",
        "leadResult": "Resultado do lead",
        "allChannels": "Todos os canais",
        "allCampaigns": "Todas as campanhas",
        "allForms": "Todos os formulários",
        "allIntegrations": "Todas as integrações"
      },
      "received": {
        "title": "Envios recebidos",
        "results": "{count, plural, one {# submissão encontrada.} other {# submissões encontradas.}}"
      },
      "empty": {
        "title": "Nenhuma submissão encontrada",
        "description": "Ajuste os filtros ou aguarde que novos interessados enviem os seus dados."
      },
      "item": {
        "unnamedProspect": "Interessado sem nome",
        "unknownOrigin": "Origem não identificada",
        "receivedAt": "Recebido em",
        "processedPrefix": "Processado"
      },
      "retryModal": {
        "title": "Tentar processar novamente?",
        "description": "O PHANYX verificará novamente os dados enviados por {name}.",
        "thisProspect": "este interessado",
        "deduplication": "Se já existir um lead correspondente, as regras de deduplicação serão respeitadas."
      },
      "success": {
        "requeued": "Submissão enviada novamente para processamento."
      }
    },
    "detail": {
      "loading": "A carregar submissão...",
      "loadError": {
        "back": "← Voltar às submissões",
        "title": "Não foi possível abrir esta submissão"
      },
      "header": {
        "back": "← Submissões recebidas",
        "receivedAt": "Submissão #{id} recebida em {date}"
      },
      "summary": {
        "resultingLead": "Lead resultante",
        "unknownOrigin": "Não identificada",
        "noCampaign": "Sem campanha associada",
        "unitNotInformed": "Unidade não informada",
        "unitValue": "Unidade: {name}",
        "notCreatedYet": "Ainda não criado",
        "noOwner": "Sem responsável definido"
      },
      "prospect": {
        "eyebrow": "INTERESSADO",
        "title": "Dados recebidos",
        "description": "Informações principais enviadas pelo interessado."
      },
      "source": {
        "eyebrow": "CAPTAÇÃO",
        "title": "Origem do interessado",
        "description": "Veja de onde este envio chegou ao PHANYX.",
        "originPage": "Página de origem",
        "referrer": "Referência"
      },
      "privacy": {
        "eyebrow": "PRIVACIDADE",
        "title": "Consentimento e proteção de dados",
        "consentText": "Texto apresentado ao interessado",
        "registeredAt": "Registado em {date}",
        "versionSuffix": " · Versão {version}"
      },
      "marketing": {
        "eyebrow": "MARKETING",
        "title": "Rastreamento da campanha",
        "description": "Dados utilizados para identificar a origem da campanha.",
        "adIdentifiers": "Identificadores de anúncios",
        "source": "Origem da campanha",
        "medium": "Meio",
        "content": "Conteúdo",
        "term": "Termo"
      },
      "integrationHistory": {
        "eyebrow": "INTEGRAÇÕES",
        "title": "Histórico de integração",
        "description": "Eventos relacionados com a entrada ou saída desta submissão.",
        "technicalInformation": "Informações técnicas",
        "headers": "Cabeçalhos",
        "sentData": "Dados enviados",
        "response": "Resposta"
      },
      "processing": {
        "eyebrow": "PROCESSAMENTO",
        "title": "Situação atual"
      },
      "commercial": {
        "title": "Resultado comercial",
        "open360": "Abrir Ficha 360°",
        "noLeadTitle": "Nenhum lead associado",
        "noLeadDescription": "O processamento ainda não gerou nem associou um lead a esta submissão."
      },
      "technical": {
        "title": "Dados técnicos",
        "description": "Informações para suporte, auditoria e diagnóstico.",
        "externalIdentifier": "Identificador externo",
        "errorCode": "Código do erro",
        "deduplicationKey": "Chave de deduplicação",
        "protectedIp": "IP protegido",
        "originalData": "Dados originalmente recebidos",
        "normalizedData": "Dados normalizados pelo PHANYX",
        "noData": "Sem dados.",
        "cannotDisplayData": "Não foi possível apresentar estes dados."
      },
      "retryModal": {
        "title": "Tentar processar novamente?",
        "description": "O PHANYX verificará novamente os dados desta submissão.",
        "deduplication": "Se já existir um lead correspondente, as regras de deduplicação serão respeitadas."
      },
      "success": {
        "reprocessed": "Submissão reprocessada com sucesso."
      }
    }
  },
  "en-US": {
    "common": {
      "backToLeadGenerationCenter": "← Lead Generation Center",
      "refresh": "↻ Refresh",
      "refreshing": "Refreshing...",
      "search": "Search",
      "status": "Status",
      "allFeminine": "All",
      "allMasculine": "All",
      "channel": "Channel",
      "campaign": "Campaign",
      "form": "Form",
      "integration": "Integration",
      "clear": "Clear",
      "filter": "Filter",
      "origin": "Source",
      "interest": "Interest",
      "unit": "Unit",
      "notInformed": "Not provided",
      "consentRecorded": "Consent recorded",
      "consentNotRecorded": "Consent not recorded",
      "whatHappened": "What happened",
      "viewDetails": "View details",
      "openLead": "Open lead",
      "retry": "Try again",
      "processing": "Processing...",
      "previous": "Previous",
      "next": "Next",
      "cancel": "Cancel",
      "pagination": "Page {page} of {pages}",
      "name": "Name",
      "email": "Email",
      "phone": "Phone",
      "language": "Language",
      "inbound": "Inbound",
      "outbound": "Outbound",
      "result": "Result",
      "attempts": "Attempts",
      "received": "Received",
      "processed": "Processed",
      "lastUpdate": "Last update",
      "lead": "Lead",
      "course": "Course",
      "owner": "Owner",
      "team": "Team",
      "submissionNumber": "Submission #{id}"
    },
    "statuses": {
      "received": {
        "name": "Received",
        "description": "The data was received and is waiting to be processed."
      },
      "validating": {
        "name": "Validating data",
        "description": "PHANYX is checking the received data."
      },
      "processing": {
        "name": "Processing",
        "description": "PHANYX is creating or updating the lead."
      },
      "processed": {
        "name": "Processed",
        "description": "The data was processed successfully."
      },
      "duplicate": {
        "name": "Duplicate",
        "description": "This submission had already been received."
      },
      "rejected": {
        "name": "Not processed",
        "description": "The data could not be processed."
      },
      "spam": {
        "name": "Blocked as spam",
        "description": "The submission was blocked by protection mechanisms."
      },
      "error": {
        "name": "Error",
        "description": "A problem occurred during processing."
      }
    },
    "results": {
      "waiting": "Waiting for result",
      "notChecked": "Not checked yet",
      "newLead": "New lead created",
      "existingLeadUpdated": "Existing lead updated",
      "duplicateIgnored": "Duplicate submission ignored",
      "manualReview": "Needs review"
    },
    "eventStatuses": {
      "received": "Received",
      "pending": "Pending",
      "processing": "Processing",
      "processed": "Processed",
      "delivered": "Delivered",
      "discarded": "Discarded",
      "error": "Error"
    },
    "persistedErrors": {
      "requiredField": "The field \"{field}\" is required.",
      "fields": {
        "fullName": "Full name",
        "email": "Email",
        "phone": "Phone"
      }
    },
    "errors": {
      "load": "Could not load submissions.",
      "loadDetail": "Could not load this submission.",
      "invalidSubmission": "Invalid submission.",
      "retry": "Could not try again."
    },
    "list": {
      "loading": "Loading submissions...",
      "header": {
        "title": "Received submissions",
        "description": "Track the data submitted by prospects and the result of each processing attempt."
      },
      "summary": {
        "total": "Total received",
        "totalHelp": "All submissions",
        "processed": "Processed",
        "processedHelp": "Completed successfully",
        "inProgress": "In progress",
        "inProgressHelp": "Waiting or processing",
        "attention": "Needs attention",
        "attentionHelp": "Rejected or with errors"
      },
      "filters": {
        "searchPlaceholder": "Name, email or phone...",
        "leadResult": "Lead result",
        "allChannels": "All channels",
        "allCampaigns": "All campaigns",
        "allForms": "All forms",
        "allIntegrations": "All integrations"
      },
      "received": {
        "title": "Received entries",
        "results": "{count, plural, one {# submission found.} other {# submissions found.}}"
      },
      "empty": {
        "title": "No submissions found",
        "description": "Adjust the filters or wait for new prospects to submit their data."
      },
      "item": {
        "unnamedProspect": "Unnamed prospect",
        "unknownOrigin": "Unknown source",
        "receivedAt": "Received at",
        "processedPrefix": "Processed"
      },
      "retryModal": {
        "title": "Try processing again?",
        "description": "PHANYX will check the data submitted by {name} again.",
        "thisProspect": "this prospect",
        "deduplication": "If a matching lead already exists, the deduplication rules will be respected."
      },
      "success": {
        "requeued": "Submission sent for processing again."
      }
    },
    "detail": {
      "loading": "Loading submission...",
      "loadError": {
        "back": "← Back to submissions",
        "title": "Could not open this submission"
      },
      "header": {
        "back": "← Received submissions",
        "receivedAt": "Submission #{id} received at {date}"
      },
      "summary": {
        "resultingLead": "Resulting lead",
        "unknownOrigin": "Unknown",
        "noCampaign": "No campaign linked",
        "unitNotInformed": "Unit not provided",
        "unitValue": "Unit: {name}",
        "notCreatedYet": "Not created yet",
        "noOwner": "No owner assigned"
      },
      "prospect": {
        "eyebrow": "PROSPECT",
        "title": "Received data",
        "description": "Main information submitted by the prospect."
      },
      "source": {
        "eyebrow": "LEAD CAPTURE",
        "title": "Prospect source",
        "description": "See where this submission entered PHANYX.",
        "originPage": "Source page",
        "referrer": "Referrer"
      },
      "privacy": {
        "eyebrow": "PRIVACY",
        "title": "Consent and data protection",
        "consentText": "Text shown to the prospect",
        "registeredAt": "Recorded at {date}",
        "versionSuffix": " · Version {version}"
      },
      "marketing": {
        "eyebrow": "MARKETING",
        "title": "Campaign tracking",
        "description": "Data used to identify the campaign source.",
        "adIdentifiers": "Ad identifiers",
        "source": "Campaign source",
        "medium": "Medium",
        "content": "Content",
        "term": "Term"
      },
      "integrationHistory": {
        "eyebrow": "INTEGRATIONS",
        "title": "Integration history",
        "description": "Events related to this submission being received or sent.",
        "technicalInformation": "Technical information",
        "headers": "Headers",
        "sentData": "Sent data",
        "response": "Response"
      },
      "processing": {
        "eyebrow": "PROCESSING",
        "title": "Current status"
      },
      "commercial": {
        "title": "Commercial result",
        "open360": "Open 360° Profile",
        "noLeadTitle": "No lead linked",
        "noLeadDescription": "Processing has not yet created or linked a lead to this submission."
      },
      "technical": {
        "title": "Technical data",
        "description": "Information for support, auditing, and diagnostics.",
        "externalIdentifier": "External identifier",
        "errorCode": "Error code",
        "deduplicationKey": "Deduplication key",
        "protectedIp": "Protected IP",
        "originalData": "Originally received data",
        "normalizedData": "Data normalized by PHANYX",
        "noData": "No data.",
        "cannotDisplayData": "Could not display this data."
      },
      "retryModal": {
        "title": "Try processing again?",
        "description": "PHANYX will check this submission's data again.",
        "deduplication": "If a matching lead already exists, the deduplication rules will be respected."
      },
      "success": {
        "reprocessed": "Submission reprocessed successfully."
      }
    }
  },
  "es-ES": {
    "common": {
      "backToLeadGenerationCenter": "← Central de Captación",
      "refresh": "↻ Actualizar",
      "refreshing": "Actualizando...",
      "search": "Buscar",
      "status": "Estado",
      "allFeminine": "Todas",
      "allMasculine": "Todos",
      "channel": "Canal",
      "campaign": "Campaña",
      "form": "Formulario",
      "integration": "Integración",
      "clear": "Limpiar",
      "filter": "Filtrar",
      "origin": "Origen",
      "interest": "Interés",
      "unit": "Unidad",
      "notInformed": "No informado",
      "consentRecorded": "Consentimiento registrado",
      "consentNotRecorded": "Consentimiento no registrado",
      "whatHappened": "Qué ocurrió",
      "viewDetails": "Ver detalles",
      "openLead": "Abrir lead",
      "retry": "Intentar de nuevo",
      "processing": "Procesando...",
      "previous": "Anterior",
      "next": "Siguiente",
      "cancel": "Cancelar",
      "pagination": "Página {page} de {pages}",
      "name": "Nombre",
      "email": "Correo electrónico",
      "phone": "Teléfono",
      "language": "Idioma",
      "inbound": "Entrada",
      "outbound": "Salida",
      "result": "Resultado",
      "attempts": "Intentos",
      "received": "Recibido",
      "processed": "Procesado",
      "lastUpdate": "Última actualización",
      "lead": "Lead",
      "course": "Curso",
      "owner": "Responsable",
      "team": "Equipo",
      "submissionNumber": "Envío #{id}"
    },
    "statuses": {
      "received": {
        "name": "Recibido",
        "description": "Los datos se recibieron y están a la espera de procesamiento."
      },
      "validating": {
        "name": "Validando datos",
        "description": "PHANYX está verificando los datos recibidos."
      },
      "processing": {
        "name": "En procesamiento",
        "description": "PHANYX está creando o actualizando el lead."
      },
      "processed": {
        "name": "Procesado",
        "description": "Los datos se procesaron correctamente."
      },
      "duplicate": {
        "name": "Duplicado",
        "description": "Esta entrada ya se había recibido anteriormente."
      },
      "rejected": {
        "name": "No procesado",
        "description": "No se pudieron procesar los datos."
      },
      "spam": {
        "name": "Bloqueado como spam",
        "description": "La entrada fue bloqueada por los mecanismos de protección."
      },
      "error": {
        "name": "Con error",
        "description": "Se produjo un problema durante el procesamiento."
      }
    },
    "results": {
      "waiting": "Esperando resultado",
      "notChecked": "Aún no verificado",
      "newLead": "Nuevo lead creado",
      "existingLeadUpdated": "Lead existente actualizado",
      "duplicateIgnored": "Entrada duplicada ignorada",
      "manualReview": "Necesita revisión"
    },
    "eventStatuses": {
      "received": "Recibido",
      "pending": "Pendiente",
      "processing": "Procesando",
      "processed": "Procesado",
      "delivered": "Entregado",
      "discarded": "Descartado",
      "error": "Con error"
    },
    "persistedErrors": {
      "requiredField": "El campo \"{field}\" es obligatorio.",
      "fields": {
        "fullName": "Nombre completo",
        "email": "Correo electrónico",
        "phone": "Teléfono"
      }
    },
    "errors": {
      "load": "No se pudieron cargar los envíos.",
      "loadDetail": "No se pudo consultar este envío.",
      "invalidSubmission": "Envío no válido.",
      "retry": "No se pudo intentar de nuevo."
    },
    "list": {
      "loading": "Cargando envíos...",
      "header": {
        "title": "Envíos recibidos",
        "description": "Consulta los datos enviados por los interesados y el resultado de cada procesamiento."
      },
      "summary": {
        "total": "Total recibido",
        "totalHelp": "Todos los envíos",
        "processed": "Procesados",
        "processedHelp": "Completados correctamente",
        "inProgress": "En curso",
        "inProgressHelp": "Esperando o procesando",
        "attention": "Requieren atención",
        "attentionHelp": "Rechazados o con error"
      },
      "filters": {
        "searchPlaceholder": "Nombre, correo o teléfono...",
        "leadResult": "Resultado del lead",
        "allChannels": "Todos los canales",
        "allCampaigns": "Todas las campañas",
        "allForms": "Todos los formularios",
        "allIntegrations": "Todas las integraciones"
      },
      "received": {
        "title": "Envíos recibidos",
        "results": "{count, plural, one {# envío encontrado.} other {# envíos encontrados.}}"
      },
      "empty": {
        "title": "No se encontraron envíos",
        "description": "Ajusta los filtros o espera a que nuevos interesados envíen sus datos."
      },
      "item": {
        "unnamedProspect": "Interesado sin nombre",
        "unknownOrigin": "Origen no identificado",
        "receivedAt": "Recibido el",
        "processedPrefix": "Procesado"
      },
      "retryModal": {
        "title": "¿Intentar procesar de nuevo?",
        "description": "PHANYX volverá a comprobar los datos enviados por {name}.",
        "thisProspect": "este interesado",
        "deduplication": "Si ya existe un lead coincidente, se respetarán las reglas de deduplicación."
      },
      "success": {
        "requeued": "Envío enviado de nuevo para su procesamiento."
      }
    },
    "detail": {
      "loading": "Cargando envío...",
      "loadError": {
        "back": "← Volver a los envíos",
        "title": "No se pudo abrir este envío"
      },
      "header": {
        "back": "← Envíos recibidos",
        "receivedAt": "Envío #{id} recibido el {date}"
      },
      "summary": {
        "resultingLead": "Lead resultante",
        "unknownOrigin": "No identificado",
        "noCampaign": "Sin campaña vinculada",
        "unitNotInformed": "Unidad no informada",
        "unitValue": "Unidad: {name}",
        "notCreatedYet": "Aún no creado",
        "noOwner": "Sin responsable asignado"
      },
      "prospect": {
        "eyebrow": "INTERESADO",
        "title": "Datos recibidos",
        "description": "Información principal enviada por el interesado."
      },
      "source": {
        "eyebrow": "CAPTACIÓN",
        "title": "Origen del interesado",
        "description": "Consulta desde dónde llegó este envío a PHANYX.",
        "originPage": "Página de origen",
        "referrer": "Referencia"
      },
      "privacy": {
        "eyebrow": "PRIVACIDAD",
        "title": "Consentimiento y protección de datos",
        "consentText": "Texto mostrado al interesado",
        "registeredAt": "Registrado el {date}",
        "versionSuffix": " · Versión {version}"
      },
      "marketing": {
        "eyebrow": "MARKETING",
        "title": "Seguimiento de campaña",
        "description": "Datos utilizados para identificar el origen de la campaña.",
        "adIdentifiers": "Identificadores de anuncios",
        "source": "Origen de la campaña",
        "medium": "Medio",
        "content": "Contenido",
        "term": "Término"
      },
      "integrationHistory": {
        "eyebrow": "INTEGRACIONES",
        "title": "Historial de integración",
        "description": "Eventos relacionados con la entrada o salida de este envío.",
        "technicalInformation": "Información técnica",
        "headers": "Cabeceras",
        "sentData": "Datos enviados",
        "response": "Respuesta"
      },
      "processing": {
        "eyebrow": "PROCESAMIENTO",
        "title": "Estado actual"
      },
      "commercial": {
        "title": "Resultado comercial",
        "open360": "Abrir Ficha 360°",
        "noLeadTitle": "Ningún lead vinculado",
        "noLeadDescription": "El procesamiento aún no ha generado ni vinculado un lead a este envío."
      },
      "technical": {
        "title": "Datos técnicos",
        "description": "Información para soporte, auditoría y diagnóstico.",
        "externalIdentifier": "Identificador externo",
        "errorCode": "Código de error",
        "deduplicationKey": "Clave de deduplicación",
        "protectedIp": "IP protegida",
        "originalData": "Datos recibidos originalmente",
        "normalizedData": "Datos normalizados por PHANYX",
        "noData": "Sin datos.",
        "cannotDisplayData": "No se pudieron mostrar estos datos."
      },
      "retryModal": {
        "title": "¿Intentar procesar de nuevo?",
        "description": "PHANYX volverá a comprobar los datos de este envío.",
        "deduplication": "Si ya existe un lead coincidente, se respetarán las reglas de deduplicación."
      },
      "success": {
        "reprocessed": "Envío reprocesado correctamente."
      }
    }
  },
  "fr-FR": {
    "common": {
      "backToLeadGenerationCenter": "← Centre d’acquisition",
      "refresh": "↻ Actualiser",
      "refreshing": "Actualisation...",
      "search": "Rechercher",
      "status": "Statut",
      "allFeminine": "Toutes",
      "allMasculine": "Tous",
      "channel": "Canal",
      "campaign": "Campagne",
      "form": "Formulaire",
      "integration": "Intégration",
      "clear": "Effacer",
      "filter": "Filtrer",
      "origin": "Origine",
      "interest": "Intérêt",
      "unit": "Unité",
      "notInformed": "Non renseigné",
      "consentRecorded": "Consentement enregistré",
      "consentNotRecorded": "Consentement non enregistré",
      "whatHappened": "Ce qui s’est passé",
      "viewDetails": "Voir les détails",
      "openLead": "Ouvrir le lead",
      "retry": "Réessayer",
      "processing": "Traitement...",
      "previous": "Précédente",
      "next": "Suivante",
      "cancel": "Annuler",
      "pagination": "Page {page} sur {pages}",
      "name": "Nom",
      "email": "E-mail",
      "phone": "Téléphone",
      "language": "Langue",
      "inbound": "Entrée",
      "outbound": "Sortie",
      "result": "Résultat",
      "attempts": "Tentatives",
      "received": "Reçu",
      "processed": "Traité",
      "lastUpdate": "Dernière mise à jour",
      "lead": "Lead",
      "course": "Formation",
      "owner": "Responsable",
      "team": "Équipe",
      "submissionNumber": "Soumission #{id}"
    },
    "statuses": {
      "received": {
        "name": "Reçue",
        "description": "Les données ont été reçues et attendent leur traitement."
      },
      "validating": {
        "name": "Validation des données",
        "description": "PHANYX vérifie les données reçues."
      },
      "processing": {
        "name": "En traitement",
        "description": "PHANYX crée ou met à jour le lead."
      },
      "processed": {
        "name": "Traitée",
        "description": "Les données ont été traitées avec succès."
      },
      "duplicate": {
        "name": "Doublon",
        "description": "Cette entrée avait déjà été reçue."
      },
      "rejected": {
        "name": "Non traitée",
        "description": "Les données n’ont pas pu être traitées."
      },
      "spam": {
        "name": "Bloquée comme spam",
        "description": "L’entrée a été bloquée par les mécanismes de protection."
      },
      "error": {
        "name": "En erreur",
        "description": "Un problème est survenu pendant le traitement."
      }
    },
    "results": {
      "waiting": "En attente du résultat",
      "notChecked": "Pas encore vérifié",
      "newLead": "Nouveau lead créé",
      "existingLeadUpdated": "Lead existant mis à jour",
      "duplicateIgnored": "Entrée en doublon ignorée",
      "manualReview": "Nécessite une vérification"
    },
    "eventStatuses": {
      "received": "Reçu",
      "pending": "En attente",
      "processing": "Traitement",
      "processed": "Traité",
      "delivered": "Livré",
      "discarded": "Écarté",
      "error": "En erreur"
    },
    "persistedErrors": {
      "requiredField": "Le champ « {field} » est obligatoire.",
      "fields": {
        "fullName": "Nom complet",
        "email": "E-mail",
        "phone": "Téléphone"
      }
    },
    "errors": {
      "load": "Impossible de charger les soumissions.",
      "loadDetail": "Impossible de consulter cette soumission.",
      "invalidSubmission": "Soumission non valide.",
      "retry": "Impossible de réessayer."
    },
    "list": {
      "loading": "Chargement des soumissions...",
      "header": {
        "title": "Soumissions reçues",
        "description": "Suivez les données envoyées par les prospects et le résultat de chaque traitement."
      },
      "summary": {
        "total": "Total reçu",
        "totalHelp": "Toutes les soumissions",
        "processed": "Traitées",
        "processedHelp": "Terminées avec succès",
        "inProgress": "En cours",
        "inProgressHelp": "En attente ou en traitement",
        "attention": "Nécessitent une attention",
        "attentionHelp": "Rejetées ou en erreur"
      },
      "filters": {
        "searchPlaceholder": "Nom, e-mail ou téléphone...",
        "leadResult": "Résultat du lead",
        "allChannels": "Tous les canaux",
        "allCampaigns": "Toutes les campagnes",
        "allForms": "Tous les formulaires",
        "allIntegrations": "Toutes les intégrations"
      },
      "received": {
        "title": "Envois reçus",
        "results": "{count, plural, one {# soumission trouvée.} other {# soumissions trouvées.}}"
      },
      "empty": {
        "title": "Aucune soumission trouvée",
        "description": "Ajustez les filtres ou attendez que de nouveaux prospects envoient leurs données."
      },
      "item": {
        "unnamedProspect": "Prospect sans nom",
        "unknownOrigin": "Origine non identifiée",
        "receivedAt": "Reçu le",
        "processedPrefix": "Traité"
      },
      "retryModal": {
        "title": "Relancer le traitement ?",
        "description": "PHANYX vérifiera à nouveau les données envoyées par {name}.",
        "thisProspect": "ce prospect",
        "deduplication": "Si un lead correspondant existe déjà, les règles de déduplication seront respectées."
      },
      "success": {
        "requeued": "Soumission renvoyée pour traitement."
      }
    },
    "detail": {
      "loading": "Chargement de la soumission...",
      "loadError": {
        "back": "← Retour aux soumissions",
        "title": "Impossible d’ouvrir cette soumission"
      },
      "header": {
        "back": "← Soumissions reçues",
        "receivedAt": "Soumission #{id} reçue le {date}"
      },
      "summary": {
        "resultingLead": "Lead obtenu",
        "unknownOrigin": "Non identifiée",
        "noCampaign": "Aucune campagne associée",
        "unitNotInformed": "Unité non renseignée",
        "unitValue": "Unité : {name}",
        "notCreatedYet": "Pas encore créé",
        "noOwner": "Aucun responsable défini"
      },
      "prospect": {
        "eyebrow": "PROSPECT",
        "title": "Données reçues",
        "description": "Principales informations envoyées par le prospect."
      },
      "source": {
        "eyebrow": "ACQUISITION",
        "title": "Origine du prospect",
        "description": "Consultez l’origine de cette soumission dans PHANYX.",
        "originPage": "Page d’origine",
        "referrer": "Référence"
      },
      "privacy": {
        "eyebrow": "CONFIDENTIALITÉ",
        "title": "Consentement et protection des données",
        "consentText": "Texte présenté au prospect",
        "registeredAt": "Enregistré le {date}",
        "versionSuffix": " · Version {version}"
      },
      "marketing": {
        "eyebrow": "MARKETING",
        "title": "Suivi de la campagne",
        "description": "Données utilisées pour identifier l’origine de la campagne.",
        "adIdentifiers": "Identifiants publicitaires",
        "source": "Origine de la campagne",
        "medium": "Support",
        "content": "Contenu",
        "term": "Terme"
      },
      "integrationHistory": {
        "eyebrow": "INTÉGRATIONS",
        "title": "Historique d’intégration",
        "description": "Événements liés à l’entrée ou à la sortie de cette soumission.",
        "technicalInformation": "Informations techniques",
        "headers": "En-têtes",
        "sentData": "Données envoyées",
        "response": "Réponse"
      },
      "processing": {
        "eyebrow": "TRAITEMENT",
        "title": "Statut actuel"
      },
      "commercial": {
        "title": "Résultat commercial",
        "open360": "Ouvrir la fiche 360°",
        "noLeadTitle": "Aucun lead associé",
        "noLeadDescription": "Le traitement n’a pas encore créé ni associé de lead à cette soumission."
      },
      "technical": {
        "title": "Données techniques",
        "description": "Informations pour le support, l’audit et le diagnostic.",
        "externalIdentifier": "Identifiant externe",
        "errorCode": "Code d’erreur",
        "deduplicationKey": "Clé de déduplication",
        "protectedIp": "IP protégée",
        "originalData": "Données reçues à l’origine",
        "normalizedData": "Données normalisées par PHANYX",
        "noData": "Aucune donnée.",
        "cannotDisplayData": "Impossible d’afficher ces données."
      },
      "retryModal": {
        "title": "Relancer le traitement ?",
        "description": "PHANYX vérifiera à nouveau les données de cette soumission.",
        "deduplication": "Si un lead correspondant existe déjà, les règles de déduplication seront respectées."
      },
      "success": {
        "reprocessed": "Soumission retraitée avec succès."
      }
    }
  }
};

const namespace = "AdminCommercialSubmissions";

for (const [locale, bloco] of Object.entries(traducoes)) {
  const arquivo = path.join(
    process.cwd(),
    "messages",
    `${locale}.json`
  );

  if (!fs.existsSync(arquivo)) {
    throw new Error(
      `Arquivo não encontrado: ${arquivo}`
    );
  }

  const conteudo =
    fs.readFileSync(
      arquivo,
      "utf8"
    );

  const json =
    JSON.parse(
      conteudo
    );

  const backup =
    `${arquivo}.bak-admin-commercial-submissions`;

  if (!fs.existsSync(backup)) {
    fs.copyFileSync(
      arquivo,
      backup
    );
  }

  json[namespace] =
    bloco;

  fs.writeFileSync(
    arquivo,
    JSON.stringify(
      json,
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(
    `✓ ${locale}: ${namespace} atualizado`
  );
}

console.log(
  "\nConcluído. Os cinco arquivos de idioma foram atualizados."
);
