import type { LocalePhanyx } from "@/i18n/config";

export type MarketingSection = "home" | "academic" | "plans" | "school" | "lms" | "success";

const slugs: Record<LocalePhanyx, { academic: string; plans: string; school: string; lms: string; success: string }> = {
  "pt-BR": { academic: "gestao-academica", plans: "planos", school: "sistema-escolar", lms: "plataforma-ead", success: "sucesso-estudantil" },
  "pt-PT": { academic: "gestao-academica", plans: "planos", school: "software-gestao-escolar", lms: "plataforma-ensino-online", success: "sucesso-estudantes" },
  "en-US": { academic: "academic-management", plans: "plans", school: "school-management-software", lms: "learning-management-system", success: "student-success-platform" },
  "es-ES": { academic: "gestion-academica", plans: "planes", school: "software-gestion-escolar", lms: "plataforma-educacion-online", success: "seguimiento-estudiantes" },
  "fr-FR": { academic: "gestion-academique", plans: "tarifs", school: "logiciel-gestion-scolaire", lms: "plateforme-enseignement-en-ligne", success: "suivi-reussite-etudiants" },
};

export const marketingLocales: LocalePhanyx[] = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"];

export function marketingPath(locale: LocalePhanyx, section: MarketingSection) {
  if (locale === "pt-BR") return section === "home" ? "/" : `/${slugs[locale][section]}`;
  return section === "home" ? `/${locale}` : `/${locale}/${slugs[locale][section]}`;
}

export function marketingSection(locale: LocalePhanyx, slug: string): MarketingSection | null {
  for (const section of ["academic", "plans", "school", "lms", "success"] as const) {
    if (slug === slugs[locale][section]) return section;
  }
  return null;
}

export function marketingAlternates(section: MarketingSection) {
  const locales = section === "home" || section === "academic" || section === "plans"
    ? marketingLocales
    : marketingLocales.filter((locale) => locale !== "pt-BR");
  const fallback = locales.includes("pt-BR") ? "pt-BR" : "en-US";
  return {
    canonical: marketingPath(fallback, section),
    languages: {
      ...Object.fromEntries(locales.map((locale) => [locale, marketingPath(locale, section)])),
      "x-default": marketingPath(fallback, section),
    } as Record<LocalePhanyx | "x-default", string>,
  };
}

type Copy = {
  name: string;
  navAcademic: string;
  navPlans: string;
  contact: string;
  login: string;
  headline: string;
  intro: string;
  seoTitle: string;
  seoDescription: string;
  homeTitle: string;
  homeDescription: string;
  plansTitle: string;
  plansDescription: string;
  featuresTitle: string;
  featuresDescription: string;
  features: { title: string; description: string }[];
  tiersTitle: string;
  tiers: { name: string; description: string; marketPrice: string }[];
  pricingNote: string;
  askProposal: string;
};

export const marketingCopy: Record<LocalePhanyx, Copy> = {
  "pt-BR": {
    name: "Português (Brasil)", navAcademic: "Gestão acadêmica", navPlans: "Planos", contact: "Falar com especialista", login: "Entrar",
    headline: "Sistema de gestão acadêmica para instituições de ensino",
    intro: "Gestão acadêmica, ensino digital, biblioteca, mobilidade internacional, editais e captação de alunos em uma plataforma para sua instituição.",
    seoTitle: "Sistema de Gestão Acadêmica para Instituições | PHANYX",
    seoDescription: "Conheça o PHANYX: gestão acadêmica, biblioteca virtual, mobilidade internacional, editais, sucesso estudantil e captação de leads.",
    homeTitle: "PHANYX | Plataforma de gestão acadêmica e educacional",
    homeDescription: "Plataforma acadêmica para instituições: ensino, biblioteca virtual, mobilidade, editais, sucesso estudantil e setor comercial.",
    plansTitle: "Planos da plataforma de gestão acadêmica | PHANYX",
    plansDescription: "Compare os planos PHANYX e conheça biblioteca virtual, mobilidade, editais, sucesso estudantil, captação de leads e cinco idiomas.",
    featuresTitle: "Novidades da plataforma", featuresDescription: "Conheça as soluções que ampliam o trabalho acadêmico e comercial da instituição.",
    features: [
      { title: "Biblioteca virtual", description: "Catálogo, acervo digital e acesso para alunos e professores." },
      { title: "Mobilidade internacional", description: "Convênios, ofertas, candidaturas e acompanhamento da mobilidade." },
      { title: "Publicação de editais", description: "Divulgação e gestão de oportunidades e processos institucionais." },
      { title: "Sucesso estudantil em tempo real", description: "Indicadores para acompanhar o percurso e apoiar cada estudante." },
      { title: "Setor comercial e captação de leads", description: "Formulários, campanhas, funil, equipes e relacionamento comercial." },
      { title: "Atividades externas", description: "Planeje excursões e visitas técnicas com participantes, autorizações, equipe e transporte." },
      { title: "Emissão de crachás", description: "Crie modelos e emita crachás individuais ou em lote." },
      { title: "Cadastro de visitantes", description: "Registre e acompanhe os visitantes da instituição." },
      { title: "Editor de certificados", description: "Crie e edite certificados; no Enterprise, mantenha mais de 20 modelos ativos ao mesmo tempo." },
      { title: "Disponível em cinco idiomas", description: "Português do Brasil, português de Portugal, inglês, espanhol e francês." },
    ],
    tiersTitle: "Escolha o plano para sua instituição",
    tiers: [
      { name: "Essencial", description: "Base acadêmica, áreas de acesso, financeiro e documentos para começar. 1 modelo ativo de certificado.", marketPrice: "Brasil: R$ 49/mês + R$ 3 por aluno ativo; 1 unidade incluída." },
      { name: "Profissional", description: "Operação acadêmica ampliada com LMS, crachás, RH e até 20 modelos ativos de certificado.", marketPrice: "Brasil: R$ 99/mês + R$ 5 por aluno ativo; até 3 unidades incluídas." },
      { name: "Enterprise", description: "Mais escala, personalização, integrações e modelos ativos de certificado ilimitados.", marketPrice: "Brasil: R$ 199/mês + R$ 7 por aluno ativo; unidades definidas em contrato." },
    ],
    pricingNote: "Os preços exibidos na página brasileira estão em reais. Disponibilidade dos novos módulos e condições em outros países são confirmadas na proposta comercial.",
    askProposal: "Solicitar proposta",
  },
  "pt-PT": {
    name: "Português (Portugal)", navAcademic: "Gestão académica", navPlans: "Planos", contact: "Falar com um especialista", login: "Entrar",
    headline: "Software de gestão académica para instituições de ensino",
    intro: "Gestão académica, ensino digital, biblioteca, mobilidade internacional, editais e captação de alunos numa só plataforma.",
    seoTitle: "Software de Gestão Académica para Instituições | PHANYX",
    seoDescription: "Conheça o PHANYX: gestão académica, biblioteca virtual, mobilidade internacional, editais, sucesso dos estudantes e captação de contactos.",
    homeTitle: "PHANYX | Plataforma de gestão académica",
    homeDescription: "Plataforma académica com biblioteca virtual, mobilidade internacional, editais, sucesso dos estudantes e área comercial.",
    plansTitle: "Planos da plataforma de gestão académica | PHANYX",
    plansDescription: "Compare os planos PHANYX e conheça os módulos de biblioteca, mobilidade, editais, sucesso estudantil e captação de contactos.",
    featuresTitle: "Novidades da plataforma", featuresDescription: "Soluções que ampliam o trabalho académico e comercial da instituição.",
    features: [
      { title: "Biblioteca virtual", description: "Catálogo, acervo digital e acesso para estudantes e docentes." },
      { title: "Mobilidade internacional", description: "Protocolos, ofertas, candidaturas e acompanhamento da mobilidade." },
      { title: "Publicação de editais", description: "Divulgação e gestão de oportunidades e processos institucionais." },
      { title: "Sucesso estudantil em tempo real", description: "Indicadores para acompanhar o percurso e apoiar cada estudante." },
      { title: "Área comercial e captação de contactos", description: "Formulários, campanhas, funil, equipas e relacionamento comercial." },
      { title: "Atividades externas", description: "Planeie excursões e visitas de estudo com participantes, autorizações, equipa e transporte." },
      { title: "Emissão de cartões de identificação", description: "Crie modelos e emita cartões individualmente ou em lote." },
      { title: "Registo de visitantes", description: "Registe e acompanhe os visitantes da instituição." },
      { title: "Editor de certificados", description: "Crie e edite certificados; no Enterprise, mantenha mais de 20 modelos ativos em simultâneo." },
      { title: "Disponível em cinco idiomas", description: "Português do Brasil, português de Portugal, inglês, espanhol e francês." },
    ],
    tiersTitle: "Escolha o plano para a sua instituição",
    tiers: [
      { name: "Essencial", description: "Base académica, áreas de acesso, finanças e documentos. 1 modelo de certificado ativo.", marketPrice: "Portugal: 25 €/mês + 0,75 € por estudante ativo; 1 unidade incluída." },
      { name: "Profissional", description: "Operação ampliada com LMS, cartões, RH e até 20 modelos de certificado ativos.", marketPrice: "Portugal: 49 €/mês + 1,25 € por estudante ativo; até 3 unidades incluídas." },
      { name: "Enterprise", description: "Mais escala, personalização, integrações e modelos de certificado ativos ilimitados.", marketPrice: "Portugal: 99 €/mês + 1,75 € por estudante ativo; unidades definidas por contrato." },
    ],
    pricingNote: "Valores de referência em euros para Portugal. O período experimental e a faturação em euros requerem proposta comercial; a adesão automática atual cobra em reais.",
    askProposal: "Pedir proposta",
  },
  "en-US": {
    name: "English", navAcademic: "Academic management", navPlans: "Plans", contact: "Talk to an expert", login: "Sign in",
    headline: "Academic management software for educational institutions",
    intro: "Bring academic operations, digital learning, a virtual library, international mobility, calls for applications and student recruitment together in one platform.",
    seoTitle: "Academic Management Software for Institutions | PHANYX",
    seoDescription: "Explore PHANYX academic management software with a virtual library, international mobility, calls for applications, student success insights and lead capture.",
    homeTitle: "PHANYX | Academic Management Software",
    homeDescription: "Academic management platform with a virtual library, international mobility, calls for applications, student success insights and lead capture.",
    plansTitle: "Academic Management Software Plans | PHANYX",
    plansDescription: "Compare PHANYX plans and explore the virtual library, mobility, calls for applications, student success and lead capture modules.",
    featuresTitle: "What's new", featuresDescription: "Explore tools for academic teams and student recruitment.",
    features: [
      { title: "Virtual library", description: "Catalog, digital collection and access for students and teachers." },
      { title: "International mobility", description: "Partner agreements, opportunities, applications and mobility tracking." },
      { title: "Calls for applications", description: "Publish and manage institutional opportunities and application processes." },
      { title: "Real-time student success", description: "Follow student progress and identify where support is needed." },
      { title: "Sales and lead capture", description: "Forms, campaigns, pipeline, teams and prospect management." },
      { title: "Off-campus activities", description: "Plan trips and field visits with participants, permissions, staff and transport." },
      { title: "ID badge issuance", description: "Design badges and issue them individually or in batches." },
      { title: "Visitor registration", description: "Register and track visitors to your institution." },
      { title: "Certificate editor", description: "Design and edit certificates; Enterprise supports more than 20 active templates at once." },
      { title: "Five languages", description: "Brazilian and European Portuguese, English, Spanish and French." },
    ],
    tiersTitle: "Find the right plan for your institution",
    tiers: [
      { name: "Essential", description: "Academic essentials, portals, finance and documents. 1 active certificate template.", marketPrice: "US: $29/month + $1 per active student; 1 unit included." },
      { name: "Professional", description: "Broader operations with LMS, ID badges, HR and up to 20 active certificate templates.", marketPrice: "US: $59/month + $1.50 per active student; up to 3 units included." },
      { name: "Enterprise", description: "More scale, customization, integrations and unlimited active certificate templates.", marketPrice: "US: $119/month + $2 per active student; units set by contract." },
    ],
    pricingNote: "US dollar price list for US institutions. The free trial and USD billing require a commercial proposal; the current self-service checkout charges in Brazilian reais.",
    askProposal: "Request a proposal",
  },
  "es-ES": {
    name: "Español", navAcademic: "Gestión académica", navPlans: "Planes", contact: "Hablar con un especialista", login: "Iniciar sesión",
    headline: "Software de gestión académica para instituciones educativas",
    intro: "Gestión académica, enseñanza digital, biblioteca virtual, movilidad internacional, convocatorias y captación de estudiantes en una plataforma.",
    seoTitle: "Software de Gestión Académica para Instituciones | PHANYX",
    seoDescription: "Descubre PHANYX: gestión académica, biblioteca virtual, movilidad internacional, convocatorias, éxito estudiantil y captación de clientes potenciales.",
    homeTitle: "PHANYX | Plataforma de gestión académica",
    homeDescription: "Plataforma académica con biblioteca virtual, movilidad, convocatorias, seguimiento estudiantil y captación de clientes potenciales.",
    plansTitle: "Planes de software de gestión académica | PHANYX",
    plansDescription: "Compara los planes PHANYX y descubre la biblioteca, la movilidad, las convocatorias, el seguimiento estudiantil y la captación.",
    featuresTitle: "Novedades de la plataforma", featuresDescription: "Soluciones para la gestión académica y comercial de tu institución.",
    features: [
      { title: "Biblioteca virtual", description: "Catálogo, colección digital y acceso para estudiantes y docentes." },
      { title: "Movilidad internacional", description: "Convenios, oportunidades, solicitudes y seguimiento de la movilidad." },
      { title: "Publicación de convocatorias", description: "Publica y gestiona oportunidades y procesos institucionales." },
      { title: "Éxito estudiantil en tiempo real", description: "Sigue el progreso de cada estudiante y detecta necesidades de apoyo." },
      { title: "Área comercial y captación de clientes potenciales", description: "Formularios, campañas, embudo, equipos y gestión comercial." },
      { title: "Actividades fuera del centro", description: "Planifica excursiones y visitas con participantes, autorizaciones, personal y transporte." },
      { title: "Emisión de acreditaciones", description: "Diseña y emite acreditaciones individuales o en lotes." },
      { title: "Registro de visitantes", description: "Registra y supervisa las visitas a la institución." },
      { title: "Editor de certificados", description: "Crea y edita certificados; Enterprise admite más de 20 modelos activos a la vez." },
      { title: "Cinco idiomas", description: "Portugués de Brasil y Portugal, inglés, español y francés." },
    ],
    tiersTitle: "Elige el plan para tu institución",
    tiers: [
      { name: "Esencial", description: "Gestión académica, portales, finanzas y documentos. 1 modelo de certificado activo.", marketPrice: "España: 25 €/mes + 0,75 € por estudiante activo; 1 unidad incluida." },
      { name: "Profesional", description: "Operación ampliada con LMS, acreditaciones, RR. HH. y hasta 20 modelos de certificado activos.", marketPrice: "España: 49 €/mes + 1,25 € por estudiante activo; hasta 3 unidades incluidas." },
      { name: "Enterprise", description: "Más escala, personalización, integraciones y modelos de certificado activos ilimitados.", marketPrice: "España: 99 €/mes + 1,75 € por estudiante activo; unidades según contrato." },
    ],
    pricingNote: "Precios de referencia en euros para España. La prueba y la facturación en euros requieren una propuesta; el pago automático actual se realiza en reales brasileños.",
    askProposal: "Solicitar propuesta",
  },
  "fr-FR": {
    name: "Français", navAcademic: "Gestion académique", navPlans: "Offres", contact: "Parler à un spécialiste", login: "Connexion",
    headline: "Logiciel de gestion académique pour établissements d'enseignement",
    intro: "Réunissez la gestion académique, l'enseignement numérique, la bibliothèque virtuelle, la mobilité internationale, les appels à candidatures et le recrutement étudiant.",
    seoTitle: "Logiciel de Gestion Académique pour Établissements | PHANYX",
    seoDescription: "Découvrez PHANYX : gestion académique, bibliothèque virtuelle, mobilité internationale, appels à candidatures, réussite étudiante et prospection.",
    homeTitle: "PHANYX | Plateforme de gestion académique",
    homeDescription: "Plateforme académique avec bibliothèque virtuelle, mobilité, appels à candidatures, suivi des étudiants et prospection.",
    plansTitle: "Offres du logiciel de gestion académique | PHANYX",
    plansDescription: "Comparez les offres PHANYX et découvrez la bibliothèque, la mobilité, les appels à candidatures, le suivi des étudiants et la prospection.",
    featuresTitle: "Nouveautés de la plateforme", featuresDescription: "Des outils pour les équipes pédagogiques et le recrutement étudiant.",
    features: [
      { title: "Bibliothèque virtuelle", description: "Catalogue, collection numérique et accès pour les étudiants et enseignants." },
      { title: "Mobilité internationale", description: "Accords, opportunités, candidatures et suivi de la mobilité." },
      { title: "Publication d'appels à candidatures", description: "Publiez et gérez les opportunités et procédures de votre établissement." },
      { title: "Réussite étudiante en temps réel", description: "Suivez la progression des étudiants et identifiez leurs besoins." },
      { title: "Équipe commerciale et prospection", description: "Formulaires, campagnes, pipeline, équipes et gestion des prospects." },
      { title: "Activités hors établissement", description: "Planifiez voyages et visites avec participants, autorisations, équipe et transport." },
      { title: "Émission de badges", description: "Créez des modèles et émettez des badges individuellement ou par lots." },
      { title: "Registre des visiteurs", description: "Enregistrez et suivez les visiteurs de votre établissement." },
      { title: "Éditeur de certificats", description: "Créez et modifiez des certificats ; Enterprise permet plus de 20 modèles actifs simultanément." },
      { title: "Cinq langues", description: "Portugais du Brésil et du Portugal, anglais, espagnol et français." },
    ],
    tiersTitle: "Choisissez une offre pour votre établissement",
    tiers: [
      { name: "Essentiel", description: "Gestion académique, portails, finances et documents. 1 modèle de certificat actif.", marketPrice: "France : 25 €/mois + 0,75 € par étudiant actif ; 1 unité incluse." },
      { name: "Professionnel", description: "Fonctions étendues avec LMS, badges, RH et jusqu'à 20 modèles de certificat actifs.", marketPrice: "France : 49 €/mois + 1,25 € par étudiant actif ; jusqu'à 3 unités incluses." },
      { name: "Enterprise", description: "Plus d'évolutivité, de personnalisation, d'intégrations et de modèles de certificat actifs illimités.", marketPrice: "France : 99 €/mois + 1,75 € par étudiant actif ; unités définies par contrat." },
    ],
    pricingNote: "Tarifs indicatifs en euros pour la France. L’essai et la facturation en euros nécessitent une proposition ; le paiement automatique actuel est en réals brésiliens.",
    askProposal: "Demander un devis",
  },
};
