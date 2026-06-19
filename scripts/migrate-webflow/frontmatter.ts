/**
 * YAML frontmatter writer.
 *
 * Wraps js-yaml with stable key ordering and Astro-friendly defaults:
 *   - dates serialize as ISO 8601 strings (not js-yaml's `!!timestamp` tag)
 *   - empty values are omitted (cleaner files, fewer diffs)
 *   - block-style strings preferred over inline JSON-ish syntax
 */
import yaml from "js-yaml";

export type FrontmatterValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | FrontmatterValue[]
  | { [key: string]: FrontmatterValue };

export interface FrontmatterOptions {
  /** Field order to preserve when serializing. Other fields appended after. */
  order?: string[];
}

/**
 * Build a `.mdx` / `.md` file body as `--- yaml ---\nbody` string.
 */
export function buildMdx(
  frontmatter: Record<string, FrontmatterValue>,
  body: string,
  options: FrontmatterOptions = {}
): string {
  const cleaned = stripEmpty(frontmatter);
  const ordered = orderKeys(cleaned, options.order ?? []);

  const yamlStr = yaml.dump(ordered, {
    lineWidth: -1, // never wrap (keeps long strings on one line — important for SEO meta)
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
    sortKeys: false, // we ordered manually
  });

  return `---\n${yamlStr}---\n\n${body}\n`;
}

/**
 * Build a `.json` file string (for collections with `format: "json"` like
 * blog-category).
 */
export function buildJson(
  data: Record<string, FrontmatterValue>,
  options: FrontmatterOptions = {}
): string {
  const cleaned = stripEmpty(data);
  const ordered = orderKeys(cleaned, options.order ?? []);
  return JSON.stringify(ordered, null, 2) + "\n";
}

// ────────────────────────────────────────────────────────────────────────────

function stripEmpty<T extends Record<string, FrontmatterValue>>(
  obj: T
): Record<string, FrontmatterValue> {
  const out: Record<string, FrontmatterValue> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

function orderKeys(
  obj: Record<string, FrontmatterValue>,
  order: string[]
): Record<string, FrontmatterValue> {
  const out: Record<string, FrontmatterValue> = {};
  for (const k of order) if (k in obj) out[k] = obj[k];
  for (const k of Object.keys(obj)) if (!(k in out)) out[k] = obj[k];
  return out;
}
