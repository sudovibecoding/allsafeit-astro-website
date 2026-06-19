#!/usr/bin/env tsx
/**
 * Organize Storyblok content into folders (services, industries, blog, …)
 * and remove empty orphan folders from earlier failed migrations.
 *
 * Public URLs are unchanged — only Storyblok admin structure + full_slug change.
 * The site resolves pages via Real path + canonical, not Storyblok folder slug alone.
 *
 * Usage: npm run storyblok:organize-folders
 */
import { sbApi } from './api';
import { storyRealPath } from './story-path';

type StoryRecord = {
  id: number;
  name: string;
  slug: string;
  full_slug?: string;
  parent_id?: number | null;
  is_folder?: boolean;
  is_startpage?: boolean;
  path?: string | null;
  content: Record<string, unknown> | null;
};

const folderCache = new Map<string, number>();

async function listAllStories(): Promise<StoryRecord[]> {
  const all: StoryRecord[] = [];
  let page = 1;
  while (true) {
    const { stories } = (await sbApi(`/stories?page=${page}&per_page=100`)) as {
      stories: StoryRecord[];
    };
    if (!stories?.length) break;
    all.push(...stories);
    if (stories.length < 100) break;
    page += 1;
  }
  return all;
}

async function findFolderByFullSlug(fullSlug: string): Promise<StoryRecord | undefined> {
  const { stories } = (await sbApi(
    `/stories?with_slug=${encodeURIComponent(fullSlug)}`,
  )) as { stories: StoryRecord[] };
  return stories?.find((s) => s.is_folder && s.full_slug === fullSlug);
}

async function ensureFolder(folderPath: string, displayName?: string): Promise<number> {
  const cached = folderCache.get(folderPath);
  if (cached) return cached;

  const existing = await findFolderByFullSlug(folderPath);
  if (existing) {
    folderCache.set(folderPath, existing.id);
    return existing.id;
  }

  const segments = folderPath.split('/').filter(Boolean);
  const slug = segments[segments.length - 1];
  const parentPath = segments.slice(0, -1).join('/');
  const parentId = parentPath ? await ensureFolder(parentPath) : 0;

  const { story } = (await sbApi('/stories', {
    method: 'POST',
    body: JSON.stringify({
      story: {
        name: displayName ?? slug,
        slug,
        is_folder: true,
        ...(parentId ? { parent_id: parentId } : {}),
      },
    }),
  })) as { story: StoryRecord };

  folderCache.set(folderPath, story.id);
  console.log(`Folder  ${folderPath}`);
  return story.id;
}

/** Where to place a story in the folder tree based on its public URL path. */
function placement(realPath: string): {
  parentFolder: string | null;
  storySlug: string;
  isStartpage: boolean;
} | null {
  const parts = realPath.split('/').filter(Boolean);
  if (!parts.length) return null;

  if (parts[0] === 'services' && parts.length === 2) {
    return { parentFolder: `services/${parts[1]}`, storySlug: parts[1], isStartpage: true };
  }
  if (parts[0] === 'services' && parts.length === 3) {
    return { parentFolder: `services/${parts[1]}`, storySlug: parts[2], isStartpage: false };
  }
  if (parts[0] === 'industries' && parts.length === 1) {
    // Keep listing page outside folders.
    return null;
  }
  if (parts[0] === 'industries' && parts.length === 2) {
    return { parentFolder: 'industries-pages', storySlug: parts[1], isStartpage: false };
  }
  if (parts[0] === 'blog' && parts.length === 1) {
    // Keep listing page outside folders.
    return null;
  }
  if (parts[0] === 'blog' && parts.length === 2) {
    return { parentFolder: 'blog-pages', storySlug: parts[1], isStartpage: false };
  }
  if (parts[0] === 'blog-categories' && parts.length === 2) {
    return { parentFolder: 'blog-categories', storySlug: parts[1], isStartpage: false };
  }
  if (parts[0] === 'author' && parts.length === 2) {
    return { parentFolder: 'author', storySlug: parts[1], isStartpage: false };
  }

  return null;
}

function childrenOf(all: StoryRecord[], folderId: number): StoryRecord[] {
  return all.filter((s) => s.parent_id === folderId);
}

async function deleteEmptyFolders(all: StoryRecord[]) {
  const folders = all.filter((s) => s.is_folder);
  let removed = 0;

  for (const folder of folders.sort(
    (a, b) => (b.full_slug?.split('/').length ?? 0) - (a.full_slug?.split('/').length ?? 0),
  )) {
    const kids = childrenOf(all, folder.id);
    if (kids.length > 0) continue;

    await sbApi(`/stories/${folder.id}`, { method: 'DELETE' });
    console.log(`Removed empty folder  ${folder.full_slug ?? folder.slug}`);
    removed += 1;
  }

  return removed;
}

const all = await listAllStories();
const removed = await deleteEmptyFolders(all);
console.log(`\nRemoved ${removed} empty folder(s).\n`);

const fresh = await listAllStories();
let moved = 0;

for (const row of fresh) {
  if (row.is_folder) continue;

  const { story } = (await sbApi(`/stories/${row.id}`)) as { story: StoryRecord };
  if (!story.content) continue;

  const realPath = storyRealPath(story.content);
  if (!realPath) continue;

  const plan = placement(realPath);
  if (!plan) continue;

  const parentSegments = plan.parentFolder!.split('/');
  const parentFolderPath = parentSegments.slice(0, -1).join('/');
  const leafFolder = parentSegments[parentSegments.length - 1];

  if (parentFolderPath) await ensureFolder(parentFolderPath);
  const parentId = await ensureFolder(plan.parentFolder!, leafFolder);

  if (story.parent_id === parentId && story.slug === plan.storySlug) continue;

  await sbApi(`/stories/${story.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      story: {
        name: story.name,
        slug: plan.storySlug,
        parent_id: parentId,
        is_startpage: plan.isStartpage,
        path: realPath,
        content: story.content,
      },
    }),
  });
  console.log(`Moved  ${story.full_slug ?? story.slug} → ${plan.parentFolder}/${plan.storySlug}`);
  moved += 1;
}

console.log(`\nDone. Moved ${moved} stories into folders.`);
