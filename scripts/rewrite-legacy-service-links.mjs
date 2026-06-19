#!/usr/bin/env node
/**
 * Rewrite legacy Webflow-shape service URLs to the new Astro routing tree.
 *
 *   /managed-it/<slug>                   →  /services/managed-it/<slug>
 *   /cybersecurity/<slug>                →  /services/cybersecurity/<slug>
 *   /it-consulting/<slug>                →  /services/it-consulting/<slug>
 *   /it-infrastructure-and-cloud/<slug>  →  /services/it-infrastructure-and-cloud/<slug>
 *
 * Runs against every MDX file under `src/content/` (plus tina/__generated__
 * is intentionally NOT scanned — those are auto-generated client artifacts).
 *
 * Matches BOTH link forms that occur in MDX:
 *   - Markdown:   [text](/managed-it/foo)
 *   - HTML:       <a href="/managed-it/foo">…</a>
 *                 <a href='/managed-it/foo'>…</a>
 *
 * Does NOT touch:
 *   - Already-correct paths (`/services/managed-it/...` — anchored on `(/`
 *     or `href="/`, so the substring "managed-it" inside "/services/managed-it/"
 *     is never matched because the leading prefix differs).
 *   - Bare text mentions of "/managed-it/foo" inside paragraphs — only
 *     real link markup is rewritten.
 *
 * Usage:
 *   node scripts/rewrite-legacy-service-links.mjs           # writes files
 *   node scripts/rewrite-legacy-service-links.mjs --dry     # report only
 *
 * Idempotent — safe to re-run; second run reports 0 changes.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'node:fs/promises'; // Node 22+
import { resolve } from 'node:path';

const DRY = process.argv.includes('--dry');

const CATEGORIES = [
  'managed-it',
  'cybersecurity',
  'it-consulting',
  'it-infrastructure-and-cloud',
];

// Three regex variants per category — markdown link, double-quote href,
// single-quote href. Each is anchored on the open syntax so we don't
// accidentally rewrite already-correct paths.
function buildRewriters() {
  const rules = [];
  for (const cat of CATEGORIES) {
    rules.push({
      // Markdown link: ](/<cat>/...)  →  ](/services/<cat>/...)
      regex: new RegExp(`\\]\\(/${cat}/`, 'g'),
      replacement: `](/services/${cat}/`,
    });
    rules.push({
      // HTML href="/<cat>/..."  →  href="/services/<cat>/..."
      regex: new RegExp(`href="/${cat}/`, 'g'),
      replacement: `href="/services/${cat}/`,
    });
    rules.push({
      // HTML href='/<cat>/...'  →  href='/services/<cat>/...'
      regex: new RegExp(`href='/${cat}/`, 'g'),
      replacement: `href='/services/${cat}/`,
    });
  }
  return rules;
}

const RULES = buildRewriters();
const ROOT = resolve(process.cwd(), 'src', 'content');

const totals = {
  filesScanned: 0,
  filesChanged: 0,
  linksRewritten: 0,
  perCategory: Object.fromEntries(CATEGORIES.map((c) => [c, 0])),
};

const changedFiles = [];

for await (const filePath of glob('**/*.mdx', { cwd: ROOT })) {
  const full = resolve(ROOT, filePath);
  const original = readFileSync(full, 'utf8');
  let next = original;
  let fileLinkCount = 0;

  for (const { regex, replacement } of RULES) {
    const matches = next.match(regex);
    if (matches) {
      fileLinkCount += matches.length;
      // Track per-category counts. Replacement always contains /services/<cat>/.
      for (const cat of CATEGORIES) {
        if (replacement.includes(`/services/${cat}/`)) {
          // Only attribute this rule's matches to this cat (one rule = one cat).
          if (replacement === `](/services/${cat}/`
              || replacement === `href="/services/${cat}/`
              || replacement === `href='/services/${cat}/`) {
            totals.perCategory[cat] += matches.length;
            break;
          }
        }
      }
      next = next.replace(regex, replacement);
    }
  }

  totals.filesScanned++;
  if (fileLinkCount > 0) {
    totals.filesChanged++;
    totals.linksRewritten += fileLinkCount;
    changedFiles.push({ path: filePath, count: fileLinkCount });
    if (!DRY) writeFileSync(full, next, 'utf8');
  }
}

// ── Report ─────────────────────────────────────────────────────
console.log(`${DRY ? '🔍 DRY RUN' : '✓ APPLIED'} — legacy service link rewrite`);
console.log(`  Files scanned:     ${totals.filesScanned}`);
console.log(`  Files changed:     ${totals.filesChanged}`);
console.log(`  Links rewritten:   ${totals.linksRewritten}`);
console.log(`  By category:`);
for (const [cat, n] of Object.entries(totals.perCategory)) {
  console.log(`    /${cat.padEnd(28)} → /services/${cat.padEnd(28)}  ${n}`);
}
if (changedFiles.length) {
  console.log(`  Affected files:`);
  for (const f of changedFiles.sort((a, b) => b.count - a.count)) {
    console.log(`    ${String(f.count).padStart(3)}  ${f.path}`);
  }
}
if (DRY) {
  console.log('\nRe-run without --dry to apply.');
}
