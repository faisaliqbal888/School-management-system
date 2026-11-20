/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Serve AVIF/WebP derivatives from the Next.js optimiser. Local files under
    // /public are optimised on demand and cached, so the 2 MB of avatars and
    // placeholders ship at a fraction of their source size.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 640, 768, 1024, 1280],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  async rewrites() {
    // Proxy API calls to the Express backend so the browser only talks to the frontend origin.
    const backend = process.env.BACKEND_URL ?? "http://localhost:5000"
    return [{ source: "/api/v1/:path*", destination: `${backend}/api/v1/:path*` }]
  },
}

export default nextConfig
