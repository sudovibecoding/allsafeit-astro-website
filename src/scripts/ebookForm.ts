/**
 * Shared submit handler for ebook lead-capture forms.
 *
 * Binds to any `<form data-ebook-form>` on the page. Used by both:
 *   - src/components/forms/EbookEmailForm.astro
 *   - src/components/sections/EbookCta.astro
 *
 * Behavior:
 *   - On load: populates the hidden source_url with the page URL
 *   - On submit: POSTs FormData to `/api/ebook-download`, then
 *     - on 200 + `ok: true` → navigates to `data-redirect-to`
 *     - on anything else  → shows the inline `.form-error` element
 *
 * Idempotent. Re-runs after view transitions (astro:page-load) and
 * uses a per-element `data-ebook-bound` flag so handlers aren't bound
 * twice when ClientRouter swaps the DOM.
 */
export function initEbookForms(): void {
  const forms = document.querySelectorAll<HTMLFormElement>(
    'form[data-ebook-form]:not([data-ebook-bound])',
  );

  forms.forEach((form) => {
    form.setAttribute('data-ebook-bound', '1');

    const sourceUrlInput = form.querySelector<HTMLInputElement>(
      'input[name="source_url"]',
    );
    if (sourceUrlInput) sourceUrlInput.value = window.location.href;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Find sibling status elements. They live alongside the form
      // inside whichever wrapper the form's component uses — we walk
      // up to find them.
      const wrap = form.parentElement;
      const successEl = wrap?.querySelector<HTMLElement>('.form-success');
      const errorEl = wrap?.querySelector<HTMLElement>('.form-error');
      const submitBtn = form.querySelector<HTMLInputElement>(
        'input[type="submit"]',
      );
      const originalBtnText = submitBtn?.value;

      if (sourceUrlInput) sourceUrlInput.value = window.location.href;
      successEl?.setAttribute('hidden', '');
      errorEl?.setAttribute('hidden', '');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.value = 'Sending...';
      }

      try {
        const res = await fetch('/api/ebook-download', {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        const data = (await res.json().catch(() => ({ ok: false }))) as {
          ok?: boolean;
        };

        if (res.ok && data.ok) {
          const target =
            form.getAttribute('data-redirect-to') || '/lead-magnet-download';
          window.location.href = target;
          return; // navigation pending — don't restore button state
        }

        if (errorEl) errorEl.removeAttribute('hidden');
      } catch {
        if (errorEl) errorEl.removeAttribute('hidden');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (originalBtnText) submitBtn.value = originalBtnText;
        }
        // Reset the Turnstile widget so the next attempt gets a fresh
        // token. Safe to call even when no widget is present.
        const tsAPI = (
          window as unknown as {
            turnstile?: { reset: (el: Element | string) => void };
          }
        ).turnstile;
        const widget = form.querySelector('.cf-turnstile');
        if (tsAPI && widget) tsAPI.reset(widget);
      }
    });
  });
}

// Auto-init on first script execution + after every view transition.
initEbookForms();
document.addEventListener('astro:page-load', initEbookForms);
