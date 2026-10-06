import type { LocalePhanyx } from "@/i18n/config";

type EnrollmentCopy = {
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  intro: string;
  heroAlt: string;
  plans: string;
  contact: string;
  problemHeading: string;
  problem: string;
  stepsHeading: string;
  steps: { title: string; description: string }[];
  scopeHeading: string;
  scope: { title: string; description: string }[];
  fitHeading: string;
  fit: string;
  question: string;
  answer: string;
  relatedHeading: string;
  relatedSchool: string;
  relatedAcademic: string;
  relatedRegistrar: string;
  closingHeading: string;
  closing: string;
};

export const enrollmentCopy: Record<LocalePhanyx, EnrollmentCopy> = {
  "pt-BR": {
    title: "Sistema de Matrícula Escolar e Gestão de Matrículas | PHANYX",
    description: "Gerencie matrículas, rematrículas, alunos, cursos e turmas com registros acadêmicos, documentos e financeiro conectados no PHANYX.",
    eyebrow: "Sistema de matrícula escolar", heading: "Sistema de matrícula escolar conectado à gestão acadêmica",
    intro: "Uma matrícula não termina no cadastro. O PHANYX conecta o aluno ao curso e à turma, aos documentos, ao acompanhamento financeiro e aos registros usados pela instituição. A plataforma também possui fluxos de rematrícula semestral para operações que trabalham com renovação periódica.",
    heroAlt: "Ilustração de um painel de matrícula com aluno, curso, turma e documentos",
    plans: "Ver planos", contact: "Falar com a equipe",
    problemHeading: "Do cadastro ao acompanhamento, com o contexto no mesmo lugar",
    problem: "Quando alunos, turmas e documentos ficam espalhados, a equipe precisa reconstruir informações a cada atendimento. Na PHANYX, a matrícula faz parte da estrutura acadêmica e pode ser consultada com os dados do aluno e do curso.",
    stepsHeading: "Como organizar o fluxo de matrícula", steps: [
      { title: "Prepare a estrutura", description: "Cadastre cursos, períodos, disciplinas e turmas antes de vincular os alunos." },
      { title: "Registre a matrícula", description: "Associe o aluno ao curso e à turma correspondente, com acesso da equipe conforme o perfil." },
      { title: "Acompanhe a rotina", description: "Consulte registros acadêmicos e documentos e organize o acompanhamento financeiro institucional." },
    ],
    scopeHeading: "O que acompanha a matrícula", scope: [
      { title: "Matrícula e rematrícula", description: "O vínculo acadêmico acompanha o aluno desde o ingresso e pode continuar nos processos de renovação semestral." },
      { title: "Áreas por perfil", description: "Administração, professores e alunos encontram funções adequadas aos seus acessos." },
      { title: "Documentos e financeiro", description: "Registros institucionais e controle financeiro no mesmo ambiente de trabalho." },
    ],
    fitHeading: "Para que instituições?", fit: "Escolas, faculdades, cursos técnicos e cursos livres que precisam organizar matrículas e rematrículas dentro da operação acadêmica, com áreas para administração, professores e alunos. A configuração, os módulos e as regras de renovação variam conforme o plano e a instituição.",
    question: "A PHANYX faz a captação de alunos e a matrícula no mesmo sistema?", answer: "A plataforma possui recursos comerciais para leads e processos de matrícula na área acadêmica. A disponibilidade dos módulos comerciais depende do plano e deve ser confirmada na proposta.",
    relatedHeading: "Explore a plataforma", relatedSchool: "Sistema de gestão escolar", relatedAcademic: "Gestão acadêmica", relatedRegistrar: "Secretaria escolar",
    closingHeading: "Veja como a matrícula se encaixa na sua instituição", closing: "Compare os planos ou converse com a equipe sobre seus cursos, unidades e fluxo de trabalho.",
  },
  "pt-PT": {
    title: "Software de Gestão de Matrículas Escolares | PHANYX",
    description: "Organize matrículas, renovações, estudantes, cursos e turmas com registos académicos, documentos e finanças institucionais ligados.",
    eyebrow: "Gestão de matrículas", heading: "Software de matrículas escolares ligado à gestão académica",
    intro: "Uma matrícula é o início do percurso do estudante. O PHANYX liga esse registo ao curso, à turma e às áreas de trabalho da equipa e dispõe de fluxos de renovação semestral para instituições que trabalham com continuidade periódica.",
    heroAlt: "Ilustração de um painel de matrícula com estudante, curso, turma e documentos",
    plans: "Ver planos", contact: "Falar com a equipa",
    problemHeading: "Da inscrição ao acompanhamento académico",
    problem: "Quando os registos de estudantes e turmas se encontram dispersos, cada consulta exige trabalho adicional. O PHANYX reúne a estrutura académica e os dados da matrícula num ambiente institucional.",
    stepsHeading: "Como preparar as matrículas", steps: [
      { title: "Defina a oferta", description: "Organize cursos, períodos, disciplinas e turmas antes de registar estudantes." },
      { title: "Registe o vínculo", description: "Associe cada estudante ao curso e à turma e atribua acessos conforme os perfis da equipa." },
      { title: "Acompanhe a atividade", description: "Consulte os registos académicos e documentos e acompanhe as finanças da instituição." },
    ],
    scopeHeading: "Informação ligada à matrícula", scope: [
      { title: "Cursos e turmas", description: "A estrutura académica situa o percurso e as disciplinas de cada estudante." },
      { title: "Áreas por perfil", description: "Administração, docentes e estudantes dispõem de acessos adequados." },
      { title: "Documentos e finanças", description: "Registos e controlo financeiro no mesmo espaço de trabalho." },
    ],
    fitHeading: "Para que instituições?", fit: "Escolas, instituições de ensino superior e entidades formadoras que precisam de gerir matrículas em conjunto com a atividade académica. Módulos e número de polos dependem do plano contratado.",
    question: "É possível gerir captação e matrículas na mesma plataforma?", answer: "O PHANYX inclui ferramentas comerciais para contactos e processos académicos de matrícula. Confirme na proposta a disponibilidade dos módulos comerciais para a sua instituição.",
    relatedHeading: "Conheça mais", relatedSchool: "Software de gestão escolar", relatedAcademic: "Gestão académica", relatedRegistrar: "Secretaria escolar",
    closingHeading: "Planeie o percurso de matrícula", closing: "Compare os planos ou fale com a equipa sobre cursos, polos e necessidades da sua instituição.",
  },
  "en-US": {
    title: "School Enrollment Management Software | PHANYX",
    description: "Manage enrollment, reenrollment, students, courses and classes with connected academic records, documents and institutional finance in PHANYX.",
    eyebrow: "Enrollment management", heading: "School enrollment management software connected to academic operations",
    intro: "Enrollment is the start of a student's academic record. PHANYX connects students to courses and classes and also supports semester reenrollment workflows for institutions that use periodic renewal.",
    heroAlt: "Illustration of an enrollment dashboard with a student, course, class and documents",
    plans: "Explore plans", contact: "Talk to the team",
    problemHeading: "Carry enrollment information into everyday work",
    problem: "Separate lists for students, classes and documents make it harder to answer routine questions. In PHANYX, enrollment belongs to the academic structure your administrators and teaching teams use.",
    stepsHeading: "A practical enrollment workflow", steps: [
      { title: "Set up the academic structure", description: "Create courses, terms, subjects and classes before enrolling students." },
      { title: "Record the student relationship", description: "Associate a student with the appropriate course and class, with staff access based on roles." },
      { title: "Continue the work", description: "Review academic records and institutional documents alongside finance follow-up." },
    ],
    scopeHeading: "What stays connected", scope: [
      { title: "Courses and classes", description: "Place each enrollment in its academic term, course and class." },
      { title: "Role-based portals", description: "Administrators, teachers and students have access suited to their roles." },
      { title: "Documents and finance", description: "Keep institutional records and finance operations within the same platform." },
    ],
    fitHeading: "Who is it for?", fit: "Schools, colleges, training providers and other institutions that need enrollment records as part of a wider academic workflow. Available modules and included units depend on the plan.",
    question: "Does PHANYX connect recruitment and enrollment?", answer: "PHANYX has lead management tools and academic enrollment workflows. Commercial module availability depends on the plan and should be confirmed in a proposal.",
    relatedHeading: "Explore related tools", relatedSchool: "School management software", relatedAcademic: "Academic management", relatedRegistrar: "Registrar software",
    closingHeading: "Map your enrollment process", closing: "Compare plans or discuss your courses, locations and enrollment process with the PHANYX team.",
  },
  "es-ES": {
    title: "Software de Gestión de Matrículas Escolares | PHANYX",
    description: "Gestiona matrículas, renovaciones, alumnado, cursos y grupos con expedientes, documentos y finanzas institucionales conectados en PHANYX.",
    eyebrow: "Gestión de matrículas", heading: "Software de matrículas escolares conectado con la gestión académica",
    intro: "La matrícula abre el recorrido del estudiante. PHANYX vincula alumnado, cursos y grupos y también dispone de procesos de renovación semestral para centros que trabajan con continuidad periódica.",
    heroAlt: "Ilustración de un panel de matrícula con estudiante, curso, grupo y documentos",
    plans: "Ver planes", contact: "Hablar con el equipo",
    problemHeading: "Información útil después de matricular", problem: "Si los datos de alumnos, grupos y documentos están repartidos, cada consulta requiere volver a reunirlos. PHANYX sitúa la matrícula dentro de la estructura académica del centro.",
    stepsHeading: "Cómo organizar el proceso", steps: [
      { title: "Prepara la oferta", description: "Configura cursos, periodos, asignaturas y grupos antes de matricular al alumnado." },
      { title: "Registra el vínculo", description: "Relaciona cada estudiante con su curso y grupo y asigna permisos según el perfil." },
      { title: "Sigue la actividad", description: "Consulta el expediente académico, los documentos y la gestión financiera institucional." },
    ],
    scopeHeading: "Qué información queda relacionada", scope: [
      { title: "Cursos y grupos", description: "Sitúa la matrícula en el periodo y la estructura académica correspondientes." },
      { title: "Portales por perfil", description: "Administración, profesorado y alumnado utilizan sus propios accesos." },
      { title: "Documentos y finanzas", description: "Gestiona registros institucionales y operaciones financieras en la plataforma." },
    ],
    fitHeading: "¿A qué centros se dirige?", fit: "Centros educativos, instituciones superiores y entidades de formación que necesitan integrar las matrículas en sus operaciones académicas. Los módulos y sedes incluidos varían según el plan.",
    question: "¿Se pueden vincular captación y matrículas?", answer: "PHANYX dispone de herramientas comerciales para contactos y funciones académicas de matrícula. Consulta la propuesta para confirmar la disponibilidad de los módulos comerciales.",
    relatedHeading: "Conoce otras funciones", relatedSchool: "Software de gestión escolar", relatedAcademic: "Gestión académica", relatedRegistrar: "Secretaría escolar",
    closingHeading: "Organiza el proceso de tu centro", closing: "Compara los planes o habla con el equipo sobre cursos, sedes y matrículas.",
  },
  "fr-FR": {
    title: "Logiciel de Gestion des Inscriptions Scolaires | PHANYX",
    description: "Gérez inscriptions, réinscriptions, étudiants, formations et classes avec dossiers, documents et finances institutionnelles reliés dans PHANYX.",
    eyebrow: "Gestion des inscriptions", heading: "Logiciel d'inscription scolaire relié à la gestion académique",
    intro: "L'inscription marque le début du parcours étudiant. PHANYX la relie aux formations et aux classes et comprend aussi des flux de réinscription semestrielle pour les établissements qui utilisent un renouvellement périodique.",
    heroAlt: "Illustration d'un tableau de bord d'inscription avec étudiant, formation, classe et documents",
    plans: "Voir les offres", contact: "Contacter l'équipe",
    problemHeading: "Des données utiles au-delà de l'inscription", problem: "Quand les listes d'étudiants, de classes et de documents sont séparées, les équipes doivent rassembler les informations à chaque demande. PHANYX place l'inscription dans la structure académique de l'établissement.",
    stepsHeading: "Organiser les inscriptions", steps: [
      { title: "Préparer la structure", description: "Définissez formations, périodes, matières et classes avant d'inscrire les étudiants." },
      { title: "Enregistrer le parcours", description: "Associez chaque étudiant à sa formation et à sa classe, avec des accès selon les rôles." },
      { title: "Suivre les activités", description: "Consultez les dossiers académiques et les documents, ainsi que les opérations financières." },
    ],
    scopeHeading: "Ce qui reste lié", scope: [
      { title: "Formations et classes", description: "Situez chaque inscription dans son parcours et sa période académique." },
      { title: "Espaces selon les rôles", description: "Administration, enseignants et étudiants accèdent aux fonctions qui les concernent." },
      { title: "Documents et finances", description: "Regroupez les dossiers institutionnels et le suivi financier dans la plateforme." },
    ],
    fitHeading: "Pour quels établissements ?", fit: "Écoles, établissements supérieurs et organismes de formation qui veulent relier les inscriptions à leur activité académique. Les modules et le nombre de sites inclus dépendent de l'offre.",
    question: "La prospection et les inscriptions peuvent-elles être liées ?", answer: "PHANYX propose des outils commerciaux pour les contacts ainsi que des fonctions académiques d'inscription. Vérifiez la disponibilité des modules commerciaux dans votre proposition.",
    relatedHeading: "Découvrir la plateforme", relatedSchool: "Logiciel de gestion scolaire", relatedAcademic: "Gestion académique", relatedRegistrar: "Secrétariat scolaire",
    closingHeading: "Préparez votre processus d'inscription", closing: "Comparez les offres ou présentez vos formations, vos sites et vos besoins à l'équipe PHANYX.",
  },
};
