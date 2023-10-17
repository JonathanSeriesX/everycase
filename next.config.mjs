import nextra from "nextra"
import remarkMdxDisableExplicitJsx from "remark-mdx-disable-explicit-jsx"
import withPWA from "next-pwa"

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
  mdxOptions: {
    remarkPlugins: [
      [
        remarkMdxDisableExplicitJsx,
        { whiteList: ["table", "thead", "tbody", "tr", "th", "td", "img"] },
      ],
    ],
  },
  latex: true,
  flexsearch: {
    codeblocks: false,
  },
  defaultShowCopyCode: true,
})

const baseConfig = {
  output: "export",
  distDir: "dist",
  images: {
    domains: ["everycase.org", "applecase.wiki"],
    unoptimized: true,
    quality: 100,
    formats: ["image/avif", "image/webp"],
    imageSizes: [512, 1536],
  },
  swcMinify: true,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  redirects: () => [
    {
      source: "/docs/guide/:slug(typescript|latex|tailwind-css|mermaid)",
      destination: "/docs/guide/advanced/:slug",
      permanent: true,
    },
    {
      source: "/docs/docs-theme/built-ins/:slug(callout|steps|tabs)",
      destination: "/docs/guide/built-ins/:slug",
      permanent: true,
    },
  ],
  webpack(config) {
    return config
  },
  experimental: {
    scrollRestoration: true,
  },
  i18n: {
    locales: ["en-GB"],
    defaultLocale: "en-GB",
  },
}

const pwaConfig = {
  pwa: {
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "offlineCache",
          expiration: {
            maxEntries: 200,
          },
        },
      },
    ],
  },
}

export default withNextra(withPWA({ ...baseConfig, ...pwaConfig }))
