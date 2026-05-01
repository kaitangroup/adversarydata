/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // better-sqlite3 is a native module; mark it external so webpack doesn't bundle it
  serverExternalPackages: ['better-sqlite3'],
  outputFileTracingRoot: process.cwd(),
  // Allow domain images if you ever load remote thumbnails
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
};

export default nextConfig;
