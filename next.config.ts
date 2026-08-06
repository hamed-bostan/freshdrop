import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Points next-intl at the per-request config (locale resolution + message loading).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Category icons are served from Supabase Storage — allow next/image to load them.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  // pdfkit locates its bundled AFM font metrics via `__dirname` at load time;
  // webpack rewrites that to a synthetic path when server code is bundled,
  // so pdfkit can't find its own data files (ENOENT on Helvetica.afm).
  // Keeping it external forces a normal `require()` with a real `__dirname`.
  serverExternalPackages: ["pdfkit"],
};

export default withNextIntl(nextConfig);
