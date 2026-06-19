import { MAP_EMBEDS, PROBLEM_ICONS } from '../../../src/data/locations-shared';
import { buildCoverageTabs } from './coverage-tabs';

export type HubPageContent = {
  slug: string;
  name: string;
  meta: {
    title: string;
    description: string;
    canonical: string;
    schema: Record<string, unknown>[];
  };
  hero: {
    heading: string;
    lead: string[];
    image: string;
    imageAlt: string;
  };
  intro: {
    heading: string;
    body?: string;
    bodyHtml?: string;
    image: string;
    imageAlt: string;
  };
  problems: {
    heading: string;
    intro: string;
    items: Array<{ title: string; body: string; icon: string }>;
  };
  lookFor: {
    heading: string;
    intro: string;
    outro: string;
    items: Array<{ term: string; body: string }>;
    image: string;
    imageAlt: string;
  };
  serviceCards: {
    heading: string;
    lead: string;
  };
  tabsSection: {
    heading: string;
    lead: string;
    tabs: Array<{ label: string; content: string }>;
  };
  whyChoose: {
    heading: string;
    intro?: string;
    introHtml?: string;
    items: Array<{ label: string; body: string }>;
    image: string;
    imageAlt: string;
  };
  onboarding: {
    heading: string;
    image: string;
    imageAlt: string;
  };
  serviceAreas: {
    heading: string;
    bodyHtml: string;
    mapEmbedUrl: string;
    addressLine: string;
    pinLabel: string;
  };
  faqHeading: string;
  faqs: Array<{ q: string; a: string }>;
};

const losAngelesCoveragePanels = [
  {
    heading: 'Modern Security for Modern Threats',
    intro:
      "Today's cybersecurity challenges require more than traditional defenses. We provide layered protection for Los Angeles organizations.",
    table: [
      {
        label: 'Safe Cloud',
        body: 'Microsoft 365 monitoring catching suspicious logins, business email compromise, AI-powered attacks that bypass standard security models',
      },
      {
        label: 'Safe Endpoint',
        body: 'Endpoint security for every device. Essential for hybrid teams across Hollywood, Downtown LA, and remote locations throughout Los Angeles County',
      },
      {
        label: 'Managed Detection & Response',
        body: 'Real humans watching your network 24/7. When threats emerge, we respond immediately',
      },
    ],
    paragraphs: [
      'Proactive security maintains operations running smoothly. Your sensitive data stays yours. You focus on winning.',
    ],
  },
  {
    heading: 'Technology as a Growth Engine (AllSafe Intelligence)',
    intro: "Right technology multiplies what teams accomplish. That's AllSafe Intelligence.",
    paragraphs: [
      "We've observed LA production companies where editorial teams spend hours managing file transfers instead of cutting footage. Legal firms where attorneys handle document formatting. Manufacturing operations where engineers manage data entry.",
      'We find opportunities. Audit workflows identifying high-impact automation targets. Build tailored solutions. Real AI agents integrating with your existing systems delivering measurable results. Implement seamlessly. We understand your IT environment, meaning smoother deployments and faster value delivery.',
    ],
  },
  {
    heading: 'Co-Managed IT Services in Los Angeles',
    intro: 'Your team. Our support. Complete coverage.',
    paragraphs: [
      "You've built internal IT capability functioning well. Scaling introduces challenges. Coverage gaps emerge. Specialized projects arise. Security demands exceed capacity.",
      'Co managed IT services in Los Angeles means partnership, not replacement. Your internal team retains control while we provide 24/7 monitoring, specialized expertise, project support through standardized processes. This model delivers enterprise capabilities without enterprise overhead.',
    ],
  },
  {
    heading: 'Outsourced IT Support (Help Desk)',
    intro: 'IT support that actually answers. Fast.',
    paragraphs: [
      "Teams shouldn't wait when technology stops functioning. Our helpdesk support responds with real people delivering solutions. Not recordings. Not ticket systems generating delays. Your team shouldn't wait on hold when technology stops working. Our helpdesk support responds with real people who can help. Not a recording, not a ticket system. We handle everything from basic troubleshooting to complex issues with rapid response for critical problems.",
      'We handle everything from basic troubleshooting to complex issues requiring rapid response. Fully managed IT support executed properly means proactive approach catches problems before teams notice them and helps improve uptime while operational efficiency increases.',
    ],
  },
];

const pasadenaCoveragePanels = [
  {
    heading: 'Modern Security for Modern Threats',
    intro:
      "Today's cybersecurity challenges require more than traditional IT models. We provide layered advanced cybersecurity for Pasadena organizations.",
    table: [
      {
        label: 'Safe Cloud',
        body: 'Microsoft 365 monitoring that catches suspicious logins, business email compromise, and AI-powered attacks',
      },
      {
        label: 'Safe Endpoint',
        body: 'Protection for every device. Essential for hybrid teams across Pasadena, East Pasadena, and remote locations',
      },
      {
        label: 'Managed Detection & Response',
        body: 'Real humans watching your network 24/7. When cyber threats emerge, we respond immediately',
      },
    ],
    paragraphs: [
      'Proactive support keeps operations smooth. Your critical data stays yours. You focus on winning.',
    ],
  },
  {
    heading: 'Technology as a Growth Engine (AllSafe Intelligence)',
    intro: "The right technology multiplies what your team accomplishes. That's AllSafe Intelligence.",
    paragraphs: [
      "We've seen Pasadena engineering firms where teams spend hours managing files instead of designing. Find opportunities. We audit workflows to identify high-impact automation targets. Build tailored solutions. Real AI agents that integrate with your software and deliver results. Implement seamlessly. We understand your IT infrastructure, which means smoother deployments and faster value. Our dedicated support team handles complexity.",
      'This is how technology becomes a force multiplier.',
    ],
  },
  {
    heading: 'Co-Managed IT Services Pasadena',
    intro: 'Your team. Our support. Complete coverage.',
    paragraphs: [
      "You've built internal IT capability that works. But scaling brings challenges. Coverage gaps, specialized projects, security demands that exceed capacity. Co-managed IT services Pasadena firms use mean partnership, not replacement. Your team maintains control while we provide 24/7 network monitoring, specialized expertise, and project support Pasadena businesses trust.",
      'This is how growing companies get enterprise-level IT without losing internal expertise.',
    ],
  },
  {
    heading: 'Outsourced IT Support (Help Desk)',
    intro: 'IT support that actually answers. Fast.',
    paragraphs: [
      "Your team shouldn't wait on hold when technology stops working. Our help desk responds with real people who can help. Not a recording, not a ticket system. We handle everything from basic troubleshooting to complex technical issues with rapid response for critical problems.",
      'Fully managed IT support done right. Proactive monitoring catches problems before your team feels them and helps prevent downtime. Technology supports your mission.',
    ],
  },
];

const orangeCountyCoveragePanels = [
  {
    heading: 'Modern Security for Modern Threats',
    intro:
      'Cybersecurity services Orange County businesses need today require layered defense matching actual attack patterns.',
    table: [
      {
        label: 'Safe Cloud',
        body: 'Microsoft 365 protection catching credential theft, business email compromise, AI-driven attacks standard security models miss completely',
      },
      {
        label: 'Safe Endpoint',
        body: 'Device-level security covering every laptop and mobile. Critical for hybrid teams spread across multiple Orange County locations',
      },
      {
        label: 'Managed Detection & Response',
        body: 'Security analysts monitoring networks constantly. Threats get neutralized immediately, not discovered weeks later during forensics',
      },
    ],
    paragraphs: [
      'Proactive security keeps business running smoothly. Your data stays locked down. You focus on winning contracts and serving clients.',
    ],
  },
  {
    heading: 'Technology as a Growth Engine (AllSafe Intelligence)',
    intro:
      'Running smoothly matters. Staying protected matters more. But technology should multiply what your people accomplish.',
    paragraphs: [
      'OC engineering firms waste hours managing file transfers instead of designing products. Onboarding new hires takes days when it should take hours. Data entry pulls talented staff away from high-value work only they can do.',
      'We find these bottlenecks. Build customized solutions integrating with existing systems. Implement without disrupting workflows because we already know your IT environment completely. This turns technology into a force multiplier instead of just overhead.',
    ],
  },
  {
    heading: 'Co-Managed IT Services Orange County',
    intro: 'Your team. Our support. Complete coverage.',
    paragraphs: [
      'Internal IT capability works well until scaling introduces problems. Coverage gaps during growth spurts. Projects requiring specialized expertise your staff lacks. Security demands exceeding current capacity and budget.',
      'Co-managed IT means partnership. Your people maintain control and institutional knowledge. We provide monitoring around the clock, specialized security skills, enterprise tools without enterprise overhead costs.',
    ],
  },
  {
    heading: 'Remote IT Support',
    intro: 'IT support that answers immediately. Every time.',
    paragraphs: [
      'Nobody should wait on hold when systems fail. Our remote managed IT services Orange County teams trust picks up in seconds. Real people. Real solutions.',
      'This is IT outsourcing Orange County done correctly. Proactive monitoring identifies potential issues before staff notices problems. Help desk resolves trouble on first contact. Strategic planning keeps infrastructure aligned with business goals and growth trajectories.',
    ],
  },
];

export const losAngelesHub: HubPageContent = {
  slug: 'managed-it-services-los-angeles',
  name: 'Los Angeles',
  meta: {
    title: 'Managed IT Services Los Angeles | AllSafe IT',
    description:
      'Expert managed IT services in Los Angeles. 7x CRN MSP 500 winner, 24/7 cybersecurity, cloud and proactive support. SOC 2 certified. Free IT assessment.',
    canonical: 'https://www.allsafeit.com/locations/managed-it-services-los-angeles',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.allsafeit.com' },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Managed IT Services Los Angeles',
            item: 'https://www.allsafeit.com/locations/managed-it-services-los-angeles',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'AllSafe IT — Los Angeles',
        url: 'https://www.allsafeit.com/locations/managed-it-services-los-angeles',
        telephone: '+1-888-400-2748',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '1800 Vine St',
          addressLocality: 'Los Angeles',
          addressRegion: 'CA',
          postalCode: '90028',
          addressCountry: 'US',
        },
      },
    ],
  },
  hero: {
    heading: 'Managed IT Services Los Angeles',
    lead: [
      "You're tired of talking about tech support. We hear that. It's time for tech to support you.",
      'AllSafe IT operates from 1800 North Vine Street in Hollywood. We deliver SOC 2-compliant managed IT services Los Angeles companies depend on, enterprise-grade cyber security, and AllSafe Intelligence. Complete technology coverage from a single trusted partner.',
    ],
    image: '/images/losangeles.webp',
    imageAlt: 'AllSafe IT Los Angeles Hollywood office — managed IT services',
  },
  intro: {
    heading: 'Top-Rated Managed Services Provider in Los Angeles',
    body: 'AllSafe IT has powered Los Angeles businesses for over two decades from our Hollywood headquarters. We manage IT infrastructure, eliminate cyber threats, and build AI solutions turning technology into competitive advantage. SOC2 certified, meaning independent auditors verify our security practices annually. This certification separates us in the Los Angeles market. Your technology should drive your mission forward. We make certain it does.',
    image: '/images/allsafeitdreamteam.jpg',
    imageAlt:
      'our team of it professionals providing managed IT services Los Angeles near Hollywood Vine Street.',
  },
  problems: {
    heading: 'Problems We Solve for Businesses in Los Angeles',
    intro: "We've partnered with Los Angeles businesses across every sector. These challenges we address.",
    items: [
      {
        title: 'System Failures Stopping Production',
        body: "Proactive monitoring and redundant infrastructure catch failures before they trigger outages. Core systems crash, medical facilities lose patient access, billing platforms freeze. LA businesses lose revenue by the minute when monitoring isn't catching early warnings. We prevent downtime before it costs you thousands.",
        icon: PROBLEM_ICONS.wifi,
      },
      {
        title: 'Cyber Threats Targeting Business Data',
        body: "Real managed cybersecurity services Los Angeles organizations need demand 24/7 threat detection and active response, not basic antivirus sitting idle. Phishing campaigns fool careful employees. Ransomware encrypts data within minutes. For Los Angeles businesses under HIPAA or CCPA mandates, we implement audited security controls delivering compliance support and proving data stays protected.",
        icon: PROBLEM_ICONS.shield,
      },
      {
        title: 'Unpredictable IT costs',
        body: "Flat-rate IT managed services Los Angeles companies trust eliminate surprise costs and deliver predictable monthly planning. We've seen Los Angeles County organizations paying for unused licenses and redundant platforms burning budget. We optimize what you have, eliminate waste, align spending with actual business value, and help reduce costs significantly.",
        icon: PROBLEM_ICONS.dollar,
      },
      {
        title: 'Regulatory Compliance Requirements',
        body: 'SOC 2 certification proves we understand rigorous compliance frameworks firsthand. Healthcare organizations need HIPAA. California businesses face CCPA requirements. Retail handles PCI DSS. Defense contractors navigate CMMC. We document controls and provide audit-ready evidence when regulators arrive.',
        icon: PROBLEM_ICONS.doc,
      },
      {
        title: 'Emergency Response Taking Too Long',
        body: 'Hollywood headquarters means onsite support reaches Downtown Los Angeles, Santa Monica, Beverly Hills within minutes. For remote work, we respond quickly with actual technical expertise understanding your IT environment completely. Zero automated systems. Zero delays fighting LA traffic.',
        icon: PROBLEM_ICONS.bolt,
      },
      {
        title: 'Internal IT Team Running Out of Capacity',
        body: 'Co managed IT services los angeles teams value delivers both advantages. Your internal team retains control over strategy while we provide round-the-clock network support, specialized skills, and enterprise security services. Greater Los Angeles organizations have scaled from 50 to 200-plus staff without expanding IT headcount using this model.',
        icon: PROBLEM_ICONS.people,
      },
      {
        title: 'Infrastructure Blocking Business Growth',
        body: 'We assess current configurations, identify capacity bottlenecks, build IT infrastructure scaling efficiently as your business grows. When LA companies expand rapidly, cloud environments fail and security gaps emerge. We execute migrations supporting growth without disrupting smooth operations or forcing zero downtime objectives to slip.',
        icon: PROBLEM_ICONS.growth,
      },
    ],
  },
  lookFor: {
    heading: 'What to look for in a Los Angeles Managed IT Services Provider',
    intro: 'Seven things that matter when choosing Los Angeles managed IT services.',
    outro:
      "The right managed IT services in Los Angeles doesn't just keep operations running smoothly. They invest in your success and align with growth trajectories.",
    items: [
      {
        term: 'Track record and stability.',
        body: 'Client retention reveals truth. Examine how long customers stay, actual service levels achieved, operational stability demonstrated over years.',
      },
      {
        term: 'SOC 2 compliance.',
        body: 'Independent third-party audits validate security controls continuously. This certification represents meaningful differentiation in the Los Angeles area market.',
      },
      {
        term: 'Security operations, not just software.',
        body: 'Cyber threats targeting your organization come from human attackers. Your services provider needs managed detection with active threat hunting, not merely monitoring tools generating alerts.',
      },
      {
        term: 'Growth expertise.',
        body: 'Can they handle expansion plans? Multiple locations, rapid scaling, cloud migrations. They should have guided similar companies through comparable transitions toward business goals.',
      },
      {
        term: 'Local presence.',
        body: "Response time to your Los Angeles office measured in minutes matters. Physical proximity delivers timely support and onsite assistance when remote fixes won't work.",
      },
      {
        term: 'Compliance experience.',
        body: 'If HIPAA, PCI DSS, or CMMC govern your work, your managed service provider needs proven experience navigating those frameworks successfully.',
      },
      {
        term: 'Transparent pricing.',
        body: "Understand costs, what's included, what triggers additional charges before signing agreements. Quality partners explain this upfront.",
      },
    ],
    image: '/images/managedIThollywood.avif',
    imageAlt: 'Top managed IT services provider in Los Angeles County',
  },
  serviceCards: {
    heading: 'Complete Los Angeles Managed IT, Security, and AI Solutions',
    lead: 'Five service pillars, one trusted partner.',
  },
  tabsSection: {
    heading: 'Complete IT Coverage, One Trusted Partner',
    lead: 'Technology performs best as integrated systems. Managed IT keeps you operational. Cybersecurity keeps you protected. AI multiplies what teams achieve daily.',
    tabs: buildCoverageTabs(losAngelesCoveragePanels),
  },
  whyChoose: {
    heading: 'Why choose Us for Managed IT Services in Los Angeles',
    introHtml:
      "<strong>Headquartered in Hollywood.</strong> Local engineers and faster response create stronger partnerships. We're your neighbors at 1800 North Vine Street, Los Angeles, CA 90028.",
    items: [
      {
        label: 'SOC 2 compliant',
        body: 'We prove security standards through independent third-party audits annually. This certification demonstrates commitment to protecting your organization.',
      },
      {
        label: 'Rapid onsite support',
        body: 'Downtown LA, West Hollywood, Santa Monica, Beverly Hills, Culver City. At your location in minutes when you need personalized support addressing specific tasks.',
      },
      {
        label: 'AI consulting built in',
        body: 'AllSafe Intelligence helps you leverage technology for growth, not just operations. Value beyond traditional IT managed service providers los angeles offers.',
      },
      {
        label: 'Recognized by industry leaders',
        body: 'Channel Futures MSP 501 and CRN MSP 500 recognize our excellence. BBB A+ accreditation reflects customer satisfaction standards.',
      },
      {
        label: 'Co-managed options',
        body: 'Have an IT manager? We provide the team and resources they need to focus on strategy while we handle specific tasks requiring specialized expertise.',
      },
    ],
    image: '/images/ITsupportconsultation.avif',
    imageAlt: 'IT professional offering expert IT support los angeles',
  },
  onboarding: {
    heading: 'AllSafe IT Client <br>Onboarding Process',
    image: '/images/DSC_1927DSC_1926.avif',
    imageAlt: 'reliable Co managed IT services in los angeles',
  },
  serviceAreas: {
    heading: 'Serving Los Angeles and Beyond',
    bodyHtml: `<p>Our dedicated teams provide managed IT and IT support services throughout Los Angeles and surrounding business hubs. We deliver rapid onsite response to Downtown Los Angeles (90012, 90013, 90014, 90015), <a href="/hollywood-it-support">Hollywood</a> (90028, 90038), West Hollywood (90069), <a href="/it-services-santa-monica">Santa Monica</a> (90401, 90402, 90403), <a href="/beverly-hills-it-support">Beverly Hills</a> (90210, 90211, 90212), <a href="/it-support-culver-city">Culver City</a> (90230, 90232), <a href="/it-services-burbank">Burbank</a> (91501, 91502, 91504, 91505, 91506), and the <a href="/it-support-san-fernando">San Fernando Valley</a>.<br />We also extend our service coverage to <a href="/locations/managed-it-services-pasadena">Pasadena</a>, <a href="/it-services-glendale">Glendale</a>, <a href="/it-services-torrance">Torrance</a>, <a href="/it-services-long-beach">Long Beach</a>, and throughout Los Angeles County.</p><p>This local coverage delivers fast response when issues cannot wait. LA traffic is real. Being headquartered here matters for timely support.</p><p>With a nearby team that understands the area and your business environment, you get timely support that keeps core systems running and staff productive. Choose a managed service provider in Los Angeles that is close by, responsive, and ready to support you.</p>`,
    mapEmbedUrl: MAP_EMBEDS.losAngeles,
    addressLine: `AllSafe IT serves Los Angeles from our office at <a href="https://www.google.com/maps?cid=799320151804313567" target="_blank" rel="noopener">1800 North Vine Street, Los Angeles</a>, CA 90028, in Hollywood. We're located directly across from the <a href="https://maps.app.goo.gl/rcLcHwkm7n9tM4XR9" target="_blank" rel="noopener">Capitol Records Building</a> and within walking distance of the <a href="https://walkoffame.com/" target="_blank" rel="noopener">Hollywood Walk of Fame</a> and <a href="https://www.broadwayinhollywood.com/venues/detail/pantagestheatre" target="_blank" rel="noopener">Pantages Theatre</a>.`,
    pinLabel: 'Los Angeles, California',
  },
  faqHeading: 'Common Questions About Managed IT Services in Los Angeles',
  faqs: [
    {
      q: 'How much do managed IT services cost in Los Angeles?',
      a: 'Managed IT services in Los Angeles typically use flat-rate monthly pricing based on user count and service level required. You get a full expert team for less than hiring one internal IT manager. Predictable costs simplify budgeting and help reduce costs while maintaining quality. Pricing depends on company size, complexity of IT systems, and specific managed services needed.',
    },
    {
      q: 'What are the benefits of managed IT services for small business owners in Los Angeles?',
      a: 'Small business managed IT services provide continuous monitoring, proactive maintenance, rapid helpdesk response, enterprise-grade security, and strategic planning without hiring full-time staff. Your team gets specialized expertise the moment they need it with predictable monthly costs. Benefits include improved uptime, disaster recovery protection, and zero downtime objectives that keep operations running smoothly.',
    },
    {
      q: 'How does co-managed IT in Los Angeles differ from fully managed IT?',
      a: 'Co managed it services los angeles means we work alongside your existing internal team through standardized processes. We provide backup coverage, specialized expertise, 24/7 network support while your team retains control and handles strategic decisions. Fully managed means we handle your complete IT environment as your dedicated services provider. Both deliver enterprise capabilities without enterprise overhead.',
    },
    {
      q: 'Do you understand the compliance needs of Los Angeles businesses?',
      a: "Yes. We're SOC2 certified, demonstrating we understand rigorous compliance frameworks through independent audits. We work with HIPAA for healthcare, CCPA for California organizations, PCI DSS for retail, and industry-specific mandates. Our security practices undergo independent verification annually to ensure compliance support meets current standards.",
    },
    {
      q: 'How quickly can managed IT services near me in Los Angeles respond?',
      a: "We're headquartered in Hollywood. Onsite response to greater los angeles locations is measured in minutes, not hours. For remote support, we respond immediately day or night. Our local presence helps prevent downtime and minimize downtime before it impacts business operations or affects operational efficiency.",
    },
    {
      q: 'Can you work with our existing internal IT team?',
      a: 'Absolutely. Co-managed IT models let your internal team retain control over strategy and decision-making while we provide 24/7 monitoring, specialized security expertise, and support for specific tasks. This partnership approach gives your team the resources they need without replacing the institutional knowledge they\'ve built.',
    },
  ],
};

export const pasadenaHub: HubPageContent = {
  slug: 'managed-it-services-pasadena',
  name: 'Pasadena',
  meta: {
    title: 'Managed IT Services Pasadena | 24/7 Support | AllSafe IT',
    description:
      'Expert managed IT services in Pasadena. 7x CRN MSP 500 winner. 24/7 cybersecurity and cloud support. SOC 2 certified. Free IT assessment.',
    canonical: 'https://www.allsafeit.com/locations/managed-it-services-pasadena',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.allsafeit.com' },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Managed IT Services Pasadena',
            item: 'https://www.allsafeit.com/locations/managed-it-services-pasadena',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'AllSafe IT — Pasadena',
        url: 'https://www.allsafeit.com/locations/managed-it-services-pasadena',
        telephone: '+1-888-400-2748',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '70 South Lake Ave, Suite 690',
          addressLocality: 'Pasadena',
          addressRegion: 'CA',
          postalCode: '91101',
          addressCountry: 'US',
        },
      },
    ],
  },
  hero: {
    heading: 'Managed IT Services Pasadena',
    lead: [
      "You're tired of talking about tech support. We hear that. It's time for tech to support you.",
      `<a href="/">AllSafe IT</a> is headquartered at 70 South Lake Avenue in Pasadena's Downtown Financial District. We deliver SOC 2-compliant managed IT services in Pasadena, cybersecurity, and AllSafe Intelligence. Everything your business needs from technology under one roof.`,
    ],
    image: '/images/AllSafeITinPasadena.webp',
    imageAlt: 'AllSafe IT Pasadena headquarters — managed IT services',
  },
  intro: {
    heading: 'Top-Rated Managed Services Provider in Pasadena',
    bodyHtml:
      '<a href="/">AllSafe IT</a> has served Pasadena, Los Angeles, and Orange County for over 20 years managing IT infrastructure, protecting against cyber threats, and building AI solutions that amplify what teams can do. Our Pasadena headquarters means response time to Old Town, Playhouse Village, or South Pasadena is measured in minutes, not hours. Your technology should support your mission. We make sure it does.',
    image: '/images/allsafeitdreamteam.jpg',
    imageAlt: 'AllSafe IT technicians providing managed IT services at our Pasadena headquarters',
  },
  problems: {
    heading: 'Problems We Solve for Businesses in Pasadena',
    intro: "We've worked with Pasadena businesses across every sector. These are the problems we solve.",
    items: [
      {
        title: 'Network downtime and system failures',
        body: "We deploy proactive monitoring and redundant systems that catch technical issues before they cause outages. When IT systems go down, production stops, clinics lose patient records, billing fails. We've seen Pasadena companies lose thousands per hour to preventable downtime.",
        icon: PROBLEM_ICONS.wifi,
      },
      {
        title: 'Cybersecurity Threats and Data Breaches',
        body: "Real network security requires 24/7 managed detection and response, not just antivirus. We've seen phishing emails fool employees and ransomware encrypt competitors' critical data in minutes. For Pasadena organizations under HIPAA or CCPA, we provide audited security controls and compliance support that prove data protection.",
        icon: PROBLEM_ICONS.shield,
      },
      {
        title: 'Unpredictable IT costs',
        body: "Flat-rate managed services eliminate surprise bills and give predictable monthly budgets. We've worked with Pasadena CA companies paying for unused Microsoft 365 licenses and overlapping tools. We optimize what you have, cut what you don't need, align spending with business value. More cost effective without sacrificing quality.",
        icon: PROBLEM_ICONS.dollar,
      },
      {
        title: 'Compliance and industry regulations',
        body: "We're SOC2 certified ourselves. Whether you need HIPAA for healthcare, CCPA for California businesses, PCI DSS for retail, or CMMC, we document controls and provide audit-ready evidence.",
        icon: PROBLEM_ICONS.doc,
      },
      {
        title: 'Slow emergency response',
        body: 'Our Pasadena headquarters means onsite response to Old Town, South Lake, or Altadena in minutes. For <a href="/it-support-pasadena">managed IT support pasadena</a> companies trust, we respond with rapid response times and real people who know your environment. No phone trees, no waiting.',
        icon: PROBLEM_ICONS.bolt,
      },
      {
        title: 'In-house IT team limitations',
        body: "Co-managed IT gives you both. Your internal team maintains control while we provide 24/7 coverage, specialized expertise, and enterprise security. We've helped Pasadena companies scale from 50 to 200+ employees without adding IT headcount.",
        icon: PROBLEM_ICONS.people,
      },
      {
        title: 'Growth outpacing infrastructure',
        body: "We assess your setup, identify bottlenecks, and build IT infrastructure that scales with headcount. When Pasadena businesses double quickly, we've seen cloud solutions fail and security gaps emerge. We plan migrations that support business growth without disrupting business operations.",
        icon: PROBLEM_ICONS.growth,
      },
    ],
  },
  lookFor: {
    heading: 'What to Look for in a Pasadena Managed IT Services Provider',
    intro: 'Seven things that matter when choosing managed IT services in Pasadena.',
    outro:
      "The right services provider in Pasadena doesn't just keep systems running. They align with your growth and invest in your success.",
    items: [
      {
        term: 'Track record and stability.',
        body: 'Past performance matters more than promises. Look for client retention, measurable service levels, and stability over time.',
      },
      {
        term: 'SOC 2 compliance.',
        body: 'Independent third-party audits of security controls over time. This certification is a meaningful differentiator in the Pasadena market.',
      },
      {
        term: 'Security operations, not just software.',
        body: 'The cyber threats targeting your business are human-targeted. Your partner needs managed detection and response with active threat detection, not just tools.',
      },
      {
        term: 'Growth expertise.',
        body: "Can they handle what you're building? Multiple locations, rapid scaling, cloud migrations. They should have guided similar companies and helped them achieve business goals.",
      },
      {
        term: 'Local presence.',
        body: 'Response time to your Pasadena office should be measured in minutes, not hours. Physical proximity matters for onsite work and same-day support.',
      },
      {
        term: 'Compliance experience.',
        body: 'If your industry has HIPAA, PCI DSS, or CMMC requirements, your managed service provider in Pasadena needs proven experience documenting controls.',
      },
      {
        term: 'Transparent pricing.',
        body: "Understand what you're paying for, what's included, what costs extra before you sign. Surprises erode trust.",
      },
    ],
    image: '/images/managedIThollywood.avif',
    imageAlt: 'AllSafe IT — managed IT services provider Pasadena',
  },
  serviceCards: {
    heading: 'Complete Pasadena Managed IT, Security, and AI Under One Roof',
    lead: 'Five service pillars, one trusted partner.',
  },
  tabsSection: {
    heading: 'Complete IT Coverage, One Trusted Partner',
    lead: 'Technology should work as one system. Managed IT keeps your business running smoothly. Cybersecurity keeps you protected. AI multiplies what your team accomplishes.',
    tabs: buildCoverageTabs(pasadenaCoveragePanels),
  },
  whyChoose: {
    heading: 'Why choose Us for Managed IT Services in Pasadena',
    intro:
      "Headquartered in the Downtown Financial District. Local expertise means faster response and stronger partnerships. We're your neighbors at 70 South Lake Avenue, Pasadena CA 91101.",
    items: [
      {
        label: 'SOC2 compliant.',
        body: 'We prove security standards through independent third-party audits. This certification demonstrates our commitment to data protection and data security.',
      },
      {
        label: 'Rapid onsite support',
        body: 'South Pasadena, San Marino, Altadena, East Pasadena. At your door in minutes when you need us with rapid response times.',
      },
      {
        label: 'AI consulting built in',
        body: 'AllSafe Intelligence helps you use technology to grow, not just operate. Value beyond traditional IT services that enhance productivity.',
      },
      {
        label: 'Recognized by industry leaders',
        body: 'Channel Futures MSP 501 and CRN MSP 500 recognize our excellence. BBB A+ accreditation reflects our commitment to Pasadena businesses.',
      },
      {
        label: 'Co-managed options',
        body: 'Have an IT manager? We provide the dedicated team and resources they need to focus on strategic IT planning.',
      },
    ],
    image: '/images/ITsupportconsultation.avif',
    imageAlt: 'IT support person providing managed IT support in Pasadena',
  },
  onboarding: {
    heading: 'AllSafe IT Client <br>Onboarding Process',
    image: '/images/DSC_1927DSC_1926.avif',
    imageAlt: 'Co managed IT for Pasadena businesses',
  },
  serviceAreas: {
    heading: 'Serving Pasadena and Beyond',
    bodyHtml: `<p>Our dedicated teams provide managed IT services throughout Pasadena and surrounding business hubs. We provide dedicated support to businesses in Old Town Pasadena (91103), South Pasadena (91030), San Marino (91108), Altadena (91001), and Sierra Madre (91024).<br />Our mobile teams also provide rapid response to neighboring business hubs, including <a href="/it-services-burbank">Burbank</a> and <a href="/locations/managed-it-services-los-angeles">Los Angeles</a>, ensuring complete coverage across the San Gabriel Valley and Metro LA area. This coverage delivers fast response when issues cannot wait.</p><p>With a nearby dedicated team that understands the area and your business environment, you get timely support that keeps systems running and staff productive. Choose an MSP in Pasadena that is close by, responsive, and ready to support you when it matters most.</p>`,
    mapEmbedUrl: MAP_EMBEDS.pasadena,
    addressLine: `AllSafe IT serves Pasadena from our headquarters at <a href="https://www.google.com/maps?cid=16677091962897709847" target="_blank" rel="noopener">70 South Lake Avenue, Suite 690, Pasadena, CA 91101</a>. We're located in the Downtown Financial District, steps from <a href="https://www.cityofpasadena.net/" target="_blank" rel="noopener">Pasadena City Hall</a> and minutes from the <a href="https://playhousevillage.org/" target="_blank" rel="noopener">Playhouse Village</a> district.`,
    pinLabel: 'Pasadena, California',
  },
  faqHeading: 'Common Questions About Managed IT Services in Pasadena',
  faqs: [
    {
      q: 'How much do managed IT services cost in Pasadena?',
      a: 'Flat-rate monthly pricing based on user count and service level. You get a full team of experts for less than hiring one internal IT manager. Predictable costs make budgeting simple and help reduce IT related expenses.',
    },
    {
      q: 'What are the benefits of managed IT services for small businesses in Pasadena?',
      a: '24/7 system monitoring, proactive maintenance, rapid help desk support, enterprise-grade security, strategic IT planning. All without hiring full-time staff. Your small businesses gain access to specialized expertise with predictable monthly costs and enhanced operational efficiency.',
    },
    {
      q: 'Do you provide onsite support in Pasadena?',
      a: "Yes. We're headquartered at 70 South Lake Avenue in Pasadena's Downtown Financial District. Onsite response to Old Town, South Lake, or managed IT services South Pasadena areas measured in minutes. For remote managed IT services in Pasadena, we respond immediately with real people.",
    },
    {
      q: 'How does co-managed IT in Pasadena differ from fully managed IT?',
      a: 'Co-managed IT services Pasadena means we work alongside your existing IT staff. We provide backup, specialized expertise, 24/7 coverage. Fully comprehensive managed means we handle your complete environment. Both give you enterprise capabilities and enhance efficiency.',
    },
    {
      q: 'Do you understand the compliance needs of Pasadena businesses?',
      a: "Yes. We're SOC2 certified, which means we understand rigorous compliance frameworks. We work with HIPAA for healthcare, CCPA for California businesses, industry-specific mandates. Our security practices are independently audited providing compliance support.",
    },
    {
      q: 'How quickly can managed IT services respond in Pasadena?',
      a: "We're headquartered in Downtown Pasadena. Onsite response to Pasadena CA locations measured in minutes with rapid response times. For remote technical support, we respond immediately. Day or night. Our presence helps prevent downtime before it impacts business operations.",
    },
  ],
};

export const orangeCountyHub: HubPageContent = {
  slug: 'managed-it-services-orange-county',
  name: 'Orange County',
  meta: {
    title: 'Managed IT Services Orange County | AllSafe IT',
    description:
      'Expert managed IT services in Orange County. 7x CRN MSP 500 winner, 24/7 cybersecurity and cloud support. SOC 2 certified. Free IT assessment.',
    canonical: 'https://www.allsafeit.com/locations/managed-it-services-orange-county',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.allsafeit.com' },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Managed IT Services Orange County',
            item: 'https://www.allsafeit.com/locations/managed-it-services-orange-county',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'AllSafe IT — Orange County',
        url: 'https://www.allsafeit.com/locations/managed-it-services-orange-county',
        telephone: '+1-888-400-2748',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '4695 MacArthur Ct, 11th Floor',
          addressLocality: 'Newport Beach',
          addressRegion: 'CA',
          postalCode: '92660',
          addressCountry: 'US',
        },
      },
    ],
  },
  hero: {
    heading: 'Managed IT Services Orange County',
    lead: [
      "You're tired of talking about tech support. We hear that. It's time for tech to support you.",
      'AllSafe IT operates from Newport Beach, bringing the SOC 2-compliant managed IT services Orange County companies rely on. Complete cybersecurity. AllSafe Intelligence. Your entire tech stack managed by one trusted partner.',
    ],
    image: '/images/Orange_county.avif',
    imageAlt: 'AllSafe IT Orange County Newport Beach office — managed IT services',
  },
  intro: {
    heading: 'Top-Rated Managed Services Provider in Orange County',
    body: 'For two decades, AllSafe IT has kept Orange County businesses running strong. We handle IT infrastructure management, neutralize cyber threats, and deploy AI solutions that turn technology into your competitive advantage. Based in Newport Beach, we reach Irvine, Costa Mesa, and Tustin faster than you can sit through OC traffic. Technology exists to serve your mission. We guarantee it does.',
    image: '/images/allsafeitdreamteam.jpg',
    imageAlt:
      'AllSafe IT technicians providing managed IT services in Orange County near Newport Beach.',
  },
  problems: {
    heading: 'Problems We Solve for Businesses in Orange County',
    intro: "Orange County companies face predictable challenges. Here's what we fix.",
    items: [
      {
        title: 'System Crashes That Halt Revenue',
        body: "Proactive monitoring stops failures before they kill productivity. Medical practices lose access to patient records. Manufacturers watch production lines go dark. Billing freezes mid-cycle. We've watched local businesses burn thousands hourly because basic monitoring wasn't catching warning signs early enough.",
        icon: PROBLEM_ICONS.wifi,
      },
      {
        title: 'Ransomware and Phishing Attacks',
        body: "Managed cybersecurity services demand active threat hunting, not passive software sitting idle. Phishing schemes trick your most cautious staff. Ransomware locks critical files before anyone realizes what happened. Orange County businesses managing sensitive data under HIPAA or CCPA can't afford gaps. We deploy audited controls proving your security posture meets compliance standards.",
        icon: PROBLEM_ICONS.shield,
      },
      {
        title: 'IT Budgets Spiraling Out of Control',
        body: 'Managed IT services in Orange County deliver flat monthly rates eliminating billing surprises. Companies waste budget on duplicate platforms and licenses nobody uses. We audit what you\'re paying for, cut the waste, optimize existing tools, and align every dollar with measurable business value.',
        icon: PROBLEM_ICONS.dollar,
      },
      {
        title: 'Growth outpacing infrastructure',
        body: 'Current configurations reveal bottlenecks blocking expansion. Companies doubling headcount fast hit walls when cloud strategies collapse and security gaps appear. We assess capacity limits, plan migrations supporting growth trajectories, and execute without disrupting daily business operations.',
        icon: PROBLEM_ICONS.growth,
      },
      {
        title: 'Meeting Regulatory Standards',
        body: "SOC 2 certification means we've survived rigorous external audits ourselves. Healthcare needs HIPAA. Retail requires PCI DSS. Defense contractors must meet CMMC frameworks. We document every control and hand you audit-ready evidence whenever regulators come calling.",
        icon: PROBLEM_ICONS.doc,
      },
      {
        title: 'Waiting Hours for Emergency Help',
        body: 'Newport Beach headquarters puts our team minutes from your office when systems fail. Remote <a href="/it-support-orange-county">IT support</a> connects you instantly to real technicians who already know your environment inside out. No automated menus. No callbacks. No burning time while we navigate the 405.',
        icon: PROBLEM_ICONS.bolt,
      },
      {
        title: 'Maxed-Out Internal IT Teams',
        body: 'Co managed IT services Orange County staff appreciate work alongside your existing people. Your team keeps strategic control. We add 24/7 coverage, specialized skills, and enterprise-grade security capabilities. Local companies have scaled from 50 seats to 200-plus without hiring additional full-time IT headcount this way.',
        icon: PROBLEM_ICONS.people,
      },
    ],
  },
  lookFor: {
    heading: 'What to Look for in an Orange County Managed IT Services Provider',
    intro: 'Seven factors separate real IT partners from vendors just chasing contracts.',
    outro:
      'The right managed IT services company Orange County businesses choose becomes part of your success plan. Not just keeping systems alive.',
    items: [
      {
        term: 'Performance history over marketing promises.',
        body: "Client retention tells the truth. Examine how long customers stay, what service levels they're actually hitting, whether the company has survived market shifts.",
      },
      {
        term: 'Independent security audits.',
        body: 'SOC 2 compliance proves third-party auditors verified controls over time. Most managed service providers in Orange County skip this certification. That difference matters.',
      },
      {
        term: 'Active threat response teams.',
        body: 'Human attackers engineer the cyber threats hitting your network. Your partner needs analysts actively hunting threats, not just monitoring tools generating alerts nobody reviews.',
      },
      {
        term: 'Proven scaling experience.',
        body: "Ask whether they've guided companies through rapid expansion, multi-location growth, complex cloud migrations. Theoretical expertise doesn't count. You need a services provider who's actually done this.",
      },
      {
        term: 'Physical proximity for emergencies.',
        body: 'Orange County offices mean real response speed. Remote support handles 90% of issues instantly. That remaining 10% requiring hands-on work needs someone arriving in minutes, not scheduling next-day visits.',
      },
      {
        term: 'Industry compliance expertise.',
        body: 'If regulations govern your work, your IT management partner must understand those frameworks deeply. Generic security doesn\'t satisfy HIPAA auditors or PCI assessments.',
      },
      {
        term: 'Transparent pricing.',
        body: "Understand exactly what's included, what triggers additional costs, how billing works. Quality managed service partners explain this upfront.",
      },
    ],
    image: '/images/managedIThollywood.avif',
    imageAlt: 'top managed services provider across orange county CA',
  },
  serviceCards: {
    heading: 'Complete Orange County Managed IT, Security, and AI Under One Roof',
    lead: 'Five service pillars, one trusted partner.',
  },
  tabsSection: {
    heading: 'Complete IT Coverage, One Trusted Partner',
    lead: 'Technology performs best as integrated systems. Managed IT keeps operations running. Cybersecurity keeps assets protected. AI multiplies what teams accomplish daily.',
    tabs: buildCoverageTabs(orangeCountyCoveragePanels),
  },
  whyChoose: {
    heading: 'Why Choose Us for Managed IT Services in Orange County',
    introHtml:
      "<strong>Newport Beach headquarters.</strong> Local IT experts mean faster response and stronger partnerships. We're neighbors, not remote vendors.",
    items: [
      {
        label: 'SOC 2 compliant',
        body: 'Independent auditors verify our security practices annually. Most IT services providers skip this level of accountability.',
      },
      {
        label: 'Rapid onsite support',
        body: 'Irvine, Costa Mesa, Tustin, Anaheim. When you need business IT services Orange County companies trust for onsite work, we arrive fast.',
      },
      {
        label: 'AI consulting built in',
        body: 'AllSafe Intelligence helps you leverage technology for competitive advantage, not just operational stability. Value beyond traditional managed IT services.',
      },
      {
        label: '97% client satisfaction',
        body: "We measure this because it matters. Numbers prove we're supporting businesses correctly.",
      },
      {
        label: 'Co-managed options',
        body: 'Already have an IT manager? We provide the team and resources letting them focus on strategy instead of daily tech support fires.',
      },
    ],
    image: '/images/ITsupportconsultation.avif',
    imageAlt: 'it professional at AllSafe IT offering IT support Orange County',
  },
  onboarding: {
    heading: 'AllSafe IT Client <br>Onboarding Process',
    image: '/images/DSC_1927DSC_1926.avif',
    imageAlt: 'reliable Co managed IT services in Orange County',
  },
  serviceAreas: {
    heading: 'Serving Orange County and Beyond',
    bodyHtml: `<p>Our team focuses on Orange County businesses throughout <a href="/it-support-irvine">Irvine</a>, <a href="/managed-it-services-costa-mesa">Costa Mesa</a>, <a href="/managed-it-services-newport">Newport Beach</a>, <a href="/it-support-anaheim">Anaheim</a>, Santa Ana, <a href="/it-support-lake-forest">Lake Forest</a>, Huntington Beach, and surrounding communities. This local coverage delivers fast response when issues can't wait.</p><p>With nearby technicians understanding regional business environment, you get timely support maintaining systems running and staff productive. Choose an MSP in Orange County that's close by, responsive, ready to assist when you need help most.</p><p>Choose a local MSP in Orange County that is close by, responsive, and ready to support you when it matters most.</p>`,
    mapEmbedUrl: MAP_EMBEDS.orangeCounty,
    addressLine: `AllSafe IT serves Orange County from our local office at <a href="https://www.google.com/maps?cid=359422836789346827" target="_blank" rel="noopener">4695 MacArthur Court, Newport Beach, CA 92660</a>, in the heart of Orange County's business corridor, just minutes from <a href="https://www.fashionisland.com/" target="_blank" rel="noopener">Fashion Island</a>, <a href="https://www.ocair.com/" target="_blank" rel="noopener">John Wayne Airport</a>, and Newport Center.`,
    pinLabel: 'Newport Beach, California',
  },
  faqHeading: 'Common Questions About Managed IT Services in Orange County',
  faqs: [
    {
      q: 'What does a managed service provider do?',
      a: 'A services provider handles your complete IT environment. Monitoring, help desk, cybersecurity, cloud solutions, strategic planning. We manage technology so you focus on business growth and serving clients.',
    },
    {
      q: 'How much do managed IT services cost in Orange County?',
      a: 'Flat monthly rates give you predictable budget planning. Full team of IT experts costs less than hiring one internal IT manager. Pricing depends on company size, systems complexity, specific services required.',
    },
    {
      q: 'What are the benefits of managed IT services for small businesses in Orange County?',
      a: 'Enterprise technology and security without enterprise budgets. Access to specialized expertise across Microsoft Services, cloud services, network infrastructure. Proactive approach means fewer disruptions and downtime. Predictable costs replace surprise repair bills.',
    },
    {
      q: "What's the difference between an MSP and break-fix IT support?",
      a: 'Break-fix means paying per incident after failure. Orange County managed IT services means continuous monitoring, catching problems early, preventing disruptions before they impact business operations. You get proactive support and budget predictability.',
    },
    {
      q: 'How do co-managed IT services work?',
      a: "Your in-house IT team keeps control and decision-making authority. We add 24/7 coverage, specialized security expertise, enterprise-grade tools. This partnership model provides support your team needs without replacing institutional knowledge they've built.",
    },
  ],
};
