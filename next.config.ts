import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle drizzle-orm in client-side code
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'drizzle-orm': false,
        'postgres': false,
      };
    }
    return config;
  },
  serverExternalPackages: ['drizzle-orm', 'postgres'],
};

export default nextConfig;
