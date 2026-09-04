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
    "common": {
      "reload": "Recarregar",
      "open": "Abrir",
      "print": "Imprimir",
      "email": "E-mail",
      "whatsapp": "WhatsApp",
      "delete": "Excluir",
      "deleting": "Excluindo...",
      "cancel": "Cancelar",
      "student": "Aluno",
      "enrollment": "Matrícula",
      "context": "Contexto",
      "template": "Template",
      "cpf": "CPF"
    },
    "types": {
      "contract": "Contrato",
      "declaration": "Declaração",
      "receipt": "Recibo",
      "proof": "Comprovante",
      "withdrawal": "Trancamento",
      "attendance": "Comparecimento",
      "transcript": "Histórico",
      "payslip": "Holerite",
      "hrDocument": "RH - Documento geral",
      "employmentContract": "RH - Contrato de trabalho",
      "probationContract": "RH - Contrato de experiência",
      "hrPrivacyTerm": "RH - Termo LGPD",
      "equipmentTerm": "RH - Termo de uso de equipamentos",
      "admission": "RH - Documento de admissão",
      "dismissal": "RH - Documento de demissão",
      "resignation": "RH - Pedido de demissão",
      "notice": "RH - Aviso prévio",
      "terminationTerm": "RH - TRCT",
      "vacation": "RH - Documento de férias",
      "vacationNotice": "RH - Aviso de férias",
      "vacationReceipt": "RH - Recibo de férias",
      "warning": "RH - Advertência",
      "suspension": "RH - Suspensão",
      "medicalLeave": "RH - Afastamento médico",
      "maternityLeave": "RH - Afastamento maternidade",
      "medicalAssessmentLeave": "RH - Afastamento perícia",
      "returnToWork": "RH - Retorno ao trabalho",
      "occupationalHealthCertificate": "RH - ASO geral",
      "occupationalHealthAdmission": "RH - ASO admissional",
      "occupationalHealthPeriodic": "RH - ASO periódico",
      "occupationalHealthReturn": "RH - ASO retorno ao trabalho",
      "occupationalHealthRoleChange": "RH - ASO mudança de função",
      "occupationalHealthDismissal": "RH - ASO demissional",
      "other": "Outro"
    },
    "statuses": {
      "draft": "Rascunho",
      "generated": "Gerado",
      "signed": "Assinado",
      "cancelled": "Cancelado",
      "opened": "Aberto"
    },
    "generated": {
      "title": "📚 Documentos gerados",
      "description": "Visualize o histórico de documentos gerados pela instituição.",
      "toastErrorTitle": "Não foi possível concluir",
      "historyTitle": "Histórico documental",
      "historyDescription": "Contratos, declarações, recibos, comprovantes e outros documentos.",
      "searchPlaceholder": "Buscar por título, aluno, contexto...",
      "allTypes": "Todos os tipos",
      "deleteUnsigned": "Excluir não assinados",
      "selectAllVisible": "Selecionar todos exibidos",
      "selected": "selecionado(s)",
      "selectedCount": "{count} selecionado(s)",
      "deleteSelected": "Excluir selecionados",
      "deleteSelectedWithCount": "Excluir selecionados ({count})",
      "loading": "Carregando documentos...",
      "empty": "Nenhum documento encontrado.",
      "selectDocument": "Selecionar documento",
      "selectDocumentNamed": "Selecionar {title}",
      "requiresSignature": "Exige assinatura",
      "noSignature": "Sem assinatura",
      "generatedAt": "Gerado em",
      "previewTitle": "Visualização",
      "previewDescription": "Abra um documento gerado para ver os detalhes.",
      "loadingDetail": "Carregando documento...",
      "noSelection": "Nenhum documento selecionado.",
      "documentContent": "Conteúdo do documento",
      "deleteDocument": "Excluir documento",
      "deleteUnsignedTitle": "Excluir documentos não assinados",
      "deleteSelectedTitle": "Excluir documentos selecionados",
      "confirmDeleteOne": "Tem certeza que deseja excluir “{title}”? Esta ação não poderá ser desfeita.",
      "confirmDeleteOneButton": "Sim, excluir",
      "confirmDeleteUnsigned": "Esta ação excluirá todos os documentos gerados, rascunhos e cancelados que ainda não foram assinados nesta instituição. Documentos assinados serão preservados. Deseja continuar?",
      "confirmDeleteUnsignedButton": "Sim, excluir todos",
      "confirmDeleteSelected": "Você selecionou {count} documento(s). Tem certeza que deseja excluí-los? Documentos assinados serão preservados.",
      "confirmDeleteSelectedButton": "Excluir {count} documento(s)",
      "share": {
        "document": "Documento",
        "type": "Tipo",
        "student": "Aluno",
        "enrollment": "Matrícula",
        "context": "Contexto"
      },
      "errors": {
        "load": "Erro ao carregar documentos.",
        "loadDetail": "Erro ao carregar documento.",
        "printWindow": "Não foi possível abrir a janela de impressão. Verifique se o navegador bloqueou pop-ups.",
        "deleteOne": "Não foi possível excluir o documento.",
        "deleteMany": "Não foi possível excluir os documentos.",
        "selectAtLeastOne": "Selecione pelo menos um documento.",
        "deleteSelected": "Não foi possível excluir os documentos selecionados."
      },
      "messages": {
        "emailCopied": "O conteúdo do documento foi copiado. Se o e-mail não abrir automaticamente, cole o texto no seu e-mail.",
        "emailOpening": "Tentando abrir o e-mail. Se não abrir, verifique se há um aplicativo de e-mail configurado no computador.",
        "deletedOne": "Documento excluído com sucesso.",
        "deletedMany": "Documentos excluídos com sucesso.",
        "deletedSelected": "Documentos selecionados excluídos com sucesso."
      }
    }
  },
  "pt-PT": {
    "common": {
      "reload": "Recarregar",
      "open": "Abrir",
      "print": "Imprimir",
      "email": "E-mail",
      "whatsapp": "WhatsApp",
      "delete": "Eliminar",
      "deleting": "A eliminar...",
      "cancel": "Cancelar",
      "student": "Aluno",
      "enrollment": "Matrícula",
      "context": "Contexto",
      "template": "Modelo",
      "cpf": "CPF"
    },
    "types": {
      "contract": "Contrato",
      "declaration": "Declaração",
      "receipt": "Recibo",
      "proof": "Comprovativo",
      "withdrawal": "Suspensão de matrícula",
      "attendance": "Comparência",
      "transcript": "Histórico académico",
      "payslip": "Recibo de vencimento",
      "hrDocument": "RH - Documento geral",
      "employmentContract": "RH - Contrato de trabalho",
      "probationContract": "RH - Contrato experimental",
      "hrPrivacyTerm": "RH - Termo RGPD",
      "equipmentTerm": "RH - Termo de utilização de equipamentos",
      "admission": "RH - Documento de admissão",
      "dismissal": "RH - Documento de cessação",
      "resignation": "RH - Pedido de demissão",
      "notice": "RH - Aviso prévio",
      "terminationTerm": "RH - Termo de cessação",
      "vacation": "RH - Documento de férias",
      "vacationNotice": "RH - Aviso de férias",
      "vacationReceipt": "RH - Recibo de férias",
      "warning": "RH - Advertência",
      "suspension": "RH - Suspensão",
      "medicalLeave": "RH - Afastamento médico",
      "maternityLeave": "RH - Licença de maternidade",
      "medicalAssessmentLeave": "RH - Afastamento para perícia",
      "returnToWork": "RH - Regresso ao trabalho",
      "occupationalHealthCertificate": "RH - ASO geral",
      "occupationalHealthAdmission": "RH - ASO admissional",
      "occupationalHealthPeriodic": "RH - ASO periódico",
      "occupationalHealthReturn": "RH - ASO de regresso ao trabalho",
      "occupationalHealthRoleChange": "RH - ASO de mudança de função",
      "occupationalHealthDismissal": "RH - ASO de cessação",
      "other": "Outro"
    },
    "statuses": {
      "draft": "Rascunho",
      "generated": "Gerado",
      "signed": "Assinado",
      "cancelled": "Cancelado",
      "opened": "Aberto"
    },
    "generated": {
      "title": "📚 Documentos gerados",
      "description": "Consulte o histórico de documentos gerados pela instituição.",
      "toastErrorTitle": "Não foi possível concluir",
      "historyTitle": "Histórico documental",
      "historyDescription": "Contratos, declarações, recibos, comprovativos e outros documentos.",
      "searchPlaceholder": "Pesquisar por título, aluno, contexto...",
      "allTypes": "Todos os tipos",
      "deleteUnsigned": "Eliminar não assinados",
      "selectAllVisible": "Selecionar todos os apresentados",
      "selected": "selecionado(s)",
      "selectedCount": "{count} selecionado(s)",
      "deleteSelected": "Eliminar selecionados",
      "deleteSelectedWithCount": "Eliminar selecionados ({count})",
      "loading": "A carregar documentos...",
      "empty": "Nenhum documento encontrado.",
      "selectDocument": "Selecionar documento",
      "selectDocumentNamed": "Selecionar {title}",
      "requiresSignature": "Requer assinatura",
      "noSignature": "Sem assinatura",
      "generatedAt": "Gerado em",
      "previewTitle": "Visualização",
      "previewDescription": "Abra um documento gerado para consultar os detalhes.",
      "loadingDetail": "A carregar documento...",
      "noSelection": "Nenhum documento selecionado.",
      "documentContent": "Conteúdo do documento",
      "deleteDocument": "Eliminar documento",
      "deleteUnsignedTitle": "Eliminar documentos não assinados",
      "deleteSelectedTitle": "Eliminar documentos selecionados",
      "confirmDeleteOne": "Tem a certeza de que pretende eliminar “{title}”? Esta ação não poderá ser anulada.",
      "confirmDeleteOneButton": "Sim, eliminar",
      "confirmDeleteUnsigned": "Esta ação eliminará todos os documentos gerados, rascunhos e cancelados que ainda não tenham sido assinados nesta instituição. Os documentos assinados serão preservados. Pretende continuar?",
      "confirmDeleteUnsignedButton": "Sim, eliminar todos",
      "confirmDeleteSelected": "Selecionou {count} documento(s). Tem a certeza de que pretende eliminá-los? Os documentos assinados serão preservados.",
      "confirmDeleteSelectedButton": "Eliminar {count} documento(s)",
      "share": {
        "document": "Documento",
        "type": "Tipo",
        "student": "Aluno",
        "enrollment": "Matrícula",
        "context": "Contexto"
      },
      "errors": {
        "load": "Não foi possível carregar os documentos.",
        "loadDetail": "Não foi possível carregar o documento.",
        "printWindow": "Não foi possível abrir a janela de impressão. Verifique se o navegador bloqueou janelas pop-up.",
        "deleteOne": "Não foi possível eliminar o documento.",
        "deleteMany": "Não foi possível eliminar os documentos.",
        "selectAtLeastOne": "Selecione pelo menos um documento.",
        "deleteSelected": "Não foi possível eliminar os documentos selecionados."
      },
      "messages": {
        "emailCopied": "O conteúdo do documento foi copiado. Se o e-mail não abrir automaticamente, cole o texto no seu e-mail.",
        "emailOpening": "A tentar abrir o e-mail. Se não abrir, verifique se existe uma aplicação de e-mail configurada no computador.",
        "deletedOne": "Documento eliminado com sucesso.",
        "deletedMany": "Documentos eliminados com sucesso.",
        "deletedSelected": "Documentos selecionados eliminados com sucesso."
      }
    }
  },
  "en-US": {
    "common": {
      "reload": "Reload",
      "open": "Open",
      "print": "Print",
      "email": "Email",
      "whatsapp": "WhatsApp",
      "delete": "Delete",
      "deleting": "Deleting...",
      "cancel": "Cancel",
      "student": "Student",
      "enrollment": "Enrollment",
      "context": "Context",
      "template": "Template",
      "cpf": "CPF"
    },
    "types": {
      "contract": "Contract",
      "declaration": "Declaration",
      "receipt": "Receipt",
      "proof": "Proof",
      "withdrawal": "Enrollment withdrawal",
      "attendance": "Attendance",
      "transcript": "Transcript",
      "payslip": "Payslip",
      "hrDocument": "HR - General document",
      "employmentContract": "HR - Employment contract",
      "probationContract": "HR - Probation contract",
      "hrPrivacyTerm": "HR - Data privacy agreement",
      "equipmentTerm": "HR - Equipment use agreement",
      "admission": "HR - Hiring document",
      "dismissal": "HR - Termination document",
      "resignation": "HR - Resignation request",
      "notice": "HR - Notice",
      "terminationTerm": "HR - Termination statement",
      "vacation": "HR - Vacation document",
      "vacationNotice": "HR - Vacation notice",
      "vacationReceipt": "HR - Vacation receipt",
      "warning": "HR - Warning",
      "suspension": "HR - Suspension",
      "medicalLeave": "HR - Medical leave",
      "maternityLeave": "HR - Maternity leave",
      "medicalAssessmentLeave": "HR - Medical assessment leave",
      "returnToWork": "HR - Return to work",
      "occupationalHealthCertificate": "HR - Occupational health certificate",
      "occupationalHealthAdmission": "HR - Pre-employment health certificate",
      "occupationalHealthPeriodic": "HR - Periodic health certificate",
      "occupationalHealthReturn": "HR - Return-to-work health certificate",
      "occupationalHealthRoleChange": "HR - Role-change health certificate",
      "occupationalHealthDismissal": "HR - Exit health certificate",
      "other": "Other"
    },
    "statuses": {
      "draft": "Draft",
      "generated": "Generated",
      "signed": "Signed",
      "cancelled": "Cancelled",
      "opened": "Opened"
    },
    "generated": {
      "title": "📚 Generated documents",
      "description": "View the history of documents generated by the institution.",
      "toastErrorTitle": "Unable to complete",
      "historyTitle": "Document history",
      "historyDescription": "Contracts, declarations, receipts, proofs, and other documents.",
      "searchPlaceholder": "Search by title, student, context...",
      "allTypes": "All types",
      "deleteUnsigned": "Delete unsigned",
      "selectAllVisible": "Select all displayed",
      "selected": "selected",
      "selectedCount": "{count} selected",
      "deleteSelected": "Delete selected",
      "deleteSelectedWithCount": "Delete selected ({count})",
      "loading": "Loading documents...",
      "empty": "No documents found.",
      "selectDocument": "Select document",
      "selectDocumentNamed": "Select {title}",
      "requiresSignature": "Signature required",
      "noSignature": "No signature",
      "generatedAt": "Generated on",
      "previewTitle": "Preview",
      "previewDescription": "Open a generated document to view its details.",
      "loadingDetail": "Loading document...",
      "noSelection": "No document selected.",
      "documentContent": "Document content",
      "deleteDocument": "Delete document",
      "deleteUnsignedTitle": "Delete unsigned documents",
      "deleteSelectedTitle": "Delete selected documents",
      "confirmDeleteOne": "Are you sure you want to delete “{title}”? This action cannot be undone.",
      "confirmDeleteOneButton": "Yes, delete",
      "confirmDeleteUnsigned": "This will delete all generated, draft, and cancelled documents in this institution that have not been signed yet. Signed documents will be preserved. Continue?",
      "confirmDeleteUnsignedButton": "Yes, delete all",
      "confirmDeleteSelected": "You selected {count} document(s). Are you sure you want to delete them? Signed documents will be preserved.",
      "confirmDeleteSelectedButton": "Delete {count} document(s)",
      "share": {
        "document": "Document",
        "type": "Type",
        "student": "Student",
        "enrollment": "Enrollment",
        "context": "Context"
      },
      "errors": {
        "load": "Unable to load documents.",
        "loadDetail": "Unable to load the document.",
        "printWindow": "Unable to open the print window. Check whether your browser blocked pop-ups.",
        "deleteOne": "Unable to delete the document.",
        "deleteMany": "Unable to delete the documents.",
        "selectAtLeastOne": "Select at least one document.",
        "deleteSelected": "Unable to delete the selected documents."
      },
      "messages": {
        "emailCopied": "The document content was copied. If your email app does not open automatically, paste the text into your email.",
        "emailOpening": "Trying to open your email app. If it does not open, check whether an email application is configured on this computer.",
        "deletedOne": "Document deleted successfully.",
        "deletedMany": "Documents deleted successfully.",
        "deletedSelected": "Selected documents deleted successfully."
      }
    }
  },
  "es-ES": {
    "common": {
      "reload": "Recargar",
      "open": "Abrir",
      "print": "Imprimir",
      "email": "Correo electrónico",
      "whatsapp": "WhatsApp",
      "delete": "Eliminar",
      "deleting": "Eliminando...",
      "cancel": "Cancelar",
      "student": "Alumno",
      "enrollment": "Matrícula",
      "context": "Contexto",
      "template": "Plantilla",
      "cpf": "CPF"
    },
    "types": {
      "contract": "Contrato",
      "declaration": "Declaración",
      "receipt": "Recibo",
      "proof": "Comprobante",
      "withdrawal": "Baja de matrícula",
      "attendance": "Asistencia",
      "transcript": "Historial académico",
      "payslip": "Nómina",
      "hrDocument": "RR. HH. - Documento general",
      "employmentContract": "RR. HH. - Contrato de trabajo",
      "probationContract": "RR. HH. - Contrato de prueba",
      "hrPrivacyTerm": "RR. HH. - Acuerdo de protección de datos",
      "equipmentTerm": "RR. HH. - Acuerdo de uso de equipos",
      "admission": "RR. HH. - Documento de admisión",
      "dismissal": "RR. HH. - Documento de baja",
      "resignation": "RR. HH. - Solicitud de renuncia",
      "notice": "RR. HH. - Preaviso",
      "terminationTerm": "RR. HH. - Finiquito",
      "vacation": "RR. HH. - Documento de vacaciones",
      "vacationNotice": "RR. HH. - Aviso de vacaciones",
      "vacationReceipt": "RR. HH. - Recibo de vacaciones",
      "warning": "RR. HH. - Amonestación",
      "suspension": "RR. HH. - Suspensión",
      "medicalLeave": "RR. HH. - Baja médica",
      "maternityLeave": "RR. HH. - Baja por maternidad",
      "medicalAssessmentLeave": "RR. HH. - Baja por evaluación médica",
      "returnToWork": "RR. HH. - Retorno al trabajo",
      "occupationalHealthCertificate": "RR. HH. - Certificado de salud laboral",
      "occupationalHealthAdmission": "RR. HH. - Examen médico de ingreso",
      "occupationalHealthPeriodic": "RR. HH. - Examen médico periódico",
      "occupationalHealthReturn": "RR. HH. - Examen de retorno al trabajo",
      "occupationalHealthRoleChange": "RR. HH. - Examen por cambio de función",
      "occupationalHealthDismissal": "RR. HH. - Examen médico de salida",
      "other": "Otro"
    },
    "statuses": {
      "draft": "Borrador",
      "generated": "Generado",
      "signed": "Firmado",
      "cancelled": "Cancelado",
      "opened": "Abierto"
    },
    "generated": {
      "title": "📚 Documentos generados",
      "description": "Consulte el historial de documentos generados por la institución.",
      "toastErrorTitle": "No se pudo completar",
      "historyTitle": "Historial documental",
      "historyDescription": "Contratos, declaraciones, recibos, comprobantes y otros documentos.",
      "searchPlaceholder": "Buscar por título, alumno, contexto...",
      "allTypes": "Todos los tipos",
      "deleteUnsigned": "Eliminar no firmados",
      "selectAllVisible": "Seleccionar todos los mostrados",
      "selected": "seleccionado(s)",
      "selectedCount": "{count} seleccionado(s)",
      "deleteSelected": "Eliminar seleccionados",
      "deleteSelectedWithCount": "Eliminar seleccionados ({count})",
      "loading": "Cargando documentos...",
      "empty": "No se encontraron documentos.",
      "selectDocument": "Seleccionar documento",
      "selectDocumentNamed": "Seleccionar {title}",
      "requiresSignature": "Requiere firma",
      "noSignature": "Sin firma",
      "generatedAt": "Generado el",
      "previewTitle": "Vista previa",
      "previewDescription": "Abra un documento generado para consultar los detalles.",
      "loadingDetail": "Cargando documento...",
      "noSelection": "No hay ningún documento seleccionado.",
      "documentContent": "Contenido del documento",
      "deleteDocument": "Eliminar documento",
      "deleteUnsignedTitle": "Eliminar documentos no firmados",
      "deleteSelectedTitle": "Eliminar documentos seleccionados",
      "confirmDeleteOne": "¿Está seguro de que desea eliminar “{title}”? Esta acción no se puede deshacer.",
      "confirmDeleteOneButton": "Sí, eliminar",
      "confirmDeleteUnsigned": "Esta acción eliminará todos los documentos generados, borradores y cancelados de esta institución que todavía no hayan sido firmados. Los documentos firmados se conservarán. ¿Desea continuar?",
      "confirmDeleteUnsignedButton": "Sí, eliminar todos",
      "confirmDeleteSelected": "Ha seleccionado {count} documento(s). ¿Está seguro de que desea eliminarlos? Los documentos firmados se conservarán.",
      "confirmDeleteSelectedButton": "Eliminar {count} documento(s)",
      "share": {
        "document": "Documento",
        "type": "Tipo",
        "student": "Alumno",
        "enrollment": "Matrícula",
        "context": "Contexto"
      },
      "errors": {
        "load": "No se pudieron cargar los documentos.",
        "loadDetail": "No se pudo cargar el documento.",
        "printWindow": "No se pudo abrir la ventana de impresión. Compruebe si el navegador bloqueó las ventanas emergentes.",
        "deleteOne": "No se pudo eliminar el documento.",
        "deleteMany": "No se pudieron eliminar los documentos.",
        "selectAtLeastOne": "Seleccione al menos un documento.",
        "deleteSelected": "No se pudieron eliminar los documentos seleccionados."
      },
      "messages": {
        "emailCopied": "El contenido del documento se ha copiado. Si el correo no se abre automáticamente, pegue el texto en su correo.",
        "emailOpening": "Intentando abrir el correo. Si no se abre, compruebe si hay una aplicación de correo configurada en el equipo.",
        "deletedOne": "Documento eliminado correctamente.",
        "deletedMany": "Documentos eliminados correctamente.",
        "deletedSelected": "Documentos seleccionados eliminados correctamente."
      }
    }
  },
  "fr-FR": {
    "common": {
      "reload": "Recharger",
      "open": "Ouvrir",
      "print": "Imprimer",
      "email": "E-mail",
      "whatsapp": "WhatsApp",
      "delete": "Supprimer",
      "deleting": "Suppression...",
      "cancel": "Annuler",
      "student": "Élève",
      "enrollment": "Inscription",
      "context": "Contexte",
      "template": "Modèle",
      "cpf": "CPF"
    },
    "types": {
      "contract": "Contrat",
      "declaration": "Déclaration",
      "receipt": "Reçu",
      "proof": "Justificatif",
      "withdrawal": "Suspension d’inscription",
      "attendance": "Présence",
      "transcript": "Relevé académique",
      "payslip": "Bulletin de paie",
      "hrDocument": "RH - Document général",
      "employmentContract": "RH - Contrat de travail",
      "probationContract": "RH - Contrat d’essai",
      "hrPrivacyTerm": "RH - Accord de protection des données",
      "equipmentTerm": "RH - Accord d’utilisation du matériel",
      "admission": "RH - Document d’embauche",
      "dismissal": "RH - Document de départ",
      "resignation": "RH - Demande de démission",
      "notice": "RH - Préavis",
      "terminationTerm": "RH - Solde de tout compte",
      "vacation": "RH - Document de congés",
      "vacationNotice": "RH - Avis de congés",
      "vacationReceipt": "RH - Reçu de congés",
      "warning": "RH - Avertissement",
      "suspension": "RH - Suspension",
      "medicalLeave": "RH - Arrêt maladie",
      "maternityLeave": "RH - Congé maternité",
      "medicalAssessmentLeave": "RH - Arrêt pour expertise médicale",
      "returnToWork": "RH - Reprise du travail",
      "occupationalHealthCertificate": "RH - Certificat de santé au travail",
      "occupationalHealthAdmission": "RH - Visite médicale d’embauche",
      "occupationalHealthPeriodic": "RH - Visite médicale périodique",
      "occupationalHealthReturn": "RH - Visite de reprise",
      "occupationalHealthRoleChange": "RH - Visite de changement de poste",
      "occupationalHealthDismissal": "RH - Visite médicale de départ",
      "other": "Autre"
    },
    "statuses": {
      "draft": "Brouillon",
      "generated": "Généré",
      "signed": "Signé",
      "cancelled": "Annulé",
      "opened": "Ouvert"
    },
    "generated": {
      "title": "📚 Documents générés",
      "description": "Consultez l’historique des documents générés par l’établissement.",
      "toastErrorTitle": "Impossible de terminer",
      "historyTitle": "Historique documentaire",
      "historyDescription": "Contrats, déclarations, reçus, justificatifs et autres documents.",
      "searchPlaceholder": "Rechercher par titre, élève, contexte...",
      "allTypes": "Tous les types",
      "deleteUnsigned": "Supprimer les non signés",
      "selectAllVisible": "Sélectionner tous les éléments affichés",
      "selected": "sélectionné(s)",
      "selectedCount": "{count} sélectionné(s)",
      "deleteSelected": "Supprimer la sélection",
      "deleteSelectedWithCount": "Supprimer la sélection ({count})",
      "loading": "Chargement des documents...",
      "empty": "Aucun document trouvé.",
      "selectDocument": "Sélectionner le document",
      "selectDocumentNamed": "Sélectionner {title}",
      "requiresSignature": "Signature requise",
      "noSignature": "Sans signature",
      "generatedAt": "Généré le",
      "previewTitle": "Aperçu",
      "previewDescription": "Ouvrez un document généré pour afficher ses détails.",
      "loadingDetail": "Chargement du document...",
      "noSelection": "Aucun document sélectionné.",
      "documentContent": "Contenu du document",
      "deleteDocument": "Supprimer le document",
      "deleteUnsignedTitle": "Supprimer les documents non signés",
      "deleteSelectedTitle": "Supprimer les documents sélectionnés",
      "confirmDeleteOne": "Voulez-vous vraiment supprimer « {title} » ? Cette action est irréversible.",
      "confirmDeleteOneButton": "Oui, supprimer",
      "confirmDeleteUnsigned": "Cette action supprimera tous les documents générés, brouillons et annulés de cet établissement qui n’ont pas encore été signés. Les documents signés seront conservés. Continuer ?",
      "confirmDeleteUnsignedButton": "Oui, tout supprimer",
      "confirmDeleteSelected": "Vous avez sélectionné {count} document(s). Voulez-vous vraiment les supprimer ? Les documents signés seront conservés.",
      "confirmDeleteSelectedButton": "Supprimer {count} document(s)",
      "share": {
        "document": "Document",
        "type": "Type",
        "student": "Élève",
        "enrollment": "Inscription",
        "context": "Contexte"
      },
      "errors": {
        "load": "Impossible de charger les documents.",
        "loadDetail": "Impossible de charger le document.",
        "printWindow": "Impossible d’ouvrir la fenêtre d’impression. Vérifiez si le navigateur a bloqué les fenêtres contextuelles.",
        "deleteOne": "Impossible de supprimer le document.",
        "deleteMany": "Impossible de supprimer les documents.",
        "selectAtLeastOne": "Sélectionnez au moins un document.",
        "deleteSelected": "Impossible de supprimer les documents sélectionnés."
      },
      "messages": {
        "emailCopied": "Le contenu du document a été copié. Si votre application de messagerie ne s’ouvre pas automatiquement, collez le texte dans votre e-mail.",
        "emailOpening": "Tentative d’ouverture de votre messagerie. Si elle ne s’ouvre pas, vérifiez qu’une application de messagerie est configurée sur cet ordinateur.",
        "deletedOne": "Document supprimé avec succès.",
        "deletedMany": "Documents supprimés avec succès.",
        "deletedSelected": "Documents sélectionnés supprimés avec succès."
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
  "Traduções de Documentos > Gerados adicionadas."
);
