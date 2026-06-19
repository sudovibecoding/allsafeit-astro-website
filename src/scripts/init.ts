// Central script initializer — imported once by Base.astro.
//
// With Astro's <ClientRouter />, page navigations no longer reload the
// document, so module-level code runs only ONCE per session. Per-page
// initializers (slider, tabs) must therefore re-fire on each `astro:page-load`
// event — emitted by ClientRouter after the new page's DOM is swapped in.
//
// The navbar itself uses `transition:persist` and survives navigations, so
// `initNav()` only needs to run on the very first load — its event bindings
// stay attached to the persisted DOM.
//
// Reference: https://docs.astro.build/en/guides/view-transitions/#script-behavior-with-view-transitions

import { initNav } from './nav';

// Initial wire-up. The navbar element itself uses `transition:persist` so
// its event listeners survive ClientRouter navigations, but the mobile
// drawer is a SIBLING (not a child) of the persisted navbar — so its DOM
// can be replaced on transitions while the toggle button remains. To stay
// safe, we re-run initNav() on every page-load below; the function is
// idempotent (per-element data-bound flags inside) so no listener
// stacking happens.
initNav();

/**
 * Re-runs every time Astro mounts a new page (initial load + every
 * `<ClientRouter />` transition). Lazy-loads the slider and tabs only on
 * pages that actually have the relevant markup — preserves the existing
 * "ship zero JS when not needed" pattern.
 */
function onPageReady(): void {
  // Re-wire the nav so the mobile hamburger always points at the LIVE
  // drawer DOM. Idempotent — see nav.ts for the guard flags.
  initNav();

  if (document.querySelector('[data-slider]')) {
    import('./slider').then(({ initSliders }) => initSliders());
  }
  if (document.querySelector('[data-tabs]')) {
    import('./tabs').then(({ initTabs }) => initTabs());
  }

  // Contact-form handler — defer the import until the form is about to
  // scroll into view (or until the user interacts with it). This means
  // pages where the form is below the fold (e.g. a ContactSection at the
  // bottom of a long services page) don't pay the JS download cost until
  // it's actually needed.
  deferUntilNeeded('[data-contact-form]', () =>
    import('./contactForm').then(({ initContactForm }) => initContactForm()),
  );
}

/**
 * Defer importing a module until the user is about to interact with it.
 *
 * Triggers (whichever fires first):
 *   - The matched element scrolls within 400px of the viewport
 *     (IntersectionObserver) — covers "user scrolling down toward it"
 *   - A `focusin` fires on the matched element — covers "user tabs
 *     into the form directly via keyboard"
 *
 * If neither happens, the module never downloads. Idempotent — once
 * loaded, the IntersectionObserver disconnects and the focusin listener
 * is removed.
 */
function deferUntilNeeded(selector: string, load: () => Promise<unknown>): void {
  const el = document.querySelector(selector);
  if (!el) return;

  let triggered = false;
  const fire = () => {
    if (triggered) return;
    triggered = true;
    observer?.disconnect();
    el.removeEventListener('focusin', fire);
    void load();
  };

  // Triggers when the element scrolls near viewport.
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => entries.some((e) => e.isIntersecting) && fire(),
        { rootMargin: '400px' },
      )
    : null;
  observer?.observe(el);

  // Triggers if the user tabs/clicks into the form before scrolling.
  el.addEventListener('focusin', fire, { once: true });

  // Belt-and-suspenders: if the element is ALREADY in view on page
  // load (e.g. /contact-us where the form is the main content),
  // IntersectionObserver fires immediately, but we also schedule a
  // microtask so the load doesn't block the first paint.
}

// Fire on initial document load AND on every subsequent view transition.
// `astro:page-load` is dispatched by ClientRouter after the new page's
// DOM is in place (similar to `DOMContentLoaded` but for SPA navigations).
onPageReady();
document.addEventListener('astro:page-load', onPageReady);
