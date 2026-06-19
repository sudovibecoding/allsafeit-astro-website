/** Site navigation config (formerly Tina `navigation/main.json`). */
export const NAV_CONFIG = {
  items: [
    { type: 'auto-services' as const, label: 'IT Services' },
    { type: 'auto-industries' as const, label: 'Industries' },
    {
      type: 'group' as const,
      label: 'Our Story',
      links: [
        { label: 'About Us', href: '/about-us' },
        { label: 'Why Us', href: '/why-choose-us' },
        { label: 'Testimonials', href: '/testimonials' },
        { label: 'Careers', href: '/careers' },
      ],
    },
    {
      type: 'group' as const,
      label: 'Locations',
      links: [
        { label: 'Pasadena', href: '/locations/managed-it-services-pasadena' },
        { label: 'Los Angeles', href: '/locations/managed-it-services-los-angeles' },
        { label: 'Orange County', href: '/locations/managed-it-services-orange-county' },
      ],
    },
    { type: 'link' as const, label: 'Blog', href: '/blog' },
  ],
  cta: { label: 'Contact Us', href: '/contact-us' },
};

export const SERVICE_COLUMNS = [
  { category: 'managed-it', header: 'Managed IT' },
  { category: 'cybersecurity', header: 'Cybersecurity' },
  { category: 'it-consulting', header: 'IT Consulting' },
  { category: 'it-infrastructure-and-cloud', header: 'Infrastructure & Cloud' },
] as const;
