// Handles mobile hamburger toggle and mobile dropdown toggles.
// Desktop dropdowns are CSS-only (hover + focus-within). No library needed.
//
// View-transition safety:
//   The mobile drawer (`#mobile-nav`) is a sibling of `.navbar` (not a child).
//   When Astro's <ClientRouter /> persists the navbar across navigations, the
//   drawer may NOT persist along with it — meaning a freshly-rendered drawer
//   DOM replaces the old one, and any click handlers wired to the old drawer
//   reference detached elements. Result: the menu refuses to open until the
//   user hard-refreshes the page.
//
//   Fix: `initNav()` is idempotent (per-element flag on the toggle button so
//   we never double-bind), AND it's called both on initial load AND on every
//   `astro:page-load` event. Re-runs grab fresh DOM references; stale state
//   is reset.

export function initNav(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-nav-menu]');

  if (!toggle || !menu) return;

  // ── Reset any stale state on every (re)init ───────────────────
  // If the previous page left the menu open mid-transition, normalise
  // before re-binding so the next click reliably opens (not closes).
  toggle.setAttribute('aria-expanded', 'false');
  menu.setAttribute('data-open', 'false');
  document.body.removeAttribute('data-nav-open');

  // ── Bind toggle click — idempotent guard prevents double-bind ──
  // The toggle button itself persists across nav (it's inside `.navbar`
  // which has transition:persist), so re-running initNav would otherwise
  // stack listeners. The `data-nav-bound` flag short-circuits that.
  if (toggle.dataset.navBound !== 'true') {
    toggle.dataset.navBound = 'true';

    toggle.addEventListener('click', () => {
      // Re-query the menu by ID at click time so we always operate on
      // the LIVE drawer, not whatever DOM reference was captured when
      // initNav first ran. This is the actual fix for issue #1.
      const liveMenu = document.querySelector<HTMLElement>('[data-nav-menu]');
      if (!liveMenu) return;
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      liveMenu.setAttribute('data-open', String(!isOpen));
      document.body.toggleAttribute('data-nav-open', !isOpen);
    });
  }

  // ── (Re)bind mobile dropdown accordion triggers ───────────────
  // These triggers live INSIDE the drawer, which IS replaced on nav
  // transitions when the drawer doesn't persist. So we rebind on every
  // initNav() call — but with a per-button flag so a still-persisted
  // drawer doesn't accumulate listeners.
  menu.querySelectorAll<HTMLButtonElement>('[data-dropdown-trigger]').forEach((btn) => {
    if (btn.dataset.ddBound === 'true') return;
    btn.dataset.ddBound = 'true';
    btn.addEventListener('click', () => {
      const dropdown = btn.closest<HTMLElement>('[data-dropdown]');
      if (!dropdown) return;
      const isOpen = dropdown.getAttribute('data-open') === 'true';
      // Collapse sibling dropdowns first.
      menu.querySelectorAll<HTMLElement>('[data-dropdown][data-open="true"]').forEach((d) => {
        if (d !== dropdown) {
          d.setAttribute('data-open', 'false');
          d.querySelector('[data-dropdown-trigger]')?.setAttribute('aria-expanded', 'false');
        }
      });
      dropdown.setAttribute('data-open', String(!isOpen));
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  // ── Document-level listeners — bound ONCE (re-init is a no-op) ─
  // These attach to `document` (which is the same across nav transitions),
  // so we use a module-scoped flag to bind exactly once per session.
  if (!docListenersBound) {
    docListenersBound = true;

    // Close mobile menu when clicking outside.
    document.addEventListener('click', (e) => {
      const liveToggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
      const liveMenu = document.querySelector<HTMLElement>('[data-nav-menu]');
      if (!liveToggle || !liveMenu) return;
      const target = e.target as Node;
      if (!liveToggle.contains(target) && !liveMenu.contains(target)) {
        liveToggle.setAttribute('aria-expanded', 'false');
        liveMenu.setAttribute('data-open', 'false');
        document.body.removeAttribute('data-nav-open');
      }
    });

    // Close mobile menu on Escape.
    document.addEventListener('keydown', (e) => {
      const liveToggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
      const liveMenu = document.querySelector<HTMLElement>('[data-nav-menu]');
      if (!liveToggle || !liveMenu) return;
      if (e.key === 'Escape' && liveToggle.getAttribute('aria-expanded') === 'true') {
        liveToggle.setAttribute('aria-expanded', 'false');
        liveMenu.setAttribute('data-open', 'false');
        document.body.removeAttribute('data-nav-open');
        liveToggle.focus();
      }
    });
  }
}

// Module-scoped flag — survives ClientRouter navigations (the module is
// only evaluated once per browser session).
let docListenersBound = false;
