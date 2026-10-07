import type { LocalePhanyx } from "@/i18n/config";

export const onlineSchoolArticleSlugs = {
  "pt-BR": "sistema-de-gestao-escolar-online",
  "pt-PT": "software-gestao-escolar-online",
  "en-US": "online-school-management-software",
  "es-ES": "software-gestion-escolar-online",
  "fr-FR": "logiciel-gestion-scolaire-en-ligne",
} as const satisfies Record<LocalePhanyx, string>;

export const onlineSchoolArticleLocales: LocalePhanyx[] = [
  "pt-BR",
  "pt-PT",
  "en-US",
  "es-ES",
  "fr-FR",
];

export const onlineSchoolArticleImage =
  "/images/reuniao-professores-sistema-online.png";

export function onlineSchoolArticlePath(locale: LocalePhanyx) {
  return locale === "pt-BR"
    ? `/blog/${onlineSchoolArticleSlugs[locale]}`
    : `/${locale}/blog/${onlineSchoolArticleSlugs[locale]}`;
}

export function onlineSchoolArticleAlternates() {
  return {
    languages: {
      ...Object.fromEntries(
        onlineSchoolArticleLocales.map((locale) => [
          locale,
          onlineSchoolArticlePath(locale),
        ]),
      ),
      "x-default": onlineSchoolArticlePath("en-US"),
    },
  };
}

type ComparisonItem = {
  criterion: string;
  online: string;
  local: string;
};

type Step = {
  title: string;
  description: string;
};

type Faq = {
  question: string;
  answer: string;
};

type OnlineSchoolArticleCopy = {
  title: string;
  description: string;
  kicker: string;
  heading: string;
  intro: string;
  imageAlt: string;
  imageCaption: string;
  contents: string;
  contentsLinks: {
    how: string;
    comparison: string;
    when: string;
    migration: string;
  };
  howHeading: string;
  howParagraphs: string[];
  comparisonHeading: string;
  comparisonIntro: string;
  comparisonLabels: {
    criterion: string;
    online: string;
    local: string;
  };
  comparison: ComparisonItem[];
  whenHeading: string;
  whenText: string;
  calloutTitle: string;
  calloutText: string;
  migrationHeading: string;
  migrationSteps: Step[];
  phanyxHeading: string;
  phanyxText: string;
  schoolButton: string;
  guideButton: string;
  faqHeading: string;
  faqs: Faq[];
  relatedHeading: string;
  relatedGuide: string;
  relatedEnrollment: string;
  relatedAcademic: string;
  languagesLabel: string;
  footerTagline: string;
  footerExplore: string;
  footerSchool: string;
  footerAcademic: string;
  footerPlans: string;
  footerRights: string;
};

export const onlineSchoolArticleCopy: Record<
  LocalePhanyx,
  OnlineSchoolArticleCopy
> = {
  "pt-BR": {
    title: "Sistema de gestão escolar online: como funciona | PHANYX",
    description:
      "Entenda como funciona um sistema de gestão escolar online, as diferenças para sistemas locais e o que avaliar antes de migrar sua instituição para a nuvem.",
    kicker: "Gestão escolar na nuvem",
    heading:
      "Sistema de gestão escolar online: como funciona e quando faz sentido",
    intro:
      "Um sistema de gestão escolar online é acessado pela internet e ajuda a centralizar processos acadêmicos e administrativos sem depender de uma instalação isolada em cada computador. Para uma instituição de ensino, porém, estar “na nuvem” não é suficiente: é preciso avaliar como alunos, turmas, matrículas, documentos, financeiro e acessos funcionam no dia a dia.",
    imageAlt:
      "Reunião de professores e gestores em ambiente escolar, com uma apresentação em uma tela grande, um participante com a mão levantada e outro analisando um relatório.",
    imageCaption:
      "Reunião pedagógica com equipe escolar analisando indicadores e próximos passos da instituição.",
    contents: "Neste artigo",
    contentsLinks: {
      how: "Como funciona um sistema escolar online",
      comparison: "Sistema online x sistema local",
      when: "Quando a mudança para a nuvem faz sentido",
      migration: "O que verificar antes de migrar",
    },
    howHeading: "Como funciona um sistema de gestão escolar online",
    howParagraphs: [
      "Em vez de manter o sistema principal instalado somente em uma máquina ou servidor local, a equipe acessa a aplicação pela internet. Isso permite que o fornecedor opere o software como um serviço e que a instituição trabalhe com uma base central de informações, respeitando os perfis e permissões configurados.",
      "O ponto central não é apenas onde o sistema está hospedado. Uma boa implementação precisa organizar o fluxo completo: cadastro do aluno, matrícula, curso, turma, registros acadêmicos, documentos e demais módulos contratados. Se a equipe continuar reconstruindo informações em planilhas paralelas, a simples mudança para um sistema online não resolve o problema de gestão.",
    ],
    comparisonHeading:
      "Sistema escolar online x sistema instalado localmente",
    comparisonIntro:
      "Os dois modelos podem atender uma instituição, mas distribuem as responsabilidades de forma diferente. A comparação deve considerar a realidade da equipe, a infraestrutura existente e os processos que precisam ser acessados fora da sede.",
    comparisonLabels: {
      criterion: "Critério",
      online: "Sistema online",
      local: "Sistema local",
    },
    comparison: [
      {
        criterion: "Acesso",
        online:
          "O sistema é acessado pela internet em dispositivos autorizados, sem depender de uma instalação individual em cada computador.",
        local:
          "O acesso costuma depender da instalação, da rede interna ou da infraestrutura mantida pela própria instituição.",
      },
      {
        criterion: "Atualizações",
        online:
          "A evolução do software pode ser disponibilizada pelo fornecedor de forma centralizada para os usuários da plataforma.",
        local:
          "Atualizações podem exigir intervenção na instalação ou na infraestrutura usada pela instituição.",
      },
      {
        criterion: "Trabalho entre unidades",
        online:
          "Pode facilitar o acesso de equipes em locais diferentes, desde que permissões e estrutura institucional estejam configuradas adequadamente.",
        local:
          "A integração entre unidades pode exigir rede, servidor ou outras soluções de acesso remoto.",
      },
      {
        criterion: "Infraestrutura",
        online:
          "A instituição usa a aplicação como serviço e precisa avaliar conexão, disponibilidade, suporte e regras de acesso.",
        local:
          "A instituição assume mais responsabilidades relacionadas a máquinas, servidor, instalação e manutenção do ambiente.",
      },
    ],
    whenHeading: "Quando um sistema escolar online faz mais sentido",
    whenText:
      "O modelo online tende a ser especialmente útil quando diferentes áreas precisam consultar a mesma informação, quando há trabalho fora da sede, quando a instituição possui mais de uma unidade ou quando deseja reduzir a dependência de controles manuais espalhados. Isso não elimina a necessidade de processos claros: permissões, responsabilidades e qualidade dos dados continuam sendo parte da implantação.",
    calloutTitle: "A pergunta certa não é apenas “o sistema é online?”",
    calloutText:
      "Pergunte também como a solução lida com os fluxos reais da instituição. Teste matrícula, consulta de turma, registros acadêmicos, documentos e os demais processos que fazem parte da sua operação antes de comparar propostas.",
    migrationHeading:
      "O que verificar antes de migrar para um sistema online",
    migrationSteps: [
      {
        title: "Mapeie os processos atuais",
        description:
          "Liste os fluxos que hoje dependem de planilhas, arquivos separados ou sistemas diferentes. Isso ajuda a descobrir quais módulos realmente precisam estar no escopo da implantação.",
      },
      {
        title: "Verifique a migração dos dados",
        description:
          "Confirme quais dados podem ser importados, em quais formatos, quem fará a conferência e como registros inconsistentes serão tratados antes da entrada em produção.",
      },
      {
        title: "Teste os perfis de acesso",
        description:
          "Administração, secretaria, professores e alunos não precisam enxergar as mesmas informações. A demonstração deve mostrar como o acesso muda conforme o perfil.",
      },
      {
        title: "Confirme implantação, suporte e plano",
        description:
          "Solicite por escrito o que está incluído no plano, quais módulos dependem de contratação adicional, como funciona a implantação e quais canais de suporte estarão disponíveis.",
      },
    ],
    phanyxHeading: "Onde o PHANYX entra nessa comparação",
    phanyxText:
      "O PHANYX é uma plataforma SaaS de gestão escolar e acadêmica. A página do sistema apresenta recursos para alunos, professores, cursos, turmas, matrículas, documentos e ensino digital. Para uma avaliação adequada, compare os fluxos que sua instituição utiliza e confirme com a equipe quais módulos fazem parte do plano contratado.",
    schoolButton: "Conhecer o sistema escolar",
    guideButton: "Ver guia de escolha",
    faqHeading: "Perguntas frequentes",
    faqs: [
      {
        question:
          "Sistema de gestão escolar online é o mesmo que plataforma EAD?",
        answer:
          "Não. A gestão escolar organiza processos como alunos, matrículas, turmas, registros acadêmicos e rotinas administrativas. Uma plataforma EAD é voltada ao ensino digital. Algumas soluções podem integrar os dois ambientes.",
      },
      {
        question: "Um sistema escolar online precisa de internet?",
        answer:
          "Sim. Como o acesso ocorre pela internet, a instituição precisa considerar a qualidade da conexão e prever como trabalhar em situações de indisponibilidade.",
      },
      {
        question: "É possível migrar de planilhas ou de um sistema local?",
        answer:
          "Em muitos projetos isso é possível, mas a migração deve ser planejada. Antes da contratação, confirme formatos de importação, qualidade dos dados existentes, responsáveis pela conferência e escopo do serviço de implantação.",
      },
      {
        question: "O que avaliar antes de contratar um sistema online?",
        answer:
          "Avalie os fluxos que sua instituição realmente usa, permissões, suporte, implantação, migração de dados, integrações, disponibilidade dos módulos e condições comerciais do plano.",
      },
    ],
    relatedHeading: "Leia também",
    relatedGuide: "Como escolher um sistema de gestão escolar",
    relatedEnrollment: "Sistema de matrícula escolar",
    relatedAcademic: "Gestão acadêmica",
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
    title: "Software de gestão escolar online: como funciona | PHANYX",
    description:
      "Perceba como funciona um software de gestão escolar online, as diferenças face a sistemas locais e o que avaliar antes de migrar a sua instituição para a cloud.",
    kicker: "Gestão escolar na cloud",
    heading:
      "Software de gestão escolar online: como funciona e quando faz sentido",
    intro:
      "Um software de gestão escolar online é acedido pela internet e ajuda a centralizar processos académicos e administrativos sem depender de uma instalação isolada em cada computador. Para uma instituição de ensino, porém, estar na cloud não basta: é preciso avaliar como estudantes, turmas, matrículas, documentos, finanças e acessos funcionam no dia a dia.",
    imageAlt:
      "Reunião de docentes e gestores numa escola, com uma apresentação num ecrã grande, um participante com a mão levantada e outro a analisar um relatório.",
    imageCaption:
      "Reunião pedagógica com a equipa escolar a analisar indicadores e os próximos passos da instituição.",
    contents: "Neste artigo",
    contentsLinks: {
      how: "Como funciona um software escolar online",
      comparison: "Sistema online x sistema local",
      when: "Quando a mudança para a cloud faz sentido",
      migration: "O que verificar antes de migrar",
    },
    howHeading: "Como funciona um software de gestão escolar online",
    howParagraphs: [
      "Em vez de manter o sistema principal instalado apenas num computador ou servidor local, a equipa acede à aplicação pela internet. Isto permite ao fornecedor disponibilizar o software como serviço e à instituição trabalhar com uma base central de informação, respeitando os perfis e permissões configurados.",
      "O ponto central não é apenas onde o sistema está alojado. Uma boa implementação deve organizar o percurso completo: registo do estudante, matrícula, curso, turma, registos académicos, documentos e restantes módulos contratados. Se a equipa continuar a reconstruir informação em folhas de cálculo paralelas, a simples mudança para um sistema online não resolve o problema de gestão.",
    ],
    comparisonHeading:
      "Software escolar online x sistema instalado localmente",
    comparisonIntro:
      "Os dois modelos podem servir uma instituição, mas distribuem responsabilidades de forma diferente. A comparação deve considerar a realidade da equipa, a infraestrutura existente e os processos que precisam de ser acedidos fora das instalações.",
    comparisonLabels: {
      criterion: "Critério",
      online: "Sistema online",
      local: "Sistema local",
    },
    comparison: [
      {
        criterion: "Acesso",
        online:
          "O sistema é acedido pela internet em dispositivos autorizados, sem depender de uma instalação individual em cada computador.",
        local:
          "O acesso tende a depender da instalação, da rede interna ou da infraestrutura mantida pela própria instituição.",
      },
      {
        criterion: "Atualizações",
        online:
          "A evolução do software pode ser disponibilizada pelo fornecedor de forma centralizada aos utilizadores da plataforma.",
        local:
          "As atualizações podem exigir intervenção na instalação ou na infraestrutura utilizada pela instituição.",
      },
      {
        criterion: "Trabalho entre unidades",
        online:
          "Pode facilitar o acesso de equipas em locais diferentes, desde que permissões e estrutura institucional estejam corretamente configuradas.",
        local:
          "A ligação entre unidades pode exigir rede, servidor ou outras soluções de acesso remoto.",
      },
      {
        criterion: "Infraestrutura",
        online:
          "A instituição utiliza a aplicação como serviço e deve avaliar ligação à internet, disponibilidade, apoio e regras de acesso.",
        local:
          "A instituição assume mais responsabilidades por equipamentos, servidor, instalação e manutenção do ambiente.",
      },
    ],
    whenHeading: "Quando um sistema escolar online faz mais sentido",
    whenText:
      "O modelo online tende a ser especialmente útil quando diferentes áreas precisam de consultar a mesma informação, quando existe trabalho fora das instalações, quando a instituição tem mais de uma unidade ou pretende reduzir a dependência de controlos manuais dispersos. Isto não elimina a necessidade de processos claros: permissões, responsabilidades e qualidade dos dados continuam a fazer parte da implementação.",
    calloutTitle: "A pergunta certa não é apenas “o sistema é online?”",
    calloutText:
      "Pergunte também como a solução responde aos processos reais da instituição. Teste matrícula, consulta de turma, registos académicos, documentos e os restantes processos antes de comparar propostas.",
    migrationHeading:
      "O que verificar antes de migrar para um sistema online",
    migrationSteps: [
      {
        title: "Mapeie os processos atuais",
        description:
          "Liste os processos que hoje dependem de folhas de cálculo, ficheiros separados ou sistemas diferentes. Assim identifica os módulos que precisam realmente de fazer parte da implementação.",
      },
      {
        title: "Verifique a migração dos dados",
        description:
          "Confirme quais dados podem ser importados, em que formatos, quem fará a validação e como serão tratados registos inconsistentes antes da entrada em produção.",
      },
      {
        title: "Teste os perfis de acesso",
        description:
          "Administração, secretaria, docentes e estudantes não precisam de ver a mesma informação. A demonstração deve mostrar como o acesso muda consoante o perfil.",
      },
      {
        title: "Confirme implementação, apoio e plano",
        description:
          "Peça por escrito o que está incluído no plano, quais módulos exigem contratação adicional, como funciona a implementação e que canais de apoio estarão disponíveis.",
      },
    ],
    phanyxHeading: "Onde entra o PHANYX nesta comparação",
    phanyxText:
      "O PHANYX é uma plataforma SaaS de gestão escolar e académica. A solução reúne recursos para estudantes, docentes, cursos, turmas, matrículas, documentos e ensino digital. Para avaliar a adequação à sua instituição, compare os processos reais e confirme com a equipa quais os módulos incluídos na proposta.",
    schoolButton: "Conhecer o software escolar",
    guideButton: "Ver guia de escolha",
    faqHeading: "Perguntas frequentes",
    faqs: [
      {
        question:
          "Software de gestão escolar online é o mesmo que plataforma de ensino online?",
        answer:
          "Não. A gestão escolar organiza estudantes, matrículas, turmas, registos académicos e processos administrativos. Uma plataforma de ensino online é orientada para aulas e aprendizagem digital. Algumas soluções integram ambos os ambientes.",
      },
      {
        question: "Um software escolar online precisa de internet?",
        answer:
          "Sim. Como o acesso é feito pela internet, a instituição deve considerar a qualidade da ligação e definir como trabalhar em situações de indisponibilidade.",
      },
      {
        question:
          "É possível migrar de folhas de cálculo ou de um sistema local?",
        answer:
          "Em muitos projetos, sim, mas a migração deve ser planeada. Confirme formatos de importação, qualidade dos dados existentes, responsáveis pela validação e o âmbito do serviço de implementação.",
      },
      {
        question: "O que avaliar antes de contratar um sistema online?",
        answer:
          "Avalie os processos utilizados pela instituição, permissões, apoio, implementação, migração de dados, integrações, módulos disponíveis e condições comerciais.",
      },
    ],
    relatedHeading: "Leia também",
    relatedGuide: "Como escolher software de gestão escolar",
    relatedEnrollment: "Gestão de matrículas escolares",
    relatedAcademic: "Gestão académica",
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
    title: "Online School Management Software: How It Works | PHANYX",
    description:
      "Learn how online school management software works, how it differs from local systems, and what to evaluate before moving school operations to the cloud.",
    kicker: "Cloud school management",
    heading:
      "Online school management software: how it works and when it makes sense",
    intro:
      "Online school management software is accessed through the internet and helps centralize academic and administrative processes without relying on a separate installation on every computer. But moving to the cloud is not enough by itself: schools still need to evaluate how students, classes, enrollment, documents, finance, and access permissions work day to day.",
    imageAlt:
      "School staff meeting with an educator presenting on a large screen, one participant raising a hand and another reviewing a printed report.",
    imageCaption:
      "School staff review student indicators and discuss the institution's next steps.",
    contents: "In this article",
    contentsLinks: {
      how: "How online school management software works",
      comparison: "Online system vs. local system",
      when: "When moving to the cloud makes sense",
      migration: "What to check before migrating",
    },
    howHeading: "How online school management software works",
    howParagraphs: [
      "Instead of keeping the main system installed only on a local computer or server, staff access the application through the internet. This allows the provider to operate the software as a service while the institution works from a centralized source of information with configured roles and permissions.",
      "The key issue is not simply where the system is hosted. A good implementation should support the full workflow: student records, enrollment, programs, classes, academic records, documents, and the other modules included in the plan. If teams still rebuild information in parallel spreadsheets, moving the software online does not solve the underlying management problem.",
    ],
    comparisonHeading:
      "Online school management software vs. locally installed systems",
    comparisonIntro:
      "Both models can support an institution, but responsibilities are distributed differently. Compare them based on your staff, infrastructure, and the workflows that need to be available beyond the campus.",
    comparisonLabels: {
      criterion: "Criterion",
      online: "Online system",
      local: "Local system",
    },
    comparison: [
      {
        criterion: "Access",
        online:
          "Authorized users access the system through the internet without installing the application separately on every computer.",
        local:
          "Access often depends on local installation, an internal network, or infrastructure maintained by the institution.",
      },
      {
        criterion: "Updates",
        online:
          "The provider can make software updates available centrally to users of the service.",
        local:
          "Updates may require changes to the installation or infrastructure managed by the institution.",
      },
      {
        criterion: "Multiple locations",
        online:
          "It can make access easier for staff working in different locations when roles and institutional structure are configured correctly.",
        local:
          "Connecting multiple locations may require additional networking, servers, or remote-access solutions.",
      },
      {
        criterion: "Infrastructure",
        online:
          "The institution consumes the application as a service and should evaluate connectivity, availability, support, and access policies.",
        local:
          "The institution typically takes on more responsibility for hardware, servers, installation, and environment maintenance.",
      },
    ],
    whenHeading: "When online school management software makes more sense",
    whenText:
      "The online model can be especially useful when multiple teams need the same information, staff work away from the main campus, the institution has more than one location, or leadership wants to reduce scattered manual controls. It still requires clear processes: permissions, responsibilities, and data quality remain part of implementation.",
    calloutTitle:
      "The right question is not only “Is the system online?”",
    calloutText:
      "Also ask how the solution handles your institution's real workflows. Test enrollment, class lookup, academic records, documents, and the other processes your team relies on before comparing proposals.",
    migrationHeading: "What to check before moving to an online system",
    migrationSteps: [
      {
        title: "Map your current processes",
        description:
          "List the workflows that currently depend on spreadsheets, separate files, or different systems. This helps identify which modules really belong in the implementation scope.",
      },
      {
        title: "Review data migration",
        description:
          "Confirm which data can be imported, supported formats, who will validate the records, and how inconsistent data will be handled before launch.",
      },
      {
        title: "Test role-based access",
        description:
          "Administrators, registrars, teachers, and students should not see the same information. The demo should show how access changes by role.",
      },
      {
        title: "Confirm implementation, support, and plan scope",
        description:
          "Get a written list of included modules, additional services, implementation responsibilities, and support channels.",
      },
    ],
    phanyxHeading: "Where PHANYX fits into this comparison",
    phanyxText:
      "PHANYX is a SaaS platform for school and academic management. It brings together tools for students, teachers, programs, classes, enrollment, documents, and digital learning. To evaluate fit, compare your institution's real workflows and confirm which modules are included in the proposed plan.",
    schoolButton: "Explore school software",
    guideButton: "Read the buyer's guide",
    faqHeading: "Frequently asked questions",
    faqs: [
      {
        question:
          "Is online school management software the same as an LMS?",
        answer:
          "No. School management software organizes student records, enrollment, classes, academic records, and administrative workflows. An LMS focuses on digital teaching and learning. Some platforms integrate both.",
      },
      {
        question: "Does online school management software require internet access?",
        answer:
          "Yes. Because the system is accessed online, schools should evaluate connection quality and plan for temporary connectivity issues.",
      },
      {
        question:
          "Can a school migrate from spreadsheets or a local system?",
        answer:
          "Often, yes, but migration should be planned. Confirm supported import formats, the quality of existing records, who will validate migrated data, and what implementation services are included.",
      },
      {
        question:
          "What should schools evaluate before choosing an online system?",
        answer:
          "Review real workflows, permissions, support, implementation, data migration, integrations, module availability, and commercial terms.",
      },
    ],
    relatedHeading: "Related reading",
    relatedGuide: "How to choose school management software",
    relatedEnrollment: "School enrollment management",
    relatedAcademic: "Academic management",
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
    title: "Software de gestión escolar online: cómo funciona | PHANYX",
    description:
      "Descubre cómo funciona un software de gestión escolar online, en qué se diferencia de un sistema local y qué evaluar antes de migrar tu centro a la nube.",
    kicker: "Gestión escolar en la nube",
    heading:
      "Software de gestión escolar online: cómo funciona y cuándo tiene sentido",
    intro:
      "Un software de gestión escolar online se utiliza a través de internet y ayuda a centralizar procesos académicos y administrativos sin depender de una instalación aislada en cada ordenador. Sin embargo, estar en la nube no es suficiente: el centro debe evaluar cómo funcionan en la práctica el alumnado, los grupos, las matrículas, los documentos, las finanzas y los permisos.",
    imageAlt:
      "Reunión de docentes y responsables escolares con una presentación en una pantalla grande, una persona levantando la mano y otra revisando un informe.",
    imageCaption:
      "Equipo escolar analizando indicadores y definiendo los próximos pasos del centro.",
    contents: "En este artículo",
    contentsLinks: {
      how: "Cómo funciona un software escolar online",
      comparison: "Sistema online vs. sistema local",
      when: "Cuándo tiene sentido migrar a la nube",
      migration: "Qué revisar antes de migrar",
    },
    howHeading: "Cómo funciona un software de gestión escolar online",
    howParagraphs: [
      "En lugar de mantener el sistema principal instalado únicamente en un ordenador o servidor local, el equipo accede a la aplicación por internet. Así, el proveedor puede ofrecer el software como servicio y el centro trabaja con una base central de información respetando perfiles y permisos.",
      "La cuestión principal no es solo dónde está alojado el sistema. Una buena implantación debe organizar el recorrido completo: ficha del estudiante, matrícula, curso, grupo, registros académicos, documentos y demás módulos contratados. Si el equipo sigue reconstruyendo datos en hojas de cálculo paralelas, pasar a un sistema online no resuelve el problema de gestión.",
    ],
    comparisonHeading:
      "Software escolar online vs. sistema instalado localmente",
    comparisonIntro:
      "Ambos modelos pueden servir a un centro, pero distribuyen las responsabilidades de forma diferente. La comparación debe tener en cuenta el equipo, la infraestructura disponible y los procesos que deben consultarse fuera de la sede.",
    comparisonLabels: {
      criterion: "Criterio",
      online: "Sistema online",
      local: "Sistema local",
    },
    comparison: [
      {
        criterion: "Acceso",
        online:
          "El sistema se utiliza por internet desde dispositivos autorizados sin instalar la aplicación por separado en cada ordenador.",
        local:
          "El acceso suele depender de la instalación, la red interna o la infraestructura mantenida por el propio centro.",
      },
      {
        criterion: "Actualizaciones",
        online:
          "El proveedor puede publicar las mejoras de forma centralizada para los usuarios del servicio.",
        local:
          "Las actualizaciones pueden requerir intervención sobre la instalación o la infraestructura del centro.",
      },
      {
        criterion: "Trabajo entre sedes",
        online:
          "Puede facilitar el acceso de equipos ubicados en distintos lugares si los permisos y la estructura institucional están bien configurados.",
        local:
          "La conexión entre sedes puede exigir red, servidor u otras soluciones de acceso remoto.",
      },
      {
        criterion: "Infraestructura",
        online:
          "El centro utiliza la aplicación como servicio y debe evaluar conectividad, disponibilidad, soporte y políticas de acceso.",
        local:
          "El centro suele asumir más responsabilidades sobre equipos, servidores, instalación y mantenimiento del entorno.",
      },
    ],
    whenHeading: "Cuándo tiene más sentido un sistema escolar online",
    whenText:
      "El modelo online puede ser especialmente útil cuando distintas áreas necesitan consultar la misma información, hay trabajo fuera de la sede, el centro cuenta con varias unidades o se quiere reducir la dependencia de controles manuales dispersos. Esto no elimina la necesidad de procesos claros: permisos, responsabilidades y calidad de los datos siguen formando parte de la implantación.",
    calloutTitle: "La pregunta correcta no es solo “¿el sistema es online?”",
    calloutText:
      "Pregunta también cómo responde la solución a los procesos reales del centro. Prueba la matrícula, la consulta de grupos, los registros académicos, los documentos y el resto de los flujos antes de comparar propuestas.",
    migrationHeading: "Qué revisar antes de migrar a un sistema online",
    migrationSteps: [
      {
        title: "Mapea los procesos actuales",
        description:
          "Enumera los flujos que hoy dependen de hojas de cálculo, archivos separados o sistemas diferentes. Esto permite identificar qué módulos deben formar parte de la implantación.",
      },
      {
        title: "Revisa la migración de datos",
        description:
          "Confirma qué información puede importarse, en qué formatos, quién realizará la validación y cómo se tratarán los registros inconsistentes antes de la puesta en producción.",
      },
      {
        title: "Prueba los perfiles de acceso",
        description:
          "Administración, secretaría, profesorado y alumnado no necesitan ver la misma información. La demostración debe mostrar cómo cambian los accesos según el perfil.",
      },
      {
        title: "Confirma implantación, soporte y alcance",
        description:
          "Solicita por escrito los módulos incluidos, servicios adicionales, responsabilidades de implantación y canales de soporte.",
      },
    ],
    phanyxHeading: "Dónde encaja PHANYX en esta comparación",
    phanyxText:
      "PHANYX es una plataforma SaaS de gestión escolar y académica. Reúne recursos para alumnado, profesorado, cursos, grupos, matrículas, documentos y enseñanza digital. Para evaluar si encaja en tu centro, compara tus procesos reales y confirma qué módulos están incluidos en la propuesta.",
    schoolButton: "Conocer el software escolar",
    guideButton: "Ver guía de elección",
    faqHeading: "Preguntas frecuentes",
    faqs: [
      {
        question:
          "¿Un software de gestión escolar online es lo mismo que una plataforma EAD?",
        answer:
          "No. La gestión escolar organiza alumnado, matrículas, grupos, expedientes y procesos administrativos. Una plataforma de enseñanza online se centra en el aprendizaje digital. Algunas soluciones integran ambos entornos.",
      },
      {
        question: "¿Un software escolar online necesita internet?",
        answer:
          "Sí. Como el acceso se realiza por internet, el centro debe valorar la calidad de la conexión y prever cómo actuar ante incidencias temporales.",
      },
      {
        question:
          "¿Es posible migrar desde hojas de cálculo o un sistema local?",
        answer:
          "En muchos casos sí, pero la migración debe planificarse. Confirma formatos admitidos, calidad de los datos existentes, responsables de validación y servicios de implantación incluidos.",
      },
      {
        question:
          "¿Qué debe evaluar un centro antes de contratar un sistema online?",
        answer:
          "Revisa los procesos reales, permisos, soporte, implantación, migración de datos, integraciones, módulos disponibles y condiciones comerciales.",
      },
    ],
    relatedHeading: "También te puede interesar",
    relatedGuide: "Cómo elegir software de gestión escolar",
    relatedEnrollment: "Gestión de matrículas escolares",
    relatedAcademic: "Gestión académica",
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
    title: "Logiciel de gestion scolaire en ligne : fonctionnement | PHANYX",
    description:
      "Comprenez le fonctionnement d'un logiciel de gestion scolaire en ligne, ses différences avec un système local et les points à vérifier avant une migration vers le cloud.",
    kicker: "Gestion scolaire dans le cloud",
    heading:
      "Logiciel de gestion scolaire en ligne : fonctionnement et cas d'usage",
    intro:
      "Un logiciel de gestion scolaire en ligne est accessible par internet et aide à centraliser les processus pédagogiques et administratifs sans dépendre d'une installation distincte sur chaque ordinateur. Mais le passage au cloud ne suffit pas : l'établissement doit aussi évaluer la gestion des élèves, des classes, des inscriptions, des documents, des finances et des droits d'accès.",
    imageAlt:
      "Réunion d'enseignants et de responsables scolaires avec une présentation sur grand écran, une personne levant la main et une autre consultant un rapport.",
    imageCaption:
      "L'équipe scolaire analyse des indicateurs et discute des prochaines étapes de l'établissement.",
    contents: "Dans cet article",
    contentsLinks: {
      how: "Comment fonctionne un logiciel scolaire en ligne",
      comparison: "Système en ligne vs. système local",
      when: "Quand le passage au cloud est pertinent",
      migration: "Points à vérifier avant la migration",
    },
    howHeading: "Comment fonctionne un logiciel de gestion scolaire en ligne",
    howParagraphs: [
      "Au lieu de conserver le système principal uniquement sur un ordinateur ou un serveur local, l'équipe accède à l'application par internet. Le fournisseur peut ainsi proposer le logiciel comme un service, tandis que l'établissement travaille avec une base d'information centralisée et des rôles d'accès configurés.",
      "L'enjeu ne se limite pas à l'hébergement. Une bonne mise en œuvre doit couvrir le parcours complet : dossier de l'élève, inscription, formation, classe, données académiques, documents et autres modules souscrits. Si l'équipe continue à reconstruire les informations dans des tableurs parallèles, le passage en ligne ne résout pas le problème de gestion.",
    ],
    comparisonHeading:
      "Logiciel scolaire en ligne vs. système installé localement",
    comparisonIntro:
      "Les deux modèles peuvent répondre aux besoins d'un établissement, mais ils répartissent les responsabilités différemment. La comparaison doit tenir compte de l'équipe, de l'infrastructure existante et des processus qui doivent rester accessibles hors site.",
    comparisonLabels: {
      criterion: "Critère",
      online: "Système en ligne",
      local: "Système local",
    },
    comparison: [
      {
        criterion: "Accès",
        online:
          "Les utilisateurs autorisés accèdent au système par internet sans installer séparément l'application sur chaque ordinateur.",
        local:
          "L'accès dépend souvent de l'installation, du réseau interne ou de l'infrastructure maintenue par l'établissement.",
      },
      {
        criterion: "Mises à jour",
        online:
          "Le fournisseur peut déployer les évolutions de manière centralisée auprès des utilisateurs du service.",
        local:
          "Les mises à jour peuvent nécessiter une intervention sur l'installation ou l'infrastructure de l'établissement.",
      },
      {
        criterion: "Travail multi-sites",
        online:
          "Il peut faciliter l'accès des équipes situées sur plusieurs sites si les rôles et la structure sont correctement configurés.",
        local:
          "La connexion entre sites peut exiger un réseau, un serveur ou d'autres solutions d'accès à distance.",
      },
      {
        criterion: "Infrastructure",
        online:
          "L'établissement utilise l'application comme un service et doit évaluer connectivité, disponibilité, assistance et règles d'accès.",
        local:
          "L'établissement assume généralement davantage de responsabilités liées au matériel, aux serveurs, à l'installation et à la maintenance.",
      },
    ],
    whenHeading:
      "Quand un logiciel de gestion scolaire en ligne est particulièrement pertinent",
    whenText:
      "Le modèle en ligne peut être utile lorsque plusieurs équipes doivent consulter les mêmes informations, lorsque le travail s'effectue aussi hors site, quand l'établissement possède plusieurs implantations ou souhaite réduire les contrôles manuels dispersés. Cela ne supprime pas le besoin de processus clairs : droits d'accès, responsabilités et qualité des données restent essentiels.",
    calloutTitle:
      "La bonne question n'est pas seulement « le système est-il en ligne ? »",
    calloutText:
      "Demandez aussi comment la solution gère les processus réels de l'établissement. Testez l'inscription, la consultation des classes, les dossiers académiques, les documents et les autres flux avant de comparer les offres.",
    migrationHeading: "Que vérifier avant de migrer vers un système en ligne",
    migrationSteps: [
      {
        title: "Cartographiez les processus actuels",
        description:
          "Listez les flux qui reposent encore sur des tableurs, des fichiers séparés ou plusieurs systèmes. Vous identifierez ainsi les modules réellement nécessaires au projet.",
      },
      {
        title: "Analysez la reprise des données",
        description:
          "Confirmez les données importables, les formats pris en charge, les responsables de la validation et la manière dont les incohérences seront traitées avant la mise en production.",
      },
      {
        title: "Testez les droits d'accès",
        description:
          "Administration, secrétariat, enseignants et étudiants ne doivent pas accéder aux mêmes informations. La démonstration doit montrer les différences selon les rôles.",
      },
      {
        title: "Confirmez déploiement, assistance et périmètre",
        description:
          "Demandez par écrit les modules inclus, les services complémentaires, les responsabilités de déploiement et les canaux d'assistance.",
      },
    ],
    phanyxHeading: "Où se situe PHANYX dans cette comparaison",
    phanyxText:
      "PHANYX est une plateforme SaaS de gestion scolaire et académique. Elle réunit des outils pour les étudiants, les enseignants, les formations, les classes, les inscriptions, les documents et l'enseignement numérique. Pour évaluer sa pertinence, comparez vos processus réels et confirmez les modules inclus dans l'offre proposée.",
    schoolButton: "Découvrir le logiciel scolaire",
    guideButton: "Lire le guide de choix",
    faqHeading: "Questions fréquentes",
    faqs: [
      {
        question:
          "Un logiciel de gestion scolaire en ligne est-il identique à une plateforme LMS ?",
        answer:
          "Non. La gestion scolaire organise les élèves, inscriptions, classes, dossiers académiques et processus administratifs. Un LMS est centré sur l'enseignement et l'apprentissage numériques. Certaines plateformes relient les deux.",
      },
      {
        question:
          "Un logiciel de gestion scolaire en ligne nécessite-t-il internet ?",
        answer:
          "Oui. Comme l'accès se fait en ligne, l'établissement doit évaluer la qualité de sa connexion et prévoir la gestion des indisponibilités temporaires.",
      },
      {
        question:
          "Peut-on migrer depuis des tableurs ou un système local ?",
        answer:
          "Souvent oui, mais la migration doit être préparée. Vérifiez les formats pris en charge, la qualité des données existantes, les responsables de validation et les services de reprise inclus.",
      },
      {
        question:
          "Que faut-il évaluer avant de choisir un système en ligne ?",
        answer:
          "Analysez les processus réels, les permissions, l'assistance, le déploiement, la migration des données, les intégrations, les modules disponibles et les conditions commerciales.",
      },
    ],
    relatedHeading: "À lire également",
    relatedGuide: "Comment choisir un logiciel de gestion scolaire",
    relatedEnrollment: "Gestion des inscriptions scolaires",
    relatedAcademic: "Gestion académique",
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
