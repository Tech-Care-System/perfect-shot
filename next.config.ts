import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["jotai"],
  // Standalone tracing misses Sharp's Windows runtime DLLs.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/.pnpm/@img+sharp-win32-*/node_modules/@img/sharp-win32-*/lib/*.dll",
    ],
  },

  // CSP Headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; worker-src 'self' blob:; connect-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
