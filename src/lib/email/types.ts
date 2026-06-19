/**
 * All email-service types.
 *
 * No runtime code — keeping the type surface in one file means callers
 * can import `EmailResult` etc. without pulling in zod/Resend/etc.
 */

// ─────────────────────────────────────────────────────────────────────
// Config — output of src/lib/email/config.ts
// ─────────────────────────────────────────────────────────────────────

export type AppEnv = 'development' | 'staging' | 'production';

export interface EmailConfig {
  /** Resend API key. Secret; never logged. */
  apiKey: string;
  /** Default sender. Either `"Name <addr@domain>"` or `"addr@domain"`. */
  from: string;
  /** Which environment this Worker is running as. */
  appEnv: AppEnv;
  /**
   * If set AND `appEnv !== 'production'`, every send is rerouted to
   * these addresses. Real `to`/`cc`/`bcc` recipients are dropped — the
   * originals are surfaced in the email body so you can verify routing
   * without spamming customers.
   *
   * Stored as a list so multiple developers can receive staging emails
   * (set `STAGING_EMAIL_OVERRIDE=a@x.com,b@y.com` in the env). Empty/
   * unset → undefined.
   */
  stagingOverride?: string[];
}

// ─────────────────────────────────────────────────────────────────────
// Generic send — building block under every domain-specific helper
// ─────────────────────────────────────────────────────────────────────

export interface SendEmailInput {
  /** RFC 5322 address(es). Single string OR array. */
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  /** Override the configured default sender for this one send. */
  from?: string;
  /** Where "Reply" in the recipient's mail client should go. */
  replyTo?: string;
  subject: string;
  html: string;
  /** Plain-text fallback. Always include — many enterprise inboxes only render this. */
  text: string;
  /** Optional Resend tags for dashboard filtering. */
  tags?: Array<{ name: string; value: string }>;
  /**
   * Arbitrary correlation ID (we pass our submissionId here).
   * Surfaces in logs + lets you tie a Resend message back to a form submit.
   */
  idempotencyKey?: string;
  /**
   * Optional file attachments. Resend caps total payload at ~40MB.
   *
   *   content: base64-encoded file bytes (string), OR raw Uint8Array.
   *            We pass through whatever Resend's SDK accepts.
   *   filename: shown in the recipient's mail client.
   *   contentType: MIME type. Optional; Resend infers from filename if absent.
   */
  attachments?: Array<{
    filename: string;
    content: string | Uint8Array;
    contentType?: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────
// Result — no exceptions cross the service boundary
// ─────────────────────────────────────────────────────────────────────

export type EmailResult =
  | EmailSuccess
  | EmailFailure;

export interface EmailSuccess {
  ok: true;
  /** Resend message ID — useful for support tickets / dashboards. */
  id: string;
  durationMs: number;
  /** Mirrors what we actually sent — after staging override etc. */
  meta: { to: string[]; subject: string; mode: 'live' | 'staging_override' };
}

export interface EmailFailure {
  ok: false;
  /** Stable error code for log filtering — not user-facing. */
  code:
    | 'config_missing'
    | 'config_invalid'
    | 'resend_api_error'
    | 'resend_network_error'
    | 'unknown';
  /** Human-readable message — safe to log; do NOT show end users. */
  message: string;
  durationMs: number;
  meta?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────
// Domain-specific payloads
// ─────────────────────────────────────────────────────────────────────

/**
 * The exact shape a contact form posts to our /api/contact endpoint
 * AFTER validation + parsing. Matches Webflow's name= attribute style
 * (so existing Webflow-shaped webhooks downstream can consume the same
 * structure with no remapping).
 */
export interface ContactFormPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  /** Multi-select services — dashed names as Webflow exports them. */
  services: string[];
  /** Page URL the form was submitted from. */
  sourceUrl: string;
  /** Submission UUID — also surfaced as the email Idempotency key. */
  submissionId: string;
}

export interface ContactFormEmailInput {
  /** Final recipient(s) when in production. In staging, replaced by override. */
  to: string | string[];
  /** Form data to render into the email body. */
  data: ContactFormPayload;
}

/**
 * Generic notification — for arbitrary transactional alerts.
 * Extensible: just pass any string body. Use this for ad-hoc system
 * alerts (e.g. "build failed", "deploy succeeded") without needing
 * a dedicated template.
 */
export interface NotificationEmailInput {
  to: string | string[];
  subject: string;
  body: string;
  /** When set, used as the email's HTML alongside `body` for plain text. */
  html?: string;
  replyTo?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Ebook download lead-capture (Webflow `email-form` / "Email Form")
// ─────────────────────────────────────────────────────────────────────

/**
 * Mirrors Webflow's `email-book-download-form` payload — just an email
 * + the source URL. Used by EbookEmailForm across the homepage and
 * the ebook landing pages.
 */
export interface EbookDownloadPayload {
  email: string;
  sourceUrl: string;
  submissionId: string;
}

export interface EbookDownloadEmailInput {
  to: string | string[];
  data: EbookDownloadPayload;
}

// ─────────────────────────────────────────────────────────────────────
// Asset tag reporting (no Webflow live form — see AssetTagReportingForm)
// ─────────────────────────────────────────────────────────────────────

export interface AssetTagReportPayload {
  reporterName: string;
  reporterCompany: string;
  reporterEmail: string;
  assetTagNumber: string;
  deviceType: string;
  deviceMake: string;
  deviceModel: string;
  deviceSerial: string;
  /** Original photo filename if a file was uploaded, else undefined. */
  photoFilename?: string;
  /** Photo size in bytes, surfaced in the email body for context. */
  photoSizeBytes?: number;
  notes: string;
  sourceUrl: string;
  submissionId: string;
}

export interface AssetTagReportEmailInput {
  to: string | string[];
  data: AssetTagReportPayload;
  /** When provided, attached to the email so support can see the device. */
  photo?: {
    filename: string;
    content: Uint8Array;
    contentType?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────
// Templates — output shape of every renderer
// ─────────────────────────────────────────────────────────────────────

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Template signature. Adding a new email type = add a new renderer
 * with this shape under templates.ts. Service-layer code doesn't
 * need to change.
 */
export type EmailTemplate<TData> = (data: TData) => RenderedEmail;
