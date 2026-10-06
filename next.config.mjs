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
