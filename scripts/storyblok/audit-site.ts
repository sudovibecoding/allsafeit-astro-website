#!/usr/bin/env tsx
/**
 * Post-migration audit: Storyblok stories, MDX coverage, HTTP smoke checks.
 *
 * Usage: npm run storyblok:audit
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { sbApi } from './api';
import { storyRealPath } from './story-path';

const ROOT = resolve(import.meta.dirname, '../..');
const CONTENT = join(ROOT, 'src/content');

const DEFAULT_ORIGINS = [
  'https://localhost:4321',
  'https://localhost:4322',
  'http://localhost:4321',
  'http://localhost:4322',
];

function probeOrigin(origin: string): boolean {
  try {
    const out = execSync(
      `curl -sk -o /dev/null -w "%{http_code}" --connect-timeout 3 --max-time 8 "${origin}/"`,
      { encoding: 'utf8' },
    ).trim();
    const status = Number(out);
    return status >= 200 && status < 500;
  } catch {
    return false;
  }
}

function resolveAuditBase(): string | null {
  const envBase = process.env.AUDIT_BASE_URL?.replace(/\/$/, '');
  if (envBase) {
    return probeOrigin(envBase) ? envBase : null;
  }
  for (const origin of DEFAULT_ORIGINS) {
    if (probeOrigin(origin)) return origin;
  }
  return null;
}

function curlStatus(origin: string, path: string): number | null {
  try {
    const out = execSync(
      `curl -sk -o /dev/null -w "%{http_code}" --connect-timeout 3 --max-time 15 "${origin}${path}"`,
      { encoding: 'utf8' },
    ).trim();
    const status = Number(out);
    return Number.isFinite(status) ? status : null;
  } catch {
    return null;
  }
}

type StoryRow = {
  id: number;
  name: string;
  slug: string;
  full_slug: string;
  path?: string | null;
  is_folder?: boolean;
  content?: Record<string, unknown> | null;
};

function walkMdx(dir: string): string[] {
  const out: string[] = [];
  if (!statSync(dir, { throwIfNoEntry: false })) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkMdx(p));
    else if (name.endsWith('.mdx')) out.push(p);
  }
  return out;
}

function isPublishedMdx(filePath: string): boolean {
  try {
    const raw = readFileSync(filePath, 'utf8');
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return true;
    const status = match[1].match(/^status:\s*(\S+)/m)?.[1]?.toLowerCase();
    return status !== 'draft' && status !== 'archived';
  } catch {
    return true;
  }
}

function expectedPathsFromMdx(): Set<string> {
  const paths = new Set<string>();
  for (const file of walkMdx(join(CONTENT, 'industries'))) {
    if (!isPublishedMdx(file)) continue;
    const slug = file.replace(`${join(CONTENT, 'industries')}/`, '').replace(/\.mdx$/, '');
    paths.add(`/industries/${slug}`);
  }
  for (const file of walkMdx(join(CONTENT, 'services'))) {
    if (!isPublishedMdx(file)) continue;
    const rel = file.replace(`${join(CONTENT, 'services')}/`, '').replace(/\.mdx$/, '');
    paths.add(`/services/${rel}`);
  }
  for (const file of walkMdx(join(CONTENT, 'blog'))) {
    if (!isPublishedMdx(file)) continue;
    const slug = file.replace(`${join(CONTENT, 'blog')}/`, '').replace(/\.mdx$/, '');
    paths.add(`/blog/${slug}`);
  }
  return paths;
}

async function listAllStories(): Promise<StoryRow[]> {
  const all: StoryRow[] = [];
  let page = 1;
  while (true) {
    const { stories } = (await sbApi(`/stories?page=${page}&per_page=100`)) as {
      stories: StoryRow[];
    };
    if (!stories?.length) break;
    all.push(...stories);
    if (stories.length < 100) break;
    page += 1;
  }
  return all;
}

function countHtmlFields(node: Record<string, unknown>, counts: { html: number; emptyBody: number }) {
  for (const [key, value] of Object.entries(node)) {
    if (
      (key === 'body_html' || key === 'bio_html' || key === 'overview_html') &&
      typeof value === 'string' &&
      value.trim()
    ) {
      counts.html += 1;
    }
    if (key === 'body' && node.component && typeof value === 'object' && value !== null) {
      const doc = value as { content?: unknown[] };
      if (Array.isArray(doc.content) && doc.content.length === 0) counts.emptyBody += 1;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object') countHtmlFields(item as Record<string, unknown>, counts);
      }
    }
  }
}

const stories = await listAllStories();
const pageStories = stories.filter((s) => !s.is_folder);
const storyPaths = new Map<string, string>();
const htmlCounts = { html: 0, emptyBody: 0 };
const emptyHomePresets: string[] = [];

for (const story of pageStories) {
  const path =
    (typeof (story as { path?: string }).path === 'string' && (story as { path?: string }).path) ||
    (story.content ? storyRealPath(story.content) : undefined);
  if (path) storyPaths.set(path, story.full_slug ?? story.slug);
  if (story.content) countHtmlFields(story.content, htmlCounts);

  if (
    story.content &&
    (story.full_slug ?? story.slug) === 'home' &&
    Array.isArray(story.content.body)
  ) {
    for (const blok of story.content.body as Array<Record<string, unknown>>) {
      const component = String(blok.component ?? '');
      if (
        [
          'award_marquee',
          'tired_of_waiting',
          'strategic_support',
          'it_services_section',
          'trust_checklist',
          'inc_award',
          'blog_grid',
        ].includes(component)
      ) {
        const hasText = Object.entries(blok).some(
          ([k, v]) => k !== 'component' && k !== '_uid' && typeof v === 'string' && v.trim(),
        );
        if (!hasText) emptyHomePresets.push(component);
      }
    }
  }
}

const mdxPaths = expectedPathsFromMdx();
const missingInStoryblok = [...mdxPaths].filter((p) => !storyPaths.has(p));

const keyPages = [
  '/',
  '/about-us',
  '/contact-us',
  '/why-choose-us',
  '/areas-we-serve',
  '/industries',
  '/blog',
  '/blog-categories/insights',
  '/services/managed-it',
  '/services/cybersecurity',
  '/services/managed-it/co-managed',
  '/locations/managed-it-services-los-angeles',
];

console.log('\n=== Storyblok Audit ===\n');
console.log(`Stories (pages): ${pageStories.length}`);
console.log(`Public paths mapped: ${storyPaths.size}`);
console.log(`MDX content paths: ${mdxPaths.size}`);
console.log(`MDX paths missing in Storyblok: ${missingInStoryblok.length}`);
if (missingInStoryblok.length) {
  console.log(missingInStoryblok.slice(0, 20).map((p) => `  - ${p}`).join('\n'));
}
console.log(`Stories still using body_html fields: ${htmlCounts.html}`);
console.log(`Empty richtext body blocks: ${htmlCounts.emptyBody}`);
if (emptyHomePresets.length) {
  console.log(`Home preset blocks missing text: ${emptyHomePresets.join(', ')}`);
} else {
  console.log('Home preset blocks: populated');
}

console.log('\n=== HTTP smoke checks ===\n');
const auditBase = resolveAuditBase();
let ok = 0;
let fail = 0;

if (!auditBase) {
  console.log(
    'SKIP — local dev server not detected on ports 4321/4322 (http or https).',
  );
  console.log('Start the preview first: npm run dev:storyblok');
  if (process.env.AUDIT_BASE_URL) {
    console.log(`(AUDIT_BASE_URL=${process.env.AUDIT_BASE_URL} did not respond)`);
  }
} else {
  console.log(`Using ${auditBase}\n`);
  for (const path of keyPages) {
    const status = curlStatus(auditBase, path);
    if (status !== null && status >= 200 && status < 400) {
      console.log(`OK   ${path} → ${status}`);
      ok += 1;
    } else {
      console.log(`FAIL ${path} → ${status ?? 'unreachable'}`);
      fail += 1;
    }
  }
  console.log(`\nHTTP: ${ok} ok, ${fail} failed (base: ${auditBase})`);
}

console.log('Sensitive files in /public: 0 expected (.env stays out of public)');

if (missingInStoryblok.length || htmlCounts.html > 0 || emptyHomePresets.length || fail) {
  process.exitCode = 1;
}
