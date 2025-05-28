import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: 'https://clado.ai',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
