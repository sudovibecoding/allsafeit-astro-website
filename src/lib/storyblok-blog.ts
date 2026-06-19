const BLOG_INDEX_URL = 'https://www.allsafeit.com/blog';

export type BlogStory = {
  name: string;
  full_slug: string;
  content: {
    publish_date?: string;
    canonical?: string;
    blog_category?: string;
    body?: Array<{ component?: string; image_path?: string; image_alt?: string; lead?: string }>;
  };
};

/** True for individual blog posts (not the blog index). Works with nested and legacy flat slugs. */
export function isBlogPostStory(story: BlogStory): boolean {
  const canonical = story.content?.canonical;
  if (canonical) {
    return (
      canonical.startsWith(`${BLOG_INDEX_URL}/`) &&
      canonical !== BLOG_INDEX_URL &&
      canonical !== `${BLOG_INDEX_URL}/`
    );
  }

  return Boolean(
    story.full_slug?.startsWith('blog/') &&
      story.full_slug !== 'blog/index' &&
      story.full_slug !== 'blog',
  );
}

export function blogPostHref(story: BlogStory): string {
  const canonical = story.content?.canonical;
  if (canonical?.startsWith(BLOG_INDEX_URL)) {
    try {
      return new URL(canonical).pathname;
    } catch {
      /* fall through */
    }
  }
  return `/${story.full_slug}`;
}

export function heroBlogImage(story: BlogStory): string | undefined {
  const hero = story.content.body?.find((b) => b.component === 'hero_blog_post');
  return hero?.image_path;
}

export async function fetchBlogPosts(
  sbApi: { get: (path: string, params: Record<string, unknown>) => Promise<{ data?: { stories?: BlogStory[] } }> },
  version: 'draft' | 'published',
): Promise<BlogStory[]> {
  const all: BlogStory[] = [];
  let page = 1;

  while (true) {
    const { data } = await sbApi.get('cdn/stories', { version, per_page: 100, page });
    const stories = (data?.stories ?? []) as BlogStory[];
    all.push(...stories);
    if (stories.length < 100) break;
    page += 1;
  }

  return all
    .filter(isBlogPostStory)
    .filter((s) => {
      const hero = s.content.body?.find((b) => b.component === 'hero_blog_post');
      return hero?.image_path && s.content.publish_date;
    })
    .sort(
      (a, b) =>
        new Date(b.content.publish_date!).getTime() - new Date(a.content.publish_date!).getTime(),
    );
}
