import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Codespaces serves the dev server from https://<name>-3000.app.github.dev.
  // Next.js blocks dev resources (hot reload) for non-localhost origins unless listed here.
  allowedDevOrigins: ["*.app.github.dev"],
};

export default nextConfig;
