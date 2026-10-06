import type { LocalePhanyx } from "@/i18n/config";

export type ImageToolsArticleKind = "background-removers" | "image-editor";

export const imageToolsArticleLocales: LocalePhanyx[] = [
  "pt-BR",
  "pt-PT",
  "en-US",
  "es-ES",
  "fr-FR",
];

export const imageToolsArticleSlugs = {
  "background-removers": {
    "pt-BR": "melhores-removedores-de-fundo-gratis",
    "pt-PT": "melhores-removedores-de-fundo-gratis",
    "en-US": "best-free-background-removers",
    "es-ES": "mejores-eliminadores-de-fondo-gratis",
    "fr-FR": "meilleurs-suppresseurs-arriere-plan-gratuits",
  },
  "image-editor": {
    "pt-BR": "editor-de-imagens-gratis-online",
    "pt-PT": "editor-de-imagens-gratis-online",
    "en-US": "free-online-image-editor",
    "es-ES": "editor-de-imagenes-gratis-online",
    "fr-FR": "editeur-images-gratuit-en-ligne",
  },
} as const satisfies Record<ImageToolsArticleKind, Record<LocalePhanyx, string>>;

export const imageToolsArticleImages = {
  "background-removers": {
    "pt-BR": "/images/melhores-removedores-2027-pt-BR.webp",
    "pt-PT": "/images/melhores-removedores-2027-pt-PT.webp",
    "en-US": "/images/melhores-removedores-2027-en-US.webp",
    "es-ES": "/images/melhores-removedores-2027-es-ES.webp",
    "fr-FR": "/images/melhores-removedores-2027-fr-FR.webp",
  },
  "image-editor": {
    "pt-BR": "/images/editor-imagens-online-pt-BR.webp",
    "pt-PT": "/images/editor-imagens-online-pt-PT.webp",
    "en-US": "/images/editor-imagens-online-en-US.webp",
    "es-ES": "/images/editor-imagens-online-es-ES.webp",
    "fr-FR": "/images/editor-imagens-online-fr-FR.webp",
  },
} as const satisfies Record<ImageToolsArticleKind, Record<LocalePhanyx, string>>;

export function imageToolsArticlePath(
  kind: ImageToolsArticleKind,
  locale: LocalePhanyx,
) {
  const slug = imageToolsArticleSlugs[kind][locale];
  return locale === "pt-BR" ? `/blog/${slug}` : `/${locale}/blog/${slug}`;
}

export function imageToolsArticleAlternates(kind: ImageToolsArticleKind) {
  return {
    languages: {
      ...Object.fromEntries(
        imageToolsArticleLocales.map((locale) => [
          locale,
          imageToolsArticlePath(kind, locale),
        ]),
      ),
      "x-default": imageToolsArticlePath(kind, "pt-BR"),
    },
  };
}

type Faq = { question: string; answer: string };
type Tool = {
  name: string;
  bestFor: string;
  summary: string;
  free: string;
  strengths: string[];
  caution?: string;
  official: string;
};
type Card = { title: string; description: string };

type ComparisonCopy = {
  kind: "background-removers";
  title: string;
  description: string;
  keywords: string[];
  kicker: string;
  heading: string;
  intro: string;
  imageAlt: string;
  imageCaption: string;
  updated: string;
  disclosure: string;
  criteriaHeading: string;
  criteriaText: string;
  toolsHeading: string;
  toolsIntro: string;
  tools: Tool[];
  verdictHeading: string;
  verdictText: string;
  phanyxHeading: string;
  phanyxText: string;
  ctaButton: string;
  faqHeading: string;
  faqs: Faq[];
  relatedHeading: string;
  editorLink: string;
  languagesLabel: string;
};

type EditorCopy = {
  kind: "image-editor";
  title: string;
  description: string;
  keywords: string[];
  kicker: string;
  heading: string;
  intro: string;
  imageAlt: string;
  imageCaption: string;
  whatHeading: string;
  whatParagraphs: string[];
  photoshopHeading: string;
  photoshopParagraphs: string[];
  freeHeading: string;
  freeIntro: string;
  freeFeatures: Card[];
  aiHeading: string;
  aiText: string;
  usesHeading: string;
  uses: Card[];
  workflowHeading: string;
  workflow: Card[];
  ctaHeading: string;
  ctaText: string;
  ctaButton: string;
  faqHeading: string;
  faqs: Faq[];
  relatedHeading: string;
  rankingLink: string;
  languagesLabel: string;
};

export type ImageToolsArticleCopy = ComparisonCopy | EditorCopy;

export const imageToolsArticleCopy: Record<
  ImageToolsArticleKind,
  Record<LocalePhanyx, ImageToolsArticleCopy>
> = {
  "background-removers": {
    "pt-BR": {
      kind: "background-removers",
      title: "5 melhores removedores de fundo grátis online para 2027 | PHANYX",
      description:
        "Compare 5 removedores de fundo grátis para 2027: PHANYX, Pixlr, Pixelcut, Photoroom e remove.bg. Veja recursos, limites e qual combina com seu uso.",
      keywords: [
        "melhor removedor de fundo",
        "removedor de fundo grátis",
        "remover fundo de imagem",
        "tirar fundo de foto",
        "remover fundo online",
        "melhores removedores de fundo 2027",
        "png transparente",
      ],
      kicker: "Comparativo 2027",
      heading: "5 melhores removedores de fundo grátis online para 2027",
      intro:
        "Se você procura um removedor de fundo grátis, o melhor serviço depende do que precisa fazer depois do recorte. Alguns priorizam remoção automática; outros oferecem refinamento manual, edição de produtos, exportação em PNG ou integração por API. Este comparativo reúne cinco opções relevantes para entrar em 2027 e explica onde cada uma se destaca.",
      imageAlt:
        "Comparativo PHANYX de removedores de fundo grátis com exemplo de cachorro antes e depois da remoção do fundo.",
      imageCaption:
        "Um bom removedor deve facilitar o recorte e também permitir revisar bordas, transparência e formato de saída.",
      updated: "Comparativo preparado em outubro de 2026 para orientar escolhas em 2027.",
      disclosure:
        "Transparência editorial: o PHANYX é uma das ferramentas comparadas e é desenvolvido pela nossa equipa. Por isso, em vez de declarar um vencedor universal, mostramos critérios, pontos fortes e limitações para você decidir.",
      criteriaHeading: "Como avaliamos um removedor de fundo grátis",
      criteriaText:
        "Consideramos disponibilidade gratuita, facilidade de uso, precisão do recorte, possibilidade de corrigir bordas, exportação transparente e limitações conhecidas do plano gratuito. Planos e limites podem mudar, por isso vale confirmar as condições no site oficial antes de um uso profissional em grande volume.",
      toolsHeading: "5 removedores de fundo que vale comparar para 2027",
      toolsIntro:
        "A lista não é uma ordem absoluta de qualidade. Cada ferramenta atende melhor a um tipo de utilizador.",
      tools: [
        {
          name: "PHANYX Removedor de Fundo",
          bestFor: "Melhor para quem quer ferramentas manuais grátis e IA opcional",
          summary:
            "O PHANYX combina remoção de fundo com corte, varinha, apagar, restaurar, remoção de halo e exportação. As ferramentas básicas são gratuitas; tratamentos avançados com IA usam créditos apenas quando escolhidos.",
          free:
            "Ferramentas básicas gratuitas. IA avançada é opcional e usa créditos.",
          strengths: [
            "Recorte e refinamento manual no navegador",
            "Modos para assinatura, objeto e pessoa/foto",
            "PNG transparente, JPG e WebP",
            "Corte, apagar, restaurar, desfazer e ajuste de halo",
          ],
          official: "https://www.phanyx.com.br/removedor-de-fundo",
        },
        {
          name: "Pixlr Background Remover",
          bestFor: "Bom para remoção automática com ferramentas de correção",
          summary:
            "O Pixlr oferece removedor de fundo online com IA e ferramentas de correção como Draw, Magic e Lasso. Também permite trabalhar com fundo transparente, branco ou preto e oferece processamento em lote.",
          free:
            "O Pixlr apresenta o removedor de fundo como ferramenta gratuita; outros recursos da plataforma podem ter limites ou planos próprios.",
          strengths: [
            "Remoção automática com IA",
            "Correções manuais após o recorte",
            "Opções de fundo transparente, branco ou preto",
            "Processamento em lote",
          ],
          official: "https://pixlr.com/br/remove-background/",
        },
        {
          name: "Pixelcut",
          bestFor: "Bom para remoção rápida sem cadastro e imagens de produto",
          summary:
            "O Pixelcut oferece remoção automática, refinamento e download sem marca d’água. A página da ferramenta promove uso gratuito sem cadastro, enquanto o plano gratuito geral informa limites de remoção.",
          free:
            "Há uso gratuito, mas a página de preços informa remoção de fundo limitada no plano Free.",
          strengths: [
            "Fluxo simples de upload e download",
            "Refinamento de bordas",
            "Download sem marca d’água",
            "Foco forte em produtos e comércio visual",
          ],
          official: "https://www.pixelcut.ai/pt-br/remover-fundo",
        },
        {
          name: "Photoroom",
          bestFor: "Bom para e-commerce e criação de imagens de produto",
          summary:
            "O Photoroom é muito orientado a produtos, marcas e comércio eletrónico. Remove fundos automaticamente e permite continuar a composição com novos cenários e ferramentas de edição.",
          free:
            "Existe plano gratuito, mas há limites de uso e exportação. As condições do Free Space podem restringir funcionalidades e uso comercial.",
          strengths: [
            "Especialização em imagens de produto",
            "Remoção automática",
            "Troca de cenários e edição complementar",
            "Aplicação web e móvel",
          ],
          caution:
            "Para uso comercial, confirme as regras atuais do plano gratuito.",
          official: "https://www.photoroom.com/pt-br/tools/background-remover",
        },
        {
          name: "remove.bg",
          bestFor: "Bom para automação, API e fluxos em escala",
          summary:
            "O remove.bg é conhecido pela remoção automática e pelas opções de automação. A página de preços mantém opções básicas sem custo, enquanto exportações de qualidade máxima, volume e recursos avançados entram em créditos ou assinatura.",
          free:
            "Opções básicas sem custo; qualidade máxima, automação e maior escala dependem de planos ou créditos.",
          strengths: [
            "Remoção automática",
            "API e integrações",
            "Apagar e restaurar",
            "Fluxos de volume para empresas",
          ],
          official: "https://www.remove.bg/pt-br",
        },
      ],
      verdictHeading: "Então, qual é o melhor removedor de fundo grátis?",
      verdictText:
        "Para um recorte rápido e simples, várias opções desta lista resolvem bem. Se você precisa controlar bordas, recuperar partes removidas, trabalhar assinaturas, objetos e fotos e ainda evitar pagar por IA em tarefas básicas, vale experimentar o PHANYX. Para e-commerce em escala, Photoroom e Pixelcut merecem comparação; para API e automação, remove.bg é uma referência conhecida; e o Pixlr é uma alternativa sólida para quem quer combinar remoção automática e correções.",
      phanyxHeading: "Teste o Removedor de Fundo PHANYX gratuitamente",
      phanyxText:
        "No PHANYX, remover fundo, cortar, apagar, restaurar, ajustar bordas e exportar fazem parte das ferramentas básicas gratuitas. Os créditos aparecem apenas quando você escolhe um tratamento avançado com IA.",
      ctaButton: "Testar o Removedor de Fundo PHANYX",
      faqHeading: "Perguntas frequentes",
      faqs: [
        {
          question: "Qual é o melhor removedor de fundo grátis em 2027?",
          answer:
            "Não existe uma única escolha para todos. PHANYX se destaca pelo refinamento manual gratuito e IA opcional; Pixlr combina automação e correção; Pixelcut e Photoroom têm forte foco visual e de produto; remove.bg é forte em automação e API.",
        },
        {
          question: "Existe removedor de fundo totalmente grátis?",
          answer:
            "Existem ferramentas com uso gratuito, mas os limites variam. No PHANYX, as ferramentas básicas são gratuitas e somente tratamentos avançados com IA usam créditos.",
        },
        {
          question: "Qual ferramenta é melhor para remover fundo de assinatura?",
          answer:
            "Procure uma opção que permita refinamento manual e exportação em PNG transparente. O PHANYX possui modo de assinatura e ferramentas para corrigir bordas.",
        },
        {
          question: "PNG transparente é o melhor formato depois de remover o fundo?",
          answer:
            "Na maioria dos casos em que você precisa manter transparência, sim. JPG não preserva transparência; WebP pode preservá-la dependendo do fluxo.",
        },
      ],
      relatedHeading: "Leia também",
      editorLink: "Editor de imagens grátis e online",
      languagesLabel: "Leia este comparativo em outro idioma",
    },
    "pt-PT": {
      kind: "background-removers",
      title: "5 melhores removedores de fundo grátis online para 2027 | PHANYX",
      description:
        "Compare PHANYX, Pixlr, Pixelcut, Photoroom e remove.bg: funcionalidades gratuitas, limites e melhores usos para remover fundos em 2027.",
      keywords: [
        "melhor removedor de fundo",
        "removedor de fundo grátis",
        "remover fundo imagem",
        "remover fundo online",
        "melhores removedores de fundo 2027",
        "png transparente",
      ],
      kicker: "Comparativo 2027",
      heading: "5 melhores removedores de fundo grátis online para 2027",
      intro:
        "O melhor removedor de fundo depende do que pretende fazer após o recorte. Algumas ferramentas dão prioridade à remoção automática; outras oferecem aperfeiçoamento manual, edição de produtos, PNG transparente ou integração por API. Este comparativo reúne cinco opções relevantes para 2027.",
      imageAlt:
        "Comparativo de removedores de fundo grátis com um cão antes e depois da remoção do fundo.",
      imageCaption:
        "A qualidade do recorte é importante, mas a possibilidade de corrigir contornos e exportar transparência também conta.",
      updated: "Comparativo preparado em outubro de 2026 para orientar escolhas em 2027.",
      disclosure:
        "Transparência editorial: o PHANYX é desenvolvido pela nossa equipa e está incluído na comparação. Não apresentamos um vencedor absoluto; mostramos diferenças para que escolha de acordo com o seu caso.",
      criteriaHeading: "Como comparar um removedor de fundo grátis",
      criteriaText:
        "Avaliámos acesso gratuito, facilidade, qualidade do recorte, ferramentas de correção, transparência e limites conhecidos. As condições comerciais podem mudar.",
      toolsHeading: "5 removedores de fundo para comparar em 2027",
      toolsIntro: "Cada opção tem um perfil diferente e pode ser melhor para um tipo de trabalho.",
      tools: [
        {
          name: "PHANYX Removedor de Fundo",
          bestFor: "Ferramentas manuais gratuitas e IA opcional",
          summary:
            "Combina remoção de fundo, recorte, varinha, apagar, restaurar, halo e exportação. As ferramentas básicas são gratuitas e a IA avançada utiliza créditos apenas quando escolhida.",
          free: "Ferramentas básicas grátis; IA avançada opcional por créditos.",
          strengths: ["Aperfeiçoamento manual", "Assinatura, objeto e pessoa/foto", "PNG, JPG e WebP", "Recorte e correção de contornos"],
          official: "https://www.phanyx.com.br/pt-PT/remover-fundo",
        },
        {
          name: "Pixlr Background Remover",
          bestFor: "Automação com ferramentas de correção",
          summary:
            "Removedor online com IA, Draw, Magic e Lasso, fundos transparente, branco ou preto e processamento em lote.",
          free: "A ferramenta é apresentada como gratuita; outros recursos podem ter limites.",
          strengths: ["IA automática", "Correções manuais", "Vários fundos", "Lote"],
          official: "https://pixlr.com/remove-background/",
        },
        {
          name: "Pixelcut",
          bestFor: "Rapidez, imagens de produto e utilização sem registo",
          summary:
            "Oferece remoção automática, aperfeiçoamento e download sem marca de água. O plano gratuito geral indica limites de remoção.",
          free: "Existe utilização gratuita com limites no plano Free.",
          strengths: ["Sem registo na ferramenta", "Aperfeiçoamento", "Sem marca de água", "Foco em produto"],
          official: "https://www.pixelcut.ai/background-remover",
        },
        {
          name: "Photoroom",
          bestFor: "E-commerce e fotografia de produto",
          summary:
            "Muito orientado a produtos, marcas e comércio eletrónico, com remoção automática e composição de novos cenários.",
          free: "Plano gratuito com limites; confirme condições de uso comercial.",
          strengths: ["Produto", "Automação", "Novos fundos", "Web e mobile"],
          caution: "Confirme as condições atuais do plano gratuito antes de uso comercial.",
          official: "https://www.photoroom.com/tools/background-remover",
        },
        {
          name: "remove.bg",
          bestFor: "Automação, API e escala",
          summary:
            "Forte em remoção automática, integrações e automação. Mantém opções básicas sem custo e cobra recursos de maior escala/qualidade.",
          free: "Opções básicas sem custo; qualidade máxima e escala usam planos ou créditos.",
          strengths: ["Automação", "API", "Apagar/restaurar", "Volume"],
          official: "https://www.remove.bg/",
        },
      ],
      verdictHeading: "Qual é o melhor removedor de fundo grátis?",
      verdictText:
        "Escolha de acordo com o fluxo. O PHANYX é especialmente interessante quando quer aperfeiçoamento manual sem pagar por IA básica; Photoroom e Pixelcut são fortes em produto; remove.bg em API; Pixlr em automação com correções.",
      phanyxHeading: "Experimente o Removedor de Fundo PHANYX",
      phanyxText:
        "Remoção, recorte, apagar, restaurar, aperfeiçoar contornos e exportar fazem parte das ferramentas básicas gratuitas. A IA avançada é opcional.",
      ctaButton: "Experimentar o PHANYX",
      faqHeading: "Perguntas frequentes",
      faqs: [
        { question: "Qual é o melhor removedor de fundo grátis para 2027?", answer: "Depende do caso. Compare controlo manual, limites, exportação e necessidade de automação." },
        { question: "O PHANYX é grátis?", answer: "As ferramentas básicas são gratuitas. Apenas tratamentos avançados com IA utilizam créditos." },
        { question: "Qual é melhor para assinaturas?", answer: "Prefira uma ferramenta com aperfeiçoamento manual e PNG transparente. O PHANYX inclui modo de assinatura." },
        { question: "PNG mantém a transparência?", answer: "Sim. PNG é uma escolha comum para preservar fundo transparente." },
      ],
      relatedHeading: "Leia também",
      editorLink: "Editor de imagens grátis e online",
      languagesLabel: "Leia este comparativo noutro idioma",
    },
    "en-US": {
      kind: "background-removers",
      title: "5 Best Free Online Background Removers for 2027 | PHANYX",
      description:
        "Compare PHANYX, Pixlr, Pixelcut, Photoroom, and remove.bg: free features, limits, and the best use cases for 2027.",
      keywords: ["best background remover", "free background remover", "remove background online", "transparent png", "best background removers 2027"],
      kicker: "2027 comparison",
      heading: "5 best free online background removers for 2027",
      intro:
        "The best background remover depends on what you need after the cutout. Some tools focus on one-click automation, while others add manual refinement, product-image workflows, transparent PNG export, or APIs. This guide compares five relevant options as you plan for 2027.",
      imageAlt:
        "PHANYX comparison of free background removers with a dog before and after background removal.",
      imageCaption:
        "A useful background remover should make it easy to review edges, transparency, and export quality.",
      updated: "Prepared in October 2026 to help readers choose tools for 2027.",
      disclosure:
        "Editorial disclosure: PHANYX is developed by our team and is included in this comparison. We do not claim one universal winner; we explain strengths, limits, and best-fit use cases.",
      criteriaHeading: "How we compare free background removers",
      criteriaText:
        "We consider free access, ease of use, cutout quality, edge correction, transparent export, and known free-plan limits. Pricing and limits can change, so check each official site before high-volume or commercial use.",
      toolsHeading: "5 background removers worth comparing for 2027",
      toolsIntro: "The list is not an absolute ranking. Each tool is stronger for a different workflow.",
      tools: [
        {
          name: "PHANYX Background Remover",
          bestFor: "Free manual controls with optional AI",
          summary:
            "PHANYX combines background removal with crop, magic wand, erase, restore, halo cleanup, and export. Basic tools are free; advanced AI treatments use credits only when selected.",
          free: "Basic tools are free. Advanced AI is optional and credit-based.",
          strengths: ["Manual refinement", "Signature, object, and person/photo modes", "PNG, JPG, and WebP", "Crop, erase, restore, undo, halo controls"],
          official: "https://www.phanyx.com.br/en-US/background-remover",
        },
        {
          name: "Pixlr Background Remover",
          bestFor: "Automatic removal plus correction tools",
          summary:
            "Pixlr offers AI removal with Draw, Magic, and Lasso correction tools, transparent/white/black backgrounds, and batch processing.",
          free: "Pixlr presents the remover as a free tool; other platform features may have separate limits.",
          strengths: ["AI automation", "Manual fixes", "Multiple background choices", "Batch processing"],
          official: "https://pixlr.com/remove-background/",
        },
        {
          name: "Pixelcut",
          bestFor: "Fast no-sign-up removal and product images",
          summary:
            "Pixelcut offers automatic removal, refinement, and watermark-free downloads. Its tool page promotes free use without sign-up, while the general Free plan lists limited background removal.",
          free: "Free use is available, with limits in the general Free plan.",
          strengths: ["Simple workflow", "Refinement", "No watermark", "Product-image focus"],
          official: "https://www.pixelcut.ai/background-remover",
        },
        {
          name: "Photoroom",
          bestFor: "E-commerce and product photography",
          summary:
            "Photoroom focuses strongly on products, brands, and e-commerce, with automatic removal and tools for replacing backgrounds and composing product visuals.",
          free: "A free plan exists with usage/export limits and feature restrictions.",
          strengths: ["Product workflows", "Automation", "Background replacement", "Web and mobile"],
          caution: "Check the latest free-plan commercial-use terms before using it for client or store assets.",
          official: "https://www.photoroom.com/tools/background-remover",
        },
        {
          name: "remove.bg",
          bestFor: "Automation, API, and scale",
          summary:
            "remove.bg is well known for one-click removal and automation. Its pricing page keeps basic options at no cost, while max-quality exports, larger volumes, and advanced workflows use credits or subscriptions.",
          free: "Basic options at no cost; max quality and scale are paid.",
          strengths: ["Automatic removal", "API", "Erase/restore", "Enterprise volume"],
          official: "https://www.remove.bg/",
        },
      ],
      verdictHeading: "So which free background remover is best?",
      verdictText:
        "There is no single best choice for everyone. PHANYX is compelling when you want free manual refinement and optional AI; Photoroom and Pixelcut are strong for product visuals; remove.bg is established for automation and API work; Pixlr combines automatic removal with repair tools.",
      phanyxHeading: "Try PHANYX Background Remover for free",
      phanyxText:
        "Background removal, crop, erase, restore, edge refinement, and export are part of the free basic toolset. AI treatments are optional and use credits only when selected.",
      ctaButton: "Try PHANYX Background Remover",
      faqHeading: "Frequently asked questions",
      faqs: [
        { question: "What is the best free background remover for 2027?", answer: "It depends on your workflow. Compare manual control, free limits, export needs, and whether you need automation or API access." },
        { question: "Is PHANYX Background Remover free?", answer: "Yes for the basic tools. Advanced AI treatments use optional paid credits." },
        { question: "What is best for signatures?", answer: "Choose a tool with manual edge refinement and transparent PNG export. PHANYX includes a signature mode." },
        { question: "Does PNG preserve transparency?", answer: "Yes. PNG is a common format for preserving transparent backgrounds." },
      ],
      relatedHeading: "Related reading",
      editorLink: "Free online image editor",
      languagesLabel: "Read this comparison in another language",
    },
    "es-ES": {
      kind: "background-removers",
      title: "5 mejores eliminadores de fondo gratis online para 2027 | PHANYX",
      description:
        "Compara PHANYX, Pixlr, Pixelcut, Photoroom y remove.bg: funciones gratis, límites y mejores usos para 2027.",
      keywords: ["mejor eliminador de fondo", "quitar fondo gratis", "eliminar fondo online", "png transparente", "mejores eliminadores de fondo 2027"],
      kicker: "Comparativa 2027",
      heading: "5 mejores eliminadores de fondo gratis online para 2027",
      intro:
        "La mejor herramienta depende de lo que necesites después del recorte. Algunas priorizan la automatización; otras ofrecen corrección manual, edición de productos, PNG transparente o API. Aquí comparamos cinco opciones relevantes para 2027.",
      imageAlt: "Comparativa de eliminadores de fondo gratis con un perro antes y después del recorte.",
      imageCaption: "Además del recorte automático, conviene revisar bordes, transparencia y opciones de exportación.",
      updated: "Comparativa preparada en octubre de 2026 para orientar decisiones de 2027.",
      disclosure:
        "Transparencia editorial: PHANYX es una herramienta de nuestro equipo y aparece en la comparativa. No declaramos un ganador universal; explicamos diferencias para que elijas.",
      criteriaHeading: "Cómo comparamos eliminadores de fondo gratis",
      criteriaText:
        "Consideramos acceso gratuito, facilidad, precisión, corrección de bordes, PNG transparente y límites conocidos. Las condiciones pueden cambiar.",
      toolsHeading: "5 eliminadores de fondo para comparar en 2027",
      toolsIntro: "Cada opción destaca en un tipo de flujo diferente.",
      tools: [
        {
          name: "PHANYX Removedor de Fondo",
          bestFor: "Controles manuales gratis e IA opcional",
          summary: "Combina eliminación, recorte, varita, borrar, restaurar, halo y exportación. Las herramientas básicas son gratis; la IA avanzada usa créditos solo cuando la eliges.",
          free: "Herramientas básicas gratis; IA avanzada opcional con créditos.",
          strengths: ["Ajuste manual", "Firma, objeto y persona/foto", "PNG, JPG y WebP", "Recortar, borrar y restaurar"],
          official: "https://www.phanyx.com.br/es-ES/eliminar-fondo",
        },
        {
          name: "Pixlr Background Remover",
          bestFor: "Automatización con herramientas de corrección",
          summary: "Ofrece IA automática, Draw, Magic y Lasso, varios fondos y procesamiento por lotes.",
          free: "La herramienta se presenta como gratuita; otras funciones pueden tener límites.",
          strengths: ["IA", "Correcciones", "Fondos alternativos", "Lotes"],
          official: "https://pixlr.com/remove-background/",
        },
        {
          name: "Pixelcut",
          bestFor: "Rapidez, sin registro y fotos de producto",
          summary: "Ofrece eliminación automática, refinado y descarga sin marca de agua. El plan Free general indica límites de eliminación.",
          free: "Hay uso gratuito con límites.",
          strengths: ["Sin registro", "Refinado", "Sin marca de agua", "Productos"],
          official: "https://www.pixelcut.ai/background-remover",
        },
        {
          name: "Photoroom",
          bestFor: "E-commerce y fotografía de producto",
          summary: "Muy centrado en productos, marcas y comercio electrónico, con eliminación automática y nuevos fondos.",
          free: "Plan gratuito con límites y restricciones.",
          strengths: ["Productos", "Automatización", "Nuevos fondos", "Web y móvil"],
          caution: "Comprueba las condiciones actuales para uso comercial.",
          official: "https://www.photoroom.com/tools/background-remover",
        },
        {
          name: "remove.bg",
          bestFor: "Automatización, API y volumen",
          summary: "Conocido por la eliminación automática y las integraciones. Mantiene opciones básicas gratuitas y cobra funciones de mayor calidad o escala.",
          free: "Opciones básicas gratis; máxima calidad y escala son de pago.",
          strengths: ["Automatización", "API", "Borrar/restaurar", "Volumen"],
          official: "https://www.remove.bg/",
        },
      ],
      verdictHeading: "¿Cuál es el mejor eliminador de fondo gratis?",
      verdictText:
        "Depende del uso. PHANYX destaca si quieres corrección manual gratuita e IA opcional; Photoroom y Pixelcut son fuertes en producto; remove.bg en automatización; Pixlr combina IA y corrección.",
      phanyxHeading: "Prueba PHANYX gratis",
      phanyxText:
        "Eliminar fondo, recortar, borrar, restaurar, ajustar bordes y exportar forman parte de las herramientas básicas gratis. La IA avanzada es opcional.",
      ctaButton: "Probar PHANYX",
      faqHeading: "Preguntas frecuentes",
      faqs: [
        { question: "¿Cuál es el mejor eliminador de fondo gratis para 2027?", answer: "Depende de tus prioridades: control manual, límites, exportación, automatización o API." },
        { question: "¿PHANYX es gratis?", answer: "Las herramientas básicas son gratuitas. Solo los tratamientos avanzados con IA usan créditos." },
        { question: "¿Qué herramienta va bien para firmas?", answer: "Busca ajuste manual y PNG transparente. PHANYX incluye modo de firma." },
        { question: "¿PNG mantiene la transparencia?", answer: "Sí. PNG es uno de los formatos más usados para conservar fondos transparentes." },
      ],
      relatedHeading: "También te puede interesar",
      editorLink: "Editor de imágenes gratis online",
      languagesLabel: "Lee esta comparativa en otro idioma",
    },
    "fr-FR": {
      kind: "background-removers",
      title: "5 meilleurs suppresseurs d’arrière-plan gratuits pour 2027 | PHANYX",
      description:
        "Comparez PHANYX, Pixlr, Pixelcut, Photoroom et remove.bg : fonctions gratuites, limites et meilleurs usages pour 2027.",
      keywords: ["meilleur suppresseur arrière-plan", "supprimer fond gratuit", "détourer image en ligne", "png transparent", "suppresseurs arrière-plan 2027"],
      kicker: "Comparatif 2027",
      heading: "5 meilleurs suppresseurs d’arrière-plan gratuits en ligne pour 2027",
      intro:
        "Le meilleur outil dépend de ce que vous devez faire après le détourage. Certains privilégient l’automatisation, d’autres la retouche manuelle, les visuels produits, le PNG transparent ou l’API. Voici cinq options à comparer pour 2027.",
      imageAlt: "Comparatif de suppresseurs d’arrière-plan gratuits avec un chien avant et après détourage.",
      imageCaption: "Au-delà de l’automatisation, vérifiez les contours, la transparence et les formats d’export.",
      updated: "Comparatif préparé en octobre 2026 pour guider les choix de 2027.",
      disclosure:
        "Transparence éditoriale : PHANYX est développé par notre équipe et figure dans cette comparaison. Nous ne prétendons pas qu’un outil est universellement meilleur.",
      criteriaHeading: "Comment comparer les outils gratuits",
      criteriaText:
        "Nous regardons l’accès gratuit, la simplicité, la précision, la correction des contours, l’export transparent et les limites connues.",
      toolsHeading: "5 outils à comparer pour 2027",
      toolsIntro: "Chaque solution convient mieux à un type de flux.",
      tools: [
        {
          name: "PHANYX Background Remover",
          bestFor: "Retouche manuelle gratuite et IA optionnelle",
          summary: "Suppression, recadrage, baguette, effacement, restauration, halo et export. Les outils de base sont gratuits ; l’IA avancée utilise des crédits uniquement sur demande.",
          free: "Outils de base gratuits ; IA avancée optionnelle avec crédits.",
          strengths: ["Retouche manuelle", "Signature, objet, personne/photo", "PNG, JPG et WebP", "Recadrage et restauration"],
          official: "https://www.phanyx.com.br/fr-FR/supprimer-arriere-plan",
        },
        {
          name: "Pixlr Background Remover",
          bestFor: "Automatisation avec outils de correction",
          summary: "IA automatique, Draw, Magic et Lasso, fonds transparent/blanc/noir et traitement par lot.",
          free: "L’outil est présenté comme gratuit ; d’autres fonctions peuvent être limitées.",
          strengths: ["IA", "Corrections", "Choix du fond", "Lots"],
          official: "https://pixlr.com/remove-background/",
        },
        {
          name: "Pixelcut",
          bestFor: "Rapidité, sans inscription et produits",
          summary: "Suppression automatique, affinage et téléchargement sans filigrane. Le plan gratuit général indique des limites.",
          free: "Utilisation gratuite disponible avec limites.",
          strengths: ["Sans inscription", "Affinage", "Sans filigrane", "Produits"],
          official: "https://www.pixelcut.ai/background-remover",
        },
        {
          name: "Photoroom",
          bestFor: "E-commerce et photographie produit",
          summary: "Très orienté produits et marques, avec suppression automatique et création de nouveaux fonds.",
          free: "Plan gratuit avec limites et restrictions.",
          strengths: ["Produits", "Automatisation", "Nouveaux fonds", "Web et mobile"],
          caution: "Vérifiez les conditions actuelles pour un usage commercial.",
          official: "https://www.photoroom.com/tools/background-remover",
        },
        {
          name: "remove.bg",
          bestFor: "Automatisation, API et volume",
          summary: "Référence connue pour l’automatisation et les intégrations. Options de base gratuites, fonctions de qualité maximale ou de volume payantes.",
          free: "Options de base gratuites ; haute qualité et volume sont payants.",
          strengths: ["Automatisation", "API", "Effacer/restaurer", "Volume"],
          official: "https://www.remove.bg/",
        },
      ],
      verdictHeading: "Quel est le meilleur outil gratuit ?",
      verdictText:
        "Tout dépend du flux. PHANYX est intéressant pour la retouche manuelle gratuite et l’IA optionnelle ; Photoroom et Pixelcut pour les produits ; remove.bg pour l’API ; Pixlr pour l’automatisation avec correction.",
      phanyxHeading: "Essayez PHANYX gratuitement",
      phanyxText:
        "Suppression du fond, recadrage, effacement, restauration, correction des contours et export font partie des outils de base gratuits. L’IA avancée reste optionnelle.",
      ctaButton: "Essayer PHANYX",
      faqHeading: "Questions fréquentes",
      faqs: [
        { question: "Quel est le meilleur suppresseur gratuit pour 2027 ?", answer: "Cela dépend de vos priorités : retouche manuelle, limites, export, automatisation ou API." },
        { question: "PHANYX est-il gratuit ?", answer: "Les outils de base sont gratuits. Seuls les traitements IA avancés utilisent des crédits." },
        { question: "Quel outil choisir pour une signature ?", answer: "Privilégiez la correction manuelle et le PNG transparent. PHANYX propose un mode signature." },
        { question: "Le PNG conserve-t-il la transparence ?", answer: "Oui. Le PNG est l’un des formats les plus courants pour préserver un fond transparent." },
      ],
      relatedHeading: "À lire aussi",
      editorLink: "Éditeur d’images gratuit en ligne",
      languagesLabel: "Lire ce comparatif dans une autre langue",
    },
  },

  "image-editor": {
    "pt-BR": {
      kind: "image-editor",
      title: "Editor de imagens grátis online: edite fotos no navegador | PHANYX",
      description:
        "Use um editor de imagens grátis online para cortar, apagar, restaurar, remover fundo e criar PNG transparente. IA avançada no PHANYX é opcional.",
      keywords: [
        "editor de imagens grátis",
        "editor de fotos online",
        "editar imagem online",
        "photoshop online gratis",
        "alternativa ao photoshop online",
        "cortar imagem",
        "recortar imagem",
        "tratamento de imagem",
        "edição de imagem com ia",
      ],
      kicker: "Edição de imagem online",
      heading: "Editor de imagens grátis e online: edite fotos direto no navegador",
      intro:
        "Muita gente pesquisa por “Photoshop online grátis” quando, na prática, precisa apenas cortar uma imagem, apagar uma área, restaurar partes do recorte, ajustar bordas, remover o fundo ou exportar um PNG transparente. Para essas tarefas rápidas, um editor no navegador pode evitar a instalação de programas pesados.",
      imageAlt:
        "Editor de imagem PHANYX mostrando remoção de fundo de assinatura, objeto e foto com recursos de recorte e refinamento.",
      imageCaption:
        "O PHANYX reúne tarefas comuns de edição no navegador; Photoshop é uma marca da Adobe e não faz parte do PHANYX.",
      whatHeading: "O que um editor de imagens online precisa resolver",
      whatParagraphs: [
        "Um bom editor online não precisa reproduzir todos os recursos de um software profissional. Para trabalhos rápidos, o mais importante é abrir a imagem, ajustar o enquadramento, remover áreas indesejadas, recuperar partes apagadas e exportar no formato correto.",
        "Isso atende situações comuns como preparar uma assinatura para documento, destacar um produto, recortar uma pessoa para apresentação, remover fundo de foto ou ajustar uma arte antes de publicar.",
      ],
      photoshopHeading: "“Photoshop online grátis”: o que as pessoas geralmente querem dizer",
      photoshopParagraphs: [
        "Adobe Photoshop é um produto da Adobe. O PHANYX não é Photoshop e não tenta se passar por ele. Quando usamos a expressão “edição tipo Photoshop”, estamos falando apenas de tarefas comuns que ficaram conhecidas em editores de imagem: cortar, apagar, restaurar, refinar bordas e trabalhar transparência.",
        "Se você precisa de composição avançada em camadas, pintura profissional, filtros complexos ou fluxos completos de design, um editor profissional dedicado pode ser mais apropriado. Se precisa resolver um recorte ou tratamento rápido no navegador, uma ferramenta mais simples pode ser mais eficiente.",
      ],
      freeHeading: "Ferramentas de edição que você pode usar grátis no PHANYX",
      freeIntro:
        "As ferramentas básicas não exigem créditos de IA. Você só paga quando decide acionar um tratamento avançado com inteligência artificial.",
      freeFeatures: [
        { title: "Cortar e reenquadrar", description: "Ajuste a área útil da imagem e elimine bordas desnecessárias." },
        { title: "Apagar e restaurar", description: "Remova pequenas áreas e recupere partes apagadas por engano." },
        { title: "Ajustar pincel", description: "Trabalhe detalhes com maior controlo durante o refinamento." },
        { title: "Remover halo", description: "Reduza sobras de cor e contornos indesejados depois do recorte." },
        { title: "Desfazer", description: "Volte etapas quando um ajuste não ficar como esperado." },
        { title: "Salvar em PNG, JPG ou WebP", description: "Escolha transparência ou formatos mais adequados ao destino." },
      ],
      aiHeading: "Edição com IA é opcional",
      aiText:
        "Quando a imagem exige algo além do tratamento manual — por exemplo remover objetos reconstruindo o fundo, melhorar qualidade, corrigir iluminação ou restaurar uma foto antiga — o PHANYX oferece recursos de IA por créditos. Isso não transforma as ferramentas básicas em pagas.",
      usesHeading: "Exemplos de uso",
      uses: [
        { title: "Assinaturas", description: "Retire o fundo e gere PNG transparente para contratos, formulários e certificados." },
        { title: "Produtos e objetos", description: "Recorte objetos para catálogos, lojas, apresentações e materiais comerciais." },
        { title: "Fotos e perfis", description: "Remova o cenário e use a pessoa em uma nova composição." },
        { title: "Materiais escolares e profissionais", description: "Prepare imagens para slides, trabalhos, documentos e peças de comunicação." },
      ],
      workflowHeading: "Um fluxo simples de edição online",
      workflow: [
        { title: "1. Envie a imagem", description: "Abra a foto ou arte no navegador." },
        { title: "2. Corte ou remova o fundo", description: "Escolha a ferramenta mais adequada ao problema." },
        { title: "3. Refine detalhes", description: "Use apagar, restaurar, pincel e halo para melhorar o resultado." },
        { title: "4. Exporte", description: "Baixe em PNG transparente, JPG ou WebP." },
      ],
      ctaHeading: "Experimente o editor de fundo e imagem PHANYX",
      ctaText:
        "As ferramentas básicas são gratuitas e funcionam online. Use IA somente quando realmente precisar de tratamento avançado.",
      ctaButton: "Editar imagem agora",
      faqHeading: "Perguntas frequentes",
      faqs: [
        { question: "O PHANYX é um Photoshop online?", answer: "Não. Photoshop é um produto da Adobe. O PHANYX oferece ferramentas online para tarefas como recorte, apagar, restaurar, remover fundo e exportar imagens." },
        { question: "O editor de imagem PHANYX é grátis?", answer: "As ferramentas básicas são gratuitas. Recursos avançados de IA utilizam créditos opcionais." },
        { question: "Posso cortar imagens online?", answer: "Sim. O corte e reenquadramento fazem parte das ferramentas básicas." },
        { question: "Posso remover o fundo de uma assinatura?", answer: "Sim. Há um modo específico para assinatura e ferramentas de refinamento para preparar PNG transparente." },
        { question: "A ferramenta instala alguma coisa no computador?", answer: "Não para o uso normal da página. O fluxo acontece no navegador." },
      ],
      relatedHeading: "Leia também",
      rankingLink: "5 melhores removedores de fundo grátis para 2027",
      languagesLabel: "Leia este artigo em outro idioma",
    },
    "pt-PT": {
      kind: "image-editor",
      title: "Editor de imagens grátis online: edite fotografias no navegador | PHANYX",
      description:
        "Recorte, apague, restaure, remova fundos e crie PNG transparentes num editor de imagens online. IA avançada opcional no PHANYX.",
      keywords: ["editor de imagens grátis", "editor fotos online", "editar imagem online", "alternativa photoshop online", "recortar imagem", "tratamento imagem", "edição imagem ia"],
      kicker: "Edição de imagem online",
      heading: "Editor de imagens grátis e online: edite fotografias no navegador",
      intro:
        "Muitas pessoas procuram “Photoshop online grátis” quando só precisam de recortar uma imagem, apagar uma área, restaurar detalhes, ajustar contornos, remover o fundo ou exportar PNG transparente. Para estas tarefas rápidas, um editor no navegador pode ser suficiente.",
      imageAlt: "Editor PHANYX com exemplos de assinatura, objeto e fotografia antes e depois da remoção do fundo.",
      imageCaption: "PHANYX reúne tarefas comuns de edição no navegador; Photoshop é uma marca da Adobe e não faz parte do PHANYX.",
      whatHeading: "O que um editor de imagens online deve resolver",
      whatParagraphs: [
        "Para trabalhos rápidos, o essencial é abrir a imagem, recortar, remover áreas, recuperar detalhes e exportar corretamente.",
        "Isto ajuda em assinaturas, produtos, fotografias de perfil, apresentações e materiais profissionais.",
      ],
      photoshopHeading: "O que significa procurar “Photoshop online grátis”",
      photoshopParagraphs: [
        "Adobe Photoshop é um produto da Adobe. O PHANYX não é Photoshop. A expressão “edição tipo Photoshop” refere-se apenas a tarefas comuns de edição como recortar, apagar, restaurar e trabalhar transparência.",
        "Para composição avançada em camadas e design profissional complexo, utilize software especializado. Para ajustes rápidos, uma ferramenta web pode ser mais direta.",
      ],
      freeHeading: "Ferramentas gratuitas no PHANYX",
      freeIntro: "As ferramentas básicas não utilizam créditos. A IA avançada é opcional.",
      freeFeatures: [
        { title: "Recortar", description: "Ajuste o enquadramento e retire áreas desnecessárias." },
        { title: "Apagar e restaurar", description: "Corrija pequenas zonas do recorte." },
        { title: "Ajustar pincel", description: "Trabalhe detalhes com maior precisão." },
        { title: "Remover halo", description: "Reduza contornos indesejados." },
        { title: "Desfazer", description: "Reverta alterações quando necessário." },
        { title: "PNG, JPG e WebP", description: "Exporte no formato adequado ao destino." },
      ],
      aiHeading: "IA apenas quando precisar",
      aiText: "Remoção avançada de objetos, melhoria de qualidade, iluminação e restauro podem utilizar créditos de IA. As ferramentas básicas continuam gratuitas.",
      usesHeading: "Exemplos de utilização",
      uses: [
        { title: "Assinaturas", description: "Prepare PNG transparentes para documentos." },
        { title: "Produtos", description: "Isole objetos para catálogos e materiais comerciais." },
        { title: "Fotografias", description: "Remova o cenário para novas composições." },
        { title: "Apresentações", description: "Prepare elementos para slides e materiais educativos." },
      ],
      workflowHeading: "Fluxo simples",
      workflow: [
        { title: "1. Envie", description: "Abra a imagem no navegador." },
        { title: "2. Recorte ou remova", description: "Escolha a ferramenta adequada." },
        { title: "3. Aperfeiçoe", description: "Corrija bordas e detalhes." },
        { title: "4. Exporte", description: "Guarde em PNG, JPG ou WebP." },
      ],
      ctaHeading: "Experimente o editor PHANYX",
      ctaText: "Ferramentas básicas gratuitas, diretamente no navegador. IA avançada apenas quando escolher.",
      ctaButton: "Editar imagem agora",
      faqHeading: "Perguntas frequentes",
      faqs: [
        { question: "PHANYX é Photoshop online?", answer: "Não. Photoshop é um produto Adobe. PHANYX oferece um conjunto próprio de ferramentas web." },
        { question: "É gratuito?", answer: "As ferramentas básicas são gratuitas; IA avançada utiliza créditos opcionais." },
        { question: "Posso recortar imagens?", answer: "Sim, o recorte faz parte das ferramentas básicas." },
        { question: "Posso remover fundo de uma assinatura?", answer: "Sim. Existe um modo de assinatura e ferramentas de aperfeiçoamento." },
        { question: "Preciso instalar software?", answer: "Não para o uso normal da ferramenta; funciona no navegador." },
      ],
      relatedHeading: "Leia também",
      rankingLink: "5 melhores removedores de fundo grátis para 2027",
      languagesLabel: "Leia este artigo noutro idioma",
    },
    "en-US": {
      kind: "image-editor",
      title: "Free Online Image Editor: Edit Photos in Your Browser | PHANYX",
      description:
        "Crop, erase, restore, remove backgrounds, and create transparent PNGs in a free online image editor. Advanced AI in PHANYX is optional.",
      keywords: ["free online image editor", "photo editor online", "edit image online", "photoshop online alternative", "crop image", "background remover", "ai image editing"],
      kicker: "Online image editing",
      heading: "Free online image editor: edit photos right in your browser",
      intro:
        "Many people search for “free Photoshop online” when they actually need a quick crop, erase, restore, edge cleanup, background removal, or transparent PNG export. For those focused tasks, a browser-based editor can be faster than installing a full desktop application.",
      imageAlt: "PHANYX online image editor with signature, object, and photo background-removal examples.",
      imageCaption: "PHANYX provides its own browser-based editing tools; Photoshop is an Adobe trademark and is not part of PHANYX.",
      whatHeading: "What a practical online image editor should handle",
      whatParagraphs: [
        "For quick jobs, the essentials are opening an image, reframing it, removing unwanted areas, restoring details, and exporting the right format.",
        "That covers signatures, product images, profile photos, presentations, schoolwork, and everyday professional materials.",
      ],
      photoshopHeading: "What people usually mean by “free Photoshop online”",
      photoshopParagraphs: [
        "Adobe Photoshop is an Adobe product. PHANYX is not Photoshop and does not represent itself as Photoshop. We use “Photoshop-style tasks” only as shorthand for familiar editing actions such as crop, erase, restore, edge refinement, and transparency.",
        "If you need advanced layers, professional painting, complex filters, or full design workflows, dedicated professional software may be more appropriate. For a focused web edit, a lighter tool can be more efficient.",
      ],
      freeHeading: "Free editing tools in PHANYX",
      freeIntro: "Basic tools do not use AI credits. Credits apply only when you choose advanced AI treatment.",
      freeFeatures: [
        { title: "Crop and reframe", description: "Keep only the useful area of the image." },
        { title: "Erase and restore", description: "Remove small areas and recover details." },
        { title: "Brush adjustment", description: "Refine detailed edges with more control." },
        { title: "Halo cleanup", description: "Reduce color spill and unwanted outlines." },
        { title: "Undo", description: "Step back when an edit does not look right." },
        { title: "PNG, JPG, or WebP", description: "Choose transparency or a format that suits the destination." },
      ],
      aiHeading: "AI editing is optional",
      aiText: "Advanced object removal, image enhancement, lighting correction, and photo restoration can use AI credits. The basic editing tools remain free.",
      usesHeading: "Common use cases",
      uses: [
        { title: "Signatures", description: "Create transparent PNG signatures for documents." },
        { title: "Products and objects", description: "Prepare isolated items for catalogs and sales materials." },
        { title: "Photos and profiles", description: "Remove a scene and place a person in a new composition." },
        { title: "School and professional materials", description: "Prepare visuals for slides, assignments, documents, and communication." },
      ],
      workflowHeading: "A simple browser workflow",
      workflow: [
        { title: "1. Upload", description: "Open the image in your browser." },
        { title: "2. Crop or remove", description: "Choose the tool that matches the problem." },
        { title: "3. Refine", description: "Use erase, restore, brush, and halo cleanup." },
        { title: "4. Export", description: "Download PNG, JPG, or WebP." },
      ],
      ctaHeading: "Try PHANYX image and background editor",
      ctaText: "Basic tools are free and work in the browser. Use AI only when you need advanced treatment.",
      ctaButton: "Edit an image now",
      faqHeading: "Frequently asked questions",
      faqs: [
        { question: "Is PHANYX Photoshop online?", answer: "No. Photoshop is an Adobe product. PHANYX is a separate web tool for focused image-editing tasks." },
        { question: "Is the PHANYX image editor free?", answer: "Basic editing tools are free. Advanced AI treatments use optional credits." },
        { question: "Can I crop images online?", answer: "Yes. Cropping and reframing are part of the basic tools." },
        { question: "Can I remove the background from a signature?", answer: "Yes. PHANYX includes a signature mode and manual refinement tools." },
        { question: "Do I need to install anything?", answer: "No for normal use of the page. The workflow runs in the browser." },
      ],
      relatedHeading: "Related reading",
      rankingLink: "5 best free background removers for 2027",
      languagesLabel: "Read this article in another language",
    },
    "es-ES": {
      kind: "image-editor",
      title: "Editor de imágenes gratis online: edita fotos en tu navegador | PHANYX",
      description:
        "Recorta, borra, restaura, elimina fondos y crea PNG transparentes en un editor online. La IA avanzada de PHANYX es opcional.",
      keywords: ["editor de imágenes gratis", "editor fotos online", "editar imagen online", "alternativa photoshop online", "recortar imagen", "tratamiento imagen", "edición imagen ia"],
      kicker: "Edición de imagen online",
      heading: "Editor de imágenes gratis online: edita fotos en tu navegador",
      intro:
        "Muchas personas buscan “Photoshop online gratis” cuando en realidad solo necesitan recortar, borrar, restaurar, corregir bordes, quitar un fondo o exportar un PNG transparente. Para esas tareas, un editor en el navegador puede ser más directo.",
      imageAlt: "Editor PHANYX con ejemplos de firma, objeto y foto antes y después de quitar el fondo.",
      imageCaption: "PHANYX ofrece sus propias herramientas web; Photoshop es una marca de Adobe y no forma parte de PHANYX.",
      whatHeading: "Qué debe resolver un editor de imágenes online",
      whatParagraphs: [
        "Para trabajos rápidos, lo esencial es abrir, recortar, borrar, recuperar detalles y exportar correctamente.",
        "Esto sirve para firmas, productos, fotos de perfil, presentaciones y materiales profesionales.",
      ],
      photoshopHeading: "Qué significa buscar “Photoshop online gratis”",
      photoshopParagraphs: [
        "Adobe Photoshop es un producto de Adobe. PHANYX no es Photoshop. La expresión “edición tipo Photoshop” solo describe tareas conocidas como recortar, borrar, restaurar y trabajar con transparencia.",
        "Para capas avanzadas y diseño profesional complejo, un software especializado puede ser mejor. Para ajustes rápidos, una herramienta web puede ser suficiente.",
      ],
      freeHeading: "Herramientas gratis en PHANYX",
      freeIntro: "Las herramientas básicas no usan créditos. La IA avanzada es opcional.",
      freeFeatures: [
        { title: "Recortar", description: "Ajusta el encuadre." },
        { title: "Borrar y restaurar", description: "Corrige pequeñas áreas." },
        { title: "Ajustar pincel", description: "Trabaja detalles con más precisión." },
        { title: "Quitar halo", description: "Reduce bordes no deseados." },
        { title: "Deshacer", description: "Vuelve atrás cuando sea necesario." },
        { title: "PNG, JPG y WebP", description: "Exporta en el formato adecuado." },
      ],
      aiHeading: "IA solo cuando la necesites",
      aiText: "Eliminar objetos con reconstrucción, mejorar calidad, corregir luz y restaurar fotos pueden usar créditos de IA. Lo básico sigue siendo gratis.",
      usesHeading: "Ejemplos de uso",
      uses: [
        { title: "Firmas", description: "Crea PNG transparentes para documentos." },
        { title: "Productos", description: "Aísla objetos para catálogos y materiales comerciales." },
        { title: "Fotos", description: "Quita el escenario para nuevas composiciones." },
        { title: "Presentaciones", description: "Prepara imágenes para diapositivas y trabajos." },
      ],
      workflowHeading: "Flujo sencillo",
      workflow: [
        { title: "1. Sube", description: "Abre la imagen en el navegador." },
        { title: "2. Recorta o elimina", description: "Elige la herramienta adecuada." },
        { title: "3. Perfecciona", description: "Corrige bordes y detalles." },
        { title: "4. Exporta", description: "Descarga PNG, JPG o WebP." },
      ],
      ctaHeading: "Prueba el editor PHANYX",
      ctaText: "Herramientas básicas gratis en el navegador. IA avanzada solo cuando la elijas.",
      ctaButton: "Editar imagen ahora",
      faqHeading: "Preguntas frecuentes",
      faqs: [
        { question: "¿PHANYX es Photoshop online?", answer: "No. Photoshop es un producto de Adobe. PHANYX es una herramienta web independiente." },
        { question: "¿El editor PHANYX es gratis?", answer: "Las herramientas básicas son gratis. La IA avanzada usa créditos opcionales." },
        { question: "¿Puedo recortar imágenes?", answer: "Sí. El recorte forma parte de las herramientas básicas." },
        { question: "¿Puedo quitar el fondo de una firma?", answer: "Sí. PHANYX incluye modo de firma y herramientas de refinado." },
        { question: "¿Tengo que instalar algo?", answer: "No para el uso normal de la herramienta. Funciona en el navegador." },
      ],
      relatedHeading: "También te puede interesar",
      rankingLink: "5 mejores eliminadores de fondo gratis para 2027",
      languagesLabel: "Lee este artículo en otro idioma",
    },
    "fr-FR": {
      kind: "image-editor",
      title: "Éditeur d’images gratuit en ligne : retouchez dans le navigateur | PHANYX",
      description:
        "Recadrez, effacez, restaurez, supprimez les fonds et créez des PNG transparents en ligne. L’IA avancée PHANYX est optionnelle.",
      keywords: ["éditeur images gratuit", "éditeur photo en ligne", "modifier image en ligne", "alternative photoshop en ligne", "recadrer image", "retouche photo ia"],
      kicker: "Retouche d’image en ligne",
      heading: "Éditeur d’images gratuit en ligne : modifiez vos photos dans le navigateur",
      intro:
        "Beaucoup de personnes recherchent un « Photoshop gratuit en ligne » alors qu’elles veulent simplement recadrer, effacer, restaurer, nettoyer les contours, supprimer un fond ou exporter un PNG transparent. Pour ces tâches ciblées, un outil web peut être plus direct.",
      imageAlt: "Éditeur PHANYX montrant une signature, un objet et une photo avant et après suppression du fond.",
      imageCaption: "PHANYX propose ses propres outils web ; Photoshop est une marque Adobe et ne fait pas partie de PHANYX.",
      whatHeading: "Ce qu’un éditeur d’images en ligne doit savoir faire",
      whatParagraphs: [
        "Pour une retouche rapide, l’essentiel est d’ouvrir l’image, recadrer, effacer, récupérer les détails et exporter correctement.",
        "Cela couvre signatures, produits, photos de profil, présentations et documents professionnels.",
      ],
      photoshopHeading: "Que signifie la recherche « Photoshop gratuit en ligne » ?",
      photoshopParagraphs: [
        "Adobe Photoshop est un produit Adobe. PHANYX n’est pas Photoshop. L’expression « tâches de type Photoshop » décrit seulement des actions courantes : recadrer, effacer, restaurer et gérer la transparence.",
        "Pour les calques avancés et le design professionnel complexe, un logiciel spécialisé reste plus adapté. Pour une retouche rapide, un outil web peut suffire.",
      ],
      freeHeading: "Outils gratuits dans PHANYX",
      freeIntro: "Les outils de base n’utilisent pas de crédits. L’IA avancée reste optionnelle.",
      freeFeatures: [
        { title: "Recadrer", description: "Ajustez le cadrage." },
        { title: "Effacer et restaurer", description: "Corrigez de petites zones." },
        { title: "Régler le pinceau", description: "Travaillez les détails avec précision." },
        { title: "Supprimer le halo", description: "Réduisez les contours indésirables." },
        { title: "Annuler", description: "Revenez sur une modification." },
        { title: "PNG, JPG et WebP", description: "Exportez dans le bon format." },
      ],
      aiHeading: "L’IA uniquement si nécessaire",
      aiText: "Suppression avancée d’objets, amélioration de qualité, correction de lumière et restauration peuvent utiliser des crédits IA. Les outils de base restent gratuits.",
      usesHeading: "Exemples d’utilisation",
      uses: [
        { title: "Signatures", description: "Créez des PNG transparents pour vos documents." },
        { title: "Produits", description: "Isolez des objets pour catalogues et supports commerciaux." },
        { title: "Photos", description: "Supprimez le décor pour une nouvelle composition." },
        { title: "Présentations", description: "Préparez des visuels pour diapositives et travaux." },
      ],
      workflowHeading: "Flux simple",
      workflow: [
        { title: "1. Importez", description: "Ouvrez l’image dans le navigateur." },
        { title: "2. Recadrez ou supprimez", description: "Choisissez l’outil adapté." },
        { title: "3. Affinez", description: "Corrigez contours et détails." },
        { title: "4. Exportez", description: "Téléchargez PNG, JPG ou WebP." },
      ],
      ctaHeading: "Essayez l’éditeur PHANYX",
      ctaText: "Outils de base gratuits dans le navigateur. IA avancée uniquement lorsque vous la choisissez.",
      ctaButton: "Modifier une image",
      faqHeading: "Questions fréquentes",
      faqs: [
        { question: "PHANYX est-il Photoshop en ligne ?", answer: "Non. Photoshop est un produit Adobe. PHANYX est un outil web indépendant." },
        { question: "L’éditeur PHANYX est-il gratuit ?", answer: "Les outils de base sont gratuits. L’IA avancée utilise des crédits optionnels." },
        { question: "Puis-je recadrer une image ?", answer: "Oui. Le recadrage fait partie des outils de base." },
        { question: "Puis-je supprimer le fond d’une signature ?", answer: "Oui. PHANYX propose un mode signature et des outils d’affinage." },
        { question: "Dois-je installer quelque chose ?", answer: "Non pour l’usage normal de l’outil. Il fonctionne dans le navigateur." },
      ],
      relatedHeading: "À lire aussi",
      rankingLink: "5 meilleurs suppresseurs d’arrière-plan gratuits pour 2027",
      languagesLabel: "Lire cet article dans une autre langue",
    },
  },
};
