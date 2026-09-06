import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    nav: "Instituições parceiras",
    page: {
      back: "Mobilidade Internacional",
      title: "Instituições Parceiras",
      subtitle:
        "Cadastre e gerencie universidades, escolas e organizações parceiras dos programas de mobilidade acadêmica.",
      summary: {
        total: "Total de instituições",
        active: "Instituições ativas",
        inactive: "Instituições inativas"
      },
      filters: {
        search: "Buscar por nome, sigla, código, cidade ou e-mail...",
        allCountries: "Todos os países",
        all: "Todas",
        active: "Ativas",
        inactive: "Inativas"
      },
      table: {
        institution: "Instituição",
        location: "Localização",
        contact: "Contato internacional",
        agreements: "Convênios",
        status: "Status",
        actions: "Ações"
      },
      status: {
        active: "Ativa",
        inactive: "Inativa"
      },
      actions: {
        new: "Nova instituição parceira",
        refresh: "Atualizar",
        edit: "Editar",
        activate: "Ativar",
        deactivate: "Inativar",
        website: "Site",
        cancel: "Cancelar",
        save: "Salvar",
        saving: "Salvando..."
      },
      sections: {
        institution: "Dados institucionais",
        contact: "Contato internacional",
        management: "Gestão"
      },
      fields: {
        name: "Nome da instituição",
        acronym: "Sigla",
        code: "Código interno",
        country: "País",
        state: "Estado / Província / Região",
        city: "Cidade",
        postalCode: "CEP / Código postal",
        address: "Endereço",
        website: "Site",
        generalEmail: "E-mail geral",
        generalPhone: "Telefone geral",
        contactName: "Nome do responsável",
        contactRole: "Cargo / Função",
        contactEmail: "E-mail do responsável",
        contactPhone: "Telefone do responsável",
        notes: "Observações",
        active: "Instituição ativa",
        activeDescription:
          "Instituições inativas permanecem no histórico, mas não devem ser usadas em novos programas."
      },
      modal: {
        newTitle: "Nova instituição parceira",
        editTitle: "Editar instituição parceira",
        description:
          "Registre os dados institucionais e o principal contato internacional."
      },
      mobile: {
        agreements: "{count, plural, =0 {Nenhum convênio} =1 {1 convênio} other {# convênios}}"
      },
      empty: {
        title: "Nenhuma instituição encontrada",
        description:
          "Cadastre a primeira instituição parceira ou ajuste os filtros da pesquisa."
      },
      messages: {
        created: "Instituição parceira cadastrada com sucesso.",
        updated: "Instituição parceira atualizada com sucesso.",
        activated: "Instituição parceira ativada.",
        deactivated: "Instituição parceira inativada."
      },
      errors: {
        load: "Não foi possível carregar as instituições parceiras.",
        save: "Não foi possível salvar a instituição parceira.",
        status: "Não foi possível alterar o status.",
        generic: "Ocorreu um erro ao processar a solicitação.",
        unauthorized: "Sua sessão não está autenticada.",
        forbidden: "Você não possui permissão para acessar esta área.",
        forbiddenManage: "Você não possui permissão para gerenciar instituições parceiras.",
        nameRequired: "Informe o nome da instituição.",
        invalidCountry: "Selecione um país válido.",
        invalidEmail: "Informe um endereço de e-mail válido.",
        invalidWebsite: "Informe um endereço de site válido.",
        duplicate: "Já existe uma instituição parceira com este nome neste país.",
        notFound: "Instituição parceira não encontrada.",
        invalidId: "Identificação inválida.",
        invalidStatus: "Status inválido."
      }
    }
  },

  "pt-PT": {
    nav: "Instituições parceiras",
    page: {
      back: "Mobilidade Internacional",
      title: "Instituições Parceiras",
      subtitle:
        "Registe e gira universidades, escolas e organizações parceiras dos programas de mobilidade académica.",
      summary: {
        total: "Total de instituições",
        active: "Instituições ativas",
        inactive: "Instituições inativas"
      },
      filters: {
        search: "Pesquisar por nome, sigla, código, cidade ou e-mail...",
        allCountries: "Todos os países",
        all: "Todas",
        active: "Ativas",
        inactive: "Inativas"
      },
      table: {
        institution: "Instituição",
        location: "Localização",
        contact: "Contacto internacional",
        agreements: "Protocolos",
        status: "Estado",
        actions: "Ações"
      },
      status: {
        active: "Ativa",
        inactive: "Inativa"
      },
      actions: {
        new: "Nova instituição parceira",
        refresh: "Atualizar",
        edit: "Editar",
        activate: "Ativar",
        deactivate: "Desativar",
        website: "Site",
        cancel: "Cancelar",
        save: "Guardar",
        saving: "A guardar..."
      },
      sections: {
        institution: "Dados institucionais",
        contact: "Contacto internacional",
        management: "Gestão"
      },
      fields: {
        name: "Nome da instituição",
        acronym: "Sigla",
        code: "Código interno",
        country: "País",
        state: "Distrito / Região / Província",
        city: "Cidade",
        postalCode: "Código postal",
        address: "Morada",
        website: "Site",
        generalEmail: "E-mail geral",
        generalPhone: "Telefone geral",
        contactName: "Nome do responsável",
        contactRole: "Cargo / Função",
        contactEmail: "E-mail do responsável",
        contactPhone: "Telefone do responsável",
        notes: "Observações",
        active: "Instituição ativa",
        activeDescription:
          "As instituições inativas permanecem no histórico, mas não devem ser usadas em novos programas."
      },
      modal: {
        newTitle: "Nova instituição parceira",
        editTitle: "Editar instituição parceira",
        description:
          "Registe os dados institucionais e o principal contacto internacional."
      },
      mobile: {
        agreements: "{count, plural, =0 {Nenhum protocolo} =1 {1 protocolo} other {# protocolos}}"
      },
      empty: {
        title: "Nenhuma instituição encontrada",
        description:
          "Registe a primeira instituição parceira ou ajuste os filtros."
      },
      messages: {
        created: "Instituição parceira registada com sucesso.",
        updated: "Instituição parceira atualizada com sucesso.",
        activated: "Instituição parceira ativada.",
        deactivated: "Instituição parceira desativada."
      },
      errors: {
        load: "Não foi possível carregar as instituições parceiras.",
        save: "Não foi possível guardar a instituição parceira.",
        status: "Não foi possível alterar o estado.",
        generic: "Ocorreu um erro ao processar o pedido.",
        unauthorized: "A sua sessão não está autenticada.",
        forbidden: "Não possui permissão para aceder a esta área.",
        forbiddenManage: "Não possui permissão para gerir instituições parceiras.",
        nameRequired: "Indique o nome da instituição.",
        invalidCountry: "Selecione um país válido.",
        invalidEmail: "Indique um endereço de e-mail válido.",
        invalidWebsite: "Indique um endereço de site válido.",
        duplicate: "Já existe uma instituição parceira com este nome neste país.",
        notFound: "Instituição parceira não encontrada.",
        invalidId: "Identificação inválida.",
        invalidStatus: "Estado inválido."
      }
    }
  },

  "en-US": {
    nav: "Partner institutions",
    page: {
      back: "International Mobility",
      title: "Partner Institutions",
      subtitle:
        "Register and manage universities, schools, and organizations that partner in academic mobility programs.",
      summary: {
        total: "Total institutions",
        active: "Active institutions",
        inactive: "Inactive institutions"
      },
      filters: {
        search: "Search by name, acronym, code, city, or email...",
        allCountries: "All countries",
        all: "All",
        active: "Active",
        inactive: "Inactive"
      },
      table: {
        institution: "Institution",
        location: "Location",
        contact: "International contact",
        agreements: "Agreements",
        status: "Status",
        actions: "Actions"
      },
      status: {
        active: "Active",
        inactive: "Inactive"
      },
      actions: {
        new: "New partner institution",
        refresh: "Refresh",
        edit: "Edit",
        activate: "Activate",
        deactivate: "Deactivate",
        website: "Website",
        cancel: "Cancel",
        save: "Save",
        saving: "Saving..."
      },
      sections: {
        institution: "Institution details",
        contact: "International contact",
        management: "Management"
      },
      fields: {
        name: "Institution name",
        acronym: "Acronym",
        code: "Internal code",
        country: "Country",
        state: "State / Province / Region",
        city: "City",
        postalCode: "Postal code",
        address: "Address",
        website: "Website",
        generalEmail: "General email",
        generalPhone: "General phone",
        contactName: "Contact name",
        contactRole: "Title / Role",
        contactEmail: "Contact email",
        contactPhone: "Contact phone",
        notes: "Notes",
        active: "Active institution",
        activeDescription:
          "Inactive institutions remain in historical records but should not be used in new programs."
      },
      modal: {
        newTitle: "New partner institution",
        editTitle: "Edit partner institution",
        description:
          "Enter the institution details and its primary international contact."
      },
      mobile: {
        agreements: "{count, plural, =0 {No agreements} =1 {1 agreement} other {# agreements}}"
      },
      empty: {
        title: "No institutions found",
        description:
          "Register the first partner institution or adjust the search filters."
      },
      messages: {
        created: "Partner institution created successfully.",
        updated: "Partner institution updated successfully.",
        activated: "Partner institution activated.",
        deactivated: "Partner institution deactivated."
      },
      errors: {
        load: "Partner institutions could not be loaded.",
        save: "The partner institution could not be saved.",
        status: "The status could not be changed.",
        generic: "An error occurred while processing the request.",
        unauthorized: "Your session is not authenticated.",
        forbidden: "You do not have permission to access this area.",
        forbiddenManage: "You do not have permission to manage partner institutions.",
        nameRequired: "Enter the institution name.",
        invalidCountry: "Select a valid country.",
        invalidEmail: "Enter a valid email address.",
        invalidWebsite: "Enter a valid website address.",
        duplicate: "A partner institution with this name already exists in this country.",
        notFound: "Partner institution not found.",
        invalidId: "Invalid identifier.",
        invalidStatus: "Invalid status."
      }
    }
  },

  "es-ES": {
    nav: "Instituciones asociadas",
    page: {
      back: "Movilidad Internacional",
      title: "Instituciones Asociadas",
      subtitle:
        "Registra y gestiona universidades, centros educativos y organizaciones asociadas a los programas de movilidad académica.",
      summary: {
        total: "Total de instituciones",
        active: "Instituciones activas",
        inactive: "Instituciones inactivas"
      },
      filters: {
        search: "Buscar por nombre, sigla, código, ciudad o correo...",
        allCountries: "Todos los países",
        all: "Todas",
        active: "Activas",
        inactive: "Inactivas"
      },
      table: {
        institution: "Institución",
        location: "Ubicación",
        contact: "Contacto internacional",
        agreements: "Convenios",
        status: "Estado",
        actions: "Acciones"
      },
      status: {
        active: "Activa",
        inactive: "Inactiva"
      },
      actions: {
        new: "Nueva institución asociada",
        refresh: "Actualizar",
        edit: "Editar",
        activate: "Activar",
        deactivate: "Desactivar",
        website: "Sitio web",
        cancel: "Cancelar",
        save: "Guardar",
        saving: "Guardando..."
      },
      sections: {
        institution: "Datos institucionales",
        contact: "Contacto internacional",
        management: "Gestión"
      },
      fields: {
        name: "Nombre de la institución",
        acronym: "Sigla",
        code: "Código interno",
        country: "País",
        state: "Estado / Provincia / Región",
        city: "Ciudad",
        postalCode: "Código postal",
        address: "Dirección",
        website: "Sitio web",
        generalEmail: "Correo general",
        generalPhone: "Teléfono general",
        contactName: "Nombre del responsable",
        contactRole: "Cargo / Función",
        contactEmail: "Correo del responsable",
        contactPhone: "Teléfono del responsable",
        notes: "Observaciones",
        active: "Institución activa",
        activeDescription:
          "Las instituciones inactivas permanecen en el historial, pero no deben utilizarse en nuevos programas."
      },
      modal: {
        newTitle: "Nueva institución asociada",
        editTitle: "Editar institución asociada",
        description:
          "Registra los datos institucionales y el contacto internacional principal."
      },
      mobile: {
        agreements: "{count, plural, =0 {Ningún convenio} =1 {1 convenio} other {# convenios}}"
      },
      empty: {
        title: "No se encontraron instituciones",
        description:
          "Registra la primera institución asociada o ajusta los filtros."
      },
      messages: {
        created: "Institución asociada registrada correctamente.",
        updated: "Institución asociada actualizada correctamente.",
        activated: "Institución asociada activada.",
        deactivated: "Institución asociada desactivada."
      },
      errors: {
        load: "No se pudieron cargar las instituciones asociadas.",
        save: "No se pudo guardar la institución asociada.",
        status: "No se pudo cambiar el estado.",
        generic: "Se produjo un error al procesar la solicitud.",
        unauthorized: "Tu sesión no está autenticada.",
        forbidden: "No tienes permiso para acceder a esta área.",
        forbiddenManage: "No tienes permiso para gestionar instituciones asociadas.",
        nameRequired: "Indica el nombre de la institución.",
        invalidCountry: "Selecciona un país válido.",
        invalidEmail: "Indica una dirección de correo válida.",
        invalidWebsite: "Indica una dirección web válida.",
        duplicate: "Ya existe una institución asociada con este nombre en este país.",
        notFound: "Institución asociada no encontrada.",
        invalidId: "Identificador no válido.",
        invalidStatus: "Estado no válido."
      }
    }
  },

  "fr-FR": {
    nav: "Établissements partenaires",
    page: {
      back: "Mobilité Internationale",
      title: "Établissements Partenaires",
      subtitle:
        "Enregistrez et gérez les universités, établissements et organisations partenaires des programmes de mobilité académique.",
      summary: {
        total: "Total des établissements",
        active: "Établissements actifs",
        inactive: "Établissements inactifs"
      },
      filters: {
        search: "Rechercher par nom, sigle, code, ville ou e-mail...",
        allCountries: "Tous les pays",
        all: "Tous",
        active: "Actifs",
        inactive: "Inactifs"
      },
      table: {
        institution: "Établissement",
        location: "Localisation",
        contact: "Contact international",
        agreements: "Accords",
        status: "Statut",
        actions: "Actions"
      },
      status: {
        active: "Actif",
        inactive: "Inactif"
      },
      actions: {
        new: "Nouvel établissement partenaire",
        refresh: "Actualiser",
        edit: "Modifier",
        activate: "Activer",
        deactivate: "Désactiver",
        website: "Site",
        cancel: "Annuler",
        save: "Enregistrer",
        saving: "Enregistrement..."
      },
      sections: {
        institution: "Informations institutionnelles",
        contact: "Contact international",
        management: "Gestion"
      },
      fields: {
        name: "Nom de l'établissement",
        acronym: "Sigle",
        code: "Code interne",
        country: "Pays",
        state: "État / Province / Région",
        city: "Ville",
        postalCode: "Code postal",
        address: "Adresse",
        website: "Site",
        generalEmail: "E-mail général",
        generalPhone: "Téléphone général",
        contactName: "Nom du responsable",
        contactRole: "Fonction",
        contactEmail: "E-mail du responsable",
        contactPhone: "Téléphone du responsable",
        notes: "Observations",
        active: "Établissement actif",
        activeDescription:
          "Les établissements inactifs restent dans l'historique mais ne doivent pas être utilisés pour de nouveaux programmes."
      },
      modal: {
        newTitle: "Nouvel établissement partenaire",
        editTitle: "Modifier l'établissement partenaire",
        description:
          "Enregistrez les informations institutionnelles et le contact international principal."
      },
      mobile: {
        agreements: "{count, plural, =0 {Aucun accord} =1 {1 accord} other {# accords}}"
      },
      empty: {
        title: "Aucun établissement trouvé",
        description:
          "Enregistrez le premier établissement partenaire ou modifiez les filtres."
      },
      messages: {
        created: "Établissement partenaire enregistré avec succès.",
        updated: "Établissement partenaire mis à jour avec succès.",
        activated: "Établissement partenaire activé.",
        deactivated: "Établissement partenaire désactivé."
      },
      errors: {
        load: "Impossible de charger les établissements partenaires.",
        save: "Impossible d'enregistrer l'établissement partenaire.",
        status: "Impossible de modifier le statut.",
        generic: "Une erreur s'est produite lors du traitement de la demande.",
        unauthorized: "Votre session n'est pas authentifiée.",
        forbidden: "Vous n'êtes pas autorisé à accéder à cette zone.",
        forbiddenManage: "Vous n'êtes pas autorisé à gérer les établissements partenaires.",
        nameRequired: "Indiquez le nom de l'établissement.",
        invalidCountry: "Sélectionnez un pays valide.",
        invalidEmail: "Indiquez une adresse e-mail valide.",
        invalidWebsite: "Indiquez une adresse de site valide.",
        duplicate: "Un établissement partenaire portant ce nom existe déjà dans ce pays.",
        notFound: "Établissement partenaire introuvable.",
        invalidId: "Identifiant non valide.",
        invalidStatus: "Statut non valide."
      }
    }
  }
};

for (
  const [
    locale,
    conteudo
  ] of Object.entries(
    traducoes
  )
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

  json.AdminMobilityPartners =
    conteudo.page;

  if (
    !json.AdminNavigation
  ) {
    throw new Error(
      `AdminNavigation ausente em ${locale}`
    );
  }

  json.AdminNavigation.partnerInstitutions =
    conteudo.nav;

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
  "✓ INSTITUIÇÕES PARCEIRAS TRADUZIDAS NOS 5 IDIOMAS"
);
