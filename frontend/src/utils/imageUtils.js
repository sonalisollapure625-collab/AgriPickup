/**
 * Shared Image URL Resolver
 * Reliably normalizes image paths (relative, absolute, proxy) across all components.
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return null;

  // If already absolute HTTP / HTTPS URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If data URI (e.g. preview)
  if (imagePath.startsWith('data:image/')) {
    return imagePath;
  }

  // Ensure leading slash
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  // In production / custom deployment or standalone frontend, respect VITE_IMAGE_BASE_URL if set
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase && (apiBase.startsWith('http://') || apiBase.startsWith('https://'))) {
    try {
      const url = new URL(apiBase);
      return `${url.origin}${cleanPath}`;
    } catch (_) {}
  }

  return cleanPath;
}
