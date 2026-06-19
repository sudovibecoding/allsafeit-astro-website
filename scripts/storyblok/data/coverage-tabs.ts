/** Build tab HTML matching the original Astro location hub pages. */
export function buildCoverageTabs(
  panels: Array<{
    heading: string;
    intro: string;
    table?: Array<{ label: string; body: string }>;
    paragraphs?: string[];
  }>,
) {
  return panels.map((p) => {
    const intro = `<p class="panel-intro">${p.intro}</p>`;
    const table = p.table
      ? `<div class="coverage-table">
         <div class="coverage-row coverage-row__head">
           <div>Solution</div><div>What it does</div>
         </div>
         ${p.table
           .map(
             (r) =>
               `<div class="coverage-row"><div class="coverage-label">${r.label}</div><div>${r.body}</div></div>`,
           )
           .join('')}
       </div>`
      : '';
    const paragraphs = (p.paragraphs ?? []).map((s) => `<p>${s}</p>`).join('');
    return { label: p.heading, content: `${intro}${table}${paragraphs}` };
  });
}
