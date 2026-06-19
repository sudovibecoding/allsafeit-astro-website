/**
 * Minimal Webflow Data API v2 client.
 *
 * Wraps fetch with auth + pagination + retry. Read-only — we never
 * POST/PUT/DELETE during migration.
 */

const API_BASE = "https://api.webflow.com/v2";

export interface WebflowItem {
  id: string;
  cmsLocaleId?: string;
  lastPublished?: string | null;
  lastUpdated?: string;
  createdOn?: string;
  isArchived?: boolean;
  isDraft?: boolean;
  fieldData: Record<string, unknown>;
}

export interface WebflowImage {
  fileId?: string;
  url: string;
  alt?: string | null;
}

export interface WebflowCollection {
  id: string;
  displayName: string;
  singularName: string;
  slug: string;
  fields: WebflowField[];
}

export interface WebflowField {
  id: string;
  isEditable: boolean;
  isRequired: boolean;
  type: string;
  slug: string;
  displayName: string;
  validations?: Record<string, unknown>;
  helpText?: string;
}

function getToken(): string {
  const t = process.env.WEBFLOW_TOKEN;
  if (!t) {
    throw new Error(
      "WEBFLOW_TOKEN env var is required. Add it to .env or export it before running."
    );
  }
  return t;
}

async function request<T>(path: string, retries = 3): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = {
    Authorization: `Bearer ${getToken()}`,
    "accept-version": "2.0.0",
    Accept: "application/json",
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return (await res.json()) as T;

    if (res.status === 429) {
      const wait = 1000 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, wait));
      lastError = new Error(`429 rate-limited (attempt ${attempt + 1})`);
      continue;
    }
    const body = await res.text();
    throw new Error(`Webflow API ${res.status} ${path}: ${body.slice(0, 500)}`);
  }
  throw lastError;
}

/** Returns the collection schema (fields, slug, etc.). */
export async function getCollection(
  collectionId: string
): Promise<WebflowCollection> {
  return request<WebflowCollection>(`/collections/${collectionId}`);
}

/**
 * Iterate every item in a collection across all pages. Handles pagination
 * automatically. Webflow caps `limit` at 100.
 */
export async function* iterateItems(
  collectionId: string,
  opts: { pageSize?: number } = {}
): AsyncGenerator<WebflowItem, void, void> {
  const pageSize = opts.pageSize ?? 100;
  let offset = 0;
  while (true) {
    const res = await request<{
      items: WebflowItem[];
      pagination: { total: number; limit: number; offset: number };
    }>(`/collections/${collectionId}/items?limit=${pageSize}&offset=${offset}`);

    for (const item of res.items) yield item;
    offset += res.items.length;
    if (offset >= res.pagination.total || res.items.length === 0) return;
  }
}

/**
 * Detect whether a field-data value is a Webflow image object.
 * Some images come as `{ url, fileId, alt }`, some as bare URL strings.
 */
export function isWebflowImage(v: unknown): v is WebflowImage {
  return (
    typeof v === "object" &&
    v !== null &&
    "url" in v &&
    typeof (v as { url: unknown }).url === "string"
  );
}

/** Normalize an image field to a `{ url, alt }` shape (or null if absent). */
export function normalizeImage(v: unknown): WebflowImage | null {
  if (!v) return null;
  if (typeof v === "string") return { url: v };
  if (isWebflowImage(v)) return v;
  return null;
}

/**
 * Compute lifecycle status from Webflow's system flags.
 *
 * Webflow's `isDraft` does NOT mean "unpublished" — it means "has staged
 * edits since last publish". An item with `isDraft: true` AND a
 * `lastPublished` timestamp is live on the Webflow site, just with
 * pending CMS edits sitting in staging. The correct interpretation:
 *
 *   isArchived            → "archived"
 *   lastPublished is set  → "published"  (item IS live, regardless of isDraft)
 *   isDraft, no lastPub   → "draft"      (never published — true draft)
 *   else                  → "published"  (fallback for items the API
 *                                         returns without explicit flags)
 *
 * Without this, every item the editor recently touched in Webflow shows
 * up as `status: draft` in our MDX — and the page templates / Navbar
 * filter them out, even though they're live on the public site.
 */
export function computeStatus(
  item: WebflowItem,
): "published" | "draft" | "archived" {
  if (item.isArchived) return "archived";
  if (item.lastPublished) return "published";
  if (item.isDraft) return "draft";
  return "published";
}
