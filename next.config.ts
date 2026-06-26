import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Category icons are served from Supabase Storage — allow next/image to load them.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
