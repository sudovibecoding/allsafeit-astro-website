import { companyPages } from './company-pages';
import { locationHubPages } from './location-hubs';
import { servicePillarPages } from './service-pillars';
import { functionalPages, utilityPages } from './utility-pages';

export interface MarketingPage {
  slug: string;
  name: string;
  content: Record<string, unknown>;
}

export function getAllMarketingPages(): MarketingPage[] {
  return [
    ...companyPages,
    ...servicePillarPages,
    ...locationHubPages,
    ...utilityPages,
    ...functionalPages,
  ];
}
