/**
 * Shared types for the contact-form submission pipeline.
 *
 * No runtime code lives here — types only. Every other file under
 * `src/lib/forms/` imports from this module so the canonical shapes
 * stay in one place.
 */

/** Parsed + validated form input — the internal canonical shape. */
export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  /** Slug-cased service names that were checked (e.g. ["Managed-IT"]). */
  services: string[];
  /** The page the form was submitted from (hidden input). */
  sourceUrl: string;
  /** Captcha token — server picks the right verifier based on `captchaProvider`. */
  captchaToken: string;
  /** Which captcha widget posted the token. */
  captchaProvider: 'recaptcha' | 'turnstile' | 'none';
  /** Honeypot field value — must be empty for a real submission. */
  honeypot: string;
}

/**
 * Mirrors the Webflow webhook payload shape (form_submission event).
 *   - `data` keys use Webflow's exact `name=` attributes verbatim
 *     (dash-case, casing preserved) so downstream Webflow-compatible
 *     services map cleanly.
 *   - Only CHECKED checkboxes appear in `data` — same as Webflow.
 *   - `_id` doubles as our internal submissionId.
 */
export interface WebflowPayload {
  name: 'Contact Form';
  site: string;
  data: Record<string, string>;
  d: string;          // ISO 8601 timestamp
  _id: string;        // submission UUID
}

/** Per-step outcome — uniform shape so log.ts can stringify any result. */
export type StepResult =
  | { ok: true; durationMs: number; meta?: Record<string, unknown> }
  | { ok: false; durationMs: number; error: string; meta?: Record<string, unknown> };

/** Webhook fanout result — adds a label so logs identify which webhook. */
export type WebhookResult = StepResult & { label: string };

/**
 * Runtime environment — what the Worker reads from
 * `context.locals.runtime.env`. Mirrors `wrangler.jsonc` + secrets.
 *
 * Captcha: only one secret is needed (whichever widget the form
 * renders). Server auto-detects from the posted token.
 *
 * Email: sent via Resend (https://resend.com). Cloudflare's native
 * send_email binding can't be used here because it would require
 * Email Routing to take over MX on `allsafeit.com`, which would break
 * the existing Office 365 mail. Resend lets us send FROM `@allsafeit.com`
 * by adding TXT records only (no MX changes).
 */
export interface FormEnv {
  // Captcha secrets — only the one matching the deployed widget is used.
  TURNSTILE_SECRET: string;
  RECAPTCHA_SECRET?: string;

  // Email — Resend API + headers
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  FROM_NAME: string;
  /** Comma-separated list of inboxes that receive form notifications.
   *  Update in wrangler.jsonc vars / dashboard to change recipients —
   *  no code change required. */
  NOTIFICATION_TO_EMAILS: string;

  // Webhook payload
  SITE_ID: string;

  // Webhook destinations
  WEBHOOK_CRM_URL: string;
  WEBHOOK_LEAD_URL_1: string;
  WEBHOOK_LEAD_URL_2: string;
}
