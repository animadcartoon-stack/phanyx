import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    loading: "Carregando regras de distribuição...",

    header: {
      back: "← Central de Captação",
      title: "Distribuição de leads",
      description:
        "Defina automaticamente quem deve receber cada novo interessado. O PHANYX verifica as regras assim que o lead entra na Central de Captação.",
      newRule: "+ Nova regra",
    },

    common: {
      refresh: "↻ Atualizar",
      refreshing: "Atualizando...",
      edit: "Editar",
      close: "Fechar",
      cancel: "Cancelar",
      saving: "Salvando...",
      creating: "Criando...",
      saveChanges: "Salvar alterações",
      createRule: "Criar regra",
    },

    summary: {
      total: "Total",
      totalHelp: "Regras cadastradas",
      active: "Ativas",
      activeHelp: "Distribuindo novos leads",
      inactive: "Inativas",
      inactiveHelp: "Temporariamente pausadas",
    },

    filters: {
      search: "Buscar",
      searchPlaceholder:
        "Nome, campanha, curso, equipe...",
      onlyActive:
        "Mostrar somente regras ativas",
    },

    list: {
      title: "Regras cadastradas",
      results:
        "{count, plural, =0 {Nenhuma regra encontrada} one {# regra encontrada} other {# regras encontradas}}.",
      emptyTitle: "Nenhuma regra encontrada",
      emptyDescription:
        "Crie uma regra para o PHANYX distribuir automaticamente os próximos interessados.",
      createFirst: "+ Criar primeira regra",
    },

    statuses: {
      active: "Ativa",
      inactive: "Inativa",
    },

    rule: {
      howToDistribute: "Como distribuir",
      destination: "Destino",
      whenApplies:
        "Quando esta regra se aplica",
      allNewLeads: "Todos os novos leads",
      noSpecificDestination:
        "Sem destino específico",
    },

    criteria: {
      channel: "Canal: {name}",
      campaign: "Campanha: {name}",
      form: "Formulário: {name}",
      course: "Curso: {name}",
      unit: "Unidade: {name}",
    },

    modal: {
      kicker: "DISTRIBUIÇÃO AUTOMÁTICA",

      newTitle:
        "Nova regra de distribuição",

      newDescription:
        "Diga ao PHANYX quais interessados esta regra atende e para onde eles devem ser encaminhados.",

      editTitle:
        "Editar regra de distribuição",

      editDescription:
        "Atualize os critérios e defina como os próximos interessados desta regra serão encaminhados.",

      identify: {
        title: "Identifique a regra",
        description:
          "Use um nome que sua equipe reconheça facilmente.",
      },

      ruleName: "Nome da regra",

      ruleNamePlaceholder:
        "Ex.: Leads do Vestibular 2027",

      activeRule: "Regra ativa",

      activeRuleHelp:
        "O PHANYX utilizará esta regra nas próximas captações.",

      pausedRule: "Regra pausada",

      pausedRuleHelp:
        "Novos leads não serão distribuídos por esta regra enquanto ela estiver pausada.",

      criteria: {
        title:
          "Quando esta regra deve ser usada?",

        description:
          "Você pode combinar informações. Campos deixados em branco valem para qualquer opção.",
      },

      distribution: {
        title:
          "Como o PHANYX deve distribuir?",

        description:
          "Escolha apenas como deseja trabalhar. A parte técnica fica por conta do sistema.",
      },
    },

    fields: {
      channel: "Canal",
      campaign: "Campanha",
      form: "Formulário",
      course: "Curso",
      unit: "Unidade",

      owner:
        "Quem deve receber estes leads?",

      team:
        "Qual equipe receberá estes leads?",
    },

    options: {
      anyChannel: "Qualquer canal",
      anyCampaign: "Qualquer campanha",
      anyForm: "Qualquer formulário",
      anyCourse: "Qualquer curso",
      anyUnit: "Qualquer unidade",
      selectPerson: "Selecione uma pessoa",
      selectTeam: "Selecione uma equipe",
    },

    strategies: {
      roundRobin: {
        name: "Revezamento entre a equipe",
        description:
          "O PHANYX alterna os novos interessados entre os membros da equipe.",
      },

      lowestLoad: {
        name: "Quem tem menos leads",
        description:
          "O PHANYX direciona o novo interessado para quem está com menos leads em atendimento.",
      },

      random: {
        name: "Distribuição aleatória",
        description:
          "Os novos interessados são distribuídos aleatoriamente entre os membros disponíveis.",
      },

      fixedOwner: {
        name: "Pessoa específica",
        description:
          "Todos os leads desta regra são direcionados para a mesma pessoa.",
      },

      teamQueue: {
        name: "Encaminhar para a equipe",
        description:
          "O lead entra na equipe e pode ser assumido posteriormente por um integrante.",
      },

      manual: {
        name: "Distribuição manual",
        description:
          "O lead fica disponível para que o responsável seja definido manualmente.",
      },
    },

    success: {
      created:
        "Regra de distribuição criada com sucesso.",
      updated:
        "Regra de distribuição atualizada com sucesso.",
    },

    errors: {
      load:
        "Não foi possível carregar as regras de distribuição.",
      save:
        "Não foi possível salvar a regra de distribuição.",
    },
  },

  "pt-PT": {
    loading:
      "A carregar regras de distribuição...",

    header: {
      back: "← Central de Captação",
      title: "Distribuição de leads",

      description:
        "Defina automaticamente quem deve receber cada novo interessado. O PHANYX verifica as regras assim que o lead entra na Central de Captação.",

      newRule: "+ Nova regra",
    },

    common: {
      refresh: "↻ Atualizar",
      refreshing: "A atualizar...",
      edit: "Editar",
      close: "Fechar",
      cancel: "Cancelar",
      saving: "A guardar...",
      creating: "A criar...",
      saveChanges: "Guardar alterações",
      createRule: "Criar regra",
    },

    summary: {
      total: "Total",
      totalHelp: "Regras registadas",
      active: "Ativas",
      activeHelp:
        "A distribuir novos leads",
      inactive: "Inativas",
      inactiveHelp:
        "Temporariamente em pausa",
    },

    filters: {
      search: "Pesquisar",
      searchPlaceholder:
        "Nome, campanha, curso, equipa...",
      onlyActive:
        "Mostrar apenas regras ativas",
    },

    list: {
      title: "Regras registadas",

      results:
        "{count, plural, =0 {Nenhuma regra encontrada} one {# regra encontrada} other {# regras encontradas}}.",

      emptyTitle: "Nenhuma regra encontrada",

      emptyDescription:
        "Crie uma regra para o PHANYX distribuir automaticamente os próximos interessados.",

      createFirst: "+ Criar primeira regra",
    },

    statuses: {
      active: "Ativa",
      inactive: "Inativa",
    },

    rule: {
      howToDistribute: "Como distribuir",
      destination: "Destino",

      whenApplies:
        "Quando esta regra se aplica",

      allNewLeads:
        "Todos os novos leads",

      noSpecificDestination:
        "Sem destino específico",
    },

    criteria: {
      channel: "Canal: {name}",
      campaign: "Campanha: {name}",
      form: "Formulário: {name}",
      course: "Curso: {name}",
      unit: "Unidade: {name}",
    },

    modal: {
      kicker: "DISTRIBUIÇÃO AUTOMÁTICA",

      newTitle:
        "Nova regra de distribuição",

      newDescription:
        "Indique ao PHANYX quais interessados esta regra abrange e para onde devem ser encaminhados.",

      editTitle:
        "Editar regra de distribuição",

      editDescription:
        "Atualize os critérios e defina como os próximos interessados desta regra serão encaminhados.",

      identify: {
        title: "Identifique a regra",
        description:
          "Use um nome que a sua equipa reconheça facilmente.",
      },

      ruleName: "Nome da regra",

      ruleNamePlaceholder:
        "Ex.: Leads do Vestibular 2027",

      activeRule: "Regra ativa",

      activeRuleHelp:
        "O PHANYX utilizará esta regra nas próximas captações.",

      pausedRule: "Regra em pausa",

      pausedRuleHelp:
        "Novos leads não serão distribuídos por esta regra enquanto estiver em pausa.",

      criteria: {
        title:
          "Quando deve esta regra ser utilizada?",

        description:
          "Pode combinar informações. Os campos deixados em branco aplicam-se a qualquer opção.",
      },

      distribution: {
        title:
          "Como deve o PHANYX distribuir?",

        description:
          "Escolha apenas como pretende trabalhar. A parte técnica fica a cargo do sistema.",
      },
    },

    fields: {
      channel: "Canal",
      campaign: "Campanha",
      form: "Formulário",
      course: "Curso",
      unit: "Unidade",

      owner:
        "Quem deve receber estes leads?",

      team:
        "Que equipa receberá estes leads?",
    },

    options: {
      anyChannel: "Qualquer canal",
      anyCampaign: "Qualquer campanha",
      anyForm: "Qualquer formulário",
      anyCourse: "Qualquer curso",
      anyUnit: "Qualquer unidade",
      selectPerson: "Selecione uma pessoa",
      selectTeam: "Selecione uma equipa",
    },

    strategies: {
      roundRobin: {
        name: "Rotação entre a equipa",

        description:
          "O PHANYX alterna os novos interessados entre os membros da equipa.",
      },

      lowestLoad: {
        name: "Quem tem menos leads",

        description:
          "O PHANYX encaminha o novo interessado para quem tem menos leads em acompanhamento.",
      },

      random: {
        name: "Distribuição aleatória",

        description:
          "Os novos interessados são distribuídos aleatoriamente entre os membros disponíveis.",
      },

      fixedOwner: {
        name: "Pessoa específica",

        description:
          "Todos os leads desta regra são encaminhados para a mesma pessoa.",
      },

      teamQueue: {
        name: "Encaminhar para a equipa",

        description:
          "O lead entra na equipa e pode ser assumido posteriormente por um dos membros.",
      },

      manual: {
        name: "Distribuição manual",

        description:
          "O lead fica disponível para que o responsável seja definido manualmente.",
      },
    },

    success: {
      created:
        "Regra de distribuição criada com sucesso.",

      updated:
        "Regra de distribuição atualizada com sucesso.",
    },

    errors: {
      load:
        "Não foi possível carregar as regras de distribuição.",

      save:
        "Não foi possível guardar a regra de distribuição.",
    },
  },

  "en-US": {
    loading: "Loading distribution rules...",

    header: {
      back: "← Lead Capture Hub",
      title: "Lead distribution",

      description:
        "Automatically define who should receive each new prospect. PHANYX checks the rules as soon as the lead enters the Lead Capture Hub.",

      newRule: "+ New rule",
    },

    common: {
      refresh: "↻ Refresh",
      refreshing: "Refreshing...",
      edit: "Edit",
      close: "Close",
      cancel: "Cancel",
      saving: "Saving...",
      creating: "Creating...",
      saveChanges: "Save changes",
      createRule: "Create rule",
    },

    summary: {
      total: "Total",
      totalHelp: "Registered rules",
      active: "Active",
      activeHelp: "Distributing new leads",
      inactive: "Inactive",
      inactiveHelp: "Temporarily paused",
    },

    filters: {
      search: "Search",

      searchPlaceholder:
        "Name, campaign, course, team...",

      onlyActive:
        "Show active rules only",
    },

    list: {
      title: "Registered rules",

      results:
        "{count, plural, =0 {No rules found} one {# rule found} other {# rules found}}.",

      emptyTitle: "No rules found",

      emptyDescription:
        "Create a rule so PHANYX can automatically distribute the next prospects.",

      createFirst: "+ Create first rule",
    },

    statuses: {
      active: "Active",
      inactive: "Inactive",
    },

    rule: {
      howToDistribute:
        "Distribution method",

      destination: "Destination",

      whenApplies:
        "When this rule applies",

      allNewLeads:
        "All new leads",

      noSpecificDestination:
        "No specific destination",
    },

    criteria: {
      channel: "Channel: {name}",
      campaign: "Campaign: {name}",
      form: "Form: {name}",
      course: "Course: {name}",
      unit: "Unit: {name}",
    },

    modal: {
      kicker: "AUTOMATIC DISTRIBUTION",

      newTitle:
        "New distribution rule",

      newDescription:
        "Tell PHANYX which prospects this rule applies to and where they should be routed.",

      editTitle:
        "Edit distribution rule",

      editDescription:
        "Update the criteria and define how future prospects matching this rule should be routed.",

      identify: {
        title: "Identify the rule",

        description:
          "Use a name your team can easily recognize.",
      },

      ruleName: "Rule name",

      ruleNamePlaceholder:
        "Example: 2027 Admissions Leads",

      activeRule: "Active rule",

      activeRuleHelp:
        "PHANYX will use this rule for upcoming lead captures.",

      pausedRule: "Paused rule",

      pausedRuleHelp:
        "New leads will not be distributed by this rule while it is paused.",

      criteria: {
        title:
          "When should this rule be used?",

        description:
          "You can combine criteria. Blank fields apply to any option.",
      },

      distribution: {
        title:
          "How should PHANYX distribute leads?",

        description:
          "Choose how you want to work. PHANYX handles the technical routing.",
      },
    },

    fields: {
      channel: "Channel",
      campaign: "Campaign",
      form: "Form",
      course: "Course",
      unit: "Unit",

      owner:
        "Who should receive these leads?",

      team:
        "Which team should receive these leads?",
    },

    options: {
      anyChannel: "Any channel",
      anyCampaign: "Any campaign",
      anyForm: "Any form",
      anyCourse: "Any course",
      anyUnit: "Any unit",
      selectPerson: "Select a person",
      selectTeam: "Select a team",
    },

    strategies: {
      roundRobin: {
        name:
          "Round-robin across the team",

        description:
          "PHANYX alternates new prospects among team members.",
      },

      lowestLoad: {
        name: "Lowest lead load",

        description:
          "PHANYX routes the new prospect to the person currently handling the fewest leads.",
      },

      random: {
        name: "Random distribution",

        description:
          "New prospects are randomly distributed among available team members.",
      },

      fixedOwner: {
        name: "Specific person",

        description:
          "All leads matching this rule are routed to the same person.",
      },

      teamQueue: {
        name: "Route to team",

        description:
          "The lead enters the team queue and can be claimed later by a team member.",
      },

      manual: {
        name: "Manual distribution",

        description:
          "The lead remains available until an owner is assigned manually.",
      },
    },

    success: {
      created:
        "Distribution rule created successfully.",

      updated:
        "Distribution rule updated successfully.",
    },

    errors: {
      load:
        "Could not load distribution rules.",

      save:
        "Could not save the distribution rule.",
    },
  },

  "es-ES": {
    loading:
      "Cargando reglas de distribución...",

    header: {
      back: "← Central de Captación",
      title: "Distribución de leads",

      description:
        "Define automáticamente quién debe recibir cada nuevo interesado. PHANYX comprueba las reglas en cuanto el lead entra en la Central de Captación.",

      newRule: "+ Nueva regla",
    },

    common: {
      refresh: "↻ Actualizar",
      refreshing: "Actualizando...",
      edit: "Editar",
      close: "Cerrar",
      cancel: "Cancelar",
      saving: "Guardando...",
      creating: "Creando...",
      saveChanges: "Guardar cambios",
      createRule: "Crear regla",
    },

    summary: {
      total: "Total",
      totalHelp: "Reglas registradas",
      active: "Activas",

      activeHelp:
        "Distribuyendo nuevos leads",

      inactive: "Inactivas",

      inactiveHelp:
        "Pausadas temporalmente",
    },

    filters: {
      search: "Buscar",

      searchPlaceholder:
        "Nombre, campaña, curso, equipo...",

      onlyActive:
        "Mostrar solo reglas activas",
    },

    list: {
      title: "Reglas registradas",

      results:
        "{count, plural, =0 {No se encontraron reglas} one {# regla encontrada} other {# reglas encontradas}}.",

      emptyTitle:
        "No se encontraron reglas",

      emptyDescription:
        "Crea una regla para que PHANYX distribuya automáticamente los próximos interesados.",

      createFirst:
        "+ Crear primera regla",
    },

    statuses: {
      active: "Activa",
      inactive: "Inactiva",
    },

    rule: {
      howToDistribute:
        "Cómo distribuir",

      destination: "Destino",

      whenApplies:
        "Cuándo se aplica esta regla",

      allNewLeads:
        "Todos los nuevos leads",

      noSpecificDestination:
        "Sin destino específico",
    },

    criteria: {
      channel: "Canal: {name}",
      campaign: "Campaña: {name}",
      form: "Formulario: {name}",
      course: "Curso: {name}",
      unit: "Unidad: {name}",
    },

    modal: {
      kicker:
        "DISTRIBUCIÓN AUTOMÁTICA",

      newTitle:
        "Nueva regla de distribución",

      newDescription:
        "Indica a PHANYX a qué interesados se aplica esta regla y a dónde deben dirigirse.",

      editTitle:
        "Editar regla de distribución",

      editDescription:
        "Actualiza los criterios y define cómo deben dirigirse los próximos interesados de esta regla.",

      identify: {
        title: "Identifica la regla",

        description:
          "Usa un nombre que tu equipo pueda reconocer fácilmente.",
      },

      ruleName:
        "Nombre de la regla",

      ruleNamePlaceholder:
        "Ej.: Leads de Admisión 2027",

      activeRule:
        "Regla activa",

      activeRuleHelp:
        "PHANYX utilizará esta regla en las próximas captaciones.",

      pausedRule:
        "Regla pausada",

      pausedRuleHelp:
        "Los nuevos leads no serán distribuidos por esta regla mientras esté pausada.",

      criteria: {
        title:
          "¿Cuándo debe utilizarse esta regla?",

        description:
          "Puedes combinar información. Los campos vacíos se aplican a cualquier opción.",
      },

      distribution: {
        title:
          "¿Cómo debe distribuir PHANYX?",

        description:
          "Elige cómo quieres trabajar. El sistema se encarga de la parte técnica.",
      },
    },

    fields: {
      channel: "Canal",
      campaign: "Campaña",
      form: "Formulario",
      course: "Curso",
      unit: "Unidad",

      owner:
        "¿Quién debe recibir estos leads?",

      team:
        "¿Qué equipo recibirá estos leads?",
    },

    options: {
      anyChannel: "Cualquier canal",
      anyCampaign: "Cualquier campaña",
      anyForm: "Cualquier formulario",
      anyCourse: "Cualquier curso",
      anyUnit: "Cualquier unidad",

      selectPerson:
        "Selecciona una persona",

      selectTeam:
        "Selecciona un equipo",
    },

    strategies: {
      roundRobin: {
        name:
          "Rotación entre el equipo",

        description:
          "PHANYX alterna los nuevos interesados entre los miembros del equipo.",
      },

      lowestLoad: {
        name:
          "Quien tiene menos leads",

        description:
          "PHANYX dirige al nuevo interesado a quien tenga menos leads en atención.",
      },

      random: {
        name:
          "Distribución aleatoria",

        description:
          "Los nuevos interesados se distribuyen aleatoriamente entre los miembros disponibles.",
      },

      fixedOwner: {
        name: "Persona específica",

        description:
          "Todos los leads de esta regla se dirigen a la misma persona.",
      },

      teamQueue: {
        name: "Dirigir al equipo",

        description:
          "El lead entra en el equipo y puede ser asumido posteriormente por uno de sus miembros.",
      },

      manual: {
        name:
          "Distribución manual",

        description:
          "El lead queda disponible hasta que se asigne manualmente un responsable.",
      },
    },

    success: {
      created:
        "Regla de distribución creada correctamente.",

      updated:
        "Regla de distribución actualizada correctamente.",
    },

    errors: {
      load:
        "No se pudieron cargar las reglas de distribución.",

      save:
        "No se pudo guardar la regla de distribución.",
    },
  },

  "fr-FR": {
    loading:
      "Chargement des règles de distribution...",

    header: {
      back: "← Centre d’acquisition",

      title:
        "Distribution des leads",

      description:
        "Définissez automatiquement qui doit recevoir chaque nouveau prospect. PHANYX vérifie les règles dès que le lead entre dans le Centre d’acquisition.",

      newRule:
        "+ Nouvelle règle",
    },

    common: {
      refresh: "↻ Actualiser",
      refreshing: "Actualisation...",
      edit: "Modifier",
      close: "Fermer",
      cancel: "Annuler",

      saving:
        "Enregistrement...",

      creating: "Création...",

      saveChanges:
        "Enregistrer les modifications",

      createRule:
        "Créer la règle",
    },

    summary: {
      total: "Total",

      totalHelp:
        "Règles enregistrées",

      active: "Actives",

      activeHelp:
        "Distribution de nouveaux leads",

      inactive: "Inactives",

      inactiveHelp:
        "Temporairement suspendues",
    },

    filters: {
      search: "Rechercher",

      searchPlaceholder:
        "Nom, campagne, formation, équipe...",

      onlyActive:
        "Afficher uniquement les règles actives",
    },

    list: {
      title:
        "Règles enregistrées",

      results:
        "{count, plural, =0 {Aucune règle trouvée} one {# règle trouvée} other {# règles trouvées}}.",

      emptyTitle:
        "Aucune règle trouvée",

      emptyDescription:
        "Créez une règle afin que PHANYX distribue automatiquement les prochains prospects.",

      createFirst:
        "+ Créer la première règle",
    },

    statuses: {
      active: "Active",
      inactive: "Inactive",
    },

    rule: {
      howToDistribute:
        "Mode de distribution",

      destination: "Destination",

      whenApplies:
        "Quand cette règle s’applique",

      allNewLeads:
        "Tous les nouveaux leads",

      noSpecificDestination:
        "Aucune destination spécifique",
    },

    criteria: {
      channel: "Canal : {name}",
      campaign: "Campagne : {name}",
      form: "Formulaire : {name}",
      course: "Formation : {name}",
      unit: "Unité : {name}",
    },

    modal: {
      kicker:
        "DISTRIBUTION AUTOMATIQUE",

      newTitle:
        "Nouvelle règle de distribution",

      newDescription:
        "Indiquez à PHANYX quels prospects sont concernés par cette règle et vers quelle destination ils doivent être orientés.",

      editTitle:
        "Modifier la règle de distribution",

      editDescription:
        "Mettez à jour les critères et définissez comment les prochains prospects correspondant à cette règle doivent être orientés.",

      identify: {
        title:
          "Identifiez la règle",

        description:
          "Utilisez un nom que votre équipe pourra reconnaître facilement.",
      },

      ruleName:
        "Nom de la règle",

      ruleNamePlaceholder:
        "Ex. : Leads Admissions 2027",

      activeRule:
        "Règle active",

      activeRuleHelp:
        "PHANYX utilisera cette règle pour les prochaines acquisitions.",

      pausedRule:
        "Règle suspendue",

      pausedRuleHelp:
        "Les nouveaux leads ne seront pas distribués par cette règle tant qu’elle est suspendue.",

      criteria: {
        title:
          "Quand cette règle doit-elle être utilisée ?",

        description:
          "Vous pouvez combiner plusieurs critères. Les champs laissés vides s’appliquent à toutes les options.",
      },

      distribution: {
        title:
          "Comment PHANYX doit-il distribuer les leads ?",

        description:
          "Choisissez simplement votre mode de fonctionnement. Le système se charge de la partie technique.",
      },
    },

    fields: {
      channel: "Canal",
      campaign: "Campagne",
      form: "Formulaire",
      course: "Formation",
      unit: "Unité",

      owner:
        "Qui doit recevoir ces leads ?",

      team:
        "Quelle équipe recevra ces leads ?",
    },

    options: {
      anyChannel:
        "N’importe quel canal",

      anyCampaign:
        "N’importe quelle campagne",

      anyForm:
        "N’importe quel formulaire",

      anyCourse:
        "N’importe quelle formation",

      anyUnit:
        "N’importe quelle unité",

      selectPerson:
        "Sélectionnez une personne",

      selectTeam:
        "Sélectionnez une équipe",
    },

    strategies: {
      roundRobin: {
        name:
          "Rotation au sein de l’équipe",

        description:
          "PHANYX alterne les nouveaux prospects entre les membres de l’équipe.",
      },

      lowestLoad: {
        name:
          "Charge de leads la plus faible",

        description:
          "PHANYX oriente le nouveau prospect vers la personne qui gère actuellement le moins de leads.",
      },

      random: {
        name:
          "Distribution aléatoire",

        description:
          "Les nouveaux prospects sont distribués aléatoirement entre les membres disponibles.",
      },

      fixedOwner: {
        name:
          "Personne spécifique",

        description:
          "Tous les leads correspondant à cette règle sont orientés vers la même personne.",
      },

      teamQueue: {
        name:
          "Orienter vers l’équipe",

        description:
          "Le lead entre dans la file de l’équipe et pourra être pris en charge ultérieurement par un membre.",
      },

      manual: {
        name:
          "Distribution manuelle",

        description:
          "Le lead reste disponible jusqu’à ce qu’un responsable soit attribué manuellement.",
      },
    },

    success: {
      created:
        "Règle de distribution créée avec succès.",

      updated:
        "Règle de distribution mise à jour avec succès.",
    },

    errors: {
      load:
        "Impossible de charger les règles de distribution.",

      save:
        "Impossible d’enregistrer la règle de distribution.",
    },
  },
};

const namespace =
  "AdminCommercialDistribution";

for (
  const [locale, bloco] of
  Object.entries(traducoes)
) {
  const arquivo =
    path.join(
      process.cwd(),
      "messages",
      `${locale}.json`
    );

  if (!fs.existsSync(arquivo)) {
    throw new Error(
      `Arquivo não encontrado: ${arquivo}`
    );
  }

  const textoOriginal =
    fs.readFileSync(
      arquivo,
      "utf8"
    );

  const json =
    JSON.parse(
      textoOriginal
    );

  if (
    Object.prototype
      .hasOwnProperty
      .call(
        json,
        namespace
      )
  ) {
    console.log(
      `⚠ ${locale}: ${namespace} já existe — substituindo o bloco.`
    );
  }

  const backup =
    `${arquivo}.bak-admin-commercial-distribution`;

  if (
    !fs.existsSync(
      backup
    )
  ) {
    fs.copyFileSync(
      arquivo,
      backup
    );
  }

  json[namespace] =
    bloco;

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
    `✓ ${locale}: ${namespace} adicionado`
  );
}

console.log(
  "\nConcluído. Os cinco arquivos de idioma foram atualizados."
);