/**
 * Resolve images from Storyblok assets or local static paths.
 * Seeded stories use `image_path` (text) — never fake asset objects (those break publish).
 */
export function storyblokAssetUrl(
  value?: { filename?: string; id?: number } | string | null,
): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  const filename = value.filename?.trim();
  if (!filename) return undefined;
  // Storyblok CDN asset
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
  // Local static path (served by Astro from /public)
  if (filename.startsWith('/')) return filename;
  // Storyblok relative path on their CDN
  if (value.id) return filename;
  return undefined;
}

/** Prefer CMS asset; fall back to `image_path` text from migration. */
export function resolveImage(
  asset?: { filename?: string; id?: number } | string | null,
  imagePath?: string | null,
): string | undefined {
  const fromAsset = storyblokAssetUrl(asset);
  if (fromAsset?.startsWith('http') || fromAsset?.startsWith('/')) return fromAsset;
  const path = imagePath?.trim();
  if (path) return path.startsWith('/') ? path : `/${path}`;
  return undefined;
}
