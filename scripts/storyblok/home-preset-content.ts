/**
 * Default copy for homepage preset blocks — mirrors src/components/sections/*.astro defaults
 * so Storyblok fields are populated and editable after migration.
 */
import { blok } from './blok-utils';

export function homePresetBloks() {
  return {
    award_marquee: blok('award_marquee', {
      title: 'Award winning MSP in CA',
    }),

    tired_of_waiting: blok('tired_of_waiting', {
      heading: 'Are you tired of waiting for Local IT Support in California?',
      image_alt: 'Trained tech member offering IT support in California',
      item_1_heading: 'Feeling overwhelmed by the complexity of managing your IT needs?',
      item_1_body:
        'Managing IT can feel like navigating a maze of complexity, especially for California SMBs that are without dedicated IT departments.',
      item_2_heading: 'Are you worried about how secure your business really is?',
      item_2_body:
        'From ransomware to phishing scams, the risks are everywhere. Whether you are in SoCal or the Bay Area, the cost of a breach can be catastrophic.',
      item_3_heading: 'Struggling to align your IT strategy with your business goals?',
      item_3_body:
        "For many growing companies that don't outsource IT support, technology is seen as a necessary expense rather than a strategic asset.",
    }),

    strategic_support: blok('strategic_support', {
      heading: 'Strategic Managed IT Support for California Enterprises',
      subheading:
        'Not Just Support. Strategic Growth.<br />Managed IT services in California have evolved. So have we.',
      lead: "For 20+ years, we've kept IT systems running smoothly across Southern California. But modern business demands more. We've seen companies try to bolt new tools onto broken processes. It fails. That is why every solution we design is backed by 24/7 helpdesk access and remote IT support, giving businesses reliable IT Support California teams can depend on when it matters most.",
      bullet_1_title: 'Cloud that works:',
      bullet_1_body:
        "Tailored Microsoft 365 and Microsoft Azure solutions. No paying for what you don't need. Technology solutions designed for mid sized businesses and growing enterprises.",
      bullet_2_title: 'Security built in:',
      bullet_2_body:
        'Zero trust and layered protection with Dark Web Monitoring, Vulnerability Scanning, and Penetration Testing. Security is how IT should work. Cybersecurity services that protect sensitive data.',
      bullet_3_title: 'AI-powered operations:',
      bullet_3_body:
        'AllSafe Intelligence automates your busywork so your team focuses on high-value tasks. Best IT solutions backed by the EOS (Entrepreneurial Operating System) process delivering clear accountability and consistent results.',
      image_alt: 'Team lead for Managed Services in California office',
    }),

    it_services_section: blok('it_services_section', {
      heading: 'We offer IT Services California businesses need',
      body_html:
        'We understand the critical nature of timely support, which is why our team is committed to providing rapid, efficient managed IT solutions California companies rely on. Imagine having enterprise-level support that is there exactly when you need it, minimizing disruption and keeping your operations moving forward.<br /><br />We also provide the IT outsourcing California businesses deserve. With our IT support services, you gain access to strategic guidance and oversight that ensures your technology decisions are always aligned with where you want your business to go.',
      metric_1_text: 'Round-the-clock remote IT support for all our clients.',
      metric_1_value: '24/7',
      metric_2_text: 'Uptime for all network infrastructure',
      metric_2_value: '99.999%',
      metric_3_text: 'Our Average CSAT',
      metric_3_value: '99.999%',
      image_alt: "CEO of AllSafe IT, California's Managed Services Provider",
    }),

    inc_award: blok('inc_award', {
      heading: 'An Inc. 5000 Company',
      body_html:
        "Being an Inc. 5000 company means we're one of the fastest-growing private companies in the U.S.<br /><br />This award reflects our obsession with customer satisfaction and retention. For you, it's a guarantee of quality. It means you are partnering with a stable, high-performance team that has the scale to handle your technology today, and the momentum to support you five years from now.",
      cta_text: 'Talk to an Expert',
      cta_href: '/contact-us',
      logo_path: '/images/Inc5000__Allsafeit.avif',
      logo_alt: 'Inc 5000 logo',
      image_alt: 'Managed IT professionals of AllSafe IT at our SoCal headquarters',
    }),

    trust_checklist: blok('trust_checklist', {
      heading: 'Proof, Not Promises',
      image_alt: 'IT professional offering expert IT support to businesses in Southern California',
      item_1_label: 'SOC 2 compliant',
      item_1_body:
        "Robust security practices that meet the highest independent standards. We're audited so you can trust our current IT setup protects your data.",
      item_2_label: '97% CSAT',
      item_2_body:
        'Clients rate their experience because it matters. Proactive monitoring and responsive support keep California businesses satisfied year after year.',
      item_3_label: '98% Retention:',
      item_3_body:
        'Clients stay because results matter. Service providers who deliver earn loyalty. This works.',
      item_4_label: '20+ Years:',
      item_4_body:
        'Serving small and mid sized business across SoCal. We know this market, these industries, and their challenges. Managed service provider experience you can verify.',
    }),

    blog_grid: blok('blog_grid', {
      badge: '[Blog]',
      heading: 'Latest from AllSafe IT',
      max_items: '3',
    }),
  };
}
