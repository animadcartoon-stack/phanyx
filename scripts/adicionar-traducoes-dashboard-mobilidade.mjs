import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    eyebrow: "Mobilidade acadêmica",
    title: "Mobilidade Internacional",
    subtitle:
      "Gerencie instituições parceiras, convênios, programas, oportunidades e candidaturas de mobilidade acadêmica em um único lugar.",
    loading: "Carregando o painel de mobilidade...",
    metrics: {
      partners: "Instituições parceiras",
      agreements: "Convênios ativos",
      programs: "Programas ativos",
      openOffers: "Inscrições abertas",
      applications: "Candidaturas",
      pendingApplications: "Candidaturas pendentes",
      approvedApplications: "Candidaturas aprovadas",
      pendingDocuments: "Documentos pendentes"
    },
    sections: {
      indicators: "Indicadores de Mobilidade Internacional",
      deadlines: "Próximos prazos",
      deadlinesDescription:
        "Oportunidades com inscrições programadas ou abertas.",
      recentApplications: "Candidaturas recentes",
      recentApplicationsDescription:
        "Últimas candidaturas registradas no setor.",
      quickActions: "Áreas da Mobilidade",
      quickActionsDescription:
        "Os próximos módulos serão ativados à medida que forem implantados."
    },
    empty: {
      deadlines: "Nenhum prazo de inscrição próximo.",
      applications: "Nenhuma candidatura registrada ainda."
    },
    deadline: {
      until: "Inscrições até {date}"
    },
    actions: {
      refresh: "Atualizar",
      retry: "Tentar novamente",
      partners: "Instituições Parceiras",
      agreements: "Convênios",
      programs: "Programas",
      offers: "Ofertas / Editais",
      applications: "Candidaturas",
      comingSoon: "Em implantação"
    },
    statuses: {
      draft: "Rascunho",
      submitted: "Enviada",
      underReview: "Em análise",
      documentsPending: "Documentação pendente",
      eligible: "Elegível",
      ineligible: "Inelegível",
      selection: "Em seleção",
      ranked: "Classificada",
      waitingList: "Lista de espera",
      approved: "Aprovada",
      rejected: "Reprovada",
      withdrawn: "Desistente",
      cancelled: "Cancelada"
    },
    errors: {
      title: "Não foi possível carregar a Mobilidade Internacional",
      load: "O painel de Mobilidade Internacional não pôde ser carregado.",
      unauthorized: "Sua sessão não está autenticada.",
      forbidden: "Você não possui permissão para acessar este setor."
    }
  },

  "pt-PT": {
    eyebrow: "Mobilidade académica",
    title: "Mobilidade Internacional",
    subtitle:
      "Gira instituições parceiras, protocolos, programas, oportunidades e candidaturas de mobilidade académica num único local.",
    loading: "A carregar o painel de mobilidade...",
    metrics: {
      partners: "Instituições parceiras",
      agreements: "Protocolos ativos",
      programs: "Programas ativos",
      openOffers: "Candidaturas abertas",
      applications: "Candidaturas",
      pendingApplications: "Candidaturas pendentes",
      approvedApplications: "Candidaturas aprovadas",
      pendingDocuments: "Documentos pendentes"
    },
    sections: {
      indicators: "Indicadores de Mobilidade Internacional",
      deadlines: "Próximos prazos",
      deadlinesDescription:
        "Oportunidades com candidaturas programadas ou abertas.",
      recentApplications: "Candidaturas recentes",
      recentApplicationsDescription:
        "Últimas candidaturas registadas no setor.",
      quickActions: "Áreas da Mobilidade",
      quickActionsDescription:
        "Os próximos módulos serão ativados à medida que forem implementados."
    },
    empty: {
      deadlines: "Não existem prazos de candidatura próximos.",
      applications: "Ainda não existem candidaturas registadas."
    },
    deadline: {
      until: "Candidaturas até {date}"
    },
    actions: {
      refresh: "Atualizar",
      retry: "Tentar novamente",
      partners: "Instituições Parceiras",
      agreements: "Protocolos",
      programs: "Programas",
      offers: "Ofertas / Editais",
      applications: "Candidaturas",
      comingSoon: "Em implementação"
    },
    statuses: {
      draft: "Rascunho",
      submitted: "Enviada",
      underReview: "Em análise",
      documentsPending: "Documentação pendente",
      eligible: "Elegível",
      ineligible: "Não elegível",
      selection: "Em seleção",
      ranked: "Classificada",
      waitingList: "Lista de espera",
      approved: "Aprovada",
      rejected: "Reprovada",
      withdrawn: "Desistência",
      cancelled: "Cancelada"
    },
    errors: {
      title: "Não foi possível carregar a Mobilidade Internacional",
      load: "O painel de Mobilidade Internacional não pôde ser carregado.",
      unauthorized: "A sua sessão não está autenticada.",
      forbidden: "Não possui permissão para aceder a este setor."
    }
  },

  "en-US": {
    eyebrow: "Academic mobility",
    title: "International Mobility",
    subtitle:
      "Manage partner institutions, agreements, programs, opportunities, and academic mobility applications in one place.",
    loading: "Loading mobility dashboard...",
    metrics: {
      partners: "Partner institutions",
      agreements: "Active agreements",
      programs: "Active programs",
      openOffers: "Open applications",
      applications: "Applications",
      pendingApplications: "Pending applications",
      approvedApplications: "Approved applications",
      pendingDocuments: "Pending documents"
    },
    sections: {
      indicators: "International Mobility indicators",
      deadlines: "Upcoming deadlines",
      deadlinesDescription:
        "Opportunities with scheduled or currently open application periods.",
      recentApplications: "Recent applications",
      recentApplicationsDescription:
        "Latest applications registered in the mobility sector.",
      quickActions: "Mobility areas",
      quickActionsDescription:
        "Additional modules will become available as they are implemented."
    },
    empty: {
      deadlines: "There are no upcoming application deadlines.",
      applications: "No applications have been registered yet."
    },
    deadline: {
      until: "Applications close {date}"
    },
    actions: {
      refresh: "Refresh",
      retry: "Try again",
      partners: "Partner Institutions",
      agreements: "Agreements",
      programs: "Programs",
      offers: "Opportunities / Calls",
      applications: "Applications",
      comingSoon: "Being implemented"
    },
    statuses: {
      draft: "Draft",
      submitted: "Submitted",
      underReview: "Under review",
      documentsPending: "Documents pending",
      eligible: "Eligible",
      ineligible: "Ineligible",
      selection: "In selection",
      ranked: "Ranked",
      waitingList: "Waiting list",
      approved: "Approved",
      rejected: "Rejected",
      withdrawn: "Withdrawn",
      cancelled: "Cancelled"
    },
    errors: {
      title: "International Mobility could not be loaded",
      load: "The International Mobility dashboard could not be loaded.",
      unauthorized: "Your session is not authenticated.",
      forbidden: "You do not have permission to access this area."
    }
  },

  "es-ES": {
    eyebrow: "Movilidad académica",
    title: "Movilidad Internacional",
    subtitle:
      "Gestiona instituciones asociadas, convenios, programas, oportunidades y solicitudes de movilidad académica en un solo lugar.",
    loading: "Cargando el panel de movilidad...",
    metrics: {
      partners: "Instituciones asociadas",
      agreements: "Convenios activos",
      programs: "Programas activos",
      openOffers: "Convocatorias abiertas",
      applications: "Solicitudes",
      pendingApplications: "Solicitudes pendientes",
      approvedApplications: "Solicitudes aprobadas",
      pendingDocuments: "Documentos pendientes"
    },
    sections: {
      indicators: "Indicadores de Movilidad Internacional",
      deadlines: "Próximos plazos",
      deadlinesDescription:
        "Oportunidades con inscripciones programadas o abiertas.",
      recentApplications: "Solicitudes recientes",
      recentApplicationsDescription:
        "Últimas solicitudes registradas en el sector.",
      quickActions: "Áreas de Movilidad",
      quickActionsDescription:
        "Los próximos módulos se activarán a medida que sean implementados."
    },
    empty: {
      deadlines: "No hay próximos plazos de inscripción.",
      applications: "Todavía no hay solicitudes registradas."
    },
    deadline: {
      until: "Inscripciones hasta {date}"
    },
    actions: {
      refresh: "Actualizar",
      retry: "Intentar de nuevo",
      partners: "Instituciones Asociadas",
      agreements: "Convenios",
      programs: "Programas",
      offers: "Oportunidades / Convocatorias",
      applications: "Solicitudes",
      comingSoon: "En implementación"
    },
    statuses: {
      draft: "Borrador",
      submitted: "Enviada",
      underReview: "En revisión",
      documentsPending: "Documentación pendiente",
      eligible: "Elegible",
      ineligible: "No elegible",
      selection: "En selección",
      ranked: "Clasificada",
      waitingList: "Lista de espera",
      approved: "Aprobada",
      rejected: "Rechazada",
      withdrawn: "Retirada",
      cancelled: "Cancelada"
    },
    errors: {
      title: "No se pudo cargar la Movilidad Internacional",
      load: "No se pudo cargar el panel de Movilidad Internacional.",
      unauthorized: "Tu sesión no está autenticada.",
      forbidden: "No tienes permiso para acceder a este sector."
    }
  },

  "fr-FR": {
    eyebrow: "Mobilité académique",
    title: "Mobilité Internationale",
    subtitle:
      "Gérez les établissements partenaires, accords, programmes, opportunités et candidatures de mobilité académique depuis un espace unique.",
    loading: "Chargement du tableau de bord de mobilité...",
    metrics: {
      partners: "Établissements partenaires",
      agreements: "Accords actifs",
      programs: "Programmes actifs",
      openOffers: "Candidatures ouvertes",
      applications: "Candidatures",
      pendingApplications: "Candidatures en attente",
      approvedApplications: "Candidatures approuvées",
      pendingDocuments: "Documents en attente"
    },
    sections: {
      indicators: "Indicateurs de Mobilité Internationale",
      deadlines: "Prochaines échéances",
      deadlinesDescription:
        "Opportunités dont les périodes de candidature sont programmées ou ouvertes.",
      recentApplications: "Candidatures récentes",
      recentApplicationsDescription:
        "Dernières candidatures enregistrées dans le secteur.",
      quickActions: "Domaines de Mobilité",
      quickActionsDescription:
        "Les prochains modules seront activés au fur et à mesure de leur mise en œuvre."
    },
    empty: {
      deadlines: "Aucune échéance de candidature à venir.",
      applications: "Aucune candidature n'a encore été enregistrée."
    },
    deadline: {
      until: "Candidatures jusqu'au {date}"
    },
    actions: {
      refresh: "Actualiser",
      retry: "Réessayer",
      partners: "Établissements Partenaires",
      agreements: "Accords",
      programs: "Programmes",
      offers: "Opportunités / Appels",
      applications: "Candidatures",
      comingSoon: "En cours de mise en œuvre"
    },
    statuses: {
      draft: "Brouillon",
      submitted: "Envoyée",
      underReview: "En cours d'analyse",
      documentsPending: "Documents en attente",
      eligible: "Éligible",
      ineligible: "Non éligible",
      selection: "En sélection",
      ranked: "Classée",
      waitingList: "Liste d'attente",
      approved: "Approuvée",
      rejected: "Refusée",
      withdrawn: "Retirée",
      cancelled: "Annulée"
    },
    errors: {
      title: "Impossible de charger la Mobilité Internationale",
      load: "Le tableau de bord de Mobilité Internationale n'a pas pu être chargé.",
      unauthorized: "Votre session n'est pas authentifiée.",
      forbidden: "Vous n'êtes pas autorisé à accéder à ce secteur."
    }
  }
};

const arquivos = Object.keys(traducoes).map(
  (locale) => ({
    locale,
    caminho: path.resolve(
      "messages",
      `${locale}.json`
    )
  })
);

const carregados = {};

for (const arquivo of arquivos) {
  if (!fs.existsSync(arquivo.caminho)) {
    throw new Error(
      `Arquivo não encontrado: ${arquivo.caminho}`
    );
  }

  carregados[arquivo.locale] =
    JSON.parse(
      fs.readFileSync(
        arquivo.caminho,
        "utf8"
      )
    );
}

for (const arquivo of arquivos) {
  const json =
    carregados[arquivo.locale];

  json.AdminMobilityDashboard =
    traducoes[arquivo.locale];

  fs.writeFileSync(
    arquivo.caminho,
    JSON.stringify(json, null, 2) + "\n",
    "utf8"
  );

  console.log(
    `✓ ${arquivo.locale}`
  );
}

console.log("");
console.log(
  "✓ DASHBOARD DE MOBILIDADE INTERNACIONALIZADO NOS 5 IDIOMAS"
);
