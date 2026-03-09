import { MetadataRoute } from 'next'
import { getAllComparisonSlugs } from '@/lib/seo/comparisons'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.BETTER_AUTH_URL || 'https://screenshot-studio.com'
  const now = new Date('2026-03-09')

  const comparisonSlugs = getAllComparisonSlugs()

  return [
    // Editor (main product, now at root)
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Landing page
    {
      url: `${baseUrl}/landing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Keyword landing page (high SEO priority)
    {
      url: `${baseUrl}/free-screenshot-editor`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Features hub page
    {
      url: `${baseUrl}/features`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Individual feature pages (SEO landing pages)
    {
      url: `${baseUrl}/features/screenshot-beautifier`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/social-media-graphics`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/animation-maker`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/3d-effects`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/browser-mockups`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Comparison pages (programmatic SEO - "vs" keywords)
    ...comparisonSlugs.map((slug) => ({
      url: `${baseUrl}/compare/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    // Persona/use-case pages (programmatic SEO)
    {
      url: `${baseUrl}/for/developers`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/for/marketers`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/for/designers`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Changelog
    {
      url: `${baseUrl}/changelog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]
}
