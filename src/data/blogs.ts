const CDN = 'https://cdn.prod.website-files.com/691bbcb39d346b7748f2fe13/';

export interface BlogPost {
  href: string;
  heading: string;
  desc: string;
  imgSrc: string;
  imgAlt: string;
}

export const BLOGS: BlogPost[] = [
  {
    href: '/blog/types-of-ai-models-transforming-businesses',
    heading: 'Types of AI Models: Cutting-Edge AI Trends Transforming Businesses',
    desc: 'Discover the AI models redefining business automation in 2025 — from multimodal and agentic systems to dynamic pricing and real-time optimization.',
    imgSrc: CDN + '69c02e0e4a5e910a80d143b9_6943ad833a609114af06204e_68e552b445a80e128a5c64fc_Types%252520of%252520AI%252520Models.jpeg',
    imgAlt: 'Types of AI Models: Cutting-Edge AI Trends — AllSafe IT blog',
  },
  {
    href: '/blog/how-to-find-the-right-customer-support-platform',
    heading: 'Elevating Customer Support: Finding the Right Customer Support Platform for Your Business',
    desc: 'Scale your support without breaking the budget. Learn how to select a customer support platform that grows with your business.',
    imgSrc: CDN + '6943ad83462d5f7171130f88_690cf27c86e7517d998c3313_Untitled-6%2520(1).avif',
    imgAlt: 'Customer support platform guide — AllSafe IT blog',
  },
  {
    href: '/blog/it-support-in-orange-county-with-new-alsafeit-newport-office',
    heading: 'AllSafe IT Expands Local IT Support in Orange County with New Newport Beach Office',
    desc: 'AllSafe IT has expanded into Newport Beach, bringing faster, local IT support and cybersecurity services to Orange County businesses.',
    imgSrc: CDN + '6943ad8273a0132fca1753ec_68e847eb8dd91a54d018d8f3_Blog%2520images-6-Orange%2520County%2520Press%2520Release.avif',
    imgAlt: 'AllSafe IT Newport Beach expansion — AllSafe IT blog',
  },
];
