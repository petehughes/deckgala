/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@aquateamhub/controls", "@aquateamhub/database", "@aquateamhub/api-types"],
};

export default nextConfig;

