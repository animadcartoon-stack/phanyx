import fs from "node:fs";
import path from "node:path";

const namespace = "AdminCommercialCommissionSettings";

const traducoes = {
  "pt-BR": {
    "overview": {
      "common": {
        "noLimit": "Sem limite",
        "invalidDate": "Data inválida",
        "until": "até"
      },
      "header": {
        "section": "Comercial",
        "title": "Planos de comissão",
        "description": "Defina como as vendas serão avaliadas antes de gerar comissão para os vendedores."
      },
      "errors": {
        "load": "Não foi possível carregar os planos de comissão.",
        "nameRequired": "Informe o nome do plano de comissão.",
        "create": "Não foi possível criar o plano de comissão."
      },
      "success": {
        "created": "Plano de comissão criado com sucesso."
      },
      "form": {
        "title": "Novo plano de comissão",
        "description": "Criar o plano não libera vendedores imediatamente. O plano ainda precisará ter regras ativas e vendedores vinculados.",
        "name": {
          "label": "Nome do plano",
          "placeholder": "Ex.: Comissão vendedores 2026"
        },
        "descriptionField": {
          "label": "Descrição",
          "placeholder": "Ex.: Plano padrão da equipe comercial"
        },
        "startDate": "Início da vigência",
        "endDate": "Fim da vigência",
        "active": {
          "title": "Plano ativo",
          "description": "Permite que o plano seja usado durante sua vigência."
        },
        "confirmedPayment": {
          "title": "Exigir pagamento confirmado",
          "description": "A matrícula sozinha não torna a comissão elegível."
        },
        "sharedSale": {
          "title": "Permitir venda compartilhada",
          "description": "Permite dividir uma comissão entre vendedores participantes."
        },
        "creating": "Criando plano...",
        "create": "Criar plano de comissão"
      },
      "list": {
        "title": "Planos cadastrados",
        "description": "Um plano só fica pronto quando possui pelo menos uma regra ativa.",
        "loading": "Carregando planos...",
        "emptyTitle": "Nenhum plano cadastrado",
        "emptyDescription": "Cadastre o primeiro plano usando o formulário acima.",
        "noDescription": "Sem descrição cadastrada.",
        "configured": "Configurado",
        "pendingConfiguration": "Configuração pendente",
        "validity": "Vigência",
        "activeRules": "Regras ativas",
        "linkedSellers": "Vendedores vinculados",
        "confirmedPayment": "Pagamento confirmado",
        "required": "Obrigatório",
        "notRequired": "Não obrigatório",
        "warning": "Este plano ainda não libera vendedores porque não possui regra ativa.",
        "configureRules": "Configurar regras"
      }
    },
    "plan": {
      "invalidPlan": "Plano inválido.",
      "common": {
        "noLimit": "Sem limite",
        "invalidDate": "Data inválida",
        "until": "até",
        "course": "Curso",
        "department": "Departamento",
        "role": "Cargo ou função",
        "employee": "Funcionário",
        "description": "Descrição",
        "startDate": "Início da vigência",
        "endDate": "Fim da vigência",
        "notes": "Observações",
        "notesLabel": "Observações:",
        "validityLabel": "Vigência:",
        "active": "Ativo",
        "ended": "Encerrado",
        "activeFeminine": "Ativa",
        "inactiveFeminine": "Inativa",
        "noDescription": "Sem descrição.",
        "all": "Todos",
        "yes": "Sim",
        "no": "Não",
        "selectDepartment": "Selecione o departamento...",
        "selectRole": "Selecione o cargo ou a função...",
        "selectEmployee": "Selecione o funcionário...",
        "activeEmployees": "{count, plural, one {# funcionário ativo} other {# funcionários ativos}}"
      },
      "header": {
        "back": "← Voltar aos planos",
        "section": "Plano de comissão",
        "configureRulesFallback": "Configurar regras",
        "description": "Defina quem participa e qual regra será aplicada a cada departamento, cargo ou funcionário."
      },
      "participation": {
        "title": "👥 Quem recebe comissão neste plano",
        "description": "Esta escolha define se apenas os responsáveis pela matrícula ou todos os funcionários vinculados ao plano receberão comissão.",
        "onlyEnrollment": {
          "title": "🎯 Somente participantes da matrícula",
          "description": "Recebem apenas o vendedor responsável e os participantes comerciais registrados naquela matrícula."
        },
        "allLinked": {
          "title": "🏢 Todos os vinculados ao plano",
          "description": "Todos os funcionários ativos vinculados ao plano participam, mesmo sem login, conforme a regra aplicável ao cargo, departamento ou pessoa."
        },
        "warning": "Para gerente, coordenador, vendedores, captação de leads e outras funções receberem percentuais diferentes dentro do mesmo plano, crie uma regra geral e depois cadastre as exceções específicas."
      },
      "ruleForm": {
        "editTitle": "Editar regra de comissão",
        "newGeneralTitle": "Nova regra geral de comissão",
        "newExceptionTitle": "Nova exceção de comissão",
        "editDescription": "Altere os dados abaixo e salve. A edição afeta somente os próximos cálculos de comissão.",
        "precedenceDescription": "A precedência é: funcionário específico, cargo ou função, departamento e, por último, regra geral.",
        "application": "Aplicação da regra",
        "scope": {
          "general": {
            "title": "🌐 Regra geral",
            "description": "Aplicada quando não existir uma regra mais específica."
          },
          "department": {
            "title": "🏢 Departamento",
            "description": "Exceção para todos os funcionários de um departamento."
          },
          "role": {
            "title": "🪪 Cargo ou função",
            "description": "Exceção para gerente, coordenador, vendedor, leads etc."
          },
          "employee": {
            "title": "👤 Funcionário específico",
            "description": "Maior prioridade para uma condição individual."
          }
        },
        "createGeneralFirst": "Crie primeiro uma regra geral. Depois as opções de exceção serão liberadas.",
        "baseRule": "Regra geral de origem",
        "selectBaseRule": "Selecione o grupo de comissão...",
        "inheritedBase": "Base herdada",
        "inheritedTrigger": "Gatilho herdado",
        "currentGeneralValue": "Valor geral atual",
        "ruleName": "Nome da regra",
        "specificCourse": "Curso específico",
        "allCourses": "Todos os cursos",
        "commissionType": "Tipo da comissão",
        "percentage": "Percentual",
        "fixedValue": "Valor fixo",
        "calculationBase": "Base de cálculo",
        "trigger": "Gatilho para comissão",
        "minimumQuantity": "Quantidade mínima",
        "maximumQuantity": "Quantidade máxima",
        "refundGrace": "Carência para estorno",
        "applicationOrder": "Ordem de aplicação",
        "noMinimum": "Sem mínimo",
        "noMaximum": "Sem máximo",
        "placeholders": {
          "generalRule": "Ex.: Comissão principal",
          "managerRule": "Ex.: Comissão do gerente comercial",
          "exceptionRule": "Ex.: Exceção de comissão",
          "description": "Explique quando esta regra deverá ser aplicada."
        },
        "useNetReceived": {
          "title": "Usar valor líquido recebido",
          "description": "Evita comissão sobre valores que não entraram no caixa."
        },
        "refundCancellation": {
          "title": "Estornar em cancelamento",
          "description": "Protege a instituição contra vendas canceladas."
        },
        "refundDelinquency": {
          "title": "Estornar em inadimplência",
          "description": "Permite recuperar comissão quando o pagamento deixa de ser válido."
        },
        "activeRule": {
          "title": "Regra ativa",
          "description": "Somente regras ativas participam do cálculo."
        },
        "activeException": {
          "title": "Exceção ativa",
          "description": "Quando ativa, esta regra substitui a regra geral para o alvo selecionado."
        },
        "savingChanges": "Salvando alterações...",
        "savingRule": "Salvando regra...",
        "saveChanges": "Salvar alterações",
        "createGeneral": "Criar regra geral",
        "createException": "Criar exceção de comissão",
        "cancelEdit": "Cancelar edição"
      },
      "participants": {
        "title": "👥 Vincular participantes",
        "description": "Inclua um funcionário específico ou todos os funcionários ativos de um departamento. Não é necessário que o funcionário possua login no PHANYX.",
        "warning": "A vinculação define quem poderá participar. O percentual aplicado é escolhido pela precedência: funcionário, cargo, departamento e regra geral.",
        "linkType": "Forma de vinculação",
        "individual": {
          "title": "👤 Funcionário individual",
          "description": "Escolha uma pessoa específica para participar do plano."
        },
        "department": {
          "title": "🏢 Departamento inteiro",
          "description": "Inclua todos os funcionários ativos do departamento de uma vez."
        },
        "selectParticipant": "Selecione o participante...",
        "duplicateNote": "Funcionários que já possuam outro plano ativo no mesmo período não serão duplicados.",
        "endDateHelp": "Deixe vazio para manter o vínculo sem data final.",
        "placeholders": {
          "departmentBatch": "Ex.: Equipe comercial vinculada em lote",
          "individual": "Ex.: Participante com condição individual"
        },
        "linking": "Vinculando participantes...",
        "linkDepartment": "Vincular departamento ao plano",
        "linkEmployee": "Vincular funcionário ao plano",
        "linkedTitle": "Participantes vinculados",
        "empty": "Nenhum participante vinculado a este plano.",
        "roleNotProvided": "Cargo não informado",
        "includedByDepartment": "🏢 Incluído por departamento: {name}",
        "individualLink": "👤 Vínculo individual"
      },
      "rules": {
        "title": "Regras cadastradas",
        "description": "Dentro do mesmo grupo, somente a regra mais específica será usada para cada funcionário.",
        "loading": "Carregando regras...",
        "empty": "Nenhuma regra cadastrada neste plano.",
        "group": "Grupo: {name}",
        "exceptions": "{count, plural, one {# exceção} other {# exceções}}",
        "application": "Aplicação",
        "commission": "Comissão",
        "base": "Base",
        "trigger": "Gatilho",
        "course": "Curso: {name}",
        "refundGrace": "Carência para estorno: {count, plural, one {# dia} other {# dias}}",
        "refundCancellation": "Estorno por cancelamento: {value}",
        "refundDelinquency": "Estorno por inadimplência: {value}",
        "edit": "✏️ Editar regra"
      },
      "labels": {
        "base": {
          "enrollmentValue": "Valor da matrícula",
          "monthlyFeeValue": "Valor da mensalidade",
          "totalContractValue": "Valor total do contrato",
          "receivedValue": "Valor efetivamente recebido",
          "profit": "Lucro apurado",
          "enrollmentCount": "Quantidade de matrículas"
        },
        "trigger": {
          "enrollmentConfirmed": "Matrícula confirmada",
          "enrollmentPaymentConfirmed": "Pagamento da matrícula confirmado",
          "firstMonthlyFeePaid": "Primeira mensalidade paga",
          "eachMonthlyFeePaid": "Cada mensalidade paga",
          "manual": "Liberação manual pelo RH/Comercial"
        },
        "scope": {
          "general": "Regra geral",
          "department": "Departamento",
          "role": "Cargo ou função",
          "employee": "Funcionário específico"
        }
      },
      "targets": {
        "departmentUnknown": "Departamento não identificado",
        "roleUnknown": "Cargo não identificado",
        "employeeUnknown": "Funcionário não identificado",
        "general": "Todos os participantes sem regra mais específica"
      },
      "validation": {
        "ruleName": "Informe o nome da regra.",
        "baseRule": "Selecione a regra geral que receberá esta exceção.",
        "department": "Selecione o departamento desta regra.",
        "role": "Selecione o cargo ou a função desta regra.",
        "employee": "Selecione o funcionário desta regra.",
        "percentage": "Informe um percentual maior que zero e de no máximo 100%.",
        "fixedValue": "Informe o valor fixo da comissão.",
        "participantEmployee": "Selecione o funcionário participante.",
        "participantDepartment": "Selecione o departamento participante.",
        "linkStartDate": "Informe o início da vigência do vínculo."
      },
      "errors": {
        "loadRules": "Não foi possível carregar as regras.",
        "loadParticipants": "Não foi possível carregar os participantes do plano.",
        "loadConfiguration": "Não foi possível carregar a configuração.",
        "updateParticipationMode": "Não foi possível alterar o modo de participação.",
        "updateRule": "Não foi possível atualizar a regra.",
        "createRule": "Não foi possível criar a regra.",
        "linkParticipants": "Não foi possível vincular os participantes."
      },
      "success": {
        "participationModeUpdated": "Modo de participação atualizado com sucesso.",
        "ruleUpdated": "Regra atualizada com sucesso.",
        "ruleCreated": "Regra criada com sucesso.",
        "participantsLinked": "Participantes vinculados ao plano com sucesso."
      }
    }
  },
  "pt-PT": {
    "overview": {
      "common": {
        "noLimit": "Sem limite",
        "invalidDate": "Data inválida",
        "until": "até"
      },
      "header": {
        "section": "Comercial",
        "title": "Planos de comissão",
        "description": "Defina como as vendas serão avaliadas antes de gerar comissão para os vendedores."
      },
      "errors": {
        "load": "Não foi possível carregar os planos de comissão.",
        "nameRequired": "Indique o nome do plano de comissão.",
        "create": "Não foi possível criar o plano de comissão."
      },
      "success": {
        "created": "Plano de comissão criado com sucesso."
      },
      "form": {
        "title": "Novo plano de comissão",
        "description": "Criar o plano não disponibiliza vendedores imediatamente. O plano ainda terá de ter regras ativas e vendedores associados.",
        "name": {
          "label": "Nome do plano",
          "placeholder": "Ex.: Comissão vendedores 2026"
        },
        "descriptionField": {
          "label": "Descrição",
          "placeholder": "Ex.: Plano padrão da equipa comercial"
        },
        "startDate": "Início da vigência",
        "endDate": "Fim da vigência",
        "active": {
          "title": "Plano ativo",
          "description": "Permite que o plano seja utilizado durante a sua vigência."
        },
        "confirmedPayment": {
          "title": "Exigir pagamento confirmado",
          "description": "A matrícula, por si só, não torna a comissão elegível."
        },
        "sharedSale": {
          "title": "Permitir venda partilhada",
          "description": "Permite dividir uma comissão entre vendedores participantes."
        },
        "creating": "A criar plano...",
        "create": "Criar plano de comissão"
      },
      "list": {
        "title": "Planos registados",
        "description": "Um plano só fica pronto quando possui pelo menos uma regra ativa.",
        "loading": "A carregar planos...",
        "emptyTitle": "Nenhum plano registado",
        "emptyDescription": "Registe o primeiro plano utilizando o formulário acima.",
        "noDescription": "Sem descrição registada.",
        "configured": "Configurado",
        "pendingConfiguration": "Configuração pendente",
        "validity": "Vigência",
        "activeRules": "Regras ativas",
        "linkedSellers": "Vendedores associados",
        "confirmedPayment": "Pagamento confirmado",
        "required": "Obrigatório",
        "notRequired": "Não obrigatório",
        "warning": "Este plano ainda não disponibiliza vendedores porque não possui uma regra ativa.",
        "configureRules": "Configurar regras"
      }
    },
    "plan": {
      "invalidPlan": "Plano inválido.",
      "common": {
        "noLimit": "Sem limite",
        "invalidDate": "Data inválida",
        "until": "até",
        "course": "Curso",
        "department": "Departamento",
        "role": "Cargo ou função",
        "employee": "Funcionário",
        "description": "Descrição",
        "startDate": "Início da vigência",
        "endDate": "Fim da vigência",
        "notes": "Observações",
        "notesLabel": "Observações:",
        "validityLabel": "Vigência:",
        "active": "Ativo",
        "ended": "Terminado",
        "activeFeminine": "Ativa",
        "inactiveFeminine": "Inativa",
        "noDescription": "Sem descrição.",
        "all": "Todos",
        "yes": "Sim",
        "no": "Não",
        "selectDepartment": "Selecione o departamento...",
        "selectRole": "Selecione o cargo ou a função...",
        "selectEmployee": "Selecione o funcionário...",
        "activeEmployees": "{count, plural, one {# funcionário ativo} other {# funcionários ativos}}"
      },
      "header": {
        "back": "← Voltar aos planos",
        "section": "Plano de comissão",
        "configureRulesFallback": "Configurar regras",
        "description": "Defina quem participa e qual regra será aplicada a cada departamento, cargo ou funcionário."
      },
      "participation": {
        "title": "👥 Quem recebe comissão neste plano",
        "description": "Esta escolha define se apenas os responsáveis pela matrícula ou todos os funcionários associados ao plano receberão comissão.",
        "onlyEnrollment": {
          "title": "🎯 Apenas participantes da matrícula",
          "description": "Recebem apenas o vendedor responsável e os participantes comerciais registados nessa matrícula."
        },
        "allLinked": {
          "title": "🏢 Todos os associados ao plano",
          "description": "Todos os funcionários ativos associados ao plano participam, mesmo sem login, de acordo com a regra aplicável ao cargo, departamento ou pessoa."
        },
        "warning": "Para que gerente, coordenador, vendedores, captação de leads e outras funções recebam percentagens diferentes no mesmo plano, crie uma regra geral e depois registe as exceções específicas."
      },
      "ruleForm": {
        "editTitle": "Editar regra de comissão",
        "newGeneralTitle": "Nova regra geral de comissão",
        "newExceptionTitle": "Nova exceção de comissão",
        "editDescription": "Altere os dados abaixo e guarde. A edição afeta apenas os próximos cálculos de comissão.",
        "precedenceDescription": "A precedência é: funcionário específico, cargo ou função, departamento e, por último, regra geral.",
        "application": "Aplicação da regra",
        "scope": {
          "general": {
            "title": "🌐 Regra geral",
            "description": "Aplicada quando não existir uma regra mais específica."
          },
          "department": {
            "title": "🏢 Departamento",
            "description": "Exceção para todos os funcionários de um departamento."
          },
          "role": {
            "title": "🪪 Cargo ou função",
            "description": "Exceção para gerente, coordenador, vendedor, leads, etc."
          },
          "employee": {
            "title": "👤 Funcionário específico",
            "description": "Maior prioridade para uma condição individual."
          }
        },
        "createGeneralFirst": "Crie primeiro uma regra geral. Depois serão disponibilizadas as opções de exceção.",
        "baseRule": "Regra geral de origem",
        "selectBaseRule": "Selecione o grupo de comissão...",
        "inheritedBase": "Base herdada",
        "inheritedTrigger": "Gatilho herdado",
        "currentGeneralValue": "Valor geral atual",
        "ruleName": "Nome da regra",
        "specificCourse": "Curso específico",
        "allCourses": "Todos os cursos",
        "commissionType": "Tipo da comissão",
        "percentage": "Percentagem",
        "fixedValue": "Valor fixo",
        "calculationBase": "Base de cálculo",
        "trigger": "Gatilho para comissão",
        "minimumQuantity": "Quantidade mínima",
        "maximumQuantity": "Quantidade máxima",
        "refundGrace": "Carência para estorno",
        "applicationOrder": "Ordem de aplicação",
        "noMinimum": "Sem mínimo",
        "noMaximum": "Sem máximo",
        "placeholders": {
          "generalRule": "Ex.: Comissão principal",
          "managerRule": "Ex.: Comissão do gerente comercial",
          "exceptionRule": "Ex.: Exceção de comissão",
          "description": "Explique quando esta regra deverá ser aplicada."
        },
        "useNetReceived": {
          "title": "Utilizar valor líquido recebido",
          "description": "Evita comissão sobre valores que não entraram em caixa."
        },
        "refundCancellation": {
          "title": "Estornar em caso de cancelamento",
          "description": "Protege a instituição contra vendas canceladas."
        },
        "refundDelinquency": {
          "title": "Estornar em caso de incumprimento",
          "description": "Permite recuperar a comissão quando o pagamento deixa de ser válido."
        },
        "activeRule": {
          "title": "Regra ativa",
          "description": "Apenas regras ativas participam no cálculo."
        },
        "activeException": {
          "title": "Exceção ativa",
          "description": "Quando ativa, esta regra substitui a regra geral para o alvo selecionado."
        },
        "savingChanges": "A guardar alterações...",
        "savingRule": "A guardar regra...",
        "saveChanges": "Guardar alterações",
        "createGeneral": "Criar regra geral",
        "createException": "Criar exceção de comissão",
        "cancelEdit": "Cancelar edição"
      },
      "participants": {
        "title": "👥 Associar participantes",
        "description": "Inclua um funcionário específico ou todos os funcionários ativos de um departamento. Não é necessário que o funcionário tenha login no PHANYX.",
        "warning": "A associação define quem poderá participar. A percentagem aplicada é escolhida pela precedência: funcionário, cargo, departamento e regra geral.",
        "linkType": "Forma de associação",
        "individual": {
          "title": "👤 Funcionário individual",
          "description": "Escolha uma pessoa específica para participar no plano."
        },
        "department": {
          "title": "🏢 Departamento inteiro",
          "description": "Inclua todos os funcionários ativos do departamento de uma só vez."
        },
        "selectParticipant": "Selecione o participante...",
        "duplicateNote": "Os funcionários que já tenham outro plano ativo no mesmo período não serão duplicados.",
        "endDateHelp": "Deixe vazio para manter a associação sem data final.",
        "placeholders": {
          "departmentBatch": "Ex.: Equipa comercial associada em lote",
          "individual": "Ex.: Participante com condição individual"
        },
        "linking": "A associar participantes...",
        "linkDepartment": "Associar departamento ao plano",
        "linkEmployee": "Associar funcionário ao plano",
        "linkedTitle": "Participantes associados",
        "empty": "Nenhum participante associado a este plano.",
        "roleNotProvided": "Cargo não indicado",
        "includedByDepartment": "🏢 Incluído por departamento: {name}",
        "individualLink": "👤 Associação individual"
      },
      "rules": {
        "title": "Regras registadas",
        "description": "Dentro do mesmo grupo, apenas a regra mais específica será utilizada para cada funcionário.",
        "loading": "A carregar regras...",
        "empty": "Nenhuma regra registada neste plano.",
        "group": "Grupo: {name}",
        "exceptions": "{count, plural, one {# exceção} other {# exceções}}",
        "application": "Aplicação",
        "commission": "Comissão",
        "base": "Base",
        "trigger": "Gatilho",
        "course": "Curso: {name}",
        "refundGrace": "Carência para estorno: {count, plural, one {# dia} other {# dias}}",
        "refundCancellation": "Estorno por cancelamento: {value}",
        "refundDelinquency": "Estorno por incumprimento: {value}",
        "edit": "✏️ Editar regra"
      },
      "labels": {
        "base": {
          "enrollmentValue": "Valor da matrícula",
          "monthlyFeeValue": "Valor da mensalidade",
          "totalContractValue": "Valor total do contrato",
          "receivedValue": "Valor efetivamente recebido",
          "profit": "Lucro apurado",
          "enrollmentCount": "Quantidade de matrículas"
        },
        "trigger": {
          "enrollmentConfirmed": "Matrícula confirmada",
          "enrollmentPaymentConfirmed": "Pagamento da matrícula confirmado",
          "firstMonthlyFeePaid": "Primeira mensalidade paga",
          "eachMonthlyFeePaid": "Cada mensalidade paga",
          "manual": "Libertação manual pelo RH/Comercial"
        },
        "scope": {
          "general": "Regra geral",
          "department": "Departamento",
          "role": "Cargo ou função",
          "employee": "Funcionário específico"
        }
      },
      "targets": {
        "departmentUnknown": "Departamento não identificado",
        "roleUnknown": "Cargo não identificado",
        "employeeUnknown": "Funcionário não identificado",
        "general": "Todos os participantes sem regra mais específica"
      },
      "validation": {
        "ruleName": "Indique o nome da regra.",
        "baseRule": "Selecione a regra geral que receberá esta exceção.",
        "department": "Selecione o departamento desta regra.",
        "role": "Selecione o cargo ou a função desta regra.",
        "employee": "Selecione o funcionário desta regra.",
        "percentage": "Indique uma percentagem superior a zero e, no máximo, 100%.",
        "fixedValue": "Indique o valor fixo da comissão.",
        "participantEmployee": "Selecione o funcionário participante.",
        "participantDepartment": "Selecione o departamento participante.",
        "linkStartDate": "Indique o início da vigência da associação."
      },
      "errors": {
        "loadRules": "Não foi possível carregar as regras.",
        "loadParticipants": "Não foi possível carregar os participantes do plano.",
        "loadConfiguration": "Não foi possível carregar a configuração.",
        "updateParticipationMode": "Não foi possível alterar o modo de participação.",
        "updateRule": "Não foi possível atualizar a regra.",
        "createRule": "Não foi possível criar a regra.",
        "linkParticipants": "Não foi possível associar os participantes."
      },
      "success": {
        "participationModeUpdated": "Modo de participação atualizado com sucesso.",
        "ruleUpdated": "Regra atualizada com sucesso.",
        "ruleCreated": "Regra criada com sucesso.",
        "participantsLinked": "Participantes associados ao plano com sucesso."
      }
    }
  },
  "en-US": {
    "overview": {
      "common": {
        "noLimit": "No limit",
        "invalidDate": "Invalid date",
        "until": "to"
      },
      "header": {
        "section": "Sales",
        "title": "Commission plans",
        "description": "Define how sales are evaluated before commissions are generated for salespeople."
      },
      "errors": {
        "load": "Could not load the commission plans.",
        "nameRequired": "Enter a name for the commission plan.",
        "create": "Could not create the commission plan."
      },
      "success": {
        "created": "Commission plan created successfully."
      },
      "form": {
        "title": "New commission plan",
        "description": "Creating the plan does not make salespeople eligible immediately. The plan still needs active rules and linked salespeople.",
        "name": {
          "label": "Plan name",
          "placeholder": "e.g. Sales commission 2026"
        },
        "descriptionField": {
          "label": "Description",
          "placeholder": "e.g. Standard sales team plan"
        },
        "startDate": "Effective start date",
        "endDate": "Effective end date",
        "active": {
          "title": "Active plan",
          "description": "Allows the plan to be used while it is in effect."
        },
        "confirmedPayment": {
          "title": "Require confirmed payment",
          "description": "Enrollment alone does not make the commission eligible."
        },
        "sharedSale": {
          "title": "Allow shared sales",
          "description": "Allows a commission to be split among participating salespeople."
        },
        "creating": "Creating plan...",
        "create": "Create commission plan"
      },
      "list": {
        "title": "Registered plans",
        "description": "A plan is ready only when it has at least one active rule.",
        "loading": "Loading plans...",
        "emptyTitle": "No plans registered",
        "emptyDescription": "Create the first plan using the form above.",
        "noDescription": "No description provided.",
        "configured": "Configured",
        "pendingConfiguration": "Configuration pending",
        "validity": "Effective period",
        "activeRules": "Active rules",
        "linkedSellers": "Linked salespeople",
        "confirmedPayment": "Confirmed payment",
        "required": "Required",
        "notRequired": "Not required",
        "warning": "This plan does not make salespeople eligible yet because it has no active rule.",
        "configureRules": "Configure rules"
      }
    },
    "plan": {
      "invalidPlan": "Invalid plan.",
      "common": {
        "noLimit": "No limit",
        "invalidDate": "Invalid date",
        "until": "to",
        "course": "Course",
        "department": "Department",
        "role": "Role or position",
        "employee": "Employee",
        "description": "Description",
        "startDate": "Effective start date",
        "endDate": "Effective end date",
        "notes": "Notes",
        "notesLabel": "Notes:",
        "validityLabel": "Effective period:",
        "active": "Active",
        "ended": "Ended",
        "activeFeminine": "Active",
        "inactiveFeminine": "Inactive",
        "noDescription": "No description.",
        "all": "All",
        "yes": "Yes",
        "no": "No",
        "selectDepartment": "Select the department...",
        "selectRole": "Select the role or position...",
        "selectEmployee": "Select the employee...",
        "activeEmployees": "{count, plural, one {# active employee} other {# active employees}}"
      },
      "header": {
        "back": "← Back to plans",
        "section": "Commission plan",
        "configureRulesFallback": "Configure rules",
        "description": "Define who participates and which rule applies to each department, role, or employee."
      },
      "participation": {
        "title": "👥 Who receives commission in this plan",
        "description": "This choice determines whether only the people responsible for the enrollment or all employees linked to the plan receive commission.",
        "onlyEnrollment": {
          "title": "🎯 Enrollment participants only",
          "description": "Only the responsible salesperson and commercial participants recorded on that enrollment receive commission."
        },
        "allLinked": {
          "title": "🏢 Everyone linked to the plan",
          "description": "All active employees linked to the plan participate, even without a login, according to the rule that applies to the role, department, or person."
        },
        "warning": "To give managers, coordinators, salespeople, lead-generation staff, and other roles different percentages within the same plan, create a general rule and then add specific exceptions."
      },
      "ruleForm": {
        "editTitle": "Edit commission rule",
        "newGeneralTitle": "New general commission rule",
        "newExceptionTitle": "New commission exception",
        "editDescription": "Change the information below and save. The edit affects only future commission calculations.",
        "precedenceDescription": "Precedence is: specific employee, role or position, department, and finally the general rule.",
        "application": "Rule application",
        "scope": {
          "general": {
            "title": "🌐 General rule",
            "description": "Applied when no more specific rule exists."
          },
          "department": {
            "title": "🏢 Department",
            "description": "Exception for all employees in a department."
          },
          "role": {
            "title": "🪪 Role or position",
            "description": "Exception for manager, coordinator, salesperson, leads, etc."
          },
          "employee": {
            "title": "👤 Specific employee",
            "description": "Highest priority for an individual condition."
          }
        },
        "createGeneralFirst": "Create a general rule first. The exception options will then be enabled.",
        "baseRule": "Source general rule",
        "selectBaseRule": "Select the commission group...",
        "inheritedBase": "Inherited basis",
        "inheritedTrigger": "Inherited trigger",
        "currentGeneralValue": "Current general value",
        "ruleName": "Rule name",
        "specificCourse": "Specific course",
        "allCourses": "All courses",
        "commissionType": "Commission type",
        "percentage": "Percentage",
        "fixedValue": "Fixed amount",
        "calculationBase": "Calculation basis",
        "trigger": "Commission trigger",
        "minimumQuantity": "Minimum quantity",
        "maximumQuantity": "Maximum quantity",
        "refundGrace": "Clawback grace period",
        "applicationOrder": "Application order",
        "noMinimum": "No minimum",
        "noMaximum": "No maximum",
        "placeholders": {
          "generalRule": "e.g. Main commission",
          "managerRule": "e.g. Sales manager commission",
          "exceptionRule": "e.g. Commission exception",
          "description": "Explain when this rule should apply."
        },
        "useNetReceived": {
          "title": "Use net amount received",
          "description": "Prevents commission on amounts that did not actually enter cash flow."
        },
        "refundCancellation": {
          "title": "Claw back on cancellation",
          "description": "Protects the institution against canceled sales."
        },
        "refundDelinquency": {
          "title": "Claw back on delinquency",
          "description": "Allows the commission to be recovered when a payment is no longer valid."
        },
        "activeRule": {
          "title": "Active rule",
          "description": "Only active rules take part in the calculation."
        },
        "activeException": {
          "title": "Active exception",
          "description": "When active, this rule replaces the general rule for the selected target."
        },
        "savingChanges": "Saving changes...",
        "savingRule": "Saving rule...",
        "saveChanges": "Save changes",
        "createGeneral": "Create general rule",
        "createException": "Create commission exception",
        "cancelEdit": "Cancel editing"
      },
      "participants": {
        "title": "👥 Link participants",
        "description": "Add a specific employee or all active employees in a department. The employee does not need a PHANYX login.",
        "warning": "Linking defines who may participate. The applied percentage is selected by precedence: employee, role, department, then general rule.",
        "linkType": "Link type",
        "individual": {
          "title": "👤 Individual employee",
          "description": "Choose one specific person to participate in the plan."
        },
        "department": {
          "title": "🏢 Entire department",
          "description": "Add all active employees in the department at once."
        },
        "selectParticipant": "Select the participant...",
        "duplicateNote": "Employees who already have another active plan in the same period will not be duplicated.",
        "endDateHelp": "Leave blank to keep the link without an end date.",
        "placeholders": {
          "departmentBatch": "e.g. Sales team linked in bulk",
          "individual": "e.g. Participant with an individual condition"
        },
        "linking": "Linking participants...",
        "linkDepartment": "Link department to plan",
        "linkEmployee": "Link employee to plan",
        "linkedTitle": "Linked participants",
        "empty": "No participants linked to this plan.",
        "roleNotProvided": "Role not provided",
        "includedByDepartment": "🏢 Added through department: {name}",
        "individualLink": "👤 Individual link"
      },
      "rules": {
        "title": "Registered rules",
        "description": "Within the same group, only the most specific rule is used for each employee.",
        "loading": "Loading rules...",
        "empty": "No rules registered in this plan.",
        "group": "Group: {name}",
        "exceptions": "{count, plural, one {# exception} other {# exceptions}}",
        "application": "Application",
        "commission": "Commission",
        "base": "Basis",
        "trigger": "Trigger",
        "course": "Course: {name}",
        "refundGrace": "Clawback grace period: {count, plural, one {# day} other {# days}}",
        "refundCancellation": "Clawback on cancellation: {value}",
        "refundDelinquency": "Clawback on delinquency: {value}",
        "edit": "✏️ Edit rule"
      },
      "labels": {
        "base": {
          "enrollmentValue": "Enrollment value",
          "monthlyFeeValue": "Monthly fee value",
          "totalContractValue": "Total contract value",
          "receivedValue": "Amount actually received",
          "profit": "Calculated profit",
          "enrollmentCount": "Number of enrollments"
        },
        "trigger": {
          "enrollmentConfirmed": "Enrollment confirmed",
          "enrollmentPaymentConfirmed": "Enrollment payment confirmed",
          "firstMonthlyFeePaid": "First monthly fee paid",
          "eachMonthlyFeePaid": "Each monthly fee paid",
          "manual": "Manual release by HR/Sales"
        },
        "scope": {
          "general": "General rule",
          "department": "Department",
          "role": "Role or position",
          "employee": "Specific employee"
        }
      },
      "targets": {
        "departmentUnknown": "Department not identified",
        "roleUnknown": "Role not identified",
        "employeeUnknown": "Employee not identified",
        "general": "All participants without a more specific rule"
      },
      "validation": {
        "ruleName": "Enter the rule name.",
        "baseRule": "Select the general rule that will receive this exception.",
        "department": "Select the department for this rule.",
        "role": "Select the role or position for this rule.",
        "employee": "Select the employee for this rule.",
        "percentage": "Enter a percentage greater than zero and no more than 100%.",
        "fixedValue": "Enter the fixed commission amount.",
        "participantEmployee": "Select the participating employee.",
        "participantDepartment": "Select the participating department.",
        "linkStartDate": "Enter the start date for the link."
      },
      "errors": {
        "loadRules": "Could not load the rules.",
        "loadParticipants": "Could not load the plan participants.",
        "loadConfiguration": "Could not load the configuration.",
        "updateParticipationMode": "Could not change the participation mode.",
        "updateRule": "Could not update the rule.",
        "createRule": "Could not create the rule.",
        "linkParticipants": "Could not link the participants."
      },
      "success": {
        "participationModeUpdated": "Participation mode updated successfully.",
        "ruleUpdated": "Rule updated successfully.",
        "ruleCreated": "Rule created successfully.",
        "participantsLinked": "Participants linked to the plan successfully."
      }
    }
  },
  "es-ES": {
    "overview": {
      "common": {
        "noLimit": "Sin límite",
        "invalidDate": "Fecha no válida",
        "until": "hasta"
      },
      "header": {
        "section": "Comercial",
        "title": "Planes de comisión",
        "description": "Define cómo se evaluarán las ventas antes de generar comisiones para los vendedores."
      },
      "errors": {
        "load": "No se pudieron cargar los planes de comisión.",
        "nameRequired": "Indica el nombre del plan de comisión.",
        "create": "No se pudo crear el plan de comisión."
      },
      "success": {
        "created": "Plan de comisión creado correctamente."
      },
      "form": {
        "title": "Nuevo plan de comisión",
        "description": "Crear el plan no habilita a los vendedores de inmediato. El plan todavía necesita reglas activas y vendedores vinculados.",
        "name": {
          "label": "Nombre del plan",
          "placeholder": "Ej.: Comisión vendedores 2026"
        },
        "descriptionField": {
          "label": "Descripción",
          "placeholder": "Ej.: Plan estándar del equipo comercial"
        },
        "startDate": "Inicio de vigencia",
        "endDate": "Fin de vigencia",
        "active": {
          "title": "Plan activo",
          "description": "Permite utilizar el plan durante su período de vigencia."
        },
        "confirmedPayment": {
          "title": "Exigir pago confirmado",
          "description": "La matrícula por sí sola no hace elegible la comisión."
        },
        "sharedSale": {
          "title": "Permitir venta compartida",
          "description": "Permite dividir una comisión entre los vendedores participantes."
        },
        "creating": "Creando plan...",
        "create": "Crear plan de comisión"
      },
      "list": {
        "title": "Planes registrados",
        "description": "Un plan solo está listo cuando tiene al menos una regla activa.",
        "loading": "Cargando planes...",
        "emptyTitle": "No hay planes registrados",
        "emptyDescription": "Registra el primer plan con el formulario anterior.",
        "noDescription": "Sin descripción registrada.",
        "configured": "Configurado",
        "pendingConfiguration": "Configuración pendiente",
        "validity": "Vigencia",
        "activeRules": "Reglas activas",
        "linkedSellers": "Vendedores vinculados",
        "confirmedPayment": "Pago confirmado",
        "required": "Obligatorio",
        "notRequired": "No obligatorio",
        "warning": "Este plan todavía no habilita vendedores porque no tiene ninguna regla activa.",
        "configureRules": "Configurar reglas"
      }
    },
    "plan": {
      "invalidPlan": "Plan no válido.",
      "common": {
        "noLimit": "Sin límite",
        "invalidDate": "Fecha no válida",
        "until": "hasta",
        "course": "Curso",
        "department": "Departamento",
        "role": "Cargo o función",
        "employee": "Empleado",
        "description": "Descripción",
        "startDate": "Inicio de vigencia",
        "endDate": "Fin de vigencia",
        "notes": "Observaciones",
        "notesLabel": "Observaciones:",
        "validityLabel": "Vigencia:",
        "active": "Activo",
        "ended": "Finalizado",
        "activeFeminine": "Activa",
        "inactiveFeminine": "Inactiva",
        "noDescription": "Sin descripción.",
        "all": "Todos",
        "yes": "Sí",
        "no": "No",
        "selectDepartment": "Selecciona el departamento...",
        "selectRole": "Selecciona el cargo o la función...",
        "selectEmployee": "Selecciona el empleado...",
        "activeEmployees": "{count, plural, one {# empleado activo} other {# empleados activos}}"
      },
      "header": {
        "back": "← Volver a los planes",
        "section": "Plan de comisión",
        "configureRulesFallback": "Configurar reglas",
        "description": "Define quién participa y qué regla se aplicará a cada departamento, cargo o empleado."
      },
      "participation": {
        "title": "👥 Quién recibe comisión en este plan",
        "description": "Esta opción define si solo los responsables de la matrícula o todos los empleados vinculados al plan recibirán comisión.",
        "onlyEnrollment": {
          "title": "🎯 Solo participantes de la matrícula",
          "description": "Reciben únicamente el vendedor responsable y los participantes comerciales registrados en esa matrícula."
        },
        "allLinked": {
          "title": "🏢 Todos los vinculados al plan",
          "description": "Todos los empleados activos vinculados al plan participan, incluso sin iniciar sesión, según la regla aplicable al cargo, departamento o persona."
        },
        "warning": "Para que gerente, coordinador, vendedores, captación de leads y otras funciones reciban porcentajes diferentes dentro del mismo plan, crea una regla general y después registra las excepciones específicas."
      },
      "ruleForm": {
        "editTitle": "Editar regla de comisión",
        "newGeneralTitle": "Nueva regla general de comisión",
        "newExceptionTitle": "Nueva excepción de comisión",
        "editDescription": "Modifica los datos siguientes y guarda. La edición afecta solo a los próximos cálculos de comisión.",
        "precedenceDescription": "La precedencia es: empleado específico, cargo o función, departamento y, por último, regla general.",
        "application": "Aplicación de la regla",
        "scope": {
          "general": {
            "title": "🌐 Regla general",
            "description": "Se aplica cuando no existe una regla más específica."
          },
          "department": {
            "title": "🏢 Departamento",
            "description": "Excepción para todos los empleados de un departamento."
          },
          "role": {
            "title": "🪪 Cargo o función",
            "description": "Excepción para gerente, coordinador, vendedor, leads, etc."
          },
          "employee": {
            "title": "👤 Empleado específico",
            "description": "Máxima prioridad para una condición individual."
          }
        },
        "createGeneralFirst": "Crea primero una regla general. Después se habilitarán las opciones de excepción.",
        "baseRule": "Regla general de origen",
        "selectBaseRule": "Selecciona el grupo de comisión...",
        "inheritedBase": "Base heredada",
        "inheritedTrigger": "Disparador heredado",
        "currentGeneralValue": "Valor general actual",
        "ruleName": "Nombre de la regla",
        "specificCourse": "Curso específico",
        "allCourses": "Todos los cursos",
        "commissionType": "Tipo de comisión",
        "percentage": "Porcentaje",
        "fixedValue": "Importe fijo",
        "calculationBase": "Base de cálculo",
        "trigger": "Disparador de comisión",
        "minimumQuantity": "Cantidad mínima",
        "maximumQuantity": "Cantidad máxima",
        "refundGrace": "Plazo para reversión",
        "applicationOrder": "Orden de aplicación",
        "noMinimum": "Sin mínimo",
        "noMaximum": "Sin máximo",
        "placeholders": {
          "generalRule": "Ej.: Comisión principal",
          "managerRule": "Ej.: Comisión del gerente comercial",
          "exceptionRule": "Ej.: Excepción de comisión",
          "description": "Explica cuándo debe aplicarse esta regla."
        },
        "useNetReceived": {
          "title": "Usar importe neto recibido",
          "description": "Evita comisiones sobre importes que no ingresaron realmente en caja."
        },
        "refundCancellation": {
          "title": "Revertir por cancelación",
          "description": "Protege a la institución frente a ventas canceladas."
        },
        "refundDelinquency": {
          "title": "Revertir por impago",
          "description": "Permite recuperar la comisión cuando el pago deja de ser válido."
        },
        "activeRule": {
          "title": "Regla activa",
          "description": "Solo las reglas activas participan en el cálculo."
        },
        "activeException": {
          "title": "Excepción activa",
          "description": "Cuando está activa, esta regla sustituye la regla general para el objetivo seleccionado."
        },
        "savingChanges": "Guardando cambios...",
        "savingRule": "Guardando regla...",
        "saveChanges": "Guardar cambios",
        "createGeneral": "Crear regla general",
        "createException": "Crear excepción de comisión",
        "cancelEdit": "Cancelar edición"
      },
      "participants": {
        "title": "👥 Vincular participantes",
        "description": "Incluye un empleado específico o todos los empleados activos de un departamento. El empleado no necesita tener acceso a PHANYX.",
        "warning": "La vinculación define quién puede participar. El porcentaje aplicado se determina por precedencia: empleado, cargo, departamento y regla general.",
        "linkType": "Forma de vinculación",
        "individual": {
          "title": "👤 Empleado individual",
          "description": "Elige una persona específica para participar en el plan."
        },
        "department": {
          "title": "🏢 Departamento completo",
          "description": "Incluye a todos los empleados activos del departamento de una vez."
        },
        "selectParticipant": "Selecciona el participante...",
        "duplicateNote": "Los empleados que ya tengan otro plan activo en el mismo período no se duplicarán.",
        "endDateHelp": "Déjalo vacío para mantener el vínculo sin fecha final.",
        "placeholders": {
          "departmentBatch": "Ej.: Equipo comercial vinculado en bloque",
          "individual": "Ej.: Participante con condición individual"
        },
        "linking": "Vinculando participantes...",
        "linkDepartment": "Vincular departamento al plan",
        "linkEmployee": "Vincular empleado al plan",
        "linkedTitle": "Participantes vinculados",
        "empty": "No hay participantes vinculados a este plan.",
        "roleNotProvided": "Cargo no informado",
        "includedByDepartment": "🏢 Incluido por departamento: {name}",
        "individualLink": "👤 Vínculo individual"
      },
      "rules": {
        "title": "Reglas registradas",
        "description": "Dentro del mismo grupo, solo se utilizará la regla más específica para cada empleado.",
        "loading": "Cargando reglas...",
        "empty": "No hay reglas registradas en este plan.",
        "group": "Grupo: {name}",
        "exceptions": "{count, plural, one {# excepción} other {# excepciones}}",
        "application": "Aplicación",
        "commission": "Comisión",
        "base": "Base",
        "trigger": "Disparador",
        "course": "Curso: {name}",
        "refundGrace": "Plazo para reversión: {count, plural, one {# día} other {# días}}",
        "refundCancellation": "Reversión por cancelación: {value}",
        "refundDelinquency": "Reversión por impago: {value}",
        "edit": "✏️ Editar regla"
      },
      "labels": {
        "base": {
          "enrollmentValue": "Valor de la matrícula",
          "monthlyFeeValue": "Valor de la mensualidad",
          "totalContractValue": "Valor total del contrato",
          "receivedValue": "Importe efectivamente recibido",
          "profit": "Beneficio calculado",
          "enrollmentCount": "Cantidad de matrículas"
        },
        "trigger": {
          "enrollmentConfirmed": "Matrícula confirmada",
          "enrollmentPaymentConfirmed": "Pago de matrícula confirmado",
          "firstMonthlyFeePaid": "Primera mensualidad pagada",
          "eachMonthlyFeePaid": "Cada mensualidad pagada",
          "manual": "Liberación manual por RR. HH./Comercial"
        },
        "scope": {
          "general": "Regla general",
          "department": "Departamento",
          "role": "Cargo o función",
          "employee": "Empleado específico"
        }
      },
      "targets": {
        "departmentUnknown": "Departamento no identificado",
        "roleUnknown": "Cargo no identificado",
        "employeeUnknown": "Empleado no identificado",
        "general": "Todos los participantes sin una regla más específica"
      },
      "validation": {
        "ruleName": "Indica el nombre de la regla.",
        "baseRule": "Selecciona la regla general que recibirá esta excepción.",
        "department": "Selecciona el departamento de esta regla.",
        "role": "Selecciona el cargo o la función de esta regla.",
        "employee": "Selecciona el empleado de esta regla.",
        "percentage": "Indica un porcentaje superior a cero y como máximo del 100 %.",
        "fixedValue": "Indica el importe fijo de la comisión.",
        "participantEmployee": "Selecciona el empleado participante.",
        "participantDepartment": "Selecciona el departamento participante.",
        "linkStartDate": "Indica el inicio de vigencia del vínculo."
      },
      "errors": {
        "loadRules": "No se pudieron cargar las reglas.",
        "loadParticipants": "No se pudieron cargar los participantes del plan.",
        "loadConfiguration": "No se pudo cargar la configuración.",
        "updateParticipationMode": "No se pudo cambiar el modo de participación.",
        "updateRule": "No se pudo actualizar la regla.",
        "createRule": "No se pudo crear la regla.",
        "linkParticipants": "No se pudieron vincular los participantes."
      },
      "success": {
        "participationModeUpdated": "Modo de participación actualizado correctamente.",
        "ruleUpdated": "Regla actualizada correctamente.",
        "ruleCreated": "Regla creada correctamente.",
        "participantsLinked": "Participantes vinculados al plan correctamente."
      }
    }
  },
  "fr-FR": {
    "overview": {
      "common": {
        "noLimit": "Sans limite",
        "invalidDate": "Date invalide",
        "until": "au"
      },
      "header": {
        "section": "Commercial",
        "title": "Plans de commission",
        "description": "Définissez la manière dont les ventes seront évaluées avant de générer les commissions des commerciaux."
      },
      "errors": {
        "load": "Impossible de charger les plans de commission.",
        "nameRequired": "Indiquez le nom du plan de commission.",
        "create": "Impossible de créer le plan de commission."
      },
      "success": {
        "created": "Plan de commission créé avec succès."
      },
      "form": {
        "title": "Nouveau plan de commission",
        "description": "La création du plan ne rend pas immédiatement les commerciaux éligibles. Le plan doit encore comporter des règles actives et des commerciaux associés.",
        "name": {
          "label": "Nom du plan",
          "placeholder": "Ex. : Commission commerciaux 2026"
        },
        "descriptionField": {
          "label": "Description",
          "placeholder": "Ex. : Plan standard de l’équipe commerciale"
        },
        "startDate": "Début de validité",
        "endDate": "Fin de validité",
        "active": {
          "title": "Plan actif",
          "description": "Permet d’utiliser le plan pendant sa période de validité."
        },
        "confirmedPayment": {
          "title": "Exiger un paiement confirmé",
          "description": "L’inscription seule ne rend pas la commission éligible."
        },
        "sharedSale": {
          "title": "Autoriser une vente partagée",
          "description": "Permet de répartir une commission entre plusieurs commerciaux participants."
        },
        "creating": "Création du plan...",
        "create": "Créer le plan de commission"
      },
      "list": {
        "title": "Plans enregistrés",
        "description": "Un plan n’est prêt que lorsqu’il comporte au moins une règle active.",
        "loading": "Chargement des plans...",
        "emptyTitle": "Aucun plan enregistré",
        "emptyDescription": "Créez le premier plan à l’aide du formulaire ci-dessus.",
        "noDescription": "Aucune description enregistrée.",
        "configured": "Configuré",
        "pendingConfiguration": "Configuration en attente",
        "validity": "Période de validité",
        "activeRules": "Règles actives",
        "linkedSellers": "Commerciaux associés",
        "confirmedPayment": "Paiement confirmé",
        "required": "Obligatoire",
        "notRequired": "Non obligatoire",
        "warning": "Ce plan ne rend pas encore les commerciaux éligibles car il ne comporte aucune règle active.",
        "configureRules": "Configurer les règles"
      }
    },
    "plan": {
      "invalidPlan": "Plan invalide.",
      "common": {
        "noLimit": "Sans limite",
        "invalidDate": "Date invalide",
        "until": "au",
        "course": "Cours",
        "department": "Département",
        "role": "Poste ou fonction",
        "employee": "Employé",
        "description": "Description",
        "startDate": "Début de validité",
        "endDate": "Fin de validité",
        "notes": "Observations",
        "notesLabel": "Observations :",
        "validityLabel": "Validité :",
        "active": "Actif",
        "ended": "Terminé",
        "activeFeminine": "Active",
        "inactiveFeminine": "Inactive",
        "noDescription": "Aucune description.",
        "all": "Tous",
        "yes": "Oui",
        "no": "Non",
        "selectDepartment": "Sélectionnez le département...",
        "selectRole": "Sélectionnez le poste ou la fonction...",
        "selectEmployee": "Sélectionnez l’employé...",
        "activeEmployees": "{count, plural, one {# employé actif} other {# employés actifs}}"
      },
      "header": {
        "back": "← Retour aux plans",
        "section": "Plan de commission",
        "configureRulesFallback": "Configurer les règles",
        "description": "Définissez qui participe et quelle règle s’applique à chaque département, poste ou employé."
      },
      "participation": {
        "title": "👥 Qui reçoit une commission dans ce plan",
        "description": "Ce choix détermine si seuls les responsables de l’inscription ou tous les employés associés au plan reçoivent une commission.",
        "onlyEnrollment": {
          "title": "🎯 Participants à l’inscription uniquement",
          "description": "Seuls le commercial responsable et les participants commerciaux enregistrés sur cette inscription reçoivent une commission."
        },
        "allLinked": {
          "title": "🏢 Tous les employés associés au plan",
          "description": "Tous les employés actifs associés au plan participent, même sans compte, selon la règle applicable au poste, au département ou à la personne."
        },
        "warning": "Pour attribuer des pourcentages différents aux responsables, coordinateurs, commerciaux, équipes d’acquisition de prospects et autres fonctions dans un même plan, créez une règle générale puis ajoutez les exceptions spécifiques."
      },
      "ruleForm": {
        "editTitle": "Modifier la règle de commission",
        "newGeneralTitle": "Nouvelle règle générale de commission",
        "newExceptionTitle": "Nouvelle exception de commission",
        "editDescription": "Modifiez les données ci-dessous puis enregistrez. La modification n’affecte que les prochains calculs de commission.",
        "precedenceDescription": "L’ordre de priorité est : employé spécifique, poste ou fonction, département, puis règle générale.",
        "application": "Application de la règle",
        "scope": {
          "general": {
            "title": "🌐 Règle générale",
            "description": "Appliquée lorsqu’aucune règle plus spécifique n’existe."
          },
          "department": {
            "title": "🏢 Département",
            "description": "Exception pour tous les employés d’un département."
          },
          "role": {
            "title": "🪪 Poste ou fonction",
            "description": "Exception pour responsable, coordinateur, commercial, leads, etc."
          },
          "employee": {
            "title": "👤 Employé spécifique",
            "description": "Priorité maximale pour une condition individuelle."
          }
        },
        "createGeneralFirst": "Créez d’abord une règle générale. Les options d’exception seront ensuite disponibles.",
        "baseRule": "Règle générale d’origine",
        "selectBaseRule": "Sélectionnez le groupe de commission...",
        "inheritedBase": "Base héritée",
        "inheritedTrigger": "Déclencheur hérité",
        "currentGeneralValue": "Valeur générale actuelle",
        "ruleName": "Nom de la règle",
        "specificCourse": "Cours spécifique",
        "allCourses": "Tous les cours",
        "commissionType": "Type de commission",
        "percentage": "Pourcentage",
        "fixedValue": "Montant fixe",
        "calculationBase": "Base de calcul",
        "trigger": "Déclencheur de commission",
        "minimumQuantity": "Quantité minimale",
        "maximumQuantity": "Quantité maximale",
        "refundGrace": "Délai de reprise",
        "applicationOrder": "Ordre d’application",
        "noMinimum": "Sans minimum",
        "noMaximum": "Sans maximum",
        "placeholders": {
          "generalRule": "Ex. : Commission principale",
          "managerRule": "Ex. : Commission du responsable commercial",
          "exceptionRule": "Ex. : Exception de commission",
          "description": "Expliquez quand cette règle doit être appliquée."
        },
        "useNetReceived": {
          "title": "Utiliser le montant net encaissé",
          "description": "Évite de calculer une commission sur des montants qui ne sont pas réellement entrés en caisse."
        },
        "refundCancellation": {
          "title": "Reprendre en cas d’annulation",
          "description": "Protège l’établissement contre les ventes annulées."
        },
        "refundDelinquency": {
          "title": "Reprendre en cas d’impayé",
          "description": "Permet de récupérer la commission lorsque le paiement n’est plus valide."
        },
        "activeRule": {
          "title": "Règle active",
          "description": "Seules les règles actives participent au calcul."
        },
        "activeException": {
          "title": "Exception active",
          "description": "Lorsqu’elle est active, cette règle remplace la règle générale pour la cible sélectionnée."
        },
        "savingChanges": "Enregistrement des modifications...",
        "savingRule": "Enregistrement de la règle...",
        "saveChanges": "Enregistrer les modifications",
        "createGeneral": "Créer la règle générale",
        "createException": "Créer l’exception de commission",
        "cancelEdit": "Annuler la modification"
      },
      "participants": {
        "title": "👥 Associer des participants",
        "description": "Ajoutez un employé précis ou tous les employés actifs d’un département. L’employé n’a pas besoin d’un compte PHANYX.",
        "warning": "L’association définit qui peut participer. Le pourcentage appliqué est choisi selon la priorité : employé, poste, département, puis règle générale.",
        "linkType": "Mode d’association",
        "individual": {
          "title": "👤 Employé individuel",
          "description": "Choisissez une personne précise pour participer au plan."
        },
        "department": {
          "title": "🏢 Département entier",
          "description": "Ajoutez tous les employés actifs du département en une seule fois."
        },
        "selectParticipant": "Sélectionnez le participant...",
        "duplicateNote": "Les employés qui disposent déjà d’un autre plan actif sur la même période ne seront pas dupliqués.",
        "endDateHelp": "Laissez vide pour conserver l’association sans date de fin.",
        "placeholders": {
          "departmentBatch": "Ex. : Équipe commerciale associée en lot",
          "individual": "Ex. : Participant avec condition individuelle"
        },
        "linking": "Association des participants...",
        "linkDepartment": "Associer le département au plan",
        "linkEmployee": "Associer l’employé au plan",
        "linkedTitle": "Participants associés",
        "empty": "Aucun participant associé à ce plan.",
        "roleNotProvided": "Poste non renseigné",
        "includedByDepartment": "🏢 Ajouté via le département : {name}",
        "individualLink": "👤 Association individuelle"
      },
      "rules": {
        "title": "Règles enregistrées",
        "description": "Dans un même groupe, seule la règle la plus spécifique est utilisée pour chaque employé.",
        "loading": "Chargement des règles...",
        "empty": "Aucune règle enregistrée dans ce plan.",
        "group": "Groupe : {name}",
        "exceptions": "{count, plural, one {# exception} other {# exceptions}}",
        "application": "Application",
        "commission": "Commission",
        "base": "Base",
        "trigger": "Déclencheur",
        "course": "Cours : {name}",
        "refundGrace": "Délai de reprise : {count, plural, one {# jour} other {# jours}}",
        "refundCancellation": "Reprise en cas d’annulation : {value}",
        "refundDelinquency": "Reprise en cas d’impayé : {value}",
        "edit": "✏️ Modifier la règle"
      },
      "labels": {
        "base": {
          "enrollmentValue": "Montant de l’inscription",
          "monthlyFeeValue": "Montant de la mensualité",
          "totalContractValue": "Montant total du contrat",
          "receivedValue": "Montant effectivement encaissé",
          "profit": "Bénéfice calculé",
          "enrollmentCount": "Nombre d’inscriptions"
        },
        "trigger": {
          "enrollmentConfirmed": "Inscription confirmée",
          "enrollmentPaymentConfirmed": "Paiement de l’inscription confirmé",
          "firstMonthlyFeePaid": "Première mensualité payée",
          "eachMonthlyFeePaid": "Chaque mensualité payée",
          "manual": "Déblocage manuel par RH/Commercial"
        },
        "scope": {
          "general": "Règle générale",
          "department": "Département",
          "role": "Poste ou fonction",
          "employee": "Employé spécifique"
        }
      },
      "targets": {
        "departmentUnknown": "Département non identifié",
        "roleUnknown": "Poste non identifié",
        "employeeUnknown": "Employé non identifié",
        "general": "Tous les participants sans règle plus spécifique"
      },
      "validation": {
        "ruleName": "Indiquez le nom de la règle.",
        "baseRule": "Sélectionnez la règle générale qui recevra cette exception.",
        "department": "Sélectionnez le département de cette règle.",
        "role": "Sélectionnez le poste ou la fonction de cette règle.",
        "employee": "Sélectionnez l’employé de cette règle.",
        "percentage": "Indiquez un pourcentage supérieur à zéro et inférieur ou égal à 100 %.",
        "fixedValue": "Indiquez le montant fixe de la commission.",
        "participantEmployee": "Sélectionnez l’employé participant.",
        "participantDepartment": "Sélectionnez le département participant.",
        "linkStartDate": "Indiquez la date de début de validité de l’association."
      },
      "errors": {
        "loadRules": "Impossible de charger les règles.",
        "loadParticipants": "Impossible de charger les participants du plan.",
        "loadConfiguration": "Impossible de charger la configuration.",
        "updateParticipationMode": "Impossible de modifier le mode de participation.",
        "updateRule": "Impossible de mettre à jour la règle.",
        "createRule": "Impossible de créer la règle.",
        "linkParticipants": "Impossible d’associer les participants."
      },
      "success": {
        "participationModeUpdated": "Mode de participation mis à jour avec succès.",
        "ruleUpdated": "Règle mise à jour avec succès.",
        "ruleCreated": "Règle créée avec succès.",
        "participantsLinked": "Participants associés au plan avec succès."
      }
    }
  }
};

const arquivos = [
  ["pt-BR", path.join("messages", "pt-BR.json")],
  ["pt-PT", path.join("messages", "pt-PT.json")],
  ["en-US", path.join("messages", "en-US.json")],
  ["es-ES", path.join("messages", "es-ES.json")],
  ["fr-FR", path.join("messages", "fr-FR.json")],
];

for (const [locale, arquivoRelativo] of arquivos) {
  const arquivo = path.resolve(process.cwd(), arquivoRelativo);

  if (!fs.existsSync(arquivo)) {
    throw new Error(`Arquivo não encontrado: ${arquivo}`);
  }

  const conteudo = JSON.parse(
    fs.readFileSync(arquivo, "utf8")
  );

  conteudo[namespace] = traducoes[locale];

  fs.writeFileSync(
    arquivo,
    JSON.stringify(conteudo, null, 2) + "\n",
    "utf8"
  );

  console.log(
    `✓ ${locale}: ${namespace} atualizado`
  );
}

console.log(
  "\nConcluído. Os cinco arquivos de idioma foram atualizados."
);
