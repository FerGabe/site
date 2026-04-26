import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = "site";

const nextConfig: NextConfig = {
  // No desenvolvimento, isola cache para evitar conflito com builds locais.
  // Em produção, usa o padrão do Next para manter export em `out/`.
  ...(isProd ? {} : { distDir: ".next-dev" }),
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
