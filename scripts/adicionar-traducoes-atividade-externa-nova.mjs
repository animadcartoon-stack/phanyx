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
    title: "Nova atividade externa",
    subtitle:
      "Cadastre o planejamento inicial. Transporte, autorizações, participantes, segurança e documentos poderão ser organizados depois.",
    back: "Voltar para atividades externas",
    sections: {
      general: "Informações gerais",
      generalDescription: "Identifique a atividade e sua finalidade.",
      destination: "Destino",
      destinationDescription: "Informe para onde o grupo irá.",
      schedule: "Datas e horários",
      scheduleDescription: "Planeje a saída e o retorno previsto.",
      organization: "Organização",
      organizationDescription: "Defina polo, responsável e turmas.",
      participation: "Participação e regras",
      participationDescription: "Configure capacidade, cobrança e controles necessários."
    },
    fields: {
      title: "Título da atividade",
      titlePlaceholder: "Ex.: Visita ao Museu de Ciências",
      type: "Tipo de atividade",
      selectType: "Selecione o tipo",
      description: "Descrição",
      descriptionPlaceholder: "Descreva brevemente a atividade...",
      objective: "Objetivo pedagógico",
      objectivePlaceholder: "Qual é o objetivo educacional desta atividade?",
      destinationName: "Nome do destino",
      destinationNamePlaceholder: "Ex.: Museu de Ciências",
      address: "Endereço",
      addressPlaceholder: "Rua, número, complemento...",
      city: "Cidade",
      region: "Estado / Região",
      country: "País",
      timezone: "Fuso horário",
      departure: "Saída",
      expectedReturn: "Retorno previsto",
      campus: "Polo / Unidade",
      noSpecificCampus: "Sem polo específico",
      responsible: "Responsável principal",
      classes: "Turmas participantes",
      searchClasses: "Buscar turma...",
      noClasses: "Nenhuma turma encontrada.",
      capacity: "Capacidade máxima",
      value: "Valor por participante",
      currency: "Moeda",
      currencyPlaceholder: "BRL, USD, EUR..."
    },
    switches: {
      curricular: "Atividade curricular",
      curricularHelp: "Faz parte da programação ou grade acadêmica.",
      mandatory: "Participação obrigatória",
      mandatoryHelp: "A atividade é obrigatória para os participantes selecionados.",
      international: "Viagem internacional",
      internationalHelp: "A atividade envolve deslocamento para outro país.",
      authorization: "Exigir autorização do responsável",
      authorizationHelp: "Solicitar consentimento antes da participação.",
      payment: "Há cobrança para o participante",
      paymentHelp: "Permite informar valor e moeda da atividade.",
      checkin: "Controlar presença / check-in",
      checkinHelp: "Permite registrar presença nos pontos de controle."
    },
    selectedClasses: "{count} turma(s) selecionada(s)",
    saveDraft: "Criar atividade",
    saving: "Criando atividade...",
    cancel: "Cancelar",
    loadingOptions: "Carregando opções...",
    requiredHint: "Campos marcados com * são obrigatórios.",
    errors: {
      loadOptions: "Não foi possível carregar as opções do formulário.",
      save: "Não foi possível criar a atividade.",
      titleRequired: "Informe o título da atividade.",
      typeRequired: "Selecione o tipo da atividade.",
      campusRequired: "Selecione um polo para esta atividade.",
      invalidPeriod: "O retorno previsto deve acontecer depois da saída.",
      invalidCapacity: "A capacidade máxima deve ser maior que zero.",
      invalidValue: "Informe um valor válido.",
      invalidCurrency: "Informe uma moeda de três letras, como BRL, USD ou EUR."
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
    eyebrow: "Gestão académica",
    title: "Nova atividade externa",
    subtitle:
      "Registe o planeamento inicial. Transporte, autorizações, participantes, segurança e documentos poderão ser organizados posteriormente.",
    back: "Voltar às atividades externas",
    sections: {
      general: "Informações gerais",
      generalDescription: "Identifique a atividade e a sua finalidade.",
      destination: "Destino",
      destinationDescription: "Indique para onde o grupo irá.",
      schedule: "Datas e horários",
      scheduleDescription: "Planeie a partida e o regresso previsto.",
      organization: "Organização",
      organizationDescription: "Defina polo, responsável e turmas.",
      participation: "Participação e regras",
      participationDescription: "Configure capacidade, cobrança e controlos necessários."
    },
    fields: {
      title: "Título da atividade",
      titlePlaceholder: "Ex.: Visita ao Museu de Ciências",
      type: "Tipo de atividade",
      selectType: "Selecione o tipo",
      description: "Descrição",
      descriptionPlaceholder: "Descreva brevemente a atividade...",
      objective: "Objetivo pedagógico",
      objectivePlaceholder: "Qual é o objetivo educacional desta atividade?",
      destinationName: "Nome do destino",
      destinationNamePlaceholder: "Ex.: Museu de Ciências",
      address: "Morada",
      addressPlaceholder: "Rua, número, complemento...",
      city: "Cidade",
      region: "Distrito / Região",
      country: "País",
      timezone: "Fuso horário",
      departure: "Partida",
      expectedReturn: "Regresso previsto",
      campus: "Polo / Unidade",
      noSpecificCampus: "Sem polo específico",
      responsible: "Responsável principal",
      classes: "Turmas participantes",
      searchClasses: "Pesquisar turma...",
      noClasses: "Nenhuma turma encontrada.",
      capacity: "Capacidade máxima",
      value: "Valor por participante",
      currency: "Moeda",
      currencyPlaceholder: "EUR, USD, BRL..."
    },
    switches: {
      curricular: "Atividade curricular",
      curricularHelp: "Faz parte da programação ou plano académico.",
      mandatory: "Participação obrigatória",
      mandatoryHelp: "A atividade é obrigatória para os participantes selecionados.",
      international: "Viagem internacional",
      internationalHelp: "A atividade envolve deslocação para outro país.",
      authorization: "Exigir autorização do responsável",
      authorizationHelp: "Solicitar consentimento antes da participação.",
      payment: "Existe cobrança ao participante",
      paymentHelp: "Permite indicar valor e moeda da atividade.",
      checkin: "Controlar presença / check-in",
      checkinHelp: "Permite registar presença nos pontos de controlo."
    },
    selectedClasses: "{count} turma(s) selecionada(s)",
    saveDraft: "Criar atividade",
    saving: "A criar atividade...",
    cancel: "Cancelar",
    loadingOptions: "A carregar opções...",
    requiredHint: "Os campos assinalados com * são obrigatórios.",
    errors: {
      loadOptions: "Não foi possível carregar as opções do formulário.",
      save: "Não foi possível criar a atividade.",
      titleRequired: "Indique o título da atividade.",
      typeRequired: "Selecione o tipo da atividade.",
      campusRequired: "Selecione um polo para esta atividade.",
      invalidPeriod: "O regresso previsto deve ocorrer depois da partida.",
      invalidCapacity: "A capacidade máxima deve ser superior a zero.",
      invalidValue: "Indique um valor válido.",
      invalidCurrency: "Indique uma moeda de três letras, como EUR, USD ou BRL."
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
    eyebrow: "Academic management",
    title: "New external activity",
    subtitle:
      "Create the initial plan. Transportation, permissions, participants, safety and documents can be organized afterward.",
    back: "Back to external activities",
    sections: {
      general: "General information",
      generalDescription: "Identify the activity and its purpose.",
      destination: "Destination",
      destinationDescription: "Enter where the group will be going.",
      schedule: "Dates and times",
      scheduleDescription: "Plan departure and expected return.",
      organization: "Organization",
      organizationDescription: "Choose campus, lead and classes.",
      participation: "Participation and rules",
      participationDescription: "Configure capacity, charges and required controls."
    },
    fields: {
      title: "Activity title",
      titlePlaceholder: "E.g. Science Museum Field Trip",
      type: "Activity type",
      selectType: "Select a type",
      description: "Description",
      descriptionPlaceholder: "Briefly describe the activity...",
      objective: "Educational objective",
      objectivePlaceholder: "What is the educational purpose of this activity?",
      destinationName: "Destination name",
      destinationNamePlaceholder: "E.g. Science Museum",
      address: "Address",
      addressPlaceholder: "Street, number, additional information...",
      city: "City",
      region: "State / Region",
      country: "Country",
      timezone: "Time zone",
      departure: "Departure",
      expectedReturn: "Expected return",
      campus: "Campus / Unit",
      noSpecificCampus: "No specific campus",
      responsible: "Lead",
      classes: "Participating classes",
      searchClasses: "Search classes...",
      noClasses: "No classes found.",
      capacity: "Maximum capacity",
      value: "Price per participant",
      currency: "Currency",
      currencyPlaceholder: "USD, EUR, BRL..."
    },
    switches: {
      curricular: "Curricular activity",
      curricularHelp: "Part of the academic program or curriculum.",
      mandatory: "Mandatory participation",
      mandatoryHelp: "Participation is required for selected participants.",
      international: "International trip",
      internationalHelp: "The activity involves travel to another country.",
      authorization: "Require guardian permission",
      authorizationHelp: "Request consent before participation.",
      payment: "Participant fee",
      paymentHelp: "Allows a price and currency to be defined.",
      checkin: "Track attendance / check-in",
      checkinHelp: "Allows attendance to be recorded at checkpoints."
    },
    selectedClasses: "{count} class(es) selected",
    saveDraft: "Create activity",
    saving: "Creating activity...",
    cancel: "Cancel",
    loadingOptions: "Loading options...",
    requiredHint: "Fields marked with * are required.",
    errors: {
      loadOptions: "The form options could not be loaded.",
      save: "The activity could not be created.",
      titleRequired: "Enter an activity title.",
      typeRequired: "Select an activity type.",
      campusRequired: "Select a campus for this activity.",
      invalidPeriod: "Expected return must be after departure.",
      invalidCapacity: "Maximum capacity must be greater than zero.",
      invalidValue: "Enter a valid amount.",
      invalidCurrency: "Enter a three-letter currency code such as USD, EUR or BRL."
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
    eyebrow: "Gestión académica",
    title: "Nueva actividad externa",
    subtitle:
      "Registra la planificación inicial. Transporte, autorizaciones, participantes, seguridad y documentos podrán organizarse después.",
    back: "Volver a actividades externas",
    sections: {
      general: "Información general",
      generalDescription: "Identifica la actividad y su finalidad.",
      destination: "Destino",
      destinationDescription: "Indica adónde irá el grupo.",
      schedule: "Fechas y horarios",
      scheduleDescription: "Planifica la salida y el regreso previsto.",
      organization: "Organización",
      organizationDescription: "Define sede, responsable y clases.",
      participation: "Participación y reglas",
      participationDescription: "Configura capacidad, cobros y controles necesarios."
    },
    fields: {
      title: "Título de la actividad",
      titlePlaceholder: "Ej.: Visita al Museo de Ciencias",
      type: "Tipo de actividad",
      selectType: "Selecciona un tipo",
      description: "Descripción",
      descriptionPlaceholder: "Describe brevemente la actividad...",
      objective: "Objetivo educativo",
      objectivePlaceholder: "¿Cuál es el objetivo educativo de esta actividad?",
      destinationName: "Nombre del destino",
      destinationNamePlaceholder: "Ej.: Museo de Ciencias",
      address: "Dirección",
      addressPlaceholder: "Calle, número, información adicional...",
      city: "Ciudad",
      region: "Estado / Región",
      country: "País",
      timezone: "Zona horaria",
      departure: "Salida",
      expectedReturn: "Regreso previsto",
      campus: "Sede / Unidad",
      noSpecificCampus: "Sin sede específica",
      responsible: "Responsable principal",
      classes: "Clases participantes",
      searchClasses: "Buscar clase...",
      noClasses: "No se encontraron clases.",
      capacity: "Capacidad máxima",
      value: "Valor por participante",
      currency: "Moneda",
      currencyPlaceholder: "EUR, USD, BRL..."
    },
    switches: {
      curricular: "Actividad curricular",
      curricularHelp: "Forma parte de la programación o currículo académico.",
      mandatory: "Participación obligatoria",
      mandatoryHelp: "La actividad es obligatoria para los participantes seleccionados.",
      international: "Viaje internacional",
      internationalHelp: "La actividad implica viajar a otro país.",
      authorization: "Requerir autorización del responsable",
      authorizationHelp: "Solicitar consentimiento antes de participar.",
      payment: "Hay un cobro al participante",
      paymentHelp: "Permite indicar valor y moneda.",
      checkin: "Controlar asistencia / check-in",
      checkinHelp: "Permite registrar asistencia en los puntos de control."
    },
    selectedClasses: "{count} clase(s) seleccionada(s)",
    saveDraft: "Crear actividad",
    saving: "Creando actividad...",
    cancel: "Cancelar",
    loadingOptions: "Cargando opciones...",
    requiredHint: "Los campos marcados con * son obligatorios.",
    errors: {
      loadOptions: "No se pudieron cargar las opciones del formulario.",
      save: "No se pudo crear la actividad.",
      titleRequired: "Indica el título de la actividad.",
      typeRequired: "Selecciona el tipo de actividad.",
      campusRequired: "Selecciona una sede para esta actividad.",
      invalidPeriod: "El regreso previsto debe ser posterior a la salida.",
      invalidCapacity: "La capacidad máxima debe ser mayor que cero.",
      invalidValue: "Indica un valor válido.",
      invalidCurrency: "Indica una moneda de tres letras, como EUR, USD o BRL."
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
    eyebrow: "Gestion académique",
    title: "Nouvelle activité extérieure",
    subtitle:
      "Enregistrez la planification initiale. Transport, autorisations, participants, sécurité et documents pourront être organisés ensuite.",
    back: "Retour aux activités extérieures",
    sections: {
      general: "Informations générales",
      generalDescription: "Identifiez l’activité et son objectif.",
      destination: "Destination",
      destinationDescription: "Indiquez où le groupe se rendra.",
      schedule: "Dates et horaires",
      scheduleDescription: "Planifiez le départ et le retour prévu.",
      organization: "Organisation",
      organizationDescription: "Définissez le campus, le responsable et les classes.",
      participation: "Participation et règles",
      participationDescription: "Configurez la capacité, les frais et les contrôles nécessaires."
    },
    fields: {
      title: "Titre de l’activité",
      titlePlaceholder: "Ex. : Visite du Musée des Sciences",
      type: "Type d’activité",
      selectType: "Sélectionnez un type",
      description: "Description",
      descriptionPlaceholder: "Décrivez brièvement l’activité...",
      objective: "Objectif pédagogique",
      objectivePlaceholder: "Quel est l’objectif pédagogique de cette activité ?",
      destinationName: "Nom de la destination",
      destinationNamePlaceholder: "Ex. : Musée des Sciences",
      address: "Adresse",
      addressPlaceholder: "Rue, numéro, informations complémentaires...",
      city: "Ville",
      region: "État / Région",
      country: "Pays",
      timezone: "Fuseau horaire",
      departure: "Départ",
      expectedReturn: "Retour prévu",
      campus: "Campus / Unité",
      noSpecificCampus: "Aucun campus spécifique",
      responsible: "Responsable principal",
      classes: "Classes participantes",
      searchClasses: "Rechercher une classe...",
      noClasses: "Aucune classe trouvée.",
      capacity: "Capacité maximale",
      value: "Prix par participant",
      currency: "Devise",
      currencyPlaceholder: "EUR, USD, BRL..."
    },
    switches: {
      curricular: "Activité pédagogique",
      curricularHelp: "Fait partie du programme ou du cursus académique.",
      mandatory: "Participation obligatoire",
      mandatoryHelp: "L’activité est obligatoire pour les participants sélectionnés.",
      international: "Voyage international",
      internationalHelp: "L’activité implique un déplacement vers un autre pays.",
      authorization: "Exiger l’autorisation du responsable légal",
      authorizationHelp: "Demander le consentement avant la participation.",
      payment: "Participation financière",
      paymentHelp: "Permet de définir un prix et une devise.",
      checkin: "Contrôler la présence / check-in",
      checkinHelp: "Permet d’enregistrer la présence aux points de contrôle."
    },
    selectedClasses: "{count} classe(s) sélectionnée(s)",
    saveDraft: "Créer l’activité",
    saving: "Création de l’activité...",
    cancel: "Annuler",
    loadingOptions: "Chargement des options...",
    requiredHint: "Les champs marqués d’un * sont obligatoires.",
    errors: {
      loadOptions: "Impossible de charger les options du formulaire.",
      save: "Impossible de créer l’activité.",
      titleRequired: "Indiquez le titre de l’activité.",
      typeRequired: "Sélectionnez le type d’activité.",
      campusRequired: "Sélectionnez un campus pour cette activité.",
      invalidPeriod: "Le retour prévu doit avoir lieu après le départ.",
      invalidCapacity: "La capacité maximale doit être supérieure à zéro.",
      invalidValue: "Indiquez un montant valide.",
      invalidCurrency: "Indiquez une devise à trois lettres, comme EUR, USD ou BRL."
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

const namespace = "AdminExternalActivityNew";

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

console.log("✅ Traduções da nova atividade concluídas.");