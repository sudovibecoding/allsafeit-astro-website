/**
 * Reference resolver.
 *
 * Webflow Reference fields hold a string `itemId`. To rewrite those into
 * slug references that Tina/Astro can use, we maintain a lookup populated
 * during collection migration.
 *
 * Migration order is structured so referenced collections (Blog Categories,
 * Authors) are processed *before* their consumers (Blog Posts). When a
 * Blog Post item is converted, every reference can be resolved here.
 */

export interface LookupEntry {
  /** Tina/Astro collection name (e.g. "blogCategory", "author"). */
  collection: string;
  /** Filename slug used by Astro (e.g. "security", "kevin-hughes"). */
  slug: string;
}

const map = new Map<string, LookupEntry>();
const unresolved: string[] = [];

/** Register a successfully migrated item. */
export function registerItem(
  webflowItemId: string,
  collection: string,
  slug: string
): void {
  map.set(webflowItemId, { collection, slug });
}

/**
 * Resolve a Webflow item ID to its local slug. Returns `null` and records
 * a warning if the reference can't be resolved (referenced item missing,
 * archived without migration, etc.).
 */
export function resolve(webflowItemId: string | null | undefined): string | null {
  if (!webflowItemId) return null;
  const e = map.get(webflowItemId);
  if (!e) {
    if (!unresolved.includes(webflowItemId)) unresolved.push(webflowItemId);
    return null;
  }
  return e.slug;
}

/** Resolved-with-collection variant — used when the consumer needs both. */
export function resolveFull(
  webflowItemId: string | null | undefined
): LookupEntry | null {
  if (!webflowItemId) return null;
  return map.get(webflowItemId) ?? null;
}

export function getUnresolved(): string[] {
  return [...unresolved];
}

export function reset(): void {
  map.clear();
  unresolved.length = 0;
}
