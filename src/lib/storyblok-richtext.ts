/**
 * Storyblok richtext → HTML using AllSafe site typography classes
 * (lead-text, body-text, h2.h3, etc.) so CMS content matches Astro sections.
 */

type RichTextNode = {
  type?: string;
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, string> }>;
  content?: RichTextNode[];
  attrs?: Record<string, string | number>;
};

export type RichTextVariant = 'default' | 'lead' | 'inline';

const WRAPPER_OPEN = '<div class="cms-rich-text">';
const WRAPPER_CLOSE = '</div>';

const HEADING_CLASS: Record<number, string> = {
  1: 'h2',
  2: 'h3',
  3: 'h4',
  4: 'h5',
  5: 'h6',
  6: 'h6',
};

/** Remove the outer .cms-rich-text wrapper added by renderStoryblokRichText. */
export function stripRichTextWrapper(html: string): string {
  if (!html) return '';
  if (html.startsWith(WRAPPER_OPEN) && html.endsWith(WRAPPER_CLOSE)) {
    return html.slice(WRAPPER_OPEN.length, -WRAPPER_CLOSE.length);
  }
  return html;
}

/** Strip HTML tags for plain-text fallbacks (e.g. card descriptions). */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html.replace(new RegExp('<[^>]+>', 'g'), '').trim();
}

/** Render Storyblok richtext JSON or pass through legacy HTML strings. */
export function renderBodyContent(value: unknown, variant: RichTextVariant = 'default'): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  return renderStoryblokRichText(value, variant);
}

/** Same as renderBodyContent but without the outer .cms-rich-text wrapper. */
export function renderBodyContentInner(value: unknown, variant: RichTextVariant = 'default'): string {
  return stripRichTextWrapper(renderBodyContent(value, variant));
}

/**
 * Prefer a raw HTML field (tables, links, custom markup) over richtext JSON.
 * When `plainText` is true, strip tags after richtext fallback (for intro lines).
 */
export function resolveRichOrHtml(
  htmlField: string | undefined | null,
  richtextField: unknown,
  plainText = false,
): string {
  const rendered = renderBodyContentInner(richtextField);
  const hasRichtext =
    richtextField &&
    typeof richtextField === 'object' &&
    Array.isArray((richtextField as { content?: unknown[] }).content) &&
    ((richtextField as { content: unknown[] }).content?.length ?? 0) > 0 &&
    rendered.trim().length > 0;

  if (hasRichtext) return plainText ? stripHtmlTags(rendered) : rendered;
  if (htmlField?.trim()) return htmlField.trim();
  return plainText ? stripHtmlTags(rendered) : rendered;
}

export function renderStoryblokRichText(doc: unknown, variant: RichTextVariant = 'default'): string {
  if (!doc || typeof doc !== 'object') return '';
  const root = doc as RichTextNode;
  if (root.type !== 'doc' || !Array.isArray(root.content)) return '';
  const html = root.content.map((node) => renderNode(node, variant)).join('');
  return `${WRAPPER_OPEN}${html}${WRAPPER_CLOSE}`;
}

function renderNode(node: RichTextNode, variant: RichTextVariant): string {
  if (node.type === 'text') {
    return applyMarks(escapeHtml(node.text ?? ''), node.marks ?? []);
  }

  const inner = (node.content ?? []).map((child) => renderNode(child, variant)).join('');
  const blockClass = node.attrs?.class as string | undefined;

  switch (node.type) {
    case 'paragraph': {
      const cls = blockClass || (variant === 'lead' ? 'lead-text' : 'body-text');
      return `<p class="${cls}">${inner || '&nbsp;'}</p>`;
    }
    case 'heading': {
      const level = Number(node.attrs?.level ?? 2);
      const tag = `h${Math.min(Math.max(level, 1), 6)}`;
      const cls = blockClass || HEADING_CLASS[level] || 'h3';
      return `<${tag} class="${cls}">${inner}</${tag}>`;
    }
    case 'bullet_list':
      return `<ul class="cms-list">${inner}</ul>`;
    case 'ordered_list':
      return `<ol class="cms-list cms-list--ordered">${inner}</ol>`;
    case 'list_item':
      return `<li class="body-text">${inner}</li>`;
    case 'blockquote':
      return `<blockquote class="cms-quote body-text">${inner}</blockquote>`;
    case 'hard_break':
      return '<br />';
    case 'horizontal_rule':
      return '<hr class="cms-hr" />';
    case 'code_block':
      return `<pre class="cms-code"><code>${inner}</code></pre>`;
    case 'image': {
      const src = escapeHtml(String(node.attrs?.src ?? ''));
      const alt = escapeHtml(String(node.attrs?.alt ?? ''));
      if (!src) return '';
      return `<figure class="cms-figure"><img src="${src}" alt="${alt}" loading="lazy" decoding="async" /></figure>`;
    }
    default:
      return inner;
  }
}

function applyMarks(text: string, marks: RichTextNode['marks']): string {
  if (!marks?.length) return text;

  let out = text;
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        out = `<strong>${out}</strong>`;
        break;
      case 'italic':
        out = `<em>${out}</em>`;
        break;
      case 'underline':
        out = `<u>${out}</u>`;
        break;
      case 'strike':
        out = `<s>${out}</s>`;
        break;
      case 'code':
        out = `<code>${out}</code>`;
        break;
      case 'link': {
        const href = escapeHtml(mark.attrs?.href ?? '#');
        const target = mark.attrs?.target;
        const rel = target === '_blank' ? ' rel="noopener noreferrer"' : '';
        const targetAttr = target ? ` target="${escapeHtml(target)}"` : '';
        out = `<a href="${href}"${targetAttr}${rel}>${out}</a>`;
        break;
      }
      case 'styled':
        if (mark.attrs?.class) {
          out = `<span class="${escapeHtml(mark.attrs.class)}">${out}</span>`;
        }
        break;
    }
  }
  return out;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(new RegExp('<', 'g'), '&lt;')
    .replace(new RegExp('>', 'g'), '&gt;')
    .replace(/"/g, '&quot;');
}
