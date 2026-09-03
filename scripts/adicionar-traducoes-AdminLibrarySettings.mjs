import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    eyebrow: "Configuração da Biblioteca",
    title: "Configurações da Biblioteca",
    description:
      "Defina as regras de funcionamento da biblioteca, empréstimos, reservas, notificações, pendências e cobranças da sua instituição.",
    lastUpdated: "Última atualização: {date}",
    backToDashboard: "Voltar para a Biblioteca",
    reload: "Recarregar",
    retry: "Tentar novamente",

    identity: {
      eyebrow: "Identidade",
      title: "Identidade da biblioteca",
      description:
        "Personalize o nome e a apresentação da biblioteca para os usuários da instituição.",
      name: "Nome de exibição",
      libraryDescription: "Descrição",
      descriptionPlaceholder:
        "Apresente a biblioteca, seus objetivos, serviços ou orientações para os usuários."
    },

    features: {
      title: "Recursos disponíveis",
      description:
        "Escolha quais recursos poderão ser utilizados pelos usuários da biblioteca.",
      download: {
        title: "Permitir downloads",
        description:
          "Permite o download quando o item e seu arquivo também estiverem configurados para essa finalidade."
      },
      reviews: {
        title: "Permitir avaliações",
        description:
          "Permite que usuários avaliem os materiais disponíveis na biblioteca."
      },
      favorites: {
        title: "Permitir favoritos",
        description:
          "Permite que usuários salvem materiais em sua lista de favoritos."
      },
      reservations: {
        title: "Permitir reservas",
        description:
          "Permite reservar exemplares ou materiais quando essa modalidade estiver disponível."
      },
      renewals: {
        title: "Permitir renovações",
        description:
          "Permite renovar empréstimos respeitando o limite definido pela instituição."
      },
      suggestions: {
        title: "Permitir sugestões de aquisição",
        description:
          "Permite que usuários sugiram novos livros, obras ou materiais para o acervo."
      }
    },

    circulation: {
      title: "Empréstimos, reservas e renovações",
      description:
        "Defina os prazos e limites padrão utilizados na circulação de materiais.",
      loanDays: "Prazo padrão do empréstimo",
      loanDaysHelp: "Quantidade de dias do empréstimo.",
      reservationDays: "Prazo da reserva",
      reservationDaysHelp:
        "Quantidade de dias em que uma reserva permanece disponível.",
      renewalLimit: "Limite de renovações",
      renewalLimitHelp:
        "Quantidade máxima de renovações permitidas por empréstimo.",
      loanLimit: "Limite de empréstimos",
      loanLimitHelp:
        "Quantidade máxima de empréstimos simultâneos por usuário."
    },

    notifications: {
      title: "Avisos e pendências",
      description:
        "Configure lembretes de vencimento e o comportamento para usuários com pendências.",
      dueNotice: {
        title: "Notificar vencimento",
        description:
          "Ativa avisos antes do vencimento dos empréstimos."
      },
      blockPending: {
        title: "Bloquear aluno com pendência",
        description:
          "Impede novos empréstimos quando o aluno possuir uma pendência aplicável na biblioteca."
      },
      noticeDays: "Avisar com antecedência",
      noticeDaysHelp:
        "Quantidade de dias antes do vencimento em que o aviso deverá ser enviado."
    },

    fines: {
      eyebrow: "Regras financeiras",
      title: "Multas e cobranças",
      description:
        "Defina se atrasos devem gerar multa e quais regras serão usadas para calcular a cobrança.",
      enable: {
        title: "Cobrar multa por atraso",
        description:
          "Quando ativado, devoluções em atraso poderão gerar cobrança conforme as regras abaixo."
      },
      dailyValue: "Valor da multa por dia",
      dailyValueHelp:
        "Valor acrescentado por dia de atraso após o período de carência.",
      graceDays: "Dias de carência",
      graceDaysHelp:
        "Dias de atraso tolerados antes do início da cobrança.",
      maximumValue: "Limite máximo da multa",
      maximumValueHelp:
        "Valor máximo que uma multa poderá atingir. Deixe vazio para não definir um teto.",
      noMaximum: "Sem limite máximo",
      chargeDueDays: "Prazo para vencimento da cobrança",
      chargeDueDaysHelp:
        "Quantidade de dias entre a geração da cobrança e seu vencimento.",
      attentionTitle: "Importante:",
      attentionDescription:
        "Estas regras definem o cálculo da multa. A geração e integração da cobrança com o setor financeiro serão tratadas pelo fluxo financeiro da Biblioteca."
    },

    actions: {
      unsaved: "Existem alterações não salvas",
      saved: "Todas as alterações estão salvas",
      description:
        "As alterações passam a valer para esta instituição após serem salvas.",
      discard: "Descartar alterações",
      saving: "Salvando...",
      save: "Salvar configurações"
    },

    validation: {
      nameRequired: "Informe o nome de exibição da biblioteca.",
      dailyFineRequired:
        "Informe um valor de multa por dia maior que zero.",
      fineLimitInvalid:
        "O limite máximo da multa não pode ser menor que o valor da multa por dia."
    },

    success: {
      saved: "Configurações da Biblioteca salvas com sucesso."
    },

    errors: {
      title: "Não foi possível carregar as configurações",
      load:
        "Não foi possível carregar as configurações da Biblioteca. Tente novamente.",
      save:
        "Não foi possível salvar as configurações da Biblioteca. Verifique os dados e tente novamente."
    },

    toast: {
      close: "Fechar aviso"
    }
  },

  "pt-PT": {
    eyebrow: "Configuração da Biblioteca",
    title: "Configurações da Biblioteca",
    description:
      "Defina as regras de funcionamento da biblioteca, empréstimos, reservas, notificações, pendências e cobranças da sua instituição.",
    lastUpdated: "Última atualização: {date}",
    backToDashboard: "Voltar à Biblioteca",
    reload: "Recarregar",
    retry: "Tentar novamente",

    identity: {
      eyebrow: "Identidade",
      title: "Identidade da biblioteca",
      description:
        "Personalize o nome e a apresentação da biblioteca para os utilizadores da instituição.",
      name: "Nome de apresentação",
      libraryDescription: "Descrição",
      descriptionPlaceholder:
        "Apresente a biblioteca, os seus objetivos, serviços ou orientações para os utilizadores."
    },

    features: {
      title: "Recursos disponíveis",
      description:
        "Escolha os recursos que poderão ser utilizados pelos utilizadores da biblioteca.",
      download: {
        title: "Permitir transferências",
        description:
          "Permite transferir ficheiros quando o item e o respetivo ficheiro também estiverem configurados para essa finalidade."
      },
      reviews: {
        title: "Permitir avaliações",
        description:
          "Permite que os utilizadores avaliem os materiais disponíveis na biblioteca."
      },
      favorites: {
        title: "Permitir favoritos",
        description:
          "Permite que os utilizadores guardem materiais na sua lista de favoritos."
      },
      reservations: {
        title: "Permitir reservas",
        description:
          "Permite reservar exemplares ou materiais quando esta modalidade estiver disponível."
      },
      renewals: {
        title: "Permitir renovações",
        description:
          "Permite renovar empréstimos respeitando o limite definido pela instituição."
      },
      suggestions: {
        title: "Permitir sugestões de aquisição",
        description:
          "Permite que os utilizadores sugiram novos livros, obras ou materiais para o acervo."
      }
    },

    circulation: {
      title: "Empréstimos, reservas e renovações",
      description:
        "Defina os prazos e limites padrão utilizados na circulação de materiais.",
      loanDays: "Prazo padrão do empréstimo",
      loanDaysHelp: "Número de dias do empréstimo.",
      reservationDays: "Prazo da reserva",
      reservationDaysHelp:
        "Número de dias durante os quais uma reserva permanece disponível.",
      renewalLimit: "Limite de renovações",
      renewalLimitHelp:
        "Número máximo de renovações permitidas por empréstimo.",
      loanLimit: "Limite de empréstimos",
      loanLimitHelp:
        "Número máximo de empréstimos simultâneos por utilizador."
    },

    notifications: {
      title: "Avisos e pendências",
      description:
        "Configure lembretes de vencimento e o comportamento para utilizadores com pendências.",
      dueNotice: {
        title: "Notificar vencimento",
        description:
          "Ativa avisos antes do vencimento dos empréstimos."
      },
      blockPending: {
        title: "Bloquear aluno com pendência",
        description:
          "Impede novos empréstimos quando o aluno possuir uma pendência aplicável na biblioteca."
      },
      noticeDays: "Avisar com antecedência",
      noticeDaysHelp:
        "Número de dias antes do vencimento em que o aviso deverá ser enviado."
    },

    fines: {
      eyebrow: "Regras financeiras",
      title: "Multas e cobranças",
      description:
        "Defina se os atrasos devem gerar multa e quais as regras utilizadas para calcular a cobrança.",
      enable: {
        title: "Cobrar multa por atraso",
        description:
          "Quando ativado, devoluções em atraso poderão gerar cobrança de acordo com as regras abaixo."
      },
      dailyValue: "Valor da multa por dia",
      dailyValueHelp:
        "Valor acrescentado por cada dia de atraso após o período de carência.",
      graceDays: "Dias de carência",
      graceDaysHelp:
        "Dias de atraso tolerados antes do início da cobrança.",
      maximumValue: "Limite máximo da multa",
      maximumValueHelp:
        "Valor máximo que uma multa poderá atingir. Deixe vazio para não definir um limite.",
      noMaximum: "Sem limite máximo",
      chargeDueDays: "Prazo para vencimento da cobrança",
      chargeDueDaysHelp:
        "Número de dias entre a geração da cobrança e o respetivo vencimento.",
      attentionTitle: "Importante:",
      attentionDescription:
        "Estas regras definem o cálculo da multa. A geração e integração da cobrança com o setor financeiro serão tratadas pelo fluxo financeiro da Biblioteca."
    },

    actions: {
      unsaved: "Existem alterações por guardar",
      saved: "Todas as alterações estão guardadas",
      description:
        "As alterações entram em vigor nesta instituição depois de serem guardadas.",
      discard: "Descartar alterações",
      saving: "A guardar...",
      save: "Guardar configurações"
    },

    validation: {
      nameRequired: "Indique o nome de apresentação da biblioteca.",
      dailyFineRequired:
        "Indique um valor de multa por dia superior a zero.",
      fineLimitInvalid:
        "O limite máximo da multa não pode ser inferior ao valor da multa por dia."
    },

    success: {
      saved: "Configurações da Biblioteca guardadas com sucesso."
    },

    errors: {
      title: "Não foi possível carregar as configurações",
      load:
        "Não foi possível carregar as configurações da Biblioteca. Tente novamente.",
      save:
        "Não foi possível guardar as configurações da Biblioteca. Verifique os dados e tente novamente."
    },

    toast: {
      close: "Fechar aviso"
    }
  },

  "en-US": {
    eyebrow: "Library settings",
    title: "Library Settings",
    description:
      "Define how your institution's library handles loans, reservations, notifications, pending issues, and charges.",
    lastUpdated: "Last updated: {date}",
    backToDashboard: "Back to Library",
    reload: "Reload",
    retry: "Try again",

    identity: {
      eyebrow: "Identity",
      title: "Library identity",
      description:
        "Customize the library name and presentation shown to your institution's users.",
      name: "Display name",
      libraryDescription: "Description",
      descriptionPlaceholder:
        "Describe the library, its purpose, services, or guidance for users."
    },

    features: {
      title: "Available features",
      description:
        "Choose which features library users will be able to use.",
      download: {
        title: "Allow downloads",
        description:
          "Allows downloads when the item and its file are also configured to permit them."
      },
      reviews: {
        title: "Allow reviews",
        description:
          "Allows users to rate materials available in the library."
      },
      favorites: {
        title: "Allow favorites",
        description:
          "Allows users to save materials to their favorites list."
      },
      reservations: {
        title: "Allow reservations",
        description:
          "Allows copies or materials to be reserved when that option is available."
      },
      renewals: {
        title: "Allow renewals",
        description:
          "Allows loans to be renewed within the limit defined by the institution."
      },
      suggestions: {
        title: "Allow acquisition suggestions",
        description:
          "Allows users to suggest new books, works, or materials for the collection."
      }
    },

    circulation: {
      title: "Loans, reservations, and renewals",
      description:
        "Set the default periods and limits used for material circulation.",
      loanDays: "Default loan period",
      loanDaysHelp: "Number of days in a standard loan.",
      reservationDays: "Reservation period",
      reservationDaysHelp:
        "Number of days a reservation remains available.",
      renewalLimit: "Renewal limit",
      renewalLimitHelp:
        "Maximum number of renewals allowed for each loan.",
      loanLimit: "Loan limit",
      loanLimitHelp:
        "Maximum number of simultaneous loans per user."
    },

    notifications: {
      title: "Notifications and pending issues",
      description:
        "Configure due-date reminders and behavior for users with pending issues.",
      dueNotice: {
        title: "Send due-date notifications",
        description:
          "Enables notifications before loans reach their due date."
      },
      blockPending: {
        title: "Block students with pending issues",
        description:
          "Prevents new loans when a student has an applicable pending library issue."
      },
      noticeDays: "Advance notice",
      noticeDaysHelp:
        "Number of days before the due date when the notification should be sent."
    },

    fines: {
      eyebrow: "Financial rules",
      title: "Fines and charges",
      description:
        "Define whether overdue items generate fines and how those charges are calculated.",
      enable: {
        title: "Charge overdue fines",
        description:
          "When enabled, overdue returns may generate charges according to the rules below."
      },
      dailyValue: "Fine per day",
      dailyValueHelp:
        "Amount added for each overdue day after the grace period.",
      graceDays: "Grace period",
      graceDaysHelp:
        "Number of overdue days allowed before fines begin.",
      maximumValue: "Maximum fine",
      maximumValueHelp:
        "Maximum amount a fine may reach. Leave blank for no maximum.",
      noMaximum: "No maximum",
      chargeDueDays: "Charge due period",
      chargeDueDaysHelp:
        "Number of days between generating the charge and its due date.",
      attentionTitle: "Important:",
      attentionDescription:
        "These rules define how the fine is calculated. Charge generation and financial integration will be handled by the Library's financial workflow."
    },

    actions: {
      unsaved: "You have unsaved changes",
      saved: "All changes are saved",
      description:
        "Changes take effect for this institution after they are saved.",
      discard: "Discard changes",
      saving: "Saving...",
      save: "Save settings"
    },

    validation: {
      nameRequired: "Enter the library display name.",
      dailyFineRequired:
        "Enter a daily fine amount greater than zero.",
      fineLimitInvalid:
        "The maximum fine cannot be lower than the daily fine amount."
    },

    success: {
      saved: "Library settings saved successfully."
    },

    errors: {
      title: "Unable to load settings",
      load:
        "Library settings could not be loaded. Please try again.",
      save:
        "Library settings could not be saved. Check the information and try again."
    },

    toast: {
      close: "Close notification"
    }
  },

  "es-ES": {
    eyebrow: "Configuración de la Biblioteca",
    title: "Configuración de la Biblioteca",
    description:
      "Defina las reglas de funcionamiento de la biblioteca, préstamos, reservas, notificaciones, pendientes y cobros de su institución.",
    lastUpdated: "Última actualización: {date}",
    backToDashboard: "Volver a la Biblioteca",
    reload: "Recargar",
    retry: "Intentar de nuevo",

    identity: {
      eyebrow: "Identidad",
      title: "Identidad de la biblioteca",
      description:
        "Personalice el nombre y la presentación de la biblioteca para los usuarios de la institución.",
      name: "Nombre para mostrar",
      libraryDescription: "Descripción",
      descriptionPlaceholder:
        "Presente la biblioteca, sus objetivos, servicios u orientaciones para los usuarios."
    },

    features: {
      title: "Funciones disponibles",
      description:
        "Seleccione qué funciones podrán utilizar los usuarios de la biblioteca.",
      download: {
        title: "Permitir descargas",
        description:
          "Permite descargar archivos cuando el elemento y su archivo también estén configurados para ello."
      },
      reviews: {
        title: "Permitir valoraciones",
        description:
          "Permite que los usuarios valoren los materiales disponibles en la biblioteca."
      },
      favorites: {
        title: "Permitir favoritos",
        description:
          "Permite que los usuarios guarden materiales en su lista de favoritos."
      },
      reservations: {
        title: "Permitir reservas",
        description:
          "Permite reservar ejemplares o materiales cuando esta modalidad esté disponible."
      },
      renewals: {
        title: "Permitir renovaciones",
        description:
          "Permite renovar préstamos respetando el límite definido por la institución."
      },
      suggestions: {
        title: "Permitir sugerencias de adquisición",
        description:
          "Permite que los usuarios sugieran nuevos libros, obras o materiales para la colección."
      }
    },

    circulation: {
      title: "Préstamos, reservas y renovaciones",
      description:
        "Defina los plazos y límites predeterminados utilizados en la circulación de materiales.",
      loanDays: "Plazo predeterminado del préstamo",
      loanDaysHelp: "Número de días del préstamo.",
      reservationDays: "Plazo de la reserva",
      reservationDaysHelp:
        "Número de días durante los cuales una reserva permanece disponible.",
      renewalLimit: "Límite de renovaciones",
      renewalLimitHelp:
        "Número máximo de renovaciones permitidas por préstamo.",
      loanLimit: "Límite de préstamos",
      loanLimitHelp:
        "Número máximo de préstamos simultáneos por usuario."
    },

    notifications: {
      title: "Avisos y pendientes",
      description:
        "Configure recordatorios de vencimiento y el comportamiento para usuarios con asuntos pendientes.",
      dueNotice: {
        title: "Notificar vencimiento",
        description:
          "Activa avisos antes del vencimiento de los préstamos."
      },
      blockPending: {
        title: "Bloquear al alumno con pendientes",
        description:
          "Impide nuevos préstamos cuando el alumno tenga un asunto pendiente aplicable en la biblioteca."
      },
      noticeDays: "Avisar con antelación",
      noticeDaysHelp:
        "Número de días antes del vencimiento en que debe enviarse el aviso."
    },

    fines: {
      eyebrow: "Reglas financieras",
      title: "Multas y cobros",
      description:
        "Defina si los retrasos deben generar multas y qué reglas se utilizarán para calcular el cobro.",
      enable: {
        title: "Cobrar multa por retraso",
        description:
          "Cuando está activado, las devoluciones tardías pueden generar cobros según las reglas siguientes."
      },
      dailyValue: "Valor de la multa por día",
      dailyValueHelp:
        "Importe añadido por cada día de retraso después del período de gracia.",
      graceDays: "Días de gracia",
      graceDaysHelp:
        "Días de retraso permitidos antes de comenzar el cobro.",
      maximumValue: "Límite máximo de la multa",
      maximumValueHelp:
        "Importe máximo que puede alcanzar una multa. Déjelo vacío para no establecer un límite.",
      noMaximum: "Sin límite máximo",
      chargeDueDays: "Plazo de vencimiento del cobro",
      chargeDueDaysHelp:
        "Número de días entre la generación del cobro y su vencimiento.",
      attentionTitle: "Importante:",
      attentionDescription:
        "Estas reglas definen el cálculo de la multa. La generación del cobro y su integración financiera se gestionarán mediante el flujo financiero de la Biblioteca."
    },

    actions: {
      unsaved: "Hay cambios sin guardar",
      saved: "Todos los cambios están guardados",
      description:
        "Los cambios entrarán en vigor para esta institución después de guardarlos.",
      discard: "Descartar cambios",
      saving: "Guardando...",
      save: "Guardar configuración"
    },

    validation: {
      nameRequired: "Introduzca el nombre para mostrar de la biblioteca.",
      dailyFineRequired:
        "Introduzca un valor de multa diaria mayor que cero.",
      fineLimitInvalid:
        "El límite máximo de la multa no puede ser inferior al valor de la multa diaria."
    },

    success: {
      saved: "La configuración de la Biblioteca se ha guardado correctamente."
    },

    errors: {
      title: "No se pudo cargar la configuración",
      load:
        "No se pudo cargar la configuración de la Biblioteca. Inténtelo de nuevo.",
      save:
        "No se pudo guardar la configuración de la Biblioteca. Revise los datos e inténtelo de nuevo."
    },

    toast: {
      close: "Cerrar aviso"
    }
  },

  "fr-FR": {
    eyebrow: "Configuration de la bibliothèque",
    title: "Paramètres de la bibliothèque",
    description:
      "Définissez les règles de fonctionnement de la bibliothèque, des prêts, des réservations, des notifications, des éléments en attente et des frais de votre établissement.",
    lastUpdated: "Dernière mise à jour : {date}",
    backToDashboard: "Retour à la bibliothèque",
    reload: "Recharger",
    retry: "Réessayer",

    identity: {
      eyebrow: "Identité",
      title: "Identité de la bibliothèque",
      description:
        "Personnalisez le nom et la présentation de la bibliothèque pour les utilisateurs de l'établissement.",
      name: "Nom affiché",
      libraryDescription: "Description",
      descriptionPlaceholder:
        "Présentez la bibliothèque, ses objectifs, ses services ou les consignes destinées aux utilisateurs."
    },

    features: {
      title: "Fonctionnalités disponibles",
      description:
        "Choisissez les fonctionnalités que les utilisateurs de la bibliothèque pourront utiliser.",
      download: {
        title: "Autoriser les téléchargements",
        description:
          "Autorise les téléchargements lorsque l'élément et son fichier sont également configurés à cet effet."
      },
      reviews: {
        title: "Autoriser les évaluations",
        description:
          "Permet aux utilisateurs d'évaluer les ressources disponibles dans la bibliothèque."
      },
      favorites: {
        title: "Autoriser les favoris",
        description:
          "Permet aux utilisateurs d'enregistrer des ressources dans leur liste de favoris."
      },
      reservations: {
        title: "Autoriser les réservations",
        description:
          "Permet de réserver des exemplaires ou des ressources lorsque cette option est disponible."
      },
      renewals: {
        title: "Autoriser les renouvellements",
        description:
          "Permet de renouveler les prêts dans la limite définie par l'établissement."
      },
      suggestions: {
        title: "Autoriser les suggestions d'acquisition",
        description:
          "Permet aux utilisateurs de suggérer de nouveaux livres, ouvrages ou ressources pour la collection."
      }
    },

    circulation: {
      title: "Prêts, réservations et renouvellements",
      description:
        "Définissez les durées et limites par défaut utilisées pour la circulation des ressources.",
      loanDays: "Durée de prêt par défaut",
      loanDaysHelp: "Nombre de jours d'un prêt standard.",
      reservationDays: "Durée de réservation",
      reservationDaysHelp:
        "Nombre de jours pendant lesquels une réservation reste disponible.",
      renewalLimit: "Limite de renouvellements",
      renewalLimitHelp:
        "Nombre maximal de renouvellements autorisés pour chaque prêt.",
      loanLimit: "Limite de prêts",
      loanLimitHelp:
        "Nombre maximal de prêts simultanés par utilisateur."
    },

    notifications: {
      title: "Notifications et éléments en attente",
      description:
        "Configurez les rappels d'échéance et le comportement pour les utilisateurs ayant des éléments en attente.",
      dueNotice: {
        title: "Notifier l'échéance",
        description:
          "Active les notifications avant la date d'échéance des prêts."
      },
      blockPending: {
        title: "Bloquer l'élève ayant un élément en attente",
        description:
          "Empêche de nouveaux prêts lorsqu'un élève possède un élément en attente applicable dans la bibliothèque."
      },
      noticeDays: "Préavis",
      noticeDaysHelp:
        "Nombre de jours avant l'échéance auxquels la notification doit être envoyée."
    },

    fines: {
      eyebrow: "Règles financières",
      title: "Amendes et frais",
      description:
        "Définissez si les retards doivent générer une amende et les règles utilisées pour calculer les frais.",
      enable: {
        title: "Appliquer une amende de retard",
        description:
          "Lorsque cette option est activée, les retours tardifs peuvent générer des frais selon les règles ci-dessous."
      },
      dailyValue: "Montant de l'amende par jour",
      dailyValueHelp:
        "Montant ajouté pour chaque jour de retard après la période de grâce.",
      graceDays: "Jours de grâce",
      graceDaysHelp:
        "Nombre de jours de retard tolérés avant le début de l'amende.",
      maximumValue: "Montant maximal de l'amende",
      maximumValueHelp:
        "Montant maximal qu'une amende peut atteindre. Laissez ce champ vide pour ne pas fixer de plafond.",
      noMaximum: "Sans plafond",
      chargeDueDays: "Délai d'échéance des frais",
      chargeDueDaysHelp:
        "Nombre de jours entre la génération des frais et leur date d'échéance.",
      attentionTitle: "Important :",
      attentionDescription:
        "Ces règles définissent le calcul de l'amende. La génération des frais et leur intégration financière seront gérées par le flux financier de la Bibliothèque."
    },

    actions: {
      unsaved: "Des modifications ne sont pas enregistrées",
      saved: "Toutes les modifications sont enregistrées",
      description:
        "Les modifications prennent effet pour cet établissement après leur enregistrement.",
      discard: "Annuler les modifications",
      saving: "Enregistrement...",
      save: "Enregistrer les paramètres"
    },

    validation: {
      nameRequired: "Saisissez le nom affiché de la bibliothèque.",
      dailyFineRequired:
        "Saisissez un montant d'amende journalier supérieur à zéro.",
      fineLimitInvalid:
        "Le montant maximal de l'amende ne peut pas être inférieur au montant journalier."
    },

    success: {
      saved: "Les paramètres de la bibliothèque ont été enregistrés."
    },

    errors: {
      title: "Impossible de charger les paramètres",
      load:
        "Impossible de charger les paramètres de la bibliothèque. Réessayez.",
      save:
        "Impossible d'enregistrer les paramètres de la bibliothèque. Vérifiez les données et réessayez."
    },

    toast: {
      close: "Fermer la notification"
    }
  }
};

for (const [locale, traducao] of Object.entries(traducoes)) {
  const arquivo = path.resolve(
    "messages",
    `${locale}.json`
  );

  if (!fs.existsSync(arquivo)) {
    throw new Error(
      `Arquivo não encontrado: ${arquivo}`
    );
  }

  const original = fs.readFileSync(
    arquivo,
    "utf8"
  );

  const jsonAtual = JSON.parse(
    original
  );

  if (
    Object.prototype.hasOwnProperty.call(
      jsonAtual,
      "AdminLibrarySettings"
    )
  ) {
    throw new Error(
      `A chave AdminLibrarySettings já existe em ${locale}. Nenhum arquivo foi alterado.`
    );
  }
}

for (const [locale, traducao] of Object.entries(traducoes)) {
  const arquivo = path.resolve(
    "messages",
    `${locale}.json`
  );

  const original = fs.readFileSync(
    arquivo,
    "utf8"
  );

  const semEspacosFinais =
    original.replace(/\s+$/, "");

  if (
    !semEspacosFinais.endsWith("}")
  ) {
    throw new Error(
      `Estrutura inesperada em ${arquivo}`
    );
  }

  const backup =
    `${arquivo}.bak`;

  fs.copyFileSync(
    arquivo,
    backup
  );

  const objeto =
    JSON.stringify(
      traducao,
      null,
      2
    );

  const objetoIndentado =
    objeto
      .split("\n")
      .map(
        (linha, indice) =>
          indice === 0
            ? linha
            : `  ${linha}`
      )
      .join("\n");

  const semUltimaChave =
    semEspacosFinais.slice(
      0,
      -1
    );

  const atualizado =
    `${semUltimaChave},\n  "AdminLibrarySettings": ${objetoIndentado}\n}\n`;

  JSON.parse(
    atualizado
  );

  fs.writeFileSync(
    arquivo,
    atualizado,
    "utf8"
  );

  console.log(
    `✓ ${locale}: AdminLibrarySettings adicionado`
  );
}

console.log("");
console.log(
  "Traduções adicionadas com sucesso nos 5 idiomas."
);