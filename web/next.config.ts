import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    /*
      next/image defaults to quality 75, which is visibly soft on
      photographs with foliage and roof texture. Next 16 only allows the
      quality values listed here, so 90 (hero) and 85 (listing cards)
      have to be declared before they can be used.
    */
    qualities: [75, 85, 90],
    // Listing photos uploaded to Supabase Storage.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
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
