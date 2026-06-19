/**
 * Professional IT Services ETL. Webflow collection: 6943dffabfa6a423052798d9.
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

const COLLECTION_ID = "6943dffabfa6a423052798d9";
const TARGET_DIR = "src/content/professional-service";

export async function migrateProfessionalServices(opts: RunOptions): Promise<CollectionReport> {
  console.log(`\n[professional-service] fetching items…`);
  const report: CollectionReport = { collection: "professional-service", items: 0, errors: [], warnings: [] };

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

  const mainImg = normalizeImage(fd["main-image"]);
  const mainImgLocal = mainImg
    ? await downloadAsset(mainImg.url, { collection: "professional-service", slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets })
    : undefined;

  // Body — Webflow `main-text` RichText.
  const bodyHtml = (fd["main-text"] as string) ?? "";
  for (const src of extractImageUrls(bodyHtml)) {
    try {
      await downloadAsset(src, { collection: "professional-service", slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets });
    } catch (e) {
      warnings.push(`Body image fetch failed (${src}): ${(e as Error).message}`);
    }
  }
  const body = htmlToMdx(bodyHtml, warnings);

  const data = {
    name: fd.name as string,
    status,
    mainImage: mainImgLocal,
    shortDescription: fd["short-description"] as string | undefined,
    heroSectionDescription: fd["hero-section-description"] as string | undefined,
    navHeading: fd["nav-heading"] as string | undefined,
    projectNumber: parseNumber(fd["project-number"]),
    metaTitle: fd["meta-title"] as string | undefined,
    metaDescription: fd["meta-description"] as string | undefined,
  };

  const path = join(opts.projectRoot, TARGET_DIR, `${slug}.mdx`);
  const content = buildMdx(data, body, {
    order: [
      "name", "status",
      "mainImage",
      "shortDescription", "heroSectionDescription",
      "navHeading", "projectNumber",
      "metaTitle", "metaDescription",
    ],
  });

  if (!opts.dryRun) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  registerItem(item.id, "professionalService", slug);
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

function parseNumber(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

