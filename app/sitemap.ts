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
  url: "https://www.phanyx.com.br/blog/melhor-sistema-academico",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/sistema-escolar-para-pequenas-escolas",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/software-educacional-completo",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/plataforma-para-ensino-online",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/melhor-plataforma-para-cursos-online",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/como-montar-um-curso-online",
  lastModified: new Date(),
},
{
  url: "https://phanyx.com.br/blog/melhor-plataforma-ead-para-escolas",
}
{
  url: "https://www.phanyx.com.br/blog/sistema-academico-completo",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/quanto-custa-criar-um-curso-online",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/plataforma-para-escolas-online",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/gestao-escolar-digital",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/software-para-gestao-escolar",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/como-vender-cursos-online",
  lastModified: new Date(),
},
    {
  url: "https://www.phanyx.com.br/blog/sistema-de-gestao-escolar-online",
  lastModified: new Date(),
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
  url: "https://www.phanyx.com.br/blog",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/como-escolher-sistema-escolar",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/sistema-escolar-gratis-vs-pago",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/como-aumentar-matriculas-com-sistema-escolar-moderno",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/plataforma-ead-para-cursos-livres",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/software-para-escolas-completo",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/gestao-academica-na-pratica",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/como-reduzir-inadimplencia-escolar-com-tecnologia",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/controle-financeiro-para-escolas",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/sistema-para-cursos-profissionalizantes",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/blog/sistema-gestao-escolar",
  lastModified: new Date(),
},
{
  url: "https://www.phanyx.com.br/phanyx",
  lastModified: new Date(),
},
    {
      url: `${baseUrl}/contato`,
      lastModified: new Date(),
      priority: 0.7,
      changeFrequency: "yearly",
    },
  ];
}