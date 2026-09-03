import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = {
  "pt-BR": path.join(root, "messages", "pt-BR.json"),
  "pt-PT": path.join(root, "messages", "pt-PT.json"),
  "en-US": path.join(root, "messages", "en-US.json"),
  "es-ES": path.join(root, "messages", "es-ES.json"),
  "fr-FR": path.join(root, "messages", "fr-FR.json"),
};

const translations = {
  "pt-BR": {
    "title": "Departamentos",
    "newDepartment": {
      "title": "Novo departamento",
      "namePlaceholder": "Nome do departamento",
      "slugPlaceholder": "Slug público (opcional)",
      "rolesTitle": "Cargos do departamento",
      "rolesDescription": "Opcional. Cadastre agora as funções que existem neste departamento.",
      "create": "Criar departamento"
    },
    "list": {
      "title": "Lista de departamentos",
      "slug": "Slug"
    },
    "common": {
      "name": "Nome",
      "slug": "Slug",
      "status": "Status",
      "active": "Ativo",
      "inactive": "Inativo",
      "save": "Salvar",
      "saving": "Salvando...",
      "creating": "Criando...",
      "deleting": "Excluindo...",
      "cancel": "Cancelar",
      "edit": "Editar",
      "delete": "Excluir",
      "remove": "Remover",
      "deactivate": "Desativar",
      "reactivate": "Reativar"
    },
    "roles": {
      "title": "Cargos",
      "close": "Fechar cargos",
      "add": "+ Adicionar cargo",
      "newRole": "+ Novo cargo",
      "role": "Cargo",
      "fallbackName": "Cargo",
      "namePlaceholder": "Nome do cargo",
      "examplePlaceholder": "Ex.: Vendedor",
      "departmentTitle": "Cargos de {name}",
      "departmentDescription": "Cadastre as funções existentes neste departamento.",
      "loading": "Carregando cargos...",
      "empty": "Nenhum cargo cadastrado neste departamento.",
      "active": "Cargo ativo",
      "linkedEmployees": "{count, plural, =0 {Nenhum funcionário vinculado} =1 {1 funcionário vinculado} other {# funcionários vinculados}}"
    },
    "permissions": {
      "link": "Permissões"
    },
    "roleStatusModal": {
      "deactivateTitle": "Desativar cargo",
      "reactivateTitle": "Reativar cargo",
      "deactivateDescription": "O cargo deixará de aparecer para novos vínculos, mas os funcionários já vinculados não serão apagados.",
      "reactivateDescription": "O cargo voltará a ficar disponível para novos vínculos.",
      "confirmDeactivate": "Confirmar desativação",
      "confirmReactivate": "Confirmar reativação"
    },
    "deleteModal": {
      "title": "Confirmar exclusão",
      "question": "Tem certeza que deseja excluir o departamento “{name}”?",
      "questionPrefix": "Tem certeza que deseja excluir o departamento",
      "warning": "Esta ação não pode ser desfeita.",
      "confirm": "Confirmar exclusão"
    },
    "messages": {
      "departmentCreated": "Departamento criado com sucesso.",
      "departmentUpdated": "Departamento atualizado com sucesso.",
      "departmentDeleted": "Departamento excluído com sucesso.",
      "roleCreated": "Cargo criado com sucesso.",
      "roleUpdated": "Cargo atualizado com sucesso.",
      "roleDeactivated": "Cargo desativado com sucesso.",
      "roleReactivated": "Cargo reativado com sucesso."
    },
    "errors": {
      "createDepartment": "Erro ao criar departamento.",
      "updateDepartment": "Erro ao atualizar departamento.",
      "deleteDepartment": "Erro ao excluir departamento.",
      "loadRoles": "Não foi possível carregar os cargos.",
      "roleNameRequired": "Informe o nome do cargo.",
      "createRole": "Não foi possível criar o cargo.",
      "updateRole": "Não foi possível atualizar o cargo.",
      "changeRoleStatus": "Não foi possível alterar o status do cargo."
    },
    "permissionsPage": {
      "back": "← Voltar para Departamentos",
      "title": "Permissões do Departamento {name}",
      "description": "Defina quais áreas e funções os funcionários deste departamento poderão acessar. As permissões estão organizadas por área para facilitar o uso.",
      "sectionTitle": "Permissões por setor",
      "selectedLabel": "Selecionadas",
      "save": "Salvar permissões",
      "groupSelected": "{selected} de {total} selecionada(s)",
      "selectAllGroup": "Marcar todas deste setor",
      "clearGroup": "Limpar este setor",
      "permissionGenericDescription": "Concede esta permissão no PHANYX: {permission}.",
      "messages": {
        "saved": "Permissões salvas com sucesso."
      },
      "errors": {
        "load": "Erro ao carregar permissões.",
        "save": "Erro ao salvar permissões."
      },
      "common": {
        "saving": "Salvando..."
      },
      "groups": {
        "geral": {
          "name": "Geral / Dashboard",
          "description": "Acessos gerais do painel administrativo."
        },
        "assinatura": {
          "name": "Assinatura PHANYX",
          "description": "Plano, valores, cobrança e cancelamento da assinatura da instituição."
        },
        "apoio-docente": {
          "name": "Apoio Docente",
          "description": "Publicações acadêmicas, materiais, trabalhos e apoio às ações dos professores."
        },
        "academico": {
          "name": "Acadêmico",
          "description": "Alunos, professores, cursos, turmas, matrículas, disciplinas e gestão acadêmica."
        },
        "biblioteca": {
          "name": "Biblioteca Virtual",
          "description": "Catálogo, circulação, arquivos, licenças, armazenamento, relatórios e administração da biblioteca."
        },
        "comercial": {
          "name": "Comercial",
          "description": "Funis, leads, oportunidades, tarefas, vendedores, metas, vendas, comissões e relatórios."
        },
        "financeiro": {
          "name": "Financeiro",
          "description": "Recebimentos, caixa, inadimplentes, relatórios financeiros e cobranças."
        },
        "rh": {
          "name": "Pessoal / RH",
          "description": "Funcionários, departamentos, ponto, holerites, férias, exames, rescisões e documentos de RH."
        },
        "controle-acesso": {
          "name": "Controle de Acesso",
          "description": "Crachás, modelos, emissão, visitantes, entrada e saída."
        },
        "documentos": {
          "name": "Documentos",
          "description": "Certificados, contratos, documentos, modelos, assinaturas e validações."
        },
        "comunicacao": {
          "name": "Comunicação",
          "description": "Reuniões, aniversariantes, ouvidoria, mensagens e comunicação interna."
        },
        "configuracoes": {
          "name": "Configurações / Integrações",
          "description": "Configurações da instituição, integrações e recursos administrativos."
        },
        "outros": {
          "name": "Outras permissões",
          "description": "Permissões ainda não classificadas em um grupo específico."
        }
      },
      "permissionTerms": {
        "modules": {
          "dashboard": "Dashboard",
          "subscription": "Assinatura PHANYX",
          "students": "Alunos",
          "enrollments": "Matrículas",
          "academic": "Acadêmico",
          "publications": "Publicações",
          "materials": "Materiais",
          "assignments": "Trabalhos",
          "classes": "Turmas",
          "subjects": "Disciplinas",
          "teachers": "Professores",
          "library": "Biblioteca Virtual",
          "subscriptionManagement": "Contratação",
          "catalog": "Catálogo",
          "files": "Arquivos",
          "storage": "Armazenamento",
          "circulation": "Circulação",
          "loans": "Empréstimos",
          "renewals": "Renovações",
          "reservations": "Reservas",
          "shelves": "Prateleiras",
          "reviews": "Avaliações",
          "recommendations": "Recomendações",
          "licenses": "Licenças",
          "operators": "Operadores",
          "settings": "Configurações",
          "reports": "Relatórios",
          "audit": "Auditoria",
          "sales": "Comercial",
          "funnels": "Funis",
          "leads": "Leads",
          "tasks": "Tarefas",
          "salespeople": "Vendedores",
          "teams": "Equipes",
          "goals": "Metas",
          "salesTransactions": "Vendas",
          "commissions": "Comissões",
          "integrations": "Integrações",
          "email": "E-mail",
          "whatsapp": "WhatsApp",
          "finance": "Financeiro",
          "cashRegister": "Caixa",
          "documents": "Documentos",
          "certificates": "Certificados",
          "employees": "Funcionários",
          "departments": "Departamentos",
          "hr": "RH",
          "timeTracking": "Ponto",
          "mobile": "Mobile",
          "badges": "Crachás",
          "templates": "Modelos",
          "visitors": "Visitantes",
          "meetings": "Reuniões",
          "ombudsman": "Ouvidoria",
          "birthdays": "Aniversariantes",
          "receipts": "Recebimentos",
          "delinquency": "Inadimplentes",
          "closing": "Fechamento",
          "permissions": "Permissões",
          "hiring": "Admissões",
          "terminations": "Desligamentos",
          "occurrences": "Ocorrências",
          "history": "Histórico",
          "archived": "Arquivados",
          "payslips": "Holerites",
          "vacations": "Férias",
          "exams": "Exames",
          "roles": "Cargos",
          "salaryRanges": "Faixas salariais",
          "indicators": "Indicadores",
          "benefits": "Benefícios",
          "timeBank": "Banco de horas"
        },
        "actions": {
          "access": "Acessar",
          "view": "Ver",
          "create": "Criar",
          "edit": "Editar",
          "delete": "Excluir",
          "cancel": "Cancelar",
          "manage": "Gerenciar",
          "publish": "Publicar",
          "attach": "Anexar",
          "select": "Selecionar",
          "upload": "Enviar",
          "download": "Baixar",
          "archive": "Arquivar",
          "restore": "Restaurar",
          "moderate": "Moderar",
          "export": "Exportar",
          "interact": "Registrar interações",
          "assign": "Atribuir",
          "convert": "Converter",
          "move": "Movimentar",
          "transfer": "Transferir",
          "complete": "Concluir",
          "approve": "Aprovar",
          "calculate": "Calcular",
          "issue": "Emitir",
          "print": "Imprimir",
          "generate": "Gerar",
          "receive": "Receber",
          "open": "Abrir",
          "close": "Fechar",
          "configure": "Configurar",
          "adjust": "Ajustar",
          "sign": "Assinar",
          "block": "Bloquear",
          "reply": "Responder",
          "viewAll": "Ver todos",
          "recordLoss": "Registrar perda",
          "registerEntry": "Registrar entrada",
          "registerExit": "Registrar saída",
          "linkSalesperson": "Vincular vendedor",
          "sendToHr": "Enviar ao RH",
          "editTemplate": "Editar modelo",
          "generateWhatsAppLinks": "Gerar links WhatsApp",
          "exportPdf": "Baixar PDF",
          "exportExcel": "Baixar Excel",
          "archiveOccurrences": "Arquivar ocorrências",
          "archivePayslips": "Arquivar holerites",
          "archiveVacations": "Arquivar férias",
          "archiveExams": "Arquivar exames",
          "archiveTerminations": "Arquivar rescisões",
          "archiveHrDocuments": "Arquivar documentos RH",
          "restoreArchived": "Restaurar arquivados",
          "documentTemplates": "Modelos de documentos",
          "generateDocuments": "Gerar documentos",
          "editTimeEntries": "Ajustar registros de ponto",
          "timeTrackingIntegrations": "Integrações de ponto",
          "generatePayslips": "Gerar holerites",
          "signPayslips": "Assinar holerites",
          "deletePayslips": "Excluir holerites",
          "approveVacations": "Aprovar férias"
        }
      }
    }
  },
  "pt-PT": {
    "title": "Departamentos",
    "newDepartment": {
      "title": "Novo departamento",
      "namePlaceholder": "Nome do departamento",
      "slugPlaceholder": "Slug público (opcional)",
      "rolesTitle": "Cargos do departamento",
      "rolesDescription": "Opcional. Registe agora as funções existentes neste departamento.",
      "create": "Criar departamento"
    },
    "list": {
      "title": "Lista de departamentos",
      "slug": "Slug"
    },
    "common": {
      "name": "Nome",
      "slug": "Slug",
      "status": "Estado",
      "active": "Ativo",
      "inactive": "Inativo",
      "save": "Guardar",
      "saving": "A guardar...",
      "creating": "A criar...",
      "deleting": "A eliminar...",
      "cancel": "Cancelar",
      "edit": "Editar",
      "delete": "Eliminar",
      "remove": "Remover",
      "deactivate": "Desativar",
      "reactivate": "Reativar"
    },
    "roles": {
      "title": "Cargos",
      "close": "Fechar cargos",
      "add": "+ Adicionar cargo",
      "newRole": "+ Novo cargo",
      "role": "Cargo",
      "fallbackName": "Cargo",
      "namePlaceholder": "Nome do cargo",
      "examplePlaceholder": "Ex.: Vendedor",
      "departmentTitle": "Cargos de {name}",
      "departmentDescription": "Registe as funções existentes neste departamento.",
      "loading": "A carregar cargos...",
      "empty": "Nenhum cargo registado neste departamento.",
      "active": "Cargo ativo",
      "linkedEmployees": "{count, plural, =0 {Nenhum funcionário associado} =1 {1 funcionário associado} other {# funcionários associados}}"
    },
    "permissions": {
      "link": "Permissões"
    },
    "roleStatusModal": {
      "deactivateTitle": "Desativar cargo",
      "reactivateTitle": "Reativar cargo",
      "deactivateDescription": "O cargo deixará de aparecer para novas associações, mas os funcionários já associados não serão eliminados.",
      "reactivateDescription": "O cargo voltará a ficar disponível para novas associações.",
      "confirmDeactivate": "Confirmar desativação",
      "confirmReactivate": "Confirmar reativação"
    },
    "deleteModal": {
      "title": "Confirmar eliminação",
      "question": "Tem a certeza de que pretende eliminar o departamento “{name}”?",
      "questionPrefix": "Tem a certeza de que pretende eliminar o departamento",
      "warning": "Esta ação não pode ser anulada.",
      "confirm": "Confirmar eliminação"
    },
    "messages": {
      "departmentCreated": "Departamento criado com sucesso.",
      "departmentUpdated": "Departamento atualizado com sucesso.",
      "departmentDeleted": "Departamento eliminado com sucesso.",
      "roleCreated": "Cargo criado com sucesso.",
      "roleUpdated": "Cargo atualizado com sucesso.",
      "roleDeactivated": "Cargo desativado com sucesso.",
      "roleReactivated": "Cargo reativado com sucesso."
    },
    "errors": {
      "createDepartment": "Erro ao criar o departamento.",
      "updateDepartment": "Erro ao atualizar o departamento.",
      "deleteDepartment": "Erro ao eliminar o departamento.",
      "loadRoles": "Não foi possível carregar os cargos.",
      "roleNameRequired": "Indique o nome do cargo.",
      "createRole": "Não foi possível criar o cargo.",
      "updateRole": "Não foi possível atualizar o cargo.",
      "changeRoleStatus": "Não foi possível alterar o estado do cargo."
    },
    "permissionsPage": {
      "back": "← Voltar aos Departamentos",
      "title": "Permissões do Departamento {name}",
      "description": "Defina as áreas e funções a que os funcionários deste departamento podem aceder. As permissões estão organizadas por área para facilitar a utilização.",
      "sectionTitle": "Permissões por setor",
      "selectedLabel": "Selecionadas",
      "save": "Guardar permissões",
      "groupSelected": "{selected} de {total} selecionada(s)",
      "selectAllGroup": "Selecionar todas deste setor",
      "clearGroup": "Limpar este setor",
      "permissionGenericDescription": "Concede esta permissão no PHANYX: {permission}.",
      "messages": {
        "saved": "Permissões guardadas com sucesso."
      },
      "errors": {
        "load": "Erro ao carregar as permissões.",
        "save": "Erro ao guardar as permissões."
      },
      "common": {
        "saving": "A guardar..."
      },
      "groups": {
        "geral": {
          "name": "Geral / Painel",
          "description": "Acessos gerais do painel administrativo."
        },
        "assinatura": {
          "name": "Subscrição PHANYX",
          "description": "Plano, valores, cobrança e cancelamento da subscrição da instituição."
        },
        "apoio-docente": {
          "name": "Apoio Docente",
          "description": "Publicações académicas, materiais, trabalhos e apoio às ações dos docentes."
        },
        "academico": {
          "name": "Académico",
          "description": "Alunos, docentes, cursos, turmas, matrículas, unidades curriculares e gestão académica."
        },
        "biblioteca": {
          "name": "Biblioteca Virtual",
          "description": "Catálogo, circulação, ficheiros, licenças, armazenamento, relatórios e administração da biblioteca."
        },
        "comercial": {
          "name": "Comercial",
          "description": "Funis, leads, oportunidades, tarefas, vendedores, metas, vendas, comissões e relatórios."
        },
        "financeiro": {
          "name": "Financeiro",
          "description": "Recebimentos, caixa, incumprimentos, relatórios financeiros e cobranças."
        },
        "rh": {
          "name": "Pessoal / RH",
          "description": "Funcionários, departamentos, ponto, recibos, férias, exames, rescisões e documentos de RH."
        },
        "controle-acesso": {
          "name": "Controlo de Acesso",
          "description": "Crachás, modelos, emissão, visitantes, entradas e saídas."
        },
        "documentos": {
          "name": "Documentos",
          "description": "Certificados, contratos, documentos, modelos, assinaturas e validações."
        },
        "comunicacao": {
          "name": "Comunicação",
          "description": "Reuniões, aniversariantes, ouvidoria, mensagens e comunicação interna."
        },
        "configuracoes": {
          "name": "Configurações / Integrações",
          "description": "Configurações da instituição, integrações e recursos administrativos."
        },
        "outros": {
          "name": "Outras permissões",
          "description": "Permissões ainda não classificadas num grupo específico."
        }
      },
      "permissionTerms": {
        "modules": {
          "dashboard": "Painel",
          "subscription": "Subscrição PHANYX",
          "students": "Alunos",
          "enrollments": "Matrículas",
          "academic": "Académico",
          "publications": "Publicações",
          "materials": "Materiais",
          "assignments": "Trabalhos",
          "classes": "Turmas",
          "subjects": "Unidades curriculares",
          "teachers": "Docentes",
          "library": "Biblioteca Virtual",
          "subscriptionManagement": "Contratação",
          "catalog": "Catálogo",
          "files": "Arquivos",
          "storage": "Armazenamento",
          "circulation": "Circulação",
          "loans": "Empréstimos",
          "renewals": "Renovações",
          "reservations": "Reservas",
          "shelves": "Prateleiras",
          "reviews": "Avaliações",
          "recommendations": "Recomendações",
          "licenses": "Licenças",
          "operators": "Operadores",
          "settings": "Configurações",
          "reports": "Relatórios",
          "audit": "Auditoria",
          "sales": "Comercial",
          "funnels": "Funis",
          "leads": "Leads",
          "tasks": "Tarefas",
          "salespeople": "Vendedores",
          "teams": "Equipes",
          "goals": "Metas",
          "salesTransactions": "Vendas",
          "commissions": "Comissões",
          "integrations": "Integrações",
          "email": "E-mail",
          "whatsapp": "WhatsApp",
          "finance": "Financeiro",
          "cashRegister": "Caixa",
          "documents": "Documentos",
          "certificates": "Certificados",
          "employees": "Funcionários",
          "departments": "Departamentos",
          "hr": "RH",
          "timeTracking": "Ponto",
          "mobile": "Mobile",
          "badges": "Crachás",
          "templates": "Modelos",
          "visitors": "Visitantes",
          "meetings": "Reuniões",
          "ombudsman": "Ouvidoria",
          "birthdays": "Aniversariantes",
          "receipts": "Recebimentos",
          "delinquency": "Incumprimentos",
          "closing": "Fecho",
          "permissions": "Permissões",
          "hiring": "Admissões",
          "terminations": "Desligamentos",
          "occurrences": "Ocorrências",
          "history": "Histórico",
          "archived": "Arquivados",
          "payslips": "Recibos de vencimento",
          "vacations": "Férias",
          "exams": "Exames",
          "roles": "Cargos",
          "salaryRanges": "Faixas salariais",
          "indicators": "Indicadores",
          "benefits": "Benefícios",
          "timeBank": "Banco de horas"
        },
        "actions": {
          "access": "Acessar",
          "view": "Ver",
          "create": "Criar",
          "edit": "Editar",
          "delete": "Eliminar",
          "cancel": "Cancelar",
          "manage": "Gerir",
          "publish": "Publicar",
          "attach": "Anexar",
          "select": "Selecionar",
          "upload": "Enviar",
          "download": "Descarregar",
          "archive": "Arquivar",
          "restore": "Restaurar",
          "moderate": "Moderar",
          "export": "Exportar",
          "interact": "Registrar interações",
          "assign": "Atribuir",
          "convert": "Converter",
          "move": "Movimentar",
          "transfer": "Transferir",
          "complete": "Concluir",
          "approve": "Aprovar",
          "calculate": "Calcular",
          "issue": "Emitir",
          "print": "Imprimir",
          "generate": "Gerar",
          "receive": "Receber",
          "open": "Abrir",
          "close": "Fechar",
          "configure": "Configurar",
          "adjust": "Ajustar",
          "sign": "Assinar",
          "block": "Bloquear",
          "reply": "Responder",
          "viewAll": "Ver todos",
          "recordLoss": "Registrar perda",
          "registerEntry": "Registrar entrada",
          "registerExit": "Registrar saída",
          "linkSalesperson": "Vincular vendedor",
          "sendToHr": "Enviar ao RH",
          "editTemplate": "Editar modelo",
          "generateWhatsAppLinks": "Gerar links WhatsApp",
          "exportPdf": "Baixar PDF",
          "exportExcel": "Baixar Excel",
          "archiveOccurrences": "Arquivar ocorrências",
          "archivePayslips": "Arquivar holerites",
          "archiveVacations": "Arquivar férias",
          "archiveExams": "Arquivar exames",
          "archiveTerminations": "Arquivar rescisões",
          "archiveHrDocuments": "Arquivar documentos RH",
          "restoreArchived": "Restaurar arquivados",
          "documentTemplates": "Modelos de documentos",
          "generateDocuments": "Gerar documentos",
          "editTimeEntries": "Ajustar registros de ponto",
          "timeTrackingIntegrations": "Integrações de ponto",
          "generatePayslips": "Gerar holerites",
          "signPayslips": "Assinar holerites",
          "deletePayslips": "Excluir holerites",
          "approveVacations": "Aprovar férias",
          "save": "Guardar"
        }
      }
    }
  },
  "en-US": {
    "title": "Departments",
    "newDepartment": {
      "title": "New department",
      "namePlaceholder": "Department name",
      "slugPlaceholder": "Public slug (optional)",
      "rolesTitle": "Department roles",
      "rolesDescription": "Optional. Add the roles that exist in this department now.",
      "create": "Create department"
    },
    "list": {
      "title": "Department list",
      "slug": "Slug"
    },
    "common": {
      "name": "Name",
      "slug": "Slug",
      "status": "Status",
      "active": "Active",
      "inactive": "Inactive",
      "save": "Save",
      "saving": "Saving...",
      "creating": "Creating...",
      "deleting": "Deleting...",
      "cancel": "Cancel",
      "edit": "Edit",
      "delete": "Delete",
      "remove": "Remove",
      "deactivate": "Deactivate",
      "reactivate": "Reactivate"
    },
    "roles": {
      "title": "Roles",
      "close": "Close roles",
      "add": "+ Add role",
      "newRole": "+ New role",
      "role": "Role",
      "fallbackName": "Role",
      "namePlaceholder": "Role name",
      "examplePlaceholder": "E.g.: Sales representative",
      "departmentTitle": "Roles in {name}",
      "departmentDescription": "Add the roles that exist in this department.",
      "loading": "Loading roles...",
      "empty": "No roles have been added to this department.",
      "active": "Active role",
      "linkedEmployees": "{count, plural, =0 {No employees linked} =1 {1 employee linked} other {# employees linked}}"
    },
    "permissions": {
      "link": "Permissions"
    },
    "roleStatusModal": {
      "deactivateTitle": "Deactivate role",
      "reactivateTitle": "Reactivate role",
      "deactivateDescription": "The role will no longer appear for new assignments, but employees already linked to it will not be removed.",
      "reactivateDescription": "The role will become available for new assignments again.",
      "confirmDeactivate": "Confirm deactivation",
      "confirmReactivate": "Confirm reactivation"
    },
    "deleteModal": {
      "title": "Confirm deletion",
      "question": "Are you sure you want to delete the department “{name}”?",
      "questionPrefix": "Are you sure you want to delete the department",
      "warning": "This action cannot be undone.",
      "confirm": "Confirm deletion"
    },
    "messages": {
      "departmentCreated": "Department created successfully.",
      "departmentUpdated": "Department updated successfully.",
      "departmentDeleted": "Department deleted successfully.",
      "roleCreated": "Role created successfully.",
      "roleUpdated": "Role updated successfully.",
      "roleDeactivated": "Role deactivated successfully.",
      "roleReactivated": "Role reactivated successfully."
    },
    "errors": {
      "createDepartment": "Unable to create the department.",
      "updateDepartment": "Unable to update the department.",
      "deleteDepartment": "Unable to delete the department.",
      "loadRoles": "Unable to load roles.",
      "roleNameRequired": "Enter the role name.",
      "createRole": "Unable to create the role.",
      "updateRole": "Unable to update the role.",
      "changeRoleStatus": "Unable to change the role status."
    },
    "permissionsPage": {
      "back": "← Back to Departments",
      "title": "Department Permissions — {name}",
      "description": "Define which areas and functions employees in this department can access. Permissions are organized by area for easier management.",
      "sectionTitle": "Permissions by area",
      "selectedLabel": "Selected",
      "save": "Save permissions",
      "groupSelected": "{selected} of {total} selected",
      "selectAllGroup": "Select all in this area",
      "clearGroup": "Clear this area",
      "permissionGenericDescription": "Grants this PHANYX permission: {permission}.",
      "messages": {
        "saved": "Permissions saved successfully."
      },
      "errors": {
        "load": "Unable to load permissions.",
        "save": "Unable to save permissions."
      },
      "common": {
        "saving": "Saving..."
      },
      "groups": {
        "geral": {
          "name": "General / Dashboard",
          "description": "General access to the administrative dashboard."
        },
        "assinatura": {
          "name": "PHANYX Subscription",
          "description": "Institution plan, pricing, billing, and subscription cancellation."
        },
        "apoio-docente": {
          "name": "Teacher Support",
          "description": "Academic publications, materials, assignments, and support for teacher activities."
        },
        "academico": {
          "name": "Academic",
          "description": "Students, teachers, courses, classes, enrollments, subjects, and academic management."
        },
        "biblioteca": {
          "name": "Digital Library",
          "description": "Catalog, circulation, files, licenses, storage, reports, and library administration."
        },
        "comercial": {
          "name": "Sales",
          "description": "Funnels, leads, opportunities, tasks, salespeople, goals, sales, commissions, and reports."
        },
        "financeiro": {
          "name": "Finance",
          "description": "Payments, cash register, delinquency, financial reports, and billing."
        },
        "rh": {
          "name": "Staff / HR",
          "description": "Employees, departments, time tracking, payslips, vacations, exams, terminations, and HR documents."
        },
        "controle-acesso": {
          "name": "Access Control",
          "description": "Badges, templates, issuance, visitors, entry, and exit."
        },
        "documentos": {
          "name": "Documents",
          "description": "Certificates, contracts, documents, templates, signatures, and validations."
        },
        "comunicacao": {
          "name": "Communication",
          "description": "Meetings, birthdays, feedback, messages, and internal communication."
        },
        "configuracoes": {
          "name": "Settings / Integrations",
          "description": "Institution settings, integrations, and administrative resources."
        },
        "outros": {
          "name": "Other permissions",
          "description": "Permissions not yet classified into a specific group."
        }
      },
      "permissionTerms": {
        "modules": {
          "dashboard": "Dashboard",
          "subscription": "PHANYX Subscription",
          "students": "Students",
          "enrollments": "Enrollments",
          "academic": "Academic",
          "publications": "Publications",
          "materials": "Materials",
          "assignments": "Assignments",
          "classes": "Classes",
          "subjects": "Subjects",
          "teachers": "Teachers",
          "library": "Digital Library",
          "subscriptionManagement": "Subscription",
          "catalog": "Catalog",
          "files": "Files",
          "storage": "Storage",
          "circulation": "Circulation",
          "loans": "Loans",
          "renewals": "Renewals",
          "reservations": "Reservations",
          "shelves": "Shelves",
          "reviews": "Reviews",
          "recommendations": "Recommendations",
          "licenses": "Licenses",
          "operators": "Operators",
          "settings": "Settings",
          "reports": "Reports",
          "audit": "Audit",
          "sales": "Sales",
          "funnels": "Funnels",
          "leads": "Leads",
          "tasks": "Tasks",
          "salespeople": "Salespeople",
          "teams": "Teams",
          "goals": "Goals",
          "salesTransactions": "Sales",
          "commissions": "Commissions",
          "integrations": "Integrations",
          "email": "Email",
          "whatsapp": "WhatsApp",
          "finance": "Finance",
          "cashRegister": "Cash Register",
          "documents": "Documents",
          "certificates": "Certificates",
          "employees": "Employees",
          "departments": "Departments",
          "hr": "HR",
          "timeTracking": "Time Tracking",
          "mobile": "Mobile",
          "badges": "Badges",
          "templates": "Templates",
          "visitors": "Visitors",
          "meetings": "Meetings",
          "ombudsman": "Feedback & Complaints",
          "birthdays": "Birthdays",
          "receipts": "Receipts",
          "delinquency": "Delinquency",
          "closing": "Closing",
          "permissions": "Permissions",
          "hiring": "Hiring",
          "terminations": "Terminations",
          "occurrences": "Occurrences",
          "history": "History",
          "archived": "Archived Records",
          "payslips": "Payslips",
          "vacations": "Vacations",
          "exams": "Exams",
          "roles": "Roles",
          "salaryRanges": "Salary Ranges",
          "indicators": "Indicators",
          "benefits": "Benefits",
          "timeBank": "Time Bank"
        },
        "actions": {
          "access": "Access",
          "view": "View",
          "create": "Create",
          "edit": "Edit",
          "delete": "Delete",
          "cancel": "Cancel",
          "manage": "Manage",
          "publish": "Publish",
          "attach": "Attach",
          "select": "Select",
          "upload": "Upload",
          "download": "Download",
          "archive": "Archive",
          "restore": "Restore",
          "moderate": "Moderate",
          "export": "Export",
          "interact": "Record interactions",
          "assign": "Assign",
          "convert": "Convert",
          "move": "Move",
          "transfer": "Transfer",
          "complete": "Complete",
          "approve": "Approve",
          "calculate": "Calculate",
          "issue": "Issue",
          "print": "Print",
          "generate": "Generate",
          "receive": "Receive",
          "open": "Open",
          "close": "Close",
          "configure": "Configure",
          "adjust": "Adjust",
          "sign": "Sign",
          "block": "Block",
          "reply": "Reply",
          "viewAll": "View all",
          "recordLoss": "Record lost opportunity",
          "registerEntry": "Register entry",
          "registerExit": "Register exit",
          "linkSalesperson": "Link salesperson",
          "sendToHr": "Send to HR",
          "editTemplate": "Edit template",
          "generateWhatsAppLinks": "Generate WhatsApp links",
          "exportPdf": "Export PDF",
          "exportExcel": "Export Excel",
          "archiveOccurrences": "Archive occurrences",
          "archivePayslips": "Archive payslips",
          "archiveVacations": "Archive vacations",
          "archiveExams": "Archive exams",
          "archiveTerminations": "Archive terminations",
          "archiveHrDocuments": "Archive HR documents",
          "restoreArchived": "Restore archived records",
          "documentTemplates": "Document templates",
          "generateDocuments": "Generate documents",
          "editTimeEntries": "Edit time entries",
          "timeTrackingIntegrations": "Time tracking integrations",
          "generatePayslips": "Generate payslips",
          "signPayslips": "Sign payslips",
          "deletePayslips": "Delete payslips",
          "approveVacations": "Approve vacations"
        }
      }
    }
  },
  "es-ES": {
    "title": "Departamentos",
    "newDepartment": {
      "title": "Nuevo departamento",
      "namePlaceholder": "Nombre del departamento",
      "slugPlaceholder": "Slug público (opcional)",
      "rolesTitle": "Cargos del departamento",
      "rolesDescription": "Opcional. Añada ahora los cargos que existen en este departamento.",
      "create": "Crear departamento"
    },
    "list": {
      "title": "Lista de departamentos",
      "slug": "Slug"
    },
    "common": {
      "name": "Nombre",
      "slug": "Slug",
      "status": "Estado",
      "active": "Activo",
      "inactive": "Inactivo",
      "save": "Guardar",
      "saving": "Guardando...",
      "creating": "Creando...",
      "deleting": "Eliminando...",
      "cancel": "Cancelar",
      "edit": "Editar",
      "delete": "Eliminar",
      "remove": "Quitar",
      "deactivate": "Desactivar",
      "reactivate": "Reactivar"
    },
    "roles": {
      "title": "Cargos",
      "close": "Cerrar cargos",
      "add": "+ Añadir cargo",
      "newRole": "+ Nuevo cargo",
      "role": "Cargo",
      "fallbackName": "Cargo",
      "namePlaceholder": "Nombre del cargo",
      "examplePlaceholder": "Ej.: Vendedor",
      "departmentTitle": "Cargos de {name}",
      "departmentDescription": "Añada los cargos que existen en este departamento.",
      "loading": "Cargando cargos...",
      "empty": "No hay cargos registrados en este departamento.",
      "active": "Cargo activo",
      "linkedEmployees": "{count, plural, =0 {Ningún empleado vinculado} =1 {1 empleado vinculado} other {# empleados vinculados}}"
    },
    "permissions": {
      "link": "Permisos"
    },
    "roleStatusModal": {
      "deactivateTitle": "Desactivar cargo",
      "reactivateTitle": "Reactivar cargo",
      "deactivateDescription": "El cargo dejará de aparecer para nuevas vinculaciones, pero no se eliminarán los empleados ya vinculados.",
      "reactivateDescription": "El cargo volverá a estar disponible para nuevas vinculaciones.",
      "confirmDeactivate": "Confirmar desactivación",
      "confirmReactivate": "Confirmar reactivación"
    },
    "deleteModal": {
      "title": "Confirmar eliminación",
      "question": "¿Seguro que desea eliminar el departamento “{name}”?",
      "questionPrefix": "¿Seguro que desea eliminar el departamento",
      "warning": "Esta acción no se puede deshacer.",
      "confirm": "Confirmar eliminación"
    },
    "messages": {
      "departmentCreated": "Departamento creado correctamente.",
      "departmentUpdated": "Departamento actualizado correctamente.",
      "departmentDeleted": "Departamento eliminado correctamente.",
      "roleCreated": "Cargo creado correctamente.",
      "roleUpdated": "Cargo actualizado correctamente.",
      "roleDeactivated": "Cargo desactivado correctamente.",
      "roleReactivated": "Cargo reactivado correctamente."
    },
    "errors": {
      "createDepartment": "No se pudo crear el departamento.",
      "updateDepartment": "No se pudo actualizar el departamento.",
      "deleteDepartment": "No se pudo eliminar el departamento.",
      "loadRoles": "No se pudieron cargar los cargos.",
      "roleNameRequired": "Introduzca el nombre del cargo.",
      "createRole": "No se pudo crear el cargo.",
      "updateRole": "No se pudo actualizar el cargo.",
      "changeRoleStatus": "No se pudo cambiar el estado del cargo."
    },
    "permissionsPage": {
      "back": "← Volver a Departamentos",
      "title": "Permisos del Departamento — {name}",
      "description": "Defina a qué áreas y funciones pueden acceder los empleados de este departamento. Los permisos están organizados por área para facilitar la gestión.",
      "sectionTitle": "Permisos por área",
      "selectedLabel": "Seleccionados",
      "save": "Guardar permisos",
      "groupSelected": "{selected} de {total} seleccionados",
      "selectAllGroup": "Seleccionar todos de esta área",
      "clearGroup": "Limpiar esta área",
      "permissionGenericDescription": "Concede este permiso de PHANYX: {permission}.",
      "messages": {
        "saved": "Permisos guardados correctamente."
      },
      "errors": {
        "load": "No se pudieron cargar los permisos.",
        "save": "No se pudieron guardar los permisos."
      },
      "common": {
        "saving": "Guardando..."
      },
      "groups": {
        "geral": {
          "name": "General / Panel",
          "description": "Accesos generales al panel administrativo."
        },
        "assinatura": {
          "name": "Suscripción PHANYX",
          "description": "Plan, precios, facturación y cancelación de la suscripción de la institución."
        },
        "apoio-docente": {
          "name": "Apoyo Docente",
          "description": "Publicaciones académicas, materiales, trabajos y apoyo a las actividades docentes."
        },
        "academico": {
          "name": "Académico",
          "description": "Estudiantes, profesores, cursos, grupos, matrículas, asignaturas y gestión académica."
        },
        "biblioteca": {
          "name": "Biblioteca Digital",
          "description": "Catálogo, circulación, archivos, licencias, almacenamiento, informes y administración de la biblioteca."
        },
        "comercial": {
          "name": "Comercial",
          "description": "Embudos, leads, oportunidades, tareas, vendedores, objetivos, ventas, comisiones e informes."
        },
        "financeiro": {
          "name": "Finanzas",
          "description": "Cobros, caja, morosidad, informes financieros y facturación."
        },
        "rh": {
          "name": "Personal / RR. HH.",
          "description": "Empleados, departamentos, control horario, nóminas, vacaciones, exámenes, bajas y documentos de RR. HH."
        },
        "controle-acesso": {
          "name": "Control de Acceso",
          "description": "Credenciales, plantillas, emisión, visitantes, entradas y salidas."
        },
        "documentos": {
          "name": "Documentos",
          "description": "Certificados, contratos, documentos, plantillas, firmas y validaciones."
        },
        "comunicacao": {
          "name": "Comunicación",
          "description": "Reuniones, cumpleaños, atención, mensajes y comunicación interna."
        },
        "configuracoes": {
          "name": "Configuración / Integraciones",
          "description": "Configuración de la institución, integraciones y recursos administrativos."
        },
        "outros": {
          "name": "Otros permisos",
          "description": "Permisos todavía no clasificados en un grupo específico."
        }
      },
      "permissionTerms": {
        "modules": {
          "dashboard": "Panel",
          "subscription": "Suscripción PHANYX",
          "students": "Estudiantes",
          "enrollments": "Matrículas",
          "academic": "Académico",
          "publications": "Publicaciones",
          "materials": "Materiales",
          "assignments": "Trabajos",
          "classes": "Grupos",
          "subjects": "Asignaturas",
          "teachers": "Profesores",
          "library": "Biblioteca Digital",
          "subscriptionManagement": "Contratación",
          "catalog": "Catálogo",
          "files": "Archivos",
          "storage": "Almacenamiento",
          "circulation": "Circulación",
          "loans": "Préstamos",
          "renewals": "Renovaciones",
          "reservations": "Reservas",
          "shelves": "Estanterías",
          "reviews": "Valoraciones",
          "recommendations": "Recomendaciones",
          "licenses": "Licencias",
          "operators": "Operadores",
          "settings": "Configuración",
          "reports": "Informes",
          "audit": "Auditoría",
          "sales": "Comercial",
          "funnels": "Embudos",
          "leads": "Leads",
          "tasks": "Tareas",
          "salespeople": "Vendedores",
          "teams": "Equipos",
          "goals": "Objetivos",
          "salesTransactions": "Ventas",
          "commissions": "Comisiones",
          "integrations": "Integraciones",
          "email": "Correo electrónico",
          "whatsapp": "WhatsApp",
          "finance": "Finanzas",
          "cashRegister": "Caja",
          "documents": "Documentos",
          "certificates": "Certificados",
          "employees": "Empleados",
          "departments": "Departamentos",
          "hr": "RR. HH.",
          "timeTracking": "Control horario",
          "mobile": "Móvil",
          "badges": "Credenciales",
          "templates": "Plantillas",
          "visitors": "Visitantes",
          "meetings": "Reuniones",
          "ombudsman": "Atención y reclamaciones",
          "birthdays": "Cumpleaños",
          "receipts": "Cobros",
          "delinquency": "Morosidad",
          "closing": "Cierre",
          "permissions": "Permisos",
          "hiring": "Altas",
          "terminations": "Bajas",
          "occurrences": "Incidencias",
          "history": "Historial",
          "archived": "Archivados",
          "payslips": "Nóminas",
          "vacations": "Vacaciones",
          "exams": "Exámenes",
          "roles": "Cargos",
          "salaryRanges": "Bandas salariales",
          "indicators": "Indicadores",
          "benefits": "Beneficios",
          "timeBank": "Banco de horas"
        },
        "actions": {
          "access": "Acceder",
          "view": "Ver",
          "create": "Crear",
          "edit": "Editar",
          "delete": "Eliminar",
          "cancel": "Cancelar",
          "manage": "Gestionar",
          "publish": "Publicar",
          "attach": "Adjuntar",
          "select": "Seleccionar",
          "upload": "Subir",
          "download": "Descargar",
          "archive": "Archivar",
          "restore": "Restaurar",
          "moderate": "Moderar",
          "export": "Exportar",
          "interact": "Registrar interacciones",
          "assign": "Asignar",
          "convert": "Convertir",
          "move": "Mover",
          "transfer": "Transferir",
          "complete": "Completar",
          "approve": "Aprobar",
          "calculate": "Calcular",
          "issue": "Emitir",
          "print": "Imprimir",
          "generate": "Generar",
          "receive": "Cobrar",
          "open": "Abrir",
          "close": "Cerrar",
          "configure": "Configurar",
          "adjust": "Ajustar",
          "sign": "Firmar",
          "block": "Bloquear",
          "reply": "Responder",
          "viewAll": "Ver todos",
          "recordLoss": "Registrar pérdida",
          "registerEntry": "Registrar entrada",
          "registerExit": "Registrar salida",
          "linkSalesperson": "Vincular vendedor",
          "sendToHr": "Enviar a RR. HH.",
          "editTemplate": "Editar plantilla",
          "generateWhatsAppLinks": "Generar enlaces de WhatsApp",
          "exportPdf": "Exportar PDF",
          "exportExcel": "Exportar Excel",
          "archiveOccurrences": "Archivar incidencias",
          "archivePayslips": "Archivar nóminas",
          "archiveVacations": "Archivar vacaciones",
          "archiveExams": "Archivar exámenes",
          "archiveTerminations": "Archivar bajas",
          "archiveHrDocuments": "Archivar documentos de RR. HH.",
          "restoreArchived": "Restaurar archivados",
          "documentTemplates": "Plantillas de documentos",
          "generateDocuments": "Generar documentos",
          "editTimeEntries": "Ajustar registros horarios",
          "timeTrackingIntegrations": "Integraciones de control horario",
          "generatePayslips": "Generar nóminas",
          "signPayslips": "Firmar nóminas",
          "deletePayslips": "Eliminar nóminas",
          "approveVacations": "Aprobar vacaciones"
        }
      }
    }
  },
  "fr-FR": {
    "title": "Départements",
    "newDepartment": {
      "title": "Nouveau département",
      "namePlaceholder": "Nom du département",
      "slugPlaceholder": "Slug public (facultatif)",
      "rolesTitle": "Postes du département",
      "rolesDescription": "Facultatif. Ajoutez dès maintenant les postes existant dans ce département.",
      "create": "Créer le département"
    },
    "list": {
      "title": "Liste des départements",
      "slug": "Slug"
    },
    "common": {
      "name": "Nom",
      "slug": "Slug",
      "status": "Statut",
      "active": "Actif",
      "inactive": "Inactif",
      "save": "Enregistrer",
      "saving": "Enregistrement...",
      "creating": "Création...",
      "deleting": "Suppression...",
      "cancel": "Annuler",
      "edit": "Modifier",
      "delete": "Supprimer",
      "remove": "Retirer",
      "deactivate": "Désactiver",
      "reactivate": "Réactiver"
    },
    "roles": {
      "title": "Postes",
      "close": "Fermer les postes",
      "add": "+ Ajouter un poste",
      "newRole": "+ Nouveau poste",
      "role": "Poste",
      "fallbackName": "Poste",
      "namePlaceholder": "Nom du poste",
      "examplePlaceholder": "Ex. : Commercial",
      "departmentTitle": "Postes de {name}",
      "departmentDescription": "Ajoutez les postes existant dans ce département.",
      "loading": "Chargement des postes...",
      "empty": "Aucun poste enregistré dans ce département.",
      "active": "Poste actif",
      "linkedEmployees": "{count, plural, =0 {Aucun employé associé} =1 {1 employé associé} other {# employés associés}}"
    },
    "permissions": {
      "link": "Autorisations"
    },
    "roleStatusModal": {
      "deactivateTitle": "Désactiver le poste",
      "reactivateTitle": "Réactiver le poste",
      "deactivateDescription": "Le poste ne sera plus proposé pour de nouvelles associations, mais les employés déjà associés ne seront pas supprimés.",
      "reactivateDescription": "Le poste sera de nouveau disponible pour de nouvelles associations.",
      "confirmDeactivate": "Confirmer la désactivation",
      "confirmReactivate": "Confirmer la réactivation"
    },
    "deleteModal": {
      "title": "Confirmer la suppression",
      "question": "Voulez-vous vraiment supprimer le département « {name} » ?",
      "questionPrefix": "Voulez-vous vraiment supprimer le département",
      "warning": "Cette action est irréversible.",
      "confirm": "Confirmer la suppression"
    },
    "messages": {
      "departmentCreated": "Département créé avec succès.",
      "departmentUpdated": "Département mis à jour avec succès.",
      "departmentDeleted": "Département supprimé avec succès.",
      "roleCreated": "Poste créé avec succès.",
      "roleUpdated": "Poste mis à jour avec succès.",
      "roleDeactivated": "Poste désactivé avec succès.",
      "roleReactivated": "Poste réactivé avec succès."
    },
    "errors": {
      "createDepartment": "Impossible de créer le département.",
      "updateDepartment": "Impossible de mettre à jour le département.",
      "deleteDepartment": "Impossible de supprimer le département.",
      "loadRoles": "Impossible de charger les postes.",
      "roleNameRequired": "Saisissez le nom du poste.",
      "createRole": "Impossible de créer le poste.",
      "updateRole": "Impossible de mettre à jour le poste.",
      "changeRoleStatus": "Impossible de modifier le statut du poste."
    },
    "permissionsPage": {
      "back": "← Retour aux Départements",
      "title": "Autorisations du Département — {name}",
      "description": "Définissez les zones et fonctions accessibles aux employés de ce département. Les autorisations sont organisées par domaine pour faciliter la gestion.",
      "sectionTitle": "Autorisations par domaine",
      "selectedLabel": "Sélectionnées",
      "save": "Enregistrer les autorisations",
      "groupSelected": "{selected} sur {total} sélectionnées",
      "selectAllGroup": "Tout sélectionner dans ce domaine",
      "clearGroup": "Effacer ce domaine",
      "permissionGenericDescription": "Accorde cette autorisation PHANYX : {permission}.",
      "messages": {
        "saved": "Autorisations enregistrées avec succès."
      },
      "errors": {
        "load": "Impossible de charger les autorisations.",
        "save": "Impossible d’enregistrer les autorisations."
      },
      "common": {
        "saving": "Enregistrement..."
      },
      "groups": {
        "geral": {
          "name": "Général / Tableau de bord",
          "description": "Accès généraux au tableau de bord administratif."
        },
        "assinatura": {
          "name": "Abonnement PHANYX",
          "description": "Forfait, tarifs, facturation et résiliation de l’abonnement de l’établissement."
        },
        "apoio-docente": {
          "name": "Support Enseignant",
          "description": "Publications académiques, ressources, travaux et soutien aux activités des enseignants."
        },
        "academico": {
          "name": "Académique",
          "description": "Étudiants, enseignants, cursus, groupes, inscriptions, matières et gestion académique."
        },
        "biblioteca": {
          "name": "Bibliothèque Numérique",
          "description": "Catalogue, circulation, fichiers, licences, stockage, rapports et administration de la bibliothèque."
        },
        "comercial": {
          "name": "Commercial",
          "description": "Entonnoirs, prospects, opportunités, tâches, commerciaux, objectifs, ventes, commissions et rapports."
        },
        "financeiro": {
          "name": "Finances",
          "description": "Encaissements, caisse, impayés, rapports financiers et facturation."
        },
        "rh": {
          "name": "Personnel / RH",
          "description": "Employés, départements, pointage, bulletins de paie, congés, examens, départs et documents RH."
        },
        "controle-acesso": {
          "name": "Contrôle d’accès",
          "description": "Badges, modèles, émission, visiteurs, entrées et sorties."
        },
        "documentos": {
          "name": "Documents",
          "description": "Certificats, contrats, documents, modèles, signatures et validations."
        },
        "comunicacao": {
          "name": "Communication",
          "description": "Réunions, anniversaires, réclamations, messages et communication interne."
        },
        "configuracoes": {
          "name": "Paramètres / Intégrations",
          "description": "Paramètres de l’établissement, intégrations et ressources administratives."
        },
        "outros": {
          "name": "Autres autorisations",
          "description": "Autorisations qui ne sont pas encore classées dans un groupe précis."
        }
      },
      "permissionTerms": {
        "modules": {
          "dashboard": "Tableau de bord",
          "subscription": "Abonnement PHANYX",
          "students": "Étudiants",
          "enrollments": "Inscriptions",
          "academic": "Académique",
          "publications": "Publications",
          "materials": "Ressources",
          "assignments": "Travaux",
          "classes": "Groupes",
          "subjects": "Matières",
          "teachers": "Enseignants",
          "library": "Bibliothèque Numérique",
          "subscriptionManagement": "Abonnement",
          "catalog": "Catalogue",
          "files": "Fichiers",
          "storage": "Stockage",
          "circulation": "Circulation",
          "loans": "Emprunts",
          "renewals": "Renouvellements",
          "reservations": "Réservations",
          "shelves": "Rayonnages",
          "reviews": "Évaluations",
          "recommendations": "Recommandations",
          "licenses": "Licences",
          "operators": "Opérateurs",
          "settings": "Paramètres",
          "reports": "Rapports",
          "audit": "Audit",
          "sales": "Commercial",
          "funnels": "Entonnoirs",
          "leads": "Prospects",
          "tasks": "Tâches",
          "salespeople": "Commerciaux",
          "teams": "Équipes",
          "goals": "Objectifs",
          "salesTransactions": "Ventes",
          "commissions": "Commissions",
          "integrations": "Intégrations",
          "email": "E-mail",
          "whatsapp": "WhatsApp",
          "finance": "Finances",
          "cashRegister": "Caisse",
          "documents": "Documents",
          "certificates": "Certificats",
          "employees": "Employés",
          "departments": "Départements",
          "hr": "RH",
          "timeTracking": "Pointage",
          "mobile": "Mobile",
          "badges": "Badges",
          "templates": "Modèles",
          "visitors": "Visiteurs",
          "meetings": "Réunions",
          "ombudsman": "Réclamations",
          "birthdays": "Anniversaires",
          "receipts": "Encaissements",
          "delinquency": "Impayés",
          "closing": "Clôture",
          "permissions": "Autorisations",
          "hiring": "Embauches",
          "terminations": "Départs",
          "occurrences": "Incidents",
          "history": "Historique",
          "archived": "Archives",
          "payslips": "Bulletins de paie",
          "vacations": "Congés",
          "exams": "Examens",
          "roles": "Postes",
          "salaryRanges": "Grilles salariales",
          "indicators": "Indicateurs",
          "benefits": "Avantages",
          "timeBank": "Banque d’heures"
        },
        "actions": {
          "access": "Accéder",
          "view": "Voir",
          "create": "Créer",
          "edit": "Modifier",
          "delete": "Supprimer",
          "cancel": "Annuler",
          "manage": "Gérer",
          "publish": "Publier",
          "attach": "Joindre",
          "select": "Sélectionner",
          "upload": "Téléverser",
          "download": "Télécharger",
          "archive": "Archiver",
          "restore": "Restaurer",
          "moderate": "Modérer",
          "export": "Exporter",
          "interact": "Enregistrer des interactions",
          "assign": "Attribuer",
          "convert": "Convertir",
          "move": "Déplacer",
          "transfer": "Transférer",
          "complete": "Terminer",
          "approve": "Approuver",
          "calculate": "Calculer",
          "issue": "Émettre",
          "print": "Imprimer",
          "generate": "Générer",
          "receive": "Encaisser",
          "open": "Ouvrir",
          "close": "Fermer",
          "configure": "Configurer",
          "adjust": "Ajuster",
          "sign": "Signer",
          "block": "Bloquer",
          "reply": "Répondre",
          "viewAll": "Voir tout",
          "recordLoss": "Enregistrer une perte",
          "registerEntry": "Enregistrer l’entrée",
          "registerExit": "Enregistrer la sortie",
          "linkSalesperson": "Associer un commercial",
          "sendToHr": "Envoyer aux RH",
          "editTemplate": "Modifier le modèle",
          "generateWhatsAppLinks": "Générer des liens WhatsApp",
          "exportPdf": "Exporter en PDF",
          "exportExcel": "Exporter vers Excel",
          "archiveOccurrences": "Archiver les incidents",
          "archivePayslips": "Archiver les bulletins de paie",
          "archiveVacations": "Archiver les congés",
          "archiveExams": "Archiver les examens",
          "archiveTerminations": "Archiver les départs",
          "archiveHrDocuments": "Archiver les documents RH",
          "restoreArchived": "Restaurer les archives",
          "documentTemplates": "Modèles de documents",
          "generateDocuments": "Générer des documents",
          "editTimeEntries": "Ajuster les pointages",
          "timeTrackingIntegrations": "Intégrations de pointage",
          "generatePayslips": "Générer les bulletins de paie",
          "signPayslips": "Signer les bulletins de paie",
          "deletePayslips": "Supprimer les bulletins de paie",
          "approveVacations": "Approuver les congés"
        }
      }
    }
  }
};

for (const [locale, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    throw new Error(`Arquivo não encontrado: ${file}`);
  }

  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  json.AdminDepartments = {
    ...(json.AdminDepartments || {}),
    ...translations[locale],
  };

  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  console.log(`OK: ${locale}`);
}

console.log("Traduções das páginas de Departamentos atualizadas.");
