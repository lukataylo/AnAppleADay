/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@apple/core"],
  webpack: (config) => {
    // Let TypeScript ".js" import specifiers resolve to ".ts" sources in the
    // workspace core package.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
