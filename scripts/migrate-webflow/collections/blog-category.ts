/**
 * Blog Categories ETL. Webflow collection: 691bbcb39d346b7748f2fe2b.
 * Field names = camelCase of Webflow slugs (seoTitle, seoDescription).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { iterateItems, type WebflowItem, computeStatus } from "../webflow.js";
import { registerItem } from "../lookup.js";
import { buildJson } from "../frontmatter.js";
import type { RunOptions, CollectionReport } from "../types.js";

const COLLECTION_ID = "691bbcb39d346b7748f2fe2b";
const TARGET_DIR = "src/content/blog-category";

export async function migrateBlogCategories(opts: RunOptions): Promise<CollectionReport> {
  console.log(`\n[blog-category] fetching items…`);
  const report: CollectionReport = { collection: "blog-category", items: 0, errors: [], warnings: [] };

  let count = 0;
  for await (const item of iterateItems(COLLECTION_ID)) {
    if (opts.limit && count >= opts.limit) break;
    try {
      await convertItem(item, opts);
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

async function convertItem(item: WebflowItem, opts: RunOptions): Promise<void> {
  const fd = item.fieldData as Record<string, string | undefined>;
  const slug = fd.slug ?? slugify(fd.name ?? item.id);
  const name = fd.name ?? slug;
  const status = computeStatus(item);

  const data = {
    name,
    status,
    seoTitle: fd["seo-title"],
    seoDescription: fd["seo-description"],
  };

  const path = join(opts.projectRoot, TARGET_DIR, `${slug}.json`);
  const content = buildJson(data, { order: ["name", "status", "seoTitle", "seoDescription"] });

  if (!opts.dryRun) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  registerItem(item.id, "blogCategory", slug);
  console.log(`  ✓ ${name}  →  ${TARGET_DIR}/${slug}.json`);
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
}

