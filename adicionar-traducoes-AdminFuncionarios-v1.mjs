import fs from "node:fs";
import path from "node:path";

const namespace = "AdminFuncionarios";
const locales = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"];
const traducoes = {
  "pt-BR": {
    "title": "Funcion\u00e1rios",
    "toast": {
      "errorTitle": "N\u00e3o foi poss\u00edvel concluir",
      "successTitle": "Tudo certo"
    },
    "form": {
      "editTitle": "Editar funcion\u00e1rio",
      "newTitle": "Novo funcion\u00e1rio"
    },
    "systemAccess": {
      "createTitle": "Criar acesso ao sistema para este funcion\u00e1rio",
      "createDescription": "Quando ativado, o PHANYX criar\u00e1 login, senha tempor\u00e1ria e enviar\u00e1 as credenciais por e-mail. Desative para cadastrar somente o v\u00ednculo trabalhista no RH.",
      "noAccessDescription": "Este funcion\u00e1rio poder\u00e1 participar da folha, ponto, f\u00e9rias, benef\u00edcios, holerites, documentos e demais rotinas do RH, mas n\u00e3o receber\u00e1 login nem senha."
    },
    "fields": {
      "name": "Nome",
      "email": "E-mail",
      "accessProfile": "Perfil de acesso ao sistema",
      "selectProfile": "Selecione o perfil",
      "department": "Departamento",
      "selectDepartment": "Selecione um departamento",
      "job": "Cargo",
      "campus": "Polo de lota\u00e7\u00e3o",
      "selectCampus": "Selecione o polo de lota\u00e7\u00e3o",
      "phone": "Telefone",
      "employeeCodeOptional": "C\u00f3digo do funcion\u00e1rio (opcional)",
      "branch": "Ag\u00eancia",
      "account": "Conta",
      "pix": "Pix",
      "pixKey": "Chave Pix",
      "status": "Status",
      "reasonOptional": "Motivo (opcional)",
      "reason": "Motivo",
      "code": "C\u00f3digo"
    },
    "roles": {
      "admin": "Administrador",
      "employee": "Funcion\u00e1rio",
      "secretariat": "Secretaria",
      "coordinator": "Coordena\u00e7\u00e3o",
      "finance": "Financeiro",
      "support": "Suporte"
    },
    "job": {
      "loading": "Carregando cargos...",
      "selectDepartmentFirst": "Selecione primeiro o departamento",
      "noActiveJobs": "Nenhum cargo ativo cadastrado",
      "selectJob": "Selecione o cargo",
      "noJobsHelp": "Este departamento ainda n\u00e3o possui cargos ativos cadastrados. Cadastre os cargos em Departamentos."
    },
    "common": {
      "inactive": "Inativo",
      "minutes": "minutos",
      "notDefined": "N\u00e3o definido",
      "other": "Outro",
      "select": "Selecione"
    },
    "campus": {
      "editHelp": "A lota\u00e7\u00e3o n\u00e3o pode ser alterada por esta edi\u00e7\u00e3o comum. Para definir ou transferir o polo, abra a ficha do funcion\u00e1rio.",
      "createHelp": "Selecione a unidade em que o funcion\u00e1rio ser\u00e1 inicialmente lotado.",
      "openRecord": "Abrir ficha e gerenciar lota\u00e7\u00e3o",
      "legacyEmployeeHelp": "Este funcion\u00e1rio antigo ainda precisa ter sua lota\u00e7\u00e3o definida."
    },
    "photo": {
      "alt": "Foto oficial do funcion\u00e1rio",
      "title": "Foto oficial do funcion\u00e1rio",
      "description": "Esta \u00e9 a foto institucional usada em crach\u00e1s, identifica\u00e7\u00e3o, documentos e registros internos.",
      "help": "Formatos aceitos: JPG, JPEG, PNG ou WEBP. Tamanho m\u00e1ximo: 2 MB. Recomendado: foto quadrada, com rosto centralizado."
    },
    "buttons": {
      "uploading": "Enviando...",
      "uploadPhoto": "Enviar foto",
      "removePhoto": "Remover foto",
      "selectFile": "Selecionar arquivo",
      "remove": "Remover",
      "addLink": "Adicionar link",
      "saving": "Salvando...",
      "creating": "Criando...",
      "saveChanges": "Salvar altera\u00e7\u00f5es",
      "createEmployee": "Criar funcion\u00e1rio",
      "cancelEditing": "Cancelar edi\u00e7\u00e3o",
      "edit": "Editar",
      "individualPermissions": "Permiss\u00f5es individuais",
      "blockAccess": "Bloquear acesso",
      "unblockAccess": "Desbloquear acesso",
      "confirm": "Confirmar",
      "cancel": "Cancelar"
    },
    "employment": {
      "title": "Dados trabalhistas, previdenci\u00e1rios e banc\u00e1rios",
      "description": "Informe os dados necess\u00e1rios para folha, ponto, holerites, banco de horas, rescis\u00f5es e relat\u00f3rios cont\u00e1beis.",
      "admissionDate": "Data de admiss\u00e3o",
      "compensationType": "Modalidade de remunera\u00e7\u00e3o",
      "classHourValue": "Valor da hora-aula",
      "classHourDuration": "Dura\u00e7\u00e3o da hora-aula",
      "workHourValue": "Valor da hora trabalhada",
      "contractType": "Tipo de contrato",
      "workSchedule": "Jornada de trabalho",
      "weeklyHours": "Carga hor\u00e1ria semanal",
      "monthlyHours": "Carga hor\u00e1ria mensal",
      "timeClockCode": "C\u00f3digo do ponto",
      "payrollBank": "Banco da conta salarial",
      "bankHelp": "Pesquise pelo c\u00f3digo ou nome. Exemplos: 001, 260, Nubank, Inter ou Ita\u00fa.",
      "compensationNotes": "Observa\u00e7\u00f5es da remunera\u00e7\u00e3o"
    },
    "compensation": {
      "monthlySalary": "Sal\u00e1rio mensal",
      "classHour": "Hora-aula",
      "workHour": "Hora trabalhada",
      "perClass": "Valor por aula",
      "perClassGroup": "Valor por turma",
      "perSubject": "Valor por disciplina",
      "mixed": "Remunera\u00e7\u00e3o mista",
      "none": "Sem remunera\u00e7\u00e3o"
    },
    "contracts": {
      "internship": "Est\u00e1gio",
      "apprentice": "Aprendiz",
      "temporary": "Tempor\u00e1rio",
      "selfEmployed": "Aut\u00f4nomo"
    },
    "placeholders": {
      "amount": "0,00",
      "workSchedule": "Ex.: 44h semanais / 220h mensais",
      "weeklyHours": "Ex.: 44",
      "monthlyHours": "Ex.: 220",
      "timeClockCode": "Identificador usado no rel\u00f3gio/app",
      "bankSearch": "Digite o c\u00f3digo ou nome do banco",
      "bankAria": "Buscar banco da conta salarial do funcion\u00e1rio",
      "compensationNotes": "Acordos, adicionais, regras de pagamento ou outras observa\u00e7\u00f5es."
    },
    "status": {
      "active": "Ativo",
      "dismissed": "Demitido",
      "onLeave": "Afastado",
      "warning": "Advert\u00eancia",
      "vacation": "F\u00e9rias",
      "rehired": "Readmitido"
    },
    "documents": {
      "title": "Documentos e Portf\u00f3lio",
      "description": "Envie documentos pessoais, curr\u00edculo, certificados, portf\u00f3lio e links profissionais.",
      "residenceProof": "Comprovante de resid\u00eancia",
      "resume": "Curr\u00edculo",
      "portfolio": "Portf\u00f3lio",
      "certificates": "Certificados",
      "portfolioLinks": "Links do portf\u00f3lio",
      "personalWebsite": "Site pessoal"
    },
    "list": {
      "title": "Lista de funcion\u00e1rios",
      "searchPlaceholder": "Buscar por nome, e-mail, CPF, telefone, cargo, c\u00f3digo, departamento ou polo",
      "empty": "Nenhum funcion\u00e1rio encontrado para essa busca.",
      "accessEmail": "E-mail de acesso",
      "accessProfile": "Perfil de acesso",
      "access": "Acesso"
    },
    "access": {
      "blocked": "Bloqueado",
      "active": "Ativo",
      "noSystemAccess": "Sem acesso ao sistema"
    },
    "confirm": {
      "blockMessage": "Deseja bloquear o acesso de \"{name}\"?",
      "unblockMessage": "Deseja desbloquear o acesso de \"{name}\"?",
      "blockTitle": "Bloquear acesso",
      "unblockTitle": "Desbloquear acesso"
    },
    "errors": {
      "loadJobs": "N\u00e3o foi poss\u00edvel carregar os cargos.",
      "invalidPhotoFormat": "Formato inv\u00e1lido. Envie uma foto em JPG, JPEG, PNG ou WEBP.",
      "photoTooLarge": "Foto muito grande. Envie uma foto com no m\u00e1ximo {max} MB.",
      "photoUpload": "Erro ao enviar foto.",
      "photoUrlMissing": "Upload realizado, mas a URL da foto n\u00e3o retornou.",
      "photoUploadCheck": "N\u00e3o foi poss\u00edvel enviar a foto. Verifique o formato e o tamanho do arquivo.",
      "selectCompensationType": "Selecione a modalidade de remunera\u00e7\u00e3o do funcion\u00e1rio.",
      "monthlySalaryRequired": "Informe o sal\u00e1rio mensal do funcion\u00e1rio.",
      "classHourValueRequired": "Informe o valor da hora-aula.",
      "workHourValueRequired": "Informe o valor da hora trabalhada.",
      "perClassValueRequired": "Informe o valor por aula.",
      "perClassGroupValueRequired": "Informe o valor por turma.",
      "perSubjectValueRequired": "Informe o valor por disciplina.",
      "mixedCompensationValueRequired": "Na remunera\u00e7\u00e3o mista, informe pelo menos um valor.",
      "employeeNameBeforeContinue": "Informe o nome do funcion\u00e1rio antes de continuar.",
      "employeeEmailBeforeContinue": "Informe o e-mail do funcion\u00e1rio antes de continuar.",
      "accessProfileBeforeContinue": "Selecione o perfil de acesso do funcion\u00e1rio antes de continuar.",
      "createEmployee": "Erro ao criar funcion\u00e1rio.",
      "changeAccess": "Erro ao alterar acesso do funcion\u00e1rio.",
      "changeAccessCommunication": "Erro de comunica\u00e7\u00e3o ao alterar acesso do funcion\u00e1rio.",
      "employeeNameRequired": "Informe o nome do funcion\u00e1rio.",
      "campusRequired": "Selecione o polo de lota\u00e7\u00e3o do funcion\u00e1rio.",
      "emailForAccessRequired": "Informe o e-mail para criar o acesso do funcion\u00e1rio.",
      "accessProfileRequired": "Selecione o perfil de acesso do funcion\u00e1rio.",
      "updateEmployee": "Erro ao atualizar funcion\u00e1rio."
    },
    "messages": {
      "photoUploaded": "Foto oficial do funcion\u00e1rio enviada com sucesso.",
      "employeeUpdated": "Funcion\u00e1rio atualizado com sucesso.",
      "accessChanged": "Acesso alterado com sucesso.",
      "employeeCreatedWithAccess": "Funcion\u00e1rio criado com sucesso e e-mail de acesso enviado.",
      "employeeCreatedWithoutAccess": "Funcion\u00e1rio cadastrado no RH com sucesso, sem acesso ao sistema."
    }
  },
  "pt-PT": {
    "title": "Funcion\u00e1rios",
    "toast": {
      "errorTitle": "N\u00e3o foi poss\u00edvel concluir",
      "successTitle": "Tudo certo"
    },
    "form": {
      "editTitle": "Editar funcion\u00e1rio",
      "newTitle": "Novo funcion\u00e1rio"
    },
    "systemAccess": {
      "createTitle": "Criar acesso ao sistema para este funcion\u00e1rio",
      "createDescription": "Quando ativado, o PHANYX criar\u00e1 um login e uma palavra-passe tempor\u00e1ria e enviar\u00e1 as credenciais por e-mail. Desative para registar apenas o v\u00ednculo laboral nos RH.",
      "noAccessDescription": "Este funcion\u00e1rio poder\u00e1 participar no processamento salarial, ponto, f\u00e9rias, benef\u00edcios, recibos de vencimento, documentos e restantes rotinas de RH, mas n\u00e3o receber\u00e1 login nem palavra-passe."
    },
    "fields": {
      "name": "Nome",
      "email": "E-mail",
      "accessProfile": "Perfil de acesso ao sistema",
      "selectProfile": "Selecione o perfil",
      "department": "Departamento",
      "selectDepartment": "Selecione um departamento",
      "job": "Cargo",
      "campus": "Polo de afeta\u00e7\u00e3o",
      "selectCampus": "Selecione o polo de afeta\u00e7\u00e3o",
      "phone": "Telefone",
      "employeeCodeOptional": "C\u00f3digo do funcion\u00e1rio (opcional)",
      "branch": "Ag\u00eancia",
      "account": "Conta",
      "pix": "Pix",
      "pixKey": "Chave Pix",
      "status": "Estado",
      "reasonOptional": "Motivo (opcional)",
      "reason": "Motivo",
      "code": "C\u00f3digo"
    },
    "roles": {
      "admin": "Administrador",
      "employee": "Funcion\u00e1rio",
      "secretariat": "Secretaria",
      "coordinator": "Coordena\u00e7\u00e3o",
      "finance": "Financeiro",
      "support": "Suporte"
    },
    "job": {
      "loading": "A carregar cargos...",
      "selectDepartmentFirst": "Selecione primeiro o departamento",
      "noActiveJobs": "Nenhum cargo ativo registado",
      "selectJob": "Selecione o cargo",
      "noJobsHelp": "Este departamento ainda n\u00e3o possui cargos ativos registados. Registe os cargos em Departamentos."
    },
    "common": {
      "inactive": "Inativo",
      "minutes": "minutos",
      "notDefined": "N\u00e3o definido",
      "other": "Outro",
      "select": "Selecione"
    },
    "campus": {
      "editHelp": "A afeta\u00e7\u00e3o n\u00e3o pode ser alterada por esta edi\u00e7\u00e3o comum. Para definir ou transferir o polo, abra a ficha do funcion\u00e1rio.",
      "createHelp": "Selecione a unidade onde o funcion\u00e1rio ficar\u00e1 inicialmente afeto.",
      "openRecord": "Abrir ficha e gerir afeta\u00e7\u00e3o",
      "legacyEmployeeHelp": "Este funcion\u00e1rio antigo ainda precisa de ter a sua afeta\u00e7\u00e3o definida."
    },
    "photo": {
      "alt": "Foto oficial do funcion\u00e1rio",
      "title": "Foto oficial do funcion\u00e1rio",
      "description": "Esta \u00e9 a foto institucional utilizada em cart\u00f5es de identifica\u00e7\u00e3o, identifica\u00e7\u00e3o, documentos e registos internos.",
      "help": "Formatos aceites: JPG, JPEG, PNG ou WEBP. Tamanho m\u00e1ximo: 2 MB. Recomendado: foto quadrada, com o rosto centrado."
    },
    "buttons": {
      "uploading": "A enviar...",
      "uploadPhoto": "Enviar foto",
      "removePhoto": "Remover foto",
      "selectFile": "Selecionar ficheiro",
      "remove": "Remover",
      "addLink": "Adicionar liga\u00e7\u00e3o",
      "saving": "A guardar...",
      "creating": "A criar...",
      "saveChanges": "Guardar altera\u00e7\u00f5es",
      "createEmployee": "Criar funcion\u00e1rio",
      "cancelEditing": "Cancelar edi\u00e7\u00e3o",
      "edit": "Editar",
      "individualPermissions": "Permiss\u00f5es individuais",
      "blockAccess": "Bloquear acesso",
      "unblockAccess": "Desbloquear acesso",
      "confirm": "Confirmar",
      "cancel": "Cancelar"
    },
    "employment": {
      "title": "Dados laborais, previdenci\u00e1rios e banc\u00e1rios",
      "description": "Indique os dados necess\u00e1rios para processamento salarial, ponto, recibos de vencimento, banco de horas, rescis\u00f5es e relat\u00f3rios contabil\u00edsticos.",
      "admissionDate": "Data de admiss\u00e3o",
      "compensationType": "Modalidade de remunera\u00e7\u00e3o",
      "classHourValue": "Valor da hora-aula",
      "classHourDuration": "Dura\u00e7\u00e3o da hora-aula",
      "workHourValue": "Valor da hora trabalhada",
      "contractType": "Tipo de contrato",
      "workSchedule": "Hor\u00e1rio de trabalho",
      "weeklyHours": "Carga hor\u00e1ria semanal",
      "monthlyHours": "Carga hor\u00e1ria mensal",
      "timeClockCode": "C\u00f3digo do ponto",
      "payrollBank": "Banco da conta salarial",
      "bankHelp": "Pesquise pelo c\u00f3digo ou nome. Exemplos: 001, 260, Nubank, Inter ou Ita\u00fa.",
      "compensationNotes": "Observa\u00e7\u00f5es da remunera\u00e7\u00e3o"
    },
    "compensation": {
      "monthlySalary": "Sal\u00e1rio mensal",
      "classHour": "Hora-aula",
      "workHour": "Hora trabalhada",
      "perClass": "Valor por aula",
      "perClassGroup": "Valor por turma",
      "perSubject": "Valor por disciplina",
      "mixed": "Remunera\u00e7\u00e3o mista",
      "none": "Sem remunera\u00e7\u00e3o"
    },
    "contracts": {
      "internship": "Est\u00e1gio",
      "apprentice": "Aprendiz",
      "temporary": "Tempor\u00e1rio",
      "selfEmployed": "Trabalhador independente"
    },
    "placeholders": {
      "amount": "0,00",
      "workSchedule": "Ex.: 44h semanais / 220h mensais",
      "weeklyHours": "Ex.: 44",
      "monthlyHours": "Ex.: 220",
      "timeClockCode": "Identificador utilizado no rel\u00f3gio/app",
      "bankSearch": "Introduza o c\u00f3digo ou nome do banco",
      "bankAria": "Pesquisar banco da conta salarial do funcion\u00e1rio",
      "compensationNotes": "Acordos, adicionais, regras de pagamento ou outras observa\u00e7\u00f5es."
    },
    "status": {
      "active": "Ativo",
      "dismissed": "Demitido",
      "onLeave": "Afastado",
      "warning": "Advert\u00eancia",
      "vacation": "F\u00e9rias",
      "rehired": "Readmitido"
    },
    "documents": {
      "title": "Documentos e Portef\u00f3lio",
      "description": "Envie documentos pessoais, curr\u00edculo, certificados, portef\u00f3lio e liga\u00e7\u00f5es profissionais.",
      "residenceProof": "Comprovativo de morada",
      "resume": "Curr\u00edculo",
      "portfolio": "Portef\u00f3lio",
      "certificates": "Certificados",
      "portfolioLinks": "Liga\u00e7\u00f5es do portef\u00f3lio",
      "personalWebsite": "Site pessoal"
    },
    "list": {
      "title": "Lista de funcion\u00e1rios",
      "searchPlaceholder": "Pesquisar por nome, e-mail, CPF, telefone, cargo, c\u00f3digo, departamento ou polo",
      "empty": "Nenhum funcion\u00e1rio encontrado para esta pesquisa.",
      "accessEmail": "E-mail de acesso",
      "accessProfile": "Perfil de acesso",
      "access": "Acesso"
    },
    "access": {
      "blocked": "Bloqueado",
      "active": "Ativo",
      "noSystemAccess": "Sem acesso ao sistema"
    },
    "confirm": {
      "blockMessage": "Pretende bloquear o acesso de \"{name}\"?",
      "unblockMessage": "Pretende desbloquear o acesso de \"{name}\"?",
      "blockTitle": "Bloquear acesso",
      "unblockTitle": "Desbloquear acesso"
    },
    "errors": {
      "loadJobs": "N\u00e3o foi poss\u00edvel carregar os cargos.",
      "invalidPhotoFormat": "Formato inv\u00e1lido. Envie uma foto em JPG, JPEG, PNG ou WEBP.",
      "photoTooLarge": "A foto \u00e9 demasiado grande. Envie uma foto com no m\u00e1ximo {max} MB.",
      "photoUpload": "Erro ao enviar a foto.",
      "photoUrlMissing": "O envio foi conclu\u00eddo, mas o URL da foto n\u00e3o foi devolvido.",
      "photoUploadCheck": "N\u00e3o foi poss\u00edvel enviar a foto. Verifique o formato e o tamanho do ficheiro.",
      "selectCompensationType": "Selecione a modalidade de remunera\u00e7\u00e3o do funcion\u00e1rio.",
      "monthlySalaryRequired": "Indique o sal\u00e1rio mensal do funcion\u00e1rio.",
      "classHourValueRequired": "Indique o valor da hora-aula.",
      "workHourValueRequired": "Indique o valor da hora trabalhada.",
      "perClassValueRequired": "Indique o valor por aula.",
      "perClassGroupValueRequired": "Indique o valor por turma.",
      "perSubjectValueRequired": "Indique o valor por disciplina.",
      "mixedCompensationValueRequired": "Na remunera\u00e7\u00e3o mista, indique pelo menos um valor.",
      "employeeNameBeforeContinue": "Indique o nome do funcion\u00e1rio antes de continuar.",
      "employeeEmailBeforeContinue": "Indique o e-mail do funcion\u00e1rio antes de continuar.",
      "accessProfileBeforeContinue": "Selecione o perfil de acesso do funcion\u00e1rio antes de continuar.",
      "createEmployee": "Erro ao criar o funcion\u00e1rio.",
      "changeAccess": "Erro ao alterar o acesso do funcion\u00e1rio.",
      "changeAccessCommunication": "Erro de comunica\u00e7\u00e3o ao alterar o acesso do funcion\u00e1rio.",
      "employeeNameRequired": "Indique o nome do funcion\u00e1rio.",
      "campusRequired": "Selecione o polo de afeta\u00e7\u00e3o do funcion\u00e1rio.",
      "emailForAccessRequired": "Indique o e-mail para criar o acesso do funcion\u00e1rio.",
      "accessProfileRequired": "Selecione o perfil de acesso do funcion\u00e1rio.",
      "updateEmployee": "Erro ao atualizar o funcion\u00e1rio."
    },
    "messages": {
      "photoUploaded": "Foto oficial do funcion\u00e1rio enviada com sucesso.",
      "employeeUpdated": "Funcion\u00e1rio atualizado com sucesso.",
      "accessChanged": "Acesso alterado com sucesso.",
      "employeeCreatedWithAccess": "Funcion\u00e1rio criado com sucesso e e-mail de acesso enviado.",
      "employeeCreatedWithoutAccess": "Funcion\u00e1rio registado nos RH com sucesso, sem acesso ao sistema."
    }
  },
  "en-US": {
    "title": "Employees",
    "toast": {
      "errorTitle": "Could not complete the action",
      "successTitle": "All set"
    },
    "form": {
      "editTitle": "Edit employee",
      "newTitle": "New employee"
    },
    "systemAccess": {
      "createTitle": "Create system access for this employee",
      "createDescription": "When enabled, PHANYX will create a login and temporary password and send the credentials by email. Disable it to register only the employment relationship in HR.",
      "noAccessDescription": "This employee can participate in payroll, time tracking, leave, benefits, payslips, documents, and other HR processes, but will not receive a login or password."
    },
    "fields": {
      "name": "Name",
      "email": "Email",
      "accessProfile": "System access profile",
      "selectProfile": "Select a profile",
      "department": "Department",
      "selectDepartment": "Select a department",
      "job": "Job title",
      "campus": "Assigned campus",
      "selectCampus": "Select the assigned campus",
      "phone": "Phone",
      "employeeCodeOptional": "Employee code (optional)",
      "branch": "Branch",
      "account": "Account",
      "pix": "PIX",
      "pixKey": "PIX key",
      "status": "Status",
      "reasonOptional": "Reason (optional)",
      "reason": "Reason",
      "code": "Code"
    },
    "roles": {
      "admin": "Administrator",
      "employee": "Employee",
      "secretariat": "Secretariat",
      "coordinator": "Coordination",
      "finance": "Finance",
      "support": "Support"
    },
    "job": {
      "loading": "Loading job titles...",
      "selectDepartmentFirst": "Select the department first",
      "noActiveJobs": "No active job titles registered",
      "selectJob": "Select a job title",
      "noJobsHelp": "This department does not have any active job titles yet. Register job titles under Departments."
    },
    "common": {
      "inactive": "Inactive",
      "minutes": "minutes",
      "notDefined": "Not defined",
      "other": "Other",
      "select": "Select"
    },
    "campus": {
      "editHelp": "The assigned campus cannot be changed through this standard edit. To assign or transfer the campus, open the employee record.",
      "createHelp": "Select the unit where the employee will initially be assigned.",
      "openRecord": "Open record and manage assignment",
      "legacyEmployeeHelp": "This older employee record still needs an assigned campus."
    },
    "photo": {
      "alt": "Official employee photo",
      "title": "Official employee photo",
      "description": "This institutional photo is used on ID badges, identification, documents, and internal records.",
      "help": "Accepted formats: JPG, JPEG, PNG, or WEBP. Maximum size: 2 MB. Recommended: square photo with the face centered."
    },
    "buttons": {
      "uploading": "Uploading...",
      "uploadPhoto": "Upload photo",
      "removePhoto": "Remove photo",
      "selectFile": "Select file",
      "remove": "Remove",
      "addLink": "Add link",
      "saving": "Saving...",
      "creating": "Creating...",
      "saveChanges": "Save changes",
      "createEmployee": "Create employee",
      "cancelEditing": "Cancel editing",
      "edit": "Edit",
      "individualPermissions": "Individual permissions",
      "blockAccess": "Block access",
      "unblockAccess": "Unblock access",
      "confirm": "Confirm",
      "cancel": "Cancel"
    },
    "employment": {
      "title": "Employment, social security, and banking details",
      "description": "Enter the information required for payroll, time tracking, payslips, time banks, terminations, and accounting reports.",
      "admissionDate": "Hire date",
      "compensationType": "Compensation type",
      "classHourValue": "Teaching-hour rate",
      "classHourDuration": "Teaching-hour duration",
      "workHourValue": "Worked-hour rate",
      "contractType": "Contract type",
      "workSchedule": "Work schedule",
      "weeklyHours": "Weekly workload",
      "monthlyHours": "Monthly workload",
      "timeClockCode": "Time clock code",
      "payrollBank": "Payroll account bank",
      "bankHelp": "Search by code or name. Examples: 001, 260, Nubank, Inter, or Ita\u00fa.",
      "compensationNotes": "Compensation notes"
    },
    "compensation": {
      "monthlySalary": "Monthly salary",
      "classHour": "Teaching hour",
      "workHour": "Worked hour",
      "perClass": "Amount per class",
      "perClassGroup": "Amount per class group",
      "perSubject": "Amount per subject",
      "mixed": "Mixed compensation",
      "none": "No compensation"
    },
    "contracts": {
      "internship": "Internship",
      "apprentice": "Apprentice",
      "temporary": "Temporary",
      "selfEmployed": "Self-employed"
    },
    "placeholders": {
      "amount": "0.00",
      "workSchedule": "Example: 44h weekly / 220h monthly",
      "weeklyHours": "Example: 44",
      "monthlyHours": "Example: 220",
      "timeClockCode": "Identifier used in the time clock/app",
      "bankSearch": "Enter the bank code or name",
      "bankAria": "Search the bank for the employee payroll account",
      "compensationNotes": "Agreements, additional payments, payment rules, or other notes."
    },
    "status": {
      "active": "Active",
      "dismissed": "Dismissed",
      "onLeave": "On leave",
      "warning": "Warning",
      "vacation": "Vacation",
      "rehired": "Rehired"
    },
    "documents": {
      "title": "Documents and Portfolio",
      "description": "Upload personal documents, r\u00e9sum\u00e9, certificates, portfolio, and professional links.",
      "residenceProof": "Proof of address",
      "resume": "R\u00e9sum\u00e9",
      "portfolio": "Portfolio",
      "certificates": "Certificates",
      "portfolioLinks": "Portfolio links",
      "personalWebsite": "Personal website"
    },
    "list": {
      "title": "Employee list",
      "searchPlaceholder": "Search by name, email, CPF, phone, job title, code, department, or campus",
      "empty": "No employee found for this search.",
      "accessEmail": "Access email",
      "accessProfile": "Access profile",
      "access": "Access"
    },
    "access": {
      "blocked": "Blocked",
      "active": "Active",
      "noSystemAccess": "No system access"
    },
    "confirm": {
      "blockMessage": "Do you want to block access for \"{name}\"?",
      "unblockMessage": "Do you want to unblock access for \"{name}\"?",
      "blockTitle": "Block access",
      "unblockTitle": "Unblock access"
    },
    "errors": {
      "loadJobs": "Could not load job titles.",
      "invalidPhotoFormat": "Invalid format. Upload a JPG, JPEG, PNG, or WEBP photo.",
      "photoTooLarge": "The photo is too large. Upload a photo no larger than {max} MB.",
      "photoUpload": "Error uploading photo.",
      "photoUrlMissing": "The upload completed, but the photo URL was not returned.",
      "photoUploadCheck": "Could not upload the photo. Check the file format and size.",
      "selectCompensationType": "Select the employee compensation type.",
      "monthlySalaryRequired": "Enter the employee monthly salary.",
      "classHourValueRequired": "Enter the teaching-hour rate.",
      "workHourValueRequired": "Enter the worked-hour rate.",
      "perClassValueRequired": "Enter the amount per class.",
      "perClassGroupValueRequired": "Enter the amount per class group.",
      "perSubjectValueRequired": "Enter the amount per subject.",
      "mixedCompensationValueRequired": "For mixed compensation, enter at least one amount.",
      "employeeNameBeforeContinue": "Enter the employee name before continuing.",
      "employeeEmailBeforeContinue": "Enter the employee email before continuing.",
      "accessProfileBeforeContinue": "Select the employee access profile before continuing.",
      "createEmployee": "Error creating employee.",
      "changeAccess": "Error changing employee access.",
      "changeAccessCommunication": "Communication error while changing employee access.",
      "employeeNameRequired": "Enter the employee name.",
      "campusRequired": "Select the employee assigned campus.",
      "emailForAccessRequired": "Enter an email to create employee access.",
      "accessProfileRequired": "Select the employee access profile.",
      "updateEmployee": "Error updating employee."
    },
    "messages": {
      "photoUploaded": "Official employee photo uploaded successfully.",
      "employeeUpdated": "Employee updated successfully.",
      "accessChanged": "Access changed successfully.",
      "employeeCreatedWithAccess": "Employee created successfully and access email sent.",
      "employeeCreatedWithoutAccess": "Employee registered in HR successfully without system access."
    }
  },
  "es-ES": {
    "title": "Empleados",
    "toast": {
      "errorTitle": "No se pudo completar la acci\u00f3n",
      "successTitle": "Todo listo"
    },
    "form": {
      "editTitle": "Editar empleado",
      "newTitle": "Nuevo empleado"
    },
    "systemAccess": {
      "createTitle": "Crear acceso al sistema para este empleado",
      "createDescription": "Cuando est\u00e9 activado, PHANYX crear\u00e1 un usuario y una contrase\u00f1a temporal y enviar\u00e1 las credenciales por correo electr\u00f3nico. Desact\u00edvelo para registrar \u00fanicamente la relaci\u00f3n laboral en RR. HH.",
      "noAccessDescription": "Este empleado podr\u00e1 participar en n\u00f3mina, control horario, vacaciones, beneficios, recibos de n\u00f3mina, documentos y dem\u00e1s procesos de RR. HH., pero no recibir\u00e1 usuario ni contrase\u00f1a."
    },
    "fields": {
      "name": "Nombre",
      "email": "Correo electr\u00f3nico",
      "accessProfile": "Perfil de acceso al sistema",
      "selectProfile": "Selecciona el perfil",
      "department": "Departamento",
      "selectDepartment": "Selecciona un departamento",
      "job": "Cargo",
      "campus": "Campus de asignaci\u00f3n",
      "selectCampus": "Selecciona el campus de asignaci\u00f3n",
      "phone": "Tel\u00e9fono",
      "employeeCodeOptional": "C\u00f3digo del empleado (opcional)",
      "branch": "Sucursal",
      "account": "Cuenta",
      "pix": "Pix",
      "pixKey": "Clave Pix",
      "status": "Estado",
      "reasonOptional": "Motivo (opcional)",
      "reason": "Motivo",
      "code": "C\u00f3digo"
    },
    "roles": {
      "admin": "Administrador",
      "employee": "Empleado",
      "secretariat": "Secretar\u00eda",
      "coordinator": "Coordinaci\u00f3n",
      "finance": "Finanzas",
      "support": "Soporte"
    },
    "job": {
      "loading": "Cargando cargos...",
      "selectDepartmentFirst": "Selecciona primero el departamento",
      "noActiveJobs": "No hay cargos activos registrados",
      "selectJob": "Selecciona el cargo",
      "noJobsHelp": "Este departamento a\u00fan no tiene cargos activos registrados. Registra los cargos en Departamentos."
    },
    "common": {
      "inactive": "Inactivo",
      "minutes": "minutos",
      "notDefined": "No definido",
      "other": "Otro",
      "select": "Selecciona"
    },
    "campus": {
      "editHelp": "La asignaci\u00f3n no puede modificarse mediante esta edici\u00f3n habitual. Para definir o transferir el campus, abre la ficha del empleado.",
      "createHelp": "Selecciona la unidad en la que el empleado quedar\u00e1 asignado inicialmente.",
      "openRecord": "Abrir ficha y gestionar asignaci\u00f3n",
      "legacyEmployeeHelp": "Este registro antiguo de empleado todav\u00eda necesita tener definida su asignaci\u00f3n."
    },
    "photo": {
      "alt": "Foto oficial del empleado",
      "title": "Foto oficial del empleado",
      "description": "Esta foto institucional se utiliza en credenciales, identificaci\u00f3n, documentos y registros internos.",
      "help": "Formatos aceptados: JPG, JPEG, PNG o WEBP. Tama\u00f1o m\u00e1ximo: 2 MB. Recomendado: foto cuadrada, con el rostro centrado."
    },
    "buttons": {
      "uploading": "Subiendo...",
      "uploadPhoto": "Subir foto",
      "removePhoto": "Eliminar foto",
      "selectFile": "Seleccionar archivo",
      "remove": "Eliminar",
      "addLink": "A\u00f1adir enlace",
      "saving": "Guardando...",
      "creating": "Creando...",
      "saveChanges": "Guardar cambios",
      "createEmployee": "Crear empleado",
      "cancelEditing": "Cancelar edici\u00f3n",
      "edit": "Editar",
      "individualPermissions": "Permisos individuales",
      "blockAccess": "Bloquear acceso",
      "unblockAccess": "Desbloquear acceso",
      "confirm": "Confirmar",
      "cancel": "Cancelar"
    },
    "employment": {
      "title": "Datos laborales, de seguridad social y bancarios",
      "description": "Introduce los datos necesarios para n\u00f3mina, control horario, recibos de n\u00f3mina, banco de horas, bajas y reportes contables.",
      "admissionDate": "Fecha de contrataci\u00f3n",
      "compensationType": "Modalidad de remuneraci\u00f3n",
      "classHourValue": "Valor de la hora de clase",
      "classHourDuration": "Duraci\u00f3n de la hora de clase",
      "workHourValue": "Valor de la hora trabajada",
      "contractType": "Tipo de contrato",
      "workSchedule": "Jornada laboral",
      "weeklyHours": "Carga horaria semanal",
      "monthlyHours": "Carga horaria mensual",
      "timeClockCode": "C\u00f3digo de control horario",
      "payrollBank": "Banco de la cuenta de n\u00f3mina",
      "bankHelp": "Busca por c\u00f3digo o nombre. Ejemplos: 001, 260, Nubank, Inter o Ita\u00fa.",
      "compensationNotes": "Observaciones de remuneraci\u00f3n"
    },
    "compensation": {
      "monthlySalary": "Salario mensual",
      "classHour": "Hora de clase",
      "workHour": "Hora trabajada",
      "perClass": "Importe por clase",
      "perClassGroup": "Importe por grupo",
      "perSubject": "Importe por asignatura",
      "mixed": "Remuneraci\u00f3n mixta",
      "none": "Sin remuneraci\u00f3n"
    },
    "contracts": {
      "internship": "Pr\u00e1cticas",
      "apprentice": "Aprendiz",
      "temporary": "Temporal",
      "selfEmployed": "Aut\u00f3nomo"
    },
    "placeholders": {
      "amount": "0,00",
      "workSchedule": "Ej.: 44h semanales / 220h mensuales",
      "weeklyHours": "Ej.: 44",
      "monthlyHours": "Ej.: 220",
      "timeClockCode": "Identificador usado en el reloj/app",
      "bankSearch": "Escribe el c\u00f3digo o nombre del banco",
      "bankAria": "Buscar banco de la cuenta de n\u00f3mina del empleado",
      "compensationNotes": "Acuerdos, complementos, reglas de pago u otras observaciones."
    },
    "status": {
      "active": "Activo",
      "dismissed": "Despedido",
      "onLeave": "De baja",
      "warning": "Advertencia",
      "vacation": "Vacaciones",
      "rehired": "Recontratado"
    },
    "documents": {
      "title": "Documentos y Portafolio",
      "description": "Sube documentos personales, curr\u00edculum, certificados, portafolio y enlaces profesionales.",
      "residenceProof": "Comprobante de domicilio",
      "resume": "Curr\u00edculum",
      "portfolio": "Portafolio",
      "certificates": "Certificados",
      "portfolioLinks": "Enlaces del portafolio",
      "personalWebsite": "Sitio personal"
    },
    "list": {
      "title": "Lista de empleados",
      "searchPlaceholder": "Buscar por nombre, correo, CPF, tel\u00e9fono, cargo, c\u00f3digo, departamento o campus",
      "empty": "No se encontraron empleados para esta b\u00fasqueda.",
      "accessEmail": "Correo de acceso",
      "accessProfile": "Perfil de acceso",
      "access": "Acceso"
    },
    "access": {
      "blocked": "Bloqueado",
      "active": "Activo",
      "noSystemAccess": "Sin acceso al sistema"
    },
    "confirm": {
      "blockMessage": "\u00bfDeseas bloquear el acceso de \"{name}\"?",
      "unblockMessage": "\u00bfDeseas desbloquear el acceso de \"{name}\"?",
      "blockTitle": "Bloquear acceso",
      "unblockTitle": "Desbloquear acceso"
    },
    "errors": {
      "loadJobs": "No se pudieron cargar los cargos.",
      "invalidPhotoFormat": "Formato no v\u00e1lido. Sube una foto en JPG, JPEG, PNG o WEBP.",
      "photoTooLarge": "La foto es demasiado grande. Sube una foto de hasta {max} MB.",
      "photoUpload": "Error al subir la foto.",
      "photoUrlMissing": "La carga termin\u00f3, pero no se recibi\u00f3 la URL de la foto.",
      "photoUploadCheck": "No se pudo subir la foto. Comprueba el formato y el tama\u00f1o del archivo.",
      "selectCompensationType": "Selecciona la modalidad de remuneraci\u00f3n del empleado.",
      "monthlySalaryRequired": "Indica el salario mensual del empleado.",
      "classHourValueRequired": "Indica el valor de la hora de clase.",
      "workHourValueRequired": "Indica el valor de la hora trabajada.",
      "perClassValueRequired": "Indica el importe por clase.",
      "perClassGroupValueRequired": "Indica el importe por grupo.",
      "perSubjectValueRequired": "Indica el importe por asignatura.",
      "mixedCompensationValueRequired": "En la remuneraci\u00f3n mixta, indica al menos un importe.",
      "employeeNameBeforeContinue": "Indica el nombre del empleado antes de continuar.",
      "employeeEmailBeforeContinue": "Indica el correo del empleado antes de continuar.",
      "accessProfileBeforeContinue": "Selecciona el perfil de acceso del empleado antes de continuar.",
      "createEmployee": "Error al crear el empleado.",
      "changeAccess": "Error al cambiar el acceso del empleado.",
      "changeAccessCommunication": "Error de comunicaci\u00f3n al cambiar el acceso del empleado.",
      "employeeNameRequired": "Indica el nombre del empleado.",
      "campusRequired": "Selecciona el campus de asignaci\u00f3n del empleado.",
      "emailForAccessRequired": "Indica el correo para crear el acceso del empleado.",
      "accessProfileRequired": "Selecciona el perfil de acceso del empleado.",
      "updateEmployee": "Error al actualizar el empleado."
    },
    "messages": {
      "photoUploaded": "Foto oficial del empleado subida correctamente.",
      "employeeUpdated": "Empleado actualizado correctamente.",
      "accessChanged": "Acceso modificado correctamente.",
      "employeeCreatedWithAccess": "Empleado creado correctamente y correo de acceso enviado.",
      "employeeCreatedWithoutAccess": "Empleado registrado correctamente en RR. HH. sin acceso al sistema."
    }
  },
  "fr-FR": {
    "title": "Employ\u00e9s",
    "toast": {
      "errorTitle": "Impossible de terminer l\u2019action",
      "successTitle": "Termin\u00e9"
    },
    "form": {
      "editTitle": "Modifier l\u2019employ\u00e9",
      "newTitle": "Nouvel employ\u00e9"
    },
    "systemAccess": {
      "createTitle": "Cr\u00e9er un acc\u00e8s au syst\u00e8me pour cet employ\u00e9",
      "createDescription": "Lorsque cette option est activ\u00e9e, PHANYX cr\u00e9e un identifiant et un mot de passe temporaire puis envoie les identifiants par e-mail. D\u00e9sactivez-la pour enregistrer uniquement la relation de travail dans les RH.",
      "noAccessDescription": "Cet employ\u00e9 pourra participer \u00e0 la paie, au pointage, aux cong\u00e9s, aux avantages, aux bulletins de paie, aux documents et aux autres processus RH, mais ne recevra ni identifiant ni mot de passe."
    },
    "fields": {
      "name": "Nom",
      "email": "E-mail",
      "accessProfile": "Profil d\u2019acc\u00e8s au syst\u00e8me",
      "selectProfile": "S\u00e9lectionnez le profil",
      "department": "D\u00e9partement",
      "selectDepartment": "S\u00e9lectionnez un d\u00e9partement",
      "job": "Poste",
      "campus": "Campus d\u2019affectation",
      "selectCampus": "S\u00e9lectionnez le campus d\u2019affectation",
      "phone": "T\u00e9l\u00e9phone",
      "employeeCodeOptional": "Code employ\u00e9 (facultatif)",
      "branch": "Agence",
      "account": "Compte",
      "pix": "Pix",
      "pixKey": "Cl\u00e9 Pix",
      "status": "Statut",
      "reasonOptional": "Motif (facultatif)",
      "reason": "Motif",
      "code": "Code"
    },
    "roles": {
      "admin": "Administrateur",
      "employee": "Employ\u00e9",
      "secretariat": "Secr\u00e9tariat",
      "coordinator": "Coordination",
      "finance": "Finances",
      "support": "Support"
    },
    "job": {
      "loading": "Chargement des postes...",
      "selectDepartmentFirst": "S\u00e9lectionnez d\u2019abord le d\u00e9partement",
      "noActiveJobs": "Aucun poste actif enregistr\u00e9",
      "selectJob": "S\u00e9lectionnez le poste",
      "noJobsHelp": "Ce d\u00e9partement ne poss\u00e8de encore aucun poste actif. Enregistrez les postes dans D\u00e9partements."
    },
    "common": {
      "inactive": "Inactif",
      "minutes": "minutes",
      "notDefined": "Non d\u00e9fini",
      "other": "Autre",
      "select": "S\u00e9lectionnez"
    },
    "campus": {
      "editHelp": "L\u2019affectation ne peut pas \u00eatre modifi\u00e9e depuis cette \u00e9dition standard. Pour d\u00e9finir ou transf\u00e9rer le campus, ouvrez la fiche de l\u2019employ\u00e9.",
      "createHelp": "S\u00e9lectionnez l\u2019unit\u00e9 dans laquelle l\u2019employ\u00e9 sera initialement affect\u00e9.",
      "openRecord": "Ouvrir la fiche et g\u00e9rer l\u2019affectation",
      "legacyEmployeeHelp": "Cet ancien dossier d\u2019employ\u00e9 doit encore recevoir une affectation."
    },
    "photo": {
      "alt": "Photo officielle de l\u2019employ\u00e9",
      "title": "Photo officielle de l\u2019employ\u00e9",
      "description": "Cette photo institutionnelle est utilis\u00e9e sur les badges, pour l\u2019identification, les documents et les dossiers internes.",
      "help": "Formats accept\u00e9s : JPG, JPEG, PNG ou WEBP. Taille maximale : 2 Mo. Recommandation : photo carr\u00e9e, visage centr\u00e9."
    },
    "buttons": {
      "uploading": "Envoi...",
      "uploadPhoto": "Envoyer la photo",
      "removePhoto": "Supprimer la photo",
      "selectFile": "S\u00e9lectionner un fichier",
      "remove": "Supprimer",
      "addLink": "Ajouter un lien",
      "saving": "Enregistrement...",
      "creating": "Cr\u00e9ation...",
      "saveChanges": "Enregistrer les modifications",
      "createEmployee": "Cr\u00e9er l\u2019employ\u00e9",
      "cancelEditing": "Annuler la modification",
      "edit": "Modifier",
      "individualPermissions": "Autorisations individuelles",
      "blockAccess": "Bloquer l\u2019acc\u00e8s",
      "unblockAccess": "D\u00e9bloquer l\u2019acc\u00e8s",
      "confirm": "Confirmer",
      "cancel": "Annuler"
    },
    "employment": {
      "title": "Donn\u00e9es professionnelles, sociales et bancaires",
      "description": "Renseignez les donn\u00e9es n\u00e9cessaires \u00e0 la paie, au pointage, aux bulletins de paie, au compteur d\u2019heures, aux ruptures de contrat et aux rapports comptables.",
      "admissionDate": "Date d\u2019embauche",
      "compensationType": "Mode de r\u00e9mun\u00e9ration",
      "classHourValue": "Tarif de l\u2019heure de cours",
      "classHourDuration": "Dur\u00e9e de l\u2019heure de cours",
      "workHourValue": "Tarif de l\u2019heure travaill\u00e9e",
      "contractType": "Type de contrat",
      "workSchedule": "Temps de travail",
      "weeklyHours": "Volume horaire hebdomadaire",
      "monthlyHours": "Volume horaire mensuel",
      "timeClockCode": "Code de pointage",
      "payrollBank": "Banque du compte de paie",
      "bankHelp": "Recherchez par code ou par nom. Exemples : 001, 260, Nubank, Inter ou Ita\u00fa.",
      "compensationNotes": "Observations sur la r\u00e9mun\u00e9ration"
    },
    "compensation": {
      "monthlySalary": "Salaire mensuel",
      "classHour": "Heure de cours",
      "workHour": "Heure travaill\u00e9e",
      "perClass": "Montant par cours",
      "perClassGroup": "Montant par classe",
      "perSubject": "Montant par mati\u00e8re",
      "mixed": "R\u00e9mun\u00e9ration mixte",
      "none": "Sans r\u00e9mun\u00e9ration"
    },
    "contracts": {
      "internship": "Stage",
      "apprentice": "Apprenti",
      "temporary": "Temporaire",
      "selfEmployed": "Ind\u00e9pendant"
    },
    "placeholders": {
      "amount": "0,00",
      "workSchedule": "Ex. : 44 h/semaine / 220 h/mois",
      "weeklyHours": "Ex. : 44",
      "monthlyHours": "Ex. : 220",
      "timeClockCode": "Identifiant utilis\u00e9 dans la pointeuse/l\u2019application",
      "bankSearch": "Saisissez le code ou le nom de la banque",
      "bankAria": "Rechercher la banque du compte de paie de l\u2019employ\u00e9",
      "compensationNotes": "Accords, compl\u00e9ments, r\u00e8gles de paiement ou autres observations."
    },
    "status": {
      "active": "Actif",
      "dismissed": "Licenci\u00e9",
      "onLeave": "En cong\u00e9",
      "warning": "Avertissement",
      "vacation": "Vacances",
      "rehired": "R\u00e9embauch\u00e9"
    },
    "documents": {
      "title": "Documents et Portfolio",
      "description": "Envoyez les documents personnels, le CV, les certificats, le portfolio et les liens professionnels.",
      "residenceProof": "Justificatif de domicile",
      "resume": "CV",
      "portfolio": "Portfolio",
      "certificates": "Certificats",
      "portfolioLinks": "Liens du portfolio",
      "personalWebsite": "Site personnel"
    },
    "list": {
      "title": "Liste des employ\u00e9s",
      "searchPlaceholder": "Rechercher par nom, e-mail, CPF, t\u00e9l\u00e9phone, poste, code, d\u00e9partement ou campus",
      "empty": "Aucun employ\u00e9 trouv\u00e9 pour cette recherche.",
      "accessEmail": "E-mail d\u2019acc\u00e8s",
      "accessProfile": "Profil d\u2019acc\u00e8s",
      "access": "Acc\u00e8s"
    },
    "access": {
      "blocked": "Bloqu\u00e9",
      "active": "Actif",
      "noSystemAccess": "Sans acc\u00e8s au syst\u00e8me"
    },
    "confirm": {
      "blockMessage": "Voulez-vous bloquer l\u2019acc\u00e8s de \u00ab {name} \u00bb ?",
      "unblockMessage": "Voulez-vous d\u00e9bloquer l\u2019acc\u00e8s de \u00ab {name} \u00bb ?",
      "blockTitle": "Bloquer l\u2019acc\u00e8s",
      "unblockTitle": "D\u00e9bloquer l\u2019acc\u00e8s"
    },
    "errors": {
      "loadJobs": "Impossible de charger les postes.",
      "invalidPhotoFormat": "Format invalide. Envoyez une photo JPG, JPEG, PNG ou WEBP.",
      "photoTooLarge": "La photo est trop volumineuse. Envoyez une photo de {max} Mo maximum.",
      "photoUpload": "Erreur lors de l\u2019envoi de la photo.",
      "photoUrlMissing": "L\u2019envoi est termin\u00e9, mais l\u2019URL de la photo n\u2019a pas \u00e9t\u00e9 renvoy\u00e9e.",
      "photoUploadCheck": "Impossible d\u2019envoyer la photo. V\u00e9rifiez le format et la taille du fichier.",
      "selectCompensationType": "S\u00e9lectionnez le mode de r\u00e9mun\u00e9ration de l\u2019employ\u00e9.",
      "monthlySalaryRequired": "Renseignez le salaire mensuel de l\u2019employ\u00e9.",
      "classHourValueRequired": "Renseignez le tarif de l\u2019heure de cours.",
      "workHourValueRequired": "Renseignez le tarif de l\u2019heure travaill\u00e9e.",
      "perClassValueRequired": "Renseignez le montant par cours.",
      "perClassGroupValueRequired": "Renseignez le montant par classe.",
      "perSubjectValueRequired": "Renseignez le montant par mati\u00e8re.",
      "mixedCompensationValueRequired": "Pour une r\u00e9mun\u00e9ration mixte, renseignez au moins un montant.",
      "employeeNameBeforeContinue": "Renseignez le nom de l\u2019employ\u00e9 avant de continuer.",
      "employeeEmailBeforeContinue": "Renseignez l\u2019e-mail de l\u2019employ\u00e9 avant de continuer.",
      "accessProfileBeforeContinue": "S\u00e9lectionnez le profil d\u2019acc\u00e8s de l\u2019employ\u00e9 avant de continuer.",
      "createEmployee": "Erreur lors de la cr\u00e9ation de l\u2019employ\u00e9.",
      "changeAccess": "Erreur lors de la modification de l\u2019acc\u00e8s de l\u2019employ\u00e9.",
      "changeAccessCommunication": "Erreur de communication lors de la modification de l\u2019acc\u00e8s de l\u2019employ\u00e9.",
      "employeeNameRequired": "Renseignez le nom de l\u2019employ\u00e9.",
      "campusRequired": "S\u00e9lectionnez le campus d\u2019affectation de l\u2019employ\u00e9.",
      "emailForAccessRequired": "Renseignez l\u2019e-mail pour cr\u00e9er l\u2019acc\u00e8s de l\u2019employ\u00e9.",
      "accessProfileRequired": "S\u00e9lectionnez le profil d\u2019acc\u00e8s de l\u2019employ\u00e9.",
      "updateEmployee": "Erreur lors de la mise \u00e0 jour de l\u2019employ\u00e9."
    },
    "messages": {
      "photoUploaded": "Photo officielle de l\u2019employ\u00e9 envoy\u00e9e avec succ\u00e8s.",
      "employeeUpdated": "Employ\u00e9 mis \u00e0 jour avec succ\u00e8s.",
      "accessChanged": "Acc\u00e8s modifi\u00e9 avec succ\u00e8s.",
      "employeeCreatedWithAccess": "Employ\u00e9 cr\u00e9\u00e9 avec succ\u00e8s et e-mail d\u2019acc\u00e8s envoy\u00e9.",
      "employeeCreatedWithoutAccess": "Employ\u00e9 enregistr\u00e9 avec succ\u00e8s dans les RH, sans acc\u00e8s au syst\u00e8me."
    }
  }
};

for (const locale of locales) {
  const arquivo = path.join(process.cwd(), "messages", `${locale}.json`);

  if (!fs.existsSync(arquivo)) {
    throw new Error(`Arquivo nao encontrado: ${arquivo}`);
  }

  const backup = `${arquivo}.antes-${namespace}.bak`;

  if (!fs.existsSync(backup)) {
    fs.copyFileSync(arquivo, backup);
    console.log(`Backup criado: ${backup}`);
  } else {
    console.log(`Backup ja existe: ${backup}`);
  }

  const conteudo = fs.readFileSync(arquivo, "utf8");
  const dados = JSON.parse(conteudo.replace(/^\uFEFF/, ""));

  dados[namespace] = traducoes[locale];

  fs.writeFileSync(
    arquivo,
    JSON.stringify(dados, null, 2) + "\n",
    "utf8"
  );

  console.log(`OK traducoes: ${locale}`);
}

console.log(`Namespace ${namespace} instalado nos 5 idiomas.`);
