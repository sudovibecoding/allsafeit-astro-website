#!/usr/bin/env tsx
/**
 * Build Storyblok service pillar stories from archived Astro page sources.
 * Preserves full copy, section order, and accordion/card data.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CYBERSECURITY_FAQS } from '../../../src/data/faqs/cybersecurity';
import { IT_CONSULTING_FAQS } from '../../../src/data/faqs/it-consulting';
import { IT_INFRASTRUCTURE_FAQS } from '../../../src/data/faqs/it-infrastructure';
import { MANAGED_IT_FAQS } from '../../../src/data/faqs/managed-it';
import { blok } from '../blok-utils';
import {
  contactSection,
  faqSection,
  heroService,
  locationCards,
  pageStory,
  sectionIntro,
  serviceCardList,
  splitLeft,
  splitRight,
  whyChooseAccordion,
} from '../page-helpers';

const ARCHIVE_DIR = resolve(import.meta.dirname, '../../../src/pages/_archive/services');

type ServiceItem = { title: string; description: string; href?: string; cta?: string };
type AccordionItem = { label: string; body: string; icon?: string };

interface PillarConfig {
  file: string;
  slug: string;
  name: string;
  faqs: Array<{ q: string; a: string }>;
}

function splitAstro(filePath: string) {
  const raw = readFileSync(filePath, 'utf8');
  const parts = raw.split(/^---\r?\n/m);
  if (parts.length < 3) throw new Error(`Invalid astro file: ${filePath}`);
  return { frontmatter: parts[1], template: parts.slice(2).join('---\n') };
}

function attr(tag: string, name: string): string | undefined {
  const quoted = tag.match(new RegExp(`${name}="([^"]*)"`));
  if (quoted) return quoted[1];
  const braced = tag.match(new RegExp(`${name}=\\{\\{?([^}]+)\\}?\\}`));
  return braced?.[1]?.trim();
}

function hasAttr(tag: string, name: string): boolean {
  return new RegExp(`\\b${name}\\b`).test(tag);
}

function parseJsArray<T>(frontmatter: string, varName: string): T[] {
  const re = new RegExp(`const ${varName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`);
  const m = frontmatter.match(re);
  if (!m) return [];
  try {
    return new Function(`return ${m[1]};`)() as T[];
  } catch {
    return [];
  }
}

function parseJsObject(frontmatter: string, varName: string): Record<string, unknown> | null {
  const re = new RegExp(`const ${varName}\\s*=\\s*(\\{[\\s\\S]*?\\});`);
  const m = frontmatter.match(re);
  if (!m) return null;
  try {
    return new Function(`return ${m[1]};`)() as Record<string, unknown>;
  } catch {
    return null;
  }
}

function innerHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return '';
  if (trimmed.includes('<')) return trimmed;
  return trimmed
    .split(/\n\n+/)
    .map((p) => `<p class="body-text">${p.trim()}</p>`)
    .join('');
}

function parseHero(template: string) {
  const m = template.match(/<HeroService\s+([\s\S]*?)\/>/);
  if (!m) throw new Error('HeroService not found');
  const tag = m[1];
  const videoBlock = template.match(/video=\{\{([\s\S]*?)\}\}/)?.[1] ?? '';
  const poster = videoBlock.match(/poster:\s*'([^']*)'/)?.[1];
  const mp4 = videoBlock.match(/mp4:\s*'([^']*)'/)?.[1];
  const webm = videoBlock.match(/webm:\s*'([^']*)'/)?.[1];
  return {
    heading: attr(tag, 'heading') ?? '',
    lead: attr(tag, 'lead') ?? '',
    poster,
    mp4,
    webm,
  };
}

function parseBaseMeta(template: string) {
  const m = template.match(/<Base\s+([\s\S]*?)>/);
  if (!m) throw new Error('Base not found');
  const tag = m[1];
  return {
    title: attr(tag, 'title') ?? '',
    description: attr(tag, 'description') ?? '',
    canonical: attr(tag, 'canonical') ?? '',
  };
}

function parseBlocks(
  template: string,
  frontmatter: string,
  faqs: Array<{ q: string; a: string }>,
) {
  const blocks: ReturnType<typeof blok>[] = [];
  const re =
    /<(SectionIntro|SplitContent|ServiceCardList|WhyChooseAccordion|LocationCards|FaqSection|ContactSection)\s*([\s\S]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(template)) !== null) {
    const name = match[1];
    const tag = match[2];
    const inner = match[3] ?? '';

    switch (name) {
      case 'SectionIntro': {
        const heading = attr(tag, 'heading') ?? '';
        blocks.push(sectionIntro(heading, innerHtml(inner)));
        break;
      }
      case 'SplitContent': {
        const heading = attr(tag, 'heading') ?? '';
        const image = attr(tag, 'image') ?? '';
        const imageAlt = attr(tag, 'imageAlt') ?? '';
        const bg = (attr(tag, 'bg') as 'white' | 'gradient' | undefined) ?? 'white';
        const body = innerHtml(inner);
        if (hasAttr(tag, 'imageRight')) {
          blocks.push(splitRight(heading, body, image, imageAlt, bg));
        } else {
          blocks.push(splitLeft(heading, body, image, imageAlt, bg));
        }
        break;
      }
      case 'ServiceCardList': {
        const heading = attr(tag, 'heading') ?? '';
        const lead = attr(tag, 'lead') ?? '';
        const itemsVar = tag.match(/items=\{(\w+)\}/)?.[1] ?? 'coreServices';
        const items = parseJsArray<ServiceItem>(frontmatter, itemsVar);
        blocks.push(serviceCardList(heading, lead, items));
        break;
      }
      case 'WhyChooseAccordion': {
        const heading = attr(tag, 'heading') ?? '';
        const intro = attr(tag, 'intro') ?? '';
        const image = attr(tag, 'image') ?? '';
        const imageAlt = attr(tag, 'imageAlt') ?? '';
        const itemsVar = tag.match(/items=\{(\w+)\}/)?.[1] ?? 'additionalServices';
        const items = parseJsArray<AccordionItem>(frontmatter, itemsVar);
        const bg = (attr(tag, 'bg') as 'white' | 'gradient' | undefined) ?? 'gradient';
        blocks.push(
          whyChooseAccordion(
            heading,
            intro,
            items.map((i) => ({ label: i.label, body: i.body })),
            image,
            imageAlt,
            hasAttr(tag, 'imageLeft'),
            bg === 'plain' ? 'white' : bg,
            undefined,
          ),
        );
        // Re-attach icon_html on accordion items via custom blok patch
        const last = blocks[blocks.length - 1];
        if (last.component === 'why_choose_accordion' && Array.isArray(last.items)) {
          last.items = (last.items as ReturnType<typeof blok>[]).map((item, idx) => ({
            ...item,
            icon_html: items[idx]?.icon,
          }));
        }
        break;
      }
      case 'LocationCards': {
        blocks.push(locationCards(attr(tag, 'heading') ?? undefined));
        break;
      }
      case 'FaqSection': {
        const heading = attr(tag, 'heading') ?? 'Frequently Asked Questions';
        blocks.push(faqSection(heading, faqs));
        break;
      }
      case 'ContactSection': {
        const heading = attr(tag, 'heading') ?? undefined;
        const bodyMatch = tag.match(/body=\{`([\s\S]*?)`\}/);
        const bodyQuoted = attr(tag, 'body');
        const body = bodyMatch?.[1] ?? bodyQuoted;
        blocks.push(contactSection(heading, body));
        break;
      }
    }
  }

  return blocks;
}

function buildPillar(config: PillarConfig) {
  const filePath = join(ARCHIVE_DIR, `${config.file}.astro`);
  const { frontmatter, template } = splitAstro(filePath);
  const meta = parseBaseMeta(template);
  const hero = parseHero(template);
  const serviceSchema = parseJsObject(frontmatter, 'serviceSchema');
  const breadcrumbSchema = parseJsObject(frontmatter, 'breadcrumbSchema');

  const body = [
    heroService(hero.heading, hero.lead, {
      poster: hero.poster,
      mp4: hero.mp4,
      webm: hero.webm,
    }),
    ...parseBlocks(template, frontmatter, config.faqs),
  ];

  return {
    slug: config.slug,
    name: config.name,
    content: pageStory(
      {
        meta_title: meta.title,
        meta_description: meta.description,
        canonical: meta.canonical,
        schema_json: JSON.stringify(
          [serviceSchema, breadcrumbSchema].filter(Boolean),
          null,
          2,
        ),
      },
      body,
    ),
  };
}

export const servicePillarPages = [
  buildPillar({
    file: 'managed-it',
    slug: 'services/managed-it',
    name: 'Managed IT Services',
    faqs: MANAGED_IT_FAQS,
  }),
  buildPillar({
    file: 'cybersecurity',
    slug: 'services/cybersecurity',
    name: 'Cybersecurity Services',
    faqs: CYBERSECURITY_FAQS,
  }),
  buildPillar({
    file: 'it-consulting',
    slug: 'services/it-consulting',
    name: 'IT Consulting',
    faqs: IT_CONSULTING_FAQS,
  }),
  buildPillar({
    file: 'it-infrastructure-and-cloud',
    slug: 'services/it-infrastructure-and-cloud',
    name: 'IT Infrastructure & Cloud',
    faqs: IT_INFRASTRUCTURE_FAQS,
  }),
];
