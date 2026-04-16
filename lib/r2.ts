/**
 * Static Asset URL Utilities
 *
 * Assets are served from /public via Next.js static file serving.
 */

/**
 * Get the public URL for a static asset.
 * Assets are served from /public via Next.js static file serving.
 *
 * @param path - The asset path (e.g., "/mac/mac-asset-1.jpeg")
 * @returns The URL path with leading slash
 */
export function getR2PublicUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return cleanPath;
}

/**
 * Get an image URL for a static asset.
 * Returns the path as-is for full URLs, blob URLs, and data URLs.
 * For relative paths, ensures a leading slash for /public serving.
 *
 * @param options - Image options
 * @returns The image URL
 */
export function getR2ImageUrl(options: {
  src: string;
  width?: number;
  height?: number;
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
}): string {
  const { src } = options;

  // If it's already a full URL, return as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  // If it's a blob URL or data URL, return as-is
  if (src.startsWith('blob:') || src.startsWith('data:')) {
    return src;
  }

  // Otherwise, ensure leading slash for /public serving
  return getR2PublicUrl(src);
}
