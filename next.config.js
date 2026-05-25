/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // In local dev, proxy /api/* to the FastAPI server (uvicorn on port 5328).
    // In production, Vercel's edge routing handles /api/* via vercel.json before
    // Next.js rewrites are evaluated, so this branch is never reached on Vercel.
    return [
      {
        source: '/api/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:5328/api/:path*'
            : '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
