#!/usr/bin/env tsx
/**
 * Repair all Storyblok stories after schema migration:
 * - Move fake asset objects → image_path text fields (fixes publish errors)
 * - Convert HTML strings in richtext fields → valid Storyblok doc JSON
 * - Strip invalid empty asset objects
 *
 * Usage: npm run storyblok:repair
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');

function loadEnvFile() {
  try {
    const raw = readFileSync(resolve(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* no .env */
  }
}

loadEnvFile();

const token =
  process.env.STORYBLOK_MANAGEMENT_TOKEN ||
  (process.env.STORYBLOK_TOKEN?.startsWith('sb_pat_') ? process.env.STORYBLOK_TOKEN : null);
const spaceId = process.env.STORYBLOK_SPACE_ID;

if (!token || !spaceId) {
  console.error('Missing STORYBLOK_MANAGEMENT_TOKEN or STORYBLOK_SPACE_ID');
  process.exit(1);
}

const base = `https://mapi.storyblok.com/v1/spaces/${spaceId}`;

const IMAGE_FIELDS = new Set([
  'image',
  'hero_image',
  'icon_image',
  'cover_image',
  'poster',
  'photo',
  'og_image',
  'featured_image',
]);

const RICHTEXT_FIELDS = new Set([
  'body',
  'lead',
  'intro',
  'outro',
  'a',
  'quote',
  'heading',
]);

async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: token!,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${text}`);
  return JSON.parse(text) as Record<string, unknown>;
}

function isStoryblokAsset(value: unknown): value is { filename?: string; id?: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'filename' in value &&
    !('component' in value)
  );
}

function isLocalPath(filename?: string) {
  return Boolean(filename?.startsWith('/'));
}

function htmlToRichtext(html: string) {
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  if (!text) {
    return { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
  }

  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  return {
    type: 'doc',
    content: paragraphs.map((p) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: p.trim() }],
    })),
  };
}

function textToRichtext(text: string) {
  if (!text.trim()) return { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
  if (text.includes('<')) return htmlToRichtext(text);
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  return {
    type: 'doc',
    content: (paragraphs.length ? paragraphs : [text]).map((p) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: p.trim() }],
    })),
  };
}

function headingToRichtext(text: string) {
  const plain = text.replace(/<[^>]+>/g, '').trim();
  if (!plain) return { type: 'doc', content: [] };
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: plain }],
      },
    ],
  };
}

function repairNode(node: Record<string, unknown> | null | undefined): boolean {
  if (!node || typeof node !== 'object') return false;
  let changed = false;

  for (const [key, value] of Object.entries(node)) {
    if (IMAGE_FIELDS.has(key) && isStoryblokAsset(value)) {
      const filename = value.filename;
      if (isLocalPath(filename) && !value.id) {
        node.image_path = filename;
        delete node[key];
        changed = true;
      } else if (!filename && !value.id) {
        delete node[key];
        changed = true;
      }
    }

    if (RICHTEXT_FIELDS.has(key) && typeof value === 'string' && value.trim()) {
      if (key === 'heading') {
        node[key] = headingToRichtext(value);
      } else {
        node[key] = value.includes('<') ? htmlToRichtext(value) : textToRichtext(value);
      }
      changed = true;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object') {
          if (repairNode(item as Record<string, unknown>)) changed = true;
        }
      }
    }
  }

  return changed;
}

let page = 1;
let repaired = 0;

while (true) {
  const { stories } = (await api(`/stories?page=${page}&per_page=100`)) as {
    stories: Array<{ id: number; name: string; full_slug: string; content: Record<string, unknown> | null }>;
  };

  if (!stories?.length) break;

  for (const story of stories) {
    if (!story.content || typeof story.content !== 'object') continue;
    const content = structuredClone(story.content);
    if (repairNode(content)) {
      await api(`/stories/${story.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          story: {
            name: story.name,
            slug: story.full_slug.split('/').pop(),
            content,
          },
        }),
      });
      console.log(`Repaired  ${story.full_slug}`);
      repaired += 1;
    }
  }

  if (stories.length < 100) break;
  page += 1;
}

console.log(`\nDone. Repaired ${repaired} stories.`);
