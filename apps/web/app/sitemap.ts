import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/sign-in`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/sign-up`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
