import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');

export function loadEnvFile() {
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
  console.error('Missing STORYBLOK_MANAGEMENT_TOKEN or STORYBLOK_SPACE_ID in .env');
  process.exit(1);
}

const base = `https://mapi.storyblok.com/v1/spaces/${spaceId}`;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const cause = err.cause as { code?: string } | undefined;
  const code = cause?.code ?? (err as NodeJS.ErrnoException).code;
  return (
    err.message.includes('fetch failed') ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN'
  );
}

export async function sbApi(path: string, options: RequestInit = {}) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
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
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES && isRetryableNetworkError(err)) {
        console.warn(
          `Storyblok API unreachable (attempt ${attempt}/${MAX_RETRIES}) — retrying in ${RETRY_DELAY_MS * attempt}ms…`,
        );
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      if (isRetryableNetworkError(err)) {
        throw new Error(
          `Storyblok API request failed after ${MAX_RETRIES} attempts (${path}). Check your network/VPN and try again.\nOriginal: ${err instanceof Error ? err.message : err}`,
        );
      }
      throw err;
    }
  }

  throw lastError;
}

type StoryRecord = {
  id: number;
  name: string;
  slug: string;
  full_slug?: string;
  is_folder?: boolean;
  content: Record<string, unknown>;
};

function canonicalPath(content: Record<string, unknown>): string | undefined {
  const canonical = content.canonical;
  if (typeof canonical !== 'string') return undefined;
  try {
    return new URL(canonical).pathname.replace(/\/$/, '') || '/';
  } catch {
    return undefined;
  }
}

function matchesStoryPath(story: StoryRecord, storyPath: string): boolean {
  if (story.is_folder) return false;
  if (story.full_slug === storyPath) return true;
  if (!story.content || typeof story.content !== 'object') return false;
  const path = canonicalPath(story.content);
  return path === `/${storyPath}`;
}

async function findStoryByFullSlug(fullSlug: string): Promise<StoryRecord | undefined> {
  for (const param of ['with_slug', 'by_slugs'] as const) {
    const { stories } = (await sbApi(
      `/stories?${param}=${encodeURIComponent(fullSlug)}`,
    )) as { stories: StoryRecord[] };
    const match = stories?.find((s) => !s.is_folder && s.full_slug === fullSlug);
    if (match) return match;
  }
  return undefined;
}

export async function findStory(storyPath: string): Promise<StoryRecord | undefined> {
  const exact = await findStoryByFullSlug(storyPath);
  if (exact) return exact;

  const tail = storyPath.includes('/') ? storyPath.split('/').pop()! : storyPath;

  for (const slug of [storyPath, tail]) {
    const { stories } = (await sbApi(
      `/stories?with_slug=${encodeURIComponent(slug)}`,
    )) as { stories: StoryRecord[] };
    const match =
      stories?.find((s) => matchesStoryPath(s, storyPath)) ??
      (storyPath.includes('/') ? stories?.find((s) => !s.is_folder && s.slug === tail) : undefined);
    if (match) return match;
  }

  const { stories: searchResults } = (await sbApi(
    `/stories?search=${encodeURIComponent(tail)}`,
  )) as { stories: StoryRecord[] };

  const canonicalMatch = searchResults?.find((s) => matchesStoryPath(s, storyPath));
  if (canonicalMatch) return canonicalMatch;

  // Legacy flat slugs (e.g. services/cybersecurity → slug "cybersecurity" at root).
  if (storyPath.includes('/')) {
    return searchResults?.find((s) => !s.is_folder && s.slug === tail);
  }

  return searchResults?.find((s) => !s.is_folder && s.slug === storyPath);
}

import { storyRealPath } from './story-path';

export async function upsertStory(
  slug: string,
  name: string,
  content: Record<string, unknown>,
  fullSlug?: string,
) {
  const storyPath = fullSlug ?? slug;
  const slugPart = storyPath.includes('/') ? storyPath.split('/').pop()! : storyPath;
  const existing = await findStory(storyPath);
  const path = storyRealPath(content);

  const storyFields: Record<string, unknown> = {
    name: existing?.name || name,
    slug: existing?.slug || slugPart,
    content,
    ...(path ? { path } : {}),
  };

  if (existing) {
    await sbApi(`/stories/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify({ story: storyFields }),
    });
    console.log(`Updated  ${storyPath}${path ? ` → ${path}` : ''}`);
    return;
  }

  await sbApi('/stories', {
    method: 'POST',
    body: JSON.stringify({ story: storyFields }),
  });
  console.log(`Created  ${storyPath}${path ? ` → ${path}` : ''}`);
}
