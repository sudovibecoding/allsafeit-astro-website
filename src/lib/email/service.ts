/**
 * Public email-service surface.
 *
 * The only file in this module that performs side effects (Resend API
 * calls). Everything else is config, validation, or templating.
 *
 * Contracts every helper here follows:
 *   1. Never throws. Always returns `EmailResult` — `{ ok: true, ... }`
 *      or `{ ok: false, code, message, ... }`. Callers decide whether
 *      to surface or swallow.
 *   2. In any non-production env with `stagingOverride` set, every send
 *      reroutes to that address and the subject is prefixed `[STAGING]`.
 *   3. Timing is captured in every result (`durationMs`) so callers can
 *      log it without re-instrumenting.
 */
import type {
  EmailConfig,
  EmailResult,
  SendEmailInput,
  ContactFormEmailInput,
  NotificationEmailInput,
  EbookDownloadEmailInput,
  AssetTagReportEmailInput,
} from './types';
import { getResendClient } from './client';
import {
  contactFormTemplate,
  notificationTemplate,
  ebookDownloadTemplate,
  assetTagReportTemplate,
} from './templates';

// ─────────────────────────────────────────────────────────────────────
// Internal — staging / production routing
// ─────────────────────────────────────────────────────────────────────

const STAGING_SUBJECT_PREFIX = '[STAGING] ';

interface RoutedRecipients {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  mode: 'live' | 'staging_override';
  /** Original recipients, surfaced as a notice in the email body. */
  originals?: { to: string[]; cc?: string[]; bcc?: string[] };
}

/**
 * Apply the staging override + subject prefix policy.
 *
 * Production: passes through unchanged.
 * Non-production with override: ALL recipients become [override],
 *   originals are saved so we can append them into the body so the
 *   developer can verify routing without dispatching to real customers.
 */
function applyEnvPolicy(
  config: EmailConfig,
  input: { to: string | string[]; cc?: string | string[]; bcc?: string | string[]; subject: string },
): RoutedRecipients {
  const toArr = toArray(input.to);
  const ccArr = input.cc ? toArray(input.cc) : undefined;
  const bccArr = input.bcc ? toArray(input.bcc) : undefined;

  if (
    config.appEnv === 'production' ||
    !config.stagingOverride ||
    config.stagingOverride.length === 0
  ) {
    return {
      to: toArr,
      cc: ccArr,
      bcc: bccArr,
      subject: input.subject,
      mode: 'live',
    };
  }

  // Non-production with override active — `stagingOverride` is already
  // a parsed list of valid emails (one or many, comma-separated in env).
  return {
    to: config.stagingOverride,
    cc: undefined,
    bcc: undefined,
    subject: STAGING_SUBJECT_PREFIX + input.subject,
    mode: 'staging_override',
    originals: { to: toArr, cc: ccArr, bcc: bccArr },
  };
}

function toArray(v: string | string[]): string[] {
  return Array.isArray(v) ? v : [v];
}

/**
 * Append a "routed for staging" notice to the email body so the
 * developer can see who the email WOULD have gone to in production.
 */
function annotateForStaging(
  html: string,
  text: string,
  originals: { to: string[]; cc?: string[]; bcc?: string[] },
  appEnv: string,
): { html: string; text: string } {
  const lines = [
    `Original recipients (suppressed in ${appEnv}):`,
    `  to: ${originals.to.join(', ')}`,
  ];
  if (originals.cc?.length) lines.push(`  cc: ${originals.cc.join(', ')}`);
  if (originals.bcc?.length) lines.push(`  bcc: ${originals.bcc.join(', ')}`);

  const annotatedText = `${lines.join('\n')}\n\n----\n\n${text}`;

  const annotatedHtml = `
    <div style="margin:0 0 24px;padding:12px 16px;background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;font-size:13px;color:#78350f;">
      <strong style="display:block;margin:0 0 4px;">${escHtml(appEnv.toUpperCase())} environment — recipients overridden</strong>
      <div>Would have sent to: <code>${escHtml(originals.to.join(', '))}</code></div>
      ${originals.cc?.length ? `<div>cc: <code>${escHtml(originals.cc.join(', '))}</code></div>` : ''}
      ${originals.bcc?.length ? `<div>bcc: <code>${escHtml(originals.bcc.join(', '))}</code></div>` : ''}
    </div>
    ${html}
  `;

  return { html: annotatedHtml, text: annotatedText };
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─────────────────────────────────────────────────────────────────────
// Public — generic sendEmail
// ─────────────────────────────────────────────────────────────────────

/**
 * Low-level send. Domain helpers below wrap this with rendered content.
 *
 * Call this when:
 *   - You already have rendered HTML + text
 *   - You're adding a one-off email type that isn't worth a template yet
 *
 * Returns:
 *   - `{ ok: true, id, durationMs, meta }` on success (Resend's message ID
 *     is in `id`; `meta.mode` tells you whether staging override ran).
 *   - `{ ok: false, code, message, durationMs, meta }` on any failure.
 *     Never throws.
 */
export async function sendEmail(
  config: EmailConfig,
  input: SendEmailInput,
): Promise<EmailResult> {
  const start = Date.now();
  const resend = getResendClient(config.apiKey);

  // ── Apply staging policy first (so the subject and recipient list
  //    that ends up in the Resend dashboard already reflects routing). ──
  const routed = applyEnvPolicy(config, {
    to: input.to,
    cc: input.cc,
    bcc: input.bcc,
    subject: input.subject,
  });

  let { html, text } = input;
  if (routed.mode === 'staging_override' && routed.originals) {
    const annotated = annotateForStaging(
      html,
      text,
      routed.originals,
      config.appEnv,
    );
    html = annotated.html;
    text = annotated.text;
  }

  try {
    const result = await resend.emails.send({
      from: input.from ?? config.from,
      to: routed.to,
      cc: routed.cc,
      bcc: routed.bcc,
      replyTo: input.replyTo,
      subject: routed.subject,
      html,
      text,
      tags: input.tags,
      attachments: input.attachments,
      headers: input.idempotencyKey
        ? { 'X-Idempotency-Key': input.idempotencyKey }
        : undefined,
    });

    // Resend returns { data, error } — error is set on API errors;
    // a thrown exception is a network/transport problem.
    if (result.error) {
      return {
        ok: false,
        code: 'resend_api_error',
        message: result.error.message ?? 'Unknown Resend API error',
        durationMs: Date.now() - start,
        meta: {
          name: result.error.name,
          mode: routed.mode,
          to: routed.to,
          subject: routed.subject,
        },
      };
    }

    if (!result.data?.id) {
      return {
        ok: false,
        code: 'unknown',
        message: 'Resend returned no message ID and no error.',
        durationMs: Date.now() - start,
        meta: { mode: routed.mode, to: routed.to, subject: routed.subject },
      };
    }

    return {
      ok: true,
      id: result.data.id,
      durationMs: Date.now() - start,
      meta: {
        to: routed.to,
        subject: routed.subject,
        mode: routed.mode,
      },
    };
  } catch (err) {
    return {
      ok: false,
      code: 'resend_network_error',
      message: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
      meta: { mode: routed.mode, to: routed.to, subject: routed.subject },
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// Public — domain-specific helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Contact-form notification email.
 *
 * Uses the contactFormTemplate renderer. Sets reply-to to the form
 * submitter so hitting "Reply" in Outlook contacts the lead, not the
 * notifications mailbox.
 */
export async function sendContactFormEmail(
  config: EmailConfig,
  input: ContactFormEmailInput,
): Promise<EmailResult> {
  const rendered = contactFormTemplate(input.data);
  return sendEmail(config, {
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    replyTo: input.data.email,
    tags: [
      { name: 'category', value: 'contact_form' },
      { name: 'env', value: config.appEnv },
    ],
    idempotencyKey: input.data.submissionId,
  });
}

/**
 * Generic transactional notification.
 *
 * Use for ad-hoc system alerts where a dedicated template isn't worth
 * setting up (build failures, deploy notifications, manual support
 * emails). For volume mailings, add a new dedicated helper.
 */
export async function sendNotificationEmail(
  config: EmailConfig,
  input: NotificationEmailInput,
): Promise<EmailResult> {
  const rendered = notificationTemplate({
    subject: input.subject,
    body: input.body,
    html: input.html,
  });
  return sendEmail(config, {
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    replyTo: input.replyTo,
    tags: [
      { name: 'category', value: 'notification' },
      { name: 'env', value: config.appEnv },
    ],
  });
}

/**
 * Ebook download lead-capture email.
 *
 * Fires when someone enters their email on an ebook landing page.
 * Mirrors Webflow's `email-book-download-form` payload shape (Email +
 * source_url). Reply-To set to the submitter.
 */
export async function sendEbookDownloadEmail(
  config: EmailConfig,
  input: EbookDownloadEmailInput,
): Promise<EmailResult> {
  const rendered = ebookDownloadTemplate(input.data);
  return sendEmail(config, {
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    replyTo: input.data.email,
    tags: [
      { name: 'category', value: 'ebook_download' },
      { name: 'env', value: config.appEnv },
    ],
    idempotencyKey: input.data.submissionId,
  });
}

/**
 * Asset tag report email.
 *
 * Sends the report to support with the device + reporter info. When a
 * photo was uploaded, it's attached as base64 so the recipient can see
 * the tagged device. Reply-To set to the reporter.
 */
export async function sendAssetTagReportEmail(
  config: EmailConfig,
  input: AssetTagReportEmailInput,
): Promise<EmailResult> {
  const rendered = assetTagReportTemplate(input.data);
  return sendEmail(config, {
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    replyTo: input.data.reporterEmail,
    tags: [
      { name: 'category', value: 'asset_tag_report' },
      { name: 'env', value: config.appEnv },
    ],
    idempotencyKey: input.data.submissionId,
    attachments: input.photo
      ? [
          {
            filename: input.photo.filename,
            content: input.photo.content,
            contentType: input.photo.contentType,
          },
        ]
      : undefined,
  });
}
