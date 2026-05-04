import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.life'
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/events', '/legal'],
      disallow: ['/admin', '/api', '/cuenta', '/auth'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
