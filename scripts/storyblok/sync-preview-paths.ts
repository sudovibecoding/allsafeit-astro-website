#!/usr/bin/env tsx
/**
 * Set Storyblok Real path (`story.path`) on every story from canonical / preview_path.
 * Required for Visual Editor preview — the space Preview URL is only the origin
 * (e.g. https://localhost:4322); Storyblok appends each story's Real path.
 *
 * Usage: npm run storyblok:sync-paths
 */
import { sbApi } from './api';
import { storyRealPath } from './story-path';

type StoryRecord = {
  id: number;
  name: string;
  slug: string;
  full_slug?: string;
  path?: string | null;
  is_folder?: boolean;
  content?: Record<string, unknown> | null;
};

let page = 1;
let updated = 0;
let skipped = 0;

while (true) {
  const { stories } = (await sbApi(`/stories?page=${page}&per_page=100`)) as {
    stories: StoryRecord[];
  };
  if (!stories?.length) break;

  for (const row of stories) {
    if (row.is_folder) continue;

    const { story } = (await sbApi(`/stories/${row.id}`)) as { story: StoryRecord };
    if (!story.content) {
      skipped += 1;
      continue;
    }

    const path = storyRealPath(story.content);
    if (!path) {
      skipped += 1;
      continue;
    }

    if (story.path === path) continue;

    await sbApi(`/stories/${story.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        story: {
          name: story.name,
          slug: story.slug,
          path,
          content: story.content,
        },
      }),
    });
    console.log(`Path  ${story.full_slug ?? story.slug} → ${path}`);
    updated += 1;
  }

  if (stories.length < 100) break;
  page += 1;
}

console.log(`\nDone. Updated ${updated} stories, skipped ${skipped} without a path.`);
