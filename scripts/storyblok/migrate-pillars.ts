#!/usr/bin/env tsx
import { upsertStory } from './api';
import { servicePillarPages } from './pages/service-pillars';

for (const page of servicePillarPages) {
  await upsertStory(page.slug, page.name, page.content);
}

console.log('Service pillars migrated.');
