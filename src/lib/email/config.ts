/**
 * Env reading + validation for the email service.
 *
 * Why a dedicated module: the Worker on Cloudflare and `astro dev`
 * surface env vars differently —
 *   - astro dev:    `import.meta.env.XYZ` (read from .env at project root)
 *   - Cloudflare:   `context.locals.runtime.env.XYZ` (per-request binding)
 *
 * The service layer doesn't care which one a value came from. This file
 * normalizes both into a single `EmailConfig`, fails fast with a clear
 * message if any required var is missing/invalid, and is the ONLY place
 * that knows about the dual-source quirk.
 *
 * Validation: uses zod (already a project dep — same library that
 * validates content collection schemas).
 */
import { z } from 'zod';
import type { EmailConfig, AppEnv } from './types';

// ─────────────────────────────────────────────────────────────────────
// Raw-env schema — what we accept from either source.
// ─────────────────────────────────────────────────────────────────────

const APP_ENV_VALUES = ['development', 'staging', 'production'] as const;

const rawEnvSchema = z
  .object({
    RESEND_API_KEY: z
      .string({ required_error: 'RESEND_API_KEY is required (set in .dev.vars locally, or via `wrangler secret put` in production).' })
      .min(1, 'RESEND_API_KEY must not be empty.')
      .startsWith('re_', 'RESEND_API_KEY should start with "re_" — check you copied the right key from https://resend.com/api-keys.'),

    EMAIL_FROM: z
      .string({ required_error: 'EMAIL_FROM is required (e.g. "AllSafe IT <form@allsafeit.com>" or "form@allsafeit.com").' })
      .min(3, 'EMAIL_FROM looks too short — expected an email address.')
      // Accept either "addr@domain" or "Name <addr@domain>" — Resend handles both.
      .refine(
        (s) => /@/.test(s),
        'EMAIL_FROM must contain "@" — pass an email or "Name <email>".'
      ),

    APP_ENV: z
      .enum(APP_ENV_VALUES, {
        errorMap: () => ({
          message: `APP_ENV must be one of: ${APP_ENV_VALUES.join(', ')}.`,
        }),
      })
      .default('production'),

    // Accepts a single email OR a comma-separated list. Validation
    // splits + trims, then checks each piece. Output is `string[] |
    // undefined` so downstream code never branches on shape.
    STAGING_EMAIL_OVERRIDE: z
      .string()
      .optional()
      .transform((raw) => {
        if (!raw || raw.trim() === '') return undefined;
        return raw
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);
      })
      .superRefine((arr, ctx) => {
        if (arr === undefined) return; // empty is fine — staged in superRefine below
        if (arr.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'STAGING_EMAIL_OVERRIDE was set but contained no addresses after trimming.',
          });
          return;
        }
        for (const e of arr) {
          if (!z.string().email().safeParse(e).success) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `"${e}" is not a valid email address. STAGING_EMAIL_OVERRIDE accepts one email or a comma-separated list (e.g. "a@x.com,b@y.com").`,
            });
          }
        }
      }),
  })
  .superRefine((env, ctx) => {
    // Belt-and-braces: in any non-production env, we REQUIRE the override.
    // Without it, a misconfigured staging Worker would silently spam real
    // recipients. Hard-fail at boot instead.
    const overrideEmpty =
      !env.STAGING_EMAIL_OVERRIDE || env.STAGING_EMAIL_OVERRIDE.length === 0;
    if (env.APP_ENV !== 'production' && overrideEmpty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `STAGING_EMAIL_OVERRIDE is required when APP_ENV="${env.APP_ENV}" (so non-prod sends never reach real customers).`,
        path: ['STAGING_EMAIL_OVERRIDE'],
      });
    }
  });

// ─────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────

/**
 * Build an EmailConfig from a raw env object.
 *
 * Throws a clear, multi-line message describing every missing/invalid
 * field — easier to triage than one error at a time.
 *
 * Memoized at module scope so subsequent calls with the same env hit a
 * cache. Cloudflare Workers reuse the module across requests within an
 * isolate, so a typical Worker validates once per cold start.
 */
let _cachedConfig: EmailConfig | undefined;
let _cachedFingerprint: string | undefined;

export function loadEmailConfig(
  rawEnv: Record<string, string | undefined>,
): EmailConfig {
  // Cheap fingerprint of just the values we read — avoids re-validating
  // the same env shape every request. Per-key concat is enough; we don't
  // need a real hash.
  const fingerprint = [
    rawEnv.RESEND_API_KEY,
    rawEnv.EMAIL_FROM,
    rawEnv.APP_ENV,
    rawEnv.STAGING_EMAIL_OVERRIDE,
  ].join('|');

  if (_cachedConfig && _cachedFingerprint === fingerprint) {
    return _cachedConfig;
  }

  const result = rawEnvSchema.safeParse({
    RESEND_API_KEY: rawEnv.RESEND_API_KEY,
    EMAIL_FROM: rawEnv.EMAIL_FROM,
    APP_ENV: rawEnv.APP_ENV,
    STAGING_EMAIL_OVERRIDE: rawEnv.STAGING_EMAIL_OVERRIDE,
  });

  if (!result.success) {
    // Surface ALL issues at once. Replaces zod's stack trace with a
    // human-readable bullet list pointing at the env source.
    const issues = result.error.issues
      .map((i) => `  • [${(i.path[0] ?? 'env')}] ${i.message}`)
      .join('\n');
    throw new Error(
      `Invalid email-service environment:\n${issues}\n` +
        `Configure these in .env (astro dev), .dev.vars (wrangler dev), or via wrangler secrets / dashboard for production.`,
    );
  }

  const config: EmailConfig = {
    apiKey: result.data.RESEND_API_KEY,
    from: result.data.EMAIL_FROM,
    appEnv: result.data.APP_ENV as AppEnv,
    stagingOverride: result.data.STAGING_EMAIL_OVERRIDE,
  };

  _cachedConfig = config;
  _cachedFingerprint = fingerprint;
  return config;
}

/**
 * Convenience: merge Cloudflare runtime env (per-request) with
 * astro-dev `import.meta.env` (build/dev) into a single Record. Pass
 * the result to `loadEmailConfig()`.
 *
 * Cloudflare runtime vars win over import.meta.env — production should
 * never accidentally fall back to a dev `.env` value.
 */
export function mergeEnvSources(
  importMetaEnv: Record<string, unknown>,
  cloudflareRuntimeEnv: Record<string, unknown> | undefined,
): Record<string, string | undefined> {
  // Coerce both to string-or-undefined; zod expects that shape.
  const out: Record<string, string | undefined> = {};
  const keys = [
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'APP_ENV',
    'STAGING_EMAIL_OVERRIDE',
  ] as const;
  for (const k of keys) {
    const cfVal = cloudflareRuntimeEnv?.[k];
    const importVal = importMetaEnv[k];
    const v = cfVal ?? importVal;
    out[k] = typeof v === 'string' ? v : undefined;
  }
  return out;
}

/**
 * For tests / dev tooling — reset the memoized config so the next call
 * re-validates. Not part of the runtime path.
 */
export function _resetConfigCacheForTests(): void {
  _cachedConfig = undefined;
  _cachedFingerprint = undefined;
}
