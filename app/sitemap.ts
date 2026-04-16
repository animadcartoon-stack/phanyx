import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://phanyx.com.br",
      lastModified: new Date(),
    },
    {
      url: "https://phanyx.com.br/planos",
      lastModified: new Date(),
    },
    {
      url: "https://phanyx.com.br/contato",
      lastModified: new Date(),
    },
    {
      url: "https://phanyx.com.br/sistema-escolar",
      lastModified: new Date(),
    },
    {
      url: "https://phanyx.com.br/plataforma-ead",
      lastModified: new Date(),
    },
    {
      url: "https://phanyx.com.br/gestao-academica",
      lastModified: new Date(),
    },
    {
      url: "https://phanyx.com.br/software-para-cursos",
      lastModified: new Date(),
    },
  ];
}