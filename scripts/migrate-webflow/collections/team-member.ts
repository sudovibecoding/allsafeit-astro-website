/**
 * Team Members ETL. Webflow collection: 6948680f8fc622a99d29aa37.
 * Field names = camelCase of Webflow slugs (orderList, not order).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { iterateItems, normalizeImage, type WebflowItem, computeStatus } from "../webflow.js";
import { registerItem } from "../lookup.js";
import { buildJson } from "../frontmatter.js";
import { downloadAsset } from "../assets.js";
import type { RunOptions, CollectionReport } from "../types.js";

const COLLECTION_ID = "6948680f8fc622a99d29aa37";
const TARGET_DIR = "src/content/team-member";

export async function migrateTeamMembers(opts: RunOptions): Promise<CollectionReport> {
  console.log(`\n[team-member] fetching items…`);
  const report: CollectionReport = { collection: "team-member", items: 0, errors: [], warnings: [] };

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
  const fd = item.fieldData as Record<string, unknown>;
  const slug = (fd.slug as string) ?? slugify((fd.name as string) ?? item.id);
  const status = computeStatus(item);

  const img = normalizeImage(fd.image);
  const imgLocal = img
    ? await downloadAsset(img.url, { collection: "team-member", slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets })
    : undefined;

  const data = {
    name: fd.name as string,
    status,
    image: imgLocal,
    position: fd.position as string | undefined,
    facebook: fd.facebook as string | undefined,
    twitter: fd.twitter as string | undefined,
    linkedin: fd.linkedin as string | undefined,
    orderList: parseNumber(fd["order-list"]),
  };

  const path = join(opts.projectRoot, TARGET_DIR, `${slug}.json`);
  const content = buildJson(data, {
    order: ["name", "status", "image", "position", "facebook", "twitter", "linkedin", "orderList"],
  });

  if (!opts.dryRun) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  registerItem(item.id, "teamMember", slug);
  console.log(`  ✓ ${data.name}  →  ${TARGET_DIR}/${slug}.json`);
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
}

function parseNumber(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

