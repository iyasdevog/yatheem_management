import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/**/*': ['./prisma/**/*'],
  },
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
};

export default nextConfig;
