import type { APIContext } from 'astro';
import type { FormEnv } from '../../lib/forms/types';
import { verifyCaptcha } from '../../lib/forms/recaptcha';
import { log } from '../../lib/forms/log';
import {
  loadEmailConfig,
  mergeEnvSources,
  sendEbookDownloadEmail,
} from '../../lib/email';

/**
 * Ebook download lead-capture endpoint.
 *
 * Mirrors Webflow's `email-book-download-form` (data-name="Email Form")
 * submission shape — accepts `Email` and `source_url` only.
 *
 * Flow:
 *   1. Parse form data
 *   2. Validate email format (single required field)
 *   3. Captcha (Turnstile)
 *   4. Fire notification email via the shared email service
 *   5. Return JSON; client redirects browser to the download page
 */

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  // Read env from BOTH Cloudflare runtime AND import.meta.env so the
  // same handler works under `astro dev` and on the deployed Worker.
  const cfEnv = (context.locals as { runtime?: { env?: FormEnv } }).runtime?.env;
  const env: FormEnv = {
    ...((import.meta.env as unknown) as FormEnv),
    ...(cfEnv ?? {}),
  };

  const submissionId = crypto.randomUUID();
  log({ level: 'info', event: 'ebook_received', submissionId });

  // ── 1. Parse body ────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await context.request.formData();
  } catch (err) {
    log({
      level: 'error',
      event: 'ebook_parse_failed',
      submissionId,
      message: err instanceof Error ? err.message : String(err),
    });
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // ── 2. Validate ──────────────────────────────────────────────────
  const email = String(formData.get('Email') ?? '').trim();
  const sourceUrl = String(formData.get('source_url') ?? '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    log({ level: 'warn', event: 'ebook_invalid_email', submissionId });
    return json({ ok: false, error: 'invalid_email' }, 400);
  }

  // ── 3. Captcha ───────────────────────────────────────────────────
  // Turnstile only — these forms never had reCAPTCHA.
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
    event: 'ebook_captcha_verified',
    submissionId,
    ok: captcha.ok,
    durationMs: captcha.durationMs,
    ...(captcha.ok ? {} : { error: captcha.error }),
  });
  if (!captcha.ok) {
    return json({ ok: false, error: 'captcha_failed' }, 400);
  }

  // ── 4. Email ─────────────────────────────────────────────────────
  let emailConfig;
  try {
    emailConfig = loadEmailConfig(
      mergeEnvSources(import.meta.env as Record<string, unknown>, cfEnv),
    );
  } catch (err) {
    log({
      level: 'error',
      event: 'ebook_config_invalid',
      submissionId,
      message: err instanceof Error ? err.message : String(err),
    });
    return json({ ok: false, error: 'config_invalid' }, 500);
  }

  const recipients = (env.NOTIFICATION_TO_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const result = await sendEbookDownloadEmail(emailConfig, {
    to: recipients,
    data: { email, sourceUrl, submissionId },
  });

  log({
    level: result.ok ? 'info' : 'error',
    event: 'ebook_email_complete',
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
