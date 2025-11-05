/**
 * Normalizes image URLs to work with the proxy configuration.
 * Converts absolute localhost URLs to relative paths.
 *
 * @param url - The image URL from the API
 * @returns Normalized URL compatible with the proxy
 *
 * @example
 * normalizeImageUrl('http://localhost:3002/uploads/pets/image.jpg')
 * // Returns: '/uploads/pets/image.jpg'
 *
 * normalizeImageUrl('/uploads/pets/image.jpg')
 * // Returns: '/uploads/pets/image.jpg'
 */
export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url) {
    return '';
  }

  // If URL is already relative, return as is
  if (url.startsWith('/')) {
    return url;
  }

  // If URL contains localhost:3002, extract the path
  if (url.includes('localhost:3002')) {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname; // Returns "/uploads/pets/image.jpg"
    } catch {
      // If URL parsing fails, try regex
      const match = url.match(/localhost:\d+(\/.*)/);
      return match ? match[1] : url;
    }
  }

  // For other absolute URLs, return as is
  return url;
}
