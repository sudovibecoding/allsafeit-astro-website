#!/usr/bin/env tsx
/**
 * Convert existing body_html / bio_html / overview_html fields → Storyblok richtext.
 *
 * Usage: npm run storyblok:convert-richtext
 */
import { sbApi } from './api';
import { convertHtmlFieldsInTree } from './html-to-richtext';

type StoryRecord = {
  id: number;
  name: string;
  slug: string;
  full_slug?: string;
  is_folder?: boolean;
  content?: Record<string, unknown> | null;
};

function hasHtmlFields(node: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(node)) {
    if (
      (key === 'body_html' || key === 'bio_html' || key === 'overview_html') &&
      typeof value === 'string' &&
      value.trim()
    ) {
      return true;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object' && hasHtmlFields(item as Record<string, unknown>)) {
          return true;
        }
      }
    }
  }
  return false;
}

let page = 1;
let converted = 0;
let scanned = 0;

while (true) {
  const { stories } = (await sbApi(`/stories?page=${page}&per_page=100`)) as {
    stories: StoryRecord[];
  };
  if (!stories?.length) break;

  for (const row of stories) {
    if (row.is_folder) continue;
    scanned += 1;

    // Use list payload when present to avoid an extra API round-trip.
    let story: StoryRecord;
    if (row.content && hasHtmlFields(row.content)) {
      story = row;
    } else if (row.content) {
      continue;
    } else {
      ({ story } = (await sbApi(`/stories/${row.id}`)) as { story: StoryRecord });
      if (!story.content || !hasHtmlFields(story.content)) continue;
    }

    const content = structuredClone(story.content!);
    if (!convertHtmlFieldsInTree(content)) continue;

    await sbApi(`/stories/${story.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        story: {
          name: story.name,
          slug: story.slug,
          content,
        },
      }),
    });
    console.log(`Converted  ${story.full_slug ?? story.slug}`);
    converted += 1;
  }

  if (stories.length < 100) break;
  page += 1;
}

console.log(`\nDone. Scanned ${scanned} stories, converted ${converted}.`);
if (converted === 0) {
  console.log('No body_html / bio_html / overview_html fields remain — nothing to convert.');
}
