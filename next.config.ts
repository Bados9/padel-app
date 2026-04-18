import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  basePath,
  output: "standalone",
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Povolíme embed aplikace v libovolném iframe (prototyp).
        // Později zúžit whitelistem přes IFRAME_ALLOWED_ORIGINS.
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
