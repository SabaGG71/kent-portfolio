import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    qualities: [75, 90],
    // the podcast's frame, straight from YouTube, and photos from Unsplash
    remotePatterns: [
      new URL("https://i.ytimg.com/vi/WtfVjOL8TiU/**"),
      new URL("https://images.unsplash.com/photo-1582994254571-52c62d96ebab?w=1200&h=1200&fit=crop&q=80"),
      // placeholders for the wine and the jewelry until the real photos come in
      new URL("https://images.unsplash.com/photo-1575184560884-5f3ece6e636c?w=2400&q=80"),
      new URL("https://images.unsplash.com/photo-1782988112531-a189b256440e?w=2400&q=80"),
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
