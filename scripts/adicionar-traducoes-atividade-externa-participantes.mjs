import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    title: "Participantes",
    description:
      "Gerencie os alunos convidados para esta atividade e acompanhe participação, autorização, presença e pagamento.",
    loading: "Carregando participantes...",
    loadError: "Não foi possível carregar os participantes.",
    retry: "Tentar novamente",

    current: {
      title: "Participantes da atividade",
      count: "{count} participante(s)",
      empty: "Nenhum participante foi adicionado ainda."
    },

    available: {
      title: "Alunos disponíveis",
      description:
        "Alunos ativos das turmas vinculadas à atividade.",
      count: "{count} aluno(s) disponível(is)",
      empty:
        "Não há outros alunos disponíveis nas turmas desta atividade.",
      search: "Buscar por nome, matrícula ou turma...",
      selectAll: "Selecionar todos",
      clearSelection: "Limpar seleção",
      selected: "{count} selecionado(s)",
      addSelected: "Adicionar selecionados",
      adding: "Adicionando..."
    },

    fields: {
      registration: "Matrícula",
      classes: "Turmas",
      participation: "Participação",
      attendance: "Presença",
      payment: "Pagamento",
      origin: "Origem"
    },

    noRegistration: "Sem matrícula informada",

    participation: {
      CONVIDADO: "Convidado",
      AGUARDANDO_AUTORIZACAO: "Aguardando autorização",
      CONFIRMADO: "Confirmado",
      RECUSADO: "Recusado",
      CANCELADO: "Cancelado"
    },

    attendance: {
      NAO_REGISTRADA: "Não registrada",
      PRESENTE: "Presente",
      AUSENTE: "Ausente",
      SAIDA_ANTECIPADA: "Saída antecipada"
    },

    payment: {
      NAO_APLICAVEL: "Não aplicável",
      PENDENTE: "Pendente",
      PARCIAL: "Parcial",
      PAGO: "Pago",
      ISENTO: "Isento",
      REEMBOLSADO: "Reembolsado",
      CANCELADO: "Cancelado"
    },

    origin: {
      TURMA: "Turma",
      MANUAL: "Manual",
      IMPORTACAO: "Importação"
    },

    messages: {
      added: "{count} participante(s) adicionado(s).",
      noneAdded: "Nenhum novo participante foi adicionado.",
      addError: "Não foi possível adicionar os participantes."
    }
  },

  "pt-PT": {
    title: "Participantes",
    description:
      "Gira os alunos convidados para esta atividade e acompanhe participação, autorização, presença e pagamento.",
    loading: "A carregar participantes...",
    loadError: "Não foi possível carregar os participantes.",
    retry: "Tentar novamente",

    current: {
      title: "Participantes da atividade",
      count: "{count} participante(s)",
      empty: "Ainda não foi adicionado nenhum participante."
    },

    available: {
      title: "Alunos disponíveis",
      description:
        "Alunos ativos das turmas associadas à atividade.",
      count: "{count} aluno(s) disponível(is)",
      empty:
        "Não existem outros alunos disponíveis nas turmas desta atividade.",
      search: "Pesquisar por nome, matrícula ou turma...",
      selectAll: "Selecionar todos",
      clearSelection: "Limpar seleção",
      selected: "{count} selecionado(s)",
      addSelected: "Adicionar selecionados",
      adding: "A adicionar..."
    },

    fields: {
      registration: "Matrícula",
      classes: "Turmas",
      participation: "Participação",
      attendance: "Presença",
      payment: "Pagamento",
      origin: "Origem"
    },

    noRegistration: "Sem matrícula indicada",

    participation: {
      CONVIDADO: "Convidado",
      AGUARDANDO_AUTORIZACAO: "A aguardar autorização",
      CONFIRMADO: "Confirmado",
      RECUSADO: "Recusado",
      CANCELADO: "Cancelado"
    },

    attendance: {
      NAO_REGISTRADA: "Não registada",
      PRESENTE: "Presente",
      AUSENTE: "Ausente",
      SAIDA_ANTECIPADA: "Saída antecipada"
    },

    payment: {
      NAO_APLICAVEL: "Não aplicável",
      PENDENTE: "Pendente",
      PARCIAL: "Parcial",
      PAGO: "Pago",
      ISENTO: "Isento",
      REEMBOLSADO: "Reembolsado",
      CANCELADO: "Cancelado"
    },

    origin: {
      TURMA: "Turma",
      MANUAL: "Manual",
      IMPORTACAO: "Importação"
    },

    messages: {
      added: "{count} participante(s) adicionado(s).",
      noneAdded: "Nenhum novo participante foi adicionado.",
      addError: "Não foi possível adicionar os participantes."
    }
  },

  "en-US": {
    title: "Participants",
    description:
      "Manage students invited to this activity and track participation, permission, attendance and payment.",
    loading: "Loading participants...",
    loadError: "Participants could not be loaded.",
    retry: "Try again",

    current: {
      title: "Activity participants",
      count: "{count} participant(s)",
      empty: "No participants have been added yet."
    },

    available: {
      title: "Available students",
      description:
        "Active students from classes linked to this activity.",
      count: "{count} student(s) available",
      empty:
        "There are no other available students in this activity's classes.",
      search: "Search by name, registration or class...",
      selectAll: "Select all",
      clearSelection: "Clear selection",
      selected: "{count} selected",
      addSelected: "Add selected",
      adding: "Adding..."
    },

    fields: {
      registration: "Registration",
      classes: "Classes",
      participation: "Participation",
      attendance: "Attendance",
      payment: "Payment",
      origin: "Source"
    },

    noRegistration: "No registration provided",

    participation: {
      CONVIDADO: "Invited",
      AGUARDANDO_AUTORIZACAO: "Awaiting permission",
      CONFIRMADO: "Confirmed",
      RECUSADO: "Declined",
      CANCELADO: "Cancelled"
    },

    attendance: {
      NAO_REGISTRADA: "Not recorded",
      PRESENTE: "Present",
      AUSENTE: "Absent",
      SAIDA_ANTECIPADA: "Left early"
    },

    payment: {
      NAO_APLICAVEL: "Not applicable",
      PENDENTE: "Pending",
      PARCIAL: "Partial",
      PAGO: "Paid",
      ISENTO: "Waived",
      REEMBOLSADO: "Refunded",
      CANCELADO: "Cancelled"
    },

    origin: {
      TURMA: "Class",
      MANUAL: "Manual",
      IMPORTACAO: "Import"
    },

    messages: {
      added: "{count} participant(s) added.",
      noneAdded: "No new participants were added.",
      addError: "Participants could not be added."
    }
  },

  "es-ES": {
    title: "Participantes",
    description:
      "Gestiona los alumnos invitados a esta actividad y controla participación, autorización, asistencia y pago.",
    loading: "Cargando participantes...",
    loadError: "No se pudieron cargar los participantes.",
    retry: "Intentar de nuevo",

    current: {
      title: "Participantes de la actividad",
      count: "{count} participante(s)",
      empty: "Todavía no se ha añadido ningún participante."
    },

    available: {
      title: "Alumnos disponibles",
      description:
        "Alumnos activos de las clases vinculadas a esta actividad.",
      count: "{count} alumno(s) disponible(s)",
      empty:
        "No hay más alumnos disponibles en las clases de esta actividad.",
      search: "Buscar por nombre, matrícula o clase...",
      selectAll: "Seleccionar todos",
      clearSelection: "Limpiar selección",
      selected: "{count} seleccionado(s)",
      addSelected: "Añadir seleccionados",
      adding: "Añadiendo..."
    },

    fields: {
      registration: "Matrícula",
      classes: "Clases",
      participation: "Participación",
      attendance: "Asistencia",
      payment: "Pago",
      origin: "Origen"
    },

    noRegistration: "Sin matrícula informada",

    participation: {
      CONVIDADO: "Invitado",
      AGUARDANDO_AUTORIZACAO: "Esperando autorización",
      CONFIRMADO: "Confirmado",
      RECUSADO: "Rechazado",
      CANCELADO: "Cancelado"
    },

    attendance: {
      NAO_REGISTRADA: "No registrada",
      PRESENTE: "Presente",
      AUSENTE: "Ausente",
      SAIDA_ANTECIPADA: "Salida anticipada"
    },

    payment: {
      NAO_APLICAVEL: "No aplicable",
      PENDENTE: "Pendiente",
      PARCIAL: "Parcial",
      PAGO: "Pagado",
      ISENTO: "Exento",
      REEMBOLSADO: "Reembolsado",
      CANCELADO: "Cancelado"
    },

    origin: {
      TURMA: "Clase",
      MANUAL: "Manual",
      IMPORTACAO: "Importación"
    },

    messages: {
      added: "{count} participante(s) añadido(s).",
      noneAdded: "No se añadió ningún participante nuevo.",
      addError: "No se pudieron añadir los participantes."
    }
  },

  "fr-FR": {
    title: "Participants",
    description:
      "Gérez les élèves invités à cette activité et suivez la participation, les autorisations, la présence et le paiement.",
    loading: "Chargement des participants...",
    loadError: "Impossible de charger les participants.",
    retry: "Réessayer",

    current: {
      title: "Participants à l’activité",
      count: "{count} participant(s)",
      empty: "Aucun participant n’a encore été ajouté."
    },

    available: {
      title: "Élèves disponibles",
      description:
        "Élèves actifs des classes associées à cette activité.",
      count: "{count} élève(s) disponible(s)",
      empty:
        "Aucun autre élève n’est disponible dans les classes de cette activité.",
      search: "Rechercher par nom, inscription ou classe...",
      selectAll: "Tout sélectionner",
      clearSelection: "Effacer la sélection",
      selected: "{count} sélectionné(s)",
      addSelected: "Ajouter la sélection",
      adding: "Ajout en cours..."
    },

    fields: {
      registration: "Inscription",
      classes: "Classes",
      participation: "Participation",
      attendance: "Présence",
      payment: "Paiement",
      origin: "Origine"
    },

    noRegistration: "Aucune inscription renseignée",

    participation: {
      CONVIDADO: "Invité",
      AGUARDANDO_AUTORIZACAO: "En attente d’autorisation",
      CONFIRMADO: "Confirmé",
      RECUSADO: "Refusé",
      CANCELADO: "Annulé"
    },

    attendance: {
      NAO_REGISTRADA: "Non enregistrée",
      PRESENTE: "Présent",
      AUSENTE: "Absent",
      SAIDA_ANTECIPADA: "Départ anticipé"
    },

    payment: {
      NAO_APLICAVEL: "Non applicable",
      PENDENTE: "En attente",
      PARCIAL: "Partiel",
      PAGO: "Payé",
      ISENTO: "Exonéré",
      REEMBOLSADO: "Remboursé",
      CANCELADO: "Annulé"
    },

    origin: {
      TURMA: "Classe",
      MANUAL: "Manuel",
      IMPORTACAO: "Importation"
    },

    messages: {
      added: "{count} participant(s) ajouté(s).",
      noneAdded: "Aucun nouveau participant n’a été ajouté.",
      addError: "Impossible d’ajouter les participants."
    }
  }
};

const namespace =
  "AdminExternalActivityParticipants";

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
  "✅ Traduções de participantes concluídas."
);