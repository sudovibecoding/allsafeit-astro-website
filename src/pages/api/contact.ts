import type { APIContext } from 'astro';
import type { FormEnv } from '../../lib/forms/types';
import {
  isHoneypotFilled,
  parseFormData,
  validateRequired,
} from '../../lib/forms/validate';
import { verifyCaptcha } from '../../lib/forms/recaptcha';
import { buildWebflowPayload, fireWebhook } from '../../lib/forms/webhooks';
import { log } from '../../lib/forms/log';

// New email service (replaces src/lib/forms/email.ts).
import {
  loadEmailConfig,
  mergeEnvSources,
  sendContactFormEmail,
} from '../../lib/email';

/**
 * Contact form submission endpoint.
 *
 * - JSON only. Always responds with `{ ok: boolean, ... }`.
 *   The client-side script (src/scripts/contactForm.ts) intercepts
 *   form submit, posts here, reads JSON, toggles success/error UI
 *   without any page reload.
 * - No `redirect()` paths anywhere — even on error. Per design, the
 *   user stays on the same page. The /thank-you and /form-not-received
 *   routes are reserved for future external integrations.
 *
 * Flow:
 *   1. Honeypot — silent 200 if filled (bots think they won; we noop)
 *   2. Field validation
 *   3. Captcha verify (reCAPTCHA v2 OR Cloudflare Turnstile)
 *   4. Parallel: email + 3 webhook fanouts (Promise.allSettled so
 *      one slow/failing webhook doesn't block the others)
 *   5. Structured log every step with the same submissionId
 *   6. Return JSON
 */

// This file is a runtime endpoint — must not prerender.
export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  // Pull env both from the Cloudflare runtime locals AND from
  // `import.meta.env` so the same handler works under `astro dev`
  // (no `runtime` injected) and in production on the Worker.
  const cfEnv = (context.locals as { runtime?: { env?: FormEnv } }).runtime?.env;
  const env: FormEnv = {
    ...((import.meta.env as unknown) as FormEnv),
    ...(cfEnv ?? {}),
  };

  const submissionId = crypto.randomUUID();
  log({ level: 'info', event: 'form_received', submissionId });

  // ── 1. Parse the body ────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await context.request.formData();
  } catch (err) {
    log({
      level: 'error',
      event: 'form_parse_failed',
      submissionId,
      message: err instanceof Error ? err.message : String(err),
    });
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // ── 2. Honeypot — bot trap ──────────────────────────────────
  if (isHoneypotFilled(formData)) {
    log({ level: 'warn', event: 'honeypot_filled', submissionId });
    // Return 200 so the bot's logic thinks it succeeded → no retry,
    // no log spam, no email noise.
    return json({ ok: true, submissionId }, 200);
  }

  // ── 3. Parse + validate ─────────────────────────────────────
  const data = parseFormData(formData);
  const validationError = validateRequired(data);
  if (validationError) {
    log({
      level: 'warn',
      event: 'validation_failed',
      submissionId,
      error: validationError,
    });
    return json({ ok: false, error: validationError }, 400);
  }

  // ── 4. Captcha ──────────────────────────────────────────────
  const captcha = await verifyCaptcha({
    token: data.captchaToken,
    provider: data.captchaProvider,
    recaptchaSecret: env.RECAPTCHA_SECRET,
    turnstileSecret: env.TURNSTILE_SECRET,
  });
  log({
    level: captcha.ok ? 'info' : 'warn',
    event: 'recaptcha_verified',
    submissionId,
    provider: data.captchaProvider,
    ok: captcha.ok,
    durationMs: captcha.durationMs,
    ...(captcha.ok ? {} : { error: captcha.error, meta: captcha.meta }),
  });
  if (!captcha.ok) {
    return json({ ok: false, error: 'captcha_failed' }, 400);
  }

  // ── 5. Build payload, fan out (email + 3 webhooks) ─────────
  const payload = buildWebflowPayload(data, env.SITE_ID, submissionId);

  // Recipients live in env (comma-separated) so adding/removing humans
  // is a dashboard edit, not a code change. In non-production envs the
  // email service replaces these with STAGING_EMAIL_OVERRIDE regardless.
  const recipients = (env.NOTIFICATION_TO_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Build EmailConfig from the merged env (Cloudflare runtime + import.meta.env).
  // Throws synchronously with a multi-line diagnostic if anything's missing.
  const emailConfig = loadEmailConfig(
    mergeEnvSources(import.meta.env as Record<string, unknown>, cfEnv),
  );

  const results = await Promise.allSettled([
    sendContactFormEmail(emailConfig, {
      to: recipients,
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        services: data.services,
        sourceUrl: data.sourceUrl,
        submissionId,
      },
    }),
    fireWebhook('crm', env.WEBHOOK_CRM_URL, payload),
    fireWebhook('lead_1', env.WEBHOOK_LEAD_URL_1, payload),
    fireWebhook('lead_2', env.WEBHOOK_LEAD_URL_2, payload),
  ]);

  const [emailResult, ...webhookResults] = results;

  // Log each outcome with the same submissionId for end-to-end traces.
  // The new email service returns a Result type:
  //   { ok: true, id, durationMs, meta }
  //   { ok: false, code, message, durationMs, meta }
  if (emailResult.status === 'fulfilled') {
    const v = emailResult.value;
    log({
      level: v.ok ? 'info' : 'error',
      event: 'email_complete',
      submissionId,
      ok: v.ok,
      durationMs: v.durationMs,
      ...(v.ok
        ? { meta: { ...v.meta, messageId: v.id } }
        : { error: v.code, meta: { ...v.meta, message: v.message } }),
    });
  } else {
    log({
      level: 'error',
      event: 'email_threw',
      submissionId,
      reason: String(emailResult.reason),
    });
  }
  for (const r of webhookResults) {
    if (r.status === 'fulfilled') {
      log({
        level: r.value.ok ? 'info' : 'error',
        event: 'webhook_complete',
        submissionId,
        label: r.value.label,
        ok: r.value.ok,
        durationMs: r.value.durationMs,
        ...(r.value.ok
          ? { meta: r.value.meta }
          : { error: r.value.error, meta: r.value.meta }),
      });
    } else {
      log({
        level: 'error',
        event: 'webhook_threw',
        submissionId,
        reason: String(r.reason),
      });
    }
  }

  // ── 6. Decide what the user sees ────────────────────────────
  // Email is the only step that's user-visible: if the recipient inbox
  // didn't get notified, ops can't act on the lead, so we tell the user
  // it failed. Webhook failures are CRM/marketing-side; we proceed and
  // log them for ops to backfill manually.
  const emailOk = emailResult.status === 'fulfilled' && emailResult.value.ok;
  if (!emailOk) {
    log({ level: 'error', event: 'form_failed_user_visible', submissionId });
    return json({ ok: false, error: 'send_failed' }, 502);
  }

  log({ level: 'info', event: 'form_completed', submissionId });
  return json({ ok: true, submissionId }, 200);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
