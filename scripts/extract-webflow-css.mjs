import { readFileSync, writeFileSync } from 'node:fs';

const css = readFileSync(process.argv[2], 'utf-8');

const mediaRe = /@media[^{]+\{((?:[^{}]|\{[^{}]*\})*)\}/g;
const mediaBlocks = [];
let m;
while ((m = mediaRe.exec(css))) {
  const headerEnd = css.indexOf('{', m.index);
  const header = css.slice(m.index, headerEnd).trim();
  mediaBlocks.push({ header, body: m[1] });
}

const baseCss = css.replace(mediaRe, '');

function showRules(label, source, patterns) {
  const out = [`\n========== ${label} ==========`];
  const ruleRe = /([.#:\w][^{}]*?)\{([^{}]*)\}/g;
  let r;
  while ((r = ruleRe.exec(source))) {
    const sel = r[1].trim();
    if (patterns.some((p) => p.test(sel))) {
      out.push(`  ${sel} {`);
      out.push(`    ${r[2].trim()}`);
      out.push(`  }`);
    }
  }
  return out.join('\n');
}

const interest = [
  /quote-box/,
  /^\.section[^a-zA-Z\-]/,
  /^\.section\./,
  /^\.section\s/,
  /section-content/,
  /^h[1-6]$/,
  /^\.h[1-6][^a-zA-Z\-]/,
  /^\.h[1-6]\./,
  /^\.h[1-6]$/,
  /^\.container$/,
  /^\.container\./,
  /^\.lead-text/,
  /^\.card-grid/,
];

let result = showRules('BASE (desktop default)', baseCss, interest);
for (const mb of mediaBlocks) {
  result += showRules(mb.header, mb.body, interest);
}

writeFileSync(process.argv[3] || 'C:/Users/USER/AppData/Local/Temp/webflow-extract.txt', result);
console.log(result);
