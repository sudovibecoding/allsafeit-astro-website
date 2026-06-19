/**
 * Testimonials ETL. Webflow collection: 6943db1aa93462f11314f6f0.
 * Field names = camelCase of Webflow slugs.
 *
 * Webflow exposes 3 text variants per item:
 *   - testimonial (PlainText) — the canonical short quote
 *   - tetsimonial-new (RichText) — alternate variant [sic typo preserved]
 *   - testimonial-long (RichText) — long-form variant, gated by `long-text` Switch
 *
 * Body = `testimonial` PlainText. The two RichText variants are stored as
 * separate frontmatter fields so the page template can choose which to
 * render based on `longText` and content presence.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { iterateItems, normalizeImage, type WebflowItem, computeStatus } from "../webflow.js";
import { registerItem } from "../lookup.js";
import { buildMdx } from "../frontmatter.js";
import { htmlToMdx } from "../markdown.js";
import { downloadAsset } from "../assets.js";
import type { RunOptions, CollectionReport } from "../types.js";

const COLLECTION_ID = "6943db1aa93462f11314f6f0";
const TARGET_DIR = "src/content/testimonial";

export async function migrateTestimonials(opts: RunOptions): Promise<CollectionReport> {
  console.log(`\n[testimonial] fetching items…`);
  const report: CollectionReport = { collection: "testimonial", items: 0, errors: [], warnings: [] };

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

  const photo = normalizeImage(fd.photo);
  const photoLocal = photo
    ? await downloadAsset(photo.url, { collection: "testimonial", slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets })
    : undefined;

  // Body = the canonical PlainText short quote (Webflow `testimonial`).
  const body = ((fd["testimonial"] as string) ?? "").trim();

  // The two RichText variants live in frontmatter — convert HTML→MD.
  const tetsimonialNew = htmlToMdx((fd["tetsimonial-new"] as string) ?? "", warnings).trim();
  const testimonialLong = htmlToMdx((fd["testimonial-long"] as string) ?? "", warnings).trim();

  const data = {
    name: fd.name as string,
    status,
    subtitle: fd.subtitle as string | undefined,
    photo: photoLocal,
    tetsimonialNew: tetsimonialNew || undefined,
    testimonialLong: testimonialLong || undefined,
    hide: fd.hide === true,
    showDarkLogo: fd["show-dark-logo"] === true,
    showLightLogo: fd["show-light-logo"] === true,
    longText: fd["long-text"] === true,
    numberOrder: parseNumber(fd["number-order"]),
    metaTitle: fd["meta-title"] as string | undefined,
    metaDescription: fd["meta-description"] as string | undefined,
  };

  const path = join(opts.projectRoot, TARGET_DIR, `${slug}.mdx`);
  const content = buildMdx(data, body, {
    order: [
      "name", "status",
      "subtitle", "photo",
      "tetsimonialNew", "testimonialLong",
      "hide", "showDarkLogo", "showLightLogo", "longText",
      "numberOrder",
      "metaTitle", "metaDescription",
    ],
  });

  if (!opts.dryRun) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  registerItem(item.id, "testimonial", slug);
  console.log(`  ✓ ${data.name}  →  ${TARGET_DIR}/${slug}.mdx`);
  return warnings;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
}

function parseNumber(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

