import type { Faq } from '../../components/sections/FaqSection.astro';

export const CYBERSECURITY_FAQS: Faq[] = [
  {
    q: 'How do I choose a managed cybersecurity service provider?',
    a: 'Look for providers with SOC 2 compliance, proven incident response capabilities, and experience in your industry. Ask about their monitoring tools, response times, and whether they employ human analysts or rely solely on automated systems. The right partner proactively hunts for threats rather than just reacting when alarms trigger.',
  },
  {
    q: 'How much does cybersecurity as a service cost?',
    a: 'Cybersecurity services for small businesses typically range from $150–$500 per user per month depending on scope. Security experts generally recommend allocating 10–15% of your total IT budget to cybersecurity. The cost of a breach — downtime, recovery, regulatory fines, reputational damage — far exceeds the cost of prevention.',
  },
  {
    q: 'What types of cybersecurity services do you offer?',
    a: 'We provide a full stack: 24/7 Managed Detection and Response (MDR), Endpoint Detection and Response (EDR), email security with anti-phishing, managed firewall, Security Awareness Training, dark web monitoring, penetration testing, vulnerability scanning, and compliance support for HIPAA, CCPA, PCI DSS, and CMMC.',
  },
  {
    q: 'How can cybersecurity services help my business?',
    a: "Cybersecurity services prevent costly breaches, ensure regulatory compliance, protect your reputation, and let your team work without constant worry. We handle continuous monitoring so you don't have to. Businesses with managed cybersecurity partners recover faster from incidents and face significantly lower breach costs.",
  },
  {
    q: 'What are cybersecurity consulting services?',
    a: 'Cybersecurity consulting goes beyond monitoring — it includes strategic assessment of your security posture, gap analysis against frameworks like NIST and Zero Trust, policy development, compliance roadmapping, and incident response planning. We help you build a security program that grows with your business.',
  },
];
