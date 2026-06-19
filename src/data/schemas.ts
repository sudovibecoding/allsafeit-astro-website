export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why hire a local managed service providers California team instead of a national chain?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "National providers rely on generic call centers with limited local insight. We're part of the California business community, so we understand the region's unique regulations, compliance requirements, and operational challenges. That means you get managed IT services tailored to how businesses actually operate across Southern California, not a one-size-fits-all solution.",
      },
    },
    {
      '@type': 'Question',
      name: 'How to choose the right California managed IT services company?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Look for SOC 2 compliance proving independent audits, not just claims. Check client retention rates over multiple years. Verify they serve small businesses and mid sized businesses equally. Confirm they use a proactive approach catching problems before outages, not reactive break-fix waiting for failures. Ask about business continuity expertise and actual response times. The right IT service providers become extensions of your team.',
      },
    },
    {
      '@type': 'Question',
      name: "What's the cost of managed IT services in California?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Flat-rate monthly pricing typically costs less than hiring one full-time IT manager. You get a complete team of experts with specialized skills in data backup, email security, managed firewall, and more. Pricing depends on your company size, IT infrastructure complexity, and specific requirements. California managed services deliver predictable costs eliminating surprise repair bills.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you support businesses outside Southern California?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We provide robust remote managed IT services California businesses rely on statewide. Our physical techs primarily serve Southern California, but remote support covers you anywhere since 85 to 90 percent of issues resolve remotely. Private cloud and cloud services work seamlessly regardless of location. For the rare onsite needs, we coordinate with local partners or schedule visits.',
      },
    },
    {
      '@type': 'Question',
      name: "What's included in your managed IT services?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'One managed service agreement covers everything. 24 by 7 proactive monitoring, help desk support, security awareness training, backup and disaster recovery, Microsoft services management, and vCIO strategic planning. We handle patch management, email filtering, network security, vendor coordination, and monthly reporting. Complete IT infrastructure coverage. Operations running smoothly is the entire point.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do you help businesses comply with California regulations?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "We document controls for HIPAA, CCPA, PCI DSS, and CMMC compliance. Our SOC 2 certification proves we understand rigorous frameworks because we undergo these audits ourselves annually. We implement required technical controls, create policies regulators expect, maintain business continuity planning, and produce audit-ready evidence. We've guided dozens of California companies through successful audits.",
      },
    },
  ],
};

export const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://www.allsafeit.com#organization',
  name: 'AllSafe IT',
  url: 'https://www.allsafeit.com',
  logo: 'https://cdn.prod.website-files.com/691bbcb19d346b7748f2fd5b/6920aa58e79bb244f5b4fd8c_logo.avif',
  description:
    'AllSafe IT is a premier Managed Service Provider (MSP) delivering enterprise-level Managed IT Services, Cybersecurity, AI Automation, Cloud Migration, and 24/7 IT Support to businesses across California.',
  slogan: 'Technology that supports you, not the other way around.',
  foundingDate: '2005',
  numberOfEmployees: { '@type': 'QuantitativeValue', Value: 100 },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-888-400-2748',
    contactType: 'customer support',
    email: 'info@allsafeit.com',
    areaServed: ['US', 'CA'],
    availableLanguage: 'English',
  },
  sameAs: [
    'https://www.facebook.com/allsafeit',
    'https://x.com/allsafeit',
    'https://www.linkedin.com/company/allsafe-it/',
    'https://www.youtube.com/@AllSafeIT',
    'https://clutch.co/profile/allsafe-it',
  ],
  knowsAbout: [
    'Managed IT Services',
    'AI Consulting',
    'AI Automation Service',
    'Cybersecurity',
    'Cloud Migration',
    'IT Consulting',
    'SOC 2 Compliance',
    'Network Security',
  ],
  award: ['CRN MSP 500', 'BBB Accredited Business', 'Inc. 5000 Company', 'Clutch Top IT Services Company'],
};
