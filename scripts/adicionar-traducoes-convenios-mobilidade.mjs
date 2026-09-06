import fs from "node:fs";
import path from "node:path";

const base = {
  "pt-BR": {
    nav: "Convênios",
    back: "Mobilidade Internacional",
    title: "Convênios",
    subtitle: "Gerencie os acordos institucionais que sustentam os programas de mobilidade acadêmica.",
    total: "Total de convênios",
    active: "Convênios ativos",
    drafts: "Rascunhos",
    suspended: "Suspensos",
    new: "Novo convênio",
    agreement: "Convênio",
    partner: "Instituição parceira",
    direction: "Direção",
    validity: "Vigência",
    courses: "Cursos",
    status: "Status",
    actions: "Ações",
    outgoing: "Saída",
    incoming: "Entrada",
    bilateral: "Bidirecional",
    draft: "Rascunho",
    activeStatus: "Ativo",
    suspendedStatus: "Suspenso",
    closed: "Encerrado",
    expired: "Expirado"
  },
  "pt-PT": {
    nav: "Protocolos",
    back: "Mobilidade Internacional",
    title: "Protocolos",
    subtitle: "Gira os acordos institucionais que sustentam os programas de mobilidade académica.",
    total: "Total de protocolos",
    active: "Protocolos ativos",
    drafts: "Rascunhos",
    suspended: "Suspensos",
    new: "Novo protocolo",
    agreement: "Protocolo",
    partner: "Instituição parceira",
    direction: "Direção",
    validity: "Vigência",
    courses: "Cursos",
    status: "Estado",
    actions: "Ações",
    outgoing: "Saída",
    incoming: "Entrada",
    bilateral: "Bidirecional",
    draft: "Rascunho",
    activeStatus: "Ativo",
    suspendedStatus: "Suspenso",
    closed: "Encerrado",
    expired: "Expirado"
  },
  "en-US": {
    nav: "Agreements",
    back: "International Mobility",
    title: "Agreements",
    subtitle: "Manage the institutional agreements that support academic mobility programs.",
    total: "Total agreements",
    active: "Active agreements",
    drafts: "Drafts",
    suspended: "Suspended",
    new: "New agreement",
    agreement: "Agreement",
    partner: "Partner institution",
    direction: "Direction",
    validity: "Validity",
    courses: "Programs / Courses",
    status: "Status",
    actions: "Actions",
    outgoing: "Outgoing",
    incoming: "Incoming",
    bilateral: "Bilateral",
    draft: "Draft",
    activeStatus: "Active",
    suspendedStatus: "Suspended",
    closed: "Closed",
    expired: "Expired"
  },
  "es-ES": {
    nav: "Convenios",
    back: "Movilidad Internacional",
    title: "Convenios",
    subtitle: "Gestiona los acuerdos institucionales que sustentan los programas de movilidad académica.",
    total: "Total de convenios",
    active: "Convenios activos",
    drafts: "Borradores",
    suspended: "Suspendidos",
    new: "Nuevo convenio",
    agreement: "Convenio",
    partner: "Institución asociada",
    direction: "Dirección",
    validity: "Vigencia",
    courses: "Cursos",
    status: "Estado",
    actions: "Acciones",
    outgoing: "Salida",
    incoming: "Entrada",
    bilateral: "Bidireccional",
    draft: "Borrador",
    activeStatus: "Activo",
    suspendedStatus: "Suspendido",
    closed: "Finalizado",
    expired: "Expirado"
  },
  "fr-FR": {
    nav: "Accords",
    back: "Mobilité Internationale",
    title: "Accords",
    subtitle: "Gérez les accords institutionnels qui encadrent les programmes de mobilité académique.",
    total: "Total des accords",
    active: "Accords actifs",
    drafts: "Brouillons",
    suspended: "Suspendus",
    new: "Nouvel accord",
    agreement: "Accord",
    partner: "Établissement partenaire",
    direction: "Direction",
    validity: "Validité",
    courses: "Formations",
    status: "Statut",
    actions: "Actions",
    outgoing: "Sortante",
    incoming: "Entrante",
    bilateral: "Bilatérale",
    draft: "Brouillon",
    activeStatus: "Actif",
    suspendedStatus: "Suspendu",
    closed: "Clôturé",
    expired: "Expiré"
  }
};

for (const [locale, x] of Object.entries(base)) {
  const arquivo = path.resolve("messages", `${locale}.json`);
  const json = JSON.parse(fs.readFileSync(arquivo, "utf8"));

  json.AdminNavigation.mobilityAgreements = x.nav;

  json.AdminMobilityAgreements = {
    back: x.back,
    title: x.title,
    subtitle: x.subtitle,

    summary: {
      total: x.total,
      active: x.active,
      drafts: x.drafts,
      suspended: x.suspended
    },

    filters: {
      search: locale === "en-US" ? "Search agreements..." :
              locale === "fr-FR" ? "Rechercher des accords..." :
              locale === "es-ES" ? "Buscar convenios..." :
              locale === "pt-PT" ? "Pesquisar protocolos..." :
              "Buscar convênios...",
      allStatuses: locale === "en-US" ? "All statuses" : locale === "fr-FR" ? "Tous les statuts" : locale === "es-ES" ? "Todos los estados" : "Todos os status",
      allDirections: locale === "en-US" ? "All directions" : locale === "fr-FR" ? "Toutes les directions" : locale === "es-ES" ? "Todas las direcciones" : "Todas as direções",
      allPartners: locale === "en-US" ? "All partner institutions" : locale === "fr-FR" ? "Tous les établissements" : locale === "es-ES" ? "Todas las instituciones" : "Todas as instituições"
    },

    table: {
      agreement: x.agreement,
      partner: x.partner,
      direction: x.direction,
      validity: x.validity,
      courses: x.courses,
      status: x.status,
      actions: x.actions,
      allCourses: locale === "en-US" ? "Institution-wide" : locale === "fr-FR" ? "Tous les programmes" : locale === "es-ES" ? "Todos los cursos" : "Abrangência geral",
      courseCount: locale === "en-US" ? "{count} course(s)" : locale === "fr-FR" ? "{count} formation(s)" : locale === "es-ES" ? "{count} curso(s)" : "{count} curso(s)"
    },

    directions: {
      outgoing: x.outgoing,
      incoming: x.incoming,
      bilateral: x.bilateral
    },

    statuses: {
      draft: x.draft,
      active: x.activeStatus,
      suspended: x.suspendedStatus,
      closed: x.closed,
      expired: x.expired
    },

    actions: {
      new: x.new,
      refresh: locale === "en-US" ? "Refresh" : locale === "fr-FR" ? "Actualiser" : locale === "es-ES" ? "Actualizar" : "Atualizar",
      edit: locale === "en-US" ? "Edit" : locale === "fr-FR" ? "Modifier" : locale === "es-ES" ? "Editar" : "Editar",
      cancel: locale === "en-US" ? "Cancel" : locale === "fr-FR" ? "Annuler" : "Cancelar",
      save: locale === "en-US" ? "Save" : locale === "fr-FR" ? "Enregistrer" : locale === "es-ES" ? "Guardar" : locale === "pt-PT" ? "Guardar" : "Salvar",
      saving: locale === "en-US" ? "Saving..." : locale === "fr-FR" ? "Enregistrement..." : locale === "es-ES" ? "Guardando..." : "Salvando..."
    },

    sections: {
      identification: locale === "en-US" ? "Agreement details" : locale === "fr-FR" ? "Informations de l'accord" : locale === "es-ES" ? "Datos del convenio" : "Dados do convênio",
      validity: locale === "en-US" ? "Validity and seats" : locale === "fr-FR" ? "Validité et places" : locale === "es-ES" ? "Vigencia y plazas" : "Vigência e vagas",
      courses: x.courses,
      coursesDescription: locale === "en-US" ? "Select the courses covered by this agreement. Leave all unchecked for institution-wide coverage." : locale === "fr-FR" ? "Sélectionnez les formations couvertes. Ne sélectionnez aucune formation pour une portée institutionnelle générale." : locale === "es-ES" ? "Selecciona los cursos cubiertos. Deja todos sin marcar para una cobertura institucional general." : "Selecione os cursos abrangidos. Deixe todos desmarcados para um convênio de abrangência institucional geral.",
      notes: locale === "en-US" ? "Notes" : locale === "fr-FR" ? "Observations" : locale === "es-ES" ? "Observaciones" : "Observações"
    },

    fields: {
      partner: x.partner,
      selectPartner: locale === "en-US" ? "Select a partner institution" : locale === "fr-FR" ? "Sélectionnez un établissement" : locale === "es-ES" ? "Selecciona una institución" : "Selecione uma instituição parceira",
      inactivePartner: locale === "en-US" ? "Inactive" : locale === "fr-FR" ? "Inactif" : locale === "es-ES" ? "Inactiva" : "Inativa",
      name: locale === "en-US" ? "Agreement name" : locale === "fr-FR" ? "Nom de l'accord" : locale === "es-ES" ? "Nombre del convenio" : locale === "pt-PT" ? "Nome do protocolo" : "Nome do convênio",
      code: locale === "en-US" ? "Internal code" : locale === "fr-FR" ? "Code interne" : locale === "es-ES" ? "Código interno" : "Código interno",
      description: locale === "en-US" ? "Description" : locale === "fr-FR" ? "Description" : locale === "es-ES" ? "Descripción" : "Descrição",
      direction: x.direction,
      status: x.status,
      startDate: locale === "en-US" ? "Start date" : locale === "fr-FR" ? "Date de début" : locale === "es-ES" ? "Fecha inicial" : "Início da vigência",
      endDate: locale === "en-US" ? "End date" : locale === "fr-FR" ? "Date de fin" : locale === "es-ES" ? "Fecha final" : "Fim da vigência",
      outgoingSeats: locale === "en-US" ? "Outgoing seats per year" : locale === "fr-FR" ? "Places sortantes par an" : locale === "es-ES" ? "Plazas de salida por año" : "Vagas de saída por ano",
      incomingSeats: locale === "en-US" ? "Incoming seats per year" : locale === "fr-FR" ? "Places entrantes par an" : locale === "es-ES" ? "Plazas de entrada por año" : "Vagas de entrada por ano",
      reciprocity: locale === "en-US" ? "Reciprocity agreement" : locale === "fr-FR" ? "Accord de réciprocité" : locale === "es-ES" ? "Acuerdo de reciprocidad" : "Convênio com reciprocidade",
      reciprocityDescription: locale === "en-US" ? "Both institutions exchange students under reciprocal conditions." : locale === "fr-FR" ? "Les deux établissements échangent des étudiants selon des conditions réciproques." : locale === "es-ES" ? "Ambas instituciones intercambian estudiantes bajo condiciones recíprocas." : "As duas instituições recebem e enviam estudantes em condições recíprocas.",
      tuitionWaiver: locale === "en-US" ? "Academic tuition waiver" : locale === "fr-FR" ? "Exonération des frais académiques" : locale === "es-ES" ? "Exención de tasas académicas" : "Isenção de taxa acadêmica",
      tuitionWaiverDescription: locale === "en-US" ? "Students are exempt from academic tuition at the host institution according to this agreement." : locale === "fr-FR" ? "Les étudiants sont exonérés des frais académiques selon cet accord." : locale === "es-ES" ? "Los estudiantes están exentos de tasas académicas según el convenio." : "Os estudantes ficam isentos da taxa acadêmica da instituição anfitriã conforme o convênio.",
      searchCourses: locale === "en-US" ? "Search courses..." : locale === "fr-FR" ? "Rechercher des formations..." : locale === "es-ES" ? "Buscar cursos..." : "Buscar cursos...",
      noCourses: locale === "en-US" ? "No courses found." : locale === "fr-FR" ? "Aucune formation trouvée." : locale === "es-ES" ? "No se encontraron cursos." : "Nenhum curso encontrado.",
      inactiveCourse: locale === "en-US" ? "Inactive" : locale === "fr-FR" ? "Inactif" : locale === "es-ES" ? "Inactivo" : "Inativo",
      allCoursesSelected: locale === "en-US" ? "No specific course selected: institution-wide coverage." : locale === "fr-FR" ? "Aucune formation spécifique : portée institutionnelle générale." : locale === "es-ES" ? "Ningún curso específico: cobertura institucional general." : "Nenhum curso específico selecionado: abrangência institucional geral.",
      selectedCourses: locale === "en-US" ? "{count} course(s) selected" : locale === "fr-FR" ? "{count} formation(s) sélectionnée(s)" : locale === "es-ES" ? "{count} curso(s) seleccionado(s)" : "{count} curso(s) selecionado(s)"
    },

    modal: {
      newTitle: x.new,
      editTitle: locale === "en-US" ? "Edit agreement" : locale === "fr-FR" ? "Modifier l'accord" : locale === "es-ES" ? "Editar convenio" : locale === "pt-PT" ? "Editar protocolo" : "Editar convênio",
      description: locale === "en-US" ? "Register the institutional terms, validity, seats and covered courses." : locale === "fr-FR" ? "Enregistrez les conditions institutionnelles, la validité, les places et les formations couvertes." : locale === "es-ES" ? "Registra las condiciones institucionales, vigencia, plazas y cursos cubiertos." : "Registre as condições institucionais, vigência, vagas e cursos abrangidos."
    },

    empty: {
      title: locale === "en-US" ? "No agreements found" : locale === "fr-FR" ? "Aucun accord trouvé" : locale === "es-ES" ? "No se encontraron convenios" : locale === "pt-PT" ? "Nenhum protocolo encontrado" : "Nenhum convênio encontrado",
      description: locale === "en-US" ? "Create the first mobility agreement or adjust the filters." : locale === "fr-FR" ? "Créez le premier accord de mobilité ou modifiez les filtres." : locale === "es-ES" ? "Crea el primer convenio de movilidad o ajusta los filtros." : "Cadastre o primeiro convênio de mobilidade ou ajuste os filtros."
    },

    messages: {
      created: locale === "en-US" ? "Agreement created successfully." : locale === "fr-FR" ? "Accord enregistré avec succès." : locale === "es-ES" ? "Convenio registrado correctamente." : locale === "pt-PT" ? "Protocolo registado com sucesso." : "Convênio cadastrado com sucesso.",
      updated: locale === "en-US" ? "Agreement updated successfully." : locale === "fr-FR" ? "Accord mis à jour avec succès." : locale === "es-ES" ? "Convenio actualizado correctamente." : locale === "pt-PT" ? "Protocolo atualizado com sucesso." : "Convênio atualizado com sucesso."
    },

    errors: {
      load: "LOAD",
      save: "SAVE",
      generic: locale === "en-US" ? "An error occurred while processing the request." : locale === "fr-FR" ? "Une erreur s'est produite." : locale === "es-ES" ? "Se produjo un error." : "Ocorreu um erro ao processar a solicitação.",
      unauthorized: locale === "en-US" ? "Your session is not authenticated." : "Sessão não autenticada.",
      forbidden: locale === "en-US" ? "You do not have permission to access this area." : "Você não possui permissão para acessar esta área.",
      forbiddenManage: locale === "en-US" ? "You do not have permission to manage agreements." : "Você não possui permissão para gerenciar convênios.",
      nameRequired: locale === "en-US" ? "Enter the agreement name." : "Informe o nome do convênio.",
      invalidPartner: locale === "en-US" ? "Select a valid active partner institution." : "Selecione uma instituição parceira ativa válida.",
      invalidDirection: locale === "en-US" ? "Select a valid direction." : "Selecione uma direção válida.",
      invalidStatus: locale === "en-US" ? "Select a valid status." : "Selecione um status válido.",
      invalidDate: locale === "en-US" ? "Enter a valid date." : "Informe uma data válida.",
      invalidValidity: locale === "en-US" ? "The end date cannot be before the start date." : "O fim da vigência não pode ser anterior ao início.",
      invalidSeats: locale === "en-US" ? "Enter a valid number of seats." : "Informe uma quantidade de vagas válida.",
      invalidCourse: locale === "en-US" ? "One or more selected courses are invalid." : "Um ou mais cursos selecionados são inválidos.",
      duplicateCode: locale === "en-US" ? "This agreement code is already in use." : "Este código de convênio já está em uso.",
      notFound: locale === "en-US" ? "Agreement not found." : "Convênio não encontrado.",
      invalidId: locale === "en-US" ? "Invalid identifier." : "Identificação inválida."
    }
  };

  fs.writeFileSync(
    arquivo,
    JSON.stringify(json, null, 2) + "\n",
    "utf8"
  );

  console.log(`✓ ${locale}`);
}

console.log("");
console.log("✓ CONVÊNIOS INTERNACIONALIZADOS NOS 5 IDIOMAS");
