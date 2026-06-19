import { INDUSTRIES } from '../../src/data/industries';
import { DEFAULT_SERVICE_CARDS } from '../../src/lib/storyblok-defaults';
import { blok, bodyField, faqItems, headingText, headingWithBreak, heroLead, introField, localImage, richText, richtextField } from './blok-utils';

export interface PageStoryMeta {
  meta_title: string;
  meta_description: string;
  canonical: string;
  preview_path?: string;
  schema_json?: string;
  indexable?: boolean;
}

export function pageStory(meta: PageStoryMeta, body: ReturnType<typeof blok>[]) {
  const previewPath =
    meta.preview_path ??
    (meta.canonical ? new URL(meta.canonical).pathname : undefined);
  return {
    component: 'page',
    meta_title: meta.meta_title,
    meta_description: meta.meta_description,
    canonical: meta.canonical,
    ...(previewPath ? { preview_path: previewPath } : {}),
    indexable: meta.indexable ?? true,
    ...(meta.schema_json ? { schema_json: meta.schema_json } : {}),
    body,
  };
}

export function heroCentered(badge: string, title: string) {
  return blok('hero_centered', { badge, title: headingText(title) });
}

export function heroService(
  heading: string,
  lead: string | string[],
  opts: {
    image?: string;
    imageAlt?: string;
    poster?: string;
    mp4?: string;
    webm?: string;
  } = {},
) {
  return blok('hero_service', {
    heading: headingText(heading),
    lead: heroLead(Array.isArray(lead) ? lead.join('\n\n') : lead),
    ...(opts.image ? localImage(opts.image) : {}),
    image_alt: opts.imageAlt,
    ...(opts.poster ? { poster_path: opts.poster } : {}),
    ...(opts.mp4 ? { mp4_path: opts.mp4 } : {}),
    ...(opts.webm ? { webm_path: opts.webm } : {}),
  });
}

export function sectionIntro(heading: string, body: string) {
  return blok('section_intro', {
    heading: headingText(heading),
    ...bodyField(body),
  });
}

export function splitLeft(
  heading: string,
  body: string,
  image: string,
  imageAlt: string,
  bg: 'white' | 'gradient' = 'white',
) {
  return blok('content_image_left', {
    heading: headingText(heading),
    ...bodyField(body),
    ...localImage(image),
    image_alt: imageAlt,
    background: bg,
  });
}

export function splitRight(
  heading: string,
  body: string,
  image: string,
  imageAlt: string,
  bg: 'white' | 'gradient' = 'white',
) {
  return blok('content_image_right', {
    heading: headingText(heading),
    ...bodyField(body),
    ...localImage(image),
    image_alt: imageAlt,
    background: bg,
  });
}

export function wideImage(image: string, imageAlt: string, bg: 'white' | 'gradient' = 'white') {
  return blok('wide_image', {
    ...localImage(image),
    image_alt: imageAlt,
    background: bg,
  });
}

export function valueMetrics(
  heading: string,
  metrics: Array<{ label: string; body: string; icon_html?: string }>,
) {
  return blok('value_metrics', {
    heading: headingText(heading),
    metrics: metrics.map((m) =>
      blok('metric_item', {
        label: m.label,
        body: richText(m.body),
        icon_html: m.icon_html,
      }),
    ),
  });
}

export function faqSection(heading: string, faqs: Array<{ q: string; a: string }>) {
  return blok('faq_section', {
    heading: headingText(heading),
    items: faqItems(faqs),
  });
}

export function contactSection(heading?: string, body?: string) {
  return blok('contact_section', {
    ...(heading ? { heading: headingText(heading) } : {}),
    ...(body ? bodyField(body) : {}),
  });
}

export function serviceCardGrid(heading?: string, lead?: string) {
  return blok('service_card_grid', {
    heading: headingText(heading ?? 'Our Complete Managed IT & Cybersecurity Services'),
    lead: richText(lead ?? 'We simplify technology into clear systems designed to help you win.'),
    cards: DEFAULT_SERVICE_CARDS.map((c) =>
      blok('service_card', {
        heading: c.heading,
        tagline: c.tagline,
        body: richText(c.body),
        href: c.href,
        link_label: c.link_label,
        ...(c.icon_image?.filename ? localImage(c.icon_image.filename) : {}),
      }),
    ),
  });
}

export function serviceCardList(
  heading: string,
  lead: string,
  items: Array<{ title: string; description: string; href?: string; cta?: string }>,
  defaultHref = '/contact-us',
) {
  return blok('service_card_list', {
    heading: headingText(heading),
    lead: richText(lead),
    default_href: defaultHref,
    items: items.map((i) =>
      blok('service_list_item', {
        title: i.title,
        ...(i.description.includes('<')
          ? { description_html: i.description }
          : { description: richText(i.description) }),
        href: i.href,
        cta: i.cta,
      }),
    ),
  });
}

export function tabsSection(
  heading: string,
  lead: string,
  tabs: Array<{ label: string; content: string }>,
  bg: 'white' | 'gradient' = 'gradient',
) {
  return blok('tabs_section', {
    heading: headingText(heading),
    lead: richText(lead),
    background: bg,
    tabs: tabs.map((t) =>
      blok('tab_item', {
        label: t.label,
        content_html: t.content,
      }),
    ),
  });
}

export function legalPage(title: string, lastUpdated: string, bodyHtml: string) {
  return blok('legal_page', {
    title,
    last_updated: lastUpdated,
    ...bodyField(bodyHtml),
  });
}

export function customHtml(html: string) {
  return blok('custom_html', { html });
}

export function locationCards(heading?: string) {
  return blok('location_cards', { heading });
}

export function problemsGrid(
  heading: string,
  intro: string,
  problems: Array<{ title: string; body: string; icon?: string }>,
) {
  return blok('problems_grid', {
    heading,
    intro: richText(intro),
    problems: problems.map((p) =>
      blok('problem_item', {
        title: p.title,
        ...(p.body.includes('<') ? bodyField(p.body) : { body: richText(p.body) }),
        icon_html: p.icon,
      }),
    ),
  });
}

export function numberedListSplit(
  heading: string,
  intro: string,
  items: Array<{ term: string; body: string }>,
  image: string,
  imageAlt: string,
  outro?: string,
) {
  return blok('numbered_list_split', {
    heading: headingText(heading),
    intro: richText(intro),
    outro: outro ? richText(outro) : undefined,
    ...localImage(image),
    image_alt: imageAlt,
    background: 'white',
    items: items.map((i) =>
      blok('numbered_item', {
        term: i.term,
        body: richText(i.body),
      }),
    ),
  });
}

export function whyChooseAccordion(
  heading: string,
  intro: string,
  items: Array<{ label: string; body: string }>,
  image: string,
  imageAlt: string,
  imageLeft = false,
  bg: 'white' | 'gradient' = 'gradient',
  introHtml?: string,
) {
  return blok('why_choose_accordion', {
    heading: headingText(heading),
    ...(introHtml ? { intro_html: introHtml } : { intro: richText(intro) }),
    ...localImage(image),
    image_alt: imageAlt,
    image_left: imageLeft,
    background: bg,
    items: items.map((i) =>
      blok('accordion_item', { label: i.label, ...bodyField(i.body) }),
    ),
  });
}

export function introSplit(
  heading: string,
  body: string,
  image: string,
  imageAlt: string,
  bodyHtml?: string,
) {
  return blok('intro_split', {
    heading: headingText(heading),
    ...(bodyHtml ? bodyField(bodyHtml) : { body: richText(body) }),
    ...localImage(image),
    image_alt: imageAlt,
  });
}

export function onboardingProcess(
  heading: string,
  phases: Array<{ number: number; title: string; body: string }>,
  image: string,
  imageAlt: string,
) {
  return blok('onboarding_process', {
    heading: headingWithBreak(heading),
    ...localImage(image),
    image_alt: imageAlt,
    phases: phases.map((p) =>
      blok('onboarding_phase', {
        number: String(p.number),
        title: p.title,
        body: richText(p.body),
      }),
    ),
  });
}

export function serviceAreasBlock(
  heading: string,
  bodyHtml: string,
  opts: {
    mapEmbedUrl?: string;
    addressLine?: string;
    pinLabel?: string;
    bg?: 'gradient' | 'plain';
  } = {},
) {
  return blok('service_areas', {
    heading,
    body_html: bodyHtml,
    map_embed_url: opts.mapEmbedUrl,
    address_line: opts.addressLine,
    pin_label: opts.pinLabel,
    background: opts.bg ?? 'gradient',
  });
}

export function industriesGrid(heading?: string) {
  const title =
    heading ?? 'Industries We Serve: <br>Managed IT Solutions for California Businesses';
  return blok('industries_grid', {
    heading: title.includes('<') ? headingWithBreak(title) : headingText(title),
    cards: INDUSTRIES.map((ind) =>
      blok('industry_card', {
        heading: ind.heading,
        description: richText(ind.desc),
        href: ind.href,
        icon_white_path: ind.iconWhite,
        icon_blue_path: ind.iconBlue,
      }),
    ),
  });
}

export function contactFormSection(badge: string, heading: string, subheading: string) {
  return blok('contact_form_section', {
    badge,
    heading: headingText(heading),
    subheading,
  });
}

export function contactInfoSection(
  heading: string,
  salesPhone: string,
  supportPhone: string,
  locations: Array<{ city: string; address: string; city_line: string }>,
) {
  return blok('contact_info_section', {
    heading,
    sales_phone: salesPhone,
    support_phone: supportPhone,
    locations: locations.map((loc) =>
      blok('contact_location', {
        city: loc.city,
        address: loc.address,
        city_line: loc.city_line,
      }),
    ),
  });
}
