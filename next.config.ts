import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // 프론트엔드에서 /api/... 로 시작하는 모든 요청을
        source: "/api/:path*",
        // 백엔드 AWS 서버로 몰래 전달(Proxy)합니다.
        destination: "http://43.200.89.191/api/:path*",
      },
    ];
  },
};

export default nextConfig;