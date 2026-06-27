import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // www → apex: collapse duplicate-content split for search engines
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.diaperdam.com" }],
        destination: "https://diaperdam.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
