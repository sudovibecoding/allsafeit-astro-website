/** Public URL path used by Storyblok Visual Editor (story `path` / Real path). */
export function storyRealPath(content: Record<string, unknown>): string | undefined {
  const preview = content.preview_path;
  if (typeof preview === 'string' && preview.startsWith('/')) {
    return preview.replace(/\/$/, '') || '/';
  }

  const canonical = content.canonical;
  if (typeof canonical === 'string') {
    try {
      return new URL(canonical).pathname.replace(/\/$/, '') || '/';
    } catch {
      /* ignore */
    }
  }

  return undefined;
}
