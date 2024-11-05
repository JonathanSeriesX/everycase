import nextra from 'nextra'
import withPWA from 'next-pwa'
import remarkMdxDisableExplicitJsx from 'remark-mdx-disable-explicit-jsx'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
  latex: true,
  /* flexsearch: {
    codeblocks: false,
  },*/
  defaultShowCopyCode: true,
  mdxOptions: {
    remarkPlugins: [
      [
        remarkMdxDisableExplicitJsx,
        { whiteList: ['table', 'thead', 'tbody', 'tr', 'th', 'td'] },
      ],
    ],
  },
})

const baseConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    domains: ['everycase.org'],
    unoptimized: true,
    quality: 100,
    formats: ['image/avif', 'image/webp'],
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
      source: '/docs/guide/:slug(typescript|latex|tailwind-css|mermaid)',
      destination: '/docs/guide/advanced/:slug',
      permanent: true,
    },
    {
      source: '/docs/docs-theme/built-ins/:slug(callout|steps|tabs)',
      destination: '/docs/guide/built-ins/:slug',
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
    locales: ['en-GB'],
    defaultLocale: 'en-GB',
  },
}

const pwaConfig = {
  pwa: {
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'offlineCache',
          expiration: {
            maxEntries: 1500,
          },
        },
      },
    ],
  },
}

const headersFunction = async () => {
  return [
    {
      // matching all API routes
      source: '/(.*)',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'Referrer-Policy',
          value: 'no-referrer-when-downgrade',
        },
        {
          key: 'Content-Security-Policy',
          value:
            "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com 'sha256-iX9LRPdLBV4jlGfQ+1qGl2+8iQlVITwJKum0Gqg4bTQ=' 'sha256-eMuh8xiwcX72rRYNAGENurQBAcH7kLlAUQcoOri3BIo='; style-src 'self' 'unsafe-inline'; font-src 'self' *.everycase.org; img-src 'self' *.everycase.org everycase.imgix.net; connect-src 'self' https://vitals.vercel-insights.com/v1/vitals https://cloudflareinsights.com/cdn-cgi/rum https://lightboxjs-server.herokuapp.com/license; object-src 'none'; report-uri /api/csp-report",
        },
      ],
    },
    {
      source: '/sw.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate',
        },
      ],
    },
  ]
}

export default withNextra(withPWA({ ...baseConfig, ...pwaConfig }))

export { headersFunction }
