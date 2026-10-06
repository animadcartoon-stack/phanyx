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
  onlineSchoolArticleAlternates,
  onlineSchoolArticleLocales,
  onlineSchoolArticlePath,
} from "@/lib/online-school-management-article";
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

const brazilianPages = [
  "/gestao-escolar",
  "/sistema-escolar",
  "/plataforma-ead",
  "/software-para-cursos",
  "/contato",
  "/phanyx",
];

const blogPages = [
  "/blog",
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

export default function sitemap(): MetadataRoute.Sitemap {
  const guideAlternates = Object.fromEntries(
    Object.entries(schoolGuideAlternates().languages).map(
      ([locale, path]) => [locale, `${baseUrl}${path}`],
    ),
  );

  const onlineArticleAlternates = Object.fromEntries(
    Object.entries(onlineSchoolArticleAlternates().languages).map(
      ([locale, path]) => [locale, `${baseUrl}${path}`],
    ),
  );

  const digitalArticleAlternates = Object.fromEntries(
    Object.entries(digitalSchoolArticleAlternates().languages).map(
      ([locale, path]) => [locale, `${baseUrl}${path}`],
    ),
  );

  const removerAlternates = Object.fromEntries(
    Object.entries(backgroundRemoverAlternates().languages).map(
      ([locale, path]) => [locale, `${baseUrl}${path}`],
    ),
  );

  const localizedPages: MetadataRoute.Sitemap = sections.flatMap((section) =>
    marketingLocales
      .filter(
        (locale) =>
          !["school", "lms", "success"].includes(section) ||
          locale !== "pt-BR",
      )
      .map((locale) => ({
        url: `${baseUrl}${marketingPath(locale, section)}`,
        alternates: {
          languages: Object.fromEntries(
            Object.entries(marketingAlternates(section).languages).map(
              ([language, path]) => [language, `${baseUrl}${path}`],
            ),
          ),
        },
      })),
  );

  const removerPages: MetadataRoute.Sitemap =
    backgroundRemoverLocales.map((locale) => ({
      url: `${baseUrl}${backgroundRemoverPath(locale)}`,
      alternates: { languages: removerAlternates },
    }));

  return [
    ...localizedPages,
    ...removerPages,
    ...brazilianPages.map((path) => ({ url: `${baseUrl}${path}` })),
    ...blogPages
      .filter(
        (path) =>
          path !== schoolGuidePath("pt-BR") &&
          path !== onlineSchoolArticlePath("pt-BR") &&
          path !== digitalSchoolArticlePath("pt-BR"),
      )
      .map((path) => ({ url: `${baseUrl}${path}` })),
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
  ];
}
