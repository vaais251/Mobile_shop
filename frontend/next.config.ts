import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactCompiler: true,
  reactStrictMode: true,

  // Empty turbopack config to suppress warning
  turbopack: {},
};

export default nextConfig;
