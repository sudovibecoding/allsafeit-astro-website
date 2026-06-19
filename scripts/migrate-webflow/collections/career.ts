/**
 * Careers ETL. Webflow collection: 69486e175fb4e807af4578e6.
 * Field names = camelCase of Webflow slugs.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { iterateItems, type WebflowItem, computeStatus } from "../webflow.js";
import { registerItem } from "../lookup.js";
import { buildMdx } from "../frontmatter.js";
import { htmlToMdx } from "../markdown.js";
import type { RunOptions, CollectionReport } from "../types.js";

const COLLECTION_ID = "69486e175fb4e807af4578e6";
const TARGET_DIR = "src/content/career";

export async function migrateCareers(opts: RunOptions): Promise<CollectionReport> {
  console.log(`\n[career] fetching items…`);
  const report: CollectionReport = { collection: "career", items: 0, errors: [], warnings: [] };

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

  // Webflow `description` is RichText → MDX body.
  const body = htmlToMdx((fd.description as string) ?? "", warnings);

  const data = {
    name: fd.name as string,
    status,
    location: fd.location as string | undefined,
    basis: fd.basis as string | undefined,
  };

  const path = join(opts.projectRoot, TARGET_DIR, `${slug}.mdx`);
  const content = buildMdx(data, body, {
    order: ["name", "status", "location", "basis"],
  });

  if (!opts.dryRun) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  registerItem(item.id, "career", slug);
  console.log(`  ✓ ${data.name}  →  ${TARGET_DIR}/${slug}.mdx`);
  return warnings;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
}

