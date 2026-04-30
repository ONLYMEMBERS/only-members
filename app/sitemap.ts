import { MetadataRoute } from 'next'
import { fetchEventSlugs } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.life'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  ]

  try {
    const slugs = await fetchEventSlugs()
    const eventRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
      url: `${siteUrl}/events/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
    return [...staticRoutes, ...eventRoutes]
  } catch {
    return staticRoutes
  }
}
