import type { LocalePhanyx } from "@/i18n/config";

export const phanyxPrintLocales: LocalePhanyx[] = [
  "pt-BR",
  "pt-PT",
  "en-US",
  "es-ES",
  "fr-FR",
];

export const phanyxPrintSlugs: Record<LocalePhanyx, string> = {
  "pt-BR": "phanyx-print",
  "pt-PT": "phanyx-print",
  "en-US": "phanyx-print-screen-capture",
  "es-ES": "phanyx-print-captura-pantalla",
  "fr-FR": "phanyx-print-capture-ecran",
};

export function phanyxPrintPath(locale: LocalePhanyx) {
  return locale === "pt-BR"
    ? "/phanyx-print"
    : `/${locale}/${phanyxPrintSlugs[locale]}`;
}

export function phanyxPrintLocaleFromSlug(
  market: string,
  slug: string,
): LocalePhanyx | null {
  if (!phanyxPrintLocales.includes(market as LocalePhanyx)) return null;
  const locale = market as LocalePhanyx;
  if (locale === "pt-BR") return null;
  return phanyxPrintSlugs[locale] === slug ? locale : null;
}

export function phanyxPrintAlternates() {
  return {
    canonical: phanyxPrintPath("pt-BR"),
    languages: {
      ...Object.fromEntries(
        phanyxPrintLocales.map((locale) => [
          locale,
          phanyxPrintPath(locale),
        ]),
      ),
      "x-default": phanyxPrintPath("pt-BR"),
    } as Record<LocalePhanyx | "x-default", string>,
  };
}

type PrintCopy = {
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  badge: string;
  title: string;
  accent: string;
  description: string;
  primaryCta: string;
  installCta: string;
  free: string;
  compatibleLine: string;
  heroNote: string;
  modesTitle: string;
  modesDescription: string;
  modes: { icon: string; title: string; description: string }[];
  benefitsTitle: string;
  benefits: { title: string; description: string }[];
  demoKicker: string;
  demoTitle: string;
  demoDescription: string;
  installTitle: string;
  installDescription: string;
  installSteps: string[];
  compatibilityTitle: string;
  compatibilityDescription: string;
  browsers: string[];
  firefoxNote: string;
  privacyTitle: string;
  privacyDescription: string;
  promoBefore: string;
  promoLink: string;
  promoAfter: string;
  faqTitle: string;
  faqs: { question: string; answer: string }[];
  finalTitle: string;
  finalDescription: string;
  download: string;
  backHome: string;
};

export const phanyxPrintCopy: Record<LocalePhanyx, PrintCopy> = {
  "pt-BR": {
    seoTitle: "PHANYX Print | Extensão grátis para print de tela inteira",
    seoDescription:
      "Capture e copie páginas inteiras do navegador com o PHANYX Print. Extensão grátis para Chrome, Brave, Edge, Opera, Vivaldi e navegadores Chromium.",
    keywords: [
      "print de tela inteira",
      "captura de página inteira",
      "extensão para print",
      "capturar página inteira chrome",
      "screenshot chrome",
      "extensão chrome print",
      "PHANYX Print",
    ],
    badge: "Extensão grátis PHANYX",
    title: "Extensão rápida para prints de tela.",
    accent: "Copie a tela inteira do navegador em um clique.",
    description:
      "Capture uma área, a parte visível ou uma página inteira. O PHANYX Print simplifica capturas longas e já deixa a imagem pronta para colar.",
    primaryCta: "Baixar PHANYX Print grátis",
    installCta: "Como instalar",
    free: "Grátis",
    compatibleLine:
      "Chrome • Brave • Edge • Opera • Vivaldi • outros navegadores Chromium",
    heroNote:
      "Sem conta. Sem enviar sua captura para um servidor para realizar o print.",
    modesTitle: "Três formas simples de capturar",
    modesDescription:
      "Escolha o tipo de captura e continue trabalhando sem complicação.",
    modes: [
      {
        icon: "▣",
        title: "Selecionar área",
        description:
          "Clique, arraste e selecione apenas a região que você realmente precisa.",
      },
      {
        icon: "↕",
        title: "Página inteira",
        description:
          "Capture páginas longas do topo ao fim em uma única imagem.",
      },
      {
        icon: "▢",
        title: "Área visível",
        description:
          "Copie exatamente o conteúdo que está aparecendo na tela.",
      },
    ],
    benefitsTitle: "Feito para ser rápido",
    benefits: [
      {
        title: "Cópia automática",
        description:
          "Depois da captura, a imagem já fica pronta para você usar com Ctrl+V.",
      },
      {
        title: "PNG e JPG",
        description:
          "Salve a captura em formatos práticos para documentos, mensagens e trabalhos.",
      },
      {
        title: "Pré-visualização",
        description:
          "Confira o resultado e copie novamente ou salve quando precisar.",
      },
      {
        title: "Processamento local",
        description:
          "A captura é montada no próprio navegador durante o uso da extensão.",
      },
    ],
    demoKicker: "CAPTURA REAL",
    demoTitle: "Uma página inteira em uma única imagem",
    demoDescription:
      "O PHANYX Print percorre o conteúdo necessário e monta a captura completa para você.",
    installTitle: "Instale em poucos passos",
    installDescription:
      "Baixe gratuitamente o PHANYX Print e instale no seu navegador em poucos passos. Não é necessário criar uma conta.",
    installSteps: [
      "Baixe o PHANYX Print.",
      "Descompacte o arquivo ZIP.",
      "Abra a página de extensões do seu navegador.",
      "Ative o modo de desenvolvedor.",
      "Escolha “Carregar sem compactação” e selecione a pasta da extensão.",
      "Fixe o PHANYX Print na barra do navegador.",
    ],
    compatibilityTitle: "Funciona nos principais navegadores Chromium",
    compatibilityDescription:
      "A mesma extensão pode ser usada nos navegadores compatíveis com Manifest V3.",
    browsers: [
      "Google Chrome",
      "Brave",
      "Microsoft Edge",
      "Opera",
      "Vivaldi",
      "Outros navegadores Chromium",
    ],
    firefoxNote:
      "Firefox ainda não é compatível com esta versão.",
    privacyTitle: "Sua captura continua com você",
    privacyDescription:
      "O PHANYX Print foi desenvolvido para realizar e montar as capturas localmente no navegador. A extensão não precisa enviar a imagem para um serviço externo para produzir o print.",
    promoBefore: "Conheça também o ",
    promoLink: "PHANYX — plataforma de gestão escolar e acadêmica",
    promoAfter:
      ", um sistema completo para instituições de ensino com gestão acadêmica, ensino digital, financeiro, biblioteca, documentos, certificados e muito mais.",
    faqTitle: "Perguntas frequentes",
    faqs: [
      {
        question: "O PHANYX Print é grátis?",
        answer:
          "Sim. A versão atual do PHANYX Print é disponibilizada gratuitamente.",
      },
      {
        question: "Preciso clicar em Copiar depois do print?",
        answer:
          "Não necessariamente. A extensão tenta copiar automaticamente a captura para a área de transferência e mantém o botão Copiar disponível.",
      },
      {
        question: "Posso capturar a página inteira?",
        answer:
          "Sim. Use a opção Página inteira para capturar conteúdos longos em uma única imagem.",
      },
      {
        question: "Funciona no Brave?",
        answer:
          "Sim. O PHANYX Print foi preparado para Chrome, Brave, Edge, Opera, Vivaldi e outros navegadores Chromium compatíveis.",
      },
    ],
    finalTitle: "Capture. Copie. Cole.",
    finalDescription:
      "Tenha uma ferramenta simples para prints de área, tela visível e página inteira diretamente no navegador.",
    download: "Baixar PHANYX Print",
    backHome: "Conhecer o PHANYX",
  },

  "pt-PT": {
    seoTitle: "PHANYX Print | Extensão grátis para capturas de ecrã completas",
    seoDescription:
      "Capture e copie páginas completas do navegador com o PHANYX Print. Extensão grátis para Chrome, Brave, Edge, Opera, Vivaldi e navegadores Chromium.",
    keywords: [
      "captura de ecrã completa",
      "capturar página inteira",
      "extensão captura ecrã",
      "screenshot chrome",
      "PHANYX Print",
    ],
    badge: "Extensão PHANYX grátis",
    title: "Extensão rápida para capturas de ecrã.",
    accent: "Copie a página inteira do navegador com um clique.",
    description:
      "Capture uma área, a parte visível ou uma página completa. O PHANYX Print simplifica capturas longas e deixa a imagem pronta para colar.",
    primaryCta: "Descarregar PHANYX Print grátis",
    installCta: "Como instalar",
    free: "Grátis",
    compatibleLine:
      "Chrome • Brave • Edge • Opera • Vivaldi • outros navegadores Chromium",
    heroNote:
      "Sem conta. A captura não precisa de ser enviada para um servidor para ser criada.",
    modesTitle: "Três formas simples de capturar",
    modesDescription:
      "Escolha o tipo de captura e continue a trabalhar sem complicações.",
    modes: [
      {
        icon: "▣",
        title: "Selecionar área",
        description: "Clique e arraste para capturar apenas a zona necessária.",
      },
      {
        icon: "↕",
        title: "Página inteira",
        description:
          "Capture páginas longas do início ao fim numa única imagem.",
      },
      {
        icon: "▢",
        title: "Área visível",
        description: "Capture exatamente o que está visível no ecrã.",
      },
    ],
    benefitsTitle: "Criado para ser rápido",
    benefits: [
      {
        title: "Cópia automática",
        description:
          "Após a captura, a imagem fica pronta para colar com Ctrl+V.",
      },
      {
        title: "PNG e JPG",
        description:
          "Guarde as capturas em formatos práticos para documentos e mensagens.",
      },
      {
        title: "Pré-visualização",
        description:
          "Veja o resultado e copie novamente ou guarde quando precisar.",
      },
      {
        title: "Processamento local",
        description:
          "A captura é montada no próprio navegador durante a utilização.",
      },
    ],
    demoKicker: "CAPTURA REAL",
    demoTitle: "Uma página completa numa única imagem",
    demoDescription:
      "O PHANYX Print percorre o conteúdo necessário e cria a captura completa.",
    installTitle: "Instale em poucos passos",
    installDescription:
      "Descarregue gratuitamente o PHANYX Print e instale-o no seu navegador em poucos passos. Não é necessário criar uma conta.",
    installSteps: [
      "Descarregue o PHANYX Print.",
      "Descompacte o ficheiro ZIP.",
      "Abra a página de extensões do navegador.",
      "Ative o modo de programador.",
      "Escolha “Carregar sem compactação” e selecione a pasta.",
      "Fixe o PHANYX Print na barra do navegador.",
    ],
    compatibilityTitle: "Compatível com os principais navegadores Chromium",
    compatibilityDescription:
      "A mesma extensão funciona em navegadores compatíveis com Manifest V3.",
    browsers: [
      "Google Chrome",
      "Brave",
      "Microsoft Edge",
      "Opera",
      "Vivaldi",
      "Outros navegadores Chromium",
    ],
    firefoxNote:
      "O Firefox ainda não é compatível com esta versão.",
    privacyTitle: "As suas capturas ficam consigo",
    privacyDescription:
      "O PHANYX Print realiza e monta as capturas localmente no navegador, sem precisar de enviar a imagem para um serviço externo para criar a captura.",
    promoBefore: "Conheça também o ",
    promoLink: "PHANYX — plataforma de gestão escolar e académica",
    promoAfter:
      ", um sistema completo para instituições de ensino com gestão académica, ensino digital, finanças, biblioteca, documentos, certificados e muito mais.",
    faqTitle: "Perguntas frequentes",
    faqs: [
      {
        question: "O PHANYX Print é grátis?",
        answer: "Sim. A versão atual é disponibilizada gratuitamente.",
      },
      {
        question: "Tenho de clicar em Copiar depois da captura?",
        answer:
          "Não necessariamente. A extensão tenta copiar automaticamente a imagem e mantém o botão Copiar disponível.",
      },
      {
        question: "Posso capturar a página inteira?",
        answer:
          "Sim. A opção Página inteira cria uma imagem com o conteúdo longo da página.",
      },
      {
        question: "Funciona no Brave?",
        answer:
          "Sim. Funciona em Chrome, Brave, Edge, Opera, Vivaldi e outros navegadores Chromium compatíveis.",
      },
    ],
    finalTitle: "Capture. Copie. Cole.",
    finalDescription:
      "Uma ferramenta simples para capturas de área, ecrã visível e página inteira.",
    download: "Descarregar PHANYX Print",
    backHome: "Conhecer o PHANYX",
  },

  "en-US": {
    seoTitle: "PHANYX Print | Free Full Page Screenshot Extension",
    seoDescription:
      "Capture and copy full browser pages with PHANYX Print. A free screenshot extension for Chrome, Brave, Edge, Opera, Vivaldi and Chromium browsers.",
    keywords: [
      "full page screenshot",
      "full page screen capture",
      "chrome screenshot extension",
      "capture full page chrome",
      "browser screenshot",
      "PHANYX Print",
    ],
    badge: "Free PHANYX extension",
    title: "A fast browser screenshot extension.",
    accent: "Copy an entire browser page in one click.",
    description:
      "Capture a selected area, the visible screen or a full page. PHANYX Print makes long screenshots easy and gets the image ready to paste.",
    primaryCta: "Download PHANYX Print free",
    installCta: "How to install",
    free: "Free",
    compatibleLine:
      "Chrome • Brave • Edge • Opera • Vivaldi • other Chromium browsers",
    heroNote:
      "No account required. Your screenshot does not need to be uploaded to a server to be created.",
    modesTitle: "Three simple capture modes",
    modesDescription:
      "Choose the capture you need and get back to work quickly.",
    modes: [
      {
        icon: "▣",
        title: "Select an area",
        description:
          "Click and drag to capture only the part of the page you need.",
      },
      {
        icon: "↕",
        title: "Full page",
        description:
          "Capture long pages from top to bottom as a single image.",
      },
      {
        icon: "▢",
        title: "Visible area",
        description:
          "Capture exactly what is currently visible in your browser window.",
      },
    ],
    benefitsTitle: "Built for speed",
    benefits: [
      {
        title: "Automatic copy",
        description:
          "After a capture, the image is ready to paste with Ctrl+V.",
      },
      {
        title: "PNG and JPG",
        description:
          "Save screenshots in practical formats for documents and messages.",
      },
      {
        title: "Quick preview",
        description:
          "Review the result, copy it again or save it whenever you need.",
      },
      {
        title: "Local processing",
        description:
          "Screenshots are assembled locally in your browser while you use the extension.",
      },
    ],
    demoKicker: "REAL CAPTURE",
    demoTitle: "A full web page in one image",
    demoDescription:
      "PHANYX Print captures the necessary content and builds one complete screenshot.",
    installTitle: "Install in a few steps",
    installDescription:
      "Download PHANYX Print for free and install it in your browser in just a few steps. No account is required.",
    installSteps: [
      "Download PHANYX Print.",
      "Extract the ZIP file.",
      "Open your browser extensions page.",
      "Enable Developer mode.",
      "Choose “Load unpacked” and select the extension folder.",
      "Pin PHANYX Print to your browser toolbar.",
    ],
    compatibilityTitle: "Works with major Chromium browsers",
    compatibilityDescription:
      "The same extension works in browsers compatible with Manifest V3.",
    browsers: [
      "Google Chrome",
      "Brave",
      "Microsoft Edge",
      "Opera",
      "Vivaldi",
      "Other Chromium browsers",
    ],
    firefoxNote:
      "Firefox is not yet compatible with this version.",
    privacyTitle: "Your screenshot stays with you",
    privacyDescription:
      "PHANYX Print captures and assembles images locally in the browser. It does not need to upload the image to an external service to produce the screenshot.",
    promoBefore: "Also discover ",
    promoLink: "PHANYX — school and academic management platform",
    promoAfter:
      ", a complete system for educational institutions with academic management, online learning, finance, library, documents, certificates and more.",
    faqTitle: "Frequently asked questions",
    faqs: [
      {
        question: "Is PHANYX Print free?",
        answer: "Yes. The current PHANYX Print version is free to use.",
      },
      {
        question: "Do I have to click Copy after taking a screenshot?",
        answer:
          "Not necessarily. The extension attempts to copy the screenshot automatically and also keeps the Copy button available.",
      },
      {
        question: "Can it capture a full page?",
        answer:
          "Yes. Use Full page to capture long web pages as a single image.",
      },
      {
        question: "Does it work in Brave?",
        answer:
          "Yes. PHANYX Print supports Chrome, Brave, Edge, Opera, Vivaldi and other compatible Chromium browsers.",
      },
    ],
    finalTitle: "Capture. Copy. Paste.",
    finalDescription:
      "A simple tool for selected-area, visible-screen and full-page screenshots.",
    download: "Download PHANYX Print",
    backHome: "Discover PHANYX",
  },

  "es-ES": {
    seoTitle: "PHANYX Print | Extensión gratis para capturas de página completa",
    seoDescription:
      "Captura y copia páginas completas del navegador con PHANYX Print. Extensión gratis para Chrome, Brave, Edge, Opera, Vivaldi y navegadores Chromium.",
    keywords: [
      "captura página completa",
      "captura pantalla chrome",
      "extensión captura pantalla",
      "screenshot chrome",
      "PHANYX Print",
    ],
    badge: "Extensión gratuita PHANYX",
    title: "Una extensión rápida para capturas de pantalla.",
    accent: "Copia una página completa del navegador con un clic.",
    description:
      "Captura un área, la parte visible o una página completa. PHANYX Print simplifica las capturas largas y deja la imagen lista para pegar.",
    primaryCta: "Descargar PHANYX Print gratis",
    installCta: "Cómo instalar",
    free: "Gratis",
    compatibleLine:
      "Chrome • Brave • Edge • Opera • Vivaldi • otros navegadores Chromium",
    heroNote:
      "Sin cuenta. La captura no necesita enviarse a un servidor para ser creada.",
    modesTitle: "Tres formas sencillas de capturar",
    modesDescription:
      "Elige el tipo de captura que necesitas y sigue trabajando.",
    modes: [
      {
        icon: "▣",
        title: "Seleccionar área",
        description:
          "Haz clic y arrastra para capturar solamente la región necesaria.",
      },
      {
        icon: "↕",
        title: "Página completa",
        description:
          "Captura páginas largas de principio a fin en una sola imagen.",
      },
      {
        icon: "▢",
        title: "Área visible",
        description:
          "Captura exactamente lo que aparece en ese momento en la pantalla.",
      },
    ],
    benefitsTitle: "Hecho para ser rápido",
    benefits: [
      {
        title: "Copia automática",
        description:
          "Después de capturar, la imagen queda lista para pegar con Ctrl+V.",
      },
      {
        title: "PNG y JPG",
        description:
          "Guarda tus capturas en formatos prácticos para documentos y mensajes.",
      },
      {
        title: "Vista previa",
        description:
          "Revisa el resultado, vuelve a copiarlo o guárdalo cuando quieras.",
      },
      {
        title: "Procesamiento local",
        description:
          "La captura se monta localmente en el navegador durante el uso.",
      },
    ],
    demoKicker: "CAPTURA REAL",
    demoTitle: "Una página completa en una sola imagen",
    demoDescription:
      "PHANYX Print captura el contenido necesario y crea una única captura completa.",
    installTitle: "Instala en pocos pasos",
    installDescription:
      "Descarga PHANYX Print gratis e instálalo en tu navegador en pocos pasos. No necesitas crear una cuenta.",
    installSteps: [
      "Descarga PHANYX Print.",
      "Descomprime el archivo ZIP.",
      "Abre la página de extensiones del navegador.",
      "Activa el modo de desarrollador.",
      "Selecciona “Cargar descomprimida” y elige la carpeta.",
      "Fija PHANYX Print en la barra del navegador.",
    ],
    compatibilityTitle: "Compatible con los principales navegadores Chromium",
    compatibilityDescription:
      "La misma extensión funciona en navegadores compatibles con Manifest V3.",
    browsers: [
      "Google Chrome",
      "Brave",
      "Microsoft Edge",
      "Opera",
      "Vivaldi",
      "Otros navegadores Chromium",
    ],
    firefoxNote:
      "Firefox todavía no es compatible con esta versión.",
    privacyTitle: "Tus capturas se quedan contigo",
    privacyDescription:
      "PHANYX Print realiza y monta las capturas localmente en el navegador, sin necesidad de enviar la imagen a un servicio externo para crearla.",
    promoBefore: "Conoce también ",
    promoLink: "PHANYX — plataforma de gestión escolar y académica",
    promoAfter:
      ", un sistema completo para instituciones educativas con gestión académica, enseñanza digital, finanzas, biblioteca, documentos, certificados y mucho más.",
    faqTitle: "Preguntas frecuentes",
    faqs: [
      {
        question: "¿PHANYX Print es gratis?",
        answer: "Sí. La versión actual se ofrece gratuitamente.",
      },
      {
        question: "¿Tengo que pulsar Copiar después de la captura?",
        answer:
          "No necesariamente. La extensión intenta copiar la imagen automáticamente y mantiene disponible el botón Copiar.",
      },
      {
        question: "¿Puedo capturar una página completa?",
        answer:
          "Sí. Usa Página completa para capturar contenidos largos en una sola imagen.",
      },
      {
        question: "¿Funciona en Brave?",
        answer:
          "Sí. Funciona en Chrome, Brave, Edge, Opera, Vivaldi y otros navegadores Chromium compatibles.",
      },
    ],
    finalTitle: "Captura. Copia. Pega.",
    finalDescription:
      "Una herramienta sencilla para capturas de área, pantalla visible y página completa.",
    download: "Descargar PHANYX Print",
    backHome: "Conocer PHANYX",
  },

  "fr-FR": {
    seoTitle: "PHANYX Print | Extension gratuite de capture de page entière",
    seoDescription:
      "Capturez et copiez des pages web entières avec PHANYX Print. Extension gratuite pour Chrome, Brave, Edge, Opera, Vivaldi et navigateurs Chromium.",
    keywords: [
      "capture page entière",
      "capture écran chrome",
      "extension capture écran",
      "screenshot chrome",
      "PHANYX Print",
    ],
    badge: "Extension PHANYX gratuite",
    title: "Une extension rapide pour vos captures d’écran.",
    accent: "Copiez une page entière du navigateur en un clic.",
    description:
      "Capturez une zone, la partie visible ou une page entière. PHANYX Print simplifie les longues captures et prépare l’image à coller.",
    primaryCta: "Télécharger PHANYX Print gratuitement",
    installCta: "Comment installer",
    free: "Gratuit",
    compatibleLine:
      "Chrome • Brave • Edge • Opera • Vivaldi • autres navigateurs Chromium",
    heroNote:
      "Sans compte. La capture n’a pas besoin d’être envoyée vers un serveur pour être créée.",
    modesTitle: "Trois modes de capture simples",
    modesDescription:
      "Choisissez le type de capture nécessaire et continuez votre travail.",
    modes: [
      {
        icon: "▣",
        title: "Sélectionner une zone",
        description:
          "Cliquez et faites glisser pour capturer uniquement la zone souhaitée.",
      },
      {
        icon: "↕",
        title: "Page entière",
        description:
          "Capturez une longue page du début à la fin dans une seule image.",
      },
      {
        icon: "▢",
        title: "Zone visible",
        description:
          "Capturez exactement ce qui est actuellement visible à l’écran.",
      },
    ],
    benefitsTitle: "Pensé pour aller vite",
    benefits: [
      {
        title: "Copie automatique",
        description:
          "Après la capture, l’image est prête à être collée avec Ctrl+V.",
      },
      {
        title: "PNG et JPG",
        description:
          "Enregistrez vos captures dans des formats pratiques pour vos documents.",
      },
      {
        title: "Aperçu rapide",
        description:
          "Vérifiez le résultat, recopiez-le ou enregistrez-le à tout moment.",
      },
      {
        title: "Traitement local",
        description:
          "Les captures sont assemblées localement dans le navigateur.",
      },
    ],
    demoKicker: "CAPTURE RÉELLE",
    demoTitle: "Une page web entière dans une seule image",
    demoDescription:
      "PHANYX Print capture le contenu nécessaire et crée une capture complète.",
    installTitle: "Installez en quelques étapes",
    installDescription:
      "Téléchargez PHANYX Print gratuitement et installez-le dans votre navigateur en quelques étapes. Aucun compte n’est nécessaire.",
    installSteps: [
      "Téléchargez PHANYX Print.",
      "Décompressez le fichier ZIP.",
      "Ouvrez la page des extensions du navigateur.",
      "Activez le mode développeur.",
      "Choisissez « Charger l’extension non empaquetée » et sélectionnez le dossier.",
      "Épinglez PHANYX Print à la barre du navigateur.",
    ],
    compatibilityTitle: "Compatible avec les principaux navigateurs Chromium",
    compatibilityDescription:
      "La même extension fonctionne avec les navigateurs compatibles Manifest V3.",
    browsers: [
      "Google Chrome",
      "Brave",
      "Microsoft Edge",
      "Opera",
      "Vivaldi",
      "Autres navigateurs Chromium",
    ],
    firefoxNote:
      "Firefox n’est pas encore compatible avec cette version.",
    privacyTitle: "Vos captures restent avec vous",
    privacyDescription:
      "PHANYX Print réalise et assemble les captures localement dans le navigateur, sans devoir envoyer l’image vers un service externe pour produire la capture.",
    promoBefore: "Découvrez également ",
    promoLink: "PHANYX — plateforme de gestion scolaire et académique",
    promoAfter:
      ", un système complet pour les établissements d’enseignement avec gestion académique, enseignement numérique, finances, bibliothèque, documents, certificats et bien plus.",
    faqTitle: "Questions fréquentes",
    faqs: [
      {
        question: "PHANYX Print est-il gratuit ?",
        answer: "Oui. La version actuelle est proposée gratuitement.",
      },
      {
        question: "Dois-je cliquer sur Copier après la capture ?",
        answer:
          "Pas nécessairement. L’extension essaie de copier automatiquement l’image et conserve le bouton Copier.",
      },
      {
        question: "Puis-je capturer une page entière ?",
        answer:
          "Oui. Utilisez Page entière pour capturer de longues pages dans une seule image.",
      },
      {
        question: "Fonctionne-t-il avec Brave ?",
        answer:
          "Oui. PHANYX Print fonctionne avec Chrome, Brave, Edge, Opera, Vivaldi et d’autres navigateurs Chromium compatibles.",
      },
    ],
    finalTitle: "Capturez. Copiez. Collez.",
    finalDescription:
      "Un outil simple pour les captures de zone, d’écran visible et de page entière.",
    download: "Télécharger PHANYX Print",
    backHome: "Découvrir PHANYX",
  },
};
