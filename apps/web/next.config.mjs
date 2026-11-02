/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // We already type-check locally, skip during production build to prevent memory spikes
    ignoreBuildErrors: true,
  },
  eslint: {
    // Avoid running linting on low-memory free tier builders
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    let apiUrl = rawApiUrl.trim();

    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      const isLocal = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
      apiUrl = isLocal ? `http://${apiUrl}` : `https://${apiUrl}`;
    }

    try {
      const parsed = new URL(apiUrl);
      const host = parsed.hostname;
      if (!host.includes('.') && host !== 'localhost' && host !== '127.0.0.1') {
        parsed.hostname = `${host}.onrender.com`;
        apiUrl = parsed.origin + (parsed.pathname === '/' ? '' : parsed.pathname);
      }
    } catch {
      // If URL parsing fails, retain as-is
    }

    apiUrl = apiUrl.replace(/\/+$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
