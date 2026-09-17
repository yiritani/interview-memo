import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@libsql/client", "@libsql/core", "@libsql/hrana-client", "libsql", "wrangler"],
};

export default nextConfig;
