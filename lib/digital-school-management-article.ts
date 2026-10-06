import type { LocalePhanyx } from "@/i18n/config";

export const digitalSchoolArticleSlugs = {
  "pt-BR": "gestao-escolar-digital",
  "pt-PT": "gestao-escolar-digital",
  "en-US": "digital-school-management",
  "es-ES": "gestion-escolar-digital",
  "fr-FR": "gestion-scolaire-numerique",
} as const satisfies Record<LocalePhanyx, string>;

export const digitalSchoolArticleLocales: LocalePhanyx[] = [
  "pt-BR",
  "pt-PT",
  "en-US",
  "es-ES",
  "fr-FR",
];

export const digitalSchoolArticleImages: Record<LocalePhanyx, string> = {
  "pt-BR": "/images/gestao-escolar-digital-pt-BR.webp",
  "pt-PT": "/images/gestao-escolar-digital-pt-PT.webp",
  "en-US": "/images/gestao-escolar-digital-en-US.webp",
  "es-ES": "/images/gestao-escolar-digital-es-ES.webp",
  "fr-FR": "/images/gestao-escolar-digital-fr-FR.webp",
};

export function digitalSchoolArticlePath(locale: LocalePhanyx) {
  return locale === "pt-BR"
    ? `/blog/${digitalSchoolArticleSlugs[locale]}`
    : `/${locale}/blog/${digitalSchoolArticleSlugs[locale]}`;
}

export function digitalSchoolArticleAlternates() {
  return {
    languages: {
      ...Object.fromEntries(
        digitalSchoolArticleLocales.map((locale) => [
          locale,
          digitalSchoolArticlePath(locale),
        ]),
      ),
      "x-default": digitalSchoolArticlePath("en-US"),
    },
  };
}

type Card = { title: string; description: string };
type Faq = { question: string; answer: string };

type Copy = {
  title: string;
  description: string;
  kicker: string;
  heading: string;
  intro: string;
  imageAlt: string;
  imageCaption: string;
  contents: string;
  contentsLinks: {
    what: string;
    signs: string;
    steps: string;
    technology: string;
  };
  whatHeading: string;
  whatParagraphs: string[];
  signsHeading: string;
  signs: Card[];
  stepsHeading: string;
  stepsIntro: string;
  steps: Card[];
  technologyHeading: string;
  technologyParagraphs: string[];
  calloutTitle: string;
  calloutText: string;
  phanyxHeading: string;
  phanyxText: string;
  schoolButton: string;
  onlineButton: string;
  faqHeading: string;
  faqs: Faq[];
  relatedHeading: string;
  relatedOnline: string;
  relatedGuide: string;
  relatedEnrollment: string;
  languagesLabel: string;
  footerTagline: string;
  footerExplore: string;
  footerSchool: string;
  footerAcademic: string;
  footerPlans: string;
  footerRights: string;
};

export const digitalSchoolArticleCopy: Record<LocalePhanyx, Copy> = {
  "pt-BR": {
    title: "Gestão escolar digital: como modernizar processos | PHANYX",
    description:
      "Entenda o que é gestão escolar digital, como reduzir processos manuais e quais etapas ajudam uma instituição a migrar de planilhas para fluxos integrados.",
    kicker: "Transformação digital",
    heading:
      "Gestão escolar digital: como modernizar processos sem apenas trocar papel por tela",
    intro:
      "Gestão escolar digital não significa apenas usar computadores ou armazenar documentos em arquivos eletrônicos. A transformação começa quando a instituição organiza seus processos para que informações acadêmicas, administrativas e financeiras circulem com menos retrabalho, duplicidade e dependência de controles paralelos.",
    imageAlt:
      "Professora e alunos em ambiente escolar usando tecnologia, ao lado de uma representação ilustrativa de um painel de gestão escolar PHANYX.",
    imageCaption:
      "Imagem ilustrativa: a transformação digital conecta pessoas, processos e informações em uma gestão escolar mais integrada.",
    contents: "Neste artigo",
    contentsLinks: {
      what: "O que é gestão escolar digital",
      signs: "Sinais de processos pouco integrados",
      steps: "Cinco etapas para modernizar a gestão",
      technology: "O papel da tecnologia",
    },
    whatHeading: "O que é gestão escolar digital",
    whatParagraphs: [
      "É a organização dos processos da instituição com apoio de ferramentas digitais capazes de conectar dados, pessoas e rotinas. Isso pode incluir matrícula, turmas, frequência, notas, documentos, financeiro, comunicação e ensino digital, conforme a realidade da instituição.",
      "A diferença está no fluxo. Se um dado precisa ser copiado de uma planilha para outra, enviado por mensagem e digitado novamente em um documento, o processo continua fragmentado mesmo que todas as etapas aconteçam em um computador.",
    ],
    signsHeading:
      "Sinais de que a gestão ainda depende demais de processos manuais",
    signs: [
      {
        title: "A mesma informação é digitada várias vezes",
        description:
          "Cadastros repetidos em planilhas, documentos e sistemas diferentes aumentam retrabalho e tornam a conferência mais difícil.",
      },
      {
        title: "A equipe depende de arquivos pessoais",
        description:
          "Quando controles importantes ficam em computadores individuais ou planilhas particulares, a continuidade do trabalho passa a depender de pessoas específicas.",
      },
      {
        title: "Encontrar a situação de um aluno demora",
        description:
          "Se matrícula, turma, financeiro, documentos e registros acadêmicos precisam ser procurados em lugares diferentes, o atendimento perde contexto.",
      },
      {
        title: "Relatórios exigem consolidação manual",
        description:
          "Quando cada análise começa com cópia e conferência de dados, a gestão tem menos tempo para interpretar informações e tomar decisões.",
      },
    ],
    stepsHeading: "Cinco etapas para modernizar a gestão escolar",
    stepsIntro:
      "A transformação digital fica mais previsível quando é tratada como um projeto de processo, e não apenas como uma troca de software.",
    steps: [
      {
        title: "Mapeie os processos atuais",
        description:
          "Liste como a instituição realiza matrícula, formação de turmas, registros acadêmicos, documentos, cobranças e atendimento. Identifique onde há duplicidade de dados e tarefas manuais.",
      },
      {
        title: "Defina uma fonte principal para cada informação",
        description:
          "Determine onde cada dado deve nascer e quem é responsável por mantê-lo atualizado. Isso reduz versões conflitantes da mesma informação.",
      },
      {
        title: "Organize perfis e responsabilidades",
        description:
          "Administração, secretaria, professores, financeiro e alunos precisam de acessos diferentes. A digitalização funciona melhor quando cada perfil tem um fluxo claro.",
      },
      {
        title: "Migre por etapas",
        description:
          "Evite tentar transformar todos os processos de uma vez. Priorize os fluxos que geram mais retrabalho e valide cada etapa antes de avançar.",
      },
      {
        title: "Acompanhe o uso depois da implantação",
        description:
          "Observe quais processos continuam fora do sistema e por quê. Planilhas paralelas depois da implantação podem indicar falta de treinamento, configuração ou aderência do fluxo.",
      },
    ],
    technologyHeading:
      "Qual é o papel de um sistema de gestão nessa transformação",
    technologyParagraphs: [
      "O sistema deve apoiar os processos definidos pela instituição, centralizando informações e permitindo que cada perfil encontre o que precisa sem reconstruir o histórico do aluno a cada tarefa. Isso é diferente de simplesmente acumular funcionalidades.",
      "Antes de contratar, vale testar situações reais: matrícula de um aluno, associação a curso e turma, consulta de registros, preparação de documentos, acompanhamento financeiro e acesso por diferentes perfis. O objetivo é verificar se o fluxo reduz retrabalho em vez de apenas transferi-lo para outra tela.",
    ],
    calloutTitle: "Digitalizar não é o mesmo que integrar",
    calloutText:
      "Uma instituição pode usar várias ferramentas digitais e ainda manter processos fragmentados. A integração acontece quando os dados relevantes acompanham o fluxo e podem ser consultados pelas pessoas autorizadas sem repetição desnecessária.",
    phanyxHeading: "Como o PHANYX pode participar desse processo",
    phanyxText:
      "O PHANYX reúne recursos de gestão escolar e acadêmica em uma plataforma SaaS, com áreas para administração, professores e alunos. Para avaliar se ele se encaixa na transformação da sua instituição, o ideal é mapear primeiro os processos prioritários e depois comparar os módulos e fluxos disponíveis no plano contratado.",
    schoolButton: "Conhecer o sistema escolar",
    onlineButton: "Entender sistema online x local",
    faqHeading: "Perguntas frequentes",
    faqs: [
      {
        question: "Gestão escolar digital é apenas trocar papel por computador?",
        answer:
          "Não. Digitalizar documentos é apenas uma parte. A gestão escolar digital envolve organizar processos, responsabilidades, dados e acessos para reduzir retrabalho e melhorar a continuidade das informações.",
      },
      {
        question: "É preciso abandonar todas as planilhas de uma vez?",
        answer:
          "Não. Uma transição gradual costuma ser mais segura. O importante é identificar quais controles são críticos, quais dados precisam ser migrados e qual sistema será a fonte principal de cada informação.",
      },
      {
        question: "Por onde uma escola deve começar?",
        answer:
          "Comece pelos processos que mais consomem tempo ou geram retrabalho, como matrículas, cadastros, turmas, documentos ou controles financeiros. Depois avance para os demais fluxos.",
      },
      {
        question: "Como saber se a transformação digital está funcionando?",
        answer:
          "Observe se diminuiu a duplicidade de registros, se a equipe encontra informações com mais rapidez, se há menos controles paralelos e se os processos estão mais claros para cada perfil.",
      },
    ],
    relatedHeading: "Leia também",
    relatedOnline: "Sistema de gestão escolar online: como funciona",
    relatedGuide: "Como escolher um sistema de gestão escolar",
    relatedEnrollment: "Sistema de matrícula escolar",
    languagesLabel: "Leia este artigo em outro idioma",
    footerTagline:
      "Gestão acadêmica, ensino digital e operação institucional numa única plataforma.",
    footerExplore: "Explore",
    footerSchool: "Sistema escolar",
    footerAcademic: "Gestão acadêmica",
    footerPlans: "Planos",
    footerRights: "Todos os direitos reservados.",
  },

  "pt-PT": {
    title: "Gestão escolar digital: como modernizar processos | PHANYX",
    description:
      "Perceba o que é gestão escolar digital, como reduzir processos manuais e como migrar de folhas de cálculo para fluxos integrados.",
    kicker: "Transformação digital",
    heading:
      "Gestão escolar digital: como modernizar processos sem apenas trocar papel por ecrãs",
    intro:
      "Gestão escolar digital não significa apenas utilizar computadores ou guardar documentos em formato eletrónico. A transformação começa quando a instituição organiza os seus processos para que a informação académica, administrativa e financeira circule com menos retrabalho, duplicação e dependência de controlos paralelos.",
    imageAlt:
      "Docente e estudantes num ambiente escolar a utilizar tecnologia, ao lado de uma representação ilustrativa de um painel de gestão escolar PHANYX.",
    imageCaption:
      "Imagem ilustrativa: a transformação digital liga pessoas, processos e informação numa gestão escolar mais integrada.",
    contents: "Neste artigo",
    contentsLinks: {
      what: "O que é gestão escolar digital",
      signs: "Sinais de processos pouco integrados",
      steps: "Cinco etapas para modernizar a gestão",
      technology: "O papel da tecnologia",
    },
    whatHeading: "O que é gestão escolar digital",
    whatParagraphs: [
      "É a organização dos processos da instituição com apoio de ferramentas digitais capazes de ligar dados, pessoas e rotinas. Pode incluir matrículas, turmas, assiduidade, avaliações, documentos, finanças, comunicação e ensino digital, de acordo com a realidade da instituição.",
      "A diferença está no fluxo. Se um dado precisa de ser copiado de uma folha de cálculo para outra, enviado por mensagem e digitado novamente num documento, o processo continua fragmentado mesmo que todas as etapas sejam digitais.",
    ],
    signsHeading:
      "Sinais de que a gestão ainda depende demasiado de processos manuais",
    signs: [
      {
        title: "A mesma informação é introduzida várias vezes",
        description:
          "Registos repetidos em folhas de cálculo, documentos e sistemas diferentes aumentam o retrabalho e dificultam a validação.",
      },
      {
        title: "A equipa depende de ficheiros pessoais",
        description:
          "Quando controlos importantes ficam em computadores individuais ou folhas de cálculo particulares, a continuidade do trabalho depende de pessoas específicas.",
      },
      {
        title: "Encontrar a situação de um estudante demora",
        description:
          "Se matrícula, turma, finanças, documentos e registos académicos estão em locais diferentes, o atendimento perde contexto.",
      },
      {
        title: "Os relatórios exigem consolidação manual",
        description:
          "Quando cada análise começa por copiar e validar dados, a gestão tem menos tempo para interpretar informação e tomar decisões.",
      },
    ],
    stepsHeading: "Cinco etapas para modernizar a gestão escolar",
    stepsIntro:
      "A transformação digital torna-se mais previsível quando é tratada como um projeto de processos e não apenas como uma troca de software.",
    steps: [
      {
        title: "Mapeie os processos atuais",
        description:
          "Liste como a instituição trata matrículas, formação de turmas, registos académicos, documentos, cobranças e atendimento. Identifique duplicações e tarefas manuais.",
      },
      {
        title: "Defina uma fonte principal para cada informação",
        description:
          "Determine onde cada dado deve ser criado e quem é responsável por o manter atualizado. Isto reduz versões contraditórias da mesma informação.",
      },
      {
        title: "Organize perfis e responsabilidades",
        description:
          "Administração, secretaria, docentes, finanças e estudantes precisam de acessos diferentes. A digitalização funciona melhor quando cada perfil tem um fluxo claro.",
      },
      {
        title: "Migre por etapas",
        description:
          "Evite transformar todos os processos de uma só vez. Priorize os fluxos que geram mais retrabalho e valide cada etapa antes de avançar.",
      },
      {
        title: "Acompanhe a utilização após a implementação",
        description:
          "Observe que processos continuam fora do sistema e porquê. Folhas de cálculo paralelas podem indicar falta de formação, configuração ou adequação do fluxo.",
      },
    ],
    technologyHeading:
      "Qual é o papel de um sistema de gestão nesta transformação",
    technologyParagraphs: [
      "O sistema deve apoiar os processos definidos pela instituição, centralizando informação e permitindo que cada perfil encontre o que precisa sem reconstruir o histórico do estudante em cada tarefa.",
      "Antes de contratar, teste situações reais: matrícula, associação a curso e turma, consulta de registos, preparação de documentos, acompanhamento financeiro e acessos por perfil. O objetivo é verificar se o fluxo reduz retrabalho.",
    ],
    calloutTitle: "Digitalizar não é o mesmo que integrar",
    calloutText:
      "Uma instituição pode utilizar várias ferramentas digitais e ainda manter processos fragmentados. A integração acontece quando os dados acompanham o fluxo e podem ser consultados por pessoas autorizadas sem repetição desnecessária.",
    phanyxHeading: "Como o PHANYX pode participar neste processo",
    phanyxText:
      "O PHANYX reúne recursos de gestão escolar e académica numa plataforma SaaS, com áreas para administração, docentes e estudantes. Para avaliar a adequação à sua instituição, mapeie os processos prioritários e compare os módulos e fluxos incluídos no plano.",
    schoolButton: "Conhecer o software escolar",
    onlineButton: "Comparar sistema online e local",
    faqHeading: "Perguntas frequentes",
    faqs: [
      {
        question: "Gestão escolar digital é apenas trocar papel por computador?",
        answer:
          "Não. Digitalizar documentos é apenas uma parte. A gestão escolar digital organiza processos, responsabilidades, dados e acessos para reduzir retrabalho e melhorar a continuidade da informação.",
      },
      {
        question: "É necessário abandonar todas as folhas de cálculo de uma vez?",
        answer:
          "Não. Uma transição gradual costuma ser mais segura. Identifique os controlos críticos, os dados a migrar e qual sistema será a fonte principal de cada informação.",
      },
      {
        question: "Por onde deve uma escola começar?",
        answer:
          "Comece pelos processos que consomem mais tempo ou geram retrabalho, como matrículas, registos, turmas, documentos ou controlos financeiros.",
      },
      {
        question: "Como saber se a transformação digital está a funcionar?",
        answer:
          "Observe se diminuiu a duplicação de registos, se a equipa encontra informação mais rapidamente, se existem menos controlos paralelos e se os processos estão mais claros.",
      },
    ],
    relatedHeading: "Leia também",
    relatedOnline: "Software de gestão escolar online: como funciona",
    relatedGuide: "Como escolher software de gestão escolar",
    relatedEnrollment: "Gestão de matrículas escolares",
    languagesLabel: "Leia este artigo noutro idioma",
    footerTagline:
      "Gestão académica, ensino digital e operação institucional numa única plataforma.",
    footerExplore: "Explorar",
    footerSchool: "Software escolar",
    footerAcademic: "Gestão académica",
    footerPlans: "Planos",
    footerRights: "Todos os direitos reservados.",
  },

  "en-US": {
    title: "Digital School Management: How to Modernize Processes | PHANYX",
    description:
      "Learn what digital school management means, how to reduce manual work, and how schools can move from spreadsheets to integrated workflows.",
    kicker: "Digital transformation",
    heading:
      "Digital school management: modernize processes without simply replacing paper with screens",
    intro:
      "Digital school management is not just about using computers or storing documents electronically. Transformation begins when an institution redesigns its processes so academic, administrative, and financial information can move with less rework, duplication, and dependence on disconnected controls.",
    imageAlt:
      "Teacher and students using technology in a school setting beside an illustrative PHANYX school management dashboard.",
    imageCaption:
      "Illustrative image: digital transformation connects people, processes, and information in a more integrated school operation.",
    contents: "In this article",
    contentsLinks: {
      what: "What digital school management is",
      signs: "Signs of disconnected processes",
      steps: "Five steps to modernize school management",
      technology: "The role of technology",
    },
    whatHeading: "What is digital school management?",
    whatParagraphs: [
      "It is the organization of institutional processes with digital tools that connect data, people, and routines. Depending on the institution, this can include enrollment, classes, attendance, grades, documents, finance, communication, and digital learning.",
      "The difference is in the workflow. If data must be copied from one spreadsheet to another, sent through messaging apps, and typed again into a document, the process remains fragmented even if every step happens on a computer.",
    ],
    signsHeading:
      "Signs your school still relies too heavily on manual processes",
    signs: [
      {
        title: "The same information is entered repeatedly",
        description:
          "Repeated records across spreadsheets, documents, and separate systems create rework and make verification harder.",
      },
      {
        title: "The team depends on personal files",
        description:
          "When important controls live on individual computers or personal spreadsheets, operational continuity depends on specific people.",
      },
      {
        title: "Finding a student's status takes too long",
        description:
          "When enrollment, class, finance, documents, and academic records live in different places, staff lose context.",
      },
      {
        title: "Reports require manual consolidation",
        description:
          "When every analysis starts by copying and checking data, managers have less time to interpret information and make decisions.",
      },
    ],
    stepsHeading: "Five steps to modernize school management",
    stepsIntro:
      "Digital transformation becomes more predictable when it is treated as a process-improvement project, not simply a software replacement.",
    steps: [
      {
        title: "Map current processes",
        description:
          "Document how the institution handles enrollment, class formation, academic records, documents, billing, and service. Identify duplicate data and manual tasks.",
      },
      {
        title: "Define a primary source for each type of information",
        description:
          "Decide where each data point should originate and who is responsible for keeping it current. This reduces conflicting versions of the same information.",
      },
      {
        title: "Organize roles and responsibilities",
        description:
          "Administrators, registrars, teachers, finance teams, and students need different access. Digital workflows work better when each role is clear.",
      },
      {
        title: "Migrate in stages",
        description:
          "Avoid transforming every process at once. Prioritize the workflows that create the most rework and validate each stage before moving on.",
      },
      {
        title: "Monitor adoption after implementation",
        description:
          "Watch which processes remain outside the system and why. Parallel spreadsheets may signal training, configuration, or workflow-fit issues.",
      },
    ],
    technologyHeading:
      "What role does a management system play in digital transformation?",
    technologyParagraphs: [
      "A management system should support the institution's defined processes, centralize information, and let each role find what it needs without rebuilding the student's history for every task.",
      "Before choosing a platform, test real scenarios: student enrollment, program and class assignment, record lookup, document preparation, financial follow-up, and role-based access. The goal is to confirm that the workflow reduces rework instead of moving it to another screen.",
    ],
    calloutTitle: "Digitizing is not the same as integrating",
    calloutText:
      "An institution can use many digital tools and still have fragmented processes. Integration happens when relevant data follows the workflow and can be accessed by authorized people without unnecessary repetition.",
    phanyxHeading: "How PHANYX can support this process",
    phanyxText:
      "PHANYX brings school and academic management tools together in a SaaS platform with areas for administrators, teachers, and students. To evaluate fit, map your priority processes first and then compare the modules and workflows included in the proposed plan.",
    schoolButton: "Explore school management software",
    onlineButton: "Compare online and local systems",
    faqHeading: "Frequently asked questions",
    faqs: [
      {
        question: "Is digital school management just replacing paper with computers?",
        answer:
          "No. Document digitization is only one part. Digital school management organizes processes, responsibilities, data, and access to reduce rework and improve continuity.",
      },
      {
        question: "Do schools need to abandon every spreadsheet at once?",
        answer:
          "No. A gradual transition is usually safer. Identify critical controls, the data that must be migrated, and the primary system for each type of information.",
      },
      {
        question: "Where should a school start?",
        answer:
          "Start with processes that consume the most time or create the most rework, such as enrollment, student records, classes, documents, or financial controls.",
      },
      {
        question: "How can you tell whether digital transformation is working?",
        answer:
          "Look for less duplicate data entry, faster access to information, fewer parallel controls, and clearer workflows for each role.",
      },
    ],
    relatedHeading: "Related reading",
    relatedOnline: "Online school management software: how it works",
    relatedGuide: "How to choose school management software",
    relatedEnrollment: "School enrollment management",
    languagesLabel: "Read this article in another language",
    footerTagline:
      "Academic management, digital learning, and institutional operations in one platform.",
    footerExplore: "Explore",
    footerSchool: "School software",
    footerAcademic: "Academic management",
    footerPlans: "Plans",
    footerRights: "All rights reserved.",
  },

  "es-ES": {
    title: "Gestión Escolar Digital: Cómo Modernizar Procesos | PHANYX",
    description:
      "Descubre qué es la gestión escolar digital, cómo reducir tareas manuales y cómo pasar de hojas de cálculo a procesos integrados.",
    kicker: "Transformación digital",
    heading:
      "Gestión escolar digital: cómo modernizar procesos sin limitarse a sustituir el papel por pantallas",
    intro:
      "La gestión escolar digital no consiste solo en usar ordenadores o guardar documentos en formato electrónico. La transformación comienza cuando el centro organiza sus procesos para que la información académica, administrativa y financiera circule con menos retrabajo, duplicación y dependencia de controles aislados.",
    imageAlt:
      "Docente y estudiantes utilizando tecnología en un entorno escolar junto a una representación ilustrativa de un panel de gestión escolar PHANYX.",
    imageCaption:
      "Imagen ilustrativa: la transformación digital conecta personas, procesos e información en una gestión escolar más integrada.",
    contents: "En este artículo",
    contentsLinks: {
      what: "Qué es la gestión escolar digital",
      signs: "Señales de procesos poco integrados",
      steps: "Cinco pasos para modernizar la gestión",
      technology: "El papel de la tecnología",
    },
    whatHeading: "Qué es la gestión escolar digital",
    whatParagraphs: [
      "Es la organización de los procesos del centro con herramientas digitales capaces de conectar datos, personas y rutinas. Puede incluir matrícula, grupos, asistencia, calificaciones, documentos, finanzas, comunicación y enseñanza digital.",
      "La diferencia está en el flujo. Si un dato debe copiarse de una hoja de cálculo a otra, enviarse por mensajería y volver a introducirse en un documento, el proceso sigue fragmentado aunque todo ocurra en un ordenador.",
    ],
    signsHeading:
      "Señales de que la gestión aún depende demasiado de procesos manuales",
    signs: [
      {
        title: "La misma información se introduce varias veces",
        description:
          "Los registros repetidos en hojas de cálculo, documentos y sistemas diferentes generan retrabajo y dificultan la revisión.",
      },
      {
        title: "El equipo depende de archivos personales",
        description:
          "Cuando los controles importantes están en ordenadores individuales o archivos particulares, la continuidad depende de personas concretas.",
      },
      {
        title: "Encontrar la situación de un estudiante tarda demasiado",
        description:
          "Si matrícula, grupo, finanzas, documentos y registros académicos están en lugares distintos, la atención pierde contexto.",
      },
      {
        title: "Los informes requieren consolidación manual",
        description:
          "Cuando cada análisis empieza copiando y comprobando datos, la dirección dispone de menos tiempo para interpretar la información y decidir.",
      },
    ],
    stepsHeading: "Cinco pasos para modernizar la gestión escolar",
    stepsIntro:
      "La transformación digital es más predecible cuando se trata como un proyecto de mejora de procesos y no solo como un cambio de software.",
    steps: [
      {
        title: "Mapea los procesos actuales",
        description:
          "Documenta cómo se gestionan matrículas, grupos, registros académicos, documentos, cobros y atención. Identifica duplicidades y tareas manuales.",
      },
      {
        title: "Define una fuente principal para cada dato",
        description:
          "Determina dónde nace cada información y quién debe mantenerla actualizada. Así se reducen versiones contradictorias.",
      },
      {
        title: "Organiza perfiles y responsabilidades",
        description:
          "Administración, secretaría, profesorado, finanzas y alumnado necesitan accesos distintos. La digitalización funciona mejor cuando cada perfil tiene un flujo claro.",
      },
      {
        title: "Migra por etapas",
        description:
          "Evita transformar todos los procesos a la vez. Prioriza los que generan más retrabajo y valida cada etapa antes de avanzar.",
      },
      {
        title: "Supervisa el uso tras la implantación",
        description:
          "Observa qué procesos siguen fuera del sistema y por qué. Las hojas de cálculo paralelas pueden indicar problemas de formación, configuración o adaptación del flujo.",
      },
    ],
    technologyHeading:
      "Qué papel tiene un sistema de gestión en esta transformación",
    technologyParagraphs: [
      "El sistema debe apoyar los procesos definidos por el centro, centralizar la información y permitir que cada perfil encuentre lo necesario sin reconstruir el historial del estudiante en cada tarea.",
      "Antes de contratar, conviene probar situaciones reales: matrícula, asignación a curso y grupo, consulta de registros, preparación de documentos, seguimiento financiero y acceso por perfiles.",
    ],
    calloutTitle: "Digitalizar no es lo mismo que integrar",
    calloutText:
      "Un centro puede utilizar muchas herramientas digitales y seguir teniendo procesos fragmentados. La integración aparece cuando los datos acompañan al flujo y pueden ser consultados por personas autorizadas sin repeticiones innecesarias.",
    phanyxHeading: "Cómo puede participar PHANYX en este proceso",
    phanyxText:
      "PHANYX reúne herramientas de gestión escolar y académica en una plataforma SaaS con áreas para administración, profesorado y alumnado. Para evaluar el ajuste, mapea primero los procesos prioritarios y compara después los módulos y flujos incluidos en la propuesta.",
    schoolButton: "Conocer el software escolar",
    onlineButton: "Comparar sistema online y local",
    faqHeading: "Preguntas frecuentes",
    faqs: [
      {
        question: "¿La gestión escolar digital consiste solo en sustituir el papel por ordenadores?",
        answer:
          "No. Digitalizar documentos es solo una parte. La gestión escolar digital organiza procesos, responsabilidades, datos y accesos para reducir retrabajo y mejorar la continuidad de la información.",
      },
      {
        question: "¿Hay que abandonar todas las hojas de cálculo de una vez?",
        answer:
          "No. Una transición gradual suele ser más segura. Identifica los controles críticos, los datos que deben migrarse y el sistema principal para cada información.",
      },
      {
        question: "¿Por dónde debería empezar un centro?",
        answer:
          "Empieza por los procesos que consumen más tiempo o generan más retrabajo, como matrículas, registros, grupos, documentos o controles financieros.",
      },
      {
        question: "¿Cómo saber si la transformación digital está funcionando?",
        answer:
          "Comprueba si disminuye la duplicidad de registros, si el equipo encuentra la información más rápido, si hay menos controles paralelos y si los procesos están más claros.",
      },
    ],
    relatedHeading: "También te puede interesar",
    relatedOnline: "Software de gestión escolar online: cómo funciona",
    relatedGuide: "Cómo elegir software de gestión escolar",
    relatedEnrollment: "Gestión de matrículas escolares",
    languagesLabel: "Lee este artículo en otro idioma",
    footerTagline:
      "Gestión académica, enseñanza digital y operación institucional en una sola plataforma.",
    footerExplore: "Explorar",
    footerSchool: "Software escolar",
    footerAcademic: "Gestión académica",
    footerPlans: "Planes",
    footerRights: "Todos los derechos reservados.",
  },

  "fr-FR": {
    title: "Gestion Scolaire Numérique : Moderniser les Processus | PHANYX",
    description:
      "Découvrez la gestion scolaire numérique, la réduction des tâches manuelles et le passage des tableurs à des flux de travail intégrés.",
    kicker: "Transformation numérique",
    heading:
      "Gestion scolaire numérique : moderniser les processus sans simplement remplacer le papier par des écrans",
    intro:
      "La gestion scolaire numérique ne consiste pas seulement à utiliser des ordinateurs ou à stocker des documents sous forme électronique. La transformation commence lorsque l'établissement organise ses processus afin que les informations académiques, administratives et financières circulent avec moins de ressaisie, de duplication et de contrôles isolés.",
    imageAlt:
      "Enseignante et élèves utilisant la technologie dans un environnement scolaire, à côté d'une représentation illustrative d'un tableau de bord de gestion scolaire PHANYX.",
    imageCaption:
      "Image illustrative : la transformation numérique relie les personnes, les processus et l'information dans une gestion scolaire plus intégrée.",
    contents: "Dans cet article",
    contentsLinks: {
      what: "Qu'est-ce que la gestion scolaire numérique ?",
      signs: "Signes de processus peu intégrés",
      steps: "Cinq étapes pour moderniser la gestion",
      technology: "Le rôle de la technologie",
    },
    whatHeading: "Qu'est-ce que la gestion scolaire numérique ?",
    whatParagraphs: [
      "Il s'agit d'organiser les processus de l'établissement avec des outils numériques capables de relier les données, les personnes et les routines. Cela peut inclure les inscriptions, les classes, l'assiduité, les notes, les documents, les finances, la communication et l'enseignement numérique.",
      "La différence se trouve dans le flux de travail. Si une donnée doit être copiée d'un tableur à un autre, envoyée par messagerie puis saisie à nouveau dans un document, le processus reste fragmenté même si toutes les étapes sont numériques.",
    ],
    signsHeading:
      "Signes que la gestion dépend encore trop de processus manuels",
    signs: [
      {
        title: "La même information est saisie plusieurs fois",
        description:
          "Les saisies répétées dans des tableurs, documents et systèmes différents créent du travail inutile et compliquent les vérifications.",
      },
      {
        title: "L'équipe dépend de fichiers personnels",
        description:
          "Lorsque des contrôles importants restent sur des ordinateurs individuels ou dans des fichiers privés, la continuité dépend de certaines personnes.",
      },
      {
        title: "Retrouver la situation d'un élève prend trop de temps",
        description:
          "Si inscription, classe, finances, documents et dossiers académiques sont dispersés, le service perd le contexte.",
      },
      {
        title: "Les rapports nécessitent une consolidation manuelle",
        description:
          "Lorsque chaque analyse commence par copier et vérifier des données, la direction dispose de moins de temps pour interpréter l'information et décider.",
      },
    ],
    stepsHeading: "Cinq étapes pour moderniser la gestion scolaire",
    stepsIntro:
      "La transformation numérique devient plus prévisible lorsqu'elle est traitée comme un projet d'amélioration des processus et non comme un simple changement de logiciel.",
    steps: [
      {
        title: "Cartographiez les processus actuels",
        description:
          "Documentez les inscriptions, la constitution des classes, les dossiers académiques, les documents, la facturation et le service. Repérez les doublons et tâches manuelles.",
      },
      {
        title: "Définissez une source principale pour chaque information",
        description:
          "Décidez où chaque donnée doit être créée et qui doit la maintenir à jour. Cela réduit les versions contradictoires.",
      },
      {
        title: "Organisez les rôles et responsabilités",
        description:
          "Administration, secrétariat, enseignants, finance et étudiants ont besoin d'accès différents. La numérisation fonctionne mieux lorsque chaque rôle est clair.",
      },
      {
        title: "Migrez par étapes",
        description:
          "Évitez de transformer tous les processus en même temps. Priorisez ceux qui génèrent le plus de ressaisie et validez chaque étape.",
      },
      {
        title: "Suivez l'adoption après le déploiement",
        description:
          "Observez les processus qui restent hors du système et pourquoi. Des tableurs parallèles peuvent signaler un besoin de formation, de configuration ou d'adaptation.",
      },
    ],
    technologyHeading:
      "Quel rôle joue un système de gestion dans cette transformation ?",
    technologyParagraphs: [
      "Le système doit soutenir les processus définis par l'établissement, centraliser les informations et permettre à chaque rôle de retrouver ce dont il a besoin sans reconstruire l'historique de l'élève.",
      "Avant de choisir une plateforme, testez des situations réelles : inscription, affectation à une formation et une classe, consultation de dossiers, préparation de documents, suivi financier et accès selon les rôles.",
    ],
    calloutTitle: "Numériser n'est pas la même chose qu'intégrer",
    calloutText:
      "Un établissement peut utiliser de nombreux outils numériques tout en conservant des processus fragmentés. L'intégration existe lorsque les données suivent le flux et peuvent être consultées par les personnes autorisées sans répétition inutile.",
    phanyxHeading: "Comment PHANYX peut accompagner ce processus",
    phanyxText:
      "PHANYX regroupe des fonctions de gestion scolaire et académique dans une plateforme SaaS avec des espaces pour l'administration, les enseignants et les étudiants. Pour évaluer son adéquation, cartographiez d'abord les processus prioritaires puis comparez les modules et flux inclus dans l'offre.",
    schoolButton: "Découvrir le logiciel scolaire",
    onlineButton: "Comparer système en ligne et local",
    faqHeading: "Questions fréquentes",
    faqs: [
      {
        question: "La gestion scolaire numérique consiste-t-elle seulement à remplacer le papier par des ordinateurs ?",
        answer:
          "Non. La numérisation des documents n'est qu'une partie. La gestion scolaire numérique organise processus, responsabilités, données et accès afin de réduire les ressaisies et d'améliorer la continuité de l'information.",
      },
      {
        question: "Faut-il abandonner tous les tableurs en une seule fois ?",
        answer:
          "Non. Une transition progressive est souvent plus sûre. Identifiez les contrôles critiques, les données à migrer et le système principal pour chaque information.",
      },
      {
        question: "Par où un établissement doit-il commencer ?",
        answer:
          "Commencez par les processus qui consomment le plus de temps ou génèrent le plus de ressaisie, comme les inscriptions, les dossiers, les classes, les documents ou les contrôles financiers.",
      },
      {
        question: "Comment savoir si la transformation numérique fonctionne ?",
        answer:
          "Vérifiez si les doubles saisies diminuent, si l'équipe retrouve l'information plus vite, si les contrôles parallèles sont moins nombreux et si les processus sont plus clairs.",
      },
    ],
    relatedHeading: "À lire également",
    relatedOnline: "Logiciel de gestion scolaire en ligne : fonctionnement",
    relatedGuide: "Comment choisir un logiciel de gestion scolaire",
    relatedEnrollment: "Gestion des inscriptions scolaires",
    languagesLabel: "Lire cet article dans une autre langue",
    footerTagline:
      "Gestion académique, enseignement numérique et opérations institutionnelles sur une seule plateforme.",
    footerExplore: "Explorer",
    footerSchool: "Logiciel scolaire",
    footerAcademic: "Gestion académique",
    footerPlans: "Offres",
    footerRights: "Tous droits réservés.",
  },
};
