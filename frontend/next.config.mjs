/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a minimal .next/standalone server bundle for the Docker image,
  // instead of requiring the full node_modules tree at runtime.
  output: 'standalone',
  // The cPanel deployment mounts this app at erp.novamaxpharma.com/frontend
  // (a subpath, not the bare domain) - basePath prefixes every internal
  // asset/page URL Next.js generates so navigation and static assets resolve
  // correctly under that subpath. Not needed for the Docker/VPS deployment,
  // where the app is mounted at its own domain root - only set it when
  // building specifically for the cPanel deploy.
  ...(process.env.DEPLOY_BASE_PATH ? { basePath: process.env.DEPLOY_BASE_PATH } : {}),
};

export default nextConfig;
