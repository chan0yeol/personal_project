/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://backend:8000'}/api/:path*`,
      },
    ];
  },
  httpAgentOptions: {
    keepAlive: true,
  },
  experimental: {
    proxyTimeout: 120000, // 2분
  },
};

export default nextConfig;
