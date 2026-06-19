/**
 * Convert HTML (from MDX migration) → Storyblok richtext JSON.
 * Preserves paragraphs, headings, lists, links, bold/italic, images, blockquotes.
 */

type RichTextMark = { type: string; attrs?: Record<string, string | null> };
type RichTextNode = {
  type: string;
  text?: string;
  marks?: RichTextMark[];
  content?: RichTextNode[];
  attrs?: Record<string, string | number | null>;
};

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph', content: [] }] };

export function htmlToStoryblokRichtext(html: string): typeof EMPTY_DOC {
  const trimmed = html?.trim();
  if (!trimmed) return structuredClone(EMPTY_DOC);

  const blocks = splitTopLevelBlocks(trimmed);
  const content: RichTextNode[] = [];

  for (const block of blocks) {
    const node = parseBlock(block);
    if (node) content.push(node);
  }

  if (!content.length) {
    const inline = parseInline(trimmed);
    if (inline.length) content.push({ type: 'paragraph', content: inline });
  }

  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph', content: [] }] };
}

function splitTopLevelBlocks(html: string): string[] {
  const blocks: string[] = [];
  const blockRe =
    /<(p|h[1-6]|ul|ol|blockquote|figure|pre|hr)\b[^>]*>[\s\S]*?<\/\1>|<hr\b[^>]*\/?>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(html)) !== null) {
    const before = html.slice(lastIndex, match.index).trim();
    if (before) blocks.push(before);
    blocks.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  const tail = html.slice(lastIndex).trim();
  if (tail) blocks.push(tail);

  return blocks;
}

function parseBlock(html: string): RichTextNode | null {
  const trimmed = html.trim();
  if (!trimmed) return null;

  const hrMatch = trimmed.match(/^<hr\b[^>]*\/?>$/i);
  if (hrMatch) return { type: 'horizontal_rule' };

  const headingMatch = trimmed.match(/^<h([1-6])\b[^>]*>([\s\S]*)<\/h\1>$/i);
  if (headingMatch) {
    return {
      type: 'heading',
      attrs: { level: Number(headingMatch[1]) },
      content: parseInline(headingMatch[2]),
    };
  }

  const pMatch = trimmed.match(/^<p\b[^>]*>([\s\S]*)<\/p>$/i);
  if (pMatch) {
    return { type: 'paragraph', content: parseInline(pMatch[1]) };
  }

  const bqMatch = trimmed.match(/^<blockquote\b[^>]*>([\s\S]*)<\/blockquote>$/i);
  if (bqMatch) {
    return { type: 'blockquote', content: [{ type: 'paragraph', content: parseInline(bqMatch[1]) }] };
  }

  const ulMatch = trimmed.match(/^<ul\b[^>]*>([\s\S]*)<\/ul>$/i);
  if (ulMatch) return parseList(ulMatch[1], 'bullet_list');

  const olMatch = trimmed.match(/^<ol\b[^>]*>([\s\S]*)<\/ol>$/i);
  if (olMatch) return parseList(olMatch[1], 'ordered_list');

  const figureMatch = trimmed.match(/^<figure\b[^>]*>[\s\S]*?<img\b([^>]*)>[\s\S]*?<\/figure>$/i);
  if (figureMatch) {
    const attrs = parseAttributes(figureMatch[1]);
    const src = attrs.src ?? '';
    if (src) {
      return {
        type: 'image',
        attrs: {
          alt: attrs.alt ?? '',
          src,
          title: attrs.title ?? null,
          copyright: null,
          source: '',
        },
      };
    }
  }

  const imgMatch = trimmed.match(/^<img\b([^>]*)\/?>$/i);
  if (imgMatch) {
    const attrs = parseAttributes(imgMatch[1]);
    const src = attrs.src ?? '';
    if (src) {
      return {
        type: 'image',
        attrs: {
          alt: attrs.alt ?? '',
          src,
          title: attrs.title ?? null,
          copyright: null,
          source: '',
        },
      };
    }
  }

  const preMatch = trimmed.match(/^<pre\b[^>]*><code\b[^>]*>([\s\S]*)<\/code><\/pre>$/i);
  if (preMatch) {
    return {
      type: 'code_block',
      attrs: { class: null },
      content: [{ type: 'text', text: decodeEntities(stripTags(preMatch[1])) }],
    };
  }

  if (!trimmed.startsWith('<')) {
    return { type: 'paragraph', content: parseInline(trimmed) };
  }

  return { type: 'paragraph', content: parseInline(stripTags(trimmed)) };
}

function parseList(inner: string, listType: 'bullet_list' | 'ordered_list'): RichTextNode {
  const items: RichTextNode[] = [];
  const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;
  while ((match = liRe.exec(inner)) !== null) {
    items.push({
      type: 'list_item',
      content: [{ type: 'paragraph', content: parseInline(match[1]) }],
    });
  }
  return { type: listType, content: items };
}

function parseInline(html: string): RichTextNode[] {
  const nodes: RichTextNode[] = [];
  const tokenRe =
    /<(a|strong|b|em|i|u|code|br)\b([^>]*)>([\s\S]*?)<\/\1>|<br\s*\/?>|([^<]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(html)) !== null) {
    const tag = match[1]?.toLowerCase();
    const attrs = match[2] ?? '';
    const inner = match[3] ?? '';
    const text = match[4];

    if (text) {
      appendText(nodes, decodeEntities(text));
      continue;
    }

    if (!tag || tag === 'br') {
      nodes.push({ type: 'hard_break' });
      continue;
    }

    const childNodes = parseInline(inner);
    const marks = tagToMarks(tag, attrs);

    if (marks.length) {
      for (const child of childNodes) {
        if (child.type === 'text') {
          nodes.push({
            type: 'text',
            text: child.text,
            marks: mergeMarks(child.marks, marks),
          });
        } else {
          nodes.push(child);
        }
      }
    } else {
      nodes.push(...childNodes);
    }
  }

  return coalesceText(nodes);
}

function tagToMarks(tag: string, attrs: string): RichTextMark[] {
  switch (tag) {
    case 'strong':
    case 'b':
      return [{ type: 'bold' }];
    case 'em':
    case 'i':
      return [{ type: 'italic' }];
    case 'u':
      return [{ type: 'underline' }];
    case 'code':
      return [{ type: 'code' }];
    case 'a': {
      const { href, target } = parseAttributes(attrs);
      return [
        {
          type: 'link',
          attrs: {
            href: href ?? '#',
            uuid: null,
            anchor: null,
            target: target ?? '_self',
            linktype: 'url',
          },
        },
      ];
    }
    default:
      return [];
  }
}

function mergeMarks(
  existing: RichTextMark[] | undefined,
  extra: RichTextMark[],
): RichTextMark[] {
  return [...(existing ?? []), ...extra];
}

function appendText(nodes: RichTextNode[], text: string) {
  const cleaned = text.replace(/\s+/g, ' ');
  if (!cleaned.trim()) return;
  const last = nodes[nodes.length - 1];
  if (last?.type === 'text' && !last.marks?.length) {
    last.text = (last.text ?? '') + cleaned;
  } else {
    nodes.push({ type: 'text', text: cleaned });
  }
}

function coalesceText(nodes: RichTextNode[]): RichTextNode[] {
  const out: RichTextNode[] = [];
  for (const node of nodes) {
    if (node.type !== 'text') {
      out.push(node);
      continue;
    }
    const prev = out[out.length - 1];
    const sameMarks =
      JSON.stringify(prev?.marks ?? []) === JSON.stringify(node.marks ?? []);
    if (prev?.type === 'text' && sameMarks) {
      prev.text = (prev.text ?? '') + (node.text ?? '');
    } else {
      out.push({ ...node });
    }
  }
  return out.filter((n) => n.type !== 'text' || (n.text ?? '').length > 0);
}

function parseAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /(\w+)=("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw)) !== null) {
    attrs[match[1]] = match[3] ?? match[4] ?? match[5] ?? '';
  }
  return attrs;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Walk a story content tree and convert body_html → body richtext fields. */
export function convertHtmlFieldsInTree(node: Record<string, unknown>): boolean {
  let changed = false;

  if (typeof node.body_html === 'string' && node.body_html.trim()) {
    node.body = htmlToStoryblokRichtext(node.body_html);
    delete node.body_html;
    changed = true;
  }

  if (typeof node.bio_html === 'string' && node.bio_html.trim()) {
    node.bio = htmlToStoryblokRichtext(node.bio_html);
    delete node.bio_html;
    changed = true;
  }

  if (typeof node.overview_html === 'string' && node.overview_html.trim()) {
    node.overview = htmlToStoryblokRichtext(node.overview_html);
    delete node.overview_html;
    changed = true;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object') {
          if (convertHtmlFieldsInTree(item as Record<string, unknown>)) changed = true;
        }
      }
    }
  }

  return changed;
}
