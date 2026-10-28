import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ["*.e2b.app"],
  async redirects() {
    return [
      {
        source: "/adminuser/login",
        destination: "/admin/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
