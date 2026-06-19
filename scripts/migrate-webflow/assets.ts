/**
 * Asset downloader + URL rewriter.
 *
 * Downloads Webflow CDN URLs to `public/images/<collection>/<slug>/<original>`,
 * dedupes by source URL, and exposes a `rewrite()` helper that maps any
 * Webflow CDN URL to its local equivalent.
 *
 * Naming convention (chosen by user): preserve Webflow's original filename
 * inside per-collection / per-slug directories. This keeps body-embedded
 * images grouped with their post and reduces collision risk.
 */
import { mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, join, basename, extname } from "node:path";
import { URL } from "node:url";

const PROJECT_ROOT = process.cwd();
const PUBLIC_DIR = join(PROJECT_ROOT, "public");
const IMAGES_BASE = "/images";

// sourceUrl → localPublicPath (e.g. /images/blog/foo/bar.jpg)
const cache = new Map<string, string>();

let downloadCount = 0;
let bytesDownloaded = 0;
let dedupedCount = 0;

export interface DownloadOptions {
  collection: string;
  slug: string;
  dryRun: boolean;
  skipAssets: boolean;
}

/**
 * Download a single Webflow asset (if not already cached) and return the
 * local public path (e.g. "/images/blog/zero-trust/hero.avif").
 *
 * Idempotent: if the destination file already exists with non-zero size,
 * the download is skipped.
 */
export async function downloadAsset(
  sourceUrl: string,
  opts: DownloadOptions
): Promise<string> {
  if (cache.has(sourceUrl)) {
    dedupedCount++;
    return cache.get(sourceUrl)!;
  }

  const filename = filenameFromUrl(sourceUrl);
  // The URL written into frontmatter (relative to the site root):
  //   /images/<collection>/<slug>/<filename>
  // The on-disk write target (relative to project root):
  //   public/images/<collection>/<slug>/<filename>
  // Both must include the "images" segment — earlier the absPath was
  // missing it, which landed assets under `public/<collection>/...`.
  const relPath = `${IMAGES_BASE}/${opts.collection}/${opts.slug}/${filename}`;
  const absPath = join(PUBLIC_DIR, "images", opts.collection, opts.slug, filename);

  cache.set(sourceUrl, relPath);

  if (opts.skipAssets) {
    console.log(`  ⤓ (skipped) ${filename}`);
    return relPath;
  }

  // Idempotency: skip if already on disk
  try {
    const s = await stat(absPath);
    if (s.size > 0) {
      console.log(`  ⤓ (cached)  ${filename}`);
      return relPath;
    }
  } catch {
    /* not on disk yet */
  }

  if (opts.dryRun) {
    console.log(`  ⤓ (dry-run) ${filename}`);
    return relPath;
  }

  // Real download
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(
      `asset fetch ${sourceUrl} → HTTP ${res.status} ${res.statusText}`
    );
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(absPath), { recursive: true });
  await writeFile(absPath, buf);

  downloadCount++;
  bytesDownloaded += buf.length;
  console.log(`  ⤓ ${filename} (${formatBytes(buf.length)})`);
  return relPath;
}

/**
 * Rewrite any Webflow CDN URL found in a string to its local equivalent.
 * Used by the rich-text converter to fix up image src attributes in
 * MDX body content.
 *
 * Falls back to the original URL if the source hasn't been registered yet
 * (this should not happen in practice — assets are downloaded before
 * markdown conversion).
 */
export function rewriteUrl(sourceUrl: string): string {
  return cache.get(sourceUrl) ?? sourceUrl;
}

/**
 * Derive a clean filename from a Webflow CDN URL.
 * Examples:
 *   https://cdn.prod.website-files.com/abc/def_zero-trust-hero.avif
 *     → zero-trust-hero.avif
 *   https://cdn.prod.website-files.com/abc/foo%20bar.jpg
 *     → foo-bar.jpg
 */
function filenameFromUrl(url: string): string {
  const u = new URL(url);
  let name = basename(u.pathname);

  // ── Decode URL-escapes iteratively.
  // Webflow sometimes double-encodes ("%2520" → first decode gives "%20",
  // second decode gives " "). Keep decoding until the string stabilizes
  // or no more %XX sequences remain. Capped to 5 iterations as a safety
  // valve so a pathological input can never loop forever.
  for (let i = 0; i < 5 && /%[0-9a-fA-F]{2}/.test(name); i++) {
    let next: string;
    try {
      next = decodeURIComponent(name);
    } catch {
      break; // malformed sequence — stop, use what we have
    }
    if (next === name) break;
    name = next;
  }

  // ── Strip all stacked Webflow hash prefixes.
  // Webflow asset URLs sometimes look like `<fileId>_<oldFileId>_<original>`
  // (re-uploads preserve the legacy ID). Apply the prefix-strip in a loop
  // until no more hex-then-underscore prefix remains.
  while (true) {
    const m = name.match(/^[a-f0-9]{16,}_(.+)$/i);
    if (!m) break;
    name = m[1];
  }

  // ── Sanitize: lowercase, spaces / non-allowed chars → dashes,
  //              collapse runs, strip leading/trailing.
  const ext = extname(name);
  const base = name
    .slice(0, name.length - ext.length)
    .toLowerCase()
    .replace(/[^a-z0-9\-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  return base + ext.toLowerCase();
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Reset stats for a new run. */
export function resetStats(): void {
  downloadCount = 0;
  bytesDownloaded = 0;
  dedupedCount = 0;
}

/** Get a summary of asset activity. */
export function getStats() {
  return { downloadCount, bytesDownloaded, dedupedCount };
}
