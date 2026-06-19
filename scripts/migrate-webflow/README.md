# Webflow → Tina/Astro CMS Migration

ETL script that reads from Webflow Data API v2 and writes content into
this project's `src/content/*` (as MDX/MD/JSON) and assets into
`public/images/*`.

## What it migrates (Phase 1 scope)

Core editorial collections, in dependency order:

1. **Blog Categories** → `src/content/blog-category/<slug>.json`
2. **Authors** → `src/content/author/<slug>.md`
3. **Blog Posts** → `src/content/blog/<slug>.mdx` (with `category` + `author` references)
4. **Industries** → `src/content/industries/<slug>.mdx`
5. **Services (4 collections)** → `src/content/services/<category>/<slug>.mdx`

Phase 2 (deferred): Customers, Testimonials, Team Members, Job Openings,
Careers, Professional IT Services.

## Prerequisites

1. **Webflow API token** with at least `cms:read` + `assets:read` scopes.
   Get one from `https://webflow.com/dashboard` → workspace → Apps &
   Integrations → API Access → "Generate Site API token" for the AllSafe site.

2. **Token in your environment**. Either:
   - Add to `.env` in the project root: `WEBFLOW_TOKEN=<paste-here>`
   - Or export in the current shell: `$env:WEBFLOW_TOKEN = "..."` (PowerShell)
     / `export WEBFLOW_TOKEN=...` (bash/zsh)

3. **Dependencies installed**. They are if `npm install` has been run:
   `turndown`, `turndown-plugin-gfm`, `js-yaml`, `tsx`, plus type packages.

## Usage

```bash
# Full migration (all in-scope collections, real writes)
npm run migrate:webflow

# Dry run — no files written, no assets downloaded; logs what *would* happen
npm run migrate:webflow -- --dry-run

# Just one collection
npm run migrate:webflow -- --only=blog-category

# Multiple specific collections
npm run migrate:webflow -- --only=blog-category,author,blog

# Test with a small subset
npm run migrate:webflow -- --only=blog --limit=3

# Skip asset downloads (faster iteration during dev)
npm run migrate:webflow -- --skip-assets

# Show all flags
npm run migrate:webflow -- --help
```

## Recommended first run (smoke test)

```bash
# 1. Dry run on the smallest collection
WEBFLOW_TOKEN=xxx npm run migrate:webflow -- --only=blog-category --dry-run

# 2. If output looks right, do the real write:
WEBFLOW_TOKEN=xxx npm run migrate:webflow -- --only=blog-category

# 3. Check src/content/blog-category/ — should have JSON files

# 4. Same flow for authors:
WEBFLOW_TOKEN=xxx npm run migrate:webflow -- --only=author --limit=3 --dry-run
WEBFLOW_TOKEN=xxx npm run migrate:webflow -- --only=author

# 5. Then a small blog batch:
WEBFLOW_TOKEN=xxx npm run migrate:webflow -- --only=blog-category,author,blog --limit=3

# 6. Verify with astro build:
npm run build  # or npx astro build (skips Tina cloud step)

# 7. If all good, run full migration:
WEBFLOW_TOKEN=xxx npm run migrate:webflow
```

## Idempotency

- Re-running with no Webflow changes produces no file diffs.
- Asset files already on disk are not re-downloaded.
- Stable frontmatter ordering keeps git diffs minimal.

## File structure

```
scripts/migrate-webflow/
├── index.ts                 # CLI entry point
├── webflow.ts               # API client (paginated reads)
├── assets.ts                # Asset downloader + URL rewrite cache
├── markdown.ts              # HTML → MDX via Turndown
├── frontmatter.ts           # YAML frontmatter writer
├── lookup.ts                # Reference resolver
├── types.ts                 # Shared types
├── collections/
│   ├── blog-category.ts
│   ├── author.ts
│   ├── blog.ts
│   ├── industry.ts
│   └── service.ts           # Generic; parameterized for 4 service categories
└── README.md                # This file
```

## Output locations

| Collection | Content path | Asset path |
|---|---|---|
| Blog Categories | `src/content/blog-category/<slug>.json` | (no assets) |
| Authors | `src/content/author/<slug>.md` | `public/images/author/<slug>/<filename>` |
| Blog Posts | `src/content/blog/<slug>.mdx` | `public/images/blog/<slug>/<filename>` |
| Industries | `src/content/industries/<slug>.mdx` | `public/images/industry/<slug>/<filename>` |
| Services | `src/content/services/<category>/<slug>.mdx` | `public/images/service/<category>/<slug>/<filename>` |

## What gets flagged for review

The script writes warnings (not errors) for content that needs editor
attention after migration:

- **Embedded HTML blocks** (`<div class="w-embed">`) — preserved as raw
  HTML in MDX; editors should inspect each occurrence.
- **Iframe video embeds** — preserved as raw HTML; could be replaced
  with React components.
- **Unresolved references** — Webflow item IDs that didn't map to a
  migrated item (rare; usually means archived parent items).
- **Body image fetch failures** — individual asset downloads that
  failed; the MDX file is still written, but with the original CDN URL
  retained.

## Status field

Every output file gets a `status` field in frontmatter:

- `published` — live on Webflow at the time of migration
- `draft` — was in draft state on Webflow
- `archived` — was archived on Webflow

Astro page templates can filter on `status` to exclude non-published
items from production builds while keeping them editable in Tina.

## Safety

- **Read-only**: the script never POSTs, PUTs, or DELETEs to Webflow.
- **Rate-limited**: respects Webflow's 429 with exponential backoff.
- **No git commits**: writes files; you commit when you're satisfied.
- **Dry-run mode**: `--dry-run` skips all writes for risk-free preview.
