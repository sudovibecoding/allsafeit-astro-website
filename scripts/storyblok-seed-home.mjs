#!/usr/bin/env node
/**
 * Seeds the Storyblok `home` story body with all homepage sections + default copy.
 * Run after: npm run storyblok:push-components
 *
 * Requires STORYBLOK_MANAGEMENT_TOKEN + STORYBLOK_SPACE_ID in .env
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

function loadEnvFile() {
  try {
    const raw = readFileSync(resolve(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch { /* noop */ }
}

loadEnvFile();

const token =
  process.env.STORYBLOK_MANAGEMENT_TOKEN ||
  (process.env.STORYBLOK_TOKEN?.startsWith('sb_pat_') ? process.env.STORYBLOK_TOKEN : null);
const spaceId = process.env.STORYBLOK_SPACE_ID;

if (!token || !spaceId) {
  console.error('Missing STORYBLOK_MANAGEMENT_TOKEN or STORYBLOK_SPACE_ID');
  process.exit(1);
}

const base = `https://mapi.storyblok.com/v1/spaces/${spaceId}`;

async function api(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${text}`);
  return JSON.parse(text);
}

const { stories } = await api('/stories?with_slug=home');
const story = stories?.[0];
if (!story) {
  console.error('No story with slug `home` found. Create it in Storyblok first.');
  process.exit(1);
}

const body = [
  {
    component: 'hero_split',
    title_line1: 'Managed IT Services California:',
    title_line2: ' secure, proactive, reliable.',
    lead:
      'Empowering growth-focused businesses across Southern California with enterprise-grade SOC 2-compliant managed IT services, cybersecurity, cloud infrastructure, and AI automation that amplify what your team can do.',
    cta_text: '[Talk to an Expert]',
    cta_href: '/contact-us',
  },
  { component: 'award_marquee' },
  {
    component: 'section_intro',
    heading: 'Proactive Managed IT Services in California',
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "You're tired of talking about tech support. We hear that. It's time for tech to support you.",
            },
          ],
        },
      ],
    },
  },
  {
    component: 'service_card_grid',
    heading: 'Our Complete Managed IT & Cybersecurity Services',
    lead: 'We simplify technology into clear systems designed to help you win.',
    cards: [
      {
        component: 'service_card',
        heading: 'Managed IT Services',
        tagline: 'Reliable IT solutions that work for you.',
        body: 'Round the clock monitoring. Proactive maintenance. A help desk with real people who help. We manage Microsoft 365, optimize cloud, and handle day-to-day IT services California businesses need to keep operations running smoothly.',
        href: '/services/managed-it',
        link_label: 'Explore Managed IT Services',
      },
      {
        component: 'service_card',
        heading: 'AllSafe Intelligence',
        tagline: 'AI that amplifies your team.',
        body: 'With your foundation secure, multiply what your team can do. AllSafe Intelligence builds AI-powered workflows and custom agents that work in the real world. Technology becomes a force multiplier for business growth.',
        href: '/services/it-consulting/artificial-intelligence',
        link_label: 'Explore AllSafe Intelligence',
        icon_image: { filename: '/images/happy-robot-white.svg' },
      },
      {
        component: 'service_card',
        heading: 'Infrastructure & Cloud',
        tagline: 'Scalable, cost-effective cloud management.',
        body: "Cloud Solutions that fit your business objectives. We manage Microsoft 365, optimize Azure, and cut what you don't need. Scale infrastructure with confidence as your business operations expand.",
        href: '/services/it-infrastructure-and-cloud',
        link_label: 'Explore Infrastructure & Cloud',
      },
      {
        component: 'service_card',
        heading: 'Managed Cybersecurity',
        tagline: 'Security that lets you focus on winning.',
        body: 'We run 24/7 Managed Detection and Response. Real humans actively respond to cyber threats. Safe Cloud monitors business email compromise and AI-powered attacks that traditional security misses.',
        href: '/services/cybersecurity',
        link_label: 'Explore Managed Cybersecurity',
      },
      {
        component: 'service_card',
        heading: 'IT Consulting Services',
        tagline: 'Strategic planning turning IT into a business asset.',
        body: 'vCIO planning turns IT management from a cost center into a strategic advantage. Budget for growth, not repairs. We anticipate your business needs before they arise through strategic planning and deep expertise.',
        href: '/services/it-consulting',
        link_label: 'Explore IT Consulting Services',
      },
    ],
  },
  { component: 'tired_of_waiting' },
  { component: 'strategic_support' },
  { component: 'it_services_section' },
  { component: 'testimonials_slider' },
  { component: 'inc_award' },
  { component: 'industries_grid' },
  { component: 'ebook_cta' },
  { component: 'location_cards' },
  { component: 'trust_checklist' },
  { component: 'blog_grid' },
  {
    component: 'faq_section',
    heading: 'Common Questions About Managed IT Services in California',
    items: [],
  },
  { component: 'contact_section' },
];

await api(`/stories/${story.id}`, {
  method: 'PUT',
  body: JSON.stringify({
    story: {
      name: story.name,
      slug: story.slug,
      content: {
        ...story.content,
        component: 'page',
        meta_title: 'Managed IT Services California | AllSafe IT',
        meta_description:
          '7x CRN MSP 500 winner. AllSafe IT delivers managed IT services, cybersecurity & 24/7 support to California businesses.',
        body,
      },
    },
  }),
});

console.log('Home story seeded with', body.length, 'sections. Open Storyblok → Home to edit each block.');
