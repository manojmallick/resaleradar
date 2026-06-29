/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Keep the native pg driver out of the bundler so it runs in the Node runtime.
  serverExternalPackages: ['pg'],
};

export default nextConfig;
