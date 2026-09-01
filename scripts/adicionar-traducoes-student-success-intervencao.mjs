import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    intervention: {
      title: "Registrar intervenção",
      description:
        "Registre a ação realizada ou planejada para o acompanhamento deste aluno.",

      type: "Tipo de intervenção",
      channel: "Canal",
      status: "Status",
      observation: "Observação",
      observationPlaceholder:
        "Descreva o contato, orientação, encaminhamento ou outra ação realizada...",
      returnDate: "Data de retorno",
      returnDateOptional: "Opcional",

      cancel: "Cancelar",
      save: "Registrar intervenção",
      saving: "Registrando...",

      success: "Intervenção registrada com sucesso.",
      error: "Não foi possível registrar a intervenção.",

      types: {
        CONTATO: "Contato",
        ORIENTACAO: "Orientação",
        REUNIAO: "Reunião",
        ENCAMINHAMENTO: "Encaminhamento",
        ACOMPANHAMENTO: "Acompanhamento",
        OUTRO: "Outro",
      },

      channels: {
        WHATSAPP: "WhatsApp",
        LIGACAO: "Ligação",
        EMAIL: "E-mail",
        PRESENCIAL: "Presencial",
        VIDEOCHAMADA: "Videochamada",
        SISTEMA: "Sistema",
        OUTRO: "Outro",
      },

      statuses: {
        REGISTRADA: "Registrada",
        AGUARDANDO_RETORNO: "Aguardando retorno",
        EM_ACOMPANHAMENTO: "Em acompanhamento",
        RESOLVIDA: "Resolvida",
        CANCELADA: "Cancelada",
      },

      history: {
        title: "Histórico de acompanhamento",
        empty: "Nenhuma intervenção registrada para este aluno.",
        registeredBy: "Registrado por",
        returnScheduled: "Retorno previsto",
        recordedAt: "Registrado em",
      },
    },
  },

  "pt-PT": {
    intervention: {
      title: "Registar intervenção",
      description:
        "Registe a ação realizada ou planeada para o acompanhamento deste aluno.",

      type: "Tipo de intervenção",
      channel: "Canal",
      status: "Estado",
      observation: "Observação",
      observationPlaceholder:
        "Descreva o contacto, orientação, encaminhamento ou outra ação realizada...",
      returnDate: "Data de retorno",
      returnDateOptional: "Opcional",

      cancel: "Cancelar",
      save: "Registar intervenção",
      saving: "A registar...",

      success: "Intervenção registada com sucesso.",
      error: "Não foi possível registar a intervenção.",

      types: {
        CONTATO: "Contacto",
        ORIENTACAO: "Orientação",
        REUNIAO: "Reunião",
        ENCAMINHAMENTO: "Encaminhamento",
        ACOMPANHAMENTO: "Acompanhamento",
        OUTRO: "Outro",
      },

      channels: {
        WHATSAPP: "WhatsApp",
        LIGACAO: "Chamada",
        EMAIL: "E-mail",
        PRESENCIAL: "Presencial",
        VIDEOCHAMADA: "Videochamada",
        SISTEMA: "Sistema",
        OUTRO: "Outro",
      },

      statuses: {
        REGISTRADA: "Registada",
        AGUARDANDO_RETORNO: "A aguardar retorno",
        EM_ACOMPANHAMENTO: "Em acompanhamento",
        RESOLVIDA: "Resolvida",
        CANCELADA: "Cancelada",
      },

      history: {
        title: "Histórico de acompanhamento",
        empty: "Nenhuma intervenção registada para este aluno.",
        registeredBy: "Registado por",
        returnScheduled: "Retorno previsto",
        recordedAt: "Registado em",
      },
    },
  },

  "en-US": {
    intervention: {
      title: "Register intervention",
      description:
        "Record an action taken or planned as part of this student's follow-up.",

      type: "Intervention type",
      channel: "Channel",
      status: "Status",
      observation: "Notes",
      observationPlaceholder:
        "Describe the contact, guidance, referral or other action taken...",
      returnDate: "Follow-up date",
      returnDateOptional: "Optional",

      cancel: "Cancel",
      save: "Register intervention",
      saving: "Saving...",

      success: "Intervention registered successfully.",
      error: "The intervention could not be registered.",

      types: {
        CONTATO: "Contact",
        ORIENTACAO: "Guidance",
        REUNIAO: "Meeting",
        ENCAMINHAMENTO: "Referral",
        ACOMPANHAMENTO: "Follow-up",
        OUTRO: "Other",
      },

      channels: {
        WHATSAPP: "WhatsApp",
        LIGACAO: "Phone call",
        EMAIL: "Email",
        PRESENCIAL: "In person",
        VIDEOCHAMADA: "Video call",
        SISTEMA: "System",
        OUTRO: "Other",
      },

      statuses: {
        REGISTRADA: "Registered",
        AGUARDANDO_RETORNO: "Awaiting response",
        EM_ACOMPANHAMENTO: "In follow-up",
        RESOLVIDA: "Resolved",
        CANCELADA: "Cancelled",
      },

      history: {
        title: "Follow-up history",
        empty: "No interventions have been registered for this student.",
        registeredBy: "Registered by",
        returnScheduled: "Follow-up scheduled",
        recordedAt: "Recorded at",
      },
    },
  },

  "es-ES": {
    intervention: {
      title: "Registrar intervención",
      description:
        "Registra la acción realizada o planificada para el seguimiento de este alumno.",

      type: "Tipo de intervención",
      channel: "Canal",
      status: "Estado",
      observation: "Observación",
      observationPlaceholder:
        "Describe el contacto, orientación, derivación u otra acción realizada...",
      returnDate: "Fecha de seguimiento",
      returnDateOptional: "Opcional",

      cancel: "Cancelar",
      save: "Registrar intervención",
      saving: "Registrando...",

      success: "Intervención registrada correctamente.",
      error: "No se pudo registrar la intervención.",

      types: {
        CONTATO: "Contacto",
        ORIENTACAO: "Orientación",
        REUNIAO: "Reunión",
        ENCAMINHAMENTO: "Derivación",
        ACOMPANHAMENTO: "Seguimiento",
        OUTRO: "Otro",
      },

      channels: {
        WHATSAPP: "WhatsApp",
        LIGACAO: "Llamada",
        EMAIL: "Correo electrónico",
        PRESENCIAL: "Presencial",
        VIDEOCHAMADA: "Videollamada",
        SISTEMA: "Sistema",
        OUTRO: "Otro",
      },

      statuses: {
        REGISTRADA: "Registrada",
        AGUARDANDO_RETORNO: "Esperando respuesta",
        EM_ACOMPANHAMENTO: "En seguimiento",
        RESOLVIDA: "Resuelta",
        CANCELADA: "Cancelada",
      },

      history: {
        title: "Historial de seguimiento",
        empty: "No hay intervenciones registradas para este alumno.",
        registeredBy: "Registrado por",
        returnScheduled: "Seguimiento previsto",
        recordedAt: "Registrado el",
      },
    },
  },

  "fr-FR": {
    intervention: {
      title: "Enregistrer une intervention",
      description:
        "Enregistrez l'action réalisée ou prévue dans le cadre du suivi de cet étudiant.",

      type: "Type d'intervention",
      channel: "Canal",
      status: "Statut",
      observation: "Observation",
      observationPlaceholder:
        "Décrivez le contact, l'orientation, l'acheminement ou toute autre action réalisée...",
      returnDate: "Date de suivi",
      returnDateOptional: "Facultatif",

      cancel: "Annuler",
      save: "Enregistrer l'intervention",
      saving: "Enregistrement...",

      success: "Intervention enregistrée avec succès.",
      error: "Impossible d'enregistrer l'intervention.",

      types: {
        CONTATO: "Contact",
        ORIENTACAO: "Orientation",
        REUNIAO: "Réunion",
        ENCAMINHAMENTO: "Orientation vers un service",
        ACOMPANHAMENTO: "Suivi",
        OUTRO: "Autre",
      },

      channels: {
        WHATSAPP: "WhatsApp",
        LIGACAO: "Appel",
        EMAIL: "E-mail",
        PRESENCIAL: "En présentiel",
        VIDEOCHAMADA: "Appel vidéo",
        SISTEMA: "Système",
        OUTRO: "Autre",
      },

      statuses: {
        REGISTRADA: "Enregistrée",
        AGUARDANDO_RETORNO: "En attente de réponse",
        EM_ACOMPANHAMENTO: "En cours de suivi",
        RESOLVIDA: "Résolue",
        CANCELADA: "Annulée",
      },

      history: {
        title: "Historique du suivi",
        empty: "Aucune intervention enregistrée pour cet étudiant.",
        registeredBy: "Enregistré par",
        returnScheduled: "Suivi prévu",
        recordedAt: "Enregistré le",
      },
    },
  },
};

const pasta =
  path.join(
    process.cwd(),
    "messages"
  );

for (
  const [
    locale,
    conteudo,
  ] of Object.entries(
    traducoes
  )
) {
  const arquivo =
    path.join(
      pasta,
      `${locale}.json`
    );

  const json =
    JSON.parse(
      fs.readFileSync(
        arquivo,
        "utf8"
      )
    );

  if (
    !json.AdminStudentSuccess
  ) {
    throw new Error(
      `AdminStudentSuccess não encontrado em ${locale}.json`
    );
  }

  json.AdminStudentSuccess.intervention =
    conteudo.intervention;

  fs.writeFileSync(
    arquivo,
    `${JSON.stringify(
      json,
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(
    `✅ ${locale}.json atualizado`
  );
}

console.log(
  "\n✅ Traduções das intervenções do Student Success concluídas."
);