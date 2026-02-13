import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/url";

/**
 * Static description pages: indexable content that does not rely on the custom API.
 * Add new description pages here so they appear in the sitemap.
 */
const STATIC_DESCRIPTION_PAGES: {
  path: string;
  changeFrequency: "yearly" | "monthly" | "weekly" | "daily";
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/democratie", changeFrequency: "monthly", priority: 0.8 },
  { path: "/sources", changeFrequency: "monthly", priority: 0.8 },
  { path: "/votes", changeFrequency: "daily", priority: 0.7 },
  { path: "/votes/upcoming", changeFrequency: "daily", priority: 0.7 },
  { path: "/groupes", changeFrequency: "weekly", priority: 0.7 },
  { path: "/mon-depute", changeFrequency: "weekly", priority: 0.8 },
  { path: "/circonscriptions", changeFrequency: "weekly", priority: 0.7 },
  { path: "/timeline", changeFrequency: "daily", priority: 0.7 },
  { path: "/search", changeFrequency: "weekly", priority: 0.6 }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  return STATIC_DESCRIPTION_PAGES.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority
    })
  );
}
