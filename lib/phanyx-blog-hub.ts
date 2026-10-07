import type { Metadata } from "next";
import type { LocalePhanyx } from "@/i18n/config";
import { marketingPath } from "@/lib/public-marketing";
import { imageToolsArticlePath } from "@/lib/image-tools-blog";
import { backgroundRemoverPath } from "@/lib/background-remover-i18n";
import { schoolGuidePath } from "@/lib/school-guide";
import { onlineSchoolArticlePath } from "@/lib/online-school-management-article";
import { digitalSchoolArticlePath } from "@/lib/digital-school-management-article";

export const phanyxBlogLocales: LocalePhanyx[] = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"];

export function phanyxBlogPath(locale: LocalePhanyx) {
  return locale === "pt-BR" ? "/blog" : `/${locale}/blog`;
}

export function phanyxBlogLanguagePaths() {
  return Object.fromEntries(phanyxBlogLocales.map((locale) => [locale, phanyxBlogPath(locale)])) as Record<LocalePhanyx, string>;
}

export const blogHeroImage: Record<LocalePhanyx, string> = {
  "pt-BR": "/images/blog-hub/i18n/pt-BR/overview.webp",
  "pt-PT": "/images/blog-hub/i18n/pt-PT/overview.webp",
  "en-US": "/images/blog-hub/i18n/en-US/overview.webp",
  "es-ES": "/images/blog-hub/i18n/es-ES/overview.webp",
  "fr-FR": "/images/blog-hub/i18n/fr-FR/overview.webp",
};

export const editorHeroImage: Record<LocalePhanyx, string> = {
  "pt-BR": "/images/blog-hub/i18n/pt-BR/image-tools.webp",
  "pt-PT": "/images/blog-hub/i18n/pt-PT/image-tools.webp",
  "en-US": "/images/blog-hub/i18n/en-US/image-tools.webp",
  "es-ES": "/images/blog-hub/i18n/es-ES/image-tools.webp",
  "fr-FR": "/images/blog-hub/i18n/fr-FR/image-tools.webp",
};

export const rankingImage: Record<LocalePhanyx, string> = {
  "pt-BR": "/images/melhores-removedores-2027-pt-BR.webp",
  "pt-PT": "/images/melhores-removedores-2027-pt-PT.webp",
  "en-US": "/images/melhores-removedores-2027-en-US.webp",
  "es-ES": "/images/melhores-removedores-2027-es-ES.webp",
  "fr-FR": "/images/melhores-removedores-2027-fr-FR.webp",
};

export type BlogHubCopy = {
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  heading: string;
  intro: string;
  heroAlt: string;
  platformKicker: string;
  platformHeading: string;
  platformIntro: string;
  readMore: string;
  toolsKicker: string;
  toolsHeading: string;
  toolsIntro: string;
  rankingEyebrow: string;
  rankingTitle: string;
  rankingDescription: string;
  rankingButton: string;
  removerButton: string;
  editorEyebrow: string;
  editorTitle: string;
  editorDescription: string;
  editorButton: string;
  openEditorButton: string;
  managementKicker: string;
  managementHeading: string;
  managementIntro: string;
  trialKicker: string;
  trialHeading: string;
  trialText: string;
  trialButton: string;
  adminArea: string;
  departments: string;
  teacherArea: string;
  studentArea: string;
  referenceHeading: string;
  referenceText: string;
  explore: string;
  rights: string;
  managementArticles: Array<{ href: string; title: string; description: string }>;
};

const ptBRArticles = [
  ["/blog/sistema-gestao-escolar", "Melhor sistema de gestão escolar em 2027", "Descubra como escolher o melhor sistema escolar para sua instituição."],
  ["/blog/sistema-escolar-gratis-vs-pago", "Sistema escolar grátis vs pago: qual escolher?", "Compare vantagens e descubra qual opção faz mais sentido para sua instituição."],
  ["/blog/como-aumentar-matriculas-com-sistema-escolar-moderno", "Como aumentar matrículas com um sistema escolar moderno", "Veja como organizar sua instituição e aumentar conversão de alunos."],
  ["/blog/plataforma-ead-para-cursos-livres", "Plataforma EAD para cursos livres", "Veja como estruturar cursos online com uma plataforma profissional."],
  ["/blog/gestao-academica-na-pratica", "Gestão acadêmica na prática", "Veja como organizar sua instituição com gestão acadêmica eficiente."],
  ["/blog/como-reduzir-inadimplencia-escolar-com-tecnologia", "Como reduzir inadimplência escolar com tecnologia", "Veja como controlar pagamentos e reduzir atrasos em sua instituição."],
  ["/blog/controle-financeiro-para-escolas", "Controle financeiro para escolas", "Veja como organizar o financeiro da sua instituição de ensino."],
  ["/blog/sistema-para-cursos-profissionalizantes", "Sistema para cursos profissionalizantes", "Veja como organizar cursos técnicos e profissionalizantes com tecnologia."],
  ["/blog/sistema-de-gestao-escolar-online", "Sistema de gestão escolar online", "Veja como organizar sua instituição com um sistema online completo."],
  ["/blog/melhor-sistema-academico", "Melhor sistema acadêmico em 2027", "Veja como escolher a melhor plataforma acadêmica para sua instituição."],
  ["/blog/sistema-escolar-para-pequenas-escolas", "Sistema escolar para pequenas escolas", "Veja como pequenas escolas podem se organizar com tecnologia."],
  ["/blog/plataforma-para-ensino-online", "Plataforma para ensino online", "Veja como estruturar cursos digitais com uma plataforma completa."],
  ["/blog/melhor-plataforma-para-cursos-online", "Melhor plataforma para cursos online", "Veja como escolher a melhor plataforma para vender cursos online."],
  ["/blog/como-vender-cursos-online", "Como vender cursos online", "Veja como criar e vender cursos digitais com uma plataforma profissional."],
  ["/blog/como-montar-um-curso-online", "Como montar um curso online", "Veja como criar um curso digital do zero."],
  ["/blog/quanto-custa-criar-um-curso-online", "Quanto custa criar um curso online", "Veja quanto investir para começar no ensino digital."],
  ["/blog/plataforma-para-escolas-online", "Plataforma para escolas online", "Veja como modernizar sua instituição com uma plataforma digital completa."],
  ["/blog/gestao-escolar-digital", "Gestão escolar digital", "Veja como modernizar a gestão da sua instituição."],
  ["/blog/sistema-academico-completo", "Sistema acadêmico completo", "Veja como organizar toda a gestão acadêmica da sua instituição."],
].map(([href, title, description]) => ({ href, title, description }));

function intlArticles(locale: LocalePhanyx, labels: [string, string, string, string, string, string]) {
  return [
    { href: schoolGuidePath(locale), title: labels[0], description: labels[1] },
    { href: onlineSchoolArticlePath(locale), title: labels[2], description: labels[3] },
    { href: digitalSchoolArticlePath(locale), title: labels[4], description: labels[5] },
  ];
}

export const phanyxBlogCopy: Record<LocalePhanyx, BlogHubCopy> = {
  "pt-BR": {
    metaTitle: "Blog PHANYX | Gestão Escolar, EAD e Ferramentas Online",
    metaDescription: "Encontre rapidamente respostas sobre gestão escolar, gestão acadêmica, biblioteca, financeiro, RH, captação de alunos, intercâmbio e ferramentas online.",
    kicker: "Respostas práticas para instituições de ensino",
    heading: "Blog PHANYX",
    intro: "Encontre rapidamente conteúdos sobre gestão escolar, operação acadêmica, financeiro, biblioteca, RH, captação, ensino digital e ferramentas online.",
    heroAlt: "PHANYX como plataforma completa e integrada para instituições de ensino",
    platformKicker: "Conheça a plataforma",
    platformHeading: "O que o PHANYX pode fazer pela sua instituição?",
    platformIntro: "Vá direto ao setor que deseja conhecer. Cada assunto abre numa nova guia com uma página própria, imagem e explicação detalhada.",
    readMore: "Saiba mais ↗",
    toolsKicker: "Ferramentas gratuitas PHANYX",
    toolsHeading: "Guias para editar imagens e remover fundos online",
    toolsIntro: "As ferramentas básicas funcionam online e são gratuitas. Tratamentos avançados com IA são opcionais e utilizam créditos somente quando escolhidos.",
    rankingEyebrow: "Comparativo 2027",
    rankingTitle: "5 melhores removedores de fundo grátis online",
    rankingDescription: "Compare PHANYX, Pixlr, Pixelcut, Photoroom e remove.bg e veja qual ferramenta combina melhor com o seu fluxo de trabalho.",
    rankingButton: "Ler comparativo",
    removerButton: "Remover fundo agora",
    editorEyebrow: "Edição de imagem online",
    editorTitle: "Editor de imagens grátis e online",
    editorDescription: "Recorte, apague, restaure, refine bordas e exporte imagens direto no navegador, sem instalar programas pesados.",
    editorButton: "Ler guia de edição",
    openEditorButton: "Abrir editor PHANYX",
    managementKicker: "Guias e artigos",
    managementHeading: "Gestão escolar e ensino digital",
    managementIntro: "Respostas mais aprofundadas para decisões de gestão, tecnologia, operação acadêmica e crescimento institucional.",
    trialKicker: "Conheça a plataforma",
    trialHeading: "Teste o PHANYX por 3 meses sem custo",
    trialText: "A adesão utiliza cartão, mas o valor só é cobrado se a assinatura não for cancelada dentro do período de 3 meses. Se houver cancelamento antes do fim, o acesso continua até completar os 3 meses, sem custo adicional.",
    trialButton: "Ver planos e condições",
    adminArea: "Área administrativa",
    departments: "Departamentos",
    teacherArea: "Área do professor",
    studentArea: "Área do aluno",
    referenceHeading: "PHANYX como referência em tecnologia educacional",
    referenceText: "O blog reúne conteúdo prático sobre gestão acadêmica, biblioteca, comercial, financeiro, RH, mobilidade, documentos e tecnologia para instituições que desejam trabalhar com mais integração e menos retrabalho.",
    explore: "Explorar",
    rights: "Todos os direitos reservados.",
    managementArticles: ptBRArticles,
  },
  "pt-PT": {
    metaTitle: "Blog PHANYX | Gestão Escolar, EAD e Ferramentas Online",
    metaDescription: "Encontre rapidamente respostas sobre gestão escolar, gestão académica, biblioteca, financeiro, RH, captação, mobilidade e ferramentas online.",
    kicker: "Respostas práticas para instituições de ensino",
    heading: "Blog PHANYX",
    intro: "Encontre rapidamente conteúdos sobre gestão escolar, operação académica, financeiro, biblioteca, RH, captação, ensino digital e ferramentas online.",
    heroAlt: "PHANYX como plataforma completa e integrada para instituições de ensino",
    platformKicker: "Conheça a plataforma",
    platformHeading: "O que pode o PHANYX fazer pela sua instituição?",
    platformIntro: "Vá diretamente à área que pretende conhecer. Cada tema abre num novo separador com uma página própria, imagem e explicação detalhada.",
    readMore: "Saber mais ↗",
    toolsKicker: "Ferramentas gratuitas PHANYX",
    toolsHeading: "Guias para editar imagens e remover fundos online",
    toolsIntro: "As ferramentas básicas funcionam online e são gratuitas. Os tratamentos avançados com IA são opcionais e utilizam créditos apenas quando escolhidos.",
    rankingEyebrow: "Comparativo 2027",
    rankingTitle: "5 melhores removedores de fundo grátis online",
    rankingDescription: "Compare PHANYX, Pixlr, Pixelcut, Photoroom e remove.bg e escolha a solução mais adequada ao seu fluxo.",
    rankingButton: "Ler comparativo",
    removerButton: "Remover fundo agora",
    editorEyebrow: "Edição de imagem online",
    editorTitle: "Editor de imagens grátis online",
    editorDescription: "Recorte, apague, restaure, refine contornos e exporte imagens diretamente no navegador.",
    editorButton: "Ler guia de edição",
    openEditorButton: "Abrir editor PHANYX",
    managementKicker: "Guias e artigos",
    managementHeading: "Gestão escolar e ensino digital",
    managementIntro: "Respostas aprofundadas para decisões de gestão, tecnologia, operação académica e crescimento institucional.",
    trialKicker: "Conheça a plataforma",
    trialHeading: "Teste o PHANYX durante 3 meses sem custo",
    trialText: "A adesão utiliza cartão, mas o valor só é cobrado se a subscrição não for cancelada durante os 3 meses. Se cancelar antes do fim, o acesso mantém-se até completar os 3 meses, sem custo adicional.",
    trialButton: "Ver planos e condições",
    adminArea: "Área administrativa",
    departments: "Departamentos",
    teacherArea: "Área do professor",
    studentArea: "Área do aluno",
    referenceHeading: "PHANYX como referência em tecnologia educacional",
    referenceText: "Conteúdo prático sobre gestão académica, biblioteca, comercial, financeiro, RH, mobilidade, documentos e tecnologia para instituições que procuram mais integração.",
    explore: "Explorar",
    rights: "Todos os direitos reservados.",
    managementArticles: intlArticles("pt-PT", ["Guia de gestão escolar", "Como escolher e modernizar a gestão da instituição.", "Sistema de gestão escolar online", "Como organizar a instituição numa plataforma online completa.", "Gestão escolar digital", "Como digitalizar processos e reduzir trabalho manual."]),
  },
  "en-US": {
    metaTitle: "PHANYX Blog | School Management, LMS and Online Tools",
    metaDescription: "Quick answers about school management, academic operations, library, finance, HR, admissions, international mobility and online tools.",
    kicker: "Practical answers for education institutions",
    heading: "PHANYX Blog",
    intro: "Quickly find content about school management, academic operations, finance, library, HR, admissions, online learning and web tools.",
    heroAlt: "PHANYX integrated platform for education institutions",
    platformKicker: "Explore the platform",
    platformHeading: "What can PHANYX do for your institution?",
    platformIntro: "Go straight to the area you want to understand. Each topic opens in a new tab with its own page, illustration and detailed explanation.",
    readMore: "Learn more ↗",
    toolsKicker: "Free PHANYX tools",
    toolsHeading: "Guides to edit images and remove backgrounds online",
    toolsIntro: "Core tools work online for free. Advanced AI treatments are optional and use credits only when you choose them.",
    rankingEyebrow: "2027 comparison",
    rankingTitle: "5 best free online background removers",
    rankingDescription: "Compare PHANYX, Pixlr, Pixelcut, Photoroom and remove.bg to find the best fit for your workflow.",
    rankingButton: "Read comparison",
    removerButton: "Remove background now",
    editorEyebrow: "Online image editing",
    editorTitle: "Free online image editor",
    editorDescription: "Crop, erase, restore, refine edges and export images directly in your browser.",
    editorButton: "Read editing guide",
    openEditorButton: "Open PHANYX editor",
    managementKicker: "Guides and articles",
    managementHeading: "School management and digital learning",
    managementIntro: "Deeper answers for decisions about management, technology, academic operations and institutional growth.",
    trialKicker: "Explore PHANYX",
    trialHeading: "Try PHANYX for 3 months at no cost",
    trialText: "A card is required to start, but you are only charged if the subscription is not canceled during the 3-month period. If you cancel earlier, access continues until the three months are complete, at no additional cost.",
    trialButton: "View plans and terms",
    adminArea: "Administrative area",
    departments: "Departments",
    teacherArea: "Teacher area",
    studentArea: "Student area",
    referenceHeading: "PHANYX as an education technology reference",
    referenceText: "The blog brings together practical content on academic management, library operations, admissions, finance, HR, mobility, documents and technology for institutions that want more integration and less rework.",
    explore: "Explore",
    rights: "All rights reserved.",
    managementArticles: intlArticles("en-US", ["School management guide", "How to choose and modernize your institution's management.", "Online school management system", "How to organize your institution with a complete online platform.", "Digital school management", "How to digitize processes and reduce manual work."]),
  },
  "es-ES": {
    metaTitle: "Blog PHANYX | Gestión Escolar, E-learning y Herramientas Online",
    metaDescription: "Respuestas rápidas sobre gestión escolar, operaciones académicas, biblioteca, finanzas, RR. HH., captación, movilidad y herramientas online.",
    kicker: "Respuestas prácticas para instituciones educativas",
    heading: "Blog PHANYX",
    intro: "Encuentra rápidamente contenidos sobre gestión escolar, operación académica, finanzas, biblioteca, RR. HH., captación, enseñanza digital y herramientas online.",
    heroAlt: "PHANYX como plataforma integrada para instituciones educativas",
    platformKicker: "Conoce la plataforma",
    platformHeading: "¿Qué puede hacer PHANYX por tu institución?",
    platformIntro: "Ve directamente al área que quieres conocer. Cada tema se abre en una pestaña nueva con su propia página, imagen y explicación detallada.",
    readMore: "Saber más ↗",
    toolsKicker: "Herramientas gratuitas PHANYX",
    toolsHeading: "Guías para editar imágenes y eliminar fondos online",
    toolsIntro: "Las herramientas básicas funcionan online y son gratuitas. Los tratamientos avanzados con IA son opcionales y usan créditos solo cuando los eliges.",
    rankingEyebrow: "Comparativa 2027",
    rankingTitle: "5 mejores eliminadores de fondo gratis online",
    rankingDescription: "Compara PHANYX, Pixlr, Pixelcut, Photoroom y remove.bg y elige la opción más adecuada para tu flujo.",
    rankingButton: "Leer comparativa",
    removerButton: "Eliminar fondo ahora",
    editorEyebrow: "Edición de imágenes online",
    editorTitle: "Editor de imágenes gratis online",
    editorDescription: "Recorta, borra, restaura, perfecciona bordes y exporta imágenes directamente en el navegador.",
    editorButton: "Leer guía de edición",
    openEditorButton: "Abrir editor PHANYX",
    managementKicker: "Guías y artículos",
    managementHeading: "Gestión escolar y enseñanza digital",
    managementIntro: "Respuestas más profundas para decisiones de gestión, tecnología, operación académica y crecimiento institucional.",
    trialKicker: "Conoce PHANYX",
    trialHeading: "Prueba PHANYX durante 3 meses sin coste",
    trialText: "Se requiere tarjeta para iniciar, pero solo se cobra si la suscripción no se cancela durante los 3 meses. Si cancelas antes, el acceso continúa hasta completar el periodo sin coste adicional.",
    trialButton: "Ver planes y condiciones",
    adminArea: "Área administrativa",
    departments: "Departamentos",
    teacherArea: "Área del profesor",
    studentArea: "Área del alumno",
    referenceHeading: "PHANYX como referencia en tecnología educativa",
    referenceText: "Contenido práctico sobre gestión académica, biblioteca, comercial, finanzas, RR. HH., movilidad, documentos y tecnología para instituciones que buscan más integración.",
    explore: "Explorar",
    rights: "Todos los derechos reservados.",
    managementArticles: intlArticles("es-ES", ["Guía de gestión escolar", "Cómo elegir y modernizar la gestión de tu institución.", "Sistema de gestión escolar online", "Cómo organizar tu institución con una plataforma online completa.", "Gestión escolar digital", "Cómo digitalizar procesos y reducir trabajo manual."]),
  },
  "fr-FR": {
    metaTitle: "Blog PHANYX | Gestion Scolaire, E-learning et Outils en Ligne",
    metaDescription: "Réponses rapides sur la gestion scolaire, les opérations académiques, la bibliothèque, la finance, les RH, les admissions et les outils en ligne.",
    kicker: "Réponses pratiques pour les établissements d'enseignement",
    heading: "Blog PHANYX",
    intro: "Trouvez rapidement des contenus sur la gestion scolaire, les opérations académiques, la finance, la bibliothèque, les RH, les admissions, l'enseignement numérique et les outils en ligne.",
    heroAlt: "PHANYX, plateforme intégrée pour les établissements d'enseignement",
    platformKicker: "Découvrir la plateforme",
    platformHeading: "Que peut faire PHANYX pour votre établissement ?",
    platformIntro: "Accédez directement au domaine qui vous intéresse. Chaque sujet s'ouvre dans un nouvel onglet avec sa propre page, son illustration et une explication détaillée.",
    readMore: "En savoir plus ↗",
    toolsKicker: "Outils gratuits PHANYX",
    toolsHeading: "Guides pour modifier des images et supprimer les arrière-plans en ligne",
    toolsIntro: "Les outils de base fonctionnent gratuitement en ligne. Les traitements avancés avec IA sont facultatifs et utilisent des crédits uniquement si vous les choisissez.",
    rankingEyebrow: "Comparatif 2027",
    rankingTitle: "5 meilleurs outils gratuits pour supprimer l'arrière-plan",
    rankingDescription: "Comparez PHANYX, Pixlr, Pixelcut, Photoroom et remove.bg pour trouver l'outil adapté à votre flux.",
    rankingButton: "Lire le comparatif",
    removerButton: "Supprimer l'arrière-plan",
    editorEyebrow: "Retouche d'image en ligne",
    editorTitle: "Éditeur d'images gratuit en ligne",
    editorDescription: "Recadrez, effacez, restaurez, affinez les contours et exportez vos images directement dans le navigateur.",
    editorButton: "Lire le guide",
    openEditorButton: "Ouvrir l'éditeur PHANYX",
    managementKicker: "Guides et articles",
    managementHeading: "Gestion scolaire et enseignement numérique",
    managementIntro: "Des réponses approfondies pour les décisions de gestion, de technologie, d'opérations académiques et de développement.",
    trialKicker: "Découvrir PHANYX",
    trialHeading: "Essayez PHANYX pendant 3 mois sans frais",
    trialText: "Une carte est requise au démarrage, mais aucun montant n'est facturé si l'abonnement est annulé pendant les 3 mois. En cas d'annulation anticipée, l'accès reste actif jusqu'à la fin des trois mois sans coût supplémentaire.",
    trialButton: "Voir les offres et conditions",
    adminArea: "Espace administratif",
    departments: "Services",
    teacherArea: "Espace enseignant",
    studentArea: "Espace étudiant",
    referenceHeading: "PHANYX comme référence en technologie éducative",
    referenceText: "Le blog rassemble des contenus pratiques sur la gestion académique, la bibliothèque, les admissions, la finance, les RH, la mobilité, les documents et la technologie pour les établissements qui veulent mieux intégrer leurs opérations.",
    explore: "Explorer",
    rights: "Tous droits réservés.",
    managementArticles: intlArticles("fr-FR", ["Guide de gestion scolaire", "Comment choisir et moderniser la gestion de votre établissement.", "Système de gestion scolaire en ligne", "Comment organiser votre établissement avec une plateforme en ligne complète.", "Gestion scolaire numérique", "Comment numériser les processus et réduire les tâches manuelles."]),
  },
};

export function phanyxBlogMetadata(locale: LocalePhanyx): Metadata {
  const copy = phanyxBlogCopy[locale];
  const canonical = `https://www.phanyx.com.br${phanyxBlogPath(locale)}`;
  const languages = Object.fromEntries(phanyxBlogLocales.map((item) => [item, `https://www.phanyx.com.br${phanyxBlogPath(item)}`]));
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: { canonical, languages: { ...languages, "x-default": "https://www.phanyx.com.br/blog" } },
    openGraph: {
      type: "website",
      locale: locale.replace("-", "_"),
      url: canonical,
      title: copy.metaTitle,
      description: copy.metaDescription,
      images: [{
        url: blogHeroImage[locale],
        width: 1536,
        height: 1024,
        alt: copy.heroAlt,
      }],
    },
  };
}

export function blogToolLinks(locale: LocalePhanyx) {
  return {
    ranking: imageToolsArticlePath("background-removers", locale),
    editorArticle: imageToolsArticlePath("image-editor", locale),
    remover: backgroundRemoverPath(locale),
    plans: marketingPath(locale, "plans"),
  };
}
