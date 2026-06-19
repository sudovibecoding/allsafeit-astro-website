import type { ContactFormData } from './types';

/**
 * Form fields we never treat as a "service" checkbox. Anything else with
 * a truthy value of `on` or `true` is collected as a service slug — this
 * keeps us forward-compatible if marketing adds a new service checkbox
 * without us having to maintain a list here.
 */
const RESERVED_FIELD_NAMES = new Set<string>([
  'Firstname',
  'Lastname',
  'Email',
  'Phone-no',
  'Company-Name',
  'source_url',
  'g-recaptcha-response',
  'cf-turnstile-response',
  'website',
]);

/**
 * Honeypot — bots scrape forms and auto-fill every input. The `website`
 * field is positioned off-screen so humans never see it, but any
 * automated scraper will dutifully fill it in. If we see content there
 * on submit, we return success silently — the bot moves on, doesn't
 * retry, and no email/webhook noise is generated.
 *
 * Why off-screen instead of `display: none`?
 *   Some smart bots skip `display:none` inputs because that's a known
 *   anti-bot pattern. Absolute-positioning off-screen + `tabindex="-1"`
 *   + `aria-hidden` is invisible to real users (visual and keyboard)
 *   but still in the DOM as a normal text input, so naive bots fill it.
 */
export function isHoneypotFilled(formData: FormData): boolean {
  const value = formData.get('website');
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Convert raw FormData into our typed canonical shape. Handles both
 * captcha widgets — whichever token is present wins.
 */
export function parseFormData(formData: FormData): ContactFormData {
  const get = (key: string): string => {
    const value = formData.get(key);
    return typeof value === 'string' ? value.trim() : '';
  };

  // Walk every field; anything not in the reserved set whose value reads
  // truthy is treated as a service checkbox (the form posts `on` for
  // checked checkboxes — Webflow convention).
  const services: string[] = [];
  for (const [name, value] of formData.entries()) {
    if (RESERVED_FIELD_NAMES.has(name)) continue;
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed === 'on' || trimmed === 'true') {
      services.push(name);
    }
  }

  // Captcha — every form on the site uses Cloudflare Turnstile
  // (native API, posts `cf-turnstile-response`). We still defensively
  // check for `g-recaptcha-response` so the verifier survives any future
  // form that opts into Turnstile's `?compat=recaptcha` mode (which
  // emits the legacy field name), or any reCAPTCHA leftover. Whichever
  // token is present wins; the matching server-side verifier is called.
  // Reference: https://developers.cloudflare.com/turnstile/migration/recaptcha/
  const recaptchaToken = get('g-recaptcha-response');
  const turnstileToken = get('cf-turnstile-response');
  const captchaToken = recaptchaToken || turnstileToken;
  const captchaProvider: ContactFormData['captchaProvider'] =
    recaptchaToken ? 'recaptcha' :
    turnstileToken ? 'turnstile' :
    'none';

  return {
    firstName: get('Firstname'),
    lastName: get('Lastname'),
    email: get('Email'),
    phone: get('Phone-no'),
    company: get('Company-Name'),
    services,
    sourceUrl: get('source_url'),
    captchaToken,
    captchaProvider,
    honeypot: get('website'),
  };
}

/**
 * Returns null if everything required is present, or an error code
 * string the client can show a friendly message for.
 */
export function validateRequired(data: ContactFormData): string | null {
  if (!data.firstName) return 'missing_first_name';
  if (!data.lastName) return 'missing_last_name';
  if (!data.email) return 'missing_email';
  if (!isEmail(data.email)) return 'invalid_email';
  if (data.captchaProvider === 'none' || !data.captchaToken) return 'missing_captcha';
  return null;
}

/** Lightweight email format check — enough to catch fat-fingers. */
function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
