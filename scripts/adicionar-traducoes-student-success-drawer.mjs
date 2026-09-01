import fs from "node:fs";
import path from "node:path";

const mensagens = {
  "pt-BR": {
    drawer: {
      close: "Fechar",
      analysis: "Análise acadêmica",
      dataCoverage: "Cobertura dos dados",
      reliability: "Confiabilidade",
      indicators: "Indicadores",
      mainSignals: "Principais sinais",
      missingData: "Dados ainda não disponíveis",
      noMainSignals: "Nenhum sinal principal identificado.",
      contact: "Contato",
      studentContact: "Contato do aluno",
      responsibleContact: "Contato do responsável",
      phone: "Telefone",
      email: "E-mail",
      responsible: "Responsável",
      relationship: "Parentesco",
      unavailable: "Não informado",
      actions: "Ações",
      whatsapp: "WhatsApp",
      call: "Ligar",
      sendEmail: "Enviar e-mail",
      registerIntervention: "Registrar intervenção",
      actionComingSoon: "Integração em preparação",
      score: "Pontuação",
      scoreUnavailable: "Pontuação não exibida por falta de dados suficientes",
      recentEvolution: "Evolução recente",
      previousAverage: "Média anterior",
      recentAverage: "Média recente",
      pendingActivities: "Atividades pendentes",
      assessments: "Avaliações consideradas",
      classes: "Aulas consideradas",
    },
  },

  "pt-PT": {
    drawer: {
      close: "Fechar",
      analysis: "Análise académica",
      dataCoverage: "Cobertura dos dados",
      reliability: "Confiabilidade",
      indicators: "Indicadores",
      mainSignals: "Principais sinais",
      missingData: "Dados ainda não disponíveis",
      noMainSignals: "Nenhum sinal principal identificado.",
      contact: "Contacto",
      studentContact: "Contacto do aluno",
      responsibleContact: "Contacto do responsável",
      phone: "Telefone",
      email: "E-mail",
      responsible: "Responsável",
      relationship: "Parentesco",
      unavailable: "Não informado",
      actions: "Ações",
      whatsapp: "WhatsApp",
      call: "Ligar",
      sendEmail: "Enviar e-mail",
      registerIntervention: "Registar intervenção",
      actionComingSoon: "Integração em preparação",
      score: "Pontuação",
      scoreUnavailable: "Pontuação não apresentada por falta de dados suficientes",
      recentEvolution: "Evolução recente",
      previousAverage: "Média anterior",
      recentAverage: "Média recente",
      pendingActivities: "Atividades pendentes",
      assessments: "Avaliações consideradas",
      classes: "Aulas consideradas",
    },
  },

  "en-US": {
    drawer: {
      close: "Close",
      analysis: "Academic analysis",
      dataCoverage: "Data coverage",
      reliability: "Reliability",
      indicators: "Indicators",
      mainSignals: "Main signals",
      missingData: "Data not yet available",
      noMainSignals: "No main signals identified.",
      contact: "Contact",
      studentContact: "Student contact",
      responsibleContact: "Guardian contact",
      phone: "Phone",
      email: "Email",
      responsible: "Guardian",
      relationship: "Relationship",
      unavailable: "Not provided",
      actions: "Actions",
      whatsapp: "WhatsApp",
      call: "Call",
      sendEmail: "Send email",
      registerIntervention: "Register intervention",
      actionComingSoon: "Integration in preparation",
      score: "Score",
      scoreUnavailable: "Score hidden due to insufficient data",
      recentEvolution: "Recent trend",
      previousAverage: "Previous average",
      recentAverage: "Recent average",
      pendingActivities: "Pending activities",
      assessments: "Assessments considered",
      classes: "Classes considered",
    },
  },

  "es-ES": {
    drawer: {
      close: "Cerrar",
      analysis: "Análisis académico",
      dataCoverage: "Cobertura de datos",
      reliability: "Confiabilidad",
      indicators: "Indicadores",
      mainSignals: "Principales señales",
      missingData: "Datos aún no disponibles",
      noMainSignals: "No se identificaron señales principales.",
      contact: "Contacto",
      studentContact: "Contacto del alumno",
      responsibleContact: "Contacto del responsable",
      phone: "Teléfono",
      email: "Correo electrónico",
      responsible: "Responsable",
      relationship: "Parentesco",
      unavailable: "No informado",
      actions: "Acciones",
      whatsapp: "WhatsApp",
      call: "Llamar",
      sendEmail: "Enviar correo",
      registerIntervention: "Registrar intervención",
      actionComingSoon: "Integración en preparación",
      score: "Puntuación",
      scoreUnavailable: "Puntuación no mostrada por falta de datos suficientes",
      recentEvolution: "Evolución reciente",
      previousAverage: "Promedio anterior",
      recentAverage: "Promedio reciente",
      pendingActivities: "Actividades pendientes",
      assessments: "Evaluaciones consideradas",
      classes: "Clases consideradas",
    },
  },

  "fr-FR": {
    drawer: {
      close: "Fermer",
      analysis: "Analyse académique",
      dataCoverage: "Couverture des données",
      reliability: "Fiabilité",
      indicators: "Indicateurs",
      mainSignals: "Principaux signaux",
      missingData: "Données pas encore disponibles",
      noMainSignals: "Aucun signal principal identifié.",
      contact: "Contact",
      studentContact: "Contact de l'étudiant",
      responsibleContact: "Contact du responsable",
      phone: "Téléphone",
      email: "E-mail",
      responsible: "Responsable",
      relationship: "Lien",
      unavailable: "Non renseigné",
      actions: "Actions",
      whatsapp: "WhatsApp",
      call: "Appeler",
      sendEmail: "Envoyer un e-mail",
      registerIntervention: "Enregistrer une intervention",
      actionComingSoon: "Intégration en préparation",
      score: "Score",
      scoreUnavailable: "Score non affiché faute de données suffisantes",
      recentEvolution: "Évolution récente",
      previousAverage: "Moyenne précédente",
      recentAverage: "Moyenne récente",
      pendingActivities: "Activités en attente",
      assessments: "Évaluations prises en compte",
      classes: "Cours pris en compte",
    },
  },
};

const dir =
  path.join(
    process.cwd(),
    "messages"
  );

for (
  const [
    locale,
    conteudo,
  ] of Object.entries(
    mensagens
  )
) {
  const arquivo =
    path.join(
      dir,
      `${locale}.json`
    );

  const json =
    JSON.parse(
      fs.readFileSync(
        arquivo,
        "utf8"
      )
    );

  if (
    !json.AdminStudentSuccess
  ) {
    throw new Error(
      `AdminStudentSuccess não encontrado em ${locale}.json`
    );
  }

  json.AdminStudentSuccess.drawer =
    conteudo.drawer;

  fs.writeFileSync(
    arquivo,
    `${JSON.stringify(
      json,
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(
    `✅ ${locale}.json atualizado`
  );
}

console.log(
  "\n✅ Traduções do Drawer Student Success concluídas."
);