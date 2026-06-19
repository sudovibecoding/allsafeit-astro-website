import type { LocationConfig } from '../../src/data/secondary-locations';
import { DEFAULT_SERVICE_CARDS } from '../../src/lib/storyblok-defaults';
import { blok, bodyField, faqItems, headingText, heroLead, introField, localImage, richText } from './blok-utils';

function serviceCards(heading?: string) {
  return blok('service_card_grid', {
    heading: headingText(heading ?? 'Our Complete Managed IT & Cybersecurity Services'),
    lead: richText('We simplify technology into clear systems designed to help you win.'),
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

export function buildLocationBody(loc: LocationConfig) {
  const body: ReturnType<typeof blok>[] = [];

  body.push(
    blok('hero_service', {
      heading: headingText(loc.heroHeading),
      lead: heroLead(loc.heroLead),
      ...localImage(loc.heroImage),
      image_alt: loc.heroImageAlt,
    }),
  );

  body.push(
    blok('intro_split', {
      heading: headingText(loc.problemStatementHeading),
      ...bodyField(loc.problemStatementBody),
      ...localImage(loc.problemStatementImage),
      image_alt: loc.problemStatementImageAlt,
    }),
  );

  if (loc.hasValueMetrics && loc.valueMetrics.length) {
    body.push(
      blok('value_metrics', {
        heading: headingText(loc.valueMetricsHeading),
        metrics: loc.valueMetrics.map((m) =>
          blok('metric_item', {
            label: m.label,
            body: (m as { body?: string }).body ? richText((m as { body?: string }).body!) : undefined,
            icon_html: (m as { icon?: string }).icon,
            icon_class: (m as { iconClass?: string }).iconClass,
          }),
        ),
      }),
    );
  }

  body.push(serviceCards(loc.servicesOverviewHeading || undefined));

  if (loc.hasIndustries && loc.industries.length) {
    body.push(
      blok('numbered_list_split', {
        heading: headingText(loc.industriesHeading),
        intro: richText(loc.industriesIntro),
        ...localImage(loc.industriesImage),
        image_alt: loc.industriesImageAlt,
        background: 'white',
        items: loc.industries.map((i) =>
          blok('numbered_item', { term: i.term, ...bodyField(i.body) }),
        ),
      }),
    );
  }

  if (loc.hasWhyChoose && loc.whyChooseItems.length) {
    body.push(
      blok('why_choose_accordion', {
        heading: headingText(loc.whyChooseHeading),
        ...introField(loc.whyChooseIntro),
        ...localImage(loc.whyChooseImage),
        image_alt: loc.whyChooseImageAlt,
        image_left: true,
        background: 'gradient',
        items: loc.whyChooseItems.map((i) =>
          blok('accordion_item', { label: i.label, ...bodyField(i.body) }),
        ),
      }),
    );
  }

  body.push(blok('testimonials_slider', {}));

  if (loc.faqs.length) {
    body.push(
      blok('faq_section', {
        heading: headingText(loc.faqHeading),
        items: faqItems(loc.faqs),
      }),
    );
  }

  body.push(blok('contact_section', {}));

  return body;
}

export function locationStoryContent(loc: LocationConfig) {
  return {
    component: 'page',
    meta_title: loc.title,
    meta_description: loc.description,
    canonical: loc.canonical,
    schema_json: JSON.stringify(loc.schema, null, 2),
    body: buildLocationBody(loc),
  };
}
