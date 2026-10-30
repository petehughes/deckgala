/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@deckgala/controls", "@deckgala/database", "@deckgala/api-types"],
};

export default nextConfig;

