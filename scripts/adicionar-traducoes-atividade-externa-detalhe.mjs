import fs from "node:fs";
import path from "node:path";

const arquivos = {
  "pt-BR": "messages/pt-BR.json",
  "pt-PT": "messages/pt-PT.json",
  "en-US": "messages/en-US.json",
  "es-ES": "messages/es-ES.json",
  "fr-FR": "messages/fr-FR.json",
};

const traducoes = {
  "pt-BR": {
    back: "Voltar para atividades externas",
    loading: "Carregando atividade...",
    notFound: "Atividade não encontrada.",
    retry: "Tentar novamente",
    status: "Status",
    destination: "Destino",
    departure: "Saída",
    expectedReturn: "Retorno previsto",
    responsible: "Responsável principal",
    campus: "Polo / Unidade",
    classes: "Turmas participantes",
    noCampus: "Sem polo específico",
    noResponsible: "Não informado",
    noDestination: "Destino ainda não informado",
    noDate: "Ainda não definida",
    curricular: "Curricular",
    mandatory: "Obrigatória",
    international: "Internacional",
    tabs: {
      overview: "Visão geral",
      participants: "Participantes",
      permissions: "Autorizações",
      team: "Equipe",
      transport: "Transporte",
      safety: "Segurança",
      health: "Saúde",
      documents: "Documentos"
    },
    counters: {
      participants: "Participantes",
      permissions: "Autorizações",
      team: "Equipe",
      legs: "Trechos",
      risks: "Riscos",
      documents: "Documentos",
      checkpoints: "Checkpoints"
    },
    overview: {
      planning: "Planejamento da atividade",
      planningDescription: "Resumo das principais informações cadastradas.",
      educationalObjective: "Objetivo pedagógico",
      description: "Descrição",
      rules: "Regras e participação",
      requiresAuthorization: "Exige autorização",
      payment: "Há cobrança",
      checkin: "Controla presença",
      yes: "Sim",
      no: "Não"
    },
    sectionPlaceholder: {
      title: "Área em preparação",
      description:
        "Esta área já faz parte da estrutura da atividade e será habilitada à medida que configurarmos os recursos específicos."
    },
    statusValues: {
      RASCUNHO: "Rascunho",
      PLANEJAMENTO: "Planejamento",
      AGUARDANDO_AUTORIZACOES: "Aguardando autorizações",
      CONFIRMADA: "Confirmada",
      EM_ANDAMENTO: "Em andamento",
      CONCLUIDA: "Concluída",
      CANCELADA: "Cancelada",
      ARQUIVADA: "Arquivada"
    },
    types: {
      EXCURSAO: "Excursão",
      VISITA_TECNICA: "Visita técnica",
      VIAGEM_PEDAGOGICA: "Viagem pedagógica",
      ACAMPAMENTO: "Acampamento",
      RETIRO: "Retiro",
      COMPETICAO: "Competição",
      INTERCAMBIO: "Intercâmbio",
      EVENTO_ESPORTIVO: "Evento esportivo",
      ATIVIDADE_COMUNITARIA: "Atividade comunitária",
      VIAGEM_INTERNACIONAL: "Viagem internacional",
      OUTRA: "Outra"
    }
  },

  "pt-PT": {
    back: "Voltar às atividades externas",
    loading: "A carregar atividade...",
    notFound: "Atividade não encontrada.",
    retry: "Tentar novamente",
    status: "Estado",
    destination: "Destino",
    departure: "Partida",
    expectedReturn: "Regresso previsto",
    responsible: "Responsável principal",
    campus: "Polo / Unidade",
    classes: "Turmas participantes",
    noCampus: "Sem polo específico",
    noResponsible: "Não indicado",
    noDestination: "Destino ainda não indicado",
    noDate: "Ainda não definida",
    curricular: "Curricular",
    mandatory: "Obrigatória",
    international: "Internacional",
    tabs: {
      overview: "Visão geral",
      participants: "Participantes",
      permissions: "Autorizações",
      team: "Equipa",
      transport: "Transporte",
      safety: "Segurança",
      health: "Saúde",
      documents: "Documentos"
    },
    counters: {
      participants: "Participantes",
      permissions: "Autorizações",
      team: "Equipa",
      legs: "Trajetos",
      risks: "Riscos",
      documents: "Documentos",
      checkpoints: "Checkpoints"
    },
    overview: {
      planning: "Planeamento da atividade",
      planningDescription: "Resumo das principais informações registadas.",
      educationalObjective: "Objetivo pedagógico",
      description: "Descrição",
      rules: "Regras e participação",
      requiresAuthorization: "Exige autorização",
      payment: "Existe cobrança",
      checkin: "Controla presença",
      yes: "Sim",
      no: "Não"
    },
    sectionPlaceholder: {
      title: "Área em preparação",
      description:
        "Esta área já faz parte da estrutura da atividade e será ativada à medida que configurarmos os recursos específicos."
    },
    statusValues: {
      RASCUNHO: "Rascunho",
      PLANEJAMENTO: "Planeamento",
      AGUARDANDO_AUTORIZACOES: "A aguardar autorizações",
      CONFIRMADA: "Confirmada",
      EM_ANDAMENTO: "Em curso",
      CONCLUIDA: "Concluída",
      CANCELADA: "Cancelada",
      ARQUIVADA: "Arquivada"
    },
    types: {
      EXCURSAO: "Excursão",
      VISITA_TECNICA: "Visita técnica",
      VIAGEM_PEDAGOGICA: "Viagem pedagógica",
      ACAMPAMENTO: "Acampamento",
      RETIRO: "Retiro",
      COMPETICAO: "Competição",
      INTERCAMBIO: "Intercâmbio",
      EVENTO_ESPORTIVO: "Evento desportivo",
      ATIVIDADE_COMUNITARIA: "Atividade comunitária",
      VIAGEM_INTERNACIONAL: "Viagem internacional",
      OUTRA: "Outra"
    }
  },

  "en-US": {
    back: "Back to external activities",
    loading: "Loading activity...",
    notFound: "Activity not found.",
    retry: "Try again",
    status: "Status",
    destination: "Destination",
    departure: "Departure",
    expectedReturn: "Expected return",
    responsible: "Lead",
    campus: "Campus / Unit",
    classes: "Participating classes",
    noCampus: "No specific campus",
    noResponsible: "Not provided",
    noDestination: "Destination not provided yet",
    noDate: "Not defined yet",
    curricular: "Curricular",
    mandatory: "Mandatory",
    international: "International",
    tabs: {
      overview: "Overview",
      participants: "Participants",
      permissions: "Permissions",
      team: "Team",
      transport: "Transportation",
      safety: "Safety",
      health: "Health",
      documents: "Documents"
    },
    counters: {
      participants: "Participants",
      permissions: "Permissions",
      team: "Team",
      legs: "Travel legs",
      risks: "Risks",
      documents: "Documents",
      checkpoints: "Checkpoints"
    },
    overview: {
      planning: "Activity planning",
      planningDescription: "Summary of the main information registered.",
      educationalObjective: "Educational objective",
      description: "Description",
      rules: "Rules and participation",
      requiresAuthorization: "Permission required",
      payment: "Participant fee",
      checkin: "Attendance tracking",
      yes: "Yes",
      no: "No"
    },
    sectionPlaceholder: {
      title: "Area being prepared",
      description:
        "This area is already part of the activity structure and will be enabled as its specific features are configured."
    },
    statusValues: {
      RASCUNHO: "Draft",
      PLANEJAMENTO: "Planning",
      AGUARDANDO_AUTORIZACOES: "Awaiting permissions",
      CONFIRMADA: "Confirmed",
      EM_ANDAMENTO: "In progress",
      CONCLUIDA: "Completed",
      CANCELADA: "Cancelled",
      ARQUIVADA: "Archived"
    },
    types: {
      EXCURSAO: "Field trip",
      VISITA_TECNICA: "Technical visit",
      VIAGEM_PEDAGOGICA: "Educational trip",
      ACAMPAMENTO: "Camp",
      RETIRO: "Retreat",
      COMPETICAO: "Competition",
      INTERCAMBIO: "Exchange program",
      EVENTO_ESPORTIVO: "Sports event",
      ATIVIDADE_COMUNITARIA: "Community activity",
      VIAGEM_INTERNACIONAL: "International trip",
      OUTRA: "Other"
    }
  },

  "es-ES": {
    back: "Volver a actividades externas",
    loading: "Cargando actividad...",
    notFound: "Actividad no encontrada.",
    retry: "Intentar de nuevo",
    status: "Estado",
    destination: "Destino",
    departure: "Salida",
    expectedReturn: "Regreso previsto",
    responsible: "Responsable principal",
    campus: "Sede / Unidad",
    classes: "Clases participantes",
    noCampus: "Sin sede específica",
    noResponsible: "No indicado",
    noDestination: "Destino aún no indicado",
    noDate: "Aún no definida",
    curricular: "Curricular",
    mandatory: "Obligatoria",
    international: "Internacional",
    tabs: {
      overview: "Resumen",
      participants: "Participantes",
      permissions: "Autorizaciones",
      team: "Equipo",
      transport: "Transporte",
      safety: "Seguridad",
      health: "Salud",
      documents: "Documentos"
    },
    counters: {
      participants: "Participantes",
      permissions: "Autorizaciones",
      team: "Equipo",
      legs: "Trayectos",
      risks: "Riesgos",
      documents: "Documentos",
      checkpoints: "Checkpoints"
    },
    overview: {
      planning: "Planificación de la actividad",
      planningDescription: "Resumen de la información principal registrada.",
      educationalObjective: "Objetivo educativo",
      description: "Descripción",
      rules: "Reglas y participación",
      requiresAuthorization: "Requiere autorización",
      payment: "Hay cobro",
      checkin: "Controla asistencia",
      yes: "Sí",
      no: "No"
    },
    sectionPlaceholder: {
      title: "Área en preparación",
      description:
        "Esta área ya forma parte de la estructura de la actividad y se habilitará a medida que configuremos sus recursos específicos."
    },
    statusValues: {
      RASCUNHO: "Borrador",
      PLANEJAMENTO: "Planificación",
      AGUARDANDO_AUTORIZACOES: "Esperando autorizaciones",
      CONFIRMADA: "Confirmada",
      EM_ANDAMENTO: "En curso",
      CONCLUIDA: "Finalizada",
      CANCELADA: "Cancelada",
      ARQUIVADA: "Archivada"
    },
    types: {
      EXCURSAO: "Excursión",
      VISITA_TECNICA: "Visita técnica",
      VIAGEM_PEDAGOGICA: "Viaje educativo",
      ACAMPAMENTO: "Campamento",
      RETIRO: "Retiro",
      COMPETICAO: "Competición",
      INTERCAMBIO: "Intercambio",
      EVENTO_ESPORTIVO: "Evento deportivo",
      ATIVIDADE_COMUNITARIA: "Actividad comunitaria",
      VIAGEM_INTERNACIONAL: "Viaje internacional",
      OUTRA: "Otra"
    }
  },

  "fr-FR": {
    back: "Retour aux activités extérieures",
    loading: "Chargement de l’activité...",
    notFound: "Activité introuvable.",
    retry: "Réessayer",
    status: "Statut",
    destination: "Destination",
    departure: "Départ",
    expectedReturn: "Retour prévu",
    responsible: "Responsable principal",
    campus: "Campus / Unité",
    classes: "Classes participantes",
    noCampus: "Aucun campus spécifique",
    noResponsible: "Non renseigné",
    noDestination: "Destination non renseignée",
    noDate: "Pas encore définie",
    curricular: "Pédagogique",
    mandatory: "Obligatoire",
    international: "International",
    tabs: {
      overview: "Vue générale",
      participants: "Participants",
      permissions: "Autorisations",
      team: "Équipe",
      transport: "Transport",
      safety: "Sécurité",
      health: "Santé",
      documents: "Documents"
    },
    counters: {
      participants: "Participants",
      permissions: "Autorisations",
      team: "Équipe",
      legs: "Trajets",
      risks: "Risques",
      documents: "Documents",
      checkpoints: "Checkpoints"
    },
    overview: {
      planning: "Planification de l’activité",
      planningDescription: "Résumé des principales informations enregistrées.",
      educationalObjective: "Objectif pédagogique",
      description: "Description",
      rules: "Règles et participation",
      requiresAuthorization: "Autorisation requise",
      payment: "Participation financière",
      checkin: "Contrôle de présence",
      yes: "Oui",
      no: "Non"
    },
    sectionPlaceholder: {
      title: "Zone en préparation",
      description:
        "Cette zone fait déjà partie de la structure de l’activité et sera activée au fur et à mesure de la configuration de ses fonctionnalités."
    },
    statusValues: {
      RASCUNHO: "Brouillon",
      PLANEJAMENTO: "Planification",
      AGUARDANDO_AUTORIZACOES: "En attente des autorisations",
      CONFIRMADA: "Confirmée",
      EM_ANDAMENTO: "En cours",
      CONCLUIDA: "Terminée",
      CANCELADA: "Annulée",
      ARQUIVADA: "Archivée"
    },
    types: {
      EXCURSAO: "Sortie scolaire",
      VISITA_TECNICA: "Visite technique",
      VIAGEM_PEDAGOGICA: "Voyage pédagogique",
      ACAMPAMENTO: "Camp",
      RETIRO: "Retraite",
      COMPETICAO: "Compétition",
      INTERCAMBIO: "Échange",
      EVENTO_ESPORTIVO: "Événement sportif",
      ATIVIDADE_COMUNITARIA: "Activité communautaire",
      VIAGEM_INTERNACIONAL: "Voyage international",
      OUTRA: "Autre"
    }
  }
};

const namespace = "AdminExternalActivityDetail";

for (const [locale, arquivoRelativo] of Object.entries(arquivos)) {
  const arquivo = path.resolve(process.cwd(), arquivoRelativo);
  const original = fs.readFileSync(arquivo, "utf8");
  const dados = JSON.parse(original);

  if (Object.prototype.hasOwnProperty.call(dados, namespace)) {
    console.log(`ℹ️ ${locale}: ${namespace} já existe.`);
    continue;
  }

  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  const semEspacosFinais = original.trimEnd();
  const ultimoFechamento = semEspacosFinais.lastIndexOf("}");

  const objeto = JSON.stringify(traducoes[locale], null, 2)
    .split("\n")
    .map((linha, indice) => (indice === 0 ? linha : `  ${linha}`))
    .join(eol);

  const atualizado =
    semEspacosFinais.slice(0, ultimoFechamento) +
    `,${eol}  "${namespace}": ${objeto}${eol}` +
    "}" +
    original.slice(semEspacosFinais.length);

  JSON.parse(atualizado);
  fs.writeFileSync(arquivo, atualizado, "utf8");

  console.log(`✅ ${locale}: ${namespace} adicionado.`);
}

console.log("✅ Traduções do detalhe da atividade concluídas.");