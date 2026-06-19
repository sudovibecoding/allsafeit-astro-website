import { INDUSTRIES } from '../../src/data/industries';
import { DEFAULT_SERVICE_CARDS } from '../../src/lib/storyblok-defaults';
import { faqSchema, orgSchema } from '../../src/data/schemas';
import { blok, faqItems, headingText, localImage, richText } from './blok-utils';
import { homePresetBloks } from './home-preset-content';

const HOME_FAQS = [
  {
    q: 'What managed IT services do you provide in California?',
    a: 'AllSafe IT provides 24/7 helpdesk support, proactive monitoring, cybersecurity, cloud management, Microsoft 365 administration, backup and disaster recovery, and strategic vCIO planning for California businesses.',
  },
  {
    q: 'How quickly do you respond to IT emergencies?',
    a: 'Our helpdesk responds to critical issues within 15 minutes, 24/7/365. For onsite emergencies in Southern California, we can typically dispatch a technician within 1–2 hours.',
  },
  {
    q: 'Are you SOC 2 certified?',
    a: 'Yes. AllSafe IT is SOC 2 Type II certified. Our security controls are independently audited annually, which means we hold ourselves to the same standards we help our clients achieve.',
  },
  {
    q: 'Do you support businesses outside Los Angeles?',
    a: 'Yes. We serve businesses throughout Southern California including Orange County, Pasadena, and surrounding areas, with remote support available statewide.',
  },
];

export function buildHomeBody() {
  const presets = homePresetBloks();
  return [
    blok('hero_split', {
      title_line1: 'Managed IT Services California:',
      title_line2: ' secure, proactive, reliable.',
      lead:
        'Empowering growth-focused businesses across Southern California with enterprise-grade SOC 2-compliant managed IT services, cybersecurity, cloud infrastructure, and AI automation that amplify what your team can do.',
      cta_text: '[Talk to an Expert]',
      cta_href: '/contact-us',
    }),
    presets.award_marquee,
    blok('section_intro', {
      heading: headingText('Proactive Managed IT Services in California'),
      body: richText(
        "You're tired of talking about tech support. We hear that. It's time for tech to support you.",
      ),
    }),
    blok('service_card_grid', {
      heading: headingText('Our Complete Managed IT & Cybersecurity Services'),
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
    }),
    presets.tired_of_waiting,
    presets.strategic_support,
    presets.it_services_section,
    blok('testimonials_slider'),
    presets.inc_award,
    blok('industries_grid', {
      heading: headingText('Industries We Serve'),
      cards: INDUSTRIES.map((ind) =>
        blok('industry_card', {
          heading: ind.heading,
          description: richText(ind.desc),
          href: ind.href,
          icon_white_path: ind.iconWhite,
          icon_blue_path: ind.iconBlue,
        }),
      ),
    }),
    blok('ebook_cta'),
    blok('location_cards', { heading: 'Areas We Serve' }),
    presets.trust_checklist,
    presets.blog_grid,
    blok('faq_section', {
      heading: headingText('Common Questions About Managed IT Services in California'),
      items: faqItems(HOME_FAQS),
    }),
    blok('contact_section', {
      heading: headingText('Ready to transform your IT?'),
      body: richText(
        'Talk to an AllSafe IT expert about managed IT services, cybersecurity, and strategic technology planning for your business.',
      ),
    }),
  ];
}

export function homeStoryContent() {
  return {
    component: 'page',
    meta_title: 'Managed IT Services California | AllSafe IT',
    meta_description:
      '7x CRN MSP 500 winner. AllSafe IT delivers managed IT services, cybersecurity & 24/7 support to California businesses.',
    canonical: 'https://www.allsafeit.com',
    preview_path: '/',
    schema_json: JSON.stringify([faqSchema, orgSchema], null, 2),
    body: buildHomeBody(),
  };
}
