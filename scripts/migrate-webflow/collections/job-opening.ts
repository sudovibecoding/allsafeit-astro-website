/**
 * Job Openings ETL. Webflow collection: 69486d06a96000007b56a0ed.
 * Field names = camelCase of Webflow slugs.
 *
 * No composed body. The three Webflow RichText fields (careerAbout,
 * careerResponsibilities, careerRequirements) are stored as separate
 * frontmatter rich-text fields so the page template can render each in
 * its own labeled section.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { iterateItems, normalizeImage, type WebflowItem, computeStatus } from "../webflow.js";
import { registerItem } from "../lookup.js";
import { buildMdx } from "../frontmatter.js";
import { htmlToMdx } from "../markdown.js";
import { downloadAsset } from "../assets.js";
import type { RunOptions, CollectionReport } from "../types.js";

const COLLECTION_ID = "69486d06a96000007b56a0ed";
const TARGET_DIR = "src/content/job-opening";

export async function migrateJobOpenings(opts: RunOptions): Promise<CollectionReport> {
  console.log(`\n[job-opening] fetching items…`);
  const report: CollectionReport = { collection: "job-opening", items: 0, errors: [], warnings: [] };

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

  const careerIcon = normalizeImage(fd["career-icon"]);
  const careerIconLocal = careerIcon
    ? await downloadAsset(careerIcon.url, { collection: "job-opening", slug, dryRun: opts.dryRun, skipAssets: opts.skipAssets })
    : undefined;

  const careerAbout = htmlToMdx((fd["career-about"] as string) ?? "", warnings);
  const careerResponsibilities = htmlToMdx((fd["career-responsibilities"] as string) ?? "", warnings);
  const careerRequirements = htmlToMdx((fd["career-requirements"] as string) ?? "", warnings);

  const data = {
    name: fd.name as string,
    status,
    careerTitle: fd["career-title"] as string | undefined,
    careerLink: fd["career-link"] as string | undefined,
    careerIcon: careerIconLocal,
    careerExcerpt: fd["career-excerpt"] as string | undefined,
    careerJobApplicationEmail: fd["career-job-application-email"] as string | undefined,
    careerAbout: careerAbout || undefined,
    careerResponsibilities: careerResponsibilities || undefined,
    careerRequirements: careerRequirements || undefined,
  };

  const path = join(opts.projectRoot, TARGET_DIR, `${slug}.mdx`);
  // No body content — all three rich-text fields live in frontmatter.
  const content = buildMdx(data, "", {
    order: [
      "name", "status",
      "careerTitle", "careerLink", "careerIcon", "careerExcerpt",
      "careerJobApplicationEmail",
      "careerAbout", "careerResponsibilities", "careerRequirements",
    ],
  });

  if (!opts.dryRun) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  registerItem(item.id, "jobOpening", slug);
  console.log(`  ✓ ${data.careerTitle ?? data.name}  →  ${TARGET_DIR}/${slug}.mdx`);
  return warnings;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
}

