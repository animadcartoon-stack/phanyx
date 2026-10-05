import type { LocalePhanyx } from "@/i18n/config";

export const schoolGuideSlugs = {
  "pt-BR": "sistema-gestao-escolar",
  "pt-PT": "como-escolher-software-gestao-escolar",
  "en-US": "how-to-choose-school-management-software",
  "es-ES": "como-elegir-software-gestion-escolar",
  "fr-FR": "choisir-logiciel-gestion-scolaire",
} as const satisfies Record<LocalePhanyx, string>;

export function schoolGuidePath(locale: LocalePhanyx) {
  return locale === "pt-BR"
    ? "/blog/sistema-gestao-escolar"
    : `/${locale}/blog/${schoolGuideSlugs[locale]}`;
}

export const schoolGuideLocales: LocalePhanyx[] = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"];

export function schoolGuideAlternates() {
  return {
    languages: {
      ...Object.fromEntries(schoolGuideLocales.map((locale) => [locale, schoolGuidePath(locale)])),
      "x-default": schoolGuidePath("en-US"),
    },
  };
}

type GuideCopy = {
  title: string;
  description: string;
  kicker: string;
  heading: string;
  intro: string;
  imageAlt: string;
  contents: string;
  criteriaLink: string;
  demoLink: string;
  phanyxLink: string;
  criteriaTitle: string;
  criteriaIntro: string;
  criteria: { title: string; detail: string }[];
  demoTitle: string;
  demoParagraphs: [string, string];
  phanyxTitle: string;
  phanyxText: string;
  schoolButton: string;
  plansButton: string;
  faqTitle: string;
  faqs: { question: string; answer: string }[];
  languagesLabel: string;
};

export const schoolGuideCopy: Record<Exclude<LocalePhanyx, "pt-BR">, GuideCopy> = {
  "pt-PT": {
    title: "Como escolher software de gestão escolar em 2026 | PHANYX",
    description: "Cinco critérios para comparar software de gestão escolar em Portugal: matrículas, avaliação, tesouraria, ensino digital e implementação.",
    kicker: "Guia de escolha",
    heading: "Como escolher software de gestão escolar para a sua instituição?",
    intro: "A melhor solução depende dos processos da escola, faculdade ou entidade de formação. Compare o percurso completo do estudante e o trabalho diário de docentes e serviços administrativos, em vez de contar funcionalidades numa lista.",
    imageAlt: "Docente acompanha estudantes numa atividade com computador na sala de aula",
    contents: "Neste guia",
    criteriaLink: "Cinco critérios de comparação",
    demoLink: "O que pedir numa demonstração",
    phanyxLink: "Como avaliar o PHANYX",
    criteriaTitle: "Cinco critérios para comparar plataformas",
    criteriaIntro: "Use os mesmos exemplos e as mesmas perguntas com todos os fornecedores.",
    criteria: [
      { title: "Matrículas e estrutura académica", detail: "Peça para inscrever um estudante fictício, associá-lo a um curso e turma, juntar documentos e consultar o seu percurso sem duplicar dados." },
      { title: "Assiduidade, avaliação e acompanhamento", detail: "Observe o registo de presenças e classificações por docentes e a consulta pelos estudantes. Verifique se a coordenação consegue identificar quem precisa de apoio." },
      { title: "Tesouraria e documentos", detail: "Percorra um cenário real de cobrança, pagamento e emissão de documentos. Confirme que permissões, integrações e modelos estão incluídos na proposta." },
      { title: "Ensino presencial, misto e à distância", detail: "Se oferece formação online, experimente aulas, materiais, atividades e avaliações. Pergunte como os resultados ficam ligados à gestão académica." },
      { title: "Acessos, migração e apoio", detail: "Teste os perfis de acesso e peça um plano de migração, formação e assistência. Confirme os prazos e as responsabilidades por escrito." },
    ],
    demoTitle: "O que pedir numa demonstração",
    demoParagraphs: [
      "Comece com um estudante fictício: inscrição, turma, presença, avaliação, documento e situação financeira. Repita tarefas com o perfil de docente e com o de estudante. Registe onde ainda são necessárias folhas de cálculo.",
      "Peça a lista dos módulos incluídos, condições de migração, prazo de implementação e custos totais. Assim compara propostas equivalentes.",
    ],
    phanyxTitle: "Avalie o PHANYX com este roteiro",
    phanyxText: "O PHANYX reúne matrículas, cursos e turmas, presenças, acompanhamento académico, finanças, documentos e ensino digital. Solicite uma demonstração dos processos da sua instituição e confirme os módulos e condições disponíveis para Portugal.",
    schoolButton: "Conhecer o software escolar",
    plansButton: "Comparar planos",
    faqTitle: "Perguntas frequentes",
    faqs: [
      { question: "Há um único melhor software para todas as escolas?", answer: "Não. A escolha depende da dimensão, das modalidades de ensino, do orçamento e da capacidade de implementação." },
      { question: "Como calcular o custo total?", answer: "Considere mensalidades, custos por estudante ou unidade, módulos adicionais, migração, formação e apoio. Solicite uma proposta em euros." },
    ],
    languagesLabel: "Ler este guia noutro idioma",
  },
  "en-US": {
    title: "How to Choose School Management Software in 2026 | PHANYX",
    description: "A practical guide to comparing school management software: enrollment, attendance, finance, digital learning, implementation and support.",
    kicker: "Buyer's guide",
    heading: "How do you choose school management software for your institution?",
    intro: "The right system depends on how your school, college, or online program operates. Compare the complete student journey and the daily work of teachers and administrators instead of selecting a product by its feature count.",
    imageAlt: "Teacher helps students work together on a computer in a classroom",
    contents: "In this guide",
    criteriaLink: "Five comparison criteria",
    demoLink: "What to ask in a demo",
    phanyxLink: "How to evaluate PHANYX",
    criteriaTitle: "Five criteria for comparing school management systems",
    criteriaIntro: "Bring the same test cases to each vendor demonstration so you can compare like for like.",
    criteria: [
      { title: "Enrollment and academic structure", detail: "Ask the team to enroll a fictional student, assign a program and class, collect documents, and show the student's record without entering the same information twice." },
      { title: "Attendance, grades, and student support", detail: "Watch a teacher record attendance and grades, then see the student view and the coordinator's overview. Check how staff identify students who need help." },
      { title: "Billing and documents", detail: "Walk through a real billing and document workflow. Verify permissions, payment integrations, templates, and which capabilities your proposed plan actually includes." },
      { title: "On-campus and online learning", detail: "If you teach online or in a blended format, test classes, learning materials, assignments, and assessments. Ask how learning records connect to academic administration." },
      { title: "Access, migration, and support", detail: "Review role-based access and request a migration and staff training plan. Get implementation timelines and support terms in writing." },
    ],
    demoTitle: "What to ask during a product demo",
    demoParagraphs: [
      "Follow a fictional student from enrollment to a class, attendance, grades, a document, and a billing record. Repeat key tasks as a teacher and as a student. Note any steps that still require spreadsheets or outside services.",
      "Request a written list of included modules, migration work, implementation timing, and total costs. A demo feature may not be part of the plan you are buying.",
    ],
    phanyxTitle: "Evaluate PHANYX using the same checklist",
    phanyxText: "PHANYX brings enrollment, programs and classes, attendance, academic monitoring, finance, documents, and digital learning together. Ask for a demonstration of your institution's workflows and confirm plan scope and availability for your region.",
    schoolButton: "Explore school software",
    plansButton: "Compare plans",
    faqTitle: "Frequently asked questions",
    faqs: [
      { question: "Is there one best system for every school?", answer: "No. The answer depends on the institution's processes, size, delivery model, budget, and ability to implement a new system." },
      { question: "How should I compare the total cost?", answer: "Include subscription and per-student fees, extra modules, data migration, training, and support. Request a region-specific proposal." },
    ],
    languagesLabel: "Read this guide in another language",
  },
  "es-ES": {
    title: "Cómo elegir software de gestión escolar en 2026 | PHANYX",
    description: "Guía para comparar software de gestión escolar: matrículas, asistencia, finanzas, enseñanza digital, implantación y soporte.",
    kicker: "Guía de elección",
    heading: "¿Cómo elegir un software de gestión escolar para tu centro?",
    intro: "La solución adecuada depende de los procesos del centro, ya sea un colegio, una universidad o una entidad de formación. Compara el recorrido completo del alumnado y el trabajo del profesorado y de administración, más allá de una lista de funciones.",
    imageAlt: "Docente acompaña a estudiantes que trabajan con un ordenador en el aula",
    contents: "En esta guía",
    criteriaLink: "Cinco criterios de comparación",
    demoLink: "Qué pedir en una demostración",
    phanyxLink: "Cómo evaluar PHANYX",
    criteriaTitle: "Cinco criterios para comparar sistemas de gestión escolar",
    criteriaIntro: "Utiliza los mismos casos prácticos con cada proveedor para contrastar sus propuestas.",
    criteria: [
      { title: "Matrículas y organización académica", detail: "Pide matricular a un estudiante ficticio, asignarlo a un curso y grupo, incorporar documentos y consultar su historial sin duplicar registros." },
      { title: "Asistencia, calificaciones y seguimiento", detail: "Prueba el registro por parte del profesorado, la consulta del alumnado y la visión de coordinación. Comprueba cómo se detectan las necesidades de apoyo." },
      { title: "Cobros y documentos", detail: "Recorre un proceso real de cobro y emisión de documentos. Confirma permisos, integraciones, plantillas y qué funciones incluye el plan." },
      { title: "Enseñanza presencial y en línea", detail: "Si impartes enseñanza híbrida o a distancia, prueba clases, materiales, actividades y evaluaciones y su conexión con la gestión académica." },
      { title: "Accesos, migración y soporte", detail: "Revisa los permisos de cada perfil y solicita un plan de migración y formación, plazos de implantación y condiciones de asistencia por escrito." },
    ],
    demoTitle: "Qué pedir durante la demostración",
    demoParagraphs: [
      "Sigue a un estudiante ficticio desde la matrícula hasta el grupo, la asistencia, las notas, un documento y su situación económica. Repite las tareas con perfiles de docente y estudiante. Anota los pasos que requieran hojas de cálculo.",
      "Solicita el alcance de los módulos, la migración, los plazos de implantación y el coste total. Así evitarás comparar una demostración con un plan que no incluya esas funciones.",
    ],
    phanyxTitle: "Evalúa PHANYX con los mismos criterios",
    phanyxText: "PHANYX reúne matrículas, cursos y grupos, asistencia, seguimiento académico, finanzas, documentos y enseñanza digital. Solicita una demostración adaptada a tu centro y confirma el alcance de la propuesta para España.",
    schoolButton: "Conocer el software escolar",
    plansButton: "Comparar planes",
    faqTitle: "Preguntas frecuentes",
    faqs: [
      { question: "¿Existe un sistema ideal para todos los centros?", answer: "No. Depende de los procesos, el tamaño, las modalidades educativas, el presupuesto y la capacidad de implantación." },
      { question: "¿Cómo comparo el coste total?", answer: "Incluye cuotas, cargos por estudiante o sede, módulos adicionales, migración, formación y soporte. Pide una propuesta en euros." },
    ],
    languagesLabel: "Leer esta guía en otro idioma",
  },
  "fr-FR": {
    title: "Comment choisir un logiciel de gestion scolaire en 2026 | PHANYX",
    description: "Guide pour comparer les logiciels de gestion scolaire : inscriptions, assiduité, finances, enseignement en ligne, déploiement et assistance.",
    kicker: "Guide de choix",
    heading: "Comment choisir un logiciel de gestion scolaire pour votre établissement ?",
    intro: "Le bon outil dépend des processus de votre école, établissement supérieur ou organisme de formation. Comparez le parcours complet de l'apprenant et le travail quotidien des équipes pédagogiques et administratives, au-delà d'une liste de fonctionnalités.",
    imageAlt: "Enseignante accompagne des élèves travaillant sur ordinateur en classe",
    contents: "Dans ce guide",
    criteriaLink: "Cinq critères de comparaison",
    demoLink: "Que demander en démonstration",
    phanyxLink: "Comment évaluer PHANYX",
    criteriaTitle: "Cinq critères pour comparer les logiciels de gestion scolaire",
    criteriaIntro: "Soumettez les mêmes scénarios à chaque fournisseur pour comparer leurs réponses.",
    criteria: [
      { title: "Inscriptions et organisation pédagogique", detail: "Demandez l'inscription d'un étudiant fictif, son rattachement à une formation et à un groupe, le dépôt de documents et la consultation de son dossier sans ressaisie." },
      { title: "Assiduité, notes et accompagnement", detail: "Testez la saisie par les enseignants, l'accès des apprenants et la vue de la coordination. Vérifiez comment l'équipe repère les besoins d'accompagnement." },
      { title: "Facturation et documents", detail: "Parcourez un scénario de facturation et de production documentaire. Vérifiez les droits d'accès, les intégrations, les modèles et le périmètre de l'offre." },
      { title: "Cours en présentiel et à distance", detail: "Si vous proposez des cours hybrides ou en ligne, testez ressources, activités et évaluations ainsi que leur lien avec le suivi administratif." },
      { title: "Accès, reprise des données et assistance", detail: "Examinez les rôles et demandez un plan de migration et de formation. Faites préciser les délais et les conditions d'assistance par écrit." },
    ],
    demoTitle: "Que demander pendant une démonstration",
    demoParagraphs: [
      "Suivez un apprenant fictif de l'inscription au groupe, à l'assiduité, aux notes, à un document et à sa situation financière. Refaites certaines tâches avec les accès enseignant et étudiant. Repérez les étapes qui exigent encore des tableurs.",
      "Demandez la liste des modules compris, les modalités de migration, les délais de déploiement et le coût global. Une fonction présentée peut être absente de l'offre envisagée.",
    ],
    phanyxTitle: "Évaluez PHANYX avec la même grille",
    phanyxText: "PHANYX regroupe inscriptions, formations et groupes, assiduité, suivi pédagogique, finances, documents et enseignement numérique. Demandez une démonstration adaptée à vos processus et confirmez les conditions proposées pour la France.",
    schoolButton: "Découvrir le logiciel scolaire",
    plansButton: "Comparer les offres",
    faqTitle: "Questions fréquentes",
    faqs: [
      { question: "Existe-t-il un meilleur logiciel pour tous les établissements ?", answer: "Non. Le choix dépend des processus, de la taille, des modalités pédagogiques, du budget et des moyens de déploiement." },
      { question: "Comment comparer le coût global ?", answer: "Tenez compte des abonnements, frais par apprenant ou site, modules complémentaires, migration, formation et assistance. Demandez un devis en euros." },
    ],
    languagesLabel: "Lire ce guide dans une autre langue",
  },
};
