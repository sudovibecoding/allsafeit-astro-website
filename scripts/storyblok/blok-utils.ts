import { randomUUID } from 'node:crypto';
import { htmlToStoryblokRichtext } from './html-to-richtext';

/** Storyblok nested bloks require a unique `_uid` when created via Management API. */
export function blok(component: string, fields: Record<string, unknown> = {}) {
  return { _uid: randomUUID(), component, ...fields };
}

/** Store local /public image paths in a text field — valid for Storyblok publish. */
export function localImage(path?: string | null) {
  if (!path) return {};
  return { image_path: path };
}

export function faqItems(faqs: Array<{ q: string; a: string }>) {
  return faqs.map((f) => blok('faq_item', { q: f.q, a: richText(f.a) }));
}

export function heroLead(lead: string | string[]) {
  const text = Array.isArray(lead) ? lead.join('\n\n') : lead;
  return richText(text);
}

export function richText(value: string) {
  if (!value?.trim()) return emptyDoc();
  if (value.includes('<')) return htmlToStoryblokRichtext(value);
  return textToDoc(value);
}

/** Convert HTML/plain text into a named richtext field (e.g. bio, overview). */
export function richtextField(name: string, text: string) {
  if (text?.includes('<')) return { [name]: htmlToStoryblokRichtext(text) };
  return { [name]: richText(text) };
}

/** Prefer richtext; convert HTML to Storyblok doc when markup is present. */
export function bodyField(text: string) {
  return richtextField('body', text);
}

export function introField(text: string) {
  if (text?.includes('<')) return { intro_html: text };
  return { intro: richText(text) };
}

export function headingText(value: string) {
  const plain = value.replace(/<[^>]+>/g, '').trim();
  if (!plain) return emptyDoc();
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: plain }],
      },
    ],
  };
}

/** Heading richtext with optional `<br>` line breaks (e.g. onboarding title). */
export function headingWithBreak(value: string) {
  const parts = value.split(/<br\s*\/?>/i).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return headingText(value);
  const content: Array<{ type: string; text?: string }> = [];
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) content.push({ type: 'hard_break' });
    content.push({ type: 'text', text: parts[i] });
  }
  return {
    type: 'doc',
    content: [{ type: 'heading', attrs: { level: 2 }, content }],
  };
}

function emptyDoc() {
  return { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
}

function textToDoc(text: string) {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  return {
    type: 'doc',
    content: (paragraphs.length ? paragraphs : [text]).map((p) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: p.trim() }],
    })),
  };
}

function htmlToDoc(html: string) {
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
  return textToDoc(text);
}

/** @deprecated Use localImage() */
export function asset(path?: string | null) {
  return localImage(path);
}
