import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://phanyx.com.br";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      priority: 1,
      changeFrequency: "daily",
    },
    {
      url: `${baseUrl}/sistema-escolar`,
      lastModified: new Date(),
      priority: 1,
      changeFrequency: "daily",
    },
    {
      url: `${baseUrl}/gestao-academica`,
      lastModified: new Date(),
      priority: 1,
      changeFrequency: "weekly",
    },
    {
      url: `${baseUrl}/plataforma-ead`,
      lastModified: new Date(),
      priority: 1,
      changeFrequency: "weekly",
    },
    {
      url: `${baseUrl}/software-para-cursos`,
      lastModified: new Date(),
      priority: 1,
      changeFrequency: "weekly",
    },
    {
      url: `${baseUrl}/planos`,
      lastModified: new Date(),
      priority: 0.8,
      changeFrequency: "monthly",
    },
    {
  url: `${baseUrl}/gestao-escolar`,
  lastModified: new Date(),
  priority: 1,
  changeFrequency: "weekly",
},
    {
      url: `${baseUrl}/contato`,
      lastModified: new Date(),
      priority: 0.7,
      changeFrequency: "yearly",
    },
  ];
}