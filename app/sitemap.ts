import type { MetadataRoute } from "next";
import {
  marketingAlternates,
  marketingLocales,
  marketingPath,
  type MarketingSection,
} from "@/lib/public-marketing";
import {
  digitalSchoolArticleAlternates,
  digitalSchoolArticleLocales,
  digitalSchoolArticlePath,
} from "@/lib/digital-school-management-article";
import {
  imageToolsArticleAlternates,
  imageToolsArticleLocales,
  imageToolsArticlePath,
  type ImageToolsArticleKind,
} from "@/lib/image-tools-blog";
import {
  onlineSchoolArticleAlternates,
  onlineSchoolArticleLocales,
  onlineSchoolArticlePath,
} from "@/lib/online-school-management-article";
import {
  openCoursesArticleAlternates,
  openCoursesArticleLocales,
  openCoursesArticlePath,
} from "@/lib/open-courses-article";
import {
  schoolGuideAlternates,
  schoolGuideLocales,
  schoolGuidePath,
} from "@/lib/school-guide";
import {
  backgroundRemoverAlternates,
  backgroundRemoverLocales,
  backgroundRemoverPath,
} from "@/lib/background-remover-i18n";
import {
  phanyxBlogLanguagePaths,
  phanyxBlogLocales,
  phanyxBlogPath,
} from "@/lib/phanyx-blog-hub";
import {
  phanyxResourceKeys,
  phanyxResourceLanguagePaths,
  phanyxResourcePath,
} from "@/lib/phanyx-resource-pages";

const baseUrl = "https://phanyx.com.br";

const sections: MarketingSection[] = [
  "home",
  "academic",
  "plans",
  "school",
  "lms",
  "success",
  "enrollment",
  "registrar",
];

const imageArticleKinds: ImageToolsArticleKind[] = ["background-removers", "image-editor"];

const brazilianPages = [
  "/gestao-escolar",
  "/sistema-escolar",
  "/plataforma-ead",
  "/software-para-cursos",
  "/contato",
  "/phanyx",
];

const blogPages = [
  "/blog/melhor-sistema-academico",
  "/blog/sistema-escolar-para-pequenas-escolas",
  "/blog/plataforma-para-ensino-online",
  "/blog/melhor-plataforma-para-cursos-online",
  "/blog/como-montar-um-curso-online",
  "/blog/melhor-plataforma-ead-para-escolas",
  "/blog/sistema-academico-completo",
  "/blog/quanto-custa-criar-um-curso-online",
  "/blog/plataforma-para-escolas-online",
  "/blog/gestao-escolar-digital",
  "/blog/como-vender-cursos-online",
  "/blog/sistema-de-gestao-escolar-online",
  "/blog/sistema-escolar-gratis-vs-pago",
  "/blog/como-aumentar-matriculas-com-sistema-escolar-moderno",
  "/blog/plataforma-ead-para-cursos-livres",
  "/blog/gestao-academica-na-pratica",
  "/blog/como-reduzir-inadimplencia-escolar-com-tecnologia",
  "/blog/controle-financeiro-para-escolas",
  "/blog/sistema-para-cursos-profissionalizantes",
  "/blog/sistema-gestao-escolar",
  "/blog/sistema-escolar-vs-moodle",
];

function absoluteAlternates(languages: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(languages).map(([locale, path]) => [locale, `${baseUrl}${path}`]));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const guideAlternates = absoluteAlternates(schoolGuideAlternates().languages as Record<string, string>);
  const onlineArticleAlternates = absoluteAlternates(onlineSchoolArticleAlternates().languages as Record<string, string>);
  const digitalArticleAlternates = absoluteAlternates(digitalSchoolArticleAlternates().languages as Record<string, string>);
  const openCoursesAlternates = absoluteAlternates(openCoursesArticleAlternates().languages as Record<string, string>);
  const removerAlternates = absoluteAlternates(backgroundRemoverAlternates().languages as Record<string, string>);
  const blogAlternates = absoluteAlternates({ ...phanyxBlogLanguagePaths(), "x-default": "/blog" });

  const localizedPages: MetadataRoute.Sitemap = sections.flatMap((section) =>
    marketingLocales
      .filter((locale) => !["school", "lms", "success"].includes(section) || locale !== "pt-BR")
      .map((locale) => ({
        url: `${baseUrl}${marketingPath(locale, section)}`,
        alternates: { languages: absoluteAlternates(marketingAlternates(section).languages as Record<string, string>) },
      })),
  );

  const removerPages: MetadataRoute.Sitemap = backgroundRemoverLocales.map((locale) => ({
    url: `${baseUrl}${backgroundRemoverPath(locale)}`,
    alternates: { languages: removerAlternates },
  }));

  const imageArticlePages: MetadataRoute.Sitemap = imageArticleKinds.flatMap((kind) => {
    const alternates = absoluteAlternates(imageToolsArticleAlternates(kind).languages as Record<string, string>);
    return imageToolsArticleLocales.map((locale) => ({
      url: `${baseUrl}${imageToolsArticlePath(kind, locale)}`,
      alternates: { languages: alternates },
    }));
  });

  const blogHubPages: MetadataRoute.Sitemap = phanyxBlogLocales.map((locale) => ({
    url: `${baseUrl}${phanyxBlogPath(locale)}`,
    alternates: { languages: blogAlternates },
  }));

  const resourcePages: MetadataRoute.Sitemap = phanyxResourceKeys.flatMap((key) => {
    const languagePaths = phanyxResourceLanguagePaths(key);
    const alternates = absoluteAlternates({ ...languagePaths, "x-default": languagePaths["pt-BR"] });
    return phanyxBlogLocales.map((locale) => ({
      url: `${baseUrl}${phanyxResourcePath(locale, key)}`,
      alternates: { languages: alternates },
    }));
  });

  return [
    ...localizedPages,
    ...removerPages,
    ...brazilianPages.map((path) => ({ url: `${baseUrl}${path}` })),
    ...blogHubPages,
    ...blogPages
      .filter(
        (path) =>
          path !== schoolGuidePath("pt-BR") &&
          path !== onlineSchoolArticlePath("pt-BR") &&
          path !== digitalSchoolArticlePath("pt-BR") &&
          path !== openCoursesArticlePath("pt-BR"),
      )
      .map((path) => ({ url: `${baseUrl}${path}` })),
    ...resourcePages,
    ...schoolGuideLocales.map((locale) => ({
      url: `${baseUrl}${schoolGuidePath(locale)}`,
      alternates: { languages: guideAlternates },
    })),
    ...onlineSchoolArticleLocales.map((locale) => ({
      url: `${baseUrl}${onlineSchoolArticlePath(locale)}`,
      alternates: { languages: onlineArticleAlternates },
    })),
    ...digitalSchoolArticleLocales.map((locale) => ({
      url: `${baseUrl}${digitalSchoolArticlePath(locale)}`,
      alternates: { languages: digitalArticleAlternates },
    })),
    ...openCoursesArticleLocales.map((locale) => ({
      url: `${baseUrl}${openCoursesArticlePath(locale)}`,
      alternates: { languages: openCoursesAlternates },
    })),
    ...imageArticlePages,
  ];
}
