import type { MetadataRoute } from "next";
import { materials } from "@/lib/materials";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://decoforge-baguio.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages = ["", "/catalog", "/projects", "/contact", "/privacy", "/terms", "/sustainability", "/careers"];

  return [
    ...pages.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...materials.map((m) => ({
      url: `${base}/catalog/${m.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
