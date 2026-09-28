import type { ForeignLocale } from "@/lib/localized-plans";

export type SearchIntent = "school" | "lms" | "success";
type IntentCopy = {
  title: string; description: string; heading: string; intro: string;
  benefitsHeading: string; benefits: { title: string; detail: string }[];
  workflowHeading: string; workflow: string[];
  question: string; answer: string;
  nextStep: string;
};

export const searchIntentCopy: Record<ForeignLocale, Record<SearchIntent, IntentCopy>> = {
  "en-US": {
    school: {
      title: "School Management Software for Growing Institutions | PHANYX",
      description: "Manage enrollment, classes, academic records, finance and role-based portals in PHANYX. Explore a school management system for institutions with multiple units.",
      heading: "School management software that connects your daily operations",
      intro: "Bring enrollment, courses, classes, staff and institutional finance into one workspace. PHANYX gives administrators a shared view while teachers and students use their own portals.",
      benefitsHeading: "What your institution can organize", benefits: [
        { title: "Enrollment and academic structure", detail: "Manage courses, terms, subjects, classes and enrollment records together." },
        { title: "Separate portals", detail: "Give administrators, teachers and students access suited to their roles." },
        { title: "Documents and finance", detail: "Connect institutional documents and payment follow-up to the academic record." },
      ],
      workflowHeading: "A practical rollout", workflow: ["Set up the institution, its units and staff roles.", "Register courses, classes and student enrollments.", "Invite teachers and students to their portals, then review reports and permissions."],
      question: "Can several units use the same platform?", answer: "PHANYX supports institutional units and role-based access. The units included and additional unit fees depend on the selected plan.",
      nextStep: "Compare plans and estimate costs in US dollars",
    },
    lms: {
      title: "Learning Management System with Academic Operations | PHANYX",
      description: "A learning management system connected to classes, online materials, assessments, student portals and academic administration.",
      heading: "Online learning connected to academic management",
      intro: "A course platform is easier to operate when teaching activity and institutional records share a workflow. PHANYX combines learning materials, assessments and student access with academic administration.",
      benefitsHeading: "Teaching tools in context", benefits: [
        { title: "Lessons and materials", detail: "Organize learning resources by course and class so students find their work." },
        { title: "Assessments", detail: "Use online tests with automatic grading where the chosen plan includes them." },
        { title: "Progress and records", detail: "Follow course progress alongside enrollment and academic documentation." },
      ],
      workflowHeading: "From course setup to student access", workflow: ["Build courses and classes in the academic area.", "Add lessons, learning resources and assessments.", "Open student and teacher portals and track progress."],
      question: "Is the LMS included in every plan?", answer: "The Essential plan provides a basic learning foundation. The Professional plan includes the complete LMS and online exams; compare the plan details before choosing.",
      nextStep: "See LMS features and local plan estimates",
    },
    success: {
      title: "Student Success Platform and Early Intervention | PHANYX",
      description: "See academic signals, identify students who need attention and organize interventions and follow-up in PHANYX.",
      heading: "Turn student signals into timely support",
      intro: "Student success work needs more than a list of grades. PHANYX brings academic indicators together so authorized teams can prioritize students, record interventions and plan the next contact.",
      benefitsHeading: "A clearer support routine", benefits: [
        { title: "See who needs attention", detail: "Review attendance, grades and overdue activities in an academic context." },
        { title: "Plan interventions", detail: "Record support actions, owners, status and the next step." },
        { title: "Follow up", detail: "Revisit priorities and measure whether the support plan needs adjustment." },
      ],
      workflowHeading: "A simple intervention cycle", workflow: ["Review academic indicators and data coverage.", "Prioritize students who need a human review.", "Record an intervention and schedule follow-up."],
      question: "Does a risk indicator make a decision automatically?", answer: "No. Indicators help staff decide whom to review; the institution remains responsible for evaluating each student and choosing suitable support.",
      nextStep: "Discuss student support with PHANYX",
    },
  },
  "pt-PT": {
    school: {
      title: "Software de Gestão Escolar para Instituições | PHANYX",
      description: "Organize matrículas, turmas, registos académicos, finanças e áreas de acesso por perfil numa plataforma de gestão escolar.",
      heading: "Gestão escolar ligada à rotina da instituição", intro: "Reúna matrículas, cursos, turmas, docentes e finanças institucionais. A equipa administrativa acompanha a operação enquanto docentes e estudantes usam áreas próprias.",
      benefitsHeading: "O que pode organizar", benefits: [
        { title: "Matrículas e estrutura académica", detail: "Organize cursos, períodos, disciplinas, turmas e registos de matrícula." },
        { title: "Áreas por perfil", detail: "Administração, docentes e estudantes acedem às funções adequadas ao seu papel." },
        { title: "Documentos e finanças", detail: "Associe documentos e acompanhamento financeiro à atividade académica." },
      ],
      workflowHeading: "Como começar", workflow: ["Configure a instituição, os polos e as permissões.", "Registe cursos, turmas e estudantes.", "Convide docentes e estudantes e acompanhe os resultados."],
      question: "A plataforma serve instituições com vários polos?", answer: "Sim. O número de polos incluídos e o custo de polos adicionais dependem do plano e da proposta comercial.",
      nextStep: "Compare os planos e estime o valor em euros",
    },
    lms: {
      title: "Plataforma de Ensino Online com Gestão Académica | PHANYX",
      description: "Aulas, materiais, provas online e progresso dos estudantes ligados a turmas, matrículas e administração académica.",
      heading: "Ensino online ligado à gestão académica", intro: "A atividade pedagógica funciona melhor quando aulas e registos institucionais partilham um percurso. O PHANYX liga materiais, avaliações e área do estudante à gestão académica.",
      benefitsHeading: "Ferramentas para ensinar", benefits: [
        { title: "Aulas e materiais", detail: "Organize recursos por curso e turma para facilitar o estudo." },
        { title: "Avaliações", detail: "Use provas online com correção automática no plano que inclui essa função." },
        { title: "Progresso e registos", detail: "Acompanhe a aprendizagem juntamente com matrícula e documentação académica." },
      ],
      workflowHeading: "Da configuração ao acesso", workflow: ["Prepare cursos e turmas.", "Adicione aulas, recursos e avaliações.", "Abra as áreas de docentes e estudantes e acompanhe o progresso."],
      question: "O LMS está incluído em todos os planos?", answer: "O Essencial oferece uma base de ensino. O Profissional inclui o LMS completo e provas online; consulte o comparativo antes de escolher.",
      nextStep: "Veja os planos de ensino online em euros",
    },
    success: {
      title: "Acompanhamento do Sucesso dos Estudantes | PHANYX",
      description: "Acompanhe indicadores académicos, identifique estudantes que precisam de atenção e organize intervenções e retornos.",
      heading: "Transforme sinais académicos em apoio atempado", intro: "O sucesso dos estudantes exige contexto e acompanhamento. O PHANYX apresenta indicadores às equipas autorizadas para orientar prioridades, registar intervenções e planear o próximo contacto.",
      benefitsHeading: "Uma rotina de apoio mais clara", benefits: [
        { title: "Identifique prioridades", detail: "Analise presença, notas e atividades em atraso com o contexto disponível." },
        { title: "Registe intervenções", detail: "Documente ações de apoio, responsáveis, estado e próxima etapa." },
        { title: "Acompanhe retornos", detail: "Reveja os casos e ajuste o apoio conforme os resultados." },
      ],
      workflowHeading: "Ciclo de acompanhamento", workflow: ["Reveja indicadores e cobertura dos dados.", "Priorize casos para análise humana.", "Registe a intervenção e marque o retorno."],
      question: "Um indicador decide automaticamente pelo estudante?", answer: "Não. Os indicadores ajudam a equipa a decidir que casos rever; a instituição avalia cada situação e escolhe o apoio adequado.",
      nextStep: "Fale com o PHANYX sobre acompanhamento",
    },
  },
  "es-ES": {
    school: {
      title: "Software de Gestión Escolar para Centros Educativos | PHANYX",
      description: "Gestiona matrículas, cursos, grupos, expedientes, finanzas y portales por perfil con PHANYX.",
      heading: "Gestión escolar conectada con el trabajo diario", intro: "Unifica matrículas, cursos, grupos, personal y finanzas institucionales. Administración, docentes y estudiantes disponen de espacios adaptados a sus funciones.",
      benefitsHeading: "Organiza tu centro", benefits: [
        { title: "Estructura académica", detail: "Gestiona asignaturas, periodos, grupos y matrículas desde un mismo entorno." },
        { title: "Acceso por perfil", detail: "Cada equipo utiliza su portal con los permisos correspondientes." },
        { title: "Documentos y finanzas", detail: "Relaciona documentos y seguimiento financiero con la actividad académica." },
      ],
      workflowHeading: "Puesta en marcha", workflow: ["Configura el centro, sus sedes y permisos.", "Registra cursos, grupos y estudiantes.", "Invita a docentes y estudiantes y revisa el funcionamiento."],
      question: "¿Se pueden gestionar varias sedes?", answer: "PHANYX admite unidades institucionales. Las sedes incluidas y las tarifas de sedes adicionales dependen del plan elegido.",
      nextStep: "Compara planes y calcula el precio en euros",
    },
    lms: {
      title: "Plataforma de Educación Online y Gestión Académica | PHANYX",
      description: "Materiales, clases, exámenes online y seguimiento del aprendizaje vinculados a cursos y matrículas.",
      heading: "Enseñanza online integrada en la gestión académica", intro: "Conecta contenidos y evaluación con las operaciones del centro. PHANYX reúne recursos de aprendizaje, exámenes y acceso del estudiante con la administración académica.",
      benefitsHeading: "Herramientas docentes", benefits: [
        { title: "Clases y recursos", detail: "Organiza materiales por curso y grupo para que el estudiante encuentre su trabajo." },
        { title: "Evaluaciones", detail: "Realiza exámenes online con corrección automática en el plan correspondiente." },
        { title: "Seguimiento", detail: "Revisa el progreso junto con matrículas y documentación académica." },
      ],
      workflowHeading: "Del curso al aula virtual", workflow: ["Prepara cursos y grupos.", "Añade materiales y evaluaciones.", "Activa los portales de docentes y estudiantes y revisa el progreso."],
      question: "¿Todos los planes incluyen el LMS completo?", answer: "El plan Esencial aporta una base; el Profesional incluye el LMS completo y exámenes online. Consulta el comparador de planes.",
      nextStep: "Consulta las funciones y los precios en euros",
    },
    success: {
      title: "Seguimiento de Estudiantes e Intervenciones | PHANYX",
      description: "Identifica estudiantes que necesitan apoyo mediante indicadores académicos y organiza intervenciones y seguimiento.",
      heading: "Del indicador académico al apoyo al estudiante", intro: "Para apoyar a cada estudiante hay que reunir información y actuar a tiempo. PHANYX ayuda a los equipos autorizados a revisar prioridades, registrar intervenciones y programar el siguiente contacto.",
      benefitsHeading: "Un proceso de apoyo", benefits: [
        { title: "Revisa prioridades", detail: "Consulta asistencia, notas y tareas pendientes con el contexto disponible." },
        { title: "Documenta acciones", detail: "Registra intervenciones, responsables, estado y siguiente paso." },
        { title: "Haz seguimiento", detail: "Vuelve a revisar el caso y ajusta el plan de apoyo." },
      ],
      workflowHeading: "Ciclo de intervención", workflow: ["Revisa indicadores y calidad de datos.", "Selecciona casos para valoración humana.", "Registra la intervención y agenda el seguimiento."],
      question: "¿El sistema decide automáticamente por el estudiante?", answer: "No. Los indicadores orientan la revisión; el centro valora cada caso y decide qué apoyo ofrecer.",
      nextStep: "Habla con PHANYX sobre seguimiento",
    },
  },
  "fr-FR": {
    school: {
      title: "Logiciel de Gestion Scolaire pour Établissements | PHANYX",
      description: "Gérez inscriptions, cours, classes, dossiers, finances et espaces par rôle avec PHANYX.",
      heading: "Une gestion scolaire liée au quotidien de l'établissement", intro: "Réunissez inscriptions, formations, classes, personnel et finances. L'administration dispose d'une vue d'ensemble tandis que les enseignants et étudiants accèdent à leurs espaces.",
      benefitsHeading: "Organisez les opérations", benefits: [
        { title: "Structure académique", detail: "Gérez matières, périodes, classes et inscriptions au même endroit." },
        { title: "Espaces par rôle", detail: "Chaque équipe dispose d'un accès adapté à ses responsabilités." },
        { title: "Documents et finances", detail: "Reliez les documents et le suivi financier aux activités académiques." },
      ],
      workflowHeading: "Mettre en place PHANYX", workflow: ["Configurez l'établissement, ses sites et les autorisations.", "Enregistrez formations, classes et étudiants.", "Invitez enseignants et étudiants, puis suivez les opérations."],
      question: "Peut-on gérer plusieurs sites ?", answer: "PHANYX prend en charge les unités institutionnelles. Le nombre de sites inclus et les frais supplémentaires dépendent de l'offre.",
      nextStep: "Comparer les offres et estimer le montant en euros",
    },
    lms: {
      title: "Plateforme d'Enseignement en Ligne et Gestion Académique | PHANYX",
      description: "Cours, ressources, examens en ligne et progression des étudiants reliés aux inscriptions et à l'administration.",
      heading: "L'enseignement en ligne relié à la gestion académique", intro: "Rapprochez les activités pédagogiques et les dossiers institutionnels. PHANYX relie les ressources, évaluations et espaces étudiants à la gestion des formations.",
      benefitsHeading: "Enseigner dans un même cadre", benefits: [
        { title: "Cours et ressources", detail: "Classez les contenus par formation et classe pour faciliter l'accès des étudiants." },
        { title: "Évaluations", detail: "Utilisez des examens en ligne corrigés automatiquement selon l'offre choisie." },
        { title: "Progression", detail: "Suivez l'apprentissage avec les inscriptions et les documents académiques." },
      ],
      workflowHeading: "Du programme à l'espace étudiant", workflow: ["Créez les formations et les classes.", "Ajoutez cours, supports et évaluations.", "Ouvrez les espaces enseignants et étudiants et suivez la progression."],
      question: "Le LMS complet est-il inclus dans chaque offre ?", answer: "L'offre Essentiel fournit une base pédagogique. Professionnel inclut le LMS complet et les examens en ligne ; consultez le comparatif.",
      nextStep: "Voir les fonctions et les prix en euros",
    },
    success: {
      title: "Suivi de la Réussite Étudiante et Interventions | PHANYX",
      description: "Repérez les étudiants qui ont besoin d'attention et organisez les interventions et les suivis académiques.",
      heading: "Transformer les signaux académiques en accompagnement", intro: "Le suivi étudiant exige une lecture du contexte et des actions humaines. PHANYX aide les équipes autorisées à revoir les priorités, documenter les interventions et planifier le prochain échange.",
      benefitsHeading: "Une démarche de soutien", benefits: [
        { title: "Repérer les besoins", detail: "Consultez présence, résultats et activités en retard selon les données disponibles." },
        { title: "Préparer les interventions", detail: "Notez les actions, responsables, statuts et prochaines étapes." },
        { title: "Assurer le suivi", detail: "Réexaminez les situations et adaptez le soutien proposé." },
      ],
      workflowHeading: "Cycle d'accompagnement", workflow: ["Examinez les indicateurs et la couverture des données.", "Sélectionnez les situations à étudier par une personne.", "Documentez l'intervention et fixez un suivi."],
      question: "Un indicateur décide-t-il à la place de l'équipe ?", answer: "Non. Les indicateurs guident l'examen ; l'établissement évalue chaque situation et choisit le soutien approprié.",
      nextStep: "Échanger avec PHANYX sur le suivi étudiant",
    },
  },
};
