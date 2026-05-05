/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Bundle the data directory into API route serverless functions on Vercel
  outputFileTracingIncludes: {
    '/api/*': ['./data/**'],
  },
};

module.exports = nextConfig;
