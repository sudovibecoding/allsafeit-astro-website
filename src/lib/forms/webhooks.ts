import type {
  ContactFormData,
  WebflowPayload,
  WebhookResult,
} from './types';

/**
 * Build the Webflow webhook payload.
 *
 * All 3 webhooks receive identical payloads. Field names match the
 * form's `name=` attributes verbatim (Firstname, Phone-no, etc.) —
 * that's what Webflow's native form_submission webhook posts, so
 * downstream services that were built against Webflow keep working.
 *
 * Only CHECKED checkboxes appear in `data` — mirrors Webflow exactly.
 * Empty fields (no phone, no company) are omitted.
 */
export function buildWebflowPayload(
  data: ContactFormData,
  siteId: string,
  submissionId: string,
): WebflowPayload {
  const fields: Record<string, string> = {
    Firstname: data.firstName,
    Lastname: data.lastName,
    Email: data.email,
  };
  if (data.phone) fields['Phone-no'] = data.phone;
  if (data.company) fields['Company-Name'] = data.company;

  // Each checked service appears as `"<slug>": "on"` (Webflow convention).
  for (const slug of data.services) {
    fields[slug] = 'on';
  }

  if (data.sourceUrl) fields.source_url = data.sourceUrl;

  return {
    name: 'Contact Form',
    site: siteId,
    data: fields,
    d: new Date().toISOString(),
    _id: submissionId,
  };
}

/**
 * POST the payload to one webhook URL. One retry after 500ms backoff
 * on failure — catches transient 502/504 without burning the request
 * budget if the receiver is genuinely down.
 *
 * NEVER throws. Always returns a structured WebhookResult so the
 * orchestrator can log + decide.
 */
export async function fireWebhook(
  label: string,
  url: string,
  payload: WebflowPayload,
): Promise<WebhookResult> {
  const start = Date.now();
  let lastError = 'unknown';
  let attempts = 0;

  for (let attempt = 1; attempt <= 2; attempt++) {
    attempts = attempt;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return {
          label,
          ok: true,
          durationMs: Date.now() - start,
          meta: { attempt, status: res.status },
        };
      }
      lastError = `http_${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'fetch_threw';
    }

    // Brief backoff before the retry — only on the first failure.
    if (attempt === 1) await sleep(500);
  }

  return {
    label,
    ok: false,
    durationMs: Date.now() - start,
    error: lastError,
    meta: { attempts },
  };
}

const sleep = (ms: number) =>
  new Promise<void>((res) => setTimeout(res, ms));
