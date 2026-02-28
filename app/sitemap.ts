import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.BETTER_AUTH_URL || 'https://screenshot-studio.com'
  const lastModified = new Date()

  return [
    // Homepage (highest priority)
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Editor (main product)
    {
      url: `${baseUrl}/home`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Features hub page
    {
      url: `${baseUrl}/features`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Keyword landing page (high SEO priority)
    {
      url: `${baseUrl}/free-screenshot-editor`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Individual feature pages (SEO landing pages)
    {
      url: `${baseUrl}/features/screenshot-beautifier`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/social-media-graphics`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/animation-maker`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/3d-effects`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Changelog
    {
      url: `${baseUrl}/changelog`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]
}
