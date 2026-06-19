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

async function findStorySlugByRealPath(
  sbApi: ReturnType<typeof useStoryblokApi>,
  expectedPath: string,
  version: 'draft' | 'published',
): Promise<string | null> {
  let page = 1;

  while (true) {
    const { data } = await sbApi.get('cdn/links', { version, per_page: 100, page });
    const links = Object.values((data?.links ?? {}) as Record<string, StoryblokLink>);
    const match = links.find(
      (link) =>
        !link.is_folder &&
        normalizePath(link.real_path) === normalizePath(expectedPath),
    );
    if (match?.slug) return match.slug;
    if (links.length < 100) break;
    page += 1;
  }

  return null;
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
