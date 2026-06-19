/** Default homepage service cards — seeded into Storyblok so editors edit existing cards, not start empty. */
export const DEFAULT_SERVICE_CARDS = [
  {
    component: 'service_card',
    heading: 'Managed IT Services',
    tagline: 'Reliable IT solutions that work for you.',
    body: 'Round the clock monitoring. Proactive maintenance. A help desk with real people who help. We manage Microsoft 365, optimize cloud, and handle day-to-day IT services California businesses need to keep operations running smoothly.',
    href: '/services/managed-it',
    link_label: 'Explore Managed IT Services',
    icon_image: { filename: '' },
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
] as const;

export const DEFAULT_SERVICE_CARD_GRID = {
  component: 'service_card_grid',
  heading: 'Our Complete Managed IT & Cybersecurity Services',
  lead: 'We simplify technology into clear systems designed to help you win.',
  cards: DEFAULT_SERVICE_CARDS.map((c) => ({ ...c })),
};
