/**
 * Industries ETL. Writes camelCase-of-Webflow-slug field names verbatim.
 * Webflow collection: 6933dd51a3a037ea210302ba.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { iterateItems, normalizeImage, type WebflowItem, computeStatus } from "../webflow.js";
import { registerItem } from "../lookup.js";
import { buildMdx } from "../frontmatter.js";
import { htmlToMdx } from "../markdown.js";
import { downloadAsset } from "../assets.js";
import type { RunOptions, CollectionReport } from "../types.js";

const COLLECTION_ID = "6933dd51a3a037ea210302ba";
const TARGET_DIR = "src/content/industries";

export async function migrateIndustries(opts: RunOptions): Promise<CollectionReport> {
  console.log(`\n[industry] fetching items…`);
  const report: CollectionReport = { collection: "industry", items: 0, errors: [], warnings: [] };

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

  const featured = normalizeImage(fd["featured-image"]);
  const blueIcon = normalizeImage(fd["blue-icon-2"]);
  const whiteIcon = normalizeImage(fd["white-icon-2"]);
  const featuredLocal = featured ? await downloadAsset(featured.url, { collection: "industry", slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets }) : undefined;
  const blueIconLocal = blueIcon ? await downloadAsset(blueIcon.url, { collection: "industry", slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets }) : undefined;
  const whiteIconLocal = whiteIcon ? await downloadAsset(whiteIcon.url, { collection: "industry", slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets }) : undefined;

  const bodyHtml = (fd.content as string) ?? "";
  for (const src of extractImageUrls(bodyHtml)) {
    try {
      await downloadAsset(src, { collection: "industry", slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets });
    } catch (e) {
      warnings.push(`Body image fetch failed (${src}): ${(e as Error).message}`);
    }
  }

  // Webflow's `overview-of-content` is RichText — Webflow returns HTML.
  // Industry detail pages render it via `set:html`, so we keep the raw
  // HTML (no html→md conversion, which would break the list markup).
  const overviewOfContent = ((fd["overview-of-content"] as string) ?? "").trim();
  const body = htmlToMdx(bodyHtml, warnings);
  const faqs = flattenFaqs(fd);

  const data = {
    name: fd.name as string,
    status,
    shortDescriptionForCards: fd["short-description-for-cards"] as string | undefined,
    featuredImage: featuredLocal,
    featuredImageAlt: featured?.alt ?? "",
    subHeading: fd["sub-heading"] as string | undefined,
    overviewOfContent: overviewOfContent || undefined,
    faqs: faqs.length ? faqs : undefined,
    metaTitle: fd["meta-title"] as string | undefined,
    metaDescription: fd["meta-description"] as string | undefined,
    navHeading: fd["nav-heading"] as string | undefined,
    projectNumber: parseNumber(fd["project-number"]),
    cta: fd.cta as string | undefined,
    blueIcon2: blueIconLocal,
    whiteIcon2: whiteIconLocal,
    homepageShortDesc: fd["homepage--short-desc"] as string | undefined,
    orangeCounty: fd["orange-county"] as string | undefined,
    pasadena: fd["pasadena"] as string | undefined,
    buttonLabelText: fd["button-label-text"] as string | undefined,
  };

  const path = join(opts.projectRoot, TARGET_DIR, `${slug}.mdx`);
  const content = buildMdx(data, body, {
    order: [
      "name", "status",
      "shortDescriptionForCards",
      "featuredImage", "featuredImageAlt",
      "subHeading",
      "overviewOfContent",
      "faqs",
      "metaTitle", "metaDescription",
      "navHeading",
      "projectNumber",
      "cta",
      "blueIcon2", "whiteIcon2",
      "homepageShortDesc",
      "orangeCounty",
      "pasadena",
      "buttonLabelText",
    ],
  });

  if (!opts.dryRun) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  registerItem(item.id, "industry", slug);
  console.log(`  ✓ ${data.name}  →  ${TARGET_DIR}/${slug}.mdx`);
  return warnings;
}

function flattenFaqs(fd: Record<string, unknown>): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  for (let i = 1; i <= 5; i++) {
    const q = (fd[`faq${i}`] as string | undefined)?.trim();
    const a = (fd[`answer${i}`] as string | undefined)?.trim();
    if (q && a) out.push({ q, a });
  }
  return out;
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

