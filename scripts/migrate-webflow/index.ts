#!/usr/bin/env tsx
/**
 * Webflow → Tina/Astro CMS migration ETL.
 *
 * Reads from Webflow Data API v2, writes MDX/MD/JSON files under
 * src/content/* and assets under public/images/*.
 *
 * Usage:
 *   WEBFLOW_TOKEN=xxx npm run migrate:webflow
 *   WEBFLOW_TOKEN=xxx npm run migrate:webflow -- --dry-run
 *   WEBFLOW_TOKEN=xxx npm run migrate:webflow -- --only=blog-category
 *   WEBFLOW_TOKEN=xxx npm run migrate:webflow -- --only=blog --limit=3
 *   WEBFLOW_TOKEN=xxx npm run migrate:webflow -- --skip-assets
 *
 * Idempotency: re-running with no Webflow changes produces no diffs.
 * Assets already on disk are not re-downloaded.
 */
import { migrateBlogCategories } from "./collections/blog-category.js";
import { migrateAuthors } from "./collections/author.js";
import { migrateBlog } from "./collections/blog.js";
import { migrateIndustries } from "./collections/industry.js";
import { migrateService, SERVICE_VARIANTS } from "./collections/service.js";
// Phase 2 collections — no references between them, order doesn't matter.
import { migrateCustomers } from "./collections/customer.js";
import { migrateTestimonials } from "./collections/testimonial.js";
import { migrateTeamMembers } from "./collections/team-member.js";
import { migrateJobOpenings } from "./collections/job-opening.js";
import { migrateCareers } from "./collections/career.js";
import { migrateProfessionalServices } from "./collections/professional-service.js";
import { getStats, resetStats } from "./assets.js";
import { getUnresolved, reset as resetLookup } from "./lookup.js";
import type { RunOptions, CollectionReport } from "./types.js";

interface CliFlags {
  dryRun: boolean;
  skipAssets: boolean;
  limit?: number;
  only?: string[];
}

function parseFlags(argv: string[]): CliFlags {
  const out: CliFlags = { dryRun: false, skipAssets: false };
  for (const arg of argv.slice(2)) {
    if (arg === "--dry-run") out.dryRun = true;
    else if (arg === "--skip-assets") out.skipAssets = true;
    else if (arg.startsWith("--limit=")) out.limit = Number(arg.slice(8));
    else if (arg.startsWith("--only=")) {
      out.only = arg.slice(7).split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg === "--help" || arg === "-h") {
      printHelpAndExit();
    } else {
      console.warn(`unknown flag: ${arg} (use --help for usage)`);
    }
  }
  return out;
}

function printHelpAndExit(): never {
  console.log(`
Webflow → Tina/Astro ETL

Flags:
  --dry-run            Don't write files or download assets, only log actions.
  --skip-assets        Skip asset downloads (faster iteration during dev).
  --limit=N            Process only the first N items per collection.
  --only=a,b,c         Only run these collections. Valid labels:
                         blog-category, author, blog, industry,
                         service-managed-it, service-cybersecurity,
                         service-it-consulting, service-it-infrastructure-and-cloud,
                         customer, testimonial, team-member, job-opening,
                         career, professional-service

Environment:
  WEBFLOW_TOKEN        Required. Webflow API token with cms:read + assets:read.

Examples:
  WEBFLOW_TOKEN=xxx npm run migrate:webflow
  WEBFLOW_TOKEN=xxx npm run migrate:webflow -- --only=blog --limit=3 --dry-run
`);
  process.exit(0);
}

async function main() {
  const flags = parseFlags(process.argv);
  const opts: RunOptions = {
    projectRoot: process.cwd(),
    dryRun: flags.dryRun,
    skipAssets: flags.skipAssets,
    limit: flags.limit,
    only: flags.only,
  };

  console.log("╭─────────────────────────────────────────────────╮");
  console.log("│  Webflow → Tina/Astro CMS migration             │");
  console.log("╰─────────────────────────────────────────────────╯");
  console.log(`  Mode:       ${flags.dryRun ? "DRY RUN" : "live"}`);
  console.log(`  Assets:     ${flags.skipAssets ? "skipped" : "downloaded"}`);
  if (flags.limit) console.log(`  Limit:      ${flags.limit} per collection`);
  if (flags.only) console.log(`  Only:       ${flags.only.join(", ")}`);
  console.log("");

  resetStats();
  resetLookup();

  const t0 = Date.now();
  const reports: CollectionReport[] = [];

  // Order matters: referenced collections first.
  const pipeline: { label: string; run: () => Promise<CollectionReport> }[] = [
    {
      label: "blog-category",
      run: () => migrateBlogCategories(opts),
    },
    { label: "author", run: () => migrateAuthors(opts) },
    { label: "blog", run: () => migrateBlog(opts) },
    { label: "industry", run: () => migrateIndustries(opts) },
    ...SERVICE_VARIANTS.map((v) => ({
      label: v.label,
      run: () => migrateService(v, opts),
    })),
    // Phase 2 — no inter-references, order arbitrary.
    { label: "customer", run: () => migrateCustomers(opts) },
    { label: "testimonial", run: () => migrateTestimonials(opts) },
    { label: "team-member", run: () => migrateTeamMembers(opts) },
    { label: "job-opening", run: () => migrateJobOpenings(opts) },
    { label: "career", run: () => migrateCareers(opts) },
    { label: "professional-service", run: () => migrateProfessionalServices(opts) },
  ];

  for (const stage of pipeline) {
    if (opts.only && !opts.only.includes(stage.label)) continue;
    try {
      const report = await stage.run();
      reports.push(report);
    } catch (err) {
      console.error(`\n[${stage.label}] FATAL: ${(err as Error).message}`);
      reports.push({
        collection: stage.label,
        items: 0,
        errors: [(err as Error).message],
        warnings: [],
      });
    }
  }

  const dt = ((Date.now() - t0) / 1000).toFixed(1);

  // ── Summary
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  Migration summary");
  console.log("═══════════════════════════════════════════════════");

  for (const r of reports) {
    const errs = r.errors.length ? ` [${r.errors.length} ERR]` : "";
    const warns = r.warnings.length ? ` [${r.warnings.length} warn]` : "";
    console.log(`  ${r.collection.padEnd(40)} ${r.items} items${errs}${warns}`);
  }

  const stats = getStats();
  const unresolved = getUnresolved();
  const totalItems = reports.reduce((s, r) => s + r.items, 0);
  const totalErrors = reports.reduce((s, r) => s + r.errors.length, 0);
  const totalWarnings = reports.reduce((s, r) => s + r.warnings.length, 0);

  console.log("");
  console.log(`  Items migrated:      ${totalItems}`);
  console.log(
    `  Assets downloaded:   ${stats.downloadCount} (${formatBytes(stats.bytesDownloaded)}; ${stats.dedupedCount} deduped)`
  );
  console.log(`  Warnings:            ${totalWarnings}`);
  console.log(`  Errors:              ${totalErrors}`);
  console.log(`  Unresolved refs:     ${unresolved.length}`);
  console.log(`  Time:                ${dt}s`);

  if (unresolved.length) {
    console.log("\n  Unresolved reference IDs (referenced items not migrated):");
    for (const id of unresolved) console.log(`    - ${id}`);
  }

  if (totalErrors > 0) {
    console.log("\n  Errors detected. See per-item log above.");
    process.exit(1);
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

main().catch((err) => {
  console.error("\nFATAL:", err);
  process.exit(1);
});
