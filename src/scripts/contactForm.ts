/**
 * Contact form client controller.
 *
 * Intercepts the form's submit event, POSTs FormData to /api/contact,
 * and toggles the existing `.form-success` / `.form-error` divs without
 * a page reload — mirrors Webflow's native inline-success UX.
 *
 * NO no-JS fallback path. The form has `action="/api/contact"` and
 * `method="post"` set as a safety net if JS somehow fails to attach
 * (cached bundle, blocked CSP), but the server returns JSON in that
 * case — the browser would download the JSON. To prevent that, the
 * Astro components include a <noscript> block telling JS-disabled
 * users to call directly.
 *
 * Idempotent — `data-bound` flag prevents double-binding when
 * `astro:page-load` re-fires after a view transition.
 */

/**
 * Cloudflare Turnstile global, injected by
 * https://challenges.cloudflare.com/turnstile/v0/api.js
 *
 * We use the NATIVE Turnstile API (not the `?compat=recaptcha` shim),
 * which exposes `window.turnstile.reset()`. The reCAPTCHA `grecaptcha.*`
 * symbols are NOT defined under the native script — calling them is a
 * silent no-op, which is why the previous `grecaptcha.reset()` here
 * never reset the widget after submit.
 *
 * Reference: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#reset-a-widget
 */
declare const turnstile: {
  reset(container?: string | HTMLElement): void;
  getResponse(container?: string | HTMLElement): string | undefined;
};

export function initContactForm(): void {
  const forms = document.querySelectorAll<HTMLFormElement>('[data-contact-form]');
  forms.forEach(wire);
}

function wire(form: HTMLFormElement): void {
  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  // Webflow wraps each form in `.form-block-3` (ContactForm) or
  // `.form-block-inquiry` (InquiryForm). Either way the success/error
  // divs are siblings of the form inside that wrapper. Fall back to
  // direct parent if neither class is found.
  const wrapper =
    form.closest('.form-block-3, .form-block-inquiry') ?? form.parentElement;
  const successDiv = wrapper?.querySelector<HTMLElement>('.form-success') ?? null;
  const errorDiv = wrapper?.querySelector<HTMLElement>('.form-error') ?? null;
  const errorMsgEl =
    errorDiv?.querySelector<HTMLElement>('[data-error-text]') ?? errorDiv;

  const submitBtn = form.querySelector<HTMLButtonElement | HTMLInputElement>(
    'button[type="submit"], input[type="submit"]',
  );
  const originalSubmitLabel = readSubmitLabel(submitBtn);

  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();

    // Hide stale messages, lock the submit button.
    hide(successDiv);
    hide(errorDiv);
    setSubmitBusy(submitBtn, originalSubmitLabel, true);

    // Make sure a captcha token exists. The reCAPTCHA / Turnstile widgets
    // inject their tokens into hidden form fields on solve. If the user
    // hasn't solved yet, we short-circuit with a friendly message instead
    // of round-tripping to the server.
    const token = readCaptchaToken(form);
    if (!token) {
      showError(errorDiv, errorMsgEl, friendly('missing_captcha'));
      setSubmitBusy(submitBtn, originalSubmitLabel, false);
      return;
    }

    // Build the FormData once so we can log it AND submit it without
    // double-iterating the form.
    const formData = new FormData(form);

    // ── DEBUG (remove or gate behind a flag for production) ───────
    // Logs every field name/value pair the form is about to POST.
    // Useful for sanity-checking field names match the server's
    // expectations (Firstname, Phone-no, Cybersecurity-2, etc.) and
    // that the Turnstile token is present.
    if (typeof console !== 'undefined') {
      const entries: Record<string, string> = {};
      formData.forEach((value, key) => {
        entries[key] = typeof value === 'string'
          ? value
          : `<File ${value.name}>`;
      });
      console.log('[contact-form] submit', {
        formId: form.id || '(no id)',
        fields: entries,
      });
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });
      const data = await res
        .json()
        .catch(() => ({ ok: false, error: 'bad_response' }));

      console.log('[contact-form] response', { status: res.status, data });

      if (data.ok) {
        // Hide the entire form and reveal the success div in its place.
        hide(form);
        show(successDiv);
        // Fire analytics event if GTM/dataLayer present (silently no-ops
        // otherwise — no error if analytics isn't loaded).
        const dl = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
        if (Array.isArray(dl)) {
          dl.push({
            event: 'form_submit',
            form_id: form.id || null,
            submission_id: data.submissionId,
          });
        }
        // Reset Turnstile so the user can submit a NEW form on the same
        // page without reloading (tokens are single-use). Scope the reset
        // to THIS form's widget — `.cf-turnstile` container inside the
        // submitted form — so co-existing forms on the same page don't
        // get their widgets nuked too.
        if (typeof turnstile !== 'undefined') {
          try {
            const widget = form.querySelector<HTMLElement>('.cf-turnstile');
            turnstile.reset(widget ?? undefined);
          } catch {
            /* widget gone or not yet initialised — fine */
          }
        }
      } else {
        showError(errorDiv, errorMsgEl, friendly(data.error));
        setSubmitBusy(submitBtn, originalSubmitLabel, false);
      }
    } catch (err) {
      console.error('[contact-form] network failure', err);
      showError(errorDiv, errorMsgEl, friendly('network'));
      setSubmitBusy(submitBtn, originalSubmitLabel, false);
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────────

/** Reads whichever captcha provider injected its token. */
function readCaptchaToken(form: HTMLFormElement): string {
  // reCAPTCHA v2 stores in a textarea named `g-recaptcha-response`.
  const recaptcha = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    '[name="g-recaptcha-response"]',
  );
  if (recaptcha?.value) return recaptcha.value;

  // Turnstile stores in a hidden input named `cf-turnstile-response`.
  const turnstile = form.querySelector<HTMLInputElement>(
    '[name="cf-turnstile-response"]',
  );
  if (turnstile?.value) return turnstile.value;

  return '';
}

function readSubmitLabel(
  btn: HTMLButtonElement | HTMLInputElement | null,
): string {
  if (!btn) return 'Submit';
  if (btn instanceof HTMLInputElement) return btn.value || 'Submit';
  return btn.textContent ?? 'Submit';
}

function setSubmitBusy(
  btn: HTMLButtonElement | HTMLInputElement | null,
  originalLabel: string,
  busy: boolean,
): void {
  if (!btn) return;
  btn.disabled = busy;
  const label = busy ? 'Sending…' : originalLabel;
  if (btn instanceof HTMLInputElement) btn.value = label;
  else btn.textContent = label;
}

function hide(el: HTMLElement | null): void {
  if (!el) return;
  el.hidden = true;
  el.style.display = 'none';
}

function show(el: HTMLElement | null): void {
  if (!el) return;
  el.hidden = false;
  el.style.display = '';
}

function showError(
  container: HTMLElement | null,
  message: HTMLElement | null,
  text: string,
): void {
  if (message && message !== container) {
    message.textContent = text;
  } else if (container) {
    // Replace just the first text-bearing child to preserve markup if any.
    const inner = container.querySelector('div') ?? container;
    inner.textContent = text;
  }
  show(container);
}

/**
 * Map server error codes to user-readable copy. The codes are emitted
 * by validate.ts / recaptcha.ts / contact.ts — keep this in sync.
 */
function friendly(code: string): string {
  switch (code) {
    case 'missing_first_name':
    case 'missing_last_name':
      return 'Please enter your full name.';
    case 'missing_email':
    case 'invalid_email':
      return 'Please enter a valid email address.';
    case 'missing_captcha':
    case 'captcha_failed':
      return 'Please complete the security check and try again.';
    case 'send_failed':
      return 'We could not send your message. Please try again or call (888) 400-2748.';
    case 'network':
      return 'Connection problem. Please check your internet and try again.';
    case 'bad_request':
    case 'bad_response':
    default:
      return 'Something went wrong. Please try again or call (888) 400-2748.';
  }
}
