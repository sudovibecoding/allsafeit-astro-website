import { renderStoryblokRichText, stripRichTextWrapper } from './storyblok-richtext';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(new RegExp('<', 'g'), '&lt;')
    .replace(new RegExp('>', 'g'), '&gt;')
    .replace(/"/g, '&quot;');
}

/** Render a section heading from plain text or Storyblok richtext (H1–H6 + inline marks). */
export function renderHeading(value: unknown, defaultClass = 'h3'): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<')) return trimmed;
    return `<h2 class="${defaultClass}">${escapeHtml(trimmed)}</h2>`;
  }
  if (typeof value === 'object' && value !== null) {
    const doc = value as { type?: string };
    if (doc.type === 'doc') {
      return stripRichTextWrapper(renderStoryblokRichText(value));
    }
  }
  return '';
}

/** Plain-text heading for components that only accept strings. */
export function headingPlainText(value: unknown): string {
  const html = renderHeading(value);
  if (!html) return typeof value === 'string' ? value : '';
  return html.replace(new RegExp('<[^>]+>', 'g'), '').trim();
}

/** Inner HTML for headings rendered inside an existing `<h2 set:html>`. */
export function renderHeadingInner(value: unknown): string {
  const html = renderHeading(value);
  if (!html) return typeof value === 'string' ? value : '';
  const match = html.match(new RegExp('^<h[1-6][^>]*>([\\s\\S]*)</h[1-6]>$'));
  return match?.[1] ?? html;
}
