import type { LocalePhanyx } from "@/i18n/config";

type RegistrarCopy = {
  title: string; description: string; eyebrow: string; heading: string; intro: string;
  plans: string; contact: string; problemHeading: string; problem: string;
  workflowHeading: string; workflow: { title: string; description: string }[];
  recordsHeading: string; records: { title: string; description: string }[];
  boundariesHeading: string; boundaries: string;
  faqHeading: string; faqAnswer: string; relatedHeading: string; enrollment: string; academic: string;
  closingHeading: string; closing: string;
};

export const registrarCopy: Record<LocalePhanyx, RegistrarCopy> = {
  "pt-BR": {
    title: "Software para Secretaria Escolar e Registros Acadêmicos | PHANYX",
    description: "Organize alunos, turmas, documentos e registros acadêmicos na rotina da secretaria escolar com o PHANYX.",
    eyebrow: "Secretaria escolar", heading: "Informações do aluno acessíveis na rotina da secretaria",
    intro: "Da consulta da matrícula à preparação de documentos, a secretaria precisa encontrar informações coerentes. O PHANYX reúne o vínculo do aluno, a estrutura acadêmica e os registros usados pela equipe em um ambiente institucional.",
    plans: "Ver planos", contact: "Falar com a equipe",
    problemHeading: "Menos informações espalhadas entre atendimentos", problem: "Quando a turma está numa planilha, os documentos em outra pasta e a situação acadêmica em outro sistema, cada solicitação exige reunir dados novamente. A secretaria ganha contexto ao consultar o aluno junto do curso, da turma e dos registros relacionados.",
    workflowHeading: "Como organizar o trabalho da secretaria", workflow: [
      { title: "Localize o aluno", description: "Consulte o cadastro e o vínculo acadêmico para identificar curso, período e turma antes de atender uma solicitação." },
      { title: "Confira os registros", description: "Verifique informações acadêmicas e os documentos disponíveis para o perfil autorizado." },
      { title: "Dê continuidade", description: "Prepare documentos institucionais e acompanhe as pendências nos fluxos correspondentes, sem perder o contexto do aluno." },
    ],
    recordsHeading: "O que fica conectado ao atendimento", records: [
      { title: "Matrículas e turmas", description: "O vínculo do aluno mostra onde ele está situado na estrutura acadêmica." },
      { title: "Documentos escolares", description: "Modelos e registros institucionais apoiam a emissão e a conferência de documentos." },
      { title: "Acesso por perfil", description: "Administração, professores e alunos acessam funções de acordo com suas permissões." },
    ],
    boundariesHeading: "Adapte à operação da sua instituição", boundaries: "Escolas, faculdades e cursos têm rotinas diferentes. A configuração de documentos, acessos e módulos depende dos processos e do plano contratado; converse com a equipe sobre o seu fluxo antes de migrar dados.",
    faqHeading: "A secretaria pode acompanhar matrícula e documentos no mesmo sistema?", faqAnswer: "Sim. O PHANYX relaciona matrículas à estrutura acadêmica e dispõe de recursos para documentos institucionais. Os modelos e fluxos que sua instituição utilizará devem ser definidos na implantação.",
    relatedHeading: "Continue explorando", enrollment: "Gestão de matrículas", academic: "Gestão acadêmica",
    closingHeading: "Converse sobre a rotina da sua secretaria", closing: "Mostre como sua equipe registra alunos, consulta turmas e prepara documentos para avaliar a configuração adequada.",
  },
  "pt-PT": {
    title: "Software para Secretaria Escolar e Registos Académicos | PHANYX",
    description: "Organize estudantes, turmas, documentos e registos académicos no trabalho da secretaria escolar com o PHANYX.",
    eyebrow: "Secretaria escolar", heading: "Dados do estudante disponíveis no trabalho da secretaria",
    intro: "Da consulta da matrícula à preparação de documentos, a secretaria precisa de informação consistente. O PHANYX reúne o percurso do estudante, a estrutura académica e os registos usados pela equipa num ambiente institucional.",
    plans: "Ver planos", contact: "Falar com a equipa",
    problemHeading: "Informação reunida para cada atendimento", problem: "Quando turmas, documentos e dados académicos estão dispersos, cada pedido exige procurar informação em vários sítios. A equipa pode consultar o estudante no contexto do curso, da turma e dos registos relacionados.",
    workflowHeading: "Organizar o trabalho da secretaria", workflow: [
      { title: "Encontre o estudante", description: "Consulte o registo e o vínculo académico para identificar formação, período e turma." },
      { title: "Confirme os dados", description: "Verifique a informação académica e os documentos disponíveis conforme as permissões." },
      { title: "Prossiga com o pedido", description: "Prepare documentos institucionais e acompanhe as tarefas mantendo o contexto do estudante." },
    ],
    recordsHeading: "Informação ligada ao atendimento", records: [
      { title: "Matrículas e turmas", description: "O vínculo situa o estudante na estrutura académica." },
      { title: "Documentos escolares", description: "Modelos e registos institucionais apoiam a emissão e verificação." },
      { title: "Acessos por perfil", description: "Administração, docentes e estudantes dispõem de funções adequadas às permissões." },
    ],
    boundariesHeading: "Configure o seu processo", boundaries: "Escolas, instituições superiores e entidades formadoras têm rotinas distintas. Documentos, acessos e módulos dependem dos processos e do plano; discuta a migração de dados com a equipa.",
    faqHeading: "Matrículas e documentos podem ser acompanhados na mesma plataforma?", faqAnswer: "Sim. O PHANYX liga matrículas à estrutura académica e disponibiliza recursos para documentos institucionais. Os modelos e fluxos são definidos durante a configuração.",
    relatedHeading: "Continue a explorar", enrollment: "Gestão de matrículas", academic: "Gestão académica",
    closingHeading: "Fale-nos da sua secretaria", closing: "Apresente a forma como a equipa regista estudantes, consulta turmas e prepara documentos.",
  },
  "en-US": {
    title: "School Registrar Software for Student Records | PHANYX",
    description: "Connect student records, classes, enrollment and institutional documents in a school registrar workflow with PHANYX.",
    eyebrow: "Registrar operations", heading: "Student information in context for registrar teams",
    intro: "A registrar needs more than an enrollment list. PHANYX connects a student's course and class placement to academic records and institutional documents so authorized staff can continue the work after enrollment.",
    plans: "Explore plans", contact: "Talk to the team",
    problemHeading: "Answer routine questions with the right context", problem: "When class lists, student records and documents live in separate places, staff have to reconstruct the story for every request. A connected academic structure makes it easier to locate the student, confirm the enrollment relationship and find relevant records.",
    workflowHeading: "A practical registrar workflow", workflow: [
      { title: "Find the student", description: "Review the student profile and enrollment relationship to identify the course, term and class." },
      { title: "Check the record", description: "Review available academic information and institutional documents within your permissions." },
      { title: "Continue the request", description: "Prepare institutional documents and follow the appropriate process with the student's context at hand." },
    ],
    recordsHeading: "What supports the registrar's work", records: [
      { title: "Enrollment and classes", description: "Place a student's enrollment within the academic structure." },
      { title: "Institutional documents", description: "Templates and records support document preparation and verification." },
      { title: "Role-based access", description: "Administrators, teachers and students use functions appropriate to their roles." },
    ],
    boundariesHeading: "Fit the process to your institution", boundaries: "Schools, colleges and training providers have different recordkeeping needs. Document templates, access and modules depend on configuration and plan; discuss data migration and local requirements with the team.",
    faqHeading: "Can we manage enrollment and student documents together?", faqAnswer: "PHANYX places enrollment within the academic structure and includes institutional document tools. Your specific templates and workflows should be mapped during setup.",
    relatedHeading: "Explore related workflows", enrollment: "Enrollment management", academic: "Academic management",
    closingHeading: "Map your registrar workflow", closing: "Tell us how your team records students, checks class placement and prepares documents.",
  },
  "es-ES": {
    title: "Software para Secretaría Escolar y Expedientes | PHANYX",
    description: "Relaciona alumnado, grupos, matrículas, expedientes y documentos en la rutina de secretaría escolar con PHANYX.",
    eyebrow: "Secretaría escolar", heading: "La información del alumnado en contexto para secretaría",
    intro: "Una matrícula es solo el inicio. PHANYX relaciona al estudiante con su curso, grupo, expediente y documentos institucionales para que el personal autorizado continúe el trabajo durante el año.",
    plans: "Ver planes", contact: "Hablar con el equipo",
    problemHeading: "Responde a las consultas con datos relacionados", problem: "Si los listados de grupos, expedientes y documentos están separados, cada solicitud exige reunirlos de nuevo. Una estructura académica compartida ayuda a localizar al estudiante y consultar sus registros en contexto.",
    workflowHeading: "Un proceso para secretaría", workflow: [
      { title: "Localiza al estudiante", description: "Consulta su ficha y matrícula para identificar curso, periodo y grupo." },
      { title: "Comprueba el expediente", description: "Revisa la información académica y los documentos disponibles según tus permisos." },
      { title: "Continúa la solicitud", description: "Prepara documentos institucionales y sigue el proceso correspondiente con el contexto del alumno." },
    ],
    recordsHeading: "Información relacionada con cada solicitud", records: [
      { title: "Matrículas y grupos", description: "Sitúa al alumnado dentro de la estructura académica." },
      { title: "Documentos institucionales", description: "Modelos y registros ayudan a preparar y verificar documentos." },
      { title: "Acceso por perfiles", description: "Administración, profesorado y alumnado utilizan las funciones que les corresponden." },
    ],
    boundariesHeading: "Ajusta el proceso a tu centro", boundaries: "Los centros escolares, universidades y entidades de formación tienen necesidades distintas. Modelos, permisos y módulos dependen de la configuración y del plan; consulta con el equipo la migración de datos.",
    faqHeading: "¿Se pueden gestionar matrículas y documentos en la misma plataforma?", faqAnswer: "PHANYX relaciona las matrículas con la estructura académica e incluye herramientas para documentos institucionales. Los modelos y procesos concretos se definen en la configuración.",
    relatedHeading: "Explora otros procesos", enrollment: "Gestión de matrículas", academic: "Gestión académica",
    closingHeading: "Hablemos de la secretaría de tu centro", closing: "Cuéntanos cómo registráis estudiantes, consultáis grupos y preparáis documentos.",
  },
  "fr-FR": {
    title: "Logiciel de Secrétariat Scolaire et Dossiers Étudiants | PHANYX",
    description: "Reliez étudiants, classes, inscriptions, dossiers et documents dans le travail du secrétariat scolaire avec PHANYX.",
    eyebrow: "Secrétariat scolaire", heading: "Les dossiers étudiants dans leur contexte pour le secrétariat",
    intro: "Une inscription n'est que le début du parcours. PHANYX relie l'étudiant à sa formation, sa classe, ses données académiques et ses documents institutionnels pour accompagner le travail des équipes autorisées.",
    plans: "Voir les offres", contact: "Contacter l'équipe",
    problemHeading: "Retrouvez le contexte de chaque demande", problem: "Lorsque listes de classes, dossiers et documents sont séparés, chaque demande exige de rassembler à nouveau les informations. Une structure académique commune aide à retrouver l'étudiant et les données associées.",
    workflowHeading: "Le travail du secrétariat en trois étapes", workflow: [
      { title: "Retrouver l'étudiant", description: "Consultez sa fiche et son inscription pour identifier formation, période et classe." },
      { title: "Vérifier son dossier", description: "Accédez aux informations académiques et aux documents disponibles selon vos droits." },
      { title: "Traiter la demande", description: "Préparez les documents institutionnels et poursuivez la procédure avec le contexte de l'étudiant." },
    ],
    recordsHeading: "Les informations liées à la demande", records: [
      { title: "Inscriptions et classes", description: "Situez l'étudiant dans la structure académique." },
      { title: "Documents institutionnels", description: "Modèles et dossiers facilitent la préparation et la vérification." },
      { title: "Accès selon les rôles", description: "Administration, enseignants et étudiants utilisent les fonctions autorisées." },
    ],
    boundariesHeading: "Adaptez la configuration à votre établissement", boundaries: "Écoles, établissements supérieurs et organismes de formation ont des besoins différents. Modèles, accès et modules dépendent de la configuration et de l'offre ; discutez de la migration avec l'équipe.",
    faqHeading: "Peut-on relier inscriptions et documents étudiants ?", faqAnswer: "PHANYX situe les inscriptions dans la structure académique et propose des outils de documents institutionnels. Les modèles et procédures précis sont définis lors de la configuration.",
    relatedHeading: "Explorer les autres processus", enrollment: "Gestion des inscriptions", academic: "Gestion académique",
    closingHeading: "Parlons de votre secrétariat", closing: "Présentez-nous votre méthode pour inscrire les étudiants, consulter les classes et préparer les documents.",
  },
};
