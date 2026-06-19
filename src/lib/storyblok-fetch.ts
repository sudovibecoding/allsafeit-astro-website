import { useStoryblokApi } from '@storyblok/astro';

export type StoryblokStory = {
  name: string;
  full_slug: string;
  content: Record<string, unknown> & {
    meta_title?: string;
    meta_description?: string;
    canonical?: string;
    preview_path?: string;
  };
};

export function storyblokVersion(url: URL, dev: boolean): 'draft' | 'published' {
  return url.searchParams.has('_storyblok') || dev ? 'draft' : 'published';
}

/** Map Storyblok story slug → public URL pathname. */
export function expectedUrlPath(slug: string): string {
  if (slug === 'home' || slug === '') return '/';
  return `/${slug}`.replace(/\/+/g, '/');
}

/** URL paths like `locations/foo` may map to a root Storyblok slug `foo`. */
export function storySlugCandidates(urlSlug: string): string[] {
  const candidates = [urlSlug];
  const tail = urlSlug.includes('/') ? urlSlug.split('/').pop()! : null;
  if (tail && tail !== urlSlug) candidates.push(tail);

  // Admin folder moves (blog-pages/*, industries-pages/*) — keep public URLs unchanged.
  if (urlSlug.startsWith('blog/')) {
    candidates.push(`blog-pages/${urlSlug.slice('blog/'.length)}`);
  }
  if (urlSlug.startsWith('industries/')) {
    candidates.push(`industries-pages/${urlSlug.slice('industries/'.length)}`);
  }

  return [...new Set(candidates)];
}

export async function fetchStory(
  slug: string,
  version: 'draft' | 'published',
): Promise<StoryblokStory | null> {
  const sbApi = useStoryblokApi();
  const expectedPath = expectedUrlPath(slug);

  for (const candidate of storySlugCandidates(slug)) {
    try {
      const { data } = await sbApi.get(`cdn/stories/${candidate}`, { version });
      const story = data?.story as StoryblokStory | undefined;
      if (!story?.content) continue;

      const canonical = story.content.canonical;
      if (canonical) {
        try {
          const path = new URL(canonical).pathname.replace(/\/$/, '') || '/';
          if (path === expectedPath) return story;
          continue;
        } catch {
          /* fall through */
        }
      }

      if (candidate === slug || story.full_slug === slug) return story;
      if (slug === 'home' && (candidate === 'home' || story.full_slug === 'home')) return story;
    } catch {
      /* try next candidate */
    }
  }

  // Fallback for stories organized under admin folders where public URL comes from Real path.
  const resolvedSlug = await findStorySlugByRealPath(sbApi, expectedPath, version);
  if (resolvedSlug) {
    try {
      const { data } = await sbApi.get(`cdn/stories/${resolvedSlug}`, { version });
      if (data?.story) return data.story;
    } catch {
      /* not found */
    }
  }
  return null;
}

type StoryblokLink = {
  slug?: string;
  real_path?: string;
  is_folder?: boolean;
};

type LinksCache = {
  version: string;
  expires: number;
  byPath: Map<string, string>;
};

let linksCache: LinksCache | null = null;
const LINKS_CACHE_TTL_MS = 5 * 60 * 1000;

async function linksByRealPath(
  sbApi: ReturnType<typeof useStoryblokApi>,
  version: 'draft' | 'published',
): Promise<Map<string, string>> {
  if (linksCache && linksCache.version === version && linksCache.expires > Date.now()) {
    return linksCache.byPath;
  }

  const byPath = new Map<string, string>();
  let page = 1;

  while (true) {
    const { data } = await sbApi.get('cdn/links', { version, per_page: 1000, page });
    const links = Object.values((data?.links ?? {}) as Record<string, StoryblokLink>);
    for (const link of links) {
      if (link.is_folder || !link.slug) continue;
      const path = normalizePath(link.real_path);
      if (path) byPath.set(path, link.slug);
    }
    if (links.length < 1000) break;
    page += 1;
  }

  linksCache = { version, expires: Date.now() + LINKS_CACHE_TTL_MS, byPath };
  return byPath;
}

async function findStorySlugByRealPath(
  sbApi: ReturnType<typeof useStoryblokApi>,
  expectedPath: string,
  version: 'draft' | 'published',
): Promise<string | null> {
  const map = await linksByRealPath(sbApi, version);
  return map.get(normalizePath(expectedPath)) ?? null;
}

function normalizePath(path?: string): string {
  if (!path) return '';
  return path.replace(/\/$/, '') || '/';
}

export async function fetchAllStorySlugs(
  version: 'draft' | 'published' = 'published',
): Promise<string[]> {
  const sbApi = useStoryblokApi();
  const slugs: string[] = [];
  let page = 1;

  while (true) {
    const { data } = await sbApi.get('cdn/stories', {
      version,
      per_page: 100,
      page,
    });
    const stories = data?.stories ?? [];
    for (const story of stories) {
      if (story.full_slug) slugs.push(story.full_slug);
    }
    if (stories.length < 100) break;
    page += 1;
  }

  return slugs;
}
