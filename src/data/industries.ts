const CDN = 'https://cdn.prod.website-files.com/691bbcb39d346b7748f2fe13/';

export interface Industry {
  heading: string;
  href: string;
  desc: string;
  iconWhite: string;
  iconBlue: string;
}

export const INDUSTRIES: Industry[] = [
  {
    heading: 'Manufacturing',
    href: '/industries/it-services-for-construction-los-angeles',
    desc: 'IoT and network management to keep production lines running without interruption. Your ERP stays online. Your supply chain stays visible. Business operations depend on uptime.',
    iconWhite: CDN + '6951ba46e577713d253fe9c8_helmet-safety-solid-full%20(1).svg',
    iconBlue:  CDN + '6951ba3f8bbb068588f478e3_helmet-safety-solid-full.svg',
  },
  {
    heading: 'Entertainment & Media',
    href: '/industries/it-services-for-media-industry-los-angeles',
    desc: "High-speed Network Infrastructure for massive file transfers and tight production deadlines. Network management built for SoCal studios and production companies. We've seen post-production workflows transform with the right setup.",
    iconWhite: CDN + '6951c58fc69bf3f95ad25c54_photo-film-solid-full%20(1).svg',
    iconBlue:  CDN + '6951c5890a8bd2226cbdf6a2_photo-film-solid-full.svg',
  },
  {
    heading: 'Construction',
    href: '/industries/it-services-for-manufacturing-los-angeles',
    desc: 'Rugged, mobile-first IT services for job sites and field teams. CAD workstations that perform. Hands on support when you need it most.',
    iconWhite: CDN + '6951bac53c9d2dc640f26a2f_gears-solid-full%20(1).svg',
    iconBlue:  CDN + '6951bab3cb53560bd3633d3c_gears-solid-full.svg',
  },
  {
    heading: 'Retail',
    href: '/industries/retail-it-services-los-angeles',
    desc: 'Point of sale systems, inventory management, and customer data protection. Business technology that keeps transactions flowing and customers happy.',
    iconWhite: CDN + '6951bae613cfc9cc8b9c9fbb_cart-shopping-solid-full%20(1).svg',
    iconBlue:  CDN + '6951bae4a4ab46eba0fb3ca1_cart-shopping-solid-full.svg',
  },
  {
    heading: 'Nonprofit',
    href: '/industries/it-services-for-non-profit-los-angeles',
    desc: "Maximizing impact while protecting donor data. Mission-driven organizations get personalized service and predictable costs. We've helped nonprofits optimize their current IT setup.",
    iconWhite: CDN + '6951bb57148690529e641578_hand-holding-heart-solid-full%20(1).svg',
    iconBlue:  CDN + '6951bb51d5c33e35918491bc_hand-holding-heart-solid-full.svg',
  },
  {
    heading: 'Hospitality',
    href: '/industries/hospitality-it-services-los-angeles',
    desc: 'Secure payment processing, reliable booking systems, and smooth operations. Stable IT infrastructure your guest experience depends on.',
    iconWhite: CDN + '6951bb74a100350c6d299492_bed-solid-full%20(1).svg',
    iconBlue:  CDN + '6951bb6e0a8bd2226cbd3ba3_bed-solid-full.svg',
  },
  {
    heading: 'Healthcare',
    href: '/industries/healthcare-it-services-los-angeles',
    desc: "HIPAA-compliant infrastructure ensuring patient data never leaves your secure perimeter. Data backup and Business Continuity planning keep care delivery uninterrupted. We've worked with California clinics scaling from 30 to 150 employees.",
    iconWhite: CDN + '6951bbb056e0064e6a1d5a93_heart-pulse-solid-full%20(1).svg',
    iconBlue:  CDN + '6951bbaa1601bbcde1f06664_heart-pulse-solid-full.svg',
  },
  {
    heading: 'Professional Services',
    href: '/industries/it-services-for-business-management-los-angeles',
    desc: "SOC 2 compliant data protection for firms that can't afford a breach. We're a reputable provider serving accounting, legal, and financial services across Southern California.",
    iconWhite: CDN + '6951bbcb05ec0fef33431858_clipboard-list-solid-full%20(1).svg',
    iconBlue:  CDN + '6951bbc6fdb7821bd149e461_clipboard-list-solid-full.svg',
  },
];
