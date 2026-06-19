#!/usr/bin/env tsx
/**
 * Seed / update all Storyblok stories for marketing + content pages.
 *
 * Usage:
 *   npm run storyblok:migrate
 */
import { SECONDARY_LOCATIONS } from '../../src/data/secondary-locations';
import { upsertStory } from './api';
import { buildHomeBody, homeStoryContent } from './build-home-body';
import { locationStoryContent } from './build-location-body';
import { getAllMarketingPages } from './pages';

console.log('Migrating Home story…');
await upsertStory('home', 'Home', homeStoryContent());

console.log(`\nMigrating ${SECONDARY_LOCATIONS.length} secondary location pages…`);
for (const loc of SECONDARY_LOCATIONS) {
  await upsertStory(loc.slug, loc.cityName, locationStoryContent(loc));
}

const marketingPages = getAllMarketingPages();
console.log(`\nMigrating ${marketingPages.length} company, service, hub, and utility pages…`);
for (const page of marketingPages) {
  await upsertStory(page.slug, page.name, page.content);
}

console.log('\nMigrating Tina content collections → Storyblok…');
await import('./migrate-content.ts');

console.log('\nDone.');
