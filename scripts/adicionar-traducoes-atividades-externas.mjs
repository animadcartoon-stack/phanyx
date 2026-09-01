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
    eyebrow: "Gestão acadêmica",
    title: "Atividades externas",
    subtitle:
      "Planeje e acompanhe excursões, visitas técnicas, viagens pedagógicas, retiros, acampamentos e outras atividades fora da instituição.",
    newActivity: "Nova atividade",
    searchPlaceholder: "Buscar por título, destino, cidade ou país...",
    filters: {
      status: "Status",
      type: "Tipo",
      allStatuses: "Todos os status",
      allTypes: "Todos os tipos",
      clear: "Limpar filtros",
    },
    loading: "Carregando atividades externas...",
    retry: "Tentar novamente",
    empty: {
      title: "Nenhuma atividade encontrada",
      description:
        "Crie a primeira atividade externa ou altere os filtros da busca.",
    },
    results: {
      one: "{count} atividade encontrada",
      other: "{count} atividades encontradas",
    },
    labels: {
      destination: "Destino",
      departure: "Saída",
      return: "Retorno previsto",
      responsible: "Responsável",
      participants: "Participantes",
      authorizations: "Autorizações",
      legs: "Trechos",
      risks: "Riscos",
      noDestination: "Destino ainda não informado",
      noDate: "Ainda não definida",
      noResponsible: "Não informado",
      curricular: "Curricular",
      mandatory: "Obrigatória",
      international: "Internacional",
    },
    actions: {
      open: "Abrir atividade",
      previous: "Anterior",
      next: "Próxima",
    },
    status: {
      RASCUNHO: "Rascunho",
      PLANEJAMENTO: "Planejamento",
      AGUARDANDO_AUTORIZACOES: "Aguardando autorizações",
      CONFIRMADA: "Confirmada",
      EM_ANDAMENTO: "Em andamento",
      CONCLUIDA: "Concluída",
      CANCELADA: "Cancelada",
      ARQUIVADA: "Arquivada",
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
      OUTRA: "Outra",
    },
    errors: {
      load: "Não foi possível carregar as atividades externas.",
    },
  },

  "pt-PT": {
    eyebrow: "Gestão académica",
    title: "Atividades externas",
    subtitle:
      "Planeie e acompanhe excursões, visitas técnicas, viagens pedagógicas, retiros, acampamentos e outras atividades fora da instituição.",
    newActivity: "Nova atividade",
    searchPlaceholder: "Pesquisar por título, destino, cidade ou país...",
    filters: {
      status: "Estado",
      type: "Tipo",
      allStatuses: "Todos os estados",
      allTypes: "Todos os tipos",
      clear: "Limpar filtros",
    },
    loading: "A carregar atividades externas...",
    retry: "Tentar novamente",
    empty: {
      title: "Nenhuma atividade encontrada",
      description:
        "Crie a primeira atividade externa ou altere os filtros da pesquisa.",
    },
    results: {
      one: "{count} atividade encontrada",
      other: "{count} atividades encontradas",
    },
    labels: {
      destination: "Destino",
      departure: "Partida",
      return: "Regresso previsto",
      responsible: "Responsável",
      participants: "Participantes",
      authorizations: "Autorizações",
      legs: "Trajetos",
      risks: "Riscos",
      noDestination: "Destino ainda não indicado",
      noDate: "Ainda não definida",
      noResponsible: "Não indicado",
      curricular: "Curricular",
      mandatory: "Obrigatória",
      international: "Internacional",
    },
    actions: {
      open: "Abrir atividade",
      previous: "Anterior",
      next: "Seguinte",
    },
    status: {
      RASCUNHO: "Rascunho",
      PLANEJAMENTO: "Planeamento",
      AGUARDANDO_AUTORIZACOES: "A aguardar autorizações",
      CONFIRMADA: "Confirmada",
      EM_ANDAMENTO: "Em curso",
      CONCLUIDA: "Concluída",
      CANCELADA: "Cancelada",
      ARQUIVADA: "Arquivada",
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
      OUTRA: "Outra",
    },
    errors: {
      load: "Não foi possível carregar as atividades externas.",
    },
  },

  "en-US": {
    eyebrow: "Academic management",
    title: "External activities",
    subtitle:
      "Plan and monitor field trips, technical visits, educational travel, retreats, camps and other off-campus activities.",
    newActivity: "New activity",
    searchPlaceholder: "Search by title, destination, city or country...",
    filters: {
      status: "Status",
      type: "Type",
      allStatuses: "All statuses",
      allTypes: "All types",
      clear: "Clear filters",
    },
    loading: "Loading external activities...",
    retry: "Try again",
    empty: {
      title: "No activities found",
      description:
        "Create the first external activity or change the search filters.",
    },
    results: {
      one: "{count} activity found",
      other: "{count} activities found",
    },
    labels: {
      destination: "Destination",
      departure: "Departure",
      return: "Expected return",
      responsible: "Lead",
      participants: "Participants",
      authorizations: "Permissions",
      legs: "Travel legs",
      risks: "Risks",
      noDestination: "Destination not provided yet",
      noDate: "Not defined yet",
      noResponsible: "Not provided",
      curricular: "Curricular",
      mandatory: "Mandatory",
      international: "International",
    },
    actions: {
      open: "Open activity",
      previous: "Previous",
      next: "Next",
    },
    status: {
      RASCUNHO: "Draft",
      PLANEJAMENTO: "Planning",
      AGUARDANDO_AUTORIZACOES: "Awaiting permissions",
      CONFIRMADA: "Confirmed",
      EM_ANDAMENTO: "In progress",
      CONCLUIDA: "Completed",
      CANCELADA: "Cancelled",
      ARQUIVADA: "Archived",
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
      OUTRA: "Other",
    },
    errors: {
      load: "External activities could not be loaded.",
    },
  },

  "es-ES": {
    eyebrow: "Gestión académica",
    title: "Actividades externas",
    subtitle:
      "Planifica y supervisa excursiones, visitas técnicas, viajes educativos, retiros, campamentos y otras actividades fuera de la institución.",
    newActivity: "Nueva actividad",
    searchPlaceholder: "Buscar por título, destino, ciudad o país...",
    filters: {
      status: "Estado",
      type: "Tipo",
      allStatuses: "Todos los estados",
      allTypes: "Todos los tipos",
      clear: "Limpiar filtros",
    },
    loading: "Cargando actividades externas...",
    retry: "Intentar de nuevo",
    empty: {
      title: "No se encontraron actividades",
      description:
        "Crea la primera actividad externa o modifica los filtros de búsqueda.",
    },
    results: {
      one: "{count} actividad encontrada",
      other: "{count} actividades encontradas",
    },
    labels: {
      destination: "Destino",
      departure: "Salida",
      return: "Regreso previsto",
      responsible: "Responsable",
      participants: "Participantes",
      authorizations: "Autorizaciones",
      legs: "Trayectos",
      risks: "Riesgos",
      noDestination: "Destino aún no indicado",
      noDate: "Aún no definida",
      noResponsible: "No indicado",
      curricular: "Curricular",
      mandatory: "Obligatoria",
      international: "Internacional",
    },
    actions: {
      open: "Abrir actividad",
      previous: "Anterior",
      next: "Siguiente",
    },
    status: {
      RASCUNHO: "Borrador",
      PLANEJAMENTO: "Planificación",
      AGUARDANDO_AUTORIZACOES: "Esperando autorizaciones",
      CONFIRMADA: "Confirmada",
      EM_ANDAMENTO: "En curso",
      CONCLUIDA: "Finalizada",
      CANCELADA: "Cancelada",
      ARQUIVADA: "Archivada",
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
      OUTRA: "Otra",
    },
    errors: {
      load: "No se pudieron cargar las actividades externas.",
    },
  },

  "fr-FR": {
    eyebrow: "Gestion académique",
    title: "Activités extérieures",
    subtitle:
      "Planifiez et suivez les sorties scolaires, visites techniques, voyages pédagogiques, retraites, camps et autres activités hors établissement.",
    newActivity: "Nouvelle activité",
    searchPlaceholder: "Rechercher par titre, destination, ville ou pays...",
    filters: {
      status: "Statut",
      type: "Type",
      allStatuses: "Tous les statuts",
      allTypes: "Tous les types",
      clear: "Effacer les filtres",
    },
    loading: "Chargement des activités extérieures...",
    retry: "Réessayer",
    empty: {
      title: "Aucune activité trouvée",
      description:
        "Créez la première activité extérieure ou modifiez les filtres de recherche.",
    },
    results: {
      one: "{count} activité trouvée",
      other: "{count} activités trouvées",
    },
    labels: {
      destination: "Destination",
      departure: "Départ",
      return: "Retour prévu",
      responsible: "Responsable",
      participants: "Participants",
      authorizations: "Autorisations",
      legs: "Trajets",
      risks: "Risques",
      noDestination: "Destination non renseignée",
      noDate: "Pas encore définie",
      noResponsible: "Non renseigné",
      curricular: "Pédagogique",
      mandatory: "Obligatoire",
      international: "International",
    },
    actions: {
      open: "Ouvrir l’activité",
      previous: "Précédente",
      next: "Suivante",
    },
    status: {
      RASCUNHO: "Brouillon",
      PLANEJAMENTO: "Planification",
      AGUARDANDO_AUTORIZACOES: "En attente des autorisations",
      CONFIRMADA: "Confirmée",
      EM_ANDAMENTO: "En cours",
      CONCLUIDA: "Terminée",
      CANCELADA: "Annulée",
      ARQUIVADA: "Archivée",
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
      OUTRA: "Autre",
    },
    errors: {
      load: "Impossible de charger les activités extérieures.",
    },
  },
};

const namespace = "AdminExternalActivities";

for (const [locale, arquivoRelativo] of Object.entries(arquivos)) {
  const arquivo = path.resolve(process.cwd(), arquivoRelativo);

  if (!fs.existsSync(arquivo)) {
    throw new Error(`Arquivo não encontrado: ${arquivoRelativo}`);
  }

  const original = fs.readFileSync(arquivo, "utf8");
  const dados = JSON.parse(original);

  if (Object.prototype.hasOwnProperty.call(dados, namespace)) {
    console.log(`ℹ️ ${locale}: ${namespace} já existe. Nada alterado.`);
    continue;
  }

  const eol = original.includes("\r\n") ? "\r\n" : "\n";

  const semEspacosFinais = original.trimEnd();

  if (!semEspacosFinais.endsWith("}")) {
    throw new Error(`JSON inválido em ${arquivoRelativo}`);
  }

  const blocoObjeto = JSON.stringify(
    traducoes[locale],
    null,
    2
  )
    .split("\n")
    .map((linha, indice) =>
      indice === 0 ? linha : `  ${linha}`
    )
    .join(eol);

  const bloco =
    `,${eol}  "${namespace}": ${blocoObjeto}`;

  const indiceUltimaChave =
    semEspacosFinais.lastIndexOf("}");

  const atualizado =
    semEspacosFinais.slice(0, indiceUltimaChave) +
    bloco +
    eol +
    "}" +
    original.slice(semEspacosFinais.length);

  JSON.parse(atualizado);

  fs.writeFileSync(
    arquivo,
    atualizado,
    "utf8"
  );

  console.log(`✅ ${locale}: ${namespace} adicionado.`);
}

console.log("✅ Traduções de Atividades Externas concluídas.");