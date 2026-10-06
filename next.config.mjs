import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin(
  "./i18n/request.ts"
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,


  async redirects() {

    return [
      {
        source: "/blog/software-para-escolas-completo",
        destination: "/sistema-escolar",
        statusCode: 301,
      },

      {
        source: "/blog/software-educacional-completo",
        destination: "/sistema-escolar",
        statusCode: 301,
      },

      {
        source: "/blog/software-para-gestao-escolar",
        destination: "/sistema-escolar",
        statusCode: 301,
      },


      {

        source: "/blog/melhor-sistema-gestao-escolar",

        destination: "/blog/sistema-gestao-escolar",

        statusCode: 301,

      },

      {

        source: "/blog/como-escolher-sistema-escolar",

        destination: "/blog/sistema-gestao-escolar",

        statusCode: 301,

      },

    ];

  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    serverComponentsExternalPackages: [
      "@sparticuz/chromium",
    ],
  },
};

export default withNextIntl(nextConfig);
