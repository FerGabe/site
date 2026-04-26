import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = "site";

const nextConfig: NextConfig = {
  // Evita corrupção quando `next dev` e `next build` rodam em momentos próximos.
  // Cada modo usa cache/artefatos separados.
  distDir: isProd ? ".next-prod" : ".next-dev",
  output: "export",
  trailingSlash: true,
  basePath: isProd ? `/${repoName}` : "",
  assetPrefix: isProd ? `/${repoName}/` : undefined,
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "source.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "i.picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
