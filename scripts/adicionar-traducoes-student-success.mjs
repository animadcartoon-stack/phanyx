import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    title: "Student Success",
    subtitle:
      "Inteligência e acompanhamento acadêmico",

    description:
      "Identifique sinais acadêmicos que precisam de atenção e acompanhe a evolução dos alunos.",

    cards: {
      critical: "Risco crítico",
      risk: "Em risco",
      attention: "Atenção",
      normal: "Situação normal",
      insufficient: "Dados insuficientes",
    },

    studentsAttention: {
      title: "Alunos que precisam de atenção",
      description:
        "Acompanhe os principais sinais acadêmicos identificados pela PHANYX.",
    },

    table: {
      student: "Aluno",
      risk: "Risco",
      score: "Pontuação",
      frequency: "Frequência",
      performance: "Desempenho",
      pendingActivities: "Pendências",
      trend: "Evolução",
      actions: "Ações",
    },

    levels: {
      NORMAL: "Normal",
      ATENCAO: "Atenção",
      RISCO: "Risco",
      CRITICO: "Crítico",
      DADOS_INSUFICIENTES:
        "Dados insuficientes",
    },

    reliability: {
      label: "Confiabilidade",
      BAIXA: "Baixa",
      MEDIA: "Média",
      ALTA: "Alta",
    },

    components: {
      FREQUENCIA: "Frequência",
      DESEMPENHO: "Desempenho",
      PENDENCIAS: "Atividades pendentes",
      QUEDA_DESEMPENHO: "Evolução recente",
      PARTICIPACAO: "Participação",
    },

    actions: {
      viewStudent: "Ver análise",
      viewDetails: "Ver detalhes",
      filters: "Filtros",
      refresh: "Atualizar análise",
      clearFilters: "Limpar filtros",
    },

    filters: {
      title: "Filtros",
      search: "Buscar aluno",
      searchPlaceholder:
        "Nome ou matrícula",
      course: "Curso",
      class: "Turma",
      subject: "Disciplina",
      level: "Nível de risco",
      all: "Todos",
    },

    states: {
      loading: "Carregando análises...",
      empty:
        "Nenhum aluno encontrado para os filtros selecionados.",
      noRisk:
        "Nenhum aluno apresenta sinais relevantes de risco neste momento.",
      error:
        "Não foi possível carregar as análises acadêmicas.",
    },

    score: {
      label: "Índice de risco",
      outOf: "de 100",
      coverage: "Cobertura dos dados",
    },

    overview: {
      title: "Visão geral",
      monitoredStudents:
        "Alunos monitorados",
      studentsWithSignals:
        "Alunos com sinais de atenção",
    },

    disclaimer: {
      title: "Apoio à decisão acadêmica",
      text:
        "Os indicadores auxiliam a equipe pedagógica na identificação de sinais acadêmicos. As decisões e intervenções permanecem sob responsabilidade dos profissionais da instituição.",
    },
  },

  "pt-PT": {
    title: "Student Success",
    subtitle:
      "Inteligência e acompanhamento académico",

    description:
      "Identifique sinais académicos que necessitam de atenção e acompanhe a evolução dos alunos.",

    cards: {
      critical: "Risco crítico",
      risk: "Em risco",
      attention: "Atenção",
      normal: "Situação normal",
      insufficient: "Dados insuficientes",
    },

    studentsAttention: {
      title: "Alunos que necessitam de atenção",
      description:
        "Acompanhe os principais sinais académicos identificados pela PHANYX.",
    },

    table: {
      student: "Aluno",
      risk: "Risco",
      score: "Pontuação",
      frequency: "Frequência",
      performance: "Desempenho",
      pendingActivities: "Pendências",
      trend: "Evolução",
      actions: "Ações",
    },

    levels: {
      NORMAL: "Normal",
      ATENCAO: "Atenção",
      RISCO: "Risco",
      CRITICO: "Crítico",
      DADOS_INSUFICIENTES:
        "Dados insuficientes",
    },

    reliability: {
      label: "Fiabilidade",
      BAIXA: "Baixa",
      MEDIA: "Média",
      ALTA: "Alta",
    },

    components: {
      FREQUENCIA: "Assiduidade",
      DESEMPENHO: "Desempenho",
      PENDENCIAS: "Atividades pendentes",
      QUEDA_DESEMPENHO: "Evolução recente",
      PARTICIPACAO: "Participação",
    },

    actions: {
      viewStudent: "Ver análise",
      viewDetails: "Ver detalhes",
      filters: "Filtros",
      refresh: "Atualizar análise",
      clearFilters: "Limpar filtros",
    },

    filters: {
      title: "Filtros",
      search: "Pesquisar aluno",
      searchPlaceholder:
        "Nome ou matrícula",
      course: "Curso",
      class: "Turma",
      subject: "Disciplina",
      level: "Nível de risco",
      all: "Todos",
    },

    states: {
      loading: "A carregar análises...",
      empty:
        "Nenhum aluno encontrado para os filtros selecionados.",
      noRisk:
        "Nenhum aluno apresenta sinais relevantes de risco neste momento.",
      error:
        "Não foi possível carregar as análises académicas.",
    },

    score: {
      label: "Índice de risco",
      outOf: "de 100",
      coverage: "Cobertura dos dados",
    },

    overview: {
      title: "Visão geral",
      monitoredStudents:
        "Alunos monitorizados",
      studentsWithSignals:
        "Alunos com sinais de atenção",
    },

    disclaimer: {
      title: "Apoio à decisão académica",
      text:
        "Os indicadores apoiam a equipa pedagógica na identificação de sinais académicos. As decisões e intervenções permanecem sob responsabilidade dos profissionais da instituição.",
    },
  },

  "en-US": {
    title: "Student Success",
    subtitle:
      "Academic intelligence and student monitoring",

    description:
      "Identify academic signals that require attention and monitor student progress.",

    cards: {
      critical: "Critical risk",
      risk: "At risk",
      attention: "Needs attention",
      normal: "Normal status",
      insufficient: "Insufficient data",
    },

    studentsAttention: {
      title: "Students requiring attention",
      description:
        "Monitor the main academic signals identified by PHANYX.",
    },

    table: {
      student: "Student",
      risk: "Risk",
      score: "Score",
      frequency: "Attendance",
      performance: "Performance",
      pendingActivities: "Pending activities",
      trend: "Trend",
      actions: "Actions",
    },

    levels: {
      NORMAL: "Normal",
      ATENCAO: "Attention",
      RISCO: "Risk",
      CRITICO: "Critical",
      DADOS_INSUFICIENTES:
        "Insufficient data",
    },

    reliability: {
      label: "Reliability",
      BAIXA: "Low",
      MEDIA: "Medium",
      ALTA: "High",
    },

    components: {
      FREQUENCIA: "Attendance",
      DESEMPENHO: "Performance",
      PENDENCIAS: "Pending activities",
      QUEDA_DESEMPENHO: "Recent trend",
      PARTICIPACAO: "Participation",
    },

    actions: {
      viewStudent: "View analysis",
      viewDetails: "View details",
      filters: "Filters",
      refresh: "Refresh analysis",
      clearFilters: "Clear filters",
    },

    filters: {
      title: "Filters",
      search: "Search student",
      searchPlaceholder:
        "Name or enrollment number",
      course: "Course",
      class: "Class",
      subject: "Subject",
      level: "Risk level",
      all: "All",
    },

    states: {
      loading: "Loading analyses...",
      empty:
        "No students found for the selected filters.",
      noRisk:
        "No students currently show relevant risk signals.",
      error:
        "Academic analyses could not be loaded.",
    },

    score: {
      label: "Risk index",
      outOf: "out of 100",
      coverage: "Data coverage",
    },

    overview: {
      title: "Overview",
      monitoredStudents:
        "Students monitored",
      studentsWithSignals:
        "Students with attention signals",
    },

    disclaimer: {
      title: "Academic decision support",
      text:
        "These indicators help educational teams identify academic signals. Decisions and interventions remain the responsibility of the institution's professionals.",
    },
  },

  "es-ES": {
    title: "Student Success",
    subtitle:
      "Inteligencia y seguimiento académico",

    description:
      "Identifique señales académicas que requieren atención y supervise la evolución de los estudiantes.",

    cards: {
      critical: "Riesgo crítico",
      risk: "En riesgo",
      attention: "Atención",
      normal: "Situación normal",
      insufficient: "Datos insuficientes",
    },

    studentsAttention: {
      title: "Estudiantes que requieren atención",
      description:
        "Supervise las principales señales académicas identificadas por PHANYX.",
    },

    table: {
      student: "Estudiante",
      risk: "Riesgo",
      score: "Puntuación",
      frequency: "Asistencia",
      performance: "Rendimiento",
      pendingActivities: "Pendientes",
      trend: "Evolución",
      actions: "Acciones",
    },

    levels: {
      NORMAL: "Normal",
      ATENCAO: "Atención",
      RISCO: "Riesgo",
      CRITICO: "Crítico",
      DADOS_INSUFICIENTES:
        "Datos insuficientes",
    },

    reliability: {
      label: "Fiabilidad",
      BAIXA: "Baja",
      MEDIA: "Media",
      ALTA: "Alta",
    },

    components: {
      FREQUENCIA: "Asistencia",
      DESEMPENHO: "Rendimiento",
      PENDENCIAS: "Actividades pendientes",
      QUEDA_DESEMPENHO: "Evolución reciente",
      PARTICIPACAO: "Participación",
    },

    actions: {
      viewStudent: "Ver análisis",
      viewDetails: "Ver detalles",
      filters: "Filtros",
      refresh: "Actualizar análisis",
      clearFilters: "Limpiar filtros",
    },

    filters: {
      title: "Filtros",
      search: "Buscar estudiante",
      searchPlaceholder:
        "Nombre o matrícula",
      course: "Curso",
      class: "Clase",
      subject: "Asignatura",
      level: "Nivel de riesgo",
      all: "Todos",
    },

    states: {
      loading: "Cargando análisis...",
      empty:
        "No se encontraron estudiantes para los filtros seleccionados.",
      noRisk:
        "Actualmente ningún estudiante presenta señales relevantes de riesgo.",
      error:
        "No fue posible cargar los análisis académicos.",
    },

    score: {
      label: "Índice de riesgo",
      outOf: "de 100",
      coverage: "Cobertura de datos",
    },

    overview: {
      title: "Vista general",
      monitoredStudents:
        "Estudiantes supervisados",
      studentsWithSignals:
        "Estudiantes con señales de atención",
    },

    disclaimer: {
      title: "Apoyo a la decisión académica",
      text:
        "Los indicadores ayudan al equipo educativo a identificar señales académicas. Las decisiones e intervenciones siguen siendo responsabilidad de los profesionales de la institución.",
    },
  },

  "fr-FR": {
    title: "Student Success",
    subtitle:
      "Intelligence et suivi académique",

    description:
      "Identifiez les signaux académiques nécessitant une attention et suivez la progression des étudiants.",

    cards: {
      critical: "Risque critique",
      risk: "À risque",
      attention: "À surveiller",
      normal: "Situation normale",
      insufficient: "Données insuffisantes",
    },

    studentsAttention: {
      title: "Étudiants nécessitant une attention",
      description:
        "Suivez les principaux signaux académiques identifiés par PHANYX.",
    },

    table: {
      student: "Étudiant",
      risk: "Risque",
      score: "Score",
      frequency: "Assiduité",
      performance: "Performance",
      pendingActivities: "Activités en attente",
      trend: "Évolution",
      actions: "Actions",
    },

    levels: {
      NORMAL: "Normal",
      ATENCAO: "Attention",
      RISCO: "Risque",
      CRITICO: "Critique",
      DADOS_INSUFICIENTES:
        "Données insuffisantes",
    },

    reliability: {
      label: "Fiabilité",
      BAIXA: "Faible",
      MEDIA: "Moyenne",
      ALTA: "Élevée",
    },

    components: {
      FREQUENCIA: "Assiduité",
      DESEMPENHO: "Performance",
      PENDENCIAS: "Activités en attente",
      QUEDA_DESEMPENHO: "Évolution récente",
      PARTICIPACAO: "Participation",
    },

    actions: {
      viewStudent: "Voir l'analyse",
      viewDetails: "Voir les détails",
      filters: "Filtres",
      refresh: "Actualiser l'analyse",
      clearFilters: "Effacer les filtres",
    },

    filters: {
      title: "Filtres",
      search: "Rechercher un étudiant",
      searchPlaceholder:
        "Nom ou numéro d'inscription",
      course: "Formation",
      class: "Classe",
      subject: "Discipline",
      level: "Niveau de risque",
      all: "Tous",
    },

    states: {
      loading: "Chargement des analyses...",
      empty:
        "Aucun étudiant trouvé pour les filtres sélectionnés.",
      noRisk:
        "Aucun étudiant ne présente actuellement de signal de risque significatif.",
      error:
        "Impossible de charger les analyses académiques.",
    },

    score: {
      label: "Indice de risque",
      outOf: "sur 100",
      coverage: "Couverture des données",
    },

    overview: {
      title: "Vue d'ensemble",
      monitoredStudents:
        "Étudiants suivis",
      studentsWithSignals:
        "Étudiants présentant des signaux d'attention",
    },

    disclaimer: {
      title: "Aide à la décision académique",
      text:
        "Ces indicateurs aident les équipes pédagogiques à identifier les signaux académiques. Les décisions et interventions restent sous la responsabilité des professionnels de l'établissement.",
    },
  },
};

const messagesDir =
  path.join(
    process.cwd(),
    "messages"
  );

for (
  const [
    locale,
    namespace,
  ] of Object.entries(
    traducoes
  )
) {
  const filePath =
    path.join(
      messagesDir,
      `${locale}.json`
    );

  if (
    !fs.existsSync(
      filePath
    )
  ) {
    console.error(
      `Arquivo não encontrado: ${filePath}`
    );

    process.exitCode = 1;

    continue;
  }

  const atual =
    JSON.parse(
      fs.readFileSync(
        filePath,
        "utf8"
      )
    );

  atual.AdminStudentSuccess = {
    ...(atual.AdminStudentSuccess ??
      {}),
    ...namespace,
  };

  fs.writeFileSync(
    filePath,
    `${JSON.stringify(
      atual,
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
  "\n✅ Traduções do PHANYX Student Success concluídas."
);