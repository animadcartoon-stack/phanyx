import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin(
  "./i18n/request.ts"
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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
