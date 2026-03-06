import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.BETTER_AUTH_URL || 'https://screenshot-studio.com'

  return [
    // Editor (main product, now at root)
    {
      url: baseUrl,
      lastModified: new Date('2026-03-06'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Landing page
    {
      url: `${baseUrl}/landing`,
      lastModified: new Date('2026-03-06'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Keyword landing page (high SEO priority)
    {
      url: `${baseUrl}/free-screenshot-editor`,
      lastModified: new Date('2026-03-06'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Features hub page
    {
      url: `${baseUrl}/features`,
      lastModified: new Date('2026-03-06'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Individual feature pages (SEO landing pages)
    {
      url: `${baseUrl}/features/screenshot-beautifier`,
      lastModified: new Date('2026-03-06'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/social-media-graphics`,
      lastModified: new Date('2026-03-06'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/animation-maker`,
      lastModified: new Date('2026-03-06'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/3d-effects`,
      lastModified: new Date('2026-03-06'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Persona/use-case pages (programmatic SEO)
    {
      url: `${baseUrl}/for/developers`,
      lastModified: new Date('2026-03-06'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/for/marketers`,
      lastModified: new Date('2026-03-06'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/for/designers`,
      lastModified: new Date('2026-03-06'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Changelog
    {
      url: `${baseUrl}/changelog`,
      lastModified: new Date('2026-03-06'),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]
}
