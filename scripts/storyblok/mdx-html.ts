import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { marked } from 'marked';

marked.use({
  gfm: true,
  renderer: {
    paragraph({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `<p class="body-text">${text}</p>\n`;
    },
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const cls = `h${Math.min(depth, 6)}`;
      return `<h${depth} class="${cls}">${text}</h${depth}>\n`;
    },
    list(token) {
      const body = token.items.map((item) => this.listitem(item)).join('');
      const tag = token.ordered ? 'ol' : 'ul';
      const cls = token.ordered ? 'cms-list cms-list--ordered' : 'cms-list';
      return `<${tag} class="${cls}">${body}</${tag}>\n`;
    },
    listitem(item) {
      const text = this.parser.parse(item.tokens, !!item.task);
      return `<li class="body-text">${text}</li>\n`;
    },
    blockquote({ tokens }) {
      const text = this.parser.parse(tokens);
      return `<blockquote class="cms-quote body-text">${text}</blockquote>\n`;
    },
    image({ href, text }) {
      return `<figure class="cms-figure"><img src="${href}" alt="${text ?? ''}" loading="lazy" decoding="async" /></figure>\n`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr}>${text}</a>`;
    },
    code({ text, lang }) {
      const langAttr = lang ? ` class="language-${lang}"` : '';
      return `<pre class="cms-code"><code${langAttr}>${text}</code></pre>\n`;
    },
  },
});

export function parseMdxFile(filePath: string) {
  const raw = readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {} as Record<string, unknown>, body: raw.trim(), bodyHtml: '' };
  }
  const frontmatter = (yaml.load(match[1]) ?? {}) as Record<string, unknown>;
  const body = match[2].trim();
  const bodyHtml = body ? marked.parse(body) : '';
  return { frontmatter, body, bodyHtml };
}
