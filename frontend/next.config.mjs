/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Placeholder images in /public are used directly; optimisation is re-enabled in Phase 6.
    unoptimized: true,
  },
  async rewrites() {
    // Proxy API calls to the Express backend so the browser only talks to the frontend origin.
    const backend = process.env.BACKEND_URL ?? "http://localhost:5000"
    return [{ source: "/api/v1/:path*", destination: `${backend}/api/v1/:path*` }]
  },
}

export default nextConfig
