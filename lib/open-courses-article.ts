import type { LocalePhanyx } from "@/i18n/config";

export const openCoursesArticleSlugs = {
  "pt-BR": "plataforma-ead-para-cursos-livres",
  "pt-PT": "plataforma-ead-para-cursos-livres",
  "en-US": "online-learning-platform-for-open-courses",
  "es-ES": "plataforma-online-para-cursos-libres",
  "fr-FR": "plateforme-e-learning-pour-cours-libres",
} as const satisfies Record<LocalePhanyx, string>;

export const openCoursesArticleLocales: LocalePhanyx[] = [
  "pt-BR",
  "pt-PT",
  "en-US",
  "es-ES",
  "fr-FR",
];

export const openCoursesArticleImages: Record<LocalePhanyx, string> = {
  "pt-BR": "/images/blog/open-courses/pt-BR.webp",
  "pt-PT": "/images/blog/open-courses/pt-PT.webp",
  "en-US": "/images/blog/open-courses/en-US.webp",
  "es-ES": "/images/blog/open-courses/es-ES.webp",
  "fr-FR": "/images/blog/open-courses/fr-FR.webp",
};

export function openCoursesArticlePath(locale: LocalePhanyx) {
  return locale === "pt-BR"
    ? `/blog/${openCoursesArticleSlugs[locale]}`
    : `/${locale}/blog/${openCoursesArticleSlugs[locale]}`;
}

export function openCoursesArticleAlternates() {
  return {
    languages: {
      ...Object.fromEntries(
        openCoursesArticleLocales.map((locale) => [
          locale,
          openCoursesArticlePath(locale),
        ]),
      ),
      "x-default": openCoursesArticlePath("en-US"),
    },
  };
}

type Feature = {
  title: string;
  description: string;
};

type OpenCoursesCopy = {
  title: string;
  description: string;
  kicker: string;
  heading: string;
  intro: string;
  imageAlt: string;
  imageCaption: string;
  whatHeading: string;
  whatText: string;
  featuresHeading: string;
  features: Feature[];
  integratedHeading: string;
  integratedText: string;
  phanyxHeading: string;
  phanyxText: string;
  cta: string;
  languagesLabel: string;
  footerTagline: string;
  footerExplore: string;
  footerPlatform: string;
  footerPlans: string;
  footerBlog: string;
  footerRights: string;
};

export const openCoursesArticleCopy: Record<LocalePhanyx, OpenCoursesCopy> = {
  "pt-BR": {
    title: "Plataforma EAD para cursos livres | PHANYX",
    description:
      "Veja como organizar cursos livres e profissionalizantes com uma plataforma EAD integrada a aulas, alunos, avaliações, certificados e relatórios.",
    kicker: "Ensino digital",
    heading: "Plataforma EAD para cursos livres",
    intro:
      "Cursos livres e profissionalizantes exigem organização de aulas, alunos, avaliações, certificados e acompanhamento. Uma plataforma integrada ajuda a manter toda a operação no mesmo ambiente.",
    imageAlt:
      "Plataforma EAD PHANYX para cursos livres com aulas, alunos, avaliações, certificados, relatórios, matrículas e conteúdos.",
    imageCaption:
      "Visão ilustrativa de uma operação de cursos livres organizada numa plataforma EAD.",
    whatHeading: "O que é uma plataforma EAD para cursos livres",
    whatText:
      "É uma solução para criar e organizar cursos online, publicar conteúdos, acompanhar alunos, aplicar avaliações, emitir certificados e manter informações de progresso em um fluxo único.",
    featuresHeading: "Recursos essenciais",
    features: [
      { title: "Aulas e conteúdos", description: "Organize materiais, aulas e conteúdos digitais de cada curso." },
      { title: "Alunos e matrículas", description: "Acompanhe inscrições, vínculos e acesso dos participantes." },
      { title: "Atividades e avaliações", description: "Estruture tarefas e avaliações dentro da jornada de aprendizagem." },
      { title: "Certificados", description: "Relacione a conclusão do curso à emissão dos documentos configurados pela instituição." },
      { title: "Relatórios de progresso", description: "Acompanhe evolução, participação e andamento dos cursos." },
    ],
    integratedHeading: "Por que usar uma plataforma integrada",
    integratedText:
      "Quando gestão acadêmica, financeiro, documentos e ensino digital trabalham no mesmo ecossistema, a instituição reduz cadastros duplicados, planilhas paralelas e retrabalho entre setores.",
    phanyxHeading: "PHANYX para cursos livres e profissionalizantes",
    phanyxText:
      "O PHANYX reúne gestão acadêmica, ensino digital, financeiro, documentos e outros processos institucionais. Para avaliar a plataforma, percorra o fluxo real do seu curso, desde a inscrição até a conclusão.",
    cta: "Conheça a plataforma EAD do PHANYX",
    languagesLabel: "Leia esta página em outro idioma",
    footerTagline: "Gestão acadêmica, ensino digital e operação institucional em uma única plataforma.",
    footerExplore: "Explore",
    footerPlatform: "Plataforma EAD",
    footerPlans: "Planos",
    footerBlog: "Blog",
    footerRights: "Todos os direitos reservados.",
  },
  "pt-PT": {
    title: "Plataforma EAD para cursos livres | PHANYX",
    description:
      "Veja como organizar cursos livres e profissionais com uma plataforma EAD integrada a aulas, estudantes, avaliações, certificados e relatórios.",
    kicker: "Ensino digital",
    heading: "Plataforma EAD para cursos livres",
    intro:
      "Cursos livres e profissionais exigem organização de aulas, estudantes, avaliações, certificados e acompanhamento. Uma plataforma integrada ajuda a manter toda a operação no mesmo ambiente.",
    imageAlt:
      "Plataforma EAD PHANYX para cursos livres com aulas, alunos, avaliações, certificados, relatórios, inscrições e conteúdos.",
    imageCaption:
      "Visão ilustrativa de uma operação de cursos livres organizada numa plataforma EAD.",
    whatHeading: "O que é uma plataforma EAD para cursos livres",
    whatText:
      "É uma solução para criar e organizar cursos online, publicar conteúdos, acompanhar estudantes, aplicar avaliações, emitir certificados e manter informação de progresso num único fluxo.",
    featuresHeading: "Recursos essenciais",
    features: [
      { title: "Aulas e conteúdos", description: "Organize materiais, aulas e conteúdos digitais de cada curso." },
      { title: "Estudantes e inscrições", description: "Acompanhe inscrições, vínculos e acesso dos participantes." },
      { title: "Atividades e avaliações", description: "Estruture tarefas e avaliações ao longo da aprendizagem." },
      { title: "Certificados", description: "Associe a conclusão do curso à emissão dos documentos configurados pela instituição." },
      { title: "Relatórios de progresso", description: "Acompanhe evolução, participação e andamento dos cursos." },
    ],
    integratedHeading: "Porquê utilizar uma plataforma integrada",
    integratedText:
      "Quando gestão académica, financeiro, documentos e ensino digital trabalham no mesmo ecossistema, a instituição reduz registos duplicados, folhas de cálculo paralelas e retrabalho entre equipas.",
    phanyxHeading: "PHANYX para cursos livres e profissionais",
    phanyxText:
      "O PHANYX reúne gestão académica, ensino digital, financeiro, documentos e outros processos institucionais. Para avaliar a plataforma, percorra o fluxo real do seu curso, desde a inscrição até à conclusão.",
    cta: "Conhecer a plataforma EAD do PHANYX",
    languagesLabel: "Ler esta página noutro idioma",
    footerTagline: "Gestão académica, ensino digital e operação institucional numa única plataforma.",
    footerExplore: "Explorar",
    footerPlatform: "Plataforma EAD",
    footerPlans: "Planos",
    footerBlog: "Blog",
    footerRights: "Todos os direitos reservados.",
  },
  "en-US": {
    title: "Online Learning Platform for Open Courses | PHANYX",
    description:
      "Learn how to organize open and professional courses with an online learning platform for lessons, students, assessments, certificates and progress reports.",
    kicker: "Digital learning",
    heading: "Online learning platform for open courses",
    intro:
      "Open and professional courses need organized lessons, students, assessments, certificates and progress tracking. An integrated platform keeps the operation together in one environment.",
    imageAlt:
      "PHANYX online learning platform for open courses with lessons, students, assessments, certificates, reports, enrollments and content.",
    imageCaption:
      "Illustrative view of an open-course operation organized in an online learning platform.",
    whatHeading: "What is an online learning platform for open courses?",
    whatText:
      "It is a solution for creating and organizing online courses, publishing content, managing students, running assessments, issuing certificates and tracking learning progress in one workflow.",
    featuresHeading: "Essential capabilities",
    features: [
      { title: "Lessons and content", description: "Organize course materials, lessons and digital content." },
      { title: "Students and enrollments", description: "Track registrations, course access and participant records." },
      { title: "Activities and assessments", description: "Structure assignments and assessments throughout the learning journey." },
      { title: "Certificates", description: "Connect course completion to the institution's configured certificate workflow." },
      { title: "Progress reports", description: "Monitor participation, progress and course completion." },
    ],
    integratedHeading: "Why use an integrated platform",
    integratedText:
      "When academic management, finance, documents and digital learning operate in the same ecosystem, the institution can reduce duplicate records, parallel spreadsheets and manual rework.",
    phanyxHeading: "PHANYX for open and professional courses",
    phanyxText:
      "PHANYX brings academic management, digital learning, finance, documents and other institutional processes together. Evaluate it by walking through the real journey of your course, from enrollment to completion.",
    cta: "Explore the PHANYX learning platform",
    languagesLabel: "Read this page in another language",
    footerTagline: "Academic management, digital learning and institutional operations in one platform.",
    footerExplore: "Explore",
    footerPlatform: "Learning platform",
    footerPlans: "Plans",
    footerBlog: "Blog",
    footerRights: "All rights reserved.",
  },
  "es-ES": {
    title: "Plataforma online para cursos libres | PHANYX",
    description:
      "Descubre cómo organizar cursos libres y profesionales con una plataforma online integrada para clases, alumnos, evaluaciones, certificados e informes.",
    kicker: "Enseñanza digital",
    heading: "Plataforma online para cursos libres",
    intro:
      "Los cursos libres y profesionales necesitan organizar clases, alumnado, evaluaciones, certificados y seguimiento. Una plataforma integrada permite mantener toda la operación en un mismo entorno.",
    imageAlt:
      "Plataforma online PHANYX para cursos libres con clases, alumnos, evaluaciones, certificados, informes, inscripciones y contenido.",
    imageCaption:
      "Vista ilustrativa de una operación de cursos libres organizada en una plataforma online.",
    whatHeading: "Qué es una plataforma online para cursos libres",
    whatText:
      "Es una solución para crear y organizar cursos online, publicar contenidos, gestionar alumnos, realizar evaluaciones, emitir certificados y seguir el progreso en un único flujo.",
    featuresHeading: "Recursos esenciales",
    features: [
      { title: "Clases y contenido", description: "Organiza materiales, clases y contenidos digitales de cada curso." },
      { title: "Alumnos e inscripciones", description: "Gestiona inscripciones, acceso y registros de participantes." },
      { title: "Actividades y evaluaciones", description: "Estructura tareas y evaluaciones durante el recorrido formativo." },
      { title: "Certificados", description: "Relaciona la finalización del curso con el flujo de certificados de la institución." },
      { title: "Informes de progreso", description: "Supervisa participación, progreso y finalización de los cursos." },
    ],
    integratedHeading: "Por qué utilizar una plataforma integrada",
    integratedText:
      "Cuando gestión académica, finanzas, documentos y enseñanza digital trabajan en el mismo ecosistema, la institución reduce registros duplicados, hojas de cálculo paralelas y trabajo manual.",
    phanyxHeading: "PHANYX para cursos libres y profesionales",
    phanyxText:
      "PHANYX reúne gestión académica, enseñanza digital, finanzas, documentos y otros procesos institucionales. Evalúa la plataforma siguiendo el recorrido real de tu curso, desde la inscripción hasta la finalización.",
    cta: "Conocer la plataforma educativa PHANYX",
    languagesLabel: "Leer esta página en otro idioma",
    footerTagline: "Gestión académica, enseñanza digital y operación institucional en una sola plataforma.",
    footerExplore: "Explorar",
    footerPlatform: "Plataforma educativa",
    footerPlans: "Planes",
    footerBlog: "Blog",
    footerRights: "Todos los derechos reservados.",
  },
  "fr-FR": {
    title: "Plateforme e-learning pour cours libres | PHANYX",
    description:
      "Découvrez comment organiser des cours libres et professionnels avec une plateforme e-learning intégrée pour les cours, apprenants, évaluations, certificats et rapports.",
    kicker: "Enseignement numérique",
    heading: "Plateforme e-learning pour cours libres",
    intro:
      "Les cours libres et professionnels nécessitent une organisation des cours, des apprenants, des évaluations, des certificats et du suivi. Une plateforme intégrée permet de réunir toute l'activité dans un même environnement.",
    imageAlt:
      "Plateforme e-learning PHANYX pour cours libres avec cours, apprenants, évaluations, certificats, rapports, inscriptions et contenus.",
    imageCaption:
      "Vue illustrative d'une activité de cours libres organisée sur une plateforme e-learning.",
    whatHeading: "Qu'est-ce qu'une plateforme e-learning pour cours libres ?",
    whatText:
      "C'est une solution pour créer et organiser des cours en ligne, publier des contenus, gérer les apprenants, proposer des évaluations, délivrer des certificats et suivre la progression dans un même flux.",
    featuresHeading: "Fonctionnalités essentielles",
    features: [
      { title: "Cours et contenus", description: "Organisez les supports, cours et contenus numériques de chaque formation." },
      { title: "Apprenants et inscriptions", description: "Suivez les inscriptions, les accès et les dossiers des participants." },
      { title: "Activités et évaluations", description: "Structurez les travaux et évaluations tout au long du parcours." },
      { title: "Certificats", description: "Reliez la fin du cours au processus de certification configuré par l'établissement." },
      { title: "Rapports de progression", description: "Suivez la participation, la progression et l'achèvement des cours." },
    ],
    integratedHeading: "Pourquoi utiliser une plateforme intégrée",
    integratedText:
      "Lorsque la gestion académique, les finances, les documents et l'enseignement numérique fonctionnent dans le même écosystème, l'établissement réduit les doublons, les tableurs parallèles et les ressaisies.",
    phanyxHeading: "PHANYX pour les cours libres et professionnels",
    phanyxText:
      "PHANYX réunit gestion académique, enseignement numérique, finances, documents et autres processus institutionnels. Évaluez la plateforme en parcourant le chemin réel de votre formation, de l'inscription à la fin du cours.",
    cta: "Découvrir la plateforme e-learning PHANYX",
    languagesLabel: "Lire cette page dans une autre langue",
    footerTagline: "Gestion académique, enseignement numérique et opérations institutionnelles sur une seule plateforme.",
    footerExplore: "Explorer",
    footerPlatform: "Plateforme e-learning",
    footerPlans: "Offres",
    footerBlog: "Blog",
    footerRights: "Tous droits réservés.",
  },
};
