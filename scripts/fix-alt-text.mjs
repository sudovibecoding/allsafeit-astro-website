#!/usr/bin/env node
/**
 * One-off cleanup: replace placeholder/empty alt text in MDX body images.
 *
 * Two patterns originating from the Webflow HTML→MD export:
 *   - `![__wf_reserved_inherit](/images/...)` — Webflow's internal
 *     "inherit alt from CMS" sentinel that got exported literally
 *   - `![](/images/...)` — truly empty alt
 *
 * Both are flagged by SEO crawlers as missing alt. This script derives
 * humanish alt text from the image filename, falling back to the post's
 * frontmatter `name` (the article title) when the filename is too
 * generic to extract anything meaningful.
 *
 * Strategy for filename → alt:
 *   1. Strip directory + extension
 *   2. Drop common boilerplate prefixes ("blog-post-", "blog-images-N-",
 *      "main-", "untitled-", "pexels-<photographer>-NNNNN-", etc.)
 *   3. Drop trailing index numbers ("-1", "-2", "-1024x683")
 *   4. Replace hyphens with spaces; capitalize first letter
 *   5. If the result is empty / pure digits / < 5 chars, fall back to
 *      the article title
 *
 * Safety:
 *   - Only touches markdown image patterns; never modifies surrounding
 *     content
 *   - Idempotent: re-running on a clean tree reports 0 changes
 *   - Adds a `--dry` flag to preview before applying
 *
 * Usage:
 *   node scripts/fix-alt-text.mjs --dry      # preview
 *   node scripts/fix-alt-text.mjs            # apply
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';

const DRY = process.argv.includes('--dry');

const STATS = {
  filesScanned: 0,
  filesChanged: 0,
  wfPlaceholderReplaced: 0,
  emptyAltReplaced: 0,
};

/**
 * Heuristic: does `s` look like a random CDN hash rather than a word?
 * Webflow CDN filenames are often 16–24 char alphanumeric blobs like
 * `prkkonkvzub5hmgjwttg` or `aty0lzmonjqoehisgplr`. Title-casing those
 * produces alt text that's worse than empty for screen readers.
 *
 * Triggers:
 *   - single token (no spaces) AND length ≥ 12
 *   - any mix of letters + digits within a single token (real words rarely do this)
 *   - or vowel-to-letter ratio < 25% (random strings skew consonant-heavy)
 */
function looksLikeHash(s) {
  if (s.includes(' ')) return false; // multi-word — almost certainly a real phrase
  if (s.length < 12) return false;
  if (/\d/.test(s) && /[a-z]/i.test(s)) return true; // mixed letters+digits in one token
  const letters = s.replace(/[^a-z]/gi, '');
  if (!letters) return true;
  const vowels = (s.match(/[aeiouy]/gi) ?? []).length;
  return vowels / letters.length < 0.25;
}

/**
 * Derive a human-readable alt from an image URL + the post's title.
 * Falls back to post title when the filename is too generic.
 */
function deriveAlt(url, postTitle) {
  // Get the basename without extension
  const basename = url.split('/').pop() ?? '';
  let stem = basename.replace(/\.[a-z0-9]+$/i, '');

  // Strip common Webflow / CMS / stock-photo boilerplate prefixes
  stem = stem
    .replace(/^blog-post-/i, '')
    .replace(/^blog-images?-\d+-?/i, '')
    .replace(/^main-/i, '')
    .replace(/^untitled-?\d*-?/i, '')
    // Stock photo IDs: "pexels-<author>-<numbers>-<numbers>" → drop the whole tail
    .replace(/^pexels-[a-z0-9-]+-\d+(-\d+)?$/i, '')
    // Webflow's reserved-inherit string literally as the filename (edge case)
    .replace(/__wf_reserved_inherit/g, '');

  // Drop trailing dimension suffixes like "-1024x683" or "-768x585"
  stem = stem.replace(/-\d+x\d+$/, '');

  // Drop trailing single-digit / short index suffixes
  stem = stem.replace(/-\d{1,3}$/, '');

  // Replace dashes/underscores with spaces, collapse whitespace
  stem = stem.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

  // Fall back if too short, all digits, empty, or looks like a CDN hash
  if (!stem || /^\d+$/.test(stem) || stem.length < 5 || looksLikeHash(stem)) {
    return postTitle;
  }

  // Capitalize first letter
  return stem[0].toUpperCase() + stem.slice(1);
}

/** Pull the `name:` field out of MDX frontmatter. */
function getPostTitle(src, fallback) {
  const fm = src.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fm) return fallback;
  const titleMatch = fm[1].match(/^name:\s*['"]?(.+?)['"]?\s*$/m);
  return titleMatch ? titleMatch[1].trim() : fallback;
}

/**
 * Rewrite markdown image references with bad alt to use a derived alt.
 * Only touches the alt= portion; URL is left untouched.
 */
function rewriteImageAlts(src, postTitle) {
  let local = { wf: 0, empty: 0 };

  const next = src.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (full, alt, url) => {
      if (alt === '__wf_reserved_inherit') {
        local.wf++;
        return `![${deriveAlt(url, postTitle)}](${url})`;
      }
      if (!alt.trim()) {
        local.empty++;
        return `![${deriveAlt(url, postTitle)}](${url})`;
      }
      return full;
    },
  );

  return { next, ...local };
}

// ────────────────────────────────────────────────────────────────────────

const targets = [
  ['src/content/blog', '*.mdx'],
  ['src/content/industries', '*.mdx'],
  ['src/content/services', '**/*.mdx'],
  ['src/content/customer', '*.mdx'],
  ['src/content/career', '*.mdx'],
  ['src/content/job-opening', '*.mdx'],
  ['src/content/professional-service', '*.mdx'],
  ['src/content/author', '*.md'],
];

for (const [dir, pattern] of targets) {
  for await (const rel of glob(pattern, { cwd: dir })) {
    const full = `${dir}/${rel}`;
    const original = readFileSync(full, 'utf8');
    STATS.filesScanned++;

    const fallbackTitle = rel.replace(/\.[a-z]+$/, '').replace(/-/g, ' ');
    const postTitle = getPostTitle(original, fallbackTitle);

    const { next, wf, empty } = rewriteImageAlts(original, postTitle);
    if (wf + empty === 0) continue;

    STATS.filesChanged++;
    STATS.wfPlaceholderReplaced += wf;
    STATS.emptyAltReplaced += empty;

    if (!DRY) writeFileSync(full, next, 'utf8');

    console.log(
      `  ${DRY ? '(dry)' : '✓'} ${full}  ` +
        `[${wf} wf-placeholder, ${empty} empty]  ` +
        `title="${postTitle.slice(0, 50)}${postTitle.length > 50 ? '…' : ''}"`,
    );
  }
}

console.log('');
console.log(DRY ? '🔍 DRY RUN — no files written' : '✓ APPLIED');
console.log(`  Files scanned:                    ${STATS.filesScanned}`);
console.log(`  Files changed:                    ${STATS.filesChanged}`);
console.log(`  __wf_reserved_inherit replaced:   ${STATS.wfPlaceholderReplaced}`);
console.log(`  Empty alt replaced:               ${STATS.emptyAltReplaced}`);
console.log(
  `  Total alts fixed:                 ${STATS.wfPlaceholderReplaced + STATS.emptyAltReplaced}`,
);
