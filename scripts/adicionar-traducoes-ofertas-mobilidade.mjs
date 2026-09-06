import fs from "node:fs";
import path from "node:path";

const base = {
  "pt-BR": {
    nav: "Ofertas / Editais",
    back: "Mobilidade Internacional",
    title: "Ofertas / Editais",
    subtitle: "Publique oportunidades de mobilidade, organize inscrições, vagas, critérios de elegibilidade e períodos da experiência internacional.",
    total: "Total de ofertas",
    scheduled: "Inscrições agendadas",
    open: "Inscrições abertas",
    selection: "Em seleção",
    new: "Nova oferta / edital",
    search: "Buscar ofertas...",
    allStatuses: "Todas as situações",
    allPrograms: "Todos os programas",
    offer: "Oferta / Edital",
    program: "Programa",
    applications: "Inscrições",
    mobility: "Mobilidade",
    seats: "Vagas",
    courses: "Cursos",
    candidates: "Candidaturas",
    status: "Situação",
    actions: "Ações",
    waitingList: "Lista de espera",
    generalCoverage: "Abrangência geral",
    draft: "Rascunho",
    scheduledStatus: "Inscrições agendadas",
    openStatus: "Inscrições abertas",
    closed: "Inscrições encerradas",
    selectionStatus: "Em seleção",
    finished: "Finalizada",
    cancelled: "Cancelada",
    edit: "Editar",
    refresh: "Atualizar",
    cancel: "Cancelar",
    save: "Salvar",
    saving: "Salvando...",
    emptyTitle: "Nenhuma oferta encontrada",
    emptyDescription: "Cadastre a primeira oportunidade de mobilidade ou ajuste os filtros."
  },

  "pt-PT": {
    nav: "Ofertas / Editais",
    back: "Mobilidade Internacional",
    title: "Ofertas / Editais",
    subtitle: "Publique oportunidades de mobilidade e organize inscrições, vagas, critérios de elegibilidade e períodos da experiência internacional.",
    total: "Total de ofertas",
    scheduled: "Inscrições agendadas",
    open: "Inscrições abertas",
    selection: "Em seleção",
    new: "Nova oferta / edital",
    search: "Pesquisar ofertas...",
    allStatuses: "Todos os estados",
    allPrograms: "Todos os programas",
    offer: "Oferta / Edital",
    program: "Programa",
    applications: "Inscrições",
    mobility: "Mobilidade",
    seats: "Vagas",
    courses: "Cursos",
    candidates: "Candidaturas",
    status: "Estado",
    actions: "Ações",
    waitingList: "Lista de espera",
    generalCoverage: "Abrangência geral",
    draft: "Rascunho",
    scheduledStatus: "Inscrições agendadas",
    openStatus: "Inscrições abertas",
    closed: "Inscrições encerradas",
    selectionStatus: "Em seleção",
    finished: "Finalizada",
    cancelled: "Cancelada",
    edit: "Editar",
    refresh: "Atualizar",
    cancel: "Cancelar",
    save: "Guardar",
    saving: "A guardar...",
    emptyTitle: "Nenhuma oferta encontrada",
    emptyDescription: "Registe a primeira oportunidade de mobilidade ou ajuste os filtros."
  },

  "en-US": {
    nav: "Offers / Calls",
    back: "International Mobility",
    title: "Offers / Calls",
    subtitle: "Publish mobility opportunities and manage applications, seats, eligibility criteria, and mobility periods.",
    total: "Total offers",
    scheduled: "Scheduled applications",
    open: "Open applications",
    selection: "In selection",
    new: "New offer / call",
    search: "Search offers...",
    allStatuses: "All statuses",
    allPrograms: "All programs",
    offer: "Offer / Call",
    program: "Program",
    applications: "Applications",
    mobility: "Mobility",
    seats: "Seats",
    courses: "Courses",
    candidates: "Candidates",
    status: "Status",
    actions: "Actions",
    waitingList: "Waiting list",
    generalCoverage: "Institution-wide",
    draft: "Draft",
    scheduledStatus: "Applications scheduled",
    openStatus: "Applications open",
    closed: "Applications closed",
    selectionStatus: "In selection",
    finished: "Finished",
    cancelled: "Cancelled",
    edit: "Edit",
    refresh: "Refresh",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    emptyTitle: "No offers found",
    emptyDescription: "Create the first mobility opportunity or adjust the filters."
  },

  "es-ES": {
    nav: "Ofertas / Convocatorias",
    back: "Movilidad Internacional",
    title: "Ofertas / Convocatorias",
    subtitle: "Publica oportunidades de movilidad y organiza inscripciones, plazas, criterios de elegibilidad y períodos de movilidad.",
    total: "Total de ofertas",
    scheduled: "Inscripciones programadas",
    open: "Inscripciones abiertas",
    selection: "En selección",
    new: "Nueva oferta / convocatoria",
    search: "Buscar ofertas...",
    allStatuses: "Todos los estados",
    allPrograms: "Todos los programas",
    offer: "Oferta / Convocatoria",
    program: "Programa",
    applications: "Inscripciones",
    mobility: "Movilidad",
    seats: "Plazas",
    courses: "Cursos",
    candidates: "Candidaturas",
    status: "Estado",
    actions: "Acciones",
    waitingList: "Lista de espera",
    generalCoverage: "Cobertura general",
    draft: "Borrador",
    scheduledStatus: "Inscripciones programadas",
    openStatus: "Inscripciones abiertas",
    closed: "Inscripciones cerradas",
    selectionStatus: "En selección",
    finished: "Finalizada",
    cancelled: "Cancelada",
    edit: "Editar",
    refresh: "Actualizar",
    cancel: "Cancelar",
    save: "Guardar",
    saving: "Guardando...",
    emptyTitle: "No se encontraron ofertas",
    emptyDescription: "Registra la primera oportunidad de movilidad o ajusta los filtros."
  },

  "fr-FR": {
    nav: "Offres / Appels",
    back: "Mobilité Internationale",
    title: "Offres / Appels",
    subtitle: "Publiez les opportunités de mobilité et gérez les candidatures, places, critères d'éligibilité et périodes de mobilité.",
    total: "Total des offres",
    scheduled: "Candidatures programmées",
    open: "Candidatures ouvertes",
    selection: "En sélection",
    new: "Nouvelle offre / appel",
    search: "Rechercher des offres...",
    allStatuses: "Tous les statuts",
    allPrograms: "Tous les programmes",
    offer: "Offre / Appel",
    program: "Programme",
    applications: "Candidatures",
    mobility: "Mobilité",
    seats: "Places",
    courses: "Formations",
    candidates: "Candidatures",
    status: "Statut",
    actions: "Actions",
    waitingList: "Liste d'attente",
    generalCoverage: "Portée générale",
    draft: "Brouillon",
    scheduledStatus: "Candidatures programmées",
    openStatus: "Candidatures ouvertes",
    closed: "Candidatures closes",
    selectionStatus: "En sélection",
    finished: "Terminée",
    cancelled: "Annulée",
    edit: "Modifier",
    refresh: "Actualiser",
    cancel: "Annuler",
    save: "Enregistrer",
    saving: "Enregistrement...",
    emptyTitle: "Aucune offre trouvée",
    emptyDescription: "Créez la première opportunité de mobilité ou modifiez les filtres."
  }
};

function porLocale(
  locale,
  pt,
  en,
  es,
  fr
) {
  if (locale === "en-US") return en;
  if (locale === "es-ES") return es;
  if (locale === "fr-FR") return fr;
  return pt;
}

for (
  const [
    locale,
    x
  ] of Object.entries(base)
) {
  const arquivo =
    path.resolve(
      "messages",
      `${locale}.json`
    );

  const json =
    JSON.parse(
      fs.readFileSync(
        arquivo,
        "utf8"
      )
    );

  json.AdminNavigation.mobilityOffers =
    x.nav;

  json.AdminMobilityOffers = {
    back: x.back,
    title: x.title,
    subtitle: x.subtitle,

    summary: {
      total: x.total,
      scheduled: x.scheduled,
      open: x.open,
      selection: x.selection
    },

    filters: {
      search: x.search,
      allStatuses: x.allStatuses,
      allPrograms: x.allPrograms
    },

    table: {
      offer: x.offer,
      program: x.program,
      applications: x.applications,
      mobility: x.mobility,
      seats: x.seats,
      courses: x.courses,
      candidates: x.candidates,
      status: x.status,
      actions: x.actions,
      waitingList: x.waitingList,
      generalCoverage: x.generalCoverage,
      courseCount:
        porLocale(
          locale,
          "{count} curso(s)",
          "{count} course(s)",
          "{count} curso(s)",
          "{count} formation(s)"
        )
    },

    statuses: {
      draft: x.draft,
      scheduled: x.scheduledStatus,
      open: x.openStatus,
      closed: x.closed,
      selection: x.selectionStatus,
      finished: x.finished,
      cancelled: x.cancelled
    },

    actions: {
      new: x.new,
      refresh: x.refresh,
      edit: x.edit,
      cancel: x.cancel,
      save: x.save,
      saving: x.saving
    },

    empty: {
      title: x.emptyTitle,
      description: x.emptyDescription
    },

    sections: {
      identification:
        porLocale(
          locale,
          "Dados da oferta / edital",
          "Offer / call details",
          "Datos de la oferta / convocatoria",
          "Informations de l'offre / appel"
        ),

      dates:
        porLocale(
          locale,
          "Inscrições e período da mobilidade",
          "Applications and mobility period",
          "Inscripciones y período de movilidad",
          "Candidatures et période de mobilité"
        ),

      courses:
        x.courses,

      coursesDescription:
        porLocale(
          locale,
          "Selecione os cursos elegíveis. Deixe todos desmarcados para uma oferta de abrangência geral.",
          "Select eligible courses. Leave all unchecked for institution-wide eligibility.",
          "Selecciona los cursos elegibles. Deja todos sin marcar para una cobertura general.",
          "Sélectionnez les formations éligibles. Ne sélectionnez aucune formation pour une portée générale."
        ),

      eligibility:
        porLocale(
          locale,
          "Critérios de elegibilidade",
          "Eligibility criteria",
          "Criterios de elegibilidad",
          "Critères d'éligibilité"
        ),

      instructions:
        porLocale(
          locale,
          "Instruções ao candidato",
          "Applicant instructions",
          "Instrucciones al candidato",
          "Instructions au candidat"
        )
    },

    fields: {
      program: x.program,

      selectProgram:
        porLocale(
          locale,
          "Selecione um programa",
          "Select a program",
          "Selecciona un programa",
          "Sélectionnez un programme"
        ),

      title:
        porLocale(
          locale,
          "Título da oferta / edital",
          "Offer / call title",
          "Título de la oferta / convocatoria",
          "Titre de l'offre / appel"
        ),

      code:
        porLocale(
          locale,
          "Código interno",
          "Internal code",
          "Código interno",
          "Code interne"
        ),

      year:
        porLocale(
          locale,
          "Ano",
          "Year",
          "Año",
          "Année"
        ),

      period:
        porLocale(
          locale,
          "Período",
          "Period",
          "Período",
          "Période"
        ),

      periodPlaceholder:
        porLocale(
          locale,
          "Ex.: 1º semestre de 2027",
          "e.g. Spring 2027",
          "Ej.: 1.er semestre de 2027",
          "Ex. : 1er semestre 2027"
        ),

      status: x.status,

      statusHelp:
        porLocale(
          locale,
          "Rascunhos não são considerados publicados. Os demais estados registram a publicação da oportunidade.",
          "Drafts are not considered published. Other statuses register the opportunity as published.",
          "Los borradores no se consideran publicados. Los demás estados registran la publicación de la oportunidad.",
          "Les brouillons ne sont pas considérés comme publiés. Les autres statuts enregistrent la publication de l'opportunité."
        ),

      seats: x.seats,

      description:
        porLocale(
          locale,
          "Descrição",
          "Description",
          "Descripción",
          "Description"
        ),

      applicationsStart:
        porLocale(
          locale,
          "Início das inscrições",
          "Applications open",
          "Inicio de inscripciones",
          "Ouverture des candidatures"
        ),

      applicationsEnd:
        porLocale(
          locale,
          "Fim das inscrições",
          "Applications close",
          "Fin de inscripciones",
          "Clôture des candidatures"
        ),

      mobilityStart:
        porLocale(
          locale,
          "Início da mobilidade",
          "Mobility starts",
          "Inicio de la movilidad",
          "Début de la mobilité"
        ),

      mobilityEnd:
        porLocale(
          locale,
          "Fim da mobilidade",
          "Mobility ends",
          "Fin de la movilidad",
          "Fin de la mobilité"
        ),

      waitingList: x.waitingList,

      waitingListDescription:
        porLocale(
          locale,
          "Permite manter candidatos classificados além do número inicial de vagas.",
          "Allows ranked candidates to remain available beyond the initial number of seats.",
          "Permite mantener candidatos clasificados más allá del número inicial de plazas.",
          "Permet de conserver des candidats classés au-delà du nombre initial de places."
        ),

      searchCourses:
        porLocale(
          locale,
          "Buscar cursos...",
          "Search courses...",
          "Buscar cursos...",
          "Rechercher des formations..."
        ),

      noCourses:
        porLocale(
          locale,
          "Nenhum curso encontrado.",
          "No courses found.",
          "No se encontraron cursos.",
          "Aucune formation trouvée."
        ),

      generalCoverage:
        porLocale(
          locale,
          "Nenhum curso específico selecionado: abrangência geral.",
          "No specific course selected: institution-wide eligibility.",
          "Ningún curso específico seleccionado: cobertura general.",
          "Aucune formation spécifique sélectionnée : portée générale."
        ),

      selectedCourses:
        porLocale(
          locale,
          "{count} curso(s) selecionado(s)",
          "{count} course(s) selected",
          "{count} curso(s) seleccionado(s)",
          "{count} formation(s) sélectionnée(s)"
        ),

      average:
        porLocale(
          locale,
          "Média mínima",
          "Minimum average",
          "Promedio mínimo",
          "Moyenne minimale"
        ),

      attendance:
        porLocale(
          locale,
          "Frequência mínima (%)",
          "Minimum attendance (%)",
          "Asistencia mínima (%)",
          "Assiduité minimale (%)"
        ),

      minSemester:
        porLocale(
          locale,
          "Semestre/período mínimo",
          "Minimum semester/period",
          "Semestre/período mínimo",
          "Semestre/période minimum"
        ),

      maxSemester:
        porLocale(
          locale,
          "Semestre/período máximo",
          "Maximum semester/period",
          "Semestre/período máximo",
          "Semestre/période maximum"
        ),

      minAge:
        porLocale(
          locale,
          "Idade mínima",
          "Minimum age",
          "Edad mínima",
          "Âge minimum"
        ),

      maxAge:
        porLocale(
          locale,
          "Idade máxima",
          "Maximum age",
          "Edad máxima",
          "Âge maximum"
        ),

      academicRegularity:
        porLocale(
          locale,
          "Exigir regularidade acadêmica",
          "Require academic good standing",
          "Exigir regularidad académica",
          "Exiger une situation académique régulière"
        ),

      academicRegularityDescription:
        porLocale(
          locale,
          "O candidato deve estar academicamente regular na instituição.",
          "The applicant must be in academic good standing.",
          "El candidato debe estar académicamente regular.",
          "Le candidat doit être en situation académique régulière."
        ),

      financialRegularity:
        porLocale(
          locale,
          "Exigir regularidade financeira",
          "Require financial good standing",
          "Exigir regularidad financiera",
          "Exiger une situation financière régulière"
        ),

      financialRegularityDescription:
        porLocale(
          locale,
          "O candidato deve estar financeiramente regular conforme as regras da instituição.",
          "The applicant must meet the institution's financial good-standing rules.",
          "El candidato debe cumplir las reglas de regularidad financiera de la institución.",
          "Le candidat doit respecter les règles de régularité financière de l'établissement."
        ),

      eligibilityNotes:
        porLocale(
          locale,
          "Outros critérios / observações",
          "Other criteria / notes",
          "Otros criterios / observaciones",
          "Autres critères / observations"
        ),

      instructionsPlaceholder:
        porLocale(
          locale,
          "Informe documentos, etapas, orientações e demais instruções importantes para a candidatura.",
          "Enter required documents, steps, guidance, and other important application instructions.",
          "Indica documentos, etapas, orientaciones y demás instrucciones importantes para la candidatura.",
          "Indiquez les documents, étapes, consignes et autres instructions importantes pour la candidature."
        )
    },

    modal: {
      newTitle: x.new,

      editTitle:
        porLocale(
          locale,
          "Editar oferta / edital",
          "Edit offer / call",
          "Editar oferta / convocatoria",
          "Modifier l'offre / appel"
        ),

      description:
        porLocale(
          locale,
          "Defina o período de inscrições, vagas, mobilidade, cursos elegíveis e critérios para candidatura.",
          "Define application dates, seats, mobility period, eligible courses, and application criteria.",
          "Define el período de inscripción, plazas, movilidad, cursos elegibles y criterios de candidatura.",
          "Définissez les dates de candidature, les places, la période de mobilité, les formations éligibles et les critères."
        )
    },

    messages: {
      created:
        porLocale(
          locale,
          "Oferta / edital cadastrado com sucesso.",
          "Offer / call created successfully.",
          "Oferta / convocatoria registrada correctamente.",
          "Offre / appel enregistré avec succès."
        ),

      updated:
        porLocale(
          locale,
          "Oferta / edital atualizado com sucesso.",
          "Offer / call updated successfully.",
          "Oferta / convocatoria actualizada correctamente.",
          "Offre / appel mis à jour avec succès."
        )
    },

    errors: {
      load:
        porLocale(
          locale,
          "Não foi possível carregar as ofertas.",
          "Offers could not be loaded.",
          "No se pudieron cargar las ofertas.",
          "Impossible de charger les offres."
        ),

      save:
        porLocale(
          locale,
          "Não foi possível salvar a oferta.",
          "The offer could not be saved.",
          "No se pudo guardar la oferta.",
          "Impossible d'enregistrer l'offre."
        ),

      generic:
        porLocale(
          locale,
          "Ocorreu um erro ao processar a solicitação.",
          "An error occurred while processing the request.",
          "Se produjo un error al procesar la solicitud.",
          "Une erreur s'est produite lors du traitement de la demande."
        ),

      unauthorized:
        porLocale(
          locale,
          "Sua sessão não está autenticada.",
          "Your session is not authenticated.",
          "Tu sesión no está autenticada.",
          "Votre session n'est pas authentifiée."
        ),

      forbidden:
        porLocale(
          locale,
          "Você não possui permissão para acessar esta área.",
          "You do not have permission to access this area.",
          "No tienes permiso para acceder a esta área.",
          "Vous n'êtes pas autorisé à accéder à cette zone."
        ),

      forbiddenManage:
        porLocale(
          locale,
          "Você não possui permissão para gerenciar ofertas de mobilidade.",
          "You do not have permission to manage mobility offers.",
          "No tienes permiso para gestionar ofertas de movilidad.",
          "Vous n'êtes pas autorisé à gérer les offres de mobilité."
        ),

      titleRequired:
        porLocale(
          locale,
          "Informe o título da oferta / edital.",
          "Enter the offer / call title.",
          "Indica el título de la oferta / convocatoria.",
          "Indiquez le titre de l'offre / appel."
        ),

      invalidProgram:
        porLocale(
          locale,
          "Selecione um programa válido.",
          "Select a valid program.",
          "Selecciona un programa válido.",
          "Sélectionnez un programme valide."
        ),

      invalidStatus:
        porLocale(
          locale,
          "Selecione uma situação válida.",
          "Select a valid status.",
          "Selecciona un estado válido.",
          "Sélectionnez un statut valide."
        ),

      invalidYear:
        porLocale(
          locale,
          "Informe um ano válido.",
          "Enter a valid year.",
          "Indica un año válido.",
          "Indiquez une année valide."
        ),

      invalidSeats:
        porLocale(
          locale,
          "Informe uma quantidade de vagas válida.",
          "Enter a valid number of seats.",
          "Indica una cantidad de plazas válida.",
          "Indiquez un nombre de places valide."
        ),

      invalidDate:
        porLocale(
          locale,
          "Uma ou mais datas são inválidas.",
          "One or more dates are invalid.",
          "Una o más fechas no son válidas.",
          "Une ou plusieurs dates ne sont pas valides."
        ),

      invalidApplicationsPeriod:
        porLocale(
          locale,
          "O fim das inscrições não pode ser anterior ao início.",
          "Applications cannot close before they open.",
          "El fin de las inscripciones no puede ser anterior al inicio.",
          "La clôture des candidatures ne peut pas précéder leur ouverture."
        ),

      invalidMobilityPeriod:
        porLocale(
          locale,
          "O fim da mobilidade não pode ser anterior ao início.",
          "Mobility cannot end before it starts.",
          "El fin de la movilidad no puede ser anterior al inicio.",
          "La mobilité ne peut pas se terminer avant son début."
        ),

      invalidChronology:
        porLocale(
          locale,
          "As inscrições devem terminar antes do início da mobilidade.",
          "Applications must close before mobility begins.",
          "Las inscripciones deben finalizar antes del inicio de la movilidad.",
          "Les candidatures doivent être closes avant le début de la mobilité."
        ),

      invalidCourse:
        porLocale(
          locale,
          "Um ou mais cursos selecionados são inválidos.",
          "One or more selected courses are invalid.",
          "Uno o más cursos seleccionados no son válidos.",
          "Une ou plusieurs formations sélectionnées ne sont pas valides."
        ),

      invalidCriteria:
        porLocale(
          locale,
          "Revise os critérios de elegibilidade informados.",
          "Review the eligibility criteria.",
          "Revisa los criterios de elegibilidad.",
          "Vérifiez les critères d'éligibilité."
        ),

      duplicateCode:
        porLocale(
          locale,
          "Este código de oferta já está em uso.",
          "This offer code is already in use.",
          "Este código de oferta ya está en uso.",
          "Ce code d'offre est déjà utilisé."
        ),

      notFound:
        porLocale(
          locale,
          "Oferta não encontrada.",
          "Offer not found.",
          "Oferta no encontrada.",
          "Offre introuvable."
        ),

      invalidId:
        porLocale(
          locale,
          "Identificação inválida.",
          "Invalid identifier.",
          "Identificador no válido.",
          "Identifiant non valide."
        )
    }
  };

  fs.writeFileSync(
    arquivo,
    JSON.stringify(
      json,
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(
    `✓ ${locale}`
  );
}

console.log("");
console.log(
  "✓ OFERTAS / EDITAIS INTERNACIONALIZADOS NOS 5 IDIOMAS"
);
