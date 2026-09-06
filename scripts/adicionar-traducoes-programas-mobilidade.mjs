import fs from "node:fs";
import path from "node:path";

const dados = {
  "pt-BR": {
    nav: "Programas",
    back: "Mobilidade Internacional",
    title: "Programas de Mobilidade",
    subtitle: "Estruture intercâmbios, estágios, pesquisas, programas de idiomas e outras experiências internacionais.",
    total: "Total de programas",
    active: "Programas ativos",
    drafts: "Rascunhos",
    inactive: "Inativos",
    search: "Buscar programas...",
    allTypes: "Todos os tipos",
    allStatuses: "Todas as situações",
    allDirections: "Todas as direções",
    newProgram: "Novo programa",
    editProgram: "Editar programa",
    program: "Programa",
    type: "Tipo",
    partner: "Instituição parceira",
    direction: "Direção",
    language: "Idioma",
    duration: "Duração",
    offers: "Ofertas",
    status: "Situação",
    actions: "Ações",
    noPartner: "Sem instituição vinculada",
    minimumLevel: "Nível mínimo:",
    outgoing: "Saída",
    incoming: "Entrada",
    bilateral: "Bidirecional",
    draft: "Rascunho",
    activeStatus: "Ativo",
    inactiveStatus: "Inativo",
    archived: "Arquivado",
    refresh: "Atualizar",
    edit: "Editar",
    activate: "Ativar",
    deactivate: "Inativar",
    cancel: "Cancelar",
    save: "Salvar",
    saving: "Salvando...",
    emptyTitle: "Nenhum programa encontrado",
    emptyDescription: "Cadastre o primeiro programa de mobilidade ou ajuste os filtros.",
    identification: "Dados do programa",
    languageSection: "Requisitos de idioma",
    durationSection: "Duração do programa",
    durationDescription: "Informe a duração mínima e máxima prevista em dias.",
    agreement: "Convênio",
    noAgreement: "Sem convênio específico",
    agreementHelp: "Ao selecionar um convênio, a instituição parceira correspondente será vinculada automaticamente.",
    noPartnerField: "Sem instituição parceira específica",
    partnerFromAgreement: "Instituição parceira definida automaticamente pelo convênio selecionado.",
    inactive: "Inativa",
    name: "Nome do programa",
    code: "Código interno",
    description: "Descrição",
    languagePlaceholder: "Ex.: Francês, Inglês, Espanhol",
    minimumLanguageLevel: "Nível mínimo do idioma",
    minimumLanguageLevelPlaceholder: "Ex.: B2 CEFR, TOEFL 80",
    minimumDays: "Duração mínima (dias)",
    maximumDays: "Duração máxima (dias)",
    modalDescription: "Defina a modalidade, o vínculo institucional, os requisitos de idioma e a duração prevista.",
    created: "Programa cadastrado com sucesso.",
    updated: "Programa atualizado com sucesso.",
    activated: "Programa ativado.",
    deactivated: "Programa inativado."
  },

  "pt-PT": {
    nav: "Programas",
    back: "Mobilidade Internacional",
    title: "Programas de Mobilidade",
    subtitle: "Estruture intercâmbios, estágios, investigação, programas de idiomas e outras experiências internacionais.",
    total: "Total de programas",
    active: "Programas ativos",
    drafts: "Rascunhos",
    inactive: "Inativos",
    search: "Pesquisar programas...",
    allTypes: "Todos os tipos",
    allStatuses: "Todos os estados",
    allDirections: "Todas as direções",
    newProgram: "Novo programa",
    editProgram: "Editar programa",
    program: "Programa",
    type: "Tipo",
    partner: "Instituição parceira",
    direction: "Direção",
    language: "Idioma",
    duration: "Duração",
    offers: "Ofertas",
    status: "Estado",
    actions: "Ações",
    noPartner: "Sem instituição associada",
    minimumLevel: "Nível mínimo:",
    outgoing: "Saída",
    incoming: "Entrada",
    bilateral: "Bidirecional",
    draft: "Rascunho",
    activeStatus: "Ativo",
    inactiveStatus: "Inativo",
    archived: "Arquivado",
    refresh: "Atualizar",
    edit: "Editar",
    activate: "Ativar",
    deactivate: "Desativar",
    cancel: "Cancelar",
    save: "Guardar",
    saving: "A guardar...",
    emptyTitle: "Nenhum programa encontrado",
    emptyDescription: "Registe o primeiro programa de mobilidade ou ajuste os filtros.",
    identification: "Dados do programa",
    languageSection: "Requisitos de idioma",
    durationSection: "Duração do programa",
    durationDescription: "Indique a duração mínima e máxima prevista em dias.",
    agreement: "Protocolo",
    noAgreement: "Sem protocolo específico",
    agreementHelp: "Ao selecionar um protocolo, a instituição parceira correspondente será associada automaticamente.",
    noPartnerField: "Sem instituição parceira específica",
    partnerFromAgreement: "Instituição parceira definida automaticamente pelo protocolo selecionado.",
    inactive: "Inativa",
    name: "Nome do programa",
    code: "Código interno",
    description: "Descrição",
    languagePlaceholder: "Ex.: Francês, Inglês, Espanhol",
    minimumLanguageLevel: "Nível mínimo do idioma",
    minimumLanguageLevelPlaceholder: "Ex.: B2 CEFR, TOEFL 80",
    minimumDays: "Duração mínima (dias)",
    maximumDays: "Duração máxima (dias)",
    modalDescription: "Defina a modalidade, o vínculo institucional, os requisitos de idioma e a duração prevista.",
    created: "Programa registado com sucesso.",
    updated: "Programa atualizado com sucesso.",
    activated: "Programa ativado.",
    deactivated: "Programa desativado."
  },

  "en-US": {
    nav: "Programs",
    back: "International Mobility",
    title: "Mobility Programs",
    subtitle: "Structure exchanges, internships, research, language programs, and other international experiences.",
    total: "Total programs",
    active: "Active programs",
    drafts: "Drafts",
    inactive: "Inactive",
    search: "Search programs...",
    allTypes: "All types",
    allStatuses: "All statuses",
    allDirections: "All directions",
    newProgram: "New program",
    editProgram: "Edit program",
    program: "Program",
    type: "Type",
    partner: "Partner institution",
    direction: "Direction",
    language: "Language",
    duration: "Duration",
    offers: "Offers",
    status: "Status",
    actions: "Actions",
    noPartner: "No linked institution",
    minimumLevel: "Minimum level:",
    outgoing: "Outgoing",
    incoming: "Incoming",
    bilateral: "Bilateral",
    draft: "Draft",
    activeStatus: "Active",
    inactiveStatus: "Inactive",
    archived: "Archived",
    refresh: "Refresh",
    edit: "Edit",
    activate: "Activate",
    deactivate: "Deactivate",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    emptyTitle: "No programs found",
    emptyDescription: "Create the first mobility program or adjust the filters.",
    identification: "Program details",
    languageSection: "Language requirements",
    durationSection: "Program duration",
    durationDescription: "Enter the expected minimum and maximum duration in days.",
    agreement: "Agreement",
    noAgreement: "No specific agreement",
    agreementHelp: "When an agreement is selected, its partner institution is linked automatically.",
    noPartnerField: "No specific partner institution",
    partnerFromAgreement: "Partner institution defined automatically by the selected agreement.",
    inactive: "Inactive",
    name: "Program name",
    code: "Internal code",
    description: "Description",
    languagePlaceholder: "e.g. French, English, Spanish",
    minimumLanguageLevel: "Minimum language level",
    minimumLanguageLevelPlaceholder: "e.g. B2 CEFR, TOEFL 80",
    minimumDays: "Minimum duration (days)",
    maximumDays: "Maximum duration (days)",
    modalDescription: "Define the mobility model, institutional link, language requirements, and expected duration.",
    created: "Program created successfully.",
    updated: "Program updated successfully.",
    activated: "Program activated.",
    deactivated: "Program deactivated."
  },

  "es-ES": {
    nav: "Programas",
    back: "Movilidad Internacional",
    title: "Programas de Movilidad",
    subtitle: "Estructura intercambios, prácticas, investigación, programas de idiomas y otras experiencias internacionales.",
    total: "Total de programas",
    active: "Programas activos",
    drafts: "Borradores",
    inactive: "Inactivos",
    search: "Buscar programas...",
    allTypes: "Todos los tipos",
    allStatuses: "Todos los estados",
    allDirections: "Todas las direcciones",
    newProgram: "Nuevo programa",
    editProgram: "Editar programa",
    program: "Programa",
    type: "Tipo",
    partner: "Institución asociada",
    direction: "Dirección",
    language: "Idioma",
    duration: "Duración",
    offers: "Ofertas",
    status: "Estado",
    actions: "Acciones",
    noPartner: "Sin institución asociada",
    minimumLevel: "Nivel mínimo:",
    outgoing: "Salida",
    incoming: "Entrada",
    bilateral: "Bidireccional",
    draft: "Borrador",
    activeStatus: "Activo",
    inactiveStatus: "Inactivo",
    archived: "Archivado",
    refresh: "Actualizar",
    edit: "Editar",
    activate: "Activar",
    deactivate: "Desactivar",
    cancel: "Cancelar",
    save: "Guardar",
    saving: "Guardando...",
    emptyTitle: "No se encontraron programas",
    emptyDescription: "Registra el primer programa de movilidad o ajusta los filtros.",
    identification: "Datos del programa",
    languageSection: "Requisitos lingüísticos",
    durationSection: "Duración del programa",
    durationDescription: "Indica la duración mínima y máxima prevista en días.",
    agreement: "Convenio",
    noAgreement: "Sin convenio específico",
    agreementHelp: "Al seleccionar un convenio, su institución asociada se vincula automáticamente.",
    noPartnerField: "Sin institución asociada específica",
    partnerFromAgreement: "Institución asociada definida automáticamente por el convenio seleccionado.",
    inactive: "Inactiva",
    name: "Nombre del programa",
    code: "Código interno",
    description: "Descripción",
    languagePlaceholder: "Ej.: francés, inglés, español",
    minimumLanguageLevel: "Nivel mínimo del idioma",
    minimumLanguageLevelPlaceholder: "Ej.: B2 MCER, TOEFL 80",
    minimumDays: "Duración mínima (días)",
    maximumDays: "Duración máxima (días)",
    modalDescription: "Define la modalidad, el vínculo institucional, los requisitos lingüísticos y la duración prevista.",
    created: "Programa registrado correctamente.",
    updated: "Programa actualizado correctamente.",
    activated: "Programa activado.",
    deactivated: "Programa desactivado."
  },

  "fr-FR": {
    nav: "Programmes",
    back: "Mobilité Internationale",
    title: "Programmes de Mobilité",
    subtitle: "Structurez les échanges, stages, recherches, programmes linguistiques et autres expériences internationales.",
    total: "Total des programmes",
    active: "Programmes actifs",
    drafts: "Brouillons",
    inactive: "Inactifs",
    search: "Rechercher des programmes...",
    allTypes: "Tous les types",
    allStatuses: "Tous les statuts",
    allDirections: "Toutes les directions",
    newProgram: "Nouveau programme",
    editProgram: "Modifier le programme",
    program: "Programme",
    type: "Type",
    partner: "Établissement partenaire",
    direction: "Direction",
    language: "Langue",
    duration: "Durée",
    offers: "Offres",
    status: "Statut",
    actions: "Actions",
    noPartner: "Aucun établissement associé",
    minimumLevel: "Niveau minimum :",
    outgoing: "Sortante",
    incoming: "Entrante",
    bilateral: "Bilatérale",
    draft: "Brouillon",
    activeStatus: "Actif",
    inactiveStatus: "Inactif",
    archived: "Archivé",
    refresh: "Actualiser",
    edit: "Modifier",
    activate: "Activer",
    deactivate: "Désactiver",
    cancel: "Annuler",
    save: "Enregistrer",
    saving: "Enregistrement...",
    emptyTitle: "Aucun programme trouvé",
    emptyDescription: "Créez le premier programme de mobilité ou modifiez les filtres.",
    identification: "Informations du programme",
    languageSection: "Exigences linguistiques",
    durationSection: "Durée du programme",
    durationDescription: "Indiquez la durée minimale et maximale prévue en jours.",
    agreement: "Accord",
    noAgreement: "Aucun accord spécifique",
    agreementHelp: "Lorsqu'un accord est sélectionné, son établissement partenaire est associé automatiquement.",
    noPartnerField: "Aucun établissement partenaire spécifique",
    partnerFromAgreement: "Établissement partenaire défini automatiquement par l'accord sélectionné.",
    inactive: "Inactif",
    name: "Nom du programme",
    code: "Code interne",
    description: "Description",
    languagePlaceholder: "Ex. : Français, Anglais, Espagnol",
    minimumLanguageLevel: "Niveau linguistique minimum",
    minimumLanguageLevelPlaceholder: "Ex. : B2 CECRL, TOEFL 80",
    minimumDays: "Durée minimale (jours)",
    maximumDays: "Durée maximale (jours)",
    modalDescription: "Définissez le modèle de mobilité, le lien institutionnel, les exigences linguistiques et la durée prévue.",
    created: "Programme enregistré avec succès.",
    updated: "Programme mis à jour avec succès.",
    activated: "Programme activé.",
    deactivated: "Programme désactivé."
  }
};

const tipos = {
  "pt-BR": {
    academicSemester: "Semestre acadêmico",
    academicYear: "Ano acadêmico",
    shortTerm: "Curta duração",
    language: "Programa de idiomas",
    internship: "Estágio",
    research: "Pesquisa",
    summerSchool: "Summer School",
    winterSchool: "Winter School",
    doubleDegree: "Dupla titulação",
    hybrid: "Híbrido",
    virtual: "Virtual",
    other: "Outro"
  },
  "pt-PT": {
    academicSemester: "Semestre académico",
    academicYear: "Ano académico",
    shortTerm: "Curta duração",
    language: "Programa de idiomas",
    internship: "Estágio",
    research: "Investigação",
    summerSchool: "Summer School",
    winterSchool: "Winter School",
    doubleDegree: "Dupla titulação",
    hybrid: "Híbrido",
    virtual: "Virtual",
    other: "Outro"
  },
  "en-US": {
    academicSemester: "Academic semester",
    academicYear: "Academic year",
    shortTerm: "Short-term program",
    language: "Language program",
    internship: "Internship",
    research: "Research",
    summerSchool: "Summer School",
    winterSchool: "Winter School",
    doubleDegree: "Double degree",
    hybrid: "Hybrid",
    virtual: "Virtual",
    other: "Other"
  },
  "es-ES": {
    academicSemester: "Semestre académico",
    academicYear: "Año académico",
    shortTerm: "Corta duración",
    language: "Programa de idiomas",
    internship: "Prácticas",
    research: "Investigación",
    summerSchool: "Summer School",
    winterSchool: "Winter School",
    doubleDegree: "Doble titulación",
    hybrid: "Híbrido",
    virtual: "Virtual",
    other: "Otro"
  },
  "fr-FR": {
    academicSemester: "Semestre académique",
    academicYear: "Année académique",
    shortTerm: "Courte durée",
    language: "Programme linguistique",
    internship: "Stage",
    research: "Recherche",
    summerSchool: "Summer School",
    winterSchool: "Winter School",
    doubleDegree: "Double diplôme",
    hybrid: "Hybride",
    virtual: "Virtuel",
    other: "Autre"
  }
};

function erro(locale, pt, en, es, fr) {
  if (locale === "en-US") return en;
  if (locale === "es-ES") return es;
  if (locale === "fr-FR") return fr;
  return pt;
}

for (const [locale, x] of Object.entries(dados)) {
  const arquivo = path.resolve(
    "messages",
    `${locale}.json`
  );

  const json = JSON.parse(
    fs.readFileSync(
      arquivo,
      "utf8"
    )
  );

  if (!json.AdminNavigation) {
    throw new Error(
      `AdminNavigation ausente em ${locale}`
    );
  }

  json.AdminNavigation.mobilityPrograms =
    x.nav;

  json.AdminMobilityPrograms = {
    back: x.back,
    title: x.title,
    subtitle: x.subtitle,

    summary: {
      total: x.total,
      active: x.active,
      drafts: x.drafts,
      inactive: x.inactive
    },

    filters: {
      search: x.search,
      allTypes: x.allTypes,
      allStatuses: x.allStatuses,
      allDirections: x.allDirections
    },

    table: {
      program: x.program,
      type: x.type,
      partner: x.partner,
      direction: x.direction,
      language: x.language,
      duration: x.duration,
      offers: x.offers,
      status: x.status,
      actions: x.actions,
      noPartner: x.noPartner,
      minimumLevel: x.minimumLevel
    },

    types: tipos[locale],

    directions: {
      outgoing: x.outgoing,
      incoming: x.incoming,
      bilateral: x.bilateral
    },

    statuses: {
      draft: x.draft,
      active: x.activeStatus,
      inactive: x.inactiveStatus,
      archived: x.archived
    },

    duration: {
      days:
        locale === "en-US"
          ? "{count} days"
          : locale === "fr-FR"
            ? "{count} jours"
            : locale === "es-ES"
              ? "{count} días"
              : "{count} dias",

      range:
        locale === "en-US"
          ? "{min} to {max} days"
          : locale === "fr-FR"
            ? "{min} à {max} jours"
            : locale === "es-ES"
              ? "{min} a {max} días"
              : "{min} a {max} dias",

      minimum:
        locale === "en-US"
          ? "At least {count} days"
          : locale === "fr-FR"
            ? "Minimum {count} jours"
            : locale === "es-ES"
              ? "Mínimo {count} días"
              : "Mínimo de {count} dias",

      maximum:
        locale === "en-US"
          ? "Up to {count} days"
          : locale === "fr-FR"
            ? "Maximum {count} jours"
            : locale === "es-ES"
              ? "Máximo {count} días"
              : "Máximo de {count} dias"
    },

    actions: {
      new: x.newProgram,
      refresh: x.refresh,
      edit: x.edit,
      activate: x.activate,
      deactivate: x.deactivate,
      cancel: x.cancel,
      save: x.save,
      saving: x.saving
    },

    empty: {
      title: x.emptyTitle,
      description: x.emptyDescription
    },

    sections: {
      identification: x.identification,
      language: x.languageSection,
      duration: x.durationSection,
      durationDescription: x.durationDescription
    },

    fields: {
      agreement: x.agreement,
      noAgreement: x.noAgreement,
      agreementHelp: x.agreementHelp,
      partner: x.partner,
      noPartner: x.noPartnerField,
      partnerFromAgreement: x.partnerFromAgreement,
      inactive: x.inactive,
      name: x.name,
      code: x.code,
      type: x.type,
      direction: x.direction,
      status: x.status,
      description: x.description,
      language: x.language,
      languagePlaceholder: x.languagePlaceholder,
      minimumLanguageLevel: x.minimumLanguageLevel,
      minimumLanguageLevelPlaceholder: x.minimumLanguageLevelPlaceholder,
      minimumDays: x.minimumDays,
      maximumDays: x.maximumDays
    },

    modal: {
      newTitle: x.newProgram,
      editTitle: x.editProgram,
      description: x.modalDescription
    },

    messages: {
      created: x.created,
      updated: x.updated,
      activated: x.activated,
      deactivated: x.deactivated
    },

    errors: {
      load: erro(
        locale,
        "Não foi possível carregar os programas.",
        "Programs could not be loaded.",
        "No se pudieron cargar los programas.",
        "Impossible de charger les programmes."
      ),

      save: erro(
        locale,
        "Não foi possível salvar o programa.",
        "The program could not be saved.",
        "No se pudo guardar el programa.",
        "Impossible d'enregistrer le programme."
      ),

      statusChange: erro(
        locale,
        "Não foi possível alterar a situação do programa.",
        "The program status could not be changed.",
        "No se pudo cambiar el estado del programa.",
        "Impossible de modifier le statut du programme."
      ),

      generic: erro(
        locale,
        "Ocorreu um erro ao processar a solicitação.",
        "An error occurred while processing the request.",
        "Se produjo un error al procesar la solicitud.",
        "Une erreur s'est produite lors du traitement de la demande."
      ),

      unauthorized: erro(
        locale,
        "Sua sessão não está autenticada.",
        "Your session is not authenticated.",
        "Tu sesión no está autenticada.",
        "Votre session n'est pas authentifiée."
      ),

      forbidden: erro(
        locale,
        "Você não possui permissão para acessar esta área.",
        "You do not have permission to access this area.",
        "No tienes permiso para acceder a esta área.",
        "Vous n'êtes pas autorisé à accéder à cette zone."
      ),

      forbiddenManage: erro(
        locale,
        "Você não possui permissão para gerenciar programas de mobilidade.",
        "You do not have permission to manage mobility programs.",
        "No tienes permiso para gestionar programas de movilidad.",
        "Vous n'êtes pas autorisé à gérer les programmes de mobilité."
      ),

      nameRequired: erro(
        locale,
        "Informe o nome do programa.",
        "Enter the program name.",
        "Indica el nombre del programa.",
        "Indiquez le nom du programme."
      ),

      invalidType: erro(
        locale,
        "Selecione um tipo de programa válido.",
        "Select a valid program type.",
        "Selecciona un tipo de programa válido.",
        "Sélectionnez un type de programme valide."
      ),

      invalidDirection: erro(
        locale,
        "Selecione uma direção válida.",
        "Select a valid direction.",
        "Selecciona una dirección válida.",
        "Sélectionnez une direction valide."
      ),

      invalidStatus: erro(
        locale,
        "Selecione uma situação válida.",
        "Select a valid status.",
        "Selecciona un estado válido.",
        "Sélectionnez un statut valide."
      ),

      invalidAgreement: erro(
        locale,
        "Selecione um convênio válido.",
        "Select a valid agreement.",
        "Selecciona un convenio válido.",
        "Sélectionnez un accord valide."
      ),

      invalidPartner: erro(
        locale,
        "Selecione uma instituição parceira válida.",
        "Select a valid partner institution.",
        "Selecciona una institución asociada válida.",
        "Sélectionnez un établissement partenaire valide."
      ),

      invalidLink: erro(
        locale,
        "O vínculo institucional é inválido.",
        "The institutional link is invalid.",
        "El vínculo institucional no es válido.",
        "Le lien institutionnel n'est pas valide."
      ),

      invalidDuration: erro(
        locale,
        "Informe uma duração válida.",
        "Enter a valid duration.",
        "Indica una duración válida.",
        "Indiquez une durée valide."
      ),

      invalidDurationRange: erro(
        locale,
        "A duração máxima não pode ser menor que a duração mínima.",
        "Maximum duration cannot be shorter than minimum duration.",
        "La duración máxima no puede ser inferior a la mínima.",
        "La durée maximale ne peut pas être inférieure à la durée minimale."
      ),

      duplicateCode: erro(
        locale,
        "Este código de programa já está em uso.",
        "This program code is already in use.",
        "Este código de programa ya está en uso.",
        "Ce code de programme est déjà utilisé."
      ),

      notFound: erro(
        locale,
        "Programa não encontrado.",
        "Program not found.",
        "Programa no encontrado.",
        "Programme introuvable."
      ),

      invalidId: erro(
        locale,
        "Identificação inválida.",
        "Invalid identifier.",
        "Identificador no válido.",
        "Identifiant non valide."
      ),

      invalidActive: erro(
        locale,
        "Situação de disponibilidade inválida.",
        "Invalid program availability.",
        "Disponibilidad del programa no válida.",
        "Disponibilité du programme non valide."
      )
    }
  };

  if (
    locale === "pt-BR" &&
    json.AdminMobilityAgreements?.filters
  ) {
    json.AdminMobilityAgreements.filters.allStatuses =
      "Todas as situações";
  }

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
  "✓ PROGRAMAS DE MOBILIDADE TRADUZIDOS NOS 5 IDIOMAS"
);
