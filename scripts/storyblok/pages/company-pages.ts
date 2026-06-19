import { blok, headingText, richText } from '../blok-utils';
import { PRIVACY_POLICY_HTML, TERMS_OF_SERVICES_HTML } from '../data/legal-content';
import {
  contactFormSection,
  contactInfoSection,
  contactSection,
  customHtml,
  faqSection,
  heroCentered,
  heroService,
  industriesGrid,
  legalPage,
  pageStory,
  problemsGrid,
  sectionIntro,
  splitLeft,
  splitRight,
  tabsSection,
  valueMetrics,
  wideImage,
} from '../page-helpers';

const ABOUT_FAQS = [
  {
    q: 'What does a managed IT service provider (MSP) actually do?',
    a: 'A managed IT service provider supports and manages a company’s technology on an ongoing basis — monitoring systems, resolving issues, maintaining networks, and improving security.',
  },
  {
    q: 'How do you onboard a new client or switch us from our current IT provider without downtime?',
    a: 'We begin with a detailed review of your systems, access, and security. Most onboarding work happens behind the scenes to ensure operations continue smoothly.',
  },
  {
    q: 'How will you keep our business secure from cyber threats?',
    a: 'Our team uses a layered security approach that includes continuous monitoring, system updates, access controls, and proactive risk management.',
  },
  {
    q: 'Do you provide onsite IT support or is everything remote?',
    a: 'We resolve many issues remotely for faster response times, but onsite IT support is available when hands-on assistance is needed.',
  },
];

const WHY_CHOOSE_TABS = [
  {
    label: 'Slow IT Support & Disruptive Downtime',
    content:
      '<span class="color__lightblue">You say:</span> We can’t afford to be down, but our current IT provider takes hours (or days) to respond.<br><br><span class="color__lightblue">We deliver:</span> 24/7/365 managed IT support with a real team — not outsourced call centers.',
  },
  {
    label: 'Cybersecurity threats and fear of data breach',
    content:
      '<span class="color__lightblue">You say:</span> Cyber risks keep me up at night.<br><br><span class="color__lightblue">We deliver:</span> Managed firewalls, email protection, penetration testing, and security awareness training.',
  },
  {
    label: 'Compliance concerns (HIPAA, Finance, Education)',
    content:
      '<span class="color__lightblue">You say:</span> We’re in a regulated industry.<br><br><span class="color__lightblue">We deliver:</span> IT audit and compliance services for HIPAA, PCI, and SOC requirements.',
  },
  {
    label: 'Technology feels overwhelming',
    content:
      '<span class="color__lightblue">You say:</span> Managing everything is just too much.<br><br><span class="color__lightblue">We deliver:</span> Managed IT services that act as your dedicated IT department.',
  },
  {
    label: 'IT isn’t aligned with business goals',
    content:
      '<span class="color__lightblue">You say:</span> Our IT systems feel outdated.<br><br><span class="color__lightblue">We deliver:</span> Virtual CIO services aligning technology with business strategy.',
  },
  {
    label: 'Internal IT teams are overloaded',
    content:
      '<span class="color__lightblue">You say:</span> Our IT person is overwhelmed.<br><br><span class="color__lightblue">We deliver:</span> Co-managed IT services supporting your existing team.',
  },
];

const PRIVACY_BODY = PRIVACY_POLICY_HTML;
const TERMS_BODY = TERMS_OF_SERVICES_HTML;

export const companyPages = [
  {
    slug: 'about-us',
    name: 'About Us',
    content: pageStory(
      {
        meta_title: 'About AllSafe IT | Managed IT Services California',
        meta_description:
          'Learn about AllSafe IT — 20+ years serving California businesses with proactive managed IT services, cybersecurity, and strategic technology consulting.',
        canonical: 'https://www.allsafeit.com/about-us',
      },
      [
        heroCentered('[About us]', 'Giving you the perfect experience through personalized IT support'),
        wideImage('/images/allsafeitdreamteam.jpg', 'AllSafe IT dream team'),
        sectionIntro(
          'We empower businesses with proactive IT support',
          'Staying ahead with robust IT support is not just a necessity; it’s a lifeline for your business. With AllSafe IT, your IT infrastructure becomes a driving force behind your success.',
        ),
        splitRight(
          'Two Decades of Doing the Work',
          'Since 2005 we’ve helped businesses across healthcare, financial services, legal, manufacturing, retail, entertainment, and professional services turn IT from an obstacle into an advantage.',
          '/images/ITsupportworking.avif',
          'AllSafe IT support experts at work',
        ),
        valueMetrics('', [
          { label: '99.9%', body: 'Uptime for all network infrastructure. Our mission is to make downtime obsolete.' },
          { label: '24/7', body: 'Remote IT support via phone and chat whenever your team needs it.' },
          { label: '94.9%', body: 'Customer satisfaction rate for helpdesk support.' },
        ]),
        splitLeft(
          'Transform your business with our cybersecurity-focused IT solutions',
          'We believe in the power of technology to transform businesses. Our approach is centered around understanding your specific needs and crafting strategic IT solutions.',
          '/images/cybersecurity__allsafeit.jpg',
          'AllSafe IT cybersecurity-focused IT solutions',
          'gradient',
        ),
        problemsGrid('These are the standards we hold ourselves to...', '', [
          { title: 'We do what we say we’ll do.', body: 'We cultivate trust by finishing what we start and keeping our word.' },
          { title: 'We care about the process.', body: 'We are NIST aligned and SOC2 compliant with external accountability standards.' },
          { title: 'We are generous with what we know.', body: 'Knowledge is not power here. Sharing it is.' },
          { title: 'We enjoy the people we work with.', body: 'Skill gets you in the door. Character keeps you here.' },
          { title: 'We choose compassionate candor.', body: 'We challenge directly and care personally.' },
        ]),
        sectionIntro(
          'Recognized by the Industry. Accountable to You.',
          'AllSafe IT has been named to CRN’s MSP 500 list seven times, recognized by the Los Angeles Business Journal, UpCity, Clutch, and The Manifest. We’re also BBB Accredited.',
        ),
        faqSection('Frequently Asked Questions', ABOUT_FAQS),
      ],
    ),
  },

  {
    slug: 'contact-us',
    name: 'Contact Us',
    content: pageStory(
      {
        meta_title: 'Contact AllSafe IT | IT Support & Managed Services Provider',
        meta_description:
          'Get in touch with AllSafe IT to discuss Managed IT Services, Cybersecurity, or IT Support for your business.',
        canonical: 'https://www.allsafeit.com/contact-us',
      },
      [
        contactFormSection(
          '[leave a message for us]',
          'Contact AllSafe IT for Reliable Business IT Solutions',
          'Start the Conversation',
        ),
        contactInfoSection('Reach out to our team and we’ll respond ASAP.', '(888) 400-2748', '(213) 784-1959', [
          { city: 'Pasadena', address: '70 South Lake Ave, Suite 690', city_line: 'Pasadena, CA 91101' },
          { city: 'Los Angeles', address: '1800 N. Vine St', city_line: 'Los Angeles, CA 90028' },
          { city: 'Newport Beach', address: '4695 MacArthur Ct, 11th Floor', city_line: 'Newport Beach, CA 92660' },
        ]),
      ],
    ),
  },

  {
    slug: 'why-choose-us',
    name: 'Why Choose Us',
    content: pageStory(
      {
        meta_title: 'Why Choose AllSafe IT | Trusted Outsourced IT in Los Angeles',
        meta_description:
          'Discover why California businesses choose AllSafe IT for managed IT services. SOC 2 certified, 97% CSAT, 98% retention, 20+ years serving Southern California.',
        canonical: 'https://www.allsafeit.com/why-choose-us',
      },
      [
        heroCentered('[Why choose us]', 'Why choose AllSafe IT: Trusted outsourced IT in Los Angeles'),
        splitLeft(
          'AllSafe IT prevents downtime and cyber risks',
          'At AllSafe IT we provide outsourced IT built around one core belief: Diagnose first. Prescribe second. With 99.999% uptime, 24/7/365 support, and a human approach.',
          '/images/cybersecurity__allsafeit.jpg',
          'AllSafe IT cybersecurity-focused IT solutions',
        ),
        splitLeft(
          'Transform your business with our cybersecurity-focused IT solutions',
          'We believe in the power of technology to transform businesses — offering technical expertise and strategic foresight that aligns IT with business goals.',
          '/images/DSC_2042DSC_2041.avif',
          'AllSafe IT experts in a strategy conference',
          'gradient',
        ),
        tabsSection(
          'The problems we solve',
          'Technology should work as one system. Managed IT keeps your business running smoothly. Cybersecurity keeps you protected. AI multiplies what your team accomplishes.',
          WHY_CHOOSE_TABS,
        ),
        sectionIntro(
          'AI enhancement through AllSafe Intelligence',
          'Through AllSafe Intelligence, we help businesses move from spreadsheets to smart automation — building AI solutions that fit your workflow.',
        ),
        industriesGrid('Comprehensive technology services for every sector'),
        splitRight(
          'Managed services for small business',
          'AllSafe IT is known as the best MSP for small business partners who want enterprise-level protection without enterprise-level complexity.',
          '/images/ITconsulting.jpg',
          'AllSafe IT consulting experts for small business',
        ),
        contactSection(
          'Ready to transform your IT?',
          'Talk to our team about managed IT services built for growing businesses in Los Angeles and Orange County.',
        ),
      ],
    ),
  },

  {
    slug: 'testimonials',
    name: 'Testimonials',
    content: pageStory(
      {
        meta_title: 'Hear from Our Clients | AllSafe IT Positive Testimonials',
        meta_description:
          'Discover what clients are saying about AllSafe IT. Read our positive testimonials highlighting our commitment to delivering exceptional IT services.',
        canonical: 'https://www.allsafeit.com/testimonials',
      },
      [
        heroCentered('[Testimonials]', 'Don’t take our word for it. See what our clients say.'),
        blok('reviews_grid', {
          heading: headingText('Reviews from Our Customers'),
          reviews: [
            blok('review_item', {
              author: 'George McKinney',
              quote: richText('AllSafe IT has been an incredible partner for our business. Responsive, knowledgeable, and always proactive.'),
            }),
            blok('review_item', {
              author: 'Nicole George',
              quote: richText('The team at AllSafe IT truly cares about our success. IT issues are resolved quickly and professionally.'),
            }),
            blok('review_item', {
              author: 'Brittney English',
              quote: richText('Switching to AllSafe IT was the best decision we made for our technology infrastructure.'),
            }),
          ],
        }),
        contactSection(),
      ],
    ),
  },

  {
    slug: 'careers',
    name: 'Careers',
    content: pageStory(
      {
        meta_title: 'Join Our Team at AllSafe IT | Careers in IT Services',
        meta_description:
          'Explore exciting career opportunities in the field of IT at AllSafe IT. Join a dynamic team dedicated to innovation and excellence.',
        canonical: 'https://www.allsafeit.com/careers',
      },
      [
        splitRight(
          'Join our team to learn as fast as you can',
          'Everyone who works with us is qualified to think alongside us. We give you enough responsibility to accelerate your learning. Do you love IT as much as us?',
          '/images/image-careers-hero-saas-x-template_1image-careers-hero-saas-x-template.avif',
          'AllSafe IT careers — join our team',
          'gradient',
        ),
        splitLeft(
          'Our mission is to turn managed IT services into a fine art',
          'Are you ready to think alongside us? We are always innovating to make managed IT services even better.',
          '/images/DSC_2042DSC_2041.avif',
          'AllSafe IT team collaboration',
        ),
        sectionIntro(
          'Current job openings',
          'We are always excited to hear from anyone motivated to provide the best possible service. Visit our jobs portal to apply.',
        ),
      ],
    ),
  },

  {
    slug: 'support',
    name: 'Remote Support',
    content: pageStory(
      {
        meta_title: 'Remote Business Support by AllSafe IT',
        meta_description:
          'Remote IT support, AllSafe App, billing portal, and IT helpdesk services with AllSafe IT.',
        canonical: 'https://www.allsafeit.com/support',
      },
      [
        heroCentered('[Remote support]', 'AllSafe IT Remote Support: App, Billing Portal & Resources'),
        customHtml(`<section class="section"><div class="container"><div class="portal-grid">
<a href="https://app.allsafeit.com/" class="portal-card" target="_blank" rel="noopener"><h3 class="h5">AllSafe App</h3><p class="body-text">Remote support portal for existing clients.</p></a>
<a href="https://billing.allsafeit.com/" class="portal-card" target="_blank" rel="noopener"><h3 class="h5">Billing Portal</h3><p class="body-text">View invoices and manage billing.</p></a>
</div></div></section>`),
        contactSection(),
      ],
    ),
  },

  {
    slug: 'areas-we-serve',
    name: 'Areas We Serve',
    content: pageStory(
      {
        meta_title: 'Areas We Serve | Managed IT Services Across Southern California & Arizona',
        meta_description:
          'AllSafe IT provides managed IT services across Southern California and Arizona, including Los Angeles, Orange County, Pasadena, and Phoenix.',
        canonical: 'https://www.allsafeit.com/areas-we-serve',
      },
      [
        heroService(
          'Areas we serve',
          'AllSafe IT delivers managed IT services, cybersecurity, and strategic IT consulting across Southern California and Arizona. With offices in Pasadena, Los Angeles, and Newport Beach, we are close to the businesses we support.',
        ),
        sectionIntro(
          'Southern California',
          'We serve Pasadena, Los Angeles, Glendale, Burbank, Santa Monica, Long Beach, Irvine, Newport Beach, Orange County, and surrounding communities.',
        ),
        sectionIntro(
          'Arizona',
          'We also support businesses in Phoenix, Chandler, Scottsdale, Tempe, Mesa, and Glendale, Arizona.',
        ),
        contactSection(),
      ],
    ),
  },

  {
    slug: 'industries',
    name: 'Industries',
    content: pageStory(
      {
        meta_title: 'IT Services by Industry | Managed IT for California Businesses | AllSafe IT',
        meta_description:
          'AllSafe IT delivers industry-specific managed IT services for healthcare, finance, legal, manufacturing, retail, and professional services.',
        canonical: 'https://www.allsafeit.com/industries',
      },
      [
        heroService(
          'Industries we support.',
          'We help you build an IT environment around your company\'s goals — from strategizing to implementation and ongoing support.',
          { image: '/images/AllsafeIT-team.avif', imageAlt: 'AllSafe IT team serving California industries' },
        ),
        splitLeft(
          'Struggling with slow, unresponsive IT support?',
          'Industry-specific IT requires understanding your regulatory environment, workflows, and growth plans. We deliver tailored managed IT for your sector.',
          '/images/ladyfromourteam.avif',
          'AllSafe IT industry-specific IT support',
          'gradient',
        ),
        industriesGrid(),
        contactSection('Ready to transform your IT? Contact us today!'),
      ],
    ),
  },

  {
    slug: 'privacy-policy',
    name: 'Privacy Policy',
    content: pageStory(
      {
        meta_title: 'AllSafe IT Privacy Policy | Protecting Our Customers',
        meta_description:
          'Understand how we prioritize and protect your privacy at AllSafe IT.',
        canonical: 'https://www.allsafeit.com/privacy-policy',
      },
      [legalPage('Privacy Policy', 'V1.1 — Last edited 10 January 2022', PRIVACY_BODY), contactSection()],
    ),
  },

  {
    slug: 'terms-of-services',
    name: 'Terms of Services',
    content: pageStory(
      {
        meta_title: 'Terms of Services | AllSafe IT',
        meta_description: "Review AllSafe IT's terms of service.",
        canonical: 'https://www.allsafeit.com/terms-of-services',
      },
      [legalPage('Terms of Services', 'V1.0 — Last edited 10 January 2022', TERMS_BODY), contactSection()],
    ),
  },
];
