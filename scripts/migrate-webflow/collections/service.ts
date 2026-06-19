/**
 * Services ETL — parameterized by category.
 *
 * Used 4× — once per Webflow service collection. Writes to the matching
 * subfolder under src/content/services/<category>.
 *
 * Schema: managed-it superset (the most complete of the 4 Webflow service
 * collections). cybersecurity / it-consulting / it-infrastructure-and-cloud
 * items will have empty `cta` and/or `linkDescriptionText` values where
 * Webflow doesn't carry them.
 *
 * All frontmatter field names are camelCase derivations of Webflow slugs.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { iterateItems, normalizeImage, type WebflowItem, computeStatus } from "../webflow.js";
import { registerItem } from "../lookup.js";
import { buildMdx } from "../frontmatter.js";
import { htmlToMdx } from "../markdown.js";
import { downloadAsset } from "../assets.js";
import type { RunOptions, CollectionReport } from "../types.js";

export interface ServiceVariant {
  category: string; // folder name (e.g. "managed-it")
  collectionId: string; // Webflow collection ID
  tinaName: string; // Tina collection name registered in lookup
  label: string; // logging label
}

export const SERVICE_VARIANTS: ServiceVariant[] = [
  { category: "managed-it", collectionId: "692eb950a6b4b47e11865770", tinaName: "serviceManagedIt", label: "service-managed-it" },
  { category: "cybersecurity", collectionId: "692eb99bf4f62ea5a926f03c", tinaName: "serviceCybersecurity", label: "service-cybersecurity" },
  { category: "it-consulting", collectionId: "692eb97f05707649a9f56d3e", tinaName: "serviceItConsulting", label: "service-it-consulting" },
  { category: "it-infrastructure-and-cloud", collectionId: "692d7cc6e9a9724c42104cfc", tinaName: "serviceItInfrastructure", label: "service-it-infrastructure-and-cloud" },
];

export async function migrateService(
  variant: ServiceVariant,
  opts: RunOptions
): Promise<CollectionReport> {
  console.log(`\n[${variant.label}] fetching items…`);
  const report: CollectionReport = { collection: variant.label, items: 0, errors: [], warnings: [] };

  let count = 0;
  for await (const item of iterateItems(variant.collectionId)) {
    if (opts.limit && count >= opts.limit) break;
    try {
      const warnings = await convertItem(item, variant, opts);
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

async function convertItem(
  item: WebflowItem,
  variant: ServiceVariant,
  opts: RunOptions
): Promise<string[]> {
  const fd = item.fieldData as Record<string, unknown>;
  const slug = (fd.slug as string) ?? slugify((fd.name as string) ?? item.id);
  const status = computeStatus(item);
  const warnings: string[] = [];
  const targetDir = `src/content/services/${variant.category}`;
  const assetCollection = `service/${variant.category}`;

  const featured = normalizeImage(fd["featured-image"]);
  const featuredLocal = featured
    ? await downloadAsset(featured.url, { collection: assetCollection, slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets })
    : undefined;

  // Body images
  const bodyHtml = (fd.content as string) ?? "";
  for (const src of extractImageUrls(bodyHtml)) {
    try {
      await downloadAsset(src, { collection: assetCollection, slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets });
    } catch (e) {
      warnings.push(`Body image fetch failed (${src}): ${(e as Error).message}`);
    }
  }

  // Webflow's `overview-of-content` is a RichText field — Webflow returns
  // it as HTML. The service detail page renders it via Astro `set:html`,
  // so we store the raw HTML verbatim. (Don't run htmlToMdx here: that
  // would convert to Markdown, which `set:html` won't parse — bullets
  // like `-   item` would render as literal text instead of <ul><li>.)
  const overviewOfContent = ((fd["overview-of-content"] as string) ?? "").trim();
  const body = htmlToMdx(bodyHtml, warnings);

  // Frontmatter field names = camelCase of Webflow slugs. No invented names.
  const data = {
    name: fd.name as string,
    status,
    shortDescriptionForCards: fd["short-description-for-cards"] as string | undefined,
    featuredImage: featuredLocal,
    featuredImageAlt: featured?.alt ?? "",
    subHeading: fd["sub-heading"] as string | undefined,
    overviewOfContent: overviewOfContent || undefined,
    faqs: flattenFaqs(fd),
    metaTitle: fd["meta-title"] as string | undefined,
    metaDescription: fd["meta-description"] as string | undefined,
    navHeading: fd["nav-heading"] as string | undefined,
    projectNumber: parseNumber(fd["project-number"]),
    cta: fd.cta as string | undefined,
    linkDescriptionText: fd["link-description-text"] as string | undefined,
  };

  const path = join(opts.projectRoot, targetDir, `${slug}.mdx`);
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
      "linkDescriptionText",
    ],
  });

  if (!opts.dryRun) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  registerItem(item.id, variant.tinaName, slug);
  console.log(`  ✓ ${data.name}  →  ${targetDir}/${slug}.mdx`);
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

