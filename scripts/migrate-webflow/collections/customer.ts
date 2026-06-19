/**
 * Customers ETL. Webflow collection: 691bbcb39d346b7748f2fe12.
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

const COLLECTION_ID = "691bbcb39d346b7748f2fe12";
const TARGET_DIR = "src/content/customer";

export async function migrateCustomers(opts: RunOptions): Promise<CollectionReport> {
  console.log(`\n[customer] fetching items…`);
  const report: CollectionReport = { collection: "customer", items: 0, errors: [], warnings: [] };

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

  const imgFields = [
    { key: "main-image", local: "mainImage" },
    { key: "secondary-image", local: "secondaryImage" },
    { key: "customer-logo", local: "customerLogo" },
    { key: "customer-avatar", local: "customerAvatar" },
  ];
  const imagePaths: Record<string, string | undefined> = {};
  for (const { key, local } of imgFields) {
    const img = normalizeImage(fd[key]);
    if (img) {
      imagePaths[local] = await downloadAsset(img.url, { collection: "customer", slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets });
    }
  }

  const bodyHtml = (fd["main-article"] as string) ?? "";
  for (const src of extractImageUrls(bodyHtml)) {
    try {
      await downloadAsset(src, { collection: "customer", slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets });
    } catch (e) {
      warnings.push(`Body image fetch failed (${src}): ${(e as Error).message}`);
    }
  }

  const body = htmlToMdx(bodyHtml, warnings);

  // Webflow 4-flat-field → structured array, same pattern as faqs.
  const metrics: { value: string; explainer: string }[] = [];
  const m1v = (fd["metric-1-number"] as string)?.trim();
  const m1e = (fd["metric-1-explainer-text"] as string)?.trim();
  if (m1v) metrics.push({ value: m1v, explainer: m1e ?? "" });
  const m2v = (fd["metric-2-number"] as string)?.trim();
  const m2e = (fd["metric-2-explainer-text"] as string)?.trim();
  if (m2v) metrics.push({ value: m2v, explainer: m2e ?? "" });

  const data = {
    name: fd.name as string,
    status,
    mainImage: imagePaths.mainImage,
    secondaryImage: imagePaths.secondaryImage,
    customerLogo: imagePaths.customerLogo,
    customerAvatar: imagePaths.customerAvatar,
    caseStudyTitle: fd["case-study-title"] as string | undefined,
    summaryText: fd["summary-text"] as string | undefined,
    location: fd.location as string | undefined,
    industry: fd.industry as string | undefined,
    servicesUsed: fd["services-used"] as string | undefined,
    introductionParagraph: fd["introduction-paragraph"] as string | undefined,
    quoteFromCustomer: fd["quote-from-customer"] as string | undefined,
    quoteAuthor: fd["quote-author"] as string | undefined,
    quoteAuthorPosition: fd["quote-author-position"] as string | undefined,
    metrics: metrics.length ? metrics : undefined,
    orderNumber: parseNumber(fd["order-number"]),
  };

  const path = join(opts.projectRoot, TARGET_DIR, `${slug}.mdx`);
  const content = buildMdx(data, body, {
    order: [
      "name", "status",
      "mainImage", "secondaryImage", "customerLogo", "customerAvatar",
      "caseStudyTitle", "summaryText",
      "location", "industry", "servicesUsed",
      "introductionParagraph",
      "quoteFromCustomer", "quoteAuthor", "quoteAuthorPosition",
      "metrics",
      "orderNumber",
    ],
  });

  if (!opts.dryRun) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  registerItem(item.id, "customer", slug);
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

