/**
 * Authors ETL. Webflow collection: 6943a7215005cc4e782024ed.
 * Field names = camelCase of Webflow slugs.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { iterateItems, normalizeImage, type WebflowItem, computeStatus } from "../webflow.js";
import { registerItem } from "../lookup.js";
import { buildMdx } from "../frontmatter.js";
import { htmlToMdx } from "../markdown.js";
import { downloadAsset } from "../assets.js";
import type { RunOptions, CollectionReport } from "../types.js";

const COLLECTION_ID = "6943a7215005cc4e782024ed";
const TARGET_DIR = "src/content/author";

export async function migrateAuthors(opts: RunOptions): Promise<CollectionReport> {
  console.log(`\n[author] fetching items…`);
  const report: CollectionReport = { collection: "author", items: 0, errors: [], warnings: [] };

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

  const picture = normalizeImage(fd.picture);
  let pictureLocal: string | undefined;
  if (picture) {
    pictureLocal = await downloadAsset(picture.url, { collection: "author", slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets });
  }

  // Webflow `bio` is RichText — rendered as the Markdown body of the .md file.
  const bioHtml = (fd.bio as string) ?? "";
  const body = htmlToMdx(bioHtml, warnings);

  const numberOrderRaw = fd["number-order"];
  const numberOrder =
    numberOrderRaw != null && numberOrderRaw !== ""
      ? Number(numberOrderRaw)
      : undefined;

  const data = {
    name: fd.name as string,
    status,
    position: fd.position as string | undefined,
    picture: pictureLocal,
    numberOrder: Number.isFinite(numberOrder) ? numberOrder : undefined,
    metaTitle: fd["meta-title"] as string | undefined,
    metaDescription: fd["meta-description"] as string | undefined,
  };

  const path = join(opts.projectRoot, TARGET_DIR, `${slug}.md`);
  const content = buildMdx(data, body, {
    order: ["name", "status", "position", "picture", "numberOrder", "metaTitle", "metaDescription"],
  });

  if (!opts.dryRun) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  registerItem(item.id, "author", slug);
  console.log(`  ✓ ${data.name}  →  ${TARGET_DIR}/${slug}.md`);
  return warnings;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
}

