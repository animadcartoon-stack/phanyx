import fs from "node:fs";

const traducoes = {
  "pt-BR": {
    title: "Calendários e Feriados",
    subtitle: "Cadastre e publique os feriados que serão distribuídos às instituições PHANYX de cada país.",
    actions: {
      newHoliday: "Novo feriado",
      refresh: "Atualizar",
      edit: "Editar",
      publish: "Publicar",
      archive: "Arquivar",
      deleteDraft: "Excluir rascunho",
      cancel: "Cancelar",
      saveDraft: "Salvar rascunho",
      saveChanges: "Salvar alterações",
      close: "Fechar"
    },
    summary: {
      total: "Total de feriados",
      published: "Publicados",
      drafts: "Rascunhos",
      archived: "Arquivados"
    },
    filters: {
      country: "País",
      allCountries: "Todos os países",
      status: "Situação",
      allStatuses: "Todas as situações",
      year: "Ano",
      clear: "Limpar filtros"
    },
    status: {
      draft: "Rascunho",
      published: "Publicado",
      archived: "Arquivado"
    },
    table: {
      holiday: "Feriado",
      country: "País",
      date: "Data",
      displayPeriod: "Período de exibição",
      status: "Situação",
      priority: "Prioridade",
      actions: "Ações"
    },
    empty: {
      title: "Nenhum feriado encontrado",
      description: "Cadastre um feriado ou altere os filtros para visualizar outros registros."
    },
    form: {
      newTitle: "Cadastrar feriado",
      editTitle: "Editar feriado",
      general: "Informações gerais",
      translations: "Conteúdo traduzido",
      preview: "Pré-visualização",
      country: "País",
      date: "Data do feriado",
      displayStart: "Início da exibição",
      displayEnd: "Fim da exibição",
      type: "Abrangência",
      priority: "Prioridade",
      emoji: "Emoji ou ícone",
      region: "Estado / região",
      city: "Cidade",
      national: "Nacional",
      regional: "Regional",
      local: "Local",
      name: "Nome do feriado",
      bannerTitle: "Título do aviso",
      message: "Mensagem",
      optional: "Opcional",
      publicationHint: "Para publicar o feriado, complete os cinco idiomas.",
      draftHint: "Rascunhos podem ser salvos com pelo menos um idioma completo."
    },
    preview: {
      origin: "Calendário Nacional",
      category: "Feriado",
      viewCalendar: "Ver calendário",
      noContent: "Preencha o conteúdo deste idioma para visualizar o aviso."
    },
    confirmDelete: {
      title: "Excluir rascunho?",
      description: "Este rascunho será excluído definitivamente. Esta ação não pode ser desfeita.",
      confirm: "Excluir"
    },
    messages: {
      loadError: "Não foi possível carregar os feriados.",
      saveError: "Não foi possível salvar o feriado.",
      saved: "Feriado salvo com sucesso.",
      deleted: "Rascunho excluído com sucesso.",
      published: "Feriado publicado com sucesso.",
      archived: "Feriado arquivado com sucesso.",
      permission: "Você não possui permissão para administrar feriados globais.",
      publishTranslations: "Complete os cinco idiomas antes de publicar.",
      invalidPeriod: "Verifique o período de exibição informado.",
      genericError: "Não foi possível concluir a operação."
    }
  },

  "pt-PT": {
    title: "Calendários e Feriados",
    subtitle: "Registe e publique os feriados que serão distribuídos às instituições PHANYX de cada país.",
    actions: {
      newHoliday: "Novo feriado",
      refresh: "Atualizar",
      edit: "Editar",
      publish: "Publicar",
      archive: "Arquivar",
      deleteDraft: "Eliminar rascunho",
      cancel: "Cancelar",
      saveDraft: "Guardar rascunho",
      saveChanges: "Guardar alterações",
      close: "Fechar"
    },
    summary: {
      total: "Total de feriados",
      published: "Publicados",
      drafts: "Rascunhos",
      archived: "Arquivados"
    },
    filters: {
      country: "País",
      allCountries: "Todos os países",
      status: "Situação",
      allStatuses: "Todas as situações",
      year: "Ano",
      clear: "Limpar filtros"
    },
    status: {
      draft: "Rascunho",
      published: "Publicado",
      archived: "Arquivado"
    },
    table: {
      holiday: "Feriado",
      country: "País",
      date: "Data",
      displayPeriod: "Período de apresentação",
      status: "Situação",
      priority: "Prioridade",
      actions: "Ações"
    },
    empty: {
      title: "Nenhum feriado encontrado",
      description: "Registe um feriado ou altere os filtros para visualizar outros registos."
    },
    form: {
      newTitle: "Registar feriado",
      editTitle: "Editar feriado",
      general: "Informações gerais",
      translations: "Conteúdo traduzido",
      preview: "Pré-visualização",
      country: "País",
      date: "Data do feriado",
      displayStart: "Início da apresentação",
      displayEnd: "Fim da apresentação",
      type: "Abrangência",
      priority: "Prioridade",
      emoji: "Emoji ou ícone",
      region: "Estado / região",
      city: "Cidade",
      national: "Nacional",
      regional: "Regional",
      local: "Local",
      name: "Nome do feriado",
      bannerTitle: "Título do aviso",
      message: "Mensagem",
      optional: "Opcional",
      publicationHint: "Para publicar o feriado, complete os cinco idiomas.",
      draftHint: "Os rascunhos podem ser guardados com pelo menos um idioma completo."
    },
    preview: {
      origin: "Calendário Nacional",
      category: "Feriado",
      viewCalendar: "Ver calendário",
      noContent: "Preencha o conteúdo deste idioma para visualizar o aviso."
    },
    confirmDelete: {
      title: "Eliminar rascunho?",
      description: "Este rascunho será eliminado definitivamente. Esta ação não pode ser anulada.",
      confirm: "Eliminar"
    },
    messages: {
      loadError: "Não foi possível carregar os feriados.",
      saveError: "Não foi possível guardar o feriado.",
      saved: "Feriado guardado com sucesso.",
      deleted: "Rascunho eliminado com sucesso.",
      published: "Feriado publicado com sucesso.",
      archived: "Feriado arquivado com sucesso.",
      permission: "Não possui permissão para administrar feriados globais.",
      publishTranslations: "Complete os cinco idiomas antes de publicar.",
      invalidPeriod: "Verifique o período de apresentação indicado.",
      genericError: "Não foi possível concluir a operação."
    }
  },

  "en-US": {
    title: "Calendars and Holidays",
    subtitle: "Create and publish holidays that will be distributed to PHANYX institutions in each country.",
    actions: {
      newHoliday: "New holiday",
      refresh: "Refresh",
      edit: "Edit",
      publish: "Publish",
      archive: "Archive",
      deleteDraft: "Delete draft",
      cancel: "Cancel",
      saveDraft: "Save draft",
      saveChanges: "Save changes",
      close: "Close"
    },
    summary: {
      total: "Total holidays",
      published: "Published",
      drafts: "Drafts",
      archived: "Archived"
    },
    filters: {
      country: "Country",
      allCountries: "All countries",
      status: "Status",
      allStatuses: "All statuses",
      year: "Year",
      clear: "Clear filters"
    },
    status: {
      draft: "Draft",
      published: "Published",
      archived: "Archived"
    },
    table: {
      holiday: "Holiday",
      country: "Country",
      date: "Date",
      displayPeriod: "Display period",
      status: "Status",
      priority: "Priority",
      actions: "Actions"
    },
    empty: {
      title: "No holidays found",
      description: "Create a holiday or change the filters to view other records."
    },
    form: {
      newTitle: "Create holiday",
      editTitle: "Edit holiday",
      general: "General information",
      translations: "Translated content",
      preview: "Preview",
      country: "Country",
      date: "Holiday date",
      displayStart: "Display starts",
      displayEnd: "Display ends",
      type: "Scope",
      priority: "Priority",
      emoji: "Emoji or icon",
      region: "State / region",
      city: "City",
      national: "National",
      regional: "Regional",
      local: "Local",
      name: "Holiday name",
      bannerTitle: "Notice title",
      message: "Message",
      optional: "Optional",
      publicationHint: "Complete all five languages before publishing the holiday.",
      draftHint: "Drafts may be saved with at least one complete language."
    },
    preview: {
      origin: "National Calendar",
      category: "Holiday",
      viewCalendar: "View calendar",
      noContent: "Fill in the content for this language to preview the notice."
    },
    confirmDelete: {
      title: "Delete draft?",
      description: "This draft will be permanently deleted. This action cannot be undone.",
      confirm: "Delete"
    },
    messages: {
      loadError: "Unable to load holidays.",
      saveError: "Unable to save the holiday.",
      saved: "Holiday saved successfully.",
      deleted: "Draft deleted successfully.",
      published: "Holiday published successfully.",
      archived: "Holiday archived successfully.",
      permission: "You do not have permission to manage global holidays.",
      publishTranslations: "Complete all five languages before publishing.",
      invalidPeriod: "Check the selected display period.",
      genericError: "Unable to complete the operation."
    }
  },

  "es-ES": {
    title: "Calendarios y Festivos",
    subtitle: "Registra y publica los festivos que se distribuirán a las instituciones PHANYX de cada país.",
    actions: {
      newHoliday: "Nuevo festivo",
      refresh: "Actualizar",
      edit: "Editar",
      publish: "Publicar",
      archive: "Archivar",
      deleteDraft: "Eliminar borrador",
      cancel: "Cancelar",
      saveDraft: "Guardar borrador",
      saveChanges: "Guardar cambios",
      close: "Cerrar"
    },
    summary: {
      total: "Total de festivos",
      published: "Publicados",
      drafts: "Borradores",
      archived: "Archivados"
    },
    filters: {
      country: "País",
      allCountries: "Todos los países",
      status: "Estado",
      allStatuses: "Todos los estados",
      year: "Año",
      clear: "Limpiar filtros"
    },
    status: {
      draft: "Borrador",
      published: "Publicado",
      archived: "Archivado"
    },
    table: {
      holiday: "Festivo",
      country: "País",
      date: "Fecha",
      displayPeriod: "Periodo de visualización",
      status: "Estado",
      priority: "Prioridad",
      actions: "Acciones"
    },
    empty: {
      title: "No se encontraron festivos",
      description: "Registra un festivo o cambia los filtros para ver otros registros."
    },
    form: {
      newTitle: "Registrar festivo",
      editTitle: "Editar festivo",
      general: "Información general",
      translations: "Contenido traducido",
      preview: "Vista previa",
      country: "País",
      date: "Fecha del festivo",
      displayStart: "Inicio de visualización",
      displayEnd: "Fin de visualización",
      type: "Ámbito",
      priority: "Prioridad",
      emoji: "Emoji o icono",
      region: "Estado / región",
      city: "Ciudad",
      national: "Nacional",
      regional: "Regional",
      local: "Local",
      name: "Nombre del festivo",
      bannerTitle: "Título del aviso",
      message: "Mensaje",
      optional: "Opcional",
      publicationHint: "Para publicar el festivo, completa los cinco idiomas.",
      draftHint: "Los borradores pueden guardarse con al menos un idioma completo."
    },
    preview: {
      origin: "Calendario Nacional",
      category: "Festivo",
      viewCalendar: "Ver calendario",
      noContent: "Completa el contenido de este idioma para visualizar el aviso."
    },
    confirmDelete: {
      title: "¿Eliminar borrador?",
      description: "Este borrador se eliminará definitivamente. Esta acción no se puede deshacer.",
      confirm: "Eliminar"
    },
    messages: {
      loadError: "No se pudieron cargar los festivos.",
      saveError: "No se pudo guardar el festivo.",
      saved: "Festivo guardado correctamente.",
      deleted: "Borrador eliminado correctamente.",
      published: "Festivo publicado correctamente.",
      archived: "Festivo archivado correctamente.",
      permission: "No tienes permiso para administrar festivos globales.",
      publishTranslations: "Completa los cinco idiomas antes de publicar.",
      invalidPeriod: "Revisa el periodo de visualización indicado.",
      genericError: "No se pudo completar la operación."
    }
  },

  "fr-FR": {
    title: "Calendriers et Jours fériés",
    subtitle: "Créez et publiez les jours fériés qui seront distribués aux établissements PHANYX de chaque pays.",
    actions: {
      newHoliday: "Nouveau jour férié",
      refresh: "Actualiser",
      edit: "Modifier",
      publish: "Publier",
      archive: "Archiver",
      deleteDraft: "Supprimer le brouillon",
      cancel: "Annuler",
      saveDraft: "Enregistrer le brouillon",
      saveChanges: "Enregistrer les modifications",
      close: "Fermer"
    },
    summary: {
      total: "Total des jours fériés",
      published: "Publiés",
      drafts: "Brouillons",
      archived: "Archivés"
    },
    filters: {
      country: "Pays",
      allCountries: "Tous les pays",
      status: "Statut",
      allStatuses: "Tous les statuts",
      year: "Année",
      clear: "Effacer les filtres"
    },
    status: {
      draft: "Brouillon",
      published: "Publié",
      archived: "Archivé"
    },
    table: {
      holiday: "Jour férié",
      country: "Pays",
      date: "Date",
      displayPeriod: "Période d’affichage",
      status: "Statut",
      priority: "Priorité",
      actions: "Actions"
    },
    empty: {
      title: "Aucun jour férié trouvé",
      description: "Créez un jour férié ou modifiez les filtres pour afficher d’autres enregistrements."
    },
    form: {
      newTitle: "Créer un jour férié",
      editTitle: "Modifier le jour férié",
      general: "Informations générales",
      translations: "Contenu traduit",
      preview: "Aperçu",
      country: "Pays",
      date: "Date du jour férié",
      displayStart: "Début de l’affichage",
      displayEnd: "Fin de l’affichage",
      type: "Portée",
      priority: "Priorité",
      emoji: "Emoji ou icône",
      region: "État / région",
      city: "Ville",
      national: "National",
      regional: "Régional",
      local: "Local",
      name: "Nom du jour férié",
      bannerTitle: "Titre de l’avis",
      message: "Message",
      optional: "Facultatif",
      publicationHint: "Complétez les cinq langues avant de publier le jour férié.",
      draftHint: "Les brouillons peuvent être enregistrés avec au moins une langue complète."
    },
    preview: {
      origin: "Calendrier National",
      category: "Jour férié",
      viewCalendar: "Voir le calendrier",
      noContent: "Renseignez le contenu de cette langue pour afficher l’aperçu."
    },
    confirmDelete: {
      title: "Supprimer le brouillon ?",
      description: "Ce brouillon sera définitivement supprimé. Cette action est irréversible.",
      confirm: "Supprimer"
    },
    messages: {
      loadError: "Impossible de charger les jours fériés.",
      saveError: "Impossible d’enregistrer le jour férié.",
      saved: "Jour férié enregistré avec succès.",
      deleted: "Brouillon supprimé avec succès.",
      published: "Jour férié publié avec succès.",
      archived: "Jour férié archivé avec succès.",
      permission: "Vous n’avez pas l’autorisation de gérer les jours fériés globaux.",
      publishTranslations: "Complétez les cinq langues avant de publier.",
      invalidPeriod: "Vérifiez la période d’affichage indiquée.",
      genericError: "Impossible de terminer l’opération."
    }
  }
};

for (const [locale, namespace] of Object.entries(traducoes)) {
  const caminho = `messages/${locale}.json`;
  let texto = fs.readFileSync(caminho, "utf8");

  const atual = JSON.parse(texto);

  if (Object.prototype.hasOwnProperty.call(atual, "MasterHolidays")) {
    console.log(`↷ ${locale}: MasterHolidays já existe`);
    continue;
  }

  const ultimaChave = texto.lastIndexOf("}");

  if (ultimaChave < 0) {
    throw new Error(`JSON inválido: ${caminho}`);
  }

  const antes = texto.slice(0, ultimaChave).replace(/\s*$/, "");
  const depois = texto.slice(ultimaChave);

  const bloco = JSON.stringify(
    { MasterHolidays: namespace },
    null,
    2
  )
    .split("\n")
    .slice(1, -1)
    .join("\n");

  texto =
    antes +
    (antes.trimEnd().endsWith("{") ? "\n" : ",\n") +
    bloco +
    "\n" +
    depois;

  JSON.parse(texto);

  fs.writeFileSync(caminho, texto, "utf8");

  console.log(`✓ ${locale}`);
}

console.log("\n✓ TRADUÇÕES MASTER HOLIDAYS ADICIONADAS");
