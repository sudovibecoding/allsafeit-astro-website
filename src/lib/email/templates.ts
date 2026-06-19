/**
 * Email body renderers.
 *
 * Each template is a pure function: `(data) => { subject, html, text }`.
 * No side effects, no I/O. Easy to unit test; trivial to swap.
 *
 * Migrating to React Email later:
 *   1. Build the React component in src/lib/email/templates/<name>.tsx
 *   2. Use `@react-email/render` inside the renderer below to convert
 *      JSX → string. Service layer doesn't change.
 */
import type {
  ContactFormPayload,
  EmailTemplate,
  RenderedEmail,
} from './types';

// ─────────────────────────────────────────────────────────────────────
// Tiny HTML helpers — keep dependencies near zero.
// ─────────────────────────────────────────────────────────────────────

/** Escape HTML special chars so user-supplied data can't break the template. */
function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Wrap a child in our minimal email shell. Inline styles only — most
 *  enterprise inboxes strip <style> blocks and external CSS. */
function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>${esc(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
            <tr>
              <td style="padding:24px 32px;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────
// Contact form notification template
// ─────────────────────────────────────────────────────────────────────

/**
 * Renders a contact-form submission as an HTML email + plain-text
 * fallback.
 *
 * Field rows mirror the Webflow webhook payload shape exactly — each
 * field appears as its own key:value pair, labelled with the literal
 * `name=` attribute from the HTML form (Firstname, Lastname, Email,
 * Phone-no, Company-Name, source_url) plus one row per CHECKED
 * service checkbox (Managed-IT, Cybersecurity-Compliance, etc.).
 * This matches what Webflow's native form-submission email shows and
 * keeps the email body 1:1 with the webhook payload sent to
 * downstream services.
 *
 * Plain-text body is REAL plain text (not HTML stripped); always
 * include it so corporate spam filters and accessibility readers get
 * a clean version.
 */
export const contactFormTemplate: EmailTemplate<ContactFormPayload> = (
  data,
): RenderedEmail => {
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
  const subject = `New contact form: ${fullName || data.email}${
    data.company ? ` (${data.company})` : ''
  }`;

  // Mirror Webflow's webhook payload structure: each field (text input
  // OR each checked checkbox) is its own row. Empty optional fields are
  // OMITTED — same as Webflow.
  const rows: Array<[string, string]> = [];
  rows.push(['Firstname', data.firstName]);
  rows.push(['Lastname', data.lastName]);
  if (data.company) rows.push(['Company-Name', data.company]);
  rows.push(['Email', data.email]);
  if (data.phone) rows.push(['Phone-no', data.phone]);
  // One row per checked service — value is "on", matching Webflow's
  // checkbox encoding in form_submission webhook payloads.
  for (const slug of data.services) {
    rows.push([slug, 'on']);
  }
  if (data.sourceUrl) rows.push(['source_url', data.sourceUrl]);
  rows.push(['Submission ID', data.submissionId]);

  // ── HTML ────────────────────────────────────────────────────────
  const tableHtml = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 0;width:180px;color:#71717a;font-size:14px;vertical-align:top;font-family:-apple-system,Menlo,monospace;">${esc(label)}</td>
        <td style="padding:8px 0;color:#18181b;font-size:14px;word-break:break-word;">${esc(value)}</td>
      </tr>`,
    )
    .join('');

  const html = shell(
    subject,
    `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;">New contact form submission</h1>
    <p style="margin:0 0 24px;color:#52525b;font-size:14px;">
      Replying to this email will reply to <strong>${esc(data.email)}</strong>.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${tableHtml}
    </table>
    `,
  );

  // ── Plain text ──────────────────────────────────────────────────
  // Widest key padded for column alignment; mirrors Webflow's plaintext
  // notification style.
  const widest = Math.max(...rows.map(([k]) => k.length));
  const text = [
    'New contact form submission',
    '',
    ...rows.map(
      ([k, v]) => `${k.padEnd(widest + 2)} ${v}`,
    ),
    '',
    `Reply to this email to reach ${data.email} directly.`,
  ].join('\n');

  return { subject, html, text };
};

// ─────────────────────────────────────────────────────────────────────
// Ebook download lead-capture template
// ─────────────────────────────────────────────────────────────────────

/**
 * Webflow form: `email-book-download-form` / data-name "Email Form".
 * Fires when someone enters their email on an ebook landing page; the
 * page then redirects them to the actual download.
 *
 * Webflow's webhook posts:
 *   { Email: "...", source_url: "..." }
 *
 * We mirror that shape in the email body — each field as its own row.
 */

export interface EbookDownloadPayload {
  /** Webflow field: Email */
  email: string;
  /** Webflow field: source_url — the page the form was submitted from. */
  sourceUrl: string;
  submissionId: string;
}

export const ebookDownloadTemplate: EmailTemplate<EbookDownloadPayload> = (
  data,
): RenderedEmail => {
  const subject = `Ebook lead: ${data.email}`;

  const rows: Array<[string, string]> = [];
  rows.push(['Email', data.email]);
  if (data.sourceUrl) rows.push(['source_url', data.sourceUrl]);
  rows.push(['Submission ID', data.submissionId]);

  const tableHtml = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 0;width:160px;color:#71717a;font-size:14px;vertical-align:top;font-family:-apple-system,Menlo,monospace;">${esc(label)}</td>
        <td style="padding:8px 0;color:#18181b;font-size:14px;word-break:break-word;">${esc(value)}</td>
      </tr>`,
    )
    .join('');

  const html = shell(
    subject,
    `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;">New ebook download lead</h1>
    <p style="margin:0 0 24px;color:#52525b;font-size:14px;">
      Replying to this email will reply to <strong>${esc(data.email)}</strong>.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${tableHtml}
    </table>
    `,
  );

  const widest = Math.max(...rows.map(([k]) => k.length));
  const text = [
    'New ebook download lead',
    '',
    ...rows.map(([k, v]) => `${k.padEnd(widest + 2)} ${v}`),
    '',
    `Reply to this email to reach ${data.email} directly.`,
  ].join('\n');

  return { subject, html, text };
};

// ─────────────────────────────────────────────────────────────────────
// Asset tag reporting template
// ─────────────────────────────────────────────────────────────────────

/**
 * No live Webflow form to mirror — the live page is informational only.
 * Fields below come from the existing AssetTagReportingForm component,
 * which captures everything support needs to register a tagged device.
 *
 * Photo handling: when a photo file is uploaded, the email service
 * attaches it; this renderer doesn't render the file bytes — only its
 * name + size as a confirmation row.
 */

export interface AssetTagReportPayload {
  reporterName: string;
  reporterCompany: string;
  reporterEmail: string;
  assetTagNumber: string;
  deviceType: string;
  deviceMake: string;
  deviceModel: string;
  deviceSerial: string;
  /** When set, a photo file was uploaded — surfaced as a row noting its name+size. */
  photoFilename?: string;
  photoSizeBytes?: number;
  notes: string;
  sourceUrl: string;
  submissionId: string;
}

function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export const assetTagReportTemplate: EmailTemplate<AssetTagReportPayload> = (
  data,
): RenderedEmail => {
  const subject = `Asset tag report: ${data.assetTagNumber} (${data.reporterName}, ${data.reporterCompany})`;

  // One row per form field — mirrors the form layout.
  const rows: Array<[string, string]> = [];
  rows.push(['Reporter-Name', data.reporterName]);
  rows.push(['Reporter-Company', data.reporterCompany]);
  rows.push(['Reporter-Email', data.reporterEmail]);
  rows.push(['Asset-Tag-Number', data.assetTagNumber]);
  rows.push(['Device-Type', data.deviceType]);
  if (data.deviceMake) rows.push(['Device-Make', data.deviceMake]);
  if (data.deviceModel) rows.push(['Device-Model', data.deviceModel]);
  if (data.deviceSerial) rows.push(['Device-Serial', data.deviceSerial]);
  if (data.photoFilename) {
    const size = data.photoSizeBytes ? ` (${humanBytes(data.photoSizeBytes)})` : '';
    rows.push(['Photo', `${data.photoFilename}${size} — see attachment`]);
  }
  if (data.notes) rows.push(['Notes', data.notes]);
  if (data.sourceUrl) rows.push(['source_url', data.sourceUrl]);
  rows.push(['Submission ID', data.submissionId]);

  const tableHtml = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 0;width:180px;color:#71717a;font-size:14px;vertical-align:top;font-family:-apple-system,Menlo,monospace;">${esc(label)}</td>
        <td style="padding:8px 0;color:#18181b;font-size:14px;word-break:break-word;white-space:pre-wrap;">${esc(value)}</td>
      </tr>`,
    )
    .join('');

  const html = shell(
    subject,
    `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;">New asset tag report</h1>
    <p style="margin:0 0 24px;color:#52525b;font-size:14px;">
      Reply to this email to reach <strong>${esc(data.reporterEmail)}</strong> directly.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${tableHtml}
    </table>
    `,
  );

  const widest = Math.max(...rows.map(([k]) => k.length));
  const text = [
    'New asset tag report',
    '',
    ...rows.map(([k, v]) => `${k.padEnd(widest + 2)} ${v}`),
    '',
    `Reply to this email to reach ${data.reporterEmail} directly.`,
  ].join('\n');

  return { subject, html, text };
};

// ─────────────────────────────────────────────────────────────────────
// Generic notification template — for ad-hoc system alerts
// ─────────────────────────────────────────────────────────────────────

export interface NotificationTemplateInput {
  subject: string;
  body: string;
  /** Optional pre-rendered HTML; falls back to wrapped <pre> of `body`. */
  html?: string;
}

export const notificationTemplate: EmailTemplate<NotificationTemplateInput> = (
  data,
): RenderedEmail => {
  const html =
    data.html ??
    shell(
      data.subject,
      `<h1 style="margin:0 0 16px;font-size:20px;font-weight:600;">${esc(data.subject)}</h1>
       <pre style="margin:0;font-family:-apple-system,Menlo,monospace;white-space:pre-wrap;color:#18181b;font-size:14px;line-height:1.5;">${esc(data.body)}</pre>`,
    );

  return {
    subject: data.subject,
    html,
    text: data.body,
  };
};
