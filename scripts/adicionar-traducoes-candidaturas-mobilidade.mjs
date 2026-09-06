import fs from "node:fs";
import path from "node:path";

const locais = {
  "pt-BR": {
    nav: "Candidaturas",
    back: "Mobilidade Internacional",
    title: "Candidaturas",
    subtitle: "Gerencie candidatos, documentação, elegibilidade, seleção, classificação e resultados da mobilidade internacional.",
    total: "Total de candidaturas",
    pending: "Candidaturas pendentes",
    approved: "Candidaturas aprovadas",
    notApproved: "Não aprovadas",
    new: "Nova candidatura",
    search: "Buscar candidato...",
    allStatuses: "Todas as situações",
    allTypes: "Todos os tipos",
    allOffers: "Todas as ofertas",
    phanyx: "Aluno PHANYX",
    external: "Candidato externo"
  },

  "pt-PT": {
    nav: "Candidaturas",
    back: "Mobilidade Internacional",
    title: "Candidaturas",
    subtitle: "Gira candidatos, documentação, elegibilidade, seleção, classificação e resultados da mobilidade internacional.",
    total: "Total de candidaturas",
    pending: "Candidaturas pendentes",
    approved: "Candidaturas aprovadas",
    notApproved: "Não aprovadas",
    new: "Nova candidatura",
    search: "Pesquisar candidato...",
    allStatuses: "Todos os estados",
    allTypes: "Todos os tipos",
    allOffers: "Todas as ofertas",
    phanyx: "Aluno PHANYX",
    external: "Candidato externo"
  },

  "en-US": {
    nav: "Applications",
    back: "International Mobility",
    title: "Applications",
    subtitle: "Manage applicants, documentation, eligibility, selection, ranking, and international mobility results.",
    total: "Total applications",
    pending: "Pending applications",
    approved: "Approved applications",
    notApproved: "Not approved",
    new: "New application",
    search: "Search applicant...",
    allStatuses: "All statuses",
    allTypes: "All applicant types",
    allOffers: "All offers",
    phanyx: "PHANYX student",
    external: "External applicant"
  },

  "es-ES": {
    nav: "Candidaturas",
    back: "Movilidad Internacional",
    title: "Candidaturas",
    subtitle: "Gestiona candidatos, documentación, elegibilidad, selección, clasificación y resultados de movilidad internacional.",
    total: "Total de candidaturas",
    pending: "Candidaturas pendientes",
    approved: "Candidaturas aprobadas",
    notApproved: "No aprobadas",
    new: "Nueva candidatura",
    search: "Buscar candidato...",
    allStatuses: "Todos los estados",
    allTypes: "Todos los tipos",
    allOffers: "Todas las ofertas",
    phanyx: "Alumno PHANYX",
    external: "Candidato externo"
  },

  "fr-FR": {
    nav: "Candidatures",
    back: "Mobilité Internationale",
    title: "Candidatures",
    subtitle: "Gérez les candidats, les documents, l'éligibilité, la sélection, le classement et les résultats de mobilité internationale.",
    total: "Total des candidatures",
    pending: "Candidatures en attente",
    approved: "Candidatures approuvées",
    notApproved: "Non approuvées",
    new: "Nouvelle candidature",
    search: "Rechercher un candidat...",
    allStatuses: "Tous les statuts",
    allTypes: "Tous les types",
    allOffers: "Toutes les offres",
    phanyx: "Étudiant PHANYX",
    external: "Candidat externe"
  }
};

function L(
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
  ] of Object.entries(locais)
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

  json.AdminNavigation.mobilityApplications =
    x.nav;

  json.AdminMobilityApplications = {
    back: x.back,
    title: x.title,
    subtitle: x.subtitle,

    summary: {
      total: x.total,
      pending: x.pending,
      approved: x.approved,
      notApproved: x.notApproved
    },

    filters: {
      search: x.search,
      allStatuses: x.allStatuses,
      allTypes: x.allTypes,
      allOffers: x.allOffers
    },

    types: {
      phanyx: x.phanyx,
      external: x.external
    },

    table: {
      candidate: L(locale, "Candidato", "Applicant", "Candidato", "Candidat"),
      type: L(locale, "Tipo", "Type", "Tipo", "Type"),
      offer: L(locale, "Oferta / Edital", "Offer / Call", "Oferta / Convocatoria", "Offre / Appel"),
      academicLink: L(locale, "Vínculo acadêmico / origem", "Academic link / origin", "Vínculo académico / origen", "Lien académique / origine"),
      documents: L(locale, "Documentos", "Documents", "Documentos", "Documents"),
      result: L(locale, "Resultado", "Result", "Resultado", "Résultat"),
      status: L(locale, "Situação", "Status", "Estado", "Statut"),
      date: L(locale, "Data", "Date", "Fecha", "Date"),
      actions: L(locale, "Ações", "Actions", "Acciones", "Actions"),
      pendingDocuments: L(locale, "{count} pendente(s)", "{count} pending", "{count} pendiente(s)", "{count} en attente"),
      ranking: L(locale, "{value}º lugar", "Rank #{value}", "{value}.º puesto", "{value}e place")
    },

    statuses: {
      draft: L(locale, "Rascunho", "Draft", "Borrador", "Brouillon"),
      submitted: L(locale, "Enviada", "Submitted", "Enviada", "Envoyée"),
      review: L(locale, "Em análise", "Under review", "En análisis", "En analyse"),
      documentsPending: L(locale, "Documentação pendente", "Documents pending", "Documentación pendiente", "Documents en attente"),
      eligible: L(locale, "Elegível", "Eligible", "Elegible", "Éligible"),
      ineligible: L(locale, "Inelegível", "Ineligible", "No elegible", "Non éligible"),
      selection: L(locale, "Em seleção", "In selection", "En selección", "En sélection"),
      ranked: L(locale, "Classificada", "Ranked", "Clasificada", "Classée"),
      waitingList: L(locale, "Lista de espera", "Waiting list", "Lista de espera", "Liste d'attente"),
      approved: L(locale, "Aprovada", "Approved", "Aprobada", "Approuvée"),
      rejected: L(locale, "Reprovada", "Rejected", "Rechazada", "Refusée"),
      withdrawn: L(locale, "Desistente", "Withdrawn", "Desistida", "Désistée"),
      cancelled: L(locale, "Cancelada", "Cancelled", "Cancelada", "Annulée")
    },

    actions: {
      new: x.new,
      refresh: L(locale, "Atualizar", "Refresh", "Actualizar", "Actualiser"),
      process: L(locale, "Processar", "Process", "Procesar", "Traiter"),
      changeStudent: L(locale, "Trocar aluno", "Change student", "Cambiar alumno", "Changer d'étudiant"),
      cancel: L(locale, "Cancelar", "Cancel", "Cancelar", "Annuler"),
      save: L(locale, "Salvar", "Save", "Guardar", "Enregistrer"),
      saving: L(locale, "Salvando...", "Saving...", "Guardando...", "Enregistrement...")
    },

    empty: {
      title: L(locale, "Nenhuma candidatura encontrada", "No applications found", "No se encontraron candidaturas", "Aucune candidature trouvée"),
      description: L(locale, "Registre a primeira candidatura ou ajuste os filtros.", "Create the first application or adjust the filters.", "Registra la primera candidatura o ajusta los filtros.", "Créez la première candidature ou modifiez les filtres.")
    },

    modal: {
      newTitle: x.new,
      newDescription: L(locale, "Selecione uma oferta e registre um aluno PHANYX ou um candidato externo.", "Select an offer and register a PHANYX student or an external applicant.", "Selecciona una oferta y registra un alumno PHANYX o un candidato externo.", "Sélectionnez une offre et enregistrez un étudiant PHANYX ou un candidat externe."),
      processTitle: L(locale, "Processar candidatura", "Process application", "Procesar candidatura", "Traiter la candidature")
    },

    fields: {
      offer: L(locale, "Oferta / Edital", "Offer / Call", "Oferta / Convocatoria", "Offre / Appel"),
      selectOffer: L(locale, "Selecione uma oferta", "Select an offer", "Selecciona una oferta", "Sélectionnez une offre"),
      searchStudent: L(locale, "Buscar aluno", "Search student", "Buscar alumno", "Rechercher un étudiant"),
      searchStudentPlaceholder: L(locale, "Digite nome, e-mail ou matrícula...", "Enter name, email, or enrollment number...", "Escribe nombre, correo o matrícula...", "Saisissez le nom, l'e-mail ou le numéro d'inscription..."),
      searching: L(locale, "Buscando alunos...", "Searching students...", "Buscando alumnos...", "Recherche des étudiants..."),
      enrollment: L(locale, "Matrícula acadêmica", "Academic enrollment", "Matrícula académica", "Inscription académique"),
      noEnrollments: L(locale, "Este aluno não possui matrícula acadêmica disponível.", "This student has no academic enrollment available.", "Este alumno no tiene matrícula académica disponible.", "Cet étudiant n'a aucune inscription académique disponible."),
      noCourse: L(locale, "Curso não informado", "Course not specified", "Curso no informado", "Formation non renseignée"),
      courseNotEligible: L(locale, "Curso não contemplado nesta oferta", "Course is not eligible for this offer", "Curso no contemplado en esta oferta", "Formation non éligible à cette offre"),
      name: L(locale, "Nome completo", "Full name", "Nombre completo", "Nom complet"),
      email: L(locale, "E-mail", "Email", "Correo electrónico", "E-mail"),
      phone: L(locale, "Telefone", "Phone", "Teléfono", "Téléphone"),
      originInstitution: L(locale, "Instituição de origem", "Home institution", "Institución de origen", "Établissement d'origine"),
      originCountry: L(locale, "País de origem — código ISO", "Country of origin — ISO code", "País de origen — código ISO", "Pays d'origine — code ISO"),
      initialStatus: L(locale, "Situação inicial", "Initial status", "Estado inicial", "Statut initial"),
      status: L(locale, "Situação da candidatura", "Application status", "Estado de la candidatura", "Statut de la candidature"),
      score: L(locale, "Nota final", "Final score", "Nota final", "Note finale"),
      ranking: L(locale, "Classificação", "Ranking", "Clasificación", "Classement"),
      statusReason: L(locale, "Motivo / observações da situação", "Status reason / notes", "Motivo / observaciones del estado", "Motif / observations sur le statut")
    },

    messages: {
      created: L(locale, "Candidatura cadastrada com sucesso.", "Application created successfully.", "Candidatura registrada correctamente.", "Candidature enregistrée avec succès."),
      updated: L(locale, "Candidatura atualizada com sucesso.", "Application updated successfully.", "Candidatura actualizada correctamente.", "Candidature mise à jour avec succès.")
    },

    errors: {
      load: L(locale, "Não foi possível carregar as candidaturas.", "Applications could not be loaded.", "No se pudieron cargar las candidaturas.", "Impossible de charger les candidatures."),
      save: L(locale, "Não foi possível salvar a candidatura.", "The application could not be saved.", "No se pudo guardar la candidatura.", "Impossible d'enregistrer la candidature."),
      studentSearch: L(locale, "Não foi possível buscar os alunos.", "Students could not be searched.", "No se pudieron buscar los alumnos.", "Impossible de rechercher les étudiants."),
      generic: L(locale, "Ocorreu um erro ao processar a solicitação.", "An error occurred while processing the request.", "Se produjo un error al procesar la solicitud.", "Une erreur s'est produite lors du traitement de la demande."),
      unauthorized: L(locale, "Sua sessão não está autenticada.", "Your session is not authenticated.", "Tu sesión no está autenticada.", "Votre session n'est pas authentifiée."),
      forbidden: L(locale, "Você não possui permissão para acessar esta área.", "You do not have permission to access this area.", "No tienes permiso para acceder a esta área.", "Vous n'êtes pas autorisé à accéder à cette zone."),
      forbiddenManage: L(locale, "Você não possui permissão para gerenciar candidaturas.", "You do not have permission to manage applications.", "No tienes permiso para gestionar candidaturas.", "Vous n'êtes pas autorisé à gérer les candidatures."),
      invalidOffer: L(locale, "Selecione uma oferta válida.", "Select a valid offer.", "Selecciona una oferta válida.", "Sélectionnez une offre valide."),
      invalidType: L(locale, "Selecione um tipo de candidato válido.", "Select a valid applicant type.", "Selecciona un tipo de candidato válido.", "Sélectionnez un type de candidat valide."),
      invalidStatus: L(locale, "Selecione uma situação válida.", "Select a valid status.", "Selecciona un estado válido.", "Sélectionnez un statut valide."),
      invalidStudent: L(locale, "Selecione um aluno válido.", "Select a valid student.", "Selecciona un alumno válido.", "Sélectionnez un étudiant valide."),
      invalidEnrollment: L(locale, "Selecione uma matrícula válida.", "Select a valid enrollment.", "Selecciona una matrícula válida.", "Sélectionnez une inscription valide."),
      enrollmentRequired: L(locale, "Selecione a matrícula acadêmica do aluno.", "Select the student's academic enrollment.", "Selecciona la matrícula académica del alumno.", "Sélectionnez l'inscription académique de l'étudiant."),
      ineligibleCourse: L(locale, "O curso da matrícula não está contemplado nesta oferta.", "The enrollment course is not eligible for this offer.", "El curso de la matrícula no está contemplado en esta oferta.", "La formation de l'inscription n'est pas éligible à cette offre."),
      nameRequired: L(locale, "Informe o nome do candidato.", "Enter the applicant's name.", "Indica el nombre del candidato.", "Indiquez le nom du candidat."),
      invalidEmail: L(locale, "Informe um e-mail válido.", "Enter a valid email.", "Indica un correo electrónico válido.", "Indiquez une adresse e-mail valide."),
      invalidCountry: L(locale, "Informe um código de país ISO válido.", "Enter a valid ISO country code.", "Indica un código ISO de país válido.", "Indiquez un code pays ISO valide."),
      invalidScore: L(locale, "Informe uma nota válida.", "Enter a valid score.", "Indica una nota válida.", "Indiquez une note valide."),
      invalidRanking: L(locale, "Informe uma classificação válida.", "Enter a valid ranking.", "Indica una clasificación válida.", "Indiquez un classement valide."),
      duplicate: L(locale, "Já existe candidatura deste candidato para esta oferta.", "This applicant already has an application for this offer.", "Ya existe una candidatura de este candidato para esta oferta.", "Ce candidat possède déjà une candidature pour cette offre."),
      notFound: L(locale, "Candidatura não encontrada.", "Application not found.", "Candidatura no encontrada.", "Candidature introuvable."),
      invalidId: L(locale, "Identificação inválida.", "Invalid identifier.", "Identificador no válido.", "Identifiant non valide.")
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

  console.log(`✓ ${locale}`);
}

console.log("");
console.log(
  "✓ CANDIDATURAS INTERNACIONALIZADAS NOS 5 IDIOMAS"
);
