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
    "generate": {
      "title": "📄 Emitir Documento",
      "description": "Selecione o modelo oficial e preencha os dados específicos desta emissão.",
      "toastErrorTitle": "Não foi possível gerar",
      "select": "Selecione",
      "defaultContractTitle": "Contrato educacional",
      "contractOpenedMessage": "O contrato oficial foi aberto pelo módulo de Contratos do PHANYX.",
      "template": {
        "label": "Modelo do documento",
        "type": "Tipo",
        "context": "Contexto"
      },
      "person": {
        "label": "Funcionário ou professor",
        "select": "Selecione o funcionário ou professor",
        "employeesGroup": "Funcionários",
        "professorsWithoutHrGroup": "Professores sem vínculo RH",
        "withoutHrSuffix": "sem vínculo RH",
        "help": "Professores com vínculo RH aparecem na lista de funcionários. Professores sem vínculo RH precisam ser vinculados ao RH antes da emissão de documentos trabalhistas."
      },
      "payslip": {
        "label": "Holerite / competência",
        "loading": "Carregando holerites...",
        "selectEmployeeFirst": "Selecione primeiro o funcionário",
        "noneAvailable": "Nenhum holerite disponível",
        "selectCompetence": "Selecione a competência",
        "help": "A competência é escolhida explicitamente para que os valores sejam retirados do holerite correto."
      },
      "student": {
        "label": "Aluno ou pessoa vinculada",
        "noneSelected": "Nenhum aluno selecionado"
      },
      "enrollment": {
        "label": "Matrícula",
        "requiredSuffix": " (obrigatória para contrato acadêmico)",
        "optionalSuffix": " (opcional)",
        "select": "Selecione a matrícula",
        "none": "Nenhuma",
        "unnamedStudent": "Aluno sem nome"
      },
      "manual": {
        "title": "Informações desta emissão",
        "description": "Estes campos serão inseridos nas tags correspondentes do modelo.",
        "noFields": "Este modelo não possui campos de preenchimento manual. Os dados serão preenchidos automaticamente pelo PHANYX."
      },
      "titleComplement": {
        "label": "Complemento do título (opcional)",
        "placeholder": "Ex.: Serviço realizado em agosto de 2026"
      },
      "print": {
        "title": "Formato de impressão",
        "description": "Escolha como o documento será organizado na folha A4.",
        "oneCopy": {
          "title": "Uma via",
          "description": "Um documento ocupando uma folha A4 inteira."
        },
        "twoCopies": {
          "title": "Duas vias",
          "description": "Via do interessado e via da instituição na mesma folha A4."
        }
      },
      "actions": {
        "generating": "Gerando...",
        "openOfficialContract": "Abrir contrato oficial",
        "generate": "Gerar Documento"
      },
      "result": {
        "title": "Documento Gerado",
        "id": "ID",
        "documentTitle": "Título",
        "status": "Status",
        "noPreview": "Documento gerado, mas nenhum conteúdo foi retornado para pré-visualização.",
        "openPdf": "Abrir PDF"
      },
      "manualFields": {
        "genericPlaceholder": "Informe {tag}",
        "documentDescription": {
          "label": "Descrição ou corpo do documento",
          "placeholder": "Descreva o serviço, pagamento, finalidade ou conteúdo específico desta emissão."
        },
        "documentPurpose": {
          "label": "Finalidade do documento",
          "placeholder": "Informe para qual finalidade este documento está sendo emitido."
        },
        "documentRecipient": {
          "label": "Destinatário",
          "placeholder": "Ex.: À empresa, órgão, pessoa ou setor responsável"
        },
        "documentSubject": {
          "label": "Assunto",
          "placeholder": "Ex.: Prestação de serviços audiovisuais"
        },
        "documentNotes": {
          "label": "Observações",
          "placeholder": "Informações complementares desta emissão."
        },
        "referencePeriod": {
          "label": "Período de referência",
          "placeholder": "Ex.: Agosto de 2026"
        },
        "competence": {
          "label": "Competência",
          "placeholder": "Ex.: Agosto de 2026"
        },
        "documentValue": {
          "label": "Valor",
          "placeholder": "Ex.: 150,00"
        },
        "receivedValue": {
          "label": "Valor recebido",
          "placeholder": "Ex.: 150,00"
        },
        "value": {
          "label": "Valor",
          "placeholder": "Ex.: 150,00"
        },
        "payerName": {
          "label": "Nome do pagador",
          "placeholder": "Nome completo ou razão social"
        },
        "payerDocument": {
          "label": "CPF ou CNPJ do pagador",
          "placeholder": "Informe o CPF ou CNPJ"
        },
        "paymentMethod": {
          "label": "Forma de pagamento"
        },
        "paymentDate": {
          "label": "Data do pagamento"
        },
        "paymentReference": {
          "label": "Referência do pagamento",
          "placeholder": "Ex.: código PIX, E2E, número do recibo ou identificação interna"
        },
        "providerName": {
          "label": "Nome do prestador",
          "placeholder": "Nome da pessoa ou empresa que realizou o serviço"
        },
        "providerDocument": {
          "label": "CPF ou CNPJ do prestador",
          "placeholder": "Informe o CPF ou CNPJ"
        },
        "serviceDescription": {
          "label": "Descrição do serviço",
          "placeholder": "Descreva o serviço realizado."
        }
      },
      "manualOptions": {
        "pix": "PIX",
        "cash": "Dinheiro",
        "creditCard": "Cartão de crédito",
        "debitCard": "Cartão de débito",
        "bankTransfer": "Transferência bancária",
        "bankSlip": "Boleto",
        "check": "Cheque",
        "other": "Outro"
      },
      "errors": {
        "loadPayslips": "Erro ao carregar holerites.",
        "loadData": "Erro ao carregar dados para gerar documento.",
        "selectTemplate": "Selecione um template antes de gerar o documento.",
        "selectEnrollmentForContract": "Selecione a matrícula do aluno para gerar o contrato.",
        "invalidEnrollment": "A matrícula selecionada é inválida.",
        "selectPerson": "Selecione o funcionário ou professor para emitir este documento.",
        "invalidPerson": "Funcionário ou professor inválido.",
        "invalidPersonType": "Tipo de pessoa inválido.",
        "selectPayslip": "Selecione a competência do holerite para emitir este documento.",
        "generate": "Erro ao gerar documento.",
        "payslipTemplateRequiresHrContext": "Templates com tags de holerite precisam usar contexto de funcionário, professor ou RH.",
        "payslipUnavailable": "O holerite selecionado não existe, está cancelado/arquivado ou não pertence ao funcionário escolhido."
      }
    }
  },
  "pt-PT": {
    "generate": {
      "title": "📄 Emitir documento",
      "description": "Selecione o modelo oficial e preencha os dados específicos desta emissão.",
      "toastErrorTitle": "Não foi possível gerar",
      "select": "Selecione",
      "defaultContractTitle": "Contrato educacional",
      "contractOpenedMessage": "O contrato oficial foi aberto pelo módulo de Contratos do PHANYX.",
      "template": {
        "label": "Modelo do documento",
        "type": "Tipo",
        "context": "Contexto"
      },
      "person": {
        "label": "Funcionário ou professor",
        "select": "Selecione o funcionário ou professor",
        "employeesGroup": "Funcionários",
        "professorsWithoutHrGroup": "Professores sem vínculo aos RH",
        "withoutHrSuffix": "sem vínculo aos RH",
        "help": "Os professores com vínculo aos RH aparecem na lista de funcionários. Os professores sem vínculo aos RH têm de ser associados aos RH antes da emissão de documentos laborais."
      },
      "payslip": {
        "label": "Recibo de vencimento / competência",
        "loading": "A carregar recibos de vencimento...",
        "selectEmployeeFirst": "Selecione primeiro o funcionário",
        "noneAvailable": "Nenhum recibo de vencimento disponível",
        "selectCompetence": "Selecione a competência",
        "help": "A competência é escolhida explicitamente para que os valores sejam obtidos do recibo de vencimento correto."
      },
      "student": {
        "label": "Aluno ou pessoa associada",
        "noneSelected": "Nenhum aluno selecionado"
      },
      "enrollment": {
        "label": "Matrícula",
        "requiredSuffix": " (obrigatória para contrato académico)",
        "optionalSuffix": " (opcional)",
        "select": "Selecione a matrícula",
        "none": "Nenhuma",
        "unnamedStudent": "Aluno sem nome"
      },
      "manual": {
        "title": "Informações desta emissão",
        "description": "Estes campos serão inseridos nas tags correspondentes do modelo.",
        "noFields": "Este modelo não possui campos de preenchimento manual. Os dados serão preenchidos automaticamente pelo PHANYX."
      },
      "titleComplement": {
        "label": "Complemento do título (opcional)",
        "placeholder": "Ex.: Serviço realizado em agosto de 2026"
      },
      "print": {
        "title": "Formato de impressão",
        "description": "Escolha como o documento será organizado na folha A4.",
        "oneCopy": {
          "title": "Uma via",
          "description": "Um documento a ocupar uma folha A4 inteira."
        },
        "twoCopies": {
          "title": "Duas vias",
          "description": "Via do interessado e via da instituição na mesma folha A4."
        }
      },
      "actions": {
        "generating": "A gerar...",
        "openOfficialContract": "Abrir contrato oficial",
        "generate": "Gerar documento"
      },
      "result": {
        "title": "Documento gerado",
        "id": "ID",
        "documentTitle": "Título",
        "status": "Estado",
        "noPreview": "O documento foi gerado, mas não foi devolvido conteúdo para pré-visualização.",
        "openPdf": "Abrir PDF"
      },
      "manualFields": {
        "genericPlaceholder": "Indique {tag}",
        "documentDescription": {
          "label": "Descrição ou corpo do documento",
          "placeholder": "Descreva o serviço, pagamento, finalidade ou conteúdo específico desta emissão."
        },
        "documentPurpose": {
          "label": "Finalidade do documento",
          "placeholder": "Indique a finalidade para a qual este documento está a ser emitido."
        },
        "documentRecipient": {
          "label": "Destinatário",
          "placeholder": "Ex.: À empresa, organismo, pessoa ou setor responsável"
        },
        "documentSubject": {
          "label": "Assunto",
          "placeholder": "Ex.: Prestação de serviços audiovisuais"
        },
        "documentNotes": {
          "label": "Observações",
          "placeholder": "Informações complementares desta emissão."
        },
        "referencePeriod": {
          "label": "Período de referência",
          "placeholder": "Ex.: Agosto de 2026"
        },
        "competence": {
          "label": "Competência",
          "placeholder": "Ex.: Agosto de 2026"
        },
        "documentValue": {
          "label": "Valor",
          "placeholder": "Ex.: 150,00"
        },
        "receivedValue": {
          "label": "Valor recebido",
          "placeholder": "Ex.: 150,00"
        },
        "value": {
          "label": "Valor",
          "placeholder": "Ex.: 150,00"
        },
        "payerName": {
          "label": "Nome do pagador",
          "placeholder": "Nome completo ou denominação social"
        },
        "payerDocument": {
          "label": "CPF ou CNPJ do pagador",
          "placeholder": "Indique o CPF ou CNPJ"
        },
        "paymentMethod": {
          "label": "Forma de pagamento"
        },
        "paymentDate": {
          "label": "Data do pagamento"
        },
        "paymentReference": {
          "label": "Referência do pagamento",
          "placeholder": "Ex.: código PIX, E2E, número do recibo ou identificação interna"
        },
        "providerName": {
          "label": "Nome do prestador",
          "placeholder": "Nome da pessoa ou empresa que prestou o serviço"
        },
        "providerDocument": {
          "label": "CPF ou CNPJ do prestador",
          "placeholder": "Indique o CPF ou CNPJ"
        },
        "serviceDescription": {
          "label": "Descrição do serviço",
          "placeholder": "Descreva o serviço realizado."
        }
      },
      "manualOptions": {
        "pix": "PIX",
        "cash": "Numerário",
        "creditCard": "Cartão de crédito",
        "debitCard": "Cartão de débito",
        "bankTransfer": "Transferência bancária",
        "bankSlip": "Boleto",
        "check": "Cheque",
        "other": "Outro"
      },
      "errors": {
        "loadPayslips": "Não foi possível carregar os recibos de vencimento.",
        "loadData": "Não foi possível carregar os dados para gerar o documento.",
        "selectTemplate": "Selecione um modelo antes de gerar o documento.",
        "selectEnrollmentForContract": "Selecione a matrícula do aluno para gerar o contrato.",
        "invalidEnrollment": "A matrícula selecionada é inválida.",
        "selectPerson": "Selecione o funcionário ou professor para emitir este documento.",
        "invalidPerson": "Funcionário ou professor inválido.",
        "invalidPersonType": "Tipo de pessoa inválido.",
        "selectPayslip": "Selecione a competência do recibo de vencimento para emitir este documento.",
        "generate": "Não foi possível gerar o documento.",
        "payslipTemplateRequiresHrContext": "Os modelos com tags de recibo de vencimento têm de usar um contexto de funcionário, professor ou RH.",
        "payslipUnavailable": "O recibo de vencimento selecionado não existe, está cancelado/arquivado ou não pertence ao funcionário escolhido."
      }
    }
  },
  "en-US": {
    "generate": {
      "title": "📄 Issue Document",
      "description": "Select the official template and fill in the information specific to this issuance.",
      "toastErrorTitle": "Unable to generate",
      "select": "Select",
      "defaultContractTitle": "Education agreement",
      "contractOpenedMessage": "The official agreement was opened through the PHANYX Contracts module.",
      "template": {
        "label": "Document template",
        "type": "Type",
        "context": "Context"
      },
      "person": {
        "label": "Employee or teacher",
        "select": "Select the employee or teacher",
        "employeesGroup": "Employees",
        "professorsWithoutHrGroup": "Teachers without an HR link",
        "withoutHrSuffix": "no HR link",
        "help": "Teachers linked to HR appear in the employee list. Teachers without an HR link must be linked to HR before employment documents can be issued."
      },
      "payslip": {
        "label": "Payslip / pay period",
        "loading": "Loading payslips...",
        "selectEmployeeFirst": "Select the employee first",
        "noneAvailable": "No payslips available",
        "selectCompetence": "Select the pay period",
        "help": "The pay period is selected explicitly so the values come from the correct payslip."
      },
      "student": {
        "label": "Student or linked person",
        "noneSelected": "No student selected"
      },
      "enrollment": {
        "label": "Enrollment",
        "requiredSuffix": " (required for an academic agreement)",
        "optionalSuffix": " (optional)",
        "select": "Select the enrollment",
        "none": "None",
        "unnamedStudent": "Unnamed student"
      },
      "manual": {
        "title": "Issuance information",
        "description": "These fields will be inserted into the corresponding template tags.",
        "noFields": "This template has no manual-entry fields. PHANYX will fill in the data automatically."
      },
      "titleComplement": {
        "label": "Title supplement (optional)",
        "placeholder": "E.g. Service performed in August 2026"
      },
      "print": {
        "title": "Print format",
        "description": "Choose how the document will be arranged on the A4 sheet.",
        "oneCopy": {
          "title": "One copy",
          "description": "One document using a full A4 sheet."
        },
        "twoCopies": {
          "title": "Two copies",
          "description": "Recipient copy and institution copy on the same A4 sheet."
        }
      },
      "actions": {
        "generating": "Generating...",
        "openOfficialContract": "Open official agreement",
        "generate": "Generate Document"
      },
      "result": {
        "title": "Generated Document",
        "id": "ID",
        "documentTitle": "Title",
        "status": "Status",
        "noPreview": "The document was generated, but no content was returned for preview.",
        "openPdf": "Open PDF"
      },
      "manualFields": {
        "genericPlaceholder": "Enter {tag}",
        "documentDescription": {
          "label": "Document description or body",
          "placeholder": "Describe the service, payment, purpose, or specific content for this issuance."
        },
        "documentPurpose": {
          "label": "Document purpose",
          "placeholder": "Enter the purpose for which this document is being issued."
        },
        "documentRecipient": {
          "label": "Recipient",
          "placeholder": "E.g. Company, agency, person, or responsible department"
        },
        "documentSubject": {
          "label": "Subject",
          "placeholder": "E.g. Audiovisual services"
        },
        "documentNotes": {
          "label": "Notes",
          "placeholder": "Additional information for this issuance."
        },
        "referencePeriod": {
          "label": "Reference period",
          "placeholder": "E.g. August 2026"
        },
        "competence": {
          "label": "Pay/reference period",
          "placeholder": "E.g. August 2026"
        },
        "documentValue": {
          "label": "Amount",
          "placeholder": "E.g. 150.00"
        },
        "receivedValue": {
          "label": "Amount received",
          "placeholder": "E.g. 150.00"
        },
        "value": {
          "label": "Amount",
          "placeholder": "E.g. 150.00"
        },
        "payerName": {
          "label": "Payer name",
          "placeholder": "Full name or legal business name"
        },
        "payerDocument": {
          "label": "Payer CPF or CNPJ",
          "placeholder": "Enter the CPF or CNPJ"
        },
        "paymentMethod": {
          "label": "Payment method"
        },
        "paymentDate": {
          "label": "Payment date"
        },
        "paymentReference": {
          "label": "Payment reference",
          "placeholder": "E.g. PIX code, E2E, receipt number, or internal identifier"
        },
        "providerName": {
          "label": "Service provider name",
          "placeholder": "Name of the person or company that provided the service"
        },
        "providerDocument": {
          "label": "Provider CPF or CNPJ",
          "placeholder": "Enter the CPF or CNPJ"
        },
        "serviceDescription": {
          "label": "Service description",
          "placeholder": "Describe the service provided."
        }
      },
      "manualOptions": {
        "pix": "PIX",
        "cash": "Cash",
        "creditCard": "Credit card",
        "debitCard": "Debit card",
        "bankTransfer": "Bank transfer",
        "bankSlip": "Bank slip",
        "check": "Check",
        "other": "Other"
      },
      "errors": {
        "loadPayslips": "Unable to load payslips.",
        "loadData": "Unable to load the data required to generate the document.",
        "selectTemplate": "Select a template before generating the document.",
        "selectEnrollmentForContract": "Select the student's enrollment to generate the agreement.",
        "invalidEnrollment": "The selected enrollment is invalid.",
        "selectPerson": "Select the employee or teacher for this document.",
        "invalidPerson": "Invalid employee or teacher.",
        "invalidPersonType": "Invalid person type.",
        "selectPayslip": "Select the payslip pay period for this document.",
        "generate": "Unable to generate the document.",
        "payslipTemplateRequiresHrContext": "Templates with payslip tags must use an employee, teacher, or HR context.",
        "payslipUnavailable": "The selected payslip does not exist, is cancelled/archived, or does not belong to the selected employee."
      }
    }
  },
  "es-ES": {
    "generate": {
      "title": "📄 Emitir documento",
      "description": "Seleccione la plantilla oficial y complete los datos específicos de esta emisión.",
      "toastErrorTitle": "No se pudo generar",
      "select": "Seleccione",
      "defaultContractTitle": "Contrato educativo",
      "contractOpenedMessage": "El contrato oficial se abrió mediante el módulo de Contratos de PHANYX.",
      "template": {
        "label": "Plantilla del documento",
        "type": "Tipo",
        "context": "Contexto"
      },
      "person": {
        "label": "Empleado o profesor",
        "select": "Seleccione el empleado o profesor",
        "employeesGroup": "Empleados",
        "professorsWithoutHrGroup": "Profesores sin vínculo con RR. HH.",
        "withoutHrSuffix": "sin vínculo con RR. HH.",
        "help": "Los profesores vinculados a RR. HH. aparecen en la lista de empleados. Los profesores sin vínculo con RR. HH. deben vincularse antes de emitir documentos laborales."
      },
      "payslip": {
        "label": "Nómina / período",
        "loading": "Cargando nóminas...",
        "selectEmployeeFirst": "Seleccione primero al empleado",
        "noneAvailable": "No hay nóminas disponibles",
        "selectCompetence": "Seleccione el período",
        "help": "El período se selecciona explícitamente para que los valores se obtengan de la nómina correcta."
      },
      "student": {
        "label": "Alumno o persona vinculada",
        "noneSelected": "Ningún alumno seleccionado"
      },
      "enrollment": {
        "label": "Matrícula",
        "requiredSuffix": " (obligatoria para contrato académico)",
        "optionalSuffix": " (opcional)",
        "select": "Seleccione la matrícula",
        "none": "Ninguna",
        "unnamedStudent": "Alumno sin nombre"
      },
      "manual": {
        "title": "Información de esta emisión",
        "description": "Estos campos se insertarán en las etiquetas correspondientes de la plantilla.",
        "noFields": "Esta plantilla no tiene campos de cumplimentación manual. PHANYX completará los datos automáticamente."
      },
      "titleComplement": {
        "label": "Complemento del título (opcional)",
        "placeholder": "Ej.: Servicio realizado en agosto de 2026"
      },
      "print": {
        "title": "Formato de impresión",
        "description": "Elija cómo se organizará el documento en la hoja A4.",
        "oneCopy": {
          "title": "Una copia",
          "description": "Un documento ocupando una hoja A4 completa."
        },
        "twoCopies": {
          "title": "Dos copias",
          "description": "Copia del interesado y copia de la institución en la misma hoja A4."
        }
      },
      "actions": {
        "generating": "Generando...",
        "openOfficialContract": "Abrir contrato oficial",
        "generate": "Generar documento"
      },
      "result": {
        "title": "Documento generado",
        "id": "ID",
        "documentTitle": "Título",
        "status": "Estado",
        "noPreview": "El documento se generó, pero no se devolvió contenido para la vista previa.",
        "openPdf": "Abrir PDF"
      },
      "manualFields": {
        "genericPlaceholder": "Introduzca {tag}",
        "documentDescription": {
          "label": "Descripción o cuerpo del documento",
          "placeholder": "Describa el servicio, pago, finalidad o contenido específico de esta emisión."
        },
        "documentPurpose": {
          "label": "Finalidad del documento",
          "placeholder": "Indique para qué finalidad se emite este documento."
        },
        "documentRecipient": {
          "label": "Destinatario",
          "placeholder": "Ej.: Empresa, organismo, persona o departamento responsable"
        },
        "documentSubject": {
          "label": "Asunto",
          "placeholder": "Ej.: Prestación de servicios audiovisuales"
        },
        "documentNotes": {
          "label": "Observaciones",
          "placeholder": "Información complementaria de esta emisión."
        },
        "referencePeriod": {
          "label": "Período de referencia",
          "placeholder": "Ej.: Agosto de 2026"
        },
        "competence": {
          "label": "Período",
          "placeholder": "Ej.: Agosto de 2026"
        },
        "documentValue": {
          "label": "Importe",
          "placeholder": "Ej.: 150,00"
        },
        "receivedValue": {
          "label": "Importe recibido",
          "placeholder": "Ej.: 150,00"
        },
        "value": {
          "label": "Importe",
          "placeholder": "Ej.: 150,00"
        },
        "payerName": {
          "label": "Nombre del pagador",
          "placeholder": "Nombre completo o razón social"
        },
        "payerDocument": {
          "label": "CPF o CNPJ del pagador",
          "placeholder": "Introduzca el CPF o CNPJ"
        },
        "paymentMethod": {
          "label": "Forma de pago"
        },
        "paymentDate": {
          "label": "Fecha de pago"
        },
        "paymentReference": {
          "label": "Referencia del pago",
          "placeholder": "Ej.: código PIX, E2E, número de recibo o identificación interna"
        },
        "providerName": {
          "label": "Nombre del prestador",
          "placeholder": "Nombre de la persona o empresa que realizó el servicio"
        },
        "providerDocument": {
          "label": "CPF o CNPJ del prestador",
          "placeholder": "Introduzca el CPF o CNPJ"
        },
        "serviceDescription": {
          "label": "Descripción del servicio",
          "placeholder": "Describa el servicio realizado."
        }
      },
      "manualOptions": {
        "pix": "PIX",
        "cash": "Efectivo",
        "creditCard": "Tarjeta de crédito",
        "debitCard": "Tarjeta de débito",
        "bankTransfer": "Transferencia bancaria",
        "bankSlip": "Boleto",
        "check": "Cheque",
        "other": "Otro"
      },
      "errors": {
        "loadPayslips": "No se pudieron cargar las nóminas.",
        "loadData": "No se pudieron cargar los datos necesarios para generar el documento.",
        "selectTemplate": "Seleccione una plantilla antes de generar el documento.",
        "selectEnrollmentForContract": "Seleccione la matrícula del alumno para generar el contrato.",
        "invalidEnrollment": "La matrícula seleccionada no es válida.",
        "selectPerson": "Seleccione el empleado o profesor para emitir este documento.",
        "invalidPerson": "Empleado o profesor no válido.",
        "invalidPersonType": "Tipo de persona no válido.",
        "selectPayslip": "Seleccione el período de la nómina para emitir este documento.",
        "generate": "No se pudo generar el documento.",
        "payslipTemplateRequiresHrContext": "Las plantillas con etiquetas de nómina deben usar un contexto de empleado, profesor o RR. HH.",
        "payslipUnavailable": "La nómina seleccionada no existe, está cancelada/archivada o no pertenece al empleado seleccionado."
      }
    }
  },
  "fr-FR": {
    "generate": {
      "title": "📄 Émettre un document",
      "description": "Sélectionnez le modèle officiel et renseignez les données propres à cette émission.",
      "toastErrorTitle": "Impossible de générer",
      "select": "Sélectionner",
      "defaultContractTitle": "Contrat de formation",
      "contractOpenedMessage": "Le contrat officiel a été ouvert via le module Contrats de PHANYX.",
      "template": {
        "label": "Modèle du document",
        "type": "Type",
        "context": "Contexte"
      },
      "person": {
        "label": "Employé ou enseignant",
        "select": "Sélectionnez l’employé ou l’enseignant",
        "employeesGroup": "Employés",
        "professorsWithoutHrGroup": "Enseignants sans lien RH",
        "withoutHrSuffix": "sans lien RH",
        "help": "Les enseignants liés aux RH apparaissent dans la liste des employés. Les enseignants sans lien RH doivent être rattachés aux RH avant l’émission de documents de travail."
      },
      "payslip": {
        "label": "Bulletin de paie / période",
        "loading": "Chargement des bulletins de paie...",
        "selectEmployeeFirst": "Sélectionnez d’abord l’employé",
        "noneAvailable": "Aucun bulletin de paie disponible",
        "selectCompetence": "Sélectionnez la période",
        "help": "La période est choisie explicitement afin que les montants proviennent du bon bulletin de paie."
      },
      "student": {
        "label": "Élève ou personne associée",
        "noneSelected": "Aucun élève sélectionné"
      },
      "enrollment": {
        "label": "Inscription",
        "requiredSuffix": " (obligatoire pour un contrat académique)",
        "optionalSuffix": " (facultatif)",
        "select": "Sélectionnez l’inscription",
        "none": "Aucune",
        "unnamedStudent": "Élève sans nom"
      },
      "manual": {
        "title": "Informations de cette émission",
        "description": "Ces champs seront insérés dans les balises correspondantes du modèle.",
        "noFields": "Ce modèle ne comporte aucun champ à renseigner manuellement. PHANYX remplira automatiquement les données."
      },
      "titleComplement": {
        "label": "Complément du titre (facultatif)",
        "placeholder": "Ex. : Service réalisé en août 2026"
      },
      "print": {
        "title": "Format d’impression",
        "description": "Choisissez la disposition du document sur la feuille A4.",
        "oneCopy": {
          "title": "Un exemplaire",
          "description": "Un document occupant une feuille A4 entière."
        },
        "twoCopies": {
          "title": "Deux exemplaires",
          "description": "Exemplaire de l’intéressé et exemplaire de l’établissement sur la même feuille A4."
        }
      },
      "actions": {
        "generating": "Génération...",
        "openOfficialContract": "Ouvrir le contrat officiel",
        "generate": "Générer le document"
      },
      "result": {
        "title": "Document généré",
        "id": "ID",
        "documentTitle": "Titre",
        "status": "Statut",
        "noPreview": "Le document a été généré, mais aucun contenu n’a été renvoyé pour l’aperçu.",
        "openPdf": "Ouvrir le PDF"
      },
      "manualFields": {
        "genericPlaceholder": "Saisissez {tag}",
        "documentDescription": {
          "label": "Description ou corps du document",
          "placeholder": "Décrivez le service, le paiement, l’objet ou le contenu spécifique de cette émission."
        },
        "documentPurpose": {
          "label": "Objet du document",
          "placeholder": "Indiquez l’objet pour lequel ce document est émis."
        },
        "documentRecipient": {
          "label": "Destinataire",
          "placeholder": "Ex. : entreprise, organisme, personne ou service responsable"
        },
        "documentSubject": {
          "label": "Objet",
          "placeholder": "Ex. : prestation de services audiovisuels"
        },
        "documentNotes": {
          "label": "Observations",
          "placeholder": "Informations complémentaires pour cette émission."
        },
        "referencePeriod": {
          "label": "Période de référence",
          "placeholder": "Ex. : août 2026"
        },
        "competence": {
          "label": "Période",
          "placeholder": "Ex. : août 2026"
        },
        "documentValue": {
          "label": "Montant",
          "placeholder": "Ex. : 150,00"
        },
        "receivedValue": {
          "label": "Montant reçu",
          "placeholder": "Ex. : 150,00"
        },
        "value": {
          "label": "Montant",
          "placeholder": "Ex. : 150,00"
        },
        "payerName": {
          "label": "Nom du payeur",
          "placeholder": "Nom complet ou raison sociale"
        },
        "payerDocument": {
          "label": "CPF ou CNPJ du payeur",
          "placeholder": "Saisissez le CPF ou le CNPJ"
        },
        "paymentMethod": {
          "label": "Mode de paiement"
        },
        "paymentDate": {
          "label": "Date du paiement"
        },
        "paymentReference": {
          "label": "Référence du paiement",
          "placeholder": "Ex. : code PIX, E2E, numéro de reçu ou identifiant interne"
        },
        "providerName": {
          "label": "Nom du prestataire",
          "placeholder": "Nom de la personne ou de l’entreprise ayant réalisé le service"
        },
        "providerDocument": {
          "label": "CPF ou CNPJ du prestataire",
          "placeholder": "Saisissez le CPF ou le CNPJ"
        },
        "serviceDescription": {
          "label": "Description du service",
          "placeholder": "Décrivez le service réalisé."
        }
      },
      "manualOptions": {
        "pix": "PIX",
        "cash": "Espèces",
        "creditCard": "Carte de crédit",
        "debitCard": "Carte de débit",
        "bankTransfer": "Virement bancaire",
        "bankSlip": "Boleto",
        "check": "Chèque",
        "other": "Autre"
      },
      "errors": {
        "loadPayslips": "Impossible de charger les bulletins de paie.",
        "loadData": "Impossible de charger les données nécessaires à la génération du document.",
        "selectTemplate": "Sélectionnez un modèle avant de générer le document.",
        "selectEnrollmentForContract": "Sélectionnez l’inscription de l’élève pour générer le contrat.",
        "invalidEnrollment": "L’inscription sélectionnée est invalide.",
        "selectPerson": "Sélectionnez l’employé ou l’enseignant pour émettre ce document.",
        "invalidPerson": "Employé ou enseignant invalide.",
        "invalidPersonType": "Type de personne invalide.",
        "selectPayslip": "Sélectionnez la période du bulletin de paie pour émettre ce document.",
        "generate": "Impossible de générer le document.",
        "payslipTemplateRequiresHrContext": "Les modèles contenant des balises de bulletin de paie doivent utiliser un contexte employé, enseignant ou RH.",
        "payslipUnavailable": "Le bulletin de paie sélectionné n’existe pas, est annulé/archivé ou n’appartient pas à l’employé sélectionné."
      }
    }
  }
};

function deepMerge(target, source) {
  const result = {
    ...(target && typeof target === "object" && !Array.isArray(target)
      ? target
      : {}),
  };

  for (const [key, value] of Object.entries(source || {})) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

for (const [locale, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    throw new Error(`Arquivo não encontrado: ${file}`);
  }

  const json = JSON.parse(
    fs.readFileSync(file, "utf8")
  );

  json.AdminDocuments = deepMerge(
    json.AdminDocuments,
    translations[locale]
  );

  fs.writeFileSync(
    file,
    `${JSON.stringify(json, null, 2)}\n`,
    "utf8"
  );

  console.log(`OK: ${locale}`);
}

console.log(
  "Traduções de Documentos > Emitir Documento adicionadas."
);
