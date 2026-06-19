/**
 * Blog Posts ETL. Webflow collection: 691bbcb39d346b7748f2fe46.
 * Webflow-slug-derived field names verbatim; references resolved via lookup.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { iterateItems, normalizeImage, type WebflowItem, computeStatus } from "../webflow.js";
import { resolve as resolveRef, registerItem } from "../lookup.js";
import { buildMdx } from "../frontmatter.js";
import { htmlToMdx } from "../markdown.js";
import { downloadAsset } from "../assets.js";
import type { RunOptions, CollectionReport } from "../types.js";

const COLLECTION_ID = "691bbcb39d346b7748f2fe46";
const TARGET_DIR = "src/content/blog";

export async function migrateBlog(opts: RunOptions): Promise<CollectionReport> {
  console.log(`\n[blog] fetching items…`);
  const report: CollectionReport = { collection: "blog", items: 0, errors: [], warnings: [] };

  let count = 0;
  for await (const item of iterateItems(COLLECTION_ID)) {
    if (opts.limit && count >= opts.limit) break;
    try {
      const warnings = await convertItem(item, opts);
      report.warnings.push(...warnings);
      count++;
    } catch (err) {
      report.errors.push(`${item.id}: ${(err as Error).message}`);
      console.error(`  ✗ ${item.id}: ${(err as Error).message}`);
    }
  }
  report.items = count;
  console.log(`  ${count} item${count === 1 ? "" : "s"} migrated`);
  return report;
}

async function convertItem(item: WebflowItem, opts: RunOptions): Promise<string[]> {
  const fd = item.fieldData as Record<string, unknown>;
  const slug = (fd.slug as string) ?? slugify((fd.name as string) ?? item.id);
  const status = computeStatus(item);
  const warnings: string[] = [];

  const main = normalizeImage(fd["main-image"]);
  const thumb = normalizeImage(fd["thumbnail-image"]);
  let mainLocal: string | undefined;
  let thumbLocal: string | undefined;
  if (main) {
    mainLocal = await downloadAsset(main.url, { collection: "blog", slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets });
  }
  if (thumb && thumb.url !== main?.url) {
    thumbLocal = await downloadAsset(thumb.url, { collection: "blog", slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets });
  }

  const bodyHtml = (fd["post-body"] as string) ?? "";
  for (const src of extractImageUrls(bodyHtml)) {
    if (!src) continue;
    try {
      await downloadAsset(src, { collection: "blog", slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets });
    } catch (e) {
      warnings.push(`Body image fetch failed (${src}): ${(e as Error).message}`);
    }
  }
  const body = htmlToMdx(bodyHtml, warnings);

  const categorySlug = resolveRef(fd.category as string | undefined);
  const authorSlug = resolveRef(fd.author as string | undefined);

  const data = {
    name: fd.name as string,
    status,
    mainImage: mainLocal,
    mainImageAlt: main?.alt ?? "",
    thumbnailImage: thumbLocal,
    introductionParagraph: (fd["introduction-paragraph"] as string) ?? "",
    category: categorySlug ?? undefined,
    author: authorSlug ?? undefined,
    firstPublishedDate: parseDate(fd["first-published-date"] as string | undefined),
    postFeatured: fd["post---featured"] === true,
    metaTitleForBlogs: fd["meta-title-for-blogs"] as string | undefined,
    metaDescriptionForBlogs: fd["meta-description-for-blogs"] as string | undefined,
    faqSchemaJson: fd["faq-schema-json"] as string | undefined,
  };

  const path = join(opts.projectRoot, TARGET_DIR, `${slug}.mdx`);
  const content = buildMdx(data, body, {
    order: [
      "name", "status",
      "mainImage", "mainImageAlt", "thumbnailImage",
      "introductionParagraph",
      "category", "author",
      "firstPublishedDate", "postFeatured",
      "metaTitleForBlogs", "metaDescriptionForBlogs",
      "faqSchemaJson",
    ],
  });

  if (!opts.dryRun) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  registerItem(item.id, "blog", slug);
  console.log(`  ✓ ${data.name}  →  ${TARGET_DIR}/${slug}.mdx`);
  return warnings;
}

function extractImageUrls(html: string): string[] {
  const out: string[] = [];
  const re = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
}

function parseDate(s: string | undefined): string {
  if (!s) return new Date().toISOString();
  return s;
}

