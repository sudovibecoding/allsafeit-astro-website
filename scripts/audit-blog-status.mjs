#!/usr/bin/env node
/**
 * Compare Webflow blog-post CSV export against the local MDX
 * frontmatter `status` field. Surfaces mismatches.
 *
 * Webflow's source of truth (from the CSV):
 *   - Archived = "true"  → expected status: "archived"
 *   - Draft    = "true"  → expected status: "draft"
 *   - else               → expected status: "published"
 *
 * MDX source of truth: frontmatter `status:` line.
 *
 * Output:
 *   - Summary counts per status (CSV vs MDX)
 *   - Per-blog mismatch lines (CSV slug present, MDX status differs)
 *   - Slugs present in one source but not the other
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const CSV_PATH = 'AllSafe New Website - Blog Posts - 691bbcb39d346b7748f2fe46.csv';
const BLOG_DIR = 'src/content/blog';

/**
 * Stream-parse an RFC4180 CSV. Returns an array of row objects keyed by header.
 * Only keeps the columns in `wanted` — saves memory on the huge Post Body cells.
 */
function parseCsv(text, wanted) {
  const rows = [];
  let i = 0;
  const len = text.length;

  function readField() {
    if (text[i] === '"') {
      i++;
      let v = '';
      while (i < len) {
        const ch = text[i];
        if (ch === '"') {
          if (text[i + 1] === '"') { v += '"'; i += 2; continue; }
          i++; return v;
        }
        v += ch; i++;
      }
      return v;
    }
    let v = '';
    while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
      v += text[i]; i++;
    }
    return v;
  }

  function readRow() {
    const fields = [];
    while (i < len) {
      fields.push(readField());
      if (text[i] === ',') { i++; continue; }
      if (text[i] === '\r') i++;
      if (text[i] === '\n') { i++; break; }
      if (i >= len) break;
    }
    return fields;
  }

  const headers = readRow();
  const wantedIdx = new Map();
  for (const col of wanted) {
    const idx = headers.indexOf(col);
    if (idx < 0) throw new Error(`Column not found in CSV: ${col}`);
    wantedIdx.set(col, idx);
  }

  while (i < len) {
    const row = readRow();
    if (row.length === 0 || row.every((f) => f === '')) continue;
    const obj = {};
    for (const [col, idx] of wantedIdx) obj[col] = row[idx] ?? '';
    rows.push(obj);
  }
  return rows;
}

/** Read just the `status:` frontmatter line from an MDX file. */
function readMdxStatus(path) {
  const src = readFileSync(path, 'utf8');
  const fm = src.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const m = fm[1].match(/^status:\s*(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

// ─────────────────────────────────────────────────────────────

const csvText = readFileSync(CSV_PATH, 'utf8');
const csvRows = parseCsv(csvText, ['Slug', 'Archived', 'Draft', 'Name']);

const csvBySlug = new Map();
for (const r of csvRows) {
  const slug = r.Slug.trim();
  if (!slug) continue;
  const expected = r.Archived === 'true' ? 'archived'
    : r.Draft === 'true' ? 'draft'
    : 'published';
  csvBySlug.set(slug, { expected, name: r.Name });
}

const mdxFiles = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'));
const mdxBySlug = new Map();
for (const f of mdxFiles) {
  const slug = f.replace(/\.mdx$/, '');
  const status = readMdxStatus(join(BLOG_DIR, f));
  mdxBySlug.set(slug, status);
}

// ─── Summary counts ──────────────────────────────────────────

const csvCounts = { published: 0, draft: 0, archived: 0 };
for (const v of csvBySlug.values()) csvCounts[v.expected]++;

const mdxCounts = { published: 0, draft: 0, archived: 0, other: 0 };
for (const s of mdxBySlug.values()) {
  if (s in mdxCounts) mdxCounts[s]++;
  else mdxCounts.other++;
}

console.log('CSV (Webflow source of truth)');
console.log(`  total slugs:  ${csvBySlug.size}`);
console.log(`  published:    ${csvCounts.published}`);
console.log(`  draft:        ${csvCounts.draft}`);
console.log(`  archived:     ${csvCounts.archived}`);
console.log('');
console.log('MDX (local Tina content)');
console.log(`  total files:  ${mdxBySlug.size}`);
console.log(`  published:    ${mdxCounts.published}`);
console.log(`  draft:        ${mdxCounts.draft}`);
console.log(`  archived:     ${mdxCounts.archived}`);
if (mdxCounts.other) console.log(`  other:        ${mdxCounts.other}`);
console.log('');

// ─── Mismatches (present in both, status differs) ────────────

const mismatches = [];
for (const [slug, { expected }] of csvBySlug) {
  const actual = mdxBySlug.get(slug);
  if (actual && actual !== expected) {
    mismatches.push({ slug, expected, actual });
  }
}

console.log(`Mismatches (CSV vs MDX): ${mismatches.length}`);
if (mismatches.length) {
  for (const m of mismatches) {
    console.log(`  ${m.slug}`);
    console.log(`    CSV expects: ${m.expected}    MDX has: ${m.actual}`);
  }
}
console.log('');

// ─── Slugs only in CSV (missing local file) ──────────────────

const onlyInCsv = [...csvBySlug.keys()].filter((s) => !mdxBySlug.has(s));
console.log(`In CSV but no local MDX: ${onlyInCsv.length}`);
for (const s of onlyInCsv) {
  const { expected, name } = csvBySlug.get(s);
  console.log(`  ${s}  [${expected}]  "${name}"`);
}
console.log('');

// ─── Slugs only in MDX (no Webflow entry) ────────────────────

const onlyInMdx = [...mdxBySlug.keys()].filter((s) => !csvBySlug.has(s));
console.log(`In MDX but not in CSV: ${onlyInMdx.length}`);
for (const s of onlyInMdx) {
  console.log(`  ${s}  [${mdxBySlug.get(s)}]`);
}
