import { ONBOARDING_PHASES } from '../../../src/data/locations-shared';
import {
  losAngelesHub,
  orangeCountyHub,
  pasadenaHub,
  type HubPageContent,
} from '../data/location-hubs-content';
import {
  contactSection,
  faqSection,
  heroService,
  industriesGrid,
  introSplit,
  numberedListSplit,
  onboardingProcess,
  pageStory,
  problemsGrid,
  serviceAreasBlock,
  serviceCardGrid,
  tabsSection,
  whyChooseAccordion,
} from '../page-helpers';

function buildHubPage(config: HubPageContent) {
  const body = [
    heroService(config.hero.heading, config.hero.lead, {
      image: config.hero.image,
      imageAlt: config.hero.imageAlt,
    }),
    introSplit(
      config.intro.heading,
      config.intro.body ?? '',
      config.intro.image,
      config.intro.imageAlt,
      config.intro.bodyHtml,
    ),
    problemsGrid(config.problems.heading, config.problems.intro, config.problems.items),
    numberedListSplit(
      config.lookFor.heading,
      config.lookFor.intro,
      config.lookFor.items,
      config.lookFor.image,
      config.lookFor.imageAlt,
      config.lookFor.outro,
    ),
    serviceCardGrid(config.serviceCards.heading, config.serviceCards.lead),
    tabsSection(
      config.tabsSection.heading,
      config.tabsSection.lead,
      config.tabsSection.tabs,
    ),
    industriesGrid(),
    whyChooseAccordion(
      config.whyChoose.heading,
      config.whyChoose.intro ?? '',
      config.whyChoose.items,
      config.whyChoose.image,
      config.whyChoose.imageAlt,
      true,
      'gradient',
      config.whyChoose.introHtml,
    ),
    onboardingProcess(
      config.onboarding.heading,
      [...ONBOARDING_PHASES],
      config.onboarding.image,
      config.onboarding.imageAlt,
    ),
    serviceAreasBlock(config.serviceAreas.heading, config.serviceAreas.bodyHtml, {
      mapEmbedUrl: config.serviceAreas.mapEmbedUrl,
      addressLine: config.serviceAreas.addressLine,
      pinLabel: config.serviceAreas.pinLabel,
      bg: 'gradient',
    }),
    faqSection(config.faqHeading, config.faqs),
    contactSection(),
  ];

  return {
    slug: config.slug,
    name: config.name,
    content: pageStory(
      {
        meta_title: config.meta.title,
        meta_description: config.meta.description,
        canonical: config.meta.canonical,
        schema_json: JSON.stringify(config.meta.schema, null, 2),
      },
      body,
    ),
  };
}

export const locationHubPages = [
  buildHubPage(losAngelesHub),
  buildHubPage(pasadenaHub),
  buildHubPage(orangeCountyHub),
];
