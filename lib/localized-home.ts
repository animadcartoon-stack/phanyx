import type { ForeignLocale } from "@/lib/localized-plans";

type HomeCopy = {
  kicker: string; lead: string; accent: string; intro: string;
  theologyLead: string; theologyLink: string; theologyEnd: string;
  portals: [string, string, string]; blog: string; trust: { title: string; description: string }[];
  modulesKicker: string; modulesTitle: string; modulesDescription: string;
  modules: { title: string; description: string; emoji: string }[];
  differenceKicker: string; differenceTitle: string; differenceDescription: string; differences: string[];
  securityKicker: string; securityTitle: string; securityDescription: string;
  security: { title: string; description: string }[];
  ecosystemKicker: string; ecosystemTitle: string; ecosystemDescription: string;
  faqsKicker: string; faqsTitle: string; faqs: { question: string; answer: string }[];
  ctaKicker: string; ctaTitle: string; ctaDescription: string;
};

export const localizedHome: Record<ForeignLocale, HomeCopy> = {
  "en-US": {
    kicker: "Multi-institution academic SaaS platform", lead: "PHANYX for school management, academic management and online learning", accent: "more institutional control, a modern experience and a scalable SaaS foundation",
    intro: "Organize your institution with a modern platform for universities, colleges, technical schools, independent courses and distance education. PHANYX unites academic management, LMS, finance, documents and institutional security.",
    theologyLead: "Interested in theological education? Discover our", theologyLink: "online theology course", theologyEnd: "and enroll online.",
    portals: ["Student portal", "Teacher portal", "Administration"], blog: "School management software",
    trust: [{ title: "Multiple institutions", description: "Separate data for each institution." }, { title: "LMS + management", description: "Academics, digital learning, documents and finance in one system." }, { title: "Security", description: "Auditing, verification and fraud prevention." }],
    modulesKicker: "Platform for educational institutions", modulesTitle: "A complete system for operations and growth", modulesDescription: "PHANYX brings together the essentials of a modern education operation in one SaaS platform.",
    modules: [
      { title: "Academic management", description: "Manage courses, subjects, classes, enrollments, students and teachers.", emoji: "🎓" },
      { title: "LMS / online learning", description: "Lessons, materials, progress and online assessments.", emoji: "💻" },
      { title: "Institutional finance", description: "Payments, transactions and financial oversight.", emoji: "💰" },
      { title: "Verified documents", description: "Generate certificates and documents with QR codes and public verification.", emoji: "📄" },
      { title: "Security and fraud prevention", description: "Audit trails, validation and access controls.", emoji: "🛡️" },
      { title: "SaaS architecture", description: "Separate institutional data with room to grow.", emoji: "🏢" },
    ],
    differenceKicker: "WHY PHANYX", differenceTitle: "A platform for schools, colleges, universities and growing institutions", differenceDescription: "Manage academic processes and build a stronger digital experience for your community.",
    differences: ["Multi-institution data separation", "Dedicated experiences for administration, teachers and students", "Ready for universities, technical schools and online education", "Document verification built in", "Support for institutional growth", "Security for academic and administrative operations"],
    securityKicker: "INSTITUTIONAL SECURITY", securityTitle: "More confidence in documents, access and sensitive operations", securityDescription: "Verification and auditability help institutions understand important actions and reduce operational risk.",
    security: [{ title: "QR codes", description: "Public document verification." }, { title: "Audit", description: "Records of important actions." }, { title: "Risk insights", description: "Additional visibility into suspicious behavior." }, { title: "Access controls", description: "Tools to contain unauthorized activity." }],
    ecosystemKicker: "PHANYX ECOSYSTEM", ecosystemTitle: "One platform for growing institutions", ecosystemDescription: "From enrollment to documents, PHANYX connects academic, administrative and financial work.",
    faqsKicker: "FREQUENT QUESTIONS", faqsTitle: "What institutions should know about PHANYX", faqs: [
      { question: "Can PHANYX serve more than one institution?", answer: "Yes. It is built for multiple institutions with separate data and scalable organization." },
      { question: "Are there separate student, teacher and admin areas?", answer: "Yes. Each role has its own experience and access controls." },
      { question: "Does it support on-campus and online teaching?", answer: "Yes. Academic operations work alongside lessons, materials, progress and assessments." },
      { question: "Can we see pricing?", answer: "Yes. Review the plans and estimate Brazilian pricing. Local commercial terms are confirmed in a proposal." },
    ],
    ctaKicker: "READY TO GROW", ctaTitle: "Move your institution to a stronger academic platform", ctaDescription: "Combine a modern experience, institutional operations and commercial growth in one SaaS platform.",
  },
  "es-ES": {
    kicker: "Plataforma académica SaaS para varias instituciones", lead: "PHANYX para gestión escolar, gestión académica y enseñanza virtual", accent: "más control institucional y una experiencia moderna",
    intro: "Organiza tu institución con una plataforma para universidades, facultades, escuelas técnicas, cursos y educación a distancia. PHANYX reúne gestión académica, LMS, finanzas, documentos y seguridad.",
    theologyLead: "¿Te interesa la formación teológica? Conoce nuestro", theologyLink: "curso de teología en línea", theologyEnd: "e inscríbete.", portals: ["Área del estudiante", "Área docente", "Administración"], blog: "Software de gestión escolar",
    trust: [{ title: "Varias instituciones", description: "Datos separados por institución." }, { title: "LMS + gestión", description: "Educación, documentos y finanzas en un sistema." }, { title: "Seguridad", description: "Auditoría, validación y prevención del fraude." }],
    modulesKicker: "Plataforma para instituciones educativas", modulesTitle: "Un sistema completo para operar y crecer", modulesDescription: "PHANYX reúne los pilares de una operación educativa moderna.",
    modules: [{ title: "Gestión académica", description: "Cursos, asignaturas, grupos, matrículas, estudiantes y docentes.", emoji: "🎓" }, { title: "LMS / enseñanza virtual", description: "Clases, materiales, progreso y evaluaciones en línea.", emoji: "💻" }, { title: "Finanzas institucionales", description: "Pagos, movimientos y control financiero.", emoji: "💰" }, { title: "Documentos validados", description: "Certificados y documentos con código QR.", emoji: "📄" }, { title: "Seguridad", description: "Auditoría, validación y control de acceso.", emoji: "🛡️" }, { title: "Arquitectura SaaS", description: "Datos separados por institución.", emoji: "🏢" }],
    differenceKicker: "DIFERENCIALES", differenceTitle: "Una plataforma para escuelas, facultades y universidades", differenceDescription: "Organiza procesos académicos y ofrece una mejor experiencia digital.", differences: ["Datos separados por institución", "Áreas para administración, docentes y estudiantes", "Preparada para enseñanza presencial y virtual", "Validación documental integrada", "Preparada para crecer", "Seguridad de las operaciones"],
    securityKicker: "SEGURIDAD INSTITUCIONAL", securityTitle: "Más confianza para documentos y accesos", securityDescription: "La validación y la auditoría ayudan a reducir riesgos.", security: [{ title: "Código QR", description: "Validación pública de documentos." }, { title: "Auditoría", description: "Registro de acciones importantes." }, { title: "Riesgo", description: "Indicadores de actividad sospechosa." }, { title: "Control de acceso", description: "Herramientas de seguridad." }],
    ecosystemKicker: "ECOSISTEMA PHANYX", ecosystemTitle: "Una plataforma para instituciones en crecimiento", ecosystemDescription: "Desde las matrículas hasta los documentos, conecta operaciones académicas, administrativas y financieras.",
    faqsKicker: "PREGUNTAS FRECUENTES", faqsTitle: "Lo que debes saber sobre PHANYX", faqs: [{ question: "¿Admite varias instituciones?", answer: "Sí. Los datos de cada institución se mantienen separados." }, { question: "¿Hay áreas independientes?", answer: "Sí, para estudiantes, docentes y administración." }, { question: "¿Funciona para enseñanza presencial y virtual?", answer: "Sí. Combina la gestión académica con un LMS." }, { question: "¿Puedo consultar precios?", answer: "Sí. Consulta los planes y solicita una propuesta para tu país." }],
    ctaKicker: "LISTO PARA CRECER", ctaTitle: "Lleva tu institución a una plataforma académica más completa", ctaDescription: "Gestión moderna, operaciones institucionales y crecimiento comercial en una sola plataforma.",
  },
  "fr-FR": {
    kicker: "Plateforme académique SaaS multi-établissements", lead: "PHANYX pour la gestion scolaire, académique et l'enseignement en ligne", accent: "plus de contrôle et une expérience moderne",
    intro: "Organisez votre établissement avec une plateforme pour universités, écoles, formations et enseignement à distance. PHANYX réunit gestion académique, LMS, finances, documents et sécurité.",
    theologyLead: "Vous cherchez une formation théologique ? Découvrez notre", theologyLink: "cours de théologie en ligne", theologyEnd: "et inscrivez-vous.", portals: ["Espace étudiant", "Espace enseignant", "Administration"], blog: "Logiciel de gestion scolaire",
    trust: [{ title: "Plusieurs établissements", description: "Données séparées par établissement." }, { title: "LMS + gestion", description: "Enseignement, documents et finances réunis." }, { title: "Sécurité", description: "Audit, validation et prévention de la fraude." }],
    modulesKicker: "Plateforme pour l'enseignement", modulesTitle: "Un système complet pour les opérations et la croissance", modulesDescription: "PHANYX réunit les éléments essentiels de l'éducation moderne.",
    modules: [{ title: "Gestion académique", description: "Cours, matières, classes, inscriptions, étudiants et enseignants.", emoji: "🎓" }, { title: "LMS / enseignement en ligne", description: "Cours, ressources, progression et évaluations.", emoji: "💻" }, { title: "Finances", description: "Paiements, mouvements et suivi financier.", emoji: "💰" }, { title: "Documents vérifiés", description: "Certificats et documents avec QR code.", emoji: "📄" }, { title: "Sécurité", description: "Audit, validation et contrôle des accès.", emoji: "🛡️" }, { title: "Architecture SaaS", description: "Données séparées par établissement.", emoji: "🏢" }],
    differenceKicker: "ATOUTS", differenceTitle: "Une plateforme pour écoles, universités et établissements en croissance", differenceDescription: "Organisez les processus académiques et améliorez l'expérience numérique.", differences: ["Séparation des données", "Espaces pour l'administration, les enseignants et les étudiants", "Enseignement en présentiel et à distance", "Vérification des documents", "Architecture évolutive", "Sécurité des opérations"],
    securityKicker: "SÉCURITÉ INSTITUTIONNELLE", securityTitle: "Plus de confiance dans les documents et les accès", securityDescription: "La validation et l'audit permettent de réduire les risques.", security: [{ title: "QR code", description: "Vérification publique." }, { title: "Audit", description: "Historique des actions importantes." }, { title: "Risques", description: "Détection d'activités suspectes." }, { title: "Accès", description: "Contrôles de sécurité." }],
    ecosystemKicker: "ÉCOSYSTÈME PHANYX", ecosystemTitle: "Une plateforme pour les établissements en croissance", ecosystemDescription: "Des inscriptions aux documents, PHANYX connecte les activités académiques, administratives et financières.",
    faqsKicker: "QUESTIONS FRÉQUENTES", faqsTitle: "Ce qu'il faut savoir sur PHANYX", faqs: [{ question: "Plusieurs établissements peuvent-ils l'utiliser ?", answer: "Oui. Les données de chaque établissement sont séparées." }, { question: "Existe-t-il plusieurs espaces ?", answer: "Oui, pour étudiants, enseignants et administration." }, { question: "Présentiel et enseignement en ligne ?", answer: "Oui. La gestion académique fonctionne avec le LMS." }, { question: "Comment voir les prix ?", answer: "Consultez les offres et demandez une proposition pour votre pays." }],
    ctaKicker: "PRÊT À GRANDIR", ctaTitle: "Passez à une plateforme académique plus complète", ctaDescription: "Une expérience moderne, des opérations institutionnelles et une croissance commerciale.",
  },
  "pt-PT": {
    kicker: "Plataforma académica SaaS multi-instituição", lead: "PHANYX para gestão escolar, gestão académica e ensino online", accent: "mais controlo institucional e uma experiência moderna",
    intro: "Organize a sua instituição com uma plataforma para universidades, faculdades, escolas técnicas, cursos e ensino à distância. O PHANYX une gestão académica, LMS, finanças, documentos e segurança.",
    theologyLead: "Quer começar a sua formação teológica? Conheça o nosso", theologyLink: "curso de teologia online", theologyEnd: "e inscreva-se.", portals: ["Área do estudante", "Área do docente", "Administração"], blog: "Software de gestão escolar",
    trust: [{ title: "Várias instituições", description: "Dados separados por instituição." }, { title: "LMS + gestão", description: "Ensino digital, documentos e finanças num sistema." }, { title: "Segurança", description: "Auditoria, validação e prevenção de fraude." }],
    modulesKicker: "Plataforma para instituições de ensino", modulesTitle: "Um sistema completo para operar e crescer", modulesDescription: "O PHANYX reúne os pilares de uma operação educativa moderna.",
    modules: [{ title: "Gestão académica", description: "Cursos, disciplinas, turmas, matrículas, estudantes e docentes.", emoji: "🎓" }, { title: "LMS / ensino online", description: "Aulas, materiais, progresso e avaliações.", emoji: "💻" }, { title: "Finanças institucionais", description: "Pagamentos, lançamentos e controlo financeiro.", emoji: "💰" }, { title: "Documentos validados", description: "Certificados e documentos com QR Code.", emoji: "📄" }, { title: "Segurança", description: "Auditoria, validação e controlo de acessos.", emoji: "🛡️" }, { title: "Arquitetura SaaS", description: "Dados separados por instituição.", emoji: "🏢" }],
    differenceKicker: "DIFERENCIAIS", differenceTitle: "Uma plataforma para escolas, faculdades e universidades", differenceDescription: "Organize os processos académicos e ofereça uma experiência digital melhor.", differences: ["Dados separados por instituição", "Áreas para administração, docentes e estudantes", "Ensino presencial e online", "Validação de documentos integrada", "Preparada para crescer", "Segurança das operações"],
    securityKicker: "SEGURANÇA INSTITUCIONAL", securityTitle: "Mais confiança nos documentos e acessos", securityDescription: "A validação e a auditoria ajudam a reduzir riscos.", security: [{ title: "QR Code", description: "Validação pública de documentos." }, { title: "Auditoria", description: "Registo das ações importantes." }, { title: "Risco", description: "Leitura de comportamentos suspeitos." }, { title: "Acessos", description: "Ferramentas de segurança." }],
    ecosystemKicker: "ECOSSISTEMA PHANYX", ecosystemTitle: "Uma plataforma para instituições em crescimento", ecosystemDescription: "Da matrícula aos documentos, o PHANYX liga operações académicas, administrativas e financeiras.",
    faqsKicker: "PERGUNTAS FREQUENTES", faqsTitle: "O que importa saber sobre o PHANYX", faqs: [{ question: "O PHANYX serve várias instituições?", answer: "Sim. Os dados de cada instituição são separados." }, { question: "Há áreas independentes?", answer: "Sim, para estudantes, docentes e administração." }, { question: "Funciona para ensino presencial e online?", answer: "Sim. A gestão académica integra-se com o LMS." }, { question: "Posso consultar os preços?", answer: "Sim. Consulte os planos e peça uma proposta para Portugal." }],
    ctaKicker: "PRONTO PARA CRESCER", ctaTitle: "Leve a sua instituição para uma plataforma académica mais forte", ctaDescription: "Experiência moderna, operações institucionais e crescimento comercial numa só plataforma.",
  },
};
