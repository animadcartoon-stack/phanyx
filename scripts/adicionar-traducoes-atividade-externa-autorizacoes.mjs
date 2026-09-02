import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    title: "Autorizações",
    description:
      "Acompanhe o consentimento dos responsáveis e mantenha o histórico das decisões registradas.",

    loading: "Carregando autorizações...",
    loadError: "Não foi possível carregar as autorizações.",
    retry: "Tentar novamente",

    summary: {
      total: "Participantes",
      pending: "Pendentes",
      authorized: "Autorizados",
      denied: "Não autorizados",
      waived: "Dispensados"
    },

    noAuthorizationRequired: {
      title: "Autorização não exigida",
      description:
        "Esta atividade não está configurada para exigir autorização do responsável."
    },

    empty: {
      title: "Nenhum participante",
      description:
        "Adicione participantes à atividade para começar a controlar as autorizações."
    },

    participant: {
      currentStatus: "Situação atual",
      noRecord: "Ainda não há resposta registada.",
      history: "Histórico",
      noHistory: "Nenhum histórico de autorização.",
      registration: "Matrícula",
      noRegistration: "Sem matrícula informada"
    },

    actions: {
      register: "Registrar resposta",
      authorize: "Autorizar",
      deny: "Não autorizar",
      waive: "Dispensar",
      revoke: "Revogar autorização",
      expire: "Marcar como expirada",
      cancel: "Cancelar",
      save: "Salvar resposta",
      saving: "Salvando..."
    },

    form: {
      title: "Registrar autorização",
      description:
        "Registre a decisão do responsável ou uma decisão administrativa devidamente justificada.",

      status: "Decisão",
      method: "Método",
      guardianName: "Nome do responsável",
      guardianRelationship: "Parentesco / relação",
      guardianEmail: "E-mail",
      guardianPhone: "Telefone",
      termVersion: "Versão do termo",
      observation: "Observação",

      guardianNamePlaceholder: "Nome completo do responsável",
      relationshipPlaceholder: "Ex.: mãe, pai, tutor legal...",
      emailPlaceholder: "responsavel@exemplo.com",
      phonePlaceholder: "Telefone do responsável",
      termVersionPlaceholder: "Ex.: v1.0",
      observationPlaceholder:
        "Informações adicionais sobre esta autorização..."
    },

    status: {
      PENDENTE: "Pendente",
      AUTORIZADO: "Autorizado",
      NAO_AUTORIZADO: "Não autorizado",
      REVOGADO: "Revogado",
      DISPENSADO: "Dispensado",
      EXPIRADO: "Expirado"
    },

    methods: {
      PORTAL: "Portal",
      LINK_SEGURO: "Link seguro",
      PRESENCIAL: "Presencial",
      IMPORTADO: "Importado",
      ADMINISTRATIVO: "Administrativo",
      OUTRO: "Outro"
    },

    history: {
      registeredAt: "Registrada em",
      answeredAt: "Respondida em",
      revokedAt: "Revogada em",
      guardian: "Responsável",
      method: "Método",
      observation: "Observação"
    },

    messages: {
      saved: "Autorização registrada com sucesso.",
      saveError: "Não foi possível registrar a autorização."
    }
  },

  "pt-PT": {
    title: "Autorizações",
    description:
      "Acompanhe o consentimento dos responsáveis e mantenha o histórico das decisões registadas.",

    loading: "A carregar autorizações...",
    loadError: "Não foi possível carregar as autorizações.",
    retry: "Tentar novamente",

    summary: {
      total: "Participantes",
      pending: "Pendentes",
      authorized: "Autorizados",
      denied: "Não autorizados",
      waived: "Dispensados"
    },

    noAuthorizationRequired: {
      title: "Autorização não exigida",
      description:
        "Esta atividade não está configurada para exigir autorização do responsável."
    },

    empty: {
      title: "Nenhum participante",
      description:
        "Adicione participantes à atividade para começar a controlar as autorizações."
    },

    participant: {
      currentStatus: "Situação atual",
      noRecord: "Ainda não existe resposta registada.",
      history: "Histórico",
      noHistory: "Nenhum histórico de autorização.",
      registration: "Matrícula",
      noRegistration: "Sem matrícula indicada"
    },

    actions: {
      register: "Registar resposta",
      authorize: "Autorizar",
      deny: "Não autorizar",
      waive: "Dispensar",
      revoke: "Revogar autorização",
      expire: "Marcar como expirada",
      cancel: "Cancelar",
      save: "Guardar resposta",
      saving: "A guardar..."
    },

    form: {
      title: "Registar autorização",
      description:
        "Registe a decisão do responsável ou uma decisão administrativa devidamente justificada.",

      status: "Decisão",
      method: "Método",
      guardianName: "Nome do responsável",
      guardianRelationship: "Parentesco / relação",
      guardianEmail: "E-mail",
      guardianPhone: "Telefone",
      termVersion: "Versão do termo",
      observation: "Observação",

      guardianNamePlaceholder: "Nome completo do responsável",
      relationshipPlaceholder: "Ex.: mãe, pai, tutor legal...",
      emailPlaceholder: "responsavel@exemplo.com",
      phonePlaceholder: "Telefone do responsável",
      termVersionPlaceholder: "Ex.: v1.0",
      observationPlaceholder:
        "Informações adicionais sobre esta autorização..."
    },

    status: {
      PENDENTE: "Pendente",
      AUTORIZADO: "Autorizado",
      NAO_AUTORIZADO: "Não autorizado",
      REVOGADO: "Revogado",
      DISPENSADO: "Dispensado",
      EXPIRADO: "Expirado"
    },

    methods: {
      PORTAL: "Portal",
      LINK_SEGURO: "Ligação segura",
      PRESENCIAL: "Presencial",
      IMPORTADO: "Importado",
      ADMINISTRATIVO: "Administrativo",
      OUTRO: "Outro"
    },

    history: {
      registeredAt: "Registada em",
      answeredAt: "Respondida em",
      revokedAt: "Revogada em",
      guardian: "Responsável",
      method: "Método",
      observation: "Observação"
    },

    messages: {
      saved: "Autorização registada com sucesso.",
      saveError: "Não foi possível registar a autorização."
    }
  },

  "en-US": {
    title: "Permissions",
    description:
      "Track guardian consent and keep a history of every recorded decision.",

    loading: "Loading permissions...",
    loadError: "Permissions could not be loaded.",
    retry: "Try again",

    summary: {
      total: "Participants",
      pending: "Pending",
      authorized: "Authorized",
      denied: "Not authorized",
      waived: "Waived"
    },

    noAuthorizationRequired: {
      title: "Permission not required",
      description:
        "This activity is not configured to require guardian permission."
    },

    empty: {
      title: "No participants",
      description:
        "Add participants to the activity to start tracking permissions."
    },

    participant: {
      currentStatus: "Current status",
      noRecord: "No response has been recorded yet.",
      history: "History",
      noHistory: "No permission history.",
      registration: "Registration",
      noRegistration: "No registration provided"
    },

    actions: {
      register: "Record response",
      authorize: "Authorize",
      deny: "Do not authorize",
      waive: "Waive requirement",
      revoke: "Revoke permission",
      expire: "Mark as expired",
      cancel: "Cancel",
      save: "Save response",
      saving: "Saving..."
    },

    form: {
      title: "Record permission",
      description:
        "Record the guardian's decision or a properly justified administrative decision.",

      status: "Decision",
      method: "Method",
      guardianName: "Guardian name",
      guardianRelationship: "Relationship",
      guardianEmail: "Email",
      guardianPhone: "Phone",
      termVersion: "Term version",
      observation: "Notes",

      guardianNamePlaceholder: "Guardian's full name",
      relationshipPlaceholder: "E.g. mother, father, legal guardian...",
      emailPlaceholder: "guardian@example.com",
      phonePlaceholder: "Guardian phone number",
      termVersionPlaceholder: "E.g. v1.0",
      observationPlaceholder:
        "Additional information about this permission..."
    },

    status: {
      PENDENTE: "Pending",
      AUTORIZADO: "Authorized",
      NAO_AUTORIZADO: "Not authorized",
      REVOGADO: "Revoked",
      DISPENSADO: "Waived",
      EXPIRADO: "Expired"
    },

    methods: {
      PORTAL: "Portal",
      LINK_SEGURO: "Secure link",
      PRESENCIAL: "In person",
      IMPORTADO: "Imported",
      ADMINISTRATIVO: "Administrative",
      OUTRO: "Other"
    },

    history: {
      registeredAt: "Recorded on",
      answeredAt: "Answered on",
      revokedAt: "Revoked on",
      guardian: "Guardian",
      method: "Method",
      observation: "Notes"
    },

    messages: {
      saved: "Permission recorded successfully.",
      saveError: "Permission could not be recorded."
    }
  },

  "es-ES": {
    title: "Autorizaciones",
    description:
      "Controla el consentimiento de los responsables y conserva el historial de todas las decisiones registradas.",

    loading: "Cargando autorizaciones...",
    loadError: "No se pudieron cargar las autorizaciones.",
    retry: "Intentar de nuevo",

    summary: {
      total: "Participantes",
      pending: "Pendientes",
      authorized: "Autorizados",
      denied: "No autorizados",
      waived: "Exentos"
    },

    noAuthorizationRequired: {
      title: "Autorización no requerida",
      description:
        "Esta actividad no está configurada para requerir autorización del responsable."
    },

    empty: {
      title: "Sin participantes",
      description:
        "Añade participantes a la actividad para comenzar a controlar las autorizaciones."
    },

    participant: {
      currentStatus: "Estado actual",
      noRecord: "Todavía no hay ninguna respuesta registrada.",
      history: "Historial",
      noHistory: "No hay historial de autorización.",
      registration: "Matrícula",
      noRegistration: "Sin matrícula informada"
    },

    actions: {
      register: "Registrar respuesta",
      authorize: "Autorizar",
      deny: "No autorizar",
      waive: "Eximir",
      revoke: "Revocar autorización",
      expire: "Marcar como expirada",
      cancel: "Cancelar",
      save: "Guardar respuesta",
      saving: "Guardando..."
    },

    form: {
      title: "Registrar autorización",
      description:
        "Registra la decisión del responsable o una decisión administrativa debidamente justificada.",

      status: "Decisión",
      method: "Método",
      guardianName: "Nombre del responsable",
      guardianRelationship: "Parentesco / relación",
      guardianEmail: "Correo electrónico",
      guardianPhone: "Teléfono",
      termVersion: "Versión del consentimiento",
      observation: "Observación",

      guardianNamePlaceholder: "Nombre completo del responsable",
      relationshipPlaceholder: "Ej.: madre, padre, tutor legal...",
      emailPlaceholder: "responsable@ejemplo.com",
      phonePlaceholder: "Teléfono del responsable",
      termVersionPlaceholder: "Ej.: v1.0",
      observationPlaceholder:
        "Información adicional sobre esta autorización..."
    },

    status: {
      PENDENTE: "Pendiente",
      AUTORIZADO: "Autorizado",
      NAO_AUTORIZADO: "No autorizado",
      REVOGADO: "Revocado",
      DISPENSADO: "Exento",
      EXPIRADO: "Expirado"
    },

    methods: {
      PORTAL: "Portal",
      LINK_SEGURO: "Enlace seguro",
      PRESENCIAL: "Presencial",
      IMPORTADO: "Importado",
      ADMINISTRATIVO: "Administrativo",
      OUTRO: "Otro"
    },

    history: {
      registeredAt: "Registrada el",
      answeredAt: "Respondida el",
      revokedAt: "Revocada el",
      guardian: "Responsable",
      method: "Método",
      observation: "Observación"
    },

    messages: {
      saved: "Autorización registrada correctamente.",
      saveError: "No se pudo registrar la autorización."
    }
  },

  "fr-FR": {
    title: "Autorisations",
    description:
      "Suivez le consentement des responsables et conservez l’historique de chaque décision enregistrée.",

    loading: "Chargement des autorisations...",
    loadError: "Impossible de charger les autorisations.",
    retry: "Réessayer",

    summary: {
      total: "Participants",
      pending: "En attente",
      authorized: "Autorisés",
      denied: "Non autorisés",
      waived: "Dispensés"
    },

    noAuthorizationRequired: {
      title: "Autorisation non requise",
      description:
        "Cette activité n’est pas configurée pour exiger l’autorisation du responsable."
    },

    empty: {
      title: "Aucun participant",
      description:
        "Ajoutez des participants à l’activité pour commencer le suivi des autorisations."
    },

    participant: {
      currentStatus: "Statut actuel",
      noRecord: "Aucune réponse n’a encore été enregistrée.",
      history: "Historique",
      noHistory: "Aucun historique d’autorisation.",
      registration: "Inscription",
      noRegistration: "Aucune inscription renseignée"
    },

    actions: {
      register: "Enregistrer une réponse",
      authorize: "Autoriser",
      deny: "Ne pas autoriser",
      waive: "Dispenser",
      revoke: "Révoquer l’autorisation",
      expire: "Marquer comme expirée",
      cancel: "Annuler",
      save: "Enregistrer",
      saving: "Enregistrement..."
    },

    form: {
      title: "Enregistrer une autorisation",
      description:
        "Enregistrez la décision du responsable ou une décision administrative dûment justifiée.",

      status: "Décision",
      method: "Méthode",
      guardianName: "Nom du responsable",
      guardianRelationship: "Lien avec l’élève",
      guardianEmail: "E-mail",
      guardianPhone: "Téléphone",
      termVersion: "Version du formulaire",
      observation: "Observation",

      guardianNamePlaceholder: "Nom complet du responsable",
      relationshipPlaceholder: "Ex. : mère, père, tuteur légal...",
      emailPlaceholder: "responsable@exemple.com",
      phonePlaceholder: "Téléphone du responsable",
      termVersionPlaceholder: "Ex. : v1.0",
      observationPlaceholder:
        "Informations supplémentaires sur cette autorisation..."
    },

    status: {
      PENDENTE: "En attente",
      AUTORIZADO: "Autorisé",
      NAO_AUTORIZADO: "Non autorisé",
      REVOGADO: "Révoqué",
      DISPENSADO: "Dispensé",
      EXPIRADO: "Expiré"
    },

    methods: {
      PORTAL: "Portail",
      LINK_SEGURO: "Lien sécurisé",
      PRESENCIAL: "En personne",
      IMPORTADO: "Importé",
      ADMINISTRATIVO: "Administratif",
      OUTRO: "Autre"
    },

    history: {
      registeredAt: "Enregistrée le",
      answeredAt: "Répondue le",
      revokedAt: "Révoquée le",
      guardian: "Responsable",
      method: "Méthode",
      observation: "Observation"
    },

    messages: {
      saved: "Autorisation enregistrée avec succès.",
      saveError: "Impossible d’enregistrer l’autorisation."
    }
  }
};

const namespace =
  "AdminExternalActivityAuthorizations";

for (
  const [locale, valor]
  of Object.entries(traducoes)
) {
  const arquivo =
    path.resolve(
      process.cwd(),
      `messages/${locale}.json`
    );

  const original =
    fs.readFileSync(
      arquivo,
      "utf8"
    );

  const dados =
    JSON.parse(original);

  if (
    Object.prototype.hasOwnProperty.call(
      dados,
      namespace
    )
  ) {
    console.log(
      `ℹ️ ${locale}: ${namespace} já existe.`
    );

    continue;
  }

  const eol =
    original.includes("\r\n")
      ? "\r\n"
      : "\n";

  const semEspacosFinais =
    original.trimEnd();

  const ultimoFechamento =
    semEspacosFinais.lastIndexOf(
      "}"
    );

  const objeto =
    JSON.stringify(
      valor,
      null,
      2
    )
      .split("\n")
      .map(
        (linha, indice) =>
          indice === 0
            ? linha
            : `  ${linha}`
      )
      .join(eol);

  const atualizado =
    semEspacosFinais.slice(
      0,
      ultimoFechamento
    ) +
    `,${eol}  "${namespace}": ${objeto}${eol}` +
    "}" +
    original.slice(
      semEspacosFinais.length
    );

  JSON.parse(atualizado);

  fs.writeFileSync(
    arquivo,
    atualizado,
    "utf8"
  );

  console.log(
    `✅ ${locale}: ${namespace} adicionado.`
  );
}

console.log(
  "✅ Traduções de autorizações concluídas."
);