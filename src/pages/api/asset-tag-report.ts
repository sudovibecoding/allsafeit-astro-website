import type { APIContext } from 'astro';
import type { FormEnv } from '../../lib/forms/types';
import { verifyCaptcha } from '../../lib/forms/recaptcha';
import { log } from '../../lib/forms/log';
import {
  loadEmailConfig,
  mergeEnvSources,
  sendAssetTagReportEmail,
} from '../../lib/email';

/**
 * Asset tag reporting endpoint.
 *
 * No live Webflow form to mirror — the original page was informational
 * + Basin iframe. AssetTagReportingForm captures everything support
 * needs to register a tagged device.
 *
 * Accepts multipart/form-data because of the optional photo upload.
 * Photo is attached to the notification email so the recipient can
 * verify the tag is in the right place.
 *
 * Flow:
 *   1. Parse multipart form data
 *   2. Validate required fields
 *   3. Captcha (Turnstile)
 *   4. Read photo into memory (capped to MAX_PHOTO_BYTES)
 *   5. Fire email via the shared email service
 *   6. Return JSON; client redirects browser to /thank-you
 */

export const prerender = false;

/**
 * Cloudflare Workers cap form bodies around ~100 MB but Resend caps
 * total email payload near 40 MB. We pick 10 MB as a safe per-photo
 * ceiling — phones routinely shoot 5–8 MB JPEGs.
 */
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export async function POST(context: APIContext): Promise<Response> {
  const cfEnv = (context.locals as { runtime?: { env?: FormEnv } }).runtime?.env;
  const env: FormEnv = {
    ...((import.meta.env as unknown) as FormEnv),
    ...(cfEnv ?? {}),
  };

  const submissionId = crypto.randomUUID();
  log({ level: 'info', event: 'asset_tag_received', submissionId });

  // ── 1. Parse multipart ────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await context.request.formData();
  } catch (err) {
    log({
      level: 'error',
      event: 'asset_tag_parse_failed',
      submissionId,
      message: err instanceof Error ? err.message : String(err),
    });
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // ── 2. Validate required fields ───────────────────────────────────
  const fields = {
    reporterName: String(formData.get('Reporter-Name') ?? '').trim(),
    reporterCompany: String(formData.get('Reporter-Company') ?? '').trim(),
    reporterEmail: String(formData.get('Reporter-Email') ?? '').trim(),
    assetTagNumber: String(formData.get('Asset-Tag-Number') ?? '').trim(),
    deviceType: String(formData.get('Device-Type') ?? '').trim(),
    deviceMake: String(formData.get('Device-Make') ?? '').trim(),
    deviceModel: String(formData.get('Device-Model') ?? '').trim(),
    deviceSerial: String(formData.get('Device-Serial') ?? '').trim(),
    notes: String(formData.get('Notes') ?? '').trim(),
    sourceUrl: String(formData.get('source_url') ?? '').trim(),
  };

  // Required: reporter info + asset tag + device type.
  const missing: string[] = [];
  if (!fields.reporterName) missing.push('Reporter-Name');
  if (!fields.reporterCompany) missing.push('Reporter-Company');
  if (
    !fields.reporterEmail ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.reporterEmail)
  ) {
    missing.push('Reporter-Email');
  }
  if (!fields.assetTagNumber) missing.push('Asset-Tag-Number');
  if (!fields.deviceType) missing.push('Device-Type');

  if (missing.length > 0) {
    log({
      level: 'warn',
      event: 'asset_tag_validation_failed',
      submissionId,
      missing,
    });
    return json({ ok: false, error: 'missing_fields', missing }, 400);
  }

  // ── 3. Captcha ────────────────────────────────────────────────────
  const captchaToken = String(
    formData.get('cf-turnstile-response') ?? '',
  );
  const captcha = await verifyCaptcha({
    token: captchaToken,
    provider: 'turnstile',
    turnstileSecret: env.TURNSTILE_SECRET,
    recaptchaSecret: env.RECAPTCHA_SECRET,
  });
  log({
    level: captcha.ok ? 'info' : 'warn',
    event: 'asset_tag_captcha_verified',
    submissionId,
    ok: captcha.ok,
    durationMs: captcha.durationMs,
    ...(captcha.ok ? {} : { error: captcha.error }),
  });
  if (!captcha.ok) {
    return json({ ok: false, error: 'captcha_failed' }, 400);
  }

  // ── 4. Photo (optional) ───────────────────────────────────────────
  let photo:
    | { filename: string; content: Uint8Array; contentType?: string }
    | undefined;
  let photoSizeBytes: number | undefined;
  const photoEntry = formData.get('Photo');
  if (photoEntry instanceof File && photoEntry.size > 0) {
    if (photoEntry.size > MAX_PHOTO_BYTES) {
      log({
        level: 'warn',
        event: 'asset_tag_photo_too_large',
        submissionId,
        size: photoEntry.size,
      });
      return json(
        { ok: false, error: 'photo_too_large', maxBytes: MAX_PHOTO_BYTES },
        413,
      );
    }
    const bytes = new Uint8Array(await photoEntry.arrayBuffer());
    photo = {
      filename: photoEntry.name || `asset-${fields.assetTagNumber}.jpg`,
      content: bytes,
      contentType: photoEntry.type || undefined,
    };
    photoSizeBytes = photoEntry.size;
  }

  // ── 5. Email ──────────────────────────────────────────────────────
  let emailConfig;
  try {
    emailConfig = loadEmailConfig(
      mergeEnvSources(import.meta.env as Record<string, unknown>, cfEnv),
    );
  } catch (err) {
    log({
      level: 'error',
      event: 'asset_tag_config_invalid',
      submissionId,
      message: err instanceof Error ? err.message : String(err),
    });
    return json({ ok: false, error: 'config_invalid' }, 500);
  }

  const recipients = (env.NOTIFICATION_TO_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const result = await sendAssetTagReportEmail(emailConfig, {
    to: recipients,
    data: {
      ...fields,
      photoFilename: photo?.filename,
      photoSizeBytes,
      submissionId,
    },
    photo,
  });

  log({
    level: result.ok ? 'info' : 'error',
    event: 'asset_tag_email_complete',
    submissionId,
    ok: result.ok,
    durationMs: result.durationMs,
    ...(result.ok
      ? { meta: { ...result.meta, messageId: result.id } }
      : { error: result.code, meta: { ...result.meta, message: result.message } }),
  });

  if (!result.ok) {
    return json({ ok: false, error: 'email_failed' }, 502);
  }

  return json({ ok: true, submissionId }, 200);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
