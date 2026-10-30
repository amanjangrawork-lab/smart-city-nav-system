import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isPages ? "/smart-city-nav-system" : "",
  assetPrefix: isPages ? "/smart-city-nav-system/" : "",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
