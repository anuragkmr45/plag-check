import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: [...securityHeaders],
        source: "/:path*"
      }
    ];
  }
};

export default nextConfig;
