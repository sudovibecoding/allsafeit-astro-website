// Tab switching for the <Tabs> component (Webflow-style tabs).
// Progressive enhancement: panes are server-rendered; this just toggles which
// one is visible. Lazy-loaded by init.ts only on pages that contain [data-tabs].
export function initTabs(): void {
  document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((root) => {
    const links = Array.from(
      root.querySelectorAll<HTMLElement>('[data-tab-link]'),
    );
    const panes = Array.from(
      root.querySelectorAll<HTMLElement>('[data-tab-pane]'),
    );

    function activate(idx: string): void {
      for (const l of links) {
        const on = l.dataset.tabLink === idx;
        l.classList.toggle('is-active', on);
        l.setAttribute('aria-selected', on ? 'true' : 'false');
      }
      for (const p of panes) {
        const on = p.dataset.tabPane === idx;
        p.classList.toggle('is-active', on);
        p.hidden = !on;
      }
    }

    links.forEach((l) =>
      l.addEventListener('click', () => activate(l.dataset.tabLink ?? '0')),
    );
  });
}
