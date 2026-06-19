import type { ContactFormData, StepResult } from './types';

/**
 * Server-side captcha verification.
 *
 * Two providers supported (whichever widget the page rendered wins):
 *   - reCAPTCHA v2 → POST to www.google.com/recaptcha/api/siteverify
 *   - Cloudflare Turnstile → POST to challenges.cloudflare.com/turnstile/v0/siteverify
 *
 * Both APIs accept the same shape (secret + response, form-urlencoded)
 * and return `{ success: boolean, "error-codes": string[] }`, so the
 * code path collapses nicely.
 *
 * NEVER call this with a missing token — that should be caught by
 * validate.validateRequired() first. We still defend here in case.
 */

const RECAPTCHA_URL = 'https://www.google.com/recaptcha/api/siteverify';
const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface VerifyArgs {
  token: string;
  provider: ContactFormData['captchaProvider'];
  recaptchaSecret: string;
  turnstileSecret?: string;
}

export async function verifyCaptcha(args: VerifyArgs): Promise<StepResult> {
  const start = Date.now();

  if (!args.token || args.provider === 'none') {
    return {
      ok: false,
      durationMs: Date.now() - start,
      error: 'no_token',
    };
  }

  let url: string;
  let secret: string;
  if (args.provider === 'recaptcha') {
    url = RECAPTCHA_URL;
    secret = args.recaptchaSecret;
  } else {
    url = TURNSTILE_URL;
    secret = args.turnstileSecret ?? '';
  }

  if (!secret) {
    return {
      ok: false,
      durationMs: Date.now() - start,
      error: `no_secret_${args.provider}`,
    };
  }

  try {
    const body = new URLSearchParams({ secret, response: args.token });
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      return {
        ok: false,
        durationMs: Date.now() - start,
        error: `verify_http_${res.status}`,
      };
    }

    const json = (await res.json()) as {
      success: boolean;
      'error-codes'?: string[];
    };

    if (!json.success) {
      return {
        ok: false,
        durationMs: Date.now() - start,
        error: 'verify_rejected',
        meta: {
          provider: args.provider,
          codes: json['error-codes'] ?? [],
        },
      };
    }

    return {
      ok: true,
      durationMs: Date.now() - start,
      meta: { provider: args.provider },
    };
  } catch (err) {
    return {
      ok: false,
      durationMs: Date.now() - start,
      error: 'verify_throw',
      meta: {
        provider: args.provider,
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
}
