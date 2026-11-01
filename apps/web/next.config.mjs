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
      // If it contains onrender.com or is not localhost, use HTTPS; otherwise use HTTP
      if (apiUrl.includes('onrender.com') || (!apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1'))) {
        apiUrl = `https://${apiUrl}`;
      } else {
        apiUrl = `http://${apiUrl}`;
      }
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
