/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@agora/shared'],
  async redirects() {
    return [{ source: '/favicon.ico', destination: '/icon', permanent: true }]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "script-src-elem 'self' 'unsafe-inline'",
              "script-src-attr 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "media-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https: http://localhost:3001 http://127.0.0.1:3001",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
