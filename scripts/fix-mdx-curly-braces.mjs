#!/usr/bin/env node
/**
 * One-off post-processor for migrated MDX files.
 *
 * Webflow's rich text occasionally contains raw CSS / code with literal
 * `{` and `}` braces in body text. MDX treats those as the start/end of a
 * JSX expression, which breaks the build:
 *
 *   [@mdx-js/rollup] Could not parse expression with acorn
 *
 * This script walks every `.mdx` file under src/content/, identifies braces
 * that live OUTSIDE fenced code blocks (```...```) and inline code spans
 * (`...`), and escapes them as `\{` / `\}` so MDX renders them as literal
 * characters.
 *
 * Idempotent — already-escaped braces (`\{`) are not double-escaped.
 *
 * Usage:
 *   node scripts/fix-mdx-curly-braces.mjs
 *
 * Run AFTER a migration that produced new MDX files.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";

const ROOT = "src/content";
const counts = { filesScanned: 0, filesChanged: 0, bracesEscaped: 0 };

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.isFile() && extname(e.name) === ".mdx") await processFile(p);
  }
}

async function processFile(path) {
  counts.filesScanned++;
  const src = await readFile(path, "utf-8");

  // Split out the frontmatter; only touch the body.
  let frontmatter = "";
  let body = src;
  const fmMatch = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fmMatch) {
    frontmatter = fmMatch[0];
    body = src.slice(fmMatch[0].length);
  }

  const { result, escaped } = escapeBracesOutsideCode(body);
  if (escaped === 0) return;

  counts.filesChanged++;
  counts.bracesEscaped += escaped;
  await writeFile(path, frontmatter + result);
  console.log(`  ${path}  (${escaped} braces escaped)`);
}

/**
 * Escape `{` and `}` outside of:
 *   - fenced code blocks (```...```)
 *   - inline code spans (`...`)
 *   - already-escaped braces (`\{` / `\}`)
 */
function escapeBracesOutsideCode(text) {
  let out = "";
  let i = 0;
  let escaped = 0;
  const n = text.length;

  while (i < n) {
    // Fenced code block (``` ... ```) — copy through unchanged.
    if (text.startsWith("```", i)) {
      const end = text.indexOf("```", i + 3);
      if (end === -1) {
        out += text.slice(i);
        break;
      }
      out += text.slice(i, end + 3);
      i = end + 3;
      continue;
    }

    // Inline code (`...`) — copy through unchanged. Avoid greedy matches.
    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end !== -1 && !text.slice(i + 1, end).includes("\n")) {
        out += text.slice(i, end + 1);
        i = end + 1;
        continue;
      }
    }

    // Escaped brace — already safe, copy through.
    if (text[i] === "\\" && (text[i + 1] === "{" || text[i + 1] === "}")) {
      out += text[i] + text[i + 1];
      i += 2;
      continue;
    }

    // Stray brace — escape it.
    if (text[i] === "{" || text[i] === "}") {
      out += "\\" + text[i];
      escaped++;
      i++;
      continue;
    }

    out += text[i];
    i++;
  }

  return { result: out, escaped };
}

console.log(`Scanning ${ROOT}/**/*.mdx for stray curly braces…\n`);
await walk(ROOT);
console.log(`\n  Files scanned:   ${counts.filesScanned}`);
console.log(`  Files changed:   ${counts.filesChanged}`);
console.log(`  Braces escaped:  ${counts.bracesEscaped}`);
