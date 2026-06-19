/**
 * HTML → MDX conversion (Webflow rich text → Markdown body for MDX files).
 *
 * Uses Turndown with custom rules for Webflow's quirks:
 *   - <figure class="w-richtext-figure-type-image"> → ![alt](src) (and rewrite asset URL)
 *   - <div class="w-embed">…</div> → keep raw HTML in MDX, log for review
 *   - <a href="..."> → standard Markdown links
 *   - Tables, strikethrough, task lists via the GFM plugin
 *
 * Output is intentionally **MDX-compatible Markdown** — i.e. raw HTML is
 * preserved (MDX accepts it). We don't try to map Webflow custom embeds
 * to React components; that's a future enhancement.
 */
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { rewriteUrl } from "./assets.js";

interface Flags {
  // Slot for warnings collected during conversion (e.g. w-embed blocks).
  warnings: string[];
}

export function createConverter(flags: Flags): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    emDelimiter: "_",
    bulletListMarker: "-",
    hr: "---",
    // Preserve <br> as a hard line break
    br: "  ",
  });

  td.use(gfm);

  // ── Webflow image figure ──
  // Webflow wraps body images in <figure class="w-richtext-figure-type-image">
  // containing a div and an img. We collapse to a plain Markdown image
  // and rewrite the asset URL to local.
  td.addRule("webflowImageFigure", {
    filter: (node) => {
      if (node.nodeName !== "FIGURE") return false;
      const c = node.getAttribute("class") || "";
      return /w-richtext-figure-type-image/.test(c);
    },
    replacement: (_content, node) => {
      const img = (node as Element).querySelector?.("img");
      if (!img) return "";
      const src = img.getAttribute("src") || "";
      const alt = (img.getAttribute("alt") || "").replace(/\]/g, "\\]");
      const localSrc = rewriteUrl(src);
      return `\n\n![${alt}](${localSrc})\n\n`;
    },
  });

  // ── Standalone <img> outside figures ──
  td.addRule("webflowBareImage", {
    filter: "img",
    replacement: (_content, node) => {
      const el = node as Element;
      const src = el.getAttribute("src") || "";
      const alt = (el.getAttribute("alt") || "").replace(/\]/g, "\\]");
      const localSrc = rewriteUrl(src);
      return `![${alt}](${localSrc})`;
    },
  });

  // ── Webflow embed blocks ──
  // <div class="w-embed">…</div> typically contains custom HTML / scripts.
  // Markdown can't represent script tags safely. MDX accepts raw HTML, so
  // we preserve the inner HTML verbatim and flag for editor review.
  td.addRule("webflowEmbed", {
    filter: (node) => {
      if (node.nodeName !== "DIV") return false;
      const c = node.getAttribute("class") || "";
      return /\bw-embed\b/.test(c) || /\bw-html-embed\b/.test(c);
    },
    replacement: (_content, node) => {
      const html = (node as Element).innerHTML || "";
      flags.warnings.push(`Preserved raw <w-embed> block (review required)`);
      return `\n\n${html}\n\n`;
    },
  });

  // ── Webflow video embed ──
  // <figure class="w-richtext-figure-type-video">…<iframe>…</iframe>
  // We keep the iframe HTML inline. MDX users can replace with a React
  // component (e.g. <YouTube id="…">) later.
  td.addRule("webflowVideoEmbed", {
    filter: (node) => {
      if (node.nodeName !== "FIGURE") return false;
      const c = node.getAttribute("class") || "";
      return /w-richtext-figure-type-video/.test(c);
    },
    replacement: (_content, node) => {
      const iframe = (node as Element).querySelector?.("iframe");
      if (!iframe) return "";
      flags.warnings.push(`Preserved <iframe> video embed (review optional)`);
      return `\n\n${iframe.outerHTML}\n\n`;
    },
  });

  return td;
}

/**
 * Convert a Webflow rich text HTML string to MDX-compatible Markdown.
 *
 * The `warnings` array is mutated with any per-conversion notes (embeds
 * preserved, etc.) — collect these for the run summary.
 *
 * Also escapes stray `{` and `}` characters in the output so MDX doesn't
 * misinterpret them as JSX expressions (e.g. when authors paste raw CSS
 * or template syntax into post bodies).
 */
export function htmlToMdx(html: string, warnings: string[] = []): string {
  if (!html?.trim()) return "";
  const td = createConverter({ warnings });
  const md = td.turndown(html).trim();
  return escapeBracesOutsideCode(md);
}

/**
 * Escape `{` and `}` outside fenced code blocks and inline code spans so
 * MDX renders them as literal characters instead of treating them as JSX
 * expression delimiters. Idempotent — `\{` / `\}` aren't double-escaped.
 *
 * Mirrors `scripts/fix-mdx-curly-braces.mjs` which handles the same
 * problem for already-migrated files.
 */
function escapeBracesOutsideCode(text: string): string {
  let out = "";
  let i = 0;
  const n = text.length;
  while (i < n) {
    if (text.startsWith("```", i)) {
      const end = text.indexOf("```", i + 3);
      if (end === -1) {
        out += text.slice(i);
        break;
      }
      out += text.slice(i, end + 3);
      i = end + 3;
      continue;
    }
    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end !== -1 && !text.slice(i + 1, end).includes("\n")) {
        out += text.slice(i, end + 1);
        i = end + 1;
        continue;
      }
    }
    if (text[i] === "\\" && (text[i + 1] === "{" || text[i + 1] === "}")) {
      out += text[i] + text[i + 1];
      i += 2;
      continue;
    }
    if (text[i] === "{" || text[i] === "}") {
      out += "\\" + text[i];
      i++;
      continue;
    }
    out += text[i];
    i++;
  }
  return out;
}
